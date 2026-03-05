/**
 * WhaleLeaderboard — Full transparency: protocol contracts + wallet holders
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTokenStats } from "../hooks/useParadox.js";

const PDX_ADDRESS = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";
const RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL ?? "https://polygon-rpc.com";

/* ── Protocol / system address registry ─────────────────────────────────── */
const PROTOCOL = [
  {
    addr:  "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09",
    label: "PDX Token",
    role:  "ERC-20 contract",
    desc:  "Ownership permanently renounced — address(0) is owner. No admin functions remain. Supply is fixed.",
    icon:  "🪙", color: "text-paradox-lavender", dot: "bg-violet-500",
    badge: { text: "Renounced", style: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
    link:  "https://polygonscan.com/address/0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09",
  },
  {
    addr:  "0x473a89EB41D3903f56c054Ef0a16fB8594515e53",
    label: "Epoch Controller v2",
    role:  "Active protocol contract",
    desc:  "Manages epoch lifecycle. Holds PDX locked by HOARD participants during active epochs. Owned by DAO 2-of-2 multisig — no single key controls it.",
    icon:  "⚙️", color: "text-sky-400", dot: "bg-sky-500",
    badge: { text: "DAO Owned", style: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
    link:  "https://polygonscan.com/address/0x473a89EB41D3903f56c054Ef0a16fB8594515e53",
  },
  {
    addr:  "0x1fb3c47c85f65daaF4a48B27E3D9F9dd8607a88e",
    label: "Epoch Controller v1",
    role:  "Epoch 0 (Beta) — Liquidity pool funding for next epoch",
    desc:  "Epoch 0 is the initial beta run of the PARADOX protocol — live until ~April 1 2026. The PDX reserve held here is earmarked as liquidity pool funding for the next epoch launch, seeding the trading pool and reward pool to ensure deep liquidity from day one.",
    icon:  "🌊", color: "text-cyan-400", dot: "bg-cyan-500",
    badge: { text: "Epoch 0 Beta", style: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
    link:  "https://polygonscan.com/address/0x1fb3c47c85f65daaF4a48B27E3D9F9dd8607a88e",
  },
  {
    addr:  "0xfed787784C3C3f7101B46f06A847CB5D60Fa6166",
    label: "DAO Treasury",
    role:  "2-of-2 hardware Safe multisig",
    desc:  "Controls protocol upgrades, epoch parameters, and NFT contract. Requires two independent hardware signers to execute any transaction. No single point of compromise.",
    icon:  "🏛️", color: "text-emerald-400", dot: "bg-emerald-500",
    badge: { text: "2-of-2 Multisig", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    link:  "https://polygonscan.com/address/0xfed787784C3C3f7101B46f06A847CB5D60Fa6166",
  },
  {
    addr:  "0x7c147b31fA9fB4441dA937148E1600A72fa7f88A",
    label: "BurnReputation NFT v2",
    role:  "Soulbound conviction badge contract",
    desc:  "Mints soulbound NFTs to wallets that burn PDX. Tiers: Bronze → Silver → Gold → Diamond. Non-transferable. Owned by DAO multisig.",
    icon:  "🏅", color: "text-pink-400", dot: "bg-pink-500",
    badge: { text: "DAO Owned", style: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
    link:  "https://polygonscan.com/address/0x7c147b31fA9fB4441dA937148E1600A72fa7f88A",
  },
  {
    addr:  "0x75812E84490a06C5D81B31862c8AF0c5F6b436B7",
    label: "Token Vesting",
    role:  "Linear vesting schedule",
    desc:  "Holds team/advisor allocations under a time-locked vesting schedule. Tokens are non-transferable until the cliff date passes. Prevents immediate dumping.",
    icon:  "⏳", color: "text-orange-400", dot: "bg-orange-500",
    badge: { text: "Time-Locked", style: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
    link:  "https://polygonscan.com/address/0x75812E84490a06C5D81B31862c8AF0c5F6b436B7",
  },
  {
    addr:  "0x4d35ee91cc47e108f9f21a1551345cce93817b9e",
    label: "QuickSwap LP Pool",
    role:  "PDX / WMATIC liquidity pair",
    desc:  "The DEX liquidity pool. Holds pooled PDX and WMATIC to enable on-chain trading. LP tokens are freely tradeable — no protocol lock on liquidity.",
    icon:  "💧", color: "text-cyan-400", dot: "bg-cyan-500",
    badge: { text: "Public LP", style: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
    link:  "https://polygonscan.com/address/0x4d35ee91cc47e108f9f21a1551345cce93817b9e",
  },
  {
    addr:  "0x8731492605bf43D9fBe35dF02560ffE4e0B61589",
    label: "ParadoxLog",
    role:  "Immutable on-chain event log",
    desc:  "Permanent record of every epoch transition, governance action, and protocol event. Cannot be modified or deleted. The ledger of record.",
    icon:  "📋", color: "text-slate-400", dot: "bg-slate-500",
    badge: { text: "Immutable", style: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
    link:  "https://polygonscan.com/address/0x8731492605bf43D9fBe35dF02560ffE4e0B61589",
  },
  {
    addr:  "0x000000000000000000000000000000000000dEaD",
    label: "Burn Address",
    role:  "Standard EVM destruction sink",
    desc:  "Tokens sent here are permanently inaccessible. No key exists for this address. Used as an alternative burn destination alongside address(0).",
    icon:  "💀", color: "text-red-400", dot: "bg-red-500",
    badge: { text: "Permanent Burn", style: "bg-red-500/10 text-red-400 border-red-500/30" },
    link:  "https://polygonscan.com/address/0x000000000000000000000000000000000000dEaD",
  },
];

const PROTOCOL_SET = new Set(PROTOCOL.map(p => p.addr.toLowerCase()));

/* ── Fetch wallet holders via Alchemy ──────────────────────────────────── */
async function fetchHolders() {
  const xferRes = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "alchemy_getAssetTransfers",
      params: [{ fromBlock: "0x0", toBlock: "latest", contractAddresses: [PDX_ADDRESS],
        category: ["erc20"], withMetadata: false, excludeZeroValue: true, maxCount: "0x3e8", order: "desc" }],
    }),
  });
  const xferJson = await xferRes.json();
  const transfers = xferJson?.result?.transfers ?? [];

  const addrSet = new Set();
  for (const t of transfers) {
    if (t.to)   addrSet.add(t.to.toLowerCase());
    if (t.from) addrSet.add(t.from.toLowerCase());
  }
  const addrs = [...addrSet].filter(a => !PROTOCOL_SET.has(a));
  if (addrs.length === 0) return [];

  const balSig = "0x70a08231";
  const calls = addrs.map((addr, i) => ({
    jsonrpc: "2.0", id: i + 2,
    method: "eth_call",
    params: [{ to: PDX_ADDRESS, data: balSig + addr.slice(2).padStart(64, "0") }, "latest"],
  }));

  const results = [];
  for (let i = 0; i < calls.length; i += 50) {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calls.slice(i, i + 50)),
    });
    const batch = await res.json();
    results.push(...(Array.isArray(batch) ? batch : [batch]));
  }

  return addrs
    .map((addr, i) => {
      const hex = results.find(r => r.id === i + 2)?.result ?? "0x0";
      const balance = BigInt(hex || "0x0");
      return { addr, balance };
    })
    .filter(h => h.balance > 0n)
    .sort((a, b) => (a.balance > b.balance ? -1 : 1));
}

function useTopHolders() {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchHolders().then(setHolders).catch(() => {}).finally(() => setLoading(false));
  }, []);
  return { holders, loading };
}

/* ── Rank label ─────────────────────────────────────────────────────────── */
function getRank(rank, pct) {
  if (rank <= 3 || pct >= 5)  return { label: "Architect",  color: "text-amber-400",  bar: "bg-amber-500",  icon: "👑" };
  if (rank <= 7 || pct >= 2)  return { label: "Apostle",    color: "text-violet-400", bar: "bg-violet-500", icon: "⚡" };
  if (rank <= 12 || pct >= 1) return { label: "Believer",   color: "text-sky-400",    bar: "bg-sky-500",    icon: "🔥" };
  if (rank <= 17)              return { label: "Speculator", color: "text-slate-300",  bar: "bg-slate-500",  icon: "👁" };
  return                               { label: "Ghost",      color: "text-slate-500",  bar: "bg-slate-700",  icon: "👻" };
}

function fmt(balance) {
  const n = Number(balance) / 1e18;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function short(addr) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

/* ── Protocol card ────────────────────────────────────────────────────── */
function ProtocolCard({ p, bal, supplyNum, i }) {
  const pct = supplyNum > 0 && bal > 0n ? (Number(bal) / 1e18 / supplyNum) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: i * 0.05 }}
      className="glass rounded-xl p-4 flex flex-col gap-2 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{p.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm ${p.color}`}>{p.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${p.badge.style}`}>
                {p.badge.text}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.role}</p>
          </div>
        </div>
        {bal > 0n && (
          <div className="text-right shrink-0">
            <p className={`text-sm font-black font-mono ${p.color}`}>{fmt(bal)}</p>
            <p className="text-[10px] text-slate-500 font-mono">{pct.toFixed(1)}%</p>
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
      <div className="flex items-center justify-between">
        <a
          href={p.link} target="_blank" rel="noopener noreferrer"
          className="text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot} inline-block`} />
          {short(p.addr)}
          <span className="opacity-50">↗</span>
        </a>
        {bal > 0n && (
          <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${p.dot} rounded-full`} style={{ width: `${Math.min(pct * 4, 100)}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────── */
export default function WhaleLeaderboard() {
  const { holders, loading } = useTopHolders();
  const { totalSupply } = useTokenStats();
  const supplyNum = totalSupply ? Number(totalSupply) / 1e18 : 0;

  // Fetch balances for protocol addresses too
  const [protocolBals, setProtocolBals] = useState({});
  useEffect(() => {
    const balSig = "0x70a08231";
    const calls = PROTOCOL.map((p, i) => ({
      jsonrpc: "2.0", id: i,
      method: "eth_call",
      params: [{ to: PDX_ADDRESS, data: balSig + p.addr.slice(2).padStart(64, "0") }, "latest"],
    }));
    fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calls),
    })
      .then(r => r.json())
      .then(results => {
        const bals = {};
        (Array.isArray(results) ? results : [results]).forEach(r => {
          const hex = r?.result ?? "0x0";
          bals[PROTOCOL[r.id]?.addr?.toLowerCase()] = BigInt(hex || "0x0");
        });
        setProtocolBals(bals);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(139,92,246,0.04)_0%,_transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-10"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">Full Transparency</span>
          <h2 className="text-3xl font-black text-white mt-1">
            Where Every <span className="text-paradox-lavender">PDX Lives</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Every address that holds PDX — protocol contracts with descriptions, wallets with conviction rankings.
            Nothing hidden.
          </p>
        </motion.div>

        {/* ── Protocol Infrastructure ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-2"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">
            Protocol Infrastructure
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {PROTOCOL.map((p, i) => (
            <ProtocolCard
              key={p.addr}
              p={p}
              bal={protocolBals[p.addr.toLowerCase()] ?? 0n}
              supplyNum={supplyNum}
              i={i}
            />
          ))}
        </div>

        {/* ── Wallet Holders ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-4"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
            Wallet Holders
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Architect",  icon: "👑", color: "text-amber-400"  },
              { label: "Apostle",    icon: "⚡", color: "text-violet-400" },
              { label: "Believer",   icon: "🔥", color: "text-sky-400"    },
              { label: "Speculator", icon: "👁", color: "text-slate-300"  },
              { label: "Ghost",      icon: "👻", color: "text-slate-500"  },
            ].map(r => (
              <span key={r.label} className={`text-[10px] font-mono ${r.color} glass px-2 py-0.5 rounded`}>
                {r.icon} {r.label}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="glass rounded-2xl overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-24 gap-2 text-slate-500 text-sm font-mono">
              <span className="animate-pulse">◈</span> Loading on-chain holder data…
            </div>
          )}
          {!loading && holders.length === 0 && (
            <div className="flex items-center justify-center h-24 text-slate-600 text-sm font-mono">
              No external wallet holders found
            </div>
          )}
          {!loading && holders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="text-left py-3 px-4 w-12">Rank</th>
                    <th className="text-left py-3 px-4">Address</th>
                    <th className="text-left py-3 px-4 hidden sm:table-cell">Conviction</th>
                    <th className="text-right py-3 px-4">Balance</th>
                    <th className="text-right py-3 px-4">% Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((h, i) => {
                    const bal  = Number(h.balance) / 1e18;
                    const pct  = supplyNum > 0 ? (bal / supplyNum) * 100 : 0;
                    const rank = i + 1;
                    const rl   = getRank(rank, pct);
                    const top3 = rank <= 3;
                    return (
                      <motion.tr
                        key={h.addr}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-white/3 hover:bg-white/3 transition-colors ${top3 ? "bg-amber-500/3" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-black font-mono text-base leading-none ${top3 ? "text-amber-400" : "text-slate-600"}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`https://polygonscan.com/address/${h.addr}`}
                            target="_blank" rel="noopener noreferrer"
                            className="font-mono text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            {short(h.addr)}
                          </a>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`text-xs font-mono ${rl.color}`}>
                            {rl.icon} {rl.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono text-xs text-white font-bold">{fmt(h.balance)}</span>
                          <span className="font-mono text-[10px] text-slate-500 ml-1">PDX</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                              <div className={`h-full ${rl.bar} rounded-full`} style={{ width: `${Math.min(pct * 8, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-mono font-bold ${top3 ? "text-amber-400" : "text-slate-400"}`}>
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

        <p className="text-[10px] font-mono text-slate-700 mt-4 text-center">
          Live on-chain data · Protocol contracts excluded from wallet rankings · Polygon Mainnet
        </p>

      </div>
    </section>
  );
}
