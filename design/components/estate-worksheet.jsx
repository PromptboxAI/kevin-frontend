// Estate-liquidator worksheet — the estate-flavored counterpart to the insurance grid.
// Marketed on the For-Estate-Liquidators page; this is the actual screen behind it.
// For estate-SALE companies (not deceased estates): a final inventory of what an
// estate-sale firm catalogs and what each item sold for.
//   • Fair Market Value (FMV) instead of RCV/ACV/depreciation
//   • Condition grade + Disposition (For sale / Sold / Keep / Donate)
//   • Downloadable PDF inventory for the client

const { KevinWordmark, Icon, I, Badge, fmtUSD, fmtUSDshort } = window;
const { SAMPLE_BASE } = window;

const DISPOSITIONS = ['Unassigned', 'For sale', 'Sold', 'Keep', 'Donate'];
const DISP_TONE = { Unassigned: 'quiet', 'For sale': 'accent', Sold: 'ok', Keep: 'quiet', Donate: 'quiet' };
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

// Build estate rows — reuse SAMPLE_BASE descriptions, swap to FMV economics.
function buildEstateRows(n = 96) {
  const out = [];
  const rooms = window.ROOM_OPTIONS || ['Living room','Master bedroom','Kitchen','Garage'];
  for (let i = 0; i < n; i++) {
    const t = SAMPLE_BASE[i % SAMPLE_BASE.length];
    // Secondary-market value, roughly a fraction of retail. The backend derives
    // this from sold comps; here we seed a plausible figure and build the comps
    // around it so the median matches (see buildFmvSources).
    const fmv = Math.round(t.rcv * (0.25 + (i % 5) * 0.08));
    const fmvSources = window.buildFmvSources(t, fmv);
    out.push({
      id: i + 1,
      room: rooms[i % rooms.length],
      qty: 1,
      desc: t.desc, mfr: t.mfr, cat: t.cat,
      condition: CONDITIONS[i % 4],
      fmv,
      disposition: ['Unassigned','For sale','Sold','Keep','Donate'][i % 5],
      // Realised sale price — only exists once an item is Sold.
      salePrice: (i % 5) === 2 ? Math.round(fmv * (0.70 + (i % 7) * 0.05)) : null,
      // Median of the sold comps — the value the appraiser can defend.
      alternative_sources: fmvSources,
      sourceLink: null,
      mfr: t.mfr, model: t.model, age: 0, qty: 1,
      special_limits: !!t.special_limits, // flag comes from the backend payload, never derived from cat
      _photoIdx: i,
    });
  }
  return out;
}

const EstateRow = React.memo(({ row, idx, selected, onSelect, onUpdate, onOpen, onRowSync, active }) => (
  <div className={`k-erow ${selected ? 'k-erow--sel' : ''} ${row.special_limits ? 'k-row--flag' : ''} ${active ? 'k-row--active' : ''}`}
    onFocusCapture={onRowSync ? (ev) => { if (!ev.target.closest('.k-check')) onRowSync(); } : undefined}
    onClick={onRowSync ? (ev) => { if (!ev.target.closest('input, textarea, select, button, a, .k-pop')) onRowSync(); } : undefined}>
    <div className="k-c k-c--check">
      <button onClick={onSelect} className={`k-check ${selected ? 'k-check--on' : ''}`}>{selected && <Icon d={I.check} size={10} stroke={2} />}</button>
    </div>
    <div className="k-c" style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-4)', fontSize: 10.5, cursor: 'pointer' }} onClick={onOpen} title="View source photo">{String(idx + 1).padStart(4, '0')}</div>
    <div className="k-c"><window.TextCell value={row.room} onChange={(v) => onUpdate({ room: v })} placeholder="Room / area…" /></div>
    <div className="k-c" style={{ alignItems: 'center' }}>
      <window.TextCell value={row.desc} onChange={(v) => onUpdate({ desc: v })} />
    </div>
    <div className="k-c">
      <select value={row.condition} onChange={(e) => onUpdate({ condition: e.target.value })} className="k-disp" style={{ background: 'transparent', color: 'var(--k-fg-3)' }}>
        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
    <div className="k-c k-c--rcv"><window.RCVCellPlain value={row.fmv} onChange={(v) => onUpdate({ fmv: v })} /></div>
    <div className="k-c k-c--rcv">
      {row.disposition === 'Sold'
        ? <window.RCVCellPlain value={row.salePrice == null ? 0 : row.salePrice} onChange={(v) => onUpdate({ salePrice: v })} />
        : <span style={{ width: '100%', textAlign: 'right', color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', fontSize: 11.5 }}>—</span>}
    </div>
    <div className="k-c">
      <select value={row.disposition} onChange={(e) => onUpdate({ disposition: e.target.value })}
        className="k-disp" data-disp={row.disposition}>
        {DISPOSITIONS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
    <div className="k-c k-c--src">
      <window.SourceLinkCell row={row} onUpdate={onUpdate} />
    </div>
  </div>
), (a, b) => a.row === b.row && a.idx === b.idx && a.selected === b.selected && a.active === b.active && !!a.onRowSync === !!b.onRowSync);

// Plain editable currency cell (no RCV popover — estate FMV is hand-set)
const RCVCellPlain = ({ value, onChange }) => {
  const [v, setV] = React.useState(value);
  const [focus, setFocus] = React.useState(false);
  React.useEffect(() => setV(value), [value]);
  return (
    <div className={`k-cell ${focus ? 'k-cell--focus' : ''}`} style={{ justifyContent: 'flex-end' }}>
      <span style={{ color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>$</span>
      <input
        value={focus ? v : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        onFocus={() => { setFocus(true); setV(''); }}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { setFocus(false); const s = String(v).trim(); if (s === '') { setV(value); return; } onChange?.(parseFloat(s.replace(/[^0-9.]/g, '')) || 0); }}
        style={{ font: 'inherit', border: 0, background: 'transparent', outline: 0, textAlign: 'right', width: '100%', fontFamily: 'var(--k-font-mono)', color: 'inherit', fontWeight: 600, fontFeatureSettings: '"tnum"' }}
      />
    </div>
  );
};
window.RCVCellPlain = RCVCellPlain;

const EstateWorksheet = () => {
  const [rows, setRows] = React.useState(() => buildEstateRows(96));
  // Reuse the insurance item drawer (window.Lightbox) rather than a second one —
  // it already handles photo, editable fields, comps and the pin/dock toggle.
  const [drawer, setDrawer] = React.useState(null);
  const [sbW, setSbW] = React.useState(0);
  const [docked, setDocked] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [search, setSearch] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({ room: 'All', status: 'All', condition: 'All', fmvSort: 'None' });
  const filterRef = React.useRef(null);
  const exportRef = React.useRef(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  React.useEffect(() => {
    const close = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    if (exportOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);
  const scrollRef = React.useRef(null);
  // Windowed render — an estate sale can run 500-1,000 items, so only the rows
  // in view (plus overscan) are mounted. Mirrors the insurance worksheet.
  const EROW_H = 42;
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportH, setViewportH] = React.useState(800);
  React.useLayoutEffect(() => {
    const measureH = () => { const el = scrollRef.current; if (el) setViewportH(el.clientHeight); };
    measureH();
    window.addEventListener('resize', measureH);
    return () => window.removeEventListener('resize', measureH);
  }, []);
  React.useLayoutEffect(() => {
    const measure = () => { const el = scrollRef.current; if (el) setSbW(el.offsetWidth - el.clientWidth); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });
  const nextId = React.useRef(97);

  React.useEffect(() => {
    const close = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    if (filterOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [filterOpen]);

  // Functional update — memoized rows hold older closures, so reading `selected`
  // directly would let a stale copy overwrite the set (multi-select silently broke).
  const toggleSel = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const updateRow = (id, patch) => setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  // The shared drawer speaks the insurance row shape — FMV takes the rcv slot so
  // one component renders both economics (see Lightbox mode="estate").
  const toDrawerRow = (r) => ({ ...r, rcv: r.fmv, dep: 0, needs_manual: false, conf: 'high' });
  const applyFromDrawer = (id, patch) => {
    const p = { ...patch };
    if ('rcv' in p) { p.fmv = p.rcv; delete p.rcv; }
    updateRow(id, p);
  };

  // Append a blank row (Excel-style). Returns the new id.
  const addRow = (afterId) => {
    const id = nextId.current++;
    const blank = { id, room: '', qty: 1, desc: '', mfr: '', cat: 'Misc', condition: 'Good', fmv: 0, disposition: 'Unassigned', special_limits: false, _photoIdx: id };
    setRows(rs => {
      if (afterId == null) return [...rs, blank];
      const i = rs.findIndex(r => r.id === afterId);
      return [...rs.slice(0, i + 1), blank, ...rs.slice(i + 1)];
    });
    return id;
  };

  // Enter on the last row → append a blank row and focus its first input.
  // With windowing the DOM holds only visible rows, so "last" comes from the
  // data index rather than the row's position in the DOM.
  const onGridKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const rowEl = e.target.closest('.k-erow');
    if (!rowEl) return;
    const domRows = [...scrollRef.current.querySelectorAll('.k-erow')];
    const dataIdx = startIdx + domRows.indexOf(rowEl);
    if (dataIdx !== filtered.length - 1) return;
    e.preventDefault();
    addRow(null);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
      const erows = scrollRef.current.querySelectorAll('.k-erow');
      const last = erows[erows.length - 1];
      const firstInput = last && last.querySelector('input');
      if (firstInput) firstInput.focus();
    });
  };

  const roomList = React.useMemo(() => [...new Set(rows.map(r => r.room).filter(Boolean))].sort(), [rows]);

  const filtered = React.useMemo(() => {
    let out = rows.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!(r.desc.toLowerCase().includes(q) || (r.room || '').toLowerCase().includes(q) || (r.cat || '').toLowerCase().includes(q))) return false;
      }
      if (filters.room !== 'All' && r.room !== filters.room) return false;
      if (filters.status !== 'All' && r.disposition !== filters.status) return false;
      if (filters.condition !== 'All' && r.condition !== filters.condition) return false;
      return true;
    });
    if (filters.fmvSort === 'High to low') out = [...out].sort((a, b) => b.fmv - a.fmv);
    if (filters.fmvSort === 'Low to high') out = [...out].sort((a, b) => a.fmv - b.fmv);
    return out;
  }, [rows, search, filters]);

  const filterCount = (filters.room !== 'All' ? 1 : 0) + (filters.status !== 'All' ? 1 : 0) + (filters.condition !== 'All' ? 1 : 0) + (filters.fmvSort !== 'None' ? 1 : 0);

  const EROW_OVERSCAN = 8;
  const startIdx = Math.max(0, Math.floor(scrollTop / EROW_H) - EROW_OVERSCAN);
  const endIdx = Math.min(filtered.length, Math.ceil((scrollTop + viewportH) / EROW_H) + EROW_OVERSCAN);

  const total = rows.reduce((a, r) => a + r.fmv, 0);
  const soldRows = rows.filter((r) => r.disposition === 'Sold');
  const realised = soldRows.reduce((a, r) => a + (r.salePrice || 0), 0);
  const soldFmv  = soldRows.reduce((a, r) => a + r.fmv, 0);
  const variance = soldFmv ? Math.round(((realised - soldFmv) / soldFmv) * 100) : 0;
  const byDisp = DISPOSITIONS.reduce((acc, d) => { acc[d] = rows.filter(r => r.disposition === d).reduce((s, r) => s + r.fmv, 0); return acc; }, {});
  const unassigned = rows.filter(r => r.disposition === 'Unassigned').length;

  return (
    <div className="k-worksheet">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Estate sale mode</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone="ok" dot={true}>Processed · {rows.length} items</Badge>
          <div ref={exportRef} style={{ position: 'relative' }}>
            <button className="k-btn" onClick={() => setExportOpen(o => !o)}><Icon d={I.download} size={12}/> Export inventory <Icon d={I.chevdown} size={11} /></button>
            {exportOpen && (
              <div className="k-pop" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 268, zIndex: 60, padding: 4 }}>
                <a className="k-menu-item" href="74-PDF-inventory.html" onClick={() => setExportOpen(false)}>
                  <Icon d={I.printer} size={13} />
                  <span style={{ flex: 1 }}>PDF inventory<span className="k-menu-sub">Client-ready · print or save</span></span>
                </a>
                <button className="k-menu-item" onClick={() => setExportOpen(false)}>
                  <Icon d={I.zip} size={13} />
                  <span style={{ flex: 1 }}>Excel · .xlsx<span className="k-menu-sub">Editable spreadsheet</span></span>
                </button>
                <button className="k-menu-item" onClick={() => setExportOpen(false)}>
                  <Icon d={I.zip} size={13} />
                  <span style={{ flex: 1 }}>CSV · .csv<span className="k-menu-sub">Plain data for any tool</span></span>
                </button>
              </div>
            )}
          </div>
          <window.AvatarMenu />
        </div>
      </header>

      {/* Claim header + disposition totals */}
      <section className="k-claim-hd">
        <div>
          <a href="01-My-claims.html" className="k-crumb" title="Back to all estates"><Icon d={I.chevleft} size={12} /> All estates</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>Estate of W. Holt</h1>
            <Badge tone="quiet">In review</Badge>
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 7, fontSize: 12, color: 'var(--k-fg-3)' }}>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Client</strong> · Holt estate sale</span>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Address</strong> · San Antonio TX</span>
            <span><strong style={{ color: 'var(--k-fg-2)' }}>Valuation basis</strong> · Fair market value</span>
          </div>
        </div>
        <div className="k-totals">
          <div><div className="k-tot-l">Items</div><div className="k-tot-v">{rows.length}</div></div>
          <div><div className="k-tot-l">For sale</div><div className="k-tot-v">{fmtUSDshort(byDisp['For sale'])}</div></div>
          <div><div className="k-tot-l">Sold · FMV</div><div className="k-tot-v">{fmtUSDshort(byDisp.Sold)}</div></div>
          <div><div className="k-tot-l">Keep / Donate</div><div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>{fmtUSDshort(byDisp.Keep + byDisp.Donate)}</div></div>
          <div><div className="k-tot-l">Unassigned</div><div className="k-tot-v" style={{ color: 'var(--k-fg-4)' }}>{fmtUSDshort(byDisp.Unassigned)}</div></div>
          <div><div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>FMV total</div><div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>{fmtUSDshort(total)}</div></div>
          <div style={{ borderLeft: '1px solid var(--k-line)', paddingLeft: 18 }}><div className="k-tot-l">Realised</div><div className="k-tot-v" style={{ color: 'var(--k-ok)' }}>{fmtUSDshort(realised)}<span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontWeight: 400, marginLeft: 5 }}>{variance >= 0 ? '+' : ''}{variance}% vs FMV</span></div></div>
        </div>
      </section>

      <section className="k-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="k-search"><Icon d={I.search} size={12} /><input placeholder={`Search ${rows.length} items…`} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button className={`k-btn k-btn--ghost ${filterCount ? 'k-btn--active' : ''}`} onClick={() => setFilterOpen(o => !o)}>
              <Icon d={I.filter} size={12} /> Filter{filterCount > 0 && <span className="k-filter-count">{filterCount}</span>}
            </button>
            {filterOpen && (
              <div className="k-pop" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 230, zIndex: 30 }}>
                <div style={{ padding: '6px 8px 4px', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Room / Area</div>
                <select value={filters.room} onChange={(e) => setFilters({ ...filters, room: e.target.value })} style={{ width: 'calc(100% - 12px)', margin: '0 6px 8px', padding: '6px 8px', border: '1px solid var(--k-line)', borderRadius: 5, font: 'inherit', fontSize: 12.5, background: 'var(--k-bg)' }}>
                  {['All', ...roomList].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div style={{ padding: '6px 8px 4px', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderTop: '1px solid var(--k-line)' }}>Condition</div>
                <select value={filters.condition} onChange={(e) => setFilters({ ...filters, condition: e.target.value })} style={{ width: 'calc(100% - 12px)', margin: '0 6px 8px', padding: '6px 8px', border: '1px solid var(--k-line)', borderRadius: 5, font: 'inherit', fontSize: 12.5, background: 'var(--k-bg)' }}>
                  {['All', ...CONDITIONS].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ padding: '6px 8px 4px', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderTop: '1px solid var(--k-line)' }}>Fair market value</div>
                <select value={filters.fmvSort} onChange={(e) => setFilters({ ...filters, fmvSort: e.target.value })} style={{ width: 'calc(100% - 12px)', margin: '0 6px 8px', padding: '6px 8px', border: '1px solid var(--k-line)', borderRadius: 5, font: 'inherit', fontSize: 12.5, background: 'var(--k-bg)' }}>
                  {['None', 'High to low', 'Low to high'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ padding: '6px 8px 4px', fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderTop: '1px solid var(--k-line)' }}>Status</div>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ width: 'calc(100% - 12px)', margin: '0 6px 8px', padding: '6px 8px', border: '1px solid var(--k-line)', borderRadius: 5, font: 'inherit', fontSize: 12.5, background: 'var(--k-bg)' }}>
                  {['All', ...DISPOSITIONS].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {filterCount > 0 && <div style={{ padding: '6px 8px', borderTop: '1px solid var(--k-line)' }}><button className="k-link" onClick={() => setFilters({ room: 'All', status: 'All', condition: 'All', fmvSort: 'None' })}>Clear filters</button></div>}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 18, background: 'var(--k-line)', margin: '0 4px' }} />
          {unassigned > 0 && <Badge tone="warn" dot={true}>{unassigned} unassigned</Badge>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)', marginRight: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>{selected.size} selected</span>
              <button className="k-btn k-btn--ghost k-btn--danger" onClick={() => { setRows(rs => rs.filter(r => !selected.has(r.id))); setSelected(new Set()); }}><Icon d={I.trash} size={12} /> Delete</button>
              <div style={{ width: 1, height: 18, background: 'var(--k-line)', margin: '0 4px' }} />
            </>
          )}
          <button className={`k-btn k-btn--ghost ${docked ? 'k-btn--active' : ''}`} onClick={() => { if (docked) { setDocked(false); setDrawer(null); } else { setDrawer(drawer || filtered[0]); setDocked(true); } }} title={docked ? 'Close the item panel' : 'Open the item panel beside the grid — click any row to inspect it'}><Icon d={I.pin} size={12} /> {docked ? 'Close panel' : 'Item panel'}</button>
          <button className="k-btn" onClick={() => { const id = addRow(null); requestAnimationFrame(() => { const er = scrollRef.current.querySelectorAll('.k-erow'); const last = er[er.length - 1]; const inp = last && last.querySelector('input'); if (inp) inp.focus(); }); }}><Icon d={I.plus} size={12}/> Add item</button>
        </div>
      </section>

      <div className={docked ? 'k-grid-dock' : 'k-grid-dock k-grid-dock--off'}>
      <section className="k-grid" style={{ '--k-gridw': '996px', '--k-sbw': sbW + 'px' }}>
        <div className="k-erow k-erow--head">
          <div className="k-c k-c--check"></div>
          <div className="k-c">#</div>
          <div className="k-c">Room / Area</div>
          <div className="k-c">Description</div>
          <div className="k-c">Condition</div>
          <div className="k-c" style={{ justifyContent: 'flex-end' }}>Fair market value</div>
          <div className="k-c" style={{ justifyContent: 'flex-end' }}>Sale price</div>
          <div className="k-c">Status</div>
          <div className="k-c" style={{ justifyContent: 'center' }}>Link</div>
        </div>
        <div className="k-scroll" ref={scrollRef} onKeyDown={onGridKeyDown} onScroll={(e) => setScrollTop(e.target.scrollTop)}>
          <div style={{ height: filtered.length * EROW_H, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${startIdx * EROW_H}px)` }}>
              {filtered.slice(startIdx, endIdx).map((r, i) => (
                <EstateRow key={r.id} row={r} idx={startIdx + i} selected={selected.has(r.id)} onSelect={() => toggleSel(r.id)} onUpdate={(p) => updateRow(r.id, p)}
                  active={docked && drawer && drawer.id === r.id}
                  onRowSync={docked ? () => setDrawer(r) : null}
                  onOpen={() => setDrawer(r)} />
              ))}
            </div>
          </div>
          <button className="k-erow-add" onClick={() => { const id = addRow(null); requestAnimationFrame(() => { const el = scrollRef.current; el.scrollTop = el.scrollHeight; const er = el.querySelectorAll('.k-erow'); const last = er[er.length - 1]; const inp = last && last.querySelector('input'); if (inp) inp.focus(); }); }}>
            <Icon d={I.plus} size={12} /> Add item · or press Enter on the last row
          </button>
        </div>
      </section>
      {docked && drawer && (() => {
        const i = filtered.findIndex(r => r.id === drawer.id);
        if (i < 0) return null;
        const cur = filtered[i];
        return (
          <window.Lightbox key={cur.id} mode="estate" docked={true} row={toDrawerRow(cur)} index={i} total={filtered.length}
            onToggleDock={() => setDocked(false)}
            onNav={(d) => { const n = filtered[i + d]; if (n) setDrawer(n); }}
            onUpdate={(p) => { applyFromDrawer(cur.id, p); setDrawer({ ...cur, ...p }); }}
            onClose={() => { setDrawer(null); setDocked(false); }} />
        );
      })()}
      </div>

      <footer className="k-footer">
        <span>Showing {filtered.length} of {rows.length} · {unassigned} unassigned · FMV {fmtUSD(total)}</span>
      </footer>
      {drawer && !docked && (() => {
        const i = filtered.findIndex(r => r.id === drawer.id);
        if (i < 0) return null;
        const cur = filtered[i];
        return (
          <window.Lightbox key={cur.id} mode="estate" docked={false} row={toDrawerRow(cur)} index={i} total={filtered.length}
            onToggleDock={() => setDocked(true)}
            onNav={(d) => { const n = filtered[i + d]; if (n) setDrawer(n); }}
            onUpdate={(p) => { applyFromDrawer(cur.id, p); setDrawer({ ...cur, ...p }); }}
            onClose={() => setDrawer(null)} />
        );
      })()}
    </div>
  );
};

window.EstateWorksheet = EstateWorksheet;
