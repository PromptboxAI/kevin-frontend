// Photo staging — the PRE-Vision "review the proposed sets" step.
// Sits between Intake (upload) and Processing. The backend pre-clusters photos
// by capture time into proposed sets; the adjuster merges/splits them, marks
// overview shots as skip, and attaches an optional user_note. Nothing here is
// identified yet — no item names, no rooms, no classes (CLAUDE.md rule 21).
// Output is a set count, never a line-item count: the item count isn't known
// until Vision has run.

const { KevinWordmark, Icon, I, Badge, Thumb } = window;

// PROPOSED photo sets from the backend's pre-cluster pass. This runs BEFORE
// Vision, so nothing here is identified: no item names, no rooms, no "model
// plate" reasoning. All the clusterer knows is capture time and EXIF proximity.
// The adjuster's user_note is the only meaning added at this stage.
const STAGE_STACKS = [
  { id: 's1',  time: '10:04:12', times: ['10:04:12', '10:04:16'], photos: ['IMG_4417.HEIC', 'IMG_4418.HEIC'], reason: '2 photos \u00b7 4s apart', note: 'Sub-Zero, not the Frigidaire | door panel is custom', fromField: true },
  { id: 's2',  time: '10:06:38', times: ['10:06:38', '10:06:43', '10:06:47'], photos: ['IMG_4421.HEIC', 'IMG_4422.HEIC', 'IMG_4423.HEIC'], reason: '3 photos \u00b7 9s span' },
  { id: 's3',  time: '10:08:02', photos: ['IMG_4426.HEIC'] },
  { id: 's4',  time: '10:11:47', times: ['10:11:47', '10:11:53'], photos: ['IMG_4431.HEIC', 'IMG_4432.HEIC'], reason: '2 photos \u00b7 6s apart', note: 'Solid walnut, not veneer', fromField: true },
  { id: 's5',  time: '10:13:20', photos: ['IMG_4435.HEIC'] },
  { id: 's6',  time: '10:14:05', photos: ['IMG_4437.HEIC'] },
  { id: 's7',  time: '10:15:51', photos: ['IMG_4440.HEIC'] },
  { id: 's8',  time: '10:22:16', photos: ['IMG_4452.HEIC'] },
  { id: 's9',  time: '10:23:40', times: ['10:23:40', '10:23:43'], photos: ['IMG_4455.HEIC', 'IMG_4456.HEIC'], reason: '2 photos \u00b7 3s apart' },
  { id: 's10', time: '10:29:03', photos: ['IMG_4468.HEIC'] },
  { id: 's11', time: '10:34:55', photos: ['IMG_4479.HEIC'] },
  { id: 's12', time: '10:35:31', photos: ['IMG_4481.HEIC'] },
  { id: 's13', time: '10:41:09', photos: ['IMG_4494.HEIC'] },
  { id: 's14', time: '10:47:22', photos: ['IMG_4508.HEIC'] },
];

// Sets are labelled by their position on screen, so a merge or split always
// renumbers cleanly — ids never leak into the label (they'd collide after a split).
// contract §5c — 409 is an expected state, not a failure. Each case needs copy
// that says what to do, inline, never a red banner.
const CONFLICT_COPY = {
  merge_unextracted: 'Kevin is still reading one of these photos. It can join a set as soon as that finishes — a moment.',
  cluster_extracting: 'Still reading photos. Grouping starts once every photo has been read.',
  cluster_after_edits: 'You have arranged sets by hand, so a full regroup would discard that work. Use Group ungrouped photos for the late ones, or Start over to rebuild from scratch.',
  cluster_none_left: 'Every photo is already in a set.',
};

const SET_LABEL = (i) => 'Set ' + String(i + 1).padStart(2, '0');

// Adjuster set note: PATCH …/staging/groups/{key}/note, ≤300 chars. The 120-char
// cap applies ONLY to the derived fusion (it may arrive truncated with "…" —
// not a bug; the full text is intact on each member's photos[].note). 120 was
// never a typing limit — humans always had 300.
// " | " fusion of member photo notes is SERVER-side (merge_notes) and arrives as
// note_source:'derived' — read-only context, never re-concatenated client-side.
// An adjuster note (note_source:'adjuster') overrides it; clearing (null) brings
// the derived summary back. Per-photo notes on mobile also allow 300.
const STAGE_NOTE_MAX = 300;

// Note editor — attaches an optional `user_note` to a set container (one set =
// one item candidate). Passed to the Vision API as context for those photos.
const StageNoteEditor = ({ value, source, title, photos = 1, onSave, onClose }) => {
  const derived = source === 'derived';
  const [text, setText] = React.useState(derived ? '' : (value || ''));
  const ref = React.useRef(null);
  React.useEffect(() => { ref.current && ref.current.focus(); }, []);
  const commit = () => onSave(text.trim().slice(0, STAGE_NOTE_MAX));
  return (
    <div className="k-stage-noteover" onClick={onClose}>
      <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
        <div className="k-notemodal-hd">
          <div>
            <div className="k-notemodal-t">Additional identification</div>
            <div className="k-notemodal-s">{title} · {photos} {photos === 1 ? 'photo' : 'photos'} · one item</div>
          </div>
          <button className="k-icon-btn" onClick={onClose} aria-label="Close"><Icon d={I.close} size={15} /></button>
        </div>

        <div className="k-notemodal-body">
          <p className="k-notemodal-lede">
            Tell Kevin what it is looking at. On a set Kevin could not identify, this becomes the search query — it helps identify the item and never affects the price.
          </p>
          {derived && value && (
            <div className="k-notemodal-derived">
              <span className="k-notemodal-derived-l">From the field notes on these photos</span>
              <span className="k-notemodal-derived-b">{value}</span>
              {/\u2026$|\.\.\.$/.test(value) && <span className="k-notemodal-derived-l" style={{ textTransform: 'none', letterSpacing: 0 }}>Summary truncated — the full notes are on each photo.</span>}
            </div>
          )}
          <div className="k-notemodal-field">
            <textarea
              ref={ref}
              className="k-notemodal-area"
              value={text}
              maxLength={STAGE_NOTE_MAX}
              placeholder="Anything that helps identify this item"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit(); if (e.key === 'Escape') onClose(); }}
            />
            <span className={'k-notemodal-count' + (text.length > STAGE_NOTE_MAX - 20 ? ' k-notemodal-count--near' : '')}>{STAGE_NOTE_MAX - text.length}</span>
          </div>
        </div>

        <div className="k-notemodal-ft">
          {value && !derived ? <button className="k-stage-act k-stage-act--danger" onClick={() => onSave('')} title="The summary from the photo notes comes back">Remove note</button> : <span />}
          <div style={{ flex: 1 }} />
          <span className="k-notemodal-kbd">⌘↵</span>
          <button className="k-btn k-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="k-btn" onClick={commit} disabled={!text.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
};

const PhotoStaging = ({ onBegin, initialOwnDesc = '' }) => {
  const [stacks, setStacks] = React.useState(STAGE_STACKS);
  const [sel, setSel] = React.useState([]);        // selected stack ids
  const [noteFor, setNoteFor] = React.useState(null);
  // Which frame is open in the viewer, as { set, i }.
  const [lightbox, setLightbox] = React.useState(null);
  // Loose photos the clusterer could not assign (group_key = NULL). Late uploads
  // land here too, so the tray filters on extraction: a photo still running has
  // not been TRIED yet, and prompting the adjuster to act on it is a false alarm.
  // It drops into the tray the moment extraction finishes, count updating in
  // place without stealing focus.
  const [ungrouped, setUngrouped] = React.useState(window.STAGE_UNGROUPED || []);
  const [clustering, setClustering] = React.useState(false);
  const addRef = React.useRef(null);
  // Newly picked photos land as their own sets, exactly like a loose photo does:
  // one card each, merge them if they belong together.
  const addPhotos = (fileList) => {
    const files = [...fileList].filter(f => /\.(jpe?g|png|heic|heif)$/i.test(f.name));
    if (!files.length) return;
    const stamp = new Date().toTimeString().slice(0, 8);
    setStacks(prev => [...prev, ...files.map((f, i) => ({
      id: 'added-' + Date.now() + '-' + i, time: stamp, times: [stamp],
      photos: [f.name], reason: 'Just added', loose: true,
    }))]);
  };
  const [confirmProcess, setConfirmProcess] = React.useState(false);
  // Optional description captured while the photo is still on screen. This is the
  // cheapest moment to get it: the adjuster just looked at the photo and decided
  // it is nobody's set, so they already know what it is. On the worksheet later
  // the photo is a click away and the context is gone.

  const applyAssign = (photoId, setId, newKey, desc) => {
    const p = ungrouped.find(x => x.id === photoId);
    if (!p) return;
    setStacks(prev => setId === '__own'
      ? [...prev, { id: newKey || ('loose_' + photoId), time: p.captured_at, times: [p.captured_at], photos: [p.filename], reason: (desc || '').trim() ? 'Its own item · you described it' : 'Its own item', user_note: (desc || '').trim() || undefined, _new: true }]
      : prev.map(st => st.id === setId
          ? { ...st, id: newKey || st.id, photos: [...st.photos, p.filename], times: [...(st.times || [st.time]), p.captured_at], reason: `${st.photos.length + 1} photos · you added one` }
          : st));
    setUngrouped(prev => prev.filter(x => x.id !== photoId));
    setOwnDesc('');
    setAssigning(null); setAssignQ('');
  };
  const loose = ungrouped.filter(p => p.status === 'extracted');
  // Extracted loose photos join the grid as single-photo sets, in place, so the
  // existing controls handle them. They keep a flag so the card can say why it
  // is there and the banner can count them.
  React.useEffect(() => {
    if (!loose.length) return;
    setStacks(prev => {
      const have = new Set(prev.map(x => x.id));
      const add = loose.filter(p => !have.has('loose-' + p.id)).map(p => ({
        id: 'loose-' + p.id, time: p.captured_at, times: [p.captured_at],
        photos: [p.filename], reason: 'Added after grouping ran', loose: true,
      }));
      return add.length ? [...prev, ...add] : prev;
    });
  }, [loose.length]);
  const stillExtracting = ungrouped.filter(p => p.status === 'uploaded');

  const clusterRemaining = () => {
    if (!loose.length) return;
    setClustering(true);
    window.KevinAPI.clusterRemaining('CLM-2026-04412', loose.map(p => p.id)).then(({ sets }) => {
      // Appended — existing sets and every manual merge are untouched. This is
      // the whole distinction from a re-cluster, which rebuilds the session.
      const superseded = new Set(loose.map(p => 'loose-' + p.id));
      setStacks(prev => [...prev.filter(x => !superseded.has(x.id)), ...sets.map((g, i) => ({
        id: g.set_id,
        time: (ungrouped.find(p => p.id === g.photos[0]) || {}).captured_at || '',
        times: g.photos.map(id => (ungrouped.find(p => p.id === id) || {}).captured_at || ''),
        photos: g.photos.map(id => (ungrouped.find(p => p.id === id) || {}).filename || String(id)),
        reason: g.photos.length > 1 ? `${g.photos.length} photos · grouped from unassigned` : 'Was unassigned',
        _new: true,
      }))]);
      setUngrouped(prev => prev.filter(p => p.status === 'uploaded'));
      setClustering(false);
    });
  };
  // ── Lazy thumbnails ──────────────────────────────────────────────────────
  // The /staging poll no longer carries signed image_urls — minting 300 of them
  // every 4s crashed the server. Instead an IntersectionObserver reports which
  // set cards are in the viewport and we batch-fetch just those ids from
  // GET /v1/staging/photos/thumbnails?ids= . Cached per id, so scrolling back up
  // costs nothing, and a signed URL is only minted for what someone looked at.
  const [thumbs, setThumbs] = React.useState({});
  const [visible, setVisible] = React.useState([]);
  const gridRef = React.useRef(null);
  const ioRef = React.useRef(null);
  React.useEffect(() => {
    if (!gridRef.current || typeof IntersectionObserver === 'undefined') return;
    const seen = new Set();
    ioRef.current = new IntersectionObserver((entries) => {
      let changed = false;
      entries.forEach((e) => {
        const id = e.target.getAttribute('data-set');
        if (e.isIntersecting && id && !seen.has(id)) { seen.add(id); changed = true; }
      });
      if (changed) setVisible([...seen]);
    }, { root: null, rootMargin: '400px 0px' });   // prefetch a screen ahead
    [...gridRef.current.querySelectorAll('[data-set]')].forEach(el => ioRef.current.observe(el));
    return () => ioRef.current && ioRef.current.disconnect();
  }, [stacks.length]);
  React.useEffect(() => {
    const need = visible.filter(id => !thumbs[id]).slice(0, window.KevinAPI.THUMB_BATCH_MAX);
    if (!need.length) return;
    let alive = true;
    // fetchThumbnails splits anything over the cap into sequential requests; we
    // also take at most one cap-sized slice per pass so the newest viewport wins.
    window.KevinAPI.fetchThumbnails(need).then((map) => { if (alive) setThumbs(t => ({ ...t, ...map })); });
    return () => { alive = false; };
  }, [visible, thumbs]);
  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      const set = stacks.find(x => x.id === lightbox.set);
      if (!set) return;
      if (e.key === 'ArrowLeft' && lightbox.i > 0) setLightbox({ set: set.id, i: lightbox.i - 1 });
      if (e.key === 'ArrowRight' && lightbox.i < set.photos.length - 1) setLightbox({ set: set.id, i: lightbox.i + 1 });
      if (e.key === 'Escape') setLightbox(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox]); // stack id | '__sel' | null
  const IMG = window.PRODUCT_IMG || {};

  const toggleSel = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Final submission — the adjuster's APPROVED sets, each with its optional
  // user_note, POSTed to the Vision API. Notes are pre-processing only; after
  // the run, corrections happen by editing the row in the worksheet.
  const submit = () => {
    // INCREMENTAL STATE MODEL — there is no payload here. Every merge, split,
    // note, skip and exclusion was already saved via its own endpoint the moment
    // the adjuster made it (see KevinAPI.staging*). Process just promotes what
    // the database already holds.
    if (window.KevinAPI && window.KevinAPI.stagingProcess) window.KevinAPI.stagingProcess('CLM-2026-04412');
    onBegin && onBegin();
  };

  // Merge selected stacks into the first-selected (they become one item).
  const mergeSel = () => {
    if (sel.length < 2) return;
    setStacks(prev => {
      const chosen = prev.filter(s => sel.includes(s.id));
      const keep = chosen[0];
      const mergedPhotos = chosen.flatMap(s => s.photos);
      const authored = chosen.filter(x => x.note_source === 'adjuster' && x.note);
      const notes = chosen.map(x => x.note).filter(Boolean);
      const mergedTimes = chosen.flatMap(x => x.times || [x.time]);
      // Single-source inheritance (backend rule): ONE authored note carries
      // forward as adjuster; two+ have no non-arbitrary winner → the set falls
      // back to the fused derived summary. Photo notes are untouched either way.
      const noteFields = authored.length === 1
        ? { note: authored[0].note, note_source: 'adjuster' }
        : { note: window.mergeUserNotes(notes) || undefined, note_source: notes.length ? 'derived' : undefined };
      const merged = { ...keep, skip: false, photos: mergedPhotos, times: mergedTimes, time: mergedTimes[0], ...noteFields, reason: `Merged by you · ${mergedPhotos.length} photos` };
      const out = [];
      let placed = false;
      for (const s of prev) {
        if (s.id === keep.id) { out.push(merged); placed = true; }
        else if (!sel.includes(s.id)) out.push(s);
      }
      return out;
    });
    setSel([]);
  };

  const ungroup = (id) => {
    setStacks(prev => prev.flatMap(s => {
      if (s.id !== id || s.photos.length < 2) return [s];
      return s.photos.map((p, i) => ({
        ...s, id: `${s.id}-${i}`, photos: [p],
        time: (s.times && s.times[i]) || s.time,
        times: (s.times && [s.times[i]]) || undefined,
        // A merged note cannot be attributed back to one photo, so it stays on
        // the FIRST child only. Copying it onto all of them fabricates notes the
        // adjuster never wrote — and since notes are sent to the vision model,
        // a note naming the wrong brand steers identification away from the
        // right answer. Nothing is lost: the note is still on screen, editable,
        // and the adjuster can re-attach it wherever it belongs.
        note: i === 0 ? s.note : undefined,
        fromField: i === 0 ? s.fromField : undefined,
        reason: 'Split by you · 1 photo',
      }));
    }));
    setSel([]);
  };

  // Attach/replace the optional user_note on one stack or the whole selection.
  // Remove sets entirely. Distinct from "Don't process", which keeps the photos
  // on the claim — this deletes them, so it asks first.
  const [confirmDel, setConfirmDel] = React.useState(null);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSel([]); };
    if (sel.length) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sel.length]);
  const doDelete = (ids) => {
    setStacks(prev => prev.filter(x => !ids.includes(x.id)));
    setSel(prev => prev.filter(id => !ids.includes(id)));
    setConfirmDel(null);
  };

  const saveNote = (note) => {
    // Typing marks the note adjuster-authored (PATCH …/groups/{key}/note).
    // Clearing sends null — the backend restores the derived summary from the
    // member photo notes; the mock re-fuses the same way.
    setStacks(prev => prev.map(s => {
      if (s.id !== noteFor) return s;
      if (note) return { ...s, note, note_source: 'adjuster', fromField: s.fromField };
      const photoNotes = (s.photos || []).map(p => p && p.note).filter(Boolean);
      const derived = window.mergeUserNotes(photoNotes);
      return { ...s, note: derived || undefined, note_source: derived ? 'derived' : undefined, fromField: undefined };
    }));
    // Saved the moment it's typed — Process posts no body (incremental model).
    if (window.KevinAPI && window.KevinAPI.stagingSaveNote) window.KevinAPI.stagingSaveNote(noteFor, note);
    setNoteFor(null);
  };

  // The clusterer cannot tell an overview shot from an item shot — only the
  // adjuster can mark a set as skip.
  const toggleKind = (id) => setStacks(prev => {
    const next = prev.map(s => s.id === id ? { ...s, skip: !s.skip } : s);
    // Skips are backend state BEFORE Process — Process carries no skip list.
    const t = next.find(s => s.id === id);
    if (window.KevinAPI && window.KevinAPI.stagingSetSkip) window.KevinAPI.stagingSetSkip(id, !!(t && t.skip));
    return next;
  });

  // Visible-sample tallies
  const visGrouped = stacks.filter(s => !s.skip && s.photos.length > 1).length;
  const visContext = stacks.filter(s => s.skip).length;
  const visNotes   = stacks.filter(s => s.note).length;
  const visSets    = stacks.filter(s => !s.skip).length;

  // Full-claim numbers (canonical), adjusted by the delta the user creates on-screen.
  const SESSION = window.CLAIM_INGEST.current;      // this batch only
  const PRIOR = window.CLAIM_INGEST.processed;      // already processed, never re-staged
  const priorPhotos = PRIOR.reduce((a, x) => a + x.photos, 0);
  const priorItems = PRIOR.reduce((a, x) => a + x.items, 0);
  const FULL_PHOTOS = SESSION.photos;
  const baseSets = SESSION.sets;              // proposed by the pre-cluster pass
  const baseVisSets = STAGE_STACKS.length;
  const fullSets = baseSets + (visSets - baseVisSets);
  // 161 unique photos across 148 sets → 13 photos live in multi-photo sets.
  // Surplus photos over set count = how many sets hold more than one frame.
  const baseMulti = SESSION.photos - ungrouped.length - SESSION.sets;
  const baseVisMulti = STAGE_STACKS.filter(x => x.photos.length > 1).length;
  const baseVisNotes = STAGE_STACKS.filter(x => x.note).length;
  const fullMulti = baseMulti + (visGrouped - baseVisMulti);
  const fullNotes = baseVisNotes + (visNotes - baseVisNotes);

  return (
    <div className="k-intake">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="New claim" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge tone="quiet" dot={true}>Draft — auto-saved</Badge>
          <window.AvatarMenu />
        </div>
      </header>

      <div className="k-intake-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <a href="03-Intake.html" className="k-crumb" title="Back to upload"><Icon d={I.chevleft} size={12} /> Upload</a>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>After upload · before processing</div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 38, letterSpacing: '-0.025em', margin: '6px 0 4px', lineHeight: 1.1 }}>Group &amp; stage photos</h1>
            {/* Background upload — set by intake when the adjuster moves on
                before every chunk landed. Without it a still-running 1 GB upload
                is invisible here and the set count looks wrong. */}
            {window.KEVIN_UPLOAD_PENDING > 0 && (
              <div className="k-stage-bgupload">
                <span className="k-paused-dot" />
                <span>Still uploading {window.KEVIN_UPLOAD_PENDING} photos in the background — new sets appear as they land.</span>
              </div>
            )}
            {PRIOR.length > 0 && (
              <div className="k-stage-scope">
                <Icon d={I.info} size={13} />
                <span>
                  Staging <strong>this batch only</strong> — {SESSION.photos} photos{SESSION.label ? ' · ' + SESSION.label : ''}. The {priorPhotos} photos and {priorItems} line items already processed on this claim stay as they are; new items continue from <strong>#{String(SESSION.itemFrom).padStart(4, '0')}</strong>.
                </span>
              </div>
            )}
            <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
              Your upload was pre-clustered by capture time into <strong>proposed photo sets</strong> — one set becomes at most one line item. Nothing has been identified yet. Merge sets that show the same item, split ones that don’t, exclude overview shots, and add a note wherever the photo alone won’t tell Kevin what it’s looking at.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={addRef} type="file" multiple accept="image/jpeg,image/png,image/heic,.heic,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
            <button className="k-btn k-btn--ghost" onClick={() => addRef.current && addRef.current.click()}><Icon d={I.plus} size={12} /> Add photos</button>
            <button className="k-btn k-btn--ghost" onClick={() => {
              const authored = stacks.filter(x => x.note_source === 'adjuster' && x.note).length;
              // POST …/staging/reset rebuilds every group — authored set notes go
              // with them (deliberately: notes don't set manually_edited, so no 409).
              // Photo notes survive and derived summaries return, but the authored
              // sentences are gone — confirm before firing.
              if (authored && !window.confirm(`Resetting rebuilds every set. ${authored} note${authored === 1 ? '' : 's'} you wrote on set${authored === 1 ? '' : 's'} will be discarded (the notes on individual photos are kept). Reset anyway?`)) return;
              setStacks(STAGE_STACKS); setSel([]);
            }}>Reset to proposed sets</button>
            <button className="k-btn" onClick={() => (stillExtracting.length ? setConfirmProcess(true) : submit())}>
              Begin processing →
            </button>
          </div>
        </div>

        {/* — Tally strip. Every figure is FULL-CLAIM, so nothing needs a scope
              label; the three the adjuster changes are base + on-screen delta. — */}
        <section className="k-stage-tally">
          {[
            ['Photos', FULL_PHOTOS, null],
            ['Photo sets', fullSets, 'accent'],
            ['Multi-photo sets', fullMulti, null],
            ['You excluded', visContext, 'quiet'],
            ['With a note', fullNotes, fullNotes ? 'accent' : 'quiet'],
            ['Duplicates removed', 1, 'quiet'],
          ].map(([l, v, tone], i) => (
            <div key={i} className="k-stage-tally-cell">
              <div className="k-stage-tally-v" style={tone === 'accent' ? { color: 'var(--k-accent)' } : tone === 'quiet' ? { color: 'var(--k-fg-3)' } : null}>{v}</div>
              <div className="k-stage-tally-l">{l}</div>
            </div>
          ))}
        </section>


        {/* — Action bar — */}
        {/* Count line — quiet, scrolls away with the content. */}
        <div className="k-stage-countline">
          Showing <strong>{stacks.length}</strong> sets · {baseSets} proposed by Kevin
          <span style={{ color: 'var(--k-fg-4)' }}> · select sets to merge, exclude, or delete them</span>
        </div>

        {(loose.length > 0 || stillExtracting.length > 0) && (
          <div className={'k-tray' + (loose.length === 0 ? ' k-tray--pending' : '')}>
            <div className="k-tray-hd">
              <Icon d={loose.length ? I.warn : I.clock} size={14} />
              <span className="k-tray-t">
                {loose.length
                  ? `${loose.length} ${loose.length === 1 ? 'photo' : 'photos'} arrived after grouping ran, so ${loose.length === 1 ? 'it is' : 'they are'} on ${loose.length === 1 ? 'its' : 'their'} own below — merge, note or exclude ${loose.length === 1 ? 'it' : 'them'} like any other set.`
                  : `${stillExtracting.length} ${stillExtracting.length === 1 ? 'photo is' : 'photos are'} still processing. Nothing to do yet.`}
                {loose.length > 0 && stillExtracting.length > 0 &&
                  ` ${stillExtracting.length} more ${stillExtracting.length === 1 ? 'is' : 'are'} still processing.`}
              </span>
              <div style={{ flex: 1 }} />
              {loose.length > 0 && (
                <button className="k-btn k-btn--sm" onClick={clusterRemaining} disabled={clustering}>
                  {clustering ? 'Grouping…' : 'Group by capture time'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* — Set grid. The images ARE the scanning anchor, so they get the space:
              wide cards, a tall media band, and a multi-photo set splits that band
              into equal frames so every capture in the group is large enough to
              judge at a scroll. Nothing hides behind a disclosure. — */}
        <div className="k-stage-grid2" ref={gridRef}>
          {stacks.map((s, si) => {
            const selected = sel.includes(s.id);
            const isCtx = !!s.skip;
            const idx = (parseInt(s.id.replace(/[^0-9]/g, ''), 10) || 0) % 10;
            return (
              <div key={s.id} data-set={s.id} className={`k-stageset ${selected ? 'k-stageset--sel' : ''} ${isCtx ? 'k-stageset--ctx' : ''} ${s.photos.length > 2 ? 'k-stageset--wide' : ''} ${s.loose ? 'k-stageset--loose' : ''}`}>
                <div className="k-stageset-media">
                  {s.photos.map((f, fi) => (
                    <button
                      key={f} className="k-stageset-frame"
                      title={`${f} · ${(s.times && s.times[fi]) || s.time} — click to open`}
                      onClick={() => setLightbox({ set: s.id, i: fi })}
                    >
                      {thumbs[s.id]
                        ? <Thumb idx={idx + fi} fill label="" />
                        : <span className="k-stageset-skel" aria-label="Loading thumbnail" />}
                      {s.photos.length > 1 && <span className="k-stage-frame-n">{fi + 1}</span>}
                    </button>
                  ))}
                  <button
                    className="k-stage-check k-stage-check--float" data-on={selected}
                    aria-label={`Select ${SET_LABEL(si)}`}
                    onClick={() => toggleSel(s.id)}
                  >{selected && <Icon d={I.check} size={12} />}</button>
                  {isCtx && <span className="k-stageset-ctxtag">Excluded</span>}
                </div>

                <div className="k-stageset-body">
                  <div className="k-stage-rowhd">
                    <span className="k-stage-rowt">{SET_LABEL(si)}</span>
                    <span className="k-stage-rowtime">{s.time}</span>
                    <div style={{ flex: 1 }} />
                    {s.photos.length > 1
                      ? <Badge tone="accent">{s.photos.length} → 1 item</Badge>
                      : <Badge tone="quiet">1 photo</Badge>}
                  </div>
                  <div className="k-stage-rowfiles">{s.photos.join('  ·  ')}</div>
                  {s.reason && <div className="k-stage-rowreason">{s.reason}</div>}
                  {s.note && (
                    <button className="k-stage-notechip" title={s.fromField ? 'Written in the field — edit note' : 'Edit note'} onClick={() => setNoteFor(s.id)}>
                      <Icon d={I.edit} size={10} />
                      <span>{s.note}</span>
                    </button>
                  )}
                  <div className="k-stageset-acts">
                    {!s.note && (
                      <button className="k-stage-act" onClick={() => setNoteFor(s.id)} title="Add identification detail sent with these photos">
                        <Icon d={I.plus} size={11} /> Note
                      </button>
                    )}
                    {s.photos.length > 1 && (
                      <button className="k-stage-act" onClick={() => ungroup(s.id)} title="Split into one set per photo. They stay here, in capture order.">
                        Split apart
                      </button>
                    )}
                    <button className={'k-stage-act' + (isCtx ? ' k-stage-act--on' : '')} onClick={() => toggleKind(s.id)}
                      title={isCtx ? 'Put this set back into the run' : "Leave out of processing. The photos stay on the claim but produce no line item."}>
                      {isCtx ? 'Include' : 'Exclude'}
                    </button>
                    <button className="k-stage-act k-stage-act--danger" onClick={() => setConfirmDel([s.id])} title="Delete these photos from the claim">
                      <Icon d={I.trash} size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating selection toolbar — appears only with a selection, stays in
              reach at any scroll position. */}
        {sel.length > 0 && (
          <div className="k-selbar" role="toolbar" aria-label="Selection actions">
            <span className="k-selbar-n">{sel.length}</span>
            <span className="k-selbar-l">{sel.length === 1 ? 'set selected' : 'sets selected'}</span>
            <div className="k-selbar-div" />
            <button className="k-selbar-b k-selbar-b--go" disabled={sel.length < 2} onClick={mergeSel}
              title={sel.length < 2 ? 'Select another set to merge' : 'Combine into one set — becomes one line item'}>
              Merge into one item
            </button>
            <button className="k-selbar-b" onClick={() => { sel.forEach(toggleKind); setSel([]); }}>Exclude</button>
            <button className="k-selbar-b k-selbar-b--danger" onClick={() => setConfirmDel(sel)}>Delete</button>
            <div className="k-selbar-div" />
            <button className="k-selbar-x" onClick={() => setSel([])} title="Clear selection (Esc)"><Icon d={I.close} size={13} /></button>
          </div>
        )}

        {/* Photo viewer — the frames are the evidence, so they open. */}
        {lightbox && (() => {
          const set = stacks.find(x => x.id === lightbox.set);
          if (!set) return null;
          const i = Math.min(lightbox.i, set.photos.length - 1);
          const idx = (parseInt(set.id.replace(/[^0-9]/g, ''), 10) || 0) % 10;
          const si = stacks.findIndex(x => x.id === set.id);
          return (
            <div className="k-stage-noteover" onClick={() => setLightbox(null)}>
              <div className="k-stage-lb" onClick={(e) => e.stopPropagation()}>
                <div className="k-stage-lb-hd">
                  <span className="k-stage-rowt">{SET_LABEL(si)}</span>
                  <span className="k-stage-rowtime">{set.photos[i]} · {(set.times && set.times[i]) || set.time}</span>
                  <div style={{ flex: 1 }} />
                  <span className="k-stage-rowtime">{i + 1} of {set.photos.length}</span>
                  <button className="k-icon-btn" title="Close" onClick={() => setLightbox(null)}><Icon d={I.close} size={14} /></button>
                </div>
                <div className="k-stage-lb-img">
                  <Thumb idx={idx + i} fill label="Raw capture" />
                  {set.photos.length > 1 && (
                    <React.Fragment>
                      <button className="k-lb-nav k-lb-nav--prev" title="Previous photo" disabled={i === 0} onClick={() => setLightbox({ set: set.id, i: i - 1 })}><Icon d={I.chevleft} size={20} /></button>
                      <button className="k-lb-nav k-lb-nav--next" title="Next photo" disabled={i >= set.photos.length - 1} onClick={() => setLightbox({ set: set.id, i: i + 1 })}><Icon d={I.chevright} size={20} /></button>
                    </React.Fragment>
                  )}
                </div>
                <div className="k-stage-lb-ft">
                  Nothing has been identified yet — this is the raw capture. {set.photos.length > 1 ? 'All ' + set.photos.length + ' frames in this set become one line item.' : 'This set becomes one line item.'}
                </div>
              </div>
            </div>
          );
        })()}

  
        {confirmProcess && (
          <div className="k-stage-noteover" onClick={() => setConfirmProcess(false)}>
            <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
              <div className="k-notemodal-hd">
                <span>{stillExtracting.length ? `Process without ${stillExtracting.length} ${stillExtracting.length === 1 ? 'photo' : 'photos'}?` : `${stillExtracting.length} ${stillExtracting.length === 1 ? 'photo is' : 'photos are'} still processing`}</span>
                <div style={{ flex: 1 }} />
                <button className="k-icon-btn" onClick={() => setConfirmProcess(false)} aria-label="Close"><Icon d={I.close} size={14} /></button>
              </div>
              <div className="k-notemodal-body"><p className="k-notemodal-lede">
                {stillExtracting.length
                  ? `${stillExtracting.length} ${stillExtracting.length === 1 ? 'photo is' : 'photos are'} still processing, so ${stillExtracting.length === 1 ? 'it is' : 'they are'} not in any set yet and ${stillExtracting.length === 1 ? 'produces' : 'produce'} no line ${stillExtracting.length === 1 ? 'item' : 'items'}. ${loose.length === 1 ? 'It stays' : 'They stay'} on the claim and can be grouped later — nothing is deleted.`
                  : `Kevin has not finished reading ${stillExtracting.length} ${stillExtracting.length === 1 ? 'photo' : 'photos'}. Processing now leaves ${stillExtracting.length === 1 ? 'it' : 'them'} off the worksheet — ${stillExtracting.length === 1 ? 'it stays' : 'they stay'} on the claim and the audit log records ${stillExtracting.length === 1 ? 'it' : 'them'} as excluded. Waiting a moment lets ${stillExtracting.length === 1 ? 'it' : 'them'} be grouped.`}
              </p></div>
              <div className="k-notemodal-ft" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
                <button className="k-btn k-btn--ghost" onClick={() => setConfirmProcess(false)}>{loose.length ? 'Go back' : 'Wait for them'}</button>
                <button className="k-btn" onClick={() => { setConfirmProcess(false); submit(); }}>Process without them</button>
              </div>
            </div>
          </div>
        )}

        {confirmDel && (() => {
          const n = confirmDel.reduce((a, id) => a + ((stacks.find(x => x.id === id) || { photos: [] }).photos.length), 0);
          return (
            <div className="k-stage-noteover" onClick={() => setConfirmDel(null)}>
              <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
                <div className="k-notemodal-hd">
                  <div>
                    <div className="k-notemodal-t" style={{ color: 'var(--k-danger)' }}>Delete {confirmDel.length} {confirmDel.length === 1 ? 'set' : 'sets'}?</div>
                    <div className="k-notemodal-s">{n} {n === 1 ? 'photo' : 'photos'}</div>
                  </div>
                  <button className="k-icon-btn" onClick={() => setConfirmDel(null)} aria-label="Close"><Icon d={I.close} size={15} /></button>
                </div>
                <div className="k-notemodal-body">
                  <p className="k-notemodal-lede">
                    {n} {n === 1 ? 'photo' : 'photos'} will be removed from this claim. This cannot be undone. To keep the photos but leave them out of the run, use <strong style={{ color: 'var(--k-fg-2)' }}>Exclude</strong> instead.
                  </p>
                </div>
                <div className="k-notemodal-ft">
                  <div style={{ flex: 1 }} />
                  <button className="k-btn k-btn--ghost" onClick={() => setConfirmDel(null)}>Keep them</button>
                  <button className="k-btn k-btn--danger" onClick={() => doDelete(confirmDel)}>Delete {n} {n === 1 ? 'photo' : 'photos'}</button>
                </div>
              </div>
            </div>
          );
        })()}

        {noteFor && (
          <StageNoteEditor
            value={(stacks.find(x => x.id === noteFor) || {}).note}
            source={(stacks.find(x => x.id === noteFor) || {}).note_source}
            title={SET_LABEL(stacks.findIndex(x => x.id === noteFor))}
            photos={(stacks.find(x => x.id === noteFor) || { photos: [] }).photos.length}
            onSave={saveNote}
            onClose={() => setNoteFor(null)}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--k-line)' }}>
          <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)', maxWidth: 560, lineHeight: 1.5 }}>
            Grouping is optional — the proposed sets are usually right. Anything you miss can still be merged or deleted in the worksheet once Kevin has read the photos. Nothing is identified or priced until you begin processing.
          </div>
          <button className="k-btn k-btn--lg" onClick={() => (stillExtracting.length ? setConfirmProcess(true) : submit())}>
            Begin processing · {fullSets} sets →
          </button>
        </div>
      </div>
    </div>
  );
};

window.PhotoStaging = PhotoStaging;
