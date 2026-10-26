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
 * /guides/xactcontents-import-template — the "XactContents import template"
 * query, a gap the 2026-10-26 outside review named (design/notes/
 * grok-review-triage.md).
 *
 * Every column, total and rule on this page is the export contract in
 * kevin-backend/FRONTEND.md (`GET /v1/claims/{id}/export?format=xlsx`), not
 * a description of Verisk's own file. The page says what KEVIN writes and why
 * an importer accepts it; it never claims to reproduce Verisk's template, and
 * it carries the not-affiliated line the alternative page does.
 *
 * Domain rules this page leans on: 2 (Excel, never XML), 2b (static values,
 * no formulas), 18 (PCS code in the .xlsx, bare-number Age, per-line tax), 10
 * (a single listing, never the selection method), 12 (unpriced lines are
 * blank on screen, 0.00 in the file).
 */

const FAQS: Faq[] = [
  {
    q: 'What is an XactContents import template?',
    a: 'It is a pre-formatted Excel workbook, one row per contents line, that XactContents reads on import. Xactimate and XactContents take contents as .xlsx; whole estimates travel as .ESX archives. There is no XML format for this.',
  },
  {
    q: 'Can I type formulas into the spreadsheet?',
    a: 'Do not. The importer breaks on formulas, so every derived cell in Kevin’s export (extended cost, tax, RCV + tax, depreciation, ACV and the totals) is written as a computed number. Recalculation happens in Kevin, and the file is a snapshot of what it produced.',
  },
  {
    q: 'If I change an age in the exported file, does depreciation update?',
    a: 'No, because the file holds no formulas. Depreciation comes from the content class’s schedule, which a spreadsheet cell cannot express. Change the age on the worksheet in Kevin and export again.',
  },
  {
    q: 'What goes in the Content Class column?',
    a: 'The Xactimate PCS code for the item’s class, for example CMP for electronics, APP for major appliances and JWL for jewelry. That code is how XactContents categorises the line on import.',
  },
  {
    q: 'What happens to a line Kevin could not price?',
    a: 'On the worksheet its price cells are blank for you to fill in. In the exported file its money cells read 0.00 rather than a dash or an empty cell, so totals and any sums downstream still add up.',
  },
  {
    q: 'Does the file include the source behind each price?',
    a: 'Yes. The last column holds the word Link, hyperlinked to the listing the price came from. It is blank where a line has no source, such as a price you typed in without attaching a URL.',
  },
  {
    q: 'Is Kevin affiliated with Verisk?',
    a: 'No. Kevin is not affiliated with, endorsed by or certified by Verisk. Xactimate and XactContents are their products; Kevin writes a worksheet in a format their importer reads.',
  },
]

const CRUMBS = [{ to: '/guides/xactcontents-import-template', t: 'XactContents import template' }]

export default function XactcontentsImportTemplateGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/xactcontents-import-template"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="The XactContents Import Template: Columns, Totals and the Rules That Break an Import"
          lede="XactContents imports contents as an Excel workbook: one row per line, in a fixed column order, with numbers where numbers belong. Here is every column Kevin writes, and the mistakes that stop a file from importing."
          byline="Kevin Godfrey, Kevin"
          updated="26 October 2026"
        />

        <DirectAnswer
          question="What format does XactContents import contents in?"
          answer="A pre-formatted .xlsx workbook, one row per contents line, with static values in every cell and no formulas."
        >
          <p>
            Xactimate and XactContents take contents lists as Excel. Whole estimates move as .ESX
            archives, and programmatic integration runs through XactAnalysis. There is no XML route
            for a contents list. The workbook has to land as numbers, text and codes the importer
            can read without evaluating anything.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The columns, in order</h2>
          <p>
            Kevin’s export uses the same column order as the worksheet on screen, so the file and the
            app present one shape. A TOTALS row closes the sheet.
          </p>
          <ComparisonTable
            caption="Kevin’s .xlsx export, left to right"
            columns={['Column', 'What it holds']}
            rows={[
              ['#', 'Line number. It never changes once a line exists, so an export already sent still matches.'],
              ['Room/Area', 'Free text: the room the item came from.'],
              ['Qty', 'Whole number of units.'],
              ['Description', 'The inventory line as the adjuster left it.'],
              ['Make/MFR', 'Manufacturer or brand.'],
              ['Model #', 'Model number where one could be read or found.'],
              ['Content Class', 'The Xactimate PCS code for the class: CMP, APP, JWL and so on.'],
              ['Unit Cost', 'Replacement cost of one unit, before tax.'],
              ['Extended Cost', 'Unit Cost × Qty, still before tax.'],
              ['Sales Tax', 'Tax on the extended cost at the rate for the loss address.'],
              ['RCV + Tax', 'Extended Cost + Sales Tax.'],
              ['Age (yrs)', 'A bare number such as 2, never “2y”, so it lands as a number.'],
              ['% Depreciation', 'From the class’s schedule for that age.'],
              ['$ Depreciation', 'RCV + Tax × % Depreciation.'],
              ['ACV', 'RCV + Tax − $ Depreciation.'],
              ['Source Link', 'The word Link, hyperlinked to the listing behind the unit cost.'],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>Unit Cost is not totalled.</strong> Adding per-unit prices across different
              items produces a meaningless figure. Extended Cost, Sales Tax, RCV + Tax, $ Depreciation
              and ACV all total.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>How a line foots</h2>
          <p>
            Tax is applied per line, and depreciation is applied to the tax-inclusive figure. So tax
            sits inside ACV rather than being added after it, and two identities hold on every row:
          </p>
          <ComparisonTable
            caption="Identities every row satisfies"
            columns={['Check', 'Holds because']}
            rows={[
              ['Extended Cost + Sales Tax = RCV + Tax', 'Tax is a breakout of what is already inside RCV + Tax.'],
              ['RCV + Tax − $ Depreciation = ACV', 'Depreciation comes off the tax-inclusive replacement cost.'],
            ]}
          />
          <p>
            A reviewer reconciling the file by adding tax to ACV will be off by the tax on the
            depreciated portion. The <a href="/guides/rcv-vs-acv-personal-property">RCV vs ACV guide</a>{' '}
            walks through the arithmetic.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What breaks an import</h2>
          <ComparisonTable
            caption="Common causes, and what Kevin writes instead"
            columns={['Problem', 'Why it fails', 'What Kevin writes']}
            rows={[
              ['Formulas in derived cells', 'The importer does not evaluate them.', 'Every derived cell and total as a computed number.'],
              ['Text in a number column', '“2y” or “$1,200.00 ea” is not a number.', 'Age as a bare number; money as numbers.'],
              ['Dashes or blanks for unpriced lines', 'A dash is text, and a blank breaks downstream sums.', '0.00 in every money cell of an unpriced line.'],
              ['Free-text categories', 'The class has to map to a PCS code.', 'The PCS code itself in Content Class.'],
              ['Several files or tabs', 'An import expects one contents sheet.', 'One workbook per export, never a zip or a bundle.'],
            ]}
          />
          <p className="k-seonote">
            Because the file holds no formulas, editing an age or a price inside it changes nothing
            else on the row. Make the change on the worksheet in Kevin and export again; the new file
            is a fresh snapshot.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The source behind each price</h2>
          <p>
            Each priced line’s unit cost is the price of a single listing rather than a blend of
            several, and the Source Link column points at that listing. It is a real hyperlink in the
            .xlsx, so a desk reviewer can open it from the cell. Where a line has no source, the cell
            is blank rather than a dead link.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Building the file without typing it</h2>
          <p>
            Typing a few hundred lines into this layout by hand is most of the work in a contents
            claim. Kevin builds the rows from claim photos or from a written inventory, prices,
            classifies and depreciates them, and lets you review every line before you export the
            .xlsx. Kevin is not affiliated with Verisk.
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
              d: 'What Kevin does, what it does not, and how the export lands.',
            },
            {
              to: '/guides/rcv-vs-acv-personal-property',
              t: 'RCV vs ACV on a contents claim',
              d: 'How a real line foots once tax is in it.',
            },
            {
              to: '/guides/useful-life-by-content-class',
              t: 'Useful life by content class',
              d: 'The schedule behind the % Depreciation column.',
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
