import { useRef, useState } from 'react'
import { I, Icon } from './Icon'
import { ApiError } from '../lib/api'
import { startStagingSession, uploadStagingPhotos } from '../lib/mutations'
import type { StagingUploadAck } from '../lib/mutations'
import {
  ACCEPT_TYPES,
  REJECT_COPY,
  planUploadChunks,
  reconciles,
  splitChunk,
  tallyUpload,
} from '../lib/upload'
import type { Rejection, RejectReason, UploadTally } from '../lib/upload'
import { fmtInt } from '../lib/format'

/**
 * One adjuster action, many requests.
 *
 * The adjuster selects the whole folder and clicks once; this chunks it, sends
 * the chunks against a single session, and reconciles every ack. A chunk that
 * 413s is halved and retried alone rather than failing the drop.
 */
export default function PhotoUpload({ claimId }: { claimId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [room, setRoom] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [tally, setTally] = useState<UploadTally | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shortAcks, setShortAcks] = useState(0)

  const send = async (files: File[]) => {
    setBusy(true)
    setError(null)
    setTally(null)
    setShortAcks(0)

    try {
      // Idempotent -- a re-click or a flaky-wifi retry never spawns duplicates.
      await startStagingSession(claimId)

      const queue = planUploadChunks(files)
      setProgress({ done: 0, total: files.length })

      const acks: StagingUploadAck[] = []
      let sent = 0
      let short = 0

      while (queue.length) {
        const chunk = queue.shift() as File[]
        try {
          const ack = await uploadStagingPhotos(claimId, chunk, room)
          acks.push(ack)
          // uploaded + rejected must equal what we sent. A short ack means a
          // photo went missing without being reported -- surfaced, never
          // averaged away.
          if (!reconciles(chunk.length, ack)) short += 1
          sent += chunk.length
          setProgress({ done: sent, total: files.length })
        } catch (err) {
          if (err instanceof ApiError && err.status === 413 && chunk.length > 1) {
            // Too big for the gateway: halve it and retry the halves alone.
            queue.unshift(...splitChunk(chunk))
            continue
          }
          throw err
        }
      }

      setShortAcks(short)
      setTally(tallyUpload(acks))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Upload failed — HTTP ${err.status}: ${String(err.detail)}`
          : 'Upload failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="k-upload">
      <div className="k-upload-row">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          style={{ display: 'none' }}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = ''
            if (files.length) void send(files)
          }}
        />
        <button
          type="button"
          className="k-btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Icon d={I.camera} size={12} /> {busy ? 'Uploading…' : 'Select photos'}
        </button>

        <div style={{ width: 240 }}>
          <label className="k-ifield-label">Room (optional)</label>
          <div className="k-ifield">
            <input
              value={room}
              placeholder="Master Bedroom"
              onChange={(e) => setRoom(e.target.value)}
              style={{ border: 0, outline: 0, background: 'transparent', flex: 1, font: 'inherit', fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      <p className="k-ifield-hint">
        Tags every photo in this batch and rides to the worksheet&rsquo;s Room / Area column. Two
        rooms means two selections — set it, pick that room&rsquo;s photos, then repeat.
      </p>

      {busy ? (
        <div className="k-upload-progress">
          <div className="k-progress">
            <div className="k-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="k-claim-sub">
            {fmtInt(progress.done)} of {fmtInt(progress.total)} sent
          </span>
        </div>
      ) : null}

      {error ? <p className="k-error">{error}</p> : null}

      {tally ? <UploadResult tally={tally} shortAcks={shortAcks} /> : null}
    </div>
  )
}

function UploadResult({ tally, shortAcks }: { tally: UploadTally; shortAcks: number }) {
  return (
    <div className="k-upload-result">
      <div className="k-upload-stored">
        <Icon d={I.check} size={13} stroke={2.5} /> {fmtInt(tally.stored)} photo
        {tally.stored === 1 ? '' : 's'} on the claim
      </div>

      {/* Quiet by design: this is how iOS .AAE edit-sidecars arrive. Alarming
          someone over invisible OS files whose shoot was fine is a bug. */}
      {tally.quiet.length ? (
        <p className="k-ifield-hint">
          {fmtInt(tally.quiet.length)} non-image file{tally.quiet.length === 1 ? '' : 's'} skipped
          (phone edit sidecars) — nothing missing from your shoot.
        </p>
      ) : null}

      {tally.autoRetry.length ? (
        <p className="k-ifield-hint">
          {fmtInt(tally.autoRetry.length)} hit a storage hiccup — Kevin retries these
          automatically.
        </p>
      ) : null}

      {tally.failed.length ? (
        <div className="k-reject">
          <div className="k-reject-hd">
            <span className="k-reject-t">
              {fmtInt(tally.failed.length)} photo{tally.failed.length === 1 ? '' : 's'} could not
              be added
            </span>
          </div>
          {tally.failed.map((rejection, index) => (
            <RejectRow key={`${rejection.filename}-${index}`} rejection={rejection} />
          ))}
        </div>
      ) : null}

      {shortAcks ? (
        <p className="k-error">
          {fmtInt(shortAcks)} batch{shortAcks === 1 ? '' : 'es'} returned fewer results than files
          sent. Re-select the folder — re-sending is safe, already-stored photos come back as
          duplicates.
        </p>
      ) : null}
    </div>
  )
}

function RejectRow({ rejection }: { rejection: Rejection }) {
  const copy = REJECT_COPY[rejection.reason as RejectReason]
  return (
    <div className="k-reject-row">
      <span className="k-reject-why">
        {copy ? copy.text(rejection.filename, rejection.detail) : rejection.filename}
      </span>
      {/* detail is prose for display -- never branched on. */}
      {!copy && rejection.detail ? <span className="k-claim-sub">{rejection.detail}</span> : null}
    </div>
  )
}
