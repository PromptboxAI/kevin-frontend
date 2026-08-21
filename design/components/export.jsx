// Export flow — final-review modal sitting over the worksheet.
// Shown as its own artboard (modal in focused state).

const { KevinWordmark, Icon, I, Badge, fmtUSD, fmtUSDshort } = window;

const ExportFlow = () => {
  const [carrier, setCarrier] = React.useState('xactimate');
  const [delivery, setDelivery] = React.useState('download');
  const [include, setInclude] = React.useState({
    photos: true, comps: true, notes: true,
  });

  // Photos / comps / notes are documents, not spreadsheet cells — they can only
  // ride in the formatted PDF. Depr. % and Sales tax ARE columns in the
  // XactContents template (rule 18), so they stay available for .xlsx.
  const FORMAT_SUPPORTS = {
    xactimate: { photos: false, comps: false, notes: false },
    pdf:       { photos: true,  comps: true,  notes: true  },
  };
  const supports = FORMAT_SUPPORTS[carrier] || { photos: false, comps: false, notes: false };

  // Validation is COMPUTED from the rows being exported — never typed. An
  // unpriced row (rule 12) has rcv === null and no comps, so it can neither be
  // reported with a dollar figure nor claimed as "sourced". NOTE: this warning
  // is a UI PRE-CHECK — the export FILE carries no "not priced" notification
  // (unpriced lines write 0.00 like any null); in production the count comes
  // from GET /v1/claims/{id} → status_counts.needs_manual, not the export.
  const exportRows  = React.useMemo(() => window.buildWorksheetRows(57), []);
  const noModel     = exportRows.filter(r => !r.model);
  const unpriced    = exportRows.filter(r => r.needs_manual);
  const sourced     = exportRows.filter(r => r.rcv != null && (r.alternative_sources || []).length);
  const priced      = exportRows.filter(r => r.rcv != null);
  const noClass     = exportRows.filter(r => !r.cat);
  const blocking    = unpriced.length + noModel.length;
  const names       = (rs, n = 3) => rs.slice(0, n).map(r => r.desc || 'Not identified').join(' · ') + (rs.length > n ? ` · +${rs.length - n} more` : '');
  const classCount  = new Set(exportRows.map(r => r.cat)).size;
  const claim       = (window.KEVIN_CLAIMS || []).find(c => c.id === 'CLM-2026-04412') || { photos: 0 };
  const photoCount  = Math.max(0, claim.photos - 1);   // one duplicate hashed out at ingest
  // Photos dominate the payload; without them the file is a few hundred KB.
  const PHOTO_MB = 340;
  const withPhotos = supports.photos && include.photos;
  const payloadSize = withPhotos ? `~${PHOTO_MB} MB` : carrier === 'pdf' ? '~1.2 MB' : '~180 KB';
  const UNSUPPORTED_NOTE = {
    xactimate: 'Not supported — the XactContents template is a clean import grid',
  };

  const FORMATS = [
    { id: 'xactimate', label: 'Xactimate', sub: '.xlsx · XactContents template',  recommended: true  },
    { id: 'pdf',       label: 'PDF inventory', sub: '.pdf · formatted report', recommended: false },
  ];

  return (
    <div className="k-export-stage">
      {/* — Dimmed worksheet behind — */}
      <div className="k-export-bg">
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--k-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <KevinWordmark size={16} suffix={true} />
            <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>Godfrey — Kitchen fire</span>
          </div>
          <Badge tone="quiet">Review</Badge>
        </div>
        {/* fake row stripes */}
        <div style={{ flex: 1, opacity: 0.4, padding: '8px 16px' }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--k-line)' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--k-bg-2)' }} />
              <div style={{ width: 28, height: 28, borderRadius: 3, background: 'var(--k-bg-3)' }} />
              <div style={{ flex: 1, height: 10, borderRadius: 99, background: 'var(--k-bg-2)' }} />
              <div style={{ width: 80, height: 10, borderRadius: 99, background: 'var(--k-bg-2)' }} />
              <div style={{ width: 60, height: 10, borderRadius: 99, background: 'var(--k-bg-3)' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="k-export-scrim" />

      {/* — Modal — */}
      <div className="k-export-modal">
        <div className="k-export-hd">
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Final review · Export claim</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '6px 0 0' }}>Godfrey — Kitchen fire</h2>
            <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 4, fontFamily: 'var(--k-font-mono)' }}>CLM-2026-04412 · Allstate · 123 Main St., Smithtown, NY 11787</div>
          </div>
          <a className="k-icon-btn" href="05-Worksheet-flat.html" style={{ width: 32, height: 32 }} title="Close — back to the worksheet"><Icon d={I.close} size={16} /></a>
        </div>

        <div className="k-export-grid">
          {/* — Left: summary — */}
          <div className="k-export-l">
            <section className="k-export-sec">
              <div className="k-export-sec-h">Summary</div>
              <div className="k-export-totals">
                <div className="k-et"><div className="k-et-l">Items</div><div className="k-et-v">{exportRows.length}</div></div>
                <div className="k-et"><div className="k-et-l">Content classes</div><div className="k-et-v">{classCount}</div></div>
                <div className="k-et"><div className="k-et-l">Photos attached</div><div className="k-et-v">{photoCount}</div></div>
                <div className="k-et"><div className="k-et-l">RCV</div><div className="k-et-v">{fmtUSDshort(window.REYES_TOTALS.rcv)}</div></div>
                <div className="k-et"><div className="k-et-l">Depreciation</div><div className="k-et-v" style={{ color: 'var(--k-fg-3)' }}>{window.REYES_TOTALS.dep > 0 ? '−' + fmtUSDshort(window.REYES_TOTALS.dep) : fmtUSDshort(0)}</div></div>
                <div className="k-et"><div className="k-et-l">Tax ({window.claimTaxPct()})</div><div className="k-et-v" style={{ color: 'var(--k-fg-3)' }}>{fmtUSDshort(window.REYES_TOTALS.tax)}</div></div>
                <div className="k-et k-et--big">
                  <div className="k-et-l" style={{ color: 'var(--k-accent)' }}>ACV total</div>
                  <div className="k-et-v" style={{ color: 'var(--k-accent)' }}>{fmtUSD(window.REYES_TOTALS.acv)}</div>
                </div>
              </div>
            </section>

            {/* — Validation — */}
            <section className="k-export-sec">
              <div className="k-export-sec-h">
                <span>Validation</span>
                <Badge tone={blocking ? 'warn' : 'ok'} dot={true}>{blocking ? `${blocking} item${blocking === 1 ? '' : 's'} need attention` : 'No issues'}</Badge>
              </div>
              <div className="k-validations">
                {unpriced.length > 0 && (
                  <div className="k-val k-val--warn">
                    <Icon d={I.warn} size={14} />
                    <div style={{ flex: 1 }}>
                      <div className="k-val-t">{unpriced.length} item{unpriced.length === 1 ? ' is' : 's are'} unpriced</div>
                      <div className="k-val-s">{names(unpriced)} — Kevin found no confident replacement comp. They contribute $0 to the totals until you enter a value.</div>
                    </div>
                    <a className="k-link" href="05-Worksheet-flat.html">Price them →</a>
                  </div>
                )}
                {noModel.length > 0 && (
                  <div className="k-val k-val--warn">
                    <Icon d={I.warn} size={14} />
                    <div style={{ flex: 1 }}>
                      <div className="k-val-t">{noModel.length} item{noModel.length === 1 ? '' : 's'} missing a model number</div>
                      <div className="k-val-s">{names(noModel)} — matched on the photo alone. Adding a model number lets Kevin re-price against an exact match.</div>
                    </div>
                    <a className="k-link" href="05-Worksheet-flat.html">Review →</a>
                  </div>
                )}
                {noClass.length === 0 && (
                  <div className="k-val k-val--ok">
                    <Icon d={I.check} size={14} />
                    <div style={{ flex: 1 }}>
                      <div className="k-val-t">All {exportRows.length} items have a content class assigned</div>
                    </div>
                  </div>
                )}
                <div className={`k-val ${sourced.length === priced.length ? 'k-val--ok' : 'k-val--warn'}`}>
                  <Icon d={sourced.length === priced.length ? I.check : I.warn} size={14} />
                  <div style={{ flex: 1 }}>
                    <div className="k-val-t">Every priced item carries a source link ({sourced.length} of {priced.length})</div>
                    {unpriced.length > 0 && <div className="k-val-s">The {unpriced.length} unpriced item{unpriced.length === 1 ? '' : 's'} above {unpriced.length === 1 ? 'has' : 'have'} no comps to cite until a value is entered.</div>}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* — Right: format + options — */}
          <div className="k-export-r">
            <section className="k-export-sec">
              <div className="k-export-sec-h">Export format</div>
              <div className="k-format-grid">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => setCarrier(f.id)} className={`k-format ${carrier === f.id ? 'k-format--on' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</span>
                      {f.recommended && <Badge tone="ok">Recommended</Badge>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 4 }}>{f.sub}</div>
                    {f.id === 'pdf' && carrier === 'pdf' && <a href="74-PDF-inventory.html" target="_blank" className="k-link" style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>Preview document →</a>}
                    {carrier === f.id && <div className="k-format-check"><Icon d={I.check} size={11} stroke={2.5} /></div>}
                  </button>
                ))}
              </div>
            </section>

            <section className="k-export-sec">
              <div className="k-export-sec-h">Include</div>
              {carrier !== 'pdf' && (
                <div style={{ fontSize: 11, color: 'var(--k-fg-4)', lineHeight: 1.5, padding: '0 0 8px' }}>
                  {carrier === 'xactimate'
                    ? 'The .xlsx is a clean XactContents import grid — every cell a raw static value, never a formula, so the Xactimate importer reads it. Photos, comps and notes can’t travel in it; choose PDF inventory for those.'
                    : 'Photos, comps and notes ride in the PDF inventory.'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['photos',       'Item photos (high-res)',           `${photoCount} photos · ~${PHOTO_MB} MB`],
                  ['comps',        'Top-3 pricing comparisons',         'With source URLs'],
                  ['notes',        'Adjuster notes',                    'Printed under each line item'],
                ].map(([k, l, s]) => {
                  const state = supports[k];
                  const locked = state === 'locked';
                  const ok = !!state;
                  const on = locked ? true : (ok && include[k]);
                  return (
                  <label key={k} className={`k-toggle ${ok ? '' : 'k-toggle--off'} ${locked ? 'k-toggle--locked' : ''}`} title={locked ? 'Always included \u2014 a required column in this format' : (ok ? null : UNSUPPORTED_NOTE[carrier])}>
                    <input type="checkbox" checked={!!on} disabled={!ok || locked} onChange={() => setInclude({ ...include, [k]: !include[k] })} />
                    <span className="k-toggle-box">{on && <Icon d={I.check} size={10} stroke={2.5} />}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 12.5, color: ok ? 'var(--k-fg)' : 'var(--k-fg-4)' }}>{l}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>{locked ? 'Always included \u2014 required column' : (ok ? s : UNSUPPORTED_NOTE[carrier])}</span>
                    </span>
                  </label>
                  );
                })}
              </div>
            </section>

            <section className="k-export-sec">
              <div className="k-export-sec-h">Delivery</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="k-radio" onClick={() => setDelivery('download')} style={{ cursor: 'pointer' }}>
                  <span className={`k-radio-dot ${delivery === 'download' ? 'k-radio-dot--on' : ''}`} />
                  <span style={{ flex: 1, fontSize: 12.5 }}>Download to my computer</span>
                  <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{payloadSize}</span>
                </label>
                <label className="k-radio" onClick={() => setDelivery('link')} style={{ cursor: 'pointer' }}>
                  <span className={`k-radio-dot ${delivery === 'link' ? 'k-radio-dot--on' : ''}`} />
                  <span style={{ flex: 1, fontSize: 12.5 }}>Create a secure share link</span>
                  <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>Expires in 30 days</span>
                </label>
              </div>
            </section>
          </div>
        </div>

        <div className="k-export-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon d={I.warn} size={14} />
            <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>Flagged above for your review. Nothing here blocks the export.</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="k-btn k-btn--ghost" href="05-Worksheet-flat.html">Back to worksheet</a>
            <button className="k-btn">Export {(FORMATS.find(f => f.id === carrier) || {}).label || 'inventory'} →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ExportFlow = ExportFlow;
