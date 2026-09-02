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
  failureFor,
  notesToWrite,
  queueStatus,
  safeToLeave,
  tallyQueue,
} from '../lib/capture-rules'
import type { Shot } from '../lib/capture-rules'
import { REJECT_COPY } from '../lib/upload'
import type { RejectReason } from '../lib/upload'
import type { CaptureToken } from '../lib/pair-rules'

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
  const fileRef = useRef<HTMLInputElement>(null)

  const tally = tallyQueue(shots)

  /** Object URLs are a leak if the page lives as long as a walk-through does. */
  useEffect(
    () => () => {
      for (const s of shots) URL.revokeObjectURL(s.preview)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /**
   * Warn before leaving with anything unsent.
   *
   * The one moment this app can actually save someone a return trip.
   */
  useEffect(() => {
    if (safeToLeave(tally)) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [tally])

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
    if (!files?.length) return
    const next: Shot[] = [...files].map((file, i) => ({
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
    }))
    setShots((prev) => [...prev, ...next])
    void send(next, [...files])
  }

  /**
   * Upload, one batch per room, then write the notes.
   *
   * Sequential rather than parallel: this is a phone on site data, and four
   * concurrent multipart posts on a weak signal fail more often than they
   * finish.
   */
  const send = async (queued: Shot[], files: File[]) => {
    const byKey = new Map(queued.map((s, i) => [s.key, files[i]]))
    setFailure(null)

    for (const batch of batchByRoom(queued)) {
      const keys = new Set(batch.shots.map((s) => s.key))
      setShots((prev) => prev.map((s) => (keys.has(s.key) ? { ...s, state: 'uploading' } : s)))

      try {
        const ack = await captureUpload(
          cred,
          batch.shots.map((s) => byKey.get(s.key) as File),
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
         * Pair ids to shots BEFORE touching state.
         *
         * This was a counter incremented inside the setShots updater, which is
         * impure -- React invokes updaters more than once (StrictMode does it
         * deliberately), so the counter ran past the end of `photo_ids` and
         * every shot got `undefined`. Notes then silently never saved, because
         * `notesToWrite` skips a shot with no id. Computed here, the mapping is
         * the same however many times the updater runs.
         */
        const ids = ack.photo_ids ?? []
        const assigned = new Map(batch.shots.map((s, i) => [s.key, ids[i]]))
        setShots((prev) =>
          prev.map((s) =>
            keys.has(s.key) ? { ...s, state: 'stored', photoId: assigned.get(s.key) } : s,
          ),
        )
      } catch (error) {
        const status = error instanceof ApiError ? error.status : undefined
        const kind = failureFor(status)
        setFailure(CAPTURE_FAILURE_COPY[kind])
        // A dead credential is worth clearing: every later attempt would fail
        // the same way, and the fix is a fresh scan.
        if (kind === 'expired') {
          clearCredential()
          setCred(null)
        }
        setShots((prev) =>
          prev.map((s) => (keys.has(s.key) ? { ...s, state: 'failed', error: kind } : s)),
        )
      }
    }
  }

  /**
   * Notes are a second call, and only for shots that have one.
   *
   * A failure here does not block -- the photo is safe, which is the part that
   * matters -- but it is SAID. Swallowing it is what let a silent
   * never-saving note go unnoticed: the adjuster typed that sentence standing
   * in the room, and it is the only thing steering identification on a set
   * Vision cannot name.
   */
  const flushNotes = async (current: Shot[]) => {
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
        `${failed} note${failed === 1 ? '' : 's'} didn’t save. The photo${
          failed === 1 ? '' : 's'
        } uploaded — reopen the note and save again.`,
      )
    }
  }

  const saveNote = () => {
    if (!noteFor) return
    const next = shots.map((s) => (s.key === noteFor ? { ...s, note: clampNote(noteDraft) } : s))
    setShots(next)
    setNoteFor(null)
    void flushNotes(next)
  }

  /**
   * Retag ONE stored photo from review.
   *
   * Writes the server first and only then updates the row: a room that reads
   * "Kitchen" on screen while the photo is still tagged nothing is exactly the
   * lie this screen exists to remove.
   */
  const applyRoom = async (key: string, next: string | null) => {
    const shot = shots.find((s) => s.key === key)
    if (!shot?.photoId) return
    try {
      await captureRoom(cred, shot.photoId, next)
      setShots((prev) => prev.map((s) => (s.key === key ? { ...s, room: next } : s)))
    } catch {
      setFailure('That room didn’t save. The photo is safe — try again.')
    }
  }

  const retry = (shot: Shot) => {
    // The File is gone once the handler returned, so a retry re-opens the
    // camera rather than pretending it can resend bytes it no longer holds.
    setShots((prev) => prev.filter((s) => s.key !== shot.key))
    URL.revokeObjectURL(shot.preview)
    fileRef.current?.click()
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
            {rejected.length} photo{rejected.length === 1 ? '' : 's'} were not
            accepted: {rejected.map((r) => r.text).join(' · ')}
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
            : 'Stay on this screen until everything has sent.'}
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
