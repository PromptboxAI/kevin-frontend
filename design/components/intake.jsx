// New Claim Intake Portal — combined metadata + mega-upload zone

const { KevinWordmark, Icon, I, Badge } = window;

// Rejection reason codes from the upload response, mapped to adjuster-facing
// copy. Three treatments, and the distinction is the whole point:
//   • default      — a real failure: red panel, counted as failed, retryable.
//   • quiet: true  — not a failure and not fixable by re-shooting. iOS .AAE edit
//     sidecars are metadata, not photographs; listing forty under a red heading
//     alarms someone whose shoot was fine. One info line instead.
//   • stored: true — an actual SUCCESS. `duplicate` means the photo is already
//     safe in the session. These arrive in bulk after a gateway 502 (server saved
//     the chunk, gateway timed out, client retried, server refused the copy), so
//     treating them as failures reported "196 failed" for photos that were all
//     stored. They reconcile into the uploaded count and never appear as errors.
// Closed enum (backend 2d9cd67). Branch on `reason`; when the response carries
// `rejected[].detail` (human prose), SHOW detail — never branch on it. There is
// no truncated_file: a truncated upload arrives as empty_file or undecodable_image.
// The ack also carries `max_upload_bytes` — check files against it client-side
// before sending so an oversized photo costs a check, not an upload.
const REJECT_COPY = {
  duplicate:            { stored: true, text: () => 'already uploaded' },
  oversized_photo:      { quiet: false, text: (n) => `${n} is over the ${Math.round(window.KevinAPI.MAX_PHOTO_BYTES / 1048576)} MB per-photo limit` },
  oversized_dimensions: { quiet: false, text: (n) => `${n} is too large to process — re-shoot or resize` },
  empty_file:           { quiet: false, text: (n) => `${n} arrived empty and could not be read` },
  unsupported_format:   { quiet: false, text: (n) => `${n} is not a supported image — export as JPEG or HEIC` },
  undecodable_image:    { quiet: true,  text: () => 'non-image file' },
  storage_error:        { quiet: false, retryAuto: true, text: (n) => `${n} hit a storage hiccup — Kevin retries this automatically` },
};

const IntakeField = ({ label, value, mono = false, placeholder, suffix, hint, width = 240, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width }}>
    <label style={{ fontSize: 11, color: 'var(--k-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    <div className="k-ifield">
      <input
        {...(onChange ? { value, onChange } : { defaultValue: value })}
        placeholder={placeholder}
        style={{
          border: 0, outline: 0, background: 'transparent', flex: 1,
          font: 'inherit', fontSize: 13,
          fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
          fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
          color: 'var(--k-fg)',
        }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{suffix}</span>}
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
  </div>
);

const IntakeSelect = ({ label, options, defaultValue, value, onChange, onAdd, addLabel, hint, width = 240 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width }} data-add={!!onAdd}>
    <label style={{ fontSize: 11, color: 'var(--k-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <select
        {...(value !== undefined
          ? { value, onChange }
          : { defaultValue, onChange: (e) => {
              if (e.target.value === '__addjur') { e.target.value = defaultValue; onAdd && onAdd(); return; }
              onChange && onChange(e);
            } })}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          width: '100%', padding: '8px 30px 8px 11px',
          background: 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 6,
          font: 'inherit', fontSize: 13, color: 'var(--k-fg)', cursor: 'pointer',
          outline: 0,
        }}
      >
        {options.filter(o => o !== '__addjur').map((o) => <option key={o} value={o}>{o}</option>)}
        {addLabel && <option value="__addjur">{addLabel}</option>}
      </select>
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--k-fg-4)', display: 'flex' }}><Icon d={I.chevdown} size={14} /></span>
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
  </div>
);

const Intake = ({ onBegin }) => {
  // Append mode — reached from Add photos on the claim overview / worksheet.
  const addingTo = (() => {
    try { return new URLSearchParams(window.location.search).get('claim'); } catch (e) { return null; }
  })();
  const appending = !!addingTo;
  const nextNo = (window.CLAIM_INGEST || {}).nextItemNo || 1;
  const [schedules, setSchedules] = React.useState(['Xactimate depreciation schedule', 'Carrier custom schedule']);
  const [depSchedule, setDepSchedule] = React.useState('Xactimate depreciation schedule');
  const [addOpen, setAddOpen] = React.useState(false);
  const fileRef = React.useRef(null);
  const zipRef = React.useRef(null);
  const folderRef = React.useRef(null);
  // null = nothing picked yet (the seed queue below stands in). Once the adjuster
  // chooses files this holds their real selection.
  const [picked, setPicked] = React.useState(null);
  const [expanding, setExpanding] = React.useState(null);
  const [zipJunk, setZipJunk] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zipError, setZipError] = React.useState(null);
  // null = not started. { chunk, total, sent, failed } while running.
  const [upload, setUpload] = React.useState(null);
  const uploadRef = React.useRef(null);

  const startUpload = () => {
    const chunks = window.KevinAPI.planUploadChunks(sendable);
    if (!chunks.length) return;
    setUpload({ chunk: 0, total: chunks.length, sent: 0, failed: 0, done: false });
    let i = 0;
    const next = () => {
      if (i >= chunks.length) { setUpload(u => u && { ...u, done: true }); return; }
      const size = chunks[i].length;
      setUpload(u => u && { ...u, chunk: i + 1 });
      window.KevinAPI.uploadChunk('CLM-2026-04412', chunks[i])
        .then(() => { i += 1; setUpload(u => u && { ...u, sent: u.sent + size, chunk: Math.min(i + 1, chunks.length) }); uploadRef.current = setTimeout(next, 420); })
        .catch(() => {
          // A 413 halves the chunk and retries it alone — never the whole batch.
          i += 1; setUpload(u => u && { ...u, failed: u.failed + size }); uploadRef.current = setTimeout(next, 420);
        });
    };
    next();
  };
  React.useEffect(() => () => clearTimeout(uploadRef.current), []);

  const IS_PHOTO = /\.(jpe?g|png|heic|heif)$/i;
  // Keeps the photos, counts what it dropped. Callers must use this rather than
  // filtering inline, or the skip line under-reports.
  const keepPhotos = (files) => {
    const photos = files.filter(f => IS_PHOTO.test(f.name));
    const skipped = files.length - photos.length;
    if (skipped > 0) setZipJunk(j => j + skipped);
    return photos;
  };

  // Files that will actually be sent: everything not over the per-photo cap.
  // Both CTAs read this — divergent expressions are how they drifted apart.
  const sendable = (picked || []).filter(f => f.bytes <= window.KevinAPI.MAX_PHOTO_BYTES);
  const sendableCount = () => sendable.length;

  const resetUpload = () => { clearTimeout(uploadRef.current); setUpload(null); };

  const takeFiles = (fileList) => {
    resetUpload();
    const files = [...fileList].map(f => ({ name: f.name, bytes: f.size }));
    if (!files.length) return;
    setPicked(prev => {
      const merged = [...(prev || []), ...files];
      // Same hash-free name+size check the client does before hashing, so an
      // obvious re-pick of the same folder does not double the queue.
      const seen = new Set();
      return merged.filter(f => { const k = f.name + ':' + f.bytes; if (seen.has(k)) return false; seen.add(k); return true; });
    });
  };

  // Walk a dropped directory tree. Depth-first, awaited — readEntries() returns
  // at most 100 per call, so it must be drained in a loop or large folders come
  // back truncated.
  const readEntry = async (entry, out) => {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      out.push(file);
      return;
    }
    const dirReader = entry.createReader();
    for (;;) {
      const batch = await new Promise((res, rej) => dirReader.readEntries(res, rej));
      if (!batch.length) break;
      for (const e of batch) await readEntry(e, out);
    }
  };

  const takeZip = (fileList) => {
    const zip = fileList && fileList[0];
    if (!zip) return;
    setExpanding({ name: zip.name, read: 0, total: 0 });
    window.KevinAPI.expandZip(zip, (p) => setExpanding(e => e && { ...e, ...p }))
      .then(({ photos, junkSkipped, error }) => {
        setExpanding(null);
        setZipError(error || null);
        // expandZip reports what it filtered; discarding it meant a real archive
        // silently dropped __MACOSX/.DS_Store entries with nothing on screen, so
        // the count would not match what the adjuster saw in Finder.
        setZipJunk(j => j + (junkSkipped || 0));
        takeFiles(photos.map(p => ({ name: p.name, size: p.bytes })));
      });
  };
  // Loss ZIP → tax jurisdiction. The ZIP is the input of record; the rate field
  // reflects it rather than being typed independently. We have no Xactimate
  // jurisdiction lookup, so an unrecognised ZIP prompts the adjuster to add the
  // jurisdiction rather than silently guessing a rate.
  const TAX_BY_ZIP = {
    '11787': { label: 'Smithtown, NY', rate: 8.625, county: 'Suffolk County' },
    '11788': { label: 'Hauppauge, NY', rate: 8.625, county: 'Suffolk County' },
    '11501': { label: 'Mineola, NY',   rate: 8.625, county: 'Nassau County' },
    '10001': { label: 'New York, NY',  rate: 8.875, county: 'New York City' },
    '18501': { label: 'Scranton, PA',  rate: 6.0,   county: 'Lackawanna County' },
  };
  const [zip, setZip] = React.useState('11787');
  const [taxAdded, setTaxAdded] = React.useState([]);
  const [jurOpen, setJurOpen] = React.useState(false);
  const [jurName, setJurName] = React.useState('');
  const [jurRate, setJurRate] = React.useState('');
  const zipTax = taxAdded.find(j => j.zip === zip) || TAX_BY_ZIP[zip] || null;
  const taxOptions = zipTax
    ? [`${zipTax.label} (${zip}) · ${zipTax.rate}%`, ...(zipTax.county ? [`${zipTax.county} · ${zipTax.rate}%`] : []), 'State only · 4%', 'No tax · 0%']
    : [`No jurisdiction on file for ${zip || '—'}`, 'No tax · 0%'];
  const addJurisdiction = () => {
    if (!jurName.trim() || !jurRate.trim()) return;
    setTaxAdded(a => [...a, { zip, label: jurName.trim(), rate: parseFloat(jurRate) || 0 }]);
    setJurName(''); setJurRate(''); setJurOpen(false);
  };
  // Seed values come from the server (GET /schedules/defaults), not from local tables.
  const cloneRates = () => window.KevinAPI.getScheduleDefaults().rates;
  const cloneLives = () => window.KevinAPI.getScheduleDefaults().lives;
  const blank = () => ({ name: '', method: 'Straight-line', cap: '90', rates: cloneRates(), lives: cloneLives() });
  const [draft, setDraft] = React.useState(blank);
  const openAdd = () => { setDraft(blank()); setAddOpen(true); };
  const capNum = () => Math.max(0, Math.min(100, Number(draft.cap) || 100));
  // representative age at each bracket midpoint, for straight-line preview
  const BR_AGE = [0.5, 1.5, 4, 8, 13, 20];
  const slRate = (life, i) => Math.min(Math.round((BR_AGE[i] / (Number(life) || 1)) * 100), capNum());
  const setRate = (cat, i, v) => {
    const n = v === '' ? '' : Math.max(0, Math.min(draft.method === 'Custom' ? 100 : capNum(), Number(v) || 0));
    setDraft((d) => ({ ...d, rates: { ...d.rates, [cat]: d.rates[cat].map((x, k) => (k === i ? n : x)) } }));
  };
  const setLife = (cat, v) => {
    const n = v === '' ? '' : Math.max(1, Number(v) || 1);
    setDraft((d) => ({ ...d, lives: { ...d.lives, [cat]: n } }));
  };
  const saveSchedule = () => {
    const name = draft.name.trim();
    if (!name) return;
    setSchedules((s) => s.includes(name) ? s : [...s, name]);
    setDepSchedule(name);
    setAddOpen(false);
  };
  // A 312-photo drop, chunked at 40 files per POST. The adjuster never chose to
  // chunk — they picked everything and clicked once — so the UI reports chunk
  // progress as ONE upload, and only surfaces chunks when something fails.
  // ⚠️ BOUNDARY — EVERY VALUE IN THIS BLOCK AND IN `queueFiles` BELOW IS FAKE.
  // Do NOT ship these literals. The queue is live upload state and must be built
  // from the user's actual FileList + the chunk responses:
  //   • TOTAL_FILES  → files.length from the picker/drop (any count; no cap)
  //   • CHUNK        → KevinAPI.UPLOAD_CHUNK_FILES (real — keep reading it)
  //   • chunksTotal  → planUploadChunks(files).length
  //   • chunkDone    → chunks whose POST has resolved
  //   • filesDone    → sum of `accepted` across resolved chunks
  //   • storedTotal  → filesDone + storedDupes.length (what is safely on the claim)
  //   • storedDupes  → rejected entries whose reason is 'duplicate' (a SUCCESS —
  //                    already stored; count them as stored, never as failed)
  //   • realFails    → rejected entries that are neither 'duplicate' nor quiet
  //   • quietSkips   → rejected entries with reason 'undecodable_image'
  //   • rejected     → concatenated `rejected: [{filename, reason}]` from every
  //                    chunk response — render them all, never truncate
  //   • the GB readout → bytes sent / total bytes selected
  //   • queueFiles   → one row PER SELECTED FILE with real name, size and status
  //                    (queued → uploading %→ uploaded | duplicate | rejected)
  // A 312-file drop renders 312 rows. The ten rows below are a display sample so
  // the layout can be reviewed; they are not a schema and not a page size.
  const CHUNK = window.KevinAPI.UPLOAD_CHUNK_FILES;
  const live = !!picked;                       // true once the adjuster picks files
  const TOTAL_FILES = live ? picked.length : 312;
  // Real chunk plan — count AND bytes, exactly as production splits it.
  const plan = live ? window.KevinAPI.planUploadChunks(picked) : null;
  const chunksTotal = live ? plan.length : Math.ceil(312 / CHUNK);
  const chunkDone = live ? 0 : 5;
  const filesDone = live ? 0 : 197;
  // Rejections arrive per chunk as [{ filename, reason }] — never dropped
  // silently, so the adjuster knows exactly what to fix and resend.
  // `reason` is a machine CODE, not prose — see REJECT_COPY above.
  // A real selection is checked against the one limit the client can enforce
  // before sending: per-photo size. Everything else comes back from the server.
  const rejected = live
    ? picked.filter(f => f.bytes > window.KevinAPI.MAX_PHOTO_BYTES).map(f => ({ filename: f.name, reason: 'oversized_photo' }))
    : [
    { filename: 'garage_wide_04.heic', reason: 'oversized_photo' },
    { filename: 'IMG_0231.dng',        reason: 'unsupported_format' },
    { filename: 'attic_beam.jpg',      reason: 'empty_file' },
    // iOS edit-sidecars — not photographs, so they never reach the red panel.
    ...Array.from({ length: 38 }, (_, i) => ({ filename: `._IMG_${2100 + i}.AAE`, reason: 'undecodable_image' })),
    // A chunk retried after a gateway 502: the server had already saved these,
    // so they come back `duplicate` — a SUCCESS, reconciled into the stored count.
    ...Array.from({ length: 20 }, (_, i) => ({ filename: `garage_${String(i + 1).padStart(2, '0')}.heic`, reason: 'duplicate' })),
  ];
  const meta = (r) => REJECT_COPY[r.reason] || {};
  // Duplicates are stored, not failed — they must never reach the red panel.
  const storedDupes = rejected.filter(r => meta(r).stored);
  const quietSkips  = rejected.filter(r => meta(r).quiet);
  const realFails   = rejected.filter(r => !meta(r).stored && !meta(r).quiet);
  // Reconcile against the backend's photo_count so the adjuster sees what is
  // safely in the session, not what the transport had to retry.
  const storedTotal = filesDone + storedDupes.length;
  // A .zip is expanded in the browser, so OS junk never reaches the backend.
  const zipJunkSkipped = live ? zipJunk : 12;

  const fmtMB = (b) => {
    if (!b) return '0 KB';
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  };
  // Rows flip queued → uploaded as chunks resolve, in the order they are sent.
  let sentLeft = upload ? upload.sent : 0;
  const queueFiles = live
    ? picked.map(f => {
        const over = f.bytes > window.KevinAPI.MAX_PHOTO_BYTES;
        let status = over ? 'fail' : 'queued';
        if (!over && sentLeft > 0) { status = 'done'; sentLeft -= 1; }
        return { name: f.name, size: fmtMB(f.bytes), status };
      })
    : [
    { name: 'kitchen_island_north.jpg',          size: '4.1 MB', status: 'done' },
    { name: 'kitchen_island_south.jpg',          size: '4.0 MB', status: 'done' },
    { name: 'pantry_overview.jpg',               size: '3.6 MB', status: 'done' },
    { name: 'living_room_tv_wall.jpg',           size: '4.4 MB', status: 'done' },
    { name: 'master_bdrm_mattress_a.jpg',        size: '3.9 MB', status: 'done' },
    { name: 'pantry_overview.jpg',               size: '3.6 MB', status: 'dup'  },
    { name: 'home_office_desk.jpg',              size: '4.2 MB', status: 'done' },
    { name: 'garage_tools_bench.heic',           size: '5.2 MB', status: 'up',  pct: 68 },
    { name: 'garage_tools_pegboard.heic',        size: '4.8 MB', status: 'up',  pct: 12 },
    { name: 'reyes_inventory_full.zip',          size: '748 MB', status: 'up',  pct: 41 },
  ];

  return (
    <div className="k-intake">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active={appending ? 'My claims' : 'New claim'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge tone="quiet" dot={true}>Draft — auto-saved 2s ago</Badge>
          <window.AvatarMenu />
        </div>
      </header>

      <div className="k-intake-body">
        {/* — Title — */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            {appending && <a className="k-crumb" href="12-Claim-overview.html" title="Back to the claim"><Icon d={I.chevleft} size={12} /> Godfrey — Kitchen fire</a>}
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>{appending ? `${addingTo} · new batch` : 'Claim details, then photos'}</div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 38, letterSpacing: '-0.025em', margin: '6px 0 4px', lineHeight: 1.1 }}>{appending ? 'Add photos to this claim' : 'Start a new claim'}</h1>
            <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: 0, maxWidth: 580, lineHeight: 1.5 }}>
              {appending
                ? 'Drop another batch and Kevin appends to the existing inventory.'
                : 'Enter the claim metadata, drop your photos, and Kevin starts working immediately. You’ll land in the review worksheet as soon as the first batch finishes processing.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="k-btn k-btn--ghost" href="01-My-claims.html">Cancel</a>
            <button
              className="k-btn"
              onClick={() => {
                if (!live) return onBegin();
                if (!upload) return startUpload();
                if (upload.sent > 0) { window.KEVIN_UPLOAD_PENDING = Math.max(0, (TOTAL_FILES - realFails.length) - upload.sent); onBegin(); }
              }}
              disabled={live && ((upload && upload.sent === 0) || sendableCount() === 0)}
              title={live && !upload ? 'Uploads in batches, then opens staging' : undefined}
            >
              {!live
                ? (appending ? 'Add photos to stage' : 'Continue → Stage photos')
                : !upload
                  ? (sendableCount() === 0 ? 'Nothing to upload' : `Upload & stage ${sendableCount()} →`)
                  : upload.done ? 'Go to staging →' : 'Continue to staging →'}
            </button>
          </div>
        </div>

        {/* — Metadata form. Hidden when appending: the claim already owns these
              values, and an editable copy here would silently fork them. — */}
        {!appending && (
        <section className="k-intake-section">
          <div className="k-intake-section-hd">
            <span className="k-step-num">01</span>
            <div>
              <div className="k-intake-section-t">Claim details</div>
              <div className="k-intake-section-s">These appear on the export and govern sales tax calculation.</div>
            </div>
          </div>
          <div className="k-intake-form">
            <IntakeField label="Insured — first name" value="Kevin" width={200} />
            <IntakeField label="Insured — last name" value="Godfrey" width={200} />
            <div style={{ width: '100%', height: 0 }}></div>
            <IntakeField label="Loss address" value="123 Main St." width={260} />
            <IntakeField label="City" value="Smithtown" width={160} />
            <IntakeSelect label="State" defaultValue="NY" options={window.US_STATES} width={92} />
            <IntakeField label="Loss ZIP" value={zip} onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))} mono width={120} hint={zipTax ? `${zipTax.label} · ${zipTax.rate}%` : 'Not recognised — add the jurisdiction'} />
            <div style={{ width: '100%', height: 0 }}></div>
            <IntakeField label="Claim number" value="CLM-2026-04412" mono width={220} />
            <IntakeField label="Policy number" value="9 4 2 1 7 8 0 3 6" mono width={200} />
            <IntakeField label="Date of loss" value="04 / 18 / 2026" mono width={170} />
            <IntakeField label="Cause of loss" value="Kitchen fire" width={200} />
            <IntakeSelect label="Local tax rate" key={zip + ':' + taxAdded.length} defaultValue={taxOptions[0]} options={[...taxOptions, '__addjur']} addLabel="+ Add tax jurisdiction…" onAdd={() => setJurOpen(true)} width={230} hint={zipTax ? 'Resolved from the loss ZIP' : 'No lookup for this ZIP — add it'} />
            <IntakeSelect label="Contents coverage label" defaultValue="Coverage C — Personal Property" options={['Coverage C — Personal Property', 'Personal Property', 'Contents', 'Coverage B — Contents (renters)', 'Business Personal Property', 'Unscheduled Personal Property']} width={280} hint="Policies name this differently — matches the insured's declarations page" />
            <IntakeField label="Personal property limit" value="$175,000" mono width={180} hint="Warns when the inventory nears it" />
            <IntakeField label="Amount already claimed" value="$0" mono width={180} hint="Prior contents payments on this loss" />
            <div style={{ width: '100%', height: 0 }}></div>
            <IntakeField label="Policy form" value="HO-3 · Open perils" width={200} />
            <IntakeField label="Carrier / agency" value="Allstate" width={240} />
          </div>
        </section>
        )}

        {/* — Mega-upload — */}
        <section className="k-intake-section">
          <div className="k-intake-section-hd">
            <span className="k-step-num">{appending ? '01' : '02'}</span>
            <div>
              <div className="k-intake-section-t">Add photos</div>
              <div className="k-intake-section-s">Everything you shot on site. Kevin starts as soon as the first batch lands.</div>
            </div>
          </div>

          <div className="k-dropzone"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('k-dropzone--over'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('k-dropzone--over')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('k-dropzone--over');
              const items = [...(e.dataTransfer.items || [])]
                .map(it => it.webkitGetAsEntry && it.webkitGetAsEntry())
                .filter(Boolean);
              const plainFiles = [...(e.dataTransfer.files || [])];
              const handle = (files) => {
                const zip = files.find(f => /\.zip$/i.test(f.name));
                if (zip) takeZip([zip]);
                const rest = keepPhotos(files.filter(f => !/\.zip$/i.test(f.name)));
                if (rest.length) takeFiles(rest);
              };
              if (items.some(en => en.isDirectory)) {
                setExpanding({ name: items.find(en => en.isDirectory).name, read: 0, total: 0 });
                (async () => {
                  const out = [];
                  for (const en of items) { try { await readEntry(en, out); } catch (err) { /* skip unreadable */ } }
                  setExpanding(null);
                  handle(out);
                })();
              } else {
                handle(plainFiles);
              }
            }}>
            <div className="k-dropzone-inner">
              <div className="k-dropzone-icon">
                <Icon d={I.upload} size={26} stroke={1.4} />
              </div>
              <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 26, letterSpacing: '-0.02em', fontWeight: 400 }}>Drop photos, a folder, or a .zip.</div>
              <div style={{ fontSize: 13, color: 'var(--k-fg-3)', marginTop: 6 }}>
                Accepts JPG, PNG, HEIC. Max {Math.round(window.KevinAPI.MAX_PHOTO_BYTES / 1048576)}&nbsp;MB per photo.
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)', marginTop: 10 }}>
                No photos? <a href="75-Written-import.html" style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>Import a typed or exported list</a> instead — PDF, CSV or Excel.
              </div>
              <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 5 }}>
                Select them all at once — Kevin uploads in batches and removes duplicates as they arrive.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/heic,.heic,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { takeFiles(e.target.files); e.target.value = ''; }} />
                <input ref={zipRef} type="file" accept=".zip,application/zip" style={{ display: 'none' }} onChange={(e) => { takeZip(e.target.files); e.target.value = ''; }} />
                <input ref={folderRef} type="file" webkitdirectory="" directory="" multiple style={{ display: 'none' }} onChange={(e) => { takeFiles(keepPhotos([...e.target.files])); e.target.value = ''; }} />
                <button className="k-btn" onClick={() => fileRef.current && fileRef.current.click()}>Choose files</button>
                <button className="k-btn k-btn--ghost" onClick={() => folderRef.current && folderRef.current.click()}>Choose folder</button>
                <a className="k-btn k-btn--ghost" href="75-Written-import.html" title="A typed or exported inventory — no photographs"><Icon d={I.file} size={12} /> Import a written list</a>
                <button className="k-btn k-btn--ghost" onClick={() => zipRef.current && zipRef.current.click()} title="Expanded in your browser — the archive itself is never uploaded"><Icon d={I.zip} size={12} /> Upload .zip</button>
              </div>
            </div>
            <div className="k-dropzone-ghosts" />
          </div>

          <div className="k-queue">
            <div className="k-queue-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Upload queue</span>
                <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
                  {live
                    ? (upload
                        ? `${upload.sent} of ${TOTAL_FILES - realFails.length} uploaded${upload.done ? ' · complete' : ''}`
                        : `${TOTAL_FILES} selected · ${chunksTotal} ${chunksTotal === 1 ? 'batch' : 'batches'} of up to ${CHUNK}${realFails.length ? ` · ${realFails.length} over the size limit` : ''}`)
                    : `${TOTAL_FILES} selected · ${storedTotal} safely stored${storedDupes.length ? ` (${storedDupes.length} already had copies)` : ''}${realFails.length ? ` · ${realFails.length} failed` : ''}`}
                </span>
                {paused && <span className="k-paused" title="The batch in flight finishes; nothing new is sent"><span className="k-paused-dot" /> Paused</span>}
                <span className="k-chunk-pill" title={`Sent in batches of ${CHUNK} so a large drop cannot time out`}>
                  {upload && upload.done
                    ? `${upload.total} ${upload.total === 1 ? 'batch' : 'batches'} sent`
                    : upload
                    ? `batch ${upload.chunk} of ${upload.total}`
                    : chunkDone === 0
                      ? `${chunksTotal} ${chunksTotal === 1 ? 'batch' : 'batches'}`
                      : `batch ${chunkDone} of ${chunksTotal}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="k-progress" style={{ width: 220 }}>
                  <div className="k-progress-bar" style={{ width: live
                    ? Math.round(((upload ? upload.sent : 0) / Math.max(1, TOTAL_FILES - realFails.length)) * 100) + '%'
                    : Math.round((storedTotal / TOTAL_FILES) * 100) + '%' }} />
                </div>
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)', fontFeatureSettings: '"tnum"' }}>
                  {live
                    ? `${fmtMB(sendable.slice(0, upload ? upload.sent : 0).reduce((a, f) => a + f.bytes, 0))} / ${fmtMB(sendable.reduce((a, f) => a + f.bytes, 0))}`
                    : '1.21 / 1.94 GB'}
                </span>
                {live
                  ? <button className="k-btn k-btn--ghost" onClick={() => { setPicked(null); setZipJunk(0); resetUpload(); }}>Clear</button>
                  : <button className={'k-btn k-btn--ghost' + (paused ? ' k-btn--active' : '')} onClick={() => setPaused(p => !p)}
                      title={paused ? 'Resume sending the remaining batches' : 'Finish the batch in flight, then stop before the next one'}>
                      {paused ? 'Resume' : 'Pause all'}
                    </button>}
              </div>
            </div>
            {zipError && (
              <div className="k-reject">
                <div className="k-reject-hd">
                  <Icon d={I.warn} size={14} />
                  <span className="k-reject-t">That .zip could not be opened</span>
                  <div style={{ flex: 1 }} />
                  <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => setZipError(null)}>Dismiss</button>
                </div>
                <div className="k-reject-ft">{zipError} — try re-creating the archive, or drop the photos in directly.</div>
              </div>
            )}
            {expanding && (
              <div className="k-skipline">
                <Icon d={I.zip} size={13} />
                <span>Reading <strong style={{ color: 'var(--k-fg-3)' }}>{expanding.name}</strong> in your browser{expanding.total ? ` — ${expanding.read} of ${expanding.total}` : '…'}. Nothing is uploaded until it finishes.</span>
              </div>
            )}
            {realFails.length > 0 && (
              <div className="k-reject">
                <div className="k-reject-hd">
                  <Icon d={I.warn} size={14} />
                  <span className="k-reject-t">
                    {live
                      ? `${realFails.length} ${realFails.length === 1 ? 'photo is' : 'photos are'} over the size limit`
                      : `${realFails.length} ${realFails.length === 1 ? 'photo' : 'photos'} could not be uploaded`}
                  </span>
                  <div style={{ flex: 1 }} />
                  {!live && <button className="k-btn k-btn--sm k-btn--ghost">Retry these {realFails.length}</button>}
                </div>
                {realFails.map((r, i) => (
                  <div key={i} className="k-reject-row">
                    <span className="k-reject-file">{r.filename}</span>
                    <span className="k-reject-why">{r.detail || (REJECT_COPY[r.reason] || { text: () => r.reason }).text(r.filename).replace(r.filename + ' ', '')}</span>
                  </div>
                ))}
                <div className="k-reject-ft">
                  {!live
                    ? 'Everything else uploaded normally. Fix these and drop them in — nothing needs re-sending.'
                    : upload && upload.done
                      ? `These were skipped. The other ${upload.sent} uploaded — remove or replace these and drop them in.`
                      : upload
                        ? `These are being skipped. ${upload.sent} of ${sendableCount()} sent so far.`
                        : `These won't be sent. Remove or replace them, or go ahead — the other ${sendableCount()} are ready.`}
                </div>
              </div>
            )}
            {(quietSkips.length > 0 || zipJunkSkipped > 0) && (
              <div className="k-skipline">
                <Icon d={I.info} size={13} />
                <span>
                  {storedDupes.length > 0 && <React.Fragment><strong style={{ color: 'var(--k-fg-3)' }}>{storedDupes.length} photos were already stored</strong> — a slow response meant the app re-sent them, and the server kept the first copy. Nothing was lost or duplicated. </React.Fragment>}
                  {quietSkips.length + zipJunkSkipped > 0 && <React.Fragment>{quietSkips.length + zipJunkSkipped} non-image {quietSkips.length + zipJunkSkipped === 1 ? 'file' : 'files'} skipped — <span style={{ fontFamily: 'var(--k-font-mono)' }}>.AAE</span> edit sidecars, <span style={{ fontFamily: 'var(--k-font-mono)' }}>.DS_Store</span> and <span style={{ fontFamily: 'var(--k-font-mono)' }}>__MACOSX</span> entries your phone and Mac store alongside photos. </React.Fragment>}
                  Nothing you shot was affected.
                </span>
              </div>
            )}
            <div className="k-queue-list">
              {queueFiles.map((f, i) => (
                <div key={i} className={`k-queue-row ${f.status === 'dup' ? 'k-queue-row--dup' : ''}`}>
                  <Icon d={f.name.endsWith('.zip') ? I.zip : I.camera} size={14} />
                  <span style={{ flex: 1, fontSize: 12.5, fontFamily: 'var(--k-font-mono)', color: f.status === 'dup' ? 'var(--k-fg-4)' : 'var(--k-fg-2)', textDecoration: f.status === 'dup' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', width: 70, textAlign: 'right' }}>{f.size}</span>
                  <div style={{ width: 210 }}>
                    {f.status === 'done' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', fontSize: 11 }}>
                        <Badge tone="ok" dot={true}>Hashed · uploaded</Badge>
                      </div>
                    )}
                    {f.status === 'dup' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', fontSize: 11 }}>
                        <Badge tone="ok" dot={true}>Already stored</Badge>
                      </div>
                    )}
                    {f.status === 'queued' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 11 }}>
                        <Badge tone="quiet">Ready to send</Badge>
                      </div>
                    )}
                    {f.status === 'fail' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 11 }}>
                        <Badge tone="warn">Over {Math.round(window.KevinAPI.MAX_PHOTO_BYTES / 1048576)} MB</Badge>
                      </div>
                    )}
                    {f.status === 'up' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <div className="k-progress" style={{ width: 130 }}>
                          <div className="k-progress-bar" style={{ width: `${f.pct}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-3)', width: 32 }}>{f.pct}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* — Sticky action bar — follows the queue so the next step is always
              a thumb-width away, not a scroll back to the header. — */}
        {live && (
          <div className="k-intake-stickybar">
            <div className="k-intake-stickybar-in">
              {upload && (
                <div className="k-upbar-ring" style={{ '--pct': Math.round((upload.sent / Math.max(1, TOTAL_FILES - realFails.length)) * 100) }}>
                  <span>{Math.round((upload.sent / Math.max(1, TOTAL_FILES - realFails.length)) * 100)}%</span>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-fg)' }}>
                  {upload
                    ? (upload.done
                        ? `All ${upload.sent} photos uploaded`
                        : `Uploading batch ${upload.chunk} of ${upload.total}`)
                    : sendableCount() === 0
                      ? 'Nothing can be sent'
                      : `${sendableCount()} ${sendableCount() === 1 ? 'photo' : 'photos'} ready`}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                  {upload
                    ? (upload.done
                        ? 'Kevin is identifying them now.'
                        : `${upload.sent} of ${TOTAL_FILES - realFails.length} sent${upload.sent > 0 ? ' · you can move on, uploading continues' : ''}`)
                    : (realFails.length ? `${realFails.length} over the size limit won't be sent` : 'Kevin starts as soon as the upload finishes')}
                  {!upload && zipJunkSkipped ? ` · ${zipJunkSkipped} non-image skipped` : ''}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {!upload && <button className="k-btn k-btn--ghost" onClick={() => { setPicked(null); setZipJunk(0); resetUpload(); }}>Clear</button>}
              {!upload ? (
                <button className="k-btn k-btn--lg" onClick={startUpload} disabled={sendableCount() === 0}>
                  {sendableCount() === 0
                    ? 'Nothing to upload'
                    : `Upload & stage ${sendableCount()} ${sendableCount() === 1 ? 'photo' : 'photos'} →`}
                </button>
              ) : (
                <button className="k-btn k-btn--lg" onClick={() => { window.KEVIN_UPLOAD_PENDING = Math.max(0, (TOTAL_FILES - realFails.length) - upload.sent); onBegin(); }} disabled={upload.sent === 0}
                  title={upload.sent === 0 ? 'Available once the first batch lands' : 'The rest keeps uploading while you review'}>
                  {upload.done ? 'Go to staging →' : 'Continue to staging →'}
                </button>
              )}
            </div>
          </div>
        )}


     </div>

      {jurOpen && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', background: 'oklch(0.2 0.02 250 / 0.42)' }} onClick={() => setJurOpen(false)}>
          <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
            <div className="k-notemodal-hd">
              <div>
                <div className="k-notemodal-t">Add tax jurisdiction</div>
                <div className="k-notemodal-s">ZIP {zip || '—'}</div>
              </div>
              <button className="k-icon-btn" onClick={() => setJurOpen(false)} aria-label="Close"><Icon d={I.close} size={15} /></button>
            </div>
            <div className="k-notemodal-body">
              <p className="k-notemodal-lede">
                Kevin has no jurisdiction on file for this ZIP. Enter the rate from the taxing authority and it will apply to every line on this claim, and be remembered for this ZIP next time.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <IntakeField label="Jurisdiction name" value={jurName} onChange={(e) => setJurName(e.target.value)} placeholder="Scranton, PA" width={220} />
                <IntakeField label="Rate" value={jurRate} onChange={(e) => setJurRate(e.target.value.replace(/[^0-9.]/g, ''))} mono suffix="%" placeholder="6.0" width={110} />
              </div>
            </div>
            <div className="k-notemodal-ft">
              <div style={{ flex: 1 }} />
              <button className="k-btn k-btn--ghost" onClick={() => setJurOpen(false)}>Cancel</button>
              <button className="k-btn" onClick={addJurisdiction} disabled={!jurName.trim() || !jurRate.trim()}>Add jurisdiction</button>
            </div>
          </div>
        </div>
      )}

      {/* PARKED — no longer reachable. Intake's "Processing settings" step was
          removed: the depreciation schedule comes from Settings → Business and
          every real adjustment happens in the worksheet, so a third intake step
          only added a decision before the adjuster had seen a single item. Kept
          intact in case a per-claim schedule picker is wanted later; if revived,
          wire it from the worksheet toolbar, not from intake. */}
      {addOpen && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, background: 'transparent', height: '100%', zIndex: 100 }}>
          <div className="k-export-scrim" onClick={() => setAddOpen(false)} />
          <div className="k-export-modal" style={{ maxWidth: 720 }}>
            <div className="k-export-hd">
              <div>
                <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>New depreciation schedule</div>
                <div style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', marginTop: 2 }}>Add a schedule</div>
              </div>
              <button className="k-btn k-btn--ghost" onClick={() => setAddOpen(false)} style={{ padding: 6, lineHeight: 0 }}><span style={{ display: 'inline-flex', transform: 'rotate(45deg)' }}><Icon d={I.plus} size={16} /></span></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '62vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <IntakeField label="Schedule name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Chubb HO depreciation" width={240} />
                <IntakeSelect label="Method" value={draft.method} onChange={(e) => setDraft((d) => ({ ...d, method: e.target.value }))} options={['Straight-line', 'Bracketed (class × age)', 'Custom']} width={210} />
                <IntakeField label="Max depreciation cap" value={draft.cap} onChange={(e) => setDraft((d) => ({ ...d, cap: e.target.value }))} mono suffix="%" width={160} hint={`Never depreciates past this — ${100 - capNum()}% floor kept as RCV`} />
              </div>

              {draft.method === 'Straight-line' && (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--k-fg-2)', marginBottom: 8 }}>Useful life by class</div>
                <div className="k-depgrid">
                  <div className="k-depgrid-row k-depgrid-row--head" style={{ gridTemplateColumns: '1.6fr 0.9fr repeat(6, 1fr)' }}>
                    <div className="k-depgrid-c k-depgrid-c--cat">Content class</div>
                    <div className="k-depgrid-c k-depgrid-c--num">Life (yr)</div>
                    {window.DEP_BRACKET_LABELS.map((l) => <div key={l} className="k-depgrid-c k-depgrid-c--num">{l}</div>)}
                  </div>
                  {window.PCS_CATEGORIES.map((cat) => (
                    <div key={cat} className="k-depgrid-row" style={{ gridTemplateColumns: '1.6fr 0.9fr repeat(6, 1fr)' }}>
                      <div className="k-depgrid-c k-depgrid-c--cat">{cat}</div>
                      <div className="k-depgrid-c k-depgrid-c--num">
                        <input type="number" min="1" value={draft.lives[cat]} onChange={(e) => setLife(cat, e.target.value)} className="k-depgrid-input k-mono" />
                      </div>
                      {window.DEP_BRACKET_LABELS.map((_, i) => (
                        <div key={i} className="k-depgrid-c k-depgrid-c--num k-mono" style={{ color: 'var(--k-fg-4)', justifyContent: 'flex-end', paddingRight: 12 }}>{slRate(draft.lives[cat], i)}</div>
                      ))}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--k-fg-4)', margin: '10px 0 0', lineHeight: 1.5 }}>
                  Straight-line: depreciation = (item age ÷ useful life) × 100, capped at {capNum()}%. The grey columns preview the resulting % at each age bracket — edit a useful life and they recompute live. This is Kevin's default method.
                </p>
              </div>
              )}

              {draft.method !== 'Straight-line' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--k-fg-2)' }}>Depreciation rate by class &amp; age</div>
                  <button className="k-btn k-btn--ghost k-btn--sm" onClick={() => setDraft((d) => ({ ...d, rates: cloneRates() }))}>Reset to standard</button>
                </div>
                <div className="k-depgrid">
                  <div className="k-depgrid-row k-depgrid-row--head">
                    <div className="k-depgrid-c k-depgrid-c--cat">Content class</div>
                    {window.DEP_BRACKET_LABELS.map((l) => <div key={l} className="k-depgrid-c k-depgrid-c--num">{l}</div>)}
                  </div>
                  {window.PCS_CATEGORIES.map((cat) => (
                    <div key={cat} className="k-depgrid-row">
                      <div className="k-depgrid-c k-depgrid-c--cat">{cat}</div>
                      {(draft.rates[cat] || []).map((v, i) => (
                        <div key={i} className="k-depgrid-c k-depgrid-c--num">
                          <input type="number" min="0" max="100" value={v} onChange={(e) => setRate(cat, i, e.target.value)} className="k-depgrid-input k-mono" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--k-fg-4)', margin: '10px 0 0', lineHeight: 1.5 }}>
                  {draft.method === 'Custom'
                    ? 'Custom: type any percent per class and age bracket — no cap enforced beyond 100%.'
                    : `Bracketed: percent depreciated at each age bracket, prefilled from the standard schedule. Entries are clamped to the ${capNum()}% cap.`}
                  {' '}Special-limits classes (Jewelry, Firearms, Fine Arts, Furs) stay manual-priced regardless of schedule.
                </p>
              </div>
              )}
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="k-btn k-btn--ghost" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="k-btn" onClick={saveSchedule} disabled={!draft.name.trim()}>Add schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { Intake, IntakeField, IntakeSelect });
