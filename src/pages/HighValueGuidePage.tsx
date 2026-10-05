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
 * /guides/high-value-contents-claims — batch 3, spec page 22.
 *
 * RULE 12 IS THE TRAP ON THIS PAGE. The old "$5k / special-limit approval
 * gate" is dead: if the engine finds solid comps it prices an item regardless
 * of dollar amount, and a $10k sofa prices normally. So a page about
 * high-value property must never imply Kevin holds items back because they are
 * expensive. What it CAN say, because it is true:
 *
 *  - the worksheet has a high-value filter, which is a VIEW, not a gate;
 *  - appraisal classes are never auto-priced, and that set is broader than the
 *    four usually quoted -- jewelry, firearms, fine arts and furs, PLUS fine
 *    china and graded trading cards (FRONTEND.md: MANUAL_CLASSES);
 *  - special_limits, the amber coverage-cap cue, is a DIFFERENT and narrower
 *    set: jewelry (fine only), firearms, fine arts, furs and collectible coins.
 *    Watches and costume jewelry are deliberately not flagged.
 *
 * Conflating those two sets is a real bug the backend doc calls out by item
 * number, so this page keeps them apart.
 *
 * The brief's "combines multiple evidence signals rather than one image or one
 * OCR result" named the signals. Trimmed per the owner's standing instruction.
 */

const FAQS: Faq[] = [
  {
    q: 'Should high-value items be listed separately?',
    a: 'Nearly always. The moment an item’s value turns on brand, model, configuration or condition, grouping it with similar-looking property throws away the detail that justifies the number.',
  },
  {
    q: 'Is one photo enough for a high-value item?',
    a: 'Rarely. One frame establishes that the property existed; a second of the model plate establishes which product it was, and that is what the price is argued from. On expensive property the marginal photograph is the cheapest evidence you will ever collect.',
  },
  {
    q: 'Should a generic replacement be used if the exact item is unavailable?',
    a: 'Only if it genuinely matches on the characteristics that gave the original its value. High-value property is exactly where a loose like-kind substitution is most visible and most costly — a tier drop on a $4,000 item is a bigger error than the whole value of most lines on the claim.',
  },
  {
    q: 'Does a high price make something high-value for documentation purposes?',
    a: 'Not quite. The real test is whether small differences in identity change the replacement cost materially. A $900 appliance where the model barely moves the price needs less identification than a $900 handbag where the line and the year move it a great deal.',
  },
  {
    q: 'Does Kevin refuse to price expensive items?',
    a: 'No. If the evidence supports a price, the item is priced regardless of the amount — there is no dollar threshold that sends a line for approval. What is never auto-priced is a set of appraisal classes: jewelry, firearms, fine arts, furs, fine china and graded trading cards reach you unpriced by design.',
  },
  {
    q: 'What is the amber flag on some rows?',
    a: 'A coverage-cap cue, not a problem with the line. It marks classes that typically carry a policy sub-limit — fine jewelry, firearms, fine arts, furs and collectible coins. It flags, never blocks, and it is a different set from the appraisal classes: fine china and graded cards are never auto-priced but carry no sub-limit.',
  },
]

const CRUMBS = [{ to: '/guides/high-value-contents-claims', t: 'High-value contents' }]

export default function HighValueGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/high-value-contents-claims"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Document High-Value Contents"
          lede="&ldquo;Camera — $3,500&rdquo; is not a line item, it is a number with a noun attached. On property where identity moves the price, the description is the argument."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="What makes an item high-value for documentation purposes?"
          answer="Not a dollar threshold — whether small differences in identity change the replacement cost materially. Where brand, model, configuration, edition or condition move the price, the identification has to carry that detail."
        >
          <p>
            &ldquo;Camera &mdash; $2,000&rdquo; could be an entry-level mirrorless body, a
            professional full-frame body, a modest body with an expensive lens, or a discontinued
            specialty model. Those are four different claims, and the schedule cannot tell a
            reviewer which one it is.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Where the detail earns its keep</h2>
          <ComparisonTable
            caption="Configuration that materially changes replacement cost"
            columns={['Category', 'What has to be captured']}
            rows={[
              ['Camera systems', 'Body and lens are often separate lines, not one item'],
              ['Computers', 'Processor, memory, storage and screen size'],
              ['Power tools', 'Battery platform and kit configuration, which can double a price'],
              ['Musical instruments', 'Model, finish, pickups, hardware, whether the case is included'],
              ['Designer goods', 'Material, size, collection and edition'],
              ['Watches', 'Reference number, movement, bracelet and box or papers'],
              ['Premium appliances', 'Capacity, fuel type and finish'],
            ]}
          />
          <p>
            A high-value item reduced to its category has lost precisely the information that would
            have justified its value.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What to photograph</h2>
          <p>
            One frame establishes the property existed. What prices it is the second and third: the
            manufacturer mark, the model or serial plate, the feature that sets the tier, and the
            damage. All of those describe one item and belong on one line.
          </p>
          <EvidenceCallout>
            <p>
              Receipts, purchase histories and warranty records are worth digging out <strong>before
              the list is built, not after a figure is questioned.</strong> On expensive property
              they frequently settle the configuration question that photographs alone cannot.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Use the market the item actually trades in</h2>
          <ComparisonTable
            caption="The source should match the property"
            columns={['Item', 'Where a defensible figure comes from']}
            rows={[
              ['Current premium television', 'Ordinary retail — the same model is on sale now'],
              ['Professional camera body', 'Authorised dealer or major retailer'],
              ['Discontinued luxury handbag', 'Specialist resale, where that item actually trades'],
              ['Collectible', 'Collector marketplace, judged on edition and condition'],
              ['Vintage instrument', 'Specialist dealer or the secondary market'],
            ]}
          />
          <p>
            Where retail can price the item, it should. Where it genuinely cannot, Kevin prices from
            the resale market instead, used raw and labelled as resale so a used-market figure is
            never read as a new-replacement one.
          </p>
        </section>

        <section className="k-seosec">
          <h2>High value does not mean unpriced — or undepreciated</h2>
          <p>
            There is no dollar threshold in Kevin that sends a line for approval. If the evidence
            supports a price, the item is priced whatever the amount; a $10,000 sofa prices like any
            other sofa.
          </p>
          <p>
            What <em>is</em> never auto-priced is a set of appraisal classes — jewelry, firearms,
            fine arts, furs, fine china and graded trading cards. Those arrive unpriced by design,
            because a number produced without an appraisal on that property is worse than a blank.
            Separately, and it is a different list, some classes carry a policy sub-limit and are
            flagged amber on the worksheet: fine jewelry, firearms, fine arts, furs and collectible
            coins. That cue flags; it never blocks.
          </p>
          <p>
            Depreciation still applies on its own terms. High value is not a reason to skip it, and
            the class rather than the price decides the useful life.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Spend review where the money is</h2>
          <p>
            The point of automating the repetitive part of a claim is to buy attention for the lines
            that deserve it. On a large inventory those are the ambiguous identifications, the
            unusual products, the discontinued property, the condition-sensitive markets &mdash; and
            anything whose price sits a long way from its neighbours for no visible reason. The
            worksheet filters to high-value lines so you can work them as a group, which is a view,
            not a gate.
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
              to: '/guides/collectibles-insurance-contents',
              t: 'Pricing collectibles',
              d: 'Edition, condition and completeness, where the ordinary rules stop applying.',
            },
            {
              to: '/guides/exact-match-vs-like-kind-quality',
              t: 'Exact match vs like kind and quality',
              d: 'What a replacement has to preserve to stand up.',
            },
            {
              to: '/guides/public-adjuster-contents-inventory',
              t: 'Contents inventory field guide',
              d: 'What belongs on a line, and how specific to be.',
            },
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'Why class, not price, decides the useful life.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
