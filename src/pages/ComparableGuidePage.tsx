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
 * /guides/replacement-cost-comparable — spec page 11 in the brief, Tier 2.
 *
 * Rule 10 gives the three valuation bases and this page uses exactly those
 * names: retail comp (still sold new), like-kind substitute (discontinued,
 * priced as the nearest NEW equivalent) and manual/appraisal. There is no
 * fourth basis and no back-solve -- RCV is never derived by dividing a
 * depreciated figure by (1 - depr%).
 *
 * The brief's point 4 is one worth making carefully: a historic screenshot is
 * not permanently controlling. A price is a current fact, and a link captured
 * two years ago evidences what the price WAS. That is why the page says "a
 * listing" rather than "a live listing" and why a dated proof link is kept
 * rather than a promise that the URL will resolve forever.
 */

const FAQS: Faq[] = [
  {
    q: 'What makes a comparable defensible?',
    a: 'It is the same product, or close enough on the characteristics that drive its price that a reasonable reviewer would accept it as the replacement. Identity first, then variant, then quantity and form — and the listing price as shown, not a figure assembled from several listings.',
  },
  {
    q: 'What if the exact model is discontinued?',
    a: 'Then the basis changes and says so: a like-kind substitute, priced as the nearest current equivalent sold new. That is a different claim from "this is the same item", and labelling it honestly is what makes it survive review.',
  },
  {
    q: 'Can you work backwards from a depreciated value?',
    a: 'No. Replacement cost is researched directly and depreciation is applied to it. Dividing a used price by one minus a depreciation percentage manufactures a replacement cost that no listing supports.',
  },
  {
    q: 'Is a screenshot from last year still good evidence?',
    a: 'It evidences what the price was then, which is worth something and is not the same as the current replacement cost. Kevin keeps a dated proof link for exactly that reason: the date is part of the evidence, not a detail.',
  },
  {
    q: 'When is a resale listing the right comparable?',
    a: 'When the retail market cannot price the item at all — discontinued, vintage or collectible property. The figure is used raw, with no gross-up, and labelled as resale so nobody reads a used-market price as a new-replacement one.',
  },
  {
    q: 'Who decides in the hard cases?',
    a: 'You do. Jewelry, fine arts, firearms and furs are never auto-priced; ambiguous items come back with a blank, editable cell; and any price can be replaced by hand, which tags the line as manual and gives you a field for your own proof URL.',
  },
]

const CRUMBS = [{ to: '/guides/replacement-cost-comparable', t: 'Defensible replacement comparables' }]

export default function ComparableGuidePage() {
  return (
    <div className="k-landing">
      <Seo path="/guides/replacement-cost-comparable" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="What Makes a Good Replacement Cost Comparable for a Contents Claim?"
          lede="A defensible comparable matches the item's identity and functional characteristics closely enough to represent what replacing it actually costs — and arrives with the listing attached."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="What makes a replacement cost comparable defensible?"
          answer="That it is the same product — or the nearest current equivalent, labelled as such — priced at what one listing actually charges, with that listing kept as the evidence."
        >
          <p>
            Two failures sink comparables in review. The first is a listing that is not the item:
            right name, wrong capacity. The second is a price with no provenance: a number in a
            column that nobody can trace. Both are avoidable, and neither is a matter of judgment.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The matching hierarchy</h2>
          <p>Work down it, and stop at the first rung that holds.</p>
          <ComparisonTable
            caption="From strongest to weakest, with the basis each implies"
            columns={['Rung', 'What it is', 'Basis']}
            rows={[
              ['1. Exact model', 'The same product, still sold new', 'Retail comp'],
              ['2. Current successor', 'The model that replaced it in the line-up', 'Retail comp'],
              ['3. Same-brand equivalent', 'Different model, matching specification', 'Like-kind substitute'],
              ['4. Functional equivalent', 'Different brand, same function and quality tier', 'Like-kind substitute'],
              ['5. Appraisal or manual', 'Where no listing represents the item', 'Manual / appraisal'],
            ]}
          />
          <p className="k-seonote">
            Those are the only three bases Kevin records: retail comp, like-kind substitute, and
            manual or appraisal. A line always says which one it is on.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What never to price from</h2>
          <ul className="k-seolist">
            <li><strong>A bundle.</strong> A four-pack priced as one unit inflates the line by the multiple.</li>
            <li><strong>A materially different variant.</strong> Capacity, size and finish often carry most of the price.</li>
            <li><strong>The wrong form factor.</strong> A mount is not the television; a case is not the camera.</li>
            <li><strong>An unrelated listing that shares a name.</strong> Product names repeat across categories.</li>
            <li><strong>A price built from several listings.</strong> If no single listing charges it, nobody can verify it.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>A price is a current fact</h2>
          <EvidenceCallout>
            <p>
              A screenshot from two years ago evidences what the price <em>was</em>. It is not
              permanently controlling, and treating it as though it were is how a file ends up
              defending a number the market has moved away from. Kevin keeps a{' '}
              <strong>dated</strong> proof link, because the date is part of the evidence.
            </p>
          </EvidenceCallout>
          <p>
            It is also why the wording matters: Kevin prices from <em>a listing</em>, not from "a
            live listing". Links go stale over months. The claim is about what the replacement cost
            is, evidenced by what a seller was charging on a stated date.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Retail and resale, and the line between them</h2>
          <ComparisonTable
            caption="Which market answers"
            columns={['Situation', 'Market', 'How it is recorded']}
            rows={[
              ['Still sold new', 'Retail', 'Retail comp, priced from one listing'],
              ['Discontinued, equivalent exists', 'Retail', 'Like-kind substitute, priced as the nearest new equivalent'],
              ['Vintage or collectible, thin retail', 'Resale', 'Used raw, no gross-up, labelled as resale'],
              ['Nothing represents it', 'Neither', 'Blank editable cell; manual or appraisal'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>The link is half the comparable</h2>
          <p>
            A comparable is a claim about the market, and a claim about the market needs a
            referent. Kevin stores the listing behind each priced line and prints it into both the
            Excel worksheet and the PDF, so the answer to "where did this come from" is a URL rather
            than a recollection. On a line you priced yourself, that field is yours to fill with the
            evidence you relied on.
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
              to: '/guides/automate-replacement-cost-research',
              t: 'Automating replacement-cost research',
              d: 'What a defensible search needs, and the matches worth filtering out.',
            },
            {
              to: '/insurance-contents-pricing-software',
              t: 'How contents pricing works',
              d: 'Query, filtering, and pricing from a single listing.',
            },
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'What happens to the replacement cost once it is established.',
            },
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'Identification before pricing, review before promotion.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
