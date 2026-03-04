import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const TITLES = {
  overview:    { label: "Overview",    icon: "◈" },
  participate: { label: "Participate", icon: "⬡" },
  nfts:        { label: "NFTs",        icon: "◆" },
  trade:       { label: "Trade",       icon: "⟠" },
  community:   { label: "Community",   icon: "⬡" },
};

export default function PanelWindow({ id, onClose, children }) {
  const meta = TITLES[id] ?? { label: id, icon: "◈" };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel — desktop: centred floating window, mobile: bottom sheet */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className={[
          // Base
          "fixed z-[60] flex flex-col",
          "bg-[#0d0d14]/95 border border-white/10 shadow-2xl shadow-black/60",
          // Desktop: centred window with max size
          "md:top-[80px] md:left-1/2 md:-translate-x-1/2",
          "md:w-[min(92vw,1100px)] md:max-h-[calc(100vh-100px)]",
          "md:rounded-2xl",
          // Mobile: full-width bottom sheet
          "bottom-0 left-0 right-0 max-h-[92vh]",
          "rounded-t-2xl md:rounded-2xl",
        ].join(" ")}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Traffic-light dots */}
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
        <div className="overflow-y-auto overscroll-contain flex-1 scroll-smooth">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
