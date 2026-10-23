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
 * /guides/insurance-grade-contents-documentation — batch 5, spec page 35.
 *
 * Positioned as the DEFINITION, which is what keeps it off the toes of two
 * pages we already publish: the field guide is how to build a line, the QA
 * checklist is how to check one, and this is the standard both are aiming at.
 * All three cross-link.
 *
 * "Kevin.co maps items to XactContents categories/classes" is kept because it
 * is now confirmed true (owner, 2026-10-05, and visible in the generated
 * reference at /guides/useful-life-by-content-class).
 *
 * The brief's four principles are kept at the level of SHAPE -- evidence
 * first, review before pricing, source-backed, reproducible depreciation --
 * which is the four-step vocabulary rather than the stage list.
 */

const FAQS: Faq[] = [
  {
    q: 'What makes a contents inventory insurance-grade?',
    a: 'That another claims professional can read a line and answer four questions without asking you: what the item was, what replaces it, where the price came from, and how the actual cash value was reached. Everything else is a means to that.',
  },
  {
    q: 'Is object detection enough for an insurance claim?',
    a: 'Rarely on its own. Detection answers what KIND of thing is visible; valuation needs which specific product it was. “Television” and “Samsung 65-inch OLED, S90D” are the same detection result and very different claims.',
  },
  {
    q: 'Does every item need a model number?',
    a: 'No, and insisting on it produces invented detail. The level of identification should match what moves the price: a premium camera needs its model, a bath towel does not. Proportional detail is the standard, not maximum detail.',
  },
  {
    q: 'Why are source links important?',
    a: 'Because a price without its listing is an assertion and a price with one is evidence. The question that comes back most often is where a figure came from, and a line that already answers it never generates that round trip.',
  },
  {
    q: 'Can AI produce insurance-grade documentation?',
    a: 'It can produce most of it and should not be trusted with all of it. The repetition — research, sourcing, classification, depreciation — is exactly what software is for. Ambiguous identifications, high-value property and collectibles are where a person is worth more than another search.',
  },
  {
    q: 'What should a line do when the evidence is thin?',
    a: 'Say so. A blank, editable field is stronger documentation than a confident guess, because the guess survives review and the blank does not. Hiding uncertainty is the one failure that gets worse with time.',
  },
]

const CRUMBS = [
  { to: '/guides/insurance-grade-contents-documentation', t: 'Insurance-grade documentation' },
]

export default function InsuranceGradeGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/insurance-grade-contents-documentation"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="What Is Insurance-Grade Contents Documentation?"
          lede="Not a longer list of objects. A record where each line carries its own argument — and where the person reading it was not there when the photographs were taken."
          byline="Kevin Godfrey, Kevin"
          updated="22 October 2026"
        />

        <DirectAnswer
          question="What makes contents documentation insurance-grade?"
          answer="That a line answers four questions on its own: what the item was, what replaces it, where the replacement price came from, and how the actual cash value was reached — with the evidence attached rather than remembered."
        >
          <p>
            The distinction that matters is between recognising an object and valuing a specific
            piece of property. A system can be entirely right that it is looking at a television and
            still have established nothing a claim can use.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Two different problems</h2>
          <ComparisonTable
            caption="Why a correct detection is not a documented line"
            columns={['', 'Object detection', 'Insurance documentation']}
            rows={[
              ['Answers', 'What kind of thing is visible', 'What this specific property was'],
              ['Output', 'A category', 'An identified item with a price and a basis'],
              ['Evidence', 'The frame itself', 'The frame, the label, the listing, the schedule'],
              ['Good enough for', 'Triage, quantity, a rough list', 'A figure somebody else has to accept'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>What a documented line carries</h2>
          <ComparisonTable
            caption="Eight parts, in the order they depend on each other"
            columns={['Part', 'What it has to do']}
            rows={[
              ['Identity', 'As specific as the evidence supports — and no more'],
              ['Evidence', 'Photographs, labels, receipts or records the line traces back to'],
              ['Quantity', 'One item, several, or a set — stated, not inferred from a crowded frame'],
              ['Replacement', 'Matching on function, quality, specification and tier'],
              ['Source', 'The listing the price came from, kept on the row'],
              ['Classification', 'A content class, which decides the useful life'],
              ['Depreciation', 'Age against that life, applied the same way throughout'],
              ['Traceability', 'The whole chain readable from the row'],
            ]}
          />
          <p>
            Read end to end that is one sentence:{' '}
            <strong>
              evidence &rarr; identified item &rarr; replacement &rarr; source &rarr; RCV &rarr;
              depreciation &rarr; ACV
            </strong>
            . A line that breaks anywhere along it is the line that comes back.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Proportional detail, not maximum detail</h2>
          <p>
            Insurance-grade does not mean every item carries a model number. It means the
            identification matches what moves the price. A premium camera body needs its model,
            configuration and lens; a bath towel needs to be a bath towel. Inventing specificity on
            the second is not thoroughness &mdash; it is the detail a reviewer checks first and the
            fastest way to make a schedule look unreliable.
          </p>
          <EvidenceCallout>
            <p>
              <strong>A professional inventory does not hide uncertainty.</strong> Where the
              evidence will not carry an identification, the honest line says so: Kevin returns a
              blank, editable field rather than a plausible guess, because a confident wrong
              description survives review and a blank does not.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Where room-level detection falls short</h2>
          <p>
            A room photograph is useful for context and rough quantity. It is weak for valuation
            because the things that set value are the things it cannot resolve: labels, tags, model
            numbers, materials, edition details, condition and tier.
          </p>
          <p>
            A closet photograph might show thirty shirts. It will not show which are designer, which
            are technical apparel and which came in a multipack &mdash; and pricing all thirty as
            average-grade clothing produces a number quickly without producing a defensible one.
            That is also why several photographs of one item have to become one line rather than
            several: a schedule reporting more items than photographs is wrong in a way a reviewer
            spots immediately.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What Kevin means by it</h2>
          <ComparisonTable
            caption="Four commitments, and what each one prevents"
            columns={['Commitment', 'The failure it is there to stop']}
            rows={[
              ['Evidence before line items', 'Photographs becoming items nobody confirmed'],
              ['Review before pricing', 'Pricing a grouping that was wrong to begin with'],
              ['A source on every priced line', 'A figure nobody can trace months later'],
              ['Depreciation computed server-side', 'Line 400 treated differently from line 4'],
            ]}
          />
          <p>
            Each line is classified to an XactContents category and sub-category, and that class
            together with the age selects the rate &mdash; 31 categories and 87 sub-lines, published
            in full at{' '}
            <a href="/guides/useful-life-by-content-class">useful life by content class</a> so the
            schedule we apply is the schedule you can read.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The test</h2>
          <p>
            Pick any line at random and hand it to somebody who was not there. If they can tell what
            the item was, what replaces it, where the price came from and how the ACV was reached
            &mdash; without asking you a question &mdash; the line is insurance-grade. If they
            cannot, no amount of volume elsewhere in the schedule fixes it.
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
              to: '/guides/public-adjuster-contents-inventory',
              t: 'Contents inventory field guide',
              d: 'How to build a line that meets this standard.',
            },
            {
              to: '/guides/contents-claim-qa-checklist',
              t: 'Contents claim QA checklist',
              d: 'How to check one before the schedule leaves.',
            },
            {
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'What a room photograph can and cannot establish.',
            },
            {
              to: '/guides/useful-life-by-content-class',
              t: 'Useful life by content class',
              d: 'The full schedule, generated from the live engine.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
