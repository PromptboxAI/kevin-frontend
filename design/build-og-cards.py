# -*- coding: utf-8 -*-
"""Generate the 1200x630 og:image social cards.

    python build-og-cards.py

Every ad, Slack paste and LinkedIn share of a kevin.co URL renders a blank card
without these. SEO.md tracked it as outstanding.

Colours are converted from the OKLCH tokens in kevin.css rather than typed as
hex, so a card cannot drift from the palette (CLAUDE.md: never introduce raw hex
outside the token set). Type uses Georgia and Arial -- the exact fallbacks
kevin.css declares for Merriweather and Lato -- so a card matches what a visitor
without the webfonts sees.

Re-run whenever a headline changes; the text lives in CARDS below.
"""
import io, os, math, sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow required:  pip install pillow")

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "assets", "og")
W, H = 1200, 630


# ── OKLCH -> sRGB, so the cards use the real tokens ────────────────────────
def oklch(L, C, h_deg):
    h = math.radians(h_deg)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def enc(u):
        u = max(0.0, min(1.0, u))
        u = 1.055 * (u ** (1 / 2.4)) - 0.055 if u > 0.0031308 else 12.92 * u
        return int(round(max(0.0, min(1.0, u)) * 255))
    return (enc(r), enc(g), enc(bb))


BG      = oklch(1.00, 0.000, 0)      # --k-bg
FG      = oklch(0.20, 0.020, 250)    # --k-fg
FG3     = oklch(0.52, 0.012, 250)    # --k-fg-3
FG4     = oklch(0.68, 0.010, 250)    # --k-fg-4
LINE    = oklch(0.90, 0.010, 250)    # --k-line
ACCENT  = oklch(0.38, 0.085, 252)    # --k-accent

FONTS = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

DISPLAY   = "georgiab.ttf"   # Merriweather's declared fallback
DISPLAY_R = "georgia.ttf"
UI        = "arial.ttf"      # Lato's declared fallback
UI_B      = "arialbd.ttf"


# (filename, headline lines, sub, eyebrow)
CARDS = [
    ("og-default",   ["Photos in.", "Inventory out."],
     "A defensible contents inventory from a folder of claim photos.", "kevin.co"),
    ("og-landing",   ["The contents", "estimate writes itself."],
     "Drop the pack-out photos. Kevin identifies, prices and depreciates every line.", "kevin.co"),
    ("og-pricing",   ["One subscription.", "Unlimited claims."],
     "$249/mo. No per-seat math, no per-claim fees. First 250 items free.", "kevin.co/pricing"),
    ("og-adjusters", ["Stop typing.", "Start adjusting."],
     "Photo dump to XactContents-ready .xlsx, with a dated comp behind every price.", "kevin.co/for-adjusters"),
    ("og-estate",    ["Catalog an estate", "in an afternoon."],
     "Walk it with your phone. Hand the family a priced, photographed inventory.", "kevin.co/for-estate-liquidators"),
    ("og-product",   ["Photo dump in.", "XactContents out."],
     "Triage, identification, live comps, depreciation and the carrier file.", "kevin.co/product"),
]

PAD = 76


def wordmark(d, x, y, size=34):
    f = font(DISPLAY, size)
    d.text((x, y), "Kevin", font=f, fill=FG)
    w = d.textlength("Kevin", font=f)
    d.text((x + w, y), ".", font=f, fill=ACCENT)


def build(name, lines, sub, eyebrow):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    # Accent rule along the top, and a hairline frame so the card reads as a
    # deliberate object on a white feed background.
    d.rectangle([0, 0, W, 8], fill=ACCENT)
    d.rectangle([0, H - 1, W, H], fill=LINE)

    wordmark(d, PAD, PAD)

    # Headline, set in the display face at a size that holds two lines.
    fh = font(DISPLAY_R, 74)
    y = 214
    for ln in lines:
        d.text((PAD, y), ln, font=fh, fill=FG)
        y += 92

    d.text((PAD, y + 26), sub, font=font(UI, 27), fill=FG3)

    # Footer: url left, proof right.
    fy = H - PAD - 20
    d.text((PAD, fy), eyebrow, font=font(UI_B, 22), fill=ACCENT)
    # Canonical demo claim (CLAUDE.md): 60 photos -> 57 items, never more items than photos.
    right = u"60 photos → 57 items"
    fr = font(UI, 21)
    d.text((W - PAD - d.textlength(right, font=fr), fy + 1), right, font=fr, fill=FG4)

    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name + ".png")
    im.save(p, "PNG", optimize=True)
    return p, os.path.getsize(p)


if __name__ == "__main__":
    print("tokens -> BG%s FG%s ACCENT%s LINE%s\n" % (BG, FG, ACCENT, LINE))
    for card in CARDS:
        p, size = build(*card)
        print("  %-34s %dx%d  %5.0f KB" % (os.path.relpath(p, BASE), W, H, size / 1024))
    print("\n%d cards written to assets/og/" % len(CARDS))
