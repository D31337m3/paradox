import { motion } from "framer-motion";
import { useEpochData, useEpochHistory } from "../hooks/useParadox.js";
import { formatUnits } from "viem";

/* ── Belief breakdown bar: Hoard / Burn / implied Exit ── */
function BeliefBar({ locked, burned, circulating }) {
  const total = circulating > 0 ? circulating : 1;
  const hoardPct = Math.min((locked  / total) * 100, 100);
  const burnPct  = Math.min((burned  / total) * 100, 100);
  const exitPct  = Math.max(100 - hoardPct - burnPct, 0);

  const segments = [
    { label: "HOARD 🔒", pct: hoardPct, color: "bg-violet-500",  text: "text-violet-300" },
    { label: "BURN 🔥",  pct: burnPct,  color: "bg-pink-500",    text: "text-pink-300"   },
    { label: "EXIT 🌊",  pct: exitPct,  color: "bg-slate-600",   text: "text-slate-400"  },
  ];

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-3">
        Current Epoch — Belief Distribution
      </p>
      {/* Stacked bar */}
      <div className="flex h-6 w-full rounded-full overflow-hidden gap-px mb-3">
        {segments.map(s => (
          <motion.div
            key={s.label}
            initial={{ flex: 0 }}
            animate={{ flex: s.pct }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`${s.color} min-w-0`}
            title={`${s.label}: ${s.pct.toFixed(1)}%`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {segments.map(s => (
          <div key={s.label} className="flex flex-col">
            <span className={`text-xs font-mono font-bold ${s.text}`}>{s.pct.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-500 font-mono">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CCI sparkline across epochs ── */
function CCISparkline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-20 text-slate-600 text-xs font-mono">
        Awaiting epoch history data
      </div>
    );
  }

  const W = 300, H = 60, PAD = 8;
  const vals = history.map(h => h.cci);
  const min  = Math.min(...vals, 0);
  const max  = Math.max(...vals, 10000);
  const range = max - min || 1;

  const toX = (i) => PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2);
  const toY = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2);

  const points = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const areaPoints = [
    `${toX(0)},${H}`,
    ...vals.map((v, i) => `${toX(i)},${toY(v)}`),
    `${toX(vals.length - 1)},${H}`,
  ].join(" ");

  // Threshold lines
  const highY = toY(6000);
  const lowY  = toY(4000);

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-3">
        CCI History — By Epoch
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 64 }}>
        {/* High/Low threshold bands */}
        <rect x={0} y={highY} width={W} height={lowY - highY} fill="rgba(139,92,246,0.06)" />
        <line x1={0} y1={highY} x2={W} y2={highY} stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1={0} y1={lowY}  x2={W} y2={lowY}  stroke="#ec4899" strokeWidth="0.5" strokeDasharray="3,3" />
        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#cciGrad)" opacity="0.3" />
        {/* Line */}
        <polyline points={points} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {vals.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill="#a78bfa" />
        ))}
        <defs>
          <linearGradient id="cciGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
        {history.map(h => <span key={h.epochId}>E{h.epochId}</span>)}
      </div>
      <div className="flex gap-4 mt-2">
        <span className="text-[10px] font-mono text-violet-400">— High conviction ≥60%</span>
        <span className="text-[10px] font-mono text-pink-400">— Low conviction &lt;40%</span>
      </div>
    </div>
  );
}

/* ── Burn multiplier trend ── */
function BurnMultiplierTrend({ history, currentMult }) {
  const all = [
    ...history.map(h => ({ label: `E${h.epochId}`, value: h.burnMultiplier })),
    ...(currentMult ? [{ label: "Now", value: currentMult / 10000 }] : []),
  ];

  if (all.length === 0) return null;

  const maxVal = Math.max(...all.map(a => a.value), 1.5);

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-pink-400 mb-3">
        Burn Reward Multiplier Trend
      </p>
      <div className="flex items-end gap-1.5 h-14">
        {all.map((a, i) => {
          const h = Math.max((a.value / maxVal) * 100, 4);
          const isNow = a.label === "Now";
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-[9px] font-mono text-slate-500">{a.value.toFixed(2)}×</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: i * 0.08 }}
                className={`w-full rounded-t ${isNow ? "bg-pink-500" : "bg-pink-900/60"} self-end`}
                style={{ minHeight: 4 }}
                title={`${a.label}: ${a.value.toFixed(2)}×`}
              />
              <span className="text-[9px] font-mono text-slate-600">{a.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-600 font-mono mt-2">
        Higher multiplier = market rewarding burners to restore conviction
      </p>
    </div>
  );
}

/* ── Main component ── */
export default function BeliefMetrics() {
  const { epoch, epochId, liveCCI } = useEpochData();
  const { history } = useEpochHistory();

  const locked      = epoch?.totalLocked      ? Number(formatUnits(epoch.totalLocked, 18))      : 0;
  const burned      = epoch?.totalBurned      ? Number(formatUnits(epoch.totalBurned, 18))      : 0;
  const circulating = epoch?.circulatingSupply ? Number(formatUnits(epoch.circulatingSupply, 18)) : 1e9;
  const currentMult = epoch?.burnMultiplierBps ? Number(epoch.burnMultiplierBps) : null;

  const convictionLabel =
    (liveCCI ?? 0) >= 6000 ? { text: "High Conviction", color: "text-violet-400", emoji: "📈" } :
    (liveCCI ?? 0) >= 4000 ? { text: "Equilibrium",     color: "text-purple-300", emoji: "⚖️" } :
                             { text: "Low Conviction",  color: "text-pink-400",   emoji: "🔥" };

  return (
    <section className="relative px-6 pb-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
              Market Psychology
            </span>
            <div className="flex-1 h-px bg-purple-900/40" />
            <span className={`text-xs font-mono font-bold ${convictionLabel.color}`}>
              {convictionLabel.emoji} {convictionLabel.text}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            Live behavioral data from Epoch {epochId ?? 0} · Polygon Mainnet
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Belief breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <BeliefBar locked={locked} burned={burned} circulating={circulating} />
          </motion.div>

          {/* Burn multiplier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5"
          >
            <BurnMultiplierTrend history={history} currentMult={currentMult} />
          </motion.div>

          {/* CCI sparkline — full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5 md:col-span-2"
          >
            <CCISparkline history={history} />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
