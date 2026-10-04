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
 * /guides/retail-vs-secondary-market-contents — batch 2, spec page 20.
 *
 * ONE FACT GOVERNS THIS PAGE, and it is the reason it was worth checking
 * before writing a word: KEVIN HAS NO COMPLETED-SALES DATA. Every comp,
 * retail and resale alike, is a current offer (kevin-backend/FRONTEND.md: the
 * aggregator is a shopping-offers feed; a resale merchant such as a used or
 * consignment platform is simply kind: "resale"). So a resale comp in Kevin is
 * an ASKING PRICE on a live offer, not a record of what something sold for.
 *
 * The brief's "Completed Sales vs Active Listings" section is sound as
 * industry practice and is kept -- but the page says plainly which side Kevin
 * is on, because a reader would otherwise assume the better-sounding one.
 * Rule 8b forbids exactly this in the estate FMV doc: never a sold price and
 * never an auction result, because what we hold is an asking price and calling
 * it anything else is false provenance.
 *
 * Marketplaces are named as MARKETS AN ADJUSTER WORKS IN. Rule 10 bans naming
 * our pricing vendor and the scrapped per-store list; it does not ban saying
 * eBay exists. The page never presents a marketplace as a source we configure.
 */

const FAQS: Faq[] = [
  {
    q: 'Should insurance contents always be priced from major retailers?',
    a: 'No. Retail is the right starting point for ordinary property that is still sold new, which is most of a household. It stops being the right answer for discontinued, collectible and vintage items, where current retail does not represent the item being replaced.',
  },
  {
    q: 'Can eBay be used for an insurance claim?',
    a: 'For property that ordinary retail no longer represents, a resale marketplace is often the only honest source of a replacement figure. It needs more review than a retail listing, because condition, completeness and edition vary between offers in a way they do not at a retailer.',
  },
  {
    q: 'Is the highest listing price the correct value?',
    a: 'No. A price should be tied to an appropriate comparable, not chosen because it is favourable. The high end of a resale spread is frequently a different edition, a sealed example, or a seller who is not expecting to transact.',
  },
  {
    q: 'Are active listings and completed sales the same thing?',
    a: 'No. An active listing tells you what someone is asking; a completed sale tells you what someone paid. For thin or volatile resale markets the second is often the better evidence of market behaviour, which is a real distinction worth understanding when you are researching an item by hand.',
  },
  {
    q: 'Does Kevin price from completed sales?',
    a: 'No. Every comp Kevin surfaces is a current offer — on the retail side and on the resale side — so the figures are asking prices on listings that exist now, never records of past transactions. We say so rather than implying otherwise, because an asking price presented as a sold price is a provenance claim we cannot support.',
  },
  {
    q: 'Does Kevin use both retail and resale sources?',
    a: 'Yes. Retail prices a line when the retail evidence supports it; when it does not, the resale market prices the line instead, raw and without any grossing-up. Resale comps are labelled wherever comps are shown, so a used-market price is never read as a new-replacement one.',
  },
]

const CRUMBS = [
  { to: '/guides/retail-vs-secondary-market-contents', t: 'Retail vs resale pricing' },
]

export default function RetailVsResaleGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/retail-vs-secondary-market-contents"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Retail or Resale: Which Market Should Price a Contents Claim?"
          lede="Most household property is still sold new, and retail answers it. Discontinued, vintage and collectible property is not — and forcing it through a retail search produces a confident number about the wrong item."
          byline="Kevin Godfrey, Kevin"
          updated="4 October 2026"
        />

        <DirectAnswer
          question="Should contents be priced from retail or from the resale market?"
          answer="Retail, wherever the item is still sold new — it is standardised, current and easy to compare. Resale, where ordinary retail no longer represents the property. The source should follow the item rather than a house rule."
        >
          <p>
            The two markets answer different questions. A retailer tells you what a new equivalent
            costs today. A resale marketplace tells you what a discontinued, used or collectible
            item currently trades for. Neither is a substitute for the other, and the mistake is
            choosing one for the whole inventory.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Which market fits which item</h2>
          <ComparisonTable
            caption="The property decides, not the policy"
            columns={['', 'Retail', 'Resale']}
            rows={[
              ['Fits', 'Still manufactured and currently sold', 'Discontinued, vintage, collectible, out of production'],
              ['Typical property', 'Televisions, appliances, furniture, clothing, tools', 'Rare media, older specialty gear, collectibles, designer goods'],
              ['Condition', 'Standardised and new', 'Varies by offer, and drives the price'],
              ['Comparability', 'Model numbers and specifications published', 'Edition, completeness and condition must be read'],
              ['Review needed', 'Lower — check variant, quantity and generation', 'Higher — condition and completeness decide the figure'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Asking prices are not values</h2>
          <p>
            A listing price is what one seller wants. On a resale platform the spread between offers
            for nominally the same item can be enormous, and the reasons are usually visible if you
            look: a different edition, a sealed example against a used one, missing accessories, an
            untested unit, a seller who is not really expecting to transact.
          </p>
          <EvidenceCallout>
            <p>
              <strong>Identity first, price second.</strong> On the resale market the identity check
              is harder and matters more — complete or incomplete, boxed or unboxed, tested or
              untested, restored or original. Two listings with the same title can be different
              property.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Completed sales and active listings</h2>
          <p>
            These are genuinely different evidence. An active listing shows what is being asked. A
            completed sale shows what was paid. In thin or volatile collectible markets, completed
            sales are often the better indication of how the market actually behaves, and an
            adjuster researching a single unusual item by hand is right to look at them.
          </p>
          <p>
            <strong>Kevin prices from active listings.</strong> Every comp it surfaces — retail and
            resale alike — is a current offer, so the figures are asking prices on listings that
            exist now, not records of past transactions. We state that rather than leaving it to be
            assumed: an asking price described as a sold price is a provenance claim, and it is one
            we could not support if a reviewer asked.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Retail is not automatically clean either</h2>
          <ComparisonTable
            caption="Retail traps, which are quieter than resale traps"
            columns={['Problem', 'What it does to the line']}
            rows={[
              ['Bundle listings', 'Prices several items as one'],
              ['Promotional pricing', 'A temporary figure presented as the replacement cost'],
              ['Wrong generation', 'Prices the successor rather than the replacement'],
              ['Wrong size or variant', 'Capacity and size often carry most of the price'],
              ['Third-party sellers on a retail platform', 'Marketplace pricing wearing a retailer’s name'],
              ['Out of stock', 'A price nobody can currently transact at'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Three items, three answers</h2>
          <ComparisonTable
            caption="Why one sourcing rule cannot cover an inventory"
            columns={['Item', 'Right market', 'Because']}
            rows={[
              ['Current Samsung television, model known', 'Retail', 'The same model is on sale now; no reason to look at used'],
              ['Discontinued limited-edition collectible', 'Resale', 'No retail replacement exists; edition and condition set the value'],
              ['Older power tool', 'Either', 'Depends on whether a current successor is a fair replacement'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>How Kevin splits it</h2>
          <p>
            Retail prices a line when the retail evidence supports it. When it does not, the resale
            market prices the line instead — used raw, with no grossing-up toward a hypothetical
            retail price and no working backwards from a depreciated figure. Resale comps are
            labelled wherever comps are shown, so a used-market price is never mistaken for a
            new-replacement one, and the listing behind the price stays on the row.
          </p>
          <p>
            When neither market can answer, the line arrives unpriced with an editable field rather
            than a guess. That is the honest outcome for an item nobody is currently offering, and
            it is where your judgment is worth more than another search.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The question to start from</h2>
          <p>
            Not “use retail for everything” or “use the resale market for everything”, but: what is
            this item, and which market represents a reasonable replacement for it? Whichever the
            answer, the comparable still has to be the same property — a URL does not make a price
            defensible.
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
              to: '/guides/discontinued-items-insurance-claims',
              t: 'Pricing a discontinued item',
              d: 'Successor models, like-kind replacements and where resale starts.',
            },
            {
              to: '/guides/replacement-cost-comparable',
              t: 'Finding a defensible comparable',
              d: 'The matching hierarchy, and what never to price from.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'What makes a comparable valid, and when resale is used.',
            },
            {
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'Including why a source link alone is not enough.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
