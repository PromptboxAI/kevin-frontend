import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

/**
 * Staging sessions whose clustering job is gone (backend e0a8f3e).
 *
 * The queue retries a killed job, and a 10-minute sweep re-queues a dead
 * session twice more. What reaches this list has outlived all of that, so a
 * row here is a session nothing will recover on its own.
 */
export type StuckSession = {
  session_id: number
  claim_id: string
  claim_name: string | null
  user_id: string
  email: string | null
  status: string
  photo_count: number | null
  photos_extracted: number | null
  groups_count: number | null
  clustering_started_at: string | null
  /** How many times the sweep already re-queued it. Capped at 2 server-side. */
  auto_requeues: number | null
}

export type StuckResponse = {
  sessions: StuckSession[]
  /**
   * ⛔ FALSE MEANS "WE COULD NOT READ THE QUEUE", NOT "NOTHING IS STUCK".
   *
   * An empty list under a failed liveness read looks exactly like a healthy
   * one, and this screen exists because a session sat dead while every other
   * surface reported all-clear. Render it as unknown.
   */
  liveness_known: boolean
}

export type RestartResult = {
  session_id: number
  status: string
  /** `full` rebuilds a session with no sets; `remainder` groups only the
   *  unassigned photos of one that has them, and deletes nothing. */
  kind: 'full' | 'remainder'
  clustering_started_at: string | null
}

export function useStuckSessions() {
  return useQuery({
    queryKey: ['admin', 'staging-stuck'],
    queryFn: () => api.get<StuckResponse>('/v1/admin/staging/stuck'),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}

export function useRestartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: number) =>
      api.post<RestartResult>(`/v1/admin/staging/sessions/${sessionId}/restart`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'staging-stuck'] })
    },
  })
}

/** How long the dead job had been running, for the row. */
export function stuckFor(iso: string | null, now: number): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const mins = Math.floor((now - t) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m`
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`
}

/**
 * What a restart will actually do, said before it is pressed.
 *
 * The route decides this itself and will not rebuild a session that has sets
 * (rule 22: manual merges are never discarded), but the admin pressing the
 * button should know which of the two they are about to get.
 */
export function restartKind(groups: number | null): 'full' | 'remainder' {
  return (groups ?? 0) > 0 ? 'remainder' : 'full'
}
