import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Badge from './Badge'
import EditableCell from './EditableCell'
import { ApiError, api } from '../lib/api'
import { fmtCompPrice, fmtConfidence, fmtPct, fmtUSD } from '../lib/format'
import { editDisplayLine, overrideItem, repriceItem } from '../lib/mutations'
import { QUERY_MAX, composeQuery, isQueryValid, trimQuery } from '../lib/query'
import { CAPACITY_REASONS } from '../lib/types'
import type { ClaimItemDetail, Comp, ThumbnailsResponse } from '../lib/types'

/** Adjuster-facing copy for why a row is unpriced. */
const MANUAL_COPY: Record<string, string> = {
  manual_class: 'An appraisal class — never auto-priced.',
  luxury_brand: 'Names a luxury brand — routed for appraisal.',
  low_sample: 'Too few comparable listings to price confidently.',
  no_comps: 'No comparable listings found.',
  no_query: 'The photos told Kevin nothing it could search on. Describe the item and reprice.',
  no_description: 'No defensible description to price against.',
  // Kept DISTINCT from no_query on purpose: this line has a label, it just is
  // not one we will price from. "Tell us what it is" is the wrong ask when the
  // photos said nothing at all.
  vision_unavailable:
    'Kevin could not read these photos, and the label it does have is not one it will price from. Describe the item and reprice.',
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
  const [editingQuery, setEditingQuery] = useState(false)
  const [draftQuery, setDraftQuery] = useState('')

  useEffect(() => {
    setPhotoIndex(0)
    setEditingQuery(false)
  }, [rowId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** The live 24-class taxonomy -- never a retyped list. */
  const rules = useQuery({
    queryKey: ['depreciation-rules'],
    queryFn: () => api.get<{ categories: string[] }>('/v1/depreciation-rules'),
    staleTime: Infinity,
  })

  const { data, error, isPending } = useQuery({
    queryKey: ['claim-item', rowId],
    queryFn: () => api.get<ClaimItemDetail>(`/v1/claim_items/${rowId}`),
    // image_url is signed for ~5 minutes, so this response genuinely goes stale.
    staleTime: 4 * 60 * 1000,
    // Reprice returns 202 and the engine works asynchronously: poll while the
    // row sits in `processing`, then stop. Never poll a terminal row.
    refetchInterval: (q) =>
      (q.state.data as ClaimItemDetail | undefined)?.status === 'processing' ? 2000 : false,
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

  const queryClient = useQueryClient()
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['claim-item', rowId] })
    void queryClient.invalidateQueries({ queryKey: ['claim-items'] })
    void queryClient.invalidateQueries({ queryKey: ['claim'] })
  }

  /**
   * The panel is the PRIMARY editing surface for needs_manual rows, so every
   * identity field is editable here. Same routing as the grid: descriptive
   * fields through PATCH /v1/claim_items, money through …/override.
   */
  const editLine = useMutation({
    mutationFn: (body: Record<string, string | null>) => editDisplayLine(rowId, body),
    onSuccess: refresh,
  })
  const override = useMutation({
    mutationFn: (body: {
      quantity?: number
      rcv?: number
      age_years?: number
      category?: string
    }) => overrideItem(rowId, body),
    onSuccess: refresh,
  })

  /**
   * One atomic call: the identity corrections ride WITH the query, because the
   * pipeline reads make_mfr and description to decide whether a line was priced
   * off other manufacturers' listings. A PATCH-then-reprice is a race, and
   * losing it is silent -- the line prices fine but its provenance is wrong.
   */
  const reprice = useMutation({
    mutationFn: (body: {
      query: string
      category?: string
      make_mfr?: string
      model_number?: string
      description?: string
    }) => repriceItem(rowId, body),
    onSuccess: () => {
      setEditingQuery(false)
      refresh()
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : 'Reprice failed.'),
  })

  const repricing = data?.status === 'processing' || reprice.isPending

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
                    {/* Post-promote and adjuster-facing, so the machine's read
                        of the photos belongs here -- it is the starting point
                        for the description this line needs, and the reason the
                        adjuster does not have to open the photo to guess. */}
                    {data.suggested_description &&
                    data.suggested_description !== data.description ? (
                      <span
                        className="k-lkq-note-b"
                        style={{ marginTop: 6, color: 'var(--k-fg-3)' }}
                      >
                        Kevin read this as:{' '}
                        <strong style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>
                          {data.suggested_description}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="k-insp-field">
                  <label>Description</label>
                  <EditableCell
                    variant="panel"
                    value={data.description ?? ''}
                    placeholder="Describe the item…"
                    onCommit={(next) => editLine.mutate({ description: next || null })}
                  />
                </div>

                <div className="k-insp-grid2">
                  <EditField
                    label="Room / Area"
                    value={data.room_area ?? ''}
                    placeholder="Room / area…"
                    onCommit={(next) => editLine.mutate({ room_area: next || null })}
                  />
                  <div className="k-insp-field">
                    <label>Content class</label>
                    <select
                      className="k-insp-input"
                      value={data.category ?? ''}
                      /* Age rides along so the engine re-runs on the new class;
                         category alone is not an engine trigger. */
                      onChange={(e) =>
                        override.mutate({
                          category: e.target.value,
                          age_years: data.age_years ?? 0,
                        })
                      }
                    >
                      {data.category ? null : <option value="">—</option>}
                      {(rules.data?.categories ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <EditField
                    label="Make / Mfr"
                    value={data.make_mfr ?? ''}
                    placeholder="Make…"
                    onCommit={(next) => editLine.mutate({ make_mfr: next || null })}
                  />
                  <EditField
                    label="Model #"
                    value={data.model_number ?? ''}
                    placeholder="Model #"
                    mono
                    onCommit={(next) => editLine.mutate({ model_number: next || null })}
                  />
                  <EditField
                    label="Quantity"
                    value={String(data.quantity)}
                    placeholder="1"
                    numeric
                    onCommit={(next) => {
                      const quantity = parseInt(next, 10)
                      if (Number.isFinite(quantity) && quantity >= 1) override.mutate({ quantity })
                    }}
                  />
                  <EditField
                    label="Unit cost"
                    value={data.rcv === null ? '' : String(data.rcv)}
                    placeholder="Enter a price…"
                    numeric
                    money
                    onCommit={(next) => {
                      const rcv = Number(next)
                      if (Number.isFinite(rcv) && rcv >= 0) override.mutate({ rcv })
                    }}
                  />
                </div>

                <div className="k-insp-field">
                  <label>Age (yrs)</label>
                  <EditableCell
                    variant="panel"
                    value={data.age_years === null || data.age_years === 0 ? '' : String(data.age_years)}
                    placeholder={unpriced ? '' : 'Years'}
                    numeric
                    disabled={unpriced}
                    title={unpriced ? 'Unpriced — set a price before entering age' : undefined}
                    onCommit={(next) => {
                      const age = Number(next)
                      if (Number.isFinite(age) && age >= 0) override.mutate({ age_years: age })
                    }}
                  />
                </div>

                <div className="k-insp-field">
                  <label>Search query</label>

                  {editingQuery ? (
                    <>
                      <input
                        className="k-insp-input"
                        value={draftQuery}
                        autoFocus
                        disabled={repricing}
                        maxLength={QUERY_MAX}
                        onChange={(e) => setDraftQuery(e.target.value)}
                      />
                      <span className="k-insp-hint">
                        Kevin re-searches live comps from this exact text — nothing inferred.{' '}
                        {draftQuery.trim().length}/{QUERY_MAX}
                      </span>
                      <div className="k-insp-actions">
                        <button
                          type="button"
                          className="k-btn k-btn--ghost k-btn--sm"
                          disabled={repricing}
                          onClick={() => setEditingQuery(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="k-btn k-btn--sm"
                          disabled={repricing || !isQueryValid(draftQuery)}
                          onClick={() =>
                            reprice.mutate({
                              query: trimQuery(draftQuery),
                              make_mfr: data.make_mfr ?? undefined,
                              model_number: data.model_number ?? undefined,
                              description: data.description ?? undefined,
                              category: data.category ?? undefined,
                            })
                          }
                        >
                          {repricing ? 'Re-pricing…' : 'Re-price'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="k-insp-static">{data.query || '—'}</div>
                      <span className="k-insp-hint">
                        {data.confidence !== null
                          ? `Confidence ${fmtConfidence(data.confidence)}`
                          : 'No confidence recorded'}
                        {data.is_manually_queried ? ' · manually refined' : ''}
                      </span>
                      <div className="k-insp-actions">
                        <button
                          type="button"
                          className="k-btn k-btn--ghost k-btn--sm"
                          disabled={repricing}
                          onClick={() => {
                            // Seed from the identity fields, trimmed at a word
                            // boundary, and show the adjuster the exact text
                            // that will be searched.
                            setDraftQuery(
                              data.query?.trim() ||
                                composeQuery({
                                  make_mfr: data.make_mfr,
                                  model_number: data.model_number,
                                  description: data.description,
                                }),
                            )
                            setEditingQuery(true)
                          }}
                        >
                          Edit &amp; re-price
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {repricing ? (
                  <div className="k-reprice-status">
                    <span className="k-spinner" />
                    Re-running the pricing engine — price and comps update when it lands.
                  </div>
                ) : null}

                {notice ? <p className="k-error">{notice}</p> : null}

                {/* Internal pricing provenance. Quiet, never a warning, never exported. */}
                {data.substitution_note ? (
                  <div className="k-lkq-note">
                    <span className="k-lkq-note-l">Like-kind substitution</span>
                    <span className="k-lkq-note-b">{data.substitution_note}</span>
                  </div>
                ) : null}

                <div className={`k-insp-field${repricing ? ' k-cell--pending' : ''}`}>
                  <label>Comparable listings</label>
                  {data.alternative_sources?.length ? (
                    <div className="k-insp-alts">
                      {data.alternative_sources.map((comp, index) => (
                        <CompRow key={index} comp={comp} preferred={index === 0} />
                      ))}
                    </div>
                  ) : (
                    <span className="k-insp-hint">
                      No comps on this line{unpriced ? ' — it is unpriced.' : '.'}
                    </span>
                  )}
                </div>

                {/* Every figure below is the server's, read verbatim. */}
                <div className={`k-insp-totals${repricing ? ' k-cell--pending' : ''}`}>
                  <div>
                    <span>Unit cost (pre-tax)</span>
                    <span className="k-mono">{fmtUSD(data.rcv)}</span>
                  </div>
                  <div>
                    <span>Extended cost</span>
                    <span className="k-mono">{fmtUSD(data.ext_cost)}</span>
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

function EditField({
  label,
  value,
  mono,
  numeric,
  money,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  mono?: boolean
  numeric?: boolean
  money?: boolean
  placeholder?: string
  onCommit: (next: string) => void
}) {
  return (
    <div className="k-insp-field">
      <label>{label}</label>
      <EditableCell
        variant="panel"
        value={value}
        mono={mono}
        numeric={numeric}
        money={money}
        placeholder={placeholder}
        onCommit={onCommit}
      />
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
function CompRow({
  comp,
  preferred,
}: {
  comp: Comp
  /**
   * alternative_sources[0] is the PREFERRED SOURCE for the item's content
   * class -- not the source of the price. The price is the median of the
   * trimmed comp set and frequently matches no individual comp, so this must
   * never be labelled as backing it. Index 0 is also the only comp with a
   * resolved merchant URL.
   */
  preferred: boolean
}) {
  const body = (
    <>
      <span className="k-comp-title">{comp.title || 'Untitled listing'}</span>
      <span className="k-comp-src">{comp.source || '—'}</span>
      <span className="k-comp-price k-mono">{fmtCompPrice(comp.price)}</span>
      {preferred ? <Badge tone="accent">Preferred source</Badge> : null}
    </>
  )

  if (preferred && comp.link) {
    return (
      <a className="k-insp-alt" href={comp.link} target="_blank" rel="noreferrer noopener">
        {body}
      </a>
    )
  }
  return <div className="k-insp-alt k-insp-alt--flat">{body}</div>
}
