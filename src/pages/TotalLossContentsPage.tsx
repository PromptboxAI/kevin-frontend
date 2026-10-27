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
 * /total-loss-contents — the segment landing page for total losses.
 *
 * WHY THIS AND /contents-claims/without-photos BOTH EXIST. They answer
 * different questions and must keep doing so, or they cannibalise each other.
 * This page is the COMMERCIAL intent -- "total loss contents inventory
 * software", typed by someone deciding what to buy. WithoutPhotosPage is the
 * INFORMATIONAL one -- "how do I price contents when the photos are gone" --
 * and owns the mechanics of the import. This page links down into it rather
 * than restating the steps. If either starts explaining the other's half,
 * merge them.
 *
 * ⛔ THE HONEST LIMIT IS THE POINT OF THE PAGE. Competitors in this space sell
 * total loss by promising to mine the backgrounds of pre-loss photographs --
 * holiday photos, social media, a business's marketing shots -- for furniture
 * and equipment nobody listed. We do not do that and we are not going to:
 * rule 1 is one item per photograph, and a wide shot of a living room at
 * Christmas cannot tell you which television was on the wall. Saying so is
 * better positioning than matching the claim, because the adjuster is the one
 * who has to defend the line afterwards.
 */

const FAQS: Faq[] = [
  {
    q: 'Can you build a contents inventory with no photographs at all?',
    a: 'Yes. A typed list, a handwritten list, an Excel or CSV file, or a restoration company’s pack-out PDF all import directly. A described item is priced from the same retail comps as a photographed one — it simply carries less brand and model precision, because the description is all the search has to work from.',
  },
  {
    q: 'Do pre-loss photographs help?',
    a: 'Where one clearly shows an item, yes — it imports like any other photograph. What Kevin will not do is read the background of a family photo and file the furniture in it as line items. A single photograph backs at most one item here, so items never outnumber photographs.',
  },
  {
    q: 'How accurate is a price built from a description?',
    a: 'As accurate as the description. "Sofa" prices as a sofa; "three-seat leather sofa, dark brown, chaise on the right" prices as that. Every priced line carries a source link to the listing the figure came from, so you can see what was matched and sharpen the description and re-price if it is wrong.',
  },
  {
    q: 'What about a commercial total loss?',
    a: 'An asset or equipment list imports the same way a household list does — the format is a spreadsheet either way. Content classes and the depreciation that follows from them apply per line regardless of whether the loss is residential or commercial.',
  },
  {
    q: 'How long does a total-loss list take to run?',
    a: 'The import itself is chunked at 500 rows a request and resumes from a failed chunk, so list size is not the constraint. Pricing is two vendor searches per priced item, and the confirmation step tells you how many searches the import will run before you commit to it.',
  },
  {
    q: 'Does a 2,000-line total loss cost extra?',
    a: 'Pro includes 2,000 line items a billing month on a flat $249, with unlimited claims — so a single 2,000-line total loss fits inside the allowance. Past it you buy credits at $0.75 an item. There is no per-claim fee, which is the thing that usually makes a total loss expensive on other platforms.',
  },
]

const CRUMBS = [{ to: '/total-loss-contents', t: 'Total loss contents' }]

export default function TotalLossContentsPage() {
  return (
    <div className="k-landing">
      <Seo path="/total-loss-contents" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Total Loss Contents Inventory Software"
          lede="When the building is gone, so is the list. Kevin rebuilds it from whatever survived — a written list, a spreadsheet, a pack-out PDF — and prices every line with depreciation and an export the carrier can import. No photographs required."
          byline="Kevin Godfrey, Kevin"
          updated="27 October 2026"
        />

        <DirectAnswer
          question="How do you build a contents inventory after a total loss?"
          answer="From descriptions rather than photographs. A typed or handwritten list, a spreadsheet, or the pack-out company's PDF imports directly, and each described item is priced from retail comps the same way a photographed one is — then classified, depreciated by age, and exported in the XactContents template."
        >
          <p>
            A total loss inverts the usual problem. On a normal contents claim the evidence exists
            and the work is turning it into priced lines. On a total loss the evidence is what is
            missing, and the list has to be reconstructed before anything can be priced at all.
          </p>
          <p>
            So the route in is the written one. Kevin&rsquo;s import takes a list in whatever shape
            it reached you, prices each line, and puts it on the same worksheet a photographed claim
            lands on &mdash; the mechanics are on{' '}
            <a href="/contents-claims/without-photos">pricing contents when the photos are gone</a>.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What you can start with</h2>
          <ComparisonTable
            caption="Any of these, and they can be combined on one claim"
            columns={['You have', 'What happens to it', 'What it gives up']}
            rows={[
              ['A typed or handwritten list', 'Parsed server-side, mapped to columns, previewed before anything is created', 'Brand and model precision, unless the list carries them'],
              ['An Excel or CSV file', 'Same path; the mapping step runs even when the columns are already recognised', 'Nothing beyond what the file omits'],
              ['A pack-out company’s PDF', 'Parsed like any other document — no rekeying', 'Room detail, where the pack-out log did not record it'],
              ['A commercial asset or equipment list', 'Imports as a spreadsheet; classes and depreciation apply per line', 'Nothing structural — a business list is still a list'],
              ['A list typed from memory', 'Imports the same way; sharpen a description and re-price any line', 'Precision, in proportion to what is remembered'],
              ['Photographs, where any survive', 'The ordinary photo pipeline — identification, comps, depreciation', 'Nothing; this is the richest input when it exists'],
            ]}
          />
          <EvidenceCallout>
            <p>
              <strong>What Kevin will not do is mine the backgrounds of old photographs.</strong>{' '}
              Holiday photos, social media, a business&rsquo;s marketing shots &mdash; a wide frame
              establishes that a room had furniture in it. It does not establish which television
              was on the wall, and a replacement price has to survive a desk adjuster asking exactly
              that. One photograph backs at most one item here, so{' '}
              <strong>items never outnumber photographs</strong>. If a tool tells you a single
              living-room photo produced thirty priced lines, ask where the model numbers came from.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Nothing is created until you say so</h2>
          <p>
            The import runs parse &rarr; map &rarr; preview &rarr; import, and{' '}
            <strong>the first three steps create nothing.</strong> You see the rows as Kevin read
            them, with the columns it guessed, before a single line exists on the claim.
          </p>
          <ul className="k-seolist">
            <li>
              <strong>Parsing is server-side</strong>, because real inventories arrive as PDFs and a
              browser parser would fail on the ones that matter most.
            </li>
            <li>
              <strong>Room stays its own field.</strong> The description doubles as the search
              query, so a room name left inside it changes what gets priced.
            </li>
            <li>
              <strong>Section headings are flagged, never dropped.</strong> &ldquo;KITCHEN&rdquo; on
              its own line is pre-selected for removal and you confirm it &mdash; a heading left in
              gets priced as property.
            </li>
            <li>
              <strong>Large lists chunk at 500 rows</strong> and resume from a failed chunk, so a
              4,000-line commercial list is not an all-or-nothing upload.
            </li>
            <li>
              <strong>The confirmation states the search count</strong>, not the row count: two
              vendor searches per priced item, so you know the size of the run before it starts.
            </li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>What a described line carries</h2>
          <p>
            Every line, however it arrived, lands on the same worksheet with the same columns and
            the same arithmetic behind them: unit cost, quantity, sales tax, RCV including tax, age,
            percentage and dollar depreciation, and ACV. The money is computed server-side so the
            worksheet, the export and the PDF cannot disagree with each other.
          </p>
          <p>
            Depreciation comes from a published schedule &mdash; 31 content categories across 87
            sub-lines, straight-line against useful life, running to 100% where the item is past it.
            You can read the whole thing on{' '}
            <a href="/guides/useful-life-by-content-class">useful life by content class</a> rather
            than taking our word for a number on a line.
          </p>
          <p>
            Jewelry, fine arts, firearms, furs, fine china and graded trading cards are never
            auto-priced. On a total loss those are the lines most likely to be argued, and a
            machine-generated figure on one of them is worth less than a blank.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What it costs to run a total loss</h2>
          <p>
            Flat $249 a month, unlimited claims, 2,000 line items included each billing month, then
            credits at $0.75 an item. No per-claim fee and no per-seat maths.
          </p>
          <p>
            That matters more on total losses than anywhere else, because a total loss is where
            per-claim pricing hurts most: the claim that takes the most work is the one that bills
            as a single claim. A 2,000-line total loss fits inside a month&rsquo;s allowance on the
            flat plan. If you would rather hand the whole thing over,{' '}
            <a href="/done-for-you">done-for-you</a> builds it for you from $750.
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
              t: 'Pricing contents when the photos are gone',
              d: 'The written-import mechanics, step by step.',
            },
            {
              to: '/catastrophe-contents-claims',
              t: 'Contents claims after a catastrophe',
              d: 'When twenty total losses land in the same week.',
            },
            {
              to: '/guides/useful-life-by-content-class',
              t: 'Useful life by content class',
              d: 'The whole schedule: 31 categories, 87 sub-lines.',
            },
            {
              to: '/done-for-you',
              t: 'Done-for-you, from $750',
              d: 'Send the list. We build and price the inventory.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
