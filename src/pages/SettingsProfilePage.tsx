import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import SettingsShell from '../components/SettingsShell'
import { api } from '../lib/api'
import { fmtInt } from '../lib/format'
import type { MeResponse } from '../lib/types'

/**
 * Screen 31 — My profile.
 *
 * `GET /v1/me` is read-only and there is no profile write route (ask 33), so
 * nothing here saves and no Save button is shown.
 *
 * On layout: `.k-set-row` is a `flex:1` title block plus a right-hand value or
 * control — that is how the design uses it everywhere. Building label/value
 * pairs out of two bare spans instead is what made the type look inconsistent
 * and the rows sit ragged.
 *
 * On copy: the reasoning for design decisions belongs in comments like this
 * one, not on screen. A settings row gets a line, not a paragraph. The full
 * argument for per-claim preparer identity is in ask 25.
 */

/** One read-only fact. Title left, value right, one type scale. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="k-set-row">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{value}</div>
    </div>
  )
}

export default function SettingsProfilePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })

  const quota = me.data?.quota

  return (
    <SettingsShell activeId="my-profile" title="My profile" eyebrow="Account">
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
          {me.data?.email ?? 'Your account'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
          Signed in with your work email.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Account</div>
        <div className="k-set-card-body">
          <Row label="Email" value={<span className="k-mono">{me.data?.email ?? '—'}</span>} />
          {quota ? <Row label="Plan" value={quota.plan} /> : null}
          {quota ? (
            <Row
              label="Items this cycle"
              value={
                <span className="k-mono">
                  {fmtInt(quota.items_used)} of {fmtInt(quota.included_items)}
                </span>
              }
            />
          ) : null}
          <Row
            label="Account ID"
            value={
              <span className="k-mono" style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                {me.data?.id ?? '—'}
              </span>
            }
          />
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Security</div>
        <div className="k-set-card-body">
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Password</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Change your password and review sign-in.
              </div>
            </div>
            <Link className="k-btn k-btn--ghost k-btn--sm" to="/settings/security">
              Manage
            </Link>
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Not editable here</div>
        <div className="k-set-card-body">
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Name, phone, title and photo</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                No profile endpoint yet — nothing here would save.
              </div>
            </div>
          </div>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>“Prepared by” on an export</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Set per claim, so a filed document keeps the name that was on it.
              </div>
            </div>
            <Link className="k-btn k-btn--ghost k-btn--sm" to="/claims/new">
              New claim
            </Link>
          </div>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Notification preferences</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Waiting on the sending service.
              </div>
            </div>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
