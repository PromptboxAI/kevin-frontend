import { useMemo, useRef, useState } from 'react'
import Badge from './Badge'
import { I, Icon } from './Icon'
import { ApiError } from '../lib/api'
import { fmtInt } from '../lib/format'
import { startStagingSession, uploadStagingPhotos } from '../lib/mutations'
import {
  ACCEPT_TYPES,
  CHUNK_FILES,
  REJECT_COPY,
  planUploadChunks,
  reconciles,
  splitChunk,
} from '../lib/upload'
import type { RejectReason } from '../lib/upload'
import { expandZip, keepPhotos } from '../lib/zip'
import type { ZipProgress } from '../lib/zip'

const MAX_PHOTO_MB = 15

type RowStatus = 'queued' | 'up' | 'done' | 'dup' | 'skip' | 'fail'
type Row = { file: File; status: RowStatus; pct: number; why?: string }

const fmtMB = (bytes: number) =>
  bytes >= 1073741824
    ? `${(bytes / 1073741824).toFixed(2)} GB`
    : `${(bytes / 1048576).toFixed(1)} MB`

/**
 * One adjuster action, many requests.
 *
 * The adjuster selects the whole folder and clicks once; this chunks it, sends
 * the chunks against a single session, and reconciles every ack. A chunk that
 * 413s is halved and retried alone rather than failing the drop.
 *
 * Every number on screen is derived from the real FileList and the real chunk
 * responses. The design's queue carries seed literals for its counts, GB
 * readout and batch pill -- those are deliberately NOT ported.
 */
export default function PhotoUpload({
  claimId,
  lockedReason,
  onStaged,
}: {
  claimId: string | null
  lockedReason?: string
  onStaged?: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const zipRef = useRef<HTMLInputElement>(null)

  const [room, setRoom] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  /** Locally-dropped OS junk -- reported, never as a failure. */
  const [junk, setJunk] = useState(0)
  const [expanding, setExpanding] = useState<ZipProgress | null>(null)
  const [zipError, setZipError] = useState<string | null>(null)

  const [sending, setSending] = useState(false)
  const [chunk, setChunk] = useState<{ index: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shortAcks, setShortAcks] = useState(0)
  const [done, setDone] = useState(false)
  /** Pause finishes the batch in flight, then stops before the next one. */
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)

  const locked = claimId === null

  const sendable = useMemo(
    () => rows.filter((r) => r.status !== 'fail' && r.status !== 'skip'),
    [rows],
  )
  const skipped = rows.filter((r) => r.status === 'skip')
  const sentCount = rows.filter((r) => r.status === 'done' || r.status === 'dup').length
  const oversize = rows.filter((r) => r.status === 'fail')
  const totalBytes = sendable.reduce((a, r) => a + r.file.size, 0)
  const sentBytes = rows
    .filter((r) => r.status === 'done' || r.status === 'dup')
    .reduce((a, r) => a + r.file.size, 0)
  const chunksTotal = useMemo(() => planUploadChunks(sendable.map((r) => r.file)).length, [sendable])
  const pct = sendable.length ? Math.round((sentCount / sendable.length) * 100) : 0

  const take = (files: File[], droppedJunk = 0) => {
    setError(null)
    setDone(false)
    setJunk((j) => j + droppedJunk)
    setRows((prev) => {
      const seen = new Set(prev.map((r) => `${r.file.name}:${r.file.size}`))
      const next = files
        .filter((f) => !seen.has(`${f.name}:${f.size}`))
        .map<Row>((f) => ({
          file: f,
          // Checked before sending so the adjuster is not told mid-upload.
          status: f.size > MAX_PHOTO_MB * 1048576 ? 'fail' : 'queued',
          pct: 0,
          why: f.size > MAX_PHOTO_MB * 1048576 ? `over ${MAX_PHOTO_MB} MB` : undefined,
        }))
      return [...prev, ...next]
    })
  }

  const takeZip = async (file: File) => {
    setZipError(null)
    try {
      const { files, junk: dropped } = await expandZip(file, setExpanding)
      take(files, dropped)
    } catch (e) {
      setZipError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setExpanding(null)
    }
  }

  const mark = (files: File[], status: RowStatus, why?: string) =>
    setRows((prev) =>
      prev.map((r) =>
        files.includes(r.file) ? { ...r, status, pct: status === 'done' ? 100 : r.pct, why } : r,
      ),
    )

  const startUpload = async () => {
    if (!claimId) return
    setSending(true)
    setError(null)
    pausedRef.current = false
    setPaused(false)

    try {
      // Idempotent -- a re-click or a flaky-wifi retry never spawns duplicates.
      await startStagingSession(claimId)

      const queue = planUploadChunks(sendable.map((r) => r.file))
      const total = queue.length
      let index = 0
      let short = 0

      while (queue.length) {
        if (pausedRef.current) break
        const batch = queue.shift() as File[]
        index += 1
        setChunk({ index, total: Math.max(total, index + queue.length) })
        mark(batch, 'up')

        try {
          const ack = await uploadStagingPhotos(claimId, batch, room || undefined)
          // uploaded + rejected must equal what we sent. A short ack means a
          // photo went missing without being reported -- surfaced, never
          // averaged away.
          if (!reconciles(batch.length, ack)) short += 1

          const byName = new Map(batch.map((f) => [f.name, f]))
          const rejected = new Set<File>()
          for (const r of ack.rejected ?? []) {
            const f = byName.get(r.filename)
            if (!f) continue
            rejected.add(f)
            const copy = REJECT_COPY[r.reason as RejectReason]
            // `duplicate` is a SUCCESS reported on the rejection channel: the
            // photo is already stored. `undecodable_image` is QUIET -- that is
            // how iOS .AAE sidecars arrive. Neither reaches the failure panel,
            // and neither may be labelled a failure on its row either.
            if (copy?.stored) mark([f], 'dup')
            else if (copy?.quiet) mark([f], 'skip', 'not a readable image')
            else mark([f], 'fail', r.detail || copy?.text(r.filename, r.detail) || r.reason)
          }
          mark(
            batch.filter((f) => !rejected.has(f)),
            'done',
          )
        } catch (err) {
          // A 413 means the chunk was too big for the gateway: halve it and
          // retry the halves alone rather than failing the drop.
          if (err instanceof ApiError && err.status === 413 && batch.length > 1) {
            queue.unshift(...splitChunk(batch))
            index -= 1
            mark(batch, 'queued')
            continue
          }
          throw err
        }
      }

      setShortAcks(short)
      if (!pausedRef.current) setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Upload failed — HTTP ${err.status}: ${err.message422}`
          : 'Upload failed.',
      )
    } finally {
      setSending(false)
      setChunk(null)
    }
  }

  const clear = () => {
    setRows([])
    setJunk(0)
    setChunk(null)
    setDone(false)
    setShortAcks(0)
    setError(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="k-dropzone"
        onDragOver={(e) => {
          if (locked) return
          e.preventDefault()
          e.currentTarget.classList.add('k-dropzone--over')
        }}
        onDragLeave={(e) => e.currentTarget.classList.remove('k-dropzone--over')}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('k-dropzone--over')
          if (locked) return
          const dropped = [...e.dataTransfer.files]
          const zip = dropped.find((f) => /\.zip$/i.test(f.name))
          if (zip) void takeZip(zip)
          const { kept, junk: dropCount } = keepPhotos(dropped.filter((f) => !/\.zip$/i.test(f.name)))
          if (kept.length || dropCount) take(kept, dropCount)
        }}
        style={locked ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
      >
        <div className="k-dropzone-inner">
          <div className="k-dropzone-icon">
            <Icon d={I.download} size={26} />
          </div>
          <div
            style={{
              fontFamily: 'var(--k-font-display)',
              fontSize: 26,
              letterSpacing: '-0.02em',
              fontWeight: 400,
            }}
          >
            Drop photos, a folder, or a .zip.
          </div>
          <div style={{ fontSize: 13, color: 'var(--k-fg-3)', marginTop: 6 }}>
            Accepts JPG, PNG, HEIC. Max {MAX_PHOTO_MB}&nbsp;MB per photo.
          </div>
          <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 5 }}>
            Select them all at once — Kevin uploads in batches and removes duplicates as they
            arrive.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPT_TYPES}
              style={{ display: 'none' }}
              onChange={(e) => {
                take([...(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
            <input
              ref={folderRef}
              type="file"
              multiple
              /* @ts-expect-error -- non-standard, and the only way to pick a folder */
              webkitdirectory=""
              style={{ display: 'none' }}
              onChange={(e) => {
                const { kept, junk: dropped } = keepPhotos([...(e.target.files ?? [])])
                take(kept, dropped)
                e.target.value = ''
              }}
            />
            <input
              ref={zipRef}
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void takeZip(f)
                e.target.value = ''
              }}
            />
            <button type="button" className="k-btn" onClick={() => fileRef.current?.click()}>
              Choose files
            </button>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              onClick={() => folderRef.current?.click()}
            >
              Choose folder
            </button>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              title="Expanded in your browser — the archive itself is never uploaded"
              onClick={() => zipRef.current?.click()}
            >
              <Icon d={I.box} size={12} /> Upload .zip
            </button>
          </div>
        </div>
        <div className="k-dropzone-ghosts" />
      </div>

      {/* Inert until the claim exists, with the reason as an overlay -- not
          the section replaced by a line of text. */}
      {locked && lockedReason ? (
        // Sits over the disabled BUTTONS, not dead-centre: centring lands it on
        // top of the "Drop photos" headline and both become unreadable.
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 26,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              background: 'var(--k-bg)',
              border: '1px solid var(--k-line)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12.5,
              color: 'var(--k-fg-3)',
              boxShadow: '0 4px 14px oklch(0.2 0.02 250 / 0.10)',
            }}
          >
            {lockedReason}
          </span>
        </div>
      ) : null}

      {rows.length || expanding || zipError ? (
        <div className="k-queue">
          <div className="k-queue-hd">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Upload queue</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
                {done || sending
                  ? `${fmtInt(sentCount)} of ${fmtInt(sendable.length)} uploaded${done ? ' · complete' : ''}`
                  : `${fmtInt(rows.length)} selected · ${fmtInt(chunksTotal)} ${chunksTotal === 1 ? 'batch' : 'batches'} of up to ${CHUNK_FILES}${oversize.length ? ` · ${oversize.length} over the size limit` : ''}`}
              </span>
              {paused ? (
                <span className="k-paused" title="The batch in flight finishes; nothing new is sent">
                  <span className="k-paused-dot" /> Paused
                </span>
              ) : null}
              <span
                className="k-chunk-pill"
                title={`Sent in batches of ${CHUNK_FILES} so a large drop cannot time out`}
              >
                {chunk
                  ? `batch ${chunk.index} of ${chunk.total}`
                  : `${fmtInt(chunksTotal)} ${chunksTotal === 1 ? 'batch' : 'batches'}`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="k-progress" style={{ width: 220 }}>
                <div className="k-progress-bar" style={{ width: `${pct}%` }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 12,
                  color: 'var(--k-fg-3)',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {fmtMB(sentBytes)} / {fmtMB(totalBytes)}
              </span>
              {sending ? (
                <button
                  type="button"
                  className={'k-btn k-btn--ghost' + (paused ? ' k-btn--active' : '')}
                  title={
                    paused
                      ? 'Resume sending the remaining batches'
                      : 'Finish the batch in flight, then stop before the next one'
                  }
                  onClick={() => {
                    pausedRef.current = !pausedRef.current
                    setPaused(pausedRef.current)
                  }}
                >
                  {paused ? 'Resume' : 'Pause all'}
                </button>
              ) : (
                <button type="button" className="k-btn k-btn--ghost" onClick={clear}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {zipError ? (
            <div className="k-reject">
              <div className="k-reject-hd">
                <Icon d={I.warn} size={14} />
                <span className="k-reject-t">That .zip could not be opened</span>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--ghost"
                  onClick={() => setZipError(null)}
                >
                  Dismiss
                </button>
              </div>
              <div className="k-reject-ft">
                {zipError} — try re-creating the archive, or drop the photos in directly.
              </div>
            </div>
          ) : null}

          {expanding ? (
            <div className="k-skipline">
              <Icon d={I.box} size={13} />
              <span>
                Reading <strong style={{ color: 'var(--k-fg-3)' }}>{expanding.name}</strong> in your
                browser
                {expanding.total ? ` — ${expanding.read} of ${expanding.total}` : '…'}. Nothing is
                uploaded until it finishes.
              </span>
            </div>
          ) : null}

          {/* Real failures only. Duplicates are stored and quiet skips are OS
              files -- neither belongs in a red panel. */}
          {oversize.length ? (
            <div className="k-reject">
              <div className="k-reject-hd">
                <Icon d={I.warn} size={14} />
                <span className="k-reject-t">
                  {oversize.length} {oversize.length === 1 ? 'photo' : 'photos'} could not be
                  uploaded
                </span>
                <div style={{ flex: 1 }} />
                {done ? (
                  <button
                    type="button"
                    className="k-btn k-btn--sm k-btn--ghost"
                    onClick={() => {
                      // A 413 halves and retries itself; this control is for the
                      // hard failures the adjuster has since fixed.
                      setRows((prev) =>
                        prev.map((r) => (r.status === 'fail' ? { ...r, status: 'queued' } : r)),
                      )
                      setDone(false)
                    }}
                  >
                    Retry these {oversize.length}
                  </button>
                ) : null}
              </div>
              {oversize.map((r) => (
                <div key={r.file.name} className="k-reject-row">
                  <span className="k-reject-file">{r.file.name}</span>
                  <span className="k-reject-why">{r.why}</span>
                </div>
              ))}
              <div className="k-reject-ft">
                {done
                  ? `These were skipped. The other ${fmtInt(sentCount)} uploaded — remove or replace these and drop them in.`
                  : `These won't be sent. Remove or replace them, or go ahead — the other ${fmtInt(sendable.length)} are ready.`}
              </div>
            </div>
          ) : null}

          {skipped.length || junk ? (
            <div className="k-skipline">
              <Icon d={I.info} size={13} />
              <span>
                {skipped.length + junk} non-image{' '}
                {skipped.length + junk === 1 ? 'file' : 'files'} skipped —{' '}
                <span style={{ fontFamily: 'var(--k-font-mono)' }}>.AAE</span> edit sidecars,{' '}
                <span style={{ fontFamily: 'var(--k-font-mono)' }}>.DS_Store</span> and{' '}
                <span style={{ fontFamily: 'var(--k-font-mono)' }}>__MACOSX</span> entries your
                phone and Mac store alongside photos. Nothing you shot was affected.
              </span>
            </div>
          ) : null}

          {shortAcks ? (
            <div className="k-reject">
              <div className="k-reject-hd">
                <Icon d={I.warn} size={14} />
                <span className="k-reject-t">
                  {shortAcks} {shortAcks === 1 ? 'batch' : 'batches'} came back short
                </span>
              </div>
              <div className="k-reject-ft">
                The server acknowledged fewer photos than were sent and did not say why. Re-select
                the folder — already-stored photos resolve as duplicates, so nothing is doubled.
              </div>
            </div>
          ) : null}

          <div className="k-queue-list">
            {rows.map((r) => (
              <div
                key={`${r.file.name}:${r.file.size}`}
                className={`k-queue-row ${r.status === 'dup' ? 'k-queue-row--dup' : ''}`}
              >
                <Icon d={I.camera} size={14} />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    fontFamily: 'var(--k-font-mono)',
                    color: r.status === 'dup' ? 'var(--k-fg-4)' : 'var(--k-fg-2)',
                    textDecoration: r.status === 'dup' ? 'line-through' : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.file.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--k-font-mono)',
                    fontSize: 11,
                    color: 'var(--k-fg-4)',
                    width: 70,
                    textAlign: 'right',
                  }}
                >
                  {fmtMB(r.file.size)}
                </span>
                <div style={{ width: 210, display: 'flex', justifyContent: 'flex-end' }}>
                  {r.status === 'done' ? (
                    <Badge tone="ok" dot>
                      Hashed · uploaded
                    </Badge>
                  ) : null}
                  {r.status === 'dup' ? (
                    <Badge tone="ok" dot>
                      Already stored
                    </Badge>
                  ) : null}
                  {r.status === 'queued' ? <Badge tone="quiet">Ready to send</Badge> : null}
                  {r.status === 'skip' ? <Badge tone="quiet">{r.why}</Badge> : null}
                  {r.status === 'fail' ? <Badge tone="warn">{r.why}</Badge> : null}
                  {r.status === 'up' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="k-progress" style={{ width: 130 }}>
                        <div className="k-progress-bar" style={{ width: '60%' }} />
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--k-font-mono)',
                          fontSize: 11,
                          color: 'var(--k-fg-3)',
                        }}
                      >
                        sending
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="k-error">{error}</p> : null}

      {/* Sticky bar -- follows the queue so the next step is a thumb-width
          away, not a scroll back to the header. */}
      {rows.length && !locked ? (
        <div className="k-intake-stickybar">
          <div className="k-intake-stickybar-in">
            {sending || done ? (
              <div className="k-upbar-ring" style={{ '--pct': pct } as React.CSSProperties}>
                <span>{pct}%</span>
              </div>
            ) : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-fg)' }}>
                {done
                  ? sentCount === 0
                    ? 'Nothing was stored'
                    : `All ${fmtInt(sentCount)} photos uploaded`
                  : chunk
                    ? `Uploading batch ${chunk.index} of ${chunk.total} · ${fmtInt(CHUNK_FILES)} photos`
                    : sendable.length === 0
                      ? 'Nothing can be sent'
                      : `${fmtInt(sendable.length)} ${sendable.length === 1 ? 'photo' : 'photos'} ready`}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                {done
                  ? sentCount === 0
                    ? `Every photo was rejected — ${fmtInt(skipped.length)} unreadable, ${fmtInt(oversize.length)} over the limit`
                    : 'Kevin is reading them now.'
                  : sending
                    ? `${fmtInt(sentCount)} of ${fmtInt(sendable.length)} sent`
                    : oversize.length
                      ? `${oversize.length} over the size limit won't be sent`
                      : 'Kevin starts as soon as the upload finishes'}
                {junk ? ` · ${junk} non-image skipped` : ''}
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <input
              className="k-input"
              placeholder="Room for this batch (optional)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              disabled={sending}
              title="Rides to the worksheet's Room/Area column. One room per batch."
              style={{ width: 220 }}
            />

            {done && sentCount > 0 ? (
              <button type="button" className="k-btn k-btn--lg" onClick={onStaged}>
                Go to staging →
              </button>
            ) : (
              <button
                type="button"
                className="k-btn k-btn--lg"
                disabled={sending || sendable.length === 0}
                onClick={() => void startUpload()}
              >
                {sending
                  ? 'Uploading…'
                  : sendable.length === 0
                    ? 'Nothing to upload'
                    : `Upload & stage ${fmtInt(sendable.length)} ${sendable.length === 1 ? 'photo' : 'photos'} →`}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
