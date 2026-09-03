import { Link } from 'react-router-dom'
import SettingsShell, { NotWired } from '../components/SettingsShell'

/**
 * Screen 32 — Business.
 *
 * Firm name, licence numbers, address, logo, and the tax region default. None
 * of it has an endpoint (ask 33), and unlike the profile screen there is not
 * even a read to show — so this page's job is to be accurate about where the
 * two values that DO reach a document actually come from.
 */
export default function SettingsBusinessPage() {
  return (
    <SettingsShell activeId="agency" title="Business" eyebrow="Firm · exports">
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          Your firm
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620, lineHeight: 1.55 }}>
          Kevin holds firm details per claim rather than per account, so a
          document keeps the details that were true when it was filed.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">What reaches a carrier today</div>
        <div className="k-set-card-body">
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: 0 }}>
            Two fields print on a Proof of Loss — the preparer and the firm —
            and both are set on the <Link to="/claims/new">New claim</Link>{' '}
            screen, stored on the claim itself. That is deliberate: an estimate
            is a point-in-time record, and a firm that renames itself must not
            silently rename itself on every schedule it already sent.
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: '10px 0 0' }}>
            The <strong>tax rate</strong> is also per claim, because it follows
            the loss address rather than the firm — the loss ZIP resolves the
            rate, so the address and the rate always agree.
          </p>
        </div>
      </section>

      <div style={{ marginTop: 18 }}>
        <NotWired
          what="Firm name, licence numbers, address and logo"
          detail="Screen 32 designs these as account-level fields, and there is no account record to write them to — no GET and no PATCH. They also need a decision, not just an endpoint: anything that prints on a document has the same point-in-time problem the preparer name had, and that was resolved per claim (ask 25). Worth settling before this screen becomes editable."
        />
      </div>
    </SettingsShell>
  )
}
