/**
 * The bot's retrieval corpus, built from the docs. No React, no fetch.
 *
 * ⛔ THE CORPUS IS THE REAL GUARD. A system prompt asks the model not to say
 * the scrapped thing; a corpus that does not contain it means the model has
 * nothing to say it from. `bot-guard-rules.ts` is the second line, for the
 * answer; this is the first, for the source.
 *
 * Source of truth is `src/content/docs-content.generated.ts` -- itself
 * generated from `design/components/docs-articles{,-2,-3}.jsx` by
 * `node build-docs-exports.cjs`. The articles were deliberately authored as
 * block tuples rather than markup so they lift into other systems untouched
 * (CLAUDE.md, "Backend / CMS"); a retrieval corpus is exactly that lift, so
 * nothing here hand-edits an article and nothing here is a second copy of
 * one. Change an article, run the docs export, run the corpus build.
 *
 * Retrieval is deterministic keyword scoring, not embeddings. Reasons, in
 * order: 45 articles is small enough that scoring reads better than it
 * vectorises; the result is reproducible in a test, so the eval set can
 * assert WHICH passage a question retrieves; and it adds no vendor, no index
 * to rebuild and no drift between the index and the docs. If recall turns out
 * to be the weak link, this is the module to replace, and the eval set is
 * what proves the replacement is better.
 *
 * The types below are structural copies of the generated file's, so this
 * module stays import-free and Node can load it directly for its tests --
 * the `src/lib/*-rules.ts` pattern (see `dfy-pricing-rules.ts`).
 */

export type DocBlock =
  | ['h2', string]
  | ['p', string]
  | ['ul', string[]]
  | ['ol', string[]]
  | ['code', string]
  | ['note', string]
  | ['table', string[][]]

export type DocArticleLike = { title: string; summary: string; blocks: readonly DocBlock[] }

/**
 * One retrievable chunk: an article's h2 section, or its opening run before
 * the first h2.
 *
 * `anchor` is what the answer links to, and it is the whole reason a passage
 * carries its slug and heading: an adjuster who is told something should be
 * one click from the paragraph that says it. Stale links are fine -- people
 * re-read the doc (and never build screenshot "proof" of a passage).
 */
export type BotPassage = {
  /** `slug#heading-slug`, stable across builds so a log entry stays readable. */
  id: string
  /** The docs article slug, e.g. "exporting-xactimate". */
  slug: string
  /** The article title. */
  title: string
  /** The h2 this passage sits under, or "" for the opening run. */
  heading: string
  /** `/docs/<slug>` plus the heading anchor when there is one. */
  anchor: string
  /** The prose, blocks flattened, newline-separated. */
  text: string
}

/* -- marketing pages ------------------------------------------------------ */

/**
 * A prerendered page, as `scripts/build-bot-corpus.mjs` reads it off disk.
 *
 * The docs are data, so they lift straight into passages. The marketing copy
 * is NOT: it lives inside `src/pages/*.tsx` as JSX, which is why CLAUDE.md
 * lists a CMS as unbuilt work. Retyping 60 pages of copy into a second file is
 * the drift this repo has been bitten by before (`gitbook/` said 120-character
 * notes for a year), so the corpus harvests what the site actually SHIPS:
 * `scripts/prerender-html.mjs` already renders every public route to static
 * HTML at build time, for crawlers that do not run JavaScript. The bot reads
 * the same thing a crawler reads, and it cannot drift from the page, because
 * it IS the page.
 */
export type RenderedPage = { path: string; title: string; html: string }

/**
 * Regex, not a DOM. This parses OUR OWN prerendered markup — one `<nav>`, one
 * `<footer>`, one `<h1>`, h2s with no ids — not arbitrary web HTML, and adding
 * a parser dependency to a build step that reads 60 known files is not worth
 * it. If the page shell ever grows a second `<footer>`, this is the comment
 * that tells you where to look.
 */
// `header` is page chrome on every route — the wordmark and the top links —
// and never holds the `<h1>` (checked across the landing, pricing, legal and
// guide shells). Left in, it put "Kevin . Product For Adjusters Pricing
// Guides" at the front of 56 passages. `footer` is 4.5 KB of links that would
// otherwise make "Careers" retrieve the whole site.
const DROP_BLOCKS = /<!--[\s\S]*?-->|<(script|style|svg|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi
const TAG = /<[^>]+>/g
const H2_SPLIT = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i
const H1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
}

function decode(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(parseInt(body.slice(2), 16))
    if (body.startsWith('#')) return String.fromCodePoint(Number(body.slice(1)))
    return ENTITIES[body] ?? whole
  })
}

/** Markup → readable text. */
function textOf(markup: string): string {
  return (
    decode(markup.replace(TAG, ' '))
      .replace(/[ \t ]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{2,}/g, '\n')
      // The pricing tiers render the currency symbol, the figure and the
      // period as separate elements, so stripping tags leaves "$ 249 /mo".
      // Rejoining them matters beyond tidiness: the money invariant in
      // `bot-guard-rules.ts` compares figures found in the ANSWER with figures
      // found in the CONTEXT, and "$ 249" in the context would not support
      // "$249" in the answer.
      .replace(/\$\s+(\d)/g, '$$$1')
      .replace(/(\d)\s+\/\s*(mo|month|yr|year|item)\b/gi, '$1/$2')
      .trim()
  )
}

/**
 * A section shorter than this is a button row, a stat chip or a card label —
 * true, but not an answer to anything, and it dilutes retrieval.
 */
const MIN_PAGE_PASSAGE = 160

/**
 * Split prerendered pages into passages, one per `<h2>` section.
 *
 * The anchor is the route with NO fragment: these h2s carry no ids, and a link
 * to `#frequently-asked` that scrolls nowhere is worse than a link to the page.
 */
export function htmlToPassages(pages: readonly RenderedPage[]): BotPassage[] {
  const out: BotPassage[] = []

  for (const page of pages) {
    // Everything before the app root is <head>: metadata, the critical-CSS
    // <style>, and the JSON-LD that duplicates visible copy. Start INSIDE the
    // root element — slicing at the attribute left `id="root"
    // data-prerendered="/legal">` sitting in the text of the first passage,
    // because the rest of that opening tag is no longer a tag once it is cut.
    const rootAt = page.html.indexOf('id="root"')
    const opens = rootAt === -1 ? -1 : page.html.indexOf('>', rootAt)
    const body = (opens === -1 ? page.html : page.html.slice(opens + 1)).replace(DROP_BLOCKS, ' ')

    const lead = H1.exec(body)
    let heading = lead ? textOf(lead[1]) : ''
    let rest = body

    const sections: Array<{ heading: string; markup: string }> = []
    for (;;) {
      const next = H2_SPLIT.exec(rest)
      if (!next) {
        sections.push({ heading, markup: rest })
        break
      }
      sections.push({ heading, markup: rest.slice(0, next.index) })
      heading = textOf(next[1])
      rest = rest.slice(next.index + next[0].length)
    }

    let n = 0
    for (const section of sections) {
      const text = textOf(section.markup)
      if (text.length < MIN_PAGE_PASSAGE) continue
      n += 1
      out.push({
        id: `${page.path}#${n}`,
        slug: page.path,
        title: page.title,
        heading: section.heading,
        anchor: page.path,
        text,
      })
    }
  }

  return out
}

/** Lowercase, strip punctuation, collapse space. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9$.%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(s: string): string {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** A block as plain text. A table becomes "cell · cell" rows. */
function blockText(block: DocBlock): string {
  switch (block[0]) {
    case 'h2':
    case 'p':
    case 'code':
    case 'note':
      return block[1]
    case 'ul':
    case 'ol':
      return block[1].map((li) => `- ${li}`).join('\n')
    case 'table':
      return block[1].map((row) => row.join(' · ')).join('\n')
  }
}

/**
 * Split the docs into passages, one per h2 section.
 *
 * Section-sized rather than paragraph-sized because the docs answer questions
 * at that altitude: "what does the trial include" is one section, and handing
 * the model half of it is how a qualified sentence loses its qualifier. The
 * summary rides on the first passage so an article's own framing is
 * retrievable.
 */
export function toPassages(articles: Record<string, DocArticleLike>): BotPassage[] {
  const out: BotPassage[] = []

  for (const [slug, article] of Object.entries(articles)) {
    let heading = ''
    let buffer: string[] = [article.summary]

    const flush = () => {
      const text = buffer.join('\n').trim()
      if (!text) return
      const hash = heading ? `#${slugify(heading)}` : ''
      out.push({
        id: `${slug}${hash || '#_intro'}`,
        slug,
        title: article.title,
        heading,
        anchor: `/docs/${slug}${hash}`,
        text,
      })
    }

    for (const block of article.blocks) {
      if (block[0] === 'h2') {
        flush()
        heading = block[1]
        buffer = []
        continue
      }
      buffer.push(blockText(block))
    }
    flush()
  }

  return out
}

/**
 * Words carried by every doc, so they say nothing about which one to read.
 * "kevin", "item" and "claim" are in here for that reason: they are the
 * domain, not the question.
 *
 * So are the question's own scaffolding words -- "much", "many", "each",
 * "get". "How much does Pro cost each month?" retrieved the Photos tab,
 * because "each" sat in the heading "What each photo shows" and a heading hit
 * scores triple. A word that appears in a heading by grammatical accident is
 * worse than no word at all.
 */
const STOPWORDS = new Set(
  (
    'a an and are as at be been but by can cant do does doesnt for from had has have how i if in into is it its ' +
    'may me more most never no not of on once one only or our out over own same so some such than that the their ' +
    'them then there these they this those to too under until up use used using was way we what when where which ' +
    'while who why will with without you your yours kevin item items claim claims adjuster adjusters does whats ' +
    'much many each every get gets got need needs want know tell mean means work works thing things able about'
  ).split(' '),
)

function terms(s: string): string[] {
  return norm(s)
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

/** Crude but useful: "listings" and "listing" are the same question. */
function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

export type ScoredPassage = { passage: BotPassage; score: number }

/**
 * Score one passage against a question.
 *
 * A term in the title or heading counts for more than one in the body: a
 * question about exporting should reach "Exporting to Xactimate" before the
 * paragraph in an unrelated article that happens to mention an export. Score
 * is normalised by the number of question terms, so a long question cannot
 * outscore a short one by sheer length.
 */
export function scorePassage(question: string, passage: BotPassage): number {
  const asked = [...new Set(terms(question).map(stem))]
  if (!asked.length) return 0

  const body = new Set(terms(passage.text).map(stem))
  const head = new Set(terms(`${passage.title} ${passage.heading}`).map(stem))

  let score = 0
  for (const t of asked) {
    if (head.has(t)) score += 3
    else if (body.has(t)) score += 1
  }
  return score / (asked.length * 3)
}

/**
 * The passages to answer from, best first.
 *
 * `minScore` exists so "do you integrate with Encircle" retrieves nothing
 * rather than the three least-irrelevant paragraphs in the docs. An empty
 * result is a fine outcome and the bot has copy for it -- a confident answer
 * assembled from unrelated passages is the failure mode that matters.
 */
export function retrieve(
  question: string,
  passages: readonly BotPassage[],
  { k = 4, minScore = 0.2 }: { k?: number; minScore?: number } = {},
): ScoredPassage[] {
  return passages
    .map((passage) => ({ passage, score: scorePassage(question, passage) }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id))
    .slice(0, k)
}

/**
 * The retrieved passages as one block of text for the request, each labelled
 * with the anchor the answer should cite.
 *
 * This string is also what `checkAnswer` is given as `context`, so a dollar
 * figure the model states has to have come from a passage -- the two uses are
 * the same string on purpose.
 */
export function contextFor(scored: readonly ScoredPassage[]): string {
  return scored
    .map(({ passage }) => {
      const head = passage.heading ? `${passage.title} — ${passage.heading}` : passage.title
      return `[${passage.anchor}] ${head}\n${passage.text}`
    })
    .join('\n\n')
}
