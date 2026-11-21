// Build the chatbot's retrieval corpus: the docs AND the marketing pages.
//
//   npm run build            ← must run first: the pages come from dist/
//   npm run build:bot-corpus
//   npm run check:bot-corpus (verifies the committed file; exits 1 when behind)
//
// Writes `public/bot-corpus.json`, which is served from kevin.co and is the
// ONLY thing either bot answers from. The `--check` contract matches
// `design/build-docs-exports.cjs`: a generated file that drifts is worse than
// no generated file.
//
// TWO SOURCES, ONE ARTIFACT, BOTH GENERATED:
//
//   design/components/docs-articles*.jsx          45 articles, authored as data
//     └ build-docs-exports.cjs → src/content/docs-content.generated.ts
//   src/pages/*.tsx                               the marketing copy, as JSX
//     └ npm run build → dist/<route>/index.html   (scripts/prerender-html.mjs)
//
// The marketing copy is not data and there is no CMS yet (CLAUDE.md, "Backend /
// CMS"), so the only honest way to put it in front of a bot is to harvest what
// the site SHIPS. prerender-html.mjs already renders every public route to
// static HTML for crawlers that do not run JavaScript; the bot reads the same
// bytes. Nothing is retyped, so nothing can drift from the page.
//
// ⛔ THE BUILD FAILS IF A PASSAGE BREAKS A DOMAIN RULE. That is the point of
// the step, not a side effect. `check-domain-rules.py` greps source files and
// cannot see model output; this refuses to put a scrapped claim where a model
// could read it. A docs failure is fixed in `docs-articles*.jsx` (then re-run
// the docs export); a page failure is fixed in that page's `.tsx`.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { toPassages, htmlToPassages } from '../src/lib/bot-corpus-rules.ts'
import { checkCorpus } from '../src/lib/bot-guard-rules.ts'
import { DOC_ARTICLES, DOC_COUNTS, DOC_NAV } from '../src/content/docs-content.generated.ts'
import { SEO_PAGES } from '../src/content/seo-pages.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(here, '..')
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, 'public', 'bot-corpus.json')
const check = process.argv.includes('--check')

/**
 * Public routes a bot has no business reading.
 *
 * - The auth pages are forms. "Enter your email" is not knowledge, and a bot
 *   reciting a sign-in screen is noise in every retrieval.
 * - `/status` renders live service state, which is minutes old by the time a
 *   corpus is built; the service banner is the surface that answers that
 *   question (rule 6b), and showing disruption is never the bot's job.
 * - `/sample` and `/claims/sample` are the demo CLAIM — real worksheet money.
 *   The website bot must never quote a price for an item, so it does not get a
 *   priced inventory to quote from.
 * - `/landing-full` is a long-form variant of `/`. Near-duplicate passages
 *   split retrieval between two copies of the same claim and win nothing.
 * - `/docs` and `/docs/*` come from the article DATA above, which carries real
 *   headings and anchors. Harvesting the rendered page too would duplicate all
 *   45 of them.
 */
const SKIP_PAGES = new Set([
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-sent',
  '/reset-password',
  '/status',
  '/sample',
  '/claims/sample',
  '/landing-full',
  '/docs',
])

/** dist path for a route: '/' is dist/index.html, '/pricing' is dist/pricing/index.html. */
function distFile(route) {
  return route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route.replace(/^\//, ''), 'index.html')
}

/* -- gather --------------------------------------------------------------- */

const docsPassages = toPassages(DOC_ARTICLES)

if (!existsSync(DIST)) {
  console.error('dist/ is missing, so the marketing pages cannot be read.')
  console.error('Run `npm run build` first — the corpus harvests the prerendered HTML it writes.')
  process.exit(1)
}

const rendered = []
const missing = []
for (const [route, entry] of Object.entries(SEO_PAGES)) {
  if (entry.canonicalPath || SKIP_PAGES.has(route) || route.startsWith('/docs/')) continue
  const file = distFile(route)
  if (!existsSync(file)) {
    missing.push(route)
    continue
  }
  rendered.push({ path: route, title: entry.title.replace(/\s*\|\s*Kevin\s*$/, ''), html: readFileSync(file, 'utf8') })
}

// prerender-html.mjs SKIPS a route that throws during render, loudly, and keeps
// its empty shell rather than failing the build. Those pages exist on disk with
// no body, so they harvest to nothing — which would silently shrink the corpus.
// Name them instead.
if (missing.length) {
  console.error(`${missing.length} route(s) have no prerendered HTML in dist/:`)
  console.error(`  ${missing.join('\n  ')}`)
  console.error('Re-run `npm run build` and check prerender-html output for a skipped route.')
  process.exit(1)
}

/* -- dedupe --------------------------------------------------------------- */

// Marketing sections are components, and several render on more than one
// route: the testimonial block sits on `/`, `/pricing` and `/for-adjusters`,
// the four-step explainer on `/methodology` and a guide, and `/legal` and
// `/security` share one hero. Two copies of a claim are not just waste —
// keyword scoring splits the score between them, so a question that should
// surface that claim can surface neither.
//
// Matched on the first 300 characters, not the whole text, because the copies
// are rarely byte-identical: the same block ends with a different CTA or a
// re-ordered carrier logo list.
//
// WHICH COPY SURVIVES, in order:
//   1. A docs passage, always — it carries a real heading anchor, where a page
//      passage can only link to the route.
//   2. Otherwise the LONGEST text. These near-copies are supersets in
//      practice, and keeping the first would have dropped a real sentence:
//      the 500-items guide's version of the four-step block ends "the size of
//      the shoot is not the size of the bill", which `/methodology` does not
//      say.
//   3. Ties go to the earlier route in `SEO_PAGES`, so the build is
//      deterministic.
const DUPE_KEY = 300
const pagePassages = htmlToPassages(rendered)

const groups = new Map()
for (const p of [...docsPassages, ...pagePassages]) {
  const key = p.text.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, DUPE_KEY)
  const group = groups.get(key)
  if (group) group.push(p)
  else groups.set(key, [p])
}

const duplicates = []
const kept = new Set()
for (const group of groups.values()) {
  const winner = group.reduce((best, p) => {
    const bestIsDocs = !best.slug.startsWith('/')
    const isDocs = !p.slug.startsWith('/')
    if (bestIsDocs !== isDocs) return bestIsDocs ? best : p
    return p.text.length > best.text.length ? p : best
  })
  kept.add(winner.id)
  for (const p of group) if (p !== winner) duplicates.push(`${p.id} → kept ${winner.id}`)
}

// Rebuilt in the original order rather than in group order, so the artifact
// still reads docs-then-pages and a diff stays reviewable.
const passages = [...docsPassages, ...pagePassages].filter((p) => kept.has(p.id))

/* -- the gate ------------------------------------------------------------- */

/**
 * Hits a human has read and judged. `slug|rule` → why.
 *
 * ⛔ THIS IS A JUDGEMENT, NOT A MUTE. `check-domain-rules.py` can print a hit
 * and let a person judge it on the spot; a build gate cannot, so the judgement
 * has to be written down. Two kinds live here, and the difference matters:
 *
 * - **OK** — correct copy the guard cannot parse. A denial the negation window
 *   cannot reach, usually because the denial is semantic rather than lexical.
 * - **PENDING** — a REAL breach, waiting on a fix in a file this session does
 *   not own. It stays listed so the corpus can build, and it is printed on
 *   every run so it cannot be forgotten.
 *
 * Keyed by page and rule, not by passage id: a page's section numbering shifts
 * the moment an h2 is added, which would silently move an approval onto
 * different copy. The cost of the coarser key is that this suppresses that one
 * rule across that one page — so the note says what was read, and a material
 * rewrite of the page deserves a re-read.
 *
 * An entry that stops matching is reported as stale. A suppression nobody can
 * see is how the dead $0.20 lived on nine surfaces.
 */
const CORPUS_REVIEWED = {
  '/guides/best-contents-software-public-adjusters|9':
    'OK (2026-11-20). "Per-claim and per-seat pricing punishes a busy month" — criticising those models, which is rule 9 agreeing with itself. The negation is the verb, so no window can see it.',
  // FIXED 2026-11-21, owner's call: /compare/kevin-vs-enservio said "A live
  // listing" twice (prose and the FAQ data, which also renders into FAQ
  // JSON-LD). Both now read "A retail listing", and check-domain-rules.py has
  // a pattern for the phrasing so the source is checked too. The entry is
  // gone rather than kept as history — a suppression list is a list of live
  // judgements, and this one would report itself stale on every build.
}

const breaches = []
const suppressed = []
const usedReview = new Set()

for (const p of passages) {
  const whole = `${p.title} — ${p.heading}\n${p.text}`
  for (const f of checkCorpus(whole)) {
    const key = `${p.slug}|${f.rule}`
    const note = CORPUS_REVIEWED[key]
    const line = `  ${p.id}  (${p.anchor})\n    rule ${f.rule} — ${f.what}\n    ${f.excerpt}`
    if (note) {
      usedReview.add(key)
      suppressed.push(`  ${key}\n    ${note}`)
      continue
    }
    breaches.push(line)
  }
}

// Printed every run, pass or fail.
if (suppressed.length) {
  console.log(`\n${suppressed.length} reviewed hit(s) suppressed:\n`)
  console.log(suppressed.join('\n\n') + '\n')
}

const stale = Object.keys(CORPUS_REVIEWED).filter((k) => !usedReview.has(k))
if (stale.length) {
  console.log(`${stale.length} stale entr(ies) in CORPUS_REVIEWED — the copy changed, so delete them:`)
  console.log(`  ${stale.join('\n  ')}\n`)
}

if (breaches.length) {
  console.error(`\n${breaches.length} passage(s) carry copy a domain rule scrapped:\n`)
  console.error(breaches.join('\n\n'))
  console.error('\nFix the SOURCE — the docs article or the page .tsx — not this file.')
  console.error('Each is a prompt, not a verdict: judge it against the rule in CLAUDE.md.\n')
  process.exit(1)
}

/* -- the artifact --------------------------------------------------------- */

// Section per docs slug, so an answer can say where in the docs it is reading
// from ("Billing → Plans") rather than only which article.
const sectionOf = {}
for (const { section, items } of DOC_NAV) for (const [slug] of items) sectionOf[slug] = section

const body = {
  // Bump when the SHAPE changes, so the backend can refuse a corpus it does
  // not understand instead of half-reading it.
  schema: 2,
  counts: {
    articles: DOC_COUNTS.articles,
    sections: DOC_COUNTS.sections,
    pages: rendered.length,
    passages: passages.length,
    docsPassages: docsPassages.length,
    pagePassages: passages.length - docsPassages.length,
    deduped: duplicates.length,
  },
  passages: passages.map((p) => ({
    ...p,
    // 'docs' is a how-to with a real anchor; 'page' is marketing or legal copy
    // and links to the route. A system prompt can prefer one over the other.
    kind: p.slug.startsWith('/') ? 'page' : 'docs',
    section: sectionOf[p.slug] ?? '',
  })),
}

// The hash covers the passages only — NOT a build timestamp. A corpus that
// reported a new hash every build would have the backend re-read an identical
// file forever, and would make `--check` fail on every clean tree.
const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16)
const next = JSON.stringify({ ...body, hash }, null, 2) + '\n'

let current = null
try {
  current = readFileSync(OUT, 'utf8')
} catch {
  // Not generated yet. `--check` treats that as behind, which it is.
}

const summary = `${passages.length} passages — ${docsPassages.length} from ${DOC_COUNTS.articles} docs articles, ${passages.length - docsPassages.length} from ${rendered.length} pages (${duplicates.length} duplicate section${duplicates.length === 1 ? '' : 's'} dropped) — hash ${hash}`

if (check) {
  if (current === next) {
    console.log(`bot-corpus.json is current — ${summary}`)
    process.exit(0)
  }
  console.error('bot-corpus.json is behind. Run: npm run build && npm run build:bot-corpus')
  process.exit(1)
}

writeFileSync(OUT, next)
console.log(`wrote public/bot-corpus.json — ${summary}`)
