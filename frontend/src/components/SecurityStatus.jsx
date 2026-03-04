import { ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const MULTISIG   = "0xfed787784C3C3f7101B46f06A847CB5D60Fa6166";
const SOURCIFY   = "https://repo.sourcify.dev/137/0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";
const POLYSCAN   = "https://polygonscan.com/address/";

const checks = [
  {
    label: "PDX Token",
    status: "Ownership Renounced",
    detail: "Owner = address(0) · No mint · No pause · Immutable",
    href: "https://polygonscan.com/tx/0x8a8282b7a4e9569e39401bcc9e361f9676eab711bf6ec0a01ae1205143060d65",
    color: "text-green-400",
    badge: "bg-green-500/10 border-green-500/30",
  },
  {
    label: "EpochController",
    status: "DAO Multisig (2-of-2)",
    detail: `${MULTISIG.slice(0,10)}…${MULTISIG.slice(-6)} · Requires 2 hardware keys`,
    href: "https://polygonscan.com/tx/0xe32008e0d8b6a5a23927759ddd63a4630338bea6e3a3fd77e582926f945cba15",
    color: "text-violet-400",
    badge: "bg-violet-500/10 border-violet-500/30",
  },
  {
    label: "Burn NFT",
    status: "DAO Multisig (2-of-2)",
    detail: `${MULTISIG.slice(0,10)}…${MULTISIG.slice(-6)} · Requires 2 hardware keys`,
    href: "https://polygonscan.com/tx/0xdc42964de1bec4c6e57531604f7e84c6723a18d47bde440ce2a0b76b29f6d860",
    color: "text-violet-400",
    badge: "bg-violet-500/10 border-violet-500/30",
  },
  {
    label: "Source Code",
    status: "Verified on Sourcify",
    detail: "Chain 137 · Independently verifiable · Open source",
    href: SOURCIFY,
    color: "text-cyan-400",
    badge: "bg-cyan-500/10 border-cyan-500/30",
  },
];

export default function SecurityStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="px-6 pb-4"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} className="text-green-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-green-400">Security Status</span>
          <div className="flex-1 h-px bg-green-500/15" />
          <span className="text-[10px] font-mono text-slate-600">Q1 2026 · On-chain verified</span>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          {checks.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 ${c.badge} hover:brightness-125 transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{c.label}</span>
                <ExternalLink size={10} className="text-slate-600" />
              </div>
              <span className={`text-xs font-semibold ${c.color}`}>{c.status}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{c.detail}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
