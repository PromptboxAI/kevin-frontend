import { I, Icon } from './Icon'
import {
  groupForReview,
  needsAttention,
  reviewSummary,
  shotTime,
  tallyQueue,
} from '../lib/capture-rules'
import type { Shot } from '../lib/capture-rules'

/**
 * Screen 28 — reviewing the walk-through before leaving.
 *
 * A view over the shots THIS PHONE holds, not a fetch. The capture credential
 * is accepted on exactly two routes (the upload and the per-photo PATCH);
 * `GET /claims/{id}/staging` needs a full session, so the phone genuinely
 * cannot list the claim's staging set. The header says so rather than implying
 * this is everything on the claim.
 *
 * PRE-VISION, per rule 23: nothing has been identified yet, so a row shows only
 * what the phone knows — when it was taken, the room the adjuster picked, the
 * note they typed, and whether it sent. Never an item name, make, model or
 * special-limits flag; those do not exist until processing runs, and showing a
 * guess here would anchor the review before there is anything to review.
 *
 * Two status pills from the design are deliberately absent. **Blurry?** is an
 * on-device focus score nothing computes, and **Won't process** is a staging
 * reclassification the capture credential cannot make. A pill that never lights
 * is furniture; one that lies is worse.
 */
export default function CaptureReview({
  shots,
  onBack,
  onEditNote,
  onFixRoom,
  onRetry,
}: {
  shots: Shot[]
  onBack: () => void
  onEditNote: (key: string) => void
  onFixRoom: (key: string) => void
  onRetry: (shot: Shot) => void
}) {
  const groups = groupForReview(shots)
  const tally = tallyQueue(shots)
  const attention = needsAttention(shots)
  const rooms = groups.filter((g) => g.room != null).length

  return (
    <div className="k-cap-shell">
      <header className="k-cap-top">
        <button type="button" className="k-cap-back" onClick={onBack} aria-label="Back to camera">
          <Icon d={I.chevleft} size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="k-cap-status">This session</div>
          <div className="k-cap-claim">{reviewSummary(tally, rooms)}</div>
        </div>
      </header>

      {attention.length > 0 ? (
        <div className="k-cap-alert">
          <Icon d={I.info} size={14} />
          <span>
            {attention.length === 1
              ? '1 photo needs a look'
              : `${attention.length} photos need a look`}{' '}
            — a missing room or a failed send. {attention.length === 1 ? 'It is' : 'They are'}{' '}
            below.
          </span>
        </div>
      ) : null}

      <div className="k-cap-review">
        {shots.length === 0 ? (
          <p className="k-cap-empty">Nothing shot yet on this phone.</p>
        ) : null}

        {groups.map((group) => (
          <section key={group.room ?? '__none'} className="k-cap-group">
            <div className="k-cap-group-hd">
              <span>{group.room ?? 'No room set'}</span>
              <span className="k-mono">{group.shots.length}</span>
            </div>

            {group.shots.map((shot) => (
              <div key={shot.key} className="k-cap-row">
                <img src={shot.preview} alt="" className="k-cap-row-thumb" />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="k-cap-row-top">
                    {/* From the FILE's own clock -- the moment the camera wrote
                        it, not the moment it uploaded. On a walk-through those
                        can be three rooms apart. */}
                    <span className="k-mono">{shotTime(shot.takenAt)}</span>
                    <span className="k-cap-row-name">{shot.name}</span>
                    {shot.state === 'failed' ? (
                      <span className="k-cap-pill k-cap-pill--bad">Didn’t send</span>
                    ) : shot.state !== 'stored' ? (
                      <span className="k-cap-pill">Sending</span>
                    ) : null}
                    {shot.room == null ? <span className="k-cap-pill">No room</span> : null}
                  </div>

                  <button
                    type="button"
                    className="k-cap-row-note"
                    onClick={() => onEditNote(shot.key)}
                  >
                    {shot.note || 'Add identification detail'}
                  </button>
                </div>

                <div className="k-cap-row-acts">
                  {shot.state === 'failed' ? (
                    <button type="button" className="k-cap-retry" onClick={() => onRetry(shot)}>
                      Retry
                    </button>
                  ) : (
                    /* The room is fixable AFTER upload -- the per-photo PATCH
                       takes `room` as well as `note`, which is what turns the
                       design's "No room" pill from a complaint into a fix. */
                    <button
                      type="button"
                      className="k-cap-row-room"
                      disabled={shot.photoId == null}
                      onClick={() => onFixRoom(shot.key)}
                    >
                      {shot.room ?? 'Set room'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="k-cap-controls">
        <button type="button" className="k-cap-primary" onClick={onBack}>
          Back to camera
        </button>
        <div className="k-cap-safe">
          This list is what this phone sent in this session. The adjuster groups
          and processes it on the computer.
        </div>
      </div>
    </div>
  )
}
