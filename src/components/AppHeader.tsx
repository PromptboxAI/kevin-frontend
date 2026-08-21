import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AvatarMenu from './AvatarMenu'
import TopNavTabs from './TopNavTabs'
import { api } from '../lib/api'
import type { MeResponse } from '../lib/types'

/** Mirrors <header className="k-topbar"> in every prototype screen. */
export default function AppHeader({ actions }: { actions?: React.ReactNode }) {
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
        <TopNavTabs />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {actions}
        {me ? <AvatarMenu email={me.email} id={me.id} /> : null}
      </div>
    </header>
  )
}
