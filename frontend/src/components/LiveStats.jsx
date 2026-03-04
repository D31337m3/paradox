import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTokenStats, useEpochData, useTreasuryBalance } from "../hooks/useParadox.js";
import { formatUnits } from "viem";
import { CONTRACT_ADDRESSES } from "../contracts/addresses.js";

/* ── Animated counter ── */
function Counter({ value, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const target = parseFloat(value);
    if (isNaN(target)) return;
    const duration = 800; // ms
    const steps = 40;
    const step = target / steps;
    let curr = 0;
    const t = setInterval(() => {
      curr = Math.min(curr + step, target);
      setDisplay(curr);
      if (curr >= target) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [value]);
  return <>{display.toLocaleString(undefined, { maximumFractionDigits: decimals })}{suffix}</>;
}

/* ── Countdown — ticks every second locally, resyncs from chain every ~10s ── */
function Countdown({ seconds }) {
  const [secs, setSecs] = useState(seconds ?? 0);
  // Resync when chain data updates
  useEffect(() => { if (seconds != null) setSecs(seconds); }, [seconds]);
  // Local 1-second ticker
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <div className="flex items-center gap-2 font-mono text-2xl font-bold text-white">
      {[["D", d], ["H", h], ["M", m], ["S", s]].map(([lbl, v]) => (
        <span key={lbl} className="flex flex-col items-center">
          <span className="bg-paradox-card rounded-lg px-3 py-1 text-xl tabular-nums">{String(v).padStart(2, "0")}</span>
          <span className="text-[10px] text-slate-500 mt-1 tracking-widest">{lbl}</span>
        </span>
      ))}
    </div>
  );
}

/* ── CCI Gauge ── */
function CCIGauge({ cci }) {
  const pct = cci / 10000; // cci is BPS 0–10000 → 0–1
  const angle = pct * 180;
  const r = 60, cx = 80, cy = 80;
  const toXY = (deg) => {
    const rad = ((deg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(0);
  const end   = toXY(angle);
  const large = angle > 180 ? 1 : 0;
  const color = pct >= 0.6 ? "#8b5cf6" : pct >= 0.4 ? "#a78bfa" : "#ec4899";

  return (
    <svg width="160" height="90" viewBox="0 0 160 90">
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#2d1f4e" strokeWidth="8" strokeLinecap="round" />
      {/* Fill */}
      {angle > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      )}
      {/* Label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Inter">
        {(pct * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter">
        CONVICTION INDEX
      </text>
    </svg>
  );
}

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LiveStats() {
  const { isDeployed, isLoading: tokenLoading, totalSupply, symbol } = useTokenStats();
  const { isLoading: epochLoading, epoch, epochId, timeLeft, liveCCI } = useEpochData();
  const { balance: treasuryBalance } = useTreasuryBalance();

  const loading = tokenLoading || epochLoading;

  const supplyFmt   = totalSupply ? parseFloat(formatUnits(totalSupply, 18)).toLocaleString() : "1,000,000,000";
  const lockedFmt   = epoch?.totalLocked  ? parseFloat(formatUnits(epoch.totalLocked,  18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—";
  const burnedFmt   = epoch?.totalBurned  ? parseFloat(formatUnits(epoch.totalBurned,  18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—";
  const treasuryFmt = treasuryBalance != null
    ? parseFloat(formatUnits(treasuryBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "—";
  const cci = liveCCI ?? (epoch?.cci ? Number(epoch.cci) : 0);

  const stats = [
    { label: "Total Supply",      value: "1,000,000,000", sub: "PDX",         color: "text-purple-300" },
    { label: "Epoch",             value: epochId != null ? `#${epochId}` : "—", sub: "current",        color: "text-violet-300" },
    { label: "Locked This Epoch", value: lockedFmt,        sub: "PDX",         color: "text-purple-400" },
    { label: "Burned This Epoch", value: burnedFmt,        sub: "PDX",         color: "text-pink-400"   },
  ];

  return (
    <section id="stats" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-paradox-deep" />
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">Live On-Chain Data</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 text-white">
            Token <span className="text-paradox-lavender">Intelligence</span>
          </h2>
          {!isDeployed && (
            <p className="mt-3 text-sm text-amber-400 font-mono glass inline-block px-4 py-2 rounded-full mt-4">
              ⚡ Awaiting deployment — showing static preview
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CCI Gauge — large card */}
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="stat-card items-center text-center lg:col-span-1"
          >
            <span className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-2">Collective Conviction Index</span>
            <CCIGauge cci={cci} />
            <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
              {cci >= 6000 ? "High conviction — emissions decreasing 📉" :
               cci >= 4000 ? "Moderate — system in equilibrium ⚖️" :
               `Low conviction — burn multiplier rising 🔥`}
            </p>
          </motion.div>

          {/* Stat grid */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label} custom={i + 1} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }}
                className="stat-card"
              >
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">{s.label}</span>
                <span className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</span>
                <span className="text-xs text-slate-400">{s.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Epoch countdown */}
        {timeLeft != null && timeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="mt-8 glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <p className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">Epoch {epochId} Ends In</p>
              <p className="text-slate-400 text-sm">Declare your conviction before the window closes.</p>
            </div>
            <Countdown seconds={timeLeft} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
