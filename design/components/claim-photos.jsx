// Photos tab on a single claim — gallery of all uploaded photos with filters
// and per-photo item-match context.

const { KevinWordmark, Icon, I, Thumb, Badge } = window;

// ~24 photos for the gallery, with varying room/status/confidence/match info
const PHOTO_DATA = [
  { id: 1,  room: 'Kitchen',        items: 1, primary: 'Wolf 36" gas range', status: 'matched', conf: 'high', flags: [] },
  { id: 2,  room: 'Kitchen',        items: 1, primary: 'GE refrigerator',     status: 'matched', conf: 'high', flags: ['barcode'] },
  { id: 3,  room: 'Kitchen',        items: 1, primary: 'KitchenAid mixer',    status: 'matched', conf: 'high', flags: ['barcode'] },
  { id: 4,  room: 'Kitchen',        items: 1, primary: 'Le Creuset dutch oven', status: 'matched', conf: 'med',  flags: [] },
  { id: 5,  room: 'Pantry',         items: 0, primary: '— pantry shelving (context)', status: 'context', conf: 'low',  flags: ['context'] },
  { id: 6,  room: 'Living room',    items: 1, primary: 'Sony 55" OLED TV',    status: 'matched', conf: 'high', flags: ['barcode'] },
  { id: 7,  room: 'Living room',    items: 1, primary: 'Sonos Arc soundbar',  status: 'matched', conf: 'high', flags: ['barcode'] },
  { id: 8,  room: 'Living room',    items: 1, primary: 'Sectional sofa',      status: 'matched', conf: 'med',  flags: [] },
  { id: 9,  room: 'Living room',    items: 0, primary: '— blurry / unclear',  status: 'unmatched', conf: 'low', flags: ['unmatched'] },
  { id: 10, room: 'Master bedroom', items: 1, primary: 'Casper hybrid mattress', status: 'matched', conf: 'high', flags: [] },
  { id: 11, room: 'Master bedroom', items: 1, primary: 'Upholstered bed frame', status: 'matched', conf: 'med', flags: [] },
  { id: 12, room: 'Master closet',  items: 1, primary: "Men's suit jacket, wool", status: 'matched', conf: 'med', flags: [] },
  { id: 13, room: 'Master closet',  items: 1, primary: 'Diamond solitaire ring', status: 'matched', conf: 'med', flags: ['special-limits'] },
  { id: 14, room: 'Master closet',  items: 1, primary: 'Rolex Submariner watch',  status: 'matched', conf: 'med',  flags: ['special-limits'] },
  { id: 15, room: 'Home office',    items: 1, primary: 'MacBook Pro 14"',     status: 'matched', conf: 'high', flags: ['barcode'] },
  { id: 16, room: 'Home office',    items: 1, primary: 'Herman Miller Aeron', status: 'matched', conf: 'high', flags: ['barcode'] },
  { id: 17, room: 'Home office',    items: 1, primary: 'Standing desk',       status: 'matched', conf: 'med',  flags: [] },
  { id: 18, room: 'Dining',         items: 1, primary: 'Dining table, walnut', status: 'matched', conf: 'med',  flags: [] },
  { id: 19, room: 'Garage',         items: 1, primary: 'DeWalt drill kit',     status: 'matched', conf: 'med',  flags: [] },
  { id: 20, room: 'Garage',         items: 1, primary: 'Weber gas grill',      status: 'matched', conf: 'med',  flags: [] },
  { id: 21, room: 'Garage',         items: 1, primary: 'Tikka T3x rifle',      status: 'matched', conf: 'low',  flags: ['special-limits'] },
  { id: 22, room: 'Hallway',        items: 0, primary: '— hallway shot',      status: 'context', conf: 'high', flags: ['context'] },
  { id: 23, room: 'Hallway',        items: 1, primary: 'Wall mirror, brass',   status: 'matched', conf: 'med',  flags: [] },
  { id: 24, room: 'Exterior',       items: 0, primary: '— front of house',    status: 'context', conf: 'high', flags: ['context'] },
];

// The gallery renders EVERY photo on the claim (60 per rule 1: 57 matched ·
// 3 context). Photo→item pairing is positional: items in the backend export are
// in capture order, so photo k backs item k after skipping the context shots.
const REAL = window.CLAIM_PHOTOS || [];
const PHOTO_ALL = (() => {
  if (!REAL.length) return PHOTO_DATA;
  const inv = window.REAL_INVENTORY || [];
  // 60 captures, 57 line items — 3 context frames plus merged second frames
  // (backend merged 144542+144545 into one set) never start a new item. A
  // merged second frame shows the SAME item as its primary, per photos[].
  const CONTEXT = window.CLAIM_CONTEXT_IDX || [57, 58, 59];
  const MERGED = window.CLAIM_MERGED_SECOND || {};
  const secondToPrimary = {};
  Object.entries(MERGED).forEach(([prim, extras]) => extras.forEach(e => { secondToPrimary[e] = +prim; }));
  const itemAtPhoto = {}; // photo idx -> {item, itemId}
  let k = 0;
  return REAL.map((r, i) => {
    const base = { id: i + 1, src: r.src, file: r.filename, time: r.captured_at };
    if (CONTEXT.includes(i)) return { ...base, room: 'Exterior', items: 0, primary: '\u2014 wide shot \u00b7 no item priced from this photo', status: 'context', conf: 'high', flags: ['context'] };
    if (secondToPrimary[i] !== undefined) {
      const o = itemAtPhoto[secondToPrimary[i]];
      if (o) return { ...base, room: o.it.room, items: 1, itemId: o.itemId, primary: o.it.desc, status: 'matched', conf: o.it.conf, flags: ['merged'] };
    }
    if (k >= inv.length) return { ...base, room: 'Exterior', items: 0, primary: '\u2014 wide shot \u00b7 no item priced from this photo', status: 'context', conf: 'high', flags: ['context'] };
    const it = inv[k]; k += 1;
    itemAtPhoto[i] = { it, itemId: k };
    return { ...base, room: it.room, items: 1, itemId: k, primary: it.desc, status: 'matched',
      conf: it.conf, flags: it.mfr ? ['barcode'] : [] };
  });
})();
const PHOTO_PAGE = 36;

// Room list derived from the photo set — the same room field the worksheet
// edits — so renaming a room there renames it here and the two cannot drift.
const photoRooms = () => {
  const counts = {};
  PHOTO_ALL.forEach(p => { counts[p.room] = (counts[p.room] || 0) + 1; });
  return [{ name: 'All', n: PHOTO_ALL.length },
    ...Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }))];
};

const PHOTO_ROOM_FILTERS_LEGACY = [
  { name: 'All',            n: 162, on: true  },
  { name: 'Kitchen',        n:  47, on: false },
  { name: 'Living room',    n:  31, on: false },
  { name: 'Master bedroom', n:  22, on: false },
  { name: 'Home office',    n:  18, on: false },
  { name: 'Dining',         n:  14, on: false },
  { name: 'Pantry',         n:  11, on: false },
  { name: 'Garage',         n:   9, on: false },
  { name: 'Master closet',  n:   6, on: false },
  { name: 'Hallway',        n:   2, on: false },
  { name: 'Exterior',       n:   2, on: false },
];

const ClaimPhotos = ({ sample = false, onGoToWorksheet }) => {
  const [filter, setFilter] = React.useState('All');       // room
  const [status, setStatus] = React.useState(null);        // status facet
  const [picked, setPicked] = React.useState(new Set());   // download selection
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [full, setFull] = React.useState(false);           // full-screen viewer
  const ROOMS = React.useMemo(photoRooms, []);
  const STATUS_FACETS = [
    ['Matched to an item', 'ok',    p => p.status === 'matched'],
    ['Unmatched',          'warn',  p => p.status === 'unmatched'],
    ['Low confidence',     'warn',  p => p.conf === 'low'],
    ['Scene / wide shots', 'quiet', p => p.status === 'context'],
    ['Duplicates',         'quiet', p => p.status === 'duplicate'],
  ];
  // Filters must actually filter — a facet that reads "12" and shows 162 is
  // worse than no facet at all.
  const visible = React.useMemo(() => {
    let out = PHOTO_ALL;
    if (filter !== 'All') out = out.filter(p => p.room === filter);
    if (status) { const f = STATUS_FACETS.find(x => x[0] === status); if (f) out = out.filter(f[2]); }
    return out;
  }, [filter, status]);
  const [focused, setFocused] = React.useState(13);
  const focus = PHOTO_ALL.find(p => p.id === focused);
  // Lazy scroll: render a page at a time, extend when the sentinel comes into view.
  const [shown, setShown] = React.useState(PHOTO_PAGE);
  const sentinel = React.useRef(null);
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= PHOTO_ALL.length) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) setShown((n) => Math.min(n + PHOTO_PAGE, PHOTO_ALL.length));
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div className="k-photos">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <a className="k-link" href="12-Claim-overview.html" style={{ fontSize: 12 }}><Icon d={I.chevleft} size={11} /> Godfrey — Kitchen fire</a>
          <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-3)' }}>CLM-2026-04412</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12}/> Download all</button>
          <a className="k-btn" href="05-Worksheet-flat.html">Open worksheet →</a>
          <window.AvatarMenu />
        </div>
      </header>

      {/* — Claim tabs — */}
      <window.ClaimTabs active="Photos" sample={sample} />

      <div className="k-photos-body">
        {/* — Filter sidebar — */}
        <aside className="k-photos-side">
          <div style={{ padding: '16px 16px 8px' }}>
            <div className="k-photos-side-h">Status</div>
            {STATUS_FACETS.map(([l, tone, fn]) => (
              <button key={l} onClick={() => setStatus(status === l ? null : l)}
                className={'k-photos-filter' + (status === l ? ' k-photos-filter--on' : '')}>
                <span style={{ flex: 1, fontSize: 12.5, color: 'inherit' }}>{l}</span>
                <Badge tone={tone}>{PHOTO_ALL.filter(fn).length}</Badge>
              </button>
            ))}
          </div>
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--k-line)' }}>
            <div className="k-photos-side-h">Room</div>
            {ROOMS.map((r, i) => (
              <button key={i} onClick={() => setFilter(r.name)} className={`k-photos-filter ${filter === r.name ? 'k-photos-filter--on' : ''}`}>
                <span style={{ flex: 1, fontSize: 12.5, color: 'inherit' }}>{r.name}</span>
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>{r.n}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* — Photo grid + detail — */}
        <div className="k-photos-main">
          <div className="k-photos-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: 0 }}>
                {filter === 'All' ? (status || 'All photos') : (status ? filter + ' · ' + status : filter)}
              </h2>
              <Badge tone="quiet">{visible.length} photos</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="k-search" style={{ minWidth: 200 }}>
                <Icon d={I.search} size={12} />
                <input placeholder="Search by item, room, filename…" />
              </div>
              {picked.size > 0 && (
                <button className="k-btn k-btn--sm" onClick={() => setPicked(new Set())}>
                  <Icon d={I.download} size={11} /> Download {picked.size} selected
                </button>
              )}
              <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--k-bg-2)', borderRadius: 6 }}>
                <button className="k-seg k-seg--on">Grid</button>
                <button className="k-seg" disabled title="Needs a capture timestamp — see INTERACTIONS.md">Timeline</button>
                <button className="k-seg" disabled title="Needs GPS on the photo — most captures do not carry it">Map</button>
              </div>
            </div>
          </div>

          <div className="k-photos-grid">
            {visible.slice(0, shown).map((p) => (
              <button key={p.id} onClick={() => setFocused(p.id)} className={`k-photo ${p.id === focused ? 'k-photo--on' : ''}`}>
                <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
                  <Thumb src={p.src} idx={p.id} size={140} desc={p.primary} label={p.room.slice(0,3).toUpperCase()} />
                  {/* corner ribbons */}
                  <span className={'k-photo-check' + (picked.has(p.id) ? ' k-photo-check--on' : '')}
                    onClick={(e) => { e.stopPropagation(); setPicked(v => { const n = new Set(v); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; }); }}>
                    {picked.has(p.id) && <Icon d={I.check} size={10} />}
                  </span>
                  <div className="k-photo-tl">
                    {p.flags.includes('barcode') && <Badge tone="ok">●</Badge>}
                    {p.flags.includes('special-limits') && <Badge tone="warn">SL</Badge>}
                    {p.flags.includes('unmatched') && <Badge tone="warn">?</Badge>}

                    {p.flags.includes('duplicate') && <Badge tone="quiet">Duplicate</Badge>}
                  </div>
                  <div className="k-photo-bl">
                    {p.items > 0 ? (
                      <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: 10.5, fontFamily: 'var(--k-font-mono)' }}>1 item</span>
                    ) : (
                      <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: 10.5, fontFamily: 'var(--k-font-mono)' }}>—</span>
                    )}
                  </div>
                </div>
                <div style={{ padding: '6px 4px 0' }}>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.room} · IMG_{String(p.id).padStart(4,'0')}</div>
                  <div style={{ fontSize: 12, color: 'var(--k-fg)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.primary}</div>
                </div>
              </button>
            ))}
          </div>
          {shown < PHOTO_ALL.length && (
            <div ref={sentinel} className="k-photos-more">
              <span className="k-spinner" /> Loading photos… {shown} of {PHOTO_ALL.length}
            </div>
          )}
        </div>

        {/* — Detail panel — */}
        {focus && (
          <aside className="k-photos-detail">
            <div className="k-exp-det-hd">
              <div>
                <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>{focus.file || 'IMG_' + String(focus.id).padStart(4,'0') + '.jpg'}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{focus.primary}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 2 }}>{focus.room}{focus.src ? '' : ' · placeholder'}</div>
              </div>
              <button className="k-icon-btn" onClick={() => setFull(true)} title="View full size" disabled={!focus.src}><Icon d={I.expand} size={13} /></button>
            </div>
            <div style={{ padding: 14, borderBottom: '1px solid var(--k-line)' }}>
              <Thumb src={focus.src} idx={focus.id} size={300} desc={focus.primary} label={focus.room.slice(0,3).toUpperCase()} />
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="k-exp-meta">
                <div><span>Captured</span><span className="k-mono">{focus.time || '—'}</span></div>
                <div><span>Device</span><span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>—</span></div>
                <div><span>GPS</span><span className="k-mono">—</span></div>
                <div><span>Confidence</span><span style={{ fontSize: 11.5 }}>{focus.conf}</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--k-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>{focus.items > 0 ? 'Replacement cost value' : 'No item priced from this photo'}</div>
                {focus.items === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
                    {focus.status === 'context' && 'Wide shot of the room. Kevin used it to place items in their surroundings — it isn\u2019t an item itself, so nothing was priced from it.'}
                    {focus.status === 'duplicate' && 'Same photo was already on the claim, so this copy was set aside rather than creating the item twice.'}
                    {focus.status === 'unmatched' && 'Kevin couldn\u2019t confidently identify an item here. Add it by hand on the worksheet if it should be one.'}
                  </div>
                )}
                {focus.items > 0 && (() => {
                  // Real price from the same seed the worksheet renders — never
                  // a typed-in literal. itemId is 1-based; money fields read
                  // verbatim (server-owned), unpriced rows show a blank em dash.
                  const wsRows = window.__CP_ROWS || (window.__CP_ROWS = window.buildWorksheetRows(57));
                  const row = wsRows[focus.itemId - 1];
                  const rcv = row ? row.rcv_total_incl : null;
                  return (
                  <div className="k-hv-row" style={{ borderBottom: '1px solid var(--k-line)' }}>
                    <span style={{ flex: 1, fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                      {focus.flags.includes('barcode') ? 'Barcode match' : 'Vision match'}
                    </span>
                    {row && row.special_limits && <Badge tone="warn">Special limits</Badge>}
                    <span className="k-mono" style={{ fontSize: 14, fontWeight: 600 }}>{rcv == null ? '—' : window.fmtUSD(rcv)}</span>
                  </div>
                  );
                })()}
                {focus.items === 0 && (
                  <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--k-fg-4)' }}>
                    No items matched. <a className="k-link" href="75-Written-import.html">Add item manually →</a>
                  </div>
                )}
                {focus.items > 0 && (
                  <a className="k-link" style={{ marginTop: 10, display: 'inline-flex' }}
                    href={`05-Worksheet-flat.html#item-${focus.id}`}
                    onClick={onGoToWorksheet ? (e) => { e.preventDefault(); onGoToWorksheet(focus.itemId); } : undefined}
                    title="Open this item on the worksheet to edit it">
                    Go to worksheet <Icon d={I.chevright} size={11} />
                  </a>
                )}
              </div>
            </div>
            <div className="k-exp-det-foot">
              {/* Delete is always available — it is the customer's claim (rule 15).
                  Kevin states the consequence and gets out of the way; it does
                  not decide which evidence an adjuster may keep. */}
              <button className="k-btn k-btn--ghost k-btn--danger" onClick={() => setConfirmDel(focus.id)}>
                <Icon d={I.trash} size={12}/> Delete photo
              </button>
            </div>
          </aside>
        )}
      </div>

      {full && focus && focus.src && (() => {
        const list = visible.filter(p => p.src);
        const i = list.findIndex(p => p.id === focus.id);
        const go = (d) => { const n = list[i + d]; if (n) setFocused(n.id); };
        return (
          <div className="k-photo-full" onClick={() => setFull(false)}>
            <div className="k-photo-full-in" onClick={(e) => e.stopPropagation()}>
              <div className="k-photo-full-hd">
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12 }}>{focus.file}</span>
                <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>{focus.time} · {focus.room}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>{i + 1} of {list.length}</span>
                <button className="k-icon-btn" onClick={() => go(-1)} disabled={i <= 0} title="Previous"><Icon d={I.chevleft} size={14} /></button>
                <button className="k-icon-btn" onClick={() => go(1)} disabled={i >= list.length - 1} title="Next"><Icon d={I.chevright} size={14} /></button>
                <button className="k-icon-btn" onClick={() => setFull(false)} title="Close"><Icon d={I.close} size={14} /></button>
              </div>
              <img src={focus.src} alt={focus.file} className="k-photo-full-img" />
            </div>
          </div>
        );
      })()}
      {confirmDel !== null && (() => {
        const p = PHOTO_ALL.find(x => x.id === confirmDel);
        return (
          <div className="k-stage-noteover" onClick={() => setConfirmDel(null)}>
            <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
              <div className="k-notemodal-hd">
                <div>
                  <div className="k-notemodal-t" style={{ color: 'var(--k-danger)' }}>Delete this photo?</div>
                  <div className="k-notemodal-s">{p && p.file}</div>
                </div>
                <button className="k-icon-btn" onClick={() => setConfirmDel(null)} aria-label="Close"><Icon d={I.close} size={15} /></button>
              </div>
              <div className="k-notemodal-body">
                <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>
                  {p && p.items > 0
                    ? 'This photo is the proof behind a priced line item. Deleting it leaves that row on the worksheet without its source photo — the row and its price are untouched.'
                    : 'This photo produced no line item, so nothing on the worksheet loses its source photo.'}
                  {' '}Deleting is permanent, and the photo will not appear in the export bundle.
                </p>
              </div>
              <div className="k-notemodal-ft">
                <div style={{ flex: 1 }} />
                <button className="k-btn k-btn--ghost" onClick={() => setConfirmDel(null)}>Keep it</button>
                <button className="k-btn k-btn--danger" onClick={() => setConfirmDel(null)}>Delete photo</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

window.ClaimPhotos = ClaimPhotos;
// The photo↔room join lives here; the claim overview reuses it for room thumbs.
window.PHOTO_ALL = PHOTO_ALL;
