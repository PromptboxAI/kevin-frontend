import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { fmtInt } from '../lib/format'
import { SET_LABEL, conflictCopy } from '../lib/staging-copy'
import {
  NOTE_MAX,
  clusterRemainder,
  getStaging,
  getThumbnails,
  isActionable,
  mergeGroups,
  pendingPhotos,
  processStaging,
  reclassifyGroup,
  runCluster,
  setGroupNote,
  ungroup,
} from '../lib/staging'
import type { GroupKind, StagingGroup, StagingPhoto, StagingSessionFull } from '../lib/staging'

const log = (event: string, detail?: unknown) => console.info(`[staging] ${event}`, detail ?? '')

/** Inline styles the design carries here — no k- class exists for these. */
const EYEBROW: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--k-fg-4)',
  fontFamily: 'var(--k-font-mono)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontWeight: 600,
}
const H1: React.CSSProperties = {
  fontFamily: 'var(--k-font-display)',
  fontWeight: 400,
  fontSize: 38,
  letterSpacing: '-0.025em',
  margin: '6px 0 4px',
  lineHeight: 1.1,
}
const LEDE: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--k-fg-3)',
  margin: 0,
  maxWidth: 640,
  lineHeight: 1.5,
}
const FOOT: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 20,
  paddingTop: 16,
  borderTop: '1px solid var(--k-line)',
}
const FOOT_NOTE: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--k-fg-4)',
  maxWidth: 560,
  lineHeight: 1.5,
}

const FILL_IMG: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

export default function StagingPage() {
  const { claimId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [sel, setSel] = useState<string[]>([])
  const [selPhotos, setSelPhotos] = useState<number[]>([])
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ key: string; i: number } | null>(null)
  const [confirmProcess, setConfirmProcess] = useState(false)
  const [conflict, setConflict] = useState<string | null>(null)
  /** A clustering run is in flight and its sets have not landed yet. */
  const [awaitingSets, setAwaitingSets] = useState(false)

  const session = useQuery({
    queryKey: ['staging', claimId],
    queryFn: () => getStaging(claimId),
    retry: (count, error) => !(error instanceof ApiError && error.isMissing) && count < 2,
    refetchInterval: (q) => {
      const d = q.state.data as StagingSessionFull | undefined
      if (!d) return false
      const settling = d.status === 'uploading' || d.status === 'clustering'
      const extracting = pendingPhotos(d).length > 0
      // Poll until the SETS arrive, not merely until the status settles --
      // status flips to `review` a beat before the groups are readable.
      const setsPending = awaitingSets && (d.groups?.length ?? 0) === 0
      return settling || extracting || setsPending ? 2500 : false
    },
  })

  const data = session.data
  const groups = useMemo(() => data?.groups ?? [], [data])
  const unassigned = data?.ungrouped_photos ?? []
  const stillExtracting = pendingPhotos(data)
  /** A loose photo is only actionable once its extraction finishes. */
  const loose = unassigned.filter(isActionable)

  useEffect(() => {
    if (awaitingSets && groups.length > 0) {
      log('sets landed', { sets: groups.length })
      setAwaitingSets(false)
    }
  }, [awaitingSets, groups.length])

  /**
   * Clustering fires on arrival. The design has no "Cluster photos" button --
   * grouping is what the machine already did before this screen opened, so an
   * empty state with a trigger would ask the adjuster to do its job.
   */
  const autoFired = useRef(false)
  useEffect(() => {
    if (!data || autoFired.current || awaitingSets) return
    const none = (data.groups?.length ?? 0) === 0
    if (none && data.photo_count > 0 && stillExtracting.length === 0 && data.status !== 'processed') {
      autoFired.current = true
      log('auto-clustering — upload landed, every photo read, no sets yet')
      cluster.mutate()
    }
  })

  const applySession = (next: StagingSessionFull) =>
    queryClient.setQueryData(['staging', claimId], next)
  const byKey = (key: string) => groups.find((g) => g.group_key === key)

  const fail =
    (action: 'merge' | 'cluster' | 'remainder' | 'other', label: string) => (error: unknown) => {
      if (error instanceof ApiError) {
        log(`${label} FAILED`, {
          status: error.status,
          detail: error.detail,
          requestId: error.requestId,
        })
        // A 409 is never a failure here -- it is "not yet" or "that would undo
        // your work", so it reads as the design's inline explanation.
        if (error.status === 409 && action !== 'other') {
          setConflict(conflictCopy(action, error.detail))
          return
        }
        setConflict(`${label} failed — HTTP ${error.status}: ${String(error.detail)}`)
        return
      }
      setConflict(`${label} failed.`)
    }

  const cluster = useMutation({
    mutationFn: () => runCluster(claimId),
    onSuccess: () => {
      setAwaitingSets(true)
      void session.refetch()
    },
    onError: fail('cluster', 'Grouping'),
  })

  const remainder = useMutation({
    mutationFn: () => clusterRemainder(claimId),
    onSuccess: () => {
      setAwaitingSets(true)
      void session.refetch()
    },
    onError: fail('remainder', 'Grouping the late photos'),
  })

  const merge = useMutation({
    mutationFn: (kind: GroupKind) =>
      mergeGroups(claimId, {
        group_keys: sel.length ? sel : undefined,
        photo_ids: selPhotos.length ? selPhotos : undefined,
        kind,
      }),
    onSuccess: (next) => {
      log('merged — a NEW group_key was minted and the sources pruned')
      setSel([])
      setSelPhotos([])
      applySession(next)
    },
    onError: fail('merge', 'Merge'),
  })

  const split = useMutation({
    mutationFn: (key: string) => ungroup(claimId, key),
    onSuccess: applySession,
    onError: fail('other', 'Split'),
  })

  const reclassify = useMutation({
    mutationFn: ({ key, kind }: { key: string; kind: GroupKind }) =>
      reclassifyGroup(claimId, key, kind),
    onSuccess: applySession,
    onError: fail('other', 'Exclude'),
  })

  const note = useMutation({
    mutationFn: ({ key, text }: { key: string; text: string | null }) =>
      setGroupNote(claimId, key, text),
    onSuccess: (next) => {
      setNoteFor(null)
      applySession(next)
    },
    onError: fail('other', 'Saving the note'),
  })

  const process = useMutation({
    mutationFn: () => processStaging(claimId),
    onSuccess: (r) => {
      log('processed — the POST carried NO body', r)
      setConfirmProcess(false)
      void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      navigate(`/claims/${claimId}`)
    },
    onError: fail('other', 'Processing'),
  })

  const itemSets = groups.filter((g) => g.kind === 'item')
  const excluded = groups.filter((g) => g.kind === 'context')
  const duplicates = groups.filter((g) => g.kind === 'duplicate')
  const multi = groups.filter((g) => g.photos.length > 1)
  const noted = groups.filter((g) => g.note)
  const busy = merge.isPending || split.isPending || process.isPending || reclassify.isPending
  const selCount = sel.length + selPhotos.length
  const clustering =
    cluster.isPending || remainder.isPending || awaitingSets || data?.status === 'clustering'

  /**
   * Processing is TERMINAL and spends real vendor searches. Once a session has
   * promoted its sets, re-running would bill the whole claim again -- so the
   * action is withdrawn rather than merely discouraged. Every editing control
   * goes with it: the rows now exist on the worksheet, and a merge here would
   * describe a grouping the line items no longer follow.
   */
  const isProcessed = data?.status === 'processed'
  const selectable = !isProcessed
  const canProcess = !busy && !isProcessed && itemSets.length > 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (lightbox) setLightbox(null)
      else if (noteFor) setNoteFor(null)
      else if (selCount) {
        setSel([])
        setSelPhotos([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, noteFor, selCount])

  if (session.error instanceof ApiError && session.error.isMissing) {
    return (
      <div className="k-intake">
        <AppHeader />
        <div className="k-intake-body">
          <div className="k-empty">
            <h2>Nothing staged yet</h2>
            <p>Add photos to this claim to start a staging session.</p>
            <Link to="/claims/new" className="k-btn">
              Add photos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const noteTarget = noteFor ? byKey(noteFor) : null
  const lightboxSet = lightbox ? byKey(lightbox.key) : null

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            {/* Staging's parent is the upload, not the worksheet. */}
            <Link to="/claims/new" className="k-crumb" title="Back to upload">
              <Icon d={I.chevleft} size={12} /> Upload
            </Link>
            <div style={EYEBROW}>After upload · before processing</div>
            <h1 style={H1}>Group &amp; stage photos</h1>

            {data?.status === 'uploading' ? (
              <div className="k-stage-bgupload">
                <span className="k-paused-dot" />
                <span>Photos are still landing — new sets appear as they arrive.</span>
              </div>
            ) : null}

            {/* A second drop APPENDS: staging is scoped to THIS session only. */}
            <div className="k-stage-scope">
              <Icon d={I.info} size={13} />
              <span>
                Staging <strong>this batch only</strong> — {fmtInt(data?.photo_count ?? 0)} photos.
                Anything already processed on this claim stays as it is.
              </span>
            </div>

            {/* The invitation to arrange sets is false once they are promoted --
                the run already happened and the rows exist. */}
            <p style={LEDE}>
              {isProcessed ? (
                <>
                  These <strong>{fmtInt(groups.length)} photo sets</strong> were submitted and
                  became {fmtInt(itemSets.length)} line items. This is the record of how the photos
                  were grouped — the items themselves are edited on the worksheet.
                </>
              ) : (
                <>
                  Your upload was pre-clustered by capture time into{' '}
                  <strong>proposed photo sets</strong> — one set becomes at most one line item.
                  Nothing has been identified yet. Merge sets that show the same item, split ones
                  that don’t, exclude overview shots, and add a note wherever the photo alone won’t
                  tell Kevin what it’s looking at.
                </>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* Add photos survives a processed session -- a second drop opens
                the NEXT session and appends, which is the multi-session flow. */}
            <Link to="/claims/new" className="k-btn k-btn--ghost">
              <Icon d={I.plus} size={12} /> Add photos
            </Link>

            {/* Process and Reset are gone, not greyed: a disabled control still
                invites the click, and neither has anything left to do here. */}
            {isProcessed ? (
              <Link to={`/claims/${claimId}`} className="k-btn">
                Open worksheet →
              </Link>
            ) : null}

            {isProcessed ? null : (
              <>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              disabled={busy || clustering}
              onClick={() => {
                // A rebuild discards every group -- and the authored set notes
                // with them. Photo notes survive; the sentences do not.
                const authored = groups.filter((g) => g.note_source === 'adjuster' && g.note).length
                if (
                  authored &&
                  !window.confirm(
                    `Resetting rebuilds every set. ${authored} note${authored === 1 ? '' : 's'} you wrote on set${authored === 1 ? '' : 's'} will be discarded (the notes on individual photos are kept). Reset anyway?`,
                  )
                )
                  return
                autoFired.current = false
                cluster.mutate()
              }}
            >
              Reset to proposed sets
            </button>
            <button
              type="button"
              className="k-btn"
              disabled={!canProcess}
              onClick={() => setConfirmProcess(true)}
            >
              Begin processing →
            </button>
              </>
            )}
          </div>
        </div>

        {/* Sets, never line items -- the item count is unknown until Vision runs. */}
        <section className="k-stage-tally">
          {(
            [
              ['Photos', data?.photo_count ?? 0, null],
              ['Photo sets', groups.length, 'accent'],
              ['Multi-photo sets', multi.length, null],
              ['You excluded', excluded.length, 'quiet'],
              ['With a note', noted.length, noted.length ? 'accent' : 'quiet'],
              ['Duplicates removed', duplicates.length, 'quiet'],
            ] as [string, number, string | null][]
          ).map(([label, value, tone]) => (
            <div key={label} className="k-stage-tally-cell">
              <div
                className="k-stage-tally-v"
                style={
                  tone === 'accent'
                    ? { color: 'var(--k-accent)' }
                    : tone === 'quiet'
                      ? { color: 'var(--k-fg-3)' }
                      : undefined
                }
              >
                {fmtInt(value)}
              </div>
              <div className="k-stage-tally-l">{label}</div>
            </div>
          ))}
        </section>

        <div className="k-stage-countline">
          {isProcessed ? (
            <>
              How this batch was grouped · <strong>{fmtInt(groups.length)}</strong> sets →{' '}
              <strong>{fmtInt(itemSets.length)}</strong> line items
            </>
          ) : (
            <>
              Showing <strong>{fmtInt(groups.length)}</strong> sets · {fmtInt(groups.length)}{' '}
              proposed by Kevin
              <span style={{ color: 'var(--k-fg-4)' }}>
                {' '}
                · select sets to merge, exclude, or delete them
              </span>
            </>
          )}
        </div>

        {isProcessed ? (
          <div className="k-tray k-tray--pending">
            <div className="k-tray-hd">
              <Icon d={I.check} size={14} />
              <span className="k-tray-t">
                These sets have been processed — they are line items on the worksheet now. The
                grouping is kept here as a record of what was submitted; correcting an item is done
                on the row, not by re-running.
              </span>
            </div>
          </div>
        ) : null}

        {/* A 409 is "not yet" or "that would undo your work" — inline, never red. */}
        {conflict ? (
          <div className="k-tray k-tray--pending">
            <div className="k-tray-hd">
              <Icon d={I.info} size={14} />
              <span className="k-tray-t">{conflict}</span>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="k-btn k-btn--sm k-btn--ghost"
                onClick={() => setConflict(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {loose.length > 0 || stillExtracting.length > 0 ? (
          <div className={'k-tray' + (loose.length === 0 ? ' k-tray--pending' : '')}>
            <div className="k-tray-hd">
              <Icon d={loose.length ? I.warn : I.clock} size={14} />
              <span className="k-tray-t">
                {loose.length
                  ? `${loose.length} ${loose.length === 1 ? 'photo' : 'photos'} arrived after grouping ran, so ${loose.length === 1 ? 'it is' : 'they are'} on ${loose.length === 1 ? 'its' : 'their'} own below — merge, note or exclude ${loose.length === 1 ? 'it' : 'them'} like any other set.`
                  : `${stillExtracting.length} ${stillExtracting.length === 1 ? 'photo is' : 'photos are'} still processing. Nothing to do yet.`}
                {loose.length > 0 && stillExtracting.length > 0
                  ? ` ${stillExtracting.length} more ${stillExtracting.length === 1 ? 'is' : 'are'} still processing.`
                  : ''}
              </span>
              <div style={{ flex: 1 }} />
              {loose.length > 0 ? (
                <button
                  type="button"
                  className="k-btn k-btn--sm"
                  disabled={busy || clustering}
                  onClick={() => remainder.mutate()}
                >
                  {clustering ? 'Grouping…' : 'Group by capture time'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="k-stage-grid2">
          {/* Skeletons, not an empty state: the sets are already on their way. */}
          {clustering && groups.length === 0
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={`skel-${i}`} className="k-stageset">
                  <div className="k-stageset-media">
                    <span className="k-stageset-skel" />
                  </div>
                  <div className="k-stageset-body">
                    <div className="k-stage-rowhd">
                      <span className="k-stage-rowt" style={{ color: 'var(--k-fg-4)' }}>
                        Grouping…
                      </span>
                    </div>
                  </div>
                </div>
              ))
            : null}

          {groups.map((group, si) => (
            <SetCard
              key={group.group_key}
              group={group}
              si={si}
              selected={sel.includes(group.group_key)}
              busy={busy}
              editable={!isProcessed}
              selectable={selectable}
              onToggle={() =>
                setSel((prev) =>
                  prev.includes(group.group_key)
                    ? prev.filter((k) => k !== group.group_key)
                    : [...prev, group.group_key],
                )
              }
              onOpen={(i) => setLightbox({ key: group.group_key, i })}
              onNote={() => setNoteFor(group.group_key)}
              onSplit={() => split.mutate(group.group_key)}
              onToggleKind={() =>
                reclassify.mutate({
                  key: group.group_key,
                  kind: group.kind === 'item' ? 'context' : 'item',
                })
              }
            />
          ))}

          {/* Loose photos render as ordinary single-photo cards (amber edge) so
              merge, note and exclude work through controls already learned. */}
          {loose.map((photo) => (
            <LooseCard
              key={photo.id}
              photo={photo}
              selected={selPhotos.includes(photo.id)}
              onToggle={() =>
                setSelPhotos((prev) =>
                  prev.includes(photo.id)
                    ? prev.filter((id) => id !== photo.id)
                    : [...prev, photo.id],
                )
              }
            />
          ))}
        </div>

        <div style={FOOT}>
          <div style={FOOT_NOTE}>
            {isProcessed ? (
              <>
                Already processed — every set here became a line item. The grouping stays as a
                record of what was submitted; corrections happen on the worksheet row.
              </>
            ) : (
              <>
                Grouping is optional — the proposed sets are usually right. Anything you miss can
                still be merged or deleted in the worksheet once Kevin has read the photos. Nothing
                is identified or priced until you begin processing.
              </>
            )}
          </div>
          {/* A processed session gets the LIVE action, not a greyed label of
              what already happened -- disabled styling reads as a broken
              button and drops its fill on hover. */}
          {isProcessed ? (
            <Link to={`/claims/${claimId}`} className="k-btn k-btn--lg">
              Open worksheet · {fmtInt(itemSets.length)} line items →
            </Link>
          ) : (
            <button
              type="button"
              className="k-btn k-btn--lg"
              disabled={!canProcess}
              onClick={() => setConfirmProcess(true)}
            >
              Begin processing · {fmtInt(itemSets.length)} sets →
            </button>
          )}
        </div>
      </div>

      {/* Floating selection toolbar — in reach at any scroll position. */}
      {selCount > 0 ? (
        <div className="k-selbar" role="toolbar" aria-label="Selection actions">
          <span className="k-selbar-n">{selCount}</span>
          <span className="k-selbar-l">{selCount === 1 ? 'set selected' : 'sets selected'}</span>
          <div className="k-selbar-div" />
          <button
            type="button"
            className="k-selbar-b k-selbar-b--go"
            disabled={busy || selCount < 2}
            title={
              selCount < 2
                ? 'Select another set to merge'
                : 'Combine into one set — becomes one line item'
            }
            onClick={() => merge.mutate('item')}
          >
            {merge.isPending ? 'Merging…' : 'Merge into one item'}
          </button>
          <button
            type="button"
            className="k-selbar-b"
            disabled={busy || sel.length === 0}
            onClick={() => {
              for (const key of sel) {
                if (byKey(key)?.kind === 'item') reclassify.mutate({ key, kind: 'context' })
              }
              setSel([])
            }}
          >
            Exclude
          </button>
          <div className="k-selbar-div" />
          <button
            type="button"
            className="k-selbar-x"
            title="Clear selection (Esc)"
            onClick={() => {
              setSel([])
              setSelPhotos([])
            }}
          >
            <Icon d={I.close} size={13} />
          </button>
        </div>
      ) : null}

      {noteTarget ? (
        <StageNoteEditor
          group={noteTarget}
          title={SET_LABEL(groups.findIndex((g) => g.group_key === noteTarget.group_key))}
          saving={note.isPending}
          onClose={() => setNoteFor(null)}
          onSave={(text) => note.mutate({ key: noteTarget.group_key, text })}
        />
      ) : null}

      {lightboxSet && lightbox ? (
        <Lightbox
          group={lightboxSet}
          title={SET_LABEL(groups.findIndex((g) => g.group_key === lightboxSet.group_key))}
          i={Math.min(lightbox.i, lightboxSet.photos.length - 1)}
          onIndex={(i) => setLightbox({ key: lightboxSet.group_key, i })}
          onClose={() => setLightbox(null)}
        />
      ) : null}

      {confirmProcess ? (
        <div className="k-stage-noteover" onClick={() => setConfirmProcess(false)}>
          <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
            <div className="k-notemodal-hd">
              <div>
                <div className="k-notemodal-t">Begin processing?</div>
                <div className="k-notemodal-s">
                  {fmtInt(itemSets.length)} sets · one line item each
                </div>
              </div>
              <button
                type="button"
                className="k-icon-btn"
                aria-label="Close"
                onClick={() => setConfirmProcess(false)}
              >
                <Icon d={I.close} size={15} />
              </button>
            </div>

            <div className="k-notemodal-body">
              {/* Process is never blocked: the label states the cost, and one
                  confirm makes it deliberate. */}
              <p className="k-notemodal-lede">
                Each of the {fmtInt(itemSets.length)} sets is identified and priced once. Excluded
                and duplicate sets promote nothing — their photos stay on the claim.
              </p>
              {stillExtracting.length ? (
                <p className="k-notemodal-lede">
                  Kevin has not finished reading <strong>{fmtInt(stillExtracting.length)}</strong>{' '}
                  {stillExtracting.length === 1 ? 'photo' : 'photos'}. Processing now leaves{' '}
                  {stillExtracting.length === 1 ? 'it' : 'them'} off the worksheet —{' '}
                  {stillExtracting.length === 1 ? 'it stays' : 'they stay'} on the claim. Waiting a
                  moment lets {stillExtracting.length === 1 ? 'it' : 'them'} be grouped.
                </p>
              ) : null}
              {loose.length ? (
                <p className="k-notemodal-lede">
                  <strong>{fmtInt(loose.length)}</strong>{' '}
                  {loose.length === 1 ? 'photo is' : 'photos are'} in no set and will reach no line
                  item. Group {loose.length === 1 ? 'it' : 'them'} first to include{' '}
                  {loose.length === 1 ? 'it' : 'them'}.
                </p>
              ) : null}
            </div>

            <div className="k-notemodal-ft" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
              <button
                type="button"
                className="k-btn k-btn--ghost"
                onClick={() => setConfirmProcess(false)}
              >
                {stillExtracting.length ? 'Wait for them' : 'Go back'}
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={process.isPending}
                onClick={() => process.mutate()}
              >
                {process.isPending ? 'Processing…' : `Process ${fmtInt(itemSets.length)} sets`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// --------------------------------------------------------------------------
// Thumbnails
//
// The staging poll carries NO signed image_url -- minting 300 of them every few
// seconds crashed the server. Visible ids are batched into the thumbnails
// endpoint by an IntersectionObserver and cached per id, skeleton until landed.
// --------------------------------------------------------------------------

const thumbCache = new Map<number, string | null>()
const pendingIds = new Set<number>()
const waiting = new Map<number, ((src: string | null) => void)[]>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushThumbs() {
  flushTimer = null
  // Capped at 100 ids per request, per the contract.
  const ids = [...pendingIds].slice(0, 100)
  for (const id of ids) pendingIds.delete(id)
  if (!ids.length) return

  log('thumbnails →', ids.length)
  const settle = () => {
    for (const id of ids) {
      for (const cb of waiting.get(id) ?? []) cb(thumbCache.get(id) ?? null)
      waiting.delete(id)
    }
    if (pendingIds.size && !flushTimer) flushTimer = setTimeout(flushThumbs, 0)
  }

  void getThumbnails(ids)
    .then((r) => {
      for (const t of r.thumbnails) thumbCache.set(t.id, t.image_url)
    })
    .catch((e) => {
      log('thumbnails FAILED', e)
      for (const id of ids) thumbCache.set(id, null)
    })
    .finally(settle)
}

function requestThumb(id: number, done: (src: string | null) => void) {
  if (thumbCache.has(id)) {
    done(thumbCache.get(id) ?? null)
    return
  }
  pendingIds.add(id)
  waiting.set(id, [...(waiting.get(id) ?? []), done])
  if (!flushTimer) flushTimer = setTimeout(flushThumbs, 120)
}

function useThumb<T extends HTMLElement>(id: number) {
  const [src, setSrc] = useState<string | null>(() => thumbCache.get(id) ?? null)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (thumbCache.has(id)) {
      setSrc(thumbCache.get(id) ?? null)
      return
    }
    const el = ref.current
    if (!el) return
    let alive = true
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        requestThumb(id, (next) => {
          if (alive) setSrc(next)
        })
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => {
      alive = false
      observer.disconnect()
    }
  }, [id])

  return { ref, src }
}

function Frame({
  photo,
  n,
  showN,
  onOpen,
}: {
  photo: StagingPhoto
  n: number
  showN: boolean
  onOpen: () => void
}) {
  const { ref, src } = useThumb<HTMLButtonElement>(photo.id)
  return (
    <button
      type="button"
      className="k-stageset-frame"
      ref={ref}
      onClick={onOpen}
      title={photo.note ? `${photo.note} — click to open` : 'Click to open'}
    >
      {src ? (
        <img src={src} alt="" style={FILL_IMG} loading="lazy" decoding="async" />
      ) : (
        <span className="k-stageset-skel" aria-label="Loading thumbnail" />
      )}
      {showN ? <span className="k-stage-frame-n">{n}</span> : null}
    </button>
  )
}

function SetCard({
  group,
  si,
  selected,
  busy,
  selectable,
  editable,
  onToggle,
  onOpen,
  onNote,
  onSplit,
  onToggleKind,
}: {
  group: StagingGroup
  si: number
  selected: boolean
  busy: boolean
  selectable: boolean
  editable: boolean
  onToggle: () => void
  onOpen: (i: number) => void
  onNote: () => void
  onSplit: () => void
  onToggleKind: () => void
}) {
  const isCtx = group.kind !== 'item'
  const cls = [
    'k-stageset',
    selected ? 'k-stageset--sel' : '',
    isCtx ? 'k-stageset--ctx' : '',
    group.photos.length > 2 ? 'k-stageset--wide' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} data-set={group.group_key}>
      <div className="k-stageset-media">
        {group.photos.map((photo, i) => (
          <Frame
            key={photo.id}
            photo={photo}
            n={i + 1}
            showN={group.photos.length > 1}
            onOpen={() => onOpen(i)}
          />
        ))}
        {selectable ? (
          <button
            type="button"
            className="k-stage-check k-stage-check--float"
            data-on={selected || undefined}
            aria-label={`Select ${SET_LABEL(si)}`}
            onClick={onToggle}
          >
            {selected ? <Icon d={I.check} size={12} /> : null}
          </button>
        ) : null}
        {isCtx ? <span className="k-stageset-ctxtag">Excluded</span> : null}
      </div>

      <div className="k-stageset-body">
        <div className="k-stage-rowhd">
          <span className="k-stage-rowt">{SET_LABEL(si)}</span>
          {group.room ? <span className="k-stage-rowtime">{group.room}</span> : null}
          <div style={{ flex: 1 }} />
          {group.photos.length > 1 ? (
            <Badge tone="accent">{group.photos.length} → 1 item</Badge>
          ) : (
            <Badge tone="quiet">1 photo</Badge>
          )}
        </div>

        {/* Raw capture metadata ONLY. Staging is a PRE-Vision surface, so no
            item names, makes or models -- and `group.reason` off this backend
            carries exactly those, so it is deliberately not rendered here.
            The design prints filenames and "2 photos - 4s apart" in these two
            slots; StagingPhoto carries neither `filename` nor `taken_at` yet
            (backend ask 14), so a single-photo set prints NOTHING rather than
            restating the "1 photo" badge one line below it. */}
        {group.photos.length > 1 ? (
          <div className="k-stage-rowfiles">
            {group.photos.length} photos · grouped by capture time
          </div>
        ) : null}

        {group.note ? (
          <button
            type="button"
            className="k-stage-notechip"
            disabled={!editable}
            title={
              editable
                ? group.note_source === 'derived'
                  ? 'Written in the field — edit note'
                  : 'Edit note'
                : 'Sent with these photos when they were processed'
            }
            onClick={editable ? onNote : undefined}
          >
            <Icon d={I.edit} size={10} />
            <span>{group.note}</span>
          </button>
        ) : null}

        {/* Withdrawn, not disabled: excluding a set that is already a line item
            would either do nothing or describe a grouping the worksheet no
            longer follows. `editable` is false once the session is promoted. */}
        {editable ? (
        <div className="k-stageset-acts">
          {!group.note ? (
            <button
              type="button"
              className="k-stage-act"
              disabled={busy}
              onClick={onNote}
              title="Add identification detail sent with these photos"
            >
              <Icon d={I.plus} size={11} /> Note
            </button>
          ) : null}
          {group.photos.length > 1 ? (
            <button
              type="button"
              className="k-stage-act"
              disabled={busy}
              onClick={onSplit}
              title="Split into one set per photo. They stay here, in capture order."
            >
              Split apart
            </button>
          ) : null}
          <button
            type="button"
            className={'k-stage-act' + (isCtx ? ' k-stage-act--on' : '')}
            disabled={busy}
            onClick={onToggleKind}
            title={
              isCtx
                ? 'Put this set back into the run'
                : 'Leave out of processing. The photos stay on the claim but produce no line item.'
            }
          >
            {isCtx ? 'Include' : 'Exclude'}
          </button>
        </div>
        ) : null}
      </div>
    </div>
  )
}

function LooseCard({
  photo,
  selected,
  onToggle,
}: {
  photo: StagingPhoto
  selected: boolean
  onToggle: () => void
}) {
  const { ref, src } = useThumb<HTMLDivElement>(photo.id)
  return (
    <div className={'k-stageset k-stageset--loose' + (selected ? ' k-stageset--sel' : '')}>
      <div className="k-stageset-media" ref={ref}>
        <span className="k-stageset-frame">
          {src ? (
            <img src={src} alt="" style={FILL_IMG} loading="lazy" decoding="async" />
          ) : (
            <span className="k-stageset-skel" />
          )}
        </span>
        <button
          type="button"
          className="k-stage-check k-stage-check--float"
          data-on={selected || undefined}
          aria-label="Select photo"
          onClick={onToggle}
        >
          {selected ? <Icon d={I.check} size={12} /> : null}
        </button>
      </div>
      <div className="k-stageset-body">
        <div className="k-stage-rowhd">
          <span className="k-stage-rowt">Loose photo</span>
          <div style={{ flex: 1 }} />
          <Badge tone="warn">Not in a set</Badge>
        </div>
        <div className="k-stage-rowfiles">Arrived after grouping ran</div>
        {photo.note ? <div className="k-stage-rowreason">{photo.note}</div> : null}
      </div>
    </div>
  )
}

function StageNoteEditor({
  group,
  title,
  saving,
  onClose,
  onSave,
}: {
  group: StagingGroup
  title: string
  saving: boolean
  onClose: () => void
  onSave: (text: string | null) => void
}) {
  // Branch on note_source, NEVER on the text: a derived summary is read-only
  // context; the adjuster's own sentence is the one editable slot.
  const derived = group.note_source === 'derived'
  const [text, setText] = useState(derived ? '' : (group.note ?? ''))
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])

  const commit = () => onSave(text.trim().slice(0, NOTE_MAX) || null)
  const left = NOTE_MAX - text.length

  return (
    <div className="k-stage-noteover" onClick={onClose}>
      <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
        <div className="k-notemodal-hd">
          <div>
            <div className="k-notemodal-t">Additional identification</div>
            <div className="k-notemodal-s">
              {title} · {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'} · one
              item
            </div>
          </div>
          <button type="button" className="k-icon-btn" aria-label="Close" onClick={onClose}>
            <Icon d={I.close} size={15} />
          </button>
        </div>

        <div className="k-notemodal-body">
          <p className="k-notemodal-lede">
            Tell Kevin what it is looking at. On a set Kevin could not identify, this becomes the
            search query — it helps identify the item and never affects the price.
          </p>

          {derived && group.note ? (
            <div className="k-notemodal-derived">
              <span className="k-notemodal-derived-l">From the field notes on these photos</span>
              <span className="k-notemodal-derived-b">{group.note}</span>
              {/(…|\.\.\.)$/.test(group.note) ? (
                <span
                  className="k-notemodal-derived-l"
                  style={{ textTransform: 'none', letterSpacing: 0 }}
                >
                  Summary truncated — the full notes are on each photo.
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="k-notemodal-field">
            <textarea
              ref={ref}
              className="k-notemodal-area"
              value={text}
              maxLength={NOTE_MAX}
              placeholder="Anything that helps identify this item"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit()
                if (e.key === 'Escape') onClose()
              }}
            />
            <span className={'k-notemodal-count' + (left < 20 ? ' k-notemodal-count--near' : '')}>
              {left}
            </span>
          </div>
        </div>

        <div className="k-notemodal-ft">
          {group.note && !derived ? (
            <button
              type="button"
              className="k-stage-act k-stage-act--danger"
              title="The summary from the photo notes comes back"
              onClick={() => onSave(null)}
            >
              Remove note
            </button>
          ) : (
            <span />
          )}
          <div style={{ flex: 1 }} />
          <span className="k-notemodal-kbd">⌘↵</span>
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="k-btn" disabled={saving || !text.trim()} onClick={commit}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Lightbox({
  group,
  title,
  i,
  onIndex,
  onClose,
}: {
  group: StagingGroup
  title: string
  i: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const photo = group.photos[i]
  const { ref, src } = useThumb<HTMLDivElement>(photo.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && i > 0) onIndex(i - 1)
      if (e.key === 'ArrowRight' && i < group.photos.length - 1) onIndex(i + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, group.photos.length, onIndex])

  return (
    <div className="k-stage-noteover" onClick={onClose}>
      <div className="k-stage-lb" onClick={(e) => e.stopPropagation()}>
        <div className="k-stage-lb-hd">
          <span className="k-stage-rowt">{title}</span>
          {photo.room ? <span className="k-stage-rowtime">{photo.room}</span> : null}
          <div style={{ flex: 1 }} />
          <span className="k-stage-rowtime">
            {i + 1} of {group.photos.length}
          </span>
          <button type="button" className="k-icon-btn" title="Close" onClick={onClose}>
            <Icon d={I.close} size={14} />
          </button>
        </div>

        <div className="k-stage-lb-img" ref={ref}>
          {src ? (
            <img src={src} alt="Raw capture" style={{ ...FILL_IMG, objectFit: 'contain' }} />
          ) : (
            <span className="k-stageset-skel" />
          )}
          {group.photos.length > 1 ? (
            <>
              <button
                type="button"
                className="k-lb-nav k-lb-nav--prev"
                title="Previous photo"
                disabled={i === 0}
                onClick={() => onIndex(i - 1)}
              >
                <Icon d={I.chevleft} size={20} />
              </button>
              <button
                type="button"
                className="k-lb-nav k-lb-nav--next"
                title="Next photo"
                disabled={i >= group.photos.length - 1}
                onClick={() => onIndex(i + 1)}
              >
                <Icon d={I.chevright} size={20} />
              </button>
            </>
          ) : null}
        </div>

        <div className="k-stage-lb-ft">
          Nothing has been identified yet — this is the raw capture.{' '}
          {group.photos.length > 1
            ? `All ${group.photos.length} frames in this set become one line item.`
            : 'This set becomes one line item.'}
          {photo.note ? ` · ${photo.note}` : ''}
        </div>
      </div>
    </div>
  )
}
