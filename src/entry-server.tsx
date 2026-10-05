import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { SEO_PAGES } from './content/seo-pages'
import { DOC_NAV } from './content/docs-content.generated'

/**
 * Build-time render of the marketing pages. NOT a server: nothing runs this in
 * production. `vite build --ssr` compiles it to dist-ssr/, and
 * scripts/prerender-html.mjs calls render() once per route during the build
 * and writes the markup into that route's static HTML.
 *
 * Why: the site shipped an empty <div id="root">, so nothing could paint until
 * the whole bundle had downloaded, parsed and run — about four seconds on a
 * throttled phone, and the hero image could not even start downloading before
 * then, because the browser had no way to know it existed. With the markup in
 * the HTML the page paints as soon as the stylesheet lands, and main.tsx
 * hydrates it in place.
 *
 * The tree must match main.tsx's exactly, minus the router: hydration compares
 * the two, and a provider present on one side only is a mismatch on every
 * page.
 *
 * Effects do not run here and queries do not fetch, so every page renders in
 * the state a first-time visitor's browser starts in: signed out, nothing
 * loaded. A component that reads window, document or storage DURING render
 * (rather than in an effect or a handler) throws here. That fails only its own
 * route, which falls back to the empty shell — see the script.
 */
export function render(path: string): string {
  return renderToString(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <StaticRouter location={path}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

/**
 * The pages that render under their own address, from the same table <Seo>
 * and the sitemap read. A redirecting entry (/sample, /docs) has no page of
 * its own to render. /claims/sample is the live worksheet: its content is an
 * API response, and a build-time snapshot of that would be a stale claim.
 */
export const ROUTES = Object.entries(SEO_PAGES)
  .filter(([path, entry]) => !entry.canonicalPath && path !== '/claims/sample')
  .map(([path]) => path)

/**
 * The docs articles, prerendered like everything else.
 *
 * They were getting a META SHELL from scripts/prerender-meta.mjs -- title,
 * description, canonical and card -- inside an empty <div id="root">. So 45
 * pages of real documentation shipped with no <h1> and no body text to a
 * crawler that does not run JavaScript, which is most of the ones that matter
 * for an answer engine. The content is bundled (docs-content.generated.ts is
 * imported by the docs route), so rendering them costs nothing but the build
 * time and makes them readable.
 *
 * Derived from DOC_NAV rather than typed out, so an article added to the docs
 * source is prerendered without anyone remembering to add it here.
 */
export const DOC_ROUTES = DOC_NAV.flatMap((section) =>
  section.items.map(([slug]) => `/docs/${slug}`),
)
