import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { CtaBand, SeoPageHead, crumbJsonLd, itemListJsonLd } from '../components/seo-kit'

/**
 * /guides — the hub.
 *
 * Built because the thirteen answer pages were ORPHANS: live, in the sitemap,
 * cross-linked to each other, and reachable from nothing a visitor could
 * click. That is bad for people and bad for ranking — a page nothing links to
 * reads as a page nobody vouches for. The nav and the footer now point here,
 * and here points at everything.
 *
 * Grouped by what the reader is trying to do rather than by the brief's tiers,
 * which are a build order and mean nothing to a visitor.
 */

type Entry = { to: string; t: string; d: string }

const GROUPS: { h: string; blurb: string; items: Entry[] }[] = [
  {
    h: 'How Kevin works',
    blurb: 'The product, in detail, including where it stops.',
    items: [
      {
        to: '/methodology',
        t: 'How Kevin builds insurance contents line items',
        d: 'How a photograph becomes a priced, classified, depreciated line item — and where a person confirms the work.',
      },
      {
        to: '/insurance-contents-pricing-software',
        t: 'Insurance contents pricing software',
        d: 'How a line gets its price: query construction, comparable filtering, a single listing, and where resale comes in.',
      },
      {
        to: '/public-adjusters/ai-contents-inventory-software',
        t: 'Contents inventory software for public adjusters',
        d: 'What the workflow automates, what it leaves to you, and what comes out at the end.',
      },
    ],
  },
  {
    h: 'Doing the work',
    blurb: 'Method that holds up whether or not you use our software.',
    items: [
      {
        to: '/guides/large-contents-inventory-500-items',
        t: 'Building a 500+ item claim',
        d: 'Where the hours go on a large inventory, and why photographs are not line items.',
      },
      {
        to: '/guides/clothing-footwear-contents-claims',
        t: 'Clothing and footwear',
        d: 'A closet photo supports quantity, not identity — when to group and when to itemise.',
      },
      {
        to: '/guides/public-adjuster-contents-inventory',
        t: 'Contents inventory field guide',
        d: 'What belongs on a line, how specific a description has to be, and why several photographs describe one item.',
      },
      {
        to: '/guides/what-carriers-look-for-contents-inventory',
        t: 'What a reviewer looks for',
        d: 'The ten checks a desk adjuster applies, and why consistency is what a large schedule is judged on.',
      },
      {
        to: '/guides/how-to-price-contents-claims-faster',
        t: 'How to price contents claims faster',
        d: 'The five bottlenecks on a large claim, and where automation should stop.',
      },
      {
        to: '/guides/automate-replacement-cost-research',
        t: 'Automating replacement-cost research',
        d: 'What a defensible search needs, why long descriptions make bad queries, and the matches worth filtering out.',
      },
      {
        to: '/guides/replacement-cost-comparable',
        t: 'Finding a defensible comparable',
        d: 'The matching hierarchy, what never to price from, and why a dated source link matters.',
      },
      {
        to: '/guides/item-level-photos-insurance-contents',
        t: 'Why item-level photos matter',
        d: 'A room photo proves property existed; it rarely proves what it was.',
      },
    ],
  },
  {
    h: 'Valuation and depreciation',
    blurb: 'The arithmetic behind the two numbers on every line.',
    items: [
      {
        to: '/guides/exact-match-vs-like-kind-quality',
        t: 'Exact match vs like kind and quality',
        d: 'What a replacement has to preserve, and where a substitution stops being defensible.',
      },
      {
        to: '/guides/high-value-contents-claims',
        t: 'Documenting high-value property',
        d: 'Where a small identification error costs the most, and which classes never auto-price.',
      },
      {
        to: '/guides/collectibles-insurance-contents',
        t: 'Pricing collectibles',
        d: 'Edition, condition and completeness — and the markets where ordinary retail says nothing.',
      },
      {
        to: '/guides/discontinued-items-insurance-claims',
        t: 'Pricing a discontinued item',
        d: 'Exact model, successor, like kind and quality — and where the resale market takes over.',
      },
      {
        to: '/guides/retail-vs-secondary-market-contents',
        t: 'Retail vs the resale market',
        d: 'Which market represents the item, why asking prices mislead, and what Kevin prices from.',
      },
      {
        to: '/guides/insurance-contents-depreciation',
        t: 'How contents depreciation works',
        d: 'Useful life by class, real schedule lines, and why depreciation runs all the way to 100%.',
      },
      {
        to: '/guides/rcv-vs-acv-personal-property',
        t: 'RCV vs ACV on a contents claim',
        d: 'What separates the two figures, and how a real line foots once tax is in it.',
      },
    ],
  },
  {
    h: 'Total losses',
    blurb: 'When the property and the evidence are both gone.',
    items: [
      {
        to: '/contents-claims/without-photos',
        t: 'Pricing a contents claim without photos',
        d: 'How a written inventory is parsed, mapped, previewed and priced — and where it is weaker than photographs.',
      },
      {
        to: '/guides/non-salvageable-contents-inventory',
        t: 'Documenting non-salvageable contents',
        d: 'What to photograph before the dumpster, and why that decides what the schedule can say.',
      },
      {
        to: '/guides/contents-inventory-after-house-fire',
        t: 'Rebuilding an inventory after a total fire loss',
        d: 'The evidence that usually survives, a room-by-room method, and the mistakes that cost the most.',
      },
    ],
  },
  {
    h: 'Choosing software',
    blurb: 'Comparisons written to be useful rather than flattering.',
    items: [
      {
        to: '/xactcontents-alternative',
        t: 'A faster XactContents-style workflow',
        d: 'What Kevin does, what it does not, and how the export lands. Not affiliated with Verisk.',
      },
      {
        to: '/compare/kevin-vs-xactcontents',
        t: 'Kevin vs XactContents',
        d: 'Row by row, including when XactContents is the better fit.',
      },
      {
        to: '/guides/best-contents-software-public-adjusters',
        t: 'What to look for in contents software',
        d: 'Evaluation criteria and the questions to put to any vendor, including us.',
      },
      {
        to: '/case-studies/4000-contents-line-items-30-days',
        t: '4,000+ line items in 30 days',
        d: "What one adjuster's month looked like through Kevin, and what a person still reviewed on every line.",
      },
    ],
  },
]

const CRUMBS = [{ to: '/guides', t: 'Guides' }]

/** Stable anchor per section, so the jump row and the headings cannot drift. */
const slug = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const ALL = GROUPS.flatMap((g) => g.items)

export default function GuidesIndexPage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides"
        jsonLd={[crumbJsonLd(CRUMBS), itemListJsonLd('Kevin contents claim guides', ALL)]}
      />
      <MktNav />

      <main className="k-mkt-main k-guidesx">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Guides"
          lede="How contents claims get built, priced and depreciated — written for the people who do it, with the product's real behaviour rather than its brochure."
          updated="5 October 2026"
        />

        {/* Jump row. On a page of twenty-five entries the sections are the
            navigation, and this also gives each one a real anchor to link at
            from elsewhere. Plain anchors, so they work without JavaScript. */}
        <nav className="k-guidesx-jump" aria-label="Sections">
          {GROUPS.map((g) => (
            <a key={g.h} href={`#${slug(g.h)}`}>
              {g.h}
              <span className="k-guidesx-jump-n">{g.items.length}</span>
            </a>
          ))}
        </nav>

        {GROUPS.map((g, i) => (
          <section key={g.h} id={slug(g.h)} className="k-guidesx-sec">
            <div className="k-guidesx-hd">
              <span className="k-guidesx-n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{g.h}</h2>
                <p>{g.blurb}</p>
              </div>
            </div>
            <ul className="k-guidesx-grid">
              {g.items.map((r) => (
                <li key={r.to}>
                  <Link className="k-rel-card" to={r.to}>
                    <span className="k-rel-t">{r.t}</span>
                    <span className="k-rel-d">{r.d}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <CtaBand />
      </main>

      <MktFooter />
    </div>
  )
}
