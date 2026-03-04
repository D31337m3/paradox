import { motion } from "framer-motion";
import { ExternalLink, ShoppingCart, Droplets, BarChart3, Code2 } from "lucide-react";
import { CONTRACT_ADDRESSES, BLOCK_EXPLORER, KYBERSWAP_SWAP, QUICKSWAP_LP, UNISWAP_LP, DEXSCREENER, POLYGONSCAN_TOKEN, isDeployed } from "../contracts/addresses.js";

const tokenAddress = CONTRACT_ADDRESSES.ParadoxToken;

const links = [
  {
    icon: <ShoppingCart size={24} />,
    label: "Swap POL for PDX",
    sub: "KyberSwap — Polygon",
    desc: "Swap POL or any token for PDX on KyberSwap with best-rate aggregated routing.",
    color: "from-violet-600/20 to-violet-900/10 border-violet-600/40 hover:border-violet-400",
    accent: "text-violet-300",
    href: isDeployed ? KYBERSWAP_SWAP : "https://kyberswap.com",
    cta: "Trade on KyberSwap",
    extraLinks: null,
  },
  {
    icon: <Droplets size={24} />,
    label: "Add Liquidity",
    sub: "QuickSwap · Uniswap",
    desc: "Provide PDX/POL liquidity and earn trading fees. Choose your preferred DEX.",
    color: "from-cyan-600/20 to-cyan-900/10 border-cyan-600/40 hover:border-cyan-400",
    accent: "text-cyan-300",
    href: isDeployed ? QUICKSWAP_LP : "https://dapp.quickswap.exchange",
    cta: "QuickSwap LP",
    extraLinks: [
      { label: "Uniswap LP", href: isDeployed ? UNISWAP_LP : "https://app.uniswap.org" },
    ],
  },
  {
    icon: <BarChart3 size={24} />,
    label: "Token Analytics",
    sub: "DexScreener",
    desc: "Live price charts, volume, liquidity depth and holder analytics for PDX.",
    color: "from-pink-600/20 to-pink-900/10 border-pink-600/40 hover:border-pink-400",
    accent: "text-pink-300",
    href: isDeployed ? DEXSCREENER : "https://dexscreener.com",
    cta: "View Charts",
    extraLinks: null,
  },
  {
    icon: <Code2 size={24} />,
    label: "Contract",
    sub: "Polygonscan",
    desc: "Verify the on-chain logic. Source code, transactions, holders, and contract interactions.",
    color: "from-amber-600/20 to-amber-900/10 border-amber-600/40 hover:border-amber-400",
    accent: "text-amber-300",
    href: isDeployed ? POLYGONSCAN_TOKEN : BLOCK_EXPLORER,
    cta: "View on Polygonscan",
    extraLinks: null,
  },
];

const walletSteps = [
  { n: "1", label: "Install MetaMask",   desc: "Or any Polygon-compatible wallet (Trust Wallet, Coinbase Wallet)." },
  { n: "2", label: "Add Polygon Network", desc: "Chain ID 137 · RPC: https://polygon-rpc.com · Currency: POL." },
  { n: "3", label: "Get POL for gas",     desc: "Bridge from Ethereum or buy POL directly via on-ramp." },
  { n: "4", label: "Swap for PDX",        desc: "Use KyberSwap or any Polygon DEX. Paste the contract address." },
  { n: "5", label: "Add PDX to wallet",   desc: `Import token: ${isDeployed ? tokenAddress : "(address available after deploy)"}` },
];

export default function TradeLinks() {
  return (
    <section id="trade" className="relative py-24 px-6">
      <div className="absolute inset-0 bg-paradox-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-violet-900/8 blur-[120px] rounded-full" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-16"
        >
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase">Get Involved</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 text-white">
            Trade & <span className="text-paradox-lavender">Liquidity</span>
          </h2>
        </motion.div>

        {/* Link cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {links.map((l, i) => (
            <motion.div
              key={l.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`choice-card bg-gradient-to-br ${l.color} border flex flex-col`}
            >
              <div className={`${l.accent} mb-2`}>{l.icon}</div>
              <div className="font-bold text-white">{l.label}</div>
              <div className={`text-xs font-mono ${l.accent} mb-1`}>{l.sub}</div>
              <p className="text-xs text-slate-400 leading-relaxed flex-1 mb-4">{l.desc}</p>
              {/* Primary CTA */}
              <a
                href={l.href} target="_blank" rel="noreferrer"
                className={`flex items-center gap-1.5 text-xs font-semibold ${l.accent} hover:opacity-80 transition-opacity`}
              >
                {l.cta} <ExternalLink size={12} />
              </a>
              {/* Extra links */}
              {l.extraLinks?.map(ex => (
                <a
                  key={ex.label}
                  href={ex.href} target="_blank" rel="noreferrer"
                  className={`flex items-center gap-1.5 text-xs font-semibold ${l.accent} hover:opacity-80 transition-opacity mt-2`}
                >
                  {ex.label} <ExternalLink size={12} />
                </a>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Contract address display */}
        {isDeployed && (
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <p className="text-xs text-slate-500 font-mono mb-1">PDX Contract Address (Polygon)</p>
              <code className="text-paradox-lavender font-mono text-sm break-all">{tokenAddress}</code>
            </div>
            <a href="https://repo.sourcify.dev/137/0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09" target="_blank" rel="noreferrer"
              className="btn-ghost text-sm whitespace-nowrap flex items-center gap-2">
              Verify Source <ExternalLink size={14} />
            </a>
          </motion.div>
        )}

        {/* How to buy steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-white text-center mb-6">How to Buy PDX</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {walletSteps.map((s, i) => (
              <div key={s.n} className="glass rounded-xl p-4 relative">
                <span className="text-3xl font-black font-mono text-paradox-border">{s.n}</span>
                <p className="font-semibold text-white text-sm mt-2 mb-1">{s.label}</p>
                <p className="text-xs text-slate-400 break-words">{s.desc}</p>
                {i < walletSteps.length - 1 && (
                  <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-paradox-border text-lg">›</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
