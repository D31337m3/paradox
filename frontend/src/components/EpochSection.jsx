import { motion } from "framer-motion";

const choices = [
  {
    id: "HOARD",
    icon: "🔒",
    color: "from-violet-600/20 to-violet-900/10 border-violet-600/40 hover:border-violet-500",
    accent: "text-violet-300",
    title: "HOARD",
    tagline: "Declare your conviction.",
    body: "Lock tokens for the full epoch. Earn governance weight and base yield. Your commitment signals to the market.",
    reward: "Base yield + Governance weight",
    risk: "Tokens locked until epoch end",
  },
  {
    id: "BURN",
    icon: "🔥",
    color: "from-pink-600/20 to-pink-900/10 border-pink-600/40 hover:border-pink-500",
    accent: "text-pink-300",
    title: "BURN",
    tagline: "Permanent destruction.",
    body: "Destroy tokens irreversibly. Receive a soulbound Burn Reputation NFT and amplified rewards next epoch. Sacrifice is the signal.",
    reward: "Multiplied rewards next epoch + Soulbound NFT",
    risk: "Irreversible — tokens are gone forever",
  },
  {
    id: "EXIT",
    icon: "🌊",
    color: "from-cyan-600/20 to-cyan-900/10 border-cyan-600/40 hover:border-cyan-500",
    accent: "text-cyan-300",
    title: "EXIT",
    tagline: "Freedom preserved.",
    body: "Stay liquid. No reward boost. No penalty. The choice to exit is as valid as any. PARADOX respects it. It simply measures it.",
    reward: "Full liquidity maintained",
    risk: "No epoch reward multiplier",
  },
];

const steps = [
  { n: "01", label: "Epoch Opens", desc: "A new 30-day window begins. Participants may declare their choice." },
  { n: "02", label: "Declare Choice", desc: "Choose HOARD, BURN, or EXIT and commit your tokens accordingly." },
  { n: "03", label: "CCI Calculated", desc: "At epoch end, the Collective Conviction Index is computed from all participant behavior." },
  { n: "04", label: "Emissions Adjust", desc: "High CCI tightens supply. Low CCI raises the burn multiplier. The protocol self-calibrates." },
  { n: "05", label: "Rewards Distributed", desc: "Hoarders claim yield. Burners claim multiplied rewards from the next epoch. The cycle repeats." },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.55 } }),
};

export default function EpochSection() {
  return (
    <section id="epochs" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-paradox-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/5 blur-[100px] rounded-full" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-16"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">30-Day Cycles</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 text-white">
            The <span className="text-paradox-magenta">Epoch</span> System
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Time is divided into epochs. At each, participants declare what they are willing to sacrifice.
            The market answers honestly.
          </p>
        </motion.div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {choices.map((c, i) => (
            <motion.div
              key={c.id} custom={i} variants={fadeUp} initial="hidden"
              whileInView="visible" viewport={{ once: true }}
              className={`choice-card bg-gradient-to-br ${c.color} border`}
            >
              <div className="text-4xl mb-1">{c.icon}</div>
              <div className={`text-xl font-black tracking-widest font-mono ${c.accent}`}>{c.title}</div>
              <div className="text-sm text-slate-300 font-medium italic">{c.tagline}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
              <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-xs mt-0.5">✓</span>
                  <span className="text-xs text-slate-300">{c.reward}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-xs mt-0.5">!</span>
                  <span className="text-xs text-slate-400">{c.risk}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CCI formula */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 text-center mb-20 max-w-2xl mx-auto"
        >
          <p className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-4">Collective Conviction Index</p>
          <div className="text-lg md:text-2xl font-mono text-white">
            <span className="text-paradox-lavender">CCI</span>
            <span className="text-slate-400"> = (</span>
            <span className="text-purple-300">Total Locked</span>
            <span className="text-slate-400"> + </span>
            <span className="text-pink-300">Total Burned</span>
            <span className="text-slate-400">) / </span>
            <span className="text-cyan-300">Circulating Supply</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="glass rounded-xl p-4">
              <p className="text-purple-300 font-semibold mb-1">High CCI ≥ 60%</p>
              <p className="text-slate-400">Emissions ↓ &nbsp;·&nbsp; Scarcity ↑ &nbsp;·&nbsp; Governance weight ↑</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-pink-300 font-semibold mb-1">Low CCI &lt; 40%</p>
              <p className="text-slate-400">Emissions ↑ &nbsp;·&nbsp; Burn multiplier ↑ &nbsp;·&nbsp; Incentives ↑</p>
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.n} custom={i} variants={fadeUp} initial="hidden"
              whileInView="visible" viewport={{ once: true }}
              className="flex items-start gap-6 glass rounded-xl p-5"
            >
              <span className="text-3xl font-black font-mono text-paradox-border min-w-[2.5rem]">{s.n}</span>
              <div>
                <p className="font-semibold text-white mb-1">{s.label}</p>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
