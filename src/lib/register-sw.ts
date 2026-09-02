/**
 * Register the app-shell worker.
 *
 * PRODUCTION ONLY, deliberately. In dev, Vite serves unbundled modules over
 * HMR, and a worker caching them turns every edit into a debugging session
 * about whether the browser is running the code you just wrote. Testing it
 * means `npm run build && npx vite preview`, which is also what ships.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A capture app that refuses to start because it could not cache is
      // worse than one that simply needs signal. Offline is the enhancement.
    })
  })
}

/**
 * Escape hatch.
 *
 * A service worker is the one bug you cannot fix by shipping: a broken worker
 * keeps serving itself. Exposed so a support call can end with "open the
 * console and run `__kevinUnregisterSW()`" rather than "clear your site data",
 * which also destroys the offline photo queue.
 */
declare global {
  interface Window {
    __kevinUnregisterSW?: () => Promise<boolean[]>
  }
}

if (typeof window !== 'undefined') {
  window.__kevinUnregisterSW = async () => {
    const regs = await navigator.serviceWorker.getRegistrations()
    const results = await Promise.all(regs.map((r) => r.unregister()))
    await caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    return results
  }
}
