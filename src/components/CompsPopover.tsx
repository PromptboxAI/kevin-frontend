import { useEffect, useRef } from 'react'
import { fmtCompPrice } from '../lib/format'
import type { Comp } from '../lib/types'

/**
 * Google Shopping search URLs land on a results page, not a listing. Only a
 * direct merchant URL is worth an anchor -- a carrier clicking through to a
 * search box reads as sloppy substantiation. Keyed on the HOST, not on array
 * position, so a resolved comp[1] would still link correctly.
 */
function isDirectMerchant(link: string | undefined): boolean {
  if (!link) return false
  try {
    const host = new URL(link).hostname.replace(/^www\./, '')
    if (host === 'google.com' || host.endsWith('.google.com')) return false
    return true
  } catch {
    return false
  }
}

export default function CompsPopover({
  comps,
  onClose,
}: {
  comps: Comp[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div ref={ref} className="k-pop k-comps-pop">
      <div className="k-pop-hd">
        <span>Comparable listings</span>
      </div>
      <div className="k-insp-alts" style={{ padding: 6 }}>
        {comps.length === 0 ? (
          <span className="k-insp-hint">No comps on this line.</span>
        ) : (
          comps.map((comp, index) => {
            // Always show title: a like-kind comp is often a different brand,
            // and merchant + price alone implies the price was for THIS item.
            // A resale comp is used-market and is published RAW as the RCV --
            // no gross-up -- so it must not read as a new-replacement listing.
            // Unlabelled, an adjuster has no way to tell the two apart on a
            // document whose entire value is being defensible.
            const body = (
              <>
                <span className="k-comp-title">
                  {comp.title || 'Untitled listing'}
                  {comp.kind === 'resale' ? (
                    <span
                      className="k-mono"
                      title="Used / secondary market. Priced on the comparable-sale basis, not grossed up."
                      style={{
                        marginLeft: 6,
                        fontSize: 9.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--k-fg-4)',
                        border: '1px solid var(--k-line-2, var(--k-line))',
                        borderRadius: 3,
                        padding: '1px 4px',
                        verticalAlign: 'middle',
                      }}
                    >
                      Resale
                    </span>
                  ) : null}
                </span>
                <span className="k-comp-src">{comp.source || '—'}</span>
                <span className="k-comp-price k-mono">{fmtCompPrice(comp.price)}</span>
              </>
            )
            return isDirectMerchant(comp.link) ? (
              <a
                key={index}
                className="k-insp-alt"
                href={comp.link}
                target="_blank"
                rel="noreferrer noopener"
              >
                {body}
              </a>
            ) : (
              <div key={index} className="k-insp-alt k-insp-alt--flat" title="No direct listing URL">
                {body}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export { isDirectMerchant }
