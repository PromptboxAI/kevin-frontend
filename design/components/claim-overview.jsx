// Single-claim overview — the landing page for a claim, before the worksheet.
// Insured/loss header · items-by-class breakdown · photos by room · key flags · timeline.

const { KevinWordmark, Icon, I, Badge, Thumb, fmtUSDshort, fmtUSD } = window;
const { SAMPLE_BASE } = window;

// Class + room rollups are DERIVED from the same seed the worksheet renders
// (never typed — see CLAUDE.md "Never hardcode claim money"). needs_manual rows
// are unpriced per rule 12, so they contribute count but $0 RCV.
const CO_CLASS_COLORS = ['oklch(0.55 0.10 252)','oklch(0.45 0.07 240)','oklch(0.50 0.09 230)','oklch(0.55 0.10 220)','oklch(0.60 0.08 210)','oklch(0.62 0.07 200)','oklch(0.65 0.06 195)','oklch(0.68 0.05 190)','oklch(0.70 0.05 185)'];
const CO_ROLLUP = (() => {
  const rows = window.buildWorksheetRows(57);
  const by = (key) => {
    const m = new Map();
    rows.forEach((r) => {
      const k = r[key] || '—';
      const e = m.get(k) || { n: 0, rcv: 0, unpriced: 0 };
      e.n += 1;
      if (r.needs_manual) e.unpriced += 1; else e.rcv += r.rcv * r.qty;
      m.set(k, e);
    });
    return [...m.entries()].sort((a, b) => b[1].rcv - a[1].rcv);
  };
  const cls = by('cat');
  const priced = rows.filter((r) => !r.needs_manual).sort((a, b) => b.rcv * b.qty - a.rcv * a.qty);
  const sl = rows.filter((r) => r.special_limits);
  const slByClass = [...sl.reduce((m, r) => m.set(r.cat, (m.get(r.cat) || 0) + 1), new Map())]
    .sort((a, b) => b[1] - a[1]).map(([c, n]) => `${n} ${c}`);
  const top = cls.slice(0, 12).map(([c, e], i) => ({
    cls: c, n: e.n, rcv: e.rcv, unpriced: e.unpriced,
    flag: e.unpriced > 0,
    color: e.unpriced > 0 ? 'var(--k-warn)' : (CO_CLASS_COLORS[i] || 'var(--k-line-2)'),
  }));
  const rest = cls.slice(12);
  if (rest.length) top.push({
    cls: `+ ${rest.length} more class${rest.length > 1 ? 'es' : ''}`,
    n: rest.reduce((a, [, e]) => a + e.n, 0),
    rcv: rest.reduce((a, [, e]) => a + e.rcv, 0),
    color: 'var(--k-line-2)',
  });
  // Photos are always >= items (rule 1): context shots + close-ups of counted
  // items. Distribute the claim's ACTUAL photo count across rooms by largest
  // remainder — rounding each room independently overshoots the claim total.
  const allRooms = by('room');
  const claimPhotos = ((window.KEVIN_CLAIMS || []).find((c) => c.id === 'CLM-2026-04412') || { photos: 162 }).photos;
  const itemTotal = allRooms.reduce((a, [, e]) => a + e.n, 0) || 1;
  const exact = allRooms.map(([, e]) => (e.n * claimPhotos) / itemTotal);
  const alloc = exact.map(Math.floor);
  let leftover = claimPhotos - alloc.reduce((a, n) => a + n, 0);
  exact.map((v, i) => [i, v - Math.floor(v)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(0, leftover))
    .forEach(([i]) => { alloc[i] += 1; });

  const rooms = allRooms.slice(0, 8).map(([name, e], i) => ({
    name, items: e.n, rcv: e.rcv, photos: alloc[i],
  }));
  const restRooms = allRooms.slice(8);
  if (restRooms.length) {
    rooms.push({
      name: `+ ${restRooms.length} more room${restRooms.length > 1 ? 's' : ''}`,
      items: restRooms.reduce((a, [, e]) => a + e.n, 0),
      rcv: restRooms.reduce((a, [, e]) => a + e.rcv, 0),
      photos: alloc.slice(8).reduce((a, n) => a + n, 0),
      rest: true,
    });
  }
  return {
    classes: top, rooms,
    highValue: (() => {
      const seen = new Set();
      return priced.filter((r) => { if (seen.has(r.desc)) return false; seen.add(r.desc); return true; })
        .slice(0, 6).map((r) => ({ mfr: r.mfr || '—', desc: r.desc, rcv: r.rcv * r.qty, cat: r.cat }));
    })(),
    slCount: sl.length,
    lowConf: rows.filter((r) => r.conf === 'low').length,
    blocking: rows.filter((r) => r.needs_manual).length + rows.filter((r) => !r.model).length,
    unpricedCount: rows.filter((r) => r.needs_manual).length,
    noModelCount: rows.filter((r) => !r.model).length,
    barcodes: rows.filter((r) => r.barcode).length,
    classCount: cls.length,
    // Rule 6 defines only four special-limits classes, so all of them fit —
    // truncating would drop a capped class and stop the sub-label footing.
    slByClass: slByClass.join(' · '),
  };
})();

const CLASS_BREAKDOWN = CO_ROLLUP.classes;

const CO_ROOMS = CO_ROLLUP.rooms;

// "Add photos from phone" — mints a single-use pair token and shows it as a QR.
// The token is EPHEMERAL: minted when this modal opens (POST /v1/claims/{id}/pair-token,
// ~2 min TTL, bound to claim + session), burned when a phone redeems it via POST /v1/pair.
// Nothing is stored per claim or per adjuster; closing and reopening re-mints.
const PairPhoneButton = () => {
  const [open, setOpen] = React.useState(false);
  const [tok, setTok] = React.useState('');
  const [left, setLeft] = React.useState(120);
  const mint = () => {
    const rnd = (n) => Array.from({ length: n }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
    setTok(`kvn-pair-${rnd(5)}-${rnd(4)}`);
    setLeft(120);
  };
  React.useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [open]);
  const mm = String(Math.floor(left / 60)), ss = String(left % 60).padStart(2, '0');
  return (
    <React.Fragment>
      <button className="k-btn k-btn--ghost" onClick={() => { mint(); setOpen(true); }} title="Shoot more evidence with your phone — pairs to this claim only">
        <Icon d={I.camera} size={12} /> From phone
      </button>
      {open && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', background: 'oklch(0.2 0.01 250 / 0.45)' }} onClick={() => setOpen(false)}>
          <div className="k-export-modal" style={{ width: 420, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 0' }}>
              <div>
                <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Add photos from phone</div>
                <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 21, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Scan with your phone camera.</h2>
              </div>
              <button className="k-icon-btn" onClick={() => setOpen(false)} title="Close"><Icon d={I.close} size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 20px 20px' }}>
              {left > 0 ? (
                <div style={{ padding: 14, background: '#fff', border: '1px solid var(--k-line)', borderRadius: 12 }}>
                  {window.FauxQR ? <window.FauxQR size={192} cellSize={8} /> : <div style={{ width: 192, height: 192 }} />}
                </div>
              ) : (
                <div style={{ width: 220, height: 220, display: 'grid', placeItems: 'center', background: 'var(--k-bg-2)', border: '1px dashed var(--k-line)', borderRadius: 12 }}>
                  <button className="k-btn" onClick={mint}>Generate a new code</button>
                </div>
              )}
              <div style={{ marginTop: 12, fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-3)' }}>{tok}</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: left > 0 ? 'var(--k-fg-4)' : 'var(--k-danger)' }}>
                {left > 0 ? `Single-use · expires in ${mm}:${ss}` : 'Code expired — generate a new one.'}
              </div>
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--k-bg-2)', borderRadius: 8, fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5, textAlign: 'left' }}>
                Your phone gets photo-upload access to <strong style={{ color: 'var(--k-fg-2)' }}>this claim only</strong> — no edits, no exports. Shots land in staging like any other batch.
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

const ClaimOverview = () => {
  const total = CLASS_BREAKDOWN.reduce((a, b) => a + b.rcv, 0);

  return (
    <div className="k-claim-ov">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <a className="k-link" href="01-My-claims.html" style={{ fontSize: 12 }}><Icon d={I.chevleft} size={11} /> My claims</a>
          <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-3)' }}>CLM-2026-04412</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge tone={CO_ROLLUP.blocking ? 'warn' : 'ok'} dot={true}>{CO_ROLLUP.blocking ? `${CO_ROLLUP.blocking} items need attention` : 'Ready for review'}</Badge>
          <a className="k-btn k-btn--ghost" href="03-Intake.html?claim=CLM-2026-04412" title="Drop another batch into this claim — new items append, existing line numbers never change"><Icon d={I.plus} size={12}/> Add photos</a>
          <PairPhoneButton />
          <a className="k-btn k-btn--ghost" href="75-Written-import.html" title="Import a typed or exported inventory — no photographs"><Icon d={I.file} size={12}/> Import a list</a>
          <a className="k-btn k-btn--ghost" href="06-Export-modal.html"><Icon d={I.download} size={12}/> Export</a>
          <a className="k-btn k-btn--ghost" href="77-Holdback-recovery.html" title="Post-settlement: prove replacements to recover the withheld depreciation. Production gate: show when the claim is exported OR closed OR any line already has a claimed_rcv — never hard-gate on closed alone."><Icon d={I.refresh} size={12}/> Holdback recovery</a>
          <a className="k-btn" href="05-Worksheet-flat.html">Open worksheet →</a>
          <window.AvatarMenu />
        </div>
      </header>
      <window.ClaimTabs active="Overview" />

      {/* — Claim head — */}
      <section className="k-claim-ov-hd">
        <div>
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Claim overview</div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 36, letterSpacing: '-0.025em', margin: '6px 0 6px', lineHeight: 1.05 }}>
            Godfrey — Kitchen fire
          </h1>
          <div className="k-claim-ov-meta">
            <span><strong>Insured</strong> · Kevin Godfrey</span>
            <span><strong>Loss</strong> · Apr 18, 2026 · Kitchen fire</span>
            <span><strong>Address</strong> · 123 Main St., Smithtown, NY 11787</span>
            <span><strong>Carrier</strong> · Allstate</span>
            <span><strong>Policy</strong> · HO-3 · Open perils</span>
            <span><strong>Tax</strong> · {window.claimTaxPct()}</span>
          </div>
        </div>

        {/* Top stats */}
        <div className="k-claim-ov-stats">
          <div><div className="k-tot-l">Items</div><div className="k-tot-v">{window.CLAIM_INGEST.items}</div></div>
          <div><div className="k-tot-l">Photos</div><div className="k-tot-v">{window.CLAIM_INGEST.photos}</div></div>
          <div><div className="k-tot-l">RCV</div><div className="k-tot-v">{fmtUSD(window.REYES_TOTALS.rcv)}</div></div>
          <div><div className="k-tot-l">$ Depr.</div><div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>−{fmtUSD(window.REYES_TOTALS.dep)}</div></div>
          <div><div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>ACV</div><div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>{fmtUSD(window.REYES_TOTALS.acv)}</div></div>
        </div>
      </section>

      <div className="k-claim-ov-body">

        {/* One attention strip, only when something needs the adjuster.
            Zero-count and celebratory cards ("15 barcodes matched") were noise. */}
        {CO_ROLLUP.blocking > 0 && (
          <section className="k-flags-band k-flags-band--one">
            <div className="k-flag-card k-flag-card--warn">
              <Icon d={I.warn} size={16} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{CO_ROLLUP.blocking} item{CO_ROLLUP.blocking === 1 ? '' : 's'} need{CO_ROLLUP.blocking === 1 ? 's' : ''} your attention</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 2 }}>{CO_ROLLUP.unpricedCount ? `${CO_ROLLUP.unpricedCount} unpriced` : ''}{CO_ROLLUP.unpricedCount && CO_ROLLUP.noModelCount ? ' · ' : ''}{CO_ROLLUP.noModelCount ? `${CO_ROLLUP.noModelCount} missing a model number` : ''} — blank cells, ready for your value</div>
              </div>
              <a className="k-link" href="05-Worksheet-flat.html">Review →</a>
            </div>
          </section>
        )}

        <div className="k-claim-ov-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* — Items by class — */}
            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Items by content class</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>57 items · {CO_ROLLUP.classCount} classes · {fmtUSDshort(total)} pre-tax RCV</span>
              </div>
              {/* Stacked bar */}
              <div className="k-stack-bar" title="Composition by RCV">
                {CLASS_BREAKDOWN.map((c, i) => (
                  <div key={i}
                       title={`${c.cls} · ${c.n} items · ${fmtUSDshort(c.rcv)}`}
                       style={{ width: `${(c.rcv / total) * 100}%`, background: c.color }} />
                ))}
              </div>
              {/* Legend list */}
              <div className="k-class-list">
                {CLASS_BREAKDOWN.map((c, i) => (
                  <div key={i} className="k-class-row">
                    <span className="k-class-dot" style={{ background: c.color }} />
                    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--k-fg)' }}>
                      {c.cls}
                      {c.flag && <span style={{ marginLeft: 6 }}><Badge tone="warn">Special limits</Badge></span>}
                    </span>
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)', width: 56, textAlign: 'right' }}>{c.n}</span>
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5, fontWeight: 600, width: 84, textAlign: 'right' }}>{fmtUSDshort(c.rcv)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* — Photos by room — */}
            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Photos by room</span>
                <a className="k-link" href="16-Claim-photos.html">Open photo gallery →</a>
              </div>
              <div className="k-room-grid">
                {CO_ROOMS.map((r, i) => (
                  <div key={i} className="k-room-card">
                    <div className="k-room-thumb">
                      <Thumb idx={i} size={80} label={r.name.slice(0,3).toUpperCase()} src={(((window.PHOTO_ALL || []).find((p) => p.room === r.name && p.src) || {}).src) || null} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 2 }}>
                        {r.photos} photos · {r.items} items
                      </div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--k-font-mono)', fontWeight: 600, marginTop: 4 }}>
                        {fmtUSDshort(r.rcv)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* — Highest-value items — */}
            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Highest-value items</span>
                <a className="k-link" href="05-Worksheet-flat.html">View all →</a>
              </div>
              <div style={{ padding: '4px 14px 12px' }}>
                {CO_ROLLUP.highValue.map((it, i) => (
                  <div key={i} className="k-hv-row">
                    <Thumb idx={i + 8} size={30} desc={it.desc} label={it.mfr.slice(0,3)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.desc}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 1 }}>{it.mfr} · {it.cat}</div>
                    </div>
                    <div className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{fmtUSD(it.rcv)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* — Notes — */}
            <section className="k-ov-card">
              <div className="k-ov-card-hd"><span>Adjuster notes</span></div>
              <div style={{ padding: '0 14px 14px' }}>
                <textarea className="k-insp-input" rows={3} placeholder="Add a note for the carrier or for yourself…" defaultValue="Loss was contained to kitchen and adjacent dining room — most damage is smoke, not direct fire. Confirm jewelry was off-site at time of loss before finalizing." />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: 'var(--k-fg-4)' }}>
                  <span>1 note · last edit 4m ago</span>
                  <button className="k-link">Notes export with the claim</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ClaimOverview = ClaimOverview;
