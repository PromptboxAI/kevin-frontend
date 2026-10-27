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
 * /catastrophe-contents-claims — the CAT surge page.
 *
 * The gap it fills: before this page the site had ZERO occurrences of
 * catastrophe, wildfire or hurricane. CAT season is when independent adjusters
 * buy tooling, and we were absent from the one seasonal intent in the market.
 *
 * ⛔ THE QUOTA SECTION IS NOT OPTIONAL AND MUST NOT BE SOFTENED. A CAT month
 * is precisely the month that blows through a 2,000-item allowance, so this is
 * the page most likely to be read by someone who is about to hit it. Rule 9c
 * says the truncation behaviour has to be stated plainly because it generates
 * support tickets otherwise -- and a page that sells surge capacity while
 * hiding the ceiling is how you earn those tickets. Flat pricing is a genuine
 * advantage here; the allowance is a genuine limit. Both get said.
 *
 * Same for rule 12b: during a surge the pricing engine throttles, lines show a
 * Pricing chip and retry when limits roll over. That is a capacity wait, not an
 * error, and an adjuster who has not been told will read it as a failure.
 */

const FAQS: Faq[] = [
  {
    q: 'Does Kevin charge per claim during a catastrophe?',
    a: 'No. Pro is a flat $249 a month with unlimited claims. Twenty claims in a week cost the same subscription as two — it is line items, not claims, that carry an allowance. Per-claim pricing punishes exactly the week a CAT deployment is made of, which is why we do not have it.',
  },
  {
    q: 'What happens when a surge exceeds the monthly item allowance?',
    a: 'Pro includes 2,000 line items a billing month, then credits at $0.75 an item. If a batch would run past what is left, Kevin processes up to the limit and leaves the rest unprocessed rather than failing the upload — and raises an alert naming exactly how many were dropped. The photographs stay on the claim and run when quota is restored.',
  },
  {
    q: 'Can I upload a whole deployment at once?',
    a: 'A folder of several hundred photographs is one selection and one click. The browser splits it into chunks so a large upload never dies on a gateway timeout, a rejected file reports why, and re-dropping a folder you already sent resolves to duplicates rather than creating a second set of items.',
  },
  {
    q: 'What if pricing slows down under load?',
    a: 'Lines waiting on capacity show a Pricing chip rather than an error, and a worksheet bar offers Retry deferred once limits roll over. It means the pricing service is throttled, not that you have to do anything — and the distinction is on the row so nobody re-keys a price that was about to arrive.',
  },
  {
    q: 'Do claims get deleted or archived to save space?',
    a: 'Never. Closed claims tier to archived storage after 90 days and stay fully accessible; nothing is deleted to reclaim space. Going over the storage pool triggers an email, not a lockout mid-deployment.',
  },
  {
    q: 'What about total losses with no photographs?',
    a: 'Common after a wildfire, and handled by the written-import path: a typed list, a spreadsheet or a pack-out PDF prices without photographs at all. See total loss contents.',
  },
]

const CRUMBS = [{ to: '/catastrophe-contents-claims', t: 'Catastrophe contents claims' }]

export default function CatastropheContentsPage() {
  return (
    <div className="k-landing">
      <Seo
        path="/catastrophe-contents-claims"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Contents Claims After a Catastrophe"
          lede="A CAT deployment is the same contents work at ten times the rate. Unlimited claims on a flat fee, a folder of photographs in one upload, and total losses priced from a list — plus a plain account of the one ceiling that exists."
          byline="Kevin Godfrey, Kevin"
          updated="27 October 2026"
        />

        <DirectAnswer
          question="How do you handle contents claims during a catastrophe surge?"
          answer="By removing the per-claim cost and the per-claim setup. Kevin is flat-rate with unlimited claims, ingests a whole shoot in one upload, and prices total losses from a written list when nothing was left to photograph — so twenty files in a week is a volume problem, not a pricing one."
        >
          <p>
            After a wildfire, a hurricane or a tornado outbreak, the files arrive together and the
            contents half of each one is what runs late. The structure gets scoped in an afternoon;
            the personal property list takes days, and twenty of them take weeks that the deployment
            does not have.
          </p>
          <p>
            Nothing here makes a hard claim easy. What it does is take the per-file overhead out, so
            the time goes on the lines that need judgment instead of the ones that need typing.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>What changes when the volume does</h2>
          <ComparisonTable
            caption="The parts of a CAT week that normally scale badly"
            columns={['Under surge', 'What Kevin does', 'What it does not do']}
            rows={[
              ['Twenty files open at once', 'Flat fee, unlimited claims — no per-claim charge to approve', 'Reduce the judgment each file needs'],
              ['A folder of 300+ photographs', 'One selection, one click; chunked so a big upload cannot time out', 'Make a blurry photograph identifiable'],
              ['Re-dropping yesterday’s folder', 'Resolves to duplicates across the whole claim, not new items', 'Merge two claims that should have been one'],
              ['Total losses with nothing to shoot', 'Written import — a list, a spreadsheet, a pack-out PDF', 'Invent detail the list does not carry'],
              ['A second visit to the same loss', 'Appends to the claim; line numbers continue and never renumber', 'Reopen an export already sent to a carrier'],
              ['Storage filling up', '500 GB included; closed claims tier to archive after 90 days', 'Delete anything to reclaim space'],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>The ceiling, stated plainly</h2>
          <p>
            Claims are unlimited. <strong>Line items are not.</strong> Pro includes 2,000 line items
            a billing month, and a CAT month is the month most likely to pass it. Here is exactly
            what happens, because finding out mid-deployment is worse than knowing now.
          </p>
          <EvidenceCallout>
            <p>
              <strong>A batch that would exceed your remaining allowance is truncated, not
              rejected.</strong> Kevin processes up to the limit and leaves the rest unprocessed,
              then raises an alert naming how many were dropped, with Add credits and Upgrade
              beside it. <strong>The photographs are not deleted</strong> &mdash; they stay on the
              claim and run as soon as quota is restored. Past the allowance, credits are $0.75 an
              item.
            </p>
          </EvidenceCallout>
          <p>
            One more thing worth knowing before it surprises you: the counter records items{' '}
            <em>produced</em>, not items kept, so deleting a line does not return it to the
            allowance. The research behind that line has already been run and paid for.
          </p>
          <p>
            And under heavy load the pricing engine throttles. Lines waiting on capacity show a
            quiet <strong>Pricing</strong> chip rather than an error, and a worksheet bar offers{' '}
            <strong>Retry deferred</strong> once limits roll over. It is a wait, not a failure, and
            nothing needs re-keying.
          </p>
        </section>

        <section className="k-seosec">
          <h2>Wildfire, hurricane, tornado</h2>
          <p>
            The differences that matter are about what evidence survived, not about the peril.
          </p>
          <ul className="k-seolist">
            <li>
              <strong>Wildfire</strong> usually means total loss and nothing to photograph. The
              inventory is rebuilt from a list &mdash; see{' '}
              <a href="/total-loss-contents">total loss contents</a>.
            </li>
            <li>
              <strong>Hurricane and flood</strong> leave property that exists but is
              non-salvageable, so the work is documenting what was there and pricing replacement.
            </li>
            <li>
              <strong>Tornado</strong> tends to produce both on the same street, and often both on
              the same claim &mdash; photographed lines and written lines sit on one worksheet.
            </li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <CtaBand />

        <RelatedCards
          items={[
            {
              to: '/total-loss-contents',
              t: 'Total loss contents inventory',
              d: 'Rebuilding the list when nothing was left to photograph.',
            },
            {
              to: '/guides/large-contents-inventory-500-items',
              t: 'Inventories past 500 items',
              d: 'What changes when a claim gets genuinely large.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly. Never per claim, never per seat.',
            },
            {
              to: '/done-for-you',
              t: 'Done-for-you, from $750',
              d: 'Hand off the overflow instead of hiring for it.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
