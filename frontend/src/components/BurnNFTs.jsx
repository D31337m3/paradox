import { motion } from "framer-motion";

const tiers = [
  {
    name: "Bronze", icon: "🥉",
    color: "from-amber-900/30 to-amber-950/20 border-amber-700/30",
    accent: "text-amber-400", glow: "hover:border-amber-600/50",
    range: "Any burn (< 0.005% supply)", mult: "1x", score: "sqrt(PDX) x 1",
    cap: "No cap",
    desc: "The first act of sacrifice. Bronze signals you entered the arena — skin in the game.",
    whale: "low",
  },
  {
    name: "Silver", icon: "🥈",
    color: "from-slate-700/30 to-slate-800/20 border-slate-500/30",
    accent: "text-slate-300", glow: "hover:border-slate-400/50",
    range: ">= 0.005% of supply", mult: "2x", score: "sqrt(PDX) x 2",
    cap: "Max 0.5% supply / epoch",
    desc: "Meaningful sacrifice relative to the ecosystem. Silver holders are recognised coordinators.",
    whale: "medium",
  },
  {
    name: "Gold", icon: "🥇",
    color: "from-yellow-800/30 to-yellow-950/20 border-yellow-600/30",
    accent: "text-yellow-400", glow: "hover:border-yellow-500/50",
    range: ">= 0.05% of supply", mult: "3x", score: "sqrt(PDX) x 3",
    cap: "Max 1% supply / epoch",
    desc: "Proportional deep conviction. Gold influence scales with the health of the whole ecosystem.",
    whale: "high",
  },
  {
    name: "Diamond", icon: "💎",
    color: "from-cyan-800/20 to-cyan-950/20 border-cyan-500/30",
    accent: "text-cyan-300", glow: "hover:border-cyan-400/50",
    range: ">= 0.5% of supply", mult: "4x", score: "sqrt(PDX) x 4",
    cap: "Max 2% supply / epoch",
    desc: "The rarest signal. Diamond can only be earned when the supply itself supports the scale of sacrifice.",
    whale: "extreme",
  },
];

const whaleLabel = {
  low:     { text: "Open access",      color: "text-green-400 border-green-700/40" },
  medium:  { text: "Moderate barrier", color: "text-yellow-400 border-yellow-700/40" },
  high:    { text: "High barrier",     color: "text-orange-400 border-orange-700/40" },
  extreme: { text: "Ecosystem-scale",  color: "text-red-400 border-red-700/40" },
};

const scoreTable = [
  { pdx: "100",       tier: "Bronze",  score: "10" },
  { pdx: "1,000",     tier: "Bronze",  score: "31" },
  { pdx: "10,000",    tier: "Silver",  score: "200" },
  { pdx: "100,000",   tier: "Gold",    score: "948" },
  { pdx: "1,000,000", tier: "Diamond", score: "4,000" },
];

export default function BurnNFTs() {
  return (
    <section id="nfts" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-paradox-deep" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-900/10 blur-[100px] rounded-full" />

      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-10"
        >
          <span className="text-xs font-mono tracking-widest text-pink-400 uppercase">Soulbound NFTs</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 text-white">
            Burn <span className="text-paradox-magenta">Reputation</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            When you burn PDX you receive a non-transferable NFT encoding your conviction.
            Tiers are <span className="text-white font-semibold">percentage-based</span> — they scale with the ecosystem, not raw wealth.
            Score uses <span className="text-white font-semibold">square-root scaling</span> to resist whale dominance.
          </p>
        </motion.div>

        {/* Anti-whale callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 glass border border-pink-500/20 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="text-sm font-bold text-white mb-0.5">Whale Protection &amp; Proportional Conviction</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tiers are gated by <strong className="text-slate-200">% of circulating supply</strong>, not absolute amounts — thresholds rise with adoption.
              Reputation score uses <strong className="text-slate-200">square-root scaling</strong>: burning 100x more PDX earns only ~10x more score.
              Per-epoch burn caps prevent any single address from cornering the CCI.
            </p>
          </div>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((t, i) => {
            const wl = whaleLabel[t.whale];
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`choice-card bg-gradient-to-br ${t.color} border ${t.glow} relative overflow-hidden`}
              >
                {t.name === "Diamond" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                )}
                <div className="text-5xl mb-2">{t.icon}</div>
                <div className={`text-xl font-black tracking-widest font-mono ${t.accent}`}>{t.name}</div>
                <p className="text-xs text-slate-400 font-mono mb-2">{t.range}</p>

                <span className={`text-[10px] font-mono border rounded-full px-2 py-0.5 ${wl.color} mb-2 inline-block`}>
                  {wl.text}
                </span>

                <div className="flex gap-2 mt-1 mb-2 flex-wrap">
                  <div className="glass rounded-lg px-2 py-1.5 text-center flex-1">
                    <p className="text-[10px] text-slate-500">Reward Mult</p>
                    <p className={`font-mono font-bold text-sm ${t.accent}`}>{t.mult}</p>
                  </div>
                  <div className="glass rounded-lg px-2 py-1.5 text-center flex-1">
                    <p className="text-[10px] text-slate-500">Rep Score</p>
                    <p className={`font-mono font-bold text-xs ${t.accent}`}>{t.score}</p>
                  </div>
                </div>
                <div className="glass rounded-lg px-2 py-1.5 text-center mb-3">
                  <p className="text-[10px] text-slate-500">Epoch Cap</p>
                  <p className={`font-mono font-bold text-xs ${t.accent}`}>{t.cap}</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Score formula explainer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-1 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-white mb-2">sqrt() Scoring Formula</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Square-root scoring means doubling your burn gives only ~41% more score, not 100%.
              A whale burning 10,000x more earns just ~100x more reputation — keeping small holders competitive.
            </p>
          </div>
          <div className="md:col-span-2 glass rounded-xl p-4 font-mono text-xs space-y-2">
            {scoreTable.map(r => (
              <div key={r.pdx} className="flex justify-between items-center border-b border-white/5 pb-1">
                <span className="text-slate-400"><span className="text-purple-300">{r.pdx}</span> PDX burned</span>
                <span className="text-slate-600">-&gt;</span>
                <span className="text-yellow-400 w-16 text-center">{r.tier}</span>
                <span className="text-slate-600">-&gt;</span>
                <span className="text-green-400">{r.score} rep pts</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* On-chain metadata callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
        >
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-white mb-3">What is stored on-chain</h3>
            <p className="text-slate-400 text-sm mb-4">
              Every Burn Reputation NFT is fully on-chain with base64-encoded JSON metadata. No IPFS dependency.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {["Amount Burned", "Epoch Number", "Conviction Tier"].map(attr => (
                <div key={attr} className="bg-paradox-card rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-paradox-lavender font-mono">{attr}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-5 font-mono text-xs text-slate-400 space-y-1">
            <p><span className="text-purple-400">"name"</span>: <span className="text-green-400">"PDX-REP #42"</span></p>
            <p><span className="text-purple-400">"Epoch"</span>: <span className="text-cyan-400">3</span></p>
            <p><span className="text-purple-400">"PDX Burned"</span>: <span className="text-cyan-400">12,500</span></p>
            <p><span className="text-purple-400">"Tier"</span>: <span className="text-yellow-400">"Gold"</span></p>
            <p><span className="text-purple-400">"Rep Score"</span>: <span className="text-cyan-400">336</span></p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
