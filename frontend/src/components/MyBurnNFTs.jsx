import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES as ADDRESSES } from "../contracts/addresses";
import NFT_ABI from "../contracts/BurnReputationNFT.json";

// Contract enum: BRONZE=0, SILVER=1, GOLD=2, DIAMOND=3
const TIER_NAMES  = ["Bronze", "Silver", "Gold", "Diamond"];
const TIER_COLORS = [
  "from-amber-900/40 to-amber-950/30 border-amber-700/40 text-amber-400",
  "from-slate-700/40 to-slate-800/30 border-slate-500/40 text-slate-300",
  "from-yellow-800/40 to-yellow-950/30 border-yellow-600/40 text-yellow-400",
  "from-cyan-800/30 to-cyan-950/30 border-cyan-500/40 text-cyan-300",
];
const TIER_GLOW = ["shadow-amber-900/40","shadow-slate-700/40","shadow-yellow-900/40","shadow-cyan-900/60"];

const NFT_ADDR = ADDRESSES.BurnReputationNFT;

function parseTokenURI(uri) {
  if (!uri) return null;
  try {
    const json = uri.startsWith("data:application/json;base64,")
      ? JSON.parse(atob(uri.slice("data:application/json;base64,".length)))
      : JSON.parse(uri);
    return json;
  } catch { return null; }
}

export default function MyBurnNFTs() {
  const { address, isConnected } = useAccount();
  const [expanded, setExpanded] = useState(null);

  const { data: balance, isError: balanceErr } = useReadContract({
    address: NFT_ADDR, abi: NFT_ABI, functionName: "balanceOf",
    args: [address], query: { enabled: !!address, staleTime: 0, refetchInterval: 15_000 },
  });
  const { data: repScore } = useReadContract({
    address: NFT_ADDR, abi: NFT_ABI, functionName: "reputationOf",
    args: [address], query: { enabled: !!address, staleTime: 0 },
  });
  const { data: nextTokenId, isError: nextTokenIdErr } = useReadContract({
    address: NFT_ADDR, abi: NFT_ABI, functionName: "nextTokenId",
    query: { enabled: !!address, staleTime: 0, refetchInterval: 15_000 },
  });

  // Only scan tokens if the wallet actually holds some
  const hasBal = balance !== undefined && balance > 0n;
  const totalMinted = nextTokenId ? Number(nextTokenId) : 0;
  const ownerCalls = (hasBal && totalMinted > 0)
    ? Array.from({ length: totalMinted }, (_, i) => ({
        address: NFT_ADDR, abi: NFT_ABI, functionName: "ownerOf", args: [BigInt(i)],
      }))
    : [];
  const { data: ownerResults, isError: ownerErr, isPending: ownerPending } = useReadContracts({
    contracts: ownerCalls, query: { enabled: ownerCalls.length > 0, staleTime: 0 },
  });

  const tokenIds = ownerResults
    ? ownerResults
        .map((r, i) => ({ id: BigInt(i), owner: r?.result }))
        .filter(t => t.owner?.toLowerCase() === address?.toLowerCase())
        .map(t => t.id)
    : [];

  const uriCalls = tokenIds.map(id => ({ address: NFT_ADDR, abi: NFT_ABI, functionName: "tokenURI", args: [id] }));
  const recCalls = tokenIds.map(id => ({ address: NFT_ADDR, abi: NFT_ABI, functionName: "burnRecords", args: [id] }));
  const { data: uriResults, isError: uriErr } = useReadContracts({ contracts: uriCalls, query: { enabled: tokenIds.length > 0, staleTime: 0 } });
  const { data: recResults, isError: recErr } = useReadContracts({ contracts: recCalls, query: { enabled: tokenIds.length > 0, staleTime: 0 } });

  if (!isConnected) return null;
  if (balance !== undefined && balance === 0n) return null;

  const hasError = balanceErr || nextTokenIdErr || ownerErr || uriErr || recErr;
  const isLoading = !hasError && (balance === undefined || nextTokenId === undefined);
  // ownerPending is only true when the call is in flight, not stuck forever
  const isLoadingNFTs = !hasError && hasBal && ownerCalls.length > 0 && ownerPending && !ownerResults;

  const nfts = tokenIds.map((id, i) => {
    const meta = parseTokenURI(uriResults?.[i]?.result);
    const rec  = recResults?.[i]?.result;
    // rec is array [amountBurned, epochNumber, tier, reputationScore] from viem tuple decode
    const tierIdx  = rec ? Number(Array.isArray(rec) ? rec[2] : rec.tier) : 0;
    return {
      id: id.toString(),
      image: meta?.image,
      name:  meta?.name ?? `PDX-REP #${id}`,
      tier:  tierIdx,
      amountBurned: rec ? (Array.isArray(rec) ? rec[0] : rec.amountBurned) : 0n,
      epoch: rec ? Number(Array.isArray(rec) ? rec[1] : rec.epochNumber) : 0,
      score: rec ? Number(Array.isArray(rec) ? rec[3] : rec.reputationScore) : 0,
    };
  });

  return (
    <section className="relative py-16 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <span className="text-xs font-mono tracking-widest text-pink-400 uppercase">Your Collection</span>
            <h3 className="text-3xl font-black text-white mt-1">
              My <span className="text-paradox-magenta">Burn NFTs</span>
            </h3>
            {repScore !== undefined && (
              <p className="text-slate-400 text-sm mt-1">
                Total reputation:{" "}
                <span className="text-cyan-300 font-mono font-bold">{Number(repScore).toLocaleString()} pts</span>
              </p>
            )}
          </div>
          <div className="glass rounded-2xl px-5 py-3 text-center">
            <p className="text-xs text-slate-500">NFTs Owned</p>
            <p className="text-3xl font-black text-white font-mono">
              {isLoading ? "…" : (balance ?? 0n).toString()}
            </p>
          </div>
        </motion.div>

        {hasError && (
          <div className="text-center py-12 text-slate-500 text-sm">
            Could not load NFT data. Check your connection and try refreshing.
          </div>
        )}

        {(isLoading || isLoadingNFTs) && !hasError && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {nfts.map((nft, i) => {
              const tc = TIER_COLORS[nft.tier] || TIER_COLORS[1];
              const tg = TIER_GLOW[nft.tier] || "";
              const tierName = TIER_NAMES[nft.tier] || "Bronze";
              const isOpen = expanded === nft.id;
              return (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setExpanded(isOpen ? null : nft.id)}
                  className={`cursor-pointer choice-card bg-gradient-to-br border ${tc} shadow-xl ${tg} transition-all duration-300`}
                >
                  {nft.image ? (
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/30">
                      <img src={nft.image} alt={nft.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square rounded-xl mb-3 bg-black/30 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                  )}

                  <p className="font-mono font-bold text-sm text-white">{nft.name}</p>
                  <p className={`text-xs font-mono font-bold mb-2 ${tc.split(" ").pop()}`}>{tierName} Tier</p>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="glass rounded-lg px-2 py-1.5">
                      <p className="text-[10px] text-slate-500">Burned</p>
                      <p className="text-xs font-mono text-slate-200">
                        {Number(formatEther(nft.amountBurned)).toLocaleString(undefined, { maximumFractionDigits: 0 })} PDX
                      </p>
                    </div>
                    <div className="glass rounded-lg px-2 py-1.5">
                      <p className="text-[10px] text-slate-500">Rep Score</p>
                      <p className="text-xs font-mono text-green-400">{nft.score.toLocaleString()}</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="glass rounded-xl p-3 space-y-1 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Token ID</span>
                            <span className="text-purple-300">#{nft.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Epoch</span>
                            <span className="text-cyan-300">{nft.epoch}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tier</span>
                            <span className={tc.split(" ").pop()}>{tierName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Soulbound</span>
                            <span className="text-pink-400">Non-transferable</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
