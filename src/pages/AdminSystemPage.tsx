import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { API_BASE_URL } from '../lib/env'
import { fmtInt } from '../lib/format'
import { sinceHours, useFailedJobs, useJobsHealth, useOpsActions, vendorQuotaFrom } from '../lib/admin'
import { bannerFor } from '../lib/service-status-rules'

/**
 * Screen 72 — System. The one admin screen with live data behind every figure.
 *
 * Ported in SHAPE from design/components/admin-console-2.jsx (`AdminSystem`):
 * dark chrome, a service-status list, a work queue and an error queue. What is
 * NOT ported is its content — the design seeds "142,901 photos today", an
 * error queue of invented claims and a fabricated incident history. This reads
 * GET /v1/jobs/health, GET /v1/jobs/failed and GET /v1/status, and shows a
 * zero when the answer is zero.
 *
 * The two actions are the two that exist: reap stale processing rows, and
 * purge expired EXIF. Both also run on a schedule; the buttons mean "now".
 */
const localTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function Card({
  id,
  title,
  action,
  children,
}: {
  id?: string
  title: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="k-set-card" id={id}>
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

export default function AdminSystemPage() {
  const health = useJobsHealth()
  const failed = useFailedJobs(50)
  const { reap, purgeExif } = useOpsActions()
  const [open, setOpen] = useState<string | null>(null)

  // The same public status the customer banner reads, so ops and adjusters are
  // never told different things about pricing.
  const status = useQuery({
    queryKey: ['service-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/status`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      return (await res.json()) as unknown
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })

  const h = health.data
  const pricing = bannerFor(status.data, localTime)
  const quota = vendorQuotaFrom(h?.jobs)
  const jobs = h?.jobs ?? []
  const failedJobs = failed.data?.jobs ?? []

  const workersOk = !!h && h.workers_live === h.workers_total && h.workers_total > 0
  const troubles = [
    h?.stalled ? 'queue stalled' : '',
    h && !h.worker_build_consistent ? 'workers on different builds' : '',
    h && !workersOk ? 'workers missing' : '',
    (h?.jobs_stale?.length ?? 0) > 0 ? `${h?.jobs_stale.length} stale job` : '',
    pricing ? 'pricing degraded' : '',
    (failed.data?.count ?? 0) > 0 ? `${fmtInt(failed.data?.count)} failed jobs` : '',
  ].filter(Boolean)

  return (
    <AdminShell active="System">
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
              System
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              Workers, scheduled jobs, pricing health and the failed-job queue — live from the API.
            </p>
          </div>
          <Badge tone={troubles.length ? 'warn' : 'ok'} dot>
            {troubles.length ? troubles.join(' · ') : 'All clear'}
          </Badge>
        </div>

        {health.error ? (
          <Alert tone="error" title="Couldn’t read worker health">
            {health.error instanceof Error ? health.error.message : 'The request failed.'} Admin
            endpoints need the admin role on your account.
          </Alert>
        ) : null}

        {/* — The four numbers worth glancing at — */}
        <div className="k-adm-kpis">
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Workers live</div>
            <div className="k-adm-kpi-v">
              {h ? `${h.workers_live}/${h.workers_total}` : '—'}
            </div>
            <div className="k-adm-kpi-d">
              <span className={workersOk ? 'k-adm-up' : 'k-adm-down'}>
                {h ? (workersOk ? 'All answering' : 'Some missing') : 'Loading…'}
              </span>
            </div>
          </div>
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Queued now</div>
            <div className="k-adm-kpi-v">{h ? fmtInt(h.queued) : '—'}</div>
            <div className="k-adm-kpi-d">
              <span style={{ color: 'var(--k-fg-3)' }}>
                {h ? `${fmtInt(h.started)} running` : ''}
              </span>
            </div>
          </div>
          {/* A figure that says "needs a look" has to take you to it. */}
          <a className="k-adm-kpi k-adm-kpi--link" href="#failed-jobs">
            <div className="k-adm-kpi-l">Failed jobs</div>
            <div className="k-adm-kpi-v">{failed.data ? fmtInt(failed.data.count) : '—'}</div>
            <div className="k-adm-kpi-d">
              <span className={(failed.data?.count ?? 0) > 0 ? 'k-adm-down' : 'k-adm-up'}>
                {failed.data ? (failed.data.count > 0 ? 'See the queue' : 'None') : ''}
              </span>
              {(failed.data?.count ?? 0) > 0 ? <Icon d={I.chevright} size={12} /> : null}
            </div>
          </a>
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Searches left</div>
            <div className="k-adm-kpi-v">
              {quota?.plan_searches_left !== undefined ? fmtInt(quota.plan_searches_left) : '—'}
            </div>
            <div className="k-adm-kpi-d">
              <span style={{ color: 'var(--k-fg-3)' }}>
                {quota?.searches_per_month
                  ? `of ${fmtInt(quota.searches_per_month)} this month`
                  : 'Reported by the search canary'}
              </span>
            </div>
          </div>
        </div>

        {/* — Pricing, in the customer's own words — */}
        <Card title="Pricing service">
          <div className="k-set-card-body">
            {pricing ? (
              <Alert tone={pricing.tone === 'paused' ? 'service' : 'wait'} title={pricing.message}>
                {pricing.detail}
              </Alert>
            ) : (
              <Alert tone="success" title="Pricing is running normally">
                Nothing is paused, and adjusters see no banner.
              </Alert>
            )}
            {h && !h.worker_build_consistent ? (
              <Alert tone="error" title="Workers are on different builds">
                A deploy is half-finished. Builds seen:{' '}
                {[...new Set(Object.values(h.worker_builds))].join(', ')}.
              </Alert>
            ) : null}
          </div>
        </Card>

        {/* — Scheduled jobs: what ran, when, and what it found — */}
        <Card
          title={`Scheduled jobs · ${fmtInt(jobs.length)}`}
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="k-btn k-btn--ghost k-btn--sm"
                disabled={reap.isPending}
                title="Mark rows stuck in processing as failed, so they stop blocking a claim"
                onClick={() => reap.mutate()}
              >
                {reap.isPending ? 'Reaping…' : 'Reap stale'}
              </button>
              <button
                type="button"
                className="k-btn k-btn--ghost k-btn--sm"
                disabled={purgeExif.isPending}
                title="Redact EXIF past its retention window"
                onClick={() => purgeExif.mutate()}
              >
                {purgeExif.isPending ? 'Purging…' : 'Purge EXIF'}
              </button>
            </div>
          }
        >
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {jobs.length === 0 ? (
              <p className="k-note" style={{ padding: '14px 16px' }}>
                {health.isPending ? 'Reading…' : 'No scheduled jobs reported.'}
              </p>
            ) : (
              jobs.map((job) => {
                const bad = job.stale || (job.last_status && job.last_status !== 'ok')
                return (
                  <button
                    key={job.job}
                    type="button"
                    className="k-adm-pipe-row k-adm-jobrow"
                    onClick={() => setOpen(open === job.job ? null : job.job)}
                  >
                    <span
                      className="k-adm-dot"
                      style={{ background: bad ? 'var(--k-warn)' : 'var(--k-ok)' }}
                    />
                    <span className="k-adm-jobname k-mono">{job.job}</span>
                    <span className="k-adm-jobmeta">
                      {sinceHours(job.age_hours)} · {fmtInt(job.runs_total ?? 0)} runs
                    </span>
                    <Badge tone={bad ? 'warn' : 'ok'}>{job.last_status ?? 'unknown'}</Badge>
                    <Icon d={I.chevright} size={13} />
                  </button>
                )
              })
            )}

            {open ? (
              <pre className="k-adm-detail">
                {JSON.stringify(jobs.find((j) => j.job === open)?.last_detail ?? {}, null, 2)}
              </pre>
            ) : null}
          </div>
        </Card>

        {/* — What actually broke — */}
        <Card
          id="failed-jobs"
          title={`Failed jobs · ${fmtInt(failed.data?.count ?? 0)}`}
          action={
            <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
              {failed.data?.scope === 'all' ? 'Every account' : 'Your account'}
            </span>
          }
        >
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {failedJobs.length === 0 ? (
              <p className="k-note" style={{ padding: '14px 16px' }}>
                {failed.isPending ? 'Reading…' : 'Nothing has failed. '}
              </p>
            ) : (
              failedJobs.map((job) => (
                <div key={job.job_id} className="k-adm-fail">
                  <div className="k-adm-fail-hd">
                    <span className="k-mono" style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>
                      {job.job_id.slice(0, 8)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
                      {job.ended_at ? new Date(job.ended_at).toLocaleString() : 'still failing'}
                    </span>
                    {job.actor_id ? (
                      <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                        actor {job.actor_id.slice(0, 8)}
                      </span>
                    ) : null}
                  </div>
                  {job.exc_info ? (
                    <pre className="k-adm-detail k-adm-detail--tight">
                      {job.exc_info.trim().split('\n').slice(-6).join('\n')}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>

        {(reap.data || purgeExif.data || reap.error || purgeExif.error) && (
          <Alert
            tone={reap.error || purgeExif.error ? 'error' : 'success'}
            title={reap.error || purgeExif.error ? 'That action failed' : 'Done'}
          >
            {JSON.stringify(reap.data ?? purgeExif.data ?? reap.error ?? purgeExif.error)}
          </Alert>
        )}
      </div>
    </AdminShell>
  )
}
