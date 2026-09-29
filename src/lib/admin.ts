import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

/**
 * The back office's data. Every field here is READ FROM THE SERVER — the admin
 * console exists to fix things, and a console that shows invented numbers is
 * worse than no console (rule: nothing on screen that the API did not say).
 *
 * Admin routes are role-gated: `app_metadata.role = "admin"` on the Supabase
 * user, surfaced as `is_admin` by GET /v1/me. Without it these 403.
 */

/** One scheduled job's last run, from GET /v1/jobs/health. */
export type ScheduledJob = {
  job: string
  last_run_at: string | null
  last_status: string | null
  age_hours: number | null
  runs_total: number | null
  stale: boolean
  /** Job-specific payload — the useful part, and shaped per job. */
  last_detail?: Record<string, unknown> | null
}

export type JobsHealth = {
  queue: string
  depths: Record<string, number>
  workers_total: number
  workers_live: number
  queued: number
  started: number
  stalled: boolean
  stalled_queues: string[]
  jobs: ScheduledJob[]
  jobs_stale: string[]
  jobs_degraded: string[]
  reason: string | null
  /** worker id -> build sha. Divergence means a half-finished deploy. */
  worker_builds: Record<string, string>
  worker_build_consistent: boolean
  worker_commit: string | null
}

export type FailedJob = {
  job_id: string
  actor_id: string | null
  args: unknown[]
  enqueued_at: string | null
  ended_at: string | null
  exc_info: string | null
}

export type FailedJobs = { count: number; jobs: FailedJob[]; scope: string }

export function useJobsHealth() {
  return useQuery({
    queryKey: ['admin', 'jobs-health'],
    queryFn: () => api.get<JobsHealth>('/v1/jobs/health'),
    // Ops screens are read while something is wrong: keep it current, but stop
    // when the tab is hidden.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}

/**
 * `limit` defaults to 50 ON THE SERVER, and `count` is this page -- not the
 * registry. The screen read that 50 as the total and reported "50 failed
 * jobs" when there were 79, which is the difference between "a bad afternoon"
 * and "something is wrong". Ask for a number no real queue reaches, and say
 * "N+" if it ever does.
 */
export const FAILED_JOBS_LIMIT = 500

export function useFailedJobs(limit = FAILED_JOBS_LIMIT) {
  return useQuery({
    queryKey: ['admin', 'failed-jobs', limit],
    queryFn: () => api.get<FailedJobs>(`/v1/jobs/failed?limit=${limit}`),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}

export type ReapResult = { status?: string; reaped?: number } & Record<string, unknown>
export type PurgeResult = { status?: string; purged?: number; scanned?: number } & Record<
  string,
  unknown
>

/**
 * The two ops actions that exist. Both also run on a schedule, so a click here
 * is "run it now", never the only thing keeping the system alive.
 */
export function useOpsActions() {
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  const reap = useMutation({
    mutationFn: () => api.post<ReapResult>('/v1/jobs/reap'),
    onSuccess: refresh,
  })

  const purgeExif = useMutation({
    mutationFn: () => api.post<PurgeResult>('/v1/jobs/purge-exif'),
    onSuccess: refresh,
  })

  return { reap, purgeExif }
}

/** "4 minutes ago" / "16 hours ago" from an age in hours. */
export function sinceHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return 'never'
  const mins = Math.round(hours * 60)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 48) return `${Math.round(hours)} h ago`
  return `${Math.round(hours / 24)} d ago`
}

/** The vendor quota the search canary reports, when it last ran. */
export type VendorQuota = {
  plan_name?: string
  plan_searches_left?: number
  searches_per_month?: number
  this_month_usage?: number
}

export function vendorQuotaFrom(jobs: ScheduledJob[] | undefined): VendorQuota | null {
  const canary = jobs?.find((j) => j.job === 'search_canary')
  const account = canary?.last_detail?.serpapi_account
  if (!account || typeof account !== 'object') return null
  return account as VendorQuota
}

export type RetryOutcome = { job_id: string; ok: boolean; detail?: string }
export type ClearResult = { cleared: number; job_ids: string[]; skipped: string[] }

/**
 * Put dead-lettered work back on its queue, and drop rows that never can be.
 *
 * RETRY IS PER JOB (`POST /v1/jobs/{id}/retry`), so a group of 48 is 48 calls.
 * They run in small batches rather than all at once: this is an ops screen
 * firing writes at the same workers it is diagnosing. Every job reports its own
 * outcome -- a 409 means it is no longer dead-lettered, which is information,
 * not an error to swallow.
 *
 * CLEAR DESTROYS THE TRACEBACK and has no undo, so the caller names what it is
 * clearing. The screen confirms before sending.
 */
export function useJobActions() {
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  const retry = useMutation({
    mutationFn: async (jobIds: string[]): Promise<RetryOutcome[]> => {
      const out: RetryOutcome[] = []
      for (let i = 0; i < jobIds.length; i += 4) {
        const slice = jobIds.slice(i, i + 4)
        const done = await Promise.all(
          slice.map(async (job_id): Promise<RetryOutcome> => {
            try {
              await api.post(`/v1/jobs/${encodeURIComponent(job_id)}/retry`)
              return { job_id, ok: true }
            } catch (error) {
              return {
                job_id,
                ok: false,
                detail: error instanceof Error ? error.message : 'failed',
              }
            }
          }),
        )
        out.push(...done)
      }
      return out
    },
    onSuccess: refresh,
  })

  const clear = useMutation({
    mutationFn: (input: { job_ids: string[] } | { all_failed: true }) =>
      api.post<ClearResult>('/v1/jobs/failed/clear', { json: input }),
    onSuccess: refresh,
  })

  return { retry, clear }
}
