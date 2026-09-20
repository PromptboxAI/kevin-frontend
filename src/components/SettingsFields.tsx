import { useState } from 'react'
import { Icon, I } from './Icon'

/**
 * The settings form primitives, lifted verbatim from `F`, `FSelect`,
 * `FSelectOther` and `FBrandColor` in `design/components/settings-pages.jsx`.
 *
 * These are uncontrolled on purpose — the design uses `defaultValue`, and there
 * is no write route behind any settings screen yet (BACKEND-ASKS ask 33). Each
 * control's production target is recorded in INTERACTIONS.md, which is the
 * contract the no-dead-ends rule actually asks for: a control either works or
 * is written down. Substituting prose for the designed field is NOT the third
 * option, and reading it as one is what made these screens drift.
 */

/** Reusable form field for settings. */
export function F({
  label,
  value,
  mono = false,
  suffix,
  hint,
  width = '100%',
  readOnly,
  placeholder,
}: {
  label: string
  value: string
  mono?: boolean
  suffix?: string
  hint?: string
  width?: string | number
  readOnly?: boolean
  /** Shown when there is no stored value -- an empty field beats a stranger's. */
  placeholder?: string
}) {
  return (
    <div className="k-insp-field" style={{ width }}>
      <label>{label}</label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 11px',
          background: readOnly ? 'var(--k-bg-2)' : 'var(--k-bg)',
          border: '1px solid var(--k-line)',
          borderRadius: 6,
        }}
      >
        <input
          defaultValue={value}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            border: 0,
            outline: 0,
            background: 'transparent',
            flex: 1,
            font: 'inherit',
            fontSize: 13,
            fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
            color: 'var(--k-fg)',
          }}
        />
        {suffix ? (
          <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span> : null}
    </div>
  )
}

/**
 * Select variant of F. Used wherever a value must come from a known set — tax
 * regions, condition grades, depreciation schedules — so nobody can type a rate
 * that does not exist. Same frame as F so settings read uniformly.
 */
export function FSelect({
  label,
  value,
  options,
  mono = false,
  hint,
  width = '100%',
}: {
  label: string
  value: string
  options: readonly string[]
  mono?: boolean
  hint?: string
  width?: string | number
}) {
  return (
    <div className="k-insp-field" style={{ width }}>
      <label>{label}</label>
      <div className="k-fselect">
        <select
          defaultValue={value}
          style={{ fontFamily: mono ? 'var(--k-font-mono)' : 'inherit' }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="k-fselect-ic">
          <Icon d={I.chevdown} size={11} />
        </span>
      </div>
      {hint ? <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span> : null}
    </div>
  )
}

/**
 * Select with an "Other" escape hatch — constrained for everyone who fits a
 * known category, free text for anyone who doesn't.
 */
export function FSelectOther({
  label,
  value,
  options,
  hint,
  width = '100%',
  placeholder = 'Describe your business',
}: {
  label: string
  value: string
  options: readonly string[]
  hint?: string
  width?: string | number
  placeholder?: string
}) {
  const [v, setV] = useState(value)
  const other = v === 'Other'
  return (
    <div className="k-insp-field" style={{ width }}>
      <label>{label}</label>
      <div className="k-fselect">
        <select value={v} onChange={(e) => setV(e.target.value)}>
          {/* An empty first option, so nothing is chosen until someone
              chooses. Without it the browser shows option one and a guess
              gets stored as an answer (owner, 2026-09-20). */}
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value="Other">Other…</option>
        </select>
        <span className="k-fselect-ic">
          <Icon d={I.chevdown} size={11} />
        </span>
      </div>
      {other ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 6,
            padding: '8px 11px',
            background: 'var(--k-bg)',
            border: '1px solid var(--k-accent)',
            borderRadius: 6,
          }}
        >
          <input
            autoFocus
            placeholder={placeholder}
            style={{
              border: 0,
              outline: 0,
              background: 'transparent',
              flex: 1,
              font: 'inherit',
              fontSize: 13,
              color: 'var(--k-fg)',
            }}
          />
        </div>
      ) : null}
      {hint ? <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span> : null}
    </div>
  )
}

/**
 * Brand colour — curated swatches plus a native picker. The value drives
 * --pdf-accent on exported PDFs and the header on share links; nothing in the
 * app chrome changes, so the preview shows it where it actually appears.
 */

