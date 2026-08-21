// Notifications / inbox — full page + a small overlay variant shown as a popover.

const { KevinWordmark, Icon, I, Badge } = window;

// Solo Pro account: no team events (Enterprise-only). Kevin never evaluates
// carrier caps (rule 6 — special limits are FLAGGED, never blocked or measured
// against a carrier table) and has no carrier tie, so no "Allstate cap" copy.
const NOTES = [
  { id: 1, cat: 'processing', read: false, when: 'Just now',  ev: 'Kevin finished processing CLM-2026-04412 — 57 items identified', sub: 'Godfrey — Kitchen fire', cta: 'Open worksheet', href: '05-Worksheet-flat.html', tone: 'ok' },
  { id: 2, cat: 'shares',     read: false, when: '12m ago',   ev: 'Share link opened — export EXP-2026-1138',                      sub: 'Godfrey claim · recipient viewed 12m ago', cta: 'View export', href: '13-Exports-history.html', tone: 'ok' },
  { id: 3, cat: 'flag',       read: false, when: '34m ago',   ev: '2 special-limits items flagged on CLM-2026-04412',              sub: 'Engagement ring · Tennis bracelet — amber rows on the worksheet', cta: 'Review', href: '05-Worksheet-flat.html', tone: 'warn' },
  { id: 4, cat: 'processing', read: true,  when: '2h ago',    ev: 'Upload complete · 60 photos for CLM-2026-04412',                sub: '388 MB · 1 duplicate skipped', cta: null, href: null, tone: 'quiet' },
  { id: 5, cat: 'pricing',    read: true,  when: '3h ago',    ev: 'Deferred items repriced · 4 items cleared the capacity queue',  sub: 'Hourly pricing limit rolled over — no action was needed', cta: null, href: null, tone: 'quiet' },
  { id: 6, cat: 'pricing',    read: true,  when: 'Yesterday', ev: 'Depreciation schedule updated · v2026.04',                      sub: 'Affects 3 in-flight claims — rows recompute on next edit', cta: 'Open settings', href: '10-Carrier-settings.html', tone: 'accent' },
  { id: 7, cat: 'flag',       read: true,  when: '2d ago',    ev: "Special-limits items on the O'Connell claim",                   sub: 'Noted in the export summary — download stayed live', cta: null, href: null, tone: 'quiet' },
  { id: 8, cat: 'system',     read: true,  when: '1w ago',    ev: 'New: XactContents Excel template v28 supported',                sub: 'No action needed · existing exports re-mapped', cta: null, href: null, tone: 'quiet' },
];

const CAT_LABEL = {
  processing: 'Processing', shares: 'Share links', flag: 'Flags & limits',
  pricing: 'Pricing', system: 'System',
};

const Notifications = () => {
  const [filter, setFilter] = React.useState('All');
  const [readIds, setReadIds] = React.useState(() => new Set(NOTES.filter(n => n.read).map(n => n.id)));
  const isRead = n => readIds.has(n.id);
  const unread = NOTES.filter(n => !isRead(n)).length;
  const shown = NOTES.filter(n => filter === 'All' ? true : filter === 'Unread' ? !isRead(n) : CAT_LABEL[n.cat] === filter);
  const markAll = () => setReadIds(new Set(NOTES.map(n => n.id)));

  return (
    <div className="k-notif-page">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="k-icon-btn" style={{ position: 'relative', width: 30, height: 30 }}>
            <Icon d={<><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></>} size={16} />
            {unread > 0 && <span style={{ position: 'absolute', top: 3, right: 3, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 99, background: 'var(--k-warn)', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', fontFamily: 'var(--k-font-mono)' }}>{unread}</span>}
          </button>
          <window.AvatarMenu />
        </div>
      </header>

      <div className="k-notif-body">
        <div className="k-notif-side">
          <div style={{ padding: '20px 18px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Inbox</div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 24, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Notifications</h1>
          </div>
          {[
            ['All', NOTES.length, 'All'],
            ['Unread', unread, 'Unread'],
            ...Object.values(CAT_LABEL).map(l => [l, NOTES.filter(n => CAT_LABEL[n.cat] === l).length, l]),
          ].map(([l, n, id]) => (
            <button key={id} onClick={() => setFilter(id)} className={`k-notif-filter ${filter === id ? 'k-notif-filter--on' : ''}`}>
              <span style={{ flex: 1, fontSize: 12.5 }}>{l}</span>
              {n > 0 && <Badge tone={l === 'Unread' && n > 0 ? 'accent' : 'quiet'}>{n}</Badge>}
            </button>
          ))}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--k-line)', padding: '14px 14px 18px' }}>
            <button className="k-btn k-btn--ghost" onClick={markAll} style={{ width: '100%', justifyContent: 'center', marginBottom: 6 }}>Mark all read</button>
            <a className="k-btn k-btn--ghost" href="31-Settings-profile.html" style={{ width: '100%', justifyContent: 'center' }}>Notification settings</a>
          </div>
        </div>

        <main className="k-notif-main">
          <div className="k-notif-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: 0 }}>{filter}</h2>
              <Badge tone="quiet">{shown.length} notification{shown.length === 1 ? '' : 's'}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="k-search" style={{ minWidth: 220 }}>
                <Icon d={I.search} size={12} />
                <input placeholder="Search notifications…" />
              </div>
              <button className="k-btn k-btn--ghost"><Icon d={I.filter} size={12}/> Sort: Newest</button>
            </div>
          </div>

          <div className="k-notif-list">
            {shown.map(n => (
              <div key={n.id} onClick={() => setReadIds(prev => new Set([...prev, n.id]))} className={`k-notif-row ${!isRead(n) ? 'k-notif-row--unread' : ''}`}>
                <div className={`k-audit-dot k-audit-dot--${n.tone}`} style={{ marginTop: 1 }}>
                  {n.tone === 'warn'   && <Icon d={I.warn} size={10} />}
                  {n.tone === 'ok'     && <Icon d={I.check} size={10} stroke={2.5} />}
                  {n.tone === 'accent' && <Icon d={I.spark} size={10} />}
                  {n.tone === 'quiet'  && <Icon d={I.spark} size={10} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: isRead(n) ? 500 : 600, color: 'var(--k-fg)', flex: 1 }}>{n.ev}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{n.when}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 2 }}>{n.sub}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <Badge tone="quiet">{CAT_LABEL[n.cat]}</Badge>
                    {!isRead(n) && <Badge tone="accent" dot={true}>New</Badge>}
                    {n.cta && <a className="k-link" href={n.href} style={{ marginLeft: 'auto' }}>{n.cta} <Icon d={I.chevright} size={10} /></a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* — Popover variant (showing how the bell-icon dropdown looks) — */}
        <div className="k-notif-popover">
          <div className="k-notif-pop-hd">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Recent</span>
              <Badge tone="accent">{unread} new</Badge>
            </div>
            <button className="k-link" onClick={markAll}>Mark all read</button>
          </div>
          {NOTES.slice(0, 4).map(n => (
            <div key={n.id} className={`k-notif-pop-row ${!isRead(n) ? 'k-notif-row--unread' : ''}`}>
              <span className={`k-tl-dot ${n.tone === 'ok' ? 'k-tl-dot--ok' : ''}`} style={{ marginTop: 6, background: n.tone === 'warn' ? 'var(--k-warn)' : n.tone === 'accent' ? 'var(--k-accent)' : 'var(--k-line-2)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--k-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isRead(n) ? 500 : 600 }}>{n.ev}</div>
                <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 1 }}>{n.when}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-3)', fontSize: 11.5, textAlign: 'center' }}>
            <a className="k-link" href="18-Notifications.html">View all in inbox →</a>
          </div>
          {/* arrow */}
          <div className="k-notif-pop-arrow" />
          {/* annotation pointing to bell */}
          <div className="k-notif-pop-anno">
            <Icon d={<><path d="M5 15 19 5"/><path d="M14 5h5v5"/></>} size={11} />
            <span>Popover from the <strong>bell icon</strong> in any top bar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Notifications = Notifications;
