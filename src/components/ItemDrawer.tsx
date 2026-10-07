import ItemHistory from './ItemHistory'
import ItemEvidence from './ItemEvidence'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Badge from './Badge'
import EditableCell from './EditableCell'
import { ApiError, api } from '../lib/api'
import { fmtCompPrice, fmtConfidence, fmtPct, fmtUSD } from '../lib/format'
import { citedCompIndex, isMerchantLink, sampleNote } from '../lib/comps-rules'
import { editDisplayLine, overrideItem, repriceItem } from '../lib/mutations'
import { useDepreciationRules } from '../lib/depreciation-rules'
import ClassOptionList from './ClassOptionList'
import { QUERY_MAX, composeQuery, isQueryValid, trimQuery } from '../lib/query'
import { CAPACITY_REASONS } from '../lib/types'
import type { ClaimItemDetail, ClaimSummary, Comp, ThumbnailsResponse } from '../lib/types'

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
  // Paused-pricing reasons, one per cause (FRONTEND.md line 551-552). Each says
  // the line was deferred, not judged, and that Retry deferred prices it --
  // pricing resumes by itself, but a deferred line does not.
  // quota_exhausted is the hourly ceiling or a spent monthly plan, and ALSO a
  // provider outage on rows written between backend 3c766bd and 0fe58d9, so
  // its copy cannot promise "within the hour".
  quota_exhausted:
    'Pricing was paused — a search limit was reached, or the provider was briefly unavailable. Nothing is wrong with this item; use Retry deferred once pricing resumes.',
  budget_exhausted:
    'Pricing was paused for today’s capacity, which resets at midnight UTC. Nothing is wrong with this item; use Retry deferred after it resets.',
  vendor_unavailable:
    'Pricing was paused during a search provider outage. Nothing is wrong with this item; use Retry deferred once the outage clears.',
  placeholder_row: 'A template line — enter the price.',
  not_priced: 'Created deliberately unpriced.',
  enqueue_failed: 'The valuation job could not be queued. A reprice retries it.',
}

/**
 * Rule 11: a RESALE price must be visibly labelled wherever comps are shown,
 * so nobody reads a used-market figure as a new-replacement one. "Comparable
 * sale" alone did not say that -- it is the contract's field value, not a
 * sentence an adjuster reads as "used". This is the only place any basis is
 * shown, so it has to carry the whole disclosure.
 */
const BASIS_LABEL: Record<string, string> = {
  retail: 'Retail comp (new)',
  like_kind_new: 'Like-kind substitute (nearest new equivalent)',
  comparable_sale: 'Comparable sale (resale market, not a new-replacement price)',
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

  /** The live class schedule -- never a retyped list. */
  const rules = useDepreciationRules()

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

  /**
   * The claim, only for its STATUS: holdback recovery is post-settlement and
   * stays hidden during the estimating pass. The id arrives on the item, so
   * this waits for it -- and it shares the worksheet's cache key, so in
   * practice it is a hit rather than a request.
   */
  const claim = useQuery({
    queryKey: ['claim', data?.claim_id],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(data!.claim_id)}`),
    enabled: !!data?.claim_id,
    staleTime: 60_000,
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

  /**
   * Keep the selected tile on screen. A nine-photo set scrolls, and selecting
   * a photo from the evidence list at the bottom can land on a tile that is
   * out of view -- the big image would change with nothing in the strip
   * appearing to move. `nearest` so it never yanks a strip that is already
   * showing the tile.
   */
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const tile = stripRef.current?.children[photoIndex]
    if (tile instanceof HTMLElement) {
      tile.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [photoIndex])
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

  /**
   * Take the price FROM a comp, and take its link with it.
   *
   * The engine picks one listing; when it picks the wrong one — a speaker
   * priced off a page of cleats — the adjuster could see the right listing
   * sitting in the panel and had no way to say "that one". Typing the number
   * in by hand worked, but left the line pointing at the listing it came from
   * being wrong about, or at nothing.
   *
   * Two calls because the API has two: the price is an override, the proof URL
   * is a display field.
   */
  /*
   * STOPGAP, and it costs the line something -- see BACKEND-PROMPTS ask 23.
   * There is no route to select a comp, so this hand-prices the line instead:
   * the basis becomes `manual` and the backend clears the comps, meaning the
   * adjuster gets ONE switch and then has no alternatives left to switch to.
   *
   * The link is only carried across when it is a real merchant URL. Only one
   * comp per line has one; the others hold a Google redirect, and recording
   * that as the adjuster's own `manual_source_url` would cite a page that
   * never shows the listing. Better no link than a false one.
   */
  const useComp = (comp: Comp) => {
    const price = Number(comp.price)
    if (!Number.isFinite(price) || price < 0) return
    const link = isMerchantLink(comp.link) ? (comp.link ?? null) : null
    override.mutate({ rcv: price })
    editLine.mutate({ manual_source_url: link })
    /*
     * SAY IT, do not just do it. Only one comp per line has its real merchant
     * URL resolved -- the rest carry a Google redirect that never lands on a
     * listing -- so taking a price from one of the others leaves the line with
     * no source link. Dropping it silently looks like the link was lost; the
     * adjuster needs to know the price moved and the proof did not, because on
     * a carrier-facing line that is the difference between substantiated and
     * asserted. The route that would carry the link across is ask 23.
     */
    setNotice(
      link
        ? null
        : 'Price taken from this listing. Its link could not come with it — only the listing the price originally came from has a resolved merchant URL, and the others point back at Google. Paste a link in Source if you need this line substantiated.',
    )
  }

  /**
   * A HAND-TYPED price clears the source link — but only when it is genuinely
   * a new number. The owner's rule, and it is the right one: if what you typed
   * happens to be a listing's price, that listing still substantiates it, and
   * silently dropping the link would cost the line its proof. If it matches
   * nothing on the page, the old link no longer describes the price and
   * keeping it would be a false citation.
   */
  const sourceForTypedPrice = (rcv: number): string | null => {
    const comps = data?.alternative_sources ?? []
    const i = citedCompIndex(rcv, comps)
    return i == null ? null : (comps[i]?.link ?? null)
  }
  const override = useMutation({
    mutationFn: (body: {
      quantity?: number
      rcv?: number
      age_years?: number
      category?: string
      // Sample-claim only -- see overrideItem. Ignored on a real claim.
    }) => overrideItem(rowId, body, data ?? undefined, claim.data?.tax_rate ?? null),
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
  /** Which listing the unit cost came from, when the payload proves it. */
  const cited = citedCompIndex(data?.rcv, data?.alternative_sources)
  /**
   * How many listings the price was chosen from. Inert until the backend
   * ships `comp_sample_size`; null today, and null is "not recorded".
   */
  const sample = sampleNote(data?.comp_sample_size, data?.alternative_sources?.length ?? 0)
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

                {/*
                  * A STRIP, not just arrows. Merging a wide shot with a model
                  * plate is the normal way to build one line, so "there is
                  * another photo" has to be visible rather than discoverable:
                  * a `1 / 2` between two chevrons is easy to read as a page
                  * counter for something else entirely, and people went
                  * looking in the evidence list at the bottom instead.
                  *
                  * The arrows stay for keyboard and for long sets, and the
                  * strip scrolls rather than shrinking the tiles -- a 9-photo
                  * set with 12px thumbnails would show nothing useful.
                  */}
                {photos.length > 1 ? (
                  <>
                    <div className="k-insp-photonav">
                      <button
                        type="button"
                        className="k-btn k-btn--ghost"
                        disabled={photoIndex === 0}
                        aria-label="Previous photo"
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
                        aria-label="Next photo"
                        onClick={() => setPhotoIndex(photoIndex + 1)}
                      >
                        ›
                      </button>
                    </div>

                    <div
                      ref={stripRef}
                      className="k-insp-strip"
                      role="tablist"
                      aria-label={`${photos.length} photos on this line`}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' && photoIndex > 0) {
                          e.preventDefault()
                          setPhotoIndex(photoIndex - 1)
                        }
                        if (e.key === 'ArrowRight' && photoIndex < photos.length - 1) {
                          e.preventDefault()
                          setPhotoIndex(photoIndex + 1)
                        }
                      }}
                    >
                      {photos.map((p, i) => {
                        const thumb = thumbFor(p.photo_id)
                        const on = i === photoIndex
                        return (
                          <button
                            key={p.photo_id}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            tabIndex={on ? 0 : -1}
                            className={`k-insp-thumb${on ? ' k-insp-thumb--on' : ''}`}
                            title={p.note ?? (p.is_primary ? 'Primary photo' : `Photo ${i + 1}`)}
                            onClick={() => setPhotoIndex(i)}
                          >
                            {thumb ? (
                              <img src={thumb} alt="" loading="lazy" decoding="async" />
                            ) : (
                              /* The strip keeps its shape while URLs mint, so
                                 the row does not reflow under the cursor. */
                              <span className="k-insp-thumb-skel" aria-hidden="true" />
                            )}
                            {p.is_primary ? <span className="k-insp-thumb-pin" /> : null}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="k-insp-body">
                {unpriced && data.manual_reason ? (
                  <div className={waiting ? 'k-lkq-note' : 'k-lkq-note k-lkq-note--warn'}>
                    <span className="k-lkq-note-l">
                      {waiting ? 'Pricing paused' : 'Needs your input'}
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
                      <ClassOptionList rules={rules.data} current={data.category} />
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
                      if (!Number.isFinite(rcv) || rcv < 0) return
                      override.mutate({ rcv })
                      // Keep the link when the number IS one of the listings;
                      // drop it when the price came from nowhere on this page.
                      const url = sourceForTypedPrice(rcv)
                      if (url !== (data.manual_source_url ?? null)) {
                        editLine.mutate({ manual_source_url: url })
                      }
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
                      {/*
                        * SAY WHAT THIS STRING IS. It is often a part number
                        * read off a box -- "BSD.SP.MR.NEO.4.CC.4O" -- which
                        * means nothing to the person reading it, and when the
                        * comps come back wrong that string is the reason.
                        * Without this line the field looks like a diagnostic
                        * to ignore rather than the one input that re-prices
                        * the line.
                        */}
                      <span className="k-insp-hint">
                        The exact text Kevin searched for these comps. If the comps below are for
                        the wrong thing, this is usually why — edit it and re-price.
                      </span>
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
                    <>
                      <div className="k-insp-alts">
                        {data.alternative_sources.map((comp, index) => (
                          <CompRow
                            key={index}
                            comp={comp}
                            preferred={index === 0}
                            cited={index === cited}
                            busy={repricing || override.isPending || editLine.isPending}
                            onUse={index === cited ? undefined : () => useComp(comp)}
                          />
                        ))}
                      </div>
                      {/* NAMES THE LISTING, does not restate the method. The
                          engine picks the middle price among ALL the comps it
                          found, and this panel shows only a few of them -- on
                          the sample's Hot Wheels line the unit cost is $11.00
                          beside displayed comps of $11.00, $8.99 and $7.99, so
                          "the middle one" would read as wrong against what is
                          on screen. The badge does that work instead.

                          Only when the arithmetic proves it. Since 2026-09-29
                          the engine prices at an actual listing -- the middle
                          one by price -- but lines priced before that keep a
                          median that matches no comp, and nothing in the
                          payload says which rule ran. A comp whose price IS
                          the unit cost is a fact about THIS line; the rule in
                          general is a claim we cannot make from here.
                          Suppressed on a hand-entered price, which has no
                          comps and carries the adjuster's own link. */}
                      {cited !== null && data.valuation_basis !== 'manual' ? (
                        <span className="k-insp-hint">
                          Unit cost is the price of a single listing — the one marked above — and
                          the Source Link points at it{sample ? `, ${sample}` : ''}.
                        </span>
                      ) : null}
                    </>
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

                {/* The audit trail. Lazy: nothing is fetched until asked, and
                    most rows are never asked about. */}
                <ItemEvidence
                  item={data}
                  claimStatus={claim.data?.status}
                  onShowPhoto={(photoId) => {
                    const i = photos.findIndex((p) => p.photo_id === photoId)
                    if (i >= 0) setPhotoIndex(i)
                  }}
                />
                <ItemHistory rowId={rowId} />
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
  cited,
  busy,
  onUse,
}: {
  comp: Comp
  /**
   * alternative_sources[0] is the PREFERRED SOURCE for the item's content
   * class. That is ALL it is -- array order is source preference and nothing
   * else.
   *
   * It used to also mean "the one comp with a real merchant link", and this
   * component linked index 0 because of it. That stopped being true on
   * 2026-09-24, when the backend moved the one resolution it pays for to the
   * comp nearest the RCV: display order deliberately did not change, so
   * nothing on screen showed that the link had moved. Linkability is now
   * decided by `isMerchantLink` reading the URL itself.
   *
   * Index 0 is also NOT necessarily the comp the price came from -- `cited`
   * marks that one, when the arithmetic proves it.
   */
  preferred: boolean
  /** This comp's price IS the unit cost, so it is the listing being cited. */
  cited?: boolean
  busy?: boolean
  /** Absent on the cited comp -- it is already the price. */
  onUse?: () => void
}) {
  const body = (
    <>
      <span className="k-comp-title">{comp.title || 'Untitled listing'}</span>
      <span className="k-comp-src">{comp.source || '—'}</span>
      <span className="k-comp-price k-mono">{fmtCompPrice(comp.price)}</span>
      {/* One badge, and the cited listing wins it: "this is where the number
          came from" is what an adjuster is looking for, and it outranks which
          source the class prefers. */}
      {cited ? (
        <Badge tone="ok">This is the unit cost</Badge>
      ) : preferred ? (
        <Badge tone="accent">Preferred source</Badge>
      ) : null}
    </>
  )

  /*
   * The row stays a LINK where it was one -- opening the listing is still the
   * first thing anyone does with a comp -- and "Use this price" sits beside it
   * rather than swallowing the row, so neither action is hidden behind the
   * other. Priceless comps get no button: there is nothing to take.
   */
  const use =
    onUse && Number.isFinite(Number(comp.price)) ? (
      <button
        type="button"
        className="k-btn k-btn--sm k-btn--ghost k-comp-use"
        disabled={busy}
        title="Price this line from this listing, and cite it as the source"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onUse()
        }}
      >
        Use this price
      </button>
    ) : null

  /* The comp that HOLDS a merchant URL gets the anchor, whichever it is.
     Keyed off the value rather than the position, so it stays right across
     both link rules and on lines priced under either. */
  if (isMerchantLink(comp.link)) {
    return (
      <div className="k-insp-alt-row">
        <a className="k-insp-alt" href={comp.link} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
        {use}
      </div>
    )
  }
  return (
    <div className="k-insp-alt-row">
      <div className="k-insp-alt k-insp-alt--flat">{body}</div>
      {use}
    </div>
  )
}
