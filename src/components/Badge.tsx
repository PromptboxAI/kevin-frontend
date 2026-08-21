type Tone = 'ok' | 'warn' | 'quiet' | 'accent'

/** Matches .k-badge in kevin.css. */
export default function Badge({
  tone = 'quiet',
  dot = false,
  title,
  children,
}: {
  tone?: Tone
  dot?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <span className={`k-badge k-badge--${tone}`} title={title}>
      {dot ? <span className="k-badge-dot" /> : null}
      {children}
    </span>
  )
}
