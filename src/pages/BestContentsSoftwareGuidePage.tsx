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
 * /guides/best-contents-software-public-adjusters — spec page 13, Tier 3.
 *
 * The brief is explicit: CRITERIA-DRIVEN, NOT A FAKE RANKINGS ARTICLE. So
 * there is no numbered list of competitors and no scores. Two reasons beyond
 * the instruction: we cannot verify another vendor's current behaviour well
 * enough to publish a comparison table about it, and a page that ranks itself
 * first is discounted by the reader who most needs it.
 *
 * What it does instead is give the evaluation criteria -- including the ones
 * where Kevin is NOT the answer -- and the questions to put to any vendor,
 * including us. The "types of software" section describes categories rather
 * than naming products, which is both fairer and more durable.
 */

const FAQS: Faq[] = [
  {
    q: 'What should a public adjuster look for in contents software?',
    a: 'Whether it produces defensible line items: identification you can check, a replacement price that traces to a listing, a content class, depreciation you can reconcile, and an export the carrier can import without rework. Speed matters only once those hold.',
  },
  {
    q: 'Why does evidence handling matter more than features?',
    a: 'Because a contents schedule is argued, not just filed. The questions that come back are "what is this item" and "where did this price come from", and software that cannot answer the second one leaves you reconstructing it by hand months later.',
  },
  {
    q: 'Is room-level photo extraction good enough?',
    a: 'For triage and documentation, often. For valuation, usually not: a room photograph establishes that property existed, rarely which model it was, and a replacement price needs the second thing. Be wary of any tool that reports more items than you took photographs.',
  },
  {
    q: 'How should pricing models be compared?',
    a: 'Work out the cost per claim at your actual volume, not the headline. Per-claim and per-seat pricing punishes a busy month and a growing team respectively; a flat subscription with an item allowance punishes neither, as long as you know what happens past the allowance.',
  },
  {
    q: 'What questions should I put to a vendor?',
    a: 'Ask what happens when the software is unsure, whether a price traces to a listing, whether the export imports without reformatting, what depreciation schedule is used and whether you can see it, who reviews before a line is final, and what the cost is at your real volume.',
  },
  {
    q: 'Where does Kevin fit?',
    a: 'Insurance valuation automation: identification, replacement research, classification, depreciation and a carrier-ready export, with a person reviewing before anything is promoted. It is not estimating software, restoration management, or pack-out logistics, and those are not adjacent problems we solve badly — we do not solve them.',
  },
]

const CRUMBS = [
  { to: '/guides/best-contents-software-public-adjusters', t: 'Choosing contents software' },
]

export default function BestContentsSoftwareGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/best-contents-software-public-adjusters"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="What Should Public Adjusters Look for in Contents Software?"
          lede="Criteria rather than rankings: what to test, what to ask, and which categories of tool solve which problem. We are one of the options, and we say where we are not the answer."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="How should a public adjuster evaluate contents software?"
          answer="By whether it produces line items that survive review — identification you can check, a price that traces to a listing, a schedule you can reconcile, and an export the carrier accepts — and only then by how fast it is."
        >
          <p>
            This page does not rank products. We cannot verify another vendor's current behaviour
            well enough to publish a table about it, and a vendor ranking itself first is worth
            nothing to the reader. What follows is the criteria we would use, including where they
            point away from us.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The criteria that matter</h2>
          <ComparisonTable
            caption="What to test in a trial, in rough order of consequence"
            columns={['Criterion', 'What good looks like', 'How to test it']}
            rows={[
              ['Identification quality', 'Brand and model from the evidence, and a blank where the evidence does not support one', 'Feed it ten real photographs, including two bad ones'],
              ['Behaviour when unsure', 'An empty, editable field — not a confident guess', 'Submit a blurred photo and see what comes back'],
              ['Evidence handling', 'Several photographs of one item become one line', 'Upload a wide shot and a model plate of the same item'],
              ['Price provenance', 'Every price traces to a specific listing, kept on the line', 'Open a priced line and follow the link'],
              ['Research quality', 'The right variant, not a bundle or an accessory', 'Check a line where capacity or size changes the price'],
              ['Retail and resale', 'Retail preferred; resale used only when retail cannot answer, and labelled', 'Price something discontinued'],
              ['Classification', 'A content class on every line, driving its schedule', 'Change a class and watch the depreciation change'],
              ['Depreciation', 'A schedule you can inspect, age-based, reconcilable by hand', 'Recompute one line with a calculator'],
              ['RCV and ACV', 'Figures that foot across the row, tax included where it belongs', 'Add the row up yourself'],
              ['Exports', 'Imports without reformatting; static values, not formulas', 'Actually import the file'],
              ['Auditability', 'Who changed what, when', 'Edit a line and look for the record'],
              ['Speed', 'Hundreds of photographs in one pass, unattended', 'Time a real claim, not a demo claim'],
            ]}
          />
          <EvidenceCallout>
            <p>
              The single most revealing test is the one people skip: <strong>give it a photograph it
              cannot identify.</strong> Software that returns a confident description of the wrong
              item is more dangerous than software that returns nothing, because the wrong answer
              survives review.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Four categories of tool</h2>
          <ComparisonTable
            caption="Different problems, often confused for each other"
            columns={['Category', 'Solves', 'Does not solve']}
            rows={[
              ['Pricing-only tools', 'Looking up a replacement price for an item you have already described', 'Identification, grouping, classification, depreciation'],
              ['Room-photo extraction', 'Documenting a room and triaging what is there', 'Make and model, defensible per-item pricing'],
              ['Restoration and pack-out systems', 'Jobs, crews, boxes, storage and logistics', 'Valuation and carrier-ready schedules'],
              ['Insurance valuation automation', 'Evidence to priced, classified, depreciated line items with sources', 'Structural estimating and carrier claim management'],
            ]}
          />
          <p>
            Kevin is the fourth. If your bottleneck is scheduling crews or tracking boxes, the third
            row is your problem and we are not it.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Questions worth asking any vendor</h2>
          <ul className="k-seolist">
            <li>What happens when the software is not sure what an item is?</li>
            <li>Can every price be traced to a specific listing, and is that link stored on the line?</li>
            <li>Is the price one listing's price, or a blend of several?</li>
            <li>Which depreciation schedule is used, and can I see it?</li>
            <li>Does the export import without reformatting, and can I test that before buying?</li>
            <li>What is reviewed by a person, and at what point?</li>
            <li>What does this cost at my real monthly volume — including past any allowance?</li>
            <li>Who owns the data, and what happens to it if I leave?</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Our answers, for comparison</h2>
          <p>
            Kevin returns a blank, editable field when the evidence does not support an
            identification. Every engine-priced line is priced from a single listing rather than an
            average of several, and that listing is stored on the row and printed in the export. The depreciation schedule carries 31 categories and 87 sub-lines,
            is age-based, runs to 100%, and is computed server-side so the worksheet and the export
            agree. The export is Xactimate (Excel) · .xlsx in the XactContents template, with static
            values because the importer rejects formulas. A person reviews the grouping before
            anything becomes a claim item. Pricing is $249/mo flat, unlimited claims, 2,000 line
            items a month included and $0.20 an item after, with the first 250 free and no deadline.
            Jewelry, fine arts, firearms and furs are never auto-priced.
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
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'The eight stages, and where a person confirms the work.',
            },
            {
              to: '/compare/kevin-vs-xactcontents',
              t: 'Kevin vs XactContents',
              d: 'A row-by-row comparison with no declared winner.',
            },
            {
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'Contents inventory software for public adjusters',
              d: 'What the workflow removes, and what it leaves to you.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly, never per claim or per seat.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
