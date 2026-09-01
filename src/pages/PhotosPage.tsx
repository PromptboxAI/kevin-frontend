import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimTabs from '../components/ClaimTabs'
import { I, Icon } from '../components/Icon'
import { api } from '../lib/api'
import { detachItemPhotos } from '../lib/evidence'
import { fmtConfidence, fmtUSD } from '../lib/format'
import { getClaimPhotos } from '../lib/photos'
import {
  bucketOf,
  frameIndex,
  framesPerItem,
  indexItems,
  itemForPhoto,
  roomBuckets,
  stateFacets,
} from '../lib/photo-rules'
import type { ClaimPhoto, PhotoBucket } from '../lib/photo-rules'
import { useThumb } from '../lib/thumbnails'
import type { ClaimItem, ClaimItemListResponse, ClaimSummary } from '../lib/types'

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

  const { data: claim } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
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

  const photos = useMemo(() => data?.photos ?? [], [data])
  const items = useMemo(() => itemsPage?.items ?? [], [itemsPage])
  const byId = useMemo(() => indexItems(items), [items])
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
            frameNo={frameIndex(photos, focus)}
            frameCount={focus.item_id == null ? 0 : (frames.get(focus.item_id) ?? 0)}
            claimId={claimId}
            onFull={() => setFull(true)}
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

function PhotoTile({
  photo,
  item,
  frames,
  on,
  onOpen,
}: {
  photo: ClaimPhoto
  item: ClaimItem | null
  frames: number
  on: boolean
  onOpen: () => void
}) {
  const { ref, src } = useThumb<HTMLButtonElement>(photo.photo_id)

  const bucket = bucketOf(photo)
  const caption = item
    ? (item.description ?? item.suggested_description ?? `Line ${item.id}`)
    : bucket === 'pending'
      ? 'Waiting in staging — not processed yet'
      : 'Backs no line item'

  return (
    <button ref={ref} type="button" onClick={onOpen} className={`k-photo ${on ? 'k-photo--on' : ''}`}>
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
        {src ? (
          <img
            src={src}
            alt={caption}
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
          {/* The payload carries no filename, so the id is the identifier. */}
          {photo.room ? `${photo.room} · ` : ''}Photo {photo.photo_id}
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

function PhotoDetail({
  photo,
  item,
  frameNo,
  frameCount,
  claimId,
  onFull,
  onWorksheet,
}: {
  photo: ClaimPhoto
  item: ClaimItem | null
  frameNo: number
  frameCount: number
  claimId: string
  onFull: () => void
  onWorksheet: () => void
}) {
  const queryClient = useQueryClient()
  const { ref, src } = useThumb<HTMLDivElement>(photo.photo_id)
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
          <div className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
            Photo {photo.photo_id}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
            {item
              ? (item.description ?? item.suggested_description ?? `Line ${item.id}`)
              : bucket === 'pending'
                ? 'Not processed yet'
                : 'Backs no line item'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 2 }}>
            {photo.room ?? 'No room set'}
          </div>
        </div>
        <button
          type="button"
          className="k-icon-btn"
          onClick={onFull}
          title="View full size"
          disabled={!src}
        >
          <Icon d={I.expand} size={13} />
        </button>
      </div>

      <div ref={ref} style={{ padding: 14, borderBottom: '1px solid var(--k-line)' }}>
        {src ? (
          <img
            src={src}
            alt=""
            style={{ width: '100%', borderRadius: 8, display: 'block', background: 'var(--k-bg-3)' }}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 8, background: 'var(--k-bg-3)' }} />
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* The design's meta grid listed Captured / Device / GPS / Confidence.
            The first three have no field on this payload -- and printing three
            em dashes is a worse answer than printing what is actually known. */}
        <div className="k-exp-meta">
          <div>
            <span>State</span>
            <span style={{ fontSize: 11.5 }}>
              {bucket === 'attached'
                ? 'Backs a line'
                : bucket === 'pending'
                  ? 'Waiting in staging'
                  : 'Backing nothing'}
            </span>
          </div>
          {frameCount > 1 ? (
            <div>
              <span>Frame</span>
              <span className="k-mono">
                {frameNo} of {frameCount}
              </span>
            </div>
          ) : null}
          {photo.session_id != null ? (
            <div>
              <span>Batch</span>
              <span className="k-mono">Session {photo.session_id}</span>
            </div>
          ) : null}
          {item?.confidence != null ? (
            <div>
              <span>Confidence</span>
              <span style={{ fontSize: 11.5 }}>{fmtConfidence(item.confidence)}</span>
            </div>
          ) : null}
        </div>

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

      {item ? (
        <div className="k-exp-det-foot">
          <button
            type="button"
            className="k-btn k-btn--ghost"
            disabled={unlink.isPending}
            title="Unpoints it from this line. The photo stays on the claim."
            onClick={() => unlink.mutate()}
          >
            <Icon d={I.close} size={12} /> {unlink.isPending ? 'Unlinking…' : 'Unlink from this line'}
          </button>
        </div>
      ) : null}
    </aside>
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
  const { ref, src } = useThumb<HTMLDivElement>(photo.photo_id)
  const i = list.findIndex((p) => p.photo_id === photo.photo_id)

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
          {src ? <img src={src} alt="" className="k-photo-full-img" /> : null}
        </div>
      </div>
    </div>
  )
}
