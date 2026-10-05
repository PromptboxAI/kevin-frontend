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
 * /guides/contents-claim-qa-checklist — batch 4, spec page 26.
 *
 * The brief lists thirty numbered checks. Thirty headings is a worse checklist
 * than six groups of five: nobody works down a thirty-item list, and on screen
 * it reads as a wall. Same checks, grouped by what you are actually looking at
 * — the item, the price, the arithmetic, the exceptions, the file — which is
 * also the order you can do them in.
 *
 * Rule 10 and the owner's trim: "Kevin.co uses claim-wide image deduplication
 * and candidate grouping before promotion" describes the mechanism. The page
 * states the OUTCOME an adjuster can check (a duplicate photo does not become
 * a duplicate line) without the method.
 *
 * Tax: the money chain is tax-inclusive — depreciation applies to the
 * tax-inclusive RCV — so the checklist says to reconcile it that way.
 */

const FAQS: Faq[] = [
  {
    q: 'What is a contents claim QA review?',
    a: 'A pass over the finished schedule before it leaves your hands, checking that each line identifies its item, supports its quantity, prices from something comparable, depreciates consistently and reconciles arithmetically. It is cheaper than answering the same questions one at a time after a desk review.',
  },
  {
    q: 'Should every line be checked to the same depth?',
    a: 'No, and a schedule of several hundred lines makes that impossible anyway. Routine property can be scanned; high-value, unusual, discontinued and collectible lines are where a few minutes each is worth spending, because that is where an error is expensive.',
  },
  {
    q: 'What are the most common contents inventory mistakes?',
    a: 'Vague descriptions, duplicated items, replacements that are not really comparable, prices with no source, depreciation applied inconsistently, and quantity errors. Most of them scale with the size of the claim rather than appearing once.',
  },
  {
    q: 'Does Kevin check any of this automatically?',
    a: 'Some of it is prevented rather than checked: a photograph already on the claim resolves as a duplicate, related frames are proposed as one item before anything becomes a line, depreciation is computed server-side from class and age so it cannot drift between rows, and a line Kevin cannot price arrives blank rather than guessed. The judgment calls are still yours.',
  },
  {
    q: 'How do I check the arithmetic quickly?',
    a: 'Take one line and reproduce it by hand: unit cost × quantity, plus tax, less depreciation, equals ACV. Depreciation applies to the tax-inclusive figure, so a line that foots any other way is worth understanding before the whole schedule inherits it.',
  },
  {
    q: 'What should I do about lines that are still incomplete?',
    a: 'Leave them visible rather than filling them in. An explicit exception list — missing age, missing model, needs a better photograph, needs a source — is far easier to defend than a schedule that looks complete because the gaps were papered over.',
  },
]

const CRUMBS = [{ to: '/guides/contents-claim-qa-checklist', t: 'QA checklist' }]

export default function QaChecklistGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/contents-claim-qa-checklist"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Contents Claim QA Checklist"
          lede="A schedule can look finished and still carry the same mistake four hundred times. This is the pass to make before it leaves your hands, grouped by what you are actually looking at."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="What should be checked before a contents schedule is submitted?"
          answer="That every line identifies its item, supports its quantity, prices from something genuinely comparable with the source attached, classifies and depreciates consistently, and reconciles from the row to the total."
        >
          <p>
            The test for any single line is one question: <strong>could another adjuster tell what
            the item was, what replaces it, where the price came from and how the ACV was
            reached?</strong> Everything below is a way of failing that question earlier than a desk
            reviewer would.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>1 &middot; The item</h2>
          <ComparisonTable
            caption="Identity, quantity and the evidence behind them"
            columns={['Check', 'What you are looking for']}
            rows={[
              ['Description', 'Specific enough to price — and not more specific than the evidence supports'],
              ['Make and model', 'Present where a plate, badge, barcode or receipt establishes them'],
              ['Variant', 'Size, capacity, generation and finish, where they move the price'],
              ['Quantity', 'One item, several identical items, or a set — and the line says which'],
              ['Photo support', 'Several frames of one item became one line, not several'],
              ['Duplicates', 'The same property is not claimed twice, across rooms or batches'],
            ]}
          />
          <p>
            In Kevin a photograph already on the claim resolves as a duplicate rather than arriving
            twice, and related frames are proposed as one item for you to confirm before anything
            becomes a line. The effect to check for is simple: the item count never exceeds the
            photograph count.
          </p>
        </section>

        <section className="k-seosec">
          <h2>2 &middot; The price</h2>
          <ComparisonTable
            caption="Where most of the argument lives"
            columns={['Check', 'What fails it']}
            rows={[
              ['Comparability', 'A replacement matched on one characteristic and not the rest'],
              ['Bundles and sets', 'A multi-pack pricing a single item, or the reverse'],
              ['Form factor', 'Cordless priced as corded, freestanding as built-in, sectional as sofa'],
              ['Duplicate listings', 'One product from nine sellers treated as nine comparables'],
              ['The right market', 'Resale used where retail exists, or retail forced on a discontinued item'],
              ['Outliers', 'A clearance or liquidation price standing in for replacement cost'],
              ['The source itself', 'A link that no longer shows the product the line describes'],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>Open a sample of source links before you send it.</strong> Pages get updated,
              variant selectors reset, and listings sell out. A link that no longer supports its
              line is worse than no link, because it invites the reviewer to check the next one.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>3 &middot; The arithmetic</h2>
          <ComparisonTable
            caption="Reproduce one line by hand; the rest follow the same shape"
            columns={['Check', 'What it should do']}
            rows={[
              ['Content class', 'Consistent with similar items elsewhere in the schedule'],
              ['Age', 'How long the insured owned it, not the model year'],
              ['Identical ages', 'A whole category at exactly one year old is worth a second look'],
              ['Depreciation', 'Follows from class and age, the same way on every row'],
              ['RCV', 'Unit cost × quantity, plus tax'],
              ['ACV', 'RCV less depreciation — applied to the tax-inclusive figure'],
              ['Totals', 'The schedule reconciles from the rows to the final number'],
            ]}
          />
          <p>
            Depreciation in Kevin is computed server-side from the class and the age, so the
            worksheet and the export cannot disagree and line 400 is treated like line 4. What is
            worth checking is the inputs: a wrong class or a wrong age produces a perfectly
            consistent wrong answer.
          </p>
        </section>

        <section className="k-seosec">
          <h2>4 &middot; The exceptions</h2>
          <p>
            This is where review time actually belongs. The lines worth slowing down on are the ones
            where a small error is expensive or hard to walk back:
          </p>
          <ul className="k-seolist">
            <li><strong>High-value property</strong> — model, variant, configuration and condition.</li>
            <li><strong>Collectibles</strong> — edition, condition, packaging, completeness, and which market.</li>
            <li><strong>Discontinued items</strong> — whether the replacement path makes sense and is visible.</li>
            <li><strong>Clothing and footwear</strong> — premium labels preserved rather than averaged into a group.</li>
            <li><strong>Thin pricing</strong> — anything priced from very little, or not priced at all.</li>
            <li><strong>Outliers</strong> — a price a long way from its neighbours with nothing on the row explaining it.</li>
          </ul>
          <p>
            Appraisal classes reach you unpriced by design — jewelry, firearms, fine arts, furs,
            fine china and graded trading cards — so they are on this list whether or not you put
            them there.
          </p>
        </section>

        <section className="k-seosec">
          <h2>5 &middot; The file</h2>
          <ComparisonTable
            caption="Before the export leaves"
            columns={['Check', 'Why']}
            rows={[
              ['Line numbers', 'Stable — an export already sent cites them, so they are never renumbered'],
              ['Room and location', 'Correct, and the same property is not sitting in two rooms'],
              ['Incomplete lines', 'Listed as exceptions rather than quietly filled in'],
              ['The right claim', 'Right claim, right insured, right format'],
              ['Format', 'Xactimate (Excel) .xlsx in the XactContents template, or the PDF'],
            ]}
          />
          <p>
            Kevin never blocks an export on any of this. The dialog tells you what needs attention
            and the download stays live, because whether to send it is your call rather than the
            software&rsquo;s.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The one-line test</h2>
          <p>
            If you only do one pass, do this one: pick ten lines at random and ask whether a
            stranger could follow each from the item to the ACV without asking you a question. The
            schedule is as strong as the weakest line somebody happens to open.
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
              to: '/guides/contents-line-items-rejected',
              t: 'Why line items get questioned',
              d: 'The twelve reasons a line comes back, and what the reviewer is usually asking for.',
            },
            {
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'The ten checks a desk adjuster applies to a schedule.',
            },
            {
              to: '/guides/source-pricing-insurance-contents',
              t: 'Documenting source pricing',
              d: 'What a source has to show, and why the URL is the least of it.',
            },
            {
              to: '/guides/large-contents-inventory-500-items',
              t: 'Building a 500+ item claim',
              d: 'Why small error rates compound at scale.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
