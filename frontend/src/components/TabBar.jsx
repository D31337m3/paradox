import { motion } from "framer-motion";

const TABS = [
  { id: "overview",    label: "Overview",    icon: "◈" },
  { id: "participate", label: "Participate", icon: "⬡" },
  { id: "nfts",        label: "NFTs",        icon: "◆" },
  { id: "trade",       label: "Trade",       icon: "⟠" },
  { id: "community",   label: "Community",   icon: "⬡" },
];

export { TABS };

export default function TabBar({ active, onChange }) {
  return (
    <div className="fixed top-[65px] left-0 right-0 z-40 glass border-b border-paradox-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              active === tab.id
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="hidden sm:inline text-base leading-none">{tab.icon}</span>
            {tab.label}
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
