/** Ported from IntakeField in design/components/intake.jsx. */
export default function IntakeField({
  label,
  value,
  onChange,
  mono = false,
  placeholder,
  suffix,
  hint,
  width = 240,
  type = 'text',
  invalid = false,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  mono?: boolean
  placeholder?: string
  suffix?: string
  hint?: string
  width?: number | string
  type?: string
  invalid?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width }}>
      <label className="k-ifield-label">{label}</label>
      <div className="k-ifield" style={invalid ? { borderColor: 'var(--k-danger)' } : undefined}>
        <input
          value={value}
          type={type}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: 0,
            outline: 0,
            background: 'transparent',
            flex: 1,
            font: 'inherit',
            fontSize: 13,
            fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
            fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
            color: 'var(--k-fg)',
            minWidth: 0,
          }}
        />
        {suffix ? <span className="k-ifield-suffix">{suffix}</span> : null}
      </div>
      {hint ? <span className="k-ifield-hint">{hint}</span> : null}
    </div>
  )
}
