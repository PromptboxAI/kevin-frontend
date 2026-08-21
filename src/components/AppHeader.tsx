import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { MeResponse } from '../lib/types'

export default function AppHeader() {
  const { signOut } = useAuth()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })

  return (
    <header className="k-appbar">
      <p className="k-appbar-brand">
        Kevin<span>.</span>
      </p>
      <div className="k-appbar-right">
        {me ? <span className="k-appbar-user">{me.email ?? me.id}</span> : null}
        <button type="button" className="k-btn k-btn--ghost k-btn--sm" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </header>
  )
}
