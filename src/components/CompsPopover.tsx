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
            const body = (
              <>
                <span className="k-comp-title">{comp.title || 'Untitled listing'}</span>
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
