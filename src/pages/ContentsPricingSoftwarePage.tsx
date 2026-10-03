import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import {
  ComparisonTable,
  CtaBand,
  DirectAnswer,
  EvidenceCallout,
  FaqList,
  FeatureGrid,
  RelatedCards,
  SeoPageHead,
  ShotFigure,
  crumbJsonLd,
  faqJsonLd,
  softwareJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /insurance-contents-pricing-software — spec page 2, Tier 1.
 *
 * THIS PAGE IS THE ONE RULE 10 GOVERNS MOST CLOSELY, and the rule was amended
 * on 2026-09-29, so the obvious copy is now wrong in three specific ways:
 *
 *  1. The unit cost is THE PRICE OF A SINGLE LISTING -- the middle one by
 *     price among the comps found -- and the source link points at that exact
 *     listing. It is NOT a median of the set any more. "We take the median"
 *     was true before that deploy and is now a false description of the
 *     method.
 *  2. It governs the UNIT COST, never the line total: rcv_total_incl still
 *     carries quantity and embedded tax.
 *  3. Say "a listing", never "a live listing". Links go stale over months and
 *     the claim is about what the price IS, not about the URL's future.
 *
 * Also load-bearing here:
 *  - No customer-facing surface names the vendor behind the comps (rule 10).
 *    It is the Kevin Content Pricing Engine.
 *  - A resale comp must be VISIBLY LABELLED as resale wherever comps are
 *    shown (rule 11), so the fallback is described as resale, plainly, with no
 *    gross-up and no back-solve.
 *  - Jewelry, Fine Arts, Firearms and Furs are manual-only (rule 11).
 *  - An item Kevin will not price arrives as a blank, editable cell -- not an
 *    error, not a badge, not a guess (rule 12).
 *  - Throttling is not an error: quota_exhausted and budget_exhausted mean the
 *    service is rate-limited or at a daily spend cap and the line re-prices
 *    itself (rule 12b).
 *  - The comps panel is a SAMPLE of the bucket, not the bucket (rule 10,
 *    measured over 755 buckets: 87.4% hold more than the three surfaced), so
 *    this page never says "the three comps we found".
 */

const FAQS: Faq[] = [
  {
    q: 'How does Kevin choose which comparable to price from?',
    a: 'It searches current listings for the item, discards the ones that are not the same thing — wrong variant, wrong capacity, a bundle instead of a single unit, a duplicate of a listing already counted — and prices the line from a single remaining listing: the middle one by price. The source link on the row points at that exact listing, so the number and its evidence are the same object.',
  },
  {
    q: 'Does Kevin price from resale marketplaces?',
    a: 'Only when the retail market is too thin to price from, which happens on vintage, discontinued and collectible property. The resale figure is used raw, with no gross-up, and it is labelled as resale wherever the comp is shown — nobody should read a used-market price as a new-replacement one. Retail is preferred whenever a retail price exists.',
  },
  {
    q: 'What happens to items Kevin cannot price?',
    a: 'The price cell arrives blank and editable, and you type the number. There is no badge, no approval gate and no error state: a blank cell you can fill is more useful than a guess you would have to catch. Jewelry, fine arts, firearms and furs are never auto-priced at all.',
  },
  {
    q: 'Are source links included in the export?',
    a: 'Yes. The listing behind each priced line is stored on the row and prints into both the Excel worksheet and the PDF. A line you priced by hand carries your own proof URL instead.',
  },
  {
    q: 'Can I change a price or pick a different comparable?',
    a: 'Yes. Every cell is editable, and the RCV popover shows alternates with their dated proof links. Entering your own number tags the line as manual and exposes a field for the proof URL you relied on.',
  },
  {
    q: 'What if pricing is slow or paused?',
    a: 'Then the line waits rather than failing. An hourly rate limit or a daily spend cap shows as a quiet pricing state, not an error, and the line re-prices itself once the limit rolls over. Nothing is lost and nothing needs re-uploading.',
  },
]

const CRUMBS = [{ to: '/insurance-contents-pricing-software', t: 'Insurance contents pricing software' }]

export default function ContentsPricingSoftwarePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/insurance-contents-pricing-software"
        jsonLd={[softwareJsonLd, faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Insurance Contents Pricing Software Built for Real Claims"
          lede="Price personal property from an actual replacement listing, keep the source on the line, classify the item, and let the schedule handle depreciation — without searching every line by hand."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <div className="k-seocta-top">
          <a className="k-btn k-btn--lg" href="/sign-up">
            Start for Free
          </a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="/product">
            See how it works
          </a>
          <span className="k-seocta-note">250 line items free · no deadline</span>
        </div>

        <DirectAnswer
          question="How does automated contents pricing actually work?"
          answer="Kevin searches current listings for each identified item, filters out the ones that are not the same product, prices the line from a single listing, and keeps that listing's link on the row as the evidence."
        >
          <p>
            The price on a line is the price of one real listing — the middle one by price among the
            comparables found for that item — not an average and not a figure assembled from
            several. That matters when a number is questioned: the link on the row opens the exact
            listing the unit cost came from. Quantity and sales tax are applied on top to produce
            the line total, and depreciation comes after that, from the item's class and age.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Pricing is where contents work slows down</h2>
          <p>
            Done by hand, every line is the same seven steps: write a description, search it, open
            several retailers, compare what is actually the same product, choose one, copy the URL,
            then look up the depreciation for the category and the age. Four hundred lines is four
            hundred rounds of that. The judgment in it is real but thin; the typing is enormous.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What the pricing engine does per item</h2>
          <p>
            One query per item against the Kevin Content Pricing Engine, which spans major
            retailers, specialty stores, brand-direct storefronts and marketplaces. There is no
            roster of individual stores to maintain and no per-retailer integration to break.
          </p>
          <FeatureGrid
            cols={3}
            items={[
              {
                t: 'Build the query',
                d: 'From the identified item — brand, product type, model — rather than from the whole description. Condition and damage wording is kept out of the search; it belongs on the line, not in the query.',
              },
              {
                t: 'Reject what is not the item',
                d: 'Wrong variant, wrong capacity or size, a bundle priced as a single unit, an accessory for the product rather than the product.',
              },
              {
                t: 'Collapse duplicates',
                d: 'The same listing surfaced twice counts once, so a popular product does not drag the set toward one seller.',
              },
              {
                t: 'Discard outliers',
                d: 'A mispriced listing in either direction is removed rather than averaged in, which is what makes a single-listing price defensible.',
              },
              {
                t: 'Price from one listing',
                d: 'The middle one by price among what survives. The unit cost equals a real listing, and the row links to it.',
              },
              {
                t: 'Fall through to resale',
                d: 'Only when retail cannot price the item. The resale figure is used raw, with no gross-up, and labelled as resale.',
              },
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Retail first, resale only when retail cannot answer</h2>
          <p>
            Most household property is still sold new, so retail prices it. Vintage, discontinued
            and collectible items often are not, and for those the resale market is the only honest
            source of a replacement figure. Kevin uses it raw — there is no back-solve, no
            grossing-up toward a hypothetical retail price — and marks it as resale wherever the
            comp appears, because a used-market price read as a new-replacement price is a
            defensibility problem waiting to happen.
          </p>
          <EvidenceCallout>
            <p>
              Jewelry, fine arts, firearms and furs are never auto-priced. Those classes reach an
              adjuster with the price cell blank, whatever the market looks like.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>What makes a comparable valid</h2>
          <ComparisonTable
            caption="What is and is not the same product"
            columns={['Test', 'Valid', 'Not valid']}
            rows={[
              ['Identity', 'Same product, or its current successor', 'A different model that shares a name'],
              ['Variant', 'Same capacity, size, finish where those change the price', 'The 256GB listing for a 128GB item'],
              ['Quantity', 'A single unit, priced singly', 'A six-pack priced as one line'],
              ['Form', 'Same form factor and function', 'A wall mount standing in for the television'],
              ['Price', 'The listing price as shown', 'A price assembled from several listings'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>The source stays on the line</h2>
          <ShotFigure
            src="/marketing/worksheet-review-2x.webp"
            alt="Kevin's worksheet with unit cost, extended cost, sales tax, RCV plus tax, age, depreciation percentage, depreciation amount and actual cash value for each contents line"
            label="kevin.co/claims/…/worksheet"
            caption="Unit cost, tax, age, depreciation and ACV on one row — and the listing behind the unit cost one click away."
          />
          <p className="k-seonote">
            The panel shows a sample of the comparables found for a line, not the whole set.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Depreciation comes after pricing</h2>
          <p>
            Replacement cost first, then the schedule: the item's content class gives its useful
            life, the age you enter gives the percentage, and the server computes the dollar amount
            and the actual cash value. The schedule carries 31 categories and 87 sub-lines, and
            depreciation runs all the way to 100% — an item past its useful life shows an ACV of
            $0.00 rather than stopping at an invented floor. The page never computes any of this;
            it renders what the server returns, so the worksheet and the export cannot disagree.
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
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'Contents inventory software for public adjusters',
              d: 'The whole workflow, from a folder of photographs to a carrier-ready worksheet.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'Priced lines with depreciation, totals and the source link on each row.',
            },
            {
              to: '/product',
              t: 'How Kevin works, screen by screen',
              d: 'Intake, staging, processing, the worksheet and the export.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: '2,000 line items a month included, then $0.20 an item. First 250 free.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
