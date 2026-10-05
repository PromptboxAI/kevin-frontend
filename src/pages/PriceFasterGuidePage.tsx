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
 * /guides/how-to-price-contents-claims-faster — spec page 5, Tier 1.
 *
 * THE TIME-SAVINGS SECTION THE BRIEF ASKS FOR IS NOT A NUMBER HERE, and that
 * is deliberate. The brief wants a "time-savings case study based on validated
 * Kevin use"; the figures we currently publish do not agree with each other.
 * The home page's stats ribbon says a 256-photo claim takes ~29 minutes of
 * machine time against 13.3 hours by hand, while the ROI calculator below it
 * is built on HOURS_SAVED = 4.5 per claim. Both cannot be right, the owner has
 * been asked, and until that is settled this page describes the SHAPE of the
 * saving (unattended machine time, human time spent on exceptions) without
 * asserting a multiplier. Publishing a figure that contradicts another page is
 * worse for an authority page than publishing none.
 *
 * Everything else here is the product as it is: identification before pricing,
 * one item per photograph, blank editable cells where Kevin will not guess,
 * and the four classes that are never auto-priced.
 */

const FAQS: Faq[] = [
  {
    q: 'What actually takes the time on a large contents claim?',
    a: 'Not judgment — transcription. Describing each item, searching for what it costs to replace, comparing listings that are not quite the same product, copying a URL, choosing a category, looking up depreciation, then typing a row. The thinking per line is seconds; the clerical work is minutes, and it repeats for every line.',
  },
  {
    q: 'Where should automation stop?',
    a: 'At anything where being wrong is expensive and being fast is not valuable: variants that look identical but price differently, collectibles, ambiguous evidence, and high-value property. Jewelry, fine arts, firearms and furs are never auto-priced at all — they reach you with the price cell blank.',
  },
  {
    q: 'Does faster mean less defensible?',
    a: 'It should mean more. The reason manual pricing is fragile is that evidence gets dropped when time is short — the URL does not make it into the column. Automating the research means the listing behind every price is stored on the line and prints into the export, whether or not anyone was in a hurry.',
  },
  {
    q: 'What is left for me to do?',
    a: 'Confirm the grouping, fix the identifications that are wrong, price the lines Kevin left blank, and make the claim-specific calls: what is actually a total loss, what the insured can document, what a carrier will question. The worksheet is fully editable and every money column recomputes server-side when you change an input.',
  },
  {
    q: 'Can I work in batches instead of all at once?',
    a: 'Yes. A claim takes many ingest sessions: a second drop appends rather than overwriting, line numbering continues rather than renumbering — an export already sent to a carrier cites those numbers — and duplicate detection spans the whole claim rather than the batch.',
  },
]

const CRUMBS = [
  { to: '/guides/how-to-price-contents-claims-faster', t: 'How to price contents claims faster' },
]

export default function PriceFasterGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/how-to-price-contents-claims-faster"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Price Insurance Contents Claims Faster"
          lede="The savings come from automating identification, replacement-cost research, source documentation, classification and depreciation — while keeping human review before anything is finalised."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="What is the fastest defensible way to price a large contents claim?"
          answer="Automate the repetitive parts — identification, replacement-cost research, source links, classification and depreciation — and keep a person on grouping, exceptions and the claim-specific judgment."
        >
          <p>
            Every minute saved by skipping evidence is borrowed, and the carrier collects. The
            durable savings come from removing the clerical work entirely rather than doing it
            faster: if the listing behind a price is captured automatically, it is there whether or
            not the file was built under deadline.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Why large contents claims take so long</h2>
          <p>
            A pack-out of a three-bedroom house runs to hundreds of photographs and several hundred
            line items. The work is not hard, it is uniform: the same seven steps per line, several
            hundred times, with no cumulative learning — the four hundredth lamp takes as long as
            the first. That is the profile of work a machine should carry.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The five bottlenecks</h2>
          <ComparisonTable
            caption="Where the hours go, and what removes them"
            columns={['Bottleneck', 'By hand', 'Automated']}
            rows={[
              ['Identification', 'Read the photo, type a description, hope it matches the product', 'Read from the photographs, with several signals weighed together; blank where unreadable'],
              ['Finding the comparable', 'Search, open several retailers, compare variants', 'Researched per item, and priced from one listing rather than a blend'],
              ['Source links', 'Copy a URL per line, or skip it when short of time', 'Stored on the row automatically and printed in the export'],
              ['Categories', 'Chosen per line from memory', 'Carried on the line and used for the schedule'],
              ['Depreciation', 'Looked up per category and per age', 'Server-computed from class and age, to 100%'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>A workflow that holds up</h2>
          <p>
            The order is what makes it defensible. Group before identifying, so one item
            photographed twice is one line. Identify before pricing, because a price is only as
            good as the identification under it. Review before promoting, so nothing enters the
            claim unseen.
          </p>
          <WorkflowDiagram />
        </section>

        <section className="k-seosec">
          <h2>Where automation should stop</h2>
          <EvidenceCallout>
            <p>
              Four classes are never auto-priced: <strong>jewelry, fine arts, firearms and
              furs</strong>. They arrive with the price cell blank whatever the market looks like,
              because the cost of being casually wrong on them is far higher than the minutes saved.
            </p>
          </EvidenceCallout>
          <ul className="k-seolist">
            <li>
              <strong>Variants that price differently.</strong> Same model name, different capacity,
              finish or generation. If the photograph cannot settle which one it is, the line should
              wait for you.
            </li>
            <li>
              <strong>Collectibles.</strong> Condition and provenance drive the price more than the
              product identity does, and neither is visible in a pack-out photograph.
            </li>
            <li>
              <strong>Ambiguous evidence.</strong> A blurred label or a frame that only establishes
              an object existed. Kevin returns a blank, editable cell here rather than a guess.
            </li>
            <li>
              <strong>High-value property.</strong> Not because software cannot price it, but
              because a single line can move the claim enough to deserve a second pair of eyes.
            </li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>What the run looks like</h2>
          <p>
            Several hundred photographs go up in one click. They are grouped into candidate sets —
            fewer sets than photographs, because the wide shot and the model plate are one item. You
            merge, split and exclude, then process. The lines come back identified, priced from a
            listing, classified and depreciated, with the ones Kevin would not guess at left blank
            for you. Machine time is unattended: you are not watching a progress bar, you are
            reviewing the result.
          </p>
          <p className="k-seonote">
            We are not publishing an hours-saved figure on this page yet. The figures currently on
            the site do not agree with each other, and an authority page should not be the place
            that contradiction gets repeated.
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
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'The whole workflow, in the order you meet it.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'Query construction, comparable filtering, and where resale comes in.',
            },
            {
              to: '/contents-claims/without-photos',
              t: 'Pricing when the photographs are gone',
              d: 'The separate route for total losses: a typed or exported list.',
            },
            {
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'Contents inventory software for public adjusters',
              d: 'The whole workflow, framed for the people who run it daily.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
