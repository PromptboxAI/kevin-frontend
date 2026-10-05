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
 * /guides/desk-adjuster-contents-review — batch 4, spec page 27.
 *
 * ⚠️ DELIBERATELY NARROWED, because the brief as written duplicates a page we
 * already publish. /guides/what-carriers-look-for-contents-inventory (batch 2,
 * spec page 17) answers "what does a reviewer check" with ten criteria; this
 * brief answers the same question with twelve. Two pages competing for one
 * query is cannibalisation, and the weaker one drags the stronger.
 *
 * So this page does NOT re-list the criteria. It covers the part page 17 does
 * not: how a review is actually CONDUCTED at volume -- sampling rather than
 * line-by-line, what triggers a closer look, what happens when a line is
 * questioned, and how a revision gets back to the reviewer. It links to 17 for
 * the criteria and to 28 for the reasons a line comes back.
 *
 * Flagged to the owner rather than decided silently: if they would rather have
 * one page, this one should be merged into 17 and redirected.
 *
 * Rule 4 throughout: Kevin has no carrier-facing surface. This describes review
 * as something that happens TO a file an adjuster sends, never as a product.
 */

const FAQS: Faq[] = [
  {
    q: 'Do desk adjusters check every contents line?',
    a: 'On a small schedule, often yes. On a thousand-line schedule it is not realistic, so review tends to combine a scan of the whole, a closer look at exceptions, and sampling within the rest. That mix is why consistency across a schedule matters more than perfection on any one row.',
  },
  {
    q: 'Which lines get extra scrutiny?',
    a: 'High-value property, luxury goods, collectibles, discontinued items, unusual quantities, thin pricing, and anything whose price sits far from comparable lines with nothing on the row explaining why. Those are also the lines worth your own time before you send it.',
  },
  {
    q: 'What actually happens when a line is questioned?',
    a: 'Usually a request rather than a rejection: a better description, a better comparable, support for a quantity, a clarified model or age. Being able to answer without rebuilding the line is most of the battle, which is what keeping the source on the row buys you.',
  },
  {
    q: 'Does sampling mean most lines are never read?',
    a: 'It means most lines are read quickly rather than not at all — and that a line which looks different from its neighbours draws attention precisely because the rest are uniform. Inconsistency is what makes a sample expand.',
  },
  {
    q: 'What makes a schedule faster to review?',
    a: 'Every line built the same way: the same description depth, the same class logic, the same depreciation method, a source on each priced row. A reviewer who learns the pattern on line 5 can move quickly through line 500; one who meets a new format every few rows cannot.',
  },
  {
    q: 'Does Kevin submit anything to the carrier?',
    a: 'No. Kevin writes a file you send — download, share link or email — and has no carrier-facing surface. Everything a reviewer sees is something you reviewed and sent.',
  },
]

const CRUMBS = [{ to: '/guides/desk-adjuster-contents-review', t: 'How a desk review works' }]

export default function DeskReviewGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/desk-adjuster-contents-review"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How a Desk Review Actually Works"
          lede="Nobody reads a thousand lines at equal depth. Understanding how a schedule is sampled — and what makes a sample expand — is worth more than knowing the criteria."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="How is a large contents schedule reviewed?"
          answer="In layers: a pass over the shape of the whole schedule, a closer look at the exceptions, and sampling within the ordinary lines. A line that differs from its neighbours is what pulls more of the schedule into the sample."
        >
          <p>
            For <em>what</em> a reviewer checks on a given line, see{' '}
            <a href="/guides/what-carriers-look-for-contents-inventory">
              what a reviewer looks for
            </a>
            . This page is about the other half: how that review is conducted when there are
            hundreds of lines and finite time, and what happens after a line is flagged.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Three layers, not one pass</h2>
          <ComparisonTable
            caption="Roughly how attention gets allocated"
            columns={['Layer', 'What it is looking at', 'What it costs']}
            rows={[
              ['The shape', 'Totals, item count against photo count, obvious gaps, format', 'Minutes'],
              ['The exceptions', 'High value, collectibles, discontinued, outliers, unpriced lines', 'Most of the time spent'],
              ['The sample', 'Ordinary lines, checked in groups to confirm the pattern holds', 'Expands when something does not fit'],
            ]}
          />
          <p>
            The third layer is the one adjusters tend to underestimate. A sample is not a formality:
            it is a test of whether the schedule is internally consistent, and it grows the moment
            it finds something that is not.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What makes a sample expand</h2>
          <EvidenceCallout>
            <p>
              <strong>One unexplained line costs more than its own value.</strong> A price far from
              its neighbours, a quantity nothing supports, a class that does not match similar
              property — each is a reason to look at the next ten lines, and then the ten after
              those. Consistency is not a polish item; it is what keeps the review small.
            </p>
          </EvidenceCallout>
          <ul className="k-seolist">
            <li>More items than photographs, which suggests duplicates.</li>
            <li>A whole category sharing one suspiciously round age.</li>
            <li>Two near-identical items on different classes or different depreciation.</li>
            <li>A source link that opens on something other than what the line describes.</li>
            <li>Descriptions that change depth partway through the schedule.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Questioned is not rejected</h2>
          <p>
            Most flags are requests rather than refusals. The reviewer usually wants a better
            description, a better comparable, support for a quantity, or a model or age clarified.
            What determines how expensive that is for you is whether the line can be answered or
            has to be rebuilt.
          </p>
          <ComparisonTable
            caption="The same question, two files"
            columns={['Reviewer asks', 'Source kept on the row', 'Source not kept']}
            rows={[
              ['Where did this price come from?', 'Open the link on the row', 'Re-research the item'],
              ['Is this the right model?', 'Compare the listing to the description', 'Reconstruct from memory'],
              ['Why this replacement?', 'The characteristics are on the line', 'Re-argue it from scratch'],
              ['Is the price still current?', 'Re-price the row and send a version', 'Start the research again'],
            ]}
          />
          <p>
            This is the practical reason to keep the source attached rather than to treat it as
            paperwork: it is not for the first submission, it is for the second conversation, which
            can be months later.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Revisions, and why line numbers matter</h2>
          <p>
            Once a schedule has been sent it is a reference document. The reviewer&rsquo;s notes cite
            line numbers, so renumbering on a revision breaks every reference in the correspondence.
            In Kevin a later ingest appends and existing rows keep their numbers; the next export is
            simply a new version, and the one already sent still opens as what was sent.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What you can do before it leaves</h2>
          <p>
            The review above is mostly predictable, which means most of it can be done first. The{' '}
            <a href="/guides/contents-claim-qa-checklist">QA checklist</a> is the same passes in the
            order you can run them yourself, and{' '}
            <a href="/guides/contents-line-items-rejected">the reasons lines come back</a> is the
            list of what the exceptions layer is hunting for.
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
              d: 'The criteria themselves, check by check.',
            },
            {
              to: '/guides/contents-line-items-rejected',
              t: 'Why line items get questioned',
              d: 'Twelve reasons a line comes back, and what is usually being asked.',
            },
            {
              to: '/guides/contents-claim-qa-checklist',
              t: 'Contents claim QA checklist',
              d: 'The pass to make before the schedule leaves your hands.',
            },
            {
              to: '/guides/source-pricing-insurance-contents',
              t: 'Documenting source pricing',
              d: 'What makes a source answer the question instead of raising one.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
