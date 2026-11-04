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
 * /compare/kevin-vs-icontentspro — batch 6.
 *
 * ⚠️ TWO THINGS WE KNOW AND DELIBERATELY DO NOT PUBLISH, for the same reason
 * the Contents.team page withholds their pricing contradiction: a cheap shot
 * costs more credibility than it wins.
 *
 *   1. Their install numbers. Punching down reads badly to the exact reader
 *      weighing two small vendors, and it goes stale the week they grow.
 *   2. Their own site disagrees with itself about whether the Xactimate
 *      category ships. A page mid-edit is not a product fact.
 *
 * Both are in COMPETITOR-ICONTENTSPRO.md for our own planning. Neither belongs
 * on a public page.
 *
 * What the page IS about is the real and checkable difference: one photograph
 * of a shelf or a room expanded into many priced lines, against item-level
 * evidence where a set of photographs becomes at most one line. That is rule 1,
 * it is the thing a buyer can test in ten minutes, and it is an argument we win
 * on arithmetic rather than on adjectives.
 *
 * Everything attributed to them is quoted from their public site on the date
 * shown. Their insured self-capture is a genuine advantage and the page says
 * so plainly -- see "Choose iContentsPro if".
 */

const READ_ON = '27 October 2026'

const FAQS: Faq[] = [
  {
    q: 'What is the main difference between Kevin and iContentsPro?',
    a: 'Where the line items come from. iContentsPro advertises breaking a single photograph — a crowded shelf, a packed drawer, a room — into every item inside it, each priced as its own line. Kevin works from item-level evidence: several photographs of one object become at most one line, so items never outnumber photographs.',
  },
  {
    q: 'Is one photo per item slower?',
    a: 'To shoot, yes. The trade is what the line can support afterwards. A wide frame establishes that property existed; it rarely establishes which model it was, and a replacement price is argued from the second thing. Which matters depends on whether your lines get read closely.',
  },
  {
    q: 'How can I test the difference myself?',
    a: 'Count. Run the same set of photographs through both and compare the item count to the photo count. On a real contents claim some frames are context, some are a second angle of something already counted, and some are unreadable — so an honest item count sits at or below the photo count. A number above it came from somewhere, and it is worth knowing where before a desk reviewer asks.',
  },
  {
    q: 'Can the insured build the inventory themselves?',
    a: 'In iContentsPro, yes — they advertise inviting the homeowner to capture their own inventory, with unlimited invites included. Kevin has no insured-facing capture; our mobile capture is for the adjuster. If handing the camera to the policyholder is central to how you work, that is a real reason to prefer them.',
  },
  {
    q: 'How do the two charge?',
    a: 'Differently in kind. Their published plans are per claim and per pack — a single claim, monthly 3- and 6-claim packs, and tiers above that. Kevin is $249 a month flat with unlimited claims and 2,000 line items included; the metered dimension is items, not claims, and there are no seats.',
  },
  {
    q: 'Is this comparison impartial?',
    a: 'It is ours, so weigh it as such. What we have done is quote their own site rather than characterise it, date what we read, leave out every claim we could not check, and name the places they are the better fit. Their site is the authority on their product.',
  },
]

const CRUMBS = [{ to: '/compare/kevin-vs-icontentspro', t: 'Kevin vs iContentsPro' }]

export default function CompareIcontentsProPage() {
  return (
    <div className="k-landing">
      <Seo path="/compare/kevin-vs-icontentspro" jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Kevin vs iContentsPro"
          lede="Both turn photographs into a priced contents inventory. They differ on one thing that decides everything downstream: whether a single photograph can become many line items."
          byline="Kevin Godfrey, Kevin"
          updated={READ_ON}
        />

        <DirectAnswer
          question="What is the difference between Kevin and iContentsPro?"
          answer="iContentsPro expands one photograph — a shelf, a drawer, a room — into a priced line for every item it contains. Kevin works the other way: several photographs of one object become at most one line, so items never outnumber photographs."
        >
          <p>
            <strong>Everything attributed to iContentsPro here is quoted from their own public
            site, read on {READ_ON}.</strong> Nothing is scored and no capability is guessed at.
            Their site is the authority on their product; if it has changed since that date, it is
            right and this is stale.
          </p>
          <p>
            Kevin is not affiliated with iContentsPro.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Choose iContentsPro if</h2>
          <ul className="k-seolist">
            <li>
              <strong>You want the insured to capture their own inventory.</strong> They advertise
              inviting the homeowner to photograph their belongings from a phone, with unlimited
              invites on every plan. Kevin has no insured-facing capture at all, and this is the
              clearest thing they do that we do not.
            </li>
            <li>
              <strong>Speed to a draft matters more than per-line defensibility</strong> &mdash;
              triage, a rough order of magnitude, establishing roughly how much was in a room.
            </li>
            <li>
              <strong>You want a human desk to review the report for you.</strong> They offer a
              reviewed-by-hand service billed per line item.
            </li>
            <li>
              <strong>Your volume is low and lumpy.</strong> Per-claim pricing costs nothing in a
              quiet month; our flat fee does not.
            </li>
            <li>
              <strong>You need a native app.</strong> Theirs is on both app stores; Kevin&rsquo;s
              capture runs in the phone&rsquo;s browser.
            </li>
          </ul>
        </section>

        <section className="k-seosec">
          <h2>Choose Kevin if the lines get read closely</h2>
          <p>
            The more an item&rsquo;s value rests on brand, model, material, edition or quality
            tier, the more item-level evidence it takes to price it defensibly. That is the whole
            argument, and it is testable.
          </p>
          <EvidenceCallout>
            <p>
              <strong>One arithmetic check settles more than any feature grid: does the tool ever
              report more items than you took photographs?</strong> On a real contents claim some
              frames are context, some are a second angle of something already counted, and some
              are unreadable &mdash; so the honest item count sits at or below the photo count.
              Kevin&rsquo;s canonical demo claim is 60 photographs to 57 items, and it can never
              run the other way. A number above the photo count has to come from somewhere.
            </p>
          </EvidenceCallout>
          <ComparisonTable
            caption={`iContentsPro details quoted from their site, read ${READ_ON}`}
            columns={['On', 'iContentsPro', 'Kevin']}
            rows={[
              [
                'Photo to item',
                '“The first to break a single photo into every item inside it — each one its own line, priced and coded”',
                'A set of photographs of one object becomes at most one line; context shots become none',
              ],
              [
                'Insured self-capture',
                'Advertised, with unlimited homeowner invites',
                'Not offered — capture is the adjuster’s',
              ],
              [
                'Uncertain lines',
                'An AI confidence value on every line; low scores surface first',
                'Unpriced lines arrive blank and editable; confidence is on the item panel',
              ],
              [
                'Pricing model',
                'Per claim, and in monthly claim packs',
                '$249/mo flat, unlimited claims, 2,000 line items included',
              ],
              [
                'Depreciation',
                'Advertised as part of the report (RCV, ACV, depreciation)',
                'A published per-class schedule — 31 categories, 87 sub-lines — you can check by hand',
              ],
            ]}
          />
        </section>

        <section className="k-seosec">
          <h2>Neither approach is automatically right</h2>
          <p>
            Room-first is quicker to a draft and genuinely useful for establishing that property
            existed and roughly how much of it. Item-first costs more shooting time and gives the
            schedule something to argue from when brand or model moves the price. A closet
            photograph establishes that thirty shirts existed; it does not establish which three
            were designer, and pricing all thirty as mid-range produces a figure quickly without
            producing a defensible one.
          </p>
          <p>
            Speed and defensibility are not opposites, but they are not the same measurement
            either &mdash; and only one of them is visible in a demo.
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
              to: '/guides/best-contents-software-public-adjusters',
              t: 'What to look for in contents software',
              d: 'Criteria and the questions to put to any vendor, including us.',
            },
            {
              to: '/compare/kevin-vs-contents-team',
              t: 'Kevin vs Contents.team',
              d: 'Quoted, not scored — the same rule as this page.',
            },
            {
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly. Never per claim, never per seat.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
