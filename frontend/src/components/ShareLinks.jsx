import { motion } from "framer-motion";

const SITE_URL = "https://paradox.d31337m3.com";
const TOKEN_ADDRESS = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";

const SHARE_TEXT = `🔮 PARADOX (PDX) — A Behavioral Liquidity Experiment on Polygon

Instead of rewarding passive holding, PARADOX introduces recurring decision epochs where participants choose to:
🔒 HOARD — Lock tokens, earn yield
🔥 BURN — Destroy tokens, earn reputation NFTs
🌊 EXIT — Stay liquid, no penalty

The economy self-adjusts. Not by decree. By behavior.

1B supply. No taxes. No hidden mint. Fully on-chain.

${SITE_URL}`;

const TWITTER_TEXT = `🔮 PARADOX ($PDX) — A Behavioral Liquidity Experiment on Polygon

HOARD 🔒 | BURN 🔥 | EXIT 🌊

The economy self-adjusts. Not by decree. By behavior.

1B supply. No taxes. No hidden mint. Fully on-chain & verified.

👉 ${SITE_URL}

#PDX #Polygon #DeFi #Crypto`;

const REDDIT_TITLE = `PARADOX (PDX) — A Behavioral Liquidity Experiment on Polygon | Hoard, Burn, or Exit`;
const REDDIT_TEXT = `**PARADOX** is a decentralized social experiment exploring how voluntary economic sacrifice, delayed gratification, and exit behavior influence token economies over time.

**How it works:**
- 🔒 **HOARD** — Lock tokens for the epoch. Earn governance weight + base yield.
- 🔥 **BURN** — Permanently destroy tokens. Receive multiplier rewards + non-transferable reputation NFT.
- 🌊 **EXIT** — Stay liquid. No reward boost, no penalty. Freedom preserved.

**Collective Conviction Index (CCI)** dynamically adjusts emissions based on community behavior. High conviction = scarcity. Low conviction = more incentives. The economy self-regulates.

**Tokenomics:**
- 1,000,000,000 PDX total supply
- 50% Fair launch liquidity
- 20% Epoch reward reserve
- 15% Dev (24-month vesting)
- No taxes, no hidden mint, no blacklist

**Contracts verified on Sourcify (Polygon Mainnet)**
Token: \`${TOKEN_ADDRESS}\`

**Links:** ${SITE_URL}`;

const EMAIL_SUBJECT = "PARADOX (PDX) — A Behavioral Liquidity Experiment on Polygon";
const EMAIL_BODY = `Hi,

I wanted to share something interesting with you — PARADOX (PDX), a behavioral liquidity experiment running on the Polygon blockchain.

Instead of rewarding passive holding or speculation, PARADOX runs 30-day epochs where every participant must choose:

🔒 HOARD — Lock your tokens and earn yield + governance weight
🔥 BURN — Permanently destroy tokens, earn reputation NFTs that can't be bought
🌊 EXIT — Stay liquid with no penalties

The Collective Conviction Index (CCI) measures how much of the supply is being locked or burned, and dynamically adjusts the emission rate. The economy self-adjusts — not by decree, but by behavior.

1 billion total supply. No transaction taxes. No hidden mint. No blacklist. Everything is on-chain and verified.

Check it out: ${SITE_URL}

Contract: ${TOKEN_ADDRESS} (Polygon Mainnet, verified on Sourcify)`;

const shares = [
  {
    name: "Twitter",
    color: "hover:bg-sky-500/20 hover:border-sky-500 hover:text-sky-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(TWITTER_TEXT)}`,
  },
  {
    name: "Reddit",
    color: "hover:bg-orange-500/20 hover:border-orange-500 hover:text-orange-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    href: `https://www.reddit.com/submit?url=${encodeURIComponent(SITE_URL)}&title=${encodeURIComponent(REDDIT_TITLE)}&text=${encodeURIComponent(REDDIT_TEXT)}`,
  },
  {
    name: "Facebook",
    color: "hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`,
  },
  {
    name: "Email",
    color: "hover:bg-purple-500/20 hover:border-purple-500 hover:text-purple-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    href: `mailto:?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`,
  },
];

export default function ShareLinks() {
  const copyLink = () => {
    navigator.clipboard.writeText(SITE_URL).then(() => {
      const el = document.getElementById("copy-confirm");
      if (el) { el.style.opacity = "1"; setTimeout(() => { el.style.opacity = "0"; }, 2000); }
    });
  };

  return (
    <section id="share" className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-black tracking-tight text-white mb-3">
            Spread the <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Paradox</span>
          </h2>
          <p className="text-slate-400 mb-10 text-sm">
            Share PARADOX with your community. Value emerges from coordinated belief.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {shares.map((s, i) => (
              <motion.a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 glass border border-white/10 text-slate-300 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${s.color}`}
              >
                {s.icon}
                {s.name}
              </motion.a>
            ))}

            {/* Copy link button */}
            <motion.button
              onClick={copyLink}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 glass border border-white/10 text-slate-300 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 hover:bg-green-500/20 hover:border-green-500 hover:text-green-400 relative"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Link
              <span
                id="copy-confirm"
                style={{ opacity: 0, transition: "opacity 0.3s" }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs rounded px-2 py-1 whitespace-nowrap"
              >
                Copied!
              </span>
            </motion.button>
          </div>

          {/* URL display */}
          <div className="glass border border-white/10 rounded-xl px-4 py-3 inline-flex items-center gap-3 text-sm font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            {SITE_URL}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
