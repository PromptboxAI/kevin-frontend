import { useQuery } from '@tanstack/react-query'
import SettingsShell, { NotWired } from '../components/SettingsShell'
import { api } from '../lib/api'

/**
 * Screen 33 — Export defaults.
 *
 * The one screen in this group with real data behind it, though not the data
 * the design assumed. There are no per-account export defaults to save; what
 * exists is `GET /v1/depreciation-rules`, the live class taxonomy the engine
 * actually applies.
 *
 * Showing it read-only is the point, not a consolation. Rule 13 is explicit
 * that this endpoint is the live source and must be fetched rather than
 * retyped: a settings screen that let someone edit a local copy of the
 * schedule would be a second set of depreciation rules that can drift from the
 * one doing the arithmetic — which is exactly why client-side `getDepFor()`
 * was removed from the worksheet.
 */

type Rules = { rules: Record<string, unknown>; categories: string[] }

/** Xactimate/XactContents parity order (rule 18). Fixed, not configurable. */
const EXPORT_COLUMNS = [
  '#',
  'Room/Area',
  'Qty',
  'Description',
  'Make/MFR',
  'Model #',
  'Content class (PCS)',
  'Unit Cost',
  'Ext. Cost',
  'Sales Tax',
  'RCV + Tax',
  'Age',
  '% Depr.',
  '$ Depr.',
  'ACV',
  'Source link',
]

export default function SettingsExportPage() {
  const rules = useQuery({
    queryKey: ['depreciation-rules'],
    queryFn: () => api.get<Rules>('/v1/depreciation-rules'),
    staleTime: Infinity,
  })

  const classes = rules.data?.categories ?? []

  return (
    <SettingsShell activeId="export" title="Export defaults" eyebrow="Documents">
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
          What an export contains
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 640, lineHeight: 1.55 }}>
          Two documents come out of a claim, and neither is configurable — they
          match what Xactimate expects to ingest.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Column order · Xactimate (Excel) · .xlsx</div>
        <div className="k-set-card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXPORT_COLUMNS.map((c, i) => (
              <span key={c} className="k-chip" style={{ cursor: 'default' }}>
                <span className="k-mono" style={{ color: 'var(--k-fg-4)', marginRight: 4 }}>
                  {i + 1}
                </span>
                {c}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--k-fg-4)', lineHeight: 1.55, margin: '12px 0 0' }}>
            Fixed on purpose. The file exists to be ingested by
            XactContents, so the columns match its template and the on-screen
            worksheet — one shape, three places. <strong>Content class and
            useful life are internal to the depreciation maths</strong> and never
            appear as adjuster-facing columns; the PCS code does.
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--k-fg-4)', lineHeight: 1.55, margin: '8px 0 0' }}>
            Every cell is a <strong>static value</strong> — never a formula.
            Xactimate's importer breaks on them, and typing an age into the
            exported sheet will not recalculate anything. Age entry lives in the
            worksheet, and you re-export.
          </p>
        </div>
      </section>

      <section className="k-set-card" style={{ marginTop: 18 }}>
        <div className="k-set-card-hd">
          Depreciation schedule · {classes.length} content classes · live
        </div>
        <div className="k-set-card-body">
          {rules.isLoading ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading the schedule…</p>
          ) : classes.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>
              Could not load the schedule.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="k-rec-table" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Content class</th>
                    <th>Useful life</th>
                    <th style={{ textAlign: 'left' }}>PCS</th>
                    <th style={{ textAlign: 'left' }}>Bracketed curve</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((name) => {
                    const rule = (rules.data?.rules?.[name] ?? {}) as Record<string, unknown>
                    const life = rule.useful_life_years as number | null | undefined
                    const brackets = rule.brackets_pct
                    return (
                      <tr key={name}>
                        <td>{name}</td>
                        {/* null life = no auto-depreciation, never "0 years"
                            (rule 13). Jewelry, Firearms, Fine Arts and Furs. */}
                        <td className="k-mono">
                          {life == null ? 'manual only' : `${life}y`}
                        </td>
                        <td className="k-mono">{(rule.pcs_code as string) ?? '—'}</td>
                        <td className="k-mono" style={{ fontSize: 11 }}>
                          {Array.isArray(brackets) ? brackets.join(' · ') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ fontSize: 11.5, color: 'var(--k-fg-4)', lineHeight: 1.55, margin: '12px 0 0' }}>
            Read-only, and deliberately so. This is the schedule the engine
            applies, fetched live — an editable local copy would be a second set
            of rules that can drift from the one doing the arithmetic. Straight
            line is the default (<span className="k-mono">age ÷ useful life</span>,
            capped to keep a salvage floor); a line can be overridden by hand in
            the worksheet's % Depr. column.
          </p>
        </div>
      </section>

      <div style={{ marginTop: 18 }}>
        <NotWired
          what="Per-account export defaults"
          detail="Screen 33 designs a default depreciation method, a default tax region and a column picker. None has an endpoint, and two of the three should probably not exist: the column order is Xactimate parity, and the tax rate follows the loss address rather than the account. A default METHOD per account is the one that would genuinely help — it is currently chosen per claim."
        />
      </div>
    </SettingsShell>
  )
}
