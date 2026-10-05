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
 * /guides/insurance-contents-depreciation — spec page 9, Tier 2.
 *
 * EVERY NUMBER ON THIS PAGE IS READ FROM THE LIVE SCHEDULE, not from the
 * brief and not from CLAUDE.md: GET /v1/depreciation-rules on 2026-10-03
 * returns 31 schedule categories and 87 sub-lines, with exactly one line
 * capped (Music, Movies & Media > DVDs, at 50%). The brief says 85 sub-lines
 * and rule 13 says 85; the schedule has grown since both were written.
 *
 * Reading it also corrected something I had published an hour earlier on
 * /methodology: that jewelry, fine arts, firearms and furs "carry no automatic
 * depreciation at all". That is true of PRICING (rule 11 keeps those classes
 * manual-only) but NOT of the depreciation schedule, which carries Costume
 * Jewelry at 10 years, Watches at 20 and All Firearms at 20 as ordinary
 * age-based lines. Only Furs and "All Other Jewelry" have no useful life.
 * /methodology is corrected in the same commit.
 *
 * Rule 13 as amended 2026-09-11: depreciation RUNS TO 100% and a fully-aged
 * line is worth $0.00. Never clamp it, never imply a salvage floor. Rule 17:
 * the valuation disclaimer lives in the Terms, so a caveat here is a caveat,
 * not a disclaimer stamped on an export.
 */

const FAQS: Faq[] = [
  {
    q: 'How is depreciation calculated on a contents claim?',
    a: 'Straight-line by default: the percentage is the item’s age divided by the useful life for its class. A 5-year-old item in a 10-year class depreciates 50%. Kevin applies that to the tax-inclusive replacement cost of the line and subtracts it to give actual cash value.',
  },
  {
    q: 'Can depreciation reach 100%?',
    a: 'Yes. Property past its useful life depreciates fully and shows an actual cash value of $0.00. There is no salvage floor in the schedule — 86 of the 87 lines carry no cap at all, and the one that does caps at 50%. A figure clamped at 90% to look reasonable would be a figure nobody could reconcile.',
  },
  {
    q: 'Does age mean how old the model is?',
    a: 'No — how long the insured owned it. A television bought second-hand two years ago is two years old for this purpose, whatever year the model was released. That is the number the schedule expects.',
  },
  {
    q: 'Why does the category matter so much?',
    a: 'Because useful life is a property of the category, and the categories differ enormously: underwear and nightwear run 3 years, non-athletic footwear 5, most other clothing 8, upholstered furniture 10, a refrigerator 14, and most other furniture 20. The same age produces wildly different depreciation depending on which line the item sits on.',
  },
  {
    q: 'Are any classes excluded from automatic depreciation?',
    a: 'Furs and jewelry other than costume pieces and watches have no useful life in the schedule — they are appraisal-based. Costume jewelry (10 years), watches (20) and firearms (20) are ordinary age-based lines, though firearms are flagged for appraisal. Separately, jewelry, fine arts, firearms and furs are never automatically priced.',
  },
  {
    q: 'Is this the final word on what a claim pays?',
    a: 'No. Depreciation is subject to the policy and the jurisdiction, and recoverable depreciation may be payable once the property is replaced. Kevin computes a schedule; it does not make a coverage determination.',
  },
]

const CRUMBS = [{ to: '/guides/insurance-contents-depreciation', t: 'How contents depreciation works' }]

export default function DepreciationGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/insurance-contents-depreciation"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How Depreciation Works on Insurance Contents Claims"
          lede="Depreciation reduces replacement cost to reflect age against the expected useful life of the item's class — subject to the policy and the jurisdiction."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="How does depreciation work on a contents claim?"
          answer="The item's class gives it a useful life, the age gives a percentage of that life used up, and that percentage comes off the replacement cost to produce actual cash value."
        >
          <p>
            The arithmetic is simple and the inputs are where the work is: which class an item
            belongs to, and how long the insured owned it. Get those two right and the rest is
            division. Get the class wrong and a five-year-old sofa depreciates like a five-year-old
            pair of shoes.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>RCV and ACV, on one line</h2>
          <ComparisonTable
            caption="How a line foots, left to right"
            columns={['Column', 'What it is']}
            rows={[
              ['Unit cost', 'The replacement price of one unit, from a single listing'],
              ['Ext. cost', 'Unit cost × quantity'],
              ['Sales tax', 'Applied per line, from the loss address, not only as a claim total'],
              ['RCV + tax', 'Ext. cost plus that tax — the replacement cost value of the line'],
              ['Age', 'Years the insured owned it, printed as a bare number'],
              ['% Depr.', 'Age ÷ useful life for the class, to a maximum of 100%'],
              ['$ Depr.', 'The percentage applied to RCV + tax'],
              ['ACV', 'RCV + tax − $ Depr.'],
            ]}
          />
          <p className="k-seonote">
            Depreciation applies to the tax-inclusive replacement cost, so tax is inside the ACV
            figure rather than added after it.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Why the category decides the answer</h2>
          <p>
            Kevin's schedule carries 31 categories and 87 sub-lines, which exists because "clothing"
            is not one useful life. A sample, read from the live schedule:
          </p>
          <ComparisonTable
            caption="Useful life by sub-line, from Kevin's schedule on 3 October 2026"
            columns={['Sub-line', 'Useful life', 'Note']}
            rows={[
              ['Clothing — underwear & nightwear', '3 years', ''],
              ['Clothing — footwear, non-athletic', '5 years', ''],
              ['Clothing — all other', '8 years', ''],
              ['Furniture — upholstered', '10 years', ''],
              ['Furniture — all other', '20 years', ''],
              ['Appliances, major — refrigerator', '14 years', ''],
              ['Music, movies & media — DVDs', '8 years', 'The one capped line: 50% maximum'],
              ['Jewelry — costume & children’s watches', '10 years', ''],
              ['Jewelry — watches, brooches, pins', '20 years', ''],
              ['Jewelry — all other', 'No useful life', 'Appraisal-based'],
              ['Clothing — furs', 'No useful life', 'Appraisal-based'],
              ['Firearms — all', '20 years', 'Age-based, flagged for appraisal'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>It runs all the way to 100%</h2>
          <EvidenceCallout>
            <p>
              A $74.94 clothing line in a 3-year class, measured on the live engine: <strong>0% when
              new, 40% at two years, and 100% from five years on — an ACV of $0.00.</strong> 86 of
              the 87 schedule lines carry no cap whatsoever.
            </p>
          </EvidenceCallout>
          <p>
            That answer is uncomfortable and correct. A seven-year-old set of bedsheets in a
            three-year class has no actual cash value left, and a schedule that clamped it at 90% to
            seem fairer would produce a number the arithmetic cannot justify. Kevin renders the
            answer the schedule gives, including $0.00.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Age is ownership-relative</h2>
          <p>
            The question is how long this insured had the item, not how old the design is. A
            six-year-old model bought last year is one year old on the claim. Items land from
            processing at age 0 — meaning ACV equals RCV until somebody enters an age — which is
            deliberate: an unentered age is visible, where a guessed one is not.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Where the calculation happens</h2>
          <p>
            Server-side, every time. Changing a class or an age sends the line back for
            recalculation and the cell shows a pending state until the answer returns. The
            interface never computes depreciation itself, because two implementations of the same
            rounding eventually disagree — and the one that disagrees in public is the exported
            worksheet sitting on a carrier's desk.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The caveat that matters</h2>
          <p>
            Depreciation on an actual claim is subject to the policy language and the jurisdiction.
            Recoverable depreciation may be payable after replacement; some policies and some states
            treat categories differently. Kevin produces a defensible schedule and the evidence
            under it. It does not decide coverage.
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
              to: '/guides/rcv-vs-acv-personal-property',
              t: 'RCV vs ACV on a contents claim',
              d: 'The two figures, what separates them, and a worked example.',
            },
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'Where depreciation sits in the workflow.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'The replacement cost that depreciation is applied to.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'Real lines with percentages, dollar amounts and ACV.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
