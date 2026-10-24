/**
 * The Kevin mark, rasterised -- shared by every generated raster of the logo.
 *
 * Extracted from build-favicon.mjs on 2026-10-24, when LinkedIn needed a
 * 300x300 PNG and the project had no raster logo at any size. The alternative
 * was a second copy of the rasteriser, which is the exact failure the favicon
 * generator exists to prevent: two renderers, one SVG, and nothing failing the
 * day they stop agreeing.
 *
 * Everything here reads public/favicon.svg at run time, so the SVG remains the
 * single source of the geometry and every raster is derived from it.
 *
 * `png()` takes width and height separately even though the mark is square,
 * so a non-square raster (a cover image, an email banner) can reuse the
 * encoder without touching it.
 */
import { deflateSync } from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SVG = join(ROOT, 'public', 'favicon.svg')

// ── geometry, read out of the SVG so the two cannot drift ────────────────────

const svg = readFileSync(SVG, 'utf8')

const need = (re, what) => {
  const m = re.exec(svg)
  if (!m) throw new Error(`favicon.svg no longer matches the generator: ${what} not found`)
  return m
}

const VIEW = Number(need(/viewBox="0 0 (\d+)/, 'viewBox')[1])
const TILE = need(/<rect[^>]*rx="([\d.]+)"[^>]*fill="(#[0-9a-fA-F]{6})"/, 'tile')
const RADIUS = Number(TILE[1])
const NAVY = TILE[2]
const STROKE = Number(need(/stroke-width="([\d.]+)"/, 'stroke-width')[1])
const WHITE = need(/stroke="(#[0-9a-fA-F]{6})"/, 'stroke colour')[1]

/** The three strokes of the K, as [x1,y1,x2,y2]. */
const SEGMENTS = [...svg.matchAll(/<path d="M([\d.]+) ([\d.]+) (?:V([\d.]+)|L([\d.]+) ([\d.]+))"\/>/g)].map(
  (m) => {
    const x1 = Number(m[1])
    const y1 = Number(m[2])
    // `V` is a vertical lineto: x is unchanged.
    return m[3] !== undefined
      ? [x1, y1, x1, Number(m[3])]
      : [x1, y1, Number(m[4]), Number(m[5])]
  },
)
if (SEGMENTS.length !== 3) throw new Error(`expected 3 stroke paths, found ${SEGMENTS.length}`)

const DOT = need(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/, 'period')
const DOT_C = [Number(DOT[1]), Number(DOT[2])]
const DOT_R = Number(DOT[3])

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]
const NAVY_RGB = hex(NAVY)
const WHITE_RGB = hex(WHITE)

// ── inside/outside tests, in SVG user units ──────────────────────────────────

function insideRoundRect(x, y, size, r) {
  if (x < 0 || y < 0 || x > size || y > size) return false
  // Only the four corner squares need the radius test.
  const cx = x < r ? r : x > size - r ? size - r : x
  const cy = y < r ? r : y > size - r ? size - r : y
  if (cx === x && cy === y) return true
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

/**
 * A square-capped stroke is an oriented rectangle: the segment extended by
 * half the stroke width at BOTH ends, and half the width to either side. The
 * three paths are separate, so no join geometry is needed.
 */
function insideStroke(px, py, [x1, y1, x2, y2], w) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len === 0) return false
  const ux = dx / len
  const uy = dy / len
  const vx = px - x1
  const vy = py - y1
  const along = vx * ux + vy * uy // projection onto the segment
  const across = Math.abs(-vx * uy + vy * ux) // perpendicular distance
  return along >= -w / 2 && along <= len + w / 2 && across <= w / 2
}

const insideDot = (x, y) => (x - DOT_C[0]) ** 2 + (y - DOT_C[1]) ** 2 <= DOT_R * DOT_R

/** White wins over navy; outside the tile is transparent. */
function sample(x, y) {
  if (!insideRoundRect(x, y, VIEW, RADIUS)) return null
  if (insideDot(x, y) || SEGMENTS.some((s) => insideStroke(x, y, s, STROKE))) return WHITE_RGB
  return NAVY_RGB
}

const SS = 4 // 4x4 samples per pixel

function render(size) {
  const scale = VIEW / size
  const px = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (pxi + (sx + 0.5) / SS) * scale
          const uy = (py + (sy + 0.5) / SS) * scale
          const c = sample(ux, uy)
          if (c) {
            r += c[0]
            g += c[1]
            b += c[2]
            a += 1
          }
        }
      }
      const n = SS * SS
      const i = (py * size + pxi) * 4
      if (a === 0) continue // transparent; buffer is already zeroed
      // Average the covered samples only, so an edge pixel keeps its colour
      // and varies in alpha rather than darkening toward black.
      px[i] = Math.round(r / a)
      px[i + 1] = Math.round(g / a)
      px[i + 2] = Math.round(b / a)
      px[i + 3] = Math.round((a / n) * 255)
    }
  }
  return px
}

// ── PNG ──────────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  // 10..12: compression, filter, interlace -- all 0

  // One filter byte (0 = None) per scanline.
  const stride = w * 4 + 1
  const raw = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

export { VIEW, RADIUS, STROKE, NAVY, WHITE, NAVY_RGB, WHITE_RGB, ROOT, render, png, sample }
