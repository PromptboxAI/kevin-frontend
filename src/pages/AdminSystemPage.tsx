import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import { ApiError } from '../lib/api'
import {
  restartKind,
  stuckFor,
  useRestartSession,
  useStuckSessions,
} from '../lib/stuck-staging'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { API_BASE_URL } from '../lib/env'
import { fmtInt } from '../lib/format'
import { sinceHours, useFailedJobs, useJobsHealth, useOpsActions, vendorQuotaFrom } from '../lib/admin'
import { bannerFor } from '../lib/service-status-rules'
import { groupFailures, lastLine, summarize } from '../lib/failed-jobs-rules'
import { FAILED_JOBS_LIMIT, useJobActions } from '../lib/admin'
import { copyText } from '../lib/clipboard'

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
  const stuck = useStuckSessions()
  const restart = useRestartSession()
  const { reap, purgeExif } = useOpsActions()
  const [open, setOpen] = useState<string | null>(null)
  const [openCause, setOpenCause] = useState<string | null>(null)
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null)
  /** Which group's Clear is one click from destroying a traceback. */
  const [confirming, setConfirming] = useState<string | null>(null)
  const [jobNote, setJobNote] = useState<string | null>(null)
  const { retry, clear } = useJobActions()
  const working = retry.isPending || clear.isPending

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
  /** Failures by CAUSE: one bug that killed 48 photos is one thing to fix. */
  const failureGroups = groupFailures(failed.data?.jobs ?? [])

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

        {/* — Staging sessions nothing will recover on its own — */}
        <Card
          title={`Stuck in clustering · ${
            stuck.data?.liveness_known === false
              ? 'unknown'
              : fmtInt(stuck.data?.sessions.length ?? 0)
          }`}
        >
          <div style={{ padding: '10px 16px 14px' }}>
            {/*
              * An empty list is only good news when the queue could be read.
              * This screen exists because a session sat dead while every other
              * surface said all-clear; repeating that with a confident zero
              * would be the same failure wearing a tick.
              */}
            {stuck.data?.liveness_known === false ? (
              <Alert tone="wait" title="The job queue could not be read">
                Sessions may be stuck and this list cannot say. Treat an empty list as unknown, not
                as all-clear.
              </Alert>
            ) : null}

            {stuck.isLoading ? (
              <p className="k-note">Loading…</p>
            ) : stuck.error ? (
              <p className="k-error">Could not read the stuck list.</p>
            ) : (stuck.data?.sessions.length ?? 0) === 0 ? (
              <p className="k-note">
                {stuck.data?.liveness_known === false
                  ? 'Nothing to show while the queue is unreadable.'
                  : 'No session is stuck. The queue retries a killed job, and a sweep re-queues a dead one twice before it reaches this list.'}
              </p>
            ) : (
              <>
                <div
                  className="k-adm-tbl-hd"
                  style={{ '--adm-cols': '1.6fr 1fr 0.8fr 0.8fr auto' } as React.CSSProperties}
                >
                  <span>Claim</span>
                  <span>Account</span>
                  <span>Photos</span>
                  <span>Stuck for</span>
                  <span />
                </div>
                {(stuck.data?.sessions ?? []).map((row) => {
                  const kind = restartKind(row.groups_count)
                  return (
                    <div
                      key={row.session_id}
                      className="k-adm-tr"
                      style={{ '--adm-cols': '1.6fr 1fr 0.8fr 0.8fr auto' } as React.CSSProperties}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, display: 'block' }}>
                          {row.claim_name || row.claim_id}
                        </span>
                        <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                          session {row.session_id}
                          {row.auto_requeues ? ` · re-queued ${row.auto_requeues}×` : ''}
                        </span>
                      </span>
                      <span
                        style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}
                      >
                        {row.email ?? row.user_id}
                      </span>
                      <span className="k-mono" style={{ fontSize: 12 }}>
                        {fmtInt(row.photos_extracted ?? 0)}/{fmtInt(row.photo_count ?? 0)}
                        {row.groups_count ? ` · ${fmtInt(row.groups_count)} sets` : ''}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>
                        {stuckFor(row.clustering_started_at, Date.now()) ?? '—'}
                      </span>
                      {/* The ROUTE decides full vs remainder and will not
                          rebuild a session that has sets. The label says which
                          one is coming so nobody presses it expecting the
                          other. */}
                      <button
                        type="button"
                        className="k-btn k-btn--sm"
                        disabled={restart.isPending}
                        title={
                          kind === 'remainder'
                            ? 'Groups only the unassigned photos. Existing sets are untouched.'
                            : 'Re-runs grouping for the whole session. It has no sets yet, so nothing is discarded.'
                        }
                        onClick={() => restart.mutate(row.session_id)}
                      >
                        {restart.isPending ? 'Restarting…' : `Restart (${kind})`}
                      </button>
                    </div>
                  )
                })}
              </>
            )}

            {restart.isSuccess ? (
              <p className="k-note" style={{ marginTop: 10 }}>
                Re-queued session {restart.data?.session_id} as a {restart.data?.kind} pass.
              </p>
            ) : null}
            {restart.isError ? (
              <p className="k-error" style={{ marginTop: 10 }}>
                {restart.error instanceof ApiError && restart.error.status === 409
                  ? 'That session is not stuck any more — its job is alive or it has left clustering.'
                  : restart.error instanceof ApiError && restart.error.status === 503
                    ? 'The queue could not be read, so nothing was re-queued.'
                    : 'Could not restart that session.'}
              </p>
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
                /*
                 * A JOB CAN FAIL AND NOT MATTER, and only the job knows which.
                 * vendor_watch reports `unreadable` when the vendor's status
                 * page does not answer twice -- a real failure of that check,
                 * and no failure of anything an adjuster touches, which its
                 * own detail says: `impact: "none: the breaker and control
                 * search are unaffected"`. Buried in the expandable JSON, an
                 * amber row read as an outage; on the row it reads as what it
                 * is. Rendered verbatim, so the job's own words are what the
                 * admin sees (backend 698dd9c).
                 */
                const detail = (job.last_detail ?? {}) as Record<string, unknown>
                const impact = typeof detail.impact === 'string' ? detail.impact : null
                const why = typeof detail.reason === 'string' ? detail.reason : null
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
                      {bad && why ? ` · ${why}` : ''}
                      {bad && impact ? (
                        <span className="k-adm-impact"> · impact {impact}</span>
                      ) : null}
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

        {/* — What actually broke, grouped by cause — */}
        <Card
          id="failed-jobs"
          /* `count` is this PAGE, not the registry -- if it comes back at the
             limit there are more, and printing it flat would understate the
             queue the way the server's default 50 once did. */
          title={`Failed jobs · ${fmtInt(failed.data?.count ?? 0)}${
            (failed.data?.count ?? 0) >= FAILED_JOBS_LIMIT ? '+' : ''
          } in ${fmtInt(failureGroups.length)} ${failureGroups.length === 1 ? 'cause' : 'causes'}`}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                {failed.data?.scope === 'all' ? 'Every account' : 'Your account'}
              </span>
              {failureGroups.length > 0 ? (
                <button
                  type="button"
                  className="k-btn k-btn--ghost k-btn--sm"
                  title="Copy a summary — causes, counts, dates, job ids and accounts — to send on"
                  onClick={async () => {
                    setCopied((await copyText(summarize(failureGroups))) ? 'yes' : 'no')
                    window.setTimeout(() => setCopied(null), 2400)
                  }}
                >
                  {copied === 'yes' ? 'Copied' : copied === 'no' ? 'Press Ctrl+C' : 'Copy summary'}
                </button>
              ) : null}
            </div>
          }
        >
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {failureGroups.length === 0 ? (
              <p className="k-note" style={{ padding: '14px 16px' }}>
                {failed.isPending ? 'Reading…' : 'Nothing has failed.'}
              </p>
            ) : (
              failureGroups.map((group) => {
                const isOpen = openCause === group.cause
                const days =
                  group.first && group.last
                    ? group.first.slice(0, 10) === group.last.slice(0, 10)
                      ? new Date(group.last).toLocaleDateString()
                      : `${new Date(group.first).toLocaleDateString()} – ${new Date(group.last).toLocaleDateString()}`
                    : 'no date recorded'
                return (
                  <div key={group.cause}>
                    <button
                      type="button"
                      className="k-adm-pipe-row k-adm-jobrow"
                      onClick={() => setOpenCause(isOpen ? null : group.cause)}
                    >
                      <span className="k-adm-dot" style={{ background: 'var(--k-danger)' }} />
                      <span className="k-adm-cause">{lastLine(group.jobs[0]?.exc_info)}</span>
                      <span className="k-adm-jobmeta">
                        {days} ·{' '}
                        {group.actors.length
                          ? `${fmtInt(group.actors.length)} account${group.actors.length === 1 ? '' : 's'}`
                          : 'system job'}
                      </span>
                      <Badge tone="warn">{fmtInt(group.count)}</Badge>
                      <Icon d={isOpen ? I.chevdown : I.chevright} size={13} />
                    </button>

                    {isOpen ? (
                      <div className="k-adm-causebody">
                        <div className="k-adm-causeact">
                          {group.actors.length ? (
                            <span>
                              Affected {group.actors.length === 1 ? 'account' : 'accounts'}:{' '}
                              <span className="k-mono">{group.actors.join(', ')}</span>
                            </span>
                          ) : (
                            <span>No account attached — this ran as a system job.</span>
                          )}
                        </div>
                        <pre className="k-adm-detail k-adm-detail--tight">
                          {(group.jobs[0]?.exc_info ?? '').trim().split('\n').slice(-8).join('\n')}
                        </pre>
                        <div className="k-adm-causeids k-mono">
                          {group.jobs.slice(0, 12).map((j) => j.job_id.slice(0, 8)).join('  ')}
                          {group.count > 12 ? `  +${fmtInt(group.count - 12)} more` : ''}
                        </div>

                        {/* The two things an admin can now DO about it.
                            Retry re-runs the work. Clear drops the row and the
                            traceback with it -- the only surviving record of why
                            the work died -- so it confirms first, and it is for
                            history: a bug since fixed, or work whose subject was
                            deleted. It is not a fix. If the cause can still fire
                            the rows come back, and the count goes back to
                            meaning nothing. */}
                        <div className="k-adm-causebtns">
                          <button
                            type="button"
                            className="k-btn k-btn--ghost k-btn--sm"
                            disabled={working}
                            title="Put these back on their queue"
                            onClick={() => {
                              setJobNote(null)
                              retry.mutate(
                                group.jobs.map((j) => j.job_id),
                                {
                                  onSuccess: (out) => {
                                    const ok = out.filter((o) => o.ok).length
                                    const bad = out.length - ok
                                    setJobNote(
                                      `Requeued ${fmtInt(ok)} of ${fmtInt(out.length)}` +
                                        (bad
                                          ? ` · ${fmtInt(bad)} could not be: ${
                                              out.find((o) => !o.ok)?.detail ??
                                              'already retried or cleared'
                                            }`
                                          : ''),
                                    )
                                  },
                                  onError: (e) =>
                                    setJobNote(e instanceof Error ? e.message : 'Retry failed.'),
                                },
                              )
                            }}
                          >
                            {retry.isPending ? 'Retrying…' : `Retry ${fmtInt(group.count)}`}
                          </button>

                          {confirming === group.cause ? (
                            <>
                              <button
                                type="button"
                                className="k-btn k-btn--sm k-btn--delete"
                                disabled={working}
                                onClick={() => {
                                  setConfirming(null)
                                  setJobNote(null)
                                  clear.mutate(
                                    { job_ids: group.jobs.map((j) => j.job_id) },
                                    {
                                      onSuccess: (res) =>
                                        setJobNote(
                                          `Cleared ${fmtInt(res.cleared)}` +
                                            (res.skipped.length
                                              ? ` · ${fmtInt(res.skipped.length)} were already gone`
                                              : ''),
                                        ),
                                      onError: (e) =>
                                        setJobNote(
                                          e instanceof Error ? e.message : 'Clear failed.',
                                        ),
                                    },
                                  )
                                }}
                              >
                                Yes, clear {fmtInt(group.count)} — the traceback goes too
                              </button>
                              <button
                                type="button"
                                className="k-link"
                                onClick={() => setConfirming(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="k-btn k-btn--ghost k-btn--sm"
                              disabled={working}
                              title="Drop these rows. There is no undo."
                              onClick={() => setConfirming(group.cause)}
                            >
                              Clear {fmtInt(group.count)}
                            </button>
                          )}

                          {jobNote ? <span className="k-adm-jobnote">{jobNote}</span> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
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
