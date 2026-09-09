/**
 * Static per-route <head> for crawlers that never run JavaScript.
 *
 * The app renders correct metadata through <Seo>, and Googlebot executes the
 * bundle so it sees it. Slack, LinkedIn, X and iMessage do NOT — they fetch the
 * raw HTML once and read whatever is in it. So every shared deep link rendered
 * the landing page's card no matter which page it pointed at.
 *
 * This writes dist/<route>/index.html for each public route: the same bundle,
 * the same app, with that route's title, description, canonical and og:* baked
 * into the served HTML. Vercel checks the filesystem before applying the SPA
 * rewrite in vercel.json, so /pricing is served this file rather than the
 * generic index.html, and React then hydrates exactly as before.
 *
 * No runtime cost, no edge function, and it works for every crawler rather
 * than the subset whose user-agent we thought to match.
 *
 * Runs from `npm run build`. The route table is src/content/seo-pages.ts —
 * the same file <Seo> reads, so the two cannot drift.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

/** The table is TypeScript; read it as text and pull the object out. */
async function loadPages() {
  const src = await readFile(join(root, 'src/content/seo-pages.ts'), 'utf8')
  const body = src.slice(src.indexOf('export const SEO_PAGES'))
  // Match braces rather than reaching for the last one: the file has more
  // exports after this object, and lastIndexOf swallowed them.
  const open = body.indexOf('{')
  let depth = 0
  let close = -1
  for (let i = open; i < body.length; i++) {
    if (body[i] === '{') depth++
    else if (body[i] === '}' && --depth === 0) {
      close = i
      break
    }
  }
  if (close < 0) throw new Error('prerender: SEO_PAGES object is unterminated')
  const objectText = body.slice(open, close + 1)
  // The file is data, not code: no expressions, no imports, no template
  // literals. Function-constructing it keeps the script dependency-free.
  const origin = /export const ORIGIN = '([^']+)'/.exec(src)[1]
  return { origin, pages: new Function(`return ${objectText}`)() }
}

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function head({ origin, path, title, description, image }) {
  const url = `${origin}${path === '/' ? '' : path}`
  const card = `${origin}/og/${image ?? 'og-default.png'}`
  const t = esc(title)
  const d = esc(description)
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="Kevin" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${card}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${card}" />`,
  ]
    .map((tag) => `    ${tag.replace(/^<(meta|link|title)/, '<$1 data-default')}`)
    .join('\n')
}

const shell = await readFile(join(dist, 'index.html'), 'utf8')
const { origin, pages } = await loadPages()

// Everything between the fallback block's first tag and its last, replaced
// wholesale per route. Anchored on data-default so it cannot catch the
// viewport, charset, favicon or font links.
const firstDefault = shell.indexOf('<title data-default')
const lastDefault = shell.lastIndexOf('data-default')
const endOfLast = shell.indexOf('>', lastDefault) + 1
if (firstDefault < 0 || lastDefault < 0) {
  throw new Error('prerender: no data-default block in dist/index.html — did index.html change?')
}

let written = 0
for (const [path, entry] of Object.entries(pages)) {
  if (path === '/') continue // dist/index.html already carries the landing tags
  const html = shell.slice(0, firstDefault) + head({ origin, path, ...entry }).trimStart() + shell.slice(endOfLast)
  const dir = join(dist, path.replace(/^\//, ''))
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'index.html'), html, 'utf8')
  written++
}

console.log(`prerender-meta: ${written} route shells written (plus / from index.html)`)
