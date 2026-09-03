import { useState } from 'react'
import Badge from '../components/Badge'
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

const BASES: [string, string][] = [
  [
    'Retail comp',
    'Item still sold new — RCV = median of the live merchant comps returned for the query. Two alternates stay one click away in the worksheet, each with a dated proof link.',
  ],
  [
    'Like-kind substitute',
    'Exact model discontinued but a comparable is still sold new — Kevin prices the nearest NEW equivalent as RCV. Substitution is noted on the row.',
  ],
  [
    'Manual / appraisal',
    'No confident new-replacement comp came back, or the class is manual-only (Jewelry, Fine Arts, Firearms, Furs) — the item arrives flagged needs_manual with a reason, RCV and ACV null, and the adjuster types the value and attaches a proof link. Kevin never prices an item off a used listing to avoid leaving it blank.',
  ],
]

function Toggle({
  on,
  set,
  title,
  desc,
}: {
  on: boolean
  set: (fn: (v: boolean) => boolean) => void
  title: string
  desc: string
}) {
  return (
    <div className="k-rule" style={{ alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-fg)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', lineHeight: 1.5, marginTop: 3 }}>
          {desc}
        </div>
      </div>
      <label className="k-switch" style={{ marginTop: 2 }}>
        <input type="checkbox" checked={on} onChange={() => set((v) => !v)} />
        <span className="k-switch-track">
          <span className="k-switch-thumb" />
        </span>
      </label>
    </div>
  )
}

export default function SettingsPricingPage() {
  const [lkq, setLkq] = useState(true)
  const [ceilings, setCeilings] = useState(true)
  const [tiebreak, setTiebreak] = useState(true)

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

      <section className="k-ov-card" style={{ background: 'var(--k-bg)' }}>
        <div className="k-ov-card-hd">
          <span>Comp source</span>
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

          {/* Per-source telemetry is Phase 3b -- `/v1/sources` reports
              `telemetry: "coming_soon"`. The design seeds this strip with
              figures; showing invented ones here would be inventing evidence on
              the screen that explains how evidence is gathered. */}
          <div className="k-pricing-stats" style={{ marginBottom: 14 }}>
            {['Comps fetched · today', 'Avg match rate', 'Avg variance · comps', 'Refresh cadence'].map(
              (label) => (
                <div className="k-ps" key={label}>
                  <div className="k-ps-l">{label}</div>
                  <div className="k-ps-v" style={{ fontSize: 15, color: 'var(--k-fg-4)' }}>
                    —
                  </div>
                </div>
              ),
            )}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginBottom: 12 }}>
            Live source telemetry is not reported yet.
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
              <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--k-fg-2)', width: 140, flexShrink: 0 }}
                >
                  {title}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="k-ov-card" style={{ background: 'var(--k-bg)' }}>
        <div className="k-ov-card-hd">
          <span>Valuation behavior</span>
        </div>
        <div style={{ padding: '8px 14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Toggle
            on={lkq}
            set={setLkq}
            title="Like-kind and quality (LKQ) substitutions"
            desc="When the exact make/model is discontinued or unmatched, price the nearest comparable item still sold new. The substitution is recorded on the row so the carrier can see what was priced."
          />
          <Toggle
            on={ceilings}
            set={setCeilings}
            title="Enforce class depreciation ceilings"
            desc="Cap each item's depreciation at the maximum for its content class, so a salvage floor is always retained no matter the age. Off, straight-line runs uncapped to the schedule's own limit."
          />
          <Toggle
            on={tiebreak}
            set={setTiebreak}
            title="Brand-direct tiebreaker"
            desc="When merchant offers disagree by more than 15%, weight the manufacturer's own storefront price to settle the median."
          />
          {/* The design puts Save here. There is no endpoint that stores these
              three, so the toggles move locally and nothing is promised. */}
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 4 }}>
            These three are engine defaults. No endpoint stores them per account
            yet, so changing one here does not persist.
          </div>
        </div>
      </section>

      <section className="k-ov-card" style={{ background: 'var(--k-bg)' }}>
        <div className="k-ov-card-hd">
          <span>How Kevin sets each value</span>
        </div>
        <div style={{ padding: '8px 14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {BASES.map(([title, desc]) => (
            <div key={title}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.55, marginTop: 2 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SettingsShell>
  )
}
