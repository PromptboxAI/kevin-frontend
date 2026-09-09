# Item photos

`*.jpg` here are the camera originals (900x1200, ~230 KB each) from the
canonical demo pack-out. **Nothing in the app should reference them directly.**

Two derivatives are generated from them and are what the pages actually load:

| Directory | Width | Used by | Why |
|---|---|---|---|
| `w192/` | 192px | `ItemThumb` on the landing and for-adjusters pages | Renders at 22-88px; 192 covers 88px at 2x DPR |
| `w480/` | 480px | the four-photo collage on `/done-for-you` | Renders near half-column width |

The originals were being served to 22px thumbnails: 3.5 MB of photographs for
a page whose visible use of them totals a few hundred pixels. w192 is 5% of
that, w480 is 26%.

Regenerate after adding a photo:

    python - <<'PY'
    import os, glob
    from PIL import Image
    SRC = 'public/marketing/items'
    for w in (192, 480):
        d = os.path.join(SRC, f'w{w}')
        os.makedirs(d, exist_ok=True)
        for f in glob.glob(os.path.join(SRC, '*.jpg')):
            with Image.open(f) as im:
                c = im.convert('RGB')
                c.thumbnail((w, w * 4), Image.LANCZOS)
                c.save(os.path.join(d, os.path.basename(f)), 'JPEG',
                       quality=72, optimize=True, progressive=True)
    PY
