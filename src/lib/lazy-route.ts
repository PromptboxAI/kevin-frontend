import { lazy, type ComponentType } from 'react'

/**
 * React.lazy for a route, with the one failure a code-split app adds handled.
 *
 * A chunk's filename carries its content hash, so every deploy retires the old
 * names. A tab that was opened before the deploy still holds the old index and
 * asks for a chunk that no longer exists the first time it visits a split
 * route — the import rejects, nothing catches it, and the screen goes blank.
 * This site deploys many times a day, so that tab is the normal case.
 *
 * The cure is the new index, which a reload fetches. Reload ONCE: the stamp
 * stops a chunk that is missing for some other reason (an outage, a bad build)
 * from turning into a reload loop, and after that the error is thrown as it
 * would have been. Offline is left alone — a reload cannot help, and the
 * service worker's cached shell would only fail the same way.
 *
 * vercel.json keeps /assets/ out of the SPA rewrite for the same reason: a
 * missing chunk has to answer 404, not index.html with a 200.
 */
const STAMP = 'kevin:chunk-reload-at'
const ONCE_PER_MS = 10_000

function reloadedRecently() {
  try {
    return Date.now() - Number(sessionStorage.getItem(STAMP) ?? 0) < ONCE_PER_MS
  } catch {
    // No sessionStorage (private mode, blocked): we cannot tell, so do not loop.
    return true
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React.lazy's own bound
export function lazyRoute<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((err: unknown) => {
      if (navigator.onLine === false || reloadedRecently()) throw err
      sessionStorage.setItem(STAMP, String(Date.now()))
      window.location.reload()
      // Never settles: the page is on its way out, and rejecting here would
      // paint the error for the instant before it goes.
      return new Promise<{ default: T }>(() => {})
    }),
  )
}
