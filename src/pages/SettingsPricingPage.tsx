import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import SettingsShell from '../components/SettingsShell'

/**
 * Screen 14 — Pricing.
 *
 * Ported from `design/components/settings-pricing.jsx`. This screen carries
 * rule 10, so the shape matters as much as the styling: Kevin runs NO
 * per-retailer scrapers. Every comp comes from ONE aggregator (Google Shopping
 * + the Immersive Product API via SerpApi). There is no store roster and no
 * per-store toggles — the coverage list below is informational, and what the
 * screen actually controls is how results are classified and ranked, never
 * where they are fetched from.
 *
 * One deviation, marked: the design's engine-status strip is seeded with live
 * figures (2,189 comps today · 87% match · ±6.2% · 24h). `GET /v1/sources`
 * returns `telemetry: "coming_soon"` — those numbers have no source. Inventing
 * them on the screen that explains how values are justified would be the worst
 * possible place to do it, so the strip renders the fields with the telemetry
 * state the API actually reports.
 */

/** Coverage the aggregator returns — informational, NOT toggleable sources. */
const COVERAGE: [string, string][] = [
  ['Major retailers', 'Amazon · Walmart · Target · Best Buy · Home Depot · Lowe’s'],
  ['Furniture & home', 'Wayfair · West Elm · CB2 · Pottery Barn · Article'],
  ['Specialty', 'Category retailers surfaced automatically by query match'],
  [
    'Marketplaces',
    'Returned when a retail listing exists — marketplace offers are included in the comp set',
  ],
  ['Brand direct', 'Manufacturer storefronts, used as tiebreaker when merchants disagree'],
]

const BASES: [string, 'ok' | 'info' | 'wait', string][] = [
  [
    'Retail comp',
    'ok',
    'Item still sold new — RCV = median of the live merchant comps returned for the query. Two alternates stay one click away in the worksheet, each with a dated proof link.',
  ],
  [
    'Like-kind substitute',
    'info',
    'Exact model discontinued but a comparable is still sold new — Kevin prices the nearest NEW equivalent as RCV. Substitution is noted on the row.',
  ],
  [
    'Manual / appraisal',
    'wait',
    'No confident new-replacement comp came back, or the class is manual-only (Jewelry, Fine Arts, Firearms, Furs) — the item arrives flagged needs_manual with a reason, RCV and ACV null, and the adjuster types the value and attaches a proof link. Kevin never prices an item off a used listing to avoid leaving it blank.',
  ],
]


export default function SettingsPricingPage() {

  return (
    <SettingsShell activeId="pricing" title="Pricing" eyebrow="Pricing" save={false}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          Where Kevin gets Replacement Cost Values.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 760, lineHeight: 1.6 }}>
          Every comp comes from <strong>one unified aggregator</strong> — there
          are no per-retailer integrations. What this screen controls is not{' '}
          <em>where</em> we fetch, but how results are{' '}
          <strong>classified and ranked</strong>. Jewelry, Fine Arts, Firearms
          and Furs are never auto-priced — they arrive flagged for a person. RCV
          defaults to the <strong>median of the live comps</strong> returned for
          an item, with the alternates one click away in the worksheet and a
          dated proof link kept for the file.
        </p>
      </div>

      <section className="k-ov-card k-pcard">
        <div className="k-ov-card-hd k-pcard-hd">
          <span className="k-pcard-t">
            <span className="k-pcard-ic k-pcard-ic--accent">
              <Icon d={I.search} size={12} />
            </span>
            Comp source
          </span>
          <Badge tone="ok">Operational</Badge>
        </div>
        <div style={{ padding: '10px 14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 14px' }}>
            <div className="k-source-logo">G</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  Google Shopping · Immersive Product API
                </span>
                <Badge tone="accent">unified</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 3 }}>
                Served via SerpApi · one query per item returns live merchant
                offers with prices, links and availability
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--k-line)',
              marginTop: 4,
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              className="k-mono"
              style={{
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              What the aggregator covers
            </div>
            {COVERAGE.map(([title, desc]) => (
              <div key={title} className="k-pcov">
                <span className="k-pcov-t">{title}</span>
                <span className="k-pcov-d">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="k-ov-card k-pcard">
        <div className="k-ov-card-hd k-pcard-hd">
          <span className="k-pcard-t">
            <span className="k-pcard-ic k-pcard-ic--wait">
              <Icon d={I.file} size={12} />
            </span>
            How Kevin sets each value
          </span>
        </div>
        <div style={{ padding: '18px 14px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {BASES.map(([title, tone, desc]) => (
            <div key={title} className={`k-pbasis k-pbasis--${tone}`}>
              <div className="k-pbasis-t">{title}</div>
              <div className="k-pbasis-d">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </SettingsShell>
  )
}
