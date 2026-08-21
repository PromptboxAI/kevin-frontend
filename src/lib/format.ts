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

/**
 * Extended Cost is the ONE column the API does not return. The contract
 * guarantees `Extended Cost + Sales Tax == RCV + Tax`, so restate it from that
 * identity rather than multiplying rcv * qty ourselves -- multiplying would be
 * a second implementation of the money math and could disagree with the export.
 * Rounded to cents because float subtraction otherwise yields 800.0000000001.
 */
export function extCost(rcvTotalIncl: number | null, tax: number | null): number | null {
  if (rcvTotalIncl === null || rcvTotalIncl === undefined) return null
  return Math.round((rcvTotalIncl - (tax ?? 0)) * 100) / 100
}

export function fmtAge(years: number | null | undefined): string {
  if (years === null || years === undefined) return '—'
  return String(years)
}
