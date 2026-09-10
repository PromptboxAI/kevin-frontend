import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { DepreciationRules } from './schedule-rules'

/**
 * `GET /v1/depreciation-rules` — the live class taxonomy and its schedule.
 *
 * ONE definition. Three components used to declare this query separately, each
 * with its own inline type for the same key — `{ categories }`,
 * `{ categories, rules }` — so when the backend changed the class shape there
 * were three places to update and nothing to stop them diverging. They share
 * the cache key, so the payload was always identical; only the TYPES lied.
 *
 * `staleTime: Infinity` is kept from the originals: the taxonomy changes by
 * deploy, not by the minute. The consequence is that a tab opened before a
 * schedule change keeps the old payload for its whole session, which is why
 * `buildClassOptions` falls back to the flat list rather than rendering empty.
 *
 * Answers anonymously, so the public sample loads it too.
 */
export const DEPRECIATION_RULES_KEY = ['depreciation-rules'] as const

export function useDepreciationRules() {
  return useQuery({
    queryKey: DEPRECIATION_RULES_KEY,
    queryFn: () => api.get<DepreciationRules>('/v1/depreciation-rules'),
    staleTime: Infinity,
  })
}
