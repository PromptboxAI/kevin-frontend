import { useState } from 'react'
import SettingsShell from '../components/SettingsShell'
import { getSupabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

/**
 * Screen 41 — Security, at `/settings/security` per ROUTES.md.
 *
 * The design consolidates password, 2FA, passkeys and sessions here. Only the
 * password is actually reachable: `supabase.auth.updateUser` changes it, and
 * the rest need either an enrolment flow (MFA) or an endpoint that lists
 * devices, neither of which exists. They are named rather than mocked.
 *
 * Nothing here reads or transmits the CURRENT password. Supabase updates the
 * password on the authenticated session, so possession of a live session is
 * the proof — which is also why signing out everywhere matters more here than
 * a confirmation field would.
 */

const MIN_LENGTH = 8

export default function SettingsSecurityPage() {
  const { signOut } = useAuth()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tooShort = next.length > 0 && next.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit = next.length >= MIN_LENGTH && next === confirm && !busy

  const submit = async () => {
    setBusy(true)
    setNotice(null)
    setError(null)
    try {
      const { error: err } = await getSupabase().auth.updateUser({ password: next })
      if (err) throw new Error(err.message)
      setNext('')
      setConfirm('')
      // Say what did NOT happen: other devices keep their sessions, and a
      // password change is worth nothing if the phone someone lost stays in.
      setNotice(
        'Password changed. Other devices stay signed in — use “Sign out everywhere” if you want them out.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsShell activeId="my-profile" title="Security" eyebrow="Account">
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 2px',
          }}
        >
          Security
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
          Your password, and getting other devices out.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Change password</div>
        <div className="k-set-card-body">
          <div className="k-set-grid2">
            <div className="k-insp-field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                className="k-insp-input"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
              <span style={{ fontSize: 11, color: tooShort ? 'var(--k-danger)' : 'var(--k-fg-4)' }}>
                {tooShort ? `At least ${MIN_LENGTH} characters.` : `${MIN_LENGTH} characters or more.`}
              </span>
            </div>

            <div className="k-insp-field">
              <label htmlFor="confirm-password">Confirm</label>
              <input
                id="confirm-password"
                className="k-insp-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <span style={{ fontSize: 11, color: mismatch ? 'var(--k-danger)' : 'var(--k-fg-4)' }}>
                {mismatch ? 'These do not match.' : ' '}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <button type="button" className="k-btn" disabled={!canSubmit} onClick={() => void submit()}>
              {busy ? 'Changing…' : 'Change password'}
            </button>
            {error ? (
              <span style={{ fontSize: 12, color: 'var(--k-danger)' }}>{error}</span>
            ) : notice ? (
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{notice}</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Devices</div>
        <div className="k-set-card-body">
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sign out everywhere</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Ends this session. Other devices drop when their token expires.
              </div>
            </div>
            <button
              type="button"
              className="k-btn k-btn--ghost k-btn--sm"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>

          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>A paired phone is separate</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Capture credentials are per claim — revoke one from that claim’s
                “From phone” panel.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Not built</div>
        <div className="k-set-card-body">
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Two-factor and passkeys</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Needs an enrolment flow, not just a screen.
              </div>
            </div>
          </div>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Active session list</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                No endpoint lists devices, so none can be shown or ended individually.
              </div>
            </div>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
