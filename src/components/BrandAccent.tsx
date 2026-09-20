import { useEffect } from 'react'
import { useDirectory } from '../lib/directory'
import { BRAND_DEFAULT, accentFor, accentHover } from '../lib/directory-rules'

/**
 * Paints the app in the firm's colour.
 *
 * Mounted inside the signed-in header, so it never touches the marketing
 * pages or the client portal — those are Kevin's own surfaces, and the
 * portal belongs to a reader who is not this account anyway.
 *
 * The accent is DERIVED (accentFor): a brand colour is picked for a
 * letterhead, and white button text on a bright one would be unreadable, so
 * it is darkened until it carries white text. The swatch the adjuster chose
 * is what their documents will use, unchanged.
 *
 * Local until the backend stores the business profile, like the rest of the
 * directory. The default is Kevin's navy, so an account that sets nothing
 * looks exactly as it did.
 */
export default function BrandAccent() {
  const { dir } = useDirectory()
  const brand = dir.companies.find((c) => c.brandColor)?.brandColor ?? BRAND_DEFAULT

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--k-accent', accentFor(brand))
    root.style.setProperty('--k-accent-2', accentHover(brand))
    return () => {
      root.style.removeProperty('--k-accent')
      root.style.removeProperty('--k-accent-2')
    }
  }, [brand])

  return null
}
