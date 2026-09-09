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
 * CANONICAL HOST is www.kevin.co, not the apex. Vercel serves www and 308s
 * kevin.co to it; SEO.md predates that decision and still says the apex, so
 * this is the one place the two deliberately disagree. Pointing canonicals at
 * a host that immediately redirects would split ranking signals across both.
 */

const ORIGIN = 'https://www.kevin.co'

export type SeoProps = {
  title: string
  description: string
  /** Route path, e.g. "/pricing". Used for the canonical and og:url. */
  path: string
  /** 1200x630 card under /og/. Falls back to the default card. */
  image?: string
  /** Auth and in-app screens: no title/description, just keep them out. */
  noindex?: boolean
}

export default function Seo({ title, description, path, image, noindex }: SeoProps) {
  const url = `${ORIGIN}${path === '/' ? '' : path}`
  const card = `${ORIGIN}/og/${image ?? 'og-default.png'}`

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
