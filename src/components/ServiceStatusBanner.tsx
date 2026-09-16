import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../lib/env'
import { bannerFor } from '../lib/service-status-rules'
import { SAMPLE_CLAIM_ID } from '../lib/worksheet-preview'

/**
 * Site-wide "pricing paused" banner, from GET /v1/status (backend 0fe58d9).
 *
 * Mounted once, under the shared AppHeader, so every signed-in screen shows it
 * without each page remembering to.
 *
 * - Anonymous and cheap (public, max-age=30), so it is a plain fetch with NO
 *   token: attaching one gains nothing, and a token turned the public sample
 *   into a 404 before.
 * - Polled every minute while the tab is visible, re-read on return to the
 *   tab. TanStack stops interval refetches in a hidden tab.
 * - A failed or malformed read shows NOTHING. No answer is not an outage, and
 *   a false "pricing paused" would stop adjusters working for no reason.
 * - Hidden on the public sample claim: nothing a visitor does there is priced,
 *   so an outage notice would only alarm a prospect.
 */
async function fetchStatus(): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/v1/status`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.json()
}

const localTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function ServiceStatusBanner() {
  const { pathname } = useLocation()
  const { data } = useQuery({
    queryKey: ['service-status'],
    queryFn: fetchStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  const sample = `/claims/${SAMPLE_CLAIM_ID}`
  if (pathname === sample || pathname.startsWith(`${sample}/`)) return null

  const banner = bannerFor(data, localTime)
  if (!banner) return null

  return (
    <div
      className={`k-ws-bar k-ws-bar--quiet k-status-bar${banner.tone === 'degraded' ? ' k-status-bar--soft' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="k-paused-dot" aria-hidden="true" />
      <span>
        <strong>{banner.message}</strong> {banner.detail}
      </span>
    </div>
  )
}
