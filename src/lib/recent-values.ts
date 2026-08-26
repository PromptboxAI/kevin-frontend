/**
 * Values this browser has used before, offered back for quick selection.
 *
 * A CONVENIENCE ONLY, and the distinction matters: the claim stores its own
 * copy of whatever was submitted. Nothing here is a source of truth, so it can
 * never rewrite history — an estimate is a point-in-time document, and an
 * adjuster who prepared an inventory in March must still be named on it after
 * they leave the firm. This list just saves retyping the same two words on
 * every claim; edit it, clear it, or move machines and the old claims are
 * untouched.
 *
 * Import-free so it can be unit-tested in node, like the other rules modules.
 */

/** Enough to cover a firm's regular preparers without becoming a menu to read. */
export const RECENT_MAX = 8

export type Storage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Every access is guarded.
 *
 * localStorage throws outright in some contexts — a private window with site
 * data blocked, an embedded viewer, a browser set to reject storage — and it
 * comes back empty in plenty of others. A convenience feature must never take
 * the form down with it, so a failure here is silently "no suggestions".
 */
function read(store: Storage | undefined, key: string): string[] {
  if (!store) return []
  try {
    const raw = store.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
  } catch {
    return []
  }
}

function write(store: Storage | undefined, key: string, values: string[]): void {
  if (!store) return
  try {
    store.setItem(key, JSON.stringify(values))
  } catch {
    /* Quota, private mode, blocked storage -- the form still works. */
  }
}

export function recentValues(store: Storage | undefined, key: string): string[] {
  return read(store, key).slice(0, RECENT_MAX)
}

/**
 * Push a value to the front, most-recent first.
 *
 * De-duplicates case-INSENSITIVELY but keeps the casing just typed: "reyes
 * adjusting" and "Reyes Adjusting" are the same firm, and the newer spelling
 * is the one the adjuster means. Keeping both would recreate the inconsistent-
 * spellings problem this exists to avoid.
 *
 * Returns the new list even when the write failed. If storage is blocked the
 * suggestion still works for this session and simply does not survive a
 * reload, which is better than a browser that silently offers nothing.
 */
export function rememberValue(
  store: Storage | undefined,
  key: string,
  value: string,
): string[] {
  const trimmed = value.trim()
  if (!trimmed) return recentValues(store, key)
  const rest = read(store, key).filter((v) => v.toLowerCase() !== trimmed.toLowerCase())
  const next = [trimmed, ...rest].slice(0, RECENT_MAX)
  write(store, key, next)
  return next
}

export const RECENT_ESTIMATOR = 'kevin.recent.estimator_name'
export const RECENT_BUSINESS = 'kevin.recent.business_name'

/** The one place the browser store is reached for, so tests can pass their own. */
export function browserStore(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}
