/**
 * Renders public/favicon.ico from public/favicon.svg.
 *
 *   node scripts/build-favicon.mjs
 *
 * WHY A GENERATOR AND NOT A BINARY SOMEONE EXPORTED ONCE. The .ico has to stay
 * the same mark as the .svg. A hand-exported binary drifts silently the first
 * time the SVG changes — nothing fails, the two just stop matching, which is
 * exactly the failure mode CLAUDE.md keeps warning about. This reads the SVG's
 * own geometry constants, so re-running it after an edit reproduces the icon.
 *
 * WHY IT RASTERISES BY HAND. There is no rasteriser in this project — no sharp,
 * no canvas, no ImageMagick — and adding a native image dependency to emit one
 * 4 KB file is a bad trade. Rendering in a browser was the other option and it
 * failed twice for reasons worth recording: the SVG carries only a `viewBox`
 * with no width/height, so as an <img> it has zero intrinsic size and never
 * loads; and the live site's CSP blocks `data:` images, so the data-URL route
 * is closed there too.
 *
 * The mark is simple enough to solve analytically: a rounded rect, three
 * square-capped strokes and a filled circle. Each is an exact inside/outside
 * test, sampled 4x4 per pixel for anti-aliasing.
 *
 * WHY THE .ICO EXISTS AT ALL. Browsers request /favicon.ico by default when
 * they do not use the SVG. This app's SPA rewrite answered that request with
 * index.html — an HTML document served where an icon was expected, which is
 * worse than a 404 because clients keep retrying it.
 */

import { join } from 'node:path'
import { writeFileSync } from 'node:fs'

// The rasteriser and the PNG encoder live in kevin-mark.mjs so the .ico and
// every other raster of the logo are the same renderer reading the same SVG.
import { NAVY, RADIUS, ROOT, STROKE, VIEW, WHITE, png, render } from './kevin-mark.mjs'

const OUT = join(ROOT, 'public', 'favicon.ico')

// ── ICO ──────────────────────────────────────────────────────────────────────
// PNG-compressed entries, which every browser and Windows Vista+ reads. The
// alternative (BMP entries) needs an inverted mask plane and doubles the size
// for no gain on a web favicon.

const SIZES = [16, 32, 48, 64]
const images = SIZES.map((s) => png(s, s, render(s)))

const HEADER = 6
const ENTRY = 16
const dir = Buffer.alloc(HEADER + ENTRY * images.length)
dir.writeUInt16LE(0, 0) // reserved
dir.writeUInt16LE(1, 2) // type 1 = icon
dir.writeUInt16LE(images.length, 4)

let offset = dir.length
images.forEach((img, i) => {
  const at = HEADER + ENTRY * i
  const size = SIZES[i]
  dir[at] = size >= 256 ? 0 : size // 0 means 256
  dir[at + 1] = size >= 256 ? 0 : size
  dir[at + 2] = 0 // palette count
  dir[at + 3] = 0 // reserved
  dir.writeUInt16LE(1, at + 4) // colour planes
  dir.writeUInt16LE(32, at + 6) // bits per pixel
  dir.writeUInt32LE(img.length, at + 8)
  dir.writeUInt32LE(offset, at + 12)
  offset += img.length
})

const ico = Buffer.concat([dir, ...images])
writeFileSync(OUT, ico)

console.log(`geometry: ${VIEW}px view · r${RADIUS} · stroke ${STROKE} · ${NAVY} / ${WHITE}`)
console.log(`sizes:    ${SIZES.join(', ')}`)
console.log(`wrote:    public/favicon.ico (${ico.length} bytes)`)
