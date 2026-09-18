import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { DeferredReport } from './deferred-rules'

/**
 * `GET /v1/deferred` -- every line on the caller's claims that is waiting on a
 * retry, with live pricing embedded (backend 177d9d9).
 *
 * Read-only and free: it spends no searches and enqueues nothing, so it can be
 * polled the way the status banner is. Authenticated, unlike /v1/status.
 *
 * ONE query, shared by the worksheet bar and the claims roster, and it carries
 * its own `pricing` block. Fetching /v1/status separately and merging is the
 * documented mistake: two round trips can disagree, which is how a banner ends
 * up contradicting the button next to it.
 *
 * A failed read is silence. `total: 0` is the CORRECT answer on a healthy
 * account, not an empty state worth drawing.
 */
export function getDeferred() {
  return api.get<DeferredReport>('/v1/deferred')
}

export function useDeferred(enabled = true) {
  return useQuery({
    queryKey: ['deferred'],
    queryFn: getDeferred,
    enabled,
    staleTime: 30_000,
    // Same cadence as the service banner, and stopped in a hidden tab: these
    // clear on their own clocks and an adjuster should see it when it does.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
