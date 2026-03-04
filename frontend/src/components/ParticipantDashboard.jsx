import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { polygon } from "wagmi/chains";
import { CONTRACT_ADDRESSES } from "../contracts/addresses.js";
import TokenABI from "../contracts/ParadoxToken.json";
import EpochABI from "../contracts/EpochController.json";

// Choice enum: 0=NONE, 1=HOARD, 2=BURN, 3=EXIT
const CHOICE = { NONE: 0, HOARD: 1, BURN: 2, EXIT: 3 };

const tokenContract  = { address: CONTRACT_ADDRESSES.ParadoxToken,   abi: TokenABI.abi,  chainId: polygon.id };
const epochContract  = { address: CONTRACT_ADDRESSES.EpochController, abi: EpochABI.abi,  chainId: polygon.id };

function fmt(bigint, decimals = 18, display = 2) {
  if (bigint == null) return "—";
  return Number(formatUnits(bigint, decimals)).toLocaleString(undefined, { maximumFractionDigits: display });
}

function formatCountdown(secs) {
  if (!secs) return "00:00:00";
  const d = Math.floor(Number(secs) / 86400);
  const h = Math.floor((Number(secs) % 86400) / 3600);
  const m = Math.floor((Number(secs) % 3600) / 60);
  const s = Number(secs) % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const CHOICES = [
  {
    id: CHOICE.HOARD,
    label: "HOARD",
    icon: "🔒",
    color: "border-violet-500 bg-violet-500/10 text-violet-300",
    activeColor: "border-violet-400 bg-violet-500/30 ring-2 ring-violet-500",
    desc: "Lock tokens for the epoch. Earn base yield + governance weight. Tokens returned after epoch ends.",
  },
  {
    id: CHOICE.BURN,
    label: "BURN",
    icon: "🔥",
    color: "border-pink-500 bg-pink-500/10 text-pink-300",
    activeColor: "border-pink-400 bg-pink-500/30 ring-2 ring-pink-500",
    desc: "Permanently destroy tokens. Earn multiplied rewards next epoch + non-transferable Reputation NFT.",
  },
  {
    id: CHOICE.EXIT,
    label: "EXIT",
    icon: "🌊",
    color: "border-cyan-500 bg-cyan-500/10 text-cyan-300",
    activeColor: "border-cyan-400 bg-cyan-500/30 ring-2 ring-cyan-500",
    desc: "Stay liquid. No lock, no burn, no penalty. Full freedom preserved.",
  },
];

function StatusBadge({ label, color }) {
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
  );
}

export default function ParticipantDashboard() {
  const { address, isConnected } = useAccount();
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("idle"); // idle | approving | declaring | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  // ── Read data ──────────────────────────────────────────────────
  const { data: epochData, refetch: refetchEpoch } = useReadContract({
    ...epochContract, functionName: "getCurrentEpoch",
    query: { refetchInterval: 15_000 },
  });
  const { data: epochId } = useReadContract({
    ...epochContract, functionName: "currentEpochId",
    query: { refetchInterval: 15_000 },
  });
  const { data: timeLeft, refetch: refetchTime } = useReadContract({
    ...epochContract, functionName: "timeUntilEpochEnd",
    query: { refetchInterval: 5_000 },
  });
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...tokenContract, functionName: "balanceOf", args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: isConnected && !!address, refetchInterval: 15_000 },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...tokenContract, functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", CONTRACT_ADDRESSES.EpochController],
    query: { enabled: isConnected && !!address, refetchInterval: 10_000 },
  });
  const { data: userData, refetch: refetchUser } = useReadContract({
    ...epochContract, functionName: "getUserData",
    args: [address ?? "0x0000000000000000000000000000000000000000", epochId ?? 0n],
    query: { enabled: isConnected && !!address && epochId != null, refetchInterval: 15_000 },
  });
  const { data: estimatedReward } = useReadContract({
    ...epochContract, functionName: "estimateReward",
    args: [address ?? "0x0000000000000000000000000000000000000000", epochId ?? 0n],
    query: { enabled: isConnected && !!address && epochId != null, refetchInterval: 30_000 },
  });

  // ── Write hooks ────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState(null);
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: !!txHash } });

  // Countdown ticker
  useEffect(() => {
    if (timeLeft == null) return;
    setCountdown(Number(timeLeft));
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [timeLeft]);

  // On tx confirmed, refetch
  useEffect(() => {
    if (txConfirmed) {
      setStep("success");
      refetchBalance(); refetchAllowance(); refetchUser(); refetchEpoch();
    }
  }, [txConfirmed]);

  const amountBig = amount ? parseUnits(amount, 18) : 0n;
  const needsApproval = selected !== CHOICE.EXIT && amountBig > 0n && (allowance ?? 0n) < amountBig;
  const alreadyDeclared = userData?.choice != null && userData.choice !== 0;
  const choiceLabel = ["NONE","HOARD","BURN","EXIT"][userData?.choice ?? 0];

  async function handleApprove() {
    try {
      setStep("approving"); setErrorMsg("");
      const hash = await writeContractAsync({
        ...tokenContract, functionName: "approve",
        args: [CONTRACT_ADDRESSES.EpochController, maxUint256],
      });
      setTxHash(hash);
    } catch (e) {
      setErrorMsg(e.shortMessage ?? e.message); setStep("error");
    }
  }

  async function handleDeclare() {
    try {
      setStep("declaring"); setErrorMsg("");
      const args = selected === CHOICE.EXIT
        ? [CHOICE.EXIT, 0n]
        : [selected, amountBig];
      const hash = await writeContractAsync({
        ...epochContract, functionName: "declare", args,
      });
      setTxHash(hash);
    } catch (e) {
      setErrorMsg(e.shortMessage ?? e.message); setStep("error");
    }
  }

  const cci = epochData
    ? epochData.totalLocked + epochData.totalBurned > 0n && epochData.circulatingSupply > 0n
      ? Number((epochData.totalLocked + epochData.totalBurned) * 10000n / epochData.circulatingSupply) / 100
      : 0
    : null;

  return (
    <section id="declare" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-white mb-2">
            Make Your <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Declaration</span>
          </h2>
          <p className="text-slate-400 text-sm">Each epoch, every holder chooses their path. Connect your wallet to participate.</p>
        </motion.div>

        {/* Epoch info bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass border border-white/10 rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
        >
          <div>
            <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Epoch</div>
            <div className="text-lg font-bold text-white">#{epochId != null ? epochId.toString() : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Time Left</div>
            <div className="text-lg font-bold text-purple-300 font-mono">{formatCountdown(countdown)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1 font-mono uppercase">CCI</div>
            <div className="text-lg font-bold text-pink-400">{cci != null ? `${cci.toFixed(1)}%` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Emission</div>
            <div className="text-lg font-bold text-cyan-400">
              {epochData?.emissionRate != null ? fmt(epochData.emissionRate) : "—"} PDX
            </div>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass border border-white/10 rounded-2xl p-6"
        >
          {!isConnected ? (
            /* Not connected */
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🔮</div>
              <p className="text-slate-300 mb-6 text-sm">Connect your wallet to Hoard, Burn, or Exit</p>
              <div className="flex justify-center">
                <w3m-button />
              </div>
            </div>
          ) : alreadyDeclared ? (
            /* Already declared this epoch */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-lg">Your Position — Epoch #{epochId?.toString()}</h3>
                <StatusBadge
                  label={choiceLabel}
                  color={
                    userData.choice === CHOICE.HOARD ? "border-violet-500 text-violet-400" :
                    userData.choice === CHOICE.BURN  ? "border-pink-500 text-pink-400" :
                    "border-cyan-500 text-cyan-400"
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Amount</div>
                  <div className="text-xl font-bold text-white">{fmt(userData.amount)} PDX</div>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1 font-mono uppercase">Est. Reward</div>
                  <div className="text-xl font-bold text-green-400">{fmt(estimatedReward ?? 0n)} PDX</div>
                </div>
              </div>
              {userData.choice === CHOICE.EXIT && (
                <p className="text-slate-400 text-sm text-center">You chose to Exit. Your tokens remain liquid and free.</p>
              )}
              {userData.choice !== CHOICE.EXIT && (
                <p className="text-slate-400 text-sm text-center">
                  Declaration locked in. Rewards and tokens claimable after the epoch finalizes.
                </p>
              )}
            </div>
          ) : (
            /* Choose and declare */
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white text-lg">Choose Your Path</h3>
                <div className="text-xs text-slate-500 font-mono">
                  Balance: <span className="text-purple-300">{fmt(balance ?? 0n)} PDX</span>
                </div>
              </div>

              {/* Choice cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {CHOICES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelected(c.id); setStep("idle"); }}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                      selected === c.id ? c.activeColor : c.color + " hover:opacity-90"
                    }`}
                  >
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="font-bold font-mono text-sm mb-1">{c.label}</div>
                    <div className="text-xs opacity-80 leading-relaxed">{c.desc}</div>
                  </button>
                ))}
              </div>

              {/* Amount input (not for EXIT) */}
              <AnimatePresence>
                {selected != null && selected !== CHOICE.EXIT && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5"
                  >
                    <label className="text-xs text-slate-400 font-mono mb-2 block uppercase">Amount (PDX)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => balance && setAmount(formatUnits(balance, 18))}
                        className="glass border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action button */}
              {selected != null && (
                <div className="flex flex-col gap-3">
                  {step === "success" && (
                    <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3 text-green-400 text-sm text-center">
                      ✅ Declaration confirmed! Your choice is on-chain.
                    </div>
                  )}
                  {step === "error" && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-red-400 text-sm">
                      ❌ {errorMsg}
                    </div>
                  )}

                  {needsApproval && step !== "success" ? (
                    <button
                      onClick={handleApprove}
                      disabled={step === "approving"}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {step === "approving" ? "Approving…" : "Approve PDX"}
                    </button>
                  ) : selected !== null && step !== "success" && (
                    <button
                      onClick={handleDeclare}
                      disabled={
                        step === "declaring" ||
                        (selected !== CHOICE.EXIT && (!amount || Number(amount) <= 0))
                      }
                      className={`btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                        selected === CHOICE.BURN ? "!bg-pink-600 hover:!bg-pink-500" :
                        selected === CHOICE.EXIT ? "!bg-cyan-700 hover:!bg-cyan-600" : ""
                      }`}
                    >
                      {step === "declaring" ? "Confirming…" :
                        selected === CHOICE.HOARD ? "🔒 Declare Hoard" :
                        selected === CHOICE.BURN  ? "🔥 Declare Burn" :
                        "🌊 Declare Exit"}
                    </button>
                  )}

                  {selected === CHOICE.BURN && amount && Number(amount) > 0 && (
                    <p className="text-xs text-pink-400/80 text-center">
                      ⚠️ Burns are permanent and irreversible. {amount} PDX will be destroyed.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Past epoch claims — always shown when connected */}
        {isConnected && epochId != null && (
          <PastEpochClaims address={address} currentEpochId={BigInt(epochId)} />
        )}
      </div>
    </section>
  );
}

function PastEpochClaims({ address, currentEpochId }) {
  const prevId = currentEpochId - 1n;
  const { data: prevUser, refetch } = useReadContract({
    ...epochContract, functionName: "getUserData", args: [address, prevId],
    query: { enabled: !!address && prevId >= 0n },
  });
  const { data: prevEpoch } = useReadContract({
    ...epochContract, functionName: "getEpoch", args: [prevId],
    query: { enabled: prevId >= 0n },
  });
  const { writeContractAsync } = useWriteContract();
  const [claimHash, setClaimHash] = useState(null);
  const [claimStep, setClaimStep] = useState("idle");
  const [claimErr, setClaimErr] = useState("");
  const { isSuccess: claimed } = useWaitForTransactionReceipt({ hash: claimHash, query: { enabled: !!claimHash } });

  useEffect(() => { if (claimed) refetch(); }, [claimed]);

  const noPrevActivity = !prevUser || prevUser.choice === 0;
  const allClaimed = prevUser && prevUser.rewardClaimed && prevUser.tokensClaimed;
  const epochNotFinalized = !prevEpoch?.finalized;

  const isDisabled = noPrevActivity || allClaimed || epochNotFinalized || claimStep === "claiming" || claimed;

  let statusText = "";
  if (noPrevActivity)       statusText = "No activity in previous epoch";
  else if (allClaimed || claimed) statusText = "✅ All rewards claimed";
  else if (epochNotFinalized)    statusText = "Epoch not yet finalized";
  else {
    const choiceName = ["NONE","HOARD","BURN","EXIT"][prevUser.choice];
    if (prevUser.choice === CHOICE.HOARD && !prevUser.tokensClaimed) statusText = `${choiceName} — locked tokens ready to reclaim`;
    else if (prevUser.choice === CHOICE.BURN && !prevUser.rewardClaimed) statusText = `${choiceName} — burn reward ready to claim`;
    else if (prevUser.choice === CHOICE.HOARD && !prevUser.rewardClaimed) statusText = `${choiceName} — yield reward ready to claim`;
    else statusText = "Nothing to claim";
  }

  async function claim() {
    try {
      setClaimStep("claiming"); setClaimErr("");
      let hash;
      if (prevUser.choice === CHOICE.HOARD && !prevUser.tokensClaimed) {
        hash = await writeContractAsync({ ...epochContract, functionName: "reclaimTokens", args: [prevId] });
      } else if (prevUser.choice === CHOICE.BURN && !prevUser.rewardClaimed) {
        hash = await writeContractAsync({ ...epochContract, functionName: "claimBurnReward", args: [prevId] });
      } else if (prevUser.choice === CHOICE.HOARD && !prevUser.rewardClaimed) {
        hash = await writeContractAsync({ ...epochContract, functionName: "claimReward", args: [prevId] });
      }
      if (hash) setClaimHash(hash);
      else setClaimStep("idle");
    } catch (e) {
      setClaimErr(e.shortMessage ?? e.message); setClaimStep("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mt-4 glass rounded-2xl p-5 border ${isDisabled && !claimed ? "border-white/10" : "border-yellow-500/30"}`}
    >
      <h3 className={`font-bold text-sm mb-3 ${isDisabled && !claimed ? "text-slate-400" : "text-yellow-300"}`}>
        🎁 Claim Rewards — Epoch #{prevId.toString()}
      </h3>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-slate-400">{statusText}</div>
        {claimErr && <div className="text-xs text-red-400 w-full">❌ {claimErr}</div>}
        <button
          onClick={claim}
          disabled={isDisabled}
          className="btn-primary text-xs py-2 px-5 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {claimStep === "claiming" ? "Claiming…" : claimed ? "Claimed ✅" : "Claim"}
        </button>
      </div>
    </motion.div>
  );
}
