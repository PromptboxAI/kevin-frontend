// Exports & history — every export ever made, by every adjuster on the team.

const { KevinWordmark, Icon, I, Badge, fmtUSDshort } = window;

// Seed: solo Pro account (rule 9), so every export is "by You". Kevin never
// pushes to carrier systems (rule 4) — the adjuster downloads or shares a link,
// so the only statuses are downloaded / link shared / superseded. Only two
// formats exist: Xactimate (Excel) .xlsx and PDF (backend contract — no CSV).
const EXPORTS = [
  { id: 'EXP-2026-1138', claim: 'CLM-2026-04412', insured: 'Godfrey, Kevin',    carrier: 'Allstate',        format: 'Xactimate (Excel)', items: 57,  size: '248 MB', when: '2h ago',     status: 'downloaded', rcv: 2786.31, ver: 3 },
  { id: 'EXP-2026-1131', claim: 'CLM-2026-04403', insured: "O'Connell, Tricia", carrier: 'Nationwide',      format: 'PDF inventory',     items: 89,  size: '54 MB',  when: '1d ago',     status: 'shared',     rcv: 46620.00, ver: 2 },
  { id: 'EXP-2026-1130', claim: 'CLM-2026-04403', insured: "O'Connell, Tricia", carrier: 'Nationwide',      format: 'Xactimate (Excel)', items: 89,  size: '54 MB',  when: '1d ago',     status: 'superseded', rcv: 46620.00, ver: 1 },
  { id: 'EXP-2026-1119', claim: 'CLM-2026-04391', insured: 'Estate of W. Holt', carrier: '— (Estate sale)', format: 'PDF inventory',     items: 296, size: '892 MB', when: '3d ago',     status: 'downloaded', rcv: 61144.00, ver: 1 },
  { id: 'EXP-2026-1108', claim: 'CLM-2026-04374', insured: 'Cunningham, Jas.',  carrier: 'Travelers',       format: 'Xactimate (Excel)', items: 312, size: '212 MB', when: '2w ago',     status: 'downloaded', rcv: 188410.55, ver: 2 },
  { id: 'EXP-2026-1078', claim: 'CLM-2026-04318', insured: 'Caldwell, R.',      carrier: 'Liberty Mutual',  format: 'Xactimate (Excel)', items: 148, size: '98 MB',  when: 'last month', status: 'shared',     rcv: 94208.12, ver: 1 },
];

const STATUS = {
  downloaded: { tone: 'ok',    dot: true,  label: 'Downloaded' },
  shared:     { tone: 'accent', dot: true, label: 'Link shared' },
  superseded: { tone: 'quiet', dot: false, label: 'Superseded' },
};

const Exports = () => {
  const [selected, setSelected] = React.useState('EXP-2026-1138');
  const focus = EXPORTS.find(e => e.id === selected) || EXPORTS[0];

  return (
    <div className="k-claims">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="Exports" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="k-btn k-btn--ghost"><Icon d={I.search} size={12} /> Search exports <kbd style={{ marginLeft: 6 }}>⌘K</kbd></button>
          <window.AvatarMenu />
        </div>
      </header>

      <div className="k-exp-body">
        {/* — List — */}
        <div className="k-exp-list-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Exports & history</div>
              <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Everything you’ve sent.</h1>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
                Every export is a frozen snapshot of the worksheet and its source photos — version 1 still opens as version 1, years later.
              </p>
            </div>
            <div className="k-claims-stats">
              <div><div className="k-tot-l">Exports</div><div className="k-tot-v">{EXPORTS.length}</div></div>
              <div><div className="k-tot-l">Claims covered</div><div className="k-tot-v">{new Set(EXPORTS.map(e => e.claim)).size}</div></div>
              <div><div className="k-tot-l">Storage</div><div className="k-tot-v">{(EXPORTS.reduce((a, e) => a + parseInt(e.size), 0) / 1024).toFixed(1)} GB</div></div>
            </div>
          </div>

          <section className="k-claims-toolbar">
            <div className="k-search" style={{ minWidth: 260 }}>
              <Icon d={I.search} size={12} />
              <input placeholder="Filter exports · claim #, carrier, format…" />
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--k-bg-2)', borderRadius: 6 }}>
              {['All', 'Downloaded', 'Link shared', 'Superseded'].map((s, i) =>
                <button key={s} className={`k-seg ${i === 0 ? 'k-seg--on' : ''}`}>{s}</button>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <button className="k-btn k-btn--ghost"><Icon d={I.filter} size={12} /> Sort: Newest first</button>
          </section>

          <section className="k-exp-list">
            <div className="k-exp-row k-exp-row--head">
              <div>Export</div>
              <div>Claim</div>
              <div>Format</div>
              <div style={{ textAlign: 'right' }}>Items / size</div>
              <div>Status</div>
              <div>When</div>
              <div></div>
            </div>
            {EXPORTS.map(e => (
              <div key={e.id} onClick={() => setSelected(e.id)} className={`k-exp-row ${e.id === selected ? 'k-exp-row--sel' : ''}`}>
                <div>
                  <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg)' }}>{e.id}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', marginTop: 1 }}>v{e.ver}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.insured}</div>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 1 }}>{e.claim} · {e.carrier}</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--k-fg-2)', fontFamily: 'var(--k-font-mono)' }}>{e.format}</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--k-font-mono)', fontSize: 12.5, fontFeatureSettings: '"tnum"' }}>
                  <div>{e.items.toLocaleString()}</div>
                  <div style={{ color: 'var(--k-fg-4)', fontSize: 11 }}>{e.size}</div>
                </div>
                <div>
                  <Badge tone={STATUS[e.status].tone} dot={STATUS[e.status].dot}>{STATUS[e.status].label}</Badge>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', fontFamily: 'var(--k-font-mono)' }}>{e.when}</div>
                <div style={{ textAlign: 'right', color: 'var(--k-fg-4)' }}><Icon d={I.chevright} size={13} /></div>
              </div>
            ))}
          </section>
        </div>

        {/* — Detail panel — */}
        <aside className="k-exp-detail">
          <div className="k-exp-det-hd">
            <div>
              <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>{focus.id}</div>
              <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, margin: '4px 0 2px', letterSpacing: '-0.018em' }}>{focus.insured}</h2>
              <div style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{focus.claim} · {focus.carrier}</div>
            </div>
            <Badge tone={STATUS[focus.status].tone} dot={STATUS[focus.status].dot}>{STATUS[focus.status].label}</Badge>
          </div>

          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="k-exp-meta">
              <div><span>Format</span><span className="k-mono">{focus.format}</span></div>
              <div><span>Items</span><span className="k-mono">{focus.items.toLocaleString()}</span></div>
              <div><span>Bundle size</span><span className="k-mono">{focus.size}</span></div>
              <div><span>RCV at export</span><span className="k-mono">{window.fmtUSD(focus.rcv)}</span></div>
              <div><span>Version</span><span className="k-mono">v{focus.ver}</span></div>
              <div><span>Created</span><span className="k-mono">{focus.when}</span></div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Bundle contents</div>
              <div className="k-exp-bundle">
                <div><Icon d={I.zip} size={12} /> <span className="k-mono">{focus.format === 'PDF inventory' ? 'inventory.pdf' : 'claim_export.xlsx'}</span> <span style={{ color: 'var(--k-fg-4)' }}>· worksheet snapshot</span></div>
                <div><Icon d={I.zip} size={12} /> <span className="k-mono">photos/</span> <span style={{ color: 'var(--k-fg-4)' }}>· {focus.items} files · {focus.size}</span></div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Version history</div>
              <div className="k-exp-versions">
                <div className="k-exp-ver k-exp-ver--on">
                  <span className="k-exp-ver-d" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>v{focus.ver} · current</div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{focus.when} · {focus.items} items</div>
                  </div>
                </div>
                <div className="k-exp-ver">
                  <span className="k-exp-ver-d" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}>v2</div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>3 days earlier · {focus.items - 3} items</div>
                  </div>
                  <button className="k-link">Compare</button>
                </div>
                <div className="k-exp-ver">
                  <span className="k-exp-ver-d" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}>v1 · initial</div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>1w earlier · Kevin · {focus.items - 12} items</div>
                  </div>
                  <button className="k-link">Compare</button>
                </div>
              </div>
            </div>
          </div>

          <div className="k-exp-det-foot">
            <button className="k-btn k-btn--ghost" title="Re-downloads this stored snapshot exactly as generated — nothing is rebuilt"><Icon d={I.download} size={12}/> Download again</button>
            <a className="k-btn" href="06-Export-modal.html" title="Runs a fresh export of the claim as it is today — becomes the next version">New export of this claim →</a>
          </div>
        </aside>
      </div>
    </div>
  );
};

window.Exports = Exports;
