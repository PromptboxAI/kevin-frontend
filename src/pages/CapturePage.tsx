import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { I, Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import CaptureReview from '../components/CaptureReview'
import {
  captureNote,
  captureRoom,
  captureUpload,
  clearCredential,
  loadCredential,
} from '../lib/capture'
import {
  CAPTURE_FAILURE_COPY,
  NOTE_MAX,
  batchByRoom,
  clampNote,
  closeWarning,
  failureFor,
  notesToWrite,
  offlineBanner,
  queueStatus,
  retryDelayMs,
  safeToLeave,
  shouldAutoRetry,
  tallyQueue,
} from '../lib/capture-rules'
import type { Shot } from '../lib/capture-rules'
import { REJECT_COPY } from '../lib/upload'
import type { RejectReason } from '../lib/upload'
import type { CaptureToken } from '../lib/pair-rules'
import {
  bumpAttempts,
  dropPending,
  loadPending,
  patchPending,
  savePending,
} from '../lib/capture-store'

/**
 * Screen 11 — the phone, shooting.
 *
 * WHAT IS DELIBERATELY NOT PORTED, and why. The design draws a camera app: a
 * live viewfinder with a reticle, a flash toggle, a SCAN BARCODE mode, and an
 * "Offline — Kevin is queueing photos locally" banner. On a real device:
 *
 *   The viewfinder would be `getUserMedia`, which gives a downscaled video
 *   frame. `<input capture="environment">` opens the phone's OWN camera app and
 *   returns the full-resolution file with its EXIF intact — and EXIF timestamps
 *   are what the clusterer groups photos by. A prettier viewfinder that costs
 *   the clustering signal is a bad trade.
 *
 *   Flash/torch only exists with a live media stream, so it goes with it.
 *   BarcodeDetector is Chrome-only; a mode button that silently does nothing on
 *   iPhone is worse than no button.
 *
 *   Offline queueing is real work — a service worker and IndexedDB — and is not
 *   built. So there is no banner claiming it. A phone that says "queued
 *   locally" over a photo held only in a tab that is about to be evicted costs
 *   someone a second trip to the property.
 *
 * What IS here is the honest core: shoot, tag the room, note the item, and see
 * — truthfully — whether it is safe to walk away.
 */
export default function CapturePage() {
  const [cred, setCred] = useState<CaptureToken | null>(() => loadCredential())
  const [shots, setShots] = useState<Shot[]>([])
  const [room, setRoom] = useState<string | null>(null)
  const [roomSheet, setRoomSheet] = useState(false)
  const [roomDraft, setRoomDraft] = useState('')
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [failure, setFailure] = useState<string | null>(null)
  const [rejected, setRejected] = useState<{ filename: string; text: string }[]>([])
  const [reviewing, setReviewing] = useState(false)
  /** When set, the room sheet is fixing ONE stored photo rather than the batch. */
  const [roomFor, setRoomFor] = useState<string | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)
  const fileRef = useRef<HTMLInputElement>(null)

  const tally = tallyQueue(shots)
  /** Only what is still ONLY on this phone -- stored photos are on the claim. */
  const pendingShots = shots.filter((s) => s.state !== 'stored')
  const banner = offlineBanner({
    online,
    pending: pendingShots.length,
    pendingBytes: pendingShots.reduce((n, s) => n + s.size, 0),
  })

  /** Object URLs are a leak if the page lives as long as a walk-through does. */
  useEffect(
    () => () => {
      for (const s of shots) URL.revokeObjectURL(s.preview)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /**
   * Resume the moment signal returns.
   *
   * This is the retry that matters, and the reason the feature works without
   * Background Sync: someone walks out of the basement and the queue drains
   * itself, with no tap and no thought.
   */
  useEffect(() => {
    const up = () => {
      setOnline(true)
      setShots((prev) => {
        const waiting = prev.filter((s) => s.state === 'failed' || s.state === 'queued')
        if (waiting.length) void send(waiting.map((s) => ({ ...s, state: 'queued' as const })))
        return prev
      })
    }
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cred?.claim_id])

  /** Timers must not outlive the screen. */
  useEffect(
    () => () => {
      for (const t of timers.current.values()) clearTimeout(t)
    },
    [],
  )

  /**
   * Warn before leaving with anything unsent.
   *
   * The one moment this app can actually save someone a return trip.
   */
  useEffect(() => {
    if (safeToLeave(tally)) return
    // Closing is the one action that genuinely strands photos: they survive a
    // reload, but nothing uploads while the screen is shut.
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [tally])

  /**
   * The bytes, keyed by shot.
   *
   * A ref, not state: replacing this map must never re-render, and the upload
   * loop reads it after awaits where a state snapshot would be stale.
   * Populated when a photo is taken and when a queue is recovered from
   * IndexedDB, so `send` never cares which it was.
   */
  const blobs = useRef(new Map<string, Blob>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  /**
   * Recover anything this phone still owes the claim.
   *
   * Photos that never uploaded survive a reload, a crash and a lock screen --
   * which is the whole point: 40 photos queued in a basement are otherwise one
   * accidental navigation away from a second trip to the property.
   */
  useEffect(() => {
    if (!cred) return
    let alive = true
    void (async () => {
      const pending = await loadPending(cred.claim_id)
      if (!alive || pending.length === 0) return
      const recovered: Shot[] = pending.map((p) => {
        blobs.current.set(p.key, p.blob)
        return {
          key: p.key,
          name: p.name,
          size: p.size,
          preview: URL.createObjectURL(p.blob),
          room: p.room,
          note: p.note,
          takenAt: p.takenAt,
          state: 'queued' as const,
          attempts: p.attempts,
        }
      })
      setShots((prev) => {
        const known = new Set(prev.map((s) => s.key))
        return [...prev, ...recovered.filter((s) => !known.has(s.key))]
      })
      void send(recovered)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cred?.claim_id])

  if (!cred) {
    return (
      <div className="k-cap-shell">
        <div className="k-cap-pair">
          <div className="k-cap-brand">
            Kevin<span>.</span>
          </div>
          <h1 className="k-cap-h1">This phone isn’t paired</h1>
          <p className="k-cap-sub">
            Open the claim on the computer, choose <strong>From phone</strong>,
            and scan the code it shows.
          </p>
          <Link className="k-cap-primary" to="/pair" style={{ textDecoration: 'none' }}>
            Enter a code
          </Link>
        </div>
      </div>
    )
  }

  const add = (files: FileList | null) => {
    if (!files?.length || !cred) return
    const picked = [...files]
    const next: Shot[] = picked.map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      // Snapshot the room AT CAPTURE. Changing rooms later must not retag a
      // photo already taken under the old one.
      room,
      note: '',
      state: 'queued' as const,
      takenAt: file.lastModified,
      attempts: 0,
    }))

    // PERSIST FIRST, upload second. If the app dies between the two the photo
    // is still on the phone; the other order loses it.
    next.forEach((shot, i) => {
      const file = picked[i]
      blobs.current.set(shot.key, file)
      void savePending({
        key: shot.key,
        claimId: cred.claim_id,
        name: shot.name,
        type: file.type,
        size: shot.size,
        room: shot.room,
        note: '',
        takenAt: shot.takenAt,
        attempts: 0,
        blob: file,
      })
    })

    setShots((prev) => [...prev, ...next])
    void send(next)
  }

  /**
   * Upload, one batch per room.
   *
   * Sequential rather than parallel: this is a phone on site data, and four
   * concurrent multipart posts on a weak signal fail more often than they
   * finish. Bytes come from the blob map, so a recovered queue and a freshly
   * shot photo travel the identical path.
   */
  const send = async (queued: Shot[]) => {
    if (!cred) return
    setFailure(null)

    for (const batch of batchByRoom(queued)) {
      const usable = batch.shots.filter((s) => blobs.current.has(s.key))
      if (!usable.length) continue
      const keys = new Set(usable.map((s) => s.key))
      setShots((prev) => prev.map((s) => (keys.has(s.key) ? { ...s, state: 'uploading' } : s)))

      try {
        const ack = await captureUpload(
          cred,
          usable.map((s) => {
            const blob = blobs.current.get(s.key) as Blob
            // KEEP THE TYPE. `new File([blob], name)` defaults to '', and a
            // recovered photo sent with no content type is rejected as
            // `unsupported_format` -- which is how a whole basement's worth of
            // photos got marked stored and deleted while the server held none.
            return new File([blob], s.name, { type: blob.type || 'image/jpeg' })
          }),
          batch.room,
        )

        // Rejections are never silent (rule 21) -- but a duplicate is a
        // SUCCESS, and an .AAE sidecar is quiet. REJECT_COPY owns that split.
        const loud: { filename: string; text: string }[] = []
        for (const r of ack.rejected ?? []) {
          const copy = REJECT_COPY[r.reason as RejectReason]
          if (!copy || (!copy.stored && !copy.quiet)) {
            loud.push({
              filename: r.filename,
              text: copy ? copy.text(r.filename, r.detail) : r.reason,
            })
          }
        }
        if (loud.length) setRejected((prev) => [...prev, ...loud])

        /**
         * Pair ids to shots BEFORE touching state. This was a counter
         * incremented inside the updater, which React may invoke more than
         * once -- it ran past the end of `photo_ids` and every shot got
         * `undefined`, so notes silently never saved.
         */
        /**
         * Believe the ACK, not the status code.
         *
         * A 202 means the request was accepted, NOT that the photos were.
         * Marking everything stored on a 2xx -- and then deleting the local
         * copy -- destroyed a queue the server had rejected outright. The ack
         * names every file that did not make it, so only the ones it did are
         * treated as safe.
         */
        const refused = new Map(
          (ack.rejected ?? []).map((r) => [r.filename, r.reason as RejectReason]),
        )
        const landed = usable.filter((s) => {
          const reason = refused.get(s.name)
          // A duplicate IS on the server already (rule 21): a success.
          return reason === undefined || REJECT_COPY[reason]?.stored === true
        })
        const ids = ack.photo_ids ?? []
        const assigned = new Map(landed.map((s, i) => [s.key, ids[i]]))
        const landedKeys = new Set(landed.map((s) => s.key))

        setShots((prev) =>
          prev.map((s) => {
            if (!keys.has(s.key)) return s
            if (landedKeys.has(s.key)) {
              return { ...s, state: 'stored', photoId: assigned.get(s.key) }
            }
            // Refused: it is NOT on the claim, so it stays on the phone.
            return { ...s, state: 'failed', error: refused.get(s.name) }
          }),
        )
        // Only what actually landed stops being carried.
        for (const s of landed) {
          blobs.current.delete(s.key)
          void dropPending(s.key)
        }
      } catch (error) {
        const status = error instanceof ApiError ? error.status : undefined
        const kind = failureFor(status)
        setFailure(CAPTURE_FAILURE_COPY[kind])
        if (kind === 'expired') {
          clearCredential()
          setCred(null)
        }
        for (const shot of usable) {
          const attempts = await bumpAttempts(shot.key)
          setShots((prev) =>
            prev.map((s) =>
              s.key === shot.key ? { ...s, state: 'failed', error: kind, attempts } : s,
            ),
          )
          if (shouldAutoRetry(kind, attempts)) scheduleRetry(shot.key, attempts)
        }
      }
    }
  }

  /**
   * Try one shot again, later.
   *
   * Backoff climbs to a 30s ceiling: a phone with one bar should not re-push a
   * 4 MB upload every second, but a walk-through lasts an hour, so it must not
   * back off into never either.
   */
  const scheduleRetry = (key: string, attempts: number) => {
    clearTimeout(timers.current.get(key))
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key)
        setShots((prev) => {
          const shot = prev.find((s) => s.key === key)
          if (shot && blobs.current.has(key)) void send([{ ...shot, state: 'queued' }])
          return prev
        })
      }, retryDelayMs(attempts)),
    )
  }

  /** Notes are a second call, and only for shots that have one. */
  const flushNotes = async (current: Shot[]) => {
    if (!cred) return
    let failed = 0
    for (const { photoId, note } of notesToWrite(current)) {
      try {
        await captureNote(cred, photoId, note)
      } catch {
        failed += 1
      }
    }
    if (failed > 0) {
      setFailure(
        `${failed} note${failed === 1 ? '' : 's'} did not save. The photo${
          failed === 1 ? '' : 's'
        } uploaded — reopen the note and save again.`,
      )
    }
  }

  const saveNote = () => {
    if (!noteFor) return
    const text = clampNote(noteDraft)
    const next = shots.map((s) => (s.key === noteFor ? { ...s, note: text } : s))
    setShots(next)
    // Keep it with the bytes: a note typed offline must survive the reload too.
    void patchPending(noteFor, { note: text })
    setNoteFor(null)
    void flushNotes(next)
  }

  /**
   * Retag ONE photo.
   *
   * Stored: writes the server first, then the row -- a row reading "Basement"
   * over a photo still tagged nothing is the lie review exists to remove.
   * Still pending: there is no server row yet, so it updates the local record
   * and the room rides the upload when it finally goes.
   */
  const applyRoom = async (key: string, next: string | null) => {
    const shot = shots.find((s) => s.key === key)
    if (!shot) return
    if (shot.photoId == null) {
      void patchPending(key, { room: next })
      setShots((prev) => prev.map((s) => (s.key === key ? { ...s, room: next } : s)))
      return
    }
    if (!cred) return
    try {
      await captureRoom(cred, shot.photoId, next)
      setShots((prev) => prev.map((s) => (s.key === key ? { ...s, room: next } : s)))
    } catch {
      setFailure('That room did not save. The photo is safe — try again.')
    }
  }

  /** A real retry now: the bytes are still here, so it re-sends them. */
  const retry = (shot: Shot) => {
    if (!blobs.current.has(shot.key)) {
      // Nothing left to send -- already uploaded, or from a session before the
      // photo was persisted. Re-open the camera rather than pretend.
      setShots((prev) => prev.filter((s) => s.key !== shot.key))
      URL.revokeObjectURL(shot.preview)
      fileRef.current?.click()
      return
    }
    setShots((prev) => prev.map((s) => (s.key === shot.key ? { ...s, state: 'queued' } : s)))
    void send([{ ...shot, state: 'queued' }])
  }

  /**
   * The two bottom sheets, shared by the camera and review.
   *
   * Review reuses them rather than growing its own: the room sheet is
   * the same question in both places, and a second copy would drift.
   * `roomFor` is what tells it whether it is setting the batch room or
   * fixing one already-stored photo.
   */
  const sheets = (
    <>
  {roomSheet ? (
    <div className="k-cap-sheet-wrap" onClick={() => setRoomSheet(false)}>
      <div className="k-cap-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="k-cap-sheet-hd">Which room are you shooting?</div>
        <input
          className="k-cap-input"
          autoFocus
          value={roomDraft}
          onChange={(e) => setRoomDraft(e.target.value)}
          placeholder="e.g. Kitchen"
        />
        <div className="k-cap-chips">
          {['Kitchen', 'Living room', 'Master bedroom', 'Garage', 'Basement'].map((r) => (
            <button key={r} type="button" className="k-chip" onClick={() => setRoomDraft(r)}>
              {r}
            </button>
          ))}
        </div>
        <p className="k-cap-hint">
          The room tags the photos you take next, and lands in the
          worksheet’s Room/Area column. Changing it doesn’t retag what you
          already shot.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {room ? (
            <button
              type="button"
              className="k-cap-secondary"
              onClick={() => {
                setRoom(null)
                setRoomSheet(false)
              }}
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            className="k-cap-primary"
            onClick={() => {
              const next = roomDraft.trim() || null
              if (roomFor) applyRoom(roomFor, next)
              else setRoom(next)
              setRoomFor(null)
              setRoomSheet(false)
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  ) : null}

  {noteFor ? (
    <div className="k-cap-sheet-wrap" onClick={() => setNoteFor(null)}>
      <div className="k-cap-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="k-cap-sheet-hd">Additional identification</div>
        <textarea
          className="k-cap-input"
          autoFocus
          rows={3}
          maxLength={NOTE_MAX}
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="e.g. Ashley Trinell 6-drawer dresser"
        />
        <p className="k-cap-hint">
          {NOTE_MAX - noteDraft.length} left. This travels with the photo and
          helps identify the item — it never sets a price.
        </p>
        <button type="button" className="k-cap-primary" onClick={saveNote}>
          Save
        </button>
      </div>
    </div>
  ) : null}
    </>
  )

  if (reviewing) {
    return (
      <>
        <CaptureReview
          shots={shots}
          onBack={() => setReviewing(false)}
          onEditNote={(key) => {
            setNoteFor(key)
            setNoteDraft(shots.find((s) => s.key === key)?.note ?? '')
          }}
          onFixRoom={(key) => {
            setRoomFor(key)
            setRoomDraft(shots.find((s) => s.key === key)?.room ?? '')
            setRoomSheet(true)
          }}
          onRetry={(shot) => {
            setReviewing(false)
            retry(shot)
          }}
        />
        {sheets}
      </>
    )
  }

  return (
    <div className="k-cap-shell">
      <header className="k-cap-top">
        <div style={{ minWidth: 0 }}>
          <div className="k-cap-claim">{cred.claim_id}</div>
          <div className="k-cap-status">{queueStatus(tally)}</div>
        </div>
        <button
          type="button"
          className={`k-cap-room ${room ? 'k-cap-room--on' : ''}`}
          onClick={() => {
            setRoomDraft(room ?? '')
            setRoomSheet(true)
          }}
        >
          <Icon d={I.box} size={12} /> {room ?? 'Set room'}
        </button>
      </header>

      {banner ? (
        <div className="k-cap-alert">
          <Icon d={online ? I.clock : I.info} size={14} />
          <span>{banner}</span>
        </div>
      ) : null}

      {failure ? (
        <div className="k-cap-alert">
          <Icon d={I.info} size={14} />
          <span>{failure}</span>
        </div>
      ) : null}

      {rejected.length ? (
        <div className="k-cap-alert">
          <Icon d={I.info} size={14} />
          <span>
            {rejected.length === 1
              ? '1 photo was not accepted'
              : `${rejected.length} photos were not accepted`}
            : {rejected.map((r) => r.text).join(' · ')}
          </span>
        </div>
      ) : null}

      <div className="k-cap-grid">
        {shots.length === 0 ? (
          <p className="k-cap-empty">
            Shoot one item at a time. Get the whole item in frame, then a second
            shot of its model sticker if it has one.
          </p>
        ) : null}

        {shots.map((shot) => (
          <div key={shot.key} className={`k-cap-shot k-cap-shot--${shot.state}`}>
            <img src={shot.preview} alt="" />
            <div className="k-cap-shot-foot">
              {shot.state === 'failed' ? (
                <button type="button" className="k-cap-retry" onClick={() => retry(shot)}>
                  Retry
                </button>
              ) : (
                <button
                  type="button"
                  className="k-cap-note"
                  onClick={() => {
                    setNoteFor(shot.key)
                    setNoteDraft(shot.note)
                  }}
                >
                  {shot.note ? shot.note : shot.state === 'stored' ? 'Add detail' : 'Sending…'}
                </button>
              )}
            </div>
            {shot.room ? <span className="k-cap-shot-room">{shot.room}</span> : null}
          </div>
        ))}
      </div>

      <div className="k-cap-controls">
        {/* The phone's OWN camera: full resolution, EXIF intact -- which is what
            the clusterer groups on. `multiple` so a burst can be picked from
            the roll in one go. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            add(e.target.files)
            e.target.value = ''
          }}
        />
        <button type="button" className="k-cap-shutter" onClick={() => fileRef.current?.click()}>
          <Icon d={I.camera} size={22} />
        </button>
        <div className="k-cap-safe">
          {safeToLeave(tally)
            ? tally.stored > 0
              ? 'All uploaded — safe to leave.'
              : ''
            : (closeWarning(pendingShots.length) ??
              'Stay on this screen until everything has sent.')}
        </div>
        {shots.length > 0 ? (
          <button type="button" className="k-cap-reviewlink" onClick={() => setReviewing(true)}>
            Review {shots.length} photo{shots.length === 1 ? '' : 's'} →
          </button>
        ) : null}
      </div>

      {sheets}
    </div>
  )
}
