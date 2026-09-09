import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Mobile conversion bar.
 *
 * The sign-up button lived in the hero and then not again until the footer,
 * 10,000px later — so a visitor who read two sections and decided had to
 * scroll to the bottom to act. This keeps it one tap away.
 *
 * It appears only AFTER the element passed as `watch` leaves the viewport, so
 * it never sits under a CTA that is already on screen. CSS hides it entirely
 * above 820px; this component renders nothing at all on desktop widths so the
 * observer does not run there either.
 */
export default function StickyCta({ watchSelector }: { watchSelector: string }) {
  const [shown, setShown] = useState(false)
  const seen = useRef(false)

  useEffect(() => {
    const target = document.querySelector(watchSelector)
    if (!target) return

    const io = new IntersectionObserver(
      ([entry]) => {
        // Only arm after the hero CTA has been seen once — otherwise a deep
        // link that lands mid-page would slide the bar in with no context.
        if (entry.isIntersecting) seen.current = true
        setShown(seen.current && !entry.isIntersecting)
      },
      { threshold: 0 },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [watchSelector])

  return (
    <div className={`k-stickycta ${shown ? 'k-stickycta--on' : ''}`} aria-hidden={!shown}>
      <div className="k-stickycta-t">
        <strong>Start free — 250 items</strong>
        No deadline, no per-claim fee
      </div>
      <Link className="k-btn" to="/sign-up" tabIndex={shown ? 0 : -1}>
        Start for Free
      </Link>
    </div>
  )
}
