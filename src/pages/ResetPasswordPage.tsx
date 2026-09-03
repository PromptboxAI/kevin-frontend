import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Icon, I } from '../components/Icon'
import { getSupabase } from '../lib/supabase'
import {
  MIN_SUBMIT_STRENGTH,
  checklist,
  labelFor,
  strengthOf,
  toneFor,
} from '../lib/password-rules'

/**
 * Screen 47 — Set a new password, reached from the emailed link. Ported from
 * `ResetPassword` in `design/components/auth-flow.jsx`.
 *
 * Supabase turns the recovery link into a real session on arrival, which is
 * what makes `updateUser({ password })` work here and nowhere else. If someone
 * opens this URL directly there is no such session, so the form is replaced by
 * a line pointing back at screen 45 rather than failing on submit.
 *
 * Strength scoring, the checklist and the submit gate live in
 * `lib/password-rules.ts` (24 unit tests) so the meter, the label and the
 * button cannot disagree.
 *
 * One deviation, noted: the design's "Sign out my other devices" checkbox is
 * kept but does nothing — Supabase's global sign-out would also end THIS
 * session, dropping the user at sign-in immediately after they set the
 * password. Recorded in INTERACTIONS.md; it needs a server-side revoke that
 * spares the current session.
 */

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The recovery link puts a session in place before this mounts.
  useEffect(() => {
    let live = true
    void getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (live) setReady(Boolean(data.session))
      })
    return () => {
      live = false
    }
  }, [])

  const strength = strengthOf(pw)
  const tone = toneFor(strength)
  const mismatch = confirm.length > 0 && pw !== confirm
  const canSend = strength >= MIN_SUBMIT_STRENGTH && pw === confirm && confirm.length > 0 && !busy

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { error: err } = await getSupabase().auth.updateUser({ password: pw })
      if (err) throw new Error(err.message)
      navigate('/claims', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not set the new password.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      quote={{
        text: "I drop a folder of fire-damage photos and walk away. By the time I'm back, every item is identified, priced, and ready to send to Xactimate.",
        who: 'Kevin Godfrey · Long Island Public Adjusters, LLC',
      }}
      stats={false}
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
        Choose a new password.
      </h1>

      {ready === false ? (
        <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
          This page opens from the link in your reset email, and that link is what proves the
          account is yours. It expires after 30 minutes.{' '}
          <Link className="k-link" to="/forgot-password">
            Send a new one →
          </Link>
        </p>
      ) : (
        <>
          <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Set it once — your other devices will be signed out for safety. You&apos;ll need to sign
            back in on each.
          </p>

          <form className="k-auth-form" onSubmit={onSubmit}>
            <div className="k-insp-field">
              <label htmlFor="new-pw">New password</label>
              <input
                id="new-pw"
                className="k-insp-input"
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Type a new password"
                autoFocus
                style={{ padding: '11px 13px', fontSize: 14, fontFamily: 'var(--k-font-mono)' }}
              />
              <div className="k-pw-meter">
                <div className="k-pw-bar">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`k-pw-cell ${i <= strength ? `k-pw-cell--${tone}` : ''}`}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    color:
                      strength >= 3
                        ? 'var(--k-ok)'
                        : strength === 2
                          ? 'var(--k-warn)'
                          : strength === 1
                            ? 'var(--k-danger)'
                            : 'var(--k-fg-4)',
                    fontFamily: 'var(--k-font-mono)',
                    fontWeight: 600,
                    minWidth: 80,
                  }}
                >
                  {labelFor(strength) || 'No password yet'}
                </span>
              </div>
            </div>

            <div className="k-insp-field">
              <label htmlFor="confirm-pw">Confirm new password</label>
              <input
                id="confirm-pw"
                className="k-insp-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type it again"
                style={{ padding: '11px 13px', fontSize: 14, fontFamily: 'var(--k-font-mono)' }}
              />
              {mismatch ? (
                <span style={{ fontSize: 11.5, color: 'var(--k-danger)' }}>
                  These do not match.
                </span>
              ) : null}
            </div>

            <div className="k-sec-rules">
              {checklist(pw).map(([l, ok]) => (
                <div key={l} className="k-sec-rule">
                  <span className={`k-sec-tick ${ok ? 'k-sec-tick--on' : ''}`}>
                    {ok ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
                  </span>
                  <span style={{ color: ok ? 'var(--k-fg-2)' : 'var(--k-fg-4)' }}>{l}</span>
                </div>
              ))}
            </div>

            <label className="k-toggle" style={{ marginTop: 4 }}>
              <input type="checkbox" defaultChecked />
              <span className="k-toggle-box">
                <Icon d={I.check} size={10} stroke={2.5} />
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)' }}>
                Sign out my other devices for safety
              </span>
            </label>

            {error ? (
              <div style={{ fontSize: 12.5, color: 'var(--k-danger)', lineHeight: 1.5 }}>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="k-btn k-btn--lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
              disabled={!canSend}
            >
              {busy ? 'Setting…' : 'Set new password & sign in →'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
