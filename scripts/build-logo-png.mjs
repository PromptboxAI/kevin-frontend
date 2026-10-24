/**
 * Renders public/brand/kevin-logo-{size}.png from public/favicon.svg.
 *
 *   node scripts/build-logo-png.mjs
 *
 * WHY THIS EXISTS. The project had no raster logo at any size -- favicon.svg
 * and a 64px-max .ico -- and every outside surface that wants a logo (LinkedIn,
 * Crunchbase, a conference programme, a partner's footer) asks for a PNG at
 * 300px or better. Exporting one by hand from the SVG puts a binary in the repo
 * that nothing regenerates, so the day the mark changes the PNG quietly becomes
 * a picture of the old logo. Same argument as build-favicon.mjs, same renderer.
 *
 * The mark keeps its own rounded corners and leaves them TRANSPARENT rather
 * than filling them white, because the backgrounds differ: LinkedIn's card is
 * white, a dark deck is not, and a baked-in white corner shows on the second.
 * Anywhere that needs an opaque square can composite this over its own colour.
 *
 * 1024 is the master for anything not listed here -- it downsamples cleanly and
 * is what app stores and most press kits ask for.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { NAVY, ROOT, WHITE, png, render } from './kevin-mark.mjs'

/** 300 is LinkedIn's recommended company logo (minimum 268). */
const SIZES = [300, 400, 1024]

const DIR = join(ROOT, 'public', 'brand')
mkdirSync(DIR, { recursive: true })

for (const size of SIZES) {
  const buf = png(size, size, render(size))
  const name = `kevin-logo-${size}.png`
  writeFileSync(join(DIR, name), buf)
  console.log(`wrote: public/brand/${name} (${size}x${size}, ${buf.length} bytes)`)
}

console.log(`colours: ${NAVY} tile / ${WHITE} mark, transparent outside the tile`)
