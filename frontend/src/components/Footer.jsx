import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { BLOCK_EXPLORER, CONTRACT_ADDRESSES } from "../contracts/addresses.js";

export default function Footer() {
  const isDeployed = CONTRACT_ADDRESSES.ParadoxToken !== "0x0000000000000000000000000000000000000000";

  return (
    <footer className="relative py-16 px-6 border-t border-paradox-border">
      <div className="absolute inset-0 bg-paradox-deep" />
      <div className="relative max-w-7xl mx-auto">

        {/* Risk disclaimer */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 mb-10 border-amber-800/30 bg-amber-900/5"
        >
          <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-3">⚠️ Risk Disclosure</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            PARADOX is experimental infrastructure. Participants must understand: token value may decline.
            Burns are irreversible. Governance may evolve parameters. Speculative volatility is possible.
            PARADOX is <strong className="text-white">not financial advice</strong>. It is not a promise of profit or returns.
            Independent audit is recommended prior to significant participation. Interact only with the official
            {isDeployed
              ? <a href={`${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESSES.ParadoxToken}`} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 mx-1 inline-flex items-center gap-1">verified contract<ExternalLink size={10}/></a>
              : " verified contract (address pending deployment) "
            }.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="text-3xl font-black tracking-tighter text-white mb-3">
              PARA<span className="text-paradox-magenta">DOX</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              A behavioral liquidity experiment on Polygon. Value emerges from coordinated belief under constraint.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-4">Protocol</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#stats"      className="hover:text-white transition-colors">Live Stats</a></li>
              <li><a href="#epochs"     className="hover:text-white transition-colors">Epoch System</a></li>
              <li><a href="#manifesto"  className="hover:text-white transition-colors">Manifesto</a></li>
              <li><a href="#tokenomics" className="hover:text-white transition-colors">Tokenomics</a></li>
              <li><a href="#nfts"       className="hover:text-white transition-colors">Burn NFTs</a></li>
              <li><a href="#trade"      className="hover:text-white transition-colors">Trade</a></li>
            </ul>
          </div>

          {/* On-chain */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-4">On-Chain</p>
            <ul className="space-y-2 text-sm text-slate-400">
              {isDeployed ? (
                <>
                  <li>
                    <a href={`${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESSES.ParadoxToken}`} target="_blank" rel="noreferrer"
                      className="hover:text-white flex items-center gap-1">PDX Token <ExternalLink size={11}/></a>
                  </li>
                  <li>
                    <a href={`${BLOCK_EXPLORER}/address/${CONTRACT_ADDRESSES.EpochController}`} target="_blank" rel="noreferrer"
                      className="hover:text-white flex items-center gap-1">EpochController <ExternalLink size={11}/></a>
                  </li>
                  <li>
                    <a href={`${BLOCK_EXPLORER}/address/${CONTRACT_ADDRESSES.BurnReputationNFT}`} target="_blank" rel="noreferrer"
                      className="hover:text-white flex items-center gap-1">BurnReputation NFT <ExternalLink size={11}/></a>
                  </li>
                  <li>
                    <a href={`${BLOCK_EXPLORER}/address/${CONTRACT_ADDRESSES.TokenVesting}`} target="_blank" rel="noreferrer"
                      className="hover:text-white flex items-center gap-1">TokenVesting <ExternalLink size={11}/></a>
                  </li>
                </>
              ) : (
                <li className="text-amber-400/70 text-xs font-mono">Deploying soon — addresses pending</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-paradox-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-mono">PARADOX · Polygon Mainnet · Chain ID 137</p>
          <p className="text-xs text-slate-600">
            Not financial advice. Experimental protocol.
          </p>
        </div>
      </div>
    </footer>
  );
}
