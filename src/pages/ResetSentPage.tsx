import { Link, useLocation } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Icon } from '../components/Icon'

/**
 * Screen 46 — Reset link sent. Ported from `ResetSent` in
 * `design/components/auth-flow.jsx`.
 *
 * One deviation, noted and deliberate: the design renders a preview of the
 * email with a live "Reset password →" button that jumps straight to screen 47.
 * That is a prototype shortcut. Here the real link arrives by email carrying
 * the recovery token, and the button is dropped — a button that walks past the
 * token would either dead-end on a page with no session or, worse, suggest the
 * reset can be completed without proving you can read the inbox. The card keeps
 * its shape as a picture of what to look for.
 */

const ENVELOPE = (
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 6 10 7 10-7" />
  </>
)

export default function ResetSentPage() {
  const location = useLocation() as { state?: { email?: string } }
  const email = location.state?.email

  return (
    <AuthShell
      quote={{
        text: 'Three retailer price comps on every line, pulled live. When a carrier questions a value, the proof is already attached.',
        who: 'Kevin Godfrey · Long Island Public Adjusters, LLC',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 99,
          background: 'var(--k-accent-soft)',
          color: 'var(--k-accent)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 22,
        }}
      >
        <Icon d={ENVELOPE} size={26} stroke={1.4} />
      </div>

      <div
        style={{
          fontSize: 11,
          color: 'var(--k-fg-4)',
          fontFamily: 'var(--k-font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        Reset link sent
      </div>
      <h1
        style={{
          fontFamily: 'var(--k-font-display)',
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '-0.025em',
          margin: '8px 0 10px',
          lineHeight: 1.05,
        }}
      >
        Check your inbox.
      </h1>
      <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        We sent a one-time link to{' '}
        {email ? (
          <span style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-2)' }}>{email}</span>
        ) : (
          'the email on your account'
        )}
        . Click it within 30 minutes to set a new password.
      </p>

      <div className="k-sent-card">
        <div className="k-sent-card-hd">
          <span>From: Kevin &lt;noreply@kevin.co&gt;</span>
          <span style={{ marginLeft: 'auto' }}>Now</span>
        </div>
        <div className="k-sent-card-body">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Reset your Kevin password
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
            Click the button in that email to choose a new password. This link expires in 30
            minutes.
          </div>
        </div>
      </div>

      <div className="k-set-card" style={{ background: 'var(--k-bg-2)', marginTop: 24 }}>
        <div
          className="k-set-card-body"
          style={{ padding: '14px 16px', fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}
        >
          <strong style={{ color: 'var(--k-fg-2)' }}>Didn&apos;t get the email?</strong>
          <ul style={{ margin: '6px 0 0', padding: '0 0 0 20px' }}>
            <li>
              Check spam/junk — it&apos;ll come from{' '}
              <span style={{ fontFamily: 'var(--k-font-mono)' }}>noreply@kevin.co</span>
            </li>
            <li>Make sure you typed the email exactly as it&apos;s on your account</li>
          </ul>
          <Link className="k-link" style={{ marginTop: 10, display: 'inline-block' }} to="/forgot-password">
            Send another link
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
        <Link className="k-link" style={{ fontSize: 12.5 }} to="/sign-in">
          ← Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}
