import { Link } from 'react-router-dom'

/**
 * The marketing wordmark — ported from `KevinWordmark` in
 * design/components/shared.jsx, values verbatim.
 *
 * NOT the app's `.k-wordmark` class. That renders 13px Merriweather 700 for the
 * product topbar; the marketing chrome uses 18px Lato 600 in the nav and 15px
 * in the footer, with the accent period nudged up a hair. Reusing the app class
 * silently shrank the logo across the marketing pages.
 */
export default function KevinWordmark({
  size = 18,
  tone = 'dark',
  suffix = false,
  to = '/',
}: {
  size?: number
  tone?: 'dark' | 'light'
  suffix?: boolean
  to?: string | null
}) {
  const mark = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 0,
        color: tone === 'dark' ? 'var(--k-fg)' : 'var(--k-bg)',
        fontFamily: 'var(--k-font-ui)',
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.025em',
      }}
    >
      <span>Kevin</span>
      {suffix && (
        <span
          style={{
            color: 'var(--k-accent)',
            fontWeight: 600,
            transform: 'translateY(-0.05em)',
            display: 'inline-block',
          }}
        >
          .
        </span>
      )}
    </span>
  )
  if (!to) return mark
  return (
    <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex' }} title="Kevin home">
      {mark}
    </Link>
  )
}
