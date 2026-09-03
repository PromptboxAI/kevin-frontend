/**
 * Export filename patterns.
 *
 * Import-free so it runs under `node --input-type=module` for its tests.
 *
 * WHERE THIS ACTUALLY APPLIES. The download name is set by the SERVER: exports
 * come back as a binary with a `Content-Disposition` filename, and
 * `downloadBinary` in lib/api.ts uses that verbatim, falling back to a local
 * name only when the header is missing. So a pattern chosen here cannot rename
 * a real export until the backend accepts it and builds the header from it.
 * Until then this expands the pattern for the preview and for the fallback
 * name — which is the honest scope, and the reason the example below is
 * computed rather than typed.
 *
 * Unknown tokens are left INTACT rather than blanked. Someone mid-edit typing
 * `{claim` should see `{claim`, not have the rest of their filename vanish;
 * and a token the backend adds later should survive a round trip through an
 * older client instead of being silently eaten.
 */

export type FilenameVars = {
  claim_number?: string | null
  insured_last?: string | null
  format?: string | null
  date?: string | null
  carrier?: string | null
  adjuster?: string | null
  ext?: string | null
}

export const FILENAME_TOKENS = [
  'claim_number',
  'insured_last',
  'format',
  'date',
  'carrier',
  'adjuster',
  'ext',
] as const

/** What the field starts as. */
export const DEFAULT_PATTERN = '{insured_last}_{date}.{ext}'

/**
 * Characters no filesystem should have to argue about, plus leading/trailing
 * dots and spaces which Windows silently strips. Applied to VALUES, never to
 * the pattern, so the pattern's own separators survive.
 */
function sanitizeValue(value: string): string {
  return value
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function expandPattern(pattern: string, vars: FilenameVars): string {
  return pattern.replace(/\{([a-z_]+)\}/g, (whole, token: string) => {
    if (!(token in vars)) return whole
    const value = vars[token as keyof FilenameVars]
    // A null/empty value collapses to nothing rather than printing "null".
    return value == null ? '' : sanitizeValue(String(value))
  })
}

/**
 * Cleans up what expansion leaves behind: an empty value in the middle of a
 * pattern strands its separator, so `{a}_{b}.{ext}` with no `b` would give
 * `x_.xlsx`. Collapses repeated separators and trims them from the ends,
 * without touching the extension dot.
 */
export function tidy(name: string): string {
  const dot = name.lastIndexOf('.')
  // `dot >= 0`, not `> 0`: an all-empty stem expands to ".xlsx", and treating
  // that as "no extension" made the whole string the stem -- the leading-dot
  // strip below then ate the dot and handed the user a file called `xlsx`,
  // with no extension and hidden on a Unix filesystem.
  const hasExt = dot >= 0 && dot < name.length - 1
  const stem = hasExt ? name.slice(0, dot) : name
  const ext = hasExt ? name.slice(dot + 1) : ''

  const cleanStem = stem
    .replace(/[_\-\s]{2,}/g, '_')
    .replace(/^[_\-\s.]+|[_\-\s.]+$/g, '')

  if (!cleanStem) return ext ? `export.${ext}` : 'export'
  return ext ? `${cleanStem}.${ext}` : cleanStem
}

/** The whole job: expand, then tidy. */
export function buildFilename(pattern: string, vars: FilenameVars): string {
  return tidy(expandPattern(pattern, vars))
}

/** `YYYY-MM-DD` in local time — the form that sorts correctly in a file list. */
export function isoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Surname from a full name, for `{insured_last}`. */
export function lastNameOf(fullName?: string | null): string {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  return parts.length ? parts[parts.length - 1] : ''
}
