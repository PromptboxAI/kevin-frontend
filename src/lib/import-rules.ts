/**
 * Written-inventory import: the rules, with no imports so they can be tested.
 *
 * Total-loss lists arrive as PDF/CSV/XLSX with no photographs. A written row
 * already IS a line item -- staging turns photos into items, so it has nothing
 * to do here. The flow is parse -> map -> preview -> import, and the FIRST
 * THREE CREATE NOTHING.
 *
 * Every rule below exists because getting it wrong costs money or invents
 * property. They are kept away from React on purpose.
 */

/** The import endpoint's hard cap. A 2,400-row file is five deliberate calls. */
export const IMPORT_CHUNK = 500

/** The preview accepts far more, because it writes nothing and calls no vendor. */
export const PREVIEW_MAX = 5000

/** Fields a column can be mapped to. `room` is deliberately its own. */
export const MAPPABLE = [
  'description',
  'room',
  'quantity',
  'category',
  'make_mfr',
  'model_number',
  'age_years',
] as const

export type MappableField = (typeof MAPPABLE)[number]

export type ParsedRow = {
  index: number
  cells: string[]
  /**
   * A section heading ("WALL ART/DÉCOR"), not property. Real exports interleave
   * these, and one priced as an item at $236.39 when a parser treated it as
   * property. FLAGGED, never dropped on our own authority.
   */
  likely_heading: boolean
  source_ref: string | null
}

export type BulkRow = {
  description: string
  room?: string | null
  quantity?: number
  category?: string | null
  make_mfr?: string | null
  model_number?: string | null
  age_years?: number | null
}

/**
 * Which rows start selected.
 *
 * Headings start UNCHECKED and everything else checked. The adjuster can
 * re-include any of them: it is their list, and they decide what a row means.
 * Auto-dropping would silently delete property if the flag were ever wrong.
 */
export function initialSelection(rows: ParsedRow[]): Set<number> {
  return new Set(rows.filter((r) => !r.likely_heading).map((r) => r.index))
}

const cell = (row: ParsedRow, col: number | undefined): string =>
  col === undefined || col < 0 ? '' : (row.cells[col] ?? '').trim()

const num = (text: string): number | undefined => {
  const n = Number(text.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

/**
 * Turn a parsed row into what the API takes, using the adjuster's mapping.
 *
 * `room` NEVER folds into the description. The description IS the search query
 * on this path -- there is no separate long-form to derive -- so a stray room
 * name changes what gets searched: "Refrigerator" and "Kitchen Refrigerator"
 * price differently.
 */
export function toBulkRow(row: ParsedRow, mapping: Partial<Record<MappableField, number>>): BulkRow {
  const qty = num(cell(row, mapping.quantity))
  const age = num(cell(row, mapping.age_years))
  return {
    description: cell(row, mapping.description),
    room: cell(row, mapping.room) || null,
    quantity: qty !== undefined && qty >= 1 ? Math.round(qty) : 1,
    category: cell(row, mapping.category) || null,
    make_mfr: cell(row, mapping.make_mfr) || null,
    model_number: cell(row, mapping.model_number) || null,
    age_years: age !== undefined && age >= 0 ? age : null,
  }
}

/**
 * A row with nothing to search on.
 *
 * Identity columns COUNT: make and model compose into the description, so a row
 * carrying a make is not blank. This mirrors the server's validator exactly --
 * getting it wrong here means a 422 the adjuster cannot act on.
 */
export function isBlankRow(row: BulkRow): boolean {
  return (
    !(row.description || '').trim() &&
    !(row.make_mfr || '').trim() &&
    !(row.model_number || '').trim()
  )
}

export type ImportGuard =
  | { ok: true }
  | { ok: false; reason: 'blank_rows_priced'; rows: number[] }
  | { ok: false; reason: 'nothing_selected' }

/**
 * Refuse the one combination the server refuses, before it round-trips.
 *
 * A blank description is a PLACEHOLDER -- the adjuster adding a line to fill in
 * later -- and is legal with price:false. With price:true the server 422s,
 * because accepting it would mean a 202 that quietly parked the row instead of
 * doing what was asked.
 */
export function guardImport(rows: BulkRow[], price: boolean): ImportGuard {
  if (rows.length === 0) return { ok: false, reason: 'nothing_selected' }
  if (!price) return { ok: true }
  const blanks = rows.map((r, i) => (isBlankRow(r) ? i : -1)).filter((i) => i >= 0)
  return blanks.length ? { ok: false, reason: 'blank_rows_priced', rows: blanks } : { ok: true }
}

/** Split into calls the API will accept. */
export function planImportChunks<T>(rows: T[], size = IMPORT_CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size))
  return out
}

export type ImportProgress = {
  /** Chunks fully acknowledged by the server. */
  chunksDone: number
  chunksTotal: number
  created: number
  /** Where to restart. */
  nextChunk: number
}

/**
 * Resume from the FAILED chunk, never from the beginning.
 *
 * Re-running chunk 1 of 5 would create its 500 line items a second time, and a
 * duplicate line is a real money error. The server has no idempotency key on
 * this route, so the client owns not repeating itself.
 */
export function resumeFrom(progress: ImportProgress): number {
  return Math.max(0, Math.min(progress.chunksDone, progress.chunksTotal))
}

/**
 * What to tell the adjuster before they spend.
 *
 * SEARCHES, not rows: each priced item costs a comp search PLUS a merchant-link
 * resolution, so a 300-row file is roughly 600 searches. Quoting the row count
 * understates the spend by half.
 */
export function confirmSpend(estimatedSearches: number, priceable: number): string {
  if (priceable === 0) return 'No rows will be priced. Nothing will be spent.'
  return `Pricing ${priceable.toLocaleString()} ${
    priceable === 1 ? 'row' : 'rows'
  } — about ${estimatedSearches.toLocaleString()} vendor ${
    estimatedSearches === 1 ? 'search' : 'searches'
  }.`
}

/**
 * A file bigger than the quota allows.
 *
 * The preview REPORTS this rather than refusing: it creates nothing and spends
 * nothing, and refusing to dry-run a file because the real run would not fit
 * withholds the one diagnostic that explains the problem.
 */
export function truncationWarning(wouldTruncate: boolean, wouldDrop: number): string | null {
  if (!wouldTruncate) return null
  return `Your remaining allowance stops ${wouldDrop.toLocaleString()} ${
    wouldDrop === 1 ? 'row' : 'rows'
  } short. Those rows stay in your file — top up and re-import to add them.`
}
