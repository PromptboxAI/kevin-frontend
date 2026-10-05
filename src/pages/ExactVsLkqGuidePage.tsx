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
 * /guides/exact-match-vs-like-kind-quality — batch 3, spec page 21.
 *
 * This page is the STANDARD; /guides/discontinued-items-insurance-claims is
 * the WORKFLOW. They share a hierarchy and would otherwise duplicate each
 * other, so this one answers "what makes a replacement equivalent" and links
 * across for "what to do when the item is gone".
 *
 * Rule 10, as narrowed 2026-10-04: the brief's "Kevin.co's Approach" section
 * listed the filters the engine applies (wrong variant, multi-item set, wrong
 * form factor, unrelated generation, duplicate listings) as OUR pipeline. The
 * traps themselves are useful to an adjuster and stay -- as things to watch
 * for when judging a comparable. What is gone is the claim that they describe
 * how our engine decides, which is the method and is internal.
 *
 * The three valuation bases on the payload (retail comp, like-kind new,
 * manual) map onto the industry hierarchy below but are not the same thing,
 * and the page does not pretend they are.
 */

const FAQS: Faq[] = [
  {
    q: 'Is an exact match always required?',
    a: 'No, and insisting on one would make most older property unvaluable. An exact replacement is simply the strongest answer when the same product is still sold. Once it is not, the question becomes which current product preserves what gave the original its value.',
  },
  {
    q: 'What is the difference between a successor model and an LKQ replacement?',
    a: 'A successor is the manufacturer’s own direct replacement in the same lineup — usually the next model year, often the closest thing to an exact match. A like-kind-and-quality replacement may come from another line or another maker entirely, and has to be argued on characteristics rather than on lineage.',
  },
  {
    q: 'Can a cheaper product still be like kind and quality?',
    a: 'It can, if it genuinely matches on the characteristics that set the original’s value. Price is evidence of equivalence, not proof of it — and a cheaper product that drops a tier, a technology or a capacity is not the same property at a discount.',
  },
  {
    q: 'Can a more expensive replacement be appropriate?',
    a: 'Yes. If the only current product that matches the original’s quality and characteristics costs more than the original did, that is the replacement cost. The test is equivalence, not whether the number moved in a convenient direction.',
  },
  {
    q: 'Does Kevin pick the most expensive comparable?',
    a: 'No. The price on a line is one listing’s price rather than a blend of several, and the Source Link points at that listing so you can see exactly which product it is. If it is the wrong product, the fix is to sharpen the description and re-price, or enter your own figure with your own source.',
  },
  {
    q: 'How much does the reasoning matter?',
    a: 'In proportion to how far the replacement sits from the original. An exact match needs no explanation. A like-kind substitute from a different manufacturer needs the characteristics to be visible on the line, because that is what a reviewer will ask about first.',
  },
]

const CRUMBS = [
  { to: '/guides/exact-match-vs-like-kind-quality', t: 'Exact match vs like kind and quality' },
]

export default function ExactVsLkqGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/exact-match-vs-like-kind-quality"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Exact Match vs Like Kind and Quality"
          lede="Four words do most of the arguing on a contents claim. This is what separates an exact replacement, a successor model and a like-kind substitute — and where each one stops being defensible."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="What is the difference between an exact match and like kind and quality?"
          answer="An exact match is the same product, still obtainable. Like kind and quality is a replacement that preserves what materially defined the original — quality, function and the characteristics that set its price — when the same product no longer exists."
        >
          <p>
            The phrase does the most damage when it is treated as permission rather than as a
            standard. &ldquo;Like kind and quality&rdquo; is a test a replacement has to pass, not a
            label that makes any similar-looking product acceptable.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The hierarchy</h2>
          <ComparisonTable
            caption="Standard claims practice, strongest first"
            columns={['Level', 'Use it when', 'What it has to carry']}
            rows={[
              ['Exact model', 'The same product is still obtainable', 'Confirmation it is the same variant, not a near-name'],
              ['Direct successor', 'The maker replaced it in the lineup', 'A check that the tier did not move with the model year'],
              ['Same-brand equivalent', 'No successor, but a comparable current product', 'Specification match, not just product family'],
              ['Like kind and quality', 'The original maker offers nothing equivalent', 'An argument from characteristics — this is where downgrades creep in'],
              ['Resale market', 'Ordinary retail no longer represents the item', 'Condition and completeness, which now drive the price'],
            ]}
          />
          <p>
            Each step down costs something in defensibility, which is the reason to take the highest
            one the evidence supports rather than the most convenient.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Same size is not the same item</h2>
          <p>
            A 65-inch OLED and a 65-inch entry-level LED share one characteristic, and it is not the
            one carrying the value. Panel technology, processing, build and product tier all move
            the price, and a reviewer comparing the two will see the substitution immediately.
          </p>
          <ComparisonTable
            caption="The same trap across categories"
            columns={['Category', 'Where the value actually sits']}
            rows={[
              ['Televisions', 'Panel technology and tier, not screen size alone'],
              ['Appliances', 'Capacity, finish and feature set, not external dimensions'],
              ['Furniture', 'Solid hardwood against veneer or composite'],
              ['Tools', 'Professional against consumer line; battery platform'],
              ['Apparel', 'Label and construction, not garment type'],
              ['Electronics', 'Generation and configuration, not category'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>What a weak comparison looks like</h2>
          <EvidenceCallout>
            <p>
              The failure is almost always the same shape: <strong>one characteristic is matched and
              treated as if it were all of them.</strong> Size without tier. Brand without
              generation. Category without configuration.
            </p>
          </EvidenceCallout>
          <ComparisonTable
            caption="Worth checking before a comparable is accepted"
            columns={['Problem', 'Why a reviewer sends it back']}
            rows={[
              ['Matched on size alone', 'Ignores the characteristics that set the price'],
              ['Tier ignored', 'A premium item replaced with entry-level, or the reverse'],
              ['Wrong generation', 'Prices a successor or a predecessor, not the item'],
              ['A set instead of one item', 'Inflates the line by the multiple'],
              ['An accessory for the product', 'A mount is not the television'],
              ['Resale used where retail exists', 'A used price where a new replacement is available'],
              ['Cheapest vaguely similar result', 'Equivalence was never actually tested'],
            ]}
          />
          <p>
            None of these is about making the number bigger or smaller. The goal is a replacement
            that survives being looked at.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Where Kevin sits</h2>
          <p>
            Identification comes before pricing, because a replacement can only be judged against an
            item that has actually been established. Each engine-priced line carries one listing&rsquo;s
            price rather than a blend of several, with the Source Link pointing at that listing —
            so the comparable is visible rather than implied, and a substitution can be checked in
            one click.
          </p>
          <p>
            Where the item is discontinued and the resale market is the honest source, the line is
            priced there and labelled as resale. Where nothing can price it confidently, the cell
            arrives blank and editable rather than filled with a plausible guess.
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
              to: '/guides/discontinued-items-insurance-claims',
              t: 'Pricing a discontinued item',
              d: 'The same hierarchy, applied when the item is no longer sold.',
            },
            {
              to: '/guides/replacement-cost-comparable',
              t: 'Finding a defensible comparable',
              d: 'What makes a listing usable as evidence.',
            },
            {
              to: '/guides/high-value-contents-claims',
              t: 'Documenting high-value property',
              d: 'Where a small identification error costs the most.',
            },
            {
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'Comparability is where most of the argument is.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
