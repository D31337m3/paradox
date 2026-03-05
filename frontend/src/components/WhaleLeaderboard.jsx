/**
 * WhaleLeaderboard — Top token holders with conviction tiers
 * Gamified ranking: Architect, Apostle, Believer, Speculator, Ghost
 * System addresses shown with descriptions for full transparency
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTokenStats } from "../hooks/useParadox.js";

const PDX_ADDRESS = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";

/* ── Known system / contract addresses with descriptions ─────────────────── */
const SYSTEM_ADDRESSES = {
  "0x0000000000000000000000000000000000000000": {
    label: "Null Address",
    desc:  "The void. Tokens sent here are permanently destroyed.",
    icon:  "⚫",
    color: "text-slate-500",
  },
  "0x000000000000000000000000000000000000dead": {
    label: "Burn Address",
    desc:  "Standard EVM burn sink. Tokens sent here are unrecoverable.",
    icon:  "💀",
    color: "text-red-400",
  },
  "0x473a89eb41d3903f56c054ef0a16fb8594515e53": {
    label: "Epoch Controller v2",
    desc:  "Protocol contract. Holds tokens locked by believers during active epochs. Owned by DAO multisig.",
    icon:  "⚙️",
    color: "text-sky-400",
    link:  "https://polygonscan.com/address/0x473a89EB41D3903f56c054Ef0a16fB8594515e53",
  },
  "0xfed787784c3c3f7101b46f06a847cb5d60fa6166": {
    label: "DAO Treasury Multisig",
    desc:  "2-of-2 hardware Safe. Controls protocol upgrades and epoch parameters. No single key can act alone.",
    icon:  "🏛️",
    color: "text-emerald-400",
    link:  "https://polygonscan.com/address/0xfed787784C3C3f7101B46f06A847CB5D60Fa6166",
  },
  "0x75812e84490a06c5d81b31862c8af0c5f6b436b7": {
    label: "Token Vesting Contract",
    desc:  "Linear vesting schedule for team allocations. Time-locked and non-transferable until cliff.",
    icon:  "⏳",
    color: "text-amber-400",
    link:  "https://polygonscan.com/address/0x75812E84490a06C5D81B31862c8AF0c5F6b436B7",
  },
  "0x8731492605bf43d9fbe35df02560ffe4e0b61589": {
    label: "ParadoxLog Contract",
    desc:  "On-chain event log. Immutable record of all epoch transitions and governance actions.",
    icon:  "📋",
    color: "text-slate-400",
    link:  "https://polygonscan.com/address/0x8731492605bf43D9fBe35dF02560ffE4e0B61589",
  },
  "0x4d35ee91cc47e108f9f21a1551345cce93817b9e": {
    label: "QuickSwap LP Pool",
    desc:  "PDX/WMATIC liquidity pool on QuickSwap. Holds pooled PDX + WMATIC for DEX trading. LP tokens are freely tradeable.",
    icon:  "💧",
    color: "text-cyan-400",
    link:  "https://polygonscan.com/address/0x4d35ee91cc47e108f9f21a1551345cce93817b9e",
  },
  "0x1fb3c47c85f65daaf4a48b27e3d9f9dd8607a88e": {
    label: "Epoch Controller v1 — Active",
    desc:  "Legacy v1 epoch contract. Epoch 0 active until ~April 1 2026. 200M PDX hoarded by participants (reclaimable after epoch ends). ~198M PDX reserve pool. Deployer-owned.",
    icon:  "🕰️",
    color: "text-amber-400",
    link:  "https://polygonscan.com/address/0x1fb3c47c85f65daaF4a48B27E3D9F9dd8607a88e",
  },
  "0x4f70e7790804a47590dcdb4d3a3c4ecd8c529d09": {
    label: "PDX Token Contract",
    desc:  "The token itself. Any balance here would be unowned — ownership was renounced. address(0) is owner.",
    icon:  "🪙",
    color: "text-paradox-lavender",
    link:  "https://polygonscan.com/address/0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09",
  },
};

const SYSTEM_ADDR_SET = new Set(Object.keys(SYSTEM_ADDRESSES));

const RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL ?? "https://polygon-rpc.com";

/* ── Fetch all PDX holders via Alchemy transfers → balances ──────────────── */
async function fetchHolders() {
  // Step 1: collect unique addresses from transfer history
  const xferRes = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0", toBlock: "latest",
        contractAddresses: [PDX_ADDRESS],
        category: ["erc20"],
        withMetadata: false,
        excludeZeroValue: true,
        maxCount: "0x3e8",
        order: "desc",
      }],
    }),
  });
  const xferJson = await xferRes.json();
  const transfers = xferJson?.result?.transfers ?? [];

  const addrSet = new Set();
  for (const t of transfers) {
    if (t.to)   addrSet.add(t.to.toLowerCase());
    if (t.from) addrSet.add(t.from.toLowerCase());
  }
  const addrs = [...addrSet];

  if (addrs.length === 0) return [];

  // Step 2: multicall balanceOf for every address
  const balSig = "0x70a08231"; // balanceOf(address)
  const calls = addrs.map((addr, i) => ({
    jsonrpc: "2.0", id: i + 2,
    method: "eth_call",
    params: [{
      to: PDX_ADDRESS,
      data: balSig + addr.slice(2).padStart(64, "0"),
    }, "latest"],
  }));

  // Batch in chunks of 50
  const CHUNK = 50;
  const results = [];
  for (let i = 0; i < calls.length; i += CHUNK) {
    const chunk = calls.slice(i, i + CHUNK);
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
    const batch = await res.json();
    results.push(...(Array.isArray(batch) ? batch : [batch]));
  }

  // Step 3: map results → holders, filter zero balances, sort desc
  const holders = addrs
    .map((addr, i) => {
      const hex = results.find(r => r.id === i + 2)?.result ?? "0x0";
      const balance = BigInt(hex || "0x0");
      return { TokenHolderAddress: addr, balance };
    })
    .filter(h => h.balance > 0n)
    .sort((a, b) => (a.balance > b.balance ? -1 : 1));

  return holders;
}

function useTopHolders() {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchHolders()
      .then(h => setHolders(h))
      .catch(() => setError("Could not fetch holder data"))
      .finally(() => setLoading(false));
  }, []);

  return { holders, loading, error };
}

/* ── Rank label ─────────────────────────────────────────────────────────── */
function getRankLabel(rank, pct) {
  if (rank <= 3 || pct >= 5)  return { label: "Architect",  color: "text-amber-400",  bg: "bg-amber-500/10  border-amber-500/30",  icon: "👑" };
  if (rank <= 7 || pct >= 2)  return { label: "Apostle",    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", icon: "⚡" };
  if (rank <= 12 || pct >= 1) return { label: "Believer",   color: "text-sky-400",    bg: "bg-sky-500/10    border-sky-500/30",    icon: "🔥" };
  if (rank <= 17)              return { label: "Speculator", color: "text-slate-300",  bg: "bg-white/5       border-white/10",       icon: "👁" };
  return                               { label: "Ghost",      color: "text-slate-500",  bg: "bg-white/3       border-white/5",        icon: "👻" };
}

function shortenAddr(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatBalance(balance) {
  const n = Number(balance) / 1e18;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function WhaleLeaderboard() {
  const { holders, loading, error } = useTopHolders();
  const { totalSupply } = useTokenStats();
  const supplyNum = totalSupply ? Number(totalSupply) / 1e18 : 0;

  return (
    <section className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(236,72,153,0.04)_0%,_transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-8"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">Transparency</span>
          <h2 className="text-3xl font-black text-white mt-1">
            Whale <span className="text-paradox-lavender">Leaderboard</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            The top holders — wallets and protocol contracts alike. Full transparency, no hidden hands.
          </p>
        </motion.div>

        {/* Rank legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: "Architect",  icon: "👑", color: "text-amber-400"  },
            { label: "Apostle",    icon: "⚡", color: "text-violet-400" },
            { label: "Believer",   icon: "🔥", color: "text-sky-400"    },
            { label: "Speculator", icon: "👁", color: "text-slate-300"  },
            { label: "Ghost",      icon: "👻", color: "text-slate-500"  },
            { label: "Protocol",   icon: "⚙️", color: "text-purple-400" },
          ].map(r => (
            <span key={r.label} className={`text-[11px] font-mono ${r.color} glass px-2 py-1 rounded-md`}>
              {r.icon} {r.label}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm font-mono">
              Loading holder data…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}
          {!loading && !error && holders.length === 0 && (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm font-mono">
              No holder data available
            </div>
          )}
          {!loading && !error && holders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Address</th>
                    <th className="text-left py-3 px-4 hidden sm:table-cell">Title</th>
                    <th className="text-right py-3 px-4">Balance</th>
                    <th className="text-right py-3 px-4">% Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((h, i) => {
                    const addrLower = h.TokenHolderAddress.toLowerCase();
                    const sys    = SYSTEM_ADDRESSES[addrLower];
                    const bal    = Number(h.balance) / 1e18;
                    const pct    = supplyNum > 0 ? (bal / supplyNum) * 100 : 0;
                    const rank   = i + 1;
                    const isTop3 = !sys && rank <= 3;
                    const rl     = sys
                      ? { label: sys.label, color: sys.color, icon: sys.icon }
                      : getRankLabel(rank, pct);

                    return (
                      <motion.tr
                        key={h.TokenHolderAddress}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-white/3 hover:bg-white/3 transition-colors
                          ${isTop3 ? "bg-amber-500/3" : ""}
                          ${sys ? "bg-purple-900/10" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-black font-mono text-lg ${isTop3 ? "text-amber-400" : "text-slate-500"}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sys ? (
                            <div>
                              <a
                                href={sys.link ?? `https://polygonscan.com/address/${h.TokenHolderAddress}`}
                                target="_blank" rel="noopener noreferrer"
                                className={`font-mono text-xs font-bold ${sys.color} hover:opacity-80 transition-opacity`}
                              >
                                {shortenAddr(h.TokenHolderAddress)}
                              </a>
                              <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs leading-tight">{sys.desc}</p>
                            </div>
                          ) : (
                            <a
                              href={`https://polygonscan.com/address/${h.TokenHolderAddress}`}
                              target="_blank" rel="noopener noreferrer"
                              className="font-mono text-slate-300 hover:text-white transition-colors text-xs"
                            >
                              {shortenAddr(h.TokenHolderAddress)}
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`text-xs font-mono ${rl.color} flex items-center gap-1`}>
                            {rl.icon} {rl.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-white text-xs">
                          {formatBalance(h.balance)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${isTop3 ? "bg-amber-500" : sys ? "bg-purple-500" : "bg-violet-500"} rounded-full`}
                                style={{ width: `${Math.min(pct * 10, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-mono font-bold ${isTop3 ? "text-amber-400" : "text-slate-300"}`}>
                              {pct.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[10px] font-mono text-slate-600 mt-3 text-center">
          Live data via Polygonscan · System/protocol addresses shown with descriptions · Top 25 addresses including contracts
        </p>

      </div>
    </section>
  );
}
