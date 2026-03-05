import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Typewriter viral question rotator ── */
const QUESTIONS = [
  "If everyone knows a token is worthless…\ncan belief still make it valuable?",
  "What if the act of burning\nwas more valuable than holding?",
  "Can a market measure conviction\nbetter than any institution?",
  "What does it mean to sacrifice\nin a system built on exit?",
];

function ViralQuestion() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const full = QUESTIONS[idx];
    if (typing) {
      if (displayed.length < full.length) {
        const t = setTimeout(() => setDisplayed(full.slice(0, displayed.length + 1)), 28);
        return () => clearTimeout(t);
      } else {
        // Pause then erase
        const t = setTimeout(() => setTyping(false), 2800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 12);
        return () => clearTimeout(t);
      } else {
        setIdx(i => (i + 1) % QUESTIONS.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, idx]);

  const lines = displayed.split("\n");
  return (
    <div className="text-center min-h-[3.5rem] flex flex-col items-center justify-center mb-8">
      {lines.map((line, i) => (
        <p key={i} className={`font-light leading-relaxed ${
          i === 0 ? "text-slate-300 text-base md:text-lg" : "text-paradox-magenta text-base md:text-lg font-medium"
        }`}>
          {line}
          {i === lines.length - 1 && (
            <span className="inline-block w-[2px] h-[1em] bg-paradox-magenta ml-[2px] align-middle animate-pulse" />
          )}
        </p>
      ))}
    </div>
  );
}

/* ── Particle canvas ── */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const COUNT = 200;
    const COLORS = [
      [139, 92, 246],   // violet
      [217, 70, 239],   // magenta/pink
      [99, 179, 237],   // cyan
      [167, 139, 250],  // lavender
      [236, 72, 153],   // hot pink
    ];
    const pts = Array.from({ length: COUNT }, () => {
      const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.7 + 0.2,
        da: (Math.random() - 0.5) * 0.008,  // alpha drift for twinkle
        cr: r, cg: g, cb: b,
      };
    });

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        // twinkle
        p.a += p.da;
        if (p.a > 0.9 || p.a < 0.1) p.da *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.a})`;
        ctx.fill();
      });
      // draw connection lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${pts[i].cr},${pts[i].cg},${pts[i].cb},${(1 - dist / 150) * 0.18})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />;
}

const taglines = [
  "The Market That Knows It's A Market.",
  "Belief, measured. Conviction, on-chain.",
];

export default function Hero({ onOpenWhitepaper, onOpenPanel }) {
  return (
    <section id="top" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-[62px]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-paradox-black" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
      <div className="absolute inset-0 bg-radial-purple" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[120px]" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-pink-900/10 blur-[80px]" />
      <Particles />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(4rem,14vw,11rem)] font-black tracking-tighter leading-none mb-6"
        >
          <span className="text-white text-glow">PARA</span>
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent text-glow-pink">
            DOX
          </span>
        </motion.h1>

        {/* Taglines */}
        <div className="flex flex-col gap-1 mb-6">
          {taglines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + i * 0.25, duration: 0.8 }}
              className={`font-light ${
                i === 0
                  ? "text-xl md:text-2xl text-slate-200 font-medium tracking-tight"
                  : "text-sm md:text-base text-purple-400 font-mono tracking-widest uppercase"
              }`}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Viral rotating question */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1.0 }}
        >
          <ViralQuestion />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button onClick={() => onOpenPanel?.("trade")} className="btn-primary">Trade PDX</button>
          <button onClick={() => onOpenPanel?.("participate")} className="btn-ghost">How Epochs Work</button>
          <button onClick={() => onOpenPanel?.("overview")} className="btn-ghost">Read Manifesto</button>
          <button
            onClick={onOpenWhitepaper}
            className="flex items-center gap-2 text-sm font-mono text-pink-400 hover:text-pink-300 glass rounded-xl px-5 py-2.5 border border-pink-900/40 hover:border-pink-600/60 transition-all"
          >
            📄 Whitepaper
          </button>
        </motion.div>

        {/* Three pillars */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 0.9 }}
          className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { label: "HOARD", color: "text-purple-400", icon: "🔒", hover: "hover:border-violet-500 hover:bg-violet-500/10", panel: "participate" },
            { label: "BURN",  color: "text-pink-400",   icon: "🔥", hover: "hover:border-pink-500 hover:bg-pink-500/10",   panel: "participate" },
            { label: "EXIT",  color: "text-cyan-400",   icon: "🌊", hover: "hover:border-cyan-500 hover:bg-cyan-500/10",   panel: "participate" },
          ].map(p => (
            <button key={p.label} onClick={() => onOpenPanel?.(p.panel)}
              className={`glass rounded-xl p-4 text-center border border-white/5 transition-all duration-200 cursor-pointer ${p.hover}`}>
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className={`text-xs font-mono font-bold tracking-widest ${p.color}`}>{p.label}</div>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
