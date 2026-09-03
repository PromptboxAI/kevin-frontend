import Badge from '../components/Badge'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * About — ported from design/components/marketing-pages.jsx (About), copy
 * verbatim: hero, the four principles, "Where Kevin stops", the founder
 * section, the timeline, and the hiring CTA.
 */

const PILLARS: { t: string; body: string }[] = [
  {
    t: 'The adjuster decides',
    body: 'Kevin flags — special limits, thin evidence, a class that needs an appraiser — and then gets out of the way. Nothing is blocked, no export is held hostage, no approval gate stands between you and your own file. You can override every number on the page.',
  },
  {
    t: 'Every number shows its work',
    body: 'Each price cites the live comps behind it with a dated link, and the audit log records who changed what and when. When Kevin cannot corroborate a price it leaves the cell blank rather than inventing one — a confident wrong number is worse than an honest gap.',
  },
  {
    t: 'One grid, no wizard',
    body: 'Everything sits in a single editable spreadsheet — room, description, make, model, class, cost, age, depreciation. No locked steps, no modal asking whether you are sure. Pin the item panel and work down the list the way you already work.',
  },
  {
    t: 'Your data, your file',
    body: 'Export the XactContents spreadsheet, a client PDF, or the whole bundle with every photo and the audit log. Kevin never pushes into a carrier system — you send the file. Nothing is deleted to reclaim space, because it is your record, not ours.',
  },
]

const BOUNDARIES: [string, string][] = [
  [
    'It isn’t an appraisal.',
    'Kevin prices from live retail comps and shows you the listing each number came from. A signed appraisal is a different instrument — and for jewelry, fine arts, firearms and furs you should still get one. Those classes are never auto-priced.',
  ],
  [
    'It doesn’t talk to your carrier.',
    'There is no direct submit and no carrier-facing screen. Kevin builds the file; you decide who receives it, when, and in what format. Nothing leaves your account on its own.',
  ],
  [
    'It doesn’t decide anything.',
    'Special limits are flagged, never enforced. Every price, content class, age and depreciation percentage on the worksheet is yours to overrule, and the audit log records that you did.',
  ],
  [
    'It won’t hold your work hostage.',
    'No readiness gate on an export, no approval step, no “not ready yet”. Kevin surfaces what deserves a second look — unpriced lines, missing model numbers, capped classes — and then gets out of the way.',
  ],
  [
    'It isn’t a compliance system.',
    'Retention and record-keeping obligations belong to you and the carrier, not to us. Kevin keeps everything and never deletes to reclaim space, but it does not pretend to be your system of record.',
  ],
]

const TIMELINE: [string, string, string][] = [
  [
    'Before 2024',
    'Twenty-two years in the field',
    'Over 10,000 claims settled and more than $1B in total losses. Contents was always the part that took the weekend.',
  ],
  [
    '2024',
    'Kevin founded',
    'Started in Long Island, NY, to do the part of a contents claim that never needed a person doing it.',
  ],
  [
    '2025',
    'Beta on real losses',
    '310+ claims processed across 12 carriers — actual pack-outs and actual photographs, not a demo set.',
  ],
  [
    '2026',
    'Open to any adjuster',
    'Pro at $249/mo, unlimited claims with 2,000 line items a month included, and the first 250 items free. No per-seat maths and no per-claim fee.',
  ],
]

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--k-font-mono)',
  fontSize: 11,
  color: 'var(--k-fg-4)',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

export default function AboutPage() {
  return (
    <div className="k-landing">
      <MktNav />
      <main className="k-mkt-main">
        <section className="k-about-hero">
          <Badge tone="accent" dot>
            About
          </Badge>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 72,
              letterSpacing: '-0.03em',
              margin: '20px 0 22px',
              lineHeight: 1,
              maxWidth: 780,
              textWrap: 'balance',
            }}
          >
            Adjusters have typed long enough.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: 'var(--k-fg-2)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 640,
            }}
          >
            Kevin is built by people who've typed 540 line items into Xactimate on a Friday night,
            and decided that wasn't a problem we should still be solving in 2026.
          </p>
        </section>

        <section className="k-about-belief-hd">
          <div style={EYEBROW}>What we hold to</div>
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
            Four things we will not trade away.
          </h2>
        </section>

        <section className="k-about-pillars">
          {PILLARS.map((p, i) => (
            <div key={p.t} className="k-about-pillar">
              <div
                style={{
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 11,
                  color: 'var(--k-accent)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                0{i + 1}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontSize: 26,
                  letterSpacing: '-0.022em',
                  margin: '8px 0 8px',
                  lineHeight: 1.15,
                }}
              >
                {p.t}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>
                {p.body}
              </p>
            </div>
          ))}
        </section>

        <section className="k-about-not">
          <div className="k-about-not-inner">
            <div className="k-about-not-hd">
              <div style={EYEBROW}>Boundaries</div>
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
                Where Kevin stops.
              </h2>
            </div>
            <dl className="k-about-not-list">
              {BOUNDARIES.map(([t, d]) => (
                <div key={t} className="k-about-not-row">
                  <dt className="k-about-not-t">{t}</dt>
                  <dd className="k-about-not-d">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* A founder-led section rather than one card in a four-column grid:
            the photo carries the credibility an About page exists to establish. */}
        <section className="k-about-founder">
          <div className="k-about-founder-media">
            <img
              src="/marketing/kevin-godfrey.png"
              alt="Kevin Godfrey, founder"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="k-about-founder-body">
            <div style={EYEBROW}>Founder</div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 36,
                letterSpacing: '-0.025em',
                margin: '10px 0 18px',
                lineHeight: 1.1,
              }}
            >
              An adjuster in Long Island, NY.
            </h2>
            <p className="k-about-founder-p">
              Kevin Godfrey spent twenty-two years as an adjuster and settled more than ten thousand
              claims. Contents was always the part that ate the weekend: the structure gets scoped
              in an afternoon, then the personal property list takes days — photograph everything,
              identify it, find what it costs today, argue the depreciation, type all of it in.
            </p>
            <p className="k-about-founder-p">
              None of that work needed a person. Reading a model number off a photograph, finding
              three live prices, applying the schedule to the age — that is machine work. Deciding
              whether the number is right, whether the class is right, whether the carrier will wear
              it: that is the adjuster's work, and it is the only part worth an evening.
            </p>
            <figure className="k-about-founder-fig">
              <blockquote className="k-about-founder-quote">
                “The field work never changed. The typing did.”
              </blockquote>
              <figcaption className="k-about-founder-attrib">
                <span className="k-about-founder-dash">—</span>
                <span>Kevin Godfrey</span>
                <span className="k-trust-dot">·</span>
                <span>Founder</span>
                <span className="k-trust-dot">·</span>
                <span>Smithtown, New York</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="k-about-time">
          <div className="k-about-time-inner">
            <div className="k-about-time-hd">
              <div style={EYEBROW}>How it got here</div>
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
                From a Friday night to a flat subscription.
              </h2>
            </div>
            <ol className="k-about-time-track">
              {TIMELINE.map(([year, t, d]) => (
                <li key={year} className="k-about-time-item">
                  <div className="k-about-time-year">{year}</div>
                  <div className="k-about-time-t">{t}</div>
                  <p className="k-about-time-d">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="k-mkt-cta">
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 40,
              letterSpacing: '-0.028em',
              margin: '0 0 14px',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            We're hiring carefully.
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
            A couple of roles at a time. If you've settled a claim, run an estate sale, or shipped
            software people use all day, we want to hear from you.
          </p>
          <span className="k-btn k-btn--lg k-mkt-soon" title="Coming soon">
            See open roles →
          </span>
        </section>

        <MktFooter />
      </main>
    </div>
  )
}
