/**
 * The account's saved PEOPLE and COMPANIES — the names an adjuster types on
 * every claim, kept once and picked thereafter. Xactimate's model: Personnel
 * (estimator, claim rep…) are individuals; the Company Header is a firm, with
 * its own address block and logo, and the two are separate lists.
 *
 * Import-free so it runs under node for the tests. Storage lives in
 * lib/directory.ts; this decides shape, validation and labels.
 *
 * NOT a source of truth. Like recent-values.ts, this is a convenience: the
 * claim keeps its own copy of whatever was submitted, so editing an entry here
 * never rewrites a claim that already went out. An inventory prepared in March
 * still names the person who prepared it.
 */

export type Person = {
  id: string
  name: string
  /** Free text — the firm as this person is filed under, not a company id. */
  company?: string
  license?: string
  phone?: string
  email?: string
}

export type Company = {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  website?: string
  license?: string
  /** A data URL. The account-level store is the backend's, once it exists. */
  logo?: string
}

export type Directory = { people: Person[]; companies: Company[] }

export const EMPTY_DIRECTORY: Directory = { people: [], companies: [] }

/** A logo big enough to print, small enough for a browser store. */
export const LOGO_MAX_BYTES = 512 * 1024
export const LOGO_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']

/** Ids are local and never leave the browser; a timestamp+random is enough. */
export function newId(seed = Date.now(), rand = Math.random()): string {
  return `${seed.toString(36)}-${Math.floor(rand * 1e6).toString(36)}`
}

/** A name is the only thing an entry cannot do without. */
export function isNamed(entry: { name?: string }): boolean {
  return typeof entry.name === 'string' && entry.name.trim().length > 0
}

/**
 * Add or replace by id, newest first, de-duplicated by NAME case-insensitively
 * so "reyes adjusting" and "Reyes Adjusting" do not both sit in the menu.
 */
export function upsert<T extends { id: string; name: string }>(list: T[], entry: T): T[] {
  const name = entry.name.trim().toLowerCase()
  const rest = list.filter((e) => e.id !== entry.id && e.name.trim().toLowerCase() !== name)
  return [{ ...entry, name: entry.name.trim() }, ...rest]
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((e) => e.id !== id)
}

/** What the picker shows: the name, with the firm or licence to tell two apart. */
export function personLabel(p: Person): string {
  const extra = [p.company?.trim(), p.license?.trim()].filter(Boolean)[0]
  return extra ? `${p.name} · ${extra}` : p.name
}

export function companyLabel(c: Company): string {
  const where = c.address?.trim()
  return where ? `${c.name} · ${where}` : c.name
}

/** The firm block an export prints, in reading order, blanks dropped. */
export function companyLines(c: Company): string[] {
  return [c.name, c.license ? `License #: ${c.license}` : '', c.address ?? '', c.email ?? '', c.phone ?? '', c.website ?? '']
    .map((l) => l.trim())
    .filter(Boolean)
}

export type LogoProblem = 'type' | 'size' | null

/** Why a chosen logo cannot be used, or null when it can. */
export function logoProblem(file: { type: string; size: number }): LogoProblem {
  if (!LOGO_TYPES.includes(file.type)) return 'type'
  if (file.size > LOGO_MAX_BYTES) return 'size'
  return null
}

export const LOGO_ERROR: Record<Exclude<LogoProblem, null>, string> = {
  type: 'Use a PNG, JPG, SVG or WebP.',
  size: `That file is over ${Math.round(LOGO_MAX_BYTES / 1024)} KB. Use a smaller copy.`,
}

/** Reads a stored blob back into a Directory, dropping anything malformed. */
export function parseDirectory(raw: unknown): Directory {
  if (!raw || typeof raw !== 'object') return EMPTY_DIRECTORY
  const v = raw as { people?: unknown; companies?: unknown }
  const people = Array.isArray(v.people)
    ? v.people.filter((p): p is Person => !!p && typeof p === 'object' && isNamed(p as Person) && typeof (p as Person).id === 'string')
    : []
  const companies = Array.isArray(v.companies)
    ? v.companies.filter(
        (c): c is Company => !!c && typeof c === 'object' && isNamed(c as Company) && typeof (c as Company).id === 'string',
      )
    : []
  return { people, companies }
}
