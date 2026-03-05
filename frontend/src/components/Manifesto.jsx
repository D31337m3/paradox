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

export default function Manifesto() {
  return (
    <section id="manifesto" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-paradox-deep" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-20"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">The Declaration</span>
          <h2 className="text-5xl md:text-6xl font-black mt-3 text-white">
            The <span className="text-paradox-lavender drop-shadow-[0_0_20px_rgba(167,139,250,0.6)]">Manifesto</span>
          </h2>
          <div className="mt-4 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500" />
        </motion.div>

        {/* Quotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {quotes.map((q, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="glass rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-pink-500 rounded-l-2xl" />
              <p className="text-slate-200 text-lg font-light leading-relaxed whitespace-pre-line">
                {q.text.split(q.highlight).map((part, j, arr) =>
                  j < arr.length - 1 ? (
                    <span key={j}>{part}<span className="text-paradox-magenta font-semibold">{q.highlight}</span></span>
                  ) : part
                )}
              </p>
            </motion.blockquote>
          ))}
        </div>

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
