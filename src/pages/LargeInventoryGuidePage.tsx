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
  WorkflowDiagram,
  crumbJsonLd,
  faqJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /guides/large-contents-inventory-500-items — batch 3, spec page 25.
 *
 * Three things from the brief did not survive, all of them rules:
 *
 *  1. THE EIGHT-STAGE WORKFLOW. The brief closes with upload / extract /
 *     cluster / review / promote / price / depreciate / export as a numbered
 *     list. That is the recipe the owner reduced to four steps on 2026-10-05,
 *     site-wide. The shared WorkflowDiagram is used instead, so this page can
 *     never drift back out of step with the others.
 *  2. THE EXTRACTION SIGNAL LIST (visual labels, OCR, model numbers,
 *     barcodes). Same instruction. The POINT survives -- no single signal
 *     should be trusted alone -- without naming them.
 *  3. "WEEKS REDUCED TO HOURS." No published figure supports it. The homepage
 *     ribbon and the ROI calculator still disagree with each other about hours
 *     per claim, and that is unresolved with the owner, so this page makes NO
 *     time-multiplier claim. What it has instead is the one substantiated
 *     datum: 4,000+ carrier-facing lines in a single month, every line
 *     reviewed, from the owner's own practice.
 *
 * The capacity argument is the honest version of the time claim anyway: the
 * benefit is what the recovered hours let a firm take on, which does not
 * require a multiplier to be true.
 */

const FAQS: Faq[] = [
  {
    q: 'How long should a 500-item contents claim take?',
    a: 'There is no honest universal number — it depends on how good the photographs are, how much of the property is unusual, and how much of it needs judgment. What is predictable is where the hours go: grouping photographs, researching replacements, recording sources and applying depreciation consistently. Those are the parts worth automating.',
  },
  {
    q: 'Can AI build an entire contents inventory automatically?',
    a: 'It can remove most of the repetition, and it should not remove the review. Ambiguous identifications, high-value property, discontinued items and collectibles are exactly where an experienced adjuster is worth more than another search — and where a confident wrong answer does the most damage.',
  },
  {
    q: 'Should every photo become a line item?',
    a: 'No, and a workflow that assumes so produces a claim that is wrong in a very visible way. Several photographs routinely show one item: the item, its model plate, the damage. They are grouped into one line before anything is priced, which is why the item count on a claim is always at or below the photograph count.',
  },
  {
    q: 'What is the biggest bottleneck on a large claim?',
    a: 'Replacement-cost research, followed closely by organising the photographs and keeping depreciation consistent. Each is a few minutes on one item and a fortnight across a thousand — which is what makes them a workflow problem rather than a difficulty problem.',
  },
  {
    q: 'Does a large claim cost more to run?',
    a: 'Items are the metered dimension, not claims: Pro is $249 a month with 2,000 line items included, and claims themselves are unlimited. A line counts when it becomes a line, so excluded photographs and context shots cost nothing.',
  },
  {
    q: 'Is Kevin designed for public adjusters?',
    a: 'It was built out of one — the workflow comes from real public-adjuster practice rather than from a product spec, which is why the review step sits where it does rather than at the end.',
  },
]

const CRUMBS = [
  { to: '/guides/large-contents-inventory-500-items', t: 'Large contents inventories' },
]

export default function LargeInventoryGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/large-contents-inventory-500-items"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Build a 500+ Item Contents Claim"
          lede="A large contents claim is not hard because any one line is hard. It is hard because the same twelve decisions have to be made five hundred times, the same way each time."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="What makes a 500-item contents claim slow?"
          answer="Repetition, not difficulty. Identify, describe, find a replacement, check it, record the source, classify, depreciate, enter it — a few minutes an item, and a fortnight across a thousand."
        >
          <p>
            The answer is not to remove the review. It is to remove the repetition and spend the
            recovered attention on the lines that actually need a person &mdash; which is a
            different claim from &ldquo;AI does the inventory&rdquo;, and a more defensible one.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Where the hours actually go</h2>
          <ComparisonTable
            caption="Each one is minutes per item and weeks per claim"
            columns={['Bottleneck', 'What it costs at 500 items']}
            rows={[
              ['Organising photographs', 'Deciding which of 1,500 frames describe the same item'],
              ['Identification', 'Establishing what each item actually is'],
              ['Replacement research', 'A search, several tabs and a judgment, per line'],
              ['Recording the source', 'The step that gets skipped first when time is short'],
              ['Classification', 'A content class on every line, consistently'],
              ['Depreciation', 'Age and useful life applied the same way throughout'],
              ['Populating the schedule', 'Moving all of it into the file that gets sent'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Photographs are not line items</h2>
          <p>
            A 500-item claim can easily carry 1,500 to 3,000 photographs, because a careful pack-out
            shoots each item more than once &mdash; the item, the model plate, the damage. The first
            job on a large claim is therefore not pricing. It is working out which photographs
            belong together.
          </p>
          <EvidenceCallout>
            <p>
              Get this wrong and automation makes it worse, faster. <strong>If four photographs of
              one refrigerator become four refrigerators, pricing them produces four wrong lines
              instead of one right one</strong> &mdash; and a schedule with more items than
              photographs is the first thing a reviewer notices.
            </p>
          </EvidenceCallout>
          <p>
            This is why review sits before pricing rather than after it. Related frames are proposed
            as one item, you confirm or correct the grouping, and only then does anything become a
            claim line. Duplicates and context shots become no line at all.
          </p>
        </section>

        <section className="k-seosec">
          <h2>How it runs</h2>
          <WorkflowDiagram />
          <p>
            An item counts against your allowance when it becomes a line, not when a photograph is
            uploaded &mdash; so the size of the shoot is not the size of the bill, and a photograph
            you exclude costs nothing.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Scale amplifies small error rates</h2>
          <p>
            Five per cent of a 20-line inventory is one line, and you will probably catch it. Five
            per cent of a 1,000-line inventory is fifty lines, and you will not. The comparables
            worth catching are the usual ones &mdash; a bundle priced as a single item, the wrong
            capacity, the wrong generation, an accessory standing in for the product &mdash; and
            every one of them is cheaper to prevent than to find later.
          </p>
          <p>
            The same logic applies to consistency. Software applies the same rule to line 900 that
            it applied to line 9; a person working across three weeks does not, however careful they
            are. On a large schedule that consistency is worth more than speed.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Review what needs reviewing</h2>
          <p>
            The goal is not to review nothing. It is to review the right lines: ambiguous
            identifications, unusual products, high-value property, thin pricing results,
            discontinued items, collectibles, and anything whose price sits far from its neighbours.
            Appraisal classes never price automatically at all, so they arrive on that list by
            default.
          </p>
          <p>
            Everything ordinary should move through with very little hand work. That is the whole
            trade.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What this looked like in practice</h2>
          <p>
            Kevin was built out of real public-adjuster work rather than from a product spec. In a
            single month, more than four thousand carrier-facing contents line items were produced
            through it &mdash; with a person confirming the grouping on every one of them before it
            became a claim item.
          </p>
          <p>
            The useful benefit is capacity rather than a stopwatch figure. Hours returned to a firm
            become more claims prepared, less research outsourced, and fewer weekends spent in a
            spreadsheet &mdash; which is a change in what the practice can take on, not just a
            faster file.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Large claims still need judgment</h2>
          <p>
            No large inventory runs cleanly end to end. There will be poor photographs, missing model
            numbers, discontinued property, collectibles and genuinely hard valuation questions.
            Those are the lines an experienced adjuster should be spending time on &mdash; and the
            reason to clear the repetitive work out of the way is to make that time available.
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
              to: '/case-studies/4000-contents-line-items-30-days',
              t: '4,000+ line items in 30 days',
              d: "What one adjuster's month looked like, and what was reviewed on every line.",
            },
            {
              to: '/guides/how-to-price-contents-claims-faster',
              t: 'How to price contents claims faster',
              d: 'The five bottlenecks, and where automation should stop.',
            },
            {
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'Why consistency is what a large schedule is judged on.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Items are metered, not claims. First 250 free, no deadline.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
