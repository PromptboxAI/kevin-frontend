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
 * /guides/item-level-photos-insurance-contents — spec page 8, Tier 2.
 *
 * The brief wants the distinction between establishing PRESENCE and
 * establishing IDENTITY, which is domain rule 1 stated for a reader: the
 * vision tech reads one item per photograph, so a room shot yields one line at
 * most, not a dozen. Software that reports more items than photographs is
 * counting objects in a scene.
 *
 * The advice here is also what /product's shot guide teaches, drawn from the
 * same measured sample of the owner's real claims: the sharpest frame in that
 * sample was useless because it was shot from behind a tower -- no badge, no
 * model, nothing to identify. Sharpness is not the job; containing what
 * identifies the item is.
 */

const FAQS: Faq[] = [
  {
    q: 'Can a room photograph support a contents line?',
    a: 'It can support that the property existed and roughly how much of it there was. It usually cannot support what the property was — make, model, variant — and without that, a replacement price has nothing underneath it.',
  },
  {
    q: 'How many line items should one photograph produce?',
    a: 'At most one. Items on a claim are always at or below the photograph count, because some frames are context shots, close-ups of an item already counted, or duplicates. Any tool reporting more items than photographs is counting objects in a scene rather than building claim lines.',
  },
  {
    q: 'What makes a photograph identifiable?',
    a: 'Something in the frame that names the item: a brand badge, a model plate, a barcode, a legible label. A sharp photograph of the back of a computer tower is sharp and useless — there is no brand and no model anywhere in it.',
  },
  {
    q: 'Do I need several photographs of each item?',
    a: 'Two is often ideal: one that shows what the item is, and one close enough to read the plate or label. Shots taken seconds apart are grouped into one proposed set and become one line, so the second photograph costs you nothing in line count.',
  },
  {
    q: 'What happens when the photograph is not readable?',
    a: 'The line arrives with blank, editable description and price fields rather than a guess. A hallucinated description on a carrier-facing document is worse than a blank one, and blanks are visible where confident errors are not.',
  },
  {
    q: 'Are room photographs worth taking at all?',
    a: 'Yes — for context, for documenting the room as found, and for supporting quantities. They are evidence about the loss. They are just not the evidence a priced line item rests on.',
  },
]

const CRUMBS = [
  { to: '/guides/item-level-photos-insurance-contents', t: 'Why item-level photos matter' },
]

export default function ItemLevelPhotosGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/item-level-photos-insurance-contents"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Why a Room Photo Is Not Enough for an Insurance Contents Inventory"
          lede="A room photograph establishes that property was there. It rarely establishes what the property was — and a replacement price needs the second thing, not the first."
          byline="Kevin Godfrey, Kevin"
          updated="3 October 2026"
        />

        <DirectAnswer
          question="Why do insurance contents claims need item-level photographs?"
          answer="Because presence and identity are different findings: a room shot shows that a television was there, while pricing it requires knowing which television — and that lives on a badge, a plate or a label."
        >
          <p>
            The gap shows up at the worst moment, in review, when a carrier asks what the line is
            based on. "It was in the room" supports the existence of property. It does not support a
            particular replacement cost, which is what the line actually claims.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>The closet, as an example</h2>
          <p>
            A photograph of an open closet documents that there were clothes. Priced from that
            frame, the schedule of loss says "shirts" and carries a generic figure, and every line
            of it is arguable. The same closet photographed item by item — a jacket with its label,
            a pair of boots with the maker's mark — produces lines with brands, sizes and models,
            each with a listing behind the price. The second version takes longer on site and
            shorter everywhere afterwards.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What belongs in the frame</h2>
          <ComparisonTable
            caption="Four shots, and what each is for"
            columns={['Shot', 'Establishes', 'Needed when']}
            rows={[
              ['Whole item', 'What the thing is, and its condition', 'Always'],
              ['Brand mark', 'Who made it', 'Where the badge is not readable in the wide shot'],
              ['Model or serial plate', 'Which model exactly', 'Appliances, electronics, tools — anywhere variants price differently'],
              ['Distinctive feature', 'Which variant, finish or size', 'Where two models look alike and price apart'],
            ]}
          />
          <EvidenceCallout>
            <p>
              Extra frames do not cost extra lines. Photographs of one item taken seconds apart are
              grouped into a single proposed set, and that set becomes <strong>one</strong> claim
              item — priced once, never twice.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Sharp is not the same as identifiable</h2>
          <p>
            In a sample of real pack-out photographs, the sharpest frame by a wide margin was a
            desktop tower shot from behind: ports, vents and screws in perfect focus, with no brand
            and no model anywhere in it. It is a technically excellent photograph that cannot
            support a line item. The frame has to contain the thing that identifies the item, not
            merely be in focus.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What room photographs are genuinely good for</h2>
          <ComparisonTable
            caption="Room-level evidence, honestly scoped"
            columns={['Good for', 'Not good for']}
            rows={[
              ['Context: how the room was found', 'Make, model or variant of anything in it'],
              ['Documenting the loss as a whole', 'A defensible replacement price'],
              ['Supporting quantities and groupings', 'Carrier-grade substantiation of a line'],
              ['Triage: deciding what to shoot next', 'Standing in for item-level evidence'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>One photograph, at most one line</h2>
          <p>
            This is the structural difference between a contents inventory and object detection.
            Detection answers "what objects appear here?" and will happily report a dozen from one
            frame. A contents inventory answers "what is this item and what does it cost to
            replace?", which is a question you can only ask of an item you have identified. On a
            real claim some frames are context, some are close-ups of something already counted,
            and some are duplicates — so the line count lands at or below the photograph count,
            always.
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
              to: '/product',
              t: 'What makes a photo Kevin can price',
              d: 'Four real frames: two that work and two that do not, with the reasons.',
            },
            {
              to: '/methodology',
              t: 'How Kevin builds a line item',
              d: 'Grouping before identification, review before promotion.',
            },
            {
              to: '/guides/automate-replacement-cost-research',
              t: 'Automating replacement-cost research',
              d: 'Why identity stays the gatekeeper when the search is automated.',
            },
            {
              to: '/contents-claims/without-photos',
              t: 'When the photographs are gone',
              d: 'The separate route for total losses, and its limits.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
