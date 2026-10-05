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
 * /guides/clothing-footwear-contents-claims — batch 3, spec page 24.
 *
 * The brief's strongest section is "Don't Let AI Overstate Specificity", which
 * is our own rule 12 argued from the customer's side: a model that reads
 * "black leather shoe" does not know the brand, and a schedule that claims one
 * is making up evidence. It also lands squarely on rule 1 -- a closet photo
 * cannot back forty line items, and items are always <= photographs.
 *
 * Brand names appear here (Nike, Patagonia, Canada Goose) as EXAMPLES OF PRICE
 * SPREAD within a garment type. They are not carriers (rule 3 governs insurer
 * names), not claimed as partners, and not presented as sources we configure.
 *
 * Useful life is deliberately not quoted as a number for clothing. The live
 * schedule is composite (category > subline, e.g. "Sporting Goods > Athletic
 * Shoes & Cleats") and CLAUDE.md rule 13's worked example does not reconcile
 * with straight-line on its own figures, so quoting "three years" here would
 * be retyping a number rather than reading one. The page states the SHAPE --
 * short useful lives, so age matters more -- which is what a reader needs.
 */

const FAQS: Faq[] = [
  {
    q: 'Should every shirt be a separate line item?',
    a: 'No, and a schedule that does it is harder to review rather than more thorough. Genuinely similar low-value garments can be grouped where quality, age and replacement basis are consistent. What should never be grouped is property that differs materially in brand or value.',
  },
  {
    q: 'Can a closet photo establish all the clothing values?',
    a: 'It can establish that clothing existed and give a rough sense of quantity. It cannot usually establish brand, product line, material or quality tier — and those are what separate a $15 shirt from a $150 one. A wide shot is context; the label is evidence.',
  },
  {
    q: 'Should designer clothing be grouped with generic clothing?',
    a: 'No, where the brand materially changes the replacement cost — which is most of the time at the premium end. Folding a designer jacket into a line of generic outerwear understates it, and the grouping is exactly what a reviewer will unpick.',
  },
  {
    q: 'Does footwear depreciate differently from other contents?',
    a: 'It can. Useful life is set by the content class rather than by the price, and apparel and footwear classes generally carry shorter lives than furniture or appliances. That is why age matters more here than almost anywhere else on the schedule.',
  },
  {
    q: 'Can multiple photos be used for one clothing item?',
    a: 'Yes, and for anything premium they should be: one frame for the garment, one for the label or the style code. Several photographs of one item become one line — never several — which is also what keeps the item count honest against the photo count.',
  },
  {
    q: 'What happens when the brand is not visible?',
    a: 'The line should say what the evidence supports and no more. Kevin returns a blank, editable field rather than a confident guess when the evidence will not carry an identification — a fabricated brand on a wardrobe line is both easy to disprove and expensive to defend.',
  },
]

const CRUMBS = [
  { to: '/guides/clothing-footwear-contents-claims', t: 'Clothing and footwear' },
]

export default function ClothingFootwearGuidePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/clothing-footwear-contents-claims"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Documenting Clothing and Footwear in a Contents Claim"
          lede="A closet is often the largest category on a contents claim and the weakest documented. Forty shirts is a quantity, not a value — and the gap between those two numbers can be most of a wardrobe."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="How should clothing and footwear be documented?"
          answer="At the level the evidence supports: grouped where garments are genuinely similar and low value, itemised with brand and model where the label moves the price. A wide closet photograph supports quantity, not identity."
        >
          <p>
            This is the category where the gap between what a photograph proves and what a schedule
            claims opens the widest. Forty shirts can be forty $15 shirts or forty $200 shirts, and
            the difference is not visible from the doorway.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Where the value hides</h2>
          <ComparisonTable
            caption="Same garment type, different property"
            columns={['Category', 'Low end', 'High end']}
            rows={[
              ['Athletic shoes', 'Generic trainers', 'Premium or limited-release sneakers'],
              ['Outerwear', 'Generic winter coat', 'Technical shell or a down parka'],
              ['Shirts', 'Multipack cotton tee', 'Designer or technical performance garment'],
              ['Denim', 'Mass-market jeans', 'Selvedge or designer label'],
              ['Handbags', 'High-street bag', 'Designer, where line and year move the price again'],
            ]}
          />
          <p>
            When the brand is visible in the evidence, it belongs on the line. When it is not, the
            line should say so rather than imply a tier it cannot support.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Group honestly, or itemise</h2>
          <ComparisonTable
            caption="Two defensible treatments, and the one that is not"
            columns={['Treatment', 'When it is right', 'When it fails']}
            rows={[
              ['Grouped line', 'Similar quality, similar age, brand immaterial', 'It hides six different premium labels'],
              ['Itemised line', 'Brand, model or condition moves the price', 'Forty near-identical tees as forty lines'],
              ['Generic catch-all', 'Never, where evidence of brand exists', 'It understates the wardrobe and invites a rewrite'],
            ]}
          />
          <p>
            &ldquo;6 generic cotton T-shirts&rdquo; is a good line. &ldquo;6 shirts&rdquo; covering
            six different labels is not, and the reviewer who spots one of them in a photograph will
            question the rest of the schedule.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Do not let a model overstate what it saw</h2>
          <EvidenceCallout>
            <p>
              A vision model looking at a closet can tell you there is a{' '}
              <strong>black leather shoe</strong>. It does not know the brand, the model, the
              material grade or the retail tier, and a schedule that fills those in anyway has
              invented evidence. In a densely packed closet the labels are simply not visible, and
              no amount of processing changes that.
            </p>
          </EvidenceCallout>
          <p>
            Kevin returns a blank, editable field rather than a confident guess when the evidence
            will not carry an identification. On a wardrobe that is the difference between a line
            you can defend and one that comes back.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Several photographs, one garment</h2>
          <p>
            For anything premium, the useful set is small: the garment, and the label or style code.
            That is two frames, not five, and they describe one item. Kevin proposes related shots
            as a single item and you confirm it before anything becomes a line &mdash; which is also
            what keeps the item count at or below the photograph count on a claim where a closet
            could otherwise appear to generate more items than it has pictures.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Age carries more weight here</h2>
          <p>
            Apparel and footwear classes generally carry shorter useful lives than furniture or
            appliances, so the age entered on a garment line moves its actual cash value further
            than the same number would elsewhere. A one-year-old pair of boots and a five-year-old
            pair are not close, and a blanket percentage across a wardrobe will be visibly wrong in
            both directions.
          </p>
          <p>
            Kevin classifies each line to an XactContents category and sub-category, and the class
            together with the age selects the rate. It is computed server-side, so a wardrobe of
            four hundred lines is depreciated the same way at line 400 as at line 4.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Reconstructing a wardrobe after a total loss</h2>
          <p>
            When the closet is gone, quantity has to be rebuilt from what survives: photographs on
            phones and in the cloud, family and social photographs, order histories, card
            statements, retailer accounts and receipts. Those sources also tend to establish brand,
            which is the detail a reconstructed wardrobe most often loses. A written list can be
            imported and priced directly, without photographs.
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
              to: '/guides/item-level-photos-insurance-contents',
              t: 'Why item-level photos matter',
              d: 'What a room photograph can and cannot establish.',
            },
            {
              to: '/contents-claims/without-photos',
              t: 'Pricing a claim without photos',
              d: 'Importing and pricing a written wardrobe list.',
            },
            {
              to: '/guides/high-value-contents-claims',
              t: 'Documenting high-value property',
              d: 'Where designer and technical apparel belong.',
            },
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'Useful life by class, and why age matters most here.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
