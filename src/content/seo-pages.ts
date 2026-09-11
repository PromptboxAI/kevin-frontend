/**
 * Route → search and social metadata. ONE source of truth.
 *
 * Read at runtime by <Seo> and at build time by scripts/prerender-meta.mjs,
 * which writes a static HTML file per route so crawlers that never execute
 * JavaScript — Slack, LinkedIn, X, iMessage — get the right card. Two copies of
 * this table would drift within a week, and the failure is silent: the page
 * would look right in a browser and wrong in every shared link.
 *
 * Content mirrors design/SEO.md, which stays the editing surface for copy.
 * ORIGIN is www.kevin.co rather than the apex SEO.md assumes — Vercel serves
 * www and 308s the apex, and a canonical pointing at a redirect splits ranking
 * signals.
 */

export const ORIGIN = 'https://www.kevin.co'

export type SeoEntry = {
  title: string
  description: string
  /** 1200x630 card in /og/. Falls back to og-default.png. */
  image?: string
  /**
   * Canonical ROUTE, when it is not this one. Only for a path that redirects:
   * /sample bounces to /claims/sample, so a canonical pointing at itself would
   * name a URL that never renders anything.
   *
   * A path and not an absolute URL on purpose — scripts/prerender-meta.mjs
   * evaluates this table in an isolated Function, so it has to stay pure data:
   * no imports, no expressions, no template literals. `${ORIGIN}/x` here throws
   * at build time.
   */
  canonicalPath?: string
}

export const SEO_PAGES: Record<string, SeoEntry> = {
  '/': {
    title: 'Kevin — Photos in. Inventory out.',
    description:
      'Drop your claim photos and Kevin builds a defensible, Xactimate-ready contents inventory: identified items, live retail comps, depreciation, and ACV — reviewed by you.',
    image: 'og-landing.png',
  },
  '/pricing': {
    title: 'Pricing — Kevin',
    description:
      '$249/mo for content inventory specialists, IAs and public adjusters. Unlimited claims, 2,000 items a month included, no per-seat fee. First 250 items free.',
    image: 'og-pricing.png',
  },
  '/product': {
    title: 'Product — Kevin',
    description:
      'How Kevin works end to end: photo ingestion, item identification, live retail comps, depreciation, and carrier-ready exports.',
    image: 'og-product.png',
  },
  '/for-adjusters': {
    title: 'Kevin for Insurance Adjusters',
    description:
      'Turn pack-out photo dumps into priced, defensible contents inventories that import straight into Xactimate and XactContents.',
    image: 'og-adjusters.png',
  },
  '/for-estate-liquidators': {
    title: 'Kevin for Estate Sale Professionals',
    description:
      'Photograph an estate, get a fair-market-value inventory with conditions and statuses — ready to hand a client.',
    image: 'og-estate.png',
  },
  '/done-for-you': {
    title: 'Done-for-you claims — Kevin',
    description:
      'Send us the photos and we build the inventory. Flat per-item pricing, XactContents-ready .xlsx and a client PDF, usually within one business day.',
  },
  '/about': {
    title: 'About — Kevin',
    description:
      'Built by an adjuster who settled over 10,000 claims in twenty-two years, because contents inventory should not cost you a Friday night. Long Island, NY.',
  },
  '/contact': {
    title: 'Contact — Kevin',
    description: 'Questions, support, or Enterprise inquiries — reach the Kevin team.',
  },
  '/careers': {
    title: 'Careers — Kevin',
    description: 'Help build the content inventory tool adjusters actually want to use.',
  },
  '/demo': {
    title: 'Watch the Demo — Kevin',
    description:
      'From photo drop to Xactimate. Every step of a real kitchen-fire claim, start to export.',
  },
  '/book-call': {
    title: 'Book a call — Kevin',
    description: 'Bring a real claim and we will run it together. 30 minutes, no slides.',
  },
  '/request-access': {
    title: 'Kevin for Teams — Enterprise',
    description:
      'Volume licensing for carriers, TPAs, and multi-adjuster agencies. One invoice, custom terms.',
  },
  '/legal': {
    title: 'Privacy & Terms — Kevin',
    description: "Kevin's privacy policy, terms of service and security practices.",
  },
  '/docs': {
    title: 'Documentation — Kevin',
    description:
      'Guides for every step: uploading photos, staging and grouping, the review worksheet, pricing, depreciation, and exporting to Xactimate.',
  },

  /**
   * Its own entry, not a tab of /legal. LegalPage renders ONLY the active
   * tab's sections, so /security serves genuinely different copy — and it is
   * the page a carrier's procurement asks for by name. Without this it
   * declared a canonical of /legal at runtime and of the HOMEPAGE in the
   * static shell, either of which invites Google to fold it away as a
   * duplicate and drop it.
   */
  '/security': {
    title: 'Security — Kevin',
    description:
      'How Kevin protects claim photos and inventories: AES-256 at rest, TLS 1.3 in transit, least-privilege access, and a full audit trail on every change.',
  },

  /**
   * /sample only redirects; /claims/sample is what actually renders. Both get
   * an entry so a shared link resolves either way, and /sample canonicalises
   * to the URL that exists rather than to itself.
   */
  '/sample': {
    title: 'Sample claim — Kevin',
    description:
      'A real worksheet on a demo claim: 51 identified items with live retail comps, depreciation and ACV. Edit anything — nothing saves, and no account is needed.',
    canonicalPath: '/claims/sample',
  },
  '/claims/sample': {
    title: 'Sample claim — Kevin',
    description:
      'A real worksheet on a demo claim: 51 identified items with live retail comps, depreciation and ACV. Edit anything — nothing saves, and no account is needed.',
  },
}

/** Titles for the noindex screens — kept out of search, but a real tab name. */
export const NOINDEX_TITLES: Record<string, string> = {
  '/sign-in': 'Sign in — Kevin',
  '/sign-up': 'Create your account — Kevin',
  '/forgot-password': 'Reset your password — Kevin',
  '/reset-sent': 'Check your email — Kevin',
  '/reset-password': 'Choose a new password — Kevin',
  /* Preserved long-form homepage. Unlinked; kept out of search so it cannot
     compete with / for the same intent. */
  '/landing-full': 'Kevin — long-form homepage (archived)',
}
