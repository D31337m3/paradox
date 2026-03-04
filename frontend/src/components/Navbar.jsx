import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, FileText } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const polygonscanUrl = CONTRACT_ADDRESSES.ParadoxToken !== "0x0000000000000000000000000000000000000000"
    ? `${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESSES.ParadoxToken}`
    : null;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/8"
    >
      <div className="max-w-7xl mx-auto px-4 h-[62px] grid grid-cols-3 items-center gap-2">

        {/* ── LEFT: Logo + Polygon mark ── */}
        <button
          onClick={() => onTabChange?.(activeTab === "overview" ? null : "overview")}
          className="flex items-center gap-2.5 justify-start min-w-0"
        >
          <div className="flex flex-col leading-none shrink-0">
            <span className="text-[1.2rem] font-black tracking-tighter text-white text-glow">
              PARA<span className="text-paradox-magenta">DOX</span>
            </span>
            <span className="text-[8px] font-mono text-slate-600 tracking-widest">v{APP_VERSION}</span>
          </div>
          <img
            src="/polygon-logo.webp"
            alt="Polygon"
            className="hidden sm:block h-[13px] opacity-60 hover:opacity-90 transition-opacity"
          />
        </button>

        {/* ── CENTER: Tab links (desktop) ── */}
        <nav className="hidden md:flex items-center justify-center gap-0.5">
          {NAV_TABS.map(t => (
            <button
              key={t.tab}
              onClick={() => onTabChange?.(activeTab === t.tab ? null : t.tab)}
              className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === t.tab
                  ? "text-white bg-white/8"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
              {activeTab === t.tab && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* ── RIGHT: Live status + whitepaper + wallet ── */}
        <div className="flex items-center justify-end gap-2.5">
          <a
            href={polygonscanUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            Live · Polygon
          </a>

          <button
            onClick={onOpenWhitepaper}
            className="hidden lg:flex items-center gap-1 text-xs font-mono text-pink-400/80 hover:text-pink-300 transition-colors"
          >
            <FileText size={11} />
            Whitepaper
          </button>

          <w3m-button size="sm" balance="hide" />

          {/* Mobile burger */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/8 overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {NAV_TABS.map(t => (
                <button
                  key={t.tab}
                  onClick={() => { onTabChange?.(activeTab === t.tab ? null : t.tab); setMenuOpen(false); }}
                  className={`text-left py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.tab ? "text-white bg-white/8" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="border-t border-white/5 mt-2 pt-3">
                <button
                  onClick={() => { setMenuOpen(false); onOpenWhitepaper(); }}
                  className="text-left text-pink-400 hover:text-pink-300 py-2 text-sm font-mono flex items-center gap-2"
                >
                  <FileText size={13} /> Whitepaper
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
