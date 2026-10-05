import { Link, useParams } from 'react-router-dom'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import { useAdminAccount, unavailableFrom } from '../lib/admin-accounts'
import {
  allowanceLabel,
  allowancePeriod,
  fmtBytes,
  isNonBilling,
  isOverAllowance,
  itemsRemaining,
  planLabel,
  sinceLabel,
  stateLabel,
  stateTone,
  usageFraction,
} from '../lib/admin-accounts-rules'

/**
 * Screen 66 — Account detail. One account: what they are on, what they have
 * used, what they have built, and what went wrong for them.
 *
 * Ported in SHAPE from design/components/admin-console.jsx (`AdminAccountDetail`).
 * Three things the design does that this deliberately does not:
 *
 * 1. **No MRR anywhere.** §4.1 returns no money and a figure derived from a
 *    plan name would be invented. Revenue is its own screen, from its own
 *    rollup.
 * 2. **No action buttons that do nothing.** The design's Suspend / Refund /
 *    Comp / ⋯ overflow are §4.3–§4.5, none of which exist on the server yet.
 *    A dead button on a support screen is worse than an absent one: it implies
 *    the owner has a lever they do not have. They arrive when the routes do.
 * 3. **No "sign in as".** Never — support diagnoses from the back office
 *    (prompt 4, rule 1). There is no impersonation path and there will not be.
 *
 * All fields read from ONE record, which is the thing the design prototype got
 * wrong: it hardcoded the header, KPI strip and subscription card separately
 * so they could drift.
 */

function Card({
  title,
  action,
  children,
}: {
  title: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="k-set-card">
      <div
        className="k-set-card-hd"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {title}
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--k-line)' }}>
      <div
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--k-fg-4)',
          fontWeight: 600,
          fontFamily: 'var(--k-font-mono)',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, marginTop: 4 }}>{children}</div>
    </div>
  )
}

const CLAIM_COLS = '2.2fr 1fr 0.8fr 0.8fr 1fr 1fr'

export default function AdminAccountDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const account = useAdminAccount(userId)
  const unavailable = unavailableFrom(account.error)
  const a = account.data

  const remaining = a ? itemsRemaining(a) : null
  const pct = a ? usageFraction(a) : null
  const over = a ? isOverAllowance(a) : false
  const claims = a?.claims ?? []
  const activity = a?.recent_activity ?? []

  return (
    <AdminShell active="Accounts">
      <div className="k-adm-body">
        <div style={{ fontSize: 12.5 }}>
          <Link className="k-link" to="/admin/accounts">
            ← Accounts
          </Link>
        </div>

        {unavailable === 'not_built' ? (
          <Alert tone="info" title="The accounts API is not on production yet">
            This screen is built against the agreed shape of{' '}
            <code>GET /v1/admin/accounts/{'{user_id}'}</code> (BACKEND-PROMPTS 4 §4.1). It turns on
            once <code>feat/admin-accounts</code> is merged and migration 0064 is applied.
          </Alert>
        ) : null}

        {unavailable === 'forbidden' ? (
          <Alert tone="error" title="This account cannot read the admin API">
            The admin routes are gated on <code>app_metadata.role = "admin"</code>.
          </Alert>
        ) : null}

        {account.error && unavailable === null ? (
          <Alert tone="error" title="Could not load this account">
            {account.error instanceof Error ? account.error.message : 'Unknown error'}
          </Alert>
        ) : null}

        {account.isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
            Loading…
          </div>
        ) : null}

        {a ? (
          <>
            <div className="k-adm-sec-hd">
              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    fontFamily: 'var(--k-font-display)',
                    fontWeight: 400,
                    fontSize: 28,
                    letterSpacing: '-0.022em',
                    margin: '0 0 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.email}
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--k-fg-4)',
                    margin: 0,
                    fontFamily: 'var(--k-font-mono)',
                  }}
                >
                  {a.user_id}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge tone={stateTone(a.billing_state)} dot>
                  {stateLabel(a.billing_state)}
                </Badge>
                <Badge tone="quiet">{planLabel(a.plan)}</Badge>
              </div>
            </div>

            {isNonBilling(a.billing_state) ? (
              <Alert tone="neutral" title={`This account is ${stateLabel(a.billing_state).toLowerCase()}`}>
                It carries $0 and is excluded from every revenue rollup by construction, so it
                will never appear in MRR, ARR or retention.
              </Alert>
            ) : null}

            {(a.billing_state ?? '').toLowerCase() === 'past_due' ? (
              <Alert tone="error" title="Payment has failed on this account">
                Work is not blocked by a failed payment — the account keeps its plan allowance
                until something changes it. Nothing here suspends or retries the charge yet;
                those are BACKEND-PROMPTS 4 §4.4.
              </Alert>
            ) : null}

            <div className="k-adm-kpis">
              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">Items used</div>
                <div className="k-adm-kpi-v">
                  {a.items_used == null ? '—' : fmtInt(a.items_used)}
                </div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  {a.included_items == null
                    ? 'allowance unknown'
                    : `of ${fmtInt(a.included_items)} ${allowanceLabel(a.plan)}`}
                </div>
              </div>
              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">Items left</div>
                <div className="k-adm-kpi-v">{remaining == null ? '—' : fmtInt(remaining)}</div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  {(a.credit_balance ?? 0) > 0
                    ? `includes ${fmtInt(a.credit_balance)} credits`
                    : 'no credits bought'}
                </div>
              </div>
              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">Claims</div>
                <div className="k-adm-kpi-v">
                  {a.claims_count == null ? '—' : fmtInt(a.claims_count)}
                </div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  {a.photos_count == null ? 'photos unknown' : `${fmtInt(a.photos_count)} photos`}
                </div>
              </div>
              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">Storage</div>
                <div className="k-adm-kpi-v">{fmtBytes(a.storage_bytes)}</div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  nothing is ever deleted to reclaim it
                </div>
              </div>
            </div>

            <div className="k-adm-split">
              <Card title="Usage">
                <div style={{ padding: '16px 18px' }}>
                  {pct == null ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--k-fg-3)' }}>
                      The server did not report an allowance for this account.
                    </p>
                  ) : (
                    <>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: 'var(--k-bg-3)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.round(pct * 100)}%`,
                            height: '100%',
                            background: over ? 'var(--k-warn)' : 'var(--k-accent)',
                          }}
                        />
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--k-fg-3)' }}>
                        {fmtInt(a.items_used)} of {fmtInt(a.included_items)} items{' '}
                        {allowancePeriod(a.plan) === 'lifetime' ? (
                          <>
                            — this is a <strong>lifetime</strong> pool, not a monthly one, and it
                            does not renew.
                          </>
                        ) : (
                          <>used this billing month.</>
                        )}
                      </p>
                      {/* Rule 9c, and the single most common support question. */}
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--k-fg-4)' }}>
                        The counter records items <em>produced</em>, not items kept — deleting an
                        item does not give the quota back, because the API spend is already
                        incurred.
                      </p>
                    </>
                  )}
                </div>
              </Card>

              <Card title="Account">
                <Field label="Plan">{planLabel(a.plan)}</Field>
                <Field label="Billing state">{stateLabel(a.billing_state)}</Field>
                <Field label="Credits">
                  {a.credit_balance == null ? '—' : `${fmtInt(a.credit_balance)} items`}
                </Field>
                <Field label="Joined">{a.created_at ? fmtDate(a.created_at) : '—'}</Field>
                <Field label="Last active">
                  {sinceLabel(a.last_active_at) ?? '—'}
                </Field>
              </Card>
            </div>

            <Card
              title={
                <span>
                  Claims
                  {claims.length ? (
                    <span style={{ color: 'var(--k-fg-4)', fontWeight: 400 }}>
                      {' '}
                      · {fmtInt(claims.length)}
                    </span>
                  ) : null}
                </span>
              }
            >
              {claims.length === 0 ? (
                <div
                  style={{
                    padding: '28px 18px',
                    textAlign: 'center',
                    color: 'var(--k-fg-3)',
                    fontSize: 13,
                  }}
                >
                  No claims on this account.
                </div>
              ) : (
                <>
                  <div
                    className="k-adm-tbl-hd"
                    style={{ '--adm-cols': CLAIM_COLS } as React.CSSProperties}
                  >
                    <span>Claim</span>
                    <span>Status</span>
                    <span>Items</span>
                    <span>Photos</span>
                    <span>RCV</span>
                    <span>Updated</span>
                  </div>
                  {claims.map((c) => (
                    <div
                      key={c.claim_id}
                      className="k-adm-tr"
                      style={{ '--adm-cols': CLAIM_COLS, cursor: 'default' } as React.CSSProperties}
                    >
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 600 }}>{c.name || 'Untitled claim'}</span>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 11.5,
                            color: 'var(--k-fg-4)',
                            fontFamily: 'var(--k-font-mono)',
                          }}
                        >
                          {c.claim_id}
                        </span>
                      </span>
                      <span style={{ fontSize: 12 }}>{c.status ?? '—'}</span>
                      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>
                        {c.item_count == null ? '—' : fmtInt(c.item_count)}
                      </span>
                      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>
                        {c.photo_count == null ? '—' : fmtInt(c.photo_count)}
                      </span>
                      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>
                        {c.total_rcv == null ? '—' : fmtUSD(c.total_rcv)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>
                        {sinceLabel(c.updated_at) ?? '—'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </Card>

            {activity.length ? (
              <Card title="Recent activity">
                {activity.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '11px 18px',
                      borderBottom: '1px solid var(--k-line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 14,
                      fontSize: 13,
                    }}
                  >
                    <span>{e.summary ?? e.kind ?? '—'}</span>
                    <span style={{ fontSize: 12, color: 'var(--k-fg-3)', whiteSpace: 'nowrap' }}>
                      {sinceLabel(e.at) ?? '—'}
                    </span>
                  </div>
                ))}
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AdminShell>
  )
}
