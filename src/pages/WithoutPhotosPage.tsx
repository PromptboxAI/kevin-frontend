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
  crumbJsonLd,
  faqJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /contents-claims/without-photos — spec page 6, Tier 1.
 *
 * This is the WRITTEN-IMPORT route (rule 24), and the brief is right that it
 * must be positioned as a separate workflow rather than as the photo engine
 * with photographs removed. The rule's specifics are what keep this page
 * honest:
 *
 *  - Parsing is SERVER-SIDE, because real inventories arrive as PDFs. There is
 *    no browser parser and the page must not imply one.
 *  - A written row ALREADY IS a line item. It does not pass through staging --
 *    staging exists to turn photographs into items via cluster/review/promote,
 *    which has nothing to do here.
 *  - The first three steps (parse, map, preview) CREATE NOTHING. The only dry
 *    run is the preview endpoint; `price: false` on the bulk endpoint still
 *    inserts rows, which is exactly the kind of trap worth not implying away.
 *  - Rows that look like headings are PRE-SELECTED FOR REMOVAL, never
 *    auto-dropped: a heading left in gets priced as property.
 *  - Room stays its own field, because the description doubles as the search
 *    query and a stray room name changes what gets searched.
 *  - 500 rows per request, resumable from a failed chunk.
 *  - Confirmation states the estimated number of searches, not the row count.
 *
 * One conflict resolved: rule 24 describes a described item as priced at "the
 * median of live retail comps", but rule 10 was amended later (2026-09-29) so
 * the unit cost is the price of a SINGLE listing -- the middle one by price.
 * The later amendment governs, and this page uses it.
 */

const FAQS: Faq[] = [
  {
    q: 'Can Kevin price a claim with no photographs at all?',
    a: 'Yes, through a different route. You upload the written inventory — a PDF, a CSV or a spreadsheet, including a restoration company\'s list or something the insured typed — and each described row is priced like a photographed one. What you lose is brand and model precision, because the only evidence is the description.',
  },
  {
    q: 'What information makes the results better?',
    a: 'Brand, model, size or capacity, quality tier, age and quantity, in that rough order of value. "Sofa" prices as a generic sofa; "Pottery Barn Andes sectional, 3-seat, 6 years old" prices as that. Receipts, purchase histories and manuals are worth digging out before the list is built.',
  },
  {
    q: 'Does the list go through staging like photographs do?',
    a: 'No. Staging exists to turn photographs into items by grouping and review, so it has nothing to do here: a written row already is a line item and goes straight to the worksheet.',
  },
  {
    q: 'Does importing a list create claim lines immediately?',
    a: 'Not until the last step. Parsing, mapping and previewing create nothing at all — the preview is a true dry run. The import itself is capped at 500 rows per request and resumes from a failed chunk rather than starting over.',
  },
  {
    q: 'What happens to section headings in the list?',
    a: 'Rows that look like headings — "Master Bedroom", "Kitchen" — are flagged and pre-selected for removal, but never dropped silently. A heading left in the list gets priced as if it were property, and you would rather see that choice than have it made for you.',
  },
  {
    q: 'Is a no-photo inventory as strong as a photographed one?',
    a: 'No, and we will not present it as equivalent. Item-level photographs establish what the property actually was; a description establishes what someone remembers it was. The no-photo route exists because total losses are real, not because it is as good.',
  },
]

const CRUMBS = [{ to: '/contents-claims/without-photos', t: 'Pricing without photos' }]

export default function WithoutPhotosPage() {
  return (
    <div className="k-landing">
      <Seo path="/contents-claims/without-photos" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Price a Contents Claim When the Photos Are Gone"
          lede="For total losses and catastrophic fires, Kevin prices from item descriptions — a typed list, a restoration company's inventory, or an exported spreadsheet — when usable photographs no longer exist."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="Can a contents claim be priced without photographs?"
          answer="Yes — from a written inventory, where each described row is researched and priced like a photographed item would be, with the source link kept on the line."
        >
          <p>
            This is a separate workflow, not the photo-based engine with the photographs removed.
            The engine identifies property from evidence; here there is no evidence beyond the
            description, so the specificity of the result depends on the specificity of the list.
            That is a real limitation and worth saying plainly before anyone relies on it.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>When no-photo pricing is the right route</h2>
          <ul className="k-seolist">
            <li>A total fire loss where the contents and any photographs of them are gone.</li>
            <li>Property destroyed or disposed of before anyone documented it.</li>
            <li>A restoration company's or mover's inventory that exists only as a PDF.</li>
            <li>An insured reconstructing a list from memory, receipts and purchase histories.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>What to put in the list</h2>
          <ComparisonTable
            caption="The same item, described two ways"
            columns={['Field', 'Thin description', 'Useful description']}
            rows={[
              ['Item', 'Sofa', 'Pottery Barn Andes sectional, 3-seat, charcoal'],
              ['Brand and model', '—', 'Brand plus model or collection name where known'],
              ['Size or capacity', '—', '3-seat; 65-inch; 25 cu. ft.'],
              ['Quality tier', '—', 'Mid-range, premium, builder-grade'],
              ['Age', '—', 'Years owned, which is what drives depreciation'],
              ['Quantity', '1', 'Exact count, since the line total multiplies by it'],
            ]}
          />
          <p>
            Age here means <strong>how long the insured owned it</strong>, not when the model was
            released. That is the number the depreciation schedule needs.
          </p>
        </section>

        <section className="k-seosec">
          <h2>How the import runs</h2>
          <p>
            Parsing happens on the server, because real inventories arrive as PDFs rather than tidy
            spreadsheets. You then map the columns Kevin found to the fields it needs, preview the
            result, and import.
          </p>
          <ComparisonTable
            caption="Four steps; only the last one creates anything"
            columns={['Step', 'What happens', 'Creates line items?']}
            rows={[
              ['Parse', 'The file is read server-side and columns are detected', 'No'],
              ['Map', 'You confirm which column is description, room, quantity, age', 'No'],
              ['Preview', 'A true dry run against the mapped rows', 'No'],
              ['Import', 'Rows become claim lines, 500 per request, resumable', 'Yes'],
            ]}
          />
          <EvidenceCallout>
            <p>
              Room stays its own column rather than being folded into the description, because{' '}
              <strong>the description doubles as the search query</strong> — "Kitchen, blender"
              searches for something different than "blender" does.
            </p>
          </EvidenceCallout>
          <p>
            Rows that look like section headings are flagged and pre-selected for removal, never
            dropped for you: a heading left in the list would be priced as property. The
            confirmation step states how many searches the import will run — two per priced item —
            rather than just the row count, because that is what it costs.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Photo-based versus written</h2>
          <ComparisonTable
            caption="Two routes to the same worksheet"
            columns={['', 'From photographs', 'From a written list']}
            rows={[
              ['Evidence', 'The item itself, in frame', 'The description someone wrote'],
              ['Identification', 'Brand and model from badges, plates and barcodes', 'Only what the description states'],
              ['Grouping', 'Several shots become one line', 'Not applicable; a row is a line'],
              ['Staging', 'Cluster, review, promote', 'Skipped entirely'],
              ['Pricing', 'Priced from a listing, source on the row', 'Priced from a listing, source on the row'],
              ['Depreciation', 'Class and age', 'Class and age'],
              ['Export', 'Identical', 'Identical'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Where it lands</h2>
          <ShotFigure
            src="/marketing/worksheet-review-2x.webp"
            alt="The worksheet showing imported contents lines priced with sales tax, age, depreciation and actual cash value"
            label="kevin.co/claims/…/worksheet"
            caption="Imported rows land in the same worksheet as photographed items, and export the same way."
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
              to: '/guides/how-to-price-contents-claims-faster',
              t: 'How to price contents claims faster',
              d: 'The five bottlenecks, and where automation should stop.',
            },
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'The eight stages the photo-based route runs through.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'What makes a comparable valid, and when resale is used.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: '2,000 line items a month included. First 250 free, no deadline.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
