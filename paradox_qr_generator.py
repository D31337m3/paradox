#!/usr/bin/env python3
"""
PARADOX QR Code Generator
==========================
Generates styled SVG (+ PNG) QR codes matching the PARADOX NFT aesthetic.

Outputs:
  • 3 data targets × 7 color themes = 21 SVGs
  • PNG exports for each (via cairosvg)
  • A 4-up preview sheet per theme

Data targets:
  1. Website       — https://paradox.d31337m3.com
  2. Token address — 0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09
  3. PolygonScan   — https://polygonscan.com/token/0x4F70...

Usage:
  python3 paradox_qr_generator.py [output_dir]
"""

import math
import os
import sys
import colorsys
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

WEBSITE_URL    = "https://paradox.d31337m3.com"
TOKEN_ADDRESS  = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09"
POLYGONSCAN    = f"https://polygonscan.com/token/{TOKEN_ADDRESS}"

OUTPUT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/root/paradox_qr_codes")

CANVAS_W = 560
CANVAS_H = 690
QR_SIZE  = 400   # display pixels for QR code area

# ── Color themes ──────────────────────────────────────────────────────────────

def lerp_hex(c1, c2, t):
    """Interpolate between two hex colors."""
    def h2r(h):
        h = h.lstrip("#")
        return int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    r1,g1,b1 = h2r(c1);  r2,g2,b2 = h2r(c2)
    r = int(r1 + (r2-r1)*t)
    g = int(g1 + (g2-g1)*t)
    b = int(b1 + (b2-b1)*t)
    return f"#{r:02x}{g:02x}{b:02x}"

def hsv_hex(h, s=1.0, v=1.0):
    r,g,b = colorsys.hsv_to_rgb(h % 1.0, s, v)
    return f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"

class Theme:
    """Defines a QR color theme."""
    def __init__(self, name, label, primary, secondary, bg_center="#0f0f2e", rainbow=False):
        self.name       = name
        self.label      = label
        self.primary    = primary
        self.secondary  = secondary
        self.bg_center  = bg_center
        self.rainbow    = rainbow

    def module_color(self, row, col, n):
        if self.rainbow:
            # Diagonal hue sweep — full spectrum across the QR
            t = (row + col) / (2 * (n - 1))
            return hsv_hex(t, 0.95, 1.0)
        else:
            # Radial gradient: primary at center → secondary at edges
            cx, cy = n / 2, n / 2
            dist = math.sqrt((col-cx)**2 + (row-cy)**2) / math.sqrt(cx**2+cy**2)
            return lerp_hex(self.primary, self.secondary, min(1.0, dist * 0.6))

THEMES = [
    Theme("diamond",  "DIAMOND EDITION",  "#00e5ff", "#004466"),
    Theme("gold",     "GOLD EDITION",     "#ffd700", "#775500"),
    Theme("magenta",  "MAGENTA EDITION",  "#e040fb", "#7700aa"),
    Theme("emerald",  "EMERALD EDITION",  "#00ff88", "#005533"),
    Theme("polygon",  "POLYGON EDITION",  "#8247E5", "#3a1a88"),
    Theme("sunset",   "SUNSET EDITION",   "#ff6b35", "#cc2200"),
    Theme("rainbow",  "RAINBOW EDITION",  "#ffffff", "#aaaaaa", rainbow=True),
]

# ── QR matrix generation ──────────────────────────────────────────────────────

def get_matrix(data):
    import qrcode
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    return qr.get_matrix()

# ── SVG parts ─────────────────────────────────────────────────────────────────

def polygon_logo(tx, ty, scale=0.7):
    return f"""<g transform="translate({tx},{ty}) scale({scale})" opacity="0.92">
  <polygon points="28,0 56,16 56,48 28,64 0,48 0,16"
    fill="#8247E5" fill-opacity="0.18" stroke="#8247E5" stroke-width="2.5"/>
  <polygon points="28,14 43,23 43,41 28,50 13,41 13,23"
    fill="#8247E5" fill-opacity="0.3"/>
  <text x="28" y="40" text-anchor="middle" font-family="Arial,sans-serif"
    font-size="20" font-weight="bold" fill="#8247E5">P</text>
  <text x="28" y="78" text-anchor="middle" font-family="Arial,sans-serif"
    font-size="7.5" fill="#8247E5" letter-spacing="2" opacity="0.85">POLYGON</text>
</g>"""

def short_addr(s):
    """Format: 0x4F70...d09"""
    if s.startswith("0x") and len(s) == 42:
        return f"{s[:6]}...{s[-4:]}"
    if len(s) > 40:
        return s[:22] + "..." + s[-16:]
    return s

def build_svg(data, theme, sublabel, uid):
    matrix = get_matrix(data)
    n      = len(matrix)
    cell   = QR_SIZE / n
    qr_x   = (CANVAS_W - QR_SIZE) / 2
    qr_y   = 150
    c      = theme.primary
    half_w = CANVAS_W / 2

    # ── QR modules ────────────────────────────────────────────────────────────
    rects = []
    for row in range(n):
        for col in range(n):
            if matrix[row][col]:
                mc   = theme.module_color(row, col, n)
                x    = qr_x + col * cell
                y    = qr_y + row * cell
                r    = max(0.4, cell * 0.18)   # rounded-square modules
                rects.append(
                    f'<rect x="{x:.2f}" y="{y:.2f}" '
                    f'width="{cell:.2f}" height="{cell:.2f}" '
                    f'rx="{r:.2f}" fill="{mc}"/>'
                )
    modules = "\n".join(rects)

    # Center PDX stamp (ERROR_CORRECT_H tolerates ~30% damage; stamp is <4%)
    stamp_size = max(36, cell * 5)
    stamp_x    = half_w - stamp_size / 2
    stamp_y    = qr_y + QR_SIZE / 2 - stamp_size / 2

    # Stats positions
    sep1_y  = qr_y - 16
    sep2_y  = qr_y + QR_SIZE + 18
    sub_y   = sep2_y + 26
    data_y  = sep2_y + 46
    badge_y = CANVAS_H - 46

    display = short_addr(data)

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}">
<defs>
  <radialGradient id="bg{uid}" cx="50%" cy="40%" r="65%">
    <stop offset="0%" stop-color="#0f0f2e"/>
    <stop offset="100%" stop-color="#040408"/>
  </radialGradient>
  <filter id="gw{uid}" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <pattern id="dots{uid}" width="20" height="20" patternUnits="userSpaceOnUse">
    <circle cx="10" cy="10" r="0.7" fill="#fff" opacity="0.06"/>
  </pattern>
</defs>

<!-- Background -->
<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#bg{uid})"/>
<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#dots{uid})"/>

<!-- Outer border glow -->
<rect x="3" y="3" width="{CANVAS_W-6}" height="{CANVAS_H-6}" rx="18"
  fill="none" stroke="{c}" stroke-width="2" opacity="0.6"/>
<rect x="7" y="7" width="{CANVAS_W-14}" height="{CANVAS_H-14}" rx="15"
  fill="none" stroke="{c}" stroke-width="0.5" opacity="0.2"/>

<!-- Corner accents -->
<polyline points="26,26 26,14 14,14 14,26"
  fill="none" stroke="{c}" stroke-width="1.5" opacity="0.5"/>
<polyline points="{CANVAS_W-26},26 {CANVAS_W-26},14 {CANVAS_W-14},14 {CANVAS_W-14},26"
  fill="none" stroke="{c}" stroke-width="1.5" opacity="0.5"/>
<polyline points="26,{CANVAS_H-26} 26,{CANVAS_H-14} 14,{CANVAS_H-14} 14,{CANVAS_H-26}"
  fill="none" stroke="{c}" stroke-width="1.5" opacity="0.5"/>
<polyline points="{CANVAS_W-26},{CANVAS_H-26} {CANVAS_W-26},{CANVAS_H-14} {CANVAS_W-14},{CANVAS_H-14} {CANVAS_W-14},{CANVAS_H-26}"
  fill="none" stroke="{c}" stroke-width="1.5" opacity="0.5"/>

<!-- PARADOX title -->
<text x="{half_w}" y="52" text-anchor="middle"
  font-family="Courier New,monospace" font-size="34" font-weight="bold"
  fill="white" letter-spacing="10" filter="url(#gw{uid})">PARADOX</text>

<!-- Theme label -->
<text x="{half_w}" y="72" text-anchor="middle"
  font-family="Courier New,monospace" font-size="9" fill="{c}" letter-spacing="4">{theme.label}</text>

<!-- Tier badge row -->
<rect x="{half_w-58}" y="82" width="116" height="20" rx="10"
  fill="{c}" fill-opacity="0.1"/>
<rect x="{half_w-58}" y="82" width="116" height="20" rx="10"
  fill="none" stroke="{c}" stroke-width="0.8" opacity="0.5"/>
<text x="{half_w}" y="96" text-anchor="middle"
  font-family="Courier New,monospace" font-size="8" fill="{c}" letter-spacing="3">BURN · HOARD · EXIT</text>

<!-- Top separator -->
<line x1="40" y1="{sep1_y}" x2="{CANVAS_W-40}" y2="{sep1_y}"
  stroke="{c}" stroke-width="0.5" opacity="0.25"/>

<!-- QR background (quiet zone) -->
<rect x="{qr_x-8}" y="{qr_y-8}" width="{QR_SIZE+16}" height="{QR_SIZE+16}"
  rx="10" fill="#060610"/>

<!-- QR modules -->
{modules}

<!-- Center PDX stamp -->
<rect x="{stamp_x:.1f}" y="{stamp_y:.1f}"
  width="{stamp_size:.1f}" height="{stamp_size:.1f}" rx="7" fill="#060610"/>
<text x="{half_w}" y="{stamp_y + stamp_size*0.68:.1f}" text-anchor="middle"
  font-family="Courier New,monospace" font-size="{stamp_size*0.38:.0f}"
  font-weight="bold" fill="{c}" filter="url(#gw{uid})">PDX</text>

<!-- Bottom separator -->
<line x1="40" y1="{sep2_y}" x2="{CANVAS_W-40}" y2="{sep2_y}"
  stroke="{c}" stroke-width="0.5" opacity="0.25"/>

<!-- Sublabel -->
<text x="{half_w}" y="{sub_y}" text-anchor="middle"
  font-family="Courier New,monospace" font-size="9" fill="{c}" letter-spacing="3">{sublabel}</text>

<!-- Data display -->
<text x="{half_w}" y="{data_y}" text-anchor="middle"
  font-family="Courier New,monospace" font-size="11" fill="#707090">{display}</text>

<!-- Polygon logo (top-right) -->
{polygon_logo(CANVAS_W - 80, 14)}

<!-- Chain badge -->
<rect x="{half_w-58}" y="{badge_y}" width="116" height="22" rx="11"
  fill="{c}" fill-opacity="0.1"/>
<rect x="{half_w-58}" y="{badge_y}" width="116" height="22" rx="11"
  fill="none" stroke="{c}" stroke-width="1" opacity="0.5"/>
<text x="{half_w}" y="{badge_y+15}" text-anchor="middle"
  font-family="Courier New,monospace" font-size="9" fill="{c}" letter-spacing="3">POLYGON MAINNET</text>
</svg>"""

# ── Sheet builder (4-up preview) ──────────────────────────────────────────────

def build_sheet(svgs_by_theme, theme):
    """2×2 sheet of all 3 targets + theme title for quick preview."""
    pad   = 30
    cols  = 2
    rows  = 2
    tw    = CANVAS_W
    th    = CANVAS_H
    sw    = cols * tw + (cols + 1) * pad
    sh    = rows * th + (rows + 1) * pad + 80
    c     = theme.primary

    cells = []
    targets = list(svgs_by_theme.items())
    positions = [
        (pad,               pad + 80),
        (pad + tw + pad,    pad + 80),
        (pad,               pad + 80 + th + pad),
        (pad + tw + pad,    pad + 80 + th + pad),
    ]

    for i, (name_, svg) in enumerate(targets[:3]):
        x, y = positions[i]
        inner = svg.split(">", 1)[1].rsplit("</svg>", 1)[0]
        cells.append(f'<g transform="translate({x},{y})">'
                     f'<svg xmlns="http://www.w3.org/2000/svg" '
                     f'viewBox="0 0 {tw} {th}" width="{tw}" height="{th}">'
                     + inner + "</svg></g>")

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {sw} {sh}">
<defs>
  <radialGradient id="shbg" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#080818"/>
    <stop offset="100%" stop-color="#020204"/>
  </radialGradient>
</defs>
<rect width="{sw}" height="{sh}" fill="url(#shbg)"/>
<text x="{sw/2}" y="52" text-anchor="middle"
  font-family="Courier New,monospace" font-size="42" font-weight="bold"
  fill="white" letter-spacing="12">PARADOX</text>
<text x="{sw/2}" y="74" text-anchor="middle"
  font-family="Courier New,monospace" font-size="11" fill="{c}" letter-spacing="4">QR CODE COLLECTION — {theme.label}</text>
{"".join(cells)}
</svg>"""

# ── Main ──────────────────────────────────────────────────────────────────────

JOBS = [
    dict(key="website",     data=WEBSITE_URL,   sublabel="SCAN TO VISIT"),
    dict(key="contract",    data=TOKEN_ADDRESS, sublabel="PDX TOKEN CONTRACT"),
    dict(key="polygonscan", data=POLYGONSCAN,   sublabel="VIEW ON POLYGONSCAN"),
]

def main():
    try:
        import qrcode
    except ImportError:
        print("Installing qrcode...")
        os.system(f"{sys.executable} -m pip install qrcode[pil] -q")
        import qrcode  # noqa: F811

    try:
        import cairosvg
        HAS_PNG = True
    except Exception:
        HAS_PNG = False
        print("cairosvg not available — SVG only")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    svg_dir = OUTPUT_DIR / "svg"
    png_dir = OUTPUT_DIR / "png"
    svg_dir.mkdir(exist_ok=True)
    if HAS_PNG:
        png_dir.mkdir(exist_ok=True)

    total = 0
    for theme in THEMES:
        print(f"\n▶ {theme.label}")
        theme_svgs = {}

        for job in JOBS:
            uid = f"{job['key']}_{theme.name}"
            print(f"   {job['key']:12s}", end=" ", flush=True)

            svg = build_svg(job["data"], theme, job["sublabel"], uid)
            theme_svgs[job["key"]] = svg

            svg_path = svg_dir / f"paradox_qr_{job['key']}_{theme.name}.svg"
            svg_path.write_text(svg, encoding="utf-8")
            print("SVG ✓", end=" ", flush=True)

            if HAS_PNG:
                try:
                    import cairosvg
                    png_path = png_dir / f"paradox_qr_{job['key']}_{theme.name}.png"
                    cairosvg.svg2png(bytestring=svg.encode(), write_to=str(png_path),
                                     output_width=560, output_height=690)
                    print("PNG ✓", end="", flush=True)
                except Exception as e:
                    print(f"PNG ✗ ({e})", end="", flush=True)
            print()
            total += 1

        # 4-up sheet
        sheet_svg = build_sheet(theme_svgs, theme)
        sheet_path = OUTPUT_DIR / f"paradox_sheet_{theme.name}.svg"
        sheet_path.write_text(sheet_svg, encoding="utf-8")
        print(f"   sheet                SVG ✓", end=" ", flush=True)
        if HAS_PNG:
            try:
                import cairosvg
                sheet_png = OUTPUT_DIR / f"paradox_sheet_{theme.name}.png"
                cairosvg.svg2png(bytestring=sheet_svg.encode(), write_to=str(sheet_png),
                                 output_width=1180, output_height=1540)
                print("PNG ✓", end="", flush=True)
            except Exception as e:
                print(f"PNG ✗ ({e})", end="", flush=True)
        print()

    print(f"\n{'═'*50}")
    print(f"  {total} QR codes  ·  {len(THEMES)} preview sheets")
    print(f"  Saved to: {OUTPUT_DIR.resolve()}")
    print(f"{'═'*50}")
    print("""
  Files:
    svg/paradox_qr_<target>_<theme>.svg   individual cards
    png/paradox_qr_<target>_<theme>.png   raster exports
    paradox_sheet_<theme>.svg/.png        3-up preview sheets

  Targets:  website · contract · polygonscan
  Themes:   diamond · gold · magenta · emerald · polygon · sunset · rainbow
""")

if __name__ == "__main__":
    main()
