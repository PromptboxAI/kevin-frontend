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
import {
  SCHEDULE_CAPTURED,
  SCHEDULE_COUNTS,
  SCHEDULE_ROWS,
} from '../content/depreciation-schedule.generated'

/**
 * /guides/useful-life-by-content-class — the public depreciation reference.
 *
 * GENERATED, NOT TYPED. Every row comes from
 * scripts/build-depreciation-reference.mjs, which fetches
 * GET /v1/depreciation-rules. Rule 13 says the live endpoint is the source and
 * to "fetch not retype" -- and a hand-kept copy of 87 lines would be wrong
 * within a release with nothing failing to say so.
 *
 * This replaces a worse idea. A PDF was proposed as the downloadable schedule;
 * it was a developer spec (platform fields, calculation_type,
 * manual_review_required) around an ALPHABETICAL item table, which is not the
 * structure the engine runs -- it would have contradicted the "31 categories,
 * 87 sub-lines" figure we publish on six pages.
 *
 * pcs_code, source_group and boundary are deliberately not rendered: mapping
 * and routing internals, and not what an adjuster is checking.
 */

const CATEGORIES = Array.from(new Set(SCHEDULE_ROWS.map((r) => r.category)))

const FAQS: Faq[] = [
  {
    q: 'What is useful life in a contents claim?',
    a: 'The number of years a class of property is expected to last, which is what a straight-line schedule divides an item’s age by. A six-year-old refrigerator against a fourteen-year life is 43% depreciated; the same age against a three-year life is fully depreciated.',
  },
  {
    q: 'Why do two similar items depreciate differently?',
    a: 'Because the class decides the life, not the price or the look of the item. Footwear, furniture and major appliances have very different expected lives, which is exactly why a single blanket percentage across a schedule comes apart under review.',
  },
  {
    q: 'Does depreciation really run to 100%?',
    a: 'Yes. Property past its useful life shows an actual cash value of $0.00 rather than stopping at a floor we invented. Only one line in the whole schedule carries a cap, and the reference above marks it.',
  },
  {
    q: 'Which classes are never priced automatically?',
    a: 'Six of them, marked in the table: jewelry, firearms, fine arts, furs, fine china and graded trading cards. They reach you unpriced with an editable field, because a number produced without an appraisal on that property is worse than a blank.',
  },
  {
    q: 'Why do some lines have no useful life at all?',
    a: 'Because age is not what drives their value. Those lines depreciate on a different basis — a flat rate, a percentage of replacement cost, or not at all — rather than on a years-owned calculation. The table says which applies to each.',
  },
  {
    q: 'Is this the schedule Kevin actually applies?',
    a: 'Yes, and that is the point of publishing it. The table is generated directly from the live schedule the pricing engine reads rather than maintained by hand, so it cannot drift from what the product does.',
  },
]

const CRUMBS = [{ to: '/guides/useful-life-by-content-class', t: 'Useful life reference' }]

export default function UsefulLifeReferencePage() {
  return (
    <div className="k-landing">
      <Seo
        path="/guides/useful-life-by-content-class"
        jsonLd={[faqJsonLd(FAQS), crumbJsonLd(CRUMBS)]}
      />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Useful Life by Content Class"
          lede={`The depreciation schedule Kevin applies, in full: ${SCHEDULE_COUNTS.lines} lines across ${SCHEDULE_COUNTS.categories} categories. Generated from the live schedule rather than maintained by hand, so it cannot drift from what the product does.`}
          byline="Kevin Godfrey, Kevin"
          updated="5 October 2026"
        />

        <DirectAnswer
          question="How long is each class of personal property expected to last?"
          answer={`Kevin's schedule carries ${SCHEDULE_COUNTS.lines} lines across ${SCHEDULE_COUNTS.categories} categories, each with its own useful life. Age divided by that life gives the depreciation percentage, and it runs to 100%.`}
        >
          <p>
            Useful life is the number most contents arguments actually turn on, because it is what
            converts an age into a percentage. The whole schedule is below, and the same data is{' '}
            <a href="/reference/kevin-useful-life-schedule.csv" download>
              downloadable as a CSV
            </a>{' '}
            if you would rather have it in a spreadsheet.
          </p>
        </DirectAnswer>

        <section className="k-seosec">
          <h2>How to read it</h2>
          <ul className="k-seolist">
            <li>
              <strong>Straight line by age</strong> &mdash; age ÷ useful life, which is{' '}
              {SCHEDULE_COUNTS.lines - SCHEDULE_COUNTS.noUsefulLife} of the{' '}
              {SCHEDULE_COUNTS.lines} lines.
            </li>
            <li>
              <strong>No useful life shown</strong> &mdash; {SCHEDULE_COUNTS.noUsefulLife} lines
              depreciate on another basis entirely, or not at all. The row says which.
            </li>
            <li>
              <strong>Appraisal class</strong> &mdash; {SCHEDULE_COUNTS.appraisal} classes are never
              priced automatically and reach you with a blank, editable field.
            </li>
            <li>
              <strong>Cap</strong> &mdash; only {SCHEDULE_COUNTS.capped} line in the schedule carries
              a ceiling. Everything else runs to 100%.
            </li>
          </ul>
          <EvidenceCallout>
            <p>
              <strong>Depreciation applies to the tax-inclusive figure</strong> and is computed
              server-side, so the worksheet and the export cannot disagree and line 400 is treated
              the same as line 4. A schedule is only as good as the consistency with which it is
              applied.
            </p>
          </EvidenceCallout>
        </section>

        <section className="k-seosec">
          <h2>The schedule</h2>
          <p className="k-seonote">
            Captured from the live schedule on {SCHEDULE_CAPTURED}. Depreciation is subject to the
            policy and the jurisdiction; Kevin computes a schedule, not a coverage determination.
          </p>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="k-sched-group">
              <h3 className="k-sched-cat">{cat}</h3>
              <div className="k-ctable-wrap">
                <table className="k-ctable k-sched-table">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Useful life</th>
                      <th scope="col">How it depreciates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEDULE_ROWS.filter((r) => r.category === cat).map((r) => (
                      <tr key={r.item}>
                        <th scope="row">
                          {r.item}
                          {r.appraisal ? (
                            <span className="k-sched-tag">Appraisal class</span>
                          ) : null}
                        </th>
                        <td className="k-mono">
                          {r.years === null ? '—' : `${r.years} ${r.years === 1 ? 'yr' : 'yrs'}`}
                        </td>
                        <td>
                          {r.how}
                          {r.flatPct ? ` (${Math.round(r.flatPct * 100)}%)` : ''}
                          {r.maxPct ? ` · capped at ${Math.round(r.maxPct * 100)}%` : ''}
                          {r.note ? ` · ${r.note}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <section className="k-seosec">
          <h2>Common questions</h2>
          <FaqList items={FAQS} />
        </section>

        <CtaBand />

        <RelatedCards
          items={[
            {
              to: '/guides/insurance-contents-depreciation',
              t: 'How contents depreciation works',
              d: 'What the schedule does with an age, and why it runs to 100%.',
            },
            {
              to: '/guides/rcv-vs-acv-personal-property',
              t: 'RCV vs ACV',
              d: 'How a real line foots once tax is in it.',
            },
            {
              to: '/guides/contents-claim-qa-checklist',
              t: 'Contents claim QA checklist',
              d: 'Checking class and age before the schedule leaves.',
            },
            {
              to: '/guides/high-value-contents-claims',
              t: 'Documenting high-value property',
              d: 'Where the appraisal classes come in.',
            },
          ]}
        />
      </main>

      <MktFooter />
    </div>
  )
}
