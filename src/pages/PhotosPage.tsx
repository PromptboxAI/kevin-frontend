import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PendingStagingAlert from '../components/PendingStagingAlert'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimMissing from '../components/ClaimMissing'
import ClaimTabs from '../components/ClaimTabs'
import { I, Icon } from '../components/Icon'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import { detachItemPhotos } from '../lib/evidence'
import { fmtConfidence, fmtUSD } from '../lib/format'
import { getClaimPhotos } from '../lib/photos'
import { numberRows } from '../lib/rows'
import {
  bucketOf,
  framesPerItem,
  indexItems,
  itemForPhoto,
  roomBuckets,
  stateFacets,
} from '../lib/photo-rules'
import type { ClaimPhoto, PhotoBucket } from '../lib/photo-rules'
import { useThumb } from '../lib/thumbnails'
import type {
  ClaimItem,
  ClaimItemDetail,
  ClaimItemListResponse,
  ClaimSummary,
} from '../lib/types'

/**
 * Screen 16 -- every photo on the claim, and what each one produced.
 *
 * Ported from `design/components/claim-photos.jsx`. The layout, class names and
 * three-pane anatomy are lifted verbatim; what changed is the DATA, because the
 * prototype's photo objects carried fields this API does not have. Each
 * deviation is marked where it occurs, per the porting rule.
 */

const PAGE = 36

export default function PhotosPage() {
  const { claimId = '' } = useParams()
  const navigate = useNavigate()

  const { data: claim, error: claimError } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
    retry: retryUnlessMissing,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['claim-photos', claimId],
    queryFn: () => getClaimPhotos(claimId),
    enabled: !!claimId,
  })

  /**
   * The items, purely to caption the photos.
   *
   * The photo payload carries an `item_id` and nothing else about the line --
   * no description, no price, no class. Joining here is what turns "photo 3886"
   * into "Sonos Arc soundbar · $402.61". One page-sized fetch, reusing the
   * worksheet's own cache key so moving between the two costs nothing.
   */
  const { data: itemsPage } = useQuery({
    queryKey: ['claim-items-flat', claimId],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=500`,
      ),
    enabled: !!claimId,
  })

  const photosRaw = useMemo(() => data?.photos ?? [], [data])
  const items = useMemo(() => itemsPage?.items ?? [], [itemsPage])
  const byId = useMemo(() => indexItems(items), [items])
  /**
   * The worksheet's own line numbers (numberRows), so an unidentified item is
   * "Line 40" here exactly when it is #40 there. Only when every item came
   * back: numbering a partial page would give the wrong numbers.
   */
  /**
   * IN WORKSHEET ORDER. The API returns photos in its own order, which matched
   * neither the worksheet nor the export, so the same claim read three
   * different ways depending on which screen you were on and an adjuster could
   * not check one against another.
   *
   * Sorted by the line each photo backs, then by photo id so the frames of one
   * merged item stay in the order they were shot. Photos backing no line --
   * still in staging, or excluded -- collect at the end rather than
   * interleaving: they have no place in a numbered walk-through, and burying
   * them mid-grid is how they get missed.
   *
   * Declared AFTER lineNos below in source order would be a use-before-define,
   * so it reads the map lazily inside the memo.
   */
  const lineNos = useMemo(
    () =>
      (itemsPage?.count ?? 0) <= items.length
        ? new Map(numberRows(items).map((r) => [r.id, r.lineNo]))
        : new Map<number, number>(),
    [items, itemsPage?.count],
  )

  const photos = useMemo(() => {
    const key = (p: ClaimPhoto): number =>
      p.item_id == null ? Number.POSITIVE_INFINITY : (lineNos.get(p.item_id) ?? Number.POSITIVE_INFINITY)
    return [...photosRaw].sort((a, b) => {
      const ka = key(a)
      const kb = key(b)
      if (ka !== kb) return ka - kb
      return a.photo_id - b.photo_id
    })
  }, [photosRaw, lineNos])

  const frames = useMemo(() => framesPerItem(photos), [photos])

  const facets = useMemo(() => stateFacets(photos), [photos])
  const rooms = useMemo(() => roomBuckets(photos), [photos])

  const [state, setState] = useState<PhotoBucket | null>(null)
  const [room, setRoom] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState<number | null>(null)
  const [full, setFull] = useState(false)
  const [shown, setShown] = useState(PAGE)

  /**
   * Reset the window when the filter changes.
   *
   * Adjusted during render rather than in an effect: an effect would paint the
   * new result set with the OLD window first, so narrowing a filter briefly
   * shows more tiles than match it.
   */
  const filterKey = `${state ?? ''}|${room ?? ''}|${q}`
  const [prevFilter, setPrevFilter] = useState(filterKey)
  if (prevFilter !== filterKey) {
    setPrevFilter(filterKey)
    setShown(PAGE)
  }

  /**
   * Something is always in the detail panel.
   *
   * Its 360px column is reserved by the grid whether or not it has content, so
   * an unfocused gallery renders a quarter of the screen as blank paper. The
   * design opens on a focused photo for the same reason. Adjusted during
   * render, and only until the adjuster picks one themselves.
   */
  if (focused == null && photos.length > 0) setFocused(photos[0].photo_id)

  const visible = useMemo(() => {
    let out = photos
    if (state) out = out.filter((p) => bucketOf(p) === state)
    if (room) out = out.filter((p) => p.room === room)
    const needle = q.trim().toLowerCase()
    if (needle) {
      out = out.filter((p) => {
        const it = itemForPhoto(p, byId)
        return [
          it?.description,
          it?.suggested_description,
          it?.make_mfr,
          it?.model_number,
          it?.category,
          p.room,
          p.note,
          `photo ${p.photo_id}`,
        ]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(needle))
      })
    }
    return out
  }, [photos, state, room, q, byId])

  const focus = focused == null ? null : (photos.find((p) => p.photo_id === focused) ?? null)
  const focusItem = focus ? itemForPhoto(focus, byId) : null

  // Lazy window: extend when the sentinel scrolls in.
  const sentinel = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el || shown >= visible.length) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShown((n) => Math.min(n + PAGE, visible.length))
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown, visible.length])

  const heading = state
    ? (facets.find((f) => f.key === state)?.label ?? 'Photos')
    : room
      ? room
      : 'All photos'

  if (claimError instanceof ApiError && claimError.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  return (
    <div className="k-photos">
      <AppHeader
        actions={
          <Link className="k-btn" to={`/claims/${claimId}`}>
            Open worksheet →
          </Link>
        }
      />

      <ClaimTabs
        active="Photos"
        claimId={claimId}
        itemCount={claim?.item_count}
        photoCount={claim?.photo_count}
      />

      {/* Photos waiting in Group & stage: the way back, said plainly. */}
      <PendingStagingAlert claimId={claimId} className="k-alert--banner" />

      <div className="k-photos-body">
        <aside className="k-photos-side">
          <div style={{ padding: '16px 16px 8px' }}>
            <div className="k-photos-side-h">Where it sits</div>
            {/* The design's facets (matched / unmatched / low confidence /
                scene / duplicate) are not fields on this payload -- see
                stateFacets(). These are the three states the API derives. */}
            {facets.map((f) => (
              <button
                key={f.key}
                type="button"
                title={f.blurb}
                onClick={() => setState(state === f.key ? null : f.key)}
                className={'k-photos-filter' + (state === f.key ? ' k-photos-filter--on' : '')}
              >
                <span style={{ flex: 1, fontSize: 12.5, color: 'inherit' }}>{f.label}</span>
                <Badge tone={f.key === 'attached' ? 'ok' : 'quiet'}>{f.n}</Badge>
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--k-line)' }}>
            <div className="k-photos-side-h">Room</div>
            {rooms ? (
              <>
                <button
                  type="button"
                  onClick={() => setRoom(null)}
                  className={'k-photos-filter' + (room === null ? ' k-photos-filter--on' : '')}
                >
                  <span style={{ flex: 1, fontSize: 12.5, color: 'inherit' }}>All</span>
                  <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                    {photos.length}
                  </span>
                </button>
                {rooms.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => setRoom(room === r.name ? null : r.name)}
                    className={'k-photos-filter' + (room === r.name ? ' k-photos-filter--on' : '')}
                  >
                    <span style={{ flex: 1, fontSize: 12.5, color: 'inherit' }}>{r.name}</span>
                    <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                      {r.n}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              /* Rooms are tagged per upload BATCH. Nothing sends that field
                 yet, so every photo comes back room: null -- and a sidebar of
                 one bucket called "—" is furniture pretending to be a filter. */
              <p
                style={{
                  fontSize: 11.5,
                  color: 'var(--k-fg-4)',
                  lineHeight: 1.5,
                  margin: '4px 0 0',
                }}
              >
                No rooms on this claim. Rooms are set per batch when photos are
                uploaded — tag the next drop and they will filter here.
              </p>
            )}
          </div>
        </aside>

        <div className="k-photos-main">
          <div className="k-photos-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontWeight: 400,
                  fontSize: 22,
                  letterSpacing: '-0.018em',
                  margin: 0,
                }}
              >
                {heading}
              </h2>
              <Badge tone="quiet">
                {visible.length} {visible.length === 1 ? 'photo' : 'photos'}
              </Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="k-search" style={{ minWidth: 220 }}>
                <Icon d={I.search} size={12} />
                <input
                  placeholder="Search by item, make, model, room…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: 2,
                  background: 'var(--k-bg-2)',
                  borderRadius: 6,
                }}
              >
                <button type="button" className="k-seg k-seg--on">
                  Grid
                </button>
                {/* Kept disabled, as designed: the photo payload carries no
                    capture timestamp and no GPS, so neither view has a source. */}
                <button
                  type="button"
                  className="k-seg"
                  disabled
                  title="Needs a capture timestamp — the photo payload carries none"
                >
                  Timeline
                </button>
                <button
                  type="button"
                  className="k-seg"
                  disabled
                  title="Needs GPS on the photo — most captures do not carry it"
                >
                  Map
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-danger)' }}>
              Could not load photos. {(error as Error).message}
            </p>
          ) : isLoading ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading photos…</p>
          ) : visible.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>
              {photos.length === 0
                ? 'No photos on this claim yet.'
                : 'No photos match that filter.'}
            </p>
          ) : (
            <div className="k-photos-grid">
              {visible.slice(0, shown).map((p) => (
                <PhotoTile
                  key={p.photo_id}
                  photo={p}
                  item={itemForPhoto(p, byId)}
                  lineNo={p.item_id == null ? undefined : lineNos.get(p.item_id)}
                  frames={p.item_id == null ? 0 : (frames.get(p.item_id) ?? 0)}
                  on={p.photo_id === focused}
                  onOpen={() => setFocused(p.photo_id)}
                />
              ))}
            </div>
          )}

          {shown < visible.length ? (
            <div ref={sentinel} className="k-photos-more">
              <span className="k-spinner" /> {shown} of {visible.length}
            </div>
          ) : null}
        </div>

        {focus ? (
          <PhotoDetail
            photo={focus}
            item={focusItem}
            lineNo={focus.item_id == null ? undefined : lineNos.get(focus.item_id)}
            /* Every frame of the same line, so the panel can page through a
               merged set instead of naming one it cannot reach. */
            siblings={
              focus.item_id == null
                ? [focus]
                : photos.filter((p) => p.item_id === focus.item_id)
            }
            onSelectPhoto={(id) => setFocused(id)}
            claimId={claimId}
            onFull={() => setFull(true)}
            onClose={() => setFocused(null)}
            onWorksheet={() => navigate(`/claims/${claimId}?item=${focus.item_id}`)}
          />
        ) : null}
      </div>

      {full && focus ? (
        <FullView
          photo={focus}
          list={visible}
          onGo={(id) => setFocused(id)}
          onClose={() => setFull(false)}
        />
      ) : null}
    </div>
  )
}

// --------------------------------------------------------------------------

/**
 * What an item is called on this screen: the description on the line, which
 * is Vision's `suggested_description` copied in at promote (and any edit the
 * adjuster has made since) -- so a scraped or photographed item reads by name.
 *
 * Two fallbacks the old `??` chain got wrong. A `needs_manual` row can carry
 * an EMPTY-STRING description (rule 2b), which `??` does not skip, so the
 * title rendered blank. And the last resort was `Line ${item.id}`, the
 * database row id -- "Line 3886" for what the worksheet calls #40. It now uses
 * the worksheet's own line number, and says "Not identified" without one.
 */
function itemTitle(item: ClaimItem, lineNo?: number): string {
  const name = item.description?.trim() || item.suggested_description?.trim()
  if (name) return name
  return lineNo ? `Line ${lineNo} · not identified` : 'Not identified'
}

function PhotoTile({
  photo,
  item,
  lineNo,
  frames,
  on,
  onOpen,
}: {
  photo: ClaimPhoto
  item: ClaimItem | null
  lineNo?: number
  frames: number
  on: boolean
  onOpen: () => void
}) {
  const { ref, src, onError } = useThumb<HTMLButtonElement>(photo.photo_id)

  const bucket = bucketOf(photo)
  const caption = item
    ? itemTitle(item, lineNo)
    : bucket === 'pending'
      ? 'Waiting in staging — not processed yet'
      : 'Backs no line item'

  return (
    <button ref={ref} type="button" onClick={onOpen} className={`k-photo ${on ? 'k-photo--on' : ''}`}>
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
        {src ? (
          <img
            src={src}
            onError={onError}
            /* The caption is this tile's STATUS ("Backs no line item"), which
               as alt text described the tile rather than the picture -- and on
               a broken image it was all you saw. A thumbnail beside its own
               caption adds nothing for a screen reader. */
            alt=""
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{ width: '100%', aspectRatio: '1', background: 'var(--k-bg-3)' }}
            aria-hidden
          />
        )}
        <div className="k-photo-tl">
          {/* Amber is reserved for special limits (rule 6), and this payload
              carries no such flag -- so nothing here is amber. */}
          {frames > 1 ? <Badge tone="quiet">{frames} frames</Badge> : null}
          {bucket === 'pending' ? <Badge tone="quiet">Staging</Badge> : null}
        </div>
        <div className="k-photo-bl">
          <span
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 10.5,
              fontFamily: 'var(--k-font-mono)',
            }}
          >
            {/* Rule 1: a photo backs at most one item. Never a count above 1. */}
            {photo.item_id != null ? '1 item' : '—'}
          </span>
        </div>
      </div>
      <div style={{ padding: '6px 4px 0' }}>
        <div
          className="k-mono"
          style={{
            fontSize: 11,
            color: 'var(--k-fg-4)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {/*
            * LEAD WITH THE LINE NUMBER. This said "Photo 6237", a database id
            * that appears on no other screen and matches nothing the adjuster
            * can look up -- the payload carries no filename, so the id was
            * reached for as the only identifier available. But a photo's
            * identity here is the line it backs, which IS on the worksheet and
            * IS on the export. The id stays, in brackets, because support asks
            * for it; it just stops being the headline.
            */}
          {photo.room ? `${photo.room} · ` : ''}
          {lineNo ? `Line ${String(lineNo).padStart(4, '0')}` : `Photo ${photo.photo_id}`}
        </div>
        <div
          style={{
            fontSize: 12,
            color: item ? 'var(--k-fg)' : 'var(--k-fg-4)',
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {caption}
        </div>
      </div>
    </button>
  )
}

// --------------------------------------------------------------------------

/**
 * The photo panel, rebuilt around what an adjuster actually does here
 * (owner, 2026-10-06): see the picture, see which LINE it is, page through the
 * other frames of a merged set, jump to that line on the worksheet, save the
 * file, and close the thing.
 *
 * What came out, and why: a "State" row reading "Backs a line", and a "Batch"
 * row reading "Session 86". Both are our vocabulary for our own plumbing. The
 * state is already said in words at the top of the panel, and the session id
 * identifies an upload batch an adjuster never refers to. The owner's verdict
 * was blunt and right -- "not what a front end person needs to see".
 */
function PhotoDetail({
  photo,
  item,
  lineNo,
  siblings,
  onSelectPhoto,
  claimId,
  onFull,
  onClose,
  onWorksheet,
}: {
  photo: ClaimPhoto
  item: ClaimItem | null
  lineNo?: number
  /** Every photo backing the same line, in order. At least this one. */
  siblings: ClaimPhoto[]
  onSelectPhoto: (photoId: number) => void
  claimId: string
  onFull: () => void
  onClose: () => void
  onWorksheet: () => void
}) {
  const queryClient = useQueryClient()
  const { ref, src, onError } = useThumb<HTMLDivElement>(photo.photo_id)
  const [notice, setNotice] = useState<string | null>(null)
  const bucket = bucketOf(photo)

  /**
   * The only removal this screen offers.
   *
   * There is no endpoint that deletes a promoted photo, and that is deliberate:
   * in a property claim evidence is excluded from the worksheet, never
   * destroyed (rule 22). Detaching leaves the capture on the claim, where it
   * comes back as `unattached` and can be pointed at another line. The design's
   * "Delete photo" button and its "deleting is permanent" copy would describe
   * something the API does not do.
   */
  const [saving, setSaving] = useState(false)

  /**
   * Fetch the signed URL and hand the bytes to the browser.
   *
   * Through fetch rather than an <a download>: the URL is cross-origin signed
   * storage, where the download attribute is ignored and the browser navigates
   * to the image instead -- which on this screen means losing the claim.
   */
  const savePhoto = async () => {
    if (!src) return
    setSaving(true)
    try {
      const res = await fetch(src)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = lineNo
        ? `line-${String(lineNo).padStart(4, '0')}-photo-${photo.photo_id}.jpg`
        : `photo-${photo.photo_id}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setNotice('Could not save that photo — try opening it larger and saving from there.')
    } finally {
      setSaving(false)
    }
  }

  const unlink = useMutation({
    mutationFn: () => detachItemPhotos(item!.id, [photo.photo_id]),
    onSuccess: () => {
      setNotice('Unlinked. The photo stays on the claim, backing nothing.')
      void queryClient.invalidateQueries({ queryKey: ['claim-photos', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claim-items-flat', claimId] })
    },
    onError: () => setNotice('Could not unlink that photo.'),
  })

  return (
    <aside className="k-photos-detail">
      <div className="k-exp-det-hd">
        <div style={{ minWidth: 0 }}>
          {/* The LINE leads. The photo id is support's handle, not the
              adjuster's, and it was the first thing on the panel. */}
          <div className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
            {lineNo ? `Line ${String(lineNo).padStart(4, '0')}` : `Photo ${photo.photo_id}`}
            {photo.room ? ` · ${photo.room}` : ''}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
            {item
              ? itemTitle(item, lineNo)
              : bucket === 'pending'
                ? 'Not processed yet'
                : 'Backs no line item'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            type="button"
            className="k-icon-btn"
            onClick={onFull}
            title="Open larger"
            disabled={!src}
          >
            <Icon d={I.expand} size={13} />
          </button>
          {/* It could not be dismissed at all. */}
          <button type="button" className="k-icon-btn" onClick={onClose} title="Close" aria-label="Close">
            <Icon d={I.close} size={13} />
          </button>
        </div>
      </div>

      <div ref={ref} style={{ padding: 14, borderBottom: '1px solid var(--k-line)' }}>
        {src ? (
          <img
            src={src}
            onError={onError}
            alt=""
            style={{ width: '100%', borderRadius: 8, display: 'block', background: 'var(--k-bg-3)' }}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 8, background: 'var(--k-bg-3)' }} />
        )}

        {/* The merged frames, reachable. This said "Frame 1 of 2" and gave no
            way to see frame 2 -- the exact thing merging two photos is for. */}
        {siblings.length > 1 ? (
          <div className="k-insp-strip" style={{ marginTop: 10 }}>
            {siblings.map((sib, i) => (
              <PanelThumb
                key={sib.photo_id}
                photo={sib}
                n={i + 1}
                on={sib.photo_id === photo.photo_id}
                onPick={() => onSelectPhoto(sib.photo_id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* GONE: "State: Backs a line" restated the sentence directly above it,
            and "Batch: Session 86" named an upload batch nobody refers to.
            Confidence stays -- it is about the identification, which is a thing
            an adjuster acts on. */}
        {item?.confidence != null || siblings.length > 1 ? (
          <div className="k-exp-meta">
            {siblings.length > 1 ? (
              <div>
                <span>Frame</span>
                <span className="k-mono">
                  {siblings.findIndex((p) => p.photo_id === photo.photo_id) + 1} of{' '}
                  {siblings.length}
                </span>
              </div>
            ) : null}
            {item?.confidence != null ? (
              <div>
                <span>Confidence</span>
                <span style={{ fontSize: 11.5 }}>{fmtConfidence(item.confidence)}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {photo.note ? (
          <div>
            <div className="k-photos-side-h">Note from capture</div>
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0 }}>
              {photo.note}
            </p>
          </div>
        ) : null}

        <div>
          <div className="k-photos-side-h">
            {item ? 'Replacement cost value' : 'No item priced from this photo'}
          </div>

          {item ? (
            <>
              <div className="k-hv-row" style={{ borderBottom: '1px solid var(--k-line)' }}>
                <span style={{ flex: 1, fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                  {item.make_mfr ?? 'Line'} {item.model_number ?? ''}
                </span>
                <span className="k-mono" style={{ fontSize: 14, fontWeight: 600 }}>
                  {/* needs_manual lines are unpriced, not broken (rule 12). */}
                  {item.rcv_total_incl == null ? '—' : fmtUSD(item.rcv_total_incl)}
                </span>
              </div>
              <button
                type="button"
                className="k-link"
                style={{ marginTop: 10, display: 'inline-flex' }}
                onClick={onWorksheet}
                title="Open this item on the worksheet to edit it"
              >
                Go to worksheet <Icon d={I.chevright} size={11} />
              </button>
            </>
          ) : bucket === 'pending' ? (
            <div style={{ fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
              Uploaded but never processed, so it has produced no line item and
              adds nothing to the claim total.
              <div style={{ marginTop: 8 }}>
                <Link className="k-link" to={`/claims/${claimId}/staging`}>
                  Open staging <Icon d={I.chevright} size={11} />
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
              On the claim, backing nothing — either unlinked from a line, or its
              set produced no item. Nothing was destroyed: point it at a line
              from that row’s evidence panel whenever you need it.
            </div>
          )}
        </div>

        {notice ? (
          <span style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>{notice}</span>
        ) : null}
      </div>

      <div className="k-exp-det-foot" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {item ? (
          <button type="button" className="k-btn" onClick={onWorksheet}>
            Open line {lineNo ? String(lineNo).padStart(4, '0') : ''}
          </button>
        ) : null}

        {/* SAVE. The panel could show you a photo and gave you no way to keep
            it; an adjuster emailing one shot to a carrier had to screenshot it. */}
        <button
          type="button"
          className="k-btn k-btn--ghost"
          disabled={!src || saving}
          title="Download this photo"
          onClick={() => void savePhoto()}
        >
          {saving ? 'Saving…' : 'Save photo'}
        </button>

        {item ? (
          /*
           * "Unlink from this line" named a relationship, not an outcome, and
           * did not say which line. There is no endpoint that DELETES a
           * promoted photo and that is deliberate -- in a property claim
           * evidence is excluded from the worksheet, never destroyed (rule 22)
           * -- so the honest label is what it does: takes the photo off this
           * line, leaves it on the claim.
           */
          <button
            type="button"
            className="k-btn k-btn--ghost k-btn--danger"
            disabled={unlink.isPending}
            title="The photo stays on the claim and can be pointed at another line later. Nothing is deleted."
            onClick={() => unlink.mutate()}
          >
            {unlink.isPending
              ? 'Removing…'
              : `Remove from line ${lineNo ? String(lineNo).padStart(4, '0') : ''}`}
          </button>
        ) : null}
      </div>
    </aside>
  )
}

/** One frame in the panel's strip. Its own component so each tile can observe
 *  and sign its own thumbnail. */
function PanelThumb({
  photo,
  n,
  on,
  onPick,
}: {
  photo: ClaimPhoto
  n: number
  on: boolean
  onPick: () => void
}) {
  const { ref, src, onError } = useThumb<HTMLButtonElement>(photo.photo_id)
  return (
    <button
      ref={ref}
      type="button"
      className={`k-insp-thumb${on ? ' k-insp-thumb--on' : ''}`}
      title={`Frame ${n}`}
      aria-label={`Show frame ${n}`}
      onClick={onPick}
    >
      {src ? (
        <img src={src} onError={onError} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="k-insp-thumb-skel" aria-hidden="true" />
      )}
    </button>
  )
}

// --------------------------------------------------------------------------

function FullView({
  photo,
  list,
  onGo,
  onClose,
}: {
  photo: ClaimPhoto
  list: ClaimPhoto[]
  onGo: (id: number) => void
  onClose: () => void
}) {
  const { ref, src, onError } = useThumb<HTMLDivElement>(photo.photo_id)
  const i = list.findIndex((p) => p.photo_id === photo.photo_id)

  /**
   * The ORIGINAL, when one is reachable.
   *
   * The thumbnails endpoint serves a 600x450 derivative -- fine in a grid, not
   * fine on the screen an adjuster uses to read a model number off a plate.
   * The 4000x3000 capture does exist, but the only route to it is the item
   * detail's `image_url`, which is that line's PRIMARY photo. So: fetch the
   * detail, use the original when this photo is the primary, and say so
   * plainly when it is not, rather than captioning a thumbnail "full size".
   */
  const { data: detail } = useQuery({
    queryKey: ['claim-item', photo.item_id],
    queryFn: () => api.get<ClaimItemDetail>(`/v1/claim_items/${photo.item_id}`),
    enabled: photo.item_id != null,
  })
  const isPrimary =
    detail?.photos?.find((p) => p.photo_id === photo.photo_id)?.is_primary ?? false
  const original = isPrimary ? (detail?.image_url ?? null) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && list[i - 1]) onGo(list[i - 1].photo_id)
      if (e.key === 'ArrowRight' && list[i + 1]) onGo(list[i + 1].photo_id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, list, onGo, onClose])

  return (
    <div className="k-photo-full" onClick={onClose}>
      <div className="k-photo-full-in" onClick={(e) => e.stopPropagation()}>
        <div className="k-photo-full-hd">
          <span className="k-mono" style={{ fontSize: 12 }}>
            Photo {photo.photo_id}
          </span>
          {!original ? (
            <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
              {photo.item_id == null
                ? 'Preview — no full-size copy for a photo that backs no line'
                : 'Preview — the original is only served for a line’s main photo'}
            </span>
          ) : null}
          <div style={{ flex: 1 }} />
          <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
            {i + 1} of {list.length}
          </span>
          <button
            type="button"
            className="k-icon-btn"
            onClick={() => list[i - 1] && onGo(list[i - 1].photo_id)}
            disabled={i <= 0}
            title="Previous"
          >
            <Icon d={I.chevleft} size={14} />
          </button>
          <button
            type="button"
            className="k-icon-btn"
            onClick={() => list[i + 1] && onGo(list[i + 1].photo_id)}
            disabled={i >= list.length - 1}
            title="Next"
          >
            <Icon d={I.chevright} size={14} />
          </button>
          <button type="button" className="k-icon-btn" onClick={onClose} title="Close">
            <Icon d={I.close} size={14} />
          </button>
        </div>
        <div ref={ref} style={{ minHeight: 0, display: 'grid' }}>
          {/* `original` is the item detail's own signed URL and expires the
              same way, so a failure here re-signs the thumbnail and falls back
              to it rather than leaving the lightbox blank. */}
          {original ?? src ? (
            <img
              src={original ?? src ?? undefined}
              onError={onError}
              alt=""
              className="k-photo-full-img"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
