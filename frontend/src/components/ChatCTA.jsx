import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Lock, Flame, TrendingUp, Swords } from "lucide-react";

const provocation = [
  { icon: <TrendingUp size={16} />, text: "Drop your price prediction. Stake your reputation." },
  { icon: <Flame size={16} />,      text: "Burners don't talk — they act. Prove it." },
  { icon: <Swords size={16} />,     text: "Hoarders vs Burners vs Exits. The war is on-chain." },
  { icon: <Lock size={16} />,       text: "Your words. Immutable. Forever on Polygon." },
];

export default function ChatCTA() {
  const { isConnected } = useAccount();
  if (isConnected) return null;

  return (
    <section className="px-6 pb-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-900/30 via-paradox-deep to-pink-900/20 p-8"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-pink-600/10 pointer-events-none" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-20 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Left: headline */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-3 py-1 mb-4">
                <Lock size={12} className="text-pink-400" />
                <span className="text-xs font-mono text-pink-400 uppercase tracking-widest">Permanent Record</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
                Your words,{" "}
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  locked on-chain
                </span>{" "}
                forever.
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                Connect your wallet and enter the arena. Drop predictions, call out other factions,
                declare your conviction — then optionally inscribe it permanently onto the Polygon blockchain.
                No edits. No deletes. <span className="text-slate-200 font-medium">The experiment lives forever.</span>
              </p>
            </div>

            {/* Right: provocations + connect */}
            <div className="flex flex-col items-center gap-5 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {provocation.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-3 max-w-[170px]">
                    <span className="text-violet-400 mt-0.5 flex-shrink-0">{p.icon}</span>
                    <span className="text-slate-300 leading-snug">{p.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-2">
                <w3m-button balance="hide" />
                <span className="text-xs text-slate-600 font-mono">No account. Just your wallet.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
