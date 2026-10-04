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
 * /guides/discontinued-items-insurance-claims — batch 2, spec page 19.
 *
 * The replacement hierarchy here is CLAIMS PRACTICE, not Kevin's routing, and
 * that distinction is what keeps the page inside rule 10. Exact model ->
 * successor -> same-brand equivalent -> like kind and quality -> resale is how
 * the industry reasons about a discontinued item; it is in every adjuster's
 * training. What the page does NOT do is describe how Kevin decides, score
 * candidates, or route a class to a source.
 *
 * Kevin's own behaviour is stated only at the level of the three valuation
 * bases that already appear on the payload (rule 10): retail comp, like-kind
 * substitute, manual. Plus rule 11's fall-through: when the retail bucket is
 * too thin the resale market prices the line, raw with no gross-up, labelled
 * as resale wherever comps are shown.
 *
 * eBay and the resale platforms are named as MARKETS AN ADJUSTER WORKS IN, not
 * as configured sources of ours. Rule 10 bans naming the pricing vendor and
 * the scrapped per-store list; it does not ban naming a marketplace that
 * appears in a comp. The page never says "Kevin uses eBay".
 *
 * Rule 11: Jewelry, Fine Arts, Firearms and Furs are manual-only, which is
 * directly relevant to the collectibles section and is stated there.
 */

const FAQS: Faq[] = [
  {
    q: 'What if the exact model is no longer sold?',
    a: 'Work down the ladder. Look for the manufacturer\'s successor first, then a current equivalent from the same maker, then a like-kind-and-quality replacement at the same tier. For property that ordinary retail no longer represents at all — collectibles, vintage goods, out-of-production specialty equipment — the resale market is the honest source.',
  },
  {
    q: 'Can eBay be used to price a discontinued item?',
    a: 'For some property it is the only market that represents it. A resale listing needs more scrutiny than a retail one, because condition, completeness and edition vary and all three move the price — but for an out-of-production item, a used-market figure is closer to the truth than a modern product that happens to share a keyword.',
  },
  {
    q: 'Should the cheapest available replacement always be used?',
    a: 'No. The replacement has to match the characteristics that gave the original its value. The cheapest result is frequently the wrong generation, a smaller capacity, an accessory for the product rather than the product, or a lower tier — all of which are reasons a reviewer sends the line back.',
  },
  {
    q: 'What is a successor model?',
    a: 'The product the manufacturer put in the same place in its lineup when the older one was retired — often the next model year with the same screen technology, capacity or tier. It is usually the closest thing to an exact replacement once the original is gone.',
  },
  {
    q: 'What if there is no direct successor?',
    a: 'Move to the closest reasonable equivalent, judged on the characteristics that materially define the original rather than on the name. A premium 65-inch OLED is not replaced by an entry-level 65-inch LED; the screen size is the one thing those two have in common.',
  },
  {
    q: 'How does Kevin handle an item retail cannot price?',
    a: 'When the retail evidence is too thin to support a price, the resale market prices the line instead — used raw, with no grossing-up toward a hypothetical retail figure and no working backwards from a depreciated number. Resale comps are labelled wherever comps are shown, so a used-market price is never mistaken for a new-replacement one. When neither market can answer, the line arrives unpriced for you.',
  },
]

const CRUMBS = [
  { to: '/guides/discontinued-items-insurance-claims', t: 'Discontinued items' },
]

export default function DiscontinuedItemsGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/discontinued-items-insurance-claims"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How Do You Price a Discontinued Item in a Contents Claim?"
          lede="A discontinued item is not unvaluable — it just changes the research. The failure to avoid is substituting an unrelated modern product because it happens to be for sale."
          byline="Kevin Godfrey, Kevin"
          updated="4 October 2026"
        />

        <DirectAnswer
          question="How is a discontinued item priced?"
          answer="By working down a hierarchy: the exact model if it is still obtainable, then the manufacturer's successor, then a same-brand equivalent, then a like-kind-and-quality replacement — and for property ordinary retail no longer represents, the resale market."
        >
          <p>
            Discontinued does not mean gone. Before moving down the ladder it is worth confirming
            the exact product is genuinely unavailable — remaining retailer stock, manufacturer
            outlets, specialty sellers and authorised resellers often carry a model for a long time
            after it leaves the main lineup.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The replacement hierarchy</h2>
          <ComparisonTable
            caption="Standard claims practice, strongest first"
            columns={['Level', 'Use it when', 'What to watch']}
            rows={[
              ['Exact model', 'The same product is still obtainable somewhere', 'Confirm it is the same variant, not a near-name'],
              ['Current successor', 'The maker directly replaced it in the lineup', 'The successor can be a tier up or down'],
              ['Same-brand equivalent', 'No direct successor, but a comparable current product', 'Match specification, not product family'],
              ['Like kind and quality', 'The original maker offers nothing equivalent', 'Hold the tier; this is where downgrades creep in'],
              ['Resale market', 'Ordinary retail does not represent the item', 'Condition and completeness dominate the price'],
            ]}
          />
          <p>
            Which level is correct depends on the item, not on a preference. A current refrigerator
            and a discontinued limited-edition collectible are not research problems of the same
            kind.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Compare specifications, not names</h2>
          <p>
            A newer model is not equivalent because the manufacturer reused the naming convention.
            What matters is the set of characteristics that actually set the price: size, capacity,
            performance, construction, included accessories, technology and product tier.
          </p>
          <EvidenceCallout>
            <p>
              <strong>A premium 65-inch OLED is not replaced by an entry-level 65-inch LED.</strong>{' '}
              The screen size is the single characteristic those two share, and it is not the one
              carrying the value. A substitute should not quietly downgrade the property — and the
              same rule stops it quietly upgrading it, which is equally hard to defend.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>A search result is not a comparable</h2>
          <ComparisonTable
            caption="Listings that look right and are not"
            columns={['Trap', 'Why it is wrong']}
            rows={[
              ['Wrong generation', 'Prices this year’s successor, not the replacement'],
              ['Different capacity', 'Capacity is often most of the price'],
              ['A set instead of one item', 'Inflates the line by the multiple'],
              ['An accessory for the product', 'A mount is not the television'],
              ['Materially different condition', 'Especially on resale, where condition drives the price'],
              ['Incomplete product', 'Missing accessories or packaging change the market'],
              ['Wrong variant or form factor', 'Same family, different product'],
            ]}
          />
          <p>
            Keyword similarity is what search engines optimise for. Insurance comparability is a
            different test, and it has to be applied after the search rather than assumed from it.
          </p>
        </section>

        <section className="k-seosec">
          <h2>When the resale market is the right answer</h2>
          <p>
            Some property cannot honestly be valued through current retail: discontinued
            collectibles, vintage electronics, out-of-production tools, rare media, specialty
            equipment, older designer goods. For these, resale platforms and collectible
            marketplaces are where the item actually trades.
          </p>
          <p>
            Kevin reflects that. Retail prices a line when the retail evidence supports it; when it
            does not, the resale market prices the line instead — used raw, with no grossing-up
            toward a hypothetical retail price and no working backwards from a depreciated figure.
            Resale comps are labelled wherever comps are shown, so nobody reads a used-market price
            as a new-replacement one.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Collectibles ask a different question</h2>
          <p>
            For a collectible the question is usually not “what new product replaces this” but “what
            does this specific item, in this condition, currently trade for”. Edition, release year,
            condition, rarity, completeness and packaging can each move the value more than the
            category does.
          </p>
          <p>
            Fine arts, jewelry, firearms and furs are never auto-priced in Kevin at all. They carry
            coverage limits that turn on judgment and frequently on an appraisal, so they reach you
            unpriced by design rather than carrying a number somebody has to walk back.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Record why the replacement was chosen</h2>
          <p>
            The further down the hierarchy a line sits, the more the reasoning matters. A reviewer
            should be able to see the original item and its specification, that the exact
            replacement was unavailable, what was selected instead, which characteristics match,
            and the listing the price came from. That is a substantially stronger position than a
            generic substitute with a number beside it.
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
              d: 'Which market represents the item, and when asking prices mislead.',
            },
            {
              to: '/guides/replacement-cost-comparable',
              t: 'Finding a defensible comparable',
              d: 'The matching hierarchy, and what never to price from.',
            },
            {
              to: '/guides/automate-replacement-cost-research',
              t: 'Automating replacement-cost research',
              d: 'What a defensible search needs, and the matches worth filtering out.',
            },
            {
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'The ten checks a desk adjuster applies to a schedule.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
