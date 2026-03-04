import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Custom renderers for styled markdown inside the dark modal
const components = {
  h1: ({ children }) => (
    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 mt-8 first:mt-0 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-black text-white mt-10 mb-3 pb-2 border-b border-white/10">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-paradox-lavender mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-bold text-slate-300 mt-4 mb-1">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-slate-300 leading-relaxed mb-4 text-sm">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-purple-300 not-italic font-medium">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-paradox-magenta pl-4 my-4 text-purple-200 italic bg-purple-900/10 py-2 pr-4 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="font-mono text-xs bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded">
        {children}
      </code>
    ) : (
      <pre className="bg-slate-900 border border-white/10 rounded-xl p-4 overflow-x-auto my-4">
        <code className="font-mono text-xs text-slate-300 whitespace-pre">{children}</code>
      </pre>
    ),
  ul: ({ children }) => (
    <ul className="list-none space-y-1 mb-4 ml-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-4 text-slate-300 text-sm">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-sm text-slate-300">
      <span className="text-paradox-magenta mt-1 flex-shrink-0">›</span>
      <span>{children}</span>
    </li>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer"
      className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
      {children}
    </a>
  ),
  hr: () => <hr className="border-white/10 my-8" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-white/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800/80">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/5">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-slate-300 text-xs font-mono">{children}</td>
  ),
};

export default function WhitepaperModal({ open, onClose }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch markdown on first open
  useEffect(() => {
    if (!open || content) return;
    setLoading(true);
    fetch("/whitepaper.md")
      .then(r => r.text())
      .then(t => { setContent(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  // Close on Escape
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);
  useEffect(() => {
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[101] flex items-start justify-center p-4 md:p-8 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,6,25,0.97)", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 0 80px rgba(139,92,246,0.15), 0 30px 60px rgba(0,0,0,0.8)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center border border-purple-700/40">
                    <FileText size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">PARADOX Whitepaper</h2>
                    <p className="text-slate-500 text-xs font-mono">Version 2.0 — March 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/paradox-whitepaper.pdf"
                    download="PARADOX-Whitepaper.pdf"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-violet-300 hover:text-white transition-colors glass rounded-lg px-3 py-1.5 border border-violet-500/30 hover:border-violet-400"
                  >
                    <Download size={12} />
                    PDF
                  </a>
                  <a
                    href="/whitepaper.md"
                    download="PARADOX-Whitepaper.md"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors glass rounded-lg px-3 py-1.5"
                  >
                    <Download size={12} />
                    Markdown
                  </a>
                  <a
                    href="https://polygonscan.com/address/0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09"
                    target="_blank" rel="noreferrer"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors glass rounded-lg px-3 py-1.5"
                  >
                    <ExternalLink size={12} />
                    Polygonscan
                  </a>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* TOC pill row */}
              <div className="flex-shrink-0 px-6 py-3 border-b border-white/5 overflow-x-auto">
                <div className="flex gap-2 whitespace-nowrap text-xs font-mono">
                  {["Abstract","Mechanics","CCI","Tokenomics","NFTs","Governance","Security","Theory","Risks","Roadmap"].map((label, i) => (
                    <span key={label} className="glass rounded-full px-3 py-1 text-purple-400 border border-purple-900/40 cursor-default select-none">
                      {String(i + 1).padStart(2,"0")} {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {content}
                  </ReactMarkdown>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-slate-600 font-mono">paradox.d31337m3.com</p>
                <p className="text-xs text-slate-600">Not financial advice. Experimental infrastructure.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
