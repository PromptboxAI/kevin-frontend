import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { API_BASE_URL } from '../lib/env'
import { api } from '../lib/api'
import { fmtInt, fmtUSD } from '../lib/format'
import { useFailedJobs } from '../lib/admin'
import { bannerFor } from '../lib/service-status-rules'
import { useAdminAccounts } from '../lib/admin-accounts'
import { dollars, isTestMode } from '../lib/revenue-rules'
import type { RevenueResponse } from '../lib/revenue-rules'
import {
  accountBreakdown,
  attentionItems,
  byPressure,
  meteredLimits,
} from '../lib/admin-overview-rules'
import type { LimitsResponse } from '../lib/admin-overview-rules'
import { sinceLabel } from '../lib/admin-accounts-rules'
import { useStuckSessions } from '../lib/stuck-staging'

/**
 * Screen 64 — Overview. The first screen of the back office, answering one
 * question: is anything wrong, and how is the business.
 *
 * Built LAST of the read surfaces on purpose. It is a dashboard over Accounts,
 * Revenue and System, and building it before those existed would have meant
 * inventing the numbers it summarises — which on the one surface whose job is
 * to tell the truth about the system is the worst possible place to start.
 *
 * Not ported from the design's version: that one draws twelve months of MRR
 * bars and a "pipeline health" funnel. No MRR history is stored, so the bars
 * would be one point repeated, and there is no pipeline model in the backend
 * at all.
 */

const ACCT_COLS = '2.2fr 1fr 1fr 1fr'

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
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <span>{title}</span>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function AdminOverviewPage() {
  const revenue = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: () => api.get<RevenueResponse>('/v1/admin/revenue'),
    staleTime: 60_000,
  })
  const limits = useQuery({
    queryKey: ['admin', 'limits'],
    queryFn: () => api.get<LimitsResponse>('/v1/admin/limits'),
    staleTime: 60_000,
  })
  const accounts = useAdminAccounts('', 0, 100)
  const failed = useFailedJobs(500)
  const stuck = useStuckSessions()
  const status = useQuery({
    queryKey: ['service-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/status`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      return (await res.json()) as unknown
    },
    staleTime: 30_000,
  })

  const rows = accounts.data?.accounts ?? []
  const totalAccounts = accounts.data?.total ?? accounts.data?.count ?? rows.length
  /* The breakdown counts the PAGE. With more accounts than one page it would
     understate, so it says which it is rather than implying a whole. */
  const partial = totalAccounts > rows.length
  const breakdown = accountBreakdown(rows)
  const pricing = bannerFor(status.data, (iso) => iso)

  const attention = attentionItems({
    failedJobs: failed.data?.count ?? 0,
    failedPayments: revenue.data?.failed_payments?.length ?? 0,
    pastDueAccounts: breakdown.pastDue,
    pricingDegraded: Boolean(pricing),
    limits: limits.data,
    stuckSessions: stuck.data?.sessions.length ?? 0,
    /* Undefined while the query is in flight, so a slow read does not flash
       "cannot be detected" at someone every time this page opens. */
    stuckLivenessKnown: stuck.data ? stuck.data.liveness_known : undefined,
  })

  const meters = byPressure(meteredLimits(limits.data?.limits))
  const recent = [...rows]
    .filter((a) => a.last_active_at)
    .sort((a, b) => Date.parse(b.last_active_at ?? '') - Date.parse(a.last_active_at ?? ''))
    .slice(0, 6)

  return (
    <AdminShell active="Overview">
      <div className="k-adm-body">
        <div className="k-adm-sec-hd">
          <div>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 28,
                letterSpacing: '-0.022em',
                margin: '0 0 4px',
              }}
            >
              Overview
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              Everything on this page is read from the API — nothing is estimated here.
            </p>
          </div>
          <Badge tone={attention.length ? 'warn' : 'ok'} dot>
            {attention.length
              ? `${fmtInt(attention.length)} need${attention.length === 1 ? 's' : ''} attention`
              : 'All clear'}
          </Badge>
        </div>

        {revenue.data && isTestMode(revenue.data.stripe_mode) ? (
          <Alert tone="info" title="Stripe is in test mode">
            The money below is test data. Nothing here has actually been charged.
          </Alert>
        ) : null}

        <div className="k-adm-kpis">
          <Link className="k-adm-kpi k-adm-kpi--link" to="/admin/revenue">
            <div className="k-adm-kpi-l">MRR</div>
            <div className="k-adm-kpi-v">
              {revenue.data ? (fmtUSD(dollars(revenue.data.mrr_cents) ?? 0)) : '—'}
            </div>
            <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
              Revenue <Icon d={I.chevright} size={11} />
            </div>
          </Link>

          <Link className="k-adm-kpi k-adm-kpi--link" to="/admin/accounts">
            <div className="k-adm-kpi-l">Accounts</div>
            <div className="k-adm-kpi-v">{fmtInt(totalAccounts)}</div>
            <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
              {breakdown.nonBilling
                ? `${fmtInt(breakdown.nonBilling)} comped or internal`
                : 'all billable'}
            </div>
          </Link>

          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">On trial</div>
            <div className="k-adm-kpi-v">{fmtInt(breakdown.trial)}</div>
            <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
              {/* Rule 9b: the trial is a lifetime pool, so there is no clock to
                  report and no renewal date to print beside it. */}
              250 items each, no deadline
            </div>
          </div>

          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Past due</div>
            <div className="k-adm-kpi-v" style={breakdown.pastDue ? { color: 'var(--k-danger)' } : undefined}>
              {fmtInt(breakdown.pastDue)}
            </div>
            <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
              {breakdown.pastDue ? 'a card is failing' : 'every card is good'}
            </div>
          </div>
        </div>

        {partial ? (
          <p style={{ fontSize: 11.5, color: 'var(--k-fg-4)', margin: 0 }}>
            The trial and past-due counts are over the {fmtInt(rows.length)} accounts on this page,
            not all {fmtInt(totalAccounts)}.
          </p>
        ) : null}

        <div className="k-adm-split">
          <Card title="Needs attention">
            {attention.length === 0 ? (
              <div
                style={{
                  padding: '30px 18px',
                  textAlign: 'center',
                  color: 'var(--k-fg-3)',
                  fontSize: 13,
                }}
              >
                Nothing is wrong. No failed jobs, no failed payments, no account past due.
              </div>
            ) : (
              attention.map((a) => (
                <Link
                  key={a.key}
                  to={a.to ?? '/admin/system'}
                  className="k-adm-tr"
                  style={{ '--adm-cols': '1fr auto', cursor: 'pointer' } as React.CSSProperties}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 99,
                        flex: '0 0 auto',
                        background:
                          a.rank === 0 ? 'var(--k-danger)' : a.rank === 1 ? 'var(--k-warn)' : 'var(--k-fg-4)',
                      }}
                    />
                    <span style={{ fontSize: 12.5 }}>{a.label}</span>
                  </span>
                  <Icon d={I.chevright} size={12} />
                </Link>
              ))
            )}
          </Card>

          <Card title="Capacity" action={<Link className="k-link" style={{ fontSize: 12 }} to="/admin/system">System →</Link>}>
            {meters.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
                Nothing reports a usable ceiling right now.
              </div>
            ) : (
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {meters.slice(0, 5).map((l) => {
                  const pct = Math.min(Math.max(l.percent_used ?? 0, 0), 100)
                  const crit = (l.state ?? '').toLowerCase() === 'critical'
                  const warn = (l.state ?? '').toLowerCase() === 'warning'
                  return (
                    <div key={l.key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: 'var(--k-fg-2)' }}>{l.name}</span>
                        <span className="k-mono" style={{ color: 'var(--k-fg-4)' }}>
                          {fmtInt(l.used ?? 0)} / {fmtInt(l.limit ?? 0)}
                        </span>
                      </div>
                      <div className="k-progress" style={{ width: '100%' }}>
                        <div
                          className="k-progress-bar"
                          style={{
                            width: `${pct}%`,
                            background: crit
                              ? 'var(--k-danger)'
                              : warn
                                ? 'var(--k-warn)'
                                : 'var(--k-accent)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Recently active"
          action={<Link className="k-link" style={{ fontSize: 12 }} to="/admin/accounts">All accounts →</Link>}
        >
          {recent.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
              No account has been active yet.
            </div>
          ) : (
            <>
              <div className="k-adm-tbl-hd" style={{ '--adm-cols': ACCT_COLS } as React.CSSProperties}>
                <span>Account</span>
                <span>Plan</span>
                <span>Claims</span>
                <span>Last active</span>
              </div>
              {recent.map((a) => (
                <Link
                  key={a.user_id}
                  className="k-adm-tr"
                  style={{ '--adm-cols': ACCT_COLS } as React.CSSProperties}
                  to={`/admin/accounts/${encodeURIComponent(a.user_id)}`}
                >
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                    {a.email}
                  </span>
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{a.plan}</span>
                  <span className="k-mono" style={{ fontSize: 12.5 }}>
                    {a.claims_count == null ? '—' : fmtInt(a.claims_count)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>
                    {sinceLabel(a.last_active_at) ?? '—'}
                  </span>
                </Link>
              ))}
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}
