/**
 * WhaleLeaderboard — Top token holders with conviction tiers
 * Gamified ranking: Architect, Apostle, Believer, Speculator, Ghost
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTokenStats } from "../hooks/useParadox.js";

const PDX_ADDRESS = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";
const EXCLUDED = new Set([
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead",
  // EpochController (locked tokens held here)
  "0x473a89eb41d3903f56c054ef0a16fb8594515e53",
  // DAO Treasury
  "0xfed787784c3c3f7101b46f06a847cb5d60fa6166",
]);

function useTopHolders() {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://api.polygonscan.com/api?module=token&action=tokenholderlist` +
      `&contractaddress=${PDX_ADDRESS}&page=1&offset=50`
    )
      .then(r => r.json())
      .then(j => {
        if (j.status !== "1" || !Array.isArray(j.result)) {
          setError("Holder data unavailable");
          return;
        }
        const filtered = j.result
          .filter(h => !EXCLUDED.has(h.TokenHolderAddress.toLowerCase()))
          .slice(0, 20);
        setHolders(filtered);
      })
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

function formatBalance(raw) {
  const n = Number(raw) / 1e18;
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
            The top holders. No hidden hands. Every wallet visible on-chain.
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
                    const bal    = Number(h.TokenHolderQuantity) / 1e18;
                    const pct    = supplyNum > 0 ? (bal / supplyNum) * 100 : 0;
                    const rank   = i + 1;
                    const rl     = getRankLabel(rank, pct);
                    const isTop3 = rank <= 3;
                    return (
                      <motion.tr
                        key={h.TokenHolderAddress}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-white/3 hover:bg-white/3 transition-colors ${isTop3 ? "bg-amber-500/3" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-black font-mono text-lg ${isTop3 ? "text-amber-400" : "text-slate-500"}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`https://polygonscan.com/address/${h.TokenHolderAddress}`}
                            target="_blank" rel="noopener noreferrer"
                            className="font-mono text-slate-300 hover:text-white transition-colors text-xs"
                          >
                            {shortenAddr(h.TokenHolderAddress)}
                          </a>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`text-xs font-mono ${rl.color} flex items-center gap-1`}>
                            {rl.icon} {rl.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-white text-xs">
                          {formatBalance(h.TokenHolderQuantity)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${isTop3 ? "bg-amber-500" : "bg-violet-500"} rounded-full`}
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
          Live data via Polygonscan · Contract and dead addresses excluded · Top 20 non-system wallets shown
        </p>

      </div>
    </section>
  );
}
