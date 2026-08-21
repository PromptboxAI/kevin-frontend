import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Badge from './Badge'
import { ApiError, api } from '../lib/api'
import { extCost, fmtAge, fmtCompPrice, fmtConfidence, fmtPct, fmtUSD } from '../lib/format'
import { CAPACITY_REASONS } from '../lib/types'
import type { ClaimItemDetail, Comp, ThumbnailsResponse } from '../lib/types'

/** Adjuster-facing copy for why a row is unpriced. */
const MANUAL_COPY: Record<string, string> = {
  manual_class: 'An appraisal class — never auto-priced.',
  luxury_brand: 'Names a luxury brand — routed for appraisal.',
  low_sample: 'Too few comparable listings to price confidently.',
  no_comps: 'No comparable listings found.',
  no_query: 'The photos yielded no usable search signal.',
  no_description: 'No defensible description to price against.',
  vision_unavailable: 'We could not read these photos — describe the item and reprice.',
  low_confidence_high_value: 'We found a price, but this line needs your eyes.',
  valuation_error: 'The comp lookup failed. A reprice will usually fix it.',
  quota_exhausted: 'Waiting on pricing capacity — retry shortly.',
  budget_exhausted: 'Waiting on pricing capacity — retry shortly.',
  placeholder_row: 'A template line — enter the price.',
  not_priced: 'Created deliberately unpriced.',
  enqueue_failed: 'The valuation job could not be queued. A reprice retries it.',
}

const BASIS_LABEL: Record<string, string> = {
  retail: 'Retail comp',
  like_kind_new: 'Like-kind substitute',
  comparable_sale: 'Comparable sale',
  manual: 'Manual / appraisal',
}

export default function ItemDrawer({
  rowId,
  onClose,
  docked = false,
}: {
  rowId: number
  onClose: () => void
  docked?: boolean
}) {
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => setPhotoIndex(0), [rowId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data, error, isPending } = useQuery({
    queryKey: ['claim-item', rowId],
    queryFn: () => api.get<ClaimItemDetail>(`/v1/claim_items/${rowId}`),
    // image_url is signed for ~5 minutes, so this response genuinely goes stale.
    staleTime: 4 * 60 * 1000,
  })

  const photos = data?.photos ?? []
  const ids = photos.map((p) => p.photo_id)

  // photos[] carries no image_url by design -- thumbnails are a separate batch.
  const thumbs = useQuery({
    queryKey: ['thumbnails', ids],
    queryFn: () => api.get<ThumbnailsResponse>(`/v1/staging/photos/thumbnails?ids=${ids.join(',')}`),
    enabled: ids.length > 0,
    staleTime: 4 * 60 * 1000,
  })

  const thumbFor = (photoId: number) =>
    thumbs.data?.thumbnails.find((t) => t.id === photoId)?.image_url ?? null

  const current = photos[photoIndex]
  // photos[0] is always the same frame as image_url, so fall back to it.
  const imageSrc = current ? (thumbFor(current.photo_id) ?? data?.image_url) : data?.image_url

  const unpriced = data?.status === 'needs_manual'
  const waiting = Boolean(
    unpriced && data?.manual_reason && CAPACITY_REASONS.has(data.manual_reason),
  )

  return (
    <>
      {/* Docked, the panel is a column of the grid layout -- no scrim to dismiss. */}
      {docked ? null : <div className="k-drawer-scrim" onClick={onClose} />}
      <aside
        className={docked ? 'k-dock' : 'k-drawer'}
        role={docked ? 'complementary' : 'dialog'}
        aria-label="Item detail"
      >
        <div className="k-insp">
          <div className="k-insp-hd">
            <strong>{data?.description || `Item ${rowId}`}</strong>
            <button type="button" className="k-icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          {isPending ? <div className="k-insp-body">Loading…</div> : null}

          {error ? (
            <div className="k-insp-body">
              <p className="k-error">
                Could not load this item
                {error instanceof ApiError ? ` (HTTP ${error.status})` : ''}.
              </p>
            </div>
          ) : null}

          {data ? (
            <>
              <div className="k-insp-photo">
                {imageSrc ? (
                  <img className="k-insp-img" src={imageSrc} alt={data.description ?? 'Item'} />
                ) : (
                  <div className="k-insp-img k-insp-img--empty">No photo</div>
                )}

                {photos.length > 1 ? (
                  <div className="k-insp-photonav">
                    <button
                      type="button"
                      className="k-btn k-btn--ghost"
                      disabled={photoIndex === 0}
                      onClick={() => setPhotoIndex(photoIndex - 1)}
                    >
                      ‹
                    </button>
                    <span className="k-insp-hint">
                      {photoIndex + 1} / {photos.length}
                      {current?.is_primary ? ' · primary' : ''}
                      {current?.note ? ` · ${current.note}` : ''}
                    </span>
                    <button
                      type="button"
                      className="k-btn k-btn--ghost"
                      disabled={photoIndex >= photos.length - 1}
                      onClick={() => setPhotoIndex(photoIndex + 1)}
                    >
                      ›
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="k-insp-body">
                {unpriced && data.manual_reason ? (
                  <div className={waiting ? 'k-lkq-note' : 'k-lkq-note k-lkq-note--warn'}>
                    <span className="k-lkq-note-l">
                      {waiting ? 'Waiting on capacity' : 'Needs your input'}
                    </span>
                    <span className="k-lkq-note-b">
                      {MANUAL_COPY[data.manual_reason] ?? 'This line needs a manual price.'}
                    </span>
                  </div>
                ) : null}

                <div className="k-insp-grid2">
                  <Field label="Room / Area" value={data.room_area} />
                  <Field label="Content class" value={data.category} />
                  <Field label="Make / Mfr" value={data.make_mfr} />
                  <Field label="Model #" value={data.model_number} mono />
                  <Field label="Quantity" value={String(data.quantity)} mono />
                  <Field label="Age (yrs)" value={fmtAge(data.age_years)} mono />
                </div>

                <div className="k-insp-field">
                  <label>Search query</label>
                  <div className="k-insp-static">{data.query || '—'}</div>
                  <span className="k-insp-hint">
                    {data.confidence !== null
                      ? `Confidence ${fmtConfidence(data.confidence)}`
                      : 'No confidence recorded'}
                    {data.is_manually_queried ? ' · refined by an adjuster' : ''}
                  </span>
                </div>

                {/* Internal pricing provenance. Quiet, never a warning, never exported. */}
                {data.substitution_note ? (
                  <div className="k-lkq-note">
                    <span className="k-lkq-note-l">Like-kind substitution</span>
                    <span className="k-lkq-note-b">{data.substitution_note}</span>
                  </div>
                ) : null}

                <div className="k-insp-field">
                  <label>Comparable listings</label>
                  {data.alternative_sources?.length ? (
                    <div className="k-insp-alts">
                      {data.alternative_sources.map((comp, index) => (
                        <CompRow key={index} comp={comp} primary={index === 0} />
                      ))}
                    </div>
                  ) : (
                    <span className="k-insp-hint">
                      No comps on this line{unpriced ? ' — it is unpriced.' : '.'}
                    </span>
                  )}
                </div>

                {/* Every figure below is the server's, read verbatim. */}
                <div className="k-insp-totals">
                  <div>
                    <span>Unit cost (pre-tax)</span>
                    <span className="k-mono">{fmtUSD(data.rcv)}</span>
                  </div>
                  <div>
                    <span>Extended cost</span>
                    <span className="k-mono">{fmtUSD(extCost(data.rcv_total_incl, data.tax))}</span>
                  </div>
                  <div>
                    <span>Sales tax</span>
                    <span className="k-mono">{fmtUSD(data.tax)}</span>
                  </div>
                  <div>
                    <span>RCV + Tax</span>
                    <span className="k-mono">{fmtUSD(data.rcv_total_incl)}</span>
                  </div>
                  <div>
                    <span>
                      Depreciation
                      {data.depreciation_pct !== null ? ` · ${fmtPct(data.depreciation_pct)}` : ''}
                    </span>
                    {/* Depreciation is always >= 0, so never print a signed zero. */}
                    <span className="k-mono">
                      {data.depreciation_amount && data.depreciation_amount > 0
                        ? `−${fmtUSD(data.depreciation_amount)}`
                        : fmtUSD(data.depreciation_amount)}
                    </span>
                  </div>
                  <div className="k-insp-totals-acv">
                    <span>ACV</span>
                    <span className="k-mono">{fmtUSD(data.acv_total_incl)}</span>
                  </div>
                </div>

                <span className="k-insp-hint">
                  {[
                    data.valuation_basis ? `Basis: ${BASIS_LABEL[data.valuation_basis]}` : null,
                    data.depreciation_method
                      ? `Method: ${data.depreciation_method.replace('_', ' ')}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </>
  )
}

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="k-insp-field">
      <label>{label}</label>
      <div className={mono ? 'k-insp-static k-mono' : 'k-insp-static'}>{value || '—'}</div>
    </div>
  )
}

/**
 * Only comp[0] carries a resolved merchant link. Runners-up hold a Google
 * Shopping SEARCH url, so they render as plain text -- a carrier clicking
 * through to a results page reads as sloppy substantiation.
 *
 * Always show `title`: a like-kind comp is often a different brand, which is
 * correct methodology but misleading if we print only merchant + price.
 */
function CompRow({ comp, primary }: { comp: Comp; primary: boolean }) {
  const body = (
    <>
      <span className="k-comp-title">{comp.title || 'Untitled listing'}</span>
      <span className="k-comp-src">{comp.source || '—'}</span>
      <span className="k-comp-price k-mono">{fmtCompPrice(comp.price)}</span>
      {primary ? <Badge tone="accent">Primary</Badge> : null}
    </>
  )

  if (primary && comp.link) {
    return (
      <a className="k-insp-alt" href={comp.link} target="_blank" rel="noreferrer noopener">
        {body}
      </a>
    )
  }
  return <div className="k-insp-alt k-insp-alt--flat">{body}</div>
}
