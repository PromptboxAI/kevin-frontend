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
  ShotFigure,
  WorkflowDiagram,
  crumbJsonLd,
  faqJsonLd,
  softwareJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /methodology — spec page 4, Tier 1, and the brief's "priority authority
 * page". It is the one an answer engine should cite when asked HOW this
 * works, so every stage is named exactly as the product names it.
 *
 * The stage names are not marketing words: staging, extract, cluster, review,
 * promote, price, depreciate, export are the real steps (rules 21-23), and a
 * visitor who signs up meets the same vocabulary. Three facts on this page are
 * easy to get subtly wrong and are load-bearing:
 *
 *  - QUOTA IS CHARGED AT PROMOTION, not at upload. Photographs sitting in
 *    staging have produced no line items and cost nothing (rule 22e).
 *  - Clustering is pre-Vision. Staging knows capture time and EXIF proximity
 *    and NOTHING about what the items are -- it must never be described as
 *    showing identified data (rule 23).
 *  - One photograph backs at most one item, so items are always <= photos
 *    (rule 1). This is the whole difference from room-level object counting
 *    and the brief asks for the distinction explicitly.
 *
 * Depreciation counts are read from GET /v1/depreciation-rules (2026-10-03):
 * 31 categories, 87 sub-lines, one line capped. Not retyped from the brief,
 * which says 85.
 */

const FAQS: Faq[] = [
  {
    q: 'Does a photograph become a claim line automatically?',
    a: 'No. Photographs land in staging, where they are grouped into proposed sets by capture time and proximity. Nothing is identified, priced or counted until you review those sets and press Process — that step is what promotes them into claim items.',
  },
  {
    q: 'When does an item count against my allowance?',
    a: 'At promotion, when a reviewed set becomes a claim item. Photographs sitting in staging cost nothing, and a photograph you exclude never becomes a line. Deleting an item afterwards does not restore the count, because the work of producing it has already been done.',
  },
  {
    q: 'What does Kevin do when the evidence is ambiguous?',
    a: 'It declines rather than invents. A set with no usable identification arrives with blank, editable description and price fields — a hallucinated description on a carrier-facing document is worse than a blank one. You fill it in, or re-shoot the item and run it again.',
  },
  {
    q: 'Can several photographs become one line?',
    a: 'Yes, and that is the normal case: a wide shot and a close-up of the model plate are one item photographed twice. Clustering proposes that grouping and you confirm it. The reverse never happens — one photograph never becomes several line items.',
  },
  {
    q: 'How is depreciation calculated?',
    a: 'From the content class and the age you enter, against a schedule of 31 categories and 87 sub-lines. The server computes the percentage, the dollar amount and the actual cash value; the interface only renders them. Depreciation runs to 100%, so property past its useful life shows an ACV of $0.00.',
  },
  {
    q: 'What is checked by a person rather than by software?',
    a: 'Grouping, ambiguous identities, unusual comparables and anything class-specific — jewelry, fine arts, firearms and furs are never auto-priced. The reviewed worksheet is also fully editable: description, quantity, age, class and price all change by hand, and the money recomputes server-side.',
  },
]

const CRUMBS = [{ to: '/methodology', t: 'Methodology' }]

export default function MethodologyPage() {
  return (
    <div className="k-landing">
      <Seo path="/methodology" jsonLd={[softwareJsonLd, faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How Kevin Turns Photographs Into Insurance-Ready Contents Line Items"
          lede="Eight stages, in the order you meet them: upload, extract, cluster, review, promote, price, depreciate, export. A person confirms the grouping before anything becomes a claim item."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="How does Kevin build a contents line item?"
          answer="Photographs land in staging, software proposes which shots belong to the same item, a person confirms that grouping, and only then is the item identified, priced from a listing, classified and depreciated."
        >
          <p>
            The order matters more than any single step. Grouping happens before identification, so
            a wide shot and a model-plate close-up become one line instead of two. Review happens
            before promotion, so nothing enters the claim that a person has not seen. Pricing
            happens after identification, because a price is only defensible once you know what the
            item is.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The eight stages</h2>
          <WorkflowDiagram />
        </section>

        <section className="k-seosec">
          <h2>Upload</h2>
          <p>
            Select the whole folder and click once. Kevin uploads in batches rather than one
            enormous request, removes duplicates by content hash across the entire claim — not just
            the current batch, so re-dropping yesterday's folder resolves to duplicates rather than
            doubles — and expands a .zip in the browser without posting the archive. Photographs
            land in <strong>staging</strong>. None of them is a claim line yet.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Extract</h2>
          <p>
            Each photograph is read for several independent signals: visual labels, text via OCR,
            model-number patterns and barcodes. No single signal is trusted on its own. A barcode
            that disagrees with the visible text is a reason to ask a person, not a reason to
            overrule the picture.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Cluster</h2>
          <p>
            Shots taken within seconds of each other, in the same place, are proposed as one set.
            This step is deliberately <em>pre-identification</em>: the clusterer knows capture time
            and EXIF proximity and nothing about what the item is. Staging shows you set numbers,
            timestamps and filenames — never guessed item names, because a guess shown at this stage
            would be read as a finding.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Review</h2>
          <p>
            You merge sets that should be one item, split ones that should not, attach a note where
            the photograph needs context, and exclude anything that is not contents. Excluded
            photographs stay on the claim — in property claims evidence is excluded from the
            worksheet, never deleted. Every one of these edits is saved as you make it.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Promote</h2>
          <p>
            Processing promotes the reviewed sets into claim items. <strong>This is the moment an
            item counts against your allowance</strong> — not when photographs were uploaded, and
            not for sets you excluded. If a batch would exceed what is left of your allowance, Kevin
            processes up to the limit and tells you exactly how many were left, rather than failing
            the whole upload; the remainder stays on the claim and runs when the allowance is
            restored.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Price</h2>
          <p>
            One query per item against the Kevin Content Pricing Engine. Listings that are not the
            same product are discarded, duplicates collapse, outliers are dropped, and the line is
            priced from a single remaining listing — the middle one by price — with that listing's
            link stored on the row. Where retail cannot price an item, the resale market can, used
            raw and labelled as resale. Where neither can, the cell arrives blank and editable.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Depreciate</h2>
          <p>
            The content class gives the useful life; the age you enter gives the percentage. The
            schedule carries 31 categories and 87 sub-lines, so footwear, collectible media and
            major appliances are not treated as one category. Depreciation applies to the
            tax-inclusive line total and runs to 100%: property past its useful life shows $0.00
            ACV. Furs and jewelry other than costume pieces and watches have no useful life at all and are
            appraisal-based; costume jewelry (10 years), watches (20) and firearms (20) are ordinary
            age-based lines. Those four classes are never automatically PRICED, which is a separate
            rule from how they depreciate.
          </p>
          <p className="k-seonote">
            Counts read from the live schedule on 3 October 2026. Depreciation is subject to the
            policy and the jurisdiction; Kevin computes a schedule, not a coverage determination.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Export</h2>
          <ShotFigure
            src="/marketing/worksheet-review-2x.webp"
            alt="The finished worksheet: priced, classified and depreciated contents lines with totals for replacement cost, depreciation, tax and actual cash value"
            label="kevin.co/claims/…/worksheet"
            caption="The reviewed worksheet, which is also what the export is a snapshot of."
          />
          <p>
            Xactimate (Excel) · .xlsx in the XactContents template, or a room-by-room PDF with
            photographs. Every derived cell in the spreadsheet is a computed number rather than a
            formula, because the importer breaks on formulas — the export is a snapshot of what the
            app produced, and recalculation lives in the app.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Why this is not object detection</h2>
          <EvidenceCallout>
            <p>
              <strong>Recognising that an image contains a television is not the same as identifying
              the television, selecting a defensible replacement, and building an insurance claim
              line.</strong>
            </p>
          </EvidenceCallout>
          <ComparisonTable
            caption="Room-level object counting versus item-level valuation"
            columns={['', 'Object detection', 'Kevin']}
            rows={[
              ['Question answered', 'What objects appear in this room?', 'What is this item, and what does it cost to replace?'],
              ['Output', 'A count of detected objects', 'A priced, classified, depreciated line item'],
              ['Items per photo', 'Many — a room photo can yield a dozen', 'At most one; items are always at or below photo count'],
              ['Evidence kept', 'None beyond the detection', 'The listing behind the price, on the row'],
              ['When unsure', 'Reports a guess with a confidence number', 'Leaves the cell blank and editable'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <CtaBand />

        <RelatedCards
          items={[
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'Query construction, comparable filtering, and where resale comes in.',
            },
            {
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'Contents inventory software for public adjusters',
              d: 'The same workflow, framed for the people who run it daily.',
            },
            {
              to: '/xactcontents-alternative',
              t: 'Kevin and XactContents-style workflows',
              d: 'What Kevin does, what it does not, and how the export lands.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'The output of all eight stages, with real figures.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
