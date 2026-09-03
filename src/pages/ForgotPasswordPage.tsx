import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { getSupabase } from '../lib/supabase'

/**
 * Screen 45 — Forgot password. Ported from `ForgotPassword` in
 * `design/components/auth-flow.jsx`.
 *
 * Genuinely wired: `resetPasswordForEmail` sends the link, and `redirectTo`
 * brings the recipient back to `/reset-password` where the session Supabase
 * mints from the link lets `updateUser` set the new one.
 *
 * The result is deliberately NOT branched on whether the address exists —
 * Supabase returns success either way, and surfacing the difference would turn
 * this box into an account-enumeration oracle. Everyone sees "check your
 * inbox", which is also what screen 46 says.
 */

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { error: err } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) throw new Error(err.message)
      navigate('/reset-sent', { replace: true, state: { email } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the reset link.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      quote={{
        text: 'A claim that used to eat two days of typing now takes an afternoon. Kevin reads the photos and writes the inventory — I just review and send.',
        who: 'Kevin Godfrey · Long Island Public Adjusters, LLC',
      }}
    >
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
        Reset password
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
        Forgot it? It happens.
      </h1>
      <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 28px', lineHeight: 1.5 }}>
        Enter your work email and we&apos;ll send a single-use link. The link expires in 30 minutes.
      </p>

      <form className="k-auth-form" onSubmit={onSubmit}>
        <div className="k-insp-field">
          <label htmlFor="forgot-email">Work email</label>
          <input
            id="forgot-email"
            className="k-insp-input"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            style={{ fontSize: 14, padding: '11px 13px' }}
          />
        </div>

        {error ? (
          <div style={{ fontSize: 12.5, color: 'var(--k-danger)', lineHeight: 1.5 }}>{error}</div>
        ) : null}

        <button
          type="submit"
          className="k-btn k-btn--lg"
          disabled={busy}
          style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
        >
          {busy ? 'Sending…' : 'Send reset link →'}
        </button>
      </form>

      <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
        Remembered it?{' '}
        <Link className="k-link" style={{ fontSize: 12.5 }} to="/sign-in">
          Back to sign in →
        </Link>
      </div>
    </AuthShell>
  )
}
