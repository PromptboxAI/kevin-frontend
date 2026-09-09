import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import KevinWordmark from './KevinWordmark'

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
 *
 * It also carries the wordmark and the way home. The app chrome this page
 * would otherwise inherit — wordmark, My claims, Exports, Settings, the
 * breadcrumb and the claim tabs — is hidden on the sample because every one of
 * those bounces a signed-out visitor to /sign-in. This banner is therefore the
 * only chrome the page has, so it has to do that job.
 */
export default function SampleBanner() {
  const ref = useRef<HTMLDivElement>(null)

  /* The frame below is inset by the banner's height, and that height is not a
     constant: the copy wraps to three lines on a phone, so the 34px the frame
     used to assume left 87px of overlap and hid the claim title behind the
     banner. Measured and published as a custom property instead, so it stays
     correct at every width and survives a copy change. */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const publish = () =>
      document.documentElement.style.setProperty('--k-sample-banner-h', `${el.offsetHeight}px`)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--k-sample-banner-h')
    }
  }, [])

  return (
    <div
      ref={ref}
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
      <Link to="/" aria-label="Kevin home" style={{ flexShrink: 0, lineHeight: 1 }}>
        <KevinWordmark size={17} tone="light" suffix to={null} />
      </Link>
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
