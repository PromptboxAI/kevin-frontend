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
 * /compare/kevin-vs-enservio — batch 6.
 *
 * ⚠️ TWO CORRECTIONS MADE WHILE RESEARCHING THIS, both worth keeping:
 *
 *   1. Enservio is NOT a Verisk product. Verisk lists them as a PARTNER
 *      (integrated with XactAnalysis). The brief for this page said
 *      "Enservio / Itel (Verisk)" and that was wrong.
 *   2. ITEL is a different company doing flooring and materials testing, not
 *      contents valuation. It is deliberately not mentioned on this page,
 *      because putting an unrelated vendor in a contents comparison is the
 *      kind of error that discredits the rest of it.
 *
 * ⚠️ THE HONEST FRAMING, WHICH THE PAGE LEADS WITH: Enservio sells through
 * CARRIERS. Their own navigation offers "Getting Started — Carriers" and
 * "Getting Started — Insureds"; there is no public-adjuster door. So a PA is
 * far more likely to be REVIEWING an Enservio valuation the carrier ordered
 * than choosing between them and us. A head-to-head framed as two products
 * competing for one buyer would be a fiction, so this page is framed as what
 * actually happens.
 *
 * Everything attributed to them is quoted from enservio.com, read 2026-11-04,
 * and their site carries a 2026 copyright and a current portal announcement,
 * so it is live rather than abandoned. Scale is stated honestly and up front:
 * founded 2004, $2B+ a year, 9,500 adjusters. We are not pretending to be the
 * incumbent.
 */

const READ_ON = '4 November 2026'

const FAQS: Faq[] = [
  {
    q: 'Can a public adjuster buy Enservio?',
    a: 'Their site is organised around carriers and insureds — the "Getting Started" paths are for carriers and for policyholders, and claims are submitted to them. If you are an independent or public adjuster, you are far more likely to meet Enservio as the valuation the carrier ordered than as a tool you buy.',
  },
  {
    q: 'What is the difference in how each one prices?',
    a: 'Enservio states that its pricing comes from a proprietary database rather than web searches — they describe 17 million products, 385+ vendors and over a decade of historical pricing, updated nightly and optimised for like-kind-and-quality matching. Kevin prices against current retail listings and puts a link to the listing on the line.',
  },
  {
    q: 'Which approach is better?',
    a: 'They answer different questions. A curated database gives consistency across thousands of claims and a defensible like-kind match for discontinued goods. A live listing answers "what does this cost today, and where do I see it". A carrier settling at volume values the first; an adjuster arguing a single line usually wants the second.',
  },
  {
    q: 'How do I review an Enservio valuation I disagree with?',
    a: 'Line by line, the same as any valuation: check the item is identified correctly, check the replacement is genuinely like kind and quality rather than a cheaper substitute, check the age and the depreciation applied, and check the arithmetic foots. Where you disagree, the remedy is a sourced alternative — a specific listing for the item as described.',
  },
  {
    q: 'Do they handle high-value and specialty items?',
    a: 'Yes — they advertise in-house specialists for fine art, collectibles, antiques and unique items, nationwide. Kevin deliberately does not auto-price jewelry, fine art, firearms, furs, fine china or graded trading cards; those lines arrive blank for an adjuster or an appraiser to fill in.',
  },
  {
    q: 'Is Kevin an Enservio alternative?',
    a: 'For an independent or public adjuster building their own schedule, yes in practice — it is the same job. For a carrier looking to outsource contents settlement at volume, no: we are software you run, not a nationwide service organisation, and we do not take claim submissions.',
  },
]

const CRUMBS = [{ to: '/compare/kevin-vs-enservio', t: 'Kevin vs Enservio' }]

export default function CompareEnservioPage() {
  return (
    <div className="k-landing">
      <Seo path="/compare/kevin-vs-enservio" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Kevin vs Enservio"
          lede="Enservio is the incumbent contents-valuation service, and it sells through carriers. Kevin is software for the adjuster building the schedule. The practical question is usually not which to buy — it is how to read one of their valuations."
          byline="Kevin Godfrey, Kevin"
          updated={READ_ON}
        />

        <DirectAnswer
          question="What is the difference between Kevin and Enservio?"
          answer="Enservio is a nationwide contents inventory and valuation service working through carriers, pricing from a proprietary database. Kevin is software an adjuster runs themselves, pricing against current retail listings with a link on every line."
        >
          <p>
            <strong>Everything attributed to Enservio here is quoted from enservio.com, read on{' '}
            {READ_ON}.</strong> Nothing is scored. Their site is the authority on their service.
          </p>
          <p>
            Start with the part most comparison pages would hide:{' '}
            <strong>Enservio is much larger than us and has been doing this far longer.</strong>{' '}
            Their site says founded in 2004, an AM Best Experts Service Provider, processing{' '}
            &ldquo;$2B+ annually in contents claims for over 9,500 adjusters&rdquo;. We are newer
            and narrower, and pretending otherwise would not survive the first conversation with
            anyone who knows the industry.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>They sell to carriers. That changes the question.</h2>
          <p>
            Enservio&rsquo;s own navigation offers &ldquo;Getting Started&rdquo; for{' '}
            <strong>carriers</strong> and for <strong>insureds</strong>. Claims are submitted to
            them, and their people walk the policyholder through the property. There is no
            public-adjuster door.
          </p>
          <p>
            So if you are an independent or public adjuster, the realistic encounter is not
            choosing between the two products. It is opening a contents valuation the carrier
            ordered and deciding whether you agree with it.
          </p>
          <EvidenceCallout>
            <p>
              Reviewing someone else&rsquo;s valuation is its own skill, and it is the same four
              checks whoever produced it: <strong>is the item identified correctly</strong>, is the
              replacement genuinely <strong>like kind and quality</strong> rather than a cheaper
              substitute, are the <strong>age and depreciation</strong> defensible, and does the
              row <strong>foot</strong>. Where you disagree, a sourced alternative &mdash; a
              specific listing for the item as described &mdash; is what moves the conversation.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Database pricing against listing pricing</h2>
          <p>This is the substantive difference, and both positions are defensible.</p>
          <ComparisonTable
            caption={`Enservio details quoted from their own site, read ${READ_ON}`}
            columns={['On', 'Enservio', 'Kevin']}
            rows={[
              [
                'Where the price comes from',
                'A proprietary pricing database rather than web searches — stated as 17M products, 385+ vendors, a decade of history, updated nightly',
                'Current retail listings, with a link to the listing on the line',
              ],
              [
                'Optimised for',
                'Like-kind-and-quality matching at scale',
                'Showing an adjuster where a specific number came from',
              ],
              [
                'Who does the work',
                'Their professionals walk the policyholder through the property',
                'The adjuster captures; the engine prices; the adjuster reviews',
              ],
              [
                'Specialty items',
                'In-house specialists for fine art, collectibles and antiques, nationwide',
                'Never auto-priced — six classes arrive blank for an adjuster or appraiser',
              ],
              ['Who buys it', 'Carriers', 'Independent and public adjusters, and estate professionals'],
              [
                'What you end up with',
                'A contents valuation report to settle from',
                'A live worksheet you edit, re-price and export as often as the claim needs',
              ],
            ]}
          />
          <p>
            A curated database gives consistency across thousands of claims and a defensible match
            for goods that are no longer sold. A live listing answers a different question &mdash;
            what does this cost today, and where can I see it &mdash; which is the question that
            tends to come back from a desk reviewer on a single disputed line.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Choose Enservio if</h2>
          <ul className="k-seolist">
            <li><strong>You are a carrier</strong> looking to outsource contents settlement at volume, with people who will walk the policyholder through the loss.</li>
            <li><strong>You need nationwide specialty valuation</strong> on fine art, collectibles and antiques without hiring for it.</li>
            <li><strong>Consistency across thousands of claims</strong> matters more to you than per-line visibility into a single number.</li>
          </ul>
          <h2 style={{ marginTop: 28 }}>Choose Kevin if</h2>
          <ul className="k-seolist">
            <li><strong>You are the adjuster building the schedule</strong>, not ordering it from someone else.</li>
            <li><strong>You want to open the listing behind a price</strong> from the line it sits on.</li>
            <li><strong>You want the depreciation method published</strong> so a figure can be recomputed by hand.</li>
            <li><strong>The claim keeps moving</strong> — more photographs arrive, a line gets re-priced, the export needs a version two.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <CtaBand />

        <RelatedCards
          items={[
            {
              to: '/guides/desk-adjuster-contents-review',
              t: 'What a desk reviewer checks',
              d: 'The questions that come back, and how to answer them first.',
            },
            {
              to: '/guides/exact-match-vs-like-kind-quality',
              t: 'Exact match vs like kind and quality',
              d: 'When a substitute is fair, and when it is a markdown.',
            },
            {
              to: '/guides/useful-life-by-content-class',
              t: 'Useful life by content class',
              d: 'The published schedule, all 87 sub-lines.',
            },
            {
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'For public adjusters',
              d: 'What the workflow removes, and what it leaves to you.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
