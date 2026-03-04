import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { APP_VERSION } from "../version.js";

const TITLES = {
  overview:    { label: "Overview",    icon: "◈" },
  participate: { label: "Participate", icon: "⬡" },
  nfts:        { label: "NFTs",        icon: "◆" },
  trade:       { label: "Trade",       icon: "⟠" },
  community:   { label: "Community",   icon: "⬡" },
};

export default function PanelWindow({ id, onClose, children }) {
  const meta = TITLES[id] ?? { label: id, icon: "◈" };
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <AnimatePresence>
      {/*
        Centering is handled by flexbox on the backdrop — completely
        independent of framer-motion's transform animations on the panel.
        This fixes the "bottom-right" bug where framer's inline
        `transform: translateY(24px)` was overwriting Tailwind's
        `-translate-x-1/2 -translate-y-1/2` CSS classes.
      */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        {/* Panel — framer animates scale/opacity/y only, never touches centering */}
        <motion.div
          key="panel"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="relative z-[60] flex flex-col w-full max-w-5xl max-h-[88vh] rounded-2xl bg-[#0d0d14]/95 border border-white/10 shadow-2xl shadow-black/60"
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors"
                  title="Close"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              <span className="text-xs font-mono text-slate-500 tracking-widest ml-2">
                {meta.icon} PARADOX — {meta.label.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-300 transition-colors rounded-lg p-1 hover:bg-white/5"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            data-panel="true"
            className="overflow-y-auto overscroll-contain flex-1 scroll-smooth"
          >
            {children}
          </div>

          {/* Slim footer strip */}
          <div className="shrink-0 flex items-center justify-between px-5 py-2 border-t border-white/5 text-[10px] font-mono text-slate-700">
            <span>PARADOX v{APP_VERSION} · Polygon Mainnet · Chain ID 137</span>
            <span className="hidden sm:block">Not financial advice. Experimental protocol.</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

