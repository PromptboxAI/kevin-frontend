"""One-shot: turn the owner's product screenshots into marketing assets.

Writes a 2x and a mobile copy of each into public/marketing/, matching the
naming and sizing of the existing shots (worksheet-review-2x / -mobile).

Deliberately excludes two of the five supplied:
  - the staging PROGRESS panel, which prints "By capture time" on screen. That
    is the clusterer's input, removed from /methodology on 2026-10-03 and
    guarded in copy since -- a screenshot would reintroduce it as pixels, where
    check-domain-rules.py cannot see it.
  - the "Sending N sets" modal, which is transient and says nothing a reader
    needs.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(
    'C:/Users/Godfr/AppData/Local/Temp/claude',
    'C--Users-Godfr-kevin-frontend-design',
    'b4fcbf61-2c26-49e7-b54d-ac300d113125/images',
)
OUT = os.path.join(ROOT, 'public/marketing')

# (source, slug, crop_top). The staging shot is CROPPED because its intro
# paragraph reads "pre-clustered by capture time" -- the clusterer's input,
# removed from this page on 2026-10-03 and guarded in copy since. A screenshot
# would have reintroduced it as pixels, which check-domain-rules.py cannot
# read; the page's own leak test missed it for the same reason, because text
# inside an image is not text. Cropping keeps the part that matters: the stats
# row and the 2-to-1 item badges.
JOBS = [
    ('1.png', 'flow-photos-in', 0),
    ('3.webp', 'flow-reviewed', 275),
    ('5.png', 'flow-priced', 0),
]

for name, slug, crop_top in JOBS:
    im = Image.open(os.path.join(SRC, name))
    if crop_top:
        im = im.crop((0, crop_top, im.width, im.height))
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    # Strip metadata by re-encoding from the pixels only.
    clean = Image.new(im.mode, im.size)
    clean.putdata(list(im.getdata()))

    full = os.path.join(OUT, f'{slug}-2x.webp')
    clean.save(full, 'WEBP', quality=82, method=6)

    w, h = clean.size
    mob = clean.resize((720, max(1, round(h * 720 / w))), Image.LANCZOS)
    mob_path = os.path.join(OUT, f'{slug}-mobile.webp')
    mob.save(mob_path, 'WEBP', quality=78, method=6)

    print(
        '%-16s %dx%d -> %s (%d KB), mobile (%d KB)'
        % (slug, w, h, os.path.basename(full),
           os.path.getsize(full) // 1024, os.path.getsize(mob_path) // 1024)
    )
