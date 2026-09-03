import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { MktROISection, MktShot, MktSocialProof } from './LandingPage'

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

const HERO_ROWS: [string, string, string, string][] = [
  ['20260805_142226.jpg', "Hot Wheels '70 Plymouth Road Runner", 'Toys & Games', '$12.99'],
  ['20260805_144545.jpg', 'GUESS studded leather belt', 'Clothing — Adult', '$38.00'],
  ['20260805_143757.jpg', 'Honeywell HPA300 HEPA filter', 'Small Appliances', '$47.72'],
  ['20260805_144140.jpg', 'Studded dome handbag', 'Clothing — Adult', '$64.00'],
  ['20260805_144556.jpg', 'Fiskars yellow-handle scissors', 'Kitchen & Housewares', '$9.97'],
]

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
    'Xactimate (Excel), CSV, or PDF. Audit log signed at export.',
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
    'Xactimate (Excel), CSV, and PDF. Bring your own carrier profiles or use our starter set.',
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
        src={`/marketing/items/${file}`}
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

export default function ForAdjustersPage() {
  return (
    <div className="k-landing">
      <MktNav active="adj" />

      <main className="k-mkt-main">
        <section className="k-seg-hero">
          <div className="k-seg-hero-l">
            <Badge tone="accent" dot>
              For independent, carrier &amp; public adjusters
            </Badge>
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
              <Link className="k-btn k-btn--lg" to="/sign-in">
                Start a new claim →
              </Link>
              <span className="k-btn k-btn--ghost k-btn--lg k-mkt-soon" title="Coming soon">
                Watch demo
              </span>
            </div>
          </div>
          <div className="k-seg-hero-r">
            <div
              style={{
                background: 'var(--k-bg)',
                border: '1px solid var(--k-line)',
                borderRadius: 14,
                boxShadow: 'var(--k-shadow)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--k-line)',
                  background: 'var(--k-bg-2)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: 'var(--k-ok)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Godfrey — Kitchen fire</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--k-fg-4)',
                    fontFamily: 'var(--k-font-mono)',
                    marginLeft: 'auto',
                  }}
                >
                  57 items · $2.8k RCV
                </span>
              </div>
              <div style={{ padding: '4px 16px 10px' }}>
                {HERO_ROWS.map(([file, desc, cat, price], i) => (
                  <div
                    key={file}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '30px 1fr auto',
                      gap: 11,
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: i < 4 ? '1px solid var(--k-line)' : 'none',
                    }}
                  >
                    <ItemThumb file={file} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {desc}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: 'var(--k-fg-4)',
                          fontFamily: 'var(--k-font-mono)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {cat}
                      </div>
                    </div>
                    <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                      {price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
              From driveway to Xactimate in one sitting.
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
                  src="/marketing/kevin-godfrey.png"
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
            <Link className="k-btn k-btn--lg" to="/sign-in">
              Start a claim →
            </Link>
            <span className="k-btn k-btn--ghost k-btn--lg k-mkt-soon" title="Coming soon">
              Talk to an adjuster who uses Kevin
            </span>
          </div>
        </section>

        <MktFooter />
      </main>
    </div>
  )
}
