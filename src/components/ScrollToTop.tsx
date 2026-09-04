import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restores the top of the page on every navigation.
 *
 * A browser does this for free on a real page load; a SPA does not — React
 * Router swaps the tree and leaves the scroll position exactly where it was.
 * Following a footer link from the bottom of the landing page therefore opened
 * /about somewhere in its middle, which reads as a broken page rather than as
 * preserved scroll.
 *
 * Three deliberate behaviours:
 *
 * 1. **A hash wins.** /legal#terms and /contact#book must land on their target,
 *    so a hash scrolls to that element instead of to the top. The element may
 *    not exist on the first frame (the route is still mounting), hence the
 *    rAF-then-timeout retry.
 *
 * 2. **Only the pathname triggers it.** Changing just the search string — a
 *    filter, a tab, a pagination param — is not a new page, and yanking the
 *    reader to the top for it is worse than doing nothing.
 *
 * 3. **`instant`, not smooth.** A navigation should already be at the top when
 *    the new page paints; animating it looks like the page loaded wrong and
 *    corrected itself. It also respects nobody's reduced-motion setting.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const toTop = () =>
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })

    if (hash) {
      const id = hash.slice(1)
      const jump = () => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ block: 'start' })
        return !!el
      }
      if (jump()) return
      const raf = requestAnimationFrame(() => {
        // Not every hash names an element: /legal#terms selects a TAB, and
        // leaving the offset alone there dropped the reader into the middle of
        // the Terms with no idea why. A hash with no target is a page load.
        if (!jump()) window.setTimeout(() => { if (!jump()) toTop() }, 120)
      })
      return () => cancelAnimationFrame(raf)
    }

    toTop()
    // Some app shells scroll an inner element rather than the document; reset
    // whichever one actually holds the offset.
    const se = document.scrollingElement
    if (se && se.scrollTop !== 0) se.scrollTop = 0
  }, [pathname, hash])

  return null
}
