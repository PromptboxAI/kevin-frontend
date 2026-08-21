// Written inventory import — total-loss lists that arrive as text, not photos.
//
// WHY THIS IS NOT STAGING: staging exists to turn photographs into items via
// cluster → review → promote. A written list has nothing to cluster — each row
// already IS a line item — so it goes straight to the worksheet.
//
// Flow: parse → map → preview → import. The first three create NOTHING.
//   • parse   POST /v1/claims/:id/items/parse           (server-side; PDFs)
//   • preview POST /v1/claims/:id/items/bulk/preview    (no rows, no spend)
//   • import  POST /v1/claims/:id/items/bulk            (500 rows per request)

const { KevinWordmark, Icon, I, Badge } = window;

// Field → what it does. Only description is required; the others change how well
// the row prices, which is why the mapper explains rather than just labels.
const WI_FIELDS = [
  { key: 'description', label: 'Description', required: true,
    hint: 'Doubles as the search query, so it must describe the item and nothing else. 2–300 characters.' },
  { key: 'room',        label: 'Room / area',
    hint: 'Kept as its own field. Folded into the description it would change the search.' },
  { key: 'quantity',    label: 'Quantity', hint: 'Defaults to 1 when unmapped.' },
  { key: 'category',    label: 'Content class',
    hint: 'Optional, but category drives depreciation and inference is weak on generic list text.' },
  { key: 'make_mfr',     label: 'Make / brand',
    hint: 'Optional. Sharpens the comp search — a described item otherwise lacks the brand a photo would have given.' },
  { key: 'model_number', label: 'Model number',
    hint: 'Optional, and the strongest signal there is. An exact model number narrows pricing more than any other field.' },
];

const WI_Field = ({ label, value, onChange, mono, placeholder, hint, width = 240 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width }}>
    <label style={{ fontSize: 11, color: 'var(--k-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    <div className="k-ifield">
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent',
                 font: 'inherit', fontSize: 13, color: 'var(--k-fg)',
                 fontFamily: mono ? 'var(--k-font-mono)' : 'inherit' }} />
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)', lineHeight: 1.4 }}>{hint}</span>}
  </div>
);

const WI_Select = ({ label, value, onChange, options, hint, width = 240 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width }}>
    <label style={{ fontSize: 11, color: 'var(--k-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    <div className="k-fselect">
      <select value={value} onChange={onChange}>
        {options.map((o, i) => <option key={i} value={o}>{o || 'Not set'}</option>)}
      </select>
      <Icon d={I.chevdown} size={11} />
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)', lineHeight: 1.4 }}>{hint}</span>}
  </div>
);

const WI_Step = ({ n, label, state }) => (
  <div className={`k-wi-step k-wi-step--${state}`}>
    <span className="k-wi-step-n">{state === 'done' ? <Icon d={I.check} size={11} /> : n}</span>
    <span>{label}</span>
  </div>
);

const WrittenImport = () => {
  const CLAIM = 'CLM-2026-04412';
  const [phase, setPhase] = React.useState('drop');   // drop · map · preview · importing · done
  const [parsed, setParsed] = React.useState(null);
  const [parsing, setParsing] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [mapping, setMapping] = React.useState({});
  const [dropped, setDropped] = React.useState([]);   // row indexes removed
  const [preview, setPreview] = React.useState(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [chunkAt, setChunkAt] = React.useState(0);
  const [created, setCreated] = React.useState(0);
  const [importErr, setImportErr] = React.useState(null);
  const [single, setSingle] = React.useState(null);
  const fileRef = React.useRef(null);

  const take = (file) => {
    if (!file) return;
    setError(null); setParsing(true);
    window.KevinAPI.parseInventoryFile(CLAIM, file).then((res) => {
      setParsed(res);
      setMapping(res.suggested_mapping || {});
      // Headings are PRE-SELECTED for removal, not removed — we flag, the
      // adjuster confirms. Dropping them on our own authority is how a real row
      // disappears silently.
      setDropped(res.rows.filter(r => r.likely_heading).map(r => r.index));
      setParsing(false); setPhase('map');
    }).catch((err) => { setParsing(false); setError(err.message || 'That file could not be read.'); });
  };

  const mappedRows = () => {
    if (!parsed) return [];
    const cell = (r, key) => {
      const i = mapping[key];
      return i === undefined || i === null || i === '' ? '' : (r.cells[i] || '');
    };
    return parsed.rows.filter(r => !dropped.includes(r.index)).map(r => ({
      index: r.index,
      description: cell(r, 'description').trim(),
      room: cell(r, 'room').trim(),
      quantity: parseInt(cell(r, 'quantity'), 10) || 1,
      category: cell(r, 'category').trim() || null,
      make_mfr: cell(r, 'make_mfr').trim() || null,
      model_number: cell(r, 'model_number').trim() || null,
    }));
  };

  const runPreview = () => {
    setPreviewing(true);
    window.KevinAPI.previewInventory(CLAIM, mappedRows()).then((res) => {
      setPreview(res); setPreviewing(false); setPhase('preview');
    });
  };

  // Sequential chunks so a mid-run failure never re-sends completed ones.
  const runImport = () => {
    const chunks = window.KevinAPI.planImportChunks(mappedRows());
    setPhase('importing'); setImportErr(null); setChunkAt(0); setCreated(0);
    const step = (i, done) => {
      if (i >= chunks.length) { setPhase('done'); return; }
      setChunkAt(i + 1);
      window.KevinAPI.importItems(CLAIM, chunks[i], { price: true })
        .then((res) => { const n = done + res.created; setCreated(n); step(i + 1, n); })
        .catch((err) => setImportErr({ at: i, message: err.message || 'That batch failed.', done }));
    };
    step(0, 0);
  };

  const rowsLeft = parsed ? parsed.rows.length - dropped.length : 0;
  const descMapped = mapping.description !== undefined && mapping.description !== null && mapping.description !== '';

  return (
    <div className="k-intake">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="My claims" />
        </div>
        <window.AvatarMenu />
      </header>

      <div className="k-intake-body">
        <section className="k-claim-hd" style={{ paddingBottom: 14 }}>
          <div>
            <a href="12-Claim-overview.html" className="k-crumb"
              onClick={(e) => { if (document.referrer && history.length > 1) { e.preventDefault(); history.back(); } }}>
              <Icon d={I.chevleft} size={12} /> Back
            </a>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 32, letterSpacing: '-0.022em', margin: '6px 0 4px', lineHeight: 1.1 }}>Import a written inventory</h1>
            <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
              A typed or exported list — no photographs. Described items price the same way, from live retail comps; they just lack the brand and model a photo would give.
            </p>
          </div>
        </section>

        <div className="k-wi-steps">
          <WI_Step n="1" label="Choose the file"  state={phase === 'drop' ? 'on' : 'done'} />
          <WI_Step n="2" label="Map the columns"  state={phase === 'map' ? 'on' : (parsed && phase !== 'drop' ? 'done' : 'off')} />
          <WI_Step n="3" label="Preview"          state={phase === 'preview' ? 'on' : (preview && phase !== 'map' ? 'done' : 'off')} />
          <WI_Step n="4" label="Import"           state={phase === 'importing' || phase === 'done' ? (phase === 'done' ? 'done' : 'on') : 'off'} />
        </div>

        {/* — 1 · File — */}
        {phase === 'drop' && (
          <section className="k-intake-section">
            <div className="k-dropzone"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('k-dropzone--over'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('k-dropzone--over')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('k-dropzone--over'); take((e.dataTransfer.files || [])[0]); }}>
              <div className="k-dropzone-inner">
                <div className="k-dropzone-icon"><Icon d={I.upload} size={26} stroke={1.4} /></div>
                <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 26, letterSpacing: '-0.02em', fontWeight: 400 }}>
                  {parsing ? 'Reading the file…' : 'Drop the inventory file'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)', marginTop: 6 }}>
                  Accepts PDF, CSV, or Excel. Max 20&nbsp;MB.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <input ref={fileRef} type="file" accept=".pdf,.csv,.xlsx,.xls" style={{ display: 'none' }}
                    onChange={(e) => { take(e.target.files[0]); e.target.value = ''; }} />
                  <button className="k-btn" onClick={() => fileRef.current && fileRef.current.click()} disabled={parsing}>
                    {parsing ? 'Reading…' : 'Choose file'}
                  </button>
                  <button className="k-btn k-btn--ghost" onClick={() => setSingle({ description: '', room: '', quantity: '1', category: '' })}>
                    Add a single item instead
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div className="k-reject" style={{ marginTop: 12 }}>
                <div className="k-reject-hd">
                  <Icon d={I.warn} size={14} />
                  <span className="k-reject-t">{error}</span>
                  <div style={{ flex: 1 }} />
                  <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => setError(null)}>Dismiss</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* — 2 · Mapping — */}
        {phase === 'map' && parsed && (
          <section className="k-intake-section">
            <div className="k-wi-filebar">
              <Icon d={I.file} size={14} />
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12 }}>{parsed.filename}</span>
              <Badge tone="quiet">{parsed.format.toUpperCase()}</Badge>
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{parsed.row_count.toLocaleString()} rows · {parsed.heading_count} look like section headings</span>
              <div style={{ flex: 1 }} />
              <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => { setParsed(null); setPreview(null); setPhase('drop'); }}>Choose another</button>
            </div>

            <div className="k-set-card" style={{ marginTop: 12 }}>
              <div className="k-set-card-hd">Match your columns</div>
              <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.5, margin: 0, maxWidth: 700 }}>
                  We detected what we could. Anything we weren't sure about is left blank rather than guessed — confirm each one below.
                </p>
                {WI_FIELDS.map((f) => (
                  <div key={f.key} className="k-wi-maprow">
                    <div style={{ width: 150, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {f.label}{f.required && <span style={{ color: 'var(--k-danger)' }}> *</span>}
                      </div>
                    </div>
                    <div className="k-fselect" style={{ width: 220 }}>
                      <select value={mapping[f.key] === undefined || mapping[f.key] === null ? '' : mapping[f.key]}
                        onChange={(e) => setMapping(m => ({ ...m, [f.key]: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}>
                        <option value="">Not mapped</option>
                        {parsed.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </select>
                      <Icon d={I.chevdown} size={11} />
                    </div>
                    <span style={{ flex: 1, fontSize: 11.5, color: 'var(--k-fg-4)', lineHeight: 1.45 }}>
                      {f.hint}
                      {(() => {
                        const i = mapping[f.key];
                        if (i === undefined || i === null || i === '') return null;
                        const hit = parsed.rows.find(r => !r.likely_heading && (r.cells[i] || '').trim());
                        return (
                          <React.Fragment>
                            <br />
                            {hit
                              ? <React.Fragment>e.g. <strong style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>{hit.cells[i]}</strong></React.Fragment>
                              : <span style={{ color: 'var(--k-warn)' }}>No values in this column.</span>}
                          </React.Fragment>
                        );
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="k-set-card" style={{ marginTop: 12 }}>
              <div className="k-set-card-hd">
                Remove section headings
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontWeight: 400 }}>{dropped.length} of {parsed.rows.length} marked for removal</span>
              </div>
              <div className="k-set-card-body" style={{ padding: 0 }}>
                <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.5, margin: 0, padding: '12px 18px 10px', maxWidth: 720 }}>
                  Exported inventories interleave headings with real rows. Left in, a heading prices as property — we flag them and you confirm; we never drop a row on our own.
                </p>
                <div className="k-wi-rows">
                  {parsed.rows.map((r) => {
                    const off = dropped.includes(r.index);
                    return (
                      <label key={r.index} className={'k-wi-row' + (off ? ' k-wi-row--off' : '')}>
                        <input type="checkbox" checked={!off}
                          onChange={() => setDropped(d => off ? d.filter(x => x !== r.index) : [...d, r.index])} />
                        <span className="k-wi-row-n">{r.source_ref}</span>
                        <span className="k-wi-row-cells">{r.cells.filter(Boolean).join('  ·  ')}</span>
                        {r.likely_heading && <Badge tone="warn">Looks like a heading</Badge>}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="k-intake-stickybar">
              <div className="k-intake-stickybar-in">
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{rowsLeft.toLocaleString()} rows will be imported</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                    {descMapped ? 'Nothing is created until you confirm the preview.' : 'Map a description column to continue.'}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <button className="k-btn k-btn--lg" onClick={runPreview} disabled={!descMapped || previewing || !rowsLeft}>
                  {previewing ? 'Checking…' : 'Preview import →'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* — 3 · Preview — */}
        {phase === 'preview' && preview && (
          <section className="k-intake-section">
            <div className="k-set-card k-set-card--accent">
              <div className="k-set-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 0, padding: 0 }}>
                {[
                  ['Rows', preview.total_rows.toLocaleString()],
                  ['Will be priced', preview.priceable.toLocaleString()],
                  ['You price', preview.needs_manual.toLocaleString()],
                  ['Pricing requests', '≈ ' + preview.estimated_searches.toLocaleString()],
                ].map(([l, v], i) => (
                  <div key={i} className="k-billing-cell" style={{ borderRight: i < 3 ? '1px solid var(--k-line)' : 0 }}>
                    <div className="k-billing-l">{l}</div>
                    <div className="k-billing-v">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {preview.uncategorised > 0 && (
              <div className="k-reject" style={{ marginTop: 12 }}>
                <div className="k-reject-hd">
                  <Icon d={I.warn} size={14} />
                  <span className="k-reject-t">{preview.uncategorised} rows have no content class</span>
                  <div style={{ flex: 1 }} />
                  <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => setPhase('map')}>Map a category column</button>
                </div>
                <div className="k-reject-ft">
                  Content class drives depreciation, and inference is weak on generic list text. You can set it per row later, but mapping a column now is far faster.
                </div>
              </div>
            )}

            {preview.needs_manual > 0 && (
              <div className="k-skipline" style={{ marginTop: 12, border: '1px solid var(--k-line)', borderRadius: 10 }}>
                <Icon d={I.info} size={13} />
                <span>
                  {preview.needs_manual} {preview.needs_manual === 1 ? 'row is a template line like' : 'rows are template lines like'} “Misc - Enter Price” — Kevin never prices {preview.needs_manual === 1 ? 'it' : 'those'}. {preview.needs_manual === 1 ? 'It arrives' : 'They arrive'} on the worksheet blank, filterable under <strong style={{ color: 'var(--k-fg-3)' }}>Needs your price</strong>.
                </span>
              </div>
            )}

            <div className="k-set-card" style={{ marginTop: 12 }}>
              <div className="k-set-card-hd">What will be created</div>
              <div className="k-set-card-body" style={{ padding: 0 }}>
                <div className="k-wi-rows">
                  {preview.rows.map((r) => (
                    <div key={r.index} className="k-wi-row">
                      <span className="k-wi-row-n">{r.quantity}×</span>
                      <span className="k-wi-row-cells">
                        {r.composed_description || r.description || <em style={{ color: 'var(--k-fg-4)' }}>No description</em>}
                        {r.room && <span style={{ color: 'var(--k-fg-4)' }}>  ·  {r.room}</span>}
                      </span>
                      {r.category ? <Badge tone="quiet">{r.category}</Badge> : <Badge tone="warn">No class</Badge>}
                      {r.will_price ? <Badge tone="ok" dot={true}>Will price</Badge> : <Badge tone="quiet">You price</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="k-intake-stickybar">
              <div className="k-intake-stickybar-in">
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Ready to import {preview.total_rows.toLocaleString()} items</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                    This will use about {preview.estimated_searches.toLocaleString()} pricing requests.
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <button className="k-btn k-btn--ghost" onClick={() => setPhase('map')}>Back to mapping</button>
                <button className="k-btn k-btn--lg" onClick={runImport}>Import {preview.total_rows.toLocaleString()} items →</button>
              </div>
            </div>
          </section>
        )}

        {/* — 4 · Import — */}
        {(phase === 'importing' || phase === 'done') && preview && (
          <section className="k-intake-section">
            <div className="k-set-card">
              <div className="k-set-card-hd">{phase === 'done' ? 'Import complete' : 'Importing'}</div>
              <div className="k-set-card-body">
                <div className="k-progress" style={{ marginBottom: 10 }}>
                  <div className="k-progress-bar" style={{ width: Math.round((created / Math.max(1, preview.total_rows)) * 100) + '%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
                  <span>{created.toLocaleString()} of {preview.total_rows.toLocaleString()} items created</span>
                  <span style={{ color: 'var(--k-fg-4)' }}>·</span>
                  <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                    batch {chunkAt} of {window.KevinAPI.planImportChunks(mappedRows()).length}
                  </span>
                </div>

                {importErr && (
                  <div className="k-reject" style={{ marginTop: 12 }}>
                    <div className="k-reject-hd">
                      <Icon d={I.warn} size={14} />
                      <span className="k-reject-t">Batch {importErr.at + 1} failed</span>
                      <div style={{ flex: 1 }} />
                      <button className="k-btn k-btn--sm" onClick={runImport}>Retry from here</button>
                    </div>
                    <div className="k-reject-ft">
                      {importErr.done.toLocaleString()} items were already created and are safe — a retry resumes from the failed batch and does not re-send them.
                    </div>
                  </div>
                )}

                {phase === 'done' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <a className="k-btn k-btn--lg" href="05-Worksheet-flat.html">Open the worksheet →</a>
                    <a className="k-btn k-btn--ghost" href="12-Claim-overview.html">Back to the claim</a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Single item — the same four fields, posting a one-row list. */}
      {single && (
        <div className="k-stage-noteover" onClick={() => setSingle(null)}>
          <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
            <div className="k-notemodal-hd">
              <div>
                <div className="k-notemodal-t">Add a single item</div>
                <div className="k-notemodal-s">Priced the same way as an imported row</div>
              </div>
              <button className="k-icon-btn" onClick={() => setSingle(null)} aria-label="Close"><Icon d={I.close} size={15} /></button>
            </div>
            <div className="k-notemodal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <WI_Field label="Description" value={single.description} width="100%"
                onChange={(e) => setSingle(s => ({ ...s, description: e.target.value }))}
                placeholder="Sectional sofa, grey fabric, 3-seat" hint="This is the search query — describe the item, not the room." />
              <div style={{ display: 'flex', gap: 10 }}>
                <WI_Field label="Room / area" value={single.room} width={200}
                  onChange={(e) => setSingle(s => ({ ...s, room: e.target.value }))} />
                <WI_Field label="Quantity" value={single.quantity} mono width={110}
                  onChange={(e) => setSingle(s => ({ ...s, quantity: e.target.value.replace(/[^0-9]/g, '') }))} />
              </div>
              <WI_Select label="Content class" value={single.category} width="100%"
                onChange={(e) => setSingle(s => ({ ...s, category: e.target.value }))}
                options={['', ...(window.PCS_CATEGORIES || [])]} hint="Drives depreciation — worth setting." />
            </div>
            <div className="k-notemodal-ft">
              {single.added && (
                <span style={{ fontSize: 12, color: 'var(--k-ok)', fontWeight: 600 }}>
                  Added to this claim — pricing now.
                </span>
              )}
              <div style={{ flex: 1 }} />
              {single.added
                ? <React.Fragment>
                    <button className="k-btn k-btn--ghost" onClick={() => setSingle({ description: '', room: '', quantity: '1', category: '' })}>Add another</button>
                    <a className="k-btn" href="05-Worksheet-flat.html">Open the worksheet →</a>
                  </React.Fragment>
                : null}
              <button className="k-btn k-btn--ghost" onClick={() => setSingle(null)}>{single.added ? 'Close' : 'Cancel'}</button>
              {!single.added && <button className="k-btn" disabled={!single.description.trim()}
                onClick={() => {
                  window.KevinAPI.importItems(CLAIM, [single], { price: true })
                    .then(() => setSingle({ ...single, added: true }));
                }}>
                Add &amp; price
              </button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.WrittenImport = WrittenImport;
