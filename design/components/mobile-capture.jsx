// Mobile capture (PWA) — stripped down, no wizard.
// One single screen: viewfinder + queue strip + sync state. No multi-step flow.

const { KevinWordmark, KevinMark, Icon, I, Thumb, Badge } = window;

// Per-photo note cap is 300 (backend contract). Staging SET notes stay 120.
const MOB_NOTE_MAX = 300;

const MobileCapture = () => {
  // user_note attaches to the SET container (the item being shot right now),
  // exactly as on desktop staging — every frame in the set inherits it.
  const [note, setNote] = React.useState('');
  const [room, setRoom] = React.useState('');
  const [roomSheet, setRoomSheet] = React.useState(false);
  const [roomDraft, setRoomDraft] = React.useState('');
  const [sheet, setSheet] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const openSheet = () => { setDraft(note); setSheet(true); };
  const saveNote = () => { setNote(draft.trim().slice(0, MOB_NOTE_MAX)); setSheet(false); };
  const queued = [
    { mfr: 'LG',     desc: '65" OLED',         synced: true  },
    { mfr: 'Sonos',  desc: 'Soundbar',         synced: true  },
    { mfr: 'Apple',  desc: 'MacBook',          synced: true  },
    { mfr: 'GE',     desc: 'Refrigerator',     synced: true  },
    { mfr: 'Wolf',   desc: 'Gas range',        synced: false, pending: true },
    { mfr: 'Tiffany', desc: 'Diamond ring',    synced: false, pending: true },
    { mfr: 'Sig',    desc: '9mm pistol',       synced: false, pending: true },
  ];
  const synced = queued.filter(q => q.synced).length;
  const pending = queued.length - synced;

  return (
    <div className="k-mob">
      {/* status bar */}
      <div className="k-mob-status">
        <span className="k-mob-time">9:41</span>
        <div className="k-mob-status-r">
          <span className="k-mob-wifi-icon" title="No service">
            <Icon d={I.wifi} size={11} />
          </span>
          <span className="k-mob-battery"><span /></span>
        </div>
      </div>

      {/* top bar — claim context, no nav */}
      <div className="k-mob-top">
        <button className="k-mob-back">
          <Icon d={I.chevleft} size={16} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--k-font-mono)' }}>CLM-2026-04412</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Godfrey · Kitchen fire</div>
        </div>
        <button className="k-mob-back">
          <Icon d={I.more} size={16} />
        </button>
      </div>

      {/* offline state banner */}
      <div className="k-mob-offline">
        <Icon d={I.wifi} size={13} stroke={1.8} />
        <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.35 }}>
          <strong>Offline</strong> — Kevin is queueing photos locally. Auto-sync when you’re back online.
        </div>
        <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11 }}>{pending} pending</div>
      </div>

      {/* viewfinder */}
      <div className="k-mob-view">
        {/* simulated dim viewfinder content */}
        <div className="k-mob-view-bg" />
        <div className="k-mob-reticle">
          <div className="k-mob-recticle-label">FRAME THE ITEM</div>
          <div className="k-mob-corner k-mob-corner--tl" />
          <div className="k-mob-corner k-mob-corner--tr" />
          <div className="k-mob-corner k-mob-corner--bl" />
          <div className="k-mob-corner k-mob-corner--br" />
        </div>

        {/* Kevin live hint */}
        <div className="k-mob-hint">
          <Icon d={I.spark} size={12} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Kevin tip</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Shoot the model sticker too — flip the item & capture the label.</div>
          </div>
        </div>

        {/* Mode strip */}
        <div className="k-mob-modes">
          <button className="k-mob-mode">SCAN BARCODE</button>
          <button className="k-mob-mode k-mob-mode--on">PHOTO</button>
          <button className={'k-mob-mode' + (room ? ' k-mob-mode--on' : '')} onClick={() => setRoomSheet(true)}>{room ? room.toUpperCase() : 'ROOM'}</button>
        </div>
      </div>

      {/* Room tag — rides the upload as the per-BATCH `room` field (one room per
          request; changing rooms starts a new batch). This is the value that
          lands in the worksheet's Room/Area column at promote. */}
      {roomSheet && (
        <div className="k-mob-sheet-wrap" onClick={() => setRoomSheet(false)}>
          <div className="k-mob-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-mob-sheet-hd">Which room are you shooting?</div>
            <input className="k-mob-sheet-input" autoFocus value={roomDraft} onChange={(e) => setRoomDraft(e.target.value)} placeholder="e.g. Kitchen" />
            <div className="k-mob-sheet-chips">
              {['Kitchen', 'Living room', 'Master bedroom', 'Garage', 'Basement'].map(r => (
                <button key={r} className="k-chip" onClick={() => { setRoom(r); setRoomSheet(false); }}>{r}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {room && <button className="k-btn k-btn--ghost" style={{ flex: 1 }} onClick={() => { setRoom(''); setRoomSheet(false); }}>Clear room</button>}
              <button className="k-btn" style={{ flex: 1, justifyContent: 'center' }} disabled={!roomDraft.trim()} onClick={() => { setRoom(roomDraft.trim()); setRoomSheet(false); }}>Set room</button>
            </div>
          </div>
        </div>
      )}

      {/* note for the current set */}
      <button className={'k-mob-notebar' + (note ? ' k-mob-notebar--on' : '')} onClick={openSheet}>
        <Icon d={note ? I.edit : I.plus} size={13} />
        <span className="k-mob-notebar-t">{note || 'Add identification detail'}</span>
        {note ? <span className="k-mob-notebar-x" onClick={(e) => { e.stopPropagation(); setNote(''); }}>Clear</span> : null}
      </button>

      {/* control row */}
      <div className="k-mob-controls">
        <button className="k-mob-aux">
          <Icon d={I.flash} size={16} />
        </button>
        <button className="k-mob-shutter">
          <div className="k-mob-shutter-inner" />
        </button>
        <button className="k-mob-aux">
          <Icon d={I.refresh} size={14} />
        </button>
      </div>

      {/* queue strip + sync state */}
      <div className="k-mob-queue">
        <div className="k-mob-queue-hd">
          <div style={{ fontSize: 12, fontWeight: 600 }}>This session</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--k-font-mono)' }}>
            {queued.length} photos · {synced} synced · {pending} pending
          </div>
        </div>
        <div className="k-mob-queue-strip">
          {queued.map((q, i) => (
            <div key={i} className="k-mob-thumb">
              <Thumb idx={i} size={48} label={q.mfr.slice(0,3)} />
              {q.pending && <span className="k-mob-dot" />}
            </div>
          ))}
          <div className="k-mob-thumb-more">+9</div>
        </div>
        <div className="k-mob-queue-foot">
          <button className="k-mob-btn-ghost">View all</button>
          <button className="k-mob-btn">Done — open on desktop</button>
        </div>
      </div>

      {sheet && (
        <div className="k-mob-sheet-over" onClick={() => setSheet(false)}>
          <div className="k-mob-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-mob-sheet-grab" />
            <div className="k-mob-sheet-t">Additional identification</div>
            <div className="k-mob-sheet-s">Sent with these photos to help identify the item. It never sets a price.</div>
            <textarea
              className="k-mob-sheet-area"
              value={draft}
              maxLength={MOB_NOTE_MAX}
              autoFocus
              placeholder={'e.g. "Samsung 65-inch TV, wall-mounted"'}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="k-mob-sheet-ft">
              <span className="k-mob-sheet-count">{draft.length}/{MOB_NOTE_MAX}</span>
              <div style={{ flex: 1 }} />
              <button className="k-mob-btn-ghost" onClick={() => setSheet(false)}>Cancel</button>
              <button className="k-mob-btn" onClick={saveNote}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* home indicator */}
      <div className="k-mob-home" />
    </div>
  );
};

window.MobileCapture = MobileCapture;
