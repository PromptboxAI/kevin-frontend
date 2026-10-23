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
 * /guides/photo-vs-description-contents-pricing — batch 5, spec page 34.
 *
 * Differentiated from /contents-claims/without-photos on purpose. That page is
 * the written-import WORKFLOW: how a list is parsed, mapped, previewed and
 * imported. This one is the CHOICE between the two methods and what each costs
 * you in evidence. They cross-link rather than repeat.
 *
 * The brief's "Kevin.co's Photo Workflow" section walked the stages (staging,
 * extract, group, review, promote). Reduced to the four-step shape the owner
 * set on 2026-10-05 — review happens before pricing, and that is the part a
 * reader needs.
 *
 * Rule 24 holds throughout: a written row already IS a line item and never
 * passes through staging, which is also the cleanest way to say why the two
 * routes are not the same thing.
 */

const FAQS: Faq[] = [
  {
    q: 'Can you build a contents claim without photos?',
    a: 'Yes. Total-loss inventories are routinely reconstructed from a typed list, a restoration company’s inventory, receipts and purchase records. Each described row is researched and priced like a photographed item would be — what you lose is the brand and model precision that only evidence can supply.',
  },
  {
    q: 'Are photo-based inventories more accurate?',
    a: 'Usually, and for one specific reason: a photograph of a model plate establishes which product it was, while a description establishes what somebody remembers it was. On property where the model moves the price, that gap is the whole valuation.',
  },
  {
    q: 'Should description-only pricing be used when photos exist?',
    a: 'No. If usable item-level photographs exist, they are stronger evidence and they are already in hand. The written route exists because total losses are real, not because it is an easier option.',
  },
  {
    q: 'What makes a written description good enough to price?',
    a: 'Brand, model or collection, size or capacity, quality tier, age and quantity — roughly in that order of value. “Sofa” prices as a generic sofa. “Pottery Barn Andes sectional, 3-seat, 6 years old” prices as that, and the difference is not small.',
  },
  {
    q: 'Does a written list go through the same review as photos?',
    a: 'No, and it does not need to. Review exists to turn several photographs into one item; a written row already is a line item, so it goes straight to the worksheet. The mapping and preview steps replace it, and neither creates anything until you import.',
  },
  {
    q: 'What if some items have photos and some do not?',
    a: 'Use both. Photograph what survives, import the rest as a written list, and they land in the same worksheet and export the same way. Nothing forces a claim down one route.',
  },
]

const CRUMBS = [
  { to: '/guides/photo-vs-description-contents-pricing', t: 'Photos vs descriptions' },
]

export default function PhotoVsDescriptionGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/photo-vs-description-contents-pricing"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Photo-Based vs Description-Only Contents Pricing"
          lede="Both routes end at the same worksheet, and they are not equally strong. The question is never which method you prefer — it is which evidence still exists."
          byline="Kevin Godfrey, Kevin"
          updated="22 October 2026"
        />

        <DirectAnswer
          question="Which is better, pricing from photographs or from descriptions?"
          answer="Photographs, wherever usable ones exist — they establish which product it was rather than which product it resembled. Descriptions are the right route when the property and its photographs are both gone."
        >
          <p>
            The two are often presented as a preference. They are not. A description records what
            somebody remembers; a photograph of a model plate records what the item was. On property
            where the model moves the price, that is the whole valuation &mdash; and no amount of
            careful writing closes the gap.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What each route can establish</h2>
          <ComparisonTable
            caption="Same item, two kinds of evidence"
            columns={['', 'From photographs', 'From a description']}
            rows={[
              ['The item exists', 'Shown', 'Asserted'],
              ['Brand', 'Read off the badge or plate', 'Only if the writer knew it'],
              ['Model', 'Read off the label or barcode', 'Only if the writer knew it'],
              ['Variant', 'Capacity, size and finish are visible', 'Only if stated'],
              ['Condition', 'Visible, and the damage with it', 'Reported'],
              ['Quantity', 'Countable in frame', 'Reconstructed'],
              ['Grouping', 'Several shots become one line', 'Not applicable — a row is a line'],
            ]}
          />
          <EvidenceCallout>
            <p>
              A written line may say <strong>65-inch Samsung TV</strong>. A photograph of the label
              says <strong>QN65S90D OLED</strong>. Those price differently, and only one of them can
              be checked by somebody who was not there.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>When description-only is the right route</h2>
          <ul className="k-seolist">
            <li>A total fire loss where the contents and any photographs of them are gone.</li>
            <li>Property removed or disposed of before anyone documented it.</li>
            <li>A restoration company&rsquo;s or mover&rsquo;s inventory that exists only as a PDF.</li>
            <li>An insured rebuilding a list from memory, receipts and purchase histories.</li>
          </ul>
          <p>
            In each of those, waiting for photographic evidence is not an option, and a written
            inventory is the best remaining one. What it is not is a shortcut on a claim where the
            property is still there to photograph.
          </p>
        </section>

        <section className="k-seosec">
          <h2>A total loss does not mean no evidence</h2>
          <p>
            The property is gone; the record of it often is not. Before a list is built from memory
            alone, it is worth pulling what survives elsewhere &mdash; because each of these can
            supply the brand or model a description would otherwise guess at:
          </p>
          <ul className="k-seolist">
            <li>Photographs on phones and in cloud backups, including family and social photographs.</li>
            <li>Retailer account order histories, which carry exact models and dates.</li>
            <li>Email receipts, card statements, warranty records and manuals.</li>
            <li>Old listings or insurance schedules from a previous policy.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>How the two routes differ inside Kevin</h2>
          <ComparisonTable
            caption="Different front ends, one worksheet"
            columns={['', 'Photographs', 'Written list']}
            rows={[
              ['Starts from', 'The items themselves, in frame', 'A PDF, CSV or spreadsheet'],
              ['Review step', 'Related shots confirmed as one item first', 'Skipped — a row already is a line'],
              ['Before anything is created', 'You confirm the grouping', 'You map the columns and preview'],
              ['Pricing', 'From a listing, source kept on the row', 'From a listing, source kept on the row'],
              ['Depreciation', 'Class and age', 'Class and age'],
              ['Export', 'Identical', 'Identical'],
            ]}
          />
          <p>
            The review step is the honest difference. It exists to turn several photographs into one
            item, which a written row does not need &mdash; so the written route skips it rather
            than doing a weaker version of it. Mapping and preview take its place, and neither
            creates a line until you import.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Use both on the same claim</h2>
          <p>
            Nothing forces a claim down one route. Photograph what survived, import the rest as a
            written list, and both land in the same worksheet with the same columns and the same
            export. The schedule should reflect the evidence that actually exists for each item
            rather than the method you started with.
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
              to: '/contents-claims/without-photos',
              t: 'Pricing a claim without photos',
              d: 'The written route in detail: parse, map, preview, import.',
            },
            {
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'What a room photograph can and cannot establish.',
            },
            {
              to: '/guides/contents-inventory-after-house-fire',
              t: 'Rebuilding after a total fire loss',
              d: 'The evidence that usually survives, room by room.',
            },
            {
              to: '/guides/insurance-grade-contents-documentation',
              t: 'What insurance-grade documentation means',
              d: 'The standard both routes are trying to meet.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
