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
}: {
  label: string
  value: string
  mono?: boolean
  suffix?: string
  hint?: string
  width?: string | number
  readOnly?: boolean
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
const BRAND_SWATCHES = ['#2E4B6F', '#1F3A5F', '#2F5D50', '#6B4E3D', '#5B4B8A', '#1a1d21']

export function FBrandColor({ value = '#2E4B6F' }: { value?: string }) {
  const [c, setC] = useState(value)
  return (
    <div className="k-insp-field">
      <label>Primary brand colour</label>
      <div className="k-brand-row">
        {BRAND_SWATCHES.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setC(h)}
            className={'k-brand-sw' + (c.toLowerCase() === h.toLowerCase() ? ' is-on' : '')}
            style={{ background: h }}
            title={h}
          />
        ))}
        <label className="k-brand-custom" title="Pick any colour">
          <input type="color" value={c} onChange={(e) => setC(e.target.value)} />
          <Icon d={I.edit} size={11} />
        </label>
        <span
          style={{
            fontFamily: 'var(--k-font-mono)',
            fontSize: 11.5,
            color: 'var(--k-fg-3)',
            marginLeft: 2,
          }}
        >
          {c.toUpperCase()}
        </span>
      </div>
      <div className="k-brand-preview">
        <span className="k-brand-preview-l" style={{ color: c }}>
          PERSONAL PROPERTY INVENTORY
        </span>
        <span style={{ fontFamily: 'var(--k-font-display)', fontSize: 15 }}>
          Godfrey — Kitchen fire
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)' }}>
          How it appears on PDF exports and share links
        </span>
      </div>
    </div>
  )
}
