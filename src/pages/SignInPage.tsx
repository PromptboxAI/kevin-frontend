import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import KevinWordmark from '../components/KevinWordmark'
import GoogleG from '../components/GoogleG'
import { Icon, I } from '../components/Icon'
import { useAuth } from '../lib/auth'
import { getSupabase } from '../lib/supabase'
import { isAuthConfigured } from '../lib/env'

/**
 * Screen 00 — Sign in. Ported from `SignIn` in
 * `design/components/claims-dashboard.jsx`.
 *
 * This screen had never been ported at all. What was here was the day-one
 * bootstrap: a centred card built on `k-portal` / `k-form` / `k-field`, classes
 * invented to get auth working before the stylesheet was wired up. None of them
 * exist in the design. It worked, so nothing ever flagged it, and it was the
 * first thing anyone signing in saw.
 *
 * The real screen is the two-pane `k-auth` layout — form left, navy panel right
 * with the testimonial and the two security figures. Every class it needs was
 * already in kevin.css.
 *
 * Live: the email/password form, and Google (`signInWithOAuth`), which returns
 * a real error inline if the provider is not enabled on the Supabase project.
 * Static, and recorded in INTERACTIONS.md: "Keep me signed in" (Supabase
 * persists to localStorage either way — making the box real means swapping the
 * client's storage per sign-in) and "Use a passkey" (needs WebAuthn enrolment,
 * not a button).
 *
 * Deviations, noted: design `.html` hrefs become app routes, and the footer
 * says "AES-256 at rest" — the design's own wording on this screen, and rule 7
 * language, rather than the vaguer "Carrier-grade encryption" its shared
 * AuthShell uses.
 */

export default function SignInPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const destination = location.state?.from ?? '/claims'

  if (session) return <Navigate to={destination} replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(email, password)
      navigate(destination, { replace: true })
    } catch (cause) {
      // Supabase returns the same message for wrong password and unknown email.
      setError(cause instanceof Error ? cause.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function withGoogle() {
    setError(null)
    setBusy(true)
    try {
      const { error: err } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${destination}` },
      })
      if (err) throw new Error(err.message)
    } catch (cause) {
      const raw = cause instanceof Error ? cause.message : ''
      // Verified against the project's own /auth/v1/authorize: Google is not
      // enabled there yet, and Supabase answers "Unsupported provider". Raw,
      // that reads as a bug in Kevin. Enabling the provider in the Supabase
      // dashboard is a config toggle -- no code change here -- and this button
      // starts working the moment it flips.
      setError(
        /provider is not enabled|unsupported provider/i.test(raw)
          ? 'Google sign-in isn’t switched on for this environment yet — use your email and password below.'
          : raw || 'Could not start Google sign-in.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="k-auth">
      <div className="k-auth-l">
        <div style={{ padding: '24px 32px' }}>
          <KevinWordmark size={18} suffix={true} to="/" />
        </div>

        <div className="k-auth-l-body">
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
            Sign in
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
            Welcome back.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 28px', lineHeight: 1.5 }}>
            Your claims, exports, and inventories — all where you left them.
          </p>

          {!isAuthConfigured ? (
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
              Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code>, then rebuild.
            </p>
          ) : (
            <>
              <form className="k-auth-form" onSubmit={onSubmit}>
                <div className="k-insp-field">
                  <label htmlFor="signin-email">Work email</label>
                  <input
                    id="signin-email"
                    className="k-insp-input"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="k-insp-field">
                  <label htmlFor="signin-password" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Password</span>
                    <Link className="k-link" to="/forgot-password">
                      Forgot?
                    </Link>
                  </label>
                  <input
                    id="signin-password"
                    className="k-insp-input"
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <label className="k-toggle" style={{ marginTop: 4 }}>
                  <input type="checkbox" defaultChecked />
                  <span className="k-toggle-box">
                    <Icon d={I.check} size={10} stroke={2.5} />
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)' }}>
                    Keep me signed in on this device
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
                  disabled={busy}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                >
                  {busy ? 'Signing in…' : 'Sign in →'}
                </button>
              </form>

              <div className="k-auth-or">
                <span>or</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className="k-btn k-btn--ghost k-btn--lg"
                  onClick={() => void withGoogle()}
                  disabled={busy}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: 10,
                    background: '#fff',
                    borderColor: 'var(--k-line-2, var(--k-line))',
                    color: 'var(--k-fg)',
                    fontWeight: 600,
                  }}
                >
                  <GoogleG size={16} /> Continue with Google
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--ghost k-btn--lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon d={I.lock} size={13} /> Use a passkey
                </button>
              </div>

              {/* Design 00 sends this to 58-Account-create.html. That screen is
                  not built in the app yet (three steps: details, emailed code,
                  card via Stripe SetupIntent -- rule 9b, verified but never
                  charged). Rather than leave a 404 behind a link on the first
                  screen anyone sees, it goes to /pricing, which is live and is
                  where choosing Pro actually starts signup. Swap the target the
                  moment screen 58 lands; INTERACTIONS.md carries the note. */}
              <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
                New to Kevin?{' '}
                <Link className="k-link" style={{ fontSize: 12.5 }} to="/pricing">
                  Create an account →
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="k-auth-l-foot">
          <span>AES-256 at rest</span>
          <span>·</span>
          <span>TLS 1.3 in transit</span>
          <span>·</span>
          <span>© 2026</span>
        </div>
      </div>

      {/* — Right side: visual hook — */}
      <div className="k-auth-r">
        <div className="k-auth-r-inner">
          <div
            style={{
              fontFamily: 'var(--k-font-display)',
              fontStyle: 'italic',
              fontSize: 26,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.25,
              maxWidth: 380,
              textWrap: 'balance',
            }}
          >
            “I used to spend the morning typing what I shot the night before. Now I spend it
            reviewing.”
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--k-font-mono)',
            }}
          >
            Kevin Godfrey · Long Island Public Adjusters, LLC · Long Island, NY
          </div>
          <div
            style={{
              marginTop: 60,
              display: 'flex',
              gap: 32,
              fontFamily: 'var(--k-font-mono)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 36,
                  color: 'rgba(255,255,255,0.95)',
                  fontFamily: 'var(--k-font-display)',
                  fontStyle: 'italic',
                  textTransform: 'none',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                310+
              </div>
              <div style={{ marginTop: 6 }}>Claims processed</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 36,
                  color: 'rgba(255,255,255,0.95)',
                  fontFamily: 'var(--k-font-display)',
                  fontStyle: 'italic',
                  textTransform: 'none',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                430K
              </div>
              <div style={{ marginTop: 6 }}>Items inventoried</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
