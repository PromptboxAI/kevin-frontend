/* eslint-disable no-undef */
/**
 * App-shell cache, so /capture LOADS with no signal.
 *
 * The offline queue already survives a reload — but only if the page itself can
 * be fetched. Without this, an adjuster who closes the tab in a basement gets a
 * browser error page and 40 photos they cannot reach.
 *
 * This file is intentionally small and boring. A service worker is the one
 * thing in a web app that can serve stale code to every user at once, so every
 * rule below exists to bound that.
 */

const CACHE = 'kevin-shell-v1'

/**
 * The shell, cached at install so the FIRST offline load works.
 *
 * Only routes, not bundles: Vite hashes asset filenames, and this file is
 * static, so it cannot know them. The hashed assets are cached as they are
 * requested instead — which is safe here because a phone must pair ONLINE
 * before it can capture anything, so the shell is always warm by the time it
 * matters.
 */
const SHELL = ['/', '/capture', '/pair']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Best-effort: one 404 must not fail the whole install and leave the
      // worker unregistered.
      Promise.allSettled(SHELL.map((url) => cache.add(url))),
    ),
  )
  // NOTE: no skipWaiting(). A new worker waits for every tab to close.
  // Activating mid-session would swap the JS bundle under someone holding
  // queued photos, and "my app changed while I was shooting" is not a trade
  // worth making for a faster rollout.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  // Only same-origin GETs. The API lives on another origin and its responses
  // are per-credential and short-lived -- caching any of it would be a way to
  // serve one adjuster another's data, or a signed URL after it expired.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  /**
   * Navigations: network first.
   *
   * Fresh HTML whenever there is signal, so a deploy is picked up on the next
   * load rather than whenever a cache happens to expire. The cache is the
   * fallback, which is the whole point -- and it falls back to the SHELL entry
   * rather than the exact URL, because /capture is a client route and any
   * cached shell can render it.
   */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match('/capture'))
            .then((hit) => hit || caches.match('/'))
            .then(
              (hit) =>
                hit ||
                new Response('<h1>Offline</h1><p>Reopen once you have signal.</p>', {
                  headers: { 'Content-Type': 'text/html' },
                  status: 503,
                }),
            ),
        ),
    )
    return
  }

  /**
   * Hashed build assets: cache first.
   *
   * Vite fingerprints these, so a given URL's bytes never change -- serving
   * from cache cannot go stale, and a new build simply requests new names.
   */
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone()
            if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
    return
  }

  // Everything else same-origin (icons, fonts): network, falling back to cache.
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
