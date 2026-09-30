import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AvatarMenu from './AvatarMenu'
import BrandAccent from './BrandAccent'
import ServiceStatusBanner from './ServiceStatusBanner'
import TopNavTabs from './TopNavTabs'
import { api, isAnonymous } from '../lib/api'
import type { MeResponse } from '../lib/types'

/** Mirrors <header className="k-topbar"> in every prototype screen. */
export default function AppHeader({ actions }: { actions?: React.ReactNode }) {
  /**
   * NOT FETCHED WHILE ANONYMOUS. The public sample claim hides this bar with
   * CSS but still mounts it, and every call it makes goes out without a token
   * -- so a marketing page a visitor may have open with devtools was firing
   * /v1/me and collecting 401s, retried, on a page where nobody is signed in
   * by definition. Hiding a component does not stop it asking the server
   * questions.
   */
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
    enabled: !isAnonymous(),
  })

  return (
    <>
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
        {me ? <AvatarMenu email={me.email} /> : null}
      </div>
    </header>
    {/* The firm's colour, on the signed-in app only. Renders nothing. */}
    <BrandAccent />
    {/* Site-wide pricing pause notice; renders nothing while pricing is ok. */}
    <ServiceStatusBanner />
    </>
  )
}
