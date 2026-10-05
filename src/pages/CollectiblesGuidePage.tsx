import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import {
  ComparisonTable,
  CtaBand,
  DirectAnswer,
  EvidenceCallout,
  FaqList,
  RelatedCards,
  SeoPageHead,
  crumbJsonLd,
  faqJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /guides/collectibles-insurance-contents — batch 3, spec page 23.
 *
 * Two facts from the live contract that the brief does not know, and both are
 * the most useful things on the page:
 *
 *  1. GRADED TRADING CARDS AND FINE CHINA ARE APPRAISAL CLASSES -- never
 *     auto-priced, same as jewelry, firearms, fine arts and furs
 *     (FRONTEND.md, `appraisal: true` / MANUAL_CLASSES). The four-item list
 *     quoted on our other pages is true but not exhaustive.
 *  2. COLLECTIBLE COINS carry a policy sub-limit and are flagged amber;
 *     graded cards and fine china are NOT, despite being appraisal goods.
 *     `special_limits` and the appraisal gate are deliberately different sets,
 *     and conflating them is a bug the backend doc names by item number.
 *
 * On completed sales: the brief is right that they are better market evidence
 * in thin collectible markets, and that stays as adjuster guidance. But Kevin
 * holds no completed-sales data -- every comp is a current offer -- so the
 * page says which side we are on rather than letting a reader assume the
 * better-sounding one. Same reasoning as /guides/retail-vs-secondary-market-
 * contents; rule 8b calls an asking price presented as a sold price false
 * provenance.
 */

const FAQS: Faq[] = [
  {
    q: 'Should collectibles be priced from eBay?',
    a: 'Often that is the only market where the item actually trades, so yes — with more scrutiny than a retail listing needs. The comparable has to match on item, edition, condition and completeness, any one of which can move the value further than the category does.',
  },
  {
    q: 'Are asking prices reliable?',
    a: 'They are evidence, not a verdict. An active listing shows what one seller wants; in a thin collectible market the spread between asking prices can be enormous, and the high end is often a different edition, a sealed example, or somebody not really expecting to sell.',
  },
  {
    q: 'Does Kevin price from completed sales?',
    a: 'No. Every comp Kevin surfaces is a current offer, retail and resale alike, so the figures are asking prices on listings that exist now rather than records of past transactions. For a collectible where completed sales are the better evidence, that is a line worth pricing yourself and attaching your own source to.',
  },
  {
    q: 'Should collectibles be depreciated like ordinary household goods?',
    a: 'Not necessarily, and class assignment is what decides it. Several collectible categories carry materially longer useful lives than short-life household goods, and some are appraisal classes that are never automatically priced at all.',
  },
  {
    q: 'Does packaging affect collectible value?',
    a: 'For some categories it dominates it. A sealed example and the same item opened can be different markets, and completeness — inserts, accessories, certificates — moves the figure again. Where that is true, the inventory should say which one the insured owned.',
  },
  {
    q: 'Can Kevin price rare items?',
    a: 'It can research the resale market where retail is not representative, and it will return a blank, editable price rather than a guess when the evidence will not support one. Graded trading cards, fine china, fine arts, jewelry, firearms and furs are never auto-priced at all — they reach you unpriced by design.',
  },
]

const CRUMBS = [{ to: '/guides/collectibles-insurance-contents', t: 'Collectibles' }]

export default function CollectiblesGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/collectibles-insurance-contents"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Price Collectibles in a Contents Claim"
          lede="For most property, what it cost and what it costs now are related. For a collectible they often are not — which is why edition, condition and completeness do the work that a model number does elsewhere."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="How is a collectible valued on a contents claim?"
          answer="By identifying the exact item — edition, release, condition, completeness — and then finding what a genuinely comparable example trades for, usually in a specialist or resale market rather than ordinary retail."
        >
          <p>
            Ordinary replacement-cost research assumes a current product stands in for the damaged
            one. For a collectible that assumption frequently fails: there may be no current
            product, and two examples that photograph identically can be worth very different
            amounts.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Identify before pricing — further than usual</h2>
          <ComparisonTable
            caption="Detail that changes the value, not just the description"
            columns={['Attribute', 'Why it moves the figure']}
            rows={[
              ['Edition or release', 'A reissue and a first release are different markets'],
              ['Year and production run', 'Scarcity is usually a function of both'],
              ['Condition or grade', 'Often the single largest factor in the price'],
              ['Packaging', 'Sealed, boxed or loose can be separate markets'],
              ['Completeness', 'Missing inserts or accessories change the comparable'],
              ['Authentication', 'Graded or certified examples trade against each other'],
              ['Markings', 'Serial, issue number or mint mark can decide the edition'],
            ]}
          />
          <p>
            A vague description does not produce a vague price here — it produces a confident price
            for a different item.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Five listings, five different items</h2>
          <p>
            Suppose a search returns five results: one sealed, one opened but complete, one missing
            accessories, one damaged, and one a different edition. Averaging them produces a number,
            and the number means nothing, because the five are not comparables for each other.
          </p>
          <EvidenceCallout>
            <p>
              This is why Kevin prices a line from <strong>one listing rather than a blend of
              several</strong>, with the Source Link pointing at it. A blended figure hides exactly
              the question a collectible line needs answered: which example is this price for?
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Asking prices, and what Kevin holds</h2>
          <p>
            An active listing shows what a seller is asking. A completed sale shows what somebody
            paid. In thin or volatile collectible markets the second is often the better evidence of
            how the market actually behaves, and an adjuster researching one unusual item by hand is
            right to look for it.
          </p>
          <p>
            <strong>Kevin prices from active listings.</strong> Every comp it surfaces is a current
            offer, so the figures are asking prices on listings that exist now, never records of
            past transactions. On a collectible where completed sales are the stronger evidence,
            that is a line worth pricing yourself and attaching your own source to — which the
            worksheet supports on any row.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Sets, lots and single pieces</h2>
          <p>
            Collectibles are sold as individual pieces, sets, lots, complete series and partial
            series, and the same search will return all of them. A set price must not value one
            piece, and a single piece must not value a series. On quantity-heavy collections this is
            the error that compounds fastest.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What Kevin will not price automatically</h2>
          <p>
            Some collectible property never reaches the pricing engine at all. <strong>Graded
            trading cards and fine china are appraisal classes</strong>, alongside jewelry, firearms,
            fine arts and furs — they arrive unpriced, with an editable field, because a number
            produced without an appraisal on that property is worse than a blank.
          </p>
          <p>
            Separately, and this is a different list, some classes carry a policy sub-limit and are
            flagged amber on the worksheet: fine jewelry, firearms, fine arts, furs and{' '}
            <strong>collectible coins</strong>. The two sets deliberately do not match — graded
            cards are never auto-priced but carry no sub-limit, and the amber cue flags coverage, not
            a problem with the line.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Record why the comparable is the comparable</h2>
          <p>
            The further a comparable sits from the exact item, the more the reasoning carries the
            line. A collectible line should let a reviewer see what the item was, which edition and
            condition were documented, what source was used and why that example is relevant &mdash;
            because none of it is obvious from an ordinary retail search.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <CtaBand />

        <RelatedCards
          items={[
            {
              to: '/guides/retail-vs-secondary-market-contents',
              t: 'Retail vs the resale market',
              d: 'Which market represents the item, and why asking prices mislead.',
            },
            {
              to: '/guides/discontinued-items-insurance-claims',
              t: 'Pricing a discontinued item',
              d: 'The hierarchy for property that is no longer sold.',
            },
            {
              to: '/guides/high-value-contents-claims',
              t: 'Documenting high-value property',
              d: 'Where a small identification error costs the most.',
            },
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'Why class decides the useful life.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
