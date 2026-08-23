import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { fmtInt } from '../lib/format'
import {
  NOTE_MAX,
  clusterBlockedReason,
  clusterRemainder,
  getStaging,
  getThumbnails,
  isActionable,
  mergeGroups,
  pendingPhotos,
  processStaging,
  reclassifyGroup,
  remainderBlockedReason,
  runCluster,
  setGroupNote,
  thumbnailBatches,
  ungroup,
} from '../lib/staging'
import type { GroupKind, StagingGroup, StagingPhoto, StagingSessionFull } from '../lib/staging'

/** Loud, greppable, and states the contract rule that produced the state. */
const log = (event: string, detail: unknown) =>
  console.info(`[staging] ${event}`, detail)

export default function StagingPage() {
  const { claimId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmProcess, setConfirmProcess] = useState(false)
  /** Set by any hand arrangement -- it is what turns /cluster into a 409. */
  const [manuallyEdited, setManuallyEdited] = useState(false)
  /**
   * A clustering run was fired and its sets have not arrived yet.
   *
   * Status alone is not a sufficient poll condition: the worker can leave the
   * session reading `review` (or flip through it) before this client's next
   * tick, and polling then stops with `groups` still null -- the screen sat on
   * "No sets yet" while the API already held 55 sets. Keep polling until the
   * sets actually appear.
   */
  const [awaitingSets, setAwaitingSets] = useState(false)

  const session = useQuery({
    queryKey: ['staging', claimId],
    queryFn: () => getStaging(claimId),
    retry: (count, error) => !(error instanceof ApiError && error.isMissing) && count < 2,
    /**
     * Poll only while work is in flight. `uploading` and `clustering` are
     * transient; `review` waits on the adjuster and `processed` is terminal, so
     * polling either would be a request every few seconds forever.
     */
    refetchInterval: (q) => {
      const data = q.state.data as StagingSessionFull | undefined
      if (!data) return false
      const waiting = data.status === 'uploading' || data.status === 'clustering'
      const extracting = pendingPhotos(data).length > 0
      // Keep going until the sets land, not merely until the status settles.
      const setsPending = awaitingSets && (data.groups?.length ?? 0) === 0
      const poll = waiting || extracting || setsPending
      if (poll)
        log('poll', {
          status: data.status,
          extracting: pendingPhotos(data).length,
          awaitingSets: setsPending,
        })
      return poll ? 2500 : false
    },
  })

  const data = session.data
  const groups = data?.groups ?? []

  // Stand down once the sets are on screen.
  useEffect(() => {
    if (awaitingSets && groups.length > 0) {
      log('sets arrived', { count: groups.length })
      setAwaitingSets(false)
    }
  }, [awaitingSets, groups.length])
  const unassigned = data?.ungrouped_photos ?? []
  const pending = pendingPhotos(data)

  /** Every mutation returns the refreshed session -- apply it, never re-read. */
  const applySession = (next: StagingSessionFull) => {
    queryClient.setQueryData(['staging', claimId], next)
  }

  const fail = (action: string) => (error: unknown) => {
    if (error instanceof ApiError) {
      log(`${action} FAILED`, {
        status: error.status,
        detail: error.detail,
        requestId: error.requestId,
        // 409 on a grouping path almost always means a photo is still
        // `uploaded` -- the contract's own explanation.
        likelyCause:
          error.status === 409
            ? 'a photo is still extracting (status "uploaded"), or the session was re-clustered mid-edit'
            : undefined,
      })
      setNotice(
        error.status === 409
          ? `${action} was refused (409). ${String(error.detail)}`
          : `${action} failed — HTTP ${error.status}: ${String(error.detail)}`,
      )
      return
    }
    setNotice(`${action} failed.`)
  }

  const clearSelection = () => {
    setSelectedGroups(new Set())
    setSelectedPhotos(new Set())
  }

  const cluster = useMutation({
    mutationFn: () => runCluster(claimId),
    onSuccess: (r) => {
      log('cluster started — polling until the sets arrive', r)
      setAwaitingSets(true)
      void session.refetch()
    },
    onError: fail('Clustering'),
  })

  const remainder = useMutation({
    mutationFn: () => clusterRemainder(claimId),
    onSuccess: (r) => {
      log('cluster remainder started (appends, never rebuilds)', r)
      setAwaitingSets(true)
      void session.refetch()
    },
    onError: fail('Clustering the remainder'),
  })

  const merge = useMutation({
    mutationFn: (kind: GroupKind) =>
      mergeGroups(claimId, {
        group_keys: selectedGroups.size ? [...selectedGroups] : undefined,
        photo_ids: selectedPhotos.size ? [...selectedPhotos] : undefined,
        // Explicit: it defaults to `item`, which would silently convert a
        // context or duplicate set.
        kind,
      }),
    onSuccess: (next) => {
      // The merged set has a NEW group_key and the sources are pruned, so any
      // cached key is already stale. Drop the selection with it.
      log('merged — new group_key minted, sources pruned', {
        keys: next.groups?.map((g) => g.group_key),
      })
      setManuallyEdited(true)
      clearSelection()
      applySession(next)
    },
    onError: fail('Merge'),
  })

  const split = useMutation({
    mutationFn: (groupKey: string) => ungroup(claimId, groupKey),
    onSuccess: (next) => {
      log('ungrouped — one item set per photo; a merged note stays on the FIRST child', {})
      setManuallyEdited(true)
      clearSelection()
      applySession(next)
    },
    onError: fail('Split'),
  })

  const reclassify = useMutation({
    mutationFn: ({ groupKey, kind }: { groupKey: string; kind: GroupKind }) =>
      reclassifyGroup(claimId, groupKey, kind),
    onSuccess: (next, { kind }) => {
      log('reclassified — excluding a set from the worksheet IS reclassifying it', { kind })
      setManuallyEdited(true)
      applySession(next)
    },
    onError: fail('Reclassify'),
  })

  const note = useMutation({
    mutationFn: ({ groupKey, text }: { groupKey: string; text: string | null }) =>
      setGroupNote(claimId, groupKey, text),
    onSuccess: (next, { text }) => {
      // A note does NOT set manually_edited -- it never blocks /cluster.
      log(text === null ? 'note cleared — derived summary returns' : 'note set (source → adjuster)', {})
      applySession(next)
    },
    onError: fail('Saving the note'),
  })

  const process = useMutation({
    mutationFn: () => processStaging(claimId),
    onSuccess: (result) => {
      log('processed — posted NO body; the server promoted what it already held', result)
      setConfirmProcess(false)
      void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      navigate(`/claims/${claimId}`)
    },
    onError: fail('Processing'),
  })

  const busy =
    cluster.isPending || remainder.isPending || merge.isPending || split.isPending || process.isPending

  const clusterBlocked = clusterBlockedReason(data, manuallyEdited)
  const remainderBlocked = remainderBlockedReason(data)
  const itemSets = groups.filter((g) => g.kind === 'item')
  const selectionSize = selectedGroups.size + selectedPhotos.size

  if (session.error instanceof ApiError && session.error.isMissing) {
    return (
      <div className="k-shell">
        <AppHeader />
        <div className="k-claims-body">
          <div className="k-empty">
            <h2>Nothing staged yet</h2>
            <p>Upload photos on the claim to start a staging session.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="k-shell">
      <AppHeader />

      <div className="k-claims-body">
        <div>
          <Link to={`/claims/${claimId}`} className="k-crumb">
            <Icon d={I.chevleft} size={12} /> Worksheet
          </Link>
          <h1 className="k-claims-h1">Review photo sets</h1>
          <p className="k-claims-sub">
            Kevin grouped the photos by capture time and proximity. Merge, split or exclude sets
            before anything is priced — every change saves as you make it.
          </p>
        </div>

        {data ? (
          <div className="k-claims-stats">
            <div>
              <div className="k-tot-l">Photos</div>
              <div className="k-tot-v">{fmtInt(data.photo_count)}</div>
            </div>
            <div>
              {/* Photo SETS, never line items -- the item count is not known
                  until the sets are promoted and priced. */}
              <div className="k-tot-l">Proposed sets</div>
              <div className="k-tot-v">{fmtInt(itemSets.length)}</div>
            </div>
            <div>
              <div className="k-tot-l">Unassigned</div>
              <div className="k-tot-v">{fmtInt(unassigned.length)}</div>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className="k-toast" role="status">
            <span>{notice}</span>
            <button type="button" className="k-link" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        {pending.length ? (
          <div className="k-ws-bar k-ws-bar--quiet">
            <span>
              {fmtInt(pending.length)} photo{pending.length === 1 ? '' : 's'} still extracting.
              Grouping is unavailable until they finish — every grouping call returns 409 for a
              photo in this state.
            </span>
          </div>
        ) : null}

        <section className="k-claims-toolbar">
          <button
            type="button"
            className="k-btn k-btn--ghost"
            disabled={busy || clusterBlocked !== null}
            title={clusterBlocked ?? 'Group every photo by capture time and proximity'}
            onClick={() => cluster.mutate()}
          >
            {cluster.isPending || awaitingSets ? 'Clustering…' : 'Cluster photos'}
          </button>

          <button
            type="button"
            className="k-btn k-btn--ghost"
            disabled={busy || remainderBlocked !== null}
            title={remainderBlocked ?? 'Group only the unassigned photos — existing sets are untouched'}
            onClick={() => remainder.mutate()}
          >
            {remainder.isPending ? 'Grouping…' : `Cluster remaining${unassigned.length ? ` (${unassigned.length})` : ''}`}
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            className="k-btn"
            disabled={busy || itemSets.length === 0}
            title={itemSets.length === 0 ? 'No item sets to promote' : undefined}
            onClick={() => setConfirmProcess(true)}
          >
            Process {fmtInt(itemSets.length)} set{itemSets.length === 1 ? '' : 's'}
          </button>
        </section>

        {selectionSize > 0 ? (
          <div className="k-ws-bar k-ws-bar--sel">
            <span>
              {fmtInt(selectedGroups.size)} set{selectedGroups.size === 1 ? '' : 's'} ·{' '}
              {fmtInt(selectedPhotos.size)} photo{selectedPhotos.size === 1 ? '' : 's'} selected
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="k-btn k-btn--sm" disabled={busy} onClick={() => merge.mutate('item')}>
                Merge into one item
              </button>
              <button
                type="button"
                className="k-btn k-btn--sm k-btn--ghost"
                disabled={busy}
                onClick={() => merge.mutate('context')}
              >
                Merge as context
              </button>
              <button type="button" className="k-btn k-btn--sm k-btn--ghost" onClick={clearSelection}>
                Clear
              </button>
            </div>
          </div>
        ) : null}

        {session.isPending ? <p className="k-note">Loading the staging session…</p> : null}

        {unassigned.length ? (
          <section className="k-stage-tray">
            <div className="k-stage-tray-hd">
              <Badge tone="warn">Unassigned</Badge>
              <span className="k-claim-sub">
                {fmtInt(unassigned.length)} photo{unassigned.length === 1 ? '' : 's'} in no set.
                Processing would drop them from the claim — cluster them or merge them into a set
                first.
              </span>
            </div>
            <div className="k-stage-photos">
              {unassigned.map((photo) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  selected={selectedPhotos.has(photo.id)}
                  onToggle={() =>
                    setSelectedPhotos((prev) => {
                      const next = new Set(prev)
                      if (next.has(photo.id)) next.delete(photo.id)
                      else next.add(photo.id)
                      return next
                    })
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="k-stage-grid">
          {groups.map((group, index) => (
            <SetCard
              key={group.group_key}
              group={group}
              index={index}
              selected={selectedGroups.has(group.group_key)}
              busy={busy}
              onToggle={() =>
                setSelectedGroups((prev) => {
                  const next = new Set(prev)
                  if (next.has(group.group_key)) next.delete(group.group_key)
                  else next.add(group.group_key)
                  return next
                })
              }
              onSplit={() => split.mutate(group.group_key)}
              onReclassify={(kind) => reclassify.mutate({ groupKey: group.group_key, kind })}
              onNote={(text) => note.mutate({ groupKey: group.group_key, text })}
            />
          ))}
        </div>

        {data && groups.length === 0 && data.photo_count > 0 && !pending.length ? (
          <div className="k-empty">
            <h2>No sets yet</h2>
            <p>Run “Cluster photos” to group them by capture time and proximity.</p>
          </div>
        ) : null}
      </div>

      {confirmProcess ? (
        <div className="k-export-stage k-modal-stage">
          <div className="k-export-scrim" onClick={() => setConfirmProcess(false)} />
          <div className="k-export-modal" style={{ maxWidth: 470 }}>
            <div className="k-export-hd">
              <div>
                <div className="k-modal-kicker">Process sets</div>
                <div className="k-modal-title">{fmtInt(itemSets.length)} item sets</div>
              </div>
            </div>
            <div className="k-modal-body">
              <div className="k-modal-note">
                Each item set becomes one worksheet line and is priced once. Context and duplicate
                sets promote nothing — they stay on the claim as evidence.
              </div>
              {unassigned.length ? (
                <div className="k-modal-note k-modal-note--danger">
                  <strong>{fmtInt(unassigned.length)}</strong> unassigned photo
                  {unassigned.length === 1 ? '' : 's'} will reach no line and come off the claim —
                  processing is terminal. Cluster the remainder first if you want them included.
                </div>
              ) : null}
            </div>
            <div className="k-modal-foot">
              <button type="button" className="k-btn k-btn--ghost" onClick={() => setConfirmProcess(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={process.isPending}
                onClick={() => process.mutate()}
              >
                {process.isPending ? 'Processing…' : 'Process'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const KIND_TONE: Record<GroupKind, 'accent' | 'quiet'> = {
  item: 'accent',
  context: 'quiet',
  duplicate: 'quiet',
}

function SetCard({
  group,
  index,
  selected,
  busy,
  onToggle,
  onSplit,
  onReclassify,
  onNote,
}: {
  group: StagingGroup
  index: number
  selected: boolean
  busy: boolean
  onToggle: () => void
  onSplit: () => void
  onReclassify: (kind: GroupKind) => void
  onNote: (text: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(group.note ?? '')

  useEffect(() => setDraft(group.note ?? ''), [group.note])

  return (
    <div className={`k-stage-card${selected ? ' k-stage-card--sel' : ''}`}>
      <div className="k-stage-card-hd">
        <button type="button" className={`k-check ${selected ? 'k-check--on' : ''}`} onClick={onToggle}>
          {selected ? <Icon d={I.check} size={10} stroke={2} /> : null}
        </button>
        <span className="k-stage-set">Set {String(index + 1).padStart(2, '0')}</span>
        <Badge tone={KIND_TONE[group.kind]}>{group.kind}</Badge>
        {group.room ? <span className="k-claim-sub">{group.room}</span> : null}
        <span style={{ flex: 1 }} />
        <span className="k-claim-sub">
          {group.photos.length} photo{group.photos.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="k-stage-photos">
        {group.photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>

      <div className="k-stage-note">
        {editing ? (
          <>
            <textarea
              className="k-insp-input"
              rows={2}
              maxLength={NOTE_MAX}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="k-insp-actions">
              <span className="k-insp-hint" style={{ marginRight: 'auto' }}>
                {draft.trim().length}/{NOTE_MAX}
              </span>
              {group.note_source === 'adjuster' ? (
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--ghost"
                  onClick={() => {
                    setEditing(false)
                    onNote(null)
                  }}
                >
                  Revert to summary
                </button>
              ) : null}
              <button type="button" className="k-btn k-btn--sm k-btn--ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="k-btn k-btn--sm"
                onClick={() => {
                  setEditing(false)
                  onNote(draft.trim() || null)
                }}
              >
                Save note
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Branch on note_source, never on the text: a derived note is a
                read-only fusion of capture context, an adjuster note is the one
                editable slot -- and only the latter can become a search query. */}
            <div className="k-stage-note-body">
              {group.note ? (
                <>
                  <span className="k-lkq-note-l">
                    {group.note_source === 'adjuster' ? 'Additional identification' : 'Capture context'}
                  </span>
                  <span className="k-lkq-note-b">{group.note}</span>
                </>
              ) : (
                <span className="k-insp-hint">No note</span>
              )}
            </div>
            <button
              type="button"
              className="k-btn k-btn--sm k-btn--ghost"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              {group.note_source === 'adjuster' ? 'Edit note' : 'Add identification'}
            </button>
          </>
        )}
      </div>

      <div className="k-stage-card-ft">
        <button
          type="button"
          className="k-btn k-btn--sm k-btn--ghost"
          disabled={busy || group.photos.length < 2}
          title={group.photos.length < 2 ? 'Nothing to split' : 'One item set per photo'}
          onClick={onSplit}
        >
          Split
        </button>
        {/* Excluding from the worksheet IS reclassifying -- photos stay on the
            claim as evidence. In property claims evidence is never deleted. */}
        {group.kind === 'item' ? (
          <button
            type="button"
            className="k-btn k-btn--sm k-btn--ghost"
            disabled={busy}
            title="Keeps the photos on the claim, promotes no line item"
            onClick={() => onReclassify('context')}
          >
            Exclude from worksheet
          </button>
        ) : (
          <button
            type="button"
            className="k-btn k-btn--sm k-btn--ghost"
            disabled={busy}
            onClick={() => onReclassify('item')}
          >
            Include as item
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Thumbnails are fetched lazily in batches when a tile enters the viewport.
 * The staging poll deliberately carries no image_url: minting one per photo
 * made a single poll of a 300-photo session issue 300 storage round trips.
 */
const thumbCache = new Map<number, string | null>()

function PhotoTile({
  photo,
  selected,
  onToggle,
}: {
  photo: StagingPhoto
  selected?: boolean
  onToggle?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null>(thumbCache.get(photo.id) ?? null)
  const actionable = isActionable(photo)

  useEffect(() => {
    if (src || thumbCache.has(photo.id)) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        const batch = thumbnailBatches([photo.id])[0]
        void getThumbnails(batch)
          .then((r) => {
            for (const t of r.thumbnails) thumbCache.set(t.id, t.image_url)
            setSrc(thumbCache.get(photo.id) ?? null)
          })
          .catch(() => thumbCache.set(photo.id, null))
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [photo.id, src])

  return (
    <div
      ref={ref}
      className={`k-stage-tile${selected ? ' k-stage-tile--sel' : ''}${onToggle ? ' k-stage-tile--pick' : ''}`}
      onClick={onToggle}
      title={photo.note ?? undefined}
    >
      {src ? <img src={src} alt="" /> : <div className="k-stage-tile-skel" />}
      {!actionable ? <span className="k-stage-tile-badge">extracting</span> : null}
      {photo.note ? <span className="k-stage-tile-note">{photo.note}</span> : null}
    </div>
  )
}
