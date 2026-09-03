import { useState } from 'react'
import SettingsShell from '../components/SettingsShell'
import { F } from '../components/SettingsFields'
import Badge from '../components/Badge'
import { Icon, I } from '../components/Icon'

/**
 * Screen 33 — Export defaults. Ported from `SettingsExport` in
 * `design/components/settings-pages.jsx`, verbatim.
 *
 * SCOPE, because the label invites a wrong reading: these govern what goes in
 * the EXPORTED FILE. None of them changes the worksheet on screen. Turning off
 * "Sales tax per line item" removes the Sales Tax column from the export; the
 * worksheet still shows tax, because that is where the adjuster checks the
 * arithmetic that produced it.
 *
 * Nothing persists yet either — no defaults endpoint (BACKEND-ASKS ask 35) —
 * so the Save bar is disabled and the export modal uses its own defaults.
 *
 * The controls were also inert, which is a separate bug from not saving: the
 * format cards and delivery radios had no state (the selected one was
 * hardcoded), and the include checkboxes only appeared to respond because the
 * CSS repaints the box — the tick was drawn from a constant and merely went
 * white-on-white. All three hold state now, so the screen behaves like a form
 * even though the form has nowhere to post.
 *
 * OPEN QUESTION for design: rule 18 fixes the XactContents column set, and
 * Sales Tax is one of its columns. Switching it off for the .xlsx format would
 * produce a file Xactimate cannot ingest — so this toggle arguably belongs to
 * the PDF/CSV formats only, the way the second group already is.
 */

const FORMATS: [string, string, boolean][] = [
  ['Xactimate (Excel)', '.xlsx · XactContents template', true],
  ['PDF inventory', '.pdf · client-facing', false],
  ['Generic CSV', '.csv · any other tool', false],
]

/** `head*` keys are section headings inside the toggle list, not toggles. */
const INCLUDES: [string, string, string | null, boolean | null][] = [
  ['head1', 'In the spreadsheet', null, null],
  ['depreciated', 'Depreciation % and $ columns', 'From the schedule on the claim', true],
  ['taxBreakout', 'Sales tax per line item', 'Rate resolved from the loss ZIP', true],
  ['proofLinks', 'Proof link column', 'The comp each price came from', true],
  ['head2', 'In the PDF and bundle only', null, null],
  ['photos', 'Item photos (high-res)', 'Adds 50-500 MB per claim', true],
  ['comps', 'All three pricing comps', 'With source URLs and fetch dates', true],
  ['notes', 'Adjuster notes', 'Free-text notes on the claim', true],
  ['audit', 'Full audit log', 'Every edit, with who and when', true],
  ['watermark', 'Watermark with business name', 'Useful on share-link exports', false],
]

export default function SettingsExportPage() {
  // Every control below was inert: the format cards and the delivery radios had
  // no state at all (the "on" one was hardcoded), and the include checkboxes
  // only appeared to respond because the CSS repaints the box -- the tick was
  // drawn from a constant and just became white-on-white when unchecked.
  // A control that does not move reads as broken long before anyone discovers
  // it also does not save. State here; persistence is ask 35.
  const [format, setFormat] = useState('Xactimate (Excel)')
  const [delivery, setDelivery] = useState('download')
  const [includes, setIncludes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      INCLUDES.filter(([k]) => !k.startsWith('head')).map(([k, , , on]) => [k, on ?? false]),
    ),
  )

  return (
    <SettingsShell
      activeId="export"
      title="Export defaults"
      eyebrow="Defaults · per export format"
      saveDisabled
      saveNote={
        <>
          These are meant to pre-fill the export modal, with per-claim
          overrides — but nothing saves yet: there is no export-defaults route
          (BACKEND-ASKS ask 35). The modal uses its own defaults today.
        </>
      }
    >
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          What&apos;s in the box, by default.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620 }}>
          These defaults pre-fill the Export modal whenever you start an export. You can still
          override anything per-claim.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Default export format</div>
        <div className="k-set-card-body">
          <div className="k-format-grid">
            {FORMATS.map(([l, sub]) => {
              const on = format === l
              return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() => setFormat(l)}
                className={`k-format ${on ? 'k-format--on' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{l}</span>
                  {on ? <Badge tone="ok">Default</Badge> : null}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--k-fg-4)',
                    fontFamily: 'var(--k-font-mono)',
                    marginTop: 4,
                  }}
                >
                  {sub}
                </div>
                {on ? (
                  <div className="k-format-check">
                    <Icon d={I.check} size={11} stroke={2.5} />
                  </div>
                ) : null}
              </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Include by default</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {INCLUDES.map(([k, l, s], i) =>
            k.startsWith('head') ? (
              <div
                key={k}
                style={{
                  fontSize: 10.5,
                  color: 'var(--k-fg-4)',
                  fontFamily: 'var(--k-font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  padding: i === 0 ? '2px 0 8px' : '16px 0 8px',
                }}
              >
                {l}
              </div>
            ) : (
              <label key={k} className="k-toggle">
                <input
                  type="checkbox"
                  checked={includes[k] ?? false}
                  onChange={() => setIncludes((p) => ({ ...p, [k]: !p[k] }))}
                />
                <span className="k-toggle-box">
                  {includes[k] ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--k-fg)' }}>{l}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>{s}</span>
                </span>
              </label>
            ),
          )}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Delivery</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(
            [
              ['download', 'Download to my computer', 'Default'],
              ['link', 'Copy a secure share link', 'Expires in 7 days'],
            ] as [string, string, string][]
          ).map(([key, label, meta]) => (
            <label key={key} className="k-radio">
              <input
                type="radio"
                name="delivery"
                checked={delivery === key}
                onChange={() => setDelivery(key)}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
              <span className={`k-radio-dot ${delivery === key ? 'k-radio-dot--on' : ''}`} />
              <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{meta}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Filename pattern</div>
        <div className="k-set-card-body">
          <F
            label="Pattern"
            value="{claim_number}_{insured_last}_{format}_{date}.{ext}"
            mono
            hint="Variables: {claim_number} {insured_last} {format} {date} {carrier} {adjuster}"
          />
          <div
            style={{
              marginTop: 10,
              padding: '10px 14px',
              background: 'var(--k-bg-2)',
              border: '1px solid var(--k-line)',
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Example
            </div>
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg)' }}>
              CLM-2026-04412_Godfrey_xactimate_2026-08-04.xlsx
            </div>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
