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
 * /guides/source-pricing-insurance-contents — batch 4, spec page 29.
 *
 * TWO THINGS CUT FROM THE BRIEF:
 *
 *  1. "Future Direction: Kevin.co as a Pricing Source" -- a roadmap section
 *     describing a normalised pricing record we have not built. Marketing a
 *     thing that does not exist is the same mistake as a "coming soon" label,
 *     and the owner's standing rule is to make it work, remove it, or ask.
 *     Removed.
 *  2. The brief suggests a source should be treated as "substantiation of the
 *     price at the time it is being used". True and worth saying -- but it sits
 *     next to rule 10's constraint on wording: say "a listing", never "a live
 *     listing", because links go stale over months and the claim is about what
 *     the price IS, not the URL's future. The page says both carefully.
 *
 * Kevin's own behaviour is stated only as: the price comes from one listing
 * rather than a blend, the link is stored on the row and printed in the export,
 * and a hand-entered price carries the adjuster's own source instead.
 */

const FAQS: Faq[] = [
  {
    q: 'Is a source required for every item?',
    a: 'Requirements vary by carrier and by claim, so there is no universal rule. What is consistent is that a price with its listing attached is far easier to evaluate — and that the question "where did this come from" is the one that arrives most often, usually months later.',
  },
  {
    q: 'Is a screenshot better than a link?',
    a: 'They do different jobs. A screenshot preserves what was visible on a date; a link shows what the product costs now. For a claim that may run for months, having the link means the line can be re-priced rather than re-researched — which is why Kevin stores the link and the figure together.',
  },
  {
    q: 'Should the source always be a major retailer?',
    a: 'No. The source should fit the item: a major retailer for current consumer property, a manufacturer for a successor model or a specification, a specialist for niche equipment, and the resale market for discontinued, vintage or collectible property that ordinary retail no longer represents.',
  },
  {
    q: 'Can a source price change during the claim?',
    a: 'Yes, and that is normal rather than a problem. Replacement cost is what the item costs to replace now, so a product that goes on sale or increases in price moves the figure. A source documents the price it supported when it was used; it is not a permanent fact.',
  },
  {
    q: 'What makes a source weak even when the link works?',
    a: 'The product behind it. Wrong model, wrong size or capacity, a set where one item is claimed, a used listing where a new replacement is being priced, or a third-party seller whose price is not representative. The URL is the least important part of a source.',
  },
  {
    q: 'Does Kevin keep the source?',
    a: 'Yes. Each engine-priced line is priced from a single listing rather than a blend of several, and that listing is stored on the row and printed into the export. A price you type in yourself carries your own source link instead.',
  },
]

const CRUMBS = [{ to: '/guides/source-pricing-insurance-contents', t: 'Source pricing' }]

export default function SourcePricingGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/source-pricing-insurance-contents"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Document Source Pricing"
          lede="A price without its listing is an assertion. A price with the listing attached is evidence — but only if the product behind the link is actually the thing being replaced."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="What makes a replacement-cost source defensible?"
          answer="That it leads to the specific product used for the price, at the right quantity, from a seller appropriate to the item — and that the relationship between that product and the damaged one is visible on the line."
        >
          <p>
            The failure this prevents is not a missing URL. It is a URL that opens on something
            other than what the line describes, which is worse than no source at all: it gives a
            reviewer a reason to check the next one.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What a source has to establish</h2>
          <ComparisonTable
            caption="A link is the delivery mechanism, not the evidence"
            columns={['Element', 'Why it matters']}
            rows={[
              ['The specific product', 'A direct product page, not a search result or a category'],
              ['Manufacturer and model', 'So the comparable can be checked against the item'],
              ['Variant', 'Size, capacity, generation and finish, where they move the price'],
              ['Quantity basis', 'One chair or a set of four; one battery or a two-pack'],
              ['Seller', 'Whether it is the retailer or a third-party marketplace listing'],
              ['Price', 'The figure the line actually used'],
              ['Relationship to the item', 'Exact, successor, same-brand or like-kind — and why'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Match the source to the property</h2>
          <ComparisonTable
            caption="Different sources answer different questions"
            columns={['Source', 'Good for', 'Watch for']}
            rows={[
              ['Major retailer', 'Current consumer property still sold new', 'Third-party sellers on the same domain'],
              ['Manufacturer', 'Successor models and specifications', 'List price that nobody actually charges'],
              ['Specialist retailer', 'Niche or professional equipment', 'Thin availability'],
              ['Resale marketplace', 'Discontinued, vintage and collectible property', 'Condition, completeness and edition'],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>A listing on a major retailer&rsquo;s domain is not automatically a retail
              price.</strong> Large sites carry third-party marketplace sellers whose pricing can be
              well above or below ordinary retail, and the badge saying so is easy to miss. Check
              who is actually selling it.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Quantity is the quiet error</h2>
          <p>
            A source price has to represent the same quantity the line claims. One chair against a
            set of four, one drill against a five-piece kit, one plate against a twelve-piece
            service, one battery against a two-pack &mdash; each inflates or deflates the line by a
            clean multiple, which makes it both easy to spot in review and easy to miss while
            building.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Prices move, and that is fine</h2>
          <p>
            Replacement cost is what the item costs to replace <em>now</em>, so a product that goes
            on sale, sells out or is superseded changes the figure. A source documents the price it
            supported at the time it was used; treating it as a permanent historical fact is how a
            schedule ends up defending a number nobody can reproduce.
          </p>
          <p>
            On a claim that runs for months the practical consequence is that lines sometimes need
            re-pricing &mdash; which is quick when the listing is on the row and slow when it is
            not.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Discontinued and collectible property</h2>
          <p>
            When the exact item is gone, the source has a second job: making the replacement path
            visible. A successor model from the manufacturer, or a comparable from the resale market
            where retail no longer represents the item, should be identifiable as that from the line
            rather than looking like an arbitrary substitution.
          </p>
          <p>
            For a collectible, a single asking price is rarely the whole picture &mdash; edition,
            condition, packaging and completeness all move the value, and the comparable has to
            match on those before its price means anything.
          </p>
        </section>

        <section className="k-seosec">
          <h2>How Kevin keeps it</h2>
          <p>
            Each engine-priced line is priced from a single listing rather than a blend of several,
            and that listing is stored on the row and printed into the export &mdash; so the chain
            runs from the damaged item to the identified property to the replacement, its source and
            the price, and then to RCV and ACV. A price you enter by hand carries your own source
            link instead, attached the same way.
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
              to: '/guides/replacement-cost-comparable',
              t: 'Finding a defensible comparable',
              d: 'What makes the product behind the link the right one.',
            },
            {
              to: '/guides/retail-vs-secondary-market-contents',
              t: 'Retail vs the resale market',
              d: 'Which market represents the item, and why asking prices mislead.',
            },
            {
              to: '/guides/contents-line-items-rejected',
              t: 'Why line items get questioned',
              d: 'Including the ones that had a source and still came back.',
            },
            {
              to: '/guides/contents-claim-qa-checklist',
              t: 'Contents claim QA checklist',
              d: 'Open a sample of your links before the schedule leaves.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
