/**
 * Display helpers only. These never derive money -- the server owns every
 * figure (FRONTEND.md section 4). They format what the payload already holds.
 */

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** On screen a null money value is a dash, never 0.00 and never -$0.00. */
export function fmtUSD(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  // Depreciation is always >= 0, so a negative zero is a formatting artifact.
  return USD.format(value === 0 ? 0 : value)
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fmtInt(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('en-US')
}

/** depreciation_pct is a FRACTION (0.30 = 30%). */
export function fmtPct(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined) return '—'
  return `${Math.round(fraction * 1000) / 10}%`
}

export function fmtAge(years: number | null | undefined): string {
  if (years === null || years === undefined) return '—'
  return String(years)
}

/**
 * A comp price is normally a number, but a legacy row can carry a display
 * string ("$369.00"). Format defensively rather than trusting the type.
 */
export function fmtCompPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === '') return '—'
  if (typeof price === 'number') return fmtUSD(price)
  const parsed = Number(String(price).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? fmtUSD(parsed) : String(price)
}

export function fmtConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

/** "14h ago" / "3d ago" -- the design's last-sign-in phrasing. */
export function fmtSince(iso: string | null | undefined, now: number): string | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return null
  const mins = Math.max(0, Math.round((now - then) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/** Time-of-day greeting from the client clock -- no backend involved. */
export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
