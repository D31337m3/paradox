/**
 * Observatory — unified live stats + on-chain experiment dashboard
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTokenStats, useEpochData, useTreasuryBalance } from "../hooks/useParadox.js";
import { formatUnits } from "viem";

const LP_PAIR     = "0x4d35Ee91Cc47e108F9f21a1551345cce93817B9E";
const PDX_ADDRESS = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";

/* ── GeckoTerminal price data ─────────────────────────────────────────────── */
function usePriceData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const run = () => {
      fetch(`https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${LP_PAIR}`)
        .then(r => r.json())
        .then(j => {
          const a = j?.data?.attributes;
          if (!a) return;
          setData({
            priceUsd:    a.base_token_price_usd,
            priceChange: { h24: parseFloat(a.price_change_percentage?.h24 ?? 0) },
            volume:      { h24: parseFloat(a.volume_usd?.h24 ?? 0) },
            liquidity:   { usd: parseFloat(a.reserve_in_usd ?? 0) },
          });
        })
        .catch(() => {});
    };
    run();
    const id = setInterval(run, 30_000);
    return () => clearInterval(id);
  }, []);
  return data;
}

/* ── Polygonscan holder count ─────────────────────────────────────────────── */
function useHolderCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    fetch(`https://api.polygonscan.com/api?module=token&action=tokeninfo&contractaddress=${PDX_ADDRESS}`)
      .then(r => r.json())
      .then(j => {
        const info = j?.result?.[0];
        if (info?.holdersCount) setCount(Number(info.holdersCount));
      })
      .catch(() => {});
  }, []);
  return count;
}

/* ── Sentiment classification from CCI ───────────────────────────────────── */
function getSentiment(cci) {
  if (cci == null) return { label: "Unknown",      color: "text-slate-500",   bar: "bg-slate-600",   score: 0   };
  if (cci >= 8000) return { label: "Euphoric",     color: "text-emerald-400", bar: "bg-emerald-500", score: 100 };
  if (cci >= 6000) return { label: "Conviction",   color: "text-violet-400",  bar: "bg-violet-500",  score: 75  };
  if (cci >= 4000) return { label: "Neutral",      color: "text-blue-400",    bar: "bg-blue-500",    score: 50  };
  if (cci >= 2000) return { label: "Doubt",        color: "text-amber-400",   bar: "bg-amber-500",   score: 30  };
  return             { label: "Capitulation",  color: "text-red-400",     bar: "bg-red-500",     score: 10  };
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent = "text-white", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay }}
      className="glass rounded-2xl p-5 flex flex-col gap-1"
    >
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-2xl font-black font-mono ${accent}`}>{value ?? "—"}</span>
      {sub && <span className="text-xs text-slate-500 font-mono">{sub}</span>}
    </motion.div>
  );
}

/* ── CCI Gauge ────────────────────────────────────────────────────────────── */
function CCIGauge({ cci }) {
  const pct   = cci / 10000;
  const angle = pct * 180;
  const r = 60, cx = 80, cy = 80;
  const toXY = (deg) => {
    const rad = ((deg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const end   = toXY(angle);
  const large = angle > 180 ? 1 : 0;
  const color = pct >= 0.6 ? "#8b5cf6" : pct >= 0.4 ? "#a78bfa" : "#ec4899";
  return (
    <svg width="160" height="90" viewBox="0 0 160 90">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#2d1f4e" strokeWidth="8" strokeLinecap="round" />
      {angle > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Inter">
        {(pct * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter">
        CONVICTION INDEX
      </text>
    </svg>
  );
}

/* ── Epoch countdown ──────────────────────────────────────────────────────── */
function Countdown({ seconds }) {
  const [secs, setSecs] = useState(seconds ?? 0);
  useEffect(() => { if (seconds != null) setSecs(seconds); }, [seconds]);
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

/* ── Sociology breakdown ──────────────────────────────────────────────────── */
function SociologyBar({ locked, burned, circulating }) {
  const total      = circulating > 0 ? circulating : 1;
  const believers  = Math.min((locked  / total) * 100, 100);
  const apostates  = Math.min((burned  / total) * 100, 100);
  const spectators = Math.max(100 - believers - apostates, 0);
  const rows = [
    { label: "Believers",  desc: "Tokens locked — conviction declared",   pct: believers,  color: "bg-violet-500" },
    { label: "Apostates",  desc: "Tokens burned — sacrifice completed",    pct: apostates,  color: "bg-pink-500"   },
    { label: "Spectators", desc: "Circulating supply — watching the game", pct: spectators, color: "bg-slate-600"  },
  ];
  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.label}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs font-bold text-white">{r.label}</span>
            <span className="text-xs font-mono text-slate-400">{r.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} whileInView={{ width: `${r.pct}%` }}
              viewport={{ once: true }} transition={{ duration: 1.0, ease: "easeOut" }}
              className={`h-full ${r.color} rounded-full`}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/* ── Main component ───────────────────────────────────────────────────────── */
export default function Observatory() {
  const { isDeployed, totalSupply }               = useTokenStats();
  const { epoch, epochId, timeLeft, liveCCI }     = useEpochData();
  const { balance: treasuryBalance }              = useTreasuryBalance();
  const dex                                       = usePriceData();
  const holders                                   = useHolderCount();
  const sentiment                                 = getSentiment(liveCCI);
  const cci                                       = liveCCI ?? (epoch?.cci ? Number(epoch.cci) : 0);

  /* Market data */
  const price    = dex?.priceUsd
    ? `$${dex.priceUsd}`
    : null;
  const change24 = dex?.priceChange?.h24;
  const vol24    = dex?.volume?.h24    != null ? `$${(dex.volume.h24    / 1000).toFixed(1)}K` : null;
  const liq      = dex?.liquidity?.usd != null ? `$${(dex.liquidity.usd / 1000).toFixed(1)}K` : null;

  /* On-chain data */
  const lockedFmt = epoch?.totalLocked ? parseFloat(formatUnits(epoch.totalLocked, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—";
  const burnedFmt = epoch?.totalBurned ? parseFloat(formatUnits(epoch.totalBurned, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—";
  const locked      = epoch ? Number(epoch.totalLocked)      / 1e18 : 0;
  const burned      = epoch ? Number(epoch.totalBurned)      / 1e18 : 0;
  const circulating = epoch ? Number(epoch.circulatingSupply) / 1e18 : 1;

  return (
    <section id="stats" className="relative py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.06)_0%,_transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">Live On-Chain Data</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 text-white">
            The <span className="text-paradox-lavender">Observatory</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Every wallet tells a story. This is the market watching itself.
          </p>
          {!isDeployed && (
            <p className="mt-3 text-sm text-amber-400 font-mono glass inline-block px-4 py-2 rounded-full">
              ⚡ Awaiting deployment — showing static preview
            </p>
          )}
        </motion.div>

        {/* Market stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="PDX Price"   value={price}  sub="Polygon mainnet" accent="text-emerald-400" delay={0}    />
          <StatCard
            label="24h Change"
            value={change24 != null ? `${change24 >= 0 ? "+" : ""}${change24.toFixed(2)}%` : null}
            sub="GeckoTerminal"
            accent={change24 == null ? "text-white" : change24 >= 0 ? "text-emerald-400" : "text-red-400"}
            delay={0.05}
          />
          <StatCard label="24h Volume"  value={vol24}  sub="DEX trading"     accent="text-sky-400"     delay={0.1}  />
          <StatCard label="Liquidity"   value={liq}    sub="Pooled"          accent="text-violet-300"  delay={0.15} />
        </div>

        {/* CCI Gauge + on-chain stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="stat-card items-center text-center"
          >
            <span className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-2">Collective Conviction Index</span>
            <CCIGauge cci={cci} />
            <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
              {cci >= 6000 ? "High conviction — emissions decreasing 📉"
                : cci >= 4000 ? "Moderate — system in equilibrium ⚖️"
                : "Low conviction — burn multiplier rising 🔥"}
            </p>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            {[
              { label: "Total Supply",      value: "1,000,000,000", sub: "PDX",              color: "text-purple-300", i: 1 },
              { label: "Epoch",             value: epochId != null ? `#${epochId}` : "—", sub: "current", color: "text-violet-300", i: 2 },
              { label: "Locked This Epoch", value: lockedFmt,       sub: "PDX",              color: "text-purple-400", i: 3 },
              { label: "Burned This Epoch", value: burnedFmt,       sub: "PDX",              color: "text-pink-400",   i: 4 },
              { label: "Sentiment",         value: sentiment.label, sub: `CCI ${cci}`,       color: sentiment.color,   i: 5 },
              { label: "Unique Holders",    value: holders != null ? holders.toLocaleString() : null, sub: "On-chain wallets", color: "text-sky-400", i: 6 },
            ].map(s => (
              <motion.div
                key={s.label} custom={s.i} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }}
                className="stat-card"
              >
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">{s.label}</span>
                <span className={`text-2xl font-black font-mono ${s.color}`}>{s.value ?? "—"}</span>
                <span className="text-xs text-slate-400">{s.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sociology breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-purple-400">Market Sociology</p>
              <h3 className="text-lg font-bold text-white mt-0.5">Who holds this token — and how?</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-mono uppercase">Sentiment</p>
              <p className={`text-base font-black font-mono ${sentiment.color}`}>{sentiment.label}</p>
            </div>
          </div>
          <SociologyBar locked={locked} burned={burned} circulating={circulating} />
        </motion.div>

        {/* Sentiment score bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 mb-6"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Collective Sentiment Score</span>
            <span className={`text-sm font-black font-mono ${sentiment.color}`}>{sentiment.score}/100</span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} whileInView={{ width: `${sentiment.score}%` }}
              viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full ${sentiment.bar} rounded-full`}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-600">
            <span>Capitulation</span><span>Neutral</span><span>Euphoric</span>
          </div>
        </motion.div>

        {/* Epoch countdown */}
        {timeLeft != null && timeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.45 }}
            className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
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

