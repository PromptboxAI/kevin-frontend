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
  WorkflowDiagram,
  crumbJsonLd,
  faqJsonLd,
  softwareJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /public-adjusters/ai-contents-inventory-software — spec page 1, Tier 1.
 *
 * Brief: kevin_co_seo_ai_answer_page_specs.md. Sections, headings and intent
 * follow it; the COPY follows the product's locked facts where the two
 * disagree, and those disagreements are worth naming:
 *
 *  - The brief's secondary CTA is "Start your free trial". The trial is
 *    metered, not timed (rule 9b): 250 line items, no deadline. Every CTA here
 *    says so, because "trial" plus a button is read as "and then it expires".
 *
 *  - The brief wants a "validated case-study module: 4,000+ carrier-facing
 *    line items processed in 30 days" in section 5. THAT FIGURE IS NOT
 *    PUBLISHED HERE. It needs the owner's substantiation, and the brief's own
 *    rule says to publish only what can be substantiated internally. What is
 *    here instead is the figure the home page already carries -- 310+ claims
 *    since 2025, across 12 carriers.
 *
 *  - The brief's internal links include four pages that do not exist yet
 *    (/how-it-works, /xactcontents-alternative,
 *    /insurance-contents-pricing-software, /methodology). Linking them now
 *    would ship four 404s, so Related points at what is live and grows as the
 *    tier lands.
 *
 * The depreciation counts are READ FROM THE ENGINE, not retyped: 31 schedule
 * categories and 87 sub-lines, GET /v1/depreciation-rules on 2026-10-03. The
 * brief says 85 sub-lines and CLAUDE.md's rule 13 says 85; the schedule has
 * grown since both were written.
 */

const FAQS: Faq[] = [
  {
    q: 'Can Kevin get make and model from a photograph?',
    a: 'Often, yes — when the frame contains what identifies the item. A badge, a model plate, a barcode or a legible label is what make-and-model matching needs. Where the photo only shows that an object exists, Kevin says so rather than guessing: the line arrives with a blank, editable price for you to fill in.',
  },
  {
    q: 'What happens when I have several photos of the same item?',
    a: 'They become one line, not several. Shots taken seconds apart are grouped into a proposed set — a wide shot plus the model plate, for instance — and you merge or split those sets before anything is identified. One photo backs at most one item, so your line count is always at or below your photo count.',
  },
  {
    q: 'How is depreciation applied?',
    a: 'By content class and age, against a schedule of 31 categories and 87 sub-lines. You enter the age; the server computes the percentage and the dollar amount, and the worksheet reads the answer it returns. Depreciation runs to 100%, so an item past its useful life shows an actual cash value of $0.00 rather than a floor we invented.',
  },
  {
    q: 'Does Kevin export something XactContents can import?',
    a: 'Yes — Xactimate (Excel) · .xlsx, in the XactContents template, with static values in every derived cell because the importer rejects formulas. A room-by-room PDF with photos is available for the file. Kevin is not affiliated with or endorsed by Verisk.',
  },
  {
    q: 'Can Kevin price items when the photos are gone?',
    a: 'Yes, through a separate workflow. A typed or exported inventory — PDF, CSV or XLSX — is parsed server-side and each described row is priced like a photographed one, just without brand and model precision. It is not the photo-based engine and we do not present it as equivalent.',
  },
  {
    q: 'Is this built for professionals or homeowners?',
    a: 'Professionals: public adjusters, independent adjusters, content inventory specialists and estate professionals. The output is a carrier-facing worksheet with a source link behind every priced line, which is what a desk reviewer asks for.',
  },
]

const CRUMBS = [
  { to: '/for-adjusters', t: 'For adjusters' },
  { to: '/public-adjusters/ai-contents-inventory-software', t: 'AI contents inventory software' },
]

export default function PaContentsSoftwarePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/public-adjusters/ai-contents-inventory-software"
        jsonLd={[softwareJsonLd, faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="AI Contents Inventory Software for Public Adjusters"
          lede="Turn damaged-item evidence into priced, sourced, depreciated contents line items — without spending days researching every item by hand."
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
          <span className="k-seocta-note">250 line items free · no deadline · no per-claim fee</span>
        </div>

        <ShotFigure
          src="/marketing/worksheet-review-2x.webp"
          alt="Kevin's review worksheet: priced contents lines with room, quantity, description, make, model, content class, unit cost, sales tax, age, depreciation percentage and actual cash value"
          label="kevin.co/claims/…/worksheet"
          caption="Every priced line carries the listing it came from, so a questioned number is answered with a link instead of an argument."
        />

        <DirectAnswer
          question="What does AI contents inventory software actually do for a public adjuster?"
          answer="It takes the photographs you already shoot on site and returns priced, classified, depreciated line items with a source link on each one — leaving you the judgment calls instead of the typing."
        >
          <p>
            The work it removes is the repetitive part: describing each item, finding what it costs
            to replace today, copying the listing URL, choosing a content class, and applying the
            right depreciation for the item's age. The work it does not remove is yours — grouping
            ambiguous evidence, pricing collectibles, and deciding what a line is worth on this
            claim. Nothing reaches a carrier until you have reviewed it.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Contents claims should not take weeks to build</h2>
          <p>
            A single pack-out can run to hundreds of photographs. Built by hand, each one becomes a
            search, a comparison across several retailers, a copied link, a guess at a category and
            a depreciation lookup — then a row typed into a spreadsheet that the carrier's system
            will reject if a cell holds a formula instead of a number. Multiply that by four hundred
            items and the bottleneck is not judgment. It is transcription.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What Kevin automates</h2>
          <FeatureGrid
            cols={3}
            items={[
              {
                t: 'Item identification',
                d: 'Read from the photographs, with several independent signals weighed together — no single one is trusted on its own, and a frame that cannot be read is flagged rather than guessed.',
              },
              {
                t: 'Multi-photo grouping',
                d: 'A wide shot and a model-plate close-up taken seconds apart become one line, priced once. You merge, split or exclude the proposed sets first.',
              },
              {
                t: 'Replacement-cost research',
                d: 'The Kevin Content Pricing Engine searches current listings across retailers, specialty stores, brand-direct storefronts and marketplaces in one query per item.',
              },
              {
                t: 'Source substantiation',
                d: 'The listing behind each price is stored on the line — retailer, title and direct URL — and prints into the export.',
              },
              {
                t: 'XactContents classification',
                d: 'Each line carries a content class, which is what drives its depreciation schedule and what the XactContents template expects.',
              },
              {
                t: 'Depreciation, RCV and ACV',
                d: 'Age and class against 31 categories and 87 sub-lines. The server computes it; the page only renders the answer, so the worksheet and the export never disagree.',
              },
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>How it works, start to export</h2>
          <p>
            These are the product's own stages, in the order you meet them. Quota is charged at
            promotion — the moment a reviewed set becomes a claim item — not when photos land.
          </p>
          <WorkflowDiagram />
        </section>

        <section className="k-seosec">
          <h2>Built for claims accuracy, not object counting</h2>
          <EvidenceCallout>
            <p>
              <strong>Recognising that an image contains a television is not the same as
              identifying the television.</strong>{' '}
              A room photograph establishes that something was there. It rarely establishes the
              make, the model, the variant or the capacity — and without those, a replacement price
              is not defensible. Kevin reads one item per photograph and asks for the frame that
              identifies it.
            </p>
          </EvidenceCallout>
          <p>
            That is also why the line count on a claim is at or below the photo count. Software that
            reports more items than photographs is counting objects in a scene, which is a different
            job from building an insurance line item.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What comes out</h2>
          <ComparisonTable
            caption="Export formats and what each is for"
            columns={['Output', 'Format', 'What it is for']}
            rows={[
              [
                'Carrier worksheet',
                'Xactimate (Excel) · .xlsx',
                'The XactContents template, with static values in every derived cell because the importer rejects formulas.',
              ],
              [
                'Inventory PDF',
                '.pdf',
                'Room by room with photographs, for the file and for the insured.',
              ],
              [
                'Source links',
                'On every priced line',
                'The listing the price came from, kept on the row and printed in the export.',
              ],
            ]}
          />
          <p className="k-seonote">
            Kevin exports a file you send. It does not push into carrier systems, and it has no
            carrier-facing review surface.
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
              to: '/product',
              t: 'How Kevin works, screen by screen',
              d: 'Intake, staging, processing, the worksheet and the export, with real screenshots.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: '2,000 line items a month included, then $0.20 an item. First 250 free.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'Real priced lines with depreciation, totals and the source link on each row.',
            },
            {
              to: '/for-adjusters',
              t: 'Kevin for independent and public adjusters',
              d: 'What the workflow looks like on a real contents loss.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
