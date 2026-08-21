// Notes & audit log — defensible edit history for a claim.
// Two-pane: timeline of every change on left, threaded adjuster notes on right.

const { KevinWordmark, Icon, I, Badge, ConfPip } = window;

// Generate audit events — realistic mix of Kevin auto + user edits + carrier events
const AUDIT_EVENTS = [
  { t: 'Today · 11:14:22', who: 'Kevin',     role: 'system',   ev: 'Processing complete', detail: '57 items identified from 60 photos · 12 content classes · ran 2m 41s', tone: 'ok',     icon: 'spark' },
  { t: 'Today · 11:14:08', who: 'Kevin',     role: 'system',   ev: 'Special-limits flag', detail: 'Tagged 3 items in 2 classes (Jewelry · Fine Arts)',     tone: 'warn',   icon: 'warn'  },
  { t: 'Today · 11:13:45', who: 'Kevin',     role: 'system',   ev: 'Barcode match',       detail: 'Sony XR-55A80L → Sony 55" OLED · 3 retailer comps fetched',                tone: 'ok',     icon: 'check' },
  { t: 'Today · 11:13:12', who: 'M. Reyes',  role: 'adjuster', ev: 'Cell edit',           field: 'Description · row #042',  from: 'Sectional sofa, gray',           to: 'Sectional sofa, 3-piece, gray performance fabric', tone: 'quiet' },
  { t: 'Today · 11:12:48', who: 'M. Reyes',  role: 'adjuster', ev: 'Cell edit',           field: 'RCV · row #054',          from: '$18,200.00',                    to: '$18,500.00',  reason: 'Manual override (engagement ring)', tone: 'quiet' },
  { t: 'Today · 11:11:30', who: 'M. Reyes',  role: 'adjuster', ev: 'Note added',          detail: 'Claim note: "Loss was contained to kitchen and adjacent dining room — most damage is smoke, not direct fire."', tone: 'accent' },
  { t: 'Today · 11:10:12', who: 'M. Reyes',  role: 'adjuster', ev: 'Item deleted',        field: 'Row #168',                 detail: 'Duplicate of row #154 (Casper mattress) — removed', tone: 'quiet' },
  { t: 'Today · 11:09:55', who: 'M. Reyes',  role: 'adjuster', ev: 'Bulk re-categorize',  field: '12 items',                 from: 'Decor & Accessories',          to: 'Kitchen & Housewares', tone: 'quiet' },
  { t: 'Today · 11:08:32', who: 'Kevin',     role: 'system',   ev: 'Identify pass 1',     detail: 'Items: 57 · Make/model: 15 · every line priced',               tone: 'ok',     icon: 'spark' },
  { t: 'Today · 11:02:15', who: 'M. Reyes',  role: 'adjuster', ev: 'Photos uploaded',     detail: '60 photos · 388 MB · 1 duplicate skipped via SHA-256',                    tone: 'quiet' },
  { t: 'Today · 10:54:00', who: 'M. Reyes',  role: 'adjuster', ev: 'Claim created',       detail: 'Allstate · Kevin Godfrey · Apr 18 kitchen fire',                          tone: 'quiet' },
];

const NOTES_REMOVED = true; // shared-notes thread removed for MVP — audit log is single-pane now

const ICON_MAP = { spark: 'spark', warn: 'warn', check: 'check' };

const AUDIT_FACETS = [
  ['All',      () => true],
  ['System',   (e) => e.role === 'system'],
  ['Adjuster', (e) => e.role === 'adjuster'],
];

const AuditLog = () => {
  const [facet, setFacet] = React.useState('All');
  const shown = AUDIT_EVENTS.filter((AUDIT_FACETS.find(f => f[0] === facet) || AUDIT_FACETS[0])[1]);
  const countOf = (name) => AUDIT_EVENTS.filter((AUDIT_FACETS.find(f => f[0] === name) || AUDIT_FACETS[0])[1]).length;
  return (
  <div className="k-audit">
    <header className="k-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <KevinWordmark size={16} suffix={true} />
        <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
        <a className="k-link" href="12-Claim-overview.html" style={{ fontSize: 12 }}><Icon d={I.chevleft} size={11} /> Godfrey — Kitchen fire</a>
        <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-3)' }}>CLM-2026-04412</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12}/> Export audit log</button>
        <a className="k-btn" href="05-Worksheet-flat.html">Open worksheet →</a>
        <window.AvatarMenu />
      </div>
    </header>
      <window.ClaimTabs active="Notes & audit" />

    <div className="k-audit-body k-audit-body--single">
      {/* — Audit timeline (full width) — */}
      <main className="k-audit-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Audit log</div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.02em', margin: '4px 0 4px' }}>Change history</h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              <strong style={{ color: 'var(--k-fg-2)' }}>{AUDIT_EVENTS.length} events</strong> · {countOf('Adjuster')} by the adjuster · {countOf('System')} by Kevin itself · Included in the export
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 0 8px', flexWrap: 'wrap' }}>
          {AUDIT_FACETS.map(([l]) => { const n = countOf(l); const on = facet === l; return (
            <button key={l} onClick={() => setFacet(l)} className={`k-chip ${on ? 'k-chip--on' : ''}`}>
              <span>{l}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, opacity: 0.7, marginLeft: 4 }}>{n}</span>
            </button>
          ); })}
        </div>

        {/* Audit events */}
        <div className="k-audit-list">
          {(shown || []).map((rawEvent, i) => {
            const e = rawEvent || {};
            const who = e.who || '—';
            const role = e.role || 'system';
            const initials = who === 'Kevin' ? 'K' : who.split(' ').map(p => (p && p[0]) || '').join('') || '?';
            return (
            <div key={i} className="k-audit-event">
              <div className={`k-audit-dot k-audit-dot--${e.tone || 'quiet'}`}>
                {e.icon === 'spark' && <Icon d={I.spark} size={10} />}
                {e.icon === 'warn' && <Icon d={I.warn} size={10} />}
                {e.icon === 'check' && <Icon d={I.check} size={10} stroke={2.5} />}
              </div>
              <div className="k-audit-content">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{e.ev}</span>
                  {e.field && <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>· {e.field}</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{e.t}</span>
                </div>
                {e.from !== undefined && (
                  <div className="k-audit-diff">
                    <span className="k-audit-from">{e.from}</span>
                    <Icon d={I.chevright} size={10} />
                    <span className="k-audit-to">{e.to}</span>
                    {e.reason && <span style={{ fontSize: 11, color: 'var(--k-fg-4)', marginLeft: 'auto' }}>· {e.reason}</span>}
                  </div>
                )}
                {e.detail && !e.from && <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 3 }}>{e.detail}</div>}
                <div className="k-audit-who">
                  <span className={`k-audit-avatar k-audit-avatar--${role}`}>{initials}</span>
                  <span>{who}</span>
                  <Badge tone="quiet">{role}</Badge>
                </div>
              </div>
            </div>
          )})}
        </div>
      </main>
    </div>
  </div>
  );
};

window.AuditLog = AuditLog;
