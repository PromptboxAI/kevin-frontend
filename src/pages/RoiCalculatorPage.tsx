import { useState } from 'react'
import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import {
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
 * /contents-software-roi — batch 4, spec page 30.
 *
 * EVERY ASSUMPTION IS THE VISITOR'S, and that is the point rather than a
 * nicety. The homepage's MktROISection hardcodes HOURS_SAVED = 4.5 per claim,
 * which the visitor cannot change and which still contradicts the stats ribbon
 * (256 photos "machine-unattended" against "13.3 hours by hand") -- an open
 * question with the owner. A calculator that ships a savings figure of our own
 * inherits that argument; one that computes from numbers the reader typed does
 * not, and is more persuasive to the kind of person who would check.
 *
 * So this page asserts no time saving. It does the arithmetic on the reader's
 * inputs, labels the output as an estimate from those inputs, and the only
 * Kevin figure in it is the subscription price. The brief's "work that
 * previously required weeks ... can be reduced dramatically" is not published:
 * nothing substantiates it.
 *
 * The one measured datum we do have -- 4,000+ carrier-facing lines in a single
 * month, every line reviewed, from the owner's own practice -- is given as
 * context, not as a rate to extrapolate from.
 *
 * PLAN_PRICE is the advertised Pro price (rule 9: $249/mo flat, unlimited
 * claims, 2,000 items included). It is a default the reader can overwrite,
 * because the honest framing is "your cost", not "our price".
 */

const PLAN_PRICE = 249

type Inputs = {
  claims: number
  linesPerClaim: number
  manualMins: number
  reviewMins: number
  hourly: number
  software: number
}

const DEFAULTS: Inputs = {
  claims: 4,
  linesPerClaim: 500,
  manualMins: 5,
  reviewMins: 1,
  hourly: 40,
  software: PLAN_PRICE,
}

const FIELDS: { k: keyof Inputs; label: string; hint: string; step: number; prefix?: string }[] = [
  { k: 'claims', label: 'Contents claims per month', hint: 'How many you actually run', step: 1 },
  { k: 'linesPerClaim', label: 'Average line items per claim', hint: 'Lines, not photographs', step: 25 },
  { k: 'manualMins', label: 'Minutes per line, by hand', hint: 'Identify, research, source, classify, enter', step: 1 },
  { k: 'reviewMins', label: 'Minutes per line, reviewing', hint: 'Your estimate — not ours', step: 1 },
  { k: 'hourly', label: 'Loaded hourly cost', hint: 'Whoever does the work', step: 5, prefix: '$' },
  { k: 'software', label: 'Software cost per month', hint: 'Pro is $249 flat', step: 10, prefix: '$' },
]

const usd = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US')
const hrs = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: 1 })

function Calculator() {
  const [v, setV] = useState<Inputs>(DEFAULTS)
  const set = (k: keyof Inputs, raw: string) => {
    const n = Number(raw)
    setV((p) => ({ ...p, [k]: Number.isFinite(n) && n >= 0 ? n : 0 }))
  }

  const lines = v.claims * v.linesPerClaim
  const manualHours = (lines * v.manualMins) / 60
  const reviewHours = (lines * v.reviewMins) / 60
  const manualCost = manualHours * v.hourly
  const assistedCost = reviewHours * v.hourly + v.software
  const diff = manualCost - assistedCost
  const recovered = manualHours - reviewHours

  // Break-even: how many lines the software has to help with before it covers
  // its own cost at the reader's own rate.
  const savedPerLine = ((v.manualMins - v.reviewMins) / 60) * v.hourly
  const breakEven = savedPerLine > 0 ? Math.ceil(v.software / savedPerLine) : null
  const perLine = lines > 0 ? v.software / lines : null

  return (
    <div className="k-roix">
      <div className="k-roix-inputs">
        {FIELDS.map((f) => (
          <label key={f.k} className="k-roix-field">
            <span className="k-roix-label">{f.label}</span>
            <span className="k-roix-input">
              {f.prefix ? <span className="k-roix-prefix">{f.prefix}</span> : null}
              <input
                type="number"
                min={0}
                step={f.step}
                value={v[f.k]}
                onChange={(e) => set(f.k, e.target.value)}
                inputMode="numeric"
              />
            </span>
            <span className="k-roix-hint">{f.hint}</span>
          </label>
        ))}
      </div>

      <div className="k-roix-out">
        <div className="k-roix-row k-roix-row--lead">
          <span>Line items a month</span>
          <strong className="k-mono">{lines.toLocaleString('en-US')}</strong>
        </div>
        <div className="k-roix-row">
          <span>Hours by hand</span>
          <strong className="k-mono">{hrs(manualHours)}</strong>
        </div>
        <div className="k-roix-row">
          <span>Hours reviewing instead</span>
          <strong className="k-mono">{hrs(reviewHours)}</strong>
        </div>
        <div className="k-roix-row k-roix-row--mark">
          <span>Hours recovered</span>
          <strong className="k-mono">{hrs(recovered)}</strong>
        </div>
        <div className="k-roix-sep" />
        <div className="k-roix-row">
          <span>Labour, by hand</span>
          <strong className="k-mono">{usd(manualCost)}</strong>
        </div>
        <div className="k-roix-row">
          <span>Labour + software</span>
          <strong className="k-mono">{usd(assistedCost)}</strong>
        </div>
        <div className="k-roix-row k-roix-row--mark">
          <span>Monthly difference</span>
          <strong className="k-mono">{usd(diff)}</strong>
        </div>
        <div className="k-roix-sep" />
        <div className="k-roix-row">
          <span>Break-even</span>
          <strong className="k-mono">
            {breakEven === null ? '—' : `${breakEven.toLocaleString('en-US')} lines`}
          </strong>
        </div>
        <div className="k-roix-row">
          <span>Software per line</span>
          <strong className="k-mono">
            {perLine === null ? '—' : '$' + perLine.toFixed(2)}
          </strong>
        </div>
        <p className="k-roix-note">
          Every figure here is arithmetic on the numbers above. They are your assumptions, not our
          claims, and nothing on this page estimates how much faster Kevin will be for you.
        </p>
      </div>
    </div>
  )
}

const FAQS: Faq[] = [
  {
    q: 'How much time does contents software save?',
    a: 'Honestly: it depends on your claims, and anyone quoting a single multiplier is guessing on your behalf. It depends on photograph quality, how much of the property is unusual, and how much research you currently do by hand. That is why this page asks for your numbers rather than supplying ours.',
  },
  {
    q: 'Is this calculator a guarantee?',
    a: 'No. It is arithmetic on the assumptions you enter. Change the minutes per line and the answer changes; the honest use of it is to try a conservative case and see whether it still makes sense.',
  },
  {
    q: 'Where does the time actually go on a large claim?',
    a: 'Replacement-cost research first, then organising photographs into items, recording sources, and applying depreciation consistently. Each is a couple of minutes on one item and weeks across a thousand — which is what makes it a workflow problem rather than a difficulty problem.',
  },
  {
    q: 'Is Kevin only worth it on very large claims?',
    a: 'The benefit scales with line count, so it is most obvious on large inventories. The break-even figure above is the useful test: it is how many lines have to be helped before the subscription covers itself at your own rate.',
  },
  {
    q: 'What does Kevin cost?',
    a: '$249 a month, flat — never per claim and never per seat. Claims are unlimited; line items are the metered dimension, with 2,000 included each month. The first 250 line items are free with no deadline. The pricing page is the authoritative source.',
  },
  {
    q: 'Does the saving come out of payroll?',
    a: 'For most firms, no — and that is the more interesting case. Recovered hours usually turn into capacity: more losses handled, less research outsourced, faster turnaround. That is a change in what the practice can take on rather than a smaller wage bill.',
  },
]

const CRUMBS = [{ to: '/contents-software-roi', t: 'ROI calculator' }]

export default function RoiCalculatorPage() {
  return (
    <div className="k-landing">
      <Seo
        path="/contents-software-roi"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Contents Software ROI Calculator"
          lede="The cost of contents work is mostly labour, not software. This works out what your current process costs at your own numbers — and what has to be true for automation to pay for itself."
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="How do you work out the ROI of contents software?"
          answer="Compare what the manual work costs at your volume and your hourly rate against the reviewing time plus the subscription — then check how many line items have to be helped before the software covers itself."
        >
          <p>
            Everything below runs on numbers you enter. We have deliberately not built in a time
            saving of our own: the figure that matters is yours, and a calculator that assumes its
            own answer is worth nothing to the person most worth convincing.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>Your numbers</h2>
          <Calculator />
        </section>

        <section className="k-seosec">
          <h2>Why minutes per line is the number that matters</h2>
          <p>
            A single contents line is not hard. At five minutes each &mdash; identify it, write the
            description, research a replacement, check it, record the source, classify it,
            depreciate it, enter it &mdash; a 500-line inventory is about 42 hours. At two minutes
            it is under 17. Nothing else in the calculation moves the answer as much, which is also
            why it is the number worth measuring on your own next claim rather than estimating.
          </p>
          <EvidenceCallout>
            <p>
              <strong>Try the conservative case first.</strong> Put in the smallest improvement you
              would actually believe, and see whether the break-even line count is still comfortably
              below your monthly volume. If it is, the argument does not depend on the optimistic
              numbers.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>Capacity, not payroll</h2>
          <p>
            Most firms do not convert recovered hours into a smaller wage bill. They convert them
            into more losses handled, less research outsourced, faster turnaround and fewer weekends
            in a spreadsheet. That is a change in what the practice can take on, and for a public
            adjusting firm it is usually worth more than the labour line.
          </p>
        </section>

        <section className="k-seosec">
          <h2>One piece of context</h2>
          <p>
            Kevin was built out of real public-adjuster work rather than from a product spec. In a
            single month, more than four thousand carrier-facing contents line items were produced
            through it, with a person confirming the grouping on every one before it became a claim
            item.
          </p>
          <p>
            That is a volume, not a rate, and it is deliberately not plugged into the calculator
            above &mdash; your claims are not that claim. The useful test is still to run one real
            inventory through and time it against what you do now.
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
              to: '/pricing',
              t: 'Pricing: $249/mo, unlimited claims',
              d: 'Flat monthly. Items are metered, not claims. First 250 free, no deadline.',
            },
            {
              to: '/guides/large-contents-inventory-500-items',
              t: 'Building a 500+ item claim',
              d: 'Where the hours actually go, bottleneck by bottleneck.',
            },
            {
              to: '/case-studies/4000-contents-line-items-30-days',
              t: '4,000+ line items in 30 days',
              d: "One adjuster's month, and what was reviewed on every line.",
            },
            {
              to: '/guides/how-to-price-contents-claims-faster',
              t: 'How to price contents claims faster',
              d: 'The five bottlenecks, and where automation should stop.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
