// Exact JavaScript port of SVGGenerator.sol
// Produces identical output to the on-chain contract for any given inputs.
import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

function u(v) {
  return String(Math.floor(Number(v)));
}

function fmt(n) {
  n = Number(n);
  if (n >= 1_000_000) return `${Math.floor(n / 1_000_000)}M`;
  if (n >= 1_000)     return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

function tierColor(tier) {
  if (tier === 3) return "#00e5ff";
  if (tier === 2) return "#ffd700";
  if (tier === 1) return "#b0b8c8";
  return "#cd7f32";
}

function tierName(tier) {
  if (tier === 3) return "DIAMOND";
  if (tier === 2) return "GOLD";
  if (tier === 1) return "SILVER";
  return "BRONZE";
}

function isqrt(x) {
  if (x === 0n) return 0n;
  let z = (x + 1n) / 2n;
  let y = x;
  while (z < y) { y = z; z = (x / z + z) / 2n; }
  return y;
}

export function calcTier(pdxAmount, silverMin = 50000n, goldMin = 500000n, diamondMin = 5000000n) {
  if (pdxAmount >= diamondMin) return 3;
  if (pdxAmount >= goldMin)    return 2;
  if (pdxAmount >= silverMin)  return 1;
  return 0;
}

export function calcScore(pdxAmount, tier) {
  const base = isqrt(pdxAmount);
  const mults = [1n, 2n, 3n, 4n];
  return base * mults[tier];
}

export function generateNFTSVG(tokenId, amountBurnedWei, epochNumber) {
  const tid = BigInt(tokenId);
  const amt = BigInt(amountBurnedWei);
  const ep  = BigInt(epochNumber);

  const seedHex = keccak256(
    encodeAbiParameters(
      parseAbiParameters("uint256, uint256, uint256"),
      [tid, amt, ep]
    )
  );
  const seedBytes = new Uint8Array(
    seedHex.slice(2).match(/.{2}/g).map(b => parseInt(b, 16))
  );

  const pdx  = amt / BigInt(1e18);
  const tier = calcTier(pdx);
  const score = calcScore(pdx, tier);
  const c = tierColor(tier);
  const t = tierName(tier);

  // 9 fingerprint ellipses
  let ellipses = "";
  for (let i = 0; i < 9; i++) {
    const b0  = seedBytes[i * 3];
    const b1  = seedBytes[i * 3 + 1];
    const b2  = seedBytes[i * 3 + 2];
    const rx  = 18 + i * 18 + (b0 % 14);
    const ry  = Math.floor(rx * (48 + b1 % 40) / 100);
    const rot = Math.floor(b2 * 179 / 255);
    const op  = 70 - i * 7;
    ellipses += `<ellipse cx="250" cy="205" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="1.3" opacity="0.${op}" transform="rotate(${rot} 250 205)"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
<defs>
  <radialGradient id="bg${tokenId}" cx="50%" cy="42%" r="62%">
    <stop offset="0%" stop-color="#0f0f2e"/>
    <stop offset="100%" stop-color="#040408"/>
  </radialGradient>
  <filter id="gw${tokenId}" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <pattern id="dots${tokenId}" width="20" height="20" patternUnits="userSpaceOnUse">
    <circle cx="10" cy="10" r="0.7" fill="#fff" opacity="0.07"/>
  </pattern>
  <clipPath id="fp${tokenId}"><rect x="8" y="8" width="484" height="358"/></clipPath>
</defs>
<rect width="500" height="500" fill="url(#bg${tokenId})"/>
<rect width="500" height="500" fill="url(#dots${tokenId})"/>
<rect x="3" y="3" width="494" height="494" rx="16" fill="none" stroke="${c}" stroke-width="2" opacity="0.55"/>
<rect x="7" y="7" width="486" height="486" rx="13" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.18"/>
<g clip-path="url(#fp${tokenId})">${ellipses}</g>
<circle cx="250" cy="205" r="3" fill="${c}" filter="url(#gw${tokenId})"/>
<circle cx="250" cy="205" r="8" fill="none" stroke="${c}" stroke-width="0.9" opacity="0.45"/>
<g transform="translate(416,16)" opacity="0.93">
  <polygon points="28,0 56,16 56,48 28,64 0,48 0,16" fill="#8247E5" fill-opacity="0.15" stroke="#8247E5" stroke-width="2.5"/>
  <polygon points="28,14 43,23 43,41 28,50 13,41 13,23" fill="#8247E5" fill-opacity="0.28"/>
  <text x="28" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#8247E5">P</text>
  <text x="28" y="78" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.5" fill="#8247E5" letter-spacing="2" opacity="0.85">POLYGON</text>
</g>
<line x1="30" y1="376" x2="470" y2="376" stroke="${c}" stroke-width="0.7" opacity="0.4"/>
<text x="250" y="412" text-anchor="middle" font-family="Courier New,monospace" font-size="30" font-weight="bold" fill="white" letter-spacing="10" filter="url(#gw${tokenId})">PARADOX</text>
<text x="250" y="428" text-anchor="middle" font-family="Courier New,monospace" font-size="8.5" fill="${c}" letter-spacing="4">BURN REPUTATION NFT</text>
<rect x="178" y="435" width="144" height="23" rx="11.5" fill="${c}" fill-opacity="0.12"/>
<rect x="178" y="435" width="144" height="23" rx="11.5" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.65"/>
<text x="250" y="451" text-anchor="middle" font-family="Courier New,monospace" font-size="11" font-weight="bold" fill="${c}" letter-spacing="4">${t}</text>
<line x1="30" y1="464" x2="470" y2="464" stroke="${c}" stroke-width="0.4" opacity="0.2"/>
<text x="83" y="477" text-anchor="middle" font-family="Courier New,monospace" font-size="7" fill="#666" letter-spacing="1">EPOCH</text>
<text x="83" y="491" text-anchor="middle" font-family="Courier New,monospace" font-size="11" font-weight="bold" fill="${c}">${u(ep)}</text>
<text x="250" y="477" text-anchor="middle" font-family="Courier New,monospace" font-size="7" fill="#666" letter-spacing="1">PDX BURNED</text>
<text x="250" y="491" text-anchor="middle" font-family="Courier New,monospace" font-size="11" font-weight="bold" fill="${c}">${fmt(pdx)}</text>
<text x="417" y="477" text-anchor="middle" font-family="Courier New,monospace" font-size="7" fill="#666" letter-spacing="1">REP SCORE</text>
<text x="417" y="491" text-anchor="middle" font-family="Courier New,monospace" font-size="11" font-weight="bold" fill="${c}">${u(score)}</text>
<text x="250" y="499" text-anchor="middle" font-family="Courier New,monospace" font-size="9" fill="#555" letter-spacing="2">PDX-REP #${tokenId}</text>
</svg>`;

  return { svg, tier, score: score.toString(), pdx: pdx.toString(), color: c, name: t };
}
