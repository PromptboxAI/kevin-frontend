import { useEffect } from 'react'
import { NOINDEX_TITLES, ORIGIN, SEO_PAGES } from '../content/seo-pages'

/**
 * Per-page search and social metadata.
 *
 * Content comes from design/SEO.md, which is the editing surface — change a
 * row there and mirror it here. Before this existed the whole site shipped one
 * static `<title>Kevin</title>` from index.html with no description, canonical
 * or social card, so every page looked identical in search results and every
 * link shared to Slack or LinkedIn rendered as a bare URL.
 *
 * No library. React 19 hoists `<title>`, `<meta>` and `<link>` rendered
 * anywhere in the tree into `<head>`, and de-duplicates by name/property — so
 * a page rendering its own title simply replaces the default.
 *
 * index.html carries the landing page's tags as a crawler fallback, since
 * Slack, LinkedIn and X never run the bundle. Those are marked `data-default`
 * and retired here on mount — otherwise React's tags are ADDED to them and
 * every page ends up with two canonicals pointing at different URLs, which
 * Google resolves by ignoring both. Measured on the live site before this
 * existed: two canonicals, two og:image, two descriptions, two titles.
 *
 * CANONICAL HOST is www.kevin.co, not the apex. Vercel serves www and 308s
 * kevin.co to it; SEO.md predates that decision and still says the apex, so
 * this is the one place the two deliberately disagree. Pointing canonicals at
 * a host that immediately redirects would split ranking signals across both.
 */

export type SeoProps = {
  /** Route path, e.g. "/pricing". Looked up in SEO_PAGES / NOINDEX_TITLES. */
  path: string
  /** Auth and in-app screens: no description or canonical, just keep them out. */
  noindex?: boolean
  /** Only for routes with no table entry, e.g. the 404 catch-all. */
  title?: string
}

export default function Seo({ path, noindex, title: titleOverride }: SeoProps) {
  const entry = SEO_PAGES[path]
  const title = titleOverride ?? entry?.title ?? NOINDEX_TITLES[path] ?? 'Kevin'
  const description = entry?.description ?? ''
  const url = `${ORIGIN}${path === '/' ? '' : path}`
  const card = `${ORIGIN}/og/${entry?.image ?? 'og-default.png'}`

  // Retire the static fallback once the real tags are mounted. Runs once —
  // the defaults are in the initial HTML and never come back.
  useEffect(() => {
    document.head.querySelectorAll('[data-default]').forEach((el) => el.remove())
  }, [])

  if (noindex) {
    return (
      <>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </>
    )
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content="Kevin" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={card} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={card} />
    </>
  )
}
