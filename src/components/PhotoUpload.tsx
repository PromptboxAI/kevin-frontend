import { useMemo, useRef, useState } from 'react'
import Badge from './Badge'
import { I, Icon } from './Icon'
import { ApiError } from '../lib/api'
import { fmtInt } from '../lib/format'
import { startStagingSession, uploadStagingPhotos } from '../lib/mutations'
import {
  ACCEPT_TYPES,
  MAX_CHUNK_ATTEMPTS,
  REJECT_COPY,
  chunkRetryDelayMs,
  isTransientUploadFailure,
  planUploadChunks,
  reconciles,
  splitChunk,
} from '../lib/upload'
import { hasDirectory, walkEntries } from '../lib/drop-walk'
import type { WalkEntry } from '../lib/drop-walk'
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
  ensureClaim,
  onStaged,
}: {
  claimId: string | null
  lockedReason?: string
  /**
   * Creates the claim on the first Upload when it does not exist yet, and
   * returns its id -- or throws with the words to show. With this set the
   * drop zone is live from the start: an adjuster who clicked New claim has
   * already started one, and a locked zone told them to "create the claim
   * first" with no way to see how.
   */
  ensureClaim?: () => Promise<string>
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
  /** Set while a chunk waits to be retried after a transient failure. */
  const [retrying, setRetrying] = useState<{ attempt: number; of: number } | null>(null)
  const [shortAcks, setShortAcks] = useState(0)
  const [done, setDone] = useState(false)
  /** Pause finishes the batch in flight, then stops before the next one. */
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)

  const locked = claimId === null && !ensureClaim

  const sendable = useMemo(
    () => rows.filter((r) => r.status !== 'fail' && r.status !== 'skip'),
    [rows],
  )
  const skipped = rows.filter((r) => r.status === 'skip')
  /** What the next Upload click sends: rows not yet acknowledged. */
  const pendingCount = rows.filter((r) => r.status === 'queued' || r.status === 'up').length
  const sentCount = rows.filter((r) => r.status === 'done' || r.status === 'dup').length
  const oversize = rows.filter((r) => r.status === 'fail')
  const totalBytes = sendable.reduce((a, r) => a + r.file.size, 0)
  const sentBytes = rows
    .filter((r) => r.status === 'done' || r.status === 'dup')
    .reduce((a, r) => a + r.file.size, 0)
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
    if (!claimId && !ensureClaim) return
    setSending(true)
    setError(null)
    pausedRef.current = false
    setPaused(false)

    let id = claimId
    if (!id) {
      try {
        id = await ensureClaim!()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create the claim.')
        setSending(false)
        return
      }
    }

    try {
      // Idempotent -- a re-click or a flaky-wifi retry never spawns duplicates.
      await startStagingSession(id)

      /**
       * Only rows still PENDING. `sendable` also holds rows already done or
       * duplicate, so after a failure the next click re-posted the whole drop.
       * Safe (claim-wide hashing makes repeats `duplicate`) but hundreds of MB
       * again over site wifi; now a click resumes where the last one stopped.
       */
      const pending = rows.filter((r) => r.status === 'queued' || r.status === 'up')
      const queue = planUploadChunks(pending.map((r) => r.file))

      /** One chunk, retried on transient failures; a 413 is rethrown to be halved. */
      const sendWithRetry = async (batch: File[]) => {
        for (let attempt = 1; ; attempt += 1) {
          try {
            return await uploadStagingPhotos(id, batch, room || undefined)
          } catch (err) {
            // fetch rejects with a TypeError on a network drop: no status.
            const status = err instanceof ApiError ? err.status : undefined
            if (status === 413 || attempt >= MAX_CHUNK_ATTEMPTS || !isTransientUploadFailure(status)) {
              throw err
            }
            setRetrying({ attempt: attempt + 1, of: MAX_CHUNK_ATTEMPTS })
            await new Promise((resolve) =>
              setTimeout(resolve, chunkRetryDelayMs(attempt, err instanceof ApiError ? err.retryAfter : null)),
            )
            setRetrying(null)
          }
        }
      }
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
          const ack = await sendWithRetry(batch)
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
          // Out of tries: back to queued, so the next click sends it again.
          mark(batch, 'queued')
          throw err
        }
      }

      setShortAcks(short)
      if (!pausedRef.current) setDone(true)
    } catch (err) {
      // Photos already acknowledged are safe on the claim; say so, and that a
      // click picks up from here rather than starting over.
      setError(
        err instanceof ApiError
          ? `Upload stopped — HTTP ${err.status}: ${err.message422}. Photos already sent are safe; Upload again continues with the rest.`
          : 'Upload stopped — the connection dropped. Photos already sent are safe; Upload again continues with the rest.',
      )
    } finally {
      setSending(false)
      setChunk(null)
      setRetrying(null)
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
          /**
           * A dropped FOLDER arrives in `files` as one entry -- the folder, not
           * its photos -- so reading `files` alone turned a 300-photo drop into
           * "1 file skipped". Walk the entries instead (drop-walk.ts). They must
           * be taken synchronously, here: the DataTransfer is emptied once this
           * handler returns.
           */
          const entries = [...e.dataTransfer.items].map(
            (it) => (it.webkitGetAsEntry?.() ?? null) as unknown as WalkEntry | null,
          )
          const dropped = [...e.dataTransfer.files]
          const handle = (files: File[]) => {
            const zip = files.find((f) => /\.zip$/i.test(f.name))
            if (zip) void takeZip(zip)
            const { kept, junk: dropCount } = keepPhotos(files.filter((f) => !/\.zip$/i.test(f.name)))
            if (kept.length || dropCount) take(kept, dropCount)
          }
          if (hasDirectory(entries)) {
            const folder = entries.find((en) => en?.isDirectory)
            setExpanding({ name: folder?.name ?? 'the folder', read: 0, total: 0 })
            void walkEntries(entries.filter((en): en is WalkEntry => en !== null))
              .then(({ files, unreadable }) => {
                handle(files)
                if (unreadable) {
                  setError(
                    `${unreadable} file${unreadable === 1 ? '' : 's'} in that folder could not be read — use Choose folder to add ${unreadable === 1 ? 'it' : 'them'}.`,
                  )
                }
              })
              .finally(() => setExpanding(null))
          } else {
            handle(dropped)
          }
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
            Select them all at once — Kevin removes duplicates as they
            arrive.
          </div>

          {/* The OTHER intake path. A total-loss list has no photographs, and
              an adjuster holding one needs to find this here rather than
              discover the app cannot take their file. */}
          {claimId ? (
            <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)', marginTop: 10 }}>
              No photos?{' '}
              <a
                href={`/claims/${claimId}/import`}
                style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Import a typed or exported list
              </a>{' '}
              instead — PDF, CSV or Excel.
            </div>
          ) : null}

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
                  : `${fmtInt(rows.length)} ${rows.length === 1 ? 'photo' : 'photos'} selected${oversize.length ? ` · ${oversize.length} over the size limit` : ''}`}
              </span>
              {paused ? (
                <span className="k-paused" title="Photos already sending finish; nothing new is sent">
                  <span className="k-paused-dot" /> Paused
                </span>
              ) : null}
              {/* No batch count or batch size on screen: chunking is how the
                  upload survives a gateway timeout, not something the adjuster
                  chose, and "1 of 1 · 20 photos" on a one-photo upload read as
                  a miscount. Progress is told in photos. */}
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
                      ? 'Resume sending the remaining photos'
                      : 'Finish the photos already sending, then stop'
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
                  Some photos weren’t confirmed
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
                  : chunk && retrying
                    ? // A transient failure is being retried, not ignored: say so,
                      // or a backoff wait of a few seconds reads as a frozen upload.
                      `Connection hiccup — retrying (try ${retrying.attempt} of ${retrying.of})`
                    : chunk
                      ? `Uploading ${fmtInt(sendable.length)} ${sendable.length === 1 ? 'photo' : 'photos'}`
                      : sendable.length === 0
                        ? 'Nothing can be sent'
                        : sentCount > 0 && pendingCount > 0
                          ? // After a stopped upload: what the next click actually sends.
                            `${fmtInt(pendingCount)} ${pendingCount === 1 ? 'photo' : 'photos'} still to send`
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
              placeholder="Room for these photos (optional)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              disabled={sending}
              title="Fills the worksheet's Room/Area column for every photo in this upload"
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
