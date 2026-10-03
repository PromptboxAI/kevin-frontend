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
 * /guides/contents-inventory-after-house-fire — spec page 7 in the brief,
 * Tier 3. The one page in the set written for a HOMEOWNER rather than a
 * professional, which changes two things:
 *
 *  - The advice has to stand on its own. Someone reconstructing an inventory
 *    after a total loss needs the method whether or not they ever use Kevin,
 *    so the evidence-sources and room-by-room sections are useful with a
 *    spreadsheet and no software at all.
 *  - The CTA must not oversell. Kevin is professional software sold to
 *    adjusters at $249/mo; pointing a homeowner at a subscription they
 *    probably should not buy would be a bad answer to a bad week. The close
 *    says what is true: most people in this position work with a public
 *    adjuster, and this is the tool that adjuster would use.
 *
 * Nothing here promises recovery of anything. Depreciation, coverage and
 * recoverable depreciation are policy and jurisdiction questions (rule 17's
 * spirit), and the page says so rather than implying an outcome.
 */

const FAQS: Faq[] = [
  {
    q: 'Where do I even start after a total loss?',
    a: 'Room by room, from memory, with the house plan in front of you — and before you start listing, gather the evidence that will jog it: phone and cloud photo libraries, retailer order histories, card statements, email receipts and warranty registrations. The list you build from evidence is always longer than the one you build from memory alone.',
  },
  {
    q: 'What should I record for each item?',
    a: 'Quantity, a specific description, brand, model where you know it, roughly how old it was, what it would cost to replace today, where that price came from, and which room it was in. The two people usually forget are age — which drives depreciation — and the source of the price.',
  },
  {
    q: 'What if I have no photographs at all?',
    a: 'Then the description becomes the evidence, and specificity is what you have instead of a photograph. "Pottery Barn Andes sectional, 3-seat, charcoal, about six years old" is a priceable line; "sofa" is a negotiation. A written list can be priced directly — it does not need photographs at all.',
  },
  {
    q: 'How detailed is too detailed?',
    a: 'There is no such thing on a total loss, but there is a wrong order. Capture everything at a coarse level first so nothing is forgotten, then deepen the lines that carry the most value. A complete list of rough items beats a perfect list of a third of the house.',
  },
  {
    q: 'Do low-value items matter?',
    a: 'Collectively, enormously. Linens, kitchen drawers, cleaning supplies, tools, toys and the contents of closets add up to a large share of a contents claim, and they are the first things people skip because each one feels too small to write down.',
  },
  {
    q: 'Should I do this myself or hire someone?',
    a: 'Many people in a total loss work with a public adjuster, who does this for a living and knows what a carrier will question. If you are doing it yourself, the method on this page is the same one they use — it is just their full-time job and your worst month.',
  },
]

const CRUMBS = [
  { to: '/guides/contents-inventory-after-house-fire', t: 'Contents inventory after a fire' },
]

export default function FireLossInventoryGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/contents-inventory-after-house-fire"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Reconstruct a Contents Inventory After a Total Fire Loss"
          lede="Rebuild it room by room from the evidence that survived — cloud photo libraries, order histories, receipts and statements — rather than from memory alone."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="How do you build a contents inventory when everything is gone?"
          answer="Room by room, using the records that survived outside the house: phone and cloud photos, retailer order histories, card statements, email receipts, warranties and registrations — then memory to fill the gaps those leave."
        >
          <p>
            Almost nobody can list a household from memory, and nobody should try to. The photo
            library on a phone is the single best source most people have: years of pictures taken
            for other reasons, with the contents of rooms in the background. Start there, go room by
            room, and treat memory as the last pass rather than the first.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Evidence that usually survives</h2>
          <ComparisonTable
            caption="Where the record of a household actually lives"
            columns={['Source', 'What it gives you']}
            rows={[
              ['Phone and cloud photo libraries', 'Years of rooms in the background of other pictures — the richest source most people have'],
              ['Social media photos', 'Birthdays and holidays, which are rooms photographed at their fullest'],
              ['Retailer order histories', 'Exact models, exact prices and exact dates for anything bought online'],
              ['Card and bank statements', 'Merchants and amounts, which recover purchases the photos missed'],
              ['Email receipts and confirmations', 'Searchable by merchant and by year'],
              ['Warranty and product registrations', 'Model and serial numbers for appliances and electronics'],
              ['Manuals kept in a drawer', 'Model numbers, where the drawer survived'],
              ['Insurance scheduled property', 'Anything already scheduled is already documented'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Go room by room</h2>
          <p>
            Walk the house in your head in a fixed order and do not skip a room because it was
            small. For each one: furniture, electronics, soft goods, what was in the closets, what
            was in the drawers, what was on the walls, and what was stored under or on top of
            things.
          </p>
          <ul className="k-seolist">
            <li><strong>Kitchen</strong> — appliances large and small, cookware, dishes, glassware, utensils, pantry contents, linens.</li>
            <li><strong>Living areas</strong> — seating, tables, media equipment, rugs, lamps, art, books, games.</li>
            <li><strong>Bedrooms</strong> — beds and mattresses, dressers, bedding, the full contents of each closet, jewelry, personal electronics.</li>
            <li><strong>Bathrooms</strong> — linens, small appliances, the contents of cabinets.</li>
            <li><strong>Garage, basement, attic</strong> — tools, lawn equipment, sports gear, holiday decorations, stored furniture, boxes nobody had opened in years.</li>
            <li><strong>Outside</strong> — patio furniture, grills, planters, anything in a shed.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>What to record for each item</h2>
          <ComparisonTable
            caption="The fields that make a line priceable"
            columns={['Field', 'Why it matters']}
            rows={[
              ['Quantity', 'The line total multiplies by it'],
              ['Description', 'The more specific, the closer the price. This doubles as the search'],
              ['Brand', 'The single most useful word for finding a replacement'],
              ['Model', 'Where variants price apart, this is what separates them'],
              ['Age', 'How long you owned it — this is what drives depreciation'],
              ['Replacement cost', 'What it costs to buy the same thing today'],
              ['Source', 'The listing that price came from, so it can be checked'],
              ['Room', 'Keep it as its own field, not folded into the description'],
            ]}
          />
          <EvidenceCallout>
            <p>
              Age means <strong>how long you owned it</strong>, not how old the model is. A
              five-year-old television bought second-hand last year is one year old for this
              purpose.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>If you have no photographs</h2>
          <p>
            A written list can be priced directly — a typed inventory, a spreadsheet, or a list a
            restoration company produced. Each described row is researched and priced the same way a
            photographed item would be, with the source kept on the line. What you lose is brand and
            model precision, which is exactly why specificity in the description is worth the
            effort.
          </p>
        </section>

        <section className="k-seosec">
          <h2>The mistakes that cost the most</h2>
          <ul className="k-seolist">
            <li><strong>Generic descriptions.</strong> "Sofa" prices as the cheapest sofa a search can find.</li>
            <li><strong>Skipping the small things.</strong> Drawers, closets and linens are a large share of a contents claim.</li>
            <li><strong>Inconsistent ages.</strong> Guessing wildly on one line and precisely on another makes the whole schedule look estimated.</li>
            <li><strong>Losing the source.</strong> A price with no listing behind it is an assertion, and assertions get negotiated.</li>
            <li><strong>Stopping when it gets tedious.</strong> The last third of the house is worth as much as the first.</li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <section className="k-seosec">
          <h2>Where software fits</h2>
          <p>
            Kevin is professional software — it is what a public adjuster or an inventory specialist
            uses to turn a list or a set of photographs into a priced, documented schedule with a
            source link on every line. If you are working with an adjuster, this is the kind of tool
            doing the work behind your schedule of loss. If you are doing it yourself, the method
            above is the same one either way, and it works in a spreadsheet.
          </p>
          <p className="k-seonote">
            Nothing on this page is a statement about what your policy covers. Depreciation,
            recoverable depreciation and coverage limits are determined by your policy and your
            jurisdiction.
          </p>
        </section>

        <CtaBand
          head="Building a total-loss inventory?"
          sub="Kevin prices written inventories as well as photographed ones — a typed list, a spreadsheet, or a restoration company's PDF."
        />

        <RelatedCards
          items={[
            {
              to: '/contents-claims/without-photos',
              t: 'Pricing a claim when the photos are gone',
              d: 'How a written inventory is parsed, mapped and priced.',
            },
            {
              to: '/guides/rcv-vs-acv-personal-property',
              t: 'RCV vs ACV on a contents claim',
              d: 'What the two figures mean and why they differ.',
            },
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'Why age and category decide what a line is worth today.',
            },
            {
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'If you still have photographs, what in them is useful.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
