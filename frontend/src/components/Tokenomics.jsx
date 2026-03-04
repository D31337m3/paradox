import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "Fair Launch Liquidity", value: 50, color: "#8b5cf6", desc: "500,000,000 PDX — immediately paired in LP at deployment." },
  { name: "Epoch Reward Reserve",  value: 20, color: "#a78bfa", desc: "200,000,000 PDX — distributed by EpochControllerV2 via CCI mechanics over time." },
  { name: "Dev Allocation",        value: 15, color: "#ec4899", desc: "150,000,000 PDX — 24-month linear vesting, locked in TokenVesting contract." },
  { name: "DAO Treasury",          value: 10, color: "#22d3ee", desc: "100,000,000 PDX — governance-controlled multisig treasury." },
  { name: "Ecosystem Grants",      value:  5, color: "#f59e0b", desc:  "50,000,000 PDX — experimental module grants & ecosystem partnerships." },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass rounded-xl p-4 max-w-[200px]">
      <p className="font-semibold text-white text-sm mb-1">{d.name}</p>
      <p className="text-2xl font-black font-mono" style={{ color: d.color }}>{d.value}%</p>
      <p className="text-xs text-slate-400 mt-1">{d.desc}</p>
    </div>
  );
};

export default function Tokenomics() {
  return (
    <section id="tokenomics" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-paradox-black" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-16"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">Supply & Allocation</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 text-white">
            Token<span className="text-paradox-lavender">omics</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Total Supply: <span className="text-white font-mono font-bold">1,000,000,000 PDX</span> — minted once. No future minting.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Pie chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="h-[380px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={140}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Breakdown list */}
          <div className="space-y-4">
            {data.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                className="glass rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{d.name}</span>
                    <span className="text-sm font-mono font-bold ml-2" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-paradox-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${d.value}%` }}
                      viewport={{ once: true }} transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{d.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="mt-12 glass rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
        >
          {[
            { icon: "🚫", label: "No Transaction Tax",  desc: "Zero tax on transfers, buys, or sells." },
            { icon: "🔒", label: "No Hidden Mint",      desc: "Max supply fixed at 1B. Contract verified." },
            { icon: "⛔", label: "No Blacklist Logic",  desc: "No address can be blocked from transacting." },
          ].map(g => (
            <div key={g.label}>
              <div className="text-3xl mb-2">{g.icon}</div>
              <p className="font-semibold text-white text-sm mb-1">{g.label}</p>
              <p className="text-xs text-slate-400">{g.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
