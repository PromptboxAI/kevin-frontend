import { useEffect, useRef, useState } from 'react'
import { getThumbnails } from './staging'

/**
 * Signed thumbnail URLs, batched and cached.
 *
 * No list payload on this API carries an `image_url`: minting 300 signed URLs
 * every few seconds crashed the server. So visible photo ids are collected by
 * an IntersectionObserver and flushed in batches of 100 (the contract's cap).
 *
 * ⏱️ THE CACHE EXPIRES, and the first version did not -- it held every URL "for
 * the life of the tab" while the URLs themselves are signed for about five
 * minutes. So the Photos tab looked right when it loaded and filled with broken
 * images a few minutes later, every time, as tiles re-rendered against dead
 * URLs. The exported PDF was unaffected because the server mints its own, which
 * is what made it look like a display-only fault: the photos were fine, the
 * links to them had died.
 *
 * Two defences, because one is not enough. The TTL below re-requests before a
 * URL should have expired; and a tile whose image fails anyway reports it
 * (`onError`), which drops that id and fetches a fresh URL once. Clock skew,
 * a slow render or a backgrounded tab can all push a URL past its life
 * between the check and the paint.
 *
 * Shared by staging and the claim photo gallery. It lives here rather than in
 * either screen because two caches would mean two round-trips for the same
 * photo the moment an adjuster moved between them.
 */

const log = (event: string, detail?: unknown) => console.info(`[thumbs] ${event}`, detail ?? '')

/**
 * Comfortably inside the server's ~5 minute signing window, with room for a
 * slow render and a little clock skew. Lower is just more requests for the same
 * pictures; higher starts handing out URLs that die before they are drawn.
 */
export const THUMB_TTL_MS = 3.5 * 60 * 1000

/** True while a URL fetched at `at` can still be trusted to load. */
export function isFresh(at: number, now: number, ttl: number = THUMB_TTL_MS): boolean {
  return now - at < ttl
}

type CacheEntry = { url: string | null; at: number }
const thumbCache = new Map<number, CacheEntry>()

/** A cached URL, or null when absent or past its life. */
function cached(id: number): CacheEntry | null {
  const hit = thumbCache.get(id)
  if (!hit) return null
  return isFresh(hit.at, Date.now()) ? hit : null
}

/**
 * Forget one id so the next request re-signs it. Called when an <img> actually
 * fails, which is the only report that a URL was dead rather than predicted to
 * be.
 */
export function invalidateThumb(id: number) {
  thumbCache.delete(id)
}
const pendingIds = new Set<number>()
const waiting = new Map<number, ((src: string | null) => void)[]>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushThumbs() {
  flushTimer = null
  // Capped at 100 ids per request, per the contract.
  const ids = [...pendingIds].slice(0, 100)
  for (const id of ids) pendingIds.delete(id)
  if (!ids.length) return

  log('thumbnails →', ids.length)
  const settle = () => {
    for (const id of ids) {
      for (const cb of waiting.get(id) ?? []) cb(thumbCache.get(id)?.url ?? null)
      waiting.delete(id)
    }
    if (pendingIds.size && !flushTimer) flushTimer = setTimeout(flushThumbs, 0)
  }

  const at = Date.now()
  void getThumbnails(ids)
    .then((r) => {
      for (const t of r.thumbnails) thumbCache.set(t.id, { url: t.image_url, at })
    })
    .catch((e) => {
      log('thumbnails FAILED', e)
      /* A failure is cached too, or a dead id re-requests on every scroll --
         but briefly, so a blip does not blank a photo for the whole session. */
      for (const id of ids) thumbCache.set(id, { url: null, at })
    })
    .finally(settle)
}

function requestThumb(id: number, done: (src: string | null) => void) {
  const hit = cached(id)
  if (hit) {
    done(hit.url)
    return
  }
  pendingIds.add(id)
  waiting.set(id, [...(waiting.get(id) ?? []), done])
  if (!flushTimer) flushTimer = setTimeout(flushThumbs, 120)
}

export function useThumb<T extends HTMLElement>(id: number) {
  const [src, setSrc] = useState<string | null>(() => cached(id)?.url ?? null)
  const ref = useRef<T | null>(null)
  /** Bumped by onError to re-run the effect and re-sign this id, once. */
  const [attempt, setAttempt] = useState(0)
  const retried = useRef(false)

  /**
   * Hand this to the <img>. A signed URL can die between being handed out and
   * being drawn -- a backgrounded tab, a slow network, a clock a minute off --
   * and the only thing that knows for certain is the image itself.
   *
   * ONCE. A tile that fails twice has something else wrong with it, and a
   * retry loop against a 403 would hammer the storage layer per tile.
   */
  const onError = () => {
    if (retried.current) return
    retried.current = true
    invalidateThumb(id)
    setSrc(null)
    setAttempt((n) => n + 1)
  }

  useEffect(() => {
    const hit = cached(id)
    if (hit) {
      setSrc(hit.url)
      return
    }
    const el = ref.current
    if (!el) return
    let alive = true
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        requestThumb(id, (next) => {
          if (alive) setSrc(next)
        })
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => {
      alive = false
      observer.disconnect()
    }
  }, [id, attempt])

  return { ref, src, onError }
}
