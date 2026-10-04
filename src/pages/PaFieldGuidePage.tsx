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
 * /guides/public-adjuster-contents-inventory — batch 2, spec page 16.
 *
 * Three corrections to the brief, all against locked rules:
 *
 *  1. THE EIGHT-STAGE PIPELINE IS GONE. The brief reproduces
 *     upload/extract/cluster/review/promote/price/depreciate/export with a
 *     section explaining each one. That is the same recipe the owner had
 *     trimmed off /methodology on 2026-10-03 for handing a competitor the
 *     process. What a reader actually needs is the ORDER OF THE TWO THINGS
 *     THAT MATTER -- photographs are reviewed before they become line items,
 *     and pricing happens after identification -- which is stated without the
 *     stage list, the extraction signals or the grouping mechanics.
 *  2. Depreciation IS built on XactContents categories and sub-categories
 *     (owner, 2026-10-04, confirmed against GET /v1/depreciation-rules, where
 *     pcs_code is the Xactimate PCS code): the class and the item's age select
 *     the rate, across 31 categories and 87 sub-lines. Say that plainly -- but
 *     using a taxonomy is not a relationship with its owner, so the
 *     non-affiliation guard from /xactcontents-alternative still applies.
 *  3. The brief lists "insurance contents category" and "useful-life basis" as
 *     fields a line item should carry. True internally, but rule 18 keeps both
 *     OFF the adjuster-facing export -- so the page says the software carries
 *     them and the export carries the parity columns.
 *
 * Rule 10: the page never says how a listing is chosen among comps. It says
 * the price comes from a listing and the Source Link points at it.
 */

const FAQS: Faq[] = [
  {
    q: 'What information should a public adjuster include in a contents inventory?',
    a: 'Quantity, a description specific enough to price, brand and model where the evidence supports them, room, age, the replacement cost, the source behind that cost, depreciation, and the resulting RCV and ACV. Not every line carries every field — a bath towel has no model number — and the goal is the highest level of detail the evidence actually supports.',
  },
  {
    q: 'Should every item have a make and model?',
    a: 'No. Some property cannot reasonably be identified that far, and a model number invented to make a spreadsheet look complete is worse than a blank: it is the kind of detail a reviewer checks first. Make and model belong on a line when a plate, a badge, a barcode or a receipt establishes them.',
  },
  {
    q: 'Can multiple photos support one contents line item?',
    a: 'Yes, and on a careful pack-out they usually do — a wide shot establishes what the item is, a close-up of the plate establishes the model, another frame shows the damage. All three describe one piece of property, and an inventory that turned them into three televisions would be wrong in a way that is very easy for a reviewer to spot.',
  },
  {
    q: 'Should depreciation be the same for every item?',
    a: 'No. Useful life differs sharply by class — footwear and furniture do not age at the same rate — so a single blanket percentage across an inventory is the first thing to come apart under review. Depreciation should follow the class and the age of each item.',
  },
  {
    q: 'Can Kevin export to XactContents?',
    a: 'Yes. The export is an Xactimate (Excel) .xlsx written in the XactContents template, alongside a room-by-room PDF. Every derived cell is a computed number rather than a formula, because the importer rejects formulas. Kevin is not affiliated with or endorsed by Verisk; it writes a file their importer reads.',
  },
  {
    q: 'How specific does a description need to be?',
    a: 'Specific enough that a reviewer can tell whether the replacement is reasonable. The test is whether price moves with the detail: brand, size, capacity, generation and quality tier all move price on a television, so leaving them out makes the line harder to defend. On a generic kitchen utensil they do not, and the detail is not worth inventing.',
  },
]

const CRUMBS = [
  { to: '/guides/public-adjuster-contents-inventory', t: 'Contents inventory field guide' },
]

export default function PaFieldGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/public-adjuster-contents-inventory"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Public Adjuster Contents Inventory Field Guide"
          lede="A contents schedule is read by someone who was not there. This is what each line has to establish on its own — and the part that gets expensive at four hundred items."
          byline="Kevin Godfrey, Kevin"
          updated="4 October 2026"
        />

        <DirectAnswer
          question="What makes a contents inventory defensible?"
          answer="Each line should answer four questions without anyone having to reconstruct it: what the item was, what replaces it, where the replacement price came from, and how the ACV was reached."
        >
          <p>
            The technical requirements are rarely the hard part. The hard part is performing the
            same process accurately on the four-hundredth item as on the first — the same
            specificity in the description, the same standard for a comparable, the same schedule
            applied to the same class. Consistency is what a large inventory is actually judged on,
            and consistency is what hand-working a thousand lines over three weeks quietly destroys.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What belongs on a line</h2>
          <p>
            Not every line carries every field, and it should not pretend to. A bath towel has no
            model number. A refrigerator, a camera, a power tool or a television usually does.
          </p>
          <ComparisonTable
            caption="The fields that carry the weight, and what each one is for"
            columns={['Field', 'Why a reviewer wants it']}
            rows={[
              ['Quantity', 'Multiplies the whole line; a quantity error is a total error'],
              ['Description', 'The thing being valued, specific enough to judge the replacement'],
              ['Brand and model', 'Where evidence supports them — the strongest identification available'],
              ['Room', 'Locates the property and groups the schedule the way the loss happened'],
              ['Age', 'How long the insured owned it, which is what drives depreciation'],
              ['Replacement cost', 'What it costs to buy the replacement now'],
              ['Source', 'The listing behind that figure, so the price can be checked'],
              ['Depreciation and ACV', 'The arithmetic, reproducible by hand from the row'],
            ]}
          />
          <p>
            Underneath those sits the classification. Each line is assigned an XactContents
            category and sub-category, and that class together with the age is what selects the
            depreciation rate — 31 categories and 87 sub-lines, because footwear, furniture and
            collectible media do not age at the same speed.
          </p>
        </section>

        <section className="k-seosec">
          <h2>A description is specific enough when it can be priced</h2>
          <ComparisonTable
            caption="The same television, two ways"
            columns={['', 'Thin', 'Supportable']}
            rows={[
              ['Description', 'Television — $1,299', 'Samsung 65-inch OLED 4K smart television, S90D — $1,299'],
              ['What a reviewer can judge', 'Whether $1,299 sounds high', 'Whether that model is the right replacement'],
              ['What happens on review', 'A question comes back', 'The line is checked against its source and stands'],
            ]}
          />
          <p>
            The rule of thumb is to look at what moves the price. Brand, size, capacity, generation,
            material and quality tier all move the price of a television, so omitting them makes the
            line weaker. On a generic utensil they do not, and inventing them is worse than leaving
            them out.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Several photographs, one item</h2>
          <p>
            One frame rarely carries everything. A strong set for an appliance is often the item
            itself, a close-up of the manufacturer, the model label, a feature that affects value,
            and a wider shot showing where it sat. Those are five photographs of one piece of
            property.
          </p>
          <EvidenceCallout>
            <p>
              <strong>Photographs are reviewed before they become line items.</strong> In Kevin they
              land in a staging step where related frames are proposed as one item and you confirm,
              merge or split before anything becomes a claim line. Three shots of the same
              television do not become three televisions — and an inventory reporting more items
              than photographs is a failure a desk reviewer notices immediately.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Keep evidence and inference apart</h2>
          <ComparisonTable
            caption="Four different kinds of certainty on one line"
            columns={['Source of the fact', 'Example', 'How firm it is']}
            rows={[
              ['Visible in the photograph', 'A Samsung television', 'Observed'],
              ['Read off a label', 'Model QN65S90D', 'Observed, and checkable'],
              ['Stated by the insured', 'Owned about two years', 'Reported — and what depreciation runs on'],
              ['Replacement research', 'A current comparable at a major retailer', 'Researched, with the listing kept'],
            ]}
          />
          <p>
            The goal is not to make every field look certain. It is to reflect what can actually be
            established — which is also why a line Kevin cannot identify confidently comes back with
            an empty, editable field rather than a plausible guess. A wrong description that reads
            well is the one that survives review and causes trouble later.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Establishing the replacement</h2>
          <p>
            Once the property is identified, the question becomes what it reasonably costs to
            replace. Where the exact item is still sold, that is the answer. Where it is not,
            claims practice works down a familiar ladder: the manufacturer's successor, then a
            current equivalent from the same maker, then a like-kind-and-quality replacement, and
            for property that ordinary retail no longer represents, the resale market.
          </p>
          <p>
            A current product is not a valid comparable merely because it appeared in a search
            result. The replacement has to match the characteristics that set the original's value —
            which is the whole subject of{' '}
            <a href="/guides/discontinued-items-insurance-claims">
              pricing a discontinued item
            </a>
            .
          </p>
        </section>

        <section className="k-seosec">
          <h2>Age is a claim fact, not a manufacturing date</h2>
          <p>
            These come apart more often than people expect. An insured who bought a three-year-old
            collectible one year before the loss has owned it for one year. The age on the schedule
            should reflect the claim, because that is the number the depreciation schedule consumes
            — and on a long-lived class the difference between one year and four is most of the ACV.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What still deserves your attention</h2>
          <p>
            Automation earns its place by removing repetition, not judgment. The lines worth slowing
            down on are the ones where a small error is expensive: unclear model numbers, luxury
            goods, collectibles, discontinued products, unusual quantities, products with several
            close variants, and anything whose price sits far from its neighbours.
          </p>
          <p>
            Jewelry, fine arts, firearms and furs are never auto-priced in Kevin at all — they carry
            coverage limits that turn on judgment, so they reach you unpriced by design.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The goal is not more rows</h2>
          <p>
            A longer spreadsheet is not a better one. A strong line answers four questions — what
            was the item, what replaces it, where did the price come from, how was the ACV reached —
            and a strong inventory answers them the same way a thousand times. That repetition is
            the part worth handing to software.
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
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'The ten things a desk adjuster checks, in the order they check them.',
            },
            {
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'What a room photograph can and cannot establish.',
            },
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'Useful life by class, and why it runs to 100%.',
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
