import { I, Icon } from './Icon'

/**
 * Ported from IntakeSelect in design/components/intake.jsx. The design carries
 * these styles inline (there is no k- class for the control), so they are
 * lifted verbatim rather than re-invented.
 *
 * `onAdd` turns the last option into an escape hatch -- picking it fires the
 * callback and snaps the value back, so "+ Add tax jurisdiction…" never sticks
 * as a selection.
 */
export default function IntakeSelect({
  label,
  options,
  value,
  onChange,
  onAdd,
  addLabel,
  hint,
  width = 240,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
  onAdd?: () => void
  addLabel?: string
  hint?: string
  width?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width }}>
      <label
        style={{
          fontSize: 11,
          color: 'var(--k-fg-3)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === '__add') {
              e.target.value = value
              onAdd?.()
              return
            }
            onChange(e.target.value)
          }}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '100%',
            padding: '8px 30px 8px 11px',
            background: 'var(--k-bg)',
            border: '1px solid var(--k-line)',
            borderRadius: 6,
            font: 'inherit',
            fontSize: 13,
            color: 'var(--k-fg)',
            cursor: 'pointer',
            outline: 0,
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {addLabel ? <option value="__add">{addLabel}</option> : null}
        </select>
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--k-fg-4)',
            display: 'flex',
          }}
        >
          <Icon d={I.chevdown} size={14} />
        </span>
      </div>
      {hint ? <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span> : null}
    </div>
  )
}
