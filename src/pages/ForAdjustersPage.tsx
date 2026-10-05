import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { MktROISection, MktShot, MktSocialProof } from './LandingPage'
import {
  FaqList,
  RelatedCards,
  crumbJsonLd,
  faqJsonLd,
  softwareJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * For Adjusters — ported from design/components/segment-pages.jsx
 * (ForAdjusters), copy verbatim.
 *
 * Same disclosed deviation as the landing page: the prototype derives the
 * sample rows and the RCV total from the claim seed (`REYES_TOTALS`,
 * `fmtUSDshort`). This app carries no seed, so those are explicit constants —
 * ILLUSTRATIVE MARKETING, not claim data. $2,786.20 is the canonical demo
 * figure from design/components/data.jsx.
 */

const WORKFLOW: [string, string, string, string][] = [
  [
    '01',
    'In the field',
    "Capture photos any way you want. Phone, DSLR, restoration GC's contact sheet. Drop them in.",
    'Phone · DSLR · .zip',
  ],
  [
    '02',
    'On the laptop',
    'Kevin processes everything. Reads barcodes, picks categories, pulls 3 retailer comps per line.',
    'Avg 3m / 100 items',
  ],
  [
    '03',
    'Review & override',
    'One spreadsheet, every cell editable. Fix a description, re-price it against fresh comps, move on.',
    'Special-limits flagged',
  ],
  [
    '04',
    'Export & send',
    'Xactimate (Excel) in the XactContents template, or PDF. Audit log signed at export.',
    'One click · validated',
  ],
]

const EXAMPLE_PHOTOS = [
  '142226',
  '143825',
  '143757',
  '144058',
  '144140',
  '144225',
  '144545',
  '144718',
]

const OUTPUT_ROWS: [string, string, string][] = [
  ["Hot Wheels '70 Plymouth Road Runner", 'Toys & Games', '$12.99'],
  ['GUESS studded leather belt', 'Clothing — Adult', '$38.00'],
  ['Honeywell HPA300 HEPA filter', 'Small Appliances', '$47.72'],
  ['Studded dome handbag', 'Clothing — Adult', '$64.00'],
  ['Samsung 35MM camera', 'Electronics', '$89.99'],
  ['Steve Madden leather boot', 'Clothing — Adult', '$129.78'],
]

const WHY: [string, string][] = [
  [
    'Built for volume',
    'Bulk ingest, mass review, mass export. Hundreds of items reviewed in one grid — not one item at a time.',
  ],
  [
    'No locking your data',
    'Every export bundles the source photos and a signed audit log. You can leave and take your last 10 years of claims with you.',
  ],
  [
    'No hand-holding the AI',
    'Kevin pre-fills, you decide. Anything it could not price confidently arrives blank instead of guessed.',
  ],
  [
    'No surprise pricing',
    'Flat monthly. Comps included. No "AI usage" fees, no per-photo charges.',
  ],
  [
    'No carrier lock-in',
    'Xactimate (Excel) in the XactContents template, and PDF. Bring your own carrier profiles or use our starter set.',
  ],
  [
    'No "contact sales" for basics',
    'The Pro tier is self-serve. Click, drop photos, get a worksheet. Done.',
  ],
]

/** Matches the design's <Thumb src=…>: cover-fitted, 4px radius, inset hairline. */
function ItemThumb({ file, size }: { file: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        overflow: 'hidden',
        flex: '0 0 auto',
        position: 'relative',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    >
      <img
        src={`/marketing/items/w192/${file}`}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )
}

/**
 * Structure brought over from the answer pages, 2026-10-05. This page had NO
 * schema at all, no FAQ, and -- on a site that now carries twenty-five guides
 * -- not one internal link into them. It is a high-intent commercial page and
 * was the least machine-readable thing we publish.
 *
 * The answers are the same facts the guides carry, so they cannot drift into
 * a separate story: metered trial, flat pricing, items as the metered
 * dimension, blank rather than guessed, .xlsx with static values, no carrier
 * submit.
 */
const ADJ_FAQS: Faq[] = [
  {
    q: 'How long does a contents claim take through Kevin?',
    a: 'It depends on the claim — how many photographs, how much of the property is unusual, and how much needs your judgment. What changes is where the time goes: the repetitive part (grouping photographs, researching replacements, recording sources, applying depreciation) is handled, and your time moves to the exceptions.',
  },
  {
    q: 'Does the export import into Xactimate?',
    a: 'That is what the file is for. It is an Xactimate (Excel) .xlsx written in the XactContents template, with every derived cell as a computed number rather than a formula, because the importer breaks on formulas. There is also a room-by-room PDF for a client.',
  },
  {
    q: 'Does Kevin submit to the carrier for me?',
    a: 'No. Kevin writes a file you send — download it, share it or email it. There is no carrier-facing surface and nothing is pushed into carrier systems, so what reaches a carrier is always something you reviewed and sent.',
  },
  {
    q: 'What happens when Kevin cannot identify an item?',
    a: 'The line arrives with a blank, editable field rather than a confident guess. A plausible wrong description is more dangerous than a blank, because it survives review — so ambiguous items come back to you unpriced instead of invented.',
  },
  {
    q: 'What does it cost?',
    a: '$249 a month, flat — never per claim and never per seat. Claims are unlimited; line items are the metered dimension, with 2,000 included each month. The first 250 line items are free with no deadline, and a trial ends when the 250th item is produced rather than on a date.',
  },
  {
    q: 'Do I still have to review everything?',
    a: 'You should, and the workflow is built around it — you confirm the grouping before anything becomes a claim item, and jewelry, firearms, fine arts, furs, fine china and graded trading cards are never auto-priced at all. The point is to spend review where it matters rather than on typing.',
  },
]

const ADJ_CRUMBS = [{ to: '/for-adjusters', t: 'For adjusters' }]

export default function ForAdjustersPage() {
  return (
    <div className="k-landing">
      <Seo
        path="/for-adjusters"
        jsonLd={[softwareJsonLd, faqJsonLd(ADJ_FAQS), crumbJsonLd(ADJ_CRUMBS)]}
      />
      <MktNav active="adj" />

      <main className="k-mkt-main">
        <section className="k-seg-hero">
          <div className="k-seg-hero-l">
            <span className="k-badge k-badge--ok k-eyebrow">
              For independent, carrier &amp; public adjusters
            </span>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 64,
                letterSpacing: '-0.028em',
                margin: '20px 0 18px',
                lineHeight: 1.02,
              }}
            >
              {/* nowrap per line: a <br> alone still lets a line wrap again when
                  the hero column is narrow, which turned this into three lines
                  at wide viewports. Two lines, always. */}
              <span className="k-h1-line">Stop typing.</span>
              <br />
              <span className="k-h1-line">Start adjusting.</span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: 'var(--k-fg-2)',
                lineHeight: 1.5,
                margin: 0,
                maxWidth: 530,
              }}
            >
              Drop a folder of damage photos. Kevin returns a complete personal-property inventory —
              items identified, brands matched, depreciation suggested, three live retailer comps
              per line. Then you do the part that requires judgment.
            </p>
            <div className="k-hero-actions" style={{ marginTop: 32 }}>
              <Link className="k-btn k-btn--lg" to="/sign-up">
                Start a new claim
              </Link>
              <Link className="k-btn k-btn--ghost k-btn--lg" to="/demo">
                Watch demo
              </Link>
            </div>
          </div>
          {/* THE REAL PRODUCT, not a drawing of it. This was a hand-built
              mock of a worksheet -- five rows composed in JSX -- which is the
              same thing the owner rejected on the homepage ("why aren't we
              using one that exists from our product page"). It also measured
              500x300 against copy at 549x375, so the graphic was smaller than
              the text it was meant to anchor.

              Same asset and same bleed as the homepage hero: at the column's
              own width the grid is unreadable, and cropping it would cut off
              the money columns, which are the half that matters. */}
          <div className="k-seg-hero-r">
            <figure className="k-hero-shot">
              <img
                src="/marketing/worksheet-review-2x.webp"
                srcSet="/marketing/worksheet-review-720.webp 720w, /marketing/worksheet-review-1100.webp 1100w, /marketing/worksheet-review-2x.webp 1740w"
                sizes="(max-width: 820px) calc(100vw - 40px), (max-width: 1080px) 128vw, 820px"
                alt="Kevin's review worksheet: priced contents lines with room, quantity, description, make, model, content class, unit cost, sales tax, age, depreciation and actual cash value"
                width={1740}
                height={964}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </figure>
          </div>
        </section>

        {/* — Stat strip — */}
        <section className="k-seg-stats" style={{ margin: '4px 0' }}>
          <div className="k-stat-card">
            <div className="k-stat-n">2m 41s</div>
            <div className="k-stat-l">Avg time to a complete inventory</div>
            <div className="k-stat-s">60 photos → 57 items</div>
          </div>
          <div className="k-stat-card">
            <div className="k-stat-n">87%</div>
            <div className="k-stat-l">Items prefilled with no edits needed</div>
            <div className="k-stat-s">Make, model, category, pricing</div>
          </div>
          <div className="k-stat-card k-stat-card--accent">
            <div className="k-stat-n">3×</div>
            <div className="k-stat-l">More claims through in a week</div>
            <div className="k-stat-s">
              vs. their previous manual workflow — the field work doesn't change, the typing does
            </div>
          </div>
        </section>

        {/* — Workflow breakdown — */}
        <section className="k-seg-work">
          <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 48px' }}>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              The workflow
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 42,
                letterSpacing: '-0.025em',
                margin: '8px 0 14px',
                lineHeight: 1.05,
              }}
            >
              From driveway to XactContents in one sitting.
            </h2>
          </div>
          <div className="k-seg-work-grid">
            {WORKFLOW.map(([n, t, body, sub]) => (
              <div key={n} className="k-workstep">
                <div className="k-workstep-n">{n}</div>
                <div className="k-workstep-t">{t}</div>
                <p className="k-workstep-b">{body}</p>
                <div className="k-workstep-s">{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* — Visual proof, same captures as landing/product — */}
        <div className="k-proof-hd">
          <div className="k-proof-eyebrow">The two screens that matter</div>
          <h2 className="k-proof-h2">Every line defends itself. Then it exports.</h2>
          <p className="k-proof-sub">
            The part a carrier will question, and the file that answers them.
          </p>
        </div>
        <section className="k-proof-two">
          <MktShot
            src="/marketing/worksheet-review-2x.webp"
            alt="Kevin review worksheet — priced line items with make, model, content class, depreciation and ACV columns"
            label="kevin.co/claims/CLM-2026-04412/worksheet"
            slot="Review worksheet"
            ratio="1740 / 964"
            caption="Live retail comps behind every RCV, with a dated proof link. Depreciation off the schedule you picked. Blank where Kevin could not corroborate a price."
          />
          <MktShot
            src="/marketing/export-modal-2x.webp"
            alt="Kevin export modal — Xactimate Excel XactContents template, client PDF and full bundle"
            label="Export claim · CLM-2026-04412"
            slot="Carrier export"
            ratio="1740 / 1056"
            caption="Xactimate (Excel) · .xlsx · XactContents template — static values in every derived cell, because the importer breaks on formulas."
          />
        </section>

        {/* — Side-by-side example — */}
        <section className="k-seg-example">
          <div className="k-seg-example-l">
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              What you give Kevin
            </div>
            <h3
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 26,
                letterSpacing: '-0.022em',
                margin: '6px 0 14px',
              }}
            >
              60 photos from the loss
            </h3>
            <div className="k-photo-grid-mini">
              {EXAMPLE_PHOTOS.map((f) => (
                <ItemThumb key={f} file={`20260805_${f}.jpg`} size={80} />
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: 'var(--k-fg-4)',
                fontFamily: 'var(--k-font-mono)',
              }}
            >
              + 52 more
            </div>
          </div>
          <div className="k-seg-example-r">
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              What Kevin gives back
            </div>
            <h3
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 26,
                letterSpacing: '-0.022em',
                margin: '6px 0 14px',
              }}
            >
              A 57-line inventory
            </h3>
            <div className="k-mini-grid">
              {OUTPUT_ROWS.map(([d, c, v]) => (
                <div key={d} className="k-mini-row">
                  <span style={{ fontSize: 12, color: 'var(--k-fg)' }}>{d}</span>
                  <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{c}</span>
                  <span />
                  <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                    {v}
                  </span>
                </div>
              ))}
              <div className="k-mini-row">
                <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>+ 51 more lines</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>—</span>
                <span />
                <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                  $2.8k
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* — Testimonial — */}
        <section className="k-seg-quote" style={{ background: 'var(--k-accent)' }}>
          <div className="k-seg-quote-inner">
            <div
              style={{
                fontFamily: 'var(--k-font-display)',
                fontStyle: 'italic',
                fontSize: 32,
                color: '#fff',
                lineHeight: 1.3,
                textWrap: 'balance',
                maxWidth: 760,
              }}
            >
              “Friday afternoon: 50 photos from a kitchen fire. Saturday morning at 9: the inventory
              was on the carrier's desk. The old version of me would still be on row 80 by then.”
            </div>
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 99,
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.25)',
                }}
              >
                <img
                  src="/marketing/kevin-godfrey.webp"
                  width={500}
                  height={500}
                  alt="Kevin Godfrey"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Kevin Godfrey</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                  Long Island Public Adjusters, LLC
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* — Why adjusters pick Kevin — */}
        <section className="k-seg-why">
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Why adjusters pick Kevin
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 38,
                letterSpacing: '-0.025em',
                margin: '8px 0 0',
                lineHeight: 1.1,
              }}
            >
              Built for the way adjusters actually work.
            </h2>
          </div>
          <div className="k-seg-why-grid">
            {WHY.map(([t, body]) => (
              <div key={t} className="k-seg-why-card">
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t}</div>
                <p style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <MktSocialProof />
        <MktROISection />

        <section className="k-mkt-cta">
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 44,
              letterSpacing: '-0.028em',
              margin: '0 0 14px',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            Try Kevin on your next claim.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--k-fg-3)',
              margin: '0 0 28px',
              maxWidth: 480,
              textAlign: 'center',
            }}
          >
            Your first 250 line items are free — full product, real claims, no deadline. Carrier
            profile pre-loaded for the major ones. $249/mo after that: unlimited claims, 2,000 line
            items a month included, no per-seat fee.
          </p>
          <div className="k-hero-actions" style={{ marginTop: 0 }}>
            <Link className="k-btn k-btn--lg" to="/sign-up">
              Start a claim
            </Link>
            {/* The adjuster IS the founder; the call is the introduction. */}
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/book-call">
              Talk to an adjuster who uses Kevin
            </Link>
          </div>
        </section>

        <section className="k-seosec" style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2>Common questions</h2>
          <FaqList items={ADJ_FAQS} />
        </section>

        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <RelatedCards
            items={[
              {
                to: '/guides/public-adjuster-contents-inventory',
                t: 'Contents inventory field guide',
                d: 'What belongs on a line, and how specific a description has to be to price.',
              },
              {
                to: '/guides/large-contents-inventory-500-items',
                t: 'Building a 500+ item claim',
                d: 'Where the hours go on a large inventory, and why photographs are not line items.',
              },
              {
                to: '/guides/what-carriers-look-for-contents-inventory',
                t: 'What a reviewer looks for',
                d: 'The ten checks a desk adjuster applies to a schedule.',
              },
              {
                to: '/guides',
                t: 'All guides',
                d: 'Method, valuation and depreciation, written for the people doing the work.',
              },
            ]}
          />
        </div>

      </main>

      {/* OUTSIDE <main>: .k-mkt-main caps content at 1280px with a 40px
          gutter, so a footer inside it stopped short of the page edges on
          every page except the home page, whose footer is a direct child of
          .k-landing. A footer is not main content either way. */}
      <MktFooter />
    </div>
  )
}
