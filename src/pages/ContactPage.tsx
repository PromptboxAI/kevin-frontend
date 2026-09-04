import Badge from '../components/Badge'
import CalendlyInline, { CALENDLY_URL } from '../components/CalendlyInline'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Contact — ported from design/components/marketing-pages.jsx (ContactSales),
 * copy verbatim.
 *
 * The form is STATIC by design, exactly as in the prototype: submit opens a
 * mailto to kevin@kevin.co rather than posting anywhere. There is no contact
 * endpoint, and a form that silently swallowed a message would be worse than
 * one that hands it to the visitor's mail client. Engineering wires this to a
 * real endpoint and fires `contact_submitted` (see INTERACTIONS.md).
 */
export default function ContactPage() {
  return (
    <div className="k-landing">
      <MktNav />
      <main className="k-mkt-main">
        <section className="k-contact">
          <div className="k-contact-l">
            <Badge tone="accent" dot>
              Talk to us
            </Badge>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 56,
                letterSpacing: '-0.028em',
                margin: '20px 0 18px',
                lineHeight: 1.02,
              }}
            >
              Tell us what you're working on.
            </h1>
            <p
              style={{
                fontSize: 16,
                color: 'var(--k-fg-2)',
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 480,
              }}
            >
              Every message comes to Kevin Godfrey — 22 years adjusting before he built this. No
              chatbot, no ticket queue, no sales team to get past.
            </p>

            <div className="k-contact-channels">
              <div className="k-contact-row">
                <span className="k-contact-icon">
                  <Icon d={I.spark} size={14} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    Sales, support, security — everything
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                    It comes straight to me
                  </div>
                </div>
                <a
                  className="k-link"
                  style={{ fontSize: 13, fontFamily: 'var(--k-font-mono)' }}
                  href="mailto:kevin@kevin.co"
                >
                  kevin@kevin.co
                </a>
              </div>
            </div>

            <div className="k-contact-meta">
              <div>
                <div className="k-contact-meta-l">Based in</div>
                <div className="k-contact-meta-v">Long Island, NY</div>
              </div>
              <div>
                <div className="k-contact-meta-l">Hours</div>
                <div className="k-contact-meta-v">8a–6p ET · Mon–Fri</div>
              </div>
              <div>
                <div className="k-contact-meta-l">Founded</div>
                <div className="k-contact-meta-v">2024</div>
              </div>
            </div>
          </div>

          <form className="k-contact-form" onSubmit={(e) => e.preventDefault()}>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Or send a message
            </div>
            <div className="k-insp-field">
              <label>Your name</label>
              <input className="k-insp-input" placeholder="Your full name" style={{ padding: '10px 13px' }} />
            </div>
            <div className="k-insp-field">
              <label>Work email</label>
              <input
                className="k-insp-input"
                placeholder="you@example.com"
                style={{ padding: '10px 13px' }}
              />
            </div>
            <div className="k-insp-field">
              <label>What's on your mind?</label>
              <select className="k-insp-input" defaultValue="agency" style={{ padding: '10px 13px' }}>
                <option value="solo">I adjust claims and want to try it</option>
                <option value="estate">I run estate sales and want to try it</option>
                <option value="ent">Carrier, TPA, or multi-adjuster team</option>
                <option value="cust">I'm a customer and need help</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="k-insp-field">
              <label>
                Anything you'd like us to know?{' '}
                <span style={{ color: 'var(--k-fg-4)' }}>(optional)</span>
              </label>
              <textarea
                className="k-insp-input"
                rows={5}
                placeholder="Claim volume, how you work today, what you'd want to see…"
                style={{ padding: '10px 13px' }}
              />
            </div>
            <button
              type="button"
              className="k-btn k-btn--lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
              onClick={() => {
                window.location.href = 'mailto:kevin@kevin.co'
              }}
            >
              Send message →
            </button>
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--k-fg-4)' }}>
              Or{' '}
              <a className="k-link" href="#book">
                book a call
              </a>{' '}
              directly · We never share your info.
            </div>
          </form>
        </section>

        {/* Scheduling. Same component and same VITE_CALENDLY_URL as /book-call,
            so the handle lives in one place; with the variable unset it renders
            the email fallback rather than an empty frame. */}
        <section id="book" className="k-contact-book">
          <div className="k-contact-book-hd">
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
              Book a call
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 30,
                letterSpacing: '-0.024em',
                margin: '8px 0 8px',
                lineHeight: 1.1,
              }}
            >
              Or grab thirty minutes.
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: 0, maxWidth: 460 }}>
              Bring a real claim and we'll run it together — no slides. You'll get a calendar invite
              with a video link, and nothing else to fill out.
            </p>
          </div>
          <CalendlyInline minHeight={CALENDLY_URL ? 700 : 300} />
        </section>

        <MktFooter />
      </main>
    </div>
  )
}
