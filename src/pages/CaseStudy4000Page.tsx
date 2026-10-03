import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import {
  CtaBand,
  DirectAnswer,
  EvidenceCallout,
  FaqList,
  RelatedCards,
  SeoPageHead,
  StatStrip,
  WorkflowDiagram,
  crumbJsonLd,
  faqJsonLd,
  type Faq,
} from '../components/seo-kit'

/**
 * /case-studies/4000-contents-line-items-30-days — spec page 15, Tier 3, and
 * the last of the fifteen.
 *
 * WHAT IS PUBLISHED AND ON WHOSE AUTHORITY. The brief says to publish only
 * figures that can be substantiated internally, and this page was held back
 * through Tiers 1-3 for exactly that reason. The owner has now attested the
 * figure directly: 4,000+ carrier-facing contents line items produced through
 * Kevin on his own claims in the preceding month. That is first-party
 * substantiation from the person who ran the claims, and the page says so in
 * those terms rather than implying an audited third-party study.
 *
 * WHAT IS DELIBERATELY NOT PUBLISHED, still:
 *  - The brief's "approximate two-hour vs weeks" comparison. Not confirmed,
 *    and it is the kind of claim a prospect checks hardest.
 *  - Any per-claim hours figure. The site's own numbers disagree -- the home
 *    page ribbon implies ~12 hours saved on a 256-photo claim while the ROI
 *    calculator uses 4.5 -- and a case study is the worst place to repeat a
 *    contradiction.
 *  - Carrier names, claim numbers, insured names, addresses. A case study
 *    about real claims must not identify them.
 *
 * Schema is Article + BreadcrumbList per the brief. No SoftwareApplication
 * here: this is a report about use, not a product listing.
 */

const FAQS: Faq[] = [
  {
    q: 'Where does the 4,000 figure come from?',
    a: 'From Kevin’s own founder, who is a practising adjuster: 4,000+ carrier-facing contents line items produced through Kevin on his claims during a single month. It is a first-party figure from the person who ran the work, not an audited third-party study, and we would rather say that plainly than dress it up.',
  },
  {
    q: 'Does that mean 4,000 items were created without review?',
    a: 'No. Every line passed through the same review step everyone else gets: grouping confirmed before promotion, identifications corrected where wrong, and blank prices filled in by hand. Volume came from removing the typing, not from removing the person.',
  },
  {
    q: 'What was still done by hand?',
    a: 'Grouping decisions on ambiguous sets, identifications the evidence did not support, unusual comparables, and the claim-specific judgment calls — which items are a total loss, what the insured can document, what a particular desk will question.',
  },
  {
    q: 'Does this mean Kevin will do the same on my claims?',
    a: 'It means the volume is achievable with one adjuster and this workflow. Your mix matters: a claim of mostly branded, photographable property automates further than one full of custom or collectible items, which need a person either way.',
  },
  {
    q: 'Why is there no hours-saved number on this page?',
    a: 'Because the figures we currently publish elsewhere do not agree with each other, and we are not going to settle that disagreement by picking the flattering one. When the per-claim arithmetic is reconciled it will appear here with its basis stated.',
  },
]

const CRUMBS = [
  { to: '/case-studies/4000-contents-line-items-30-days', t: '4,000+ line items in 30 days' },
]

const ARTICLE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How Kevin produced 4,000+ carrier-facing contents line items in 30 days',
  author: { '@type': 'Person', name: 'Kevin Godfrey' },
  publisher: { '@type': 'Organization', name: 'Kevin' },
  datePublished: '2026-10-03',
  dateModified: '2026-10-03',
}

export default function CaseStudy4000Page() {
  return (
    <div className="k-landing">
      <Seo
        path="/case-studies/4000-contents-line-items-30-days"
        jsonLd={[ARTICLE_JSON_LD, faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="4,000+ Carrier-Facing Contents Line Items in 30 Days"
          lede="Kevin was built by a practising adjuster to solve his own bottleneck. In a single month, his claims produced more than four thousand carrier-facing contents line items through it."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <StatStrip
          stats={[
            { v: '4,000+', l: 'Carrier-facing line items', s: 'Produced through Kevin in one month' },
            { v: '30 days', l: 'The period measured', s: 'A single month of live claim work' },
            { v: 'Every line', l: 'Reviewed before promotion', s: 'Grouping confirmed by a person, not by software' },
          ]}
        />

        <DirectAnswer
          question="What does 4,000 line items in a month actually demonstrate?"
          answer="That one adjuster, using this workflow, can carry contents volume that would otherwise need either a much larger team or a much longer calendar — without dropping the evidence behind each line."
        >
          <p>
            The figure is first-party: it comes from Kevin's founder, who is a practising adjuster,
            and describes his own claims over one month. It is not an audited study and we are not
            going to present it as one. What makes it worth publishing is that the work was
            carrier-facing — these are lines that went out on real files, with the listing behind
            each price attached.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Why Kevin exists at all</h2>
          <p>
            It was built to solve the founder's own problem, which is the least glamorous and most
            reliable reason software gets built. A contents claim of several hundred items is a week
            of clerical work: describing each item, researching what it costs to replace, copying
            links, picking categories, applying depreciation, and typing all of it into a
            spreadsheet that the carrier's importer will reject if a cell contains a formula.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What the work used to be</h2>
          <ul className="k-seolist">
            <li>Photograph the pack-out, then transcribe each item into a list by hand.</li>
            <li>Research make and model from the photographs, one item at a time.</li>
            <li>Search for a replacement price, compare listings, pick one, copy the URL.</li>
            <li>Choose a content class, look up the useful life, apply depreciation for the age.</li>
            <li>Type every line into the carrier's template, then retype anything that changed.</li>
          </ul>
          <p>
            None of that is judgment. It is the same seven steps several hundred times, and it
            scales only by adding people or weeks.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What the work is now</h2>
          <WorkflowDiagram compact />
          <p>
            The photographs go up in one pass. Sets are proposed and confirmed by a person. Items
            are identified, priced from a listing, classified and depreciated, and the ones Kevin
            will not guess at arrive blank for the adjuster to fill. The export is a file the desk
            can import.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What a person still does</h2>
          <EvidenceCallout>
            <p>
              Volume came from removing the typing, <strong>not from removing the reviewer.</strong>{' '}
              Every one of those lines passed through the same confirmation step: grouping approved
              before promotion, identifications corrected where the evidence did not support them,
              blank prices filled in by hand.
            </p>
          </EvidenceCallout>
          <ul className="k-seolist">
            <li>Grouping decisions where the evidence is ambiguous.</li>
            <li>Identifications the photographs could not settle.</li>
            <li>Unusual comparables, and the four classes that are never auto-priced.</li>
            <li>Claim-specific judgment: what a particular carrier will question, and what the insured can actually document.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Why it matters for a practice</h2>
          <p>
            Contents capacity normally scales with headcount, which is why large contents claims get
            turned down or sublet. Removing the clerical layer changes the ratio: the constraint
            becomes how many claims an adjuster can exercise judgment over, not how many lines they
            can type. That is a different business, and it is available without hiring for it.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What this page does not claim</h2>
          <p>
            No hours-per-claim figure appears here. The numbers published elsewhere on this site do
            not currently agree with each other, and a case study is the worst place to settle that
            by picking the flattering one — when the arithmetic is reconciled, it will appear here
            with its basis stated. No carrier, claim number, insured name or address appears either:
            these were real claims belonging to real people.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <CtaBand
          head="See it on your own claim"
          sub="Your first 250 line items are free, with no clock running. $249/mo after that, unlimited claims."
        />

        <RelatedCards
          items={[
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'The eight stages behind every one of those lines.',
            },
            {
              to: '/public-adjusters/ai-contents-inventory-software',
              t: 'Contents inventory software for public adjusters',
              d: 'What the workflow automates, and what it leaves to you.',
            },
            {
              to: '/guides/how-to-price-contents-claims-faster',
              t: 'How to price contents claims faster',
              d: 'The five bottlenecks, and where automation should stop.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: '2,000 line items a month included, then $0.20 an item.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
