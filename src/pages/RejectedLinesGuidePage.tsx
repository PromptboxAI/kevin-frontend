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
 * /guides/contents-line-items-rejected — batch 4, spec page 28.
 *
 * The brief's closing section ("How Kevin.co Reduces Common Line-Item
 * Problems") lists the engine's filtering behaviour: wrong bundles, wrong
 * variants, duplicate retailer results. That is the comp-selection method,
 * which rule 10 keeps internal. The TRAPS stay, because an adjuster checking a
 * comparable needs them -- what goes is the claim that they describe how we
 * decide.
 *
 * What Kevin can honestly be said to prevent is narrower and all
 * user-observable: a duplicate photograph does not become a duplicate line,
 * depreciation is computed server-side so it cannot drift between rows, and an
 * item that cannot be priced confidently arrives blank rather than guessed.
 */

const FAQS: Faq[] = [
  {
    q: 'Why do contents line items get reduced?',
    a: 'Most often because the line does not support the number rather than because the property did not exist: a vague description, a replacement that is not really comparable, a quantity nothing backs, a price with no source, or depreciation that does not match similar lines.',
  },
  {
    q: 'Can a line be questioned even with a source link?',
    a: 'Yes, and this is the most common surprise. A link to the wrong product is not evidence — it is a faster way to find the error. The comparable behind the URL still has to be the same property at the same tier and quantity.',
  },
  {
    q: 'Is a higher-priced replacement automatically wrong?',
    a: 'No. If the only current product that matches the original’s quality costs more than the original did, that is the replacement cost. What draws scrutiny is a higher price with nothing on the line explaining why that product is the comparable.',
  },
  {
    q: 'Should a questioned line be removed?',
    a: 'Usually not. The reviewer is normally asking for something — a clarified model, a better comparable, support for a quantity — and the right response is to answer it. Removing a line concedes property the insured owned.',
  },
  {
    q: 'What is the single most common avoidable error?',
    a: 'Quantity, on bundles and sets. A multi-pack pricing one item inflates the line by the multiple, and a single unit pricing a set understates it. Both are easy to spot in review and easy to prevent before sending.',
  },
  {
    q: 'How does Kevin reduce these?',
    a: 'In the places it honestly can: a photograph already on the claim resolves as a duplicate rather than becoming a second line, related frames are proposed as one item before anything is promoted, depreciation is computed server-side from class and age so two similar rows cannot drift apart, and an item it cannot price confidently arrives blank and editable rather than guessed.',
  },
]

const CRUMBS = [{ to: '/guides/contents-line-items-rejected', t: 'Why lines get questioned' }]

export default function RejectedLinesGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/contents-line-items-rejected"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Why Contents Line Items Get Questioned"
          lede="A line can be questioned even when the insured plainly owned the property. The issue is almost never whether the item existed — it is whether the line supports the number beside it."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="Why do contents line items get questioned or reduced?"
          answer="Because the line does not carry its own argument: the description is too vague to price, the replacement is not comparable, the quantity is unsupported, the price has no source, or the depreciation does not match similar lines."
        >
          <p>
            Nearly all of these are preventable in the five minutes before a schedule is sent, and
            expensive in the weeks after. Grouped below by what is actually wrong, because the fix
            differs: an identity problem needs evidence, a pricing problem needs a better
            comparable, and a consistency problem needs the whole schedule looked at rather than the
            one row.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Identity problems</h2>
          <ComparisonTable
            caption="The line does not establish what the property was"
            columns={['Problem', 'What the reviewer sees', 'The fix']}
            rows={[
              ['Description too vague', '“Television — $2,100”, with no way to judge it', 'Brand, size, technology, tier'],
              ['Model unsupported', 'Specificity nothing in the file backs', 'Cite the plate, receipt or record — or drop it'],
              ['Quantity unsupported', 'Quantity 18 against evidence for a few', 'Document or reconstruct the count'],
              ['Duplicates', 'The same property on two lines or in two rooms', 'Group the photographs before promoting'],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>Invented specificity is its own failure mode.</strong> A model number nothing
              supports looks stronger than a generic description right up until somebody checks it,
              and then it costs more than the vagueness would have. This is why Kevin returns a
              blank, editable field rather than a confident guess.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Comparable problems</h2>
          <ComparisonTable
            caption="The replacement is not the same property"
            columns={['Problem', 'Example']}
            rows={[
              ['Not actually comparable', 'Matched on size while tier, technology or capacity differ'],
              ['A bundle pricing one item', 'One cordless drill priced from a five-piece kit'],
              ['Wrong variant', 'Wrong capacity, generation, battery platform or model suffix'],
              ['Wrong form factor', 'Corded for cordless, built-in for freestanding, sofa for sectional'],
              ['Source does not match the line', 'The page changed, or the variant selector reset'],
              ['Outlier pricing', 'Clearance, liquidation, or a specialty bundle standing in for retail'],
              ['Weak discontinued logic', 'An unrelated modern product chosen because it was available'],
            ]}
          />
          <p>
            The pattern underneath all of these is the same: one characteristic was matched and
            treated as if it were all of them. That is the subject of{' '}
            <a href="/guides/exact-match-vs-like-kind-quality">exact match vs like kind and quality</a>.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Consistency problems</h2>
          <p>
            These are the ones that cannot be fixed one row at a time, because the row is not really
            the problem — the schedule is.
          </p>
          <ul className="k-seolist">
            <li>Two similar items at the same age depreciating differently, with nothing explaining it.</li>
            <li>One blanket percentage applied across categories with very different useful lives.</li>
            <li>Ages missing, or an entire category sharing one round number.</li>
            <li>Descriptions that get thinner as the schedule goes on.</li>
            <li>A line with no source at all, in a schedule where most lines have one.</li>
          </ul>
          <p>
            Depreciation in Kevin is computed server-side from the content class and the age, so two
            similar rows cannot drift apart through repetition — and the worksheet and the export
            cannot disagree about a figure. The inputs are still yours to get right.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Questioned does not mean denied</h2>
          <p>
            A reviewer asking about a line is usually asking for something specific: a better
            description, a better comparable, support for a quantity, a model or an age clarified.
            Lines get removed when they cannot be answered, not when they are challenged.
          </p>
          <p>
            Which is the practical argument for keeping the source on the row rather than in a
            folder. The question arrives months later, and the difference between answering it and
            rebuilding the research is whether the evidence travelled with the line.
          </p>
        </section>

        <section className="k-seosec">
          <h2>A line that survives review</h2>
          <p>
            It answers five things without anyone asking: <strong>what is it, how do we know, what
            replaces it, what does that replacement cost, and how was the depreciation
            calculated.</strong> Everything on this page is a way of failing one of those five.
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
              to: '/guides/contents-claim-qa-checklist',
              t: 'Contents claim QA checklist',
              d: 'Catch these before the schedule leaves your hands.',
            },
            {
              to: '/guides/what-carriers-look-for-contents-inventory',
              t: 'What a reviewer looks for',
              d: 'The checks, how they are sampled at volume, and what happens after a flag.',
            },
            {
              to: '/guides/exact-match-vs-like-kind-quality',
              t: 'Exact match vs like kind and quality',
              d: 'What a replacement has to preserve to stand up.',
            },
            {
              to: '/guides/source-pricing-insurance-contents',
              t: 'Documenting source pricing',
              d: 'Why a URL is the least important part of a source.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
