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
  /** Hex. Tints the app for this account and, later, the export header. */
  brandColor?: string
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

/* ── Brand colour ────────────────────────────────────────────────────────
   The firm's colour, used on the app chrome for its own people and, once the
   backend stores the profile, on the client-facing PDF and portal header.
   Kept as a hex because that is what a colour input and a document generator
   both take; every other colour in the system stays an OKLCH token. */

export const BRAND_DEFAULT = '#2E4B6F'

/** #abc / #aabbcc / aabbcc -> #aabbcc, or null when it is not a colour. */
export function normalizeHex(input: string): string | null {
  const t = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(t)) {
    return `#${t[0]}${t[0]}${t[1]}${t[1]}${t[2]}${t[2]}`.toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toLowerCase()}`
  return null
}

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const h = normalizeHex(hex) ?? BRAND_DEFAULT
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Contrast of white text on this colour. 4.5 is the readable floor. */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05)
}

/**
 * The colour the app may actually paint buttons with.
 *
 * A brand colour is chosen for a letterhead, not for white button text, and a
 * bright yellow would make every primary button unreadable. So the accent is
 * the brand colour darkened until white text clears 4.5:1 — the swatch the
 * adjuster picked is still shown, and their documents still use it exactly.
 */
export function accentFor(hex: string): string {
  const start = normalizeHex(hex)
  if (!start) return BRAND_DEFAULT
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(start.slice(i, i + 2), 16))
  for (let step = 0; step < 24; step += 1) {
    const current = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
    if (contrastWithWhite(current) >= 4.5) return current
    r = Math.round(r * 0.9)
    g = Math.round(g * 0.9)
    b = Math.round(b * 0.9)
  }
  return '#000000'
}

/** A lighter partner for hovers and links, one step up from the accent. */
export function accentHover(hex: string): string {
  const base = normalizeHex(accentFor(hex)) ?? BRAND_DEFAULT
  const lift = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.18))
  const [r, g, b] = [1, 3, 5].map((i) => lift(parseInt(base.slice(i, i + 2), 16)))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
