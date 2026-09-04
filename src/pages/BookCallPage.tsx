import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Book a call (/book-call) — ported from `BookCall` in
 * design/components/utility-pages.jsx. Copy, layout and the three points are
 * verbatim.
 *
 * ONE deviation, in the scheduler region. The prototype draws a labelled
 * placeholder card ("Calendly scheduler · calendly.com/kevin-co/30min") that
 * reads correctly on a design canvas and reads as a broken page to a visitor
 * who just clicked "Book a 30-min call" on the home page. There is no Calendly
 * account wired yet, so the slot holds the real alternative instead: email, and
 * Kevin sends times. Same conversion, no dead end.
 *
 * When the account exists, drop the Calendly inline widget into the element
 * marked `data-calendly-embed` and delete the fallback — the surrounding layout
 * is already sized for it (`.k-cal-embed`, min-height 560px at ≤900px).
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

            {/* The Calendly inline widget mounts here — see the file header. */}
            <div className="k-cal-embed" data-calendly-embed="true">
              <div className="k-cal-embed-ph">
                <Icon d={I.clock} size={22} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-fg-2)' }}>
                  Pick a time by email, for now
                </div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-4)', lineHeight: 1.5, maxWidth: 320 }}>
                  Self-serve scheduling is being connected. Until it is, say when you're free and
                  Kevin sends an invite the same day — usually within a couple of hours during
                  business hours, 8a–6p ET.
                </div>
                <a
                  className="k-btn"
                  style={{ marginTop: 4 }}
                  href="mailto:kevin@kevin.co?subject=Booking%20a%2030-minute%20walkthrough"
                >
                  Email to book →
                </a>
                <code className="k-cal-embed-code">kevin@kevin.co · 30 min · video</code>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MktFooter />
    </div>
  )
}
