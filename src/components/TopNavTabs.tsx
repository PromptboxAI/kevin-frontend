import { Link, useLocation } from 'react-router-dom'

/**
 * Ported from top-nav.jsx, minus its "New claim" tab. Tabs are places; starting
 * a claim is an action, and it lives in the header as NewClaimButton instead.
 * Routes not built yet stay visible but inert.
 */
const TABS: [string, string | null][] = [
  ['My claims', '/claims'],
  ['Exports', '/exports'],
  ['Settings', '/settings'],
]

export default function TopNavTabs() {
  const { pathname } = useLocation()

  // Exactly one tab is active: the one with the LONGEST matching path. Every
  // claim screen (/claims/new, /claims/:id/...) sits under /claims, so they
  // light My claims -- you are inside the claims area. Longest-match keeps that
  // correct if a tab ever nests under another.
  const activeTo = TABS.reduce<string | null>((best, [, to]) => {
    if (to === null) return best
    const matches = pathname === to || pathname.startsWith(to + '/')
    if (!matches) return best
    return best === null || to.length > best.length ? to : best
  }, null)

  return (
    <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
      {TABS.map(([label, to]) => {
        const active = to !== null && to === activeTo
        if (!to) {
          return (
            <span
              key={label}
              className="k-tab k-tab--todo"
              title="Not built yet in the production app"
            >
              {label}
            </span>
          )
        }
        return (
          <Link key={label} to={to} className={`k-tab ${active ? 'k-tab--active' : ''}`}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
