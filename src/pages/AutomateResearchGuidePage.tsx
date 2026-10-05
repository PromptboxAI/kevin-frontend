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
 * /guides/automate-replacement-cost-research — spec page 7, Tier 2.
 *
 * The brief's own framing is the right one and it matches the product: search
 * can be automated, IDENTITY cannot be delegated. Two things here are real
 * engineering history rather than positioning, and they are the most useful
 * part of the page:
 *
 * TRIMMED 2026-10-03, owner's call: this page originally carried the measured
 * experiment behind both points -- the exact failing query, the exact listing
 * counts, and the date we fixed the damage-wording bug. Those are a working
 * recipe for a competitor and taught them something we paid to learn. The
 * PRINCIPLES stay, because a buyer needs them to judge whether we know what we
 * are doing; the measurements and the fix history are gone. Keep it that way:
 * state what must be true of a good search, never our tuning.
 *
 * Rule 10 as amended: the unit cost is one listing's price, the middle by
 * price among the comparables; the panel shows a sample of the bucket, not the
 * bucket. Never "a live listing".
 */

const FAQS: Faq[] = [
  {
    q: 'What should be automated, and what should not?',
    a: 'Automate the search, the filtering and the ranking. Do not automate identity: deciding what the item actually is remains the gate everything else passes through, because a perfect search for the wrong product returns a confident, wrong price.',
  },
  {
    q: 'Why does a long, detailed description make a worse search?',
    a: 'Because every extra word is a filter. A description should be specific — it is what the adjuster and the carrier read — while the terms used to search need to be short enough that the product is still findable. They are not the same string, and treating them as one is a common way to end up with no results at all.',
  },
  {
    q: 'Does damage language affect the price?',
    a: 'It should not. Condition and damage wording belongs in the description of the item, not in the terms used to find a replacement — every photograph on a contents claim is of damaged property, and the replacement being priced is not damaged. Kevin keeps those two separate.',
  },
  {
    q: 'How is one comparable chosen out of many?',
    a: 'Listings that are not the same product are discarded, duplicates collapse, and outliers are dropped. The line is then priced from a single remaining listing — and that listing is linked on the row. The price is therefore a real number somebody is charging, not an average of several.',
  },
  {
    q: 'Does the panel show every comparable found?',
    a: 'No. It shows a sample. Most items have more comparables behind them than the few surfaced, so the panel is a window into the set rather than the whole set.',
  },
  {
    q: 'What happens when search cannot answer?',
    a: 'The line comes back with a blank, editable price rather than a guess. If the retail market is too thin, the resale market is used instead — raw, with no gross-up, and labelled as resale so nobody reads a used price as a new-replacement one.',
  },
]

const CRUMBS = [
  { to: '/guides/automate-replacement-cost-research', t: 'Automate replacement-cost research' },
]

export default function AutomateResearchGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/automate-replacement-cost-research"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Automate Replacement Cost Research Without Sacrificing Accuracy"
          lede="Automation should search, filter and rank comparable listings. Deciding what the item is stays the gatekeeper — a flawless search for the wrong product returns a confident, wrong price."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="Can replacement-cost research be automated safely?"
          answer="The search can: finding candidate listings, discarding the ones that are not the same product, and pricing from one that is. The identification underneath it cannot be delegated, which is why ambiguous items come back unpriced instead of guessed."
        >
          <p>
            The failure mode to design against is not a missing price. It is a plausible price for
            the wrong item, because that one survives review — the number looks reasonable, so
            nobody checks the listing behind it. Everything below exists to make that failure loud
            instead of quiet.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What a defensible search needs</h2>
          <ul className="k-seolist">
            <li><strong>Brand</strong> — the single most discriminating term available.</li>
            <li><strong>Product type</strong> — what the thing is, in the words a retailer uses.</li>
            <li><strong>Model or collection</strong> — where a plate, a badge or a barcode gives it.</li>
            <li><strong>Variant</strong> — capacity, size or finish, but only where it changes the price.</li>
            <li><strong>Quantity</strong> — so a six-pack is not priced as a single unit, or the reverse.</li>
            <li><strong>Current availability</strong> — a product still sold prices from retail; one that is not falls to resale.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>The description and the query are not the same string</h2>
          <p>
            This is the mistake that costs the most prices. A description should be as specific as
            the evidence allows, because an adjuster and a carrier read it. A query should be as
            short as will still identify the product, because every additional word excludes
            listings.
          </p>
          <EvidenceCallout>
            <p>
              <strong>Damage language must not drive the search.</strong> On a contents claim every
              photograph is of damaged property, and the replacement being priced is not damaged.
              Condition belongs in the description of the item; searching on it looks for a broken
              one.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>The bad matches worth filtering</h2>
          <ComparisonTable
            caption="Listings that look like the item and are not"
            columns={['Trap', 'What it looks like', 'Why it is wrong']}
            rows={[
              ['Bundle for single', 'A four-pack at a four-pack price', 'Inflates one line by the multiple'],
              ['Wrong capacity', 'The 1TB listing for a 256GB item', 'Capacity often drives most of the price'],
              ['Wrong generation', 'This year’s model for a six-year-old item', 'Prices the successor, not the replacement'],
              ['Wrong form', 'A wall mount instead of the television', 'An accessory for the product is not the product'],
              ['Duplicate listing', 'The same offer surfaced twice', 'Lets one seller dominate the set'],
              ['Accessory bundle', 'Camera plus lens plus bag', 'Values property the insured did not own'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Retail first, resale when retail cannot answer</h2>
          <p>
            Most household property is still sold new, and retail prices it. Vintage, discontinued
            and collectible items frequently are not, and for those the resale market is the only
            honest source of a replacement figure. Kevin uses it raw — no grossing-up toward a
            hypothetical retail price, no working backwards from a depreciated figure — and marks it
            as resale wherever the comparable is shown.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Why the source link is the point</h2>
          <p>
            A price without its listing is an assertion. A price with the listing attached is
            evidence, and it costs nothing extra to keep if the software keeps it automatically.
            That is the difference between a file that survives a desk review and one that becomes
            a negotiation about where a number came from.
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
              t: 'What makes a defensible comparable',
              d: 'The matching hierarchy, and what never to price from.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'Query, filtering, one listing per line, and where resale comes in.',
            },
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'How a photograph becomes a line, identification before pricing.',
            },
            {
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'What a room photograph can and cannot establish.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
