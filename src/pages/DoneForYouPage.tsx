import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { crumbJsonLd, softwareJsonLd } from '../components/seo-kit'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { DFY_BANDS, DFY_MINIMUM_FEE, DFY_TYPICAL, linesWithin, quoteFor } from '../lib/dfy-pricing-rules'

/**
 * Done-for-you — the service line: send Kevin the photos, we build the
 * inventory. Ported from design/components/done-for-you.jsx, copy verbatim.
 *
 * One-time PER-ENGAGEMENT pricing, never a subscription and never per seat
 * (rule 9). Site days are an on-site charge and live in the on-site band,
 * because a client who sends their own photos never incurs one.
 *
 * RATES ARE MARGINAL (owner, 2026-10-02). Each band prices only the lines
 * inside it, so 400 lines is 100 x $5.00 + 150 x $4.50 + 150 x $4.00 = $1,775
 * and 401 lines is $1,779. **Crossing a tier can never lower the invoice.**
 *
 * That replaces a flat-per-tier table whose bands fell backwards at every
 * boundary: 800 lines billed $2,800 and 801 billed $2,002.50 -- $797.50 less
 * for one MORE line -- and an 800-line job cost the same as an 1,120-line one.
 *
 * THE UNIT IS A COMPLETED LINE ITEM, never an uploaded photo. Kevin merges
 * several photos of one object into one line, so photos would bill a customer
 * for our clustering rather than for what they receive.
 *
 * $750 MINIMUM PROJECT FEE (owner, 2026-10-22), applied as max(750, line
 * total) -- never added on top. It replaced a $199 setup fee: the NY contents-
 * inventory market starts at $750 for a small loss, and Kevin does not compete
 * by underpricing it. Still NO MINIMUM LINE COUNT: the fee is the floor, so an
 * eight-line jewelry schedule is a $750 job rather than a refusal.
 *
 * The public view leads with the minimum and dollar ranges; the per-line
 * bands sit in a disclosure for professionals. Do not promote the band table
 * back to the headline -- a homeowner cannot count lines.
 *
 * `k-dfy` is a page hook: every section here is inline-styled with no class of
 * its own, so there is nothing for a breakpoint to target.
 */

const STATS: [string, string, string][] = [
  ['1 business day', 'Typical turnaround', 'photo dump in, worksheet + PDF back'],
  /* NOT "every photo becomes a priced line". Several shots of one object are
     one line, and context shots and duplicates are none -- which the sub-line
     already said, contradicting its own headline. On a page that bills by the
     line, a customer who reads "every photo" expects a photo-count invoice. */
  ['One item, one line', 'However many photos it took', 'duplicates and context shots cost nothing'],
  ['3 sources', 'On every priced line', 'live comps with dated proof links'],
]

const STEPS: [string, string][] = [
  [
    'You send',
    'A folder, a .zip, or a written list — plus the claim basics (insured, loss address, policy form if you have it). No photos yet? We can shoot the site for you — see below.',
  ],
  [
    'We quote',
    'Your photos cluster into sets before anything is priced, and a set becomes at most one line — so the set count is a ceiling your invoice cannot pass. You get that number, and the price it implies, before we run anything.',
  ],
  [
    'We build',
    'Your claim runs through the same engine, and a Kevin reviewer works every exception line: blanks, no-comps, special-limits classes.',
  ],
  [
    'You review & export',
    "The finished worksheet lands in your account (or we email the files). Every line carries its source link — it's your inventory, defensibly built.",
  ],
]

const COLLAGE = ['20260805_144436', '20260805_144542', '20260805_144723', '20260805_144808']

/**
 * The table and the worked example are both DERIVED from
 * lib/dfy-pricing-rules, so the published rate, the quote a client is given
 * and the invoice cannot drift apart. They were three hand-written copies of
 * the same numbers, which is how the previous table ended up contradicting
 * its own example.
 */
const RATES: [string, string, string][] = DFY_BANDS.map((b) => [
  b.label,
  `$${b.rate.toFixed(2)}`,
  b.upTo === null ? 'a line, or a custom volume rate' : 'a line',
])

const usd = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

const MINIMUM = usd(DFY_MINIMUM_FEE)

/** The example on the page. 400 lines is big enough to cross three bands. */
const EXAMPLE = quoteFor(400)!
const NEXT = quoteFor(401)!

/** Rounded to the nearest 10: these are "about" figures beside a range. */
const about = (n: number) => Math.round(n / 10) * 10

/** The public ranges, each with the size it buys from the same bands. */
const TYPICAL: [string, string, string][] = DFY_TYPICAL.map((t) => {
  if (t.from === null) return [t.label, 'Custom', 'quoted per job']
  if (t.to === null) return [t.label, `${usd(t.from)}+`, `over ${about(linesWithin(t.from))} lines`]
  const low = t.from === DFY_MINIMUM_FEE ? 0 : linesWithin(t.from)
  return [
    t.label,
    `${usd(t.from)}–${usd(t.to)}`,
    low === 0 ? `up to about ${about(linesWithin(t.to))} lines` : `about ${about(low)}–${about(linesWithin(t.to))} lines`,
  ]
})

export default function DoneForYouPage() {
  return (
    <div className="k-landing k-dfy">
      <Seo path="/done-for-you" jsonLd={[softwareJsonLd, crumbJsonLd([{ to: '/done-for-you', t: 'Done-for-you claims' }])]} />
      <MktNav active="product" />
      <main className="k-mkt-main">
        <section
          className="k-mkt-hero"
          style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto', padding: '60px 40px 30px' }}
        >
          <span className="k-badge k-badge--ok k-eyebrow">
            Done-for-you · per claim
          </span>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 56,
              letterSpacing: '-0.028em',
              margin: '20px 0 16px',
              lineHeight: 1.04,
            }}
          >
            Send us the photos.
            <br />
            We'll build the inventory.
          </h1>
          <p
            style={{
              fontSize: 16.5,
              color: 'var(--k-fg-3)',
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 620,
            }}
          >
            No time to run it yourself? Our team takes your photo dump or written list through Kevin
            — identification, live pricing, depreciation, line-by-line review — and returns an
            XactContents-ready .xlsx and a client-facing PDF, usually within one business day.
          </p>
          <div className="k-hero-actions" style={{ justifyContent: 'center', marginTop: 26 }}>
            {/* Done-for-you has no self-serve intake — the claim arrives by
                email and Kevin scopes it. Both CTAs go where that happens. */}
            <a
              className="k-btn k-btn--lg"
              href="mailto:kevin@kevin.co?subject=Done-for-you%20claim"
            >
              Send us a claim
            </a>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/book-call">
              Talk it through first
            </Link>
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--k-fg-4)' }}>
            From {MINIMUM}, priced per finished line and quoted before we start. One-time per
            engagement — no subscription, no seats, no retainer.
          </div>
        </section>

        {/* Hairline stat row */}
        <section
          style={{
            maxWidth: 940,
            margin: '0 auto',
            padding: '0 40px 44px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {STATS.map(([n, l, sub], i) => (
            <div
              key={n}
              style={{
                textAlign: 'center',
                padding: '18px 12px',
                borderTop: '1px solid var(--k-line)',
                borderBottom: '1px solid var(--k-line)',
                borderLeft: i > 0 ? '1px solid var(--k-line)' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontSize: 30,
                  letterSpacing: '-0.02em',
                }}
              >
                {n}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </section>

        {/* How it works — numbered rail beside the evidence collage */}
        <section
          style={{
            maxWidth: 940,
            margin: '0 auto',
            padding: '0 40px 48px',
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: 44,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              How an engagement runs
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 30,
                letterSpacing: '-0.022em',
                margin: '8px 0 22px',
                lineHeight: 1.15,
              }}
            >
              Three touches on your side. That's all.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map(([t, s], i) => (
                <div key={t} style={{ display: 'flex', gap: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: '0 0 auto',
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 99,
                        background: 'var(--k-accent)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: 'var(--k-font-mono)',
                        fontSize: 12.5,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        style={{
                          flex: 1,
                          width: 2,
                          background: 'var(--k-line)',
                          margin: '4px 0',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? 22 : 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: '30px' }}>{t}</div>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--k-fg-3)',
                        lineHeight: 1.6,
                        margin: '2px 0 0',
                      }}
                    >
                      {s}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {COLLAGE.map((f, i) => (
                <img
                  key={f}
                  src={`/marketing/items/w480/${f}.jpg`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    aspectRatio: i % 3 === 0 ? '4/5' : '4/4.2',
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: '1px solid var(--k-line)',
                    transform: `translateY(${i % 2 === 1 ? 14 : 0}px)`,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--k-fg-4)',
                marginTop: 24,
                textAlign: 'center',
              }}
            >
              Real captures from the sample claim.
            </div>
          </div>
        </section>

        {/* On-site capture — full-bleed tinted band, breaks the card rhythm */}
        <section
          style={{
            background: 'var(--k-bg-2)',
            borderTop: '1px solid var(--k-line)',
            borderBottom: '1px solid var(--k-line)',
            padding: '34px 40px',
          }}
        >
          <div
            className="k-dfy-onsite"
            style={{
              maxWidth: 860,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: 22,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'var(--k-accent)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
              }}
            >
              <Icon d={I.camera} size={24} stroke={1.6} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                Can't get to the site? We'll shoot it too.
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--k-fg-3)',
                  margin: '4px 0 0',
                  lineHeight: 1.55,
                  maxWidth: 600,
                }}
              >
                A Kevin field photographer walks the loss and captures every item — wide shots,
                model plates, serial tags — then the claim runs straight through the same build. One
                engagement, from front door to finished worksheet.
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--k-fg-2)',
                  /* 8px ran the rate paragraph straight into the description
                     above it; they are two separate points. */
                  margin: '14px 0 0',
                  lineHeight: 1.55,
                  maxWidth: 600,
                }}
              >
                {/* 150 an item-day, not 1,200 (owner, 2026-10-24). At item-level
                    capture a day of shooting is roughly 150 items — each one
                    wants the item, its plate and the damage — so 1,200 priced a
                    week of field labour as one day. "Or part thereof" was also
                    doing two jobs: legally precise, commercially opaque, and it
                    hides a step. At 150 most jobs span several days, so the step
                    is shown with an example instead. */}
                <strong>$275 a site day</strong> — one day covers up to 150 items, so a 400-item
                job is three days. On top of the line rate, and only when we do the shooting: send
                your own photos and there is no site day at all.
              </p>
            </div>
            <a
              className="k-btn k-btn--lg"
              style={{ flex: '0 0 auto' }}
              href="mailto:kevin@kevin.co?subject=On-site%20capture"
            >
              Ask about on-site
            </a>
          </div>
        </section>

        {/* Accent quote. Extra top padding: the on-site band above is full-bleed
            and tinted, so this needs room to read as a separate beat. */}
        <section className="k-dfy-quote-sec" style={{ maxWidth: 940, margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--k-accent)',
              borderRadius: 14,
              padding: '30px 34px',
              color: '#fff',
              display: 'flex',
              gap: 22,
              alignItems: 'center',
            }}
          >
            <img
              src="/marketing/kevin-godfrey.webp"
              width={500}
              height={500}
              alt="Kevin Godfrey, founder"
              style={{
                width: 56,
                height: 56,
                borderRadius: 99,
                objectFit: 'cover',
                flex: '0 0 auto',
                border: '2px solid oklch(1 0 0 / 0.35)',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontSize: 19,
                  lineHeight: 1.5,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                "A contents inventory that used to eat a full day of searching, typing and adjusting
                now comes back the next morning, sourced and ready for XactContents. It gives
                adjusters their evenings back."
              </p>
              <div style={{ marginTop: 10, fontSize: 12.5, opacity: 0.85 }}>
                Kevin Godfrey · Long Island Public Adjusters, LLC
              </div>
            </div>
          </div>
        </section>

        {/* Rate card. The public view leads with the minimum and dollar
            ranges a homeowner can place themselves in; the per-line table is
            for professionals and sits behind a disclosure (owner, 2026-10-22).
            Both are derived from lib/dfy-pricing-rules. */}
        <section className="k-dfy-rates-sec" style={{ maxWidth: 940, margin: '0 auto' }}>
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
            What it costs
          </div>
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 34,
              letterSpacing: '-0.024em',
              margin: '8px 0 8px',
              lineHeight: 1.1,
            }}
          >
            Minimum project: {MINIMUM}.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--k-fg-3)',
              lineHeight: 1.6,
              margin: '0 0 22px',
              maxWidth: 620,
            }}
          >
            Most inventories land in one of these ranges. Final pricing is based on the number of
            completed insurance line items — send us your photos for an exact quote.
          </p>

          <dl className="k-dfy-rates">
            {TYPICAL.map(([label, range, note]) => (
              <div key={label} className="k-dfy-rate">
                <dt className="k-dfy-rate-band">{label}</dt>
                <dd className="k-dfy-rate-v">
                  <span className="k-mono">{range}</span>{' '}
                  <span className="k-dfy-rate-note">{note}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p
            style={{
              fontSize: 13,
              color: 'var(--k-fg-3)',
              lineHeight: 1.6,
              margin: '-8px 0 22px',
              maxWidth: 620,
            }}
          >
            {/* The unit matters more than the rate. Several photos of one
                object become one line, so billing photos would charge for our
                clustering rather than for what the adjuster receives. */}
            A line item is one finished row on the inventory —{' '}
            <strong style={{ color: 'var(--k-fg-2)' }}>not a photo</strong>. Six shots of the same
            sofa are one line, and duplicates and context shots are none. You see the number before
            we start: your photos cluster into sets first, a set becomes at most one line, so{' '}
            <strong style={{ color: 'var(--k-fg-2)' }}>
              the quote is a ceiling the invoice cannot pass
            </strong>
            .
          </p>

          {/* Reuses the FAQ disclosure (k-faqx): details/summary, so the
              table is in the HTML for search and print whether open or not. */}
          <div className="k-faqx" style={{ maxWidth: 620 }}>
            <details className="k-faqx-item">
              <summary className="k-faqx-q">Per-line rates, for public adjusters and professionals</summary>
              <div className="k-faqx-a" style={{ fontSize: 14 }}>
                <p style={{ margin: '0 0 14px' }}>
                  Rates are progressive. Each band prices only the lines inside it, so{' '}
                  <strong>crossing into a lower tier does not reprice earlier items</strong> and
                  adding a line never lowers the total. The price is the line total or the{' '}
                  {MINIMUM} minimum, whichever is higher.
                </p>
                <dl className="k-dfy-rates">
                  {RATES.map(([band, rate, note]) => (
                    <div key={band} className="k-dfy-rate">
                      <dt className="k-dfy-rate-band">{band}</dt>
                      <dd className="k-dfy-rate-v">
                        <span className="k-mono">{rate}</span>{' '}
                        <span className="k-dfy-rate-note">{note}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="k-dfy-worked">
                  <div className="k-dfy-worked-hd">
                    A {EXAMPLE.lines}-line contents inventory, worked through
                  </div>
                  <table className="k-dfy-worked-t">
                    <tbody>
                      {EXAMPLE.breakdown.map((row) => (
                        <tr key={row.label}>
                          <td>
                            {row.label} at ${row.rate.toFixed(2)}
                          </td>
                          <td className="k-mono">{usd(row.amount)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>You sent the photos, so no site day</td>
                        <td className="k-mono">—</td>
                      </tr>
                      <tr className="k-dfy-worked-tot">
                        <td>Total · {usd(EXAMPLE.perLine)} a line</td>
                        <td className="k-mono">{usd(EXAMPLE.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {/* The comparison is to a PUBLISHED rate rather than an
                      invented one: outsourced claim prep bills $99–$125 an
                      hour across the estimate-writing market. */}
                  <p className="k-dfy-worked-foot">
                    One more line would make it {usd(NEXT.total)}, never less. The alternative is
                    someone looking up {EXAMPLE.lines} replacement costs one at a time: outsourced
                    claim prep bills <strong>$99–$125 an hour</strong>, and at {EXAMPLE.lines} items
                    that is a week of someone's attention.
                  </p>
                </div>
              </div>
            </details>
          </div>
        </section>

        <section
          style={{ maxWidth: 780, margin: '0 auto', padding: '10px 40px 64px', textAlign: 'center' }}
        >
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 26,
              letterSpacing: '-0.02em',
              margin: '32px 0 6px',
            }}
          >
            Rather run it yourself?
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: '0 0 18px', lineHeight: 1.6 }}>
            The full product is $249/mo and your first 250 line items are free — most adjusters who
            send us one claim run the next one themselves.
          </p>
          <div className="k-hero-actions" style={{ justifyContent: 'center', marginTop: 0 }}>
            <Link className="k-btn k-btn--lg" to="/pricing">
              See pricing
            </Link>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/sample">
              Open the sample claim
            </Link>
          </div>
        </section>
      </main>
      <MktFooter />
    </div>
  )
}
