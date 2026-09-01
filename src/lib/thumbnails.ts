import { useEffect, useRef, useState } from 'react'
import { getThumbnails } from './staging'

/**
 * Signed thumbnail URLs, batched and cached.
 *
 * No list payload on this API carries an `image_url`: minting 300 signed URLs
 * every few seconds crashed the server, and a URL that expires in ~5 minutes
 * goes stale in an open drawer anyway. So visible photo ids are collected by an
 * IntersectionObserver, flushed in batches of 100 (the contract's cap), and
 * cached per id for the life of the tab.
 *
 * Shared by staging and the claim photo gallery. It lives here rather than in
 * either screen because two caches would mean two round-trips for the same
 * photo the moment an adjuster moved between them.
 */

const log = (event: string, detail?: unknown) => console.info(`[thumbs] ${event}`, detail ?? '')

const thumbCache = new Map<number, string | null>()
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
      for (const cb of waiting.get(id) ?? []) cb(thumbCache.get(id) ?? null)
      waiting.delete(id)
    }
    if (pendingIds.size && !flushTimer) flushTimer = setTimeout(flushThumbs, 0)
  }

  void getThumbnails(ids)
    .then((r) => {
      for (const t of r.thumbnails) thumbCache.set(t.id, t.image_url)
    })
    .catch((e) => {
      log('thumbnails FAILED', e)
      for (const id of ids) thumbCache.set(id, null)
    })
    .finally(settle)
}

function requestThumb(id: number, done: (src: string | null) => void) {
  if (thumbCache.has(id)) {
    done(thumbCache.get(id) ?? null)
    return
  }
  pendingIds.add(id)
  waiting.set(id, [...(waiting.get(id) ?? []), done])
  if (!flushTimer) flushTimer = setTimeout(flushThumbs, 120)
}

export function useThumb<T extends HTMLElement>(id: number) {
  const [src, setSrc] = useState<string | null>(() => thumbCache.get(id) ?? null)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (thumbCache.has(id)) {
      setSrc(thumbCache.get(id) ?? null)
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
  }, [id])

  return { ref, src }
}
