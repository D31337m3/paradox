import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ExternalLink, FileText } from "lucide-react";
import { CONTRACT_ADDRESSES, BLOCK_EXPLORER } from "../contracts/addresses.js";
import { APP_VERSION } from "../version.js";

const NAV_TABS = [
  { label: "Overview",    tab: "overview"    },
  { label: "Participate", tab: "participate" },
  { label: "NFTs",        tab: "nfts"        },
  { label: "Trade",       tab: "trade"       },
  { label: "Community",   tab: "community"   },
];

export default function Navbar({ onOpenWhitepaper, activeTab, onTabChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const polygonscanUrl = CONTRACT_ADDRESSES.ParadoxToken !== "0x0000000000000000000000000000000000000000"
    ? `${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESSES.ParadoxToken}`
    : null;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-paradox-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => onTabChange?.("overview")} className="flex items-center gap-2">
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-black tracking-tighter text-white text-glow">
              PARA<span className="text-paradox-magenta">DOX</span>
            </span>
            <span className="text-[9px] font-mono text-slate-600 tracking-widest mt-0.5">v{APP_VERSION}</span>
          </div>
          <span className="hidden sm:block text-xs text-purple-400 font-mono border border-purple-700/50 rounded px-2 py-0.5">
            POLYGON
          </span>
        </button>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-4">
          {polygonscanUrl && (
            <a href={polygonscanUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-mono transition-colors">
              Contract <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={onOpenWhitepaper}
            className="flex items-center gap-1.5 text-xs font-mono text-pink-400 hover:text-pink-300 glass rounded-lg px-3 py-1.5 border border-pink-900/40 hover:border-pink-700/60 transition-all"
          >
            <FileText size={12} />
            Whitepaper
          </button>
          <w3m-button size="sm" balance="hide" />
        </div>

        {/* Mobile right: wallet + burger */}
        <div className="md:hidden flex items-center gap-3">
          <w3m-button size="sm" balance="hide" />
          <button className="text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-paradox-border"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {NAV_TABS.map(t => (
                <button key={t.tab}
                  onClick={() => { onTabChange?.(t.tab); setMenuOpen(false); }}
                  className="text-left text-slate-300 hover:text-white py-1 text-sm font-medium">
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => { setMenuOpen(false); onOpenWhitepaper(); }}
                className="text-left text-pink-400 hover:text-pink-300 py-1 text-sm font-mono flex items-center gap-2"
              >
                <FileText size={14} /> Whitepaper
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

