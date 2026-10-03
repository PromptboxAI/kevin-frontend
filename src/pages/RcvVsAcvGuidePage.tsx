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
 * /guides/rcv-vs-acv-personal-property — spec page 10 in the brief, Tier 3.
 *
 * The worked example in the brief ($1,000 replacement, $300 depreciation,
 * $700 ACV) is kept because it is the clearest possible illustration -- but
 * the page then shows how a line ACTUALLY foots in Kevin, which is not that
 * simple: tax is per line and depreciation applies to the TAX-INCLUSIVE
 * replacement cost, so tax ends up inside the ACV figure rather than added
 * after it. Publishing only the clean example would teach the wrong mental
 * model to anyone reconciling a real worksheet.
 *
 * Recoverable depreciation gets the policy caveat it needs. Kevin computes a
 * schedule; what a policy pays is a coverage question.
 */

const FAQS: Faq[] = [
  {
    q: 'What is the difference between RCV and ACV?',
    a: 'Replacement cost value is what it costs to buy the item again today. Actual cash value is that figure less applicable depreciation for the item’s age and class. RCV is a market fact; ACV is RCV after arithmetic the policy defines.',
  },
  {
    q: 'Which one does a claim pay?',
    a: 'That depends on the policy. Many contents policies pay ACV first and release the remaining depreciation once the property is actually replaced — recoverable depreciation. Others settle at ACV only. The policy and the jurisdiction decide, not the inventory software.',
  },
  {
    q: 'Where does sales tax sit?',
    a: 'Per line, and inside the figures. Kevin applies tax to the extended cost of each line, which produces RCV plus tax, and depreciation is then applied to that tax-inclusive number. So ACV already has tax inside it rather than tax being added afterwards.',
  },
  {
    q: 'Why does the replacement price need a source?',
    a: 'Because every number downstream is derived from it. If the replacement cost is unsupported, the depreciation and the ACV built on top of it are unsupported too — the arithmetic is only as defensible as its first input.',
  },
  {
    q: 'Can ACV be zero?',
    a: 'Yes. Property past the useful life for its class depreciates fully, and the line shows $0.00. There is no salvage floor in Kevin’s schedule — 86 of its 87 lines carry no cap at all.',
  },
  {
    q: 'Does Kevin decide what my claim is worth?',
    a: 'No. It produces a priced, classified, depreciated schedule with the evidence attached, and an adjuster reviews and edits every line. Coverage determinations are not a software output.',
  },
]

const CRUMBS = [{ to: '/guides/rcv-vs-acv-personal-property', t: 'RCV vs ACV' }]

export default function RcvVsAcvGuidePage() {
  return (
    <div className="k-landing">
      <Seo path="/guides/rcv-vs-acv-personal-property" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="RCV vs ACV: What They Mean on a Contents Claim"
          lede="Replacement cost value is what the item costs to buy today. Actual cash value is that figure less depreciation for its age and class — subject to the policy and the jurisdiction."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="What is the difference between RCV and ACV on personal property?"
          answer="RCV is the current cost to replace the item; ACV is RCV minus the depreciation that applies to its age and class."
        >
          <p>
            The distinction matters because the two numbers answer different questions. RCV asks
            what the market charges for this item now. ACV asks what the item was worth in the state
            it was in on the day of the loss. One is research; the other is arithmetic performed on
            the research.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The simplest possible example</h2>
          <ComparisonTable
            caption="One item, no tax, round numbers"
            columns={['Figure', 'Amount', 'Where it comes from']}
            rows={[
              ['Replacement cost (RCV)', '$1,000', 'What the item costs to buy today'],
              ['Depreciation', '$300', 'Age against the useful life for its class — 30% here'],
              ['Actual cash value (ACV)', '$700', 'RCV less depreciation'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>How a real line foots</h2>
          <p>
            A worksheet line carries quantity and tax, and the order they apply in changes the
            answer. Kevin applies tax per line and depreciates the tax-inclusive figure:
          </p>
          <ComparisonTable
            caption="The money chain, left to right"
            columns={['Step', 'Calculation']}
            rows={[
              ['Extended cost', 'Unit cost × quantity'],
              ['Sales tax', 'Extended cost × the rate for the loss address'],
              ['RCV + tax', 'Extended cost + sales tax'],
              ['$ Depr.', '(RCV + tax) × depreciation percentage'],
              ['ACV', '(RCV + tax) − $ Depr.'],
            ]}
          />
          <EvidenceCallout>
            <p>
              Because depreciation is applied <strong>after</strong> tax, the tax is inside the ACV
              figure rather than added on top of it. Anyone reconciling a worksheet by adding tax to
              ACV will be off by the tax on the depreciated portion.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Why the price needs a source</h2>
          <p>
            Depreciation is a percentage of the replacement cost, so an unsupported RCV produces an
            unsupported ACV. Every priced line in Kevin keeps the listing behind its unit cost, and
            the figure is the price of one real listing rather than a blend — which means a
            questioned ACV can be traced back through the arithmetic to a URL.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Why age and class decide the gap</h2>
          <p>
            The same $1,000 of replacement cost depreciates very differently depending on where the
            item sits in the schedule. A three-year-old item in a 20-year furniture class has lost
            15% of its life; the same age in a three-year clothing class has lost all of it. Kevin's
            schedule carries 31 categories and 87 sub-lines for exactly this reason, and
            depreciation runs to 100% rather than stopping at an invented floor.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Recoverable depreciation</h2>
          <p>
            Many policies pay ACV at settlement and release the withheld depreciation once the
            insured actually replaces the property and documents it. That is a policy term, not a
            universal rule: some policies and some jurisdictions treat it differently, and the
            withheld amount may be time-limited. Read the policy; the schedule tells you the
            arithmetic, not the entitlement.
          </p>
          <p className="k-seonote">
            Kevin produces a defensible valuation schedule and the evidence under it. It does not
            make coverage determinations, and nothing here is a statement about what a particular
            policy pays.
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
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'Useful life by class, real schedule lines, and why it runs to 100%.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'Where the replacement cost comes from in the first place.',
            },
            {
              to: '/guides/replacement-cost-comparable',
              t: 'What makes a defensible comparable',
              d: 'The matching hierarchy behind a supportable RCV.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'Real lines with tax, depreciation and ACV footed across.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
