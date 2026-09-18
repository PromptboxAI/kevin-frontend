import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { TaxRateAnswer } from './tax-rate-rules'

/**
 * `GET /v1/tax-rate?zip=` -- the rate SUGGESTION for intake. Read-only, always
 * 200; `reason` says when there is no rate. Rates move quarterly, so a ZIP is
 * looked up once per session.
 */
export function useTaxRate(zip: string) {
  return useQuery({
    queryKey: ['tax-rate', zip],
    queryFn: () => api.get<TaxRateAnswer>(`/v1/tax-rate?zip=${encodeURIComponent(zip)}`),
    enabled: /^\d{5}$/.test(zip),
    staleTime: Infinity,
    retry: 1,
  })
}
