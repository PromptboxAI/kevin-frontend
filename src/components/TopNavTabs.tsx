import { Link, useLocation } from 'react-router-dom'

/** Ported from top-nav.jsx. Routes not built yet stay visible but inert. */
const TABS: [string, string | null][] = [
  ['New claim', '/claims/new'],
  ['My claims', '/claims'],
  ['Exports', null],
  ['Settings', null],
]

export default function TopNavTabs() {
  const { pathname } = useLocation()

  return (
    <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
      {TABS.map(([label, to]) => {
        const active = to !== null && pathname.startsWith(to)
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
