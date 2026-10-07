import { useQuery } from '@tanstack/react-query'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { api } from '../lib/api'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import {
  billedAccounts,
  dollars,
  isTestMode,
  momDirection,
  momLabel,
  nrrLabel,
} from '../lib/revenue-rules'
import type { RevenueResponse } from '../lib/revenue-rules'

/**
 * Screen 67 — Revenue, from `GET /v1/admin/revenue`.
 *
 * Ported in SHAPE from design/components/admin-console-2.jsx (`AdminRevenue`),
 * and in nothing else: the design seeds MRR bars, a 12-month history and
 * invented Enterprise contracts. Every figure here is the endpoint's.
 *
 * The endpoint returns its own `notes[]` — that Stripe is in test mode, that
 * previous-month figures price each subscription at today's rate, that there is
 * no Enterprise record in the backend. They are rendered VERBATIM at the foot
 * rather than summarised, because they are the difference between reading these
 * numbers correctly and reading them confidently.
 *
 * What is deliberately absent: a 12-month MRR chart (no history is stored, so
 * it would be drawn from one point), and anything per-seat (rule 9).
 */

function Card({
  title,
  sub,
  children,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="k-set-card">
      <div
        className="k-set-card-hd"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <span>{title}</span>
        {sub ? <span style={{ fontWeight: 400, color: 'var(--k-fg-4)', fontSize: 11.5 }}>{sub}</span> : null}
      </div>
      {children}
    </section>
  )
}

function Money({ cents }: { cents: number | null | undefined }) {
  const v = dollars(cents)
  return <>{v == null ? '—' : fmtUSD(v)}</>
}

const PLAN_COLS = '2fr 1fr 1fr'
const FAILED_COLS = '2.2fr 1fr 1fr 1fr'
const ENT_COLS = '2fr 1fr 1.2fr 1fr 0.9fr'
const ONETIME_COLS = '2fr 0.8fr 1fr'

export default function AdminRevenuePage() {
  const rev = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: () => api.get<RevenueResponse>('/v1/admin/revenue'),
    staleTime: 60_000,
  })

  const d = rev.data
  const testMode = isTestMode(d?.stripe_mode)
  const mom = momLabel(d?.mrr_change_pct_mom, d?.mrr_previous_cents, d?.mrr_cents)
  const dir = momDirection(d?.mrr_change_pct_mom, d?.mrr_previous_cents)
  const byPlan = d?.mrr_by_plan ?? []
  const failed = d?.failed_payments ?? []
  const contracts = d?.enterprise_contracts ?? []
  const streams = d?.one_time?.streams ?? []

  return (
    <AdminShell active="Revenue">
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
              Revenue
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              Recurring revenue and what needs attention — read from Stripe, not computed here.
            </p>
          </div>
          {d ? (
            <Badge tone={testMode ? 'warn' : 'ok'} dot>
              {testMode ? 'Stripe test mode' : 'Stripe live'}
            </Badge>
          ) : null}
        </div>

        {/*
          * NOT A FOOTNOTE. Every figure below is play money in test mode, and a
          * dashboard that looks like a business reading is the one place that
          * cannot be a detail you have to go looking for.
          */}
        {d && testMode ? (
          /* `info`, not `wait` or `service`: rule 6b scopes `wait` to lines
             waiting on a retry and `service` to the site-wide outage banner,
             one colour one meaning. The amber signal is carried by the badge
             in the header instead. */
          <Alert tone="info" title="These are not real payments">
            Stripe is in <strong>test mode</strong>, so every figure on this screen comes from test
            data. Nothing here is money that has moved.
          </Alert>
        ) : null}

        {rev.error ? (
          <Alert tone="error" title="Could not load revenue">
            {rev.error instanceof Error ? rev.error.message : 'Unknown error'}
          </Alert>
        ) : null}

        {d?.truncated ? (
          <Alert tone="info" title="This is a partial read">
            Stripe returned more than this rollup covers, so the totals understate.
          </Alert>
        ) : null}

        {rev.isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
            Loading…
          </div>
        ) : null}

        {d ? (
          <>
            <div className="k-adm-kpis">
              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">MRR</div>
                <div className="k-adm-kpi-v">
                  <Money cents={d.mrr_cents} />
                </div>
                <div
                  className={`k-adm-kpi-d ${dir === 'up' ? 'k-adm-up' : dir === 'down' ? 'k-adm-down' : ''}`}
                  style={dir === 'flat' ? { color: 'var(--k-fg-3)' } : undefined}
                >
                  {mom ?? 'no comparison yet'}
                </div>
              </div>

              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">ARR run rate</div>
                <div className="k-adm-kpi-v">
                  <Money cents={d.arr_run_rate_cents} />
                </div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  {/* A run rate is this month annualised, not a forecast. */}
                  today’s MRR × 12
                </div>
              </div>

              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">Net new MRR</div>
                <div className="k-adm-kpi-v">
                  <Money cents={d.net_new_mrr_cents} />
                </div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  {nrrLabel(d.net_revenue_retention_pct, d.new_count, d.churned_count)}
                </div>
              </div>

              <div className="k-adm-kpi">
                <div className="k-adm-kpi-l">Net revenue retention</div>
                <div className="k-adm-kpi-v">
                  {d.net_revenue_retention_pct == null
                    ? '—'
                    : `${Math.round(d.net_revenue_retention_pct)}%`}
                </div>
                <div className="k-adm-kpi-d" style={{ color: 'var(--k-fg-3)' }}>
                  over {fmtInt(d.period_days ?? 30)} days
                </div>
              </div>
            </div>

            <div className="k-adm-split">
              <Card
                title="MRR by plan"
                sub={`${fmtInt(billedAccounts(byPlan))} billed account${billedAccounts(byPlan) === 1 ? '' : 's'}`}
              >
                {byPlan.length === 0 ? (
                  <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
                    No billed subscriptions.
                  </div>
                ) : (
                  <>
                    <div className="k-adm-tbl-hd" style={{ '--adm-cols': PLAN_COLS } as React.CSSProperties}>
                      <span>Plan</span>
                      <span>Accounts</span>
                      <span>MRR</span>
                    </div>
                    {byPlan.map((p) => (
                      <div
                        key={p.plan}
                        className="k-adm-tr"
                        style={{ '--adm-cols': PLAN_COLS, cursor: 'default' } as React.CSSProperties}
                      >
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.plan}</span>
                        <span className="k-mono" style={{ fontSize: 12.5 }}>
                          {fmtInt(p.account_count)}
                        </span>
                        <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                          <Money cents={p.mrr_cents} />
                        </span>
                      </div>
                    ))}
                  </>
                )}
                {/* Rule 9 and the comped/internal design: those accounts carry no
                    Stripe subscription, so they are missing from this table by
                    construction rather than by a filter someone has to remember. */}
                <div style={{ padding: '11px 18px', borderTop: '1px solid var(--k-line)', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                  Comped and internal accounts have no subscription, so they never appear here.
                </div>
              </Card>

              <Card
                title="One-time"
                sub={`last ${fmtInt(d.one_time?.period_days ?? d.period_days ?? 30)} days`}
              >
                {streams.length === 0 ? (
                  <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
                    No one-time charges.
                  </div>
                ) : (
                  <>
                    <div className="k-adm-tbl-hd" style={{ '--adm-cols': ONETIME_COLS } as React.CSSProperties}>
                      <span>Stream</span>
                      <span>Count</span>
                      <span>Revenue</span>
                    </div>
                    {streams.map((st) => (
                      <div
                        key={st.type}
                        className="k-adm-tr"
                        style={{ '--adm-cols': ONETIME_COLS, cursor: 'default' } as React.CSSProperties}
                      >
                        <span>{st.label}</span>
                        <span className="k-mono" style={{ fontSize: 12.5 }}>{fmtInt(st.count)}</span>
                        <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                          <Money cents={st.amount_cents} />
                        </span>
                      </div>
                    ))}
                  </>
                )}
                {/* Rule 9: one-time revenue stays OUT of MRR, ARR and retention,
                    which track subscriptions only. */}
                <div style={{ padding: '11px 18px', borderTop: '1px solid var(--k-line)', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                  Kept out of MRR, ARR and retention — those track subscriptions only.
                </div>
              </Card>
            </div>

            {/* The one actionable list on the screen, so it is not buried. */}
            <Card
              title={
                <span>
                  Failed payments
                  {failed.length ? (
                    <span style={{ color: 'var(--k-danger)', fontWeight: 400 }}> · {fmtInt(failed.length)}</span>
                  ) : null}
                </span>
              }
            >
              {failed.length === 0 ? (
                <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
                  Nothing has failed.
                </div>
              ) : (
                <>
                  <div className="k-adm-tbl-hd" style={{ '--adm-cols': FAILED_COLS } as React.CSSProperties}>
                    <span>Account</span>
                    <span>Amount</span>
                    <span>Failed</span>
                    <span>Next retry</span>
                  </div>
                  {failed.map((f, i) => (
                    <div
                      key={f.user_id ?? i}
                      className="k-adm-tr"
                      style={{ '--adm-cols': FAILED_COLS, cursor: 'default' } as React.CSSProperties}
                    >
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 600 }}>{f.email ?? f.user_id ?? '—'}</span>
                        {f.attempt_count ? (
                          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                            attempt {fmtInt(f.attempt_count)}
                          </span>
                        ) : null}
                      </span>
                      <span className="k-mono" style={{ fontSize: 12.5 }}>
                        <Money cents={f.amount_cents} />
                      </span>
                      <span style={{ fontSize: 12 }}>{f.failed_at ? fmtDate(f.failed_at) : '—'}</span>
                      <span style={{ fontSize: 12 }}>{f.next_retry_at ? fmtDate(f.next_retry_at) : '—'}</span>
                    </div>
                  ))}
                </>
              )}
            </Card>

            <Card title="Enterprise contracts">
              {contracts.length === 0 ? (
                <div style={{ padding: '22px 18px', color: 'var(--k-fg-3)', fontSize: 13, lineHeight: 1.55 }}>
                  None. There is no Enterprise plan or contract record in the backend yet, so this
                  stays empty rather than showing nothing and meaning something else.
                </div>
              ) : (
                <>
                  <div className="k-adm-tbl-hd" style={{ '--adm-cols': ENT_COLS } as React.CSSProperties}>
                    <span>Account</span>
                    <span>Annual value</span>
                    <span>Volume</span>
                    <span>Renews</span>
                    <span>Status</span>
                  </div>
                  {contracts.map((c, i) => (
                    <div
                      key={c.user_id ?? i}
                      className="k-adm-tr"
                      style={{ '--adm-cols': ENT_COLS, cursor: 'default' } as React.CSSProperties}
                    >
                      <span style={{ fontWeight: 600 }}>{c.account_name ?? c.user_id ?? '—'}</span>
                      <span className="k-mono" style={{ fontSize: 12.5 }}>
                        <Money cents={c.annual_value_cents} />
                      </span>
                      {/* Rule 9: volume licensing, never seats. */}
                      <span style={{ fontSize: 12 }}>{c.volume_label ?? '—'}</span>
                      <span style={{ fontSize: 12 }}>{c.renews_on ? fmtDate(c.renews_on) : '—'}</span>
                      <span style={{ fontSize: 12 }}>{c.status ?? '—'}</span>
                    </div>
                  ))}
                </>
              )}
            </Card>

            {/*
              * The endpoint's own caveats, VERBATIM. It knows things about its
              * numbers that this screen cannot infer -- which figures are
              * approximations, what is absent from the backend entirely -- and
              * paraphrasing them would be the frontend restating the server's
              * terms in its own words, which is how a caveat quietly loosens.
              */}
            {d.notes?.length ? (
              <Card title="How to read these figures" sub={d.generated_at ? `read ${fmtDate(d.generated_at)}` : undefined}>
                <ul
                  style={{
                    margin: 0,
                    padding: '12px 18px 14px 34px',
                    fontSize: 12.5,
                    color: 'var(--k-fg-3)',
                    lineHeight: 1.6,
                  }}
                >
                  {d.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AdminShell>
  )
}
