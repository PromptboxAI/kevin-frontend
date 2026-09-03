import { useState } from 'react'
import SettingsShell from '../components/SettingsShell'
import {
  DEFAULT_PATTERN,
  FILENAME_TOKENS,
  buildFilename,
  isoDate,
} from '../lib/filename-rules'
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

/**
 * `head*` keys are section headings inside the toggle list, not toggles.
 *
 * Depreciation and Sales tax used to sit under "In the spreadsheet", which
 * offered something the spreadsheet cannot do. Rule 18 fixes the XactContents
 * column set — `# · Room/Area · Qty · Description · Make·Model · Unit Cost ·
 * Ext. Cost · Sales Tax · RCV + Tax · Age · % Depr. · $ Depr. · ACV` — and
 * both are columns in it. Switching either off for the .xlsx would produce a
 * file the carrier's importer rejects, so they are scoped to the formats that
 * can actually vary.
 *
 * They get their OWN group rather than joining the PDF-and-bundle one: photos,
 * comps and the audit log are PDF/bundle only (a CSV cannot carry a photo),
 * while these two apply to PDF and CSV alike. Folding them together would have
 * been a second inaccurate heading in place of the first.
 *
 * Proof link stays in the spreadsheet group and is correct there — it is an
 * ADDED column, not one of the template's own, so removing it cannot break
 * ingestion.
 */
const INCLUDES: [string, string, string | null, boolean | null][] = [
  ['head1', 'In the spreadsheet', null, null],
  ['proofLinks', 'Proof link column', 'The comp each price came from', true],
  ['head2', 'In the PDF and CSV only', null, null],
  ['depreciated', 'Depreciation % and $ columns', 'From the schedule on the claim', true],
  ['taxBreakout', 'Sales tax per line item', 'Rate resolved from the loss ZIP', true],
  ['head3', 'In the PDF and bundle only', null, null],
  ['photos', 'Item photos (high-res)', 'Adds 50-500 MB per claim', true],
  ['comps', 'All three pricing comps', 'With source URLs and fetch dates', true],
  ['notes', 'Adjuster notes', 'Free-text notes on the claim', true],
  ['audit', 'Full audit log', 'Every edit, with who and when', true],
  ['watermark', 'Watermark with business name', 'Useful on share-link exports', false],
]

/** Shown under the PDF-and-CSV group, because the exclusion is not obvious. */
const XACTIMATE_LOCKED =
  'The Xactimate (Excel) template always carries these two — they are columns in the XactContents schema, and a file missing them will not import.'

export default function SettingsExportPage() {
  // Every control below was inert: the format cards and the delivery radios had
  // no state at all (the "on" one was hardcoded), and the include checkboxes
  // only appeared to respond because the CSS repaints the box -- the tick was
  // drawn from a constant and just became white-on-white when unchecked.
  // A control that does not move reads as broken long before anyone discovers
  // it also does not save. State here; persistence is ask 35.
  const [format, setFormat] = useState('Xactimate (Excel)')
  const [pattern, setPattern] = useState(DEFAULT_PATTERN)
  const [delivery, setDelivery] = useState('download')
  const [includes, setIncludes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      INCLUDES.filter(([k]) => !k.startsWith('head')).map(([k, , , on]) => [k, on ?? false]),
    ),
  )

  // Discard works even though Save cannot: putting the screen back is local.
  const discard = () => {
    setFormat('Xactimate (Excel)')
    setDelivery('download')
    setPattern(DEFAULT_PATTERN)
    setIncludes(
      Object.fromEntries(
        INCLUDES.filter(([k]) => !k.startsWith('head')).map(([k, , , on]) => [k, on ?? false]),
      ),
    )
  }

  // The demo claim, so the preview shows a filename shaped like a real one.
  const example = buildFilename(pattern, {
    claim_number: 'CLM-2026-04412',
    insured_last: 'Godfrey',
    format: format.startsWith('Xactimate')
      ? 'xactimate'
      : format.startsWith('PDF')
        ? 'inventory'
        : 'items',
    date: isoDate(),
    carrier: 'Allstate',
    adjuster: 'Reyes',
    ext: format.startsWith('Xactimate') ? 'xlsx' : format.startsWith('PDF') ? 'pdf' : 'csv',
  })

  return (
    <SettingsShell
      activeId="export"
      title="Export defaults"
      eyebrow="Defaults · per export format"
      saveDisabled
      onDiscard={discard}
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
            k === 'head3' ? (
              <div key={k}>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--k-fg-4)',
                    lineHeight: 1.5,
                    padding: '10px 0 0',
                  }}
                >
                  {XACTIMATE_LOCKED}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'var(--k-fg-4)',
                    fontFamily: 'var(--k-font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                    padding: '16px 0 8px',
                  }}
                >
                  {l}
                </div>
              </div>
            ) : k.startsWith('head') ? (
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
          {/* Controlled, so the example below is genuinely computed from what
              is typed rather than a fixed string that happens to match. */}
          <div className="k-insp-field">
            <label htmlFor="filename-pattern">Pattern</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 11px',
                background: 'var(--k-bg)',
                border: '1px solid var(--k-line)',
                borderRadius: 6,
              }}
            >
              <input
                id="filename-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                spellCheck={false}
                style={{
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  flex: 1,
                  font: 'inherit',
                  fontSize: 13,
                  fontFamily: 'var(--k-font-mono)',
                  color: 'var(--k-fg)',
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
              Variables: {FILENAME_TOKENS.map((t) => `{${t}}`).join(' ')}
            </span>
          </div>
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
              {example}
            </div>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
