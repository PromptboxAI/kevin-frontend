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
 * /guides/non-salvageable-contents-inventory — batch 2, spec page 18.
 *
 * The useful thing this page has that the others do not is TIMING: the
 * evidence that prices an item is destroyed by the cleanup, not by the loss.
 * Everything else here is downstream of that.
 *
 * Trimmed per the owner's 2026-10-03 instruction, same as pages 16 and 17: the
 * brief walks through staging, extraction signals and grouping as a mechanism.
 * The page states the consequence a reader needs -- photographs are reviewed
 * before they become line items, and pricing happens after identification --
 * without the recipe.
 *
 * One thing kept deliberately: rule 22's "evidence is excluded from the
 * worksheet, never deleted". It is the right answer to the question this page
 * raises, and it is a genuine product difference rather than process detail.
 */

const FAQS: Faq[] = [
  {
    q: 'Should damaged contents be photographed before disposal?',
    a: 'Where it is reasonably possible, yes — and the model label matters more than the wide shot. Once the item is gone, identification depends on memory and receipts, and a replacement price is only as specific as the description behind it. The photographs cost minutes during a pack-out and are irreplaceable afterwards.',
  },
  {
    q: 'Can multiple damage photos represent one inventory item?',
    a: 'Yes, and they usually should. A full shot, a label, and a close-up of the damage are three pieces of evidence about one item: what it is, which model it is, and what happened to it. They belong on one line, not three.',
  },
  {
    q: 'What if the model number is destroyed?',
    a: 'Work from the strongest surviving evidence — room, size, visible design, a surviving label, a receipt, a purchase history, an older photograph — and let the line reflect that level of certainty. A generic description that is well supported is worth more than a specific one that is not, because the specific one is what a reviewer checks first.',
  },
  {
    q: 'Does non-salvageable mean full replacement cost is paid?',
    a: 'No. What is covered and what is paid depend on the policy and the circumstances of the claim. Whether an item can be restored is a separate question from what it would cost to replace; the inventory documents the property and its valuation, not the coverage outcome.',
  },
  {
    q: 'Should a replacement price be researched before or after the item is identified?',
    a: 'After, always. Pricing is a search, and a search for the wrong product returns a confident, wrong number. Establishing what the item is — brand, model, size, capacity, tier — is what makes the price mean anything.',
  },
  {
    q: 'What happens to photos of items that are not being claimed?',
    a: 'In Kevin they stay on the claim. A photograph you exclude is left out of the worksheet, not deleted — on a property claim the evidence is part of the file, and a context shot that produced no line item is still the thing that shows a room as it was.',
  },
]

const CRUMBS = [
  { to: '/guides/non-salvageable-contents-inventory', t: 'Non-salvageable contents' },
]

export default function NonSalvageableGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/non-salvageable-contents-inventory"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="How to Document Non-Salvageable Contents for an Insurance Claim"
          lede="The evidence that prices an item is usually destroyed by the cleanup rather than by the loss. What you photograph before the dumpster decides what the schedule can say."
          byline="Kevin Godfrey, Kevin"
          updated="4 October 2026"
        />

        <DirectAnswer
          question="How should non-salvageable property be documented?"
          answer="Photograph it before it is discarded — the item, the manufacturer, the model label, the damage and the room — then build the line from that evidence. Treating an item as a total loss does not remove the need to establish what it was."
        >
          <p>
            On a large fire, water or contamination loss the non-salvageable inventory is often the
            single most labour-intensive part of the claim, and it is the part most exposed to
            timing. Property is removed quickly for good reasons. Every hour after that, the
            identification gets harder and the eventual price gets softer.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What non-salvageable means here</h2>
          <p>
            In a property claim it describes an item being treated as unsuitable for reasonable
            restoration or continued use — severe fire or heat damage, smoke contamination, water,
            sewage, mould, or outright physical destruction.
          </p>
          <p>
            Whether an item <em>can</em> be restored is a different question from what it would cost
            to replace. The inventory's job is the second one: document the property accurately and
            value it consistently.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Photograph it before it goes</h2>
          <ComparisonTable
            caption="What each frame is actually for"
            columns={['Photograph', 'What it establishes']}
            rows={[
              ['The whole item', 'What the property is, and that it existed'],
              ['The manufacturer mark', 'Brand — the single most discriminating search term'],
              ['The model or serial label', 'The exact product, which is what makes a price specific'],
              ['The damage', 'Condition and the basis for treating it as non-salvageable'],
              ['A distinguishing feature', 'Tier and variant, where those move the price'],
              ['The room', 'Location, and the context a schedule is organised by'],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>A model label that looks unimportant during a cleanup becomes the most
              valuable thing in the file three weeks later.</strong> If property has to be removed
              fast, preserve what identifies it: labels, receipts, packaging, manuals, warranty
              paperwork — or at minimum a photograph of each.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Four photographs are not four items</h2>
          <p>
            It sounds obvious and it is the most common way a large non-salvageable schedule goes
            wrong. A full shot, a side angle, a label and a damage close-up are one television.
          </p>
          <p>
            Kevin stages photographs before any of them becomes a claim line: related frames are
            proposed as a single item, and you confirm, merge or split that proposal before it is
            promoted. The result is that the item count never exceeds the photograph count — which
            is also the first sanity check a reviewer applies to a schedule this size.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Damage documentation and valuation answer different questions</h2>
          <ComparisonTable
            caption="Both belong in the file; neither substitutes for the other"
            columns={['Question', 'What answers it', 'What it cannot do']}
            rows={[
              ['What happened to the property?', 'Damage photographs', 'Establish what the item cost'],
              ['What does it cost to replace?', 'Replacement research with the listing kept', 'Prove the damaged item was that product'],
            ]}
          />
          <p>
            A photograph of a destroyed television does not establish a replacement cost, and a
            retail listing does not prove the insured owned that model. The schedule gets its
            strength from connecting the two — which is why identification has to come first and
            the source has to stay attached to the line afterwards.
          </p>
        </section>

        <section className="k-seosec">
          <h2>When the item cannot be identified</h2>
          <p>
            Start from the strongest surviving evidence: room, size, visible design, a surviving
            label, purchase records, email receipts, retailer purchase history, older photographs,
            the insured's own recollection. Then let the line say exactly that much.
          </p>
          <p>
            Do not manufacture a model number because a specific description produces a tidier
            spreadsheet. Kevin takes the same position in software: where the evidence will not
            support an identification, the line comes back with an empty, editable field rather than
            a plausible guess. A confident wrong description is the one that survives review and
            causes an argument later.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Depreciate by class, not by instinct</h2>
          <p>
            Once a replacement cost is established, depreciation follows from the item's class and
            its age. Applying percentages line by line from memory is what makes a large schedule
            hard to defend — the inconsistency shows up immediately when two similar items sit near
            each other with different rates and nothing on the row explains why.
          </p>
          <p>
            Kevin classifies each line to an XactContents category and sub-category, and the class
            together with the age selects the rate across 31 categories and 87 sub-lines. It is
            computed server-side, so the worksheet and the export never disagree about a number.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Keep the chain intact</h2>
          <p>
            The schedule should let someone follow one item the whole way:{' '}
            <strong>photo → description → replacement → source → RCV → depreciation → ACV</strong>.
            On a claim with hundreds or thousands of destroyed items, that traceability is the
            difference between a file that is reviewed and one that is negotiated.
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
              to: '/guides/contents-inventory-after-house-fire',
              t: 'Rebuilding an inventory after a total fire loss',
              d: 'The evidence that usually survives, and a room-by-room method.',
            },
            {
              to: '/contents-claims/without-photos',
              t: 'Pricing a claim without photos',
              d: 'When the property and the photographs are both gone.',
            },
            {
              to: '/guides/public-adjuster-contents-inventory',
              t: 'Contents inventory field guide',
              d: 'What belongs on a line, and how specific to be.',
            },
            {
              to: '/guides/discontinued-items-insurance-claims',
              t: 'Pricing a discontinued item',
              d: 'Successor models, like-kind replacements and the resale market.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
