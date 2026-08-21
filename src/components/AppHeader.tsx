import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { MeResponse } from '../lib/types'

/**
 * Mirrors the prototype's <header className="k-topbar">: wordmark, a hairline
 * divider, then nav on the left and account actions on the right.
 */
export default function AppHeader() {
  const { signOut } = useAuth()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })

  return (
    <header className="k-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/claims" className="k-wordmark">
          Kevin<span>.</span>
        </Link>
        <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/claims" className="k-tab k-tab--on">
            My claims
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {me ? <span className="k-topbar-user">{me.email ?? me.id}</span> : null}
        <button type="button" className="k-btn k-btn--ghost" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </header>
  )
}
