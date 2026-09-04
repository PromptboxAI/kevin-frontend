import { Link } from 'react-router-dom'

/**
 * The banner above the public sample claim (screen 48).
 *
 * Fixed rather than in flow: the worksheet is a full-height shell that scrolls
 * inside itself, and pushing it down with a sibling would shorten the grid and
 * change the layout being demonstrated. The page it sits over is the product,
 * unaltered — which is the whole point of the screen.
 *
 * It says plainly that nothing saves. That is not a disclaimer for its own
 * sake: every control on the worksheet is live here, so a visitor WILL edit a
 * price, and finding out afterwards that it went nowhere is the bad version of
 * this demo.
 */
export default function SampleBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        insetInline: 0,
        top: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        background: 'var(--k-accent)',
        color: '#fff',
        fontSize: 12.5,
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--k-font-mono)',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 99,
          background: 'rgba(255,255,255,0.18)',
        }}
      >
        Sample
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        This is a real worksheet on a demo claim — edit anything you like.{' '}
        <strong style={{ fontWeight: 600 }}>Nothing here saves</strong>, and no account is needed.
      </span>
      <Link
        to="/pricing"
        className="k-btn k-btn--sm"
        style={{ background: '#fff', color: 'var(--k-accent)', borderColor: '#fff', flexShrink: 0 }}
      >
        See pricing
      </Link>
    </div>
  )
}
