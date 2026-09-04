import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Done-for-you — the service line: send Kevin the photos, we build the
 * inventory. Ported from design/components/done-for-you.jsx, copy verbatim.
 *
 * One-time PER-ENGAGEMENT pricing, never a subscription and never per seat
 * (rule 9). Site days are an on-site charge and live in the on-site band,
 * because a client who sends their own photos never incurs one.
 *
 * Rates are FLAT PER TIER, not marginal: the line count selects ONE rate and
 * every line bills at it, so an adjuster can price a job in their head.
 *
 * KNOWN EDGE, carried over from the design and worth keeping visible: the
 * bands are non-monotonic at their boundaries. 800 lines bills $2,800; 801
 * bills $2,002.50 — $797.50 less for one MORE line — and an 800-line job bills
 * more than an 1,100-line one. Deliberate trade-off for legibility; the fix, if
 * it ever bites, is to cap each band at the next band's entry price rather than
 * to go marginal.
 *
 * `k-dfy` is a page hook: every section here is inline-styled with no class of
 * its own, so there is nothing for a breakpoint to target.
 */

const STATS: [string, string, string][] = [
  ['1 business day', 'Typical turnaround', 'photo dump in, worksheet + PDF back'],
  ['Every photo', 'Becomes a priced line', 'duplicates and context shots sorted out for you'],
  ['3 sources', 'On every priced line', 'live comps with dated proof links'],
]

const STEPS: [string, string][] = [
  [
    'You send',
    'A folder, a .zip, or a written list — plus the claim basics (insured, loss address, policy form if you have it). No photos yet? We can shoot the site for you — see below.',
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

const RATES: [string, string, string][] = [
  ['1–150 lines', '$7.00', 'a line, all lines'],
  ['151–400 lines', '$5.00', 'a line, all lines'],
  ['401–800 lines', '$3.50', 'a line, all lines'],
  ['801+ lines', '$2.50', 'a line, all lines'],
]

export default function DoneForYouPage() {
  return (
    <div className="k-landing k-dfy">
      <MktNav active="product" />
      <main className="k-mkt-main">
        <section
          className="k-mkt-hero"
          style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto', padding: '60px 40px 30px' }}
        >
          <Badge tone="accent" dot>
            Done-for-you · per claim
          </Badge>
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
              Send us a claim →
            </a>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/book-call">
              Talk it through first
            </Link>
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--k-fg-4)' }}>
            Priced per line, quoted up front from your photo count. One-time per engagement — no
            subscription, no seats, no retainer.
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
                  src={`/marketing/items/${f}.jpg`}
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
                  margin: '8px 0 0',
                  lineHeight: 1.55,
                  maxWidth: 600,
                }}
              >
                <strong>$275 a site day</strong>, one per 1,200 items or part thereof, on top of the
                line rate. Only charged when we do the shooting — send your own photos and there is
                no site day at all.
              </p>
            </div>
            <a
              className="k-btn"
              style={{ flex: '0 0 auto' }}
              href="mailto:kevin@kevin.co?subject=On-site%20capture"
            >
              Ask about on-site →
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
              src="/marketing/kevin-godfrey.png"
              alt=""
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

        {/* Rate card */}
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
            Priced by the line. The bigger the loss, the less each line costs.
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
            Your line count sets one rate, and every line on the claim bills at it.
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
            <div className="k-dfy-worked-hd">A 2,000-line contents inventory, worked through</div>
            <table className="k-dfy-worked-t">
              <tbody>
                <tr>
                  <td>2,000 lines — past 800, so every line is $2.50</td>
                  <td className="k-mono">$5,000</td>
                </tr>
                <tr>
                  <td>You sent the photos, so no site day</td>
                  <td className="k-mono">—</td>
                </tr>
                <tr className="k-dfy-worked-tot">
                  <td>Total · $2.50 a line</td>
                  <td className="k-mono">$5,000</td>
                </tr>
              </tbody>
            </table>
            <p className="k-dfy-worked-foot">
              The alternative on a loss that size is two field adjusters and an inside rep working
              it for two weeks — and the rep is still looking up replacement costs one item at a
              time. That runs about <strong>$9,000</strong>. This is <strong>$5,000</strong>, a{' '}
              <strong>$4,000</strong> saving, and you get it back in a day.
            </p>
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
            <Link className="k-btn" to="/pricing">
              See pricing →
            </Link>
            <span className="k-btn k-btn--ghost k-mkt-soon" title="Coming soon">
              Open the sample claim
            </span>
          </div>
        </section>
      </main>
      <MktFooter />
    </div>
  )
}
