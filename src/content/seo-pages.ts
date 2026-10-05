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
      'Drop your claim photos and Kevin builds a defensible, Xactimate-ready contents inventory: identified items, priced comps, depreciation and ACV.',
    image: 'og-landing.png',
  },
  /* ── SEO / AI-answer pages ───────────────────────────────────────────
     An entry here is all a page needs to be prerendered with real markup
     (entry-server.tsx derives ROUTES from this table), listed in the sitemap
     and given OG tags. Spec: kevin_co_seo_ai_answer_page_specs.md. */
  '/public-adjusters/ai-contents-inventory-software': {
    title: 'AI Contents Inventory Software for Public Adjusters | Kevin',
    description:
      'Create insurance-ready contents line items faster: identify items, research replacement pricing, apply depreciation, export a carrier-ready worksheet.',
    image: 'og-default.png',
  },
  '/insurance-contents-pricing-software': {
    title: 'Insurance Contents Pricing Software | Kevin',
    description:
      "Automate replacement-cost research, source links, depreciation, RCV and ACV for insurance contents claims with Kevin.",
    image: 'og-default.png',
  },
  '/xactcontents-alternative': {
    title: 'XactContents Alternative for Faster Contents Claims | Kevin',
    description:
      "A faster XactContents workflow: Kevin identifies items, prices them, depreciates and exports in the XactContents template. Not affiliated with Verisk.",
    image: 'og-default.png',
  },
  '/methodology': {
    title: 'How Kevin Builds Insurance Contents Line Items | Kevin',
    description:
      "How Kevin turns photographs into insurance-ready contents line items — what is automated, what a person confirms, and where the process deliberately stops.",
    image: 'og-default.png',
  },
  '/guides/how-to-price-contents-claims-faster': {
    title: 'How to Price Contents Claims Faster | Kevin',
    description:
      "The five bottlenecks on a large contents claim, which of them automation should take, and the one place it should stop and hand back to you.",
    image: 'og-default.png',
  },
  '/contents-claims/without-photos': {
    title: 'Contents Claim Pricing Without Photos | Kevin',
    description:
      "For total losses, Kevin prices contents from item descriptions when usable photographs no longer exist. A separate workflow from the photo-based engine.",
    image: 'og-default.png',
  },
  '/guides/automate-replacement-cost-research': {
    title: 'How to Automate Replacement-Cost Research | Kevin',
    description:
      "Automation can search, filter and rank listings, but item identity stays the gatekeeper. What a defensible search needs, and the matches to filter out.",
    image: 'og-default.png',
  },
  '/guides/item-level-photos-insurance-contents': {
    title: 'Why Item-Level Photos Matter in Contents Claims | Kevin',
    description:
      "A room photo establishes that property was there; it rarely establishes what it was. What belongs in frame for a defensible contents line item.",
    image: 'og-default.png',
  },
  '/guides/insurance-contents-depreciation': {
    title: 'How Insurance Contents Depreciation Works | Kevin',
    description:
      "Depreciation reduces replacement cost to reflect age against the useful life of the item class. Kevin’s schedule: 31 categories, 87 sub-lines, running to 100%.",
    image: 'og-default.png',
  },
  '/guides/replacement-cost-comparable': {
    title: 'How to Find a Defensible Replacement Cost Comparable | Kevin',
    description:
      "A defensible comparable matches the item on the characteristics that set its price, and keeps the listing behind it as evidence.",
    image: 'og-default.png',
  },
  '/compare/kevin-vs-xactcontents': {
    title: 'Kevin vs XactContents: Workflow Comparison | Kevin',
    description:
      "Kevin and XactContents overlap in part of the contents workflow but are not the same product. A row-by-row comparison, with no declared winner.",
    image: 'og-default.png',
  },
  '/guides': {
    title: 'Guides — Contents Claims, Pricing and Depreciation | Kevin',
    description:
      "How contents claims get built, priced and depreciated: method guides for public adjusters, plus how Kevin works and where it stops.",
    image: 'og-default.png',
  },
  '/guides/contents-inventory-after-house-fire': {
    title: 'Building a Contents Inventory After a House Fire | Kevin',
    description:
      "Rebuild a contents inventory room by room after a total loss, using the evidence that survives: cloud photos, order histories, receipts and statements.",
    image: 'og-default.png',
  },
  '/guides/rcv-vs-acv-personal-property': {
    title: 'RCV vs ACV for Personal Property Claims | Kevin',
    description:
      "Replacement cost value is what the item costs today; actual cash value is that figure less depreciation for its age and class. How a real worksheet line foots.",
    image: 'og-default.png',
  },
  '/guides/public-adjuster-contents-inventory': {
    title: 'Public Adjuster Contents Inventory Field Guide | Kevin',
    description:
      "What belongs on a contents line item, how specific a description has to be to price, and why several photographs describe one piece of property.",
    image: 'og-default.png',
  },
  '/guides/what-carriers-look-for-contents-inventory': {
    title: 'What Adjusters Look for in a Contents Inventory | Kevin',
    description:
      "The ten checks a desk adjuster applies to a contents schedule, and why consistency across the schedule is what a large claim is judged on.",
    image: 'og-default.png',
  },
  '/guides/non-salvageable-contents-inventory': {
    title: 'How to Document Non-Salvageable Contents | Kevin',
    description:
      "Photograph non-salvageable property before disposal: what each frame establishes, why four photos are not four items, and how the line is priced afterwards.",
    image: 'og-default.png',
  },
  '/guides/discontinued-items-insurance-claims': {
    title: 'How to Price Discontinued Items in Contents Claims | Kevin',
    description:
      "Exact model, successor, same-brand equivalent, like kind and quality, then the resale market — the hierarchy for valuing property that is no longer sold.",
    image: 'og-default.png',
  },
  '/guides/retail-vs-secondary-market-contents': {
    title: 'Retail vs eBay Pricing for Insurance Contents Claims | Kevin',
    description:
      "When retail replacement pricing fits and when the resale market is the honest source — plus why Kevin prices from active listings rather than completed sales.",
    image: 'og-default.png',
  },
  '/guides/exact-match-vs-like-kind-quality': {
    title: 'Exact Match vs Like Kind and Quality | Kevin',
    description:
      "What separates an exact replacement, a successor model and a like-kind substitute on a contents claim, and where each one stops being defensible.",
    image: 'og-default.png',
  },
  '/guides/high-value-contents-claims': {
    title: 'How to Document High-Value Contents | Kevin',
    description:
      "Where identity moves the price, the description is the argument: configuration, the right market, and which classes are never auto-priced.",
    image: 'og-default.png',
  },
  '/guides/collectibles-insurance-contents': {
    title: 'How to Price Collectibles in Contents Claims | Kevin',
    description:
      "Edition, condition and completeness decide a collectible, not the category. Which markets apply, and why graded cards are never auto-priced.",
    image: 'og-default.png',
  },
  '/guides/clothing-footwear-contents-claims': {
    title: 'Documenting Clothing and Footwear in Contents Claims | Kevin',
    description:
      "A closet photo supports quantity, not identity. When to group, when to itemise, and why age carries more weight on apparel than anywhere else.",
    image: 'og-default.png',
  },
  '/guides/large-contents-inventory-500-items': {
    title: 'How to Build a 500+ Item Contents Claim | Kevin',
    description:
      "Large claims are repetition, not difficulty. Where the hours go, why photographs are not line items, and how small error rates compound at scale.",
    image: 'og-default.png',
  },
  '/guides/contents-claim-qa-checklist': {
    title: 'Contents Claim QA Checklist | Kevin',
    description:
      "The pass to make before a contents schedule is submitted: identity, quantity, comparables, sources, depreciation, totals and the exceptions worth your time.",
    image: 'og-default.png',
  },
  '/guides/desk-adjuster-contents-review': {
    title: 'How a Desk Review of a Contents Claim Works | Kevin',
    description:
      "Large schedules are sampled, not read line by line. What pulls more of a schedule into the sample, and what happens after a line is questioned.",
    image: 'og-default.png',
  },
  '/guides/contents-line-items-rejected': {
    title: 'Why Contents Line Items Get Questioned | Kevin',
    description:
      "Identity, comparable and consistency problems that get a line reduced — and why questioned rarely means denied.",
    image: 'og-default.png',
  },
  '/guides/source-pricing-insurance-contents': {
    title: 'How to Document Source Pricing for Contents Claims | Kevin',
    description:
      "What a replacement-cost source has to establish, matching the source to the property, and why quantity is the quiet error.",
    image: 'og-default.png',
  },
  '/contents-software-roi': {
    title: 'Contents Software ROI Calculator | Kevin',
    description:
      "Work out what your current contents process costs at your own volume and rate, and how many line items automation has to help with to pay for itself.",
    image: 'og-default.png',
  },
  '/guides/best-contents-software-public-adjusters': {
    title: 'Best Contents Software for Public Adjusters | Kevin',
    description:
      "Evaluation criteria rather than rankings: what to test in a trial, the four categories of tool, and the questions to put to any vendor.",
    image: 'og-default.png',
  },
  '/case-studies/4000-contents-line-items-30-days': {
    title: '4,000+ Contents Line Items in 30 Days | Kevin',
    description:
      "How one practising adjuster produced more than four thousand carrier-facing contents line items in a single month, reviewing every line.",
    image: 'og-default.png',
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
    description:
      'Questions about Kevin, help with a claim in progress, or Enterprise licensing for a carrier, TPA or agency — email the team and a person replies.',
  },
  '/careers': {
    title: 'Careers — Kevin',
    description:
      'Help build the content inventory tool adjusters actually want to use. See the open roles at Kevin, or tell us what you would bring if yours is not listed.',
  },
  '/demo': {
    title: 'Watch the Demo — Kevin',
    description:
      'A written walkthrough of a real kitchen-fire claim in Kevin: photo drop, photo sets, the priced worksheet, depreciation, and the Xactimate (Excel) export.',
  },
  '/book-call': {
    title: 'Book a call — Kevin',
    description:
      'Book a 30-minute call and bring the photos from a real claim. We run it together, from upload to an Xactimate-ready contents inventory. No slides.',
  },
  '/request-access': {
    title: 'Kevin for Teams — Enterprise',
    description:
      'Kevin Enterprise: volume licensing for carriers, TPAs and multi-adjuster agencies. One invoice, custom terms, and contents inventories built from claim photos.',
  },
  '/legal': {
    title: 'Privacy & Terms — Kevin',
    description:
      "Kevin's privacy policy, terms of service and security practices: what claim data we hold, how it is protected, and what the service does and does not promise.",
  },
  /**
   * /docs only redirects, to the first article — so, like /sample, it names
   * the URL that actually renders. The articles themselves are not in this
   * table: their metadata comes from docs-content.generated.ts, at runtime in
   * DocsPage and at build time in scripts/prerender-meta.mjs, which fails the
   * build if this path stops being the first article.
   */
  '/docs': {
    title: 'Documentation — Kevin',
    description:
      'Guides for every step: uploading photos, staging and grouping, the review worksheet, pricing, depreciation, and exporting to Xactimate.',
    canonicalPath: '/docs/quick-start',
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
