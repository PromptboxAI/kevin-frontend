// Mobile review screen — reviewing a capture session in the field BEFORE it goes
// to the claim. This is a PRE-VISION surface (CLAUDE.md rule 21): nothing has been
// identified yet, so rows show only what the phone knows — filename, capture time,
// the room the adjuster picked, and duplicate/blur detected on-device. Never item
// names, makes, models or special-limits flags; those exist only after processing.

const { KevinWordmark, Icon, I, Badge, Thumb } = window;

const SESSION_PHOTOS = [
  { id: 1,  room: 'Kitchen',        t: '9:02a', status: 'ok' },
  { id: 2,  room: 'Kitchen',        t: '9:02a', status: 'ok' },
  { id: 3,  room: 'Kitchen',        t: '9:03a', status: 'ok' },
  { id: 4,  room: 'Kitchen',        t: '9:03a', status: 'ok' },
  { id: 5,  room: 'Kitchen',        t: '9:04a', status: 'ok' },
  { id: 6,  room: 'Kitchen',        t: '9:04a', status: 'blur' },
  { id: 7,  room: 'Living room',    t: '9:11a', status: 'ok' },
  { id: 8,  room: 'Living room',    t: '9:11a', status: 'ok' },
  { id: 9,  room: 'Living room',    t: '9:12a', status: 'ok', note: 'Solid walnut, not veneer' },
  { id: 10, room: 'Living room',    t: '9:12a', status: 'ok' },
  { id: 11, room: 'Master bedroom', t: '9:20a', status: 'ok' },
  { id: 12, room: 'Master bedroom', t: '9:21a', status: 'ok' },
  { id: 13, room: 'Master closet',  t: '9:26a', status: 'ok' },
  { id: 14, room: 'Master closet',  t: '9:26a', status: 'ok' },
  { id: 15, room: 'Home office',    t: '9:34a', status: 'ok' },
  { id: 16, room: 'Home office',    t: '9:35a', status: 'ok' },
  { id: 17, room: '— untagged',     t: '9:41a', status: 'untagged' },
  { id: 18, room: 'Home office',    t: '9:35a', status: 'dup' },
  { id: 19, room: 'Garage',         t: '9:48a', status: 'ok', note: 'DeWalt table saw, not the Ryobi' },
  { id: 20, room: 'Garage',         t: '9:48a', status: 'ok' },
  { id: 21, room: 'Garage',         t: '9:49a', status: 'ok',       uploading: true },
  { id: 22, room: '— untagged',     t: '9:52a', status: 'untagged', uploading: true },
  { id: 23, room: '— untagged',     t: '9:52a', status: 'untagged', uploading: true },
];

const STATUS_PILL = {
  ok:       null,
  blur:     { tone: 'warn',   text: 'Blurry?' },   // focus score, on-device
  untagged: { tone: 'warn',   text: 'No room' },   // adjuster has not picked one
  dup:      { tone: 'quiet',  text: 'Duplicate' }, // file hash matches another
  skip:     { tone: 'quiet',  text: "Won't process" }, // adjuster excluded it from the run
};

// Group by room
const BY_ROOM = SESSION_PHOTOS.reduce((acc, p) => {
  (acc[p.room] = acc[p.room] || []).push(p);
  return acc;
}, {});

const MobileShellLight = ({ children }) => (
  <div className="k-mob k-mob--light">
    <div className="k-mob-status k-mob-status--light">
      <span className="k-mob-time">9:41</span>
      <div className="k-mob-status-r">
        <span><Icon d={I.wifi} size={11} /></span>
        <span className="k-mob-battery k-mob-battery--light"><span /></span>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {children}
    </div>
    <div className="k-mob-home k-mob-home--light" />
  </div>
);

// Optional initial* props exist so a states page can render this component with a
// menu already open — see pages/28b-Mobile-review-states.html. They are review
// scaffolding only; the app mounts <MobileReview /> with no props.
const MobileReview = ({ initialRowMenu = null, initialSheet = false, initialTagging = null, initialDetail = null }) => {
  const [photos, setPhotos] = React.useState(SESSION_PHOTOS);
  const [tagging, setTagging] = React.useState(initialTagging);
  const [detail, setDetail] = React.useState(initialDetail);
  const [noteDraft, setNoteDraft] = React.useState(() => {
    const p = initialDetail !== null && SESSION_PHOTOS.find(x => x.id === initialDetail);
    return (p && p.note) || '';
  });
  // Queue for "assign rooms to untagged" — walks every untagged photo in turn
  // rather than opening the first one and stopping.
  const [queue, setQueue] = React.useState([]);   // photo id, or a room name for a whole group
  const [rowMenu, setRowMenu] = React.useState(initialRowMenu);   // photo id whose ⋯ menu is open
  const [sheet, setSheet] = React.useState(initialSheet);      // session-level ⋯ menu
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [draft, setDraft] = React.useState(typeof initialTagging === 'string' && !initialTagging.startsWith('—') ? initialTagging : '');

  // "Uploaded" is the transfer state — photos move to the claim as you shoot, so
  // the count lags the shutter on bad signal. Derived from each photo's own
  // `uploading` flag, never an offset: a literal would go negative on a short
  // session and would be wrong the moment the seed size changed.
  const uploaded = photos.filter(p => !p.uploading).length;
  const untagged = photos.filter(p => p.status === 'untagged').length;
  const needsCheck = photos.filter(p => p.status === 'blur' || p.status === 'dup' || p.status === 'skip').length;

  const ROOMS_RECENT = ['Kitchen', 'Living room', 'Master bedroom', 'Master closet', 'Home office', 'Garage', 'Dining room', 'Basement'];
  const assign = (room) => {
    if (!room.trim()) return;
    setPhotos(ps => ps.map(p => {
      const hit = typeof tagging === 'number' ? p.id === tagging : p.room === tagging;
      return hit ? { ...p, room: room.trim(), status: p.status === 'untagged' ? 'ok' : p.status } : p;
    }));
    // Walking the untagged queue: hop to the next one instead of closing.
    const rest = queue.filter(id => id !== tagging);
    if (rest.length) { setQueue(rest); setTagging(rest[0]); setDraft(''); return; }
    setQueue([]);
    setTagging(null);
    setDraft('');
  };

  return (
    <MobileShellLight>
      {/* Header */}
      <div className="k-mrev-hd">
        <a className="k-mob-back k-mob-back--light" href="11-Mobile-capture.html" title="Back to capture">
          <Icon d={I.chevleft} size={14} />
        </a>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10, color: 'var(--k-fg-4)', letterSpacing: '0.05em' }}>CLM-2026-04412</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>Review captures</div>
        </div>
        <button className="k-mob-back k-mob-back--light" title="Session actions" onClick={() => setSheet(s => !s)}>
          <Icon d={I.more} size={14} />
        </button>
      </div>

      {/* Status strip — hidden at zero, where every number would be 0 */}
      {photos.length > 0 && <div className="k-mrev-status">
        <div className="k-mrev-status-cell">
          <div className="k-mrev-status-n">{photos.length}</div>
          <div className="k-mrev-status-l">photos</div>
        </div>
        <div className="k-mrev-status-cell">
          <div className="k-mrev-status-n" style={{ color: 'var(--k-ok)' }}>{uploaded}</div>
          <div className="k-mrev-status-l">uploaded</div>
        </div>
        <div className="k-mrev-status-cell">
          <div className="k-mrev-status-n" style={{ color: 'var(--k-warn)' }}>{untagged}</div>
          <div className="k-mrev-status-l">untagged</div>
        </div>
        <div className="k-mrev-status-cell">
          <div className="k-mrev-status-n">{needsCheck}</div>
          <div className="k-mrev-status-l">to check</div>
        </div>
      </div>}

      {/* Filter pills */}
      {photos.length > 0 && <div className="k-mrev-filters">
        {['All', 'Untagged', 'Blurry', 'Duplicates'].map((f, i) => (
          <button key={f} className={`k-chip ${i === 0 ? 'k-chip--on' : ''}`} style={{ flex: '0 0 auto', fontSize: 11.5 }}>
            {f}
          </button>
        ))}
      </div>}

      {/* Photo list grouped by room. Untagged stays pinned last and the rest hold
          alphabetical order, so re-tagging a photo cannot make the list jump under
          the user's thumb mid-review. */}
      <div className="k-mrev-scroll">
        {photos.length === 0 ? (
          <div className="k-mrev-empty">
            <div className="k-empty-art"><Icon d={I.camera} size={24} stroke={1.6} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nothing in this session.</div>
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 250 }}>
              Photos you shoot land here to review before they go to the claim. Anything already sent to the claim is unaffected.
            </p>
            <a className="k-btn" href="11-Mobile-capture.html" style={{ justifyContent: 'center' }}>Start shooting →</a>
          </div>
        ) : Object.entries(photos.reduce((acc, p) => { (acc[p.room] = acc[p.room] || []).push(p); return acc; }, {}))
          .sort(([a], [b]) => (a.startsWith('\u2014') ? 1 : 0) - (b.startsWith('\u2014') ? 1 : 0) || a.localeCompare(b))
          .map(([room, group]) => (
          <div key={room} className="k-mrev-group">
            <div className="k-mrev-group-hd">
              <span style={{ flex: 1, fontWeight: 600, fontSize: 12.5 }}>{room}</span>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{group.length}</span>
              <button className="k-link" style={{ fontSize: 11 }} onClick={() => { setTagging(room); setDraft(room.startsWith('—') ? '' : room); }}>
                {room.startsWith('—') ? 'Assign room' : 'Rename'}
              </button>
            </div>
            <div className="k-mrev-rows">
              {group.map(p => (
                <div key={p.id} className={`k-mrev-row ${p.status === 'dup' || p.status === 'blur' || p.status === 'skip' ? 'k-mrev-row--quiet' : ''}`} onClick={() => { setDetail(p.id); setNoteDraft(p.note || ''); }} style={{ cursor: 'pointer' }}>
                  <Thumb idx={p.id} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--k-fg)', fontFamily: 'var(--k-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>IMG_{String(p.id).padStart(4, '0')}.HEIC</span>
                      {STATUS_PILL[p.status] && <Badge tone={STATUS_PILL[p.status].tone}>{STATUS_PILL[p.status].text}</Badge>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)' }}>{p.t} · {p.room.startsWith('—') ? 'no room yet' : p.room}</span>
                    </div>
                    {/* Note indicator — mirrors .k-stage-notechip on the desktop
                        staging screen so the same feature reads the same on both
                        surfaces. Notes steer identification and are consumed by
                        the run, so they must be visible before Process. */}
                    {p.note && (
                      <button className="k-stage-notechip" style={{ fontSize: 10.5 }} title="Edit note" onClick={(e) => { e.stopPropagation(); setDetail(p.id); setNoteDraft(p.note); }}>
                        <Icon d={I.edit} size={10} />
                        <span>{p.note}</span>
                      </button>
                    )}
                  </div>
                  <button className="k-icon-btn" title="Photo actions" onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === p.id ? null : p.id); }}><Icon d={I.more} size={13} /></button>
                  {rowMenu === p.id && (
                    <div className="k-mrev-rowmenu" onClick={(e) => e.stopPropagation()}>
                      <button className="k-menu-item" onClick={() => { setRowMenu(null); setTagging(p.id); setDraft(p.room.startsWith('—') ? '' : p.room); }}>Assign room</button>
                      <button className="k-menu-item" onClick={() => { setPhotos(ps => ps.map(x => x.id === p.id ? { ...x, status: x.status === 'skip' ? 'ok' : 'skip' } : x)); setRowMenu(null); }}>{p.status === 'skip' ? 'Include in processing' : 'Exclude from processing'}</button>
                      <div className="k-avatar-menu-div" />
                      <button className="k-menu-item k-menu-item--danger" onClick={() => { setPhotos(ps => ps.filter(x => x.id !== p.id)); setRowMenu(null); }}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 110 }} />
      </div>

      {/* Sticky bottom CTA */}
      <div className="k-mrev-foot">
        <a href="11-Mobile-capture.html" className="k-mob-btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', padding: '11px 16px', borderRadius: 9, background: 'var(--k-bg-2)', color: 'var(--k-fg)', fontWeight: 500, fontSize: 13, border: 0 }}>
          Keep shooting
        </a>
        <button className="k-btn" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: 14 }} disabled={photos.length - needsCheck === 0}>
          Process {photos.length - needsCheck} photos →
        </button>
      </div>

      {/* Discarding a shoot is the most destructive thing on any mobile screen —
          one mis-tap in a fire-damaged house would lose the lot. Gated. */}
      {confirmDiscard && (
        <div className="k-mrev-sheet-back" onClick={() => setConfirmDiscard(false)}>
          <div className="k-mrev-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-mrev-sheet-h" style={{ color: 'var(--k-danger)' }}>Discard {photos.length} photos?</div>
            <p style={{ fontSize: 13, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: '0 0 14px' }}>
              This clears the whole review session from your phone and cannot be undone. Photos already sent to the claim are not affected.
            </p>
            <div className="k-mrev-sheet-foot">
              <button className="k-mob-btn-ghost" style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'var(--k-bg-2)', color: 'var(--k-fg)', fontWeight: 500, fontSize: 13, border: 0 }} onClick={() => setConfirmDiscard(false)}>Keep them</button>
              <button className="k-btn k-btn--danger" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: 13.5 }} onClick={() => { setPhotos([]); setConfirmDiscard(false); setSheet(false); }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Session ⋯ menu */}
      {sheet && (
        <div className="k-mrev-sheet-back" onClick={() => setSheet(false)}>
          <div className="k-mrev-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-mrev-sheet-h">
              {queue.length > 1 && <span style={{ color: 'var(--k-accent)' }}>{queue.length} left · </span>}This capture session</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
              <button className="k-menu-item" onClick={() => { setPhotos(ps => ps.filter(p => p.status !== 'dup')); setSheet(false); }}>Remove duplicates</button>
              <button className="k-menu-item" onClick={() => { setPhotos(ps => ps.filter(p => p.status !== 'blur')); setSheet(false); }}>Remove blurry photos</button>
              <button className="k-menu-item" onClick={() => { const ids = photos.filter(p => p.room.startsWith('—')).map(p => p.id); setSheet(false); if (ids.length) { setQueue(ids); setTagging(ids[0]); setDraft(''); } }}>Assign rooms to untagged</button>
              <div className="k-avatar-menu-div" />
              <button className="k-menu-item k-menu-item--danger" onClick={() => setConfirmDiscard(true)}>Discard this session…</button>
            </div>
            <button className="k-mob-btn-ghost" style={{ width: '100%', padding: '11px', borderRadius: 9, background: 'var(--k-bg-2)', color: 'var(--k-fg)', fontWeight: 500, fontSize: 13, border: 0 }} onClick={() => setSheet(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Photo detail — the primary way to inspect one capture. Big image, the room
          it belongs to, and an additional-identification note. Prev/next walk the
          whole session without closing. */}
      {detail !== null && (() => {
        const p = photos.find(x => x.id === detail);
        if (!p) return null;
        const idx = photos.findIndex(x => x.id === detail);
        const saveNote = () => setPhotos(ps => ps.map(x => x.id === p.id ? { ...x, note: noteDraft.trim() } : x));
        const go = (d) => {
          saveNote();
          const nxt = photos[idx + d];
          if (nxt) { setDetail(nxt.id); setNoteDraft(nxt.note || ''); }
        };
        const st = STATUS_PILL[p.status];
        return (
          <div className="k-mrev-sheet-back" onClick={() => { saveNote(); setDetail(null); }}>
            <div className="k-mrev-detail" onClick={(e) => e.stopPropagation()}>
              <div className="k-mrev-detail-hd">
                <button className="k-icon-btn" title="Previous photo" disabled={idx === 0} onClick={() => go(-1)}><Icon d={I.chevleft} size={14} /></button>
                <span className="k-mrev-detail-count">{idx + 1} of {photos.length}</span>
                <button className="k-icon-btn" title="Next photo" disabled={idx === photos.length - 1} onClick={() => go(1)}><Icon d={I.chevright} size={14} /></button>
                <div style={{ flex: 1 }} />
                <button className="k-icon-btn" title="Close" onClick={() => { saveNote(); setDetail(null); }}><Icon d={I.close} size={14} /></button>
              </div>

              <div className="k-mrev-detail-img"><Thumb idx={p.id} fill label="Photo" /></div>

              <div className="k-mrev-detail-body">
                <div className="k-mrev-detail-meta">
                  <span style={{ fontFamily: 'var(--k-font-mono)' }}>IMG_{String(p.id).padStart(4, '0')}.HEIC</span>
                  <span>·</span>
                  <span>{p.t}</span>
                  {st && <React.Fragment><span>·</span><Badge tone={st.tone}>{st.text}</Badge></React.Fragment>}
                  {p.uploading && <React.Fragment><span>·</span><span style={{ color: 'var(--k-accent)' }}>uploading</span></React.Fragment>}
                </div>

                <button className="k-mrev-detail-field" onClick={() => { saveNote(); setTagging(p.id); setDraft(p.room.startsWith('—') ? '' : p.room); setDetail(null); }}>
                  <span className="k-mrev-detail-field-l">Room</span>
                  <span className="k-mrev-detail-field-v" style={p.room.startsWith('—') ? { color: 'var(--k-warn)' } : null}>
                    {p.room.startsWith('—') ? 'Not set — tap to assign' : p.room}
                  </span>
                  <Icon d={I.chevright} size={13} />
                </button>

                <div style={{ marginTop: 12 }}>
                  <div className="k-mrev-detail-field-l" style={{ marginBottom: 6 }}>Additional identification</div>
                  <textarea
                    className="k-mrev-detail-note"
                    value={noteDraft}
                    maxLength={300}
                    placeholder="e.g. Sony, not the Samsung beside it"
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div className="k-mrev-detail-count" style={{ textAlign: 'right', marginTop: 4 }}>{noteDraft.length}/300</div>
                </div>

                <div className="k-mrev-detail-acts">
                  <button className="k-mob-btn-ghost" style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'var(--k-bg-2)', color: p.status === 'skip' ? 'var(--k-accent)' : 'var(--k-fg)', fontWeight: 500, fontSize: 13, border: 0 }}
                    onClick={() => setPhotos(ps => ps.map(x => x.id === p.id ? { ...x, status: x.status === 'skip' ? 'ok' : 'skip' } : x))}>
                    {p.status === 'skip' ? 'Include in processing' : 'Exclude from processing'}
                  </button>
                  <button className="k-btn k-btn--ghost k-btn--danger" style={{ justifyContent: 'center', padding: '12px' }}
                    onClick={() => { setPhotos(ps => ps.filter(x => x.id !== p.id)); setDetail(null); }}>
                    <Icon d={I.trash} size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Room sheet — tagging happens in the field, where the adjuster still
          remembers which room they were standing in. Free text, because houses
          have arbitrary room names; recents are offered as shortcuts. */}
      {tagging !== null && (
        <div className="k-mrev-sheet-back" onClick={() => setTagging(null)}>
          <div className="k-mrev-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="k-mrev-sheet-h">
              {queue.length > 1 && <span style={{ color: 'var(--k-accent)' }}>{queue.length} left · </span>}
              {typeof tagging === 'number' ? `IMG_${String(tagging).padStart(4, '0')}.HEIC` : `${photos.filter(p => p.room === tagging).length} photos in this group`}
            </div>
            <input className="k-mrev-sheet-in" autoFocus value={draft} placeholder="Room or area…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') assign(draft); }} />
            <div className="k-mrev-sheet-chips">
              {ROOMS_RECENT.map(r => (
                <button key={r} className="k-chip" style={{ fontSize: 11.5 }} onClick={() => assign(r)}>{r}</button>
              ))}
            </div>
            <div className="k-mrev-sheet-foot">
              <button className="k-mob-btn-ghost" style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'var(--k-bg-2)', color: 'var(--k-fg)', fontWeight: 500, fontSize: 13, border: 0 }} onClick={() => setTagging(null)}>Cancel</button>
              <button className="k-btn" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: 13.5 }} disabled={!draft.trim()} onClick={() => assign(draft)}>Save room</button>
            </div>
          </div>
        </div>
      )}
    </MobileShellLight>
  );
};

window.MobileReview = MobileReview;
