import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { API_BASE_URL, SUPABASE_URL } from './lib/env'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
