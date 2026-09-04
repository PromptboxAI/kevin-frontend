import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { I, Icon } from '../components/Icon'
import KevinWordmark from '../components/KevinWordmark'
import { useAuth } from '../lib/auth'
import { isAuthConfigured } from '../lib/env'

/**
 * Screen 58 — Create account (/sign-up). Ported from `AccountCreate` in
 * design/components/onboarding.jsx.
 *
 * The three steps and every word of copy are the design's: create → verify →
 * card. The metered-trial language is load-bearing (CLAUDE.md rule 9b): no
 * countdown, no charge date, no trial_period_days — the subscription starts
 * when the adjuster chooses Pro or passes 250 items, and nothing else.
 *
 * LIVE: steps 1 and 2. Step 1 calls supabase.auth.signUp, step 2 verifies the
 * emailed code (verifyOtp) and can resend it. If the project happens to return
 * a session immediately — email confirmation switched off — the flow skips
 * straight past verification rather than asking for a code that never arrives.
 *
 * TWO deviations, both in step 3:
 *
 * 1. **No raw card fields.** The prototype collects card number, expiry and CVC
 *    into React state, directly under its own line saying card details never
 *    touch Kevin's servers. Fine as a picture of the screen; shipped, it is a
 *    PCI problem and makes the page contradict itself. Capture hands off to
 *    Stripe instead.
 *
 * 2. **The hand-off degrades instead of trapping.** Card verification at signup
 *    is a real requirement (rule 9b: the anti-fraud step and the `card_added`
 *    conversion event), but the backend has only /v1/billing/checkout,
 *    /credits/checkout and /portal — there is no SetupIntent route to save a
 *    card at $0. Until one exists this step records both consents, says plainly
 *    that the card comes before Pro rather than today, and lets the account
 *    into its 250 free items. Blocking every signup on an endpoint that does
 *    not exist would be worse than deferring an anti-fraud check.
 *
 * When `POST /v1/billing/setup` lands: call it here, redirect to the returned
 * Stripe URL, and make the consents a precondition of that call. Both consents
 * still need persisting server-side — they are a client-side gate today, which
 * is recorded in INTERACTIONS.md.
 */

const WORKTYPES: [string, string, string][] = [
  [
    'insurance',
    'Insurance claims',
    'Adjuster or public adjuster — your workspace holds Claims, prices to RCV/ACV, and exports to Xactimate.',
  ],
  [
    'estate',
    'Estate sales',
    'Estate-sale or liquidation professional — your workspace holds Estates, prices to fair market value, and tracks what each item sold for.',
  ],
]

const ACC_INPUT: CSSProperties = { padding: '11px 13px', fontSize: 14 }

function AccField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="k-insp-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

export default function SignUpPage() {
  const { session, signUp, verifySignUp, resendSignUp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [firm, setFirm] = useState('')
  const [pw, setPw] = useState('')
  const [work, setWork] = useState('insurance')
  const [code, setCode] = useState('')
  const [consentRenew, setConsentRenew] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // An already-signed-in visitor has no business on a create-account screen.
  // Step 2 onward is exempt: verifyOtp signs them in mid-flow, and bouncing
  // them out of their own signup would strip the card step off the end of it.
  if (session && step === 0) return <Navigate to="/claims" replace />

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  const strength = !pw
    ? 0
    : pw.length < 7
      ? 1
      : pw.length < 12
        ? 2
        : /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) && pw.length >= 14
          ? 4
          : 3
  const tone = ['line', 'danger', 'warn', 'ok', 'ok'][strength]
  const label = ['', 'Too short', 'OK', 'Strong', 'Excellent'][strength]
  const meets = pw.length >= 7 && /[A-Z]/.test(pw) && /\d/.test(pw)
  const codeOk = code.replace(/\D/g, '').length === 6

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    if (!emailOk || !name.trim() || !meets) return
    setError(null)
    setNotice(null)
    if (!isAuthConfigured) {
      setError('Sign-up is not available in this environment.')
      return
    }
    setBusy(true)
    try {
      const { needsConfirmation } = await signUp(email, pw, {
        name: name.trim(),
        firm: firm.trim() || null,
        work_type: work,
      })
      // Confirmation off on the project? Then there is no code to ask for.
      setStep(needsConfirmation ? 1 : 2)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the account.')
    } finally {
      setBusy(false)
    }
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault()
    if (!codeOk) return
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await verifySignUp(email, code.replace(/\D/g, ''))
      setStep(2)
    } catch (cause) {
      const raw = cause instanceof Error ? cause.message : ''
      // A project whose confirmation template sends only a link has no token to
      // check, and Supabase answers with an "invalid token" that reads as the
      // user mistyping. Say what actually happened.
      setError(
        /token|otp|expired/i.test(raw)
          ? `${raw} — if the email contained a link rather than a code, click the link instead.`
          : raw || 'Could not verify that code.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function onResend() {
    setError(null)
    setNotice(null)
    try {
      await resendSignUp(email)
      setNotice('Sent. Give it a minute, and check spam.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resend the code.')
    }
  }

  const consented = consentRenew && consentTerms

  return (
    <div className="k-onb-page">
      <header className="k-onb-top">
        <KevinWordmark size={18} suffix to="/" />
        <Link className="k-link" to="/sign-in" style={{ fontSize: 12.5 }}>
          Already have an account? Sign in
        </Link>
      </header>

      <main className="k-onb-col" style={{ maxWidth: 560 }}>
        <div className="k-onb-card">
          <div className="k-onb-eyebrow">Start free · 250 items · step {step + 1} of 3</div>
          <div className="k-onb-dots" style={{ marginBottom: 18 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`k-onb-dot ${
                  i < step ? 'k-onb-dot--done' : i === step ? 'k-onb-dot--on' : ''
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <>
              <h1 className="k-onb-h">Create your account.</h1>
              <p className="k-onb-sub">
                Full access for your first 250 line items — real claims, real exports. No deadline
                and no charge until you start Pro.
              </p>
              <form className="k-auth-form" onSubmit={onCreate} style={{ marginTop: 22, gap: 18 }}>
                <AccField label="Your name">
                  <input
                    className="k-insp-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First and last name"
                    autoComplete="name"
                    autoFocus
                    style={ACC_INPUT}
                  />
                </AccField>
                <AccField label="Work email">
                  <input
                    className="k-insp-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={ACC_INPUT}
                  />
                </AccField>
                <AccField label="Password">
                  <input
                    className="k-insp-input"
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="7+ characters, one uppercase, one number"
                    autoComplete="new-password"
                    style={{ ...ACC_INPUT, fontFamily: 'var(--k-font-mono)' }}
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
                      {label || 'No password yet'}
                    </span>
                  </div>
                </AccField>
                <AccField label="Firm name (optional)">
                  <input
                    className="k-insp-input"
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    placeholder="e.g. Long Island Public Adjusters, LLC"
                    autoComplete="organization"
                    style={ACC_INPUT}
                  />
                </AccField>
                <AccField label="What will you inventory?">
                  <div className="k-onb-worktypes">
                    {WORKTYPES.map(([id, t, sub]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setWork(id)}
                        className={`k-format ${work === id ? 'k-format--on' : ''}`}
                        style={{ textAlign: 'left' }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--k-fg-4)',
                            marginTop: 3,
                            lineHeight: 1.45,
                          }}
                        >
                          {sub}
                        </div>
                        {work === id && (
                          <div className="k-format-check">
                            <Icon d={I.check} size={11} stroke={2.5} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </AccField>
                {error && <div className="k-signup-error">{error}</div>}
                <button
                  className="k-btn k-btn--lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={busy || !emailOk || !name.trim() || !meets}
                >
                  {busy ? 'Creating your account…' : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="k-onb-h">Check your email.</h1>
              <p className="k-onb-sub">
                We sent a 6-digit code to{' '}
                <span style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>{email}</span>. Enter it
                here, or click the magic link in the email — either works.
              </p>
              <form className="k-auth-form" onSubmit={onVerify} style={{ marginTop: 22, gap: 18 }}>
                <AccField label="Verification code">
                  <input
                    className="k-insp-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    autoFocus
                    style={{
                      ...ACC_INPUT,
                      fontFamily: 'var(--k-font-mono)',
                      fontSize: 22,
                      letterSpacing: '0.35em',
                      textAlign: 'center',
                      maxWidth: 240,
                    }}
                  />
                </AccField>
                {error && <div className="k-signup-error">{error}</div>}
                {notice && <div className="k-signup-notice">{notice}</div>}
                <button
                  className="k-btn k-btn--lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={busy || !codeOk}
                >
                  {busy ? 'Verifying…' : 'Verify email →'}
                </button>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="k-link"
                    onClick={onResend}
                    style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12.5 }}
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    className="k-link"
                    onClick={() => setStep(0)}
                    style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12.5 }}
                  >
                    ← Back
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="k-onb-h">One last thing.</h1>
              {/* Disclosure ABOVE everything else — the legally load-bearing
                  block, verbatim from the design. */}
              <div
                style={{
                  background: 'var(--k-accent-soft)',
                  border: '1px solid oklch(0.45 0.13 255 / 0.25)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  margin: '18px 0 4px',
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: 'var(--k-fg)',
                  maxWidth: 480,
                }}
              >
                <strong style={{ fontWeight: 700 }}>
                  You are not charged today, and there is no countdown.
                </strong>{' '}
                Your first <strong style={{ fontWeight: 700 }}>250 line items</strong> are free. Pro
                is <strong style={{ fontWeight: 700 }}>$249/month</strong>, and it starts only when
                you choose it or continue past those 250 items — we ask for a card then, and email
                you first, and again at 200 items. Cancel any time in Settings → Billing.
              </div>

              <form
                className="k-auth-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (consented) navigate('/claims', { replace: true })
                }}
                style={{ marginTop: 18, gap: 18 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--k-fg-4)',
                  }}
                >
                  <Icon d={I.lock} size={12} />{' '}
                  <span>
                    When it's time, payment is handled by Stripe — card details never touch Kevin's
                    servers.
                  </span>
                </div>
                {/* Two SEPARATE consents, both unchecked by default. */}
                <label
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: 'var(--k-fg-2)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consentRenew}
                    onChange={(e) => setConsentRenew(e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    I understand that once I start Pro — by choosing it or by passing my 250 free
                    items — my subscription auto-renews at $249/month, and I can cancel any time.
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: 'var(--k-fg-2)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={(e) => setConsentTerms(e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    I agree to the{' '}
                    <Link className="k-link" to="/legal#terms">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link className="k-link" to="/legal">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <button
                  className="k-btn k-btn--lg"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: consented ? 1 : 0.45,
                  }}
                  disabled={!consented}
                >
                  Start free — 250 items →
                </button>
              </form>
            </>
          )}
        </div>
        <div className="k-onb-trust">
          <span>
            <Icon d={I.lock} size={11} /> Stripe-secured checkout
          </span>
          <span>AES-256 at rest</span>
          <span>TLS 1.3 in transit</span>
        </div>
      </main>

      <footer className="k-onb-bot">
        Carrier-grade encryption at rest · TLS 1.3 in transit · © 2026
      </footer>
    </div>
  )
}
