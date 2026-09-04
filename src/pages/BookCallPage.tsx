import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import CalendlyInline from '../components/CalendlyInline'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Book a call (/book-call) — ported from `BookCall` in
 * design/components/utility-pages.jsx. Copy, layout and the three points are
 * verbatim.
 *
 * ONE deviation, in the scheduler region. The prototype draws a labelled
 * placeholder card ("Calendly scheduler · calendly.com/kevin-co/30min"), which
 * reads correctly on a design canvas and reads as a broken page to a visitor
 * who just clicked "Book a 30-min call" on the home page. The slot holds the
 * real `CalendlyInline` widget instead — the same component /contact uses, off
 * the same VITE_CALENDLY_URL, so the booking handle exists in one place. With
 * that variable unset it renders an email fallback rather than an empty frame.
 */

const BC_POINTS: [string, string][] = [
  [
    'Bring a real claim',
    'Drop your photos on the call. You leave with a finished inventory, not a follow-up email.',
  ],
  [
    'We set up your defaults',
    'Depreciation schedule, export format, tax region — configured while we talk.',
  ],
  ['No deck', 'We open the app and work. If it is not a fit in ten minutes, we will tell you.'],
]

const LINK: React.CSSProperties = {
  color: 'var(--k-accent)',
  fontWeight: 600,
  textDecoration: 'underline',
}

export default function BookCallPage() {
  return (
    <div className="k-landing">
      <MktNav />
      <main className="k-mkt-main">
        <section style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 40px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Badge tone="accent" dot>
              30 minutes · no slides
            </Badge>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 44,
                letterSpacing: '-0.028em',
                margin: '16px 0 12px',
                lineHeight: 1.05,
              }}
            >
              Bring a real claim. We'll run it together.
            </h1>
            <p
              style={{
                fontSize: 15.5,
                color: 'var(--k-fg-3)',
                margin: '0 auto',
                maxWidth: 560,
                lineHeight: 1.55,
              }}
            >
              Pick a time that works. You'll get a calendar invite with a video link — nothing else
              to fill out.
            </p>
          </div>

          <div className="k-cal-layout">
            <div className="k-cal-aside">
              {BC_POINTS.map(([t, d], i) => (
                <div key={t} className="k-cal-point">
                  <span className="k-cal-point-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="k-cal-point-body">
                    <span className="k-cal-point-t">{t}</span>
                    <span className="k-cal-point-d">{d}</span>
                  </span>
                </div>
              ))}
              <div className="k-cal-who">
                <img
                  src="/marketing/kevin-godfrey.png"
                  alt="Kevin Godfrey"
                  className="k-cal-who-img"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>You'll talk to Kevin Godfrey</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--k-fg-4)',
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >
                    22 years adjusting, 10,000+ claims settled. He built Kevin.
                  </div>
                </div>
              </div>
              <div className="k-cal-alt">
                Rather write than talk?{' '}
                <Link to="/contact" style={LINK}>
                  Send us a note
                </Link>{' '}
                or email{' '}
                <a href="mailto:kevin@kevin.co" style={LINK}>
                  kevin@kevin.co
                </a>
                .
              </div>
            </div>

            {/* The Calendly inline widget. One component, one handle
                (VITE_CALENDLY_URL), shared with /contact. */}
            <CalendlyInline minHeight={700} />
          </div>
        </section>
      </main>
      <MktFooter />
    </div>
  )
}
