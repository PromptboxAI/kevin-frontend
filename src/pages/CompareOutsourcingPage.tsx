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
 * /compare/kevin-vs-outsourced-contents-pricing — batch 6.
 *
 * ⚠️ DELIBERATELY NOT SHAPED LIKE A VENDOR COMPARISON. Putting a human
 * pricing desk in a software-vs-software feature grid would misrepresent both.
 * The honest question is "send it out per line, or subscribe", so the page
 * answers that with arithmetic and names the crossover.
 *
 * THE BREAK-EVEN IS THE PAGE. $249 / $0.50 = 498 lines a month. Below it,
 * outsourcing is genuinely cheaper and the page says so without hedging --
 * a comparison page that cannot name a case where the competitor wins is an
 * advertisement, and adjusters can tell.
 *
 * Published competitor prices are quoted from one named desk, dated, because
 * a dated real number beats "outsourcing costs vary". Same rule as the
 * Contents.team and Encircle pages: quote what they publish, date it, score
 * nothing. Source audit: COMPETITOR-CLAIMPRICINGPARTNERS.md.
 *
 * ⛔ Do not soften the "choose outsourcing if" section into a strawman. Its
 * accuracy is what makes the rest of the page credible, and the low-volume
 * case against us is real.
 */

const READ_ON = '29 October 2026'

/** $249 / $0.50. Stated once here so the prose and the table cannot drift. */
const BREAK_EVEN = 498

const FAQS: Faq[] = [
  {
    q: 'Is it cheaper to outsource contents pricing or to use software?',
    a: `It depends on one number: how many line items you produce in a month. At a published rate of $0.50 a line, outsourcing costs less than a $249 flat subscription until about ${BREAK_EVEN} lines a month — roughly one 500-line claim. Past that the subscription is cheaper, and the gap widens with every claim because one is per-line forever and the other is flat.`,
  },
  {
    q: 'What does an outsourced pricing desk actually deliver?',
    a: 'Typically an Excel workbook: room-by-room lines with quantity, unit price and totals, a source behind each price, uncertain lines flagged for your review, and a choice of your template, a supplemental-only sheet or one merged report. You submit it under your own name; the desk does not contact the carrier.',
  },
  {
    q: 'What do you give up by outsourcing?',
    a: 'The file is the deliverable, so changing your mind later is a new engagement rather than an edit. There is no live worksheet to re-price a line in, no audit log of who changed what, no second ingest when more photos arrive, and no export history when a claim needs a version two.',
  },
  {
    q: 'What do you give up with software?',
    a: 'Your own time at the review step. Kevin researches and prices every line, but an adjuster still reviews the worksheet before it goes out — that is the part we deliberately do not automate away. If what you actually want is the hours off your desk entirely, a desk is a reasonable purchase and our done-for-you service is the same idea.',
  },
  {
    q: 'Can you do both?',
    a: 'Yes, and some firms do: subscribe for ordinary volume, and send the overflow out during a surge rather than hiring for it. Kevin’s own done-for-you service exists for exactly that case, priced from $750.',
  },
  {
    q: 'Why quote a competitor’s prices on your own page?',
    a: 'Because a dated real number is more useful than "outsourcing costs vary", and because the arithmetic only means something if you can check it. The rates quoted here were published on that desk’s own pricing page on the date shown; check their site for current figures.',
  },
]

const CRUMBS = [
  { to: '/compare/kevin-vs-outsourced-contents-pricing', t: 'Kevin vs outsourcing' },
]

export default function CompareOutsourcingPage() {
  return (
    <div className="k-landing">
      <Seo
        path="/compare/kevin-vs-outsourced-contents-pricing"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Outsourced Contents Pricing vs Software"
          lede="Send the claim to a pricing desk at a dollar a line, or run it yourself on a flat subscription. The answer is arithmetic, and the crossover is about 500 line items a month."
          byline="Kevin Godfrey, Kevin"
          updated={READ_ON}
        />

        <DirectAnswer
          question="Should I outsource contents pricing or use software?"
          answer={`Outsource if you produce fewer than about ${BREAK_EVEN} line items a month, or if what you want is the hours off your desk entirely. Subscribe if you are above that, because per-line pricing never stops and a flat fee does.`}
        >
          <p>
            Pricing desks are a real option and a reasonable purchase. They are also priced per
            line, which means the cost of the busy month is the thing you are buying. This page
            works out where the two cross and says plainly which side of it you should be on.
          </p>
          <p>
            Competitor rates quoted here were published on that desk&rsquo;s own pricing page on{' '}
            {READ_ON}; prices change, so check before you rely on them.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The arithmetic</h2>
          <ComparisonTable
            caption="A published desk rate of $0.50 a line against Kevin Pro at $249 a month"
            columns={['Line items in a month', 'Outsourced at $0.50/line', 'Kevin Pro', 'Cheaper']}
            rows={[
              ['200', '$100', '$249', 'Outsourcing'],
              ['400', '$200', '$249', 'Outsourcing'],
              [`${BREAK_EVEN} — the crossover`, '$249', '$249', 'Level'],
              ['1,000', '$500', '$249', 'Kevin'],
              ['2,000', '$1,000', '$249', 'Kevin'],
              ['4,000', '$2,000', '$249 + credits', 'Kevin'],
            ]}
          />
          <p>
            Kevin Pro includes 2,000 line items a month on a flat $249 with unlimited claims;
            past the allowance you buy credits at $0.75 an item. There is no per-claim fee,
            and no per-seat maths either, so a second adjuster costs nothing.
          </p>
          <EvidenceCallout>
            <p>
              <strong>Below roughly {BREAK_EVEN} lines a month, outsourcing wins and we are not
              going to pretend otherwise.</strong> If you write four contents claims a year, a
              subscription is the wrong purchase and a desk is the right one. The crossover is
              about one 500-line claim a month &mdash; work out your own number before anyone
              sells you either.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Choose an outsourced desk if</h2>
          <ul className="k-seolist">
            <li><strong>Your volume is low or lumpy.</strong> Per-line cost scales down to nothing in a quiet month; a subscription does not.</li>
            <li><strong>You want the hours gone, not the typing gone.</strong> A desk removes the work. Software removes the research and leaves you the review.</li>
            <li><strong>You do not want to learn a tool</strong>, or you are covering a surge you would otherwise hire for.</li>
            <li><strong>You need things we do not price</strong> — structure repair, cleaning, mould and hazmat, ALE. Kevin is contents only.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Choose software if</h2>
          <ComparisonTable
            caption="What the file cannot do once it has been emailed back to you"
            columns={['When this happens', 'With a delivered file', 'In Kevin']}
            rows={[
              ['You disagree with a price', 'A correction request, and a wait', 'Sharpen the description and re-price, or type a price with your own source'],
              ['More photos arrive next week', 'A second engagement', 'A second ingest session appends; line numbers continue and never renumber'],
              ['The carrier asks who changed a line', 'Whatever is in your email', 'The audit log — who changed what, when'],
              ['The claim needs a version two', 'Re-send and re-pay', 'A new export; version one still opens as version one'],
              ['You add a second adjuster', 'Their lines bill the same per line', 'No seat charge at all'],
              ['Volume doubles', 'The bill doubles', 'The subscription does not move until the allowance does'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Where we agree with them</h2>
          <p>
            Good desks and good software hold the same line on provenance: a price should trace to
            a specific listing you can open, uncertain lines should be flagged rather than guessed,
            and the output should be yours to submit under your own name. Any desk that will not
            show you where a number came from has the same problem as any software that will not.
          </p>
          <p>
            And if the hours are genuinely what you want gone, we sell that too &mdash;{' '}
            <a href="/done-for-you">done-for-you</a> is Kevin&rsquo;s own build service, priced
            from $750, including the option for us to photograph the loss. It is a different
            purchase from the subscription and we would rather say so than blur them.
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
              to: '/done-for-you',
              t: 'Done-for-you, from $750',
              d: 'Send the photos or the list. We build and price it.',
            },
            {
              to: '/contents-software-roi',
              t: 'ROI calculator',
              d: 'Your caseload, your rate, your number.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: '2,000 line items included. Never per claim.',
            },
            {
              to: '/guides/best-contents-software-public-adjusters',
              t: 'What to look for in contents software',
              d: 'The questions to put to any vendor, including us.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
