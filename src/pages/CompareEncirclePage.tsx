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
 * /compare/kevin-vs-encircle — batch 6.
 *
 * ⚠️ READ BEFORE EDITING. Same rule as the Contents.team page: everything
 * attributed to Encircle is QUOTED OR CLOSELY PARAPHRASED FROM THEIR OWN
 * PUBLIC PAGES AND HELP CENTRE, read on 2026-11-04 and dated on the page.
 * Nothing is scored and no capability is guessed at.
 *
 * A correction worth keeping, because it nearly shipped: the first draft of
 * this page was going to say Encircle documents and packs out while Kevin
 * prices -- i.e. that they do not price contents. THEY DO. Their help centre
 * documents replacement pricing, a per-item depreciation category, item age,
 * sales tax and ACV. Checking took one search and saved a page built on a
 * false premise about a competitor, which is exactly what the
 * /guides/best-contents-software page promises we will not publish.
 *
 * The REAL difference, from their own documentation: in Encircle a person
 * browses retailer sites and bookmarks a price per item ("Browse around until
 * you find a suitable replacement item"). In Kevin the engine does that and
 * the link lands on the row. Both end with a source link in the report --
 * we agree on what provenance means and differ on who does the work.
 *
 * Also note Encircle is the ESTABLISHED one here: 13 years, 3,000+ shops, and
 * C&R's #1 for ROI in 2023 and 2024. The page says so. A comparison that
 * pretends the incumbent is small reads as dishonest to the exact reader who
 * already uses them.
 */

const READ_ON = '4 November 2026'

const FAQS: Faq[] = [
  {
    q: 'Does Encircle price contents?',
    a: 'Yes. Their help centre documents replacement pricing in both the mobile and web apps, a per-item depreciation category with item age, claim-level sales tax, and actual cash value. Anyone telling you Encircle is documentation-only has not read their documentation.',
  },
  {
    q: 'So what is actually different?',
    a: 'Who does the research. Encircle’s guide says to pick a retailer or Google, then "browse around until you find a suitable replacement item" and bookmark the price from that item’s page. In Kevin the engine does the searching and the source link lands on the row. Both end with a link an adjuster can open — the difference is whether a person spent the afternoon finding it.',
  },
  {
    q: 'Which one should a restoration contractor use?',
    a: 'Encircle, on the evidence of what each tool is for. Pack-out, QR box labels, scan-to-pack, moisture and psychrometric readings, sketches, an IICRC-aligned mitigation scope and a Xactimate hand-off are their platform. Kevin does none of that and is not trying to.',
  },
  {
    q: 'Can a claim use both?',
    a: 'Often it does. The restoration firm packs out and documents the job in Encircle; the adjuster builds and prices the settlement schedule in Kevin. They are different jobs performed by different people on the same loss, and neither replaces the other.',
  },
  {
    q: 'How does depreciation differ?',
    a: 'Encircle applies a depreciation category and item age per line, with optional claim-level Default Depreciation and a Max Depreciation ceiling — their example sets 50%, and 0% turns it off entirely. Kevin applies a published per-class schedule and renders what it returns, including 100% on a line past its useful life. We publish the whole schedule so you can check any line by hand.',
  },
  {
    q: 'Is Encircle bigger than Kevin?',
    a: 'Considerably. Their site says 13 years in restoration and 3,000+ restoration shops, and Contractor & Restorer named them #1 for ROI in 2023 and 2024. We are newer and narrower. That is a fair thing to weigh, and it is why this page points at what each tool does rather than at who is larger.',
  },
]

const CRUMBS = [{ to: '/compare/kevin-vs-encircle', t: 'Kevin vs Encircle' }]

export default function CompareEncirclePage() {
  return (
    <div className="k-landing">
      <Seo path="/compare/kevin-vs-encircle" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Kevin vs Encircle"
          lede="Both document contents and both put a replacement price on the line. The difference is what the tool is built around — a restoration job, or a settlement schedule — and whether a person does the price research."
          byline="Kevin Godfrey, Kevin"
          updated={READ_ON}
        />

        <DirectAnswer
          question="What is the difference between Kevin and Encircle?"
          answer="Encircle is a restoration field-documentation platform where contents is one module alongside readings, sketches and mitigation scope; pricing a line means a person browsing retailers and bookmarking a price. Kevin is contents only, for the adjuster, and researches the replacement price itself."
        >
          <p>
            <strong>Everything attributed to Encircle on this page is quoted or closely
            paraphrased from their own public site and help centre, read on {READ_ON}.</strong>{' '}
            Nothing is scored, and where we could not verify something we left it out rather than
            guessing. Their site is the authority on their product; if it has changed since that
            date, it is right and this is stale.
          </p>
          <p>
            One thing to say plainly at the top: <strong>Encircle prices contents.</strong> Their
            help centre documents replacement pricing in the field and the office, a per-item
            depreciation category, item age, claim-level sales tax and actual cash value. We
            mention it because the opposite is easy to assume from their marketing, which leads
            with pack-out.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Choose Encircle if</h2>
          <p>
            You are a <strong>restoration contractor</strong>, and the job is the thing you need
            documented. Their platform covers what Kevin does not do at all:
          </p>
          <ul className="k-seolist">
            <li>Pack-out, QR-code box labels and scan-to-pack, so an item can be found when the homeowner asks for it</li>
            <li>Psychrometric, moisture and equipment readings logged as you walk the job</li>
            <li>2D floor-plan sketches from a smartphone walk-through</li>
            <li>An IICRC-aligned mitigation scope, and a one-click hand-off to Xactimate</li>
            <li>Offline capture across the whole app, syncing when signal returns</li>
            <li>Pre-existing-damage evidence for liability disputes</li>
          </ul>
          <p>
            If any of that is the reason you are shopping, the comparison ends here. Kevin has no
            pack-out, no QR labels, no readings, no sketches and no mitigation estimating, and
            adding them is not on our roadmap.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Choose Kevin if</h2>
          <p>
            You are an <strong>adjuster producing a settlement schedule</strong>, and the expensive
            part of your day is researching what several hundred items cost today.
          </p>
          <ComparisonTable
            caption={`Encircle details from their site and help centre, read ${READ_ON}`}
            columns={['On', 'Encircle', 'Kevin']}
            rows={[
              [
                'Finding the replacement price',
                '“Browse around until you find a suitable replacement item”, then bookmark the price from that item’s page',
                'The engine researches it; the source link lands on the row',
              ],
              [
                'Where the price comes from',
                'The retailer page the user bookmarked — “the URL will appear in reports”',
                'A single listing, linked from the line and printed in the export',
              ],
              [
                'Multiple candidates',
                'Bookmark several; one is set as the “primary replacement”, which drives ACV',
                'Alternates sit in the RCV popover with a dated proof link',
              ],
              [
                'Depreciation',
                'Per-item depreciation category and age; optional claim-level Default and a Max ceiling',
                'A published per-class schedule — 31 categories, 87 sub-lines — applied by class and age',
              ],
              [
                'Depreciation ceiling',
                'Max Depreciation is a claim setting; their example uses 50%, and 0% disables it',
                'No global ceiling — a line past its useful life renders 100% and a $0.00 ACV',
              ],
              [
                'Primary buyer',
                'Restoration contractors and their crews',
                'Independent and public adjusters, and estate professionals',
              ],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>We agree with Encircle about what provenance means.</strong> Their guide is
              emphatic that you bookmark from the specific item&rsquo;s page and{' '}
              <em>&ldquo;not from a search results page&rdquo;</em>, so the adjuster can see where
              the price came from. That is the same standard Kevin holds a line to. The question
              this page is really about is who spends the afternoon doing it.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>They are bigger, and that counts for something</h2>
          <p>
            Encircle&rsquo;s site says 13 years in restoration and more than 3,000 restoration
            shops, and that Contractor &amp; Restorer named them #1 for ROI in its 2023 and 2024
            State of the Industry reports. We are newer and deliberately narrower.
          </p>
          <p>
            That is a real consideration and we are not going to argue you out of it. What we
            would say is that &ldquo;one app for all workflows&rdquo; cuts both ways: a platform
            serving crews, estimators and contents managers is making trade-offs that a
            contents-only tool for adjusters does not have to make.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What to test, rather than take from us</h2>
          <ul className="k-seolist">
            <li>
              <strong>Time one room of pricing end to end.</strong> Not describing the items &mdash;
              both tools write descriptions from photographs &mdash; but getting a defensible
              replacement price onto every line.
            </li>
            <li>
              <strong>Open a priced line and follow the link.</strong> Both should take you to a
              specific product page. If either lands on a search results page, that is the answer.
            </li>
            <li>
              <strong>Recompute one depreciation figure by hand.</strong> You need the schedule or
              the rate to do it, so this tests whether you can see the method at all.
            </li>
            <li>
              <strong>Import the export.</strong> Actually run it into XactContents rather than
              looking at a screenshot of it.
            </li>
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
              to: '/guides/best-contents-software-public-adjusters',
              t: 'What to look for in contents software',
              d: 'Evaluation criteria, including where they point away from us.',
            },
            {
              to: '/guides/useful-life-by-content-class',
              t: 'Useful life by content class',
              d: 'The whole schedule — 31 categories, 87 sub-lines.',
            },
            {
              to: '/compare/kevin-vs-xactcontents',
              t: 'Kevin vs XactContents',
              d: 'Row by row, including when XactContents is the better fit.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly, never per seat or per claim.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
