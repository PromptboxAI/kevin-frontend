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
 * /compare/kevin-vs-contents-team — batch 5, spec page 32, NARROWED.
 *
 * ⚠️ READ THIS BEFORE EDITING. The brief asked for a thirteen-row capability
 * table scoring Contents.team on things like "Multiple photos grouped to one
 * item: Review-dependent" and "XactContents classification: CAT/SEL-oriented".
 * We cannot substantiate any of that, and /guides/best-contents-software-
 * public-adjusters says so in its own first screenful: "We cannot verify
 * another vendor's current behaviour well enough to publish a table about it."
 * Publishing the table would have made that page a lie.
 *
 * So this page carries NO capability table about them. Everything attributed
 * to Contents.team is a VERBATIM quote from their own public site, read on
 * 2026-10-23 and dated on the page, fetched and checked twice before
 * publishing. Everything about Kevin is our own behaviour. Where the two
 * cannot be compared without guessing, the page says to test both rather than
 * guessing on the reader's behalf.
 *
 * Their per-seat price is quoted because we never sell seats and rule 9
 * makes that a real strategic difference rather than a dig. Their pricing
 * block also shows "$0/ user / month" alongside the FAQ's seat price; that
 * contradiction is NOT published, because a page mid-edit is not a product
 * fact and pointing at it would be cheap.
 *
 * If their site changes, this page is wrong. The read date is on it for that
 * reason, and a reader is told to check.
 */

const READ_ON = '23 October 2026'

const FAQS: Faq[] = [
  {
    q: 'Is Kevin faster than Contents.team?',
    a: 'We will not claim that, because we cannot run your claim on both. Their site leads with "You shoot. That’s the whole job." Ours puts a review step between the photographs and the line items. Which is faster depends on how much of the review you would have done anyway.',
  },
  {
    q: 'What is the actual difference?',
    a: 'Where the camera points. Their page says "Photograph each room the way you already do." Kevin is built around photographs of individual items, several of which become one line. That is a difference in what evidence the schedule is built from, and it shows up most on property where the model moves the price.',
  },
  {
    q: 'Can Kevin use room photos?',
    a: 'A room photograph is useful context and it establishes that property existed. It rarely establishes which product something was, which is what a replacement price is argued from — so Kevin treats item-level photographs as the working evidence and a room shot as background.',
  },
  {
    q: 'How do the two price?',
    a: 'Differently in kind. Their FAQ states "Seats are $299/month, and every organization gets 1,000 items included each month." Kevin is $249 a month flat with no seats at all and 2,000 line items included — a second adjuster costs nothing. Check both against your own headcount and volume.',
  },
  {
    q: 'Do both export to XactContents?',
    a: 'Both say so. Their site lists "XactContents-format XLSX, CSV, or a PDF report." Kevin exports an Xactimate (Excel) .xlsx in the XactContents template and a room-by-room PDF; we have no CSV export, as CSV in Kevin is an import format for written inventories.',
  },
  {
    q: 'Is this comparison impartial?',
    a: 'It is ours, so read it as such. What we have done is quote them rather than characterise them, date what we read, and leave out every claim we could not check. If something here is out of date or wrong, their site is the authority on their product and ours on Kevin.',
  },
]

const CRUMBS = [{ to: '/compare/kevin-vs-contents-team', t: 'Kevin vs Contents.team' }]

export default function CompareContentsTeamPage() {
  return (
    <div className="k-landing">
      <Seo
        path="/compare/kevin-vs-contents-team"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Kevin vs Contents.team"
          lede="Both turn photographs into a contents inventory. They differ on where the camera points and on how they charge — and those are the two things worth checking before anything else."
          byline="Kevin Godfrey, Kevin"
          updated={READ_ON}
        />

        <DirectAnswer
          question="What is the difference between Kevin and Contents.team?"
          answer="Where the evidence comes from, and how you pay. Their site describes photographing rooms and charges per seat; Kevin has no seats at all, charges a flat monthly fee, and is built around photographs of individual items."
        >
          <p>
            <strong>Everything attributed to Contents.team below is a direct quote from their own
            public site, read on {READ_ON}.</strong> We have not scored their product on a feature
            grid, because we cannot test it the way you can and a table of our guesses about a
            competitor would not be worth reading. Where the honest answer is &ldquo;try both&rdquo;,
            that is what this page says.
          </p>
          <p>
            Kevin is not affiliated with Contents.team. Their site is the authority on what their
            product does today; if it has changed since the date above, it is right and this is
            stale.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What they say, in their words</h2>
          <ComparisonTable
            caption={`Quoted from contents.team, read ${READ_ON}`}
            columns={['On', 'Their words']}
            rows={[
              ['The promise', '“The inventory writes itself.”'],
              ['The workflow', '“You shoot. That’s the whole job.”'],
              ['The photographs', '“Photograph each room the way you already do, even the dim basement and the inside of the wardrobe.”'],
              ['Pricing', '“Seats are $299/month, and every organization gets 1,000 items included each month.”'],
              ['Exports', '“Approved claim inventories can export as XactContents-format XLSX, CSV, or a PDF report.”'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Where the camera points</h2>
          <p>
            This is the real distinction, and it is visible in each product&rsquo;s own description
            rather than inferred. Theirs is written around the room. Kevin is written around the
            item: several photographs of one object &mdash; the thing itself, its model plate, the
            damage &mdash; are proposed as a single line, which you confirm before anything is
            priced.
          </p>
          <EvidenceCallout>
            <p>
              The consequence to test for is simple arithmetic. In Kevin{' '}
              <strong>items never outnumber photographs</strong>, because a set becomes at most one
              line and context shots become none. If a tool reports more items than you took
              pictures, that is worth understanding before the schedule goes to a desk reviewer.
            </p>
          </EvidenceCallout>
          <p>
            Neither approach is automatically right. Room-first is quicker to a draft and good for
            establishing that property existed and roughly how much of it. Item-first costs more
            shooting time and gives the schedule something to argue from when brand, model or tier
            moves the price. Which matters depends on the claim.
          </p>
        </section>

        <section className="k-seosec">
          <h2>How each one charges</h2>
          <ComparisonTable
            caption="Both figures are each vendor's own published pricing"
            columns={['', 'Kevin', 'Contents.team']}
            rows={[
              ['Basis', 'Flat monthly, no seats', '“Seats are $299/month”'],
              ['Price', '$249/mo, never per seat', '$299 per seat, per month'],
              ['Items included', '2,000 line items a month', '“1,000 items included each month” per organisation'],
              ['A second adjuster', 'Costs nothing', 'A second seat'],
              ['To start', 'First 250 line items free, no deadline', 'See their site'],
            ]}
          />
          <p>
            We do not sell seats on purpose. An adjuster who adds a colleague should not
            pay twice for the same software, and we never price per seat because doing so
            punishes exactly the growth a small firm is trying to achieve. That is a position, not a criticism &mdash; but it is a checkable
            difference, so do the arithmetic on your own headcount.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What to test, rather than take from us</h2>
          <p>
            Run the same ten photographs through both, including two bad ones, and look at four
            things:
          </p>
          <ul className="k-seolist">
            <li><strong>The item count against the photo count.</strong> More items than photographs needs explaining.</li>
            <li><strong>What happens to a blurred or unreadable frame.</strong> A confident wrong description is worse than a blank.</li>
            <li><strong>Whether a price traces to a listing</strong> you can open from the row.</li>
            <li><strong>Whether the export imports</strong> without reformatting. Actually import it.</li>
          </ul>
          <p>
            Those four answer more than any comparison page, including this one. The criteria in
            full are on{' '}
            <a href="/guides/best-contents-software-public-adjusters">
              what to look for in contents software
            </a>
            , which deliberately ranks nothing.
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
              to: '/guides/best-contents-software-public-adjusters',
              t: 'What to look for in contents software',
              d: 'Evaluation criteria and the questions to put to any vendor, including us.',
            },
            {
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'What a room photograph can and cannot establish.',
            },
            {
              to: '/compare/kevin-vs-xactcontents',
              t: 'Kevin vs XactContents',
              d: 'Row by row, including when XactContents is the better fit.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly, never per seat. First 250 line items free.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
