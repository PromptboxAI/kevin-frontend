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
 *
 * It also writes the three files a crawler asks for by name: a shell per docs
 * article, sitemap.xml and llms.txt. They are generated here, from the same
 * two tables, rather than kept in public/ — a hand-kept sitemap is a second
 * route list, and the one in design/deploy/ shows what becomes of those: it
 * still names the apex host and a /signin that does not exist. Before this,
 * all three URLs were answered by the SPA rewrite with the homepage's HTML.
 * (robots.txt IS in public/: it is policy, not a list.)
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

  // The noindex screens need a shell too. Without one they fall through to
  // index.html, so a crawler that does not run JS sees the LANDING PAGE's
  // title and a canonical pointing at the homepage -- i.e. /sign-in announces
  // itself as a duplicate of / and asks to be indexed. The runtime <Seo> marks
  // them noindex, but that is exactly the reader this file exists for.
  const noindexBody = src.slice(src.indexOf('export const NOINDEX_TITLES'))
  const nOpen = noindexBody.indexOf('{')
  let nDepth = 0
  let nClose = -1
  for (let i = nOpen; i < noindexBody.length; i++) {
    if (noindexBody[i] === '{') nDepth++
    else if (noindexBody[i] === '}' && --nDepth === 0) {
      nClose = i
      break
    }
  }
  if (nClose < 0) throw new Error('prerender: NOINDEX_TITLES object is unterminated')
  const noindex = new Function(`return ${noindexBody.slice(nOpen, nClose + 1)}`)()

  return { origin, pages: new Function(`return ${objectText}`)(), noindex }
}

/**
 * The docs articles. docs-content.generated.ts is JSON under two typed
 * `export const`s (build-docs-exports.cjs writes them with JSON.stringify), so
 * each is sliced out and parsed — JSON.parse rather than Function, because it
 * fails loudly the day that file stops being plain data.
 */
async function loadDocs() {
  const src = await readFile(join(root, 'src/content/docs-content.generated.ts'), 'utf8')
  const navAt = src.indexOf('export const DOC_NAV')
  const artAt = src.indexOf('export const DOC_ARTICLES')
  if (navAt < 0 || artAt < navAt) {
    throw new Error('prerender: DOC_NAV / DOC_ARTICLES not found in docs-content.generated.ts')
  }
  const literal = (text) => JSON.parse(text.slice(text.indexOf('= ') + 2).trim().replace(/;$/, ''))
  const nav = literal(src.slice(navAt, artAt))
  const articles = literal(src.slice(artAt))
  return nav.map(({ section, items }) => ({
    section,
    items: items.map(([slug, label]) => {
      const art = articles[slug]
      if (!art) throw new Error(`prerender: docs nav lists "${slug}" but no article has that id`)
      return { slug, label, title: art.title, summary: art.summary }
    }),
  }))
}

/** Must match DOC_TITLE in src/pages/DocsPage.tsx. */
const docTitle = (title) => `${title} — Kevin Docs`

const NL = String.fromCharCode(10)

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Title and robots only -- mirrors the noindex branch of <Seo>. */
function noindexHead(title) {
  return [`<title>${esc(title)}</title>`, `<meta name="robots" content="noindex, nofollow" />`]
    .map((tag) => `    ${tag.replace(/^<(meta|link|title)/, '<$1 data-default')}`)
    .join(NL)
}

function head({ origin, path, title, description, image, canonicalPath }) {
  const c = canonicalPath ?? path
  const url = `${origin}${c === '/' ? '' : c}`
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
const { origin, pages, noindex } = await loadPages()

// Everything between the fallback block's first tag and its last, replaced
// wholesale per route. Anchored on data-default so it cannot catch the
// viewport, charset, favicon or font links.
const firstDefault = shell.indexOf('<title data-default')
const lastDefault = shell.lastIndexOf('data-default')
const endOfLast = shell.indexOf('>', lastDefault) + 1
if (firstDefault < 0 || lastDefault < 0) {
  throw new Error('prerender: no data-default block in dist/index.html — did index.html change?')
}

async function write(path, headHtml) {
  const html = shell.slice(0, firstDefault) + headHtml.trimStart() + shell.slice(endOfLast)
  const dir = join(dist, path.replace(/^\//, ''))
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'index.html'), html, 'utf8')
}

let written = 0
for (const [path, entry] of Object.entries(pages)) {
  if (path === '/') continue // dist/index.html already carries the landing tags
  await write(path, head({ origin, path, ...entry }))
  written++
}

let blocked = 0
for (const [path, title] of Object.entries(noindex)) {
  if (pages[path]) continue // an indexable entry wins; nothing is both
  await write(path, noindexHead(title))
  blocked++
}

const docs = await loadDocs()
const docItems = docs.flatMap((s) => s.items)

// /docs redirects to the first article and says so in its canonical. That is a
// literal in seo-pages.ts (the table has to stay pure data), so check it here
// instead of letting a reordered nav leave it pointing at the second article.
const firstDoc = `/docs/${docItems[0].slug}`
if (pages['/docs']?.canonicalPath !== firstDoc) {
  throw new Error(
    `prerender: SEO_PAGES['/docs'].canonicalPath is ${pages['/docs']?.canonicalPath}, but the first article is ${firstDoc}`,
  )
}

for (const d of docItems) {
  await write(
    `/docs/${d.slug}`,
    head({ origin, path: `/docs/${d.slug}`, title: docTitle(d.title), description: d.summary }),
  )
}

// One URL per page that renders under its own address: an entry with a
// canonicalPath (/sample, /docs) is a redirect, and listing a redirect tells a
// crawler to fetch something the site itself says is not the page. No
// <lastmod> — nothing here knows when a page's copy last changed, and a date
// that is merely the build date teaches Google to ignore the field.
const own = Object.entries(pages).filter(([, e]) => !e.canonicalPath)
const locs = [
  ...own.map(([path]) => `${origin}${path}`),
  ...docItems.map((d) => `${origin}/docs/${d.slug}`),
]
await writeFile(
  join(dist, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map((loc) => `  <url><loc>${esc(loc)}</loc></url>`),
    '</urlset>',
    '',
  ].join(NL),
  'utf8',
)

// llms.txt (llmstxt.org): an H1, a one-paragraph summary, then link lists.
// Titles and descriptions are the tables' own, so this cannot describe the
// product differently from the pages it points at.
const link = (url, title, note) => `- [${title}](${url}): ${note}`
await writeFile(
  join(dist, 'llms.txt'),
  [
    '# Kevin',
    '',
    `> ${pages['/'].description}`,
    '',
    'Kevin is web software for insurance contents adjusters and estate sale professionals. The adjuster uploads photos of damaged or inventoried property; Kevin identifies each item, prices it, applies depreciation, and exports the inventory as an Xactimate (Excel) .xlsx or a PDF. The adjuster reviews and can edit every line.',
    '',
    '## Pages',
    '',
    ...own.map(([path, e]) => link(`${origin}${path}`, e.title, e.description)),
    ...docs.flatMap((s) => [
      '',
      `## Docs: ${s.section}`,
      '',
      ...s.items.map((d) => link(`${origin}/docs/${d.slug}`, d.title, d.summary)),
    ]),
    '',
  ].join(NL),
  'utf8',
)

console.log(
  `prerender-meta: ${written} indexable + ${blocked} noindex route shells, ${docItems.length} docs shells (plus / from index.html); sitemap.xml (${locs.length} urls) and llms.txt written`,
)
