import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateNFTSVG } from "../utils/nftSVGGenerator";

// Curated samples — one per tier, chosen for visual variety
const SAMPLES = [
  { tokenId: 7,   amountBurnedWei: "5200000000000000000000000",  epoch: 1, label: "Diamond",  hint: "5.2M PDX burned"  },
  { tokenId: 23,  amountBurnedWei: "820000000000000000000000",   epoch: 0, label: "Gold",     hint: "820K PDX burned"  },
  { tokenId: 41,  amountBurnedWei: "75000000000000000000000",    epoch: 2, label: "Silver",   hint: "75K PDX burned"   },
  { tokenId: 88,  amountBurnedWei: "12000000000000000000000",    epoch: 0, label: "Bronze",   hint: "12K PDX burned"   },
];

function NFTCard({ sample, index }) {
  const [nft, setNft] = useState(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    try {
      const result = generateNFTSVG(sample.tokenId, sample.amountBurnedWei, sample.epoch);
      setNft(result);
    } catch (e) {
      console.error("NFT generate error", e);
    }
  }, [sample]);

  if (!nft) return (
    <div className="aspect-square rounded-2xl bg-paradox-card animate-pulse flex items-center justify-center">
      <span className="text-slate-600 font-mono text-xs">generating...</span>
    </div>
  );

  const svgDataUrl = `data:image/svg+xml;base64,${btoa(nft.svg)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.55, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-default"
    >
      {/* Glow layer */}
      <div
        className="absolute inset-0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{ background: nft.color }}
      />

      {/* Card */}
      <motion.div
        animate={{ rotateY: hovered ? 4 : 0, rotateX: hovered ? -3 : 0, scale: hovered ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${nft.color}33` }}
      >
        <img
          src={svgDataUrl}
          alt={`${nft.name} NFT`}
          className="w-full block"
          draggable={false}
        />

        {/* Overlay on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm"
            >
              <span
                className="font-mono font-black text-xl tracking-widest"
                style={{ color: nft.color }}
              >
                {nft.name}
              </span>
              <span className="text-white font-mono text-sm">{sample.hint}</span>
              <span className="text-slate-400 font-mono text-xs">Epoch {sample.epoch}</span>
              <div className="flex gap-4 mt-1">
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Rep Score</p>
                  <p className="font-mono font-bold text-sm" style={{ color: nft.color }}>{nft.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Token ID</p>
                  <p className="font-mono font-bold text-sm" style={{ color: nft.color }}>#{sample.tokenId}</p>
                </div>
              </div>
              <span className="text-slate-600 text-xs font-mono mt-1">100% on-chain</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function NFTPreviews() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-paradox-deep" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">On-Chain Art</span>
          <h2 className="text-3xl md:text-4xl font-black mt-3 text-white">
            Every burn mints a <span className="text-paradox-magenta">unique fingerprint</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            These are live renders — the exact SVG your wallet would receive.
            Nine orbital rings shaped by <span className="text-white">keccak256(tokenId + amount + epoch)</span>.
            No two are alike. No IPFS. No metadata server. Just math.
          </p>
        </motion.div>

        {/* NFT Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {SAMPLES.map((s, i) => (
            <NFTCard key={s.tokenId} sample={s} index={i} />
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center"
        >
          {[
            { icon: "🔒", label: "Soulbound", sub: "Non-transferable forever" },
            { icon: "⛓️", label: "Fully On-Chain", sub: "SVG stored in contract bytecode" },
            { icon: "📐", label: "Deterministic", sub: "Same inputs = same image" },
            { icon: "🐋", label: "Whale-resistant", sub: "sqrt() scoring + epoch caps" },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-xl">{f.icon}</span>
              <div className="text-left">
                <p className="text-white text-xs font-bold font-mono">{f.label}</p>
                <p className="text-slate-500 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
