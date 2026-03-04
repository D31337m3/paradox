/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paradox: {
          black:   "#030309",
          deep:    "#0a0715",
          card:    "#100b24",
          border:  "#2d1f4e",
          purple:  "#8b5cf6",
          violet:  "#7c3aed",
          lavender:"#a78bfa",
          pink:    "#ec4899",
          magenta: "#e879f9",
          cyan:    "#22d3ee",
          gold:    "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow":    "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":     "spin 8s linear infinite",
        "float":         "float 6s ease-in-out infinite",
        "glow":          "glow 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139,92,246,0.3)" },
          "50%":      { boxShadow: "0 0 50px rgba(139,92,246,0.8)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)",
        "radial-purple": "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)",
      },
      backgroundSize: {
        "grid": "60px 60px",
      },
    },
  },
  plugins: [],
};
