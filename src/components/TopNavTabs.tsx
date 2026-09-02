import { Link, useLocation } from 'react-router-dom'

/** Ported from top-nav.jsx. Routes not built yet stay visible but inert. */
const TABS: [string, string | null][] = [
  ['New claim', '/claims/new'],
  ['My claims', '/claims'],
  ['Exports', '/exports'],
  ['Settings', null],
]

export default function TopNavTabs() {
  const { pathname } = useLocation()

  // startsWith alone lights BOTH "New claim" and "My claims" on /claims/new,
  // because /claims is a prefix of it. Exactly one tab is active: the one with
  // the LONGEST matching path.
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
