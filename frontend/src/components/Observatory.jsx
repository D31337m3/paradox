/**
 * Observatory — Live on-chain experiment dashboard
 * Market sociology: belief, volatility, holder growth, sentiment
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useEpochData } from "../hooks/useParadox.js";

const PDX_ADDRESS = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";

/* ── DexScreener price + volatility ──────────────────────────────────────── */
function useDexScreener() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${PDX_ADDRESS}`)
      .then(r => r.json())
      .then(j => {
        const pair = j?.pairs?.find(p => p.chainId === "polygon") ?? j?.pairs?.[0];
        if (pair) setData(pair);
      })
      .catch(() => {});
  }, []);
  return data;
}

/* ── Polygonscan holder count ─────────────────────────────────────────────── */
function useHolderCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    fetch(
      `https://api.polygonscan.com/api?module=token&action=tokeninfo&contractaddress=${PDX_ADDRESS}`
    )
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
  if (cci == null) return { label: "Unknown", color: "text-slate-500", bar: "bg-slate-600", score: 0 };
  if (cci >= 8000) return { label: "Euphoric", color: "text-emerald-400", bar: "bg-emerald-500", score: 100 };
  if (cci >= 6000) return { label: "Conviction", color: "text-violet-400", bar: "bg-violet-500", score: 75 };
  if (cci >= 4000) return { label: "Neutral", color: "text-blue-400", bar: "bg-blue-500", score: 50 };
  if (cci >= 2000) return { label: "Doubt", color: "text-amber-400", bar: "bg-amber-500", score: 30 };
  return { label: "Capitulation", color: "text-red-400", bar: "bg-red-500", score: 10 };
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

/* ── Sociology breakdown ─────────────────────────────────────────────────── */
function SociologyBar({ locked, burned, circulating }) {
  const total = circulating > 0 ? circulating : 1;
  const believers  = Math.min((locked  / total) * 100, 100);
  const apostates  = Math.min((burned  / total) * 100, 100);
  const spectators = Math.max(100 - believers - apostates, 0);

  const rows = [
    { label: "Believers",  desc: "Tokens locked — conviction declared",    pct: believers,  color: "bg-violet-500" },
    { label: "Apostates",  desc: "Tokens burned — sacrifice completed",     pct: apostates,  color: "bg-pink-500"   },
    { label: "Spectators", desc: "Circulating supply — watching the game",  pct: spectators, color: "bg-slate-600"  },
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

/* ── Main component ───────────────────────────────────────────────────────── */
export default function Observatory() {
  const { epoch, liveCCI, epochId } = useEpochData();
  const dex     = useDexScreener();
  const holders = useHolderCount();
  const sentiment = getSentiment(liveCCI);

  const price    = dex?.priceUsd ? `$${parseFloat(dex.priceUsd).toFixed(6)}` : null;
  const change24 = dex?.priceChange?.h24;
  const vol24    = dex?.volume?.h24 ? `$${(dex.volume.h24 / 1000).toFixed(1)}K` : null;
  const liq      = dex?.liquidity?.usd ? `$${(dex.liquidity.usd / 1000).toFixed(1)}K` : null;

  const locked      = epoch ? Number(epoch.totalLocked)       / 1e18 : 0;
  const burned      = epoch ? Number(epoch.totalBurned)        / 1e18 : 0;
  const circulating = epoch ? Number(epoch.circulatingSupply)  / 1e18 : 1;

  return (
    <section className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.05)_0%,_transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-10"
        >
          <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase">Live Data</span>
          <h2 className="text-3xl font-black text-white mt-1">
            The <span className="text-paradox-lavender">Observatory</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Every wallet tells a story. This is the market watching itself.
          </p>
        </motion.div>

        {/* Market stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="PDX Price" value={price} sub="Polygon mainnet" accent="text-emerald-400" delay={0} />
          <StatCard
            label="24h Change"
            value={change24 != null ? `${change24 > 0 ? "+" : ""}${change24.toFixed(2)}%` : null}
            sub="DexScreener"
            accent={change24 == null ? "text-white" : change24 >= 0 ? "text-emerald-400" : "text-red-400"}
            delay={0.05}
          />
          <StatCard label="24h Volume" value={vol24} sub="DEX trading" delay={0.1} />
          <StatCard label="Liquidity" value={liq} sub="Pooled" delay={0.15} />
        </div>

        {/* CCI + Holder row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatCard
            label="Conviction Index"
            value={liveCCI != null ? liveCCI.toLocaleString() : null}
            sub={`Epoch ${epochId ?? "—"}`}
            accent="text-violet-400"
            delay={0.2}
          />
          <StatCard
            label="Sentiment"
            value={sentiment.label}
            sub={`CCI score ${liveCCI ?? "—"}`}
            accent={sentiment.color}
            delay={0.25}
          />
          <StatCard
            label="Unique Holders"
            value={holders != null ? holders.toLocaleString() : null}
            sub="On-chain wallets"
            accent="text-sky-400"
            delay={0.3}
          />
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
            <div className={`text-right`}>
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
          className="glass rounded-2xl p-5"
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
            <span>Capitulation</span>
            <span>Neutral</span>
            <span>Euphoric</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
