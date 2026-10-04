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
 * /compare/kevin-vs-xactcontents — spec page 12, Tier 2.
 *
 * The brief's instruction here is the whole design of the page: DO NOT DECLARE
 * A SIMPLISTIC WINNER. So the comparison table states what each does, the
 * "when XactContents is the better fit" section is written to be genuinely
 * useful rather than a straw man, and the non-affiliation line is stated in
 * the open.
 *
 * Kept distinct from /xactcontents-alternative on purpose. That page answers
 * "I want a faster XactContents workflow" (commercial intent); this one
 * answers "how do these two compare" (research intent) with a row-by-row
 * table. Same facts, different question -- and neither page claims a
 * capability Kevin does not have: no structural estimating, no carrier
 * ecosystem, no integration (rules 2 and 4).
 */

const FAQS: Faq[] = [
  {
    q: 'Which one should I use?',
    a: 'They answer different questions. If your work is structural estimating inside the carrier ecosystem, that is Xactimate and XactContents, and Kevin does not replace them. If the slow part of your week is building, pricing and documenting hundreds of contents lines, that is what Kevin automates — and its output is a worksheet in the XactContents template.',
  },
  {
    q: 'Can they be used together?',
    a: 'That is the common case. Kevin produces the priced, classified, depreciated contents worksheet and you import it where your estimate lives.',
  },
  {
    q: 'Does Kevin do structural estimating?',
    a: 'No. Kevin values personal property. Dwelling and structure estimating is a different discipline with different price lists, and we do not pretend to cover it.',
  },
  {
    q: 'Is the export really importable?',
    a: 'It is written to the XactContents template with static values in every derived cell, because the importer breaks on formulas. Recalculation lives in the web app; the file is a snapshot of what the app produced.',
  },
  {
    q: 'Is Kevin integrated with Verisk products?',
    a: 'No. Kevin is not affiliated with, endorsed by or certified by Verisk, and no integration is announced. The interchange today is a file: Kevin writes the .xlsx and you import it.',
  },
  {
    q: 'What about pricing models?',
    a: 'Kevin is flat monthly — $249, unlimited claims, 2,000 line items a month included and $0.20 an item after that, with the first 250 free and no deadline on them. There is no per-seat or per-claim fee.',
  },
]

const CRUMBS = [{ to: '/compare/kevin-vs-xactcontents', t: 'Kevin vs XactContents' }]

export default function CompareXactcontentsPage() {
  return (
    <div className="k-landing">
      <Seo path="/compare/kevin-vs-xactcontents" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Kevin vs XactContents"
          lede="They overlap in part of the personal-property valuation workflow and are not the same product. This is what each one does, row by row, without a declared winner."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="How do Kevin and XactContents compare?"
          answer="XactContents is contents valuation inside Verisk's estimating ecosystem; Kevin is automation for building contents lines from photographs, which exports into that ecosystem as a worksheet."
        >
          <p>
            The honest comparison is narrow. Both deal in personal property, but one is part of an
            estimating platform with a carrier network behind it, and the other turns a folder of
            pack-out photographs into priced, documented lines. Most people asking this question are
            not choosing between them so much as deciding what builds the lines before the estimate
            is assembled.
          </p>
          <p>
            <strong>Kevin is not affiliated with, endorsed by or certified by Verisk.</strong>
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Row by row</h2>
          <ComparisonTable
            caption="What each one is for — not a scorecard"
            columns={['', 'Kevin', 'XactContents']}
            rows={[
              ['Primary purpose', 'Build, price, classify and document contents lines from evidence', 'Contents valuation within an estimating platform'],
              ['Photo intake', 'Hundreds at once: folder, phone dump or .zip expanded in the browser', 'Not its focus'],
              ['Multi-photo grouping', 'Shots of one item become one proposed set, confirmed by a person', 'Not its focus'],
              ['Item identification', 'Vision, OCR, model numbers and barcodes together', 'Entered by the estimator'],
              ['Replacement research', 'One query per item; priced from a single listing', 'Price list and catalogue driven'],
              ['Source URL on the line', 'Stored on the row and printed in the export', 'Not in this form'],
              ['Content classification', 'On every line, driving its depreciation', 'Native to the platform'],
              ['Depreciation', 'XactContents classes — 31 categories, 87 sub-lines, age-based, to 100%', 'Platform and carrier schedules'],
              ['RCV and ACV', 'Computed server-side, footed on the row', 'Yes'],
              ['Structural estimating', 'No', 'Yes, with Xactimate'],
              ['Carrier ecosystem', 'No. Kevin exports a file you send', 'Yes, including assignment flow'],
              ['Export formats', 'Xactimate (Excel) · .xlsx · XactContents template, plus PDF', 'Platform formats including .ESX archives'],
              ['Pricing model', '$249/mo flat, unlimited claims, 2,000 items included', 'Licensing through Verisk'],
              ['Best fit', 'Large contents inventories built from photographs', 'Estimating inside the carrier workflow'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>When XactContents is the better fit</h2>
          <ul className="k-seolist">
            <li>Your work is structural as well as contents, and lives in one estimate.</li>
            <li>Assignments arrive through the carrier ecosystem and are expected back the same way.</li>
            <li>A carrier requires their platform and their price lists, which is not a preference you get to override.</li>
            <li>Contents on your claims are a short schedule rather than several hundred lines.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>When Kevin is the better workflow</h2>
          <ul className="k-seolist">
            <li>The bottleneck is volume: hundreds of photographs becoming hundreds of documented lines.</li>
            <li>You want the listing behind every price kept automatically rather than when time allows.</li>
            <li>You are a public or independent adjuster paying for your own tools, and flat monthly beats per-claim.</li>
            <li>The loss is total and the inventory is a typed list rather than photographs.</li>
          </ul>
          <EvidenceCallout>
            <p>
              Kevin never blocks an export on editorial readiness. It tells you what needs attention
              — unpriced lines, missing models, special-limits classes — and leaves the download
              live. Whether the file is ready to send is a professional judgment, not a software
              permission.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>How they fit together</h2>
          <p>
            In practice Kevin runs first and the estimate second: the photographs become a reviewed,
            priced worksheet, and that worksheet imports where the rest of the claim is assembled.
            Nothing is pushed anywhere — Kevin writes a file and you decide where it goes, which is
            also why it has no carrier-facing review surface.
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
              to: '/xactcontents-alternative',
              t: 'A faster XactContents-style workflow',
              d: 'The same facts, aimed at the manual work rather than the comparison.',
            },
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'All eight stages, and where a person confirms the work.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly, never per claim or per seat. First 250 line items free.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'The worksheet, the depreciation and the source links.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
