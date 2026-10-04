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
 * /guides/what-carriers-look-for-contents-inventory — batch 2, spec page 17.
 *
 * The page is about how a DESK ADJUSTER reads a schedule. Two guards:
 *
 *  1. Rule 4. Kevin has no carrier-facing surface and does not submit into
 *     carrier systems. A page titled "what carriers look for" must not drift
 *     into implying we have a carrier product or a relationship with one. It
 *     describes review as a thing that happens to a file, which is what a
 *     public adjuster is preparing for.
 *  2. The brief explains HOW dedupe works ("deduplicated claim-wide by image
 *     hash") and how clustering proposes groups. Same trim as page 16 -- the
 *     reader needs to know duplicate photographs do not become duplicate
 *     property, not the mechanism that achieves it.
 *
 * Depreciation is built on XactContents categories and sub-categories -- the
 * class plus the age selects the rate (owner, 2026-10-04). Rule 4 still holds:
 * using their taxonomy is not a carrier relationship, and Kevin has no
 * carrier-facing surface.
 */

const FAQS: Faq[] = [
  {
    q: 'Do insurance companies require a source for every item?',
    a: 'Requirements vary by carrier and by claim, so there is no universal rule. What is consistent is that a price with its listing attached is far easier to evaluate than a number on its own — the question that comes back most often is where a figure came from, and a line that already answers it does not generate that round trip.',
  },
  {
    q: 'Can a carrier question a replacement because the brand is different?',
    a: 'Yes, and the brand itself is not really the issue. What matters is whether the proposed replacement reasonably matches the damaged item in quality, function and the characteristics that set its value. A different brand at the same tier can be perfectly reasonable; the same brand at a lower tier often is not.',
  },
  {
    q: 'Why do contents inventories get questioned?',
    a: 'Most often for vague descriptions, quantities nothing supports, replacements that are not really comparable, depreciation applied inconsistently across the schedule, duplicate items, and prices with no traceable source. Nearly all of these are consistency problems that grow with the size of the claim.',
  },
  {
    q: 'Do adjusters verify replacement links?',
    a: 'They may, and on a large or contested schedule they often do — usually by sampling rather than line by line. The link lets a reviewer check both the product chosen and the price used, which is why a stored source is worth more than a price that was researched carefully and then not recorded.',
  },
  {
    q: 'What makes a contents schedule easier for a desk adjuster to review?',
    a: 'Descriptions specific enough to judge, quantities that make sense, evidence that supports the description, replacements that genuinely match, current pricing, depreciation applied the same way throughout, and a source on each priced line. A reviewer should never have to reverse-engineer how a number was reached.',
  },
  {
    q: 'Does a source link make a line defensible on its own?',
    a: 'No. A link to the wrong product is not evidence — it is a faster way to find the error. The comparable underneath still has to be the right model, the right size and capacity, one item rather than a bundle, and the right quality tier. The link makes the comparable checkable; it does not make it correct.',
  },
]

const CRUMBS = [
  { to: '/guides/what-carriers-look-for-contents-inventory', t: 'What a reviewer looks for' },
]

export default function CarrierReviewGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/what-carriers-look-for-contents-inventory"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="What Does an Adjuster Look for When Reviewing a Contents Inventory?"
          lede="A desk review is not an audit of the arithmetic. It is a test of whether each line is supported — and of whether the schedule treated line 900 the same way it treated line 9."
          byline="Kevin Godfrey, Kevin"
          updated="4 October 2026"
        />

        <DirectAnswer
          question="What does a reviewer actually check on a contents schedule?"
          answer="Whether the item is clearly identified, whether the quantity makes sense, whether the evidence supports the description, whether the replacement is genuinely comparable, where the price came from, and whether depreciation was applied consistently."
        >
          <p>
            A ten-line schedule can be read in full. A thousand-line schedule cannot, so it gets
            sampled — and sampling rewards consistency over care on any individual row. The lines
            that draw attention are the ones that differ from their neighbours for no visible
            reason.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The ten checks</h2>
          <ComparisonTable
            caption="Roughly the order a reviewer works in"
            columns={['Check', 'What fails it']}
            rows={[
              ['Is the item identified?', '“Electronics — $2,400”: nothing to evaluate'],
              ['Does the quantity make sense?', 'A line that does not say whether it is one, several or a set'],
              ['Does the evidence support it?', 'A description carrying detail no photograph establishes'],
              ['Is the replacement comparable?', 'A bundle priced as one item, or a tier swap in either direction'],
              ['Can the price be verified?', 'A figure with no listing behind it'],
              ['Is the pricing current?', 'A number carried over from months earlier'],
              ['Is the class right?', 'Shoes and a collectible depreciating identically'],
              ['Is the age reasonable?', 'Every item listed as exactly one year old'],
              ['Are there duplicates?', 'The same television appearing twice'],
              ['Does the math reconcile?', 'A row that does not foot from quantity to ACV'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Comparability is where most of the argument is</h2>
          <p>
            A replacement should not be the first expensive thing a search returned. The
            characteristics that get compared are the ones that set the price: manufacturer, model,
            size, capacity, material, specification, configuration and quality tier.
          </p>
          <EvidenceCallout>
            <p>
              Two failures mirror each other, and both are common. A single item priced from a{' '}
              <strong>multi-item bundle</strong> inflates the line by the multiple. A premium item
              replaced with an <strong>entry-level product of the same dimensions</strong>{' '}
              understates it. Similar keywords are not similar property.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Duplicates, and why large claims are exposed to them</h2>
          <p>
            A second photograph of the same television must not become a second television. This is
            not a hypothetical on a pack-out where one item is shot four times from different
            angles — it is the default outcome unless something prevents it.
          </p>
          <p>
            Kevin handles it in two places: a photograph already stored on the claim resolves as a
            duplicate rather than arriving twice, and related frames are proposed as a single item
            for you to confirm before anything becomes a claim line. The effect a reviewer sees is
            simply that the item count never exceeds the photograph count.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Consistency is the thing that scales</h2>
          <ComparisonTable
            caption="What has to hold steady across the whole schedule"
            columns={['Dimension', 'The failure it prevents']}
            rows={[
              ['Description depth', 'Half the schedule priceable, half of it arguable'],
              ['Class assignment', 'Two like items on different useful lives'],
              ['Age handling', 'Ownership age in one place, model year in another'],
              ['Source selection', 'Some lines traceable, some not'],
              ['Depreciation', 'A percentage that moves without a reason on the row'],
              ['Quantity treatment', 'Sets and singles counted the same way'],
              ['Duplicate handling', 'Property claimed twice'],
            ]}
          />
          <p>
            This is the strongest argument for automating the repetitive part of a contents claim.
            Not speed — consistency. Software applies the same rule to line 900 that it applied to
            line 9, and leaves you the exceptions, which is where judgment was always supposed to go.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What a strong line lets a reviewer do</h2>
          <p>
            Answer five questions without leaving the row: what was damaged, how it was identified,
            what replacement was selected, where the price came from, and how depreciation was
            determined. Kevin is built to produce that chain the same way on every line — and the
            export is a file you send, reviewed by you first. Kevin does not submit into carrier
            systems and has no carrier-facing review surface.
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
              d: 'What belongs on a line, and how specific a description has to be.',
            },
            {
              to: '/guides/replacement-cost-comparable',
              t: 'Finding a defensible comparable',
              d: 'The matching hierarchy, and what never to price from.',
            },
            {
              to: '/guides/rcv-vs-acv-personal-property',
              t: 'RCV vs ACV on a contents claim',
              d: 'How a real line foots once tax is in it.',
            },
            {
              to: '/compare/kevin-vs-xactcontents',
              t: 'Kevin vs XactContents',
              d: 'Row by row, including when XactContents is the better fit.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
