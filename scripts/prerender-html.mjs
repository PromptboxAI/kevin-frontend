/**
 * Static BODY for the marketing pages — the markup, not just the <head>.
 *
 * prerender-meta.mjs gives every route its own <head>; the body was still an
 * empty <div id="root"> that only JavaScript could fill. This renders each
 * marketing page once at build time (src/entry-server.tsx, compiled to
 * dist-ssr/ by `vite build --ssr`) and writes the result into that route's
 * HTML, so the page paints from the HTML and main.tsx hydrates it.
 *
 * Runs AFTER prerender-meta.mjs: it edits the shells that script wrote.
 *
 * Three things it has to get right:
 *
 * 1. dist/index.html is the homepage AND was the SPA fallback for every route
 *    without a shell of its own (/claims/…, /settings/…). Filled with the
 *    landing page it would paint the landing page on those too. So the empty
 *    shell is saved as dist/app.html first, and vercel.json rewrites to that.
 *
 * 2. The <head> tags lose `data-default`. On a hydrated page React ADOPTS a
 *    matching title/meta/link already in the document instead of adding its
 *    own — and <Seo> removes everything marked data-default on mount, which
 *    would delete the tags React had just adopted and leave the page with no
 *    title at all. They are marked data-prerendered-head instead, which only
 *    main.tsx reads.
 *
 * 3. A route that throws is SKIPPED, loudly, and keeps its empty shell — the
 *    site as it was before this script existed. It does not fail the build: a
 *    page that reads `window` during render should cost that page its fast
 *    first paint, not block every other deploy to the site.
 */
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

const EMPTY_ROOT = '<div id="root"></div>'

const shell = await readFile(join(dist, 'index.html'), 'utf8')
if (!shell.includes(EMPTY_ROOT)) {
  throw new Error(`prerender-html: no ${EMPTY_ROOT} in dist/index.html — did index.html change?`)
}
await copyFile(join(dist, 'index.html'), join(dist, 'app.html'))

let server
try {
  server = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href)
} catch (err) {
  console.warn('prerender-html: SKIPPED ENTIRELY — dist-ssr/entry-server.js did not load.')
  console.warn(err)
  process.exit(0)
}

/**
 * renderToString puts the tags React hoists (<title>, <meta>, <link>) at the
 * very front of the markup, since a fragment has no <head> to put them in.
 * The shell's head already carries the same ones; left in the body they would
 * be a second copy of each.
 */
const LEADING_HOISTED = /^(?:<title[^>]*>[^<]*<\/title>|<meta\b[^>]*>|<link\b[^>]*>)+/

const done = []
const skipped = []
for (const path of server.ROUTES) {
  const file = join(dist, path.replace(/^\//, ''), 'index.html')
  try {
    const body = server.render(path).replace(LEADING_HOISTED, '')
    if (!body.trim()) throw new Error('rendered nothing')
    const html = await readFile(file, 'utf8')
    if (!html.includes(EMPTY_ROOT)) throw new Error('shell has no empty root')
    await writeFile(
      file,
      html
        .replace(/<(title|meta|link) data-default\b/g, '<$1 data-prerendered-head')
        // A function, so a "$&" or "$1" inside the page's own text is not
        // read as a replacement pattern.
        .replace(EMPTY_ROOT, () => `<div id="root" data-prerendered="${path}">${body}</div>`),
      'utf8',
    )
    done.push(path)
  } catch (err) {
    skipped.push(path)
    console.warn(`prerender-html: SKIPPED ${path} — it keeps the empty shell.`)
    console.warn(err)
  }
}

console.log(
  `prerender-html: ${done.length} pages rendered` +
    (skipped.length ? `, ${skipped.length} SKIPPED (${skipped.join(', ')})` : '') +
    '; app.html is the SPA fallback',
)
// Anything the app left running at import time (timers, sockets) must not
// hold the build open.
process.exit(0)
