import { I, Icon } from './Icon'

/**
 * A PDF purchase receipt where a photo would be (FRONTEND.md §5e).
 *
 * A PDF has no thumbnail: its signed URL serves application/pdf, so an <img>
 * renders broken. Wherever a claim photo is drawn from a signed URL, check
 * `isPdfUrl` first and draw this instead.
 *
 * `link` opens the PDF in a new tab. Pass `link={false}` when the tile already
 * sits inside a button (a grid tile, a strip thumb) -- an <a> inside a
 * <button> is invalid, and the button's own action leads to a linked view.
 */
export default function ReceiptPdfTile({
  url,
  link = true,
  compact = false,
  style,
}: {
  url: string
  link?: boolean
  /** A strip thumb: just the icon. */
  compact?: boolean
  style?: React.CSSProperties
}) {
  const box: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compact ? 0 : 6,
    width: '100%',
    height: '100%',
    background: 'var(--k-bg)',
    color: 'var(--k-fg-3)',
    textDecoration: 'none',
    fontSize: 12.5,
    textAlign: 'center',
    ...style,
  }
  const body = compact ? (
    <Icon d={I.file} size={14} />
  ) : (
    <>
      <Icon d={I.file} size={26} />
      <strong>Receipt (PDF)</strong>
      {link ? <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Opens in a new tab ↗</span> : null}
    </>
  )
  if (!link) {
    return (
      <span style={box} aria-label="Receipt (PDF)" title="Receipt (PDF)">
        {body}
      </span>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" title="Open the receipt in a new tab" style={box}>
      {body}
    </a>
  )
}
