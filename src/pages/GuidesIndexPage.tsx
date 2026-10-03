import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { CtaBand, SeoPageHead, crumbJsonLd } from '../components/seo-kit'

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
        d: 'Upload, extract, cluster, review, promote, price, depreciate, export — and where a person confirms the work.',
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

export default function GuidesIndexPage() {
  return (
    <div className="k-landing">
      <Seo path="/guides" jsonLd={crumbJsonLd(CRUMBS)} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Guides"
          lede="How contents claims get built, priced and depreciated — written for the people who do it, with the product's real behaviour rather than its brochure."
          updated="3 October 2026"
        />

        {GROUPS.map((g) => (
          <section key={g.h} className="k-seosec">
            <h2>{g.h}</h2>
            <p>{g.blurb}</p>
            <ul className="k-rel-grid k-rel-grid--wide">
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
