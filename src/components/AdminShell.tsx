import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import KevinWordmark from './KevinWordmark'
import { api } from '../lib/api'
import type { MeResponse } from '../lib/types'

/**
 * The back office's chrome — dark topbar, its own nav, separate in look from
 * the customer app so nobody confuses the two. Ported from `A2_Shell` /
 * `ADM_Shell` in design/components/admin-console*.jsx.
 *
 * The design's nine sections are listed so the shape is visible, but only what
 * has real data behind it is a link: the others would be invented numbers on
 * the one surface whose job is to tell you the truth about the system.
 */
const SECTIONS: { label: string; to?: string }[] = [
  { label: 'Overview' },
  { label: 'Accounts' },
  { label: 'Revenue' },
  { label: 'Content' },
  { label: 'Platform', to: '/admin/platform' },
  { label: 'Support', to: '/admin/support' },
  { label: 'Staff' },
  { label: 'System', to: '/admin/system' },
]

export default function AdminShell({
  active,
  children,
}: {
  active: string
  children: React.ReactNode
}) {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: 60_000,
  })

  return (
    /* NOT `k-shell`: that pins the page to the viewport and hides overflow so
       the worksheet's grid can scroll itself. An ops screen is a long document
       -- 50 failed jobs with tracebacks -- and must scroll normally. */
    <div className="k-adm">
      <header className="k-topbar k-adm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#fff' }}>
              <KevinWordmark size={16} suffix={true} to="/admin/system" tone="light" />
            </span>
            <span className="k-adm-pill">Admin</span>
          </span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.18)' }} />
          <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
            {SECTIONS.map(({ label, to }) =>
              to ? (
                <Link
                  key={label}
                  to={to}
                  className={`k-tab ${label === active ? 'k-tab--active' : ''}`}
                >
                  {label}
                </Link>
              ) : (
                <span key={label} className="k-tab k-adm-tab--off" title="Not built yet">
                  {label}
                </span>
              ),
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>{me.data?.email}</span>
          <Link className="k-btn k-btn--sm k-btn--ghost k-adm-exit" to="/claims">
            Back to the app →
          </Link>
        </div>
      </header>

      {children}
    </div>
  )
}
