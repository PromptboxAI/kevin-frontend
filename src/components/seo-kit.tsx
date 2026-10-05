import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { I, Icon } from './Icon'

/**
 * The shared blocks every SEO / AI-answer page is built from.
 *
 * Brief: kevin_co_seo_ai_answer_page_specs.md (15 pages, 10 shared
 * components). One file rather than ten, because each piece is small and they
 * are only ever used together.
 *
 * THREE THINGS THE BRIEF ASKS FOR THAT THE BUILD HAS TO GUARANTEE, not just
 * intend:
 *
 *  1. The copy must be in the rendered HTML. It is: every marketing route is
 *     rendered at build time by scripts/prerender-html.mjs via
 *     src/entry-server.tsx, and a route is included simply by having an entry
 *     in SEO_PAGES. Nothing here may read window/document/storage during
 *     render, or that page falls back to an empty shell (the script warns but
 *     the build still passes -- so a broken page is quiet).
 *
 *  2. FAQ answers must exist in the HTML even when collapsed. <details> keeps
 *     them in the DOM; a JS-toggled panel would not. Open the first one so the
 *     pattern is obvious and the page is never a wall of closed rows.
 *
 *  3. Real <table> markup for comparisons, not a grid of divs -- it is what
 *     crawlers and answer engines read as a table.
 *
 * COPY RULES THAT OVERRIDE THE BRIEF where they disagree, because they are the
 * owner's locked product facts (design/CLAUDE.md):
 *  - The trial is METERED, never timed: "250 line items free, no deadline".
 *    The brief's "Start your free trial" implies a clock; rule 9b scrapped the
 *    7-day trial precisely because the cost is incurred in items, not days.
 *  - The export is "Xactimate (Excel) · .xlsx · XactContents template". Never
 *    "Xactimate XML" (rule 2).
 *  - The pricing engine is the "Kevin Content Pricing Engine". No
 *    customer-facing surface names the vendor behind the comps (rule 10).
 *  - A resale comp is labelled as resale wherever comps are shown (rule 11).
 *  - An item Kevin will not price arrives as a BLANK, EDITABLE price, not an
 *    error and not a guess (rule 12).
 *  - No affiliation with or endorsement by Verisk, anywhere.
 */

/* ── 1 · direct answer ──────────────────────────────────────────────────
   The brief's first global rule: every informational page opens with a
   one-sentence answer, then 2-4 sentences. Marked up as the question's own
   answer so an answer engine can lift the sentence without the preamble. */

export function DirectAnswer({
  question,
  answer,
  children,
}: {
  question: string
  answer: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="k-ans">
      <h2 className="k-ans-q">{question}</h2>
      <p className="k-ans-a">{answer}</p>
      {children ? <div className="k-ans-x">{children}</div> : null}
    </section>
  )
}

/* ── 2 · the workflow, one diagram reused everywhere ────────────────────
   FOUR STEPS, NOT EIGHT (owner, 2026-10-05). This used to name the real
   internal stages -- upload, extract, cluster, review, promote, price,
   depreciate, export -- on the reasoning that a visitor who signs up should
   meet the same vocabulary. The cost of that was a working description of
   our process on four public pages, which is what the owner has been
   trimming since 2026-10-03.

   What a buyer needs is the SHAPE: photographs go in, a person reviews
   before anything becomes a line, pricing and depreciation happen after
   that, and a file comes out. The two facts worth keeping are kept: review
   comes BEFORE pricing, and an item is charged when it becomes a line
   rather than when a photo is uploaded. Neither is a recipe. */

const STAGES: { n: string; t: string; d: string }[] = [
  { n: '01', t: 'Photos in', d: 'Drop a folder, a phone dump or a whole .zip. Nothing is a claim line yet, and nothing is charged.' },
  { n: '02', t: 'Reviewed', d: 'Shots of one item are proposed as one item. You confirm, merge or split before anything is priced — and a line counts against your allowance once it becomes a line, not when the photo lands.' },
  { n: '03', t: 'Priced', d: 'Each line gets a price from a listing with the source kept on the row, a content class, and depreciation for its age.' },
  { n: '04', t: 'Exported', d: 'Xactimate (Excel) · .xlsx in the XactContents template, or a room-by-room PDF.' },
]

export function WorkflowDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={`k-wf${compact ? ' k-wf--compact' : ''}`}>
      {STAGES.map((s) => (
        <li key={s.n} className="k-wf-step">
          <span className="k-wf-n">{s.n}</span>
          <span className="k-wf-t">{s.t}</span>
          {compact ? null : <span className="k-wf-d">{s.d}</span>}
        </li>
      ))}
    </ol>
  )
}

/* ── 3 · feature grid ─────────────────────────────────────────────────── */

export function FeatureGrid({
  items,
  cols = 3,
}: {
  items: { t: string; d: string }[]
  cols?: 2 | 3
}) {
  return (
    <ul className={`k-fgrid k-fgrid--${cols}`}>
      {items.map((f) => (
        <li key={f.t} className="k-fgrid-card">
          <h3 className="k-fgrid-t">{f.t}</h3>
          <p className="k-fgrid-d">{f.d}</p>
        </li>
      ))}
    </ul>
  )
}

/* ── 4 · evidence / accuracy callout ────────────────────────────────────
   The brief is firm that room-level object detection must not be presented as
   insurance-grade identification, and so is domain rule 1. */

export function EvidenceCallout({ children }: { children: ReactNode }) {
  return (
    <aside className="k-evid">
      <span className="k-evid-ic" aria-hidden="true">
        <Icon d={I.info} size={15} stroke={1.9} />
      </span>
      <div>{children}</div>
    </aside>
  )
}

/* ── 5 · comparison table ───────────────────────────────────────────────
   A real table, scrollable on a phone inside its own wrapper so the page
   itself never scrolls sideways. */

export function ComparisonTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: string[]
  rows: (ReactNode | string)[][]
}) {
  return (
    <div className="k-ctable-wrap">
      <table className="k-ctable">
        <caption className="k-ctable-cap">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── 6 · FAQ ────────────────────────────────────────────────────────────
   <details>, so every answer is in the HTML whether or not it is open, and
   `faqJsonLd` builds the FAQPage schema from the SAME array the page renders.
   Two copies would drift, and the drift is invisible on screen. */

export type Faq = { q: string; a: string }

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="k-faqx">
      {items.map((f, i) => (
        <details key={f.q} className="k-faqx-item" open={i === 0}>
          <summary className="k-faqx-q">{f.q}</summary>
          <div className="k-faqx-a">{f.a}</div>
        </details>
      ))}
    </div>
  )
}

export const faqJsonLd = (items: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
})

/* ── 7 · product screenshot ─────────────────────────────────────────────
   Real screenshots only. The brief bans generic AI art, and the shots in
   public/marketing/ are renders of the actual product. */

export function ShotFigure({
  src,
  alt,
  caption,
  label,
}: {
  src: string
  alt: string
  caption?: string
  label?: string
}) {
  return (
    <figure className="k-seoshot">
      {label ? <div className="k-seoshot-bar">{label}</div> : null}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      {caption ? <figcaption className="k-seoshot-cap">{caption}</figcaption> : null}
    </figure>
  )
}

/* ── 8 · stat strip ─────────────────────────────────────────────────────
   Figures only where they can be substantiated. The brief says the same about
   its own case-study numbers, and the homepage ribbon is the cautionary tale:
   a bare multiplier labelled "adjuster-hours saved" reads as hours. */

export function StatStrip({ stats }: { stats: { v: string; l: string; s?: string }[] }) {
  return (
    <section className="k-sstrip">
      {stats.map((s) => (
        <div key={s.l} className="k-sstrip-cell">
          <div className="k-sstrip-v">{s.v}</div>
          <div className="k-sstrip-l">{s.l}</div>
          {s.s ? <div className="k-sstrip-s">{s.s}</div> : null}
        </div>
      ))}
    </section>
  )
}

/* ── 9 · CTA band ───────────────────────────────────────────────────────
   "Start for Free" and the metered terms, not "start your free trial". */

export function CtaBand({
  head = 'Build contents claims faster with Kevin.',
  sub = 'Your first 250 line items are free, with no clock running. $249/mo after that, unlimited claims.',
}: {
  head?: string
  sub?: string
}) {
  return (
    <section className="k-seocta">
      <h2 className="k-seocta-h">{head}</h2>
      <p className="k-seocta-s">{sub}</p>
      <div className="k-seocta-a">
        <Link className="k-btn k-btn--lg" to="/sign-up">
          Start for Free
        </Link>
        <Link className="k-btn k-btn--ghost k-btn--lg" to="/product">
          See how it works
        </Link>
      </div>
    </section>
  )
}

/* ── 10 · related content ───────────────────────────────────────────────
   Descriptive anchor text, never "read more": the brief asks for it and it is
   what an answer engine uses to understand what is being linked. */

export function RelatedCards({ items }: { items: { to: string; t: string; d: string }[] }) {
  return (
    <section className="k-rel">
      <h2 className="k-rel-h">Related</h2>
      <ul className="k-rel-grid">
        {items.map((r) => (
          <li key={r.to}>
            <Link className="k-rel-card" to={r.to}>
              <span className="k-rel-t">{r.t}</span>
              <span className="k-rel-d">{r.d}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── the page shell: breadcrumbs, byline, last updated ──────────────────
   `updated` is a date the author sets, not a build timestamp: a file rebuilt
   by an unrelated deploy has not been reviewed, and stamping today's date on
   it would be a claim nobody checked. */

export function SeoPageHead({
  crumbs,
  h1,
  lede,
  updated,
  byline,
}: {
  crumbs: { to: string; t: string }[]
  h1: ReactNode
  lede?: ReactNode
  updated?: string
  byline?: string
}) {
  return (
    <header className="k-seohead">
      <nav className="k-crumbs" aria-label="Breadcrumb">
        <Link to="/">Kevin</Link>
        {crumbs.map((c) => (
          <span key={c.to}>
            <span className="k-crumbs-sep" aria-hidden="true">
              /
            </span>
            <Link to={c.to}>{c.t}</Link>
          </span>
        ))}
      </nav>
      <h1 className="k-seoh1">{h1}</h1>
      {lede ? <p className="k-seolede">{lede}</p> : null}
      {updated || byline ? (
        <div className="k-seometa">
          {byline ? <span>{byline}</span> : null}
          {byline && updated ? <span aria-hidden="true"> · </span> : null}
          {updated ? <span>Last updated {updated}</span> : null}
        </div>
      ) : null}
    </header>
  )
}

/** BreadcrumbList for the same crumbs the header renders. */
/**
 * ItemList for a hub page. A directory of links is exactly what this schema
 * is for, and /guides had only a BreadcrumbList -- so the one page whose job
 * is to enumerate the others was the one not telling an answer engine what it
 * enumerated. Positions are 1-based and the order is the order on screen.
 */
export const itemListJsonLd = (
  name: string,
  items: { to: string; t: string; d: string }[],
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.t,
    description: it.d,
    url: `https://www.kevin.co${it.to}`,
  })),
})

export const crumbJsonLd = (crumbs: { to: string; t: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ to: '/', t: 'Kevin' }, ...crumbs].map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.t,
    item: `https://www.kevin.co${c.to}`,
  })),
})

/** SoftwareApplication, for the commercial pages. Price is the real one. */
export const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kevin',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.kevin.co',
  offers: {
    '@type': 'Offer',
    price: '249',
    priceCurrency: 'USD',
    description: 'Unlimited claims, 2,000 line items a month included, then $0.20 per item.',
  },
}
