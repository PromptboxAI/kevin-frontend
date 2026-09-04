import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { MktShot } from './LandingPage'

/**
 * For Estate Liquidators — ported from design/components/segment-pages.jsx
 * (ForLiquidators + MktEstateProof), copy verbatim.
 *
 * Estate pricing is $249 PER ESTATE from the first one (rule 9) — never the
 * monthly plan, and there is no free-first-estate promo.
 *
 * The two proof shots are the estate worksheet and the client PDF, NOT the
 * Xactimate export: an estate professional never touches XactContents.
 *
 * The "what you give Kevin" grid uses the same eight Unsplash stock photos
 * the prototype pulls via PRODUCT_IMG, at the same 240px crop. Stock is right
 * here: an estate walkthrough is someone's home, and Kevin has no cleared
 * photography of one.
 */

const WORKFLOW: [string, string, string, string][] = [
  [
    '01',
    'Walk & capture',
    'One person, one phone, one estate. Room-by-room labeling, no field assistant needed.',
    'Avg 2.6s / photo',
  ],
  [
    '02',
    'Priced, with the receipt',
    'Every line is priced against live retail comps and carries a dated link to the listing it came from. Jewelry, fine arts, firearms and furs stay manual for your appraiser.',
    'Live comps · dated source on every line',
  ],
  [
    '03',
    'Sorted for the split',
    'Every item lands in a content class, so the list groups cleanly for heirs, accountants and consignment. Filter by room, class or value.',
    '24 content classes',
  ],
  [
    '04',
    'A list you can hand over',
    'Numbered inventory, a photo on every line, signature block at the foot. Or a spreadsheet for the accountant.',
    'Print, share, sign',
  ],
]

const OUTPUT_ROWS: [string, string, string, boolean][] = [
  ['Steinway upright piano, 1958', 'Musical Instruments', '$12,500', false],
  ['Persian rug, hand-knotted, 9×12', 'Fine Arts', '$3,800', true],
  ['Sterling silver tea service, 6pc', 'Fine Arts', '$2,400', true],
  ['Mid-century walnut sideboard', 'Furniture', '$1,950', false],
  ['Pearl strand, 18" Akoya', 'Jewelry', '$1,800', true],
  ['Vintage Rolex Datejust', 'Jewelry', '$5,200', true],
  ['Watercolor, signed E.M. Bauer', 'Fine Arts', '$650', false],
]

const ESTATE_TESTIMONIALS = [
  {
    quote:
      'Forty years of accumulation in a three-bedroom ranch. I walked it with my phone on the Tuesday and handed the family a priced inventory Wednesday morning. That used to be a two-week job.',
    name: 'Diane W.',
    role: 'Estate Sale Professional',
    initials: 'DW',
  },
  {
    quote:
      'The heirs were in three states and none of them trusted a spreadsheet. A photo and a dated price on every line ended the argument in one call.',
    name: 'Michael B.',
    role: 'Trust Officer',
    initials: 'MB',
  },
  {
    quote:
      'A probate inventory has to satisfy a court, not just a client. Every line shows where the number came from and what condition the piece was in.',
    name: 'Alicia F.',
    role: 'Probate Paralegal',
    initials: 'AF',
  },
]

const ESTATE_USES = [
  'Estate sales',
  'Probate & trust',
  'Downsizing & senior moves',
  'Division of assets',
  'Auction consignment',
  'Scheduling for insurance',
]

/**
 * The walkthrough grid, ordered to MATCH the inventory beside it — the photos
 * a visitor sees should be the items the list prices, not generic homeware.
 *
 *   piano · rug · sideboard · pearls · Rolex   -> the first five priced lines
 *   sofa · armchair · range                    -> filler, because the grid
 *                                                 stands for 318 photos of a
 *                                                 whole house, not just 7 lines
 *
 * NOT MATCHED: "Sterling silver tea service" and "Watercolor, signed E.M.
 * Bauer" have no usable stock crop — Unsplash returns collection pages rather
 * than a direct image for either — so those two slots carry household goods
 * instead. Worth sourcing properly if this page matters for a campaign.
 *
 * Piano and rug are sourced; the rest reuse the design's own PRODUCT_IMG crops.
 */
const WALKTHROUGH_PHOTOS: [string, string][] = [
  ['Upright piano', 'photo-1517578099694-8b23adec837c'],
  ['Persian rug', 'photo-1757618978085-850cad5b020a'],
  ['Walnut sideboard', 'photo-1606144042614-b2417e99c4e3'],
  ['Pearl strand', 'photo-1605100804763-247f67b3557e'],
  ['Wristwatch', 'photo-1523275335684-37898b6baf30'],
  ['Sofa', 'photo-1555041469-a586c61ea9bc'],
  ['Armchair', 'photo-1592078615290-033ee584e267'],
  ['Range', 'photo-1556909114-f6e7ad7d3136'],
]

/** Matches the design's <Thumb src=…>: cover-fitted, 4px radius, hairline. */
function StockThumb({ id, alt, size }: { id: string; alt: string; size: number }) {
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
        src={`https://images.unsplash.com/${id}?w=240&h=240&fit=crop&auto=format`}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

export default function ForEstateLiquidatorsPage() {
  return (
    <div className="k-landing">
      <MktNav active="liq" />

      <main className="k-mkt-main">
        <section className="k-seg-hero">
          <div className="k-seg-hero-l">
            <Badge tone="accent" dot>
              For estate liquidators &amp; trust officers
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
              Catalog an entire estate in an afternoon.
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
              Walk every room with your phone. Kevin builds the inventory: brand-matched,
              fair-market-valued, categorized into estate-friendly classes — ready to print, share,
              or take to auction.
            </p>
            <div className="k-hero-actions" style={{ marginTop: 32 }}>
              <Link className="k-btn k-btn--lg" to="/sign-in">
                Start an estate →
              </Link>
              <span className="k-btn k-btn--ghost k-btn--lg k-mkt-soon" title="Coming soon">
                See a sample inventory
              </span>
            </div>
          </div>
          <div className="k-seg-hero-r">
            <div className="k-stat-stack">
              <div className="k-stat-card">
                <div className="k-stat-n">1,200+</div>
                <div className="k-stat-l">Items in a single estate</div>
                <div className="k-stat-s">One walkthrough · zero typing</div>
              </div>
              <div className="k-stat-card">
                <div className="k-stat-n">$412k</div>
                <div className="k-stat-l">Fair market value found</div>
                <div className="k-stat-s">Every line backed by a photo + live price comp</div>
              </div>
              <div className="k-stat-card k-stat-card--accent">
                <div className="k-stat-n">3 weeks → 2 days</div>
                <div className="k-stat-l">Typical cycle time per estate</div>
                <div className="k-stat-s">From photo walkthrough to finished inventory</div>
              </div>
            </div>
          </div>
        </section>

        {/* The page's real argument: the inventory is a SALES asset before it is
            an operational one. A family choosing a liquidator is choosing
            between three phone calls; the one who leaves a priced, photographed
            document behind is not competing on percentage any more. */}
        <section className="k-est-win">
          <div className="k-est-win-hd">
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
              Before the contract
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 38,
                letterSpacing: '-0.025em',
                margin: '8px 0 10px',
                lineHeight: 1.1,
              }}
            >
              Turn the first walkthrough into the proposal.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'var(--k-fg-3)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 640,
              }}
            >
              Most estates go to whoever the family trusts first, and trust is hard to win with a
              verbal estimate and a commission rate. Photograph the house on the walkthrough, run it
              through Kevin afterwards, and send a priced inventory with a photo on every line —
              while the other callers are still promising to get back to them.
            </p>
          </div>
          <ol className="k-est-win-steps">
            {[
              [
                'Photograph the walkthrough',
                'Room by room on your phone, on the visit you were making anyway. No assistant, no clipboard, no second trip to fill gaps.',
              ],
              [
                'Send a real number',
                'Back at your desk it is a priced inventory with a photo on every line — not a range, not a guess, and not a promise to follow up next week.',
              ],
              [
                'Win on evidence',
                'You are no longer the cheapest percentage. You are the one who already did the work, and the family can see exactly what their things are worth.',
              ],
            ].map(([t, d], i) => (
              <li key={t} className="k-est-win-step">
                <div className="k-est-win-n">{String(i + 1).padStart(2, '0')}</div>
                <div className="k-est-win-t">{t}</div>
                <p className="k-est-win-d">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* The estate equivalents of the adjuster two-up: the estate worksheet
            and the client PDF, NOT the Xactimate export. */}
        <div className="k-proof-hd">
          <div className="k-proof-eyebrow">The two things you hand over</div>
          <h2 className="k-proof-h2">A list that prices itself. A PDF the family can read.</h2>
          <p className="k-proof-sub">
            The inventory you work in, and the document that leaves your hands.
          </p>
        </div>
        <section className="k-proof-two">
          <MktShot
            src="/marketing/estate-worksheet-2x.webp"
            alt="Kevin estate worksheet — inventory lines with class, condition, disposition and fair-market value"
            label="kevin.co/estates/worksheet"
            slot="Estate worksheet"
            ratio="1740 / 964"
            caption="Priced against live comps with a dated source on every line, grouped by room and class. Condition and disposition tracked per item."
          />
          <MktShot
            src="/marketing/estate-pdf-sheet-2x.webp"
            alt="Kevin estate inventory PDF — numbered lines with a photo and value on each, and a signature block"
            label="Estate inventory · PDF"
            slot="Client inventory PDF"
            ratio="1632 / 970"
            caption="Numbered, a photo on every line, signature block at the foot — the document you hand to heirs, an accountant or a consignor."
          />
        </section>

        {/* — Estate-specific value props — */}
        <section className="k-seg-work">
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
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
              Built for the estate workflow
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
              Built for the way an estate actually gets cleared.
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

        {/* — Side-by-side estate example — */}
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
              318 phone photos
            </h3>
            <div className="k-photo-grid-mini">
              {WALKTHROUGH_PHOTOS.map(([alt, id]) => (
                <StockThumb key={id} id={id} alt={alt} size={80} />
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
              + 310 more
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
              A 297-line inventory
            </h3>
            <div className="k-mini-grid">
              {OUTPUT_ROWS.map(([d, c, v, appraiser]) => (
                <div key={d} className="k-mini-row">
                  <span style={{ fontSize: 12, color: 'var(--k-fg)' }}>{d}</span>
                  <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{c}</span>
                  {/* "SL" is a carrier coverage cap and means nothing on an
                      estate inventory. What matters to a liquidator is which
                      lines a person has to value. */}
                  {appraiser ? <Badge tone="warn">Appraiser</Badge> : <span />}
                  <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                    {v}
                  </span>
                </div>
              ))}
              <div className="k-mini-row">
                <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>+ 290 more lines</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>—</span>
                <span />
                <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                  $384k
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* — Estate social proof + uses — */}
        <section className="k-social">
          <div className="k-social-hd">
            <div className="k-pg-eyebrow-top">From the people who use it</div>
            <h2 className="k-pg-h2">One walkthrough. A list everyone can agree on.</h2>
          </div>
          <div className="k-testimonials">
            {ESTATE_TESTIMONIALS.map((t) => (
              <figure key={t.name} className="k-testi">
                <blockquote className="k-testi-quote">“{t.quote}”</blockquote>
                <figcaption className="k-testi-who">
                  <span
                    className="k-audit-avatar k-audit-avatar--adjuster"
                    style={{ width: 36, height: 36, fontSize: 12 }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <div className="k-testi-name">{t.name}</div>
                    <div className="k-testi-role">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
        <section className="k-audience">
          <div className="k-audience-inner">
            <div className="k-audience-l">Used for</div>
            <div className="k-audience-r">
              {ESTATE_USES.map((u, i) => (
                <span key={u} style={{ display: 'contents' }}>
                  {i > 0 && <span className="k-trust-dot">·</span>}
                  <span>{u}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* — CTA — */}
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
            Try Kevin on your next estate sale.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--k-fg-3)',
              margin: '0 0 28px',
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            <strong>$249 per estate.</strong> One price for the whole job, however many rooms and
            however many items — billed per estate rather than per month, so a quiet quarter costs
            you nothing. No seats, no subscription, no percentage of the sale.
          </p>
          <div className="k-hero-actions" style={{ marginTop: 0 }}>
            <Link className="k-btn k-btn--lg" to="/sign-in">
              Start your first estate →
            </Link>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/book-call">
              Book a 30-min call
            </Link>
          </div>
        </section>

        <MktFooter />
      </main>
    </div>
  )
}
