import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { API_BASE_URL, SUPABASE_URL } from './lib/env'
import { registerServiceWorker } from './lib/register-sw'
import './styles/kevin.css'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The backend rate-limits reads at 120/min; don't spend that on refocus.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

/**
 * Warm the TLS connections during page load.
 *
 * The first write of a session paid ~880ms for a cold handshake -- DNS, TCP and
 * TLS -- while the second reused the connection. That cost belongs to the load,
 * where nobody is waiting on it, not to the adjuster's first edit. Preconnect
 * covers the API and the auth host, which are the only two cross-origin hops.
 */
for (const origin of [API_BASE_URL, SUPABASE_URL]) {
  if (!origin) continue
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = origin
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

/**
 * Offline shell for the phone.
 *
 * The capture queue already survives a reload -- but only if the page can be
 * fetched. Without this, closing the tab in a basement means a browser error
 * page over photos that are sitting right there in IndexedDB.
 */
registerServiceWorker()

// Must match the tree in entry-server.tsx, router aside.
const tree = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)

/**
 * Hydrate a prerendered page; render everything else from scratch.
 *
 * The marketing pages arrive with their markup already in #root
 * (scripts/prerender-html.mjs), stamped with the route it was rendered for.
 * Hydrating keeps that markup on screen and attaches to it.
 *
 * Only when the stamp IS this URL. Markup for one route can be served at
 * another — the service worker's offline fallback answers /capture with the
 * cached homepage, and `vite preview` answers every unknown path with it —
 * and hydrating the landing page as some other screen is a mismatch React
 * would have to notice and throw away. So a stranger's markup is cleared
 * first, and its head tags are handed back to <Seo> to retire, exactly as on a
 * page that was never prerendered.
 */
const container = document.getElementById('root')!
const renderedFor = container.dataset.prerendered
const here = window.location.pathname.replace(/(.)\/$/, '$1')

if (renderedFor === here) {
  hydrateRoot(container, tree)
} else {
  if (renderedFor !== undefined) {
    container.replaceChildren()
    document.head.querySelectorAll('[data-prerendered-head]').forEach((el) => {
      el.removeAttribute('data-prerendered-head')
      el.setAttribute('data-default', '')
    })
  }
  createRoot(container).render(tree)
}
