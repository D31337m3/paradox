import { motion } from "framer-motion";

const quotes = [
  { text: "PARADOX is the market\nthat knows it's a market.", highlight: "knows it's a market" },
  { text: "Most tokens reward extraction.\nPARADOX rewards declaration.", highlight: "declaration" },
  { text: "Reputation cannot be purchased.\nOnly earned through destruction.\nThat is the paradox.", highlight: "paradox" },
  { text: "Value does not emerge from hype.\nIt emerges from coordinated belief under constraint.", highlight: "constraint" },
];

const tenets = [
  { title: "Behavioral Revelation",    body: "Instead of optimizing for price, PARADOX optimizes for signal. Every economic choice reveals conviction — or its absence.", icon: "🧠" },
  { title: "Voluntary Scarcity",       body: "Supply shrinks only when holders choose destruction. Scarcity is not manufactured by decree — it is declared by participants.", icon: "🔥" },
  { title: "Transparent Incentives",   body: "No hidden taxes. No blacklists. No obscured mint authority. Every mechanism is on-chain and verifiable.", icon: "🔍" },
  { title: "Sacrifice as Signal",      body: "Burning is permanent. That permanence is the point. The willingness to destroy is the most honest signal a market participant can give.", icon: "⚔️" },
  { title: "Governance by Conviction", body: "Voting power = Token weight + Reputation modifier. Pure whales cannot dominate without sacrifice. Influence requires commitment.", icon: "⚖️" },
  { title: "Self-Adjusting Economy",   body: "The CCI drives emission rates automatically. No centralized hand adjusts parameters. The community's collective behavior does.", icon: "🔄" },
];

const rules = [
  { n: "I",   rule: "Everyone knows the rules.", detail: "All mechanics are public, on-chain, and immutable. There are no admin backdoors. No surprise taxes. No hidden mints." },
  { n: "II",  rule: "Belief is the only resource.", detail: "There is no team treasury draining the pool. The only thing that moves this market is coordinated conviction — or the lack of it." },
  { n: "III", rule: "Burning is irreversible.", detail: "When you burn, it is gone. This is not a penalty. It is the most honest declaration a market participant can make." },
  { n: "IV",  rule: "Scarcity must be earned.", detail: "Supply does not decrease by decree. It decreases because someone chose destruction over extraction. That choice is the signal." },
  { n: "V",   rule: "Whales do not govern alone.", detail: "Reputation modifies voting weight. Capital without conviction has diminishing returns. You cannot buy this community." },
  { n: "VI",  rule: "The protocol does not take sides.", detail: "The CCI measures what the community does, then adjusts emissions accordingly. No human hand holds the dial." },
  { n: "VII", rule: "Observation changes the experiment.", detail: "Every dashboard view, every wallet check, every chart refresh — you are participating in the sociology. Welcome." },
];

export default function Manifesto() {
  return (
    <section id="manifesto" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-paradox-deep" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto">

        {/* ── Opening statement ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">The Declaration</span>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-white leading-tight">
            PARADOX
          </h2>
          <p className="text-xl md:text-2xl text-paradox-lavender font-light mt-2 italic">
            "A market experiment where everyone knows the rules."
          </p>
          <div className="mt-6 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500" />
          <p className="mt-6 text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Most markets are designed to obscure. PARADOX is designed to reveal.
            Every burn, every lock, every exit — all of it recorded, measured, and fed
            back to the community that created it. This is not a token. It is a mirror.
          </p>
        </motion.div>

        {/* ── The Rules ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <p className="text-xs font-mono tracking-widest text-purple-400 uppercase text-center mb-8">
            The Rules of the Experiment
          </p>
          <div className="space-y-3 max-w-3xl mx-auto">
            {rules.map((r, i) => (
              <motion.div
                key={r.n}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="flex gap-5 glass rounded-xl p-5 hover:border-purple-600/40 transition-all"
              >
                <div className="text-paradox-magenta font-black font-mono text-lg w-8 shrink-0 mt-0.5">{r.n}</div>
                <div>
                  <p className="text-white font-semibold mb-1">{r.rule}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{r.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-16"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">Philosophical Foundation</span>
          <h3 className="text-3xl md:text-4xl font-black mt-3 text-white">
            The <span className="text-paradox-lavender drop-shadow-[0_0_20px_rgba(167,139,250,0.6)]">Tenets</span>
          </h3>
          <div className="mt-4 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500" />
        </motion.div>

        {/* Tenets grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenets.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass rounded-2xl p-6 hover:border-purple-600/40 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <h3 className="font-bold text-white mb-2">{t.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="mt-16 text-center max-w-2xl mx-auto"
        >
          <p className="text-xl text-slate-300 font-light italic leading-relaxed">
            "The protocol does not promise returns.<br />
            It asks participants what they are willing to sacrifice.<br />
            <span className="text-paradox-magenta font-medium not-italic">Markets answer honestly.</span>"
          </p>
        </motion.div>
      </div>
    </section>
  );
}
