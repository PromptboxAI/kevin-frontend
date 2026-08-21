// Worksheet — the inventory review grid (centerpiece).
// 142 rows generated in local state · windowed/virtual rendering · zero locks.

const { fmtUSD, fmtUSDshort, Icon, I, Thumb, ConfPip, Badge, KevinWordmark } = window;
const { PCS_CATEGORIES, buildWorksheetRows } = window;

// Sales tax is a property of the claim (loss ZIP), read at render time.
const taxRate = () => (window.CLAIM_TAX ? window.CLAIM_TAX.rate : 0);
// Money comes from the server. `rcv`/`acv` on a row are PER-UNIT, PRE-TAX;
// the worksheet columns are the derived tax-inclusive line totals the API
// returns (contract §5). This reads them — it must never recompute them.
// Contract §0.7 — only comp[0] has a resolved merchant link; [1]/[2] are Google
// search urls, so they render as plain text with a tooltip saying why.
// A comp links only when its host is a real merchant. comp[0] is usually
// resolved but falls back to a Google Shopping redirect (budget exhausted,
// vendor error, pre-2026-07-30 row), and comps [1]/[2] are always search urls.
// Keying on the index would render a search page as a direct listing.
const isDirectComp = (link) => {
  if (!link) return false;
  try { return !/(^|\.)google\./i.test(new URL(link).hostname); } catch (e) { return false; }
};

const ExtLink = ({ a, className, children }) => (
  isDirectComp(a.link)
    ? <a className={className} href={a.link} target="_blank" rel="noopener noreferrer" title={a.title}>{children}</a>
    : <div className={className} title={`${a.title || ''} — no direct listing resolved`} style={{ cursor: 'default' }}>{children}</div>
);

const lineTotals = (r) => ({
  subtotal: r.rcv_total_incl,
  tax: r.tax,
  dep: r.depreciation_amount,
  acv: r.acv_total_incl,
  unpriced: r.rcv == null,
});

// ---------- Room cell — dropdown of the 17 room options -------------------
const RoomCell = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const filtered = (window.ROOM_OPTIONS || []).filter(c => foldText(c).includes(foldText(q)));
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button onClick={() => setOpen(!open)} className="k-cell k-cell--button" style={{ width: '100%' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{value || '—'}</span>
        <Icon d={I.chevdown} size={11} />
      </button>
      {open && (
        <div className="k-pop" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 200, zIndex: 30 }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--k-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--k-bg-2)', borderRadius: 4 }}>
              <Icon d={I.search} size={12} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rooms…" style={{ border: 0, outline: 0, background: 'transparent', flex: 1, font: 'inherit', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: 4 }}>
            {filtered.map(c => (
              <button key={c} onClick={() => { onChange?.(c); setOpen(false); setQ(''); }} className="k-menu-item">
                {c === value ? <Icon d={I.check} size={11} /> : <span style={{ width: 11, display: 'inline-block' }} />}
                <span style={{ marginLeft: 6 }}>{c}</span>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--k-fg-4)' }}>No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Cell primitives -------------------------------------------------
const TextCell = ({ value, onChange, mono = false, align = 'left', placeholder, conf, suffix, flash = false }) => {
  const [v, setV] = React.useState(value);
  const [focus, setFocus] = React.useState(false);
  React.useEffect(() => setV(value), [value]);
  return (
    <div className={`k-cell ${focus ? 'k-cell--focus' : ''} ${flash ? 'k-cell--flash' : ''}`} style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {conf && !focus && <ConfPip level={conf} />}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onFocus={() => { setFocus(true); if (align === 'right') setV(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        onBlur={() => { setFocus(false); if (align === 'right' && String(v).trim() === '') { setV(value); return; } onChange?.(v); }}
        placeholder={placeholder}
        style={{
          font: 'inherit', border: 0, background: 'transparent', outline: 0,
          width: '100%', color: 'inherit', textAlign: align,
          fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
          fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
          fontFeatureSettings: mono ? '"tnum"' : undefined,
        }}
      />
      {suffix && <span style={{ color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', fontSize: 11 }}>{suffix}</span>}
    </div>
  );
};

// Accent-insensitive match so typing "decor" finds "Decor & Accessories".
// Anchors a portalled menu to a trigger element. Returns { open, setOpen,
// toggle, pos, triggerRef, popRef } — see CategoryCell / RCVCell / DepCell.
const useAnchoredMenu = ({ width = 280, max = 320, min = 150 } = {}) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const triggerRef = React.useRef(null);
  const popRef = React.useRef(null);
  const GAP = 4, EDGE = 8;
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const b = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - b.bottom - GAP - EDGE;
    const above = b.top - GAP - EDGE;
    const useAbove = below < min && above > below;
    const h = Math.max(min, Math.min(max, useAbove ? above : below));
    const rawTop = useAbove ? b.top - h - GAP : b.bottom + GAP;
    setPos({
      left: Math.max(EDGE, Math.min(b.right - width, window.innerWidth - width - EDGE)),
      top: Math.max(EDGE, Math.min(rawTop, window.innerHeight - h - EDGE)),
      maxH: h,
    });
    setOpen(true);
  };
  React.useEffect(() => {
    const close = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return { open, setOpen, toggle, pos, triggerRef, popRef };
};

// Relative timestamp for comp freshness — reads the payload, never a fixed string.
const relTime = (iso) => {
  if (!iso) return 'Comps from the last identify pass';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Refreshed just now';
  if (mins < 60) return `Refreshed ${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `Refreshed ${h}h ago` : `Refreshed ${Math.round(h / 24)}d ago`;
};

const foldText = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const CategoryCell = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  const popRef = React.useRef(null);
  React.useEffect(() => {
    // The menu is portalled to <body>, so it is NOT inside `ref` — check both.
    const close = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const filtered = PCS_CATEGORIES.filter((c) => foldText(c).includes(foldText(q)));
  const btnRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  const openMenu = () => {
    if (open) { setOpen(false); return; }
    const b = btnRef.current.getBoundingClientRect();
    const MAX = 320, MIN = 150, GAP = 4, EDGE = 8;
    const below = window.innerHeight - b.bottom - GAP - EDGE;
    const above = b.top - GAP - EDGE;
    const useAbove = below < MIN && above > below;
    const h = Math.max(MIN, Math.min(MAX, useAbove ? above : below));
    const rawTop = useAbove ? b.top - h - GAP : b.bottom + GAP;
    setPos({
      left: Math.max(EDGE, Math.min(b.left, window.innerWidth - 280 - EDGE)),
      top: Math.max(EDGE, Math.min(rawTop, window.innerHeight - h - EDGE)),
      maxH: h,
    });
    setOpen(true);
  };
  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button ref={btnRef} onClick={openMenu} className="k-cell k-cell--button" style={{ width: '100%' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{value}</span>
        <Icon d={I.chevdown} size={11} />
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="k-pop" style={{ position: 'fixed', top: pos.top, left: pos.left, width: 280, zIndex: 200, maxHeight: pos.maxH, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--k-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--k-bg-2)', borderRadius: 4 }}>
              <Icon d={I.search} size={12} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search content classes…" style={{ border: 0, outline: 0, background: 'transparent', flex: 1, font: 'inherit', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 4 }}>
            {filtered.map((c) => (
              <button key={c} onClick={() => { onChange?.(c); setOpen(false); setQ(''); }} className="k-menu-item">
                {c === value
                  ? <Icon d={I.check} size={11} />
                  : <span style={{ width: 11, display: 'inline-block' }} />
                }
                <span style={{ marginLeft: 6 }}>{c}</span>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--k-fg-4)' }}>No matches</div>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ---------- RCV popover -----------------------------------------------------
// Personal-property limit meter. Label + limit come from the claim record
// (data.jsx) — policies name this coverage differently, so nothing here is
// hardcoded. Shared with the claim overview via window.
const PolicyLimitMeter = ({ used }) => {
  const { label, limit, alreadyClaimed } = window.CLAIM_PP_LIMIT;
  if (!limit) return null;
  const applied = used + alreadyClaimed;
  const pct = Math.min((applied / limit) * 100, 100);
  const over = applied > limit;
  const near = !over && pct >= 80;
  const tone = over ? 'var(--k-danger)' : near ? 'var(--k-warn)' : 'var(--k-accent)';
  return (
    <div style={{ width: 186 }} title={`${label} · ${fmtUSD(limit)} limit`}>
      <div className="k-tot-l" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ color: tone }}>{over ? 'Over PP limit' : near ? 'Nearing PP limit' : 'PP limit used'}</span>
        <span style={{ color: 'var(--k-fg-4)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'var(--k-line)', overflow: 'hidden', margin: '5px 0 4px' }}>
        <div style={{ width: pct + '%', height: '100%', background: tone }} />
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
        {fmtUSDshort(applied)} of {fmtUSDshort(limit)}{over ? ` · ${fmtUSDshort(applied - limit)} over` : ''}
      </div>
    </div>
  );
};

const RCVPopover = ({ row, onClose, onPick, pos, popRef }) => {
  // Comps come straight from the payload — alternative_sources = [{ title,
  // source, price, link }]. The median offer is Kevin's pick and sets RCV.
  const srcs = row.alternative_sources || [];
  const median = [...srcs].sort((a, b) => a.price - b.price)[Math.floor(srcs.length / 2)];
  const alts = srcs.map(s => ({ ...s, pick: s === median }));
  return (
    <div ref={popRef} className="k-pop" style={{ position: 'fixed', top: pos.top, left: pos.left, width: 380, zIndex: 200, padding: 0, maxHeight: pos.maxH, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ padding: '11px 13px', borderBottom: '1px solid var(--k-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Live comps · median sets RCV</div>
          <div style={{ fontSize: 12.5, color: 'var(--k-fg-2)', marginTop: 3, fontWeight: 500 }}>{[row.mfr, row.model].filter(Boolean).join(' · ') || 'Not identified'}</div>
        </div>
        <button onClick={onClose} className="k-icon-btn"><Icon d={I.close} size={12} /></button>
      </div>
      <div style={{ padding: 6, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {alts.length === 0 && (
          <div style={{ padding: '14px 13px', fontSize: 12, color: 'var(--k-fg-4)' }}>{manualRow ? 'This item was added by hand. Describe it above to look up pricing, or type a price into the worksheet.' : 'No comps were returned for this item.'}</div>
        )}
        {alts.map((a, i) => (
          <div key={i} className="k-alt">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--k-fg)' }}>{a.source}</span>
                {a.pick && <Badge tone="accent">Kevin's pick · median</Badge>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230 }}>{a.title}</div>
              {isDirectComp(a.link)
                ? <a href={a.link} target="_blank" rel="noopener noreferrer" className="k-src-link" style={{ fontSize: 10.5, fontFamily: 'var(--k-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230 }} onClick={(e) => e.stopPropagation()}>{a.link.replace(/^https?:\/\/(www\.)?/, '')}</a>
                : <span style={{ fontSize: 10.5, fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-4)' }} title="Runner-up comp — no direct listing resolved">no direct listing</span>}
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontFamily: 'var(--k-font-mono)', fontWeight: 600, fontSize: 14, color: 'var(--k-fg)' }}>{fmtUSD(a.price)}</div>
              <div style={{ fontSize: 10.5, color: a.pick ? 'var(--k-accent)' : (a.price < row.rcv ? 'var(--k-ok)' : 'var(--k-fg-4)'), fontFamily: 'var(--k-font-mono)' }}>{a.pick ? 'Sets RCV' : (a.price < row.rcv ? '−' : '+') + fmtUSD(Math.abs(a.price - row.rcv))}</div>
              {!a.pick && <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => onPick(a)}>Use this</button>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '9px 13px', borderTop: '1px solid var(--k-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--k-fg-4)' }}>
        <span>{relTime(row.compsFetchedAt)}</span>
        <button className="k-link"><Icon d={I.refresh} size={11} /> Recheck now</button>
      </div>
    </div>
  );
};

const RCVCell = ({ row, value, onChange }) => {
  // Keep a raw string draft while the cell is focused — formatting mid-keystroke
  // (v.toFixed(2) on every change) made typed digits land in the wrong place.
  const [draft, setDraft] = React.useState(null);
  const { open, setOpen, toggle, pos, triggerRef, popRef } = useAnchoredMenu({ width: 380, max: 360, min: 180 });
  const display = draft !== null ? draft : (value == null ? '' : Number(value).toFixed(2));
  React.useEffect(() => { setDraft(null); }, [value]);
  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div className={`k-cell k-cell--rcv ${open ? 'k-cell--focus' : ''}`} onClick={() => { if (!open) toggle(); }} style={{ cursor: 'pointer' }}>
        <span style={{ color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>$</span>
        <input
          value={display}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setDraft('')}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          placeholder={value == null ? '0.00' : undefined}
          onBlur={() => {
            const num = parseFloat(String(draft ?? '').replace(/[^0-9.\-]/g, ''));
            setDraft(null);
            if (!isNaN(num) && num !== value) onChange?.(num);
          }}
          style={{ font: 'inherit', border: 0, background: 'transparent', outline: 0, textAlign: 'right', width: '100%', fontFamily: 'var(--k-font-mono)', color: 'inherit', fontFeatureSettings: '"tnum"' }}
        />
        <Icon d={I.chevdown} size={10} />
      </div>
      {open && pos && ReactDOM.createPortal(
        <RCVPopover row={row} pos={pos} popRef={popRef} onClose={() => setOpen(false)} onPick={(a) => { setDraft(null); onChange?.(a.price, { sourceLink: a.link }); setOpen(false); }} />,
        document.body
      )}
    </div>
  );
};

// ---------- Depr. cell — editable value + defensibility popover -------------
const DepCell = ({ row, onChange, onRelease }) => {
  const asPct = (f) => (f == null ? '' : String(Math.round(f * 1000) / 10));
  const [v, setV] = React.useState(asPct(row.depreciation_pct));
  const { open, toggle, pos, triggerRef, popRef } = useAnchoredMenu({ width: 268, max: 300, min: 140 });
  React.useEffect(() => { setV(asPct(row.depreciation_pct)); }, [row.depreciation_pct, row._depFlash]);
  // Explainer comes from the payload the server authored (rule 20) — the
  // component never derives a rate, a useful life, or an override comparison.
  const ex = row.depMeta || {};
  const manualOverride = !!row.depManual;
  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div className={`k-cell ${open ? 'k-cell--focus' : ''} ${row.depPending ? 'k-cell--pending' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {row.depPending ? (
          <React.Fragment>
            <span className="k-dep-spin" title="Recalculating on the server…" />
            <span style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-4)', fontFeatureSettings: '"tnum"' }}>—</span>
          </React.Fragment>
        ) : (
        <input
          key={`dep-${row._depFlash || 0}`}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          onBlur={() => onChange?.(parseFloat(v) || 0)}
          className={row._depFlash ? 'k-flash' : ''}
          style={{ font: 'inherit', border: 0, background: 'transparent', outline: 0, textAlign: 'right', width: '100%', fontFamily: 'var(--k-font-mono)', color: 'inherit', fontFeatureSettings: '"tnum"' }}
        />
        )}
        <span style={{ color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', fontSize: 11 }}>%</span>
        <button onClick={toggle} className="k-icon-btn" title="How this was calculated" style={{ padding: 1, flexShrink: 0 }}><Icon d={I.info} size={11} /></button>
      </div>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="k-pop" style={{ position: 'fixed', top: pos.top, left: pos.left, width: 268, zIndex: 200, padding: 12, maxHeight: pos.maxH, overflowY: 'auto' }}>
          <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>How this depreciation was set</div>
          {[
            ['Content class',  row.cat],
            ['Method',         ex.method === 'straight_line' ? 'Straight-line' : ex.method === 'bracketed' ? 'Bracketed schedule' : 'Manual'],
            ['Useful life',    ex.life ? `~${ex.life} yrs` : '—'],
            ['Item age',       `${row.age_years ?? row.age ?? 0} yr`],
            ['Scheduled rate', ex.pct != null ? `${ex.pct}%` : 'Manual — no schedule'],
          ].map(([k, val], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 0', fontSize: 12 }}>
              <span style={{ color: 'var(--k-fg-4)' }}>{k}</span>
              <span style={{ color: 'var(--k-fg-2)', fontFamily: 'var(--k-font-mono)', textAlign: 'right' }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--k-line)', fontSize: 11.5, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>
            {manualOverride
              ? <><strong style={{ color: 'var(--k-warn)' }}>Entered by the preparer</strong> at {asPct(row.depreciation_pct)}% — the schedule no longer drives this row. Recorded in the audit log.</>
              : row.needs_manual
                ? <>Kevin did not price this item, so no depreciation is applied. Enter a value (or an appraisal figure) and the percentage becomes yours to set.</>
                : ex.rationale
                  ? <><strong style={{ color: 'var(--k-fg-2)' }}>{ex.rationale}</strong> Defensible against carrier review.</>
                  : <>No standard schedule for this class — enter depreciation manually with your own basis.</>}
          </div>
          {manualOverride && onRelease && (
            <button className="k-btn k-btn--ghost k-btn--sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
              onClick={() => { onRelease(); toggle(); }}
              title="Sends depreciation_method — the explicit release; never a null rate">
              Use the schedule instead
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// Source-link cell — renders the proof URL backing this row's RCV. When the
// price was hand-entered (no comp matches) the adjuster can paste their own.
const SourceLinkCell = ({ row, onUpdate }) => {
  const [editing, setEditing] = React.useState(false);
  const [v, setV] = React.useState('');
  const srcs = row.alternative_sources || [];
  // Estate rows are FMV-based; insurance rows are RCV-based. Prefer fmv so an
  // estate row never matches against a leftover retail price from the template.
  const price = row.fmv != null ? row.fmv : row.rcv;
  const backing = srcs.find(s => s.link === row.sourceLink)
    // Exact price match wins (the comp that actually set the value) — a ±$0.51
    // proximity window alone mis-picks on cheap items, where a 4% synthetic
    // spread still lands inside it. Then prefer a DIRECT listing over a Google
    // search URL, then fall back to proximity.
    || srcs.find(s => Math.abs(s.price - price) < 0.005 && isDirectComp(s.link))
    || srcs.find(s => Math.abs(s.price - price) < 0.005)
    || srcs.find(s => Math.abs(s.price - price) < 0.51 && isDirectComp(s.link))
    || srcs.find(s => Math.abs(s.price - price) < 0.51);
  const manualLink = !backing && row.sourceLink ? row.sourceLink : null;
  const save = () => {
    const url = v.trim();
    onUpdate({ sourceLink: url ? (/^https?:\/\//.test(url) ? url : 'https://' + url) : null });
    setEditing(false);
  };
  if (editing) {
    return (
      <input
        autoFocus value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        onBlur={save}
        placeholder="Paste URL"
        className="k-src-input"
      />
    );
  }
  if (backing) return <a className="k-src-link" href={backing.link} target="_blank" rel="noopener noreferrer" title={`${backing.source} — ${backing.title}`}>Link</a>;
  if (manualLink) return <a className="k-src-link" href={manualLink} target="_blank" rel="noopener noreferrer" title={`Preparer-supplied source · ${manualLink}`}>Link</a>;
  return <button className="k-src-add" onClick={() => { setV(''); setEditing(true); }} title="Paste a source URL for this price">+ Add</button>;
};

// ---------- Row (memoized for virtualization perf) --------------------------
const Row = React.memo(({ row, idx, selected, onSelect, onUpdate, onLightbox, density, active, onRowClick }) => {
  const { dep, tax, acv, unpriced } = lineTotals(row);
  const rowHeight = density === 'compact' ? 34 : 42;
  // While the inspector is docked the whole row is the target — but a click on a
  // field, button, link or menu belongs to that control, not to row selection.
  const rowClick = onRowClick ? (e) => {
    if (e.target.closest('input, textarea, select, button, a, .k-pop')) return;
    onRowClick();
  } : undefined;
  // Focus-sync follows the adjuster through the grid — but a checkbox click is a
  // selection action, not an inspection one, so it must not move the panel.
  const rowFocus = onRowClick ? (e) => { if (e.target.closest('.k-check')) return; onRowClick(); } : undefined;
  return (
    <div onClick={rowClick} onFocusCapture={rowFocus} className={`k-row ${selected ? 'k-row--sel' : ''} ${row.special_limits ? 'k-row--flag' : ''} ${active ? 'k-row--active' : ''}`} style={{ height: rowHeight, cursor: onRowClick ? 'pointer' : null }}>
      <div className="k-c k-c--check">
        <button onClick={onSelect} className={`k-check ${selected ? 'k-check--on' : ''}`}>
          {selected && <Icon d={I.check} size={10} stroke={2} />}
        </button>
      </div>
      <div className="k-c k-c--idx" style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-4)', fontSize: 10.5, cursor: 'pointer' }} onClick={onLightbox} title="View source photo">{String(idx + 1).padStart(4, '0')}</div>
      <div className="k-c k-c--room"><TextCell value={row.room || ''} onChange={(v) => onUpdate({ room: v })} placeholder="Room / area…" /></div>
      <div className="k-c k-c--qty"><TextCell value={String(row.qty)} mono align="right" onChange={(v) => onUpdate({ qty: parseInt(v) || 1 })} /></div>
      <div className="k-c k-c--desc">
        <TextCell value={row.desc} placeholder={row.desc === '' ? 'Not identified — type a description' : undefined} onChange={(v) => onUpdate({ desc: v })} />
      </div>
      <div className="k-c k-c--mfr"><TextCell value={row.mfr} placeholder={row.mfr === '' ? '—' : undefined} onChange={(v) => onUpdate({ mfr: v })} /></div>
      <div className="k-c k-c--model">
        <TextCell value={row.model} mono placeholder={row.model === '' ? '—' : undefined} onChange={(v) => onUpdate({ model: v })} />
        {row.barcode && <Badge tone="ok">Barcode</Badge>}
      </div>
      <div className="k-c k-c--cat">
        <CategoryCell value={row.cat} onChange={(v) => onUpdate({ cat: v })} />
        {row.special_limits && <span style={{ flexShrink: 0 }}><Badge tone="warn">Special limits</Badge></span>}
      </div>
      <div className="k-c k-c--rcv">
        {row.pricePending
          ? <span className="k-paused" title="Looking up pricing…"><span className="k-paused-dot" /> Pricing</span>
          : window.isCapacityWait(row)
          ? <span className="k-paused" title={(window.MANUAL_CAPACITY_COPY[row.manual_reason] || {}).detail}>
              <span className="k-paused-dot" /> Pricing
            </span>
          : row.needs_manual
          ? <RCVCell row={row} value={row.rcv} onChange={(v, extra) => onUpdate({ rcv: v, needs_manual: false, manual_reason: null, valuation_basis: 'manual', overridden: true, ...(extra || { sourceLink: null }) })} />
          : <><RCVCell row={row} value={row.rcv} onChange={(v, extra) => { if ((row.alternative_sources || []).length && !window.confirm('Entering a price by hand clears the comparable sources on this line \u2014 they justified the old number. Continue?')) return; onUpdate({ rcv: v, valuation_basis: 'manual', overridden: true, alternative_sources: null, ...(extra || { sourceLink: null }) }); }} /></>}
      </div>
      <div className="k-c k-c--ext" style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-2)', textAlign: 'right', fontSize: 12, fontFeatureSettings: '"tnum"' }} title="Extended cost · unit cost × qty">{unpriced ? <span style={{ color: 'var(--k-fg-4)' }}>—</span> : fmtUSD(row.rcv * row.qty)}</div>
      <div className="k-c k-c--tax" style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-3)', textAlign: 'right', fontSize: 12, fontFeatureSettings: '"tnum"' }}>{unpriced ? <span style={{ color: 'var(--k-fg-4)' }}>—</span> : fmtUSD(tax)}</div>
      <div className="k-c k-c--rcvtax" style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-2)', textAlign: 'right', fontSize: 12, fontFeatureSettings: '"tnum"' }} title="Extended cost + sales tax">{unpriced ? <span style={{ color: 'var(--k-fg-4)' }}>—</span> : fmtUSD(row.rcv * row.qty + tax)}</div>
      <div className="k-c k-c--age"><TextCell value={String(row.age_years ?? 0)} mono align="right" onChange={(v) => onUpdate({ age_years: parseFloat(v) || 0 })} /></div>
      <div className="k-c k-c--dep"><DepCell row={row} onChange={(v) => onUpdate({ depreciation_pct: (parseFloat(v) || 0) / 100 })} onRelease={() => onUpdate({ depreciation_method: 'straight_line' })} /></div>
      <div className="k-c k-c--depamt" style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-3)', textAlign: 'right', fontSize: 12, fontFeatureSettings: '"tnum"' }} title="Depreciation amount (extended cost × depr. %)">{unpriced ? <span style={{ color: 'var(--k-fg-4)' }}>—</span> : (dep > 0 ? `−${fmtUSD(dep)}` : fmtUSD(0))}</div>
      <div className="k-c k-c--acv" style={{ fontFamily: 'var(--k-font-mono)', textAlign: 'right', fontWeight: 600, fontSize: 13, fontFeatureSettings: '"tnum"' }}>{unpriced ? <span style={{ color: 'var(--k-fg-4)', fontWeight: 400 }}>—</span> : fmtUSD(acv)}</div>
      <div className="k-c k-c--src">
        {!unpriced && <SourceLinkCell row={row} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}, (a, b) => a.row === b.row && a.idx === b.idx && a.selected === b.selected && a.density === b.density && a.active === b.active && !!a.onRowClick === !!b.onRowClick);

// ---------- Header ----------------------------------------------------------
const HEADERS = [
  ['k-c--check',  ''],
  ['k-c--idx',    '#'],
  ['k-c--room',   'Room / Area'],
  ['k-c--qty',    'Qty'],
  ['k-c--desc',   'Description'],
  ['k-c--mfr',    'Make / Mfr'],
  ['k-c--model',  'Model #'],
  ['k-c--cat',    'Content class'],
  ['k-c--rcv',    'Unit Cost'],
  ['k-c--ext',    'Ext. Cost'],
  ['k-c--tax',    'Sales Tax'],
  ['k-c--rcvtax', 'RCV + Tax'],
  ['k-c--age',    'Age'],
  ['k-c--dep',    '% Depr.'],
  ['k-c--depamt', '$ Depr.'],
  ['k-c--acv',    'ACV'],
  ['k-c--src',    'Link'],
];

// ---------- Lightbox --------------------------------------------------------
const EVENT_LABEL = (e) => {
  // Branch on event_type (backend c70e9cc). TIMING FACT: priced/repriced fire at
  // the START of valuation, before any price exists — their payloads carry only
  // queries; the money lives on 'completed'. So they read as searches, not
  // results: "Searched" / "Refined the query"; 'completed' is "Priced at $".
  // Legacy: pre-c70e9cc rows emit repriced/user for first valuations — accepted.
  if (e.event_type === 'priced') return 'Searched';
  if (e.event_type === 'repriced') return 'Refined the query';
  return { created: 'Created', completed: 'Priced', overridden: 'Price overridden', needs_manual: 'Sent to manual', failed: 'Failed' }[e.event_type] || e.event_type;
};
const ItemHistory = ({ rowId }) => {
  const [events, setEvents] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setEvents(null); setOpen(false); }, [rowId]);
  const load = () => { setOpen(o => !o); if (!events) window.KevinAPI.itemEvents(rowId).then(r => setEvents(r.events)); };
  return (
    <div className="k-insp-field">
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>History</span>
        <button className="k-link" onClick={load}>{open ? 'Hide' : 'Show'}</button>
      </label>
      {open && (events === null
        ? <div className="k-hist-row" style={{ color: 'var(--k-fg-4)' }}>Loading…</div>
        : events.map((e, i) => (
          <div key={i} className="k-hist-row">
            <span className={'k-hist-actor' + (e.actor_kind === 'worker' ? ' k-hist-actor--sys' : '')}>{e.actor_kind === 'worker' ? 'Kevin' : 'You'}</span>
            <span className="k-hist-what">
              {EVENT_LABEL(e)}
              {e.event_type === 'completed' && e.payload && e.payload.rcv != null ? ` at ${fmtUSD(e.payload.rcv)} — ${e.payload.valuation_basis || 'retail'}, ${Math.round((e.payload.confidence || 0) * 100)}% confidence` : ''}
              {e.event_type === 'priced' && e.payload && (e.payload.refined_query || e.payload.previous_query) ? ` — “${e.payload.refined_query || e.payload.previous_query}”` : ''}
              {/* previous_query → refined_query is the only record of the adjuster's reasoning — render the diff. */}
              {e.event_type === 'repriced' && e.payload && e.payload.refined_query
                ? (e.payload.previous_query && e.payload.previous_query !== e.payload.refined_query
                  ? ` — “${e.payload.previous_query}” → “${e.payload.refined_query}”`
                  : ` — “${e.payload.refined_query}”`)
                : ''}
            </span>
            <span className="k-hist-when">{new Date(e.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        )))}
    </div>
  );
};

const Lightbox = ({ row, index, total, onNav, onClose, onUpdate, docked, onToggleDock, mode = 'insurance' }) => {
  const estate = mode === 'estate';
  const [editing, setEditing]     = React.useState(false);
  const [repricing, setRepricing] = React.useState(false);
  const [query, setQuery]         = React.useState(row.desc);
  const [qMfr, setQMfr]           = React.useState(row.mfr || '');
  const [qModel, setQModel]       = React.useState(row.model || '');
  const [queryTrimmed, setQueryTrimmed] = React.useState(null); // the exact trimmed search string, shown when it differs
  const dockRef = React.useRef(null);
  // Reset the edit state whenever we jump to a different row (prev/next).
  React.useEffect(() => { setEditing(false); setRepricing(false); setQuery(row.desc); setQMfr(row.mfr || ''); setQModel(row.model || ''); setQueryTrimmed(null); }, [row.id]);
  // Keyboard: ↑/↓ move between rows, Esc closes — no mouse needed for a long inventory.
  // Docked, the grid stays live underneath, so never steal keys from a focused
  // field (the caret and Esc belong to whatever the adjuster is typing in) and
  // only take arrows when focus is actually inside the panel.
  React.useEffect(() => {
    const onKey = (e) => {
      if (editing) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (docked && dockRef.current && !dockRef.current.contains(t)) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); onNav(1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); onNav(-1); }
      else if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing, docked, onNav, onClose]);

  const { dep, tax, acv } = lineTotals(row);
  const refined = !!row.is_manually_queried;
  // A hand-added row was never seen by Vision and never priced — comps, "recheck"
  // and "re-price" all describe work that never happened for it.
  const manualRow = row.valuation_basis === 'manual' && !row.desc;
  // Photo attached by hand, as an object URL. Rows Kevin identified already have
  // a source capture; this is for rows the adjuster added.
  const [ownPhoto, setOwnPhoto] = React.useState(row.photoUrl || null);
  const [dragOver, setDragOver] = React.useState(false);
  // photos[] from GET /v1/claim_items/{row_id} — id-joined (staging_photos.item_id),
  // primary first. [] is normal (single-photo /process or written import) → fall
  // back to row.photo. Production fetches frames via the batch thumbnail endpoint.
  const frames = (row.photos && row.photos.length) ? row.photos : null;
  const [frame, setFrame] = React.useState(0);
  React.useEffect(() => { setFrame(0); }, [row.id]);
  const curFrame = frames ? frames[Math.min(frame, frames.length - 1)] : null;
  const photoRef = React.useRef(null);
  React.useEffect(() => { setOwnPhoto(row.photoUrl || null); }, [row.id]);
  const attachPhoto = (fileList) => {
    const f = fileList && fileList[0];
    if (!f || !/^image\//.test(f.type)) return;
    const url = URL.createObjectURL(f);
    setOwnPhoto(url);
    // POST /v1/claim_items/{row_id}/photo (822f79f, LIVE) — multipart, one file
    // under `image`. 201 returns the FULL photos[] array (frame pager re-renders
    // with no second fetch); images still fetch via the batch thumbnail
    // endpoint. DUMB STORAGE: no Vision call, no re-valuation, no money touched,
    // no event emitted — never imply "attach and Kevin prices it" (staging is
    // that front door). First photo on an imageless row → is_primary:true and
    // becomes the grid thumbnail; later attaches are extra evidence, never a
    // replacement. Idempotent by content hash — retry is free. Errors: 404
    // (pre-write) · 415 · 400 empty · 413 · 429 (shares /process 30/min) · 502.
    onUpdate && onUpdate({ photoUrl: url, photoName: f.name });
  };
  const noCapture = row.valuation_basis === 'manual' && !row.barcode;
  const srcs = row.alternative_sources || [];
  const medianSrc = srcs.length ? [...srcs].sort((a, b) => a.price - b.price)[Math.floor(srcs.length / 2)] : null;
  const alts = srcs.map(s => ({
    ...s,
    pick: row.sourceLink ? s.link === row.sourceLink : s === medianSrc,
  }));
  const runReprice = () => {
    setRepricing(true);
    // POST /v1/claim_items/{id}/reprice — the server re-runs the aggregator and
    // returns the new price AND fresh comps; the UI only applies the response.
    // ONE atomic call (backend 673e5e1): POST …/reprice carries the identity
    // fields WITH the search — the server writes make_mfr/model_number/
    // description to the row in the same write as the status flip, before the
    // job is enqueued, so the pipeline's brand corroboration (like_kind_new +
    // substitution_note) always reads fresh identity. No PATCH-first sequencing.
    // query stays the exact verbatim search string (3–200), composed HERE —
    // never server-composed. PATCH semantics on identity: omitted = untouched,
    // ""/null = cleared (blank beats wrong in Model #). Ceilings: make/model
    // ≤200, description ≤500 → 422 over limit.
    const desc = query.trim(), mfr = qMfr.trim(), model = qModel.trim();
    // NEVER slice to 200 — a mid-token cut ("…Total Coverage Coo") goes to
    // SerpApi verbatim and prices the wrong product with no tell. Compose
    // identity-first (make + model drive the match; the full description is
    // persisted separately) and trim the description tail at a WORD boundary.
    let composed = [mfr, model, desc].filter(Boolean).join(' ');
    let trimmed = false;
    if (composed.length > 200) {
      composed = composed.slice(0, 200).replace(/\s+\S*$/, '');
      trimmed = true;
    }
    setQueryTrimmed(trimmed ? composed : null);
    onUpdate({ desc, mfr, model }); // local state mirror; the SERVER persists identity via the reprice write
    (estate ? window.KevinAPI.repriceFmv(row.id, { query: composed })
            : window.KevinAPI.reprice(row.id, { query: composed, category: row.cat, make_mfr: mfr, model_number: model, description: desc }))
      .then((res) => {
        onUpdate({ is_manually_queried: true, rcv: res.rcv, alternative_sources: res.alternative_sources, sourceLink: null, compsFetchedAt: res.fetchedAt,
          tax: res.tax, rcv_total_incl: res.rcv_total_incl, depreciation_amount: res.depreciation_amount, acv_total_incl: res.acv_total_incl });
        setRepricing(false);
        setEditing(false);
      });
  };

  const body = (
    <React.Fragment>
      <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--k-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.desc || 'Not identified'}</div>
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 2 }}>IMG_{String(row.id).padStart(4, '0')}.jpg · {row.room || 'Unassigned'} · item {index + 1} / {total}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => onNav(-1)} className="k-icon-btn" title="Previous item (↑)" disabled={index === 0}><Icon d={I.chevleft} size={14} /></button>
          <button onClick={() => onNav(1)} className="k-icon-btn" title="Next item (↓)" disabled={index === total - 1}><Icon d={I.chevright} size={14} /></button>
          <div style={{ width: 1, height: 18, background: 'var(--k-line)', margin: '0 4px' }} />
          <button onClick={onToggleDock} className={`k-icon-btn ${docked ? 'k-icon-btn--on' : ''}`} title={docked ? 'Unpin — return to full view' : 'Pin to the right — keeps this panel open while you move down the grid'}><Icon d={I.pin} size={14} /></button>
          <button onClick={onClose} className="k-icon-btn" title="Close (Esc)"><Icon d={I.close} size={14} /></button>
        </div>
      </div>
      <div className={docked ? 'k-dock-panes' : ''} style={docked ? null : { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div
          className={(docked ? 'k-dock-photo' : '') + (dragOver ? ' k-photo-drop--over' : '')}
          onDragOver={noCapture && !ownPhoto ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
          onDragLeave={noCapture && !ownPhoto ? () => setDragOver(false) : undefined}
          onDrop={noCapture && !ownPhoto ? (e) => { e.preventDefault(); setDragOver(false); attachPhoto(e.dataTransfer.files); } : undefined}
          style={{ minWidth: 0, aspectRatio: '4/3', background: ownPhoto ? 'var(--k-bg-3)' : `repeating-linear-gradient(135deg, ${window.THUMB_TONES[row._photoIdx % 8][0]} 0 24px, ${window.THUMB_TONES[row._photoIdx % 8][1]} 24px 48px)`, position: 'relative', borderRight: '1px solid var(--k-line)' }}>
          {ownPhoto || (curFrame && curFrame.src) || (row.photo && row.photo.src) || window.productImgFor(row.desc)
            ? <img src={ownPhoto || (curFrame && curFrame.src) || (row.photo && row.photo.src) || window.productImgFor(row.desc)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: (curFrame || row.photo) ? 'contain' : 'cover', background: (curFrame || row.photo) && !ownPhoto ? 'oklch(0.2 0.01 250)' : undefined }} />
            : noCapture
              ? (
                <div className="k-photo-drop">
                  <Icon d={I.camera} size={20} />
                  <div className="k-photo-drop-t">No photo on this item</div>
                  <div className="k-photo-drop-s">You added this row by hand. Drop a photo here so it travels with the PDF and bundle.</div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { attachPhoto(e.target.files); e.target.value = ''; }} />
                  <button className="k-btn k-btn--sm" onClick={() => photoRef.current && photoRef.current.click()}>Add a photo</button>
                </div>
              )
              : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--k-font-mono)', fontSize: 14, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{[row.mfr, row.model].filter(Boolean).join(' · ') || 'Not identified'}</div>}
          {ownPhoto && (
            <button className="k-photo-replace" onClick={() => { setOwnPhoto(null); onUpdate && onUpdate({ photoUrl: null, photoName: null }); }} title="Remove this photo">
              <Icon d={I.close} size={12} />
            </button>
          )}
          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 6 }}>
            {row.barcode && <Badge tone="ok" dot={true}>Barcode</Badge>}
            {row.special_limits && <Badge tone="warn" dot={true}>Special limits</Badge>}
          </div>
          {frames && frames.length > 1 && (
            <div className="k-frame-pager">
              <button className="k-icon-btn" title="Previous photo" onClick={(e) => { e.stopPropagation(); setFrame(f => (f + frames.length - 1) % frames.length); }}><Icon d={I.chevleft} size={12} /></button>
              <span className="k-frame-pager-n">{frame + 1} / {frames.length}{curFrame && (curFrame.note || curFrame.room) ? ' · ' + [curFrame.note, curFrame.room].filter(Boolean).join(' · ') : ''}</span>
              <button className="k-icon-btn" title="Next photo" onClick={(e) => { e.stopPropagation(); setFrame(f => (f + 1) % frames.length); }}><Icon d={I.chevron} size={12} /></button>
            </div>
          )}
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: docked ? 'none' : 440, overflowY: docked ? 'visible' : 'auto', flex: docked ? '0 0 auto' : null, minHeight: 0 }}>
          <div className="k-insp-field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>Description {editing && <span style={{ color: 'var(--k-accent)', fontWeight: 600 }}>· refined query</span>}</span>
              {refined
                ? <span className="k-refined-tag" title="This item's search query was human-steered by the adjuster, not purely AI-generated."><Icon d={I.check} size={9} /> Manually refined</span>
                : <span className="k-insp-hint" style={{ marginTop: 0 }}><ConfPip level={row.conf} /> Kevin · {row.conf}</span>}
            </label>
            {editing ? (
              <>
                <input className="k-insp-input" value={query} autoFocus disabled={repricing}
                  placeholder="Describe the exact item — e.g. Conor leather sofa, cognac"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && query.trim() && !repricing) runReprice(); }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input className="k-insp-input" style={{ flex: 1 }} value={qMfr} disabled={repricing} placeholder="Make — e.g. Ethan Allen"
                    onChange={(e) => setQMfr(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && query.trim() && !repricing) runReprice(); }} />
                  <input className="k-insp-input" style={{ flex: 1, fontFamily: 'var(--k-font-mono)' }} value={qModel} disabled={repricing} placeholder="Model #"
                    onChange={(e) => setQModel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && query.trim() && !repricing) runReprice(); }} />
                </div>
                <span className="k-insp-hint">Kevin re-searches live comps from make + model + description — the exact query, nothing inferred.</span>
              </>
            ) : (
              <div className="k-refined-desc">
                <span style={row.desc ? null : { color: 'var(--k-fg-4)', fontStyle: 'italic' }}>
                  {row.desc || (manualRow
                    ? 'Added by hand — describe the item to look up pricing'
                    : 'Vision could not identify this — describe it and re-price')}
                </span>
                <button className="k-btn k-btn--ghost k-btn--sm" style={{ flexShrink: 0 }} onClick={() => { setQuery(row.desc); setEditing(true); }}>
                  <Icon d={manualRow && !row.desc ? I.edit : I.refresh} size={11} /> {manualRow && !row.desc ? 'Add details & price' : 'Edit & re-price'}
                </button>
              </div>
            )}
          </div>
          {row.valuation_basis === 'like_kind_new' && row.substitution_note && (
            <div className="k-lkq-note">
              <span className="k-lkq-note-l">Like kind &amp; quality</span>
              <span className="k-lkq-note-b">{row.substitution_note}</span>
            </div>
          )}
          <ItemHistory rowId={row.id} />
          <div className="k-insp-field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>{manualRow ? 'No comps yet' : estate ? 'Sold comps · median sets FMV' : 'Live comps · median sets RCV'}</span>
              {!editing && <button className="k-link" onClick={() => { setQuery(row.desc); setEditing(true); }}><Icon d={manualRow ? I.search : I.refresh} size={10} /> {manualRow ? 'Look up pricing' : 'Recheck'}</button>}
            </label>
            {queryTrimmed && !repricing && (
              <div className="k-insp-hint" style={{ color: 'var(--k-warn-ink, oklch(0.5 0.1 80))', marginBottom: 6 }}>
                Search query was shortened to fit — priced from: “{queryTrimmed}”. Edit &amp; re-price to adjust.
              </div>
            )}
            {repricing ? (
              <div className="k-insp-alts">
                <div className="k-reprice-status"><span className="k-spinner" /> Searching retailers for “{query.trim()}”…</div>
                {[0, 1, 2].map(i => <div key={i} className="k-skel-comp" />)}
              </div>
            ) : (
              <div className="k-insp-alts">
                {alts.length === 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', padding: '8px 10px', background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 6, lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>No source — needs justification.</strong> The price was entered by hand, so the comps that backed the old number no longer apply. Paste a proof URL on the row, or Edit &amp; re-price to fetch fresh comps.
                  </div>
                )}
                {alts.map((a, i) => (
                  <ExtLink key={i} a={a} className="k-insp-alt">
                    <Badge tone="quiet" dot={true}>{a.source}</Badge>
                    {a.pick && <Badge tone="accent">{estate ? 'Sets FMV' : 'Sets RCV'}</Badge>}
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--k-fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                    <span className="k-mono" style={{ fontWeight: 600, color: a.pick ? 'var(--k-accent)' : 'var(--k-fg)' }}>{fmtUSD(a.price)}</span>
                  </ExtLink>
                ))}
              </div>
            )}
            {editing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {!repricing && <button className="k-btn k-btn--ghost k-btn--sm" onClick={() => { setEditing(false); setQuery(row.desc); }}>Cancel</button>}
                <button className="k-btn k-btn--sm" style={{ flex: 1, justifyContent: 'center' }} disabled={repricing || !query.trim()} onClick={runReprice}>
                  {repricing ? <><span className="k-spinner k-spinner--btn" /> Fetching comps…</> : <><Icon d={I.refresh} size={12} /> Fetch new comps</>}
                </button>
              </div>
            )}
          </div>
          {estate ? (
          <div className="k-insp-totals">
            <div><span>Fair market value</span><span className="k-mono">{fmtUSD(row.rcv || 0)}</span></div>
            <div><span>Condition</span><span className="k-mono" style={{ color: 'var(--k-fg-3)' }}>{row.condition || '—'}</span></div>
            <div><span>Status</span><span className="k-mono" style={{ color: 'var(--k-fg-3)' }}>{row.disposition || 'Unassigned'}</span></div>
            <div className="k-insp-totals-acv"><span>{row.disposition === 'Sold' ? 'Sold for' : 'Not yet sold'}</span><span className="k-mono">{row.salePrice == null ? '—' : fmtUSD(row.salePrice)}</span></div>
          </div>
          ) : (
          <div className="k-insp-totals" style={repricing ? { opacity: 0.4, transition: 'opacity 0.2s' } : null}>
            <div><span>Subtotal</span><span className="k-mono">{row.rcv == null ? '—' : fmtUSD(row.rcv * row.qty)}</span></div>
            <div><span>− Depreciation ({row.depreciation_pct == null ? '—' : Math.round(row.depreciation_pct * 1000) / 10}%)</span><span className="k-mono" style={{ color: 'var(--k-fg-3)' }}>{dep == null ? '—' : dep > 0 ? `−${fmtUSD(dep)}` : fmtUSD(0)}</span></div>
            <div><span>+ Tax ({(taxRate() * 100).toFixed(2).replace(/\.?0+$/, '')}%)</span><span className="k-mono" style={{ color: 'var(--k-fg-3)' }}>{tax == null ? '—' : fmtUSD(tax)}</span></div>
            <div className="k-insp-totals-acv"><span>ACV</span><span className="k-mono">{acv == null ? '—' : fmtUSD(acv)}</span></div>
          </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--k-line)', display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{docked ? <React.Fragment>Panel follows the row you click</React.Fragment> : <React.Fragment><kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Esc</kbd> close</React.Fragment>}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="k-btn k-btn--ghost" onClick={() => onNav(-1)} disabled={index === 0}>Previous</button>
          <button className="k-btn" onClick={() => onNav(1)} disabled={index === total - 1}>Next item</button>
        </div>
      </div>
    </React.Fragment>
  );

  // tabIndex lets the panel take focus so its arrow-key nav works when clicked.
  if (docked) return <aside ref={dockRef} className="k-dock" tabIndex={-1}>{body}</aside>;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,18,28,0.75)', zIndex: 120, display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '82%', maxWidth: 940, background: 'var(--k-bg)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,20,40,0.5)' }}>
        {body}
      </div>
    </div>
  );
};

// ---------- Worksheet shell -------------------------------------------------
const Worksheet = ({ density = 'comfortable', sample = false, focusItem = null }) => {
  const [rows, setRows] = React.useState(() => buildWorksheetRows(57));
  const [selected, setSelected] = React.useState(new Set());
  const [lightbox, setLightbox] = React.useState(null);
  const [docked, setDocked] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollRef = React.useRef(null);
  const [viewportH, setViewportH] = React.useState(620);

  // Filter + grouping state
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters]       = React.useState({ barcode: false, sl: false, lowConf: false, highValue: false });
  const [roomFilter, setRoomFilter] = React.useState('');   // '' = all rooms
  const [sessionFilter, setSessionFilter] = React.useState('all');   // 'all' | session id
  const [groupBy, setGroupBy]       = React.useState(false);
  const filterRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    if (filterOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [filterOpen]);
  const filterCount = Object.values(filters).filter(Boolean).length + (roomFilter ? 1 : 0);
  const clearFilters = () => { setFilters({ barcode: false, sl: false, lowConf: false, highValue: false }); setRoomFilter(''); };

  // Column widths — Google-Sheets-style resizable. Order matches HEADERS.
  // Values: number = px, string = CSS unit (e.g. 'minmax(0, 2.4fr)').
  const COL_DEFAULTS = [
    36, 46, 130, 46,
    'minmax(200px, 2.4fr)', 'minmax(110px, 1.1fr)', 'minmax(120px, 1.2fr)', 'minmax(150px, 1.6fr)',
    118, 96, 78, 100, 58, 84, 100, 100, 96,
  ];
  const [cols, setCols] = React.useState(COL_DEFAULTS);
  const gridTemplate = cols.map(c => typeof c === 'number' ? c + 'px' : c).join(' ');
  // Minimum width the grid needs = fixed tracks + the floor of each flexible
  // track. Derived from `cols` so widening a column grows the scroller with it
  // (a hardcoded value orphans the right-hand columns after a resize).
  const gridMinW = cols.reduce((sum, c) => {
    if (typeof c === 'number') return sum + c;
    const m = /minmax\(\s*(\d+)px/.exec(c);
    return sum + (m ? parseInt(m[1], 10) : 0);
  }, 0);
  // The body scrolls vertically but the header row is a sibling, so reserve the
  // scrollbar's width on the header or the last columns (ACV, link) misalign and
  // their resize handles fall underneath the scrollbar.
  const [sbW, setSbW] = React.useState(0);
  React.useLayoutEffect(() => {
    const measure = () => {
      const el = scrollRef.current;
      if (el) setSbW(el.offsetWidth - el.clientWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });
  const resizeRef = React.useRef(null);
  const startResize = (idx, ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const headerEl = ev.target.closest('.k-row--head');
    const cellEls = headerEl?.children;
    const startPx = cellEls?.[idx]?.getBoundingClientRect().width || 100;
    resizeRef.current = { idx, startX: ev.clientX, startPx };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (e) => {
      if (!resizeRef.current) return;
      const { idx, startX, startPx } = resizeRef.current;
      const next = Math.max(40, startPx + (e.clientX - startX));
      setCols(prev => prev.map((c, i) => i === idx ? next : c));
    };
    const up = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const rowHeight = density === 'compact' ? 34 : 42;

  // Deep-link to a row: focusItem prop (sample pane switch) or #item-N hash
  // (production link from the Photos tab). Scroll the virtual window to the row
  // and flash it — continuity instead of dumping the adjuster at row 1.
  const [flashRow, setFlashRow] = React.useState(null);
  React.useEffect(() => {
    const hash = (typeof location !== 'undefined' && location.hash.match(/^#item-(\d+)$/)) || null;
    const target = focusItem || (hash ? parseInt(hash[1], 10) : null);
    if (!target) return;
    const idx = rows.findIndex(r => r.id === target);
    if (idx < 0) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) { el.scrollTop = Math.max(0, idx * rowHeight - 120); setScrollTop(el.scrollTop); }
      setFlashRow(target);
      setTimeout(() => setFlashRow(null), 2400);
    });
  }, [focusItem]);

  // Filtered rows — search + filter chips
  const filtered = React.useMemo(() => {
    let out = rows;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(r => r.desc.toLowerCase().includes(q) || r.mfr.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q) || r.model.toLowerCase().includes(q) || (r.room || '').toLowerCase().includes(q));
    }
    if (sessionFilter !== 'all') {
      const ses = (window.CLAIM_SESSIONS || []).find(s => s.id === sessionFilter);
      if (ses) {
        const from = ses.itemFrom, to = ses.itemFrom + (ses.items || 0) - 1;
        out = out.filter((r) => { const no = rows.indexOf(r) + 1; return no >= from && no <= to; });
      }
    }
    if (roomFilter)        out = out.filter(r => (r.room || '').toLowerCase().includes(roomFilter.toLowerCase()));
    if (filters.barcode)   out = out.filter(r => r.barcode);
    if (filters.sl)        out = out.filter(r => r.special_limits);
    if (filters.lowConf)   out = out.filter(r => r.conf === 'low');
    if (filters.highValue) out = out.filter(r => (r.rcv ?? 0) * r.qty >= 1000);
    return out;
  }, [rows, search, filters, roomFilter, sessionFilter]);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    const ro = new ResizeObserver((e) => setViewportH(e[0].contentRect.height));
    ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  // Windowed render — overscan 8 rows top + bottom
  const overscan = 8;
  const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIdx = Math.min(filtered.length, Math.ceil((scrollTop + viewportH) / rowHeight) + overscan);
  const visible = filtered.slice(startIdx, endIdx);
  const padTop = startIdx * rowHeight;
  const totalH = filtered.length * rowHeight;

  // Functional update — memoized rows hold older closures, so reading `selected`
  // directly would let a stale copy overwrite the set.
  const toggleSel = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  // Depreciation is NEVER computed here. When class or age changes we mark the
  // row pending, ask the server to recalculate, and render whatever it returns
  // (CLAUDE.md rule 20 — the backend owns the math, so the worksheet and the
  // exported PDF can never disagree by a rounding penny).
  const rowsRef = React.useRef(rows);
  React.useEffect(() => { rowsRef.current = rows; }, [rows]);

  // ---- Batch operations on the selection ----------------------------------
  const nextId = React.useRef(100000);
  const [recatOpen, setRecatOpen] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);
  const deferred = rows.filter(r => window.isCapacityWait(r));
  const retryDeferred = () => {
    const ids = deferred.map(r => r.id);
    if (!ids.length) return;
    setRetrying(true);
    window.KevinAPI.retryDeferred(ids).then(({ results }) => {
      const priced = new Set(results.filter(r => r.priced).map(r => r.id));
      setRows(rs => rs.map(r => priced.has(r.id)
        ? { ...r, needs_manual: false, manual_reason: null, rcv: r.rcv || 0, _depFlash: Date.now() }
        : r));
      setRetrying(false);
    });
  };
  const recatRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => { if (recatRef.current && !recatRef.current.contains(e.target)) setRecatOpen(false); };
    if (recatOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [recatOpen]);

  // DELETE /v1/claim_items {item_ids} (LIVE) — hard delete, 1–500, unowned ids
  // skipped (compare `deleted` to sent to catch stale selections). NO photo is
  // ever deleted: `photos_detached` counts what came loose — surface it as
  // "N photos kept". Detached photos land in GET …/photos?state=unattached and
  // re-attach to any row on the SAME claim via POST …/{row_id}/photos
  // {photo_ids} (plural = reuse existing; singular /photo = new upload), which
  // is what makes a wrong bulk-delete recoverable.
  const deleteSelected = () => {
    setRows(rs => rs.filter(r => !selected.has(r.id)));
    setSelected(new Set());
    setConfirmDel(false);
  };

  // PATCH /v1/claim_items (batch) — sets content class on the selection.
  // Depreciation is server-owned, so each row goes pending until it answers.
  const recategorize = (cat) => {
    const ids = [...selected];
    setRows(rs => rs.map(r => selected.has(r.id) ? { ...r, cat, depPending: !r.needs_manual } : r));
    setRecatOpen(false);
    ids.forEach(id => {
      const row = rowsRef.current.find(r => r.id === id);
      if (!row || row.needs_manual) return;
      window.KevinAPI.recalcDepreciation(id, { cat, age: row.age_years ?? row.age, rcv: row.rcv, qty: row.qty }).then(res => {
        setRows(rs => rs.map(r => {
          if (r.id !== id) return r;
          const done = { ...r, depPending: false };
          if (res && typeof res.depreciation_pct === 'number') {
            done.depreciation_pct = res.depreciation_pct;
            for (const k of ['tax', 'rcv_total_incl', 'depreciation_amount', 'acv_total_incl']) if (k in res) done[k] = res[k];
          }
          if (res && res.depMeta) done.depMeta = res.depMeta;
          return done;
        }));
      });
    });
  };

  // NO bulk price endpoint exists (backend-confirmed): pricing N hand-added
  // rows = POST /claim_items/{id}/reprice ONCE PER ROW, sharing the /process
  // 30/min rate limit — hence sequential pacing below. Keys off each row's
  // DESCRIPTION, so a row still blank is skipped: nothing to search on, and
  // guessing from a photo is not
  // something the aggregator does.
  const [pricing, setPricing] = React.useState(false);
  const priceable = [...selected]
    .map(id => rows.find(r => r.id === id))
    .filter(r => r && r.valuation_basis === 'manual' && (r.desc || '').trim());
  const priceSelected = () => {
    if (!priceable.length) return;
    setPricing(true);
    const ids = priceable.map(r => r.id);
    setRows(rs => rs.map(r => ids.includes(r.id) ? { ...r, pricePending: true } : r));
    (async () => {
      for (const r of priceable) {
        // Sequential, one reprice at a time — shares the /process 30/min limit,
        // so a parallel burst on a big selection would 429 partway. Production
        // also honors 429 Retry-After between calls.
        const composed = [r.mfr, r.model, r.desc].filter(Boolean).join(' ');
        const query = composed.length > 200 ? composed.slice(0, 200).replace(/\s+\S*$/, '') : composed;
        const res = await window.KevinAPI.reprice(r.id, { query, category: r.cat, make_mfr: r.mfr, model_number: r.model, description: r.desc });
        setRows(rs => rs.map((x) => x.id === r.id
          ? { ...x, rcv: res.rcv, alternative_sources: res.alternative_sources,
              compsFetchedAt: res.fetchedAt, sourceLink: null,
              tax: res.tax, rcv_total_incl: res.rcv_total_incl, depreciation_amount: res.depreciation_amount, acv_total_incl: res.acv_total_incl,
              pricePending: false, _depFlash: Date.now() }
          : x));
      }
      setPricing(false);
      setSelected(new Set());
    })();
  };

  // Append a blank row (Excel-style). Returns the new id.
  // Mock-only: expose current rows so KevinAPI.reprice can recompute line
  // totals off real qty/pct, as the server would. Not a production pattern.
  React.useEffect(() => { window.__liveRows = rows; }, [rows]);

  const addRow = () => {
    const id = nextId.current++;
    setRows(rs => [...rs, {
      id, room: '', qty: 1, desc: '', mfr: '', model: '', cat: 'Decor & Accessories',
      age: 1, dep: 0, rcv: null, conf: 'low', barcode: false, _photoIdx: id,
      rcv_total_incl: null, tax: null, depreciation_amount: null, acv_total_incl: null,
      special_limits: false, valuation_basis: 'manual', substitution_note: null,
      needs_manual: false, manual_reason: null, overridden: false, depManual: true,
    }]);
    return id;
  };

  // Jump to the bottom and focus the new row's first input.
  const focusNewRow = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      setScrollTop(el.scrollTop);
      requestAnimationFrame(() => {
        const rowEls = el.querySelectorAll('.k-row');
        const last = rowEls[rowEls.length - 1];
        last?.querySelector('input')?.focus();
      });
    });
  };

  // Enter on the last row → append a blank row (no mouse needed).
  const onGridKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || groupBy) return;
    const rowEl = e.target.closest('.k-row');
    if (!rowEl) return;
    const all = [...scrollRef.current.querySelectorAll('.k-row')];
    if (all.indexOf(rowEl) !== all.length - 1) return;
    e.preventDefault();
    addRow();
    focusNewRow();
  };

  const updateRow = (id, patch) => {
    setRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      const depEdit = ('dep' in patch) || ('depreciation_pct' in patch);
      const schedEdit = ('cat' in patch) || ('age' in patch) || ('age_years' in patch);
      if (depEdit && !schedEdit) {
        next.depManual = true;
      } else if ('depreciation_method' in patch) {
        // Explicit release of a manual override — back to the class table.
        next.depManual = false; next.depPending = true;
      } else if (schedEdit && !next.depManual && !next.needs_manual) {
        next.depPending = true;
      }
      return next;
    }));
    // Release: PATCH …/override { depreciation_method } — the ONLY thing that
    // clears a manual lock; the server re-derives from the class table.
    if ('depreciation_method' in patch) {
      const cur = rowsRef.current.find(r => r.id === id) || {};
      window.KevinAPI.recalcDepreciation(id, { cat: cur.cat, age: cur.age_years ?? cur.age, rcv: cur.rcv, qty: cur.qty, method: patch.depreciation_method, needs_manual: cur.needs_manual }).then((res) => {
        setRows(rs => rs.map(r => {
          if (r.id !== id) return r;
          const done = { ...r, depPending: false, depManual: false };
          if (res && typeof res.depreciation_pct === 'number') {
            done.depreciation_pct = res.depreciation_pct; done._depFlash = Date.now();
            for (const k of ['tax', 'rcv_total_incl', 'depreciation_amount', 'acv_total_incl']) if (k in res) done[k] = res[k];
          }
          if (res && res.depMeta) done.depMeta = res.depMeta;
          return done;
        }));
      });
    }
    // Manual depreciation override — condition-based judgment call: age and
    // schedule stay intact, the adjuster sets the rate. ONE server path:
    // PATCH /v1/claim_items/{row_id}/override { dep_manual: 0.55 } — a FRACTION
    // (55 = 5500% = 422). Sets method "custom" server-side; the lock persists
    // across later age/class/RCV edits (80f8831). The server recomputes all
    // four line totals; the UI applies them verbatim — no client arithmetic,
    // including the Depr $ preview. Release is explicit via depreciation_method
    // (see the popover's "Use the schedule" action), never a null rate.
    if (('dep' in patch || 'depreciation_pct' in patch) && !('cat' in patch) && !('age' in patch) && !('age_years' in patch)) {
      const cur = rowsRef.current.find(r => r.id === id) || {};
      const pct = 'depreciation_pct' in patch ? patch.depreciation_pct : (parseFloat(patch.dep) || 0) / 100;
      window.KevinAPI.overrideDep(id, { dep_manual: pct, rcv: cur.rcv, qty: cur.qty }).then((m) => {
        setRows(rs => rs.map(r => r.id === id ? { ...r, ...m, depManual: true, _depFlash: Date.now() } : r));
      });
    }
    if ('rcv' in patch && !('rcv_total_incl' in patch)) {
      // Contract: {rcv} alone → server recomputes ACV + four line totals and
      // returns them; the UI applies verbatim. (An explicit ACV edit would send
      // both and the server stores them as typed — no client ACV math ever.)
      const cur = rowsRef.current.find(r => r.id === id) || {};
      window.KevinAPI.updateMoney(id, { rcv: patch.rcv, qty: cur.qty, depreciation_pct: cur.depreciation_pct ?? (cur.dep != null ? cur.dep / 100 : null) }).then((m) => {
        setRows(rs => rs.map(r => r.id === id ? { ...r, ...m } : r));
      });
    }
    if (('cat' in patch || 'age' in patch || 'age_years' in patch) && !('dep' in patch) && !('depreciation_pct' in patch)) {
      // POST /claim_items/:id → server returns the authoritative depr %.
      // Send the item's full post-edit class+age; the server owns the math.
      const cur = rowsRef.current.find(r => r.id === id) || {};
      // Sequence guard: each recalc stamps a seq; a response only applies if it is
      // still the LATEST request for the row. The old `!r.depPending` check
      // silently dropped responses whenever another edit rebuilt the row
      // mid-flight — the "age typed, % never populated" transient.
      const seq = (window.__depSeq = (window.__depSeq || 0) + 1);
      const skipRecalc = cur.depManual || cur.needs_manual;
      if (!skipRecalc) setRows(rs => rs.map(r => r.id === id ? { ...r, depPending: true, _depSeq: seq } : r));
      if (!skipRecalc) window.KevinAPI.recalcDepreciation(id, { cat: patch.cat ?? cur.cat, age: patch.age_years ?? patch.age ?? cur.age_years ?? cur.age, rcv: cur.rcv, qty: cur.qty, needs_manual: cur.needs_manual }).then((res) => {
        setRows(rs => rs.map(r => {
          if (r.id !== id || r._depSeq !== seq) return r;
          const done = { ...r, depPending: false };
          if (res && typeof res.depreciation_pct === 'number') {
            done.depreciation_pct = res.depreciation_pct;
            done._depFlash = Date.now();
            for (const k of ['tax', 'rcv_total_incl', 'depreciation_amount', 'acv_total_incl']) if (k in res) done[k] = res[k];
          }
          if (res && res.depMeta) done.depMeta = res.depMeta;
          return done;
        }));
      });
    }
  };

  const totals = React.useMemo(() => rows.reduce((acc, r) => {
    const { subtotal, dep, tax, acv } = lineTotals(r);
    acc.rcv += subtotal; acc.tax += tax; acc.acv += acv; acc.dep += dep;
    return acc;
  }, { rcv: 0, tax: 0, acv: 0, dep: 0 }), [rows]);

  const specialCount = rows.filter(r => r.special_limits).length;
  const barcodeCount = rows.filter(r => r.barcode).length;

  return (
    <div className="k-worksheet">
      {/* — Top chrome — */}
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="Review" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge tone="ok" dot={true}>Processing complete · 57 items · 2m 41s</Badge>
          <a className="k-btn k-btn--ghost" href="03-Intake.html?claim=CLM-2026-04412" title="Drop another batch into this claim — new items append below, existing line numbers never change"><Icon d={I.plus} size={12} /> Add photos</a>
          <a className="k-btn" href="06-Export-modal.html"><Icon d={I.download} size={12} /> Export claim</a>
          <window.AvatarMenu />
        </div>
      </header>

      {/* — Claim header + totals — */}
      <window.ClaimTabs active="Worksheet" sample={sample} />
      <section className="k-claim-hd">
        <div>
          <a href="12-Claim-overview.html" className="k-crumb" title="Back to the claim overview">
            <Icon d={I.chevleft} size={12} /> Claim overview
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>Godfrey — Kitchen fire</h1>
            <Badge tone="quiet">In review</Badge>
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 7, fontSize: 12, color: 'var(--k-fg-3)' }}>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Claim</strong> · <span style={{ fontFamily: 'var(--k-font-mono)' }}>CLM-2026-04412</span></span>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Date of loss</strong> · Apr 18, 2026</span>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Loss address</strong> · 123 Main St., Smithtown, NY 11787</span>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Tax</strong> · {(taxRate() * 100).toFixed(2).replace(/\.?0+$/, '')}%</span>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Carrier</strong> · Allstate</span>
          </div>
        </div>
        <div className="k-totals">
          <div><div className="k-tot-l">Items</div><div className="k-tot-v">{rows.length}</div></div>
          <div><div className="k-tot-l">RCV</div><div className="k-tot-v">{fmtUSD(totals.rcv)}</div></div>
          <div><div className="k-tot-l">Depreciation</div><div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>{totals.dep > 0 ? '−' + fmtUSD(totals.dep) : fmtUSD(0)}</div></div>
          <div><div className="k-tot-l">Tax</div><div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>{fmtUSD(totals.tax)}</div></div>
          <div><div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>ACV total</div><div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>{fmtUSD(totals.acv)}</div></div>
        </div>
      </section>

      {/* — Toolbar — */}
      <section className="k-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="k-search">
            <Icon d={I.search} size={12} />
            <input placeholder={`Search ${rows.length} items…`} value={search} onChange={(e) => setSearch(e.target.value)} />
            <kbd>⌘K</kbd>
          </div>
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button className={`k-btn k-btn--ghost ${filterCount > 0 ? 'k-btn--active' : ''}`} onClick={() => setFilterOpen(o => !o)}>
              <Icon d={I.filter} size={12} /> Filter
              {filterCount > 0 && <span className="k-filter-count">{filterCount}</span>}
            </button>
            {filterOpen && (
              <div className="k-pop" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 240, zIndex: 30 }}>
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--k-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  <span>Filter rows</span>
                  {filterCount > 0 && <button className="k-link" onClick={clearFilters} style={{ fontSize: 11 }}>Clear</button>}
                </div>
                <div style={{ padding: 6 }}>
                  <div style={{ padding: '6px 8px 4px', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Room / Area</div>
                  <input
                    type="text"
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    placeholder="Type a room…"
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--k-line)', borderRadius: 5, font: 'inherit', fontSize: 12.5, background: 'var(--k-bg)', marginBottom: 6, outline: 'none' }}
                  />
                  <div style={{ padding: '8px 0 4px', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderTop: '1px solid var(--k-line)' }}>Attributes</div>
                  {[
                    ['barcode',   'Barcoded items only',     rows.filter(r => r.barcode).length],
                    ['sl',        'Special limits only',     rows.filter(r => r.special_limits).length],
                    ['lowConf',   'Low confidence only',     rows.filter(r => r.conf === 'low').length],
                    ['highValue', 'High value · ≥ $1,000',   rows.filter(r => (r.rcv ?? 0) * r.qty >= 1000).length],
                  ].map(([k, l, n]) => (
                    <label key={k} className="k-menu-item" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`k-toggle-box ${filters[k] ? 'k-toggle-box--on' : ''}`}>
                          {filters[k] && <Icon d={I.check} size={9} stroke={2.5} />}
                        </span>
                        <input type="checkbox" checked={filters[k]} onChange={(e) => setFilters({ ...filters, [k]: e.target.checked })} style={{ display: 'none' }} />
                        <span>{l}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {(window.CLAIM_SESSIONS || []).length > 1 && (
            <div className="k-fselect" style={{ width: 176 }} title="Filtering changes what you see — an export always covers the whole claim">
              <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                <option value="all">All batches</option>
                {window.CLAIM_SESSIONS.map((s, i) => (
                  <option key={s.id} value={s.id}>Batch {i + 1} · {s.items} items</option>
                ))}
              </select>
              <Icon d={I.chevdown} size={11} />
            </div>
          )}
          <button className={`k-btn k-btn--ghost ${groupBy ? 'k-btn--active' : ''}`} onClick={() => setGroupBy(g => !g)}>
            {groupBy ? <><Icon d={I.check} size={12} stroke={2.5}/> Grouped by class</> : 'Group by class'}
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--k-line)', margin: '0 4px' }} />
          <Badge tone="ok" dot={true}>{barcodeCount} barcodes matched</Badge>
          <Badge tone="warn" dot={true}>{specialCount} special-limits items</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)', marginRight: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>{selected.size} selected</span>
              {priceable.length > 0 && (
                <button className="k-btn" onClick={priceSelected} disabled={pricing} title="Look up pricing for the hand-added items in this selection">
                  <Icon d={I.search} size={12} /> {pricing ? 'Pricing…' : `Price ${priceable.length}`}
                </button>
              )}
              <div ref={recatRef} style={{ position: 'relative' }}>
                <button className="k-btn k-btn--ghost" onClick={() => setRecatOpen(o => !o)}>Re-categorize <Icon d={I.chevdown} size={11} /></button>
                {recatOpen && (
                  <div className="k-pop" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, width: 230, zIndex: 40 }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--k-line)', fontSize: 11, color: 'var(--k-fg-4)' }}>
                      Set content class on {selected.size} item{selected.size === 1 ? '' : 's'}
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto', padding: 4 }}>
                      {PCS_CATEGORIES.map(c => (
                        <button key={c} className="k-menu-item" onClick={() => recategorize(c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button className="k-btn k-btn--ghost k-btn--danger" onClick={() => setConfirmDel(true)}><Icon d={I.trash} size={12} /> Delete</button>
                {confirmDel && (
                  <div className="k-pop" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, width: 250, zIndex: 40, padding: 12 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--k-fg-2)', lineHeight: 1.5, marginBottom: 10 }}>
                      Delete {selected.size} item{selected.size === 1 ? '' : 's'} from this inventory? The source photos stay on the claim.
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
                      <button className="k-btn k-btn--sm k-btn--danger" onClick={deleteSelected}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ width: 1, height: 18, background: 'var(--k-line)', margin: '0 4px' }} />
            </>
          )}
          <button
            className={`k-btn k-btn--ghost ${docked ? 'k-btn--on' : ''}`}
            onClick={() => {
              if (docked) { setDocked(false); setLightbox(null); return; }
              if (!lightbox) setLightbox(filtered[0] || rows[0]);
              setDocked(true);
            }}
            title={docked ? 'Close the item panel' : 'Open the item panel beside the grid — click any row to inspect it'}>
            <Icon d={I.pin} size={12} /> {docked ? 'Close panel' : 'Item panel'}
          </button>
          <button className="k-btn" onClick={() => { addRow(); focusNewRow(); }} title="Or press Enter on the last row"><Icon d={I.plus} size={12} /> Add item</button>
        </div>
      </section>

      {/* — Grid + docked inspector — */}
      {deferred.length > 0 && (
        <div className="k-deferbar">
          <span className="k-paused-dot" />
          <span>
            <strong>{deferred.length} {deferred.length === 1 ? 'item is' : 'items are'} waiting on pricing capacity.</strong>{' '}
            They'll price themselves when the limit resets — nothing for you to enter.
          </span>
          <div style={{ flex: 1 }} />
          <button className="k-btn k-btn--sm" onClick={retryDeferred} disabled={retrying}>
            {retrying ? 'Retrying…' : `Retry ${deferred.length} deferred`}
          </button>
        </div>
      )}
      <div className={docked ? 'k-grid-dock' : 'k-grid-dock k-grid-dock--off'}>
      <section className="k-grid" style={{ '--row-cols': gridTemplate, '--k-sbw': sbW + 'px', '--k-gridw': gridMinW + 'px' }}>
        <div className="k-row k-row--head">
          {HEADERS.map(([cls, label], i) => (
            <div key={cls} className={`k-c ${cls}`}>
              {label}
              {i < HEADERS.length - 1 && (
                <span
                  className="k-col-resize"
                  onMouseDown={(e) => startResize(i, e)}
                  onDoubleClick={(e) => { e.stopPropagation(); setCols(prev => prev.map((c, j) => j === i ? COL_DEFAULTS[i] : c)); }}
                  title="Drag to resize · double-click to reset"
                />
              )}
            </div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="k-ws-empty">
            <div className="k-empty-art k-empty-art--accent"><Icon d={rows.length ? I.search : I.camera} size={24} /></div>
            {rows.length === 0 ? (
              <React.Fragment>
                <div className="k-ws-empty-t">No items on this claim yet</div>
                <p className="k-ws-empty-d">
                  Items appear here once Kevin has read your photos, or as soon as you import a written inventory. You can also type one in by hand.
                </p>
                <div className="k-ws-empty-acts">
                  <a className="k-btn k-btn--lg" href="03-Intake.html?claim=CLM-2026-04412"><Icon d={I.upload} size={13} /> Add photos</a>
                  <a className="k-btn k-btn--ghost k-btn--lg" href="75-Written-import.html"><Icon d={I.file} size={13} /> Import a list</a>
                  <button className="k-btn k-btn--ghost k-btn--lg" onClick={() => { addRow(); focusNewRow(); }}><Icon d={I.plus} size={13} /> Add an item</button>
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className="k-ws-empty-t">No items match</div>
                <p className="k-ws-empty-d">
                  {rows.length} {rows.length === 1 ? 'item is' : 'items are'} on this claim — none of them match what you're filtering for.
                </p>
                <div className="k-ws-empty-acts">
                  <button className="k-btn" onClick={() => { setSearch(''); setRoomFilter(''); setSessionFilter('all'); setFilters({ barcode: false, special: false, lowconf: false, highvalue: false }); }}>Clear filters</button>
                </div>
              </React.Fragment>
            )}
          </div>
        ) : (
        <div ref={scrollRef} className="k-scroll" onScroll={(e) => setScrollTop(e.target.scrollTop)} onKeyDown={onGridKeyDown}>
          {groupBy ? (
            <div>
              {(() => {
                const byCat = new Map();
                filtered.forEach(r => { if (!byCat.has(r.cat)) byCat.set(r.cat, []); byCat.get(r.cat).push(r); });
                const groups = [...byCat.entries()].sort((a, b) => PCS_CATEGORIES.indexOf(a[0]) - PCS_CATEGORIES.indexOf(b[0]));
                let globalIdx = -1;
                return groups.map(([cat, items]) => {
                  const sum = items.reduce((a, r) => {
                    const { subtotal, acv } = lineTotals(r);
                    a.rcv += subtotal; a.acv += acv;
                    return a;
                  }, { rcv: 0, acv: 0 });
                  return (
                    <React.Fragment key={cat}>
                      <div className="k-grp-inline">
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{cat}</span>
                        <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{items.length} items</span>
                        {items.some(r => r.special_limits) && <Badge tone="warn">Special limits</Badge>}
                        <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{fmtUSDshort(sum.acv)} ACV</span>
                      </div>
                      {items.map(r => {
                        globalIdx++;
                        return (
                          <Row key={r.id} row={r} idx={globalIdx} density={density}
                               selected={selected.has(r.id)}
                               onSelect={() => toggleSel(r.id)}
                               onUpdate={(patch) => updateRow(r.id, patch)}
                               active={docked && lightbox && lightbox.id === r.id}
                               onRowClick={docked ? () => setLightbox(r) : null}
                               onLightbox={() => setLightbox(r)} />
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          ) : (
            <div style={{ height: totalH, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${padTop}px)` }}>
                {visible.map((r, i) => (
                  <Row key={r.id} row={r} idx={startIdx + i} density={density}
                       active={flashRow === r.id || (docked && lightbox && lightbox.id === r.id)}
                       selected={selected.has(r.id)}
                       onSelect={() => toggleSel(r.id)}
                       onUpdate={(patch) => updateRow(r.id, patch)}
                       onRowClick={docked ? () => setLightbox(r) : null}
                       onLightbox={() => setLightbox(r)} />
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </section>
      {docked && lightbox && (() => {
        const i = filtered.findIndex(r => r.id === lightbox.id);
        const cur = i < 0 ? null : filtered[i];
        if (!cur) return null;
        return (
          <Lightbox key={cur.id} row={cur} index={i} total={filtered.length} docked={true}
            onToggleDock={() => setDocked(false)}
            onNav={(d) => { const n = filtered[i + d]; if (n) setLightbox(n); }}
            onUpdate={(patch) => { updateRow(cur.id, patch); setLightbox({ ...cur, ...patch }); }}
            onClose={() => { setLightbox(null); setDocked(false); }} />
        );
      })()}
      </div>

      {/* — Footer — */}
      <footer className="k-footer">
        <span>
          Showing <strong style={{ color: 'var(--k-fg-2)' }}>{filtered.length}</strong> of {rows.length} items
          · Rendered {visible.length} rows (window {startIdx}–{endIdx})
          · Auto-saved 2s ago
        </span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--k-fg-4)' }}>↑ ↓ navigate · ⏎ edit</span>
        </span>
      </footer>

      {lightbox && !docked && (() => {
        const lbIdx = filtered.findIndex(r => r.id === lightbox.id);
        if (lbIdx < 0) return null;
        const cur = filtered[lbIdx];
        return (
          <Lightbox
            row={cur}
            index={lbIdx}
            total={filtered.length}
            docked={false}
            onToggleDock={() => setDocked(true)}
            onNav={(d) => { const n = filtered[lbIdx + d]; if (n) setLightbox(n); }}
            onUpdate={(patch) => { updateRow(cur.id, patch); setLightbox({ ...cur, ...patch }); }}
            onClose={() => setLightbox(null)} />
        );
      })()}
    </div>
  );
};

window.Worksheet = Worksheet;
// Expose primitives so worksheet variants can reuse them
Object.assign(window, { TextCell, CategoryCell, RCVCell, RCVPopover, SourceLinkCell, Lightbox, Row, lineTotals, HEADERS, PolicyLimitMeter });
