import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import {
  ComparisonTable,
  CtaBand,
  DirectAnswer,
  FaqList,
  RelatedCards,
  SeoPageHead,
  ShotFigure,
  crumbJsonLd,
  faqJsonLd,
  softwareJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /xactcontents-alternative — spec page 3, Tier 1.
 *
 * THE RISKY PAGE OF THE FIFTEEN, and the brief says so itself: do not imply
 * affiliation with or endorsement by Verisk. Three guards, all load-bearing:
 *
 *  1. The non-affiliation line is stated in the open, not buried in a
 *     footnote, and the page never uses "XactContents" as a label for
 *     anything Kevin produces beyond the one factual case: the export is
 *     written to the XactContents template, which is a file format we write.
 *  2. It does not claim to replace XactContents. The honest answer is that
 *     Kevin removes the manual work of BUILDING, pricing, classifying,
 *     depreciating and documenting contents lines, which is a part of the
 *     job, not the whole of it. The "what Kevin does not do" section is as
 *     specific as the "does" section on purpose -- a comparison page that
 *     only lists strengths reads as marketing and gets discounted.
 *  3. No integration is promised. Rule 2 and 4: Xactimate takes a
 *     pre-formatted .xlsx (never XML), programmatic integration would be via
 *     XactAnalysis, and Kevin has no carrier-facing surface and does not push
 *     into carrier systems. Nothing here hints at a partnership that does not
 *     exist.
 */

const FAQS: Faq[] = [
  {
    q: 'Does Kevin replace XactContents?',
    a: 'No. Kevin removes the manual work of building contents lines — identifying items, pricing them from a listing, classifying them, applying depreciation and documenting the source — and exports a worksheet in the XactContents template. Estimating, the carrier ecosystem and everything XactContents does beyond contents valuation are not Kevin.',
  },
  {
    q: 'Does the export import without reformatting?',
    a: 'That is the intent and the reason for a constraint you can see in the file: every derived cell is written as a computed number rather than a formula, because the importer breaks on formulas. The export is a snapshot of what the web app produced, and recalculation happens in Kevin, not in the spreadsheet.',
  },
  {
    q: 'Does Kevin use XactContents depreciation classes?',
    a: 'Yes — that is what the schedule is built on. Each line is classified to an XactContents category and sub-category, and the depreciation follows from that class and the age of the item: 31 categories, 87 sub-lines, age-based, running to 100%. A carrier profile can select a bracketed schedule instead of straight-line where that is what the carrier uses. Using the taxonomy is not a relationship with its owner — see below.',
  },
  {
    q: 'Is Kevin a fit for public adjusters specifically?',
    a: 'Yes, and that is who it was built around: independent and public adjusters, content inventory specialists and estate professionals. Pricing is flat monthly rather than per claim or per seat, which is how adjusters already pay for the tools they use.',
  },
  {
    q: 'What about total losses with no usable photographs?',
    a: 'There is a separate route for that: a typed or exported inventory — PDF, CSV or XLSX — is parsed and each described row is priced like a photographed one, without brand and model precision. It is a different workflow from the photo-based engine and we do not present it as equivalent.',
  },
  {
    q: 'Is Kevin affiliated with Verisk?',
    a: 'No. Kevin is not affiliated with, endorsed by or certified by Verisk. XactContents and Xactimate are their products; Kevin writes a worksheet in a format their importer reads.',
  },
]

const CRUMBS = [{ to: '/xactcontents-alternative', t: 'XactContents alternative' }]

export default function XactcontentsAlternativePage() {
  return (
    <div className="k-landing">
      <Seo path="/xactcontents-alternative" jsonLd={[softwareJsonLd, faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="A Faster Workflow for XactContents-Style Contents Claims"
          lede="Kevin builds, prices, classifies and depreciates the contents lines, then exports a worksheet in the XactContents template. It is not a replacement for everything XactContents does."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="Is Kevin an XactContents alternative?"
          answer="For the part of the job that is building contents line items, yes — Kevin does that work from photographs instead of by hand. For estimating and the carrier ecosystem, no, and we would not claim otherwise."
        >
          <p>
            The useful comparison is not product against product but workflow against workflow. The
            slow part of a contents claim is producing the lines: identifying each item, finding
            what it costs to replace, keeping the evidence, choosing a class, applying depreciation.
            Kevin automates that and hands you a reviewed worksheet. Where it ends is also clear:
            it writes a file you send, and it has no carrier-facing review surface.
          </p>
          <p>
            <strong>Kevin is not affiliated with, endorsed by or certified by Verisk.</strong>{' '}
            XactContents and Xactimate are Verisk products. Kevin writes a worksheet in a format
            their importer reads.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What Kevin does</h2>
          <ComparisonTable
            caption="The contents-line workflow, by step"
            columns={['Step', 'What Kevin does']}
            rows={[
              ['Photo evidence', 'Hundreds of photographs ingest at once — a folder, a phone dump or a .zip, expanded in the browser.'],
              ['Grouping', 'Shots of one item taken seconds apart become one proposed set, which you merge, split or exclude.'],
              ['Identification', 'Read from the photographs; several independent signals are weighed together and no single one is trusted on its own.'],
              ['Pricing', 'One query per item, priced from a single listing — a single representative listing.'],
              ['Source', 'That listing is stored on the row and prints into the export.'],
              ['Content class', 'Each line carries a class, which drives its depreciation and its place in the template.'],
              ['Depreciation', 'Classified to XactContents categories and sub-categories — 31 categories, 87 sub-lines, age-based, computed server-side and running to 100%.'],
              ['RCV and ACV', 'Unit cost × quantity, plus sales tax, less depreciation — footed left to right on the row.'],
              ['Export', 'Xactimate (Excel) · .xlsx · XactContents template, plus a room-by-room PDF.'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>What Kevin does not do</h2>
          <ComparisonTable
            caption="Out of scope, deliberately"
            columns={['Not Kevin', 'Why it matters']}
            rows={[
              ['Structural estimating', 'Kevin values personal property. Dwelling and structure estimating is a different discipline and a different tool.'],
              ['Restoration CRM', 'No job management, scheduling or crew tracking.'],
              ['Warehouse and pack-out management', 'Kevin records what the property was and what it costs to replace, not where the boxes went.'],
              ['Carrier claim management', 'Kevin exports a file you send. It does not submit into carrier systems and has no carrier-facing review surface.'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>By hand versus through Kevin</h2>
          <ComparisonTable
            caption="The same 400-item pack-out, two ways"
            columns={['', 'By hand', 'Through Kevin']}
            rows={[
              ['Describing items', 'Typed per item from the photograph', 'Identified from the photograph, edited where wrong'],
              ['Replacement price', 'Searched per item across several retailers', 'One query per item, priced from a single listing'],
              ['Evidence', 'URL copied into a column, if there is time', 'Stored on the row automatically and printed in the export'],
              ['Content class', 'Chosen per line from memory', 'Carried on the line and used for its schedule'],
              ['Depreciation', 'Looked up per category and age', 'Server-computed from class and age, to 100%'],
              ['The spreadsheet', 'Typed, then re-typed when a price changes', 'Recalculated in the app; the export is a snapshot'],
              ['Your part', 'All of it', 'Review, exceptions and judgment'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>The export</h2>
          <ShotFigure
            src="/marketing/export-modal-2x.webp"
            alt="Kevin's export dialog offering the Xactimate Excel worksheet in the XactContents template and a room-by-room PDF inventory"
            label="kevin.co/claims/…/export"
            caption="Xactimate (Excel) · .xlsx · XactContents template. Static values in every derived cell, because the importer rejects formulas."
          />
          <p>
            Kevin never blocks an export on editorial readiness. The dialog tells you what needs
            attention — unpriced lines, missing model numbers, special-limits classes — and the
            download stays live. Whether to send it is your call, not the software's.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Interoperability, stated as it stands</h2>
          <p>
            Today the interchange is a file: Kevin writes the .xlsx and you import it. Xactimate
            uses Excel templates for contents and .ESX archives for whole estimates; programmatic
            integration in that ecosystem goes through XactAnalysis. Kevin has no integration with
            Verisk products and none is announced. If that changes, this page will say so on the day
            it is true and not before.
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
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'Query, filtering, a single listing per line, and where resale comes in.',
            },
            {
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'Contents inventory software for public adjusters',
              d: 'The full workflow from a folder of photographs to a carrier-ready worksheet.',
            },
            {
              to: '/sample',
              t: 'A finished claim you can open',
              d: 'See the worksheet columns, the depreciation and the source links.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly, never per claim or per seat. First 250 line items free.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
