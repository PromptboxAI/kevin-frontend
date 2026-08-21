// Owner / operator admin console — the back-office the founder logs into to run
// the business. SEPARATE surface from the customer app: its own dark topbar,
// its own nav, role = owner/staff. Three core screens:
//   AdminOverview · AdminAccounts · AdminAccountDetail
// Static by design — engineering wires these to the real backend.
//
// All names are globally unique (ADM_* / Admin*) to avoid the shared-scope
// collisions called out in CLAUDE.md.

const { KevinWordmark: ADM_Wordmark, Icon: ADM_Icon, I: ADM_I, Badge: ADM_Badge } = window;

// ─── Demo data (seed only — replaced by real backend) ───────────────────────
const ADM_ACCOUNTS = [
  { id: 'acct_4412', biz: 'Reyes Adjusting, LLC', owner: 'Mariana Reyes', email: 'mariana@reyesadjusting.com', plan: 'Pro', status: 'Active',   mrr: 249,  claims30: 14, claimsTotal: 168, joined: 'Jan 2026', last: '2h ago',  loc: 'Austin, TX' },
  { id: 'acct_3981', biz: 'Long Island Public Adjusters', owner: 'Kevin Godfrey', email: 'kevin@lipublicadjusters.com', plan: 'Pro', status: 'Active', mrr: 249, claims30: 22, claimsTotal: 341, joined: 'Nov 2025', last: '40m ago', loc: 'Long Island, NY' },
  { id: 'acct_5120', biz: 'Gulf Coast Claims Group', owner: 'Devon Alvarez', email: 'devon@gulfcoastclaims.com', plan: 'Enterprise', status: 'Active', mrr: 2400, claims30: 186, claimsTotal: 2140, joined: 'Aug 2025', last: '1h ago', loc: 'Tampa, FL' },
  { id: 'acct_5566', biz: 'Brightwater Estate Sales', owner: 'Tricia O\'Connell', email: 'tricia@brightwaterestates.com', plan: 'Pro', status: 'Trial', mrr: 0, claims30: 2, claimsTotal: 2, joined: 'Aug 2026', last: '3h ago', loc: 'Bridgeport, CT' },
  { id: 'acct_5604', biz: 'Cunningham Loss Consulting', owner: 'James Cunningham', email: 'james@cunninghamloss.com', plan: 'Pro', status: 'Past due', mrr: 249, claims30: 9, claimsTotal: 77, joined: 'Feb 2026', last: '6 days ago', loc: 'Phoenix, AZ' },
  { id: 'acct_4870', biz: 'Meridian Adjusters', owner: 'Anabel Mendez', email: 'anabel@meridianadj.com', plan: 'Pro', status: 'Active', mrr: 249, claims30: 11, claimsTotal: 129, joined: 'Dec 2025', last: '1d ago', loc: 'New York, NY' },
  { id: 'acct_5301', biz: 'Cardinal TPA Services', owner: 'Priya Raman', email: 'priya@cardinaltpa.com', plan: 'Enterprise', status: 'Active', mrr: 3800, claims30: 312, claimsTotal: 4021, joined: 'Sep 2025', last: '22m ago', loc: 'Columbus, OH' },
  { id: 'acct_5710', biz: 'Harbor Estate Liquidation', owner: 'Sam Whitfield', email: 'sam@harborestate.com', plan: 'Pro', status: 'Active', mrr: 249, claims30: 6, claimsTotal: 31, joined: 'Mar 2026', last: '5h ago', loc: 'Portland, ME' },
  { id: 'acct_5188', biz: 'Three Rivers Adjusting', owner: 'Marcus Hill', email: 'marcus@threeriversadj.com', plan: 'Pro', status: 'Canceled', mrr: 0, claims30: 0, claimsTotal: 54, joined: 'Oct 2025', last: '31 days ago', loc: 'Pittsburgh, PA' },
  { id: 'acct_5902', biz: 'Coastline Public Adjusting', owner: 'Renata Diaz', email: 'renata@coastlinepa.com', plan: 'Pro', status: 'Comped', mrr: 0, comp: { reason: 'Design-partner beta', until: 'Dec 31, 2026', by: 'Kevin G.' }, claims30: 7, claimsTotal: 41, joined: 'Feb 2026', last: '4h ago', loc: 'Charleston, SC' },
  { id: 'acct_0001', biz: 'Kevin (internal)', owner: 'Kevin Godfrey', email: 'kevin@kevin.co', plan: 'Internal', status: 'Internal', mrr: 0, internal: true, claims30: 3, claimsTotal: 28, joined: 'Nov 2025', last: '12m ago', loc: 'Long Island, NY' },
];

// Age derives from 'joined'; LTV is months-on-plan × MRR as a SEED stand-in —
// in production LTV = the sum of the account's actually-paid invoices.
const admAgeMonths = (joined) => {
  const t = new Date(joined + ' 1').getTime();
  if (isNaN(t)) return 0; // unparseable → render "<1 mo"
  return Math.max(1, Math.round((Date.now() - t) / 2629800000));
};
const admLTV = (a) => {
  const paidMrr = a.plan === 'Enterprise' ? a.mrr : (a.status === 'Comped' || a.status === 'Trial' || a.internal) ? 0 : 249;
  const months = a.status === 'Canceled' ? Math.max(1, admAgeMonths(a.joined) - 1) : admAgeMonths(a.joined);
  return paidMrr * months;
};
const ADM_STATUS_TONE = { 'Active': 'ok', 'Trial': 'accent', 'Past due': 'warn', 'Canceled': 'quiet', 'Comped': 'accent', 'Internal': 'quiet' };

// ─── Shell — dark topbar + admin nav ────────────────────────────────────────
const AdminShell = ({ active, children }) => {
  const inPages = typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname);
  const link = (f) => inPages ? f : `pages/${f}`;
  const TABS = [
    ['Overview', '64-Admin-overview.html'],
    ['Accounts', '65-Admin-accounts.html'],
    ['Revenue',  '67-Admin-revenue.html'],
    ['Content',  '68-Admin-content.html'],
    ['Platform', '69-Admin-platform.html'],
    ['Support',  '70-Admin-support.html'],
    ['Staff',    '71-Admin-staff.html'],
    ['System',   '72-Admin-system.html'],
  ];
  return (
    <div className="k-claims">
      <header className="k-topbar k-adm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#fff' }}><ADM_Wordmark href="64-Admin-overview.html" size={16} tone="light" suffix={true} /></span>
            <span className="k-adm-pill">Admin</span>
          </span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.18)' }} />
          <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
            {TABS.map(([label, file]) => (
              <a key={label} href={link(file)} className={`k-tab ${label === active ? 'k-tab--active' : ''}`}>{label}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--k-font-mono)' }}>owner</span>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--k-accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11 }}>KG</div>
        </div>
      </header>
      {children}
    </div>
  );
};

// ─── 1 · OVERVIEW ───────────────────────────────────────────────────────────
const AdminOverview = () => {
  const active = ADM_ACCOUNTS.filter(a => a.status === 'Active');
  const mrr = ADM_ACCOUNTS.reduce((s, a) => s + a.mrr, 0);
  const trials = ADM_ACCOUNTS.filter(a => a.status === 'Trial').length;
  const pastDue = ADM_ACCOUNTS.filter(a => a.status === 'Past due').length;
  const shape = [38, 41, 44, 46, 52, 58, 61, 67, 71, 78, 84, 91]; // growth ramp (relative)
  const mrrH = mrr / 100;                                          // current MRR in $00s
  const trend = shape.map(v => Math.round(v / 91 * mrrH));          // rescaled so last bar == today's MRR
  const trendMax = Math.max(...trend);
  const recent = ADM_ACCOUNTS.slice(0, 5);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const fmtMo = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const admNow = new Date();
  const moStart = fmtMo(new Date(admNow.getFullYear(), admNow.getMonth() - 11, 1));
  const moEnd = fmtMo(admNow);
  const inPages = typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname);
  const detailHref = inPages ? '66-Admin-account-detail.html' : 'pages/66-Admin-account-detail.html';

  return (
    <AdminShell active="Overview">
      <div className="k-adm-body">
        <div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Good {greet}, Kevin.</h1>
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Here's how Kevin is doing today · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* KPIs */}
        <div className="k-adm-kpis">
          {[
            ['Monthly recurring revenue', '$' + mrr.toLocaleString(), '+12.4% vs last month', true, null, inPages ? '67-Admin-revenue.html' : 'pages/67-Admin-revenue.html'],
            ['Active accounts', active.length, '+3 this month', true, 'Active'],
            ['Trials in flight', trials, trials === 1 ? '1 converting this week' : trials + ' converting this week', true, 'Trial'],
            ['Past due', pastDue, pastDue === 1 ? '1 needs a nudge' : pastDue + ' need a nudge', false, 'Past due'],
          ].map(([l, v, d, up, status, directHref], i) => {
            const acctHref = inPages ? '65-Admin-accounts.html' : 'pages/65-Admin-accounts.html';
            const href = directHref || (status ? `${acctHref}?status=${encodeURIComponent(status)}` : null);
            const Tag = href ? 'a' : 'div';
            const props = href ? { href } : {};
            return (
            <Tag key={i} className={`k-adm-kpi${href ? ' k-adm-kpi--link' : ''}`} {...props}>
              <div className="k-adm-kpi-l">{l}</div>
              <div className="k-adm-kpi-v">{v}</div>
              <div className={`k-adm-kpi-d ${up ? 'k-adm-up' : 'k-adm-down'}`}>
                <ADM_Icon d={up ? ADM_I.upload : ADM_I.warn} size={12} /> {d}
              </div>
            </Tag>
          )})}
        </div>

        <div className="k-adm-split">
          {/* Revenue trend */}
          <section className="k-set-card">
            <div className="k-adm-sec-hd" style={{ padding: '13px 16px 3px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>MRR · last 12 months</span>
              <a href={inPages ? '67-Admin-revenue.html' : 'pages/67-Admin-revenue.html'} className="k-link" style={{ fontSize: 12 }}>Revenue →</a>
            </div>
            <div className="k-set-card-body">
              <div className="k-adm-bars">
                {trend.map((h, i) => (
                  <div key={i} className={`k-adm-bar ${i === trend.length - 1 ? 'k-adm-bar--on' : ''}`} style={{ height: `${(h / trendMax) * 100}%` }} title={`$${(h * 100).toLocaleString()}`} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
                <span>{moStart}</span><span style={{ color: 'var(--k-accent)', fontWeight: 600 }}>${mrr.toLocaleString()} today</span><span>{moEnd}</span>
              </div>
            </div>
          </section>

          {/* Pipeline health */}
          <section className="k-set-card">
            <div className="k-adm-sec-hd" style={{ padding: '13px 16px 3px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Pipeline · today</span>
              <a href={inPages ? '72-Admin-system.html' : 'pages/72-Admin-system.html'} className="k-link" style={{ fontSize: 12 }}>System →</a>
            </div>
            <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
              {[
                ['Claims processed', '1,284', 'ok', null],
                ['Photos → items', '142,901 → 138,440', 'ok', null],
                ['Avg match rate', '87.2%', 'ok', null],
                ['Error queue', '6 claims', 'warn', inPages ? '72-Admin-system.html' : 'pages/72-Admin-system.html'],
              ].map(([l, v, tone, href], i) => {
                const inner = (<>
                  <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{l}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5, fontWeight: 600 }}>{v}</span>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: tone === 'ok' ? 'var(--k-ok)' : 'var(--k-warn)' }} />
                    {href && <ADM_Icon d={<path d="m9 6 6 6-6 6"/>} size={13} style={{ color: 'var(--k-fg-4)' }} />}
                  </span>
                </>);
                const style = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < 3 ? '1px solid var(--k-line)' : 0 };
                return href
                  ? <a key={i} href={href} className="k-adm-pipe-row" style={{ ...style, textDecoration: 'none', color: 'inherit' }}>{inner}</a>
                  : <div key={i} style={style}>{inner}</div>;
              })}
            </div>
          </section>
        </div>

        {/* Recent signups */}
        <section className="k-set-card" style={{ padding: 0 }}>
          <div className="k-adm-sec-hd" style={{ padding: '14px 18px 10px' }}>
            <h2>Recent activity</h2>
            <a href={inPages ? '65-Admin-accounts.html' : 'pages/65-Admin-accounts.html'} className="k-link" style={{ fontSize: 12.5 }}>All accounts →</a>
          </div>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': '2.2fr 1fr 1fr 1fr 0.8fr' }}>
            <span>Account</span><span>Plan</span><span>Status</span><span>MRR</span><span>Last active</span>
          </div>
          {recent.map(a => (
            <a key={a.id} href={detailHref} className="k-adm-tr" style={{ '--adm-cols': '2.2fr 1fr 1fr 1fr 0.8fr' }}>
              <span className="k-adm-acct">
                <span className="k-adm-avatar">{a.owner.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.biz}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--k-fg-4)' }}>{a.owner}</span>
                </span>
              </span>
              <span><ADM_Badge tone={a.plan === 'Enterprise' ? 'accent' : 'quiet'}>{a.plan}</ADM_Badge></span>
              <span><ADM_Badge tone={ADM_STATUS_TONE[a.status]} dot={true}>{a.status}</ADM_Badge></span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>{a.mrr ? '$' + a.mrr.toLocaleString() : '—'}</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{a.last}</span>
            </a>
          ))}
        </section>
      </div>
    </AdminShell>
  );
};

// ─── 2 · ACCOUNTS ───────────────────────────────────────────────────────────
const AdminAccounts = () => {
  const [q, setQ] = React.useState('');
  const initFilter = (() => {
    if (typeof window === 'undefined') return 'All';
    const s = new URLSearchParams(window.location.search).get('status');
    return ['Pro', 'Enterprise', 'Trial', 'Past due', 'Canceled', 'Active'].includes(s) ? s : 'All';
  })();
  const [filter, setFilter] = React.useState(initFilter);
  const FILTERS = ['All', 'Pro', 'Enterprise', 'Active', 'Trial', 'Past due', 'Comped', 'Internal', 'Canceled'];
  const inPages = typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname);
  const detailHref = inPages ? '66-Admin-account-detail.html' : 'pages/66-Admin-account-detail.html';

  const rows = ADM_ACCOUNTS.filter(a => {
    if (q && !(a.biz.toLowerCase().includes(q.toLowerCase()) || a.owner.toLowerCase().includes(q.toLowerCase()) || a.email.toLowerCase().includes(q.toLowerCase()))) return false;
    if (filter === 'All') return true;
    if (filter === 'Pro' || filter === 'Enterprise') return a.plan === filter;
    return a.status === filter;
  });
  const cols = '2.2fr 0.9fr 0.9fr 0.7fr 0.6fr 0.9fr 0.7fr 0.9fr';

  return (
    <AdminShell active="Accounts">
      <div className="k-adm-body">
        <div className="k-adm-sec-hd">
          <div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Accounts</h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>{ADM_ACCOUNTS.length} total · {ADM_ACCOUNTS.filter(a=>a.status==='Active').length} active · {ADM_ACCOUNTS.filter(a=>a.plan==='Enterprise').length} Enterprise</p>
          </div>
          <button className="k-btn" onClick={() => {
            const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
            const head = ['Business','Owner','Email','Location','Plan','Status','MRR','Age (months)','Lifetime value','Claims 30d','Claims total','Joined','Last active'];
            const lines = rows.map(a => [a.biz, a.owner, a.email, a.loc, a.plan, a.status, a.mrr, admAgeMonths(a.joined), admLTV(a), a.claims30, a.claimsTotal, a.joined, a.last].map(esc).join(','));
            const blob = new Blob([head.map(esc).join(',') + String.fromCharCode(10) + lines.join(String.fromCharCode(10))], { type: 'text/csv' });
            const u = URL.createObjectURL(blob);
            const el = document.createElement('a');
            el.href = u; el.download = 'kevin-accounts.csv'; el.click();
            URL.revokeObjectURL(u);
          }}><ADM_Icon d={ADM_I.download} size={13}/> Export CSV</button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--k-fg-4)' }}><ADM_Icon d={ADM_I.search} size={14} /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search business, owner, or email…" style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid var(--k-line)', borderRadius: 8, font: 'inherit', fontSize: 13, background: 'var(--k-bg)' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`k-tab ${filter === f ? 'k-tab--active' : ''}`} style={{ border: '1px solid var(--k-line)' }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <section className="k-set-card" style={{ padding: 0 }}>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': cols }}>
            <span>Account</span><span>Plan</span><span>Status</span><span>MRR</span><span>Age</span><span>Lifetime value</span><span>Claims 30d</span><span>Last active</span>
          </div>
          {rows.map(a => (
            <a key={a.id} href={detailHref} className="k-adm-tr" style={{ '--adm-cols': cols }}>
              <span className="k-adm-acct">
                <span className="k-adm-avatar">{a.owner.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.biz}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--k-fg-4)' }}>{a.owner} · {a.loc}</span>
                </span>
              </span>
              <span><ADM_Badge tone={a.plan === 'Enterprise' ? 'accent' : 'quiet'}>{a.plan}</ADM_Badge></span>
              <span><ADM_Badge tone={ADM_STATUS_TONE[a.status]} dot={true}>{a.status}</ADM_Badge></span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>{a.mrr ? '$' + a.mrr.toLocaleString() : '—'}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)' }}>{admAgeMonths(a.joined) >= 1 ? admAgeMonths(a.joined) + ' mo' : '<1 mo'}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>{admLTV(a) ? '$' + admLTV(a).toLocaleString() : '—'}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5, color: 'var(--k-fg-3)' }}>{a.claims30}</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{a.last}</span>
            </a>
          ))}
          {rows.length === 0 && <div style={{ padding: '28px', textAlign: 'center', color: 'var(--k-fg-4)', fontSize: 13 }}>No accounts match.</div>}
        </section>
      </div>
    </AdminShell>
  );
};

// ─── 3 · ACCOUNT DETAIL ─────────────────────────────────────────────────────
const AdminAccountDetail = () => {
  const a = ADM_ACCOUNTS[0]; // Reyes Adjusting · Mariana Reyes
  const inPages = typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname);
  const [comp, setComp] = React.useState(null); // {plan, until, reason} once comped
  const [compOpen, setCompOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ plan: 'Pro', until: '', reason: '' });
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);
  const MENU = [
    ['Reset password', ADM_I.link],
    ['Resend invite', ADM_I.plus],
    ['Export account data', ADM_I.download],
    ['Add internal note', ADM_I.spark],
  ];
  return (
    <AdminShell active="Accounts">
      <div className="k-adm-body">
        <a href={inPages ? '65-Admin-accounts.html' : 'pages/65-Admin-accounts.html'} className="k-link" style={{ fontSize: 12.5 }}>
          <ADM_Icon d={ADM_I.chevleft} size={11} /> All accounts
        </a>

        {/* Header */}
        <div className="k-adm-sec-hd" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="k-adm-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>MR</div>
            <div>
              <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '0 0 5px' }}>{a.biz}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
                <span>{a.owner}</span><span>·</span><span style={{ fontFamily: 'var(--k-font-mono)' }}>{a.email}</span>
                <ADM_Badge tone={a.plan === 'Enterprise' ? 'accent' : 'quiet'}>{a.plan}</ADM_Badge>
                <ADM_Badge tone={comp ? 'accent' : ADM_STATUS_TONE[a.status]} dot={true}>{comp ? 'Comped' : a.status}</ADM_Badge>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="k-btn k-btn--ghost" onClick={() => setMenuOpen(!menuOpen)}><ADM_Icon d={ADM_I.more} size={14}/></button>
              {menuOpen && (
                <div className="k-pop" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 200, zIndex: 40 }}>
                  {MENU.map(([label, icon], i) => (
                    <button key={i} className="k-menu-item" style={{ gap: 8 }} onClick={() => setMenuOpen(false)}>
                      <ADM_Icon d={icon} size={13} /> {label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'var(--k-line)', margin: '4px 0' }} />
                  <button className="k-menu-item k-menu-item--danger" style={{ gap: 8 }} onClick={() => setMenuOpen(false)}>
                    <ADM_Icon d={ADM_I.more} size={13} /> Transfer owner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <section className="k-set-card k-set-card--accent">
          <div className="k-set-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: 0 }}>
            {[
              ['Plan', 'Pro · $249/mo', 'Flat monthly'],
              ['Lifetime claims', a.claimsTotal.toLocaleString(), 'Since ' + a.joined],
              ['Claims · 30d', a.claims30, 'Above Pro median'],
              ['Last active', a.last, 'Worksheet'],
            ].map(([l, v, s], i) => (
              <div key={i} className="k-billing-cell" style={{ borderRight: i < 3 ? '1px solid var(--k-line)' : 0 }}>
                <div className="k-billing-l">{l}</div>
                <div className="k-billing-v">{v}</div>
                <div className="k-billing-s">{s}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="k-adm-split">
          {/* Subscription */}
          <section className="k-set-card">
            <div className="k-set-card-hd">Subscription &amp; billing</div>
            <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
              {[
                ['Plan', 'Pro — $249/mo flat'],
                ['Status', 'Active · auto-renews Jul 1, 2026'],
                ['Payment method', 'Visa •••• 4242 · exp 12/28'],
                ['Lifetime value', '$1,194 · 6 invoices paid'],
                ['First claim', 'Free (used Jan 2026)'],
              ].map(([l, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--k-line)' : 0, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--k-fg-3)' }}>{l}</span>
                  <span style={{ fontWeight: 500, fontFamily: l === 'Payment method' || l === 'Lifetime value' ? 'var(--k-font-mono)' : 'inherit' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, padding: '12px 16px' }}>
                <button className="k-btn k-btn--ghost">View invoices</button>
                <button className="k-btn k-btn--ghost">Issue refund</button>
                <button className="k-btn k-btn--ghost">Change plan</button>
                {comp
                  ? <button className="k-btn k-btn--ghost" onClick={() => setComp(null)} style={{ marginLeft: 'auto' }}>End comp</button>
                  : <button className="k-btn" onClick={() => { setDraft({ plan: 'Pro', until: '', reason: '' }); setCompOpen(true); }} style={{ marginLeft: 'auto' }}>Comp account</button>}
              </div>
              {comp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--k-line)', background: 'var(--k-accent-soft)', fontSize: 12.5 }}>
                  <ADM_Icon d={ADM_I.spark} size={13} />
                  <span><strong>Comped · {comp.plan}</strong> — $0/mo{comp.until ? ` through ${comp.until}` : ', no expiry'}. {comp.reason || 'No reason given.'} Excluded from MRR.</span>
                </div>
              )}
            </div>
          </section>

          {/* Usage */}
          <section className="k-set-card">
            <div className="k-set-card-hd">Usage</div>
            <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
              {[
                ['Claims processed', '168'],
                ['Items inventoried', '21,400'],
                ['Exports generated', '154'],
                ['Storage used', '38.2 GB'],
              ].map(([l, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 3 ? '1px solid var(--k-line)' : 0, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--k-fg-3)' }}>{l}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--k-font-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent activity / audit */}
        <section className="k-set-card" style={{ padding: 0 }}>
          <div className="k-set-card-hd" style={{ padding: '13px 16px' }}>Recent account activity</div>
          {[
            ['Exported CLM-2026-04412 (Godfrey — Kitchen fire)', '2 hours ago', ADM_I.download],
            ['Processed 60 photos → 57 items', '2 hours ago', ADM_I.spark],
            ['Started claim CLM-2026-04412', '3 hours ago', ADM_I.plus],
            ['Invoice INV-2026-006 paid · $249.00', 'Jun 1, 2026', ADM_I.check],
            ['Signed in from Hauppauge, NY', 'Jun 1, 2026', ADM_I.link],
          ].map(([t, when, icon], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--k-line)' }}>
              <span style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--k-bg-2)', color: 'var(--k-fg-3)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><ADM_Icon d={icon} size={13} /></span>
              <span style={{ flex: 1, fontSize: 13 }}>{t}</span>
              <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{when}</span>
            </div>
          ))}
        </section>

        {/* Danger zone */}
        <section className="k-set-card" style={{ borderColor: 'var(--k-warn-soft)' }}>
          <div className="k-set-card-hd">Danger zone</div>
          <div className="k-set-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)', maxWidth: 460 }}>Pausing stops billing and access at the customer\u2019s request (resume = pay + restart). Suspending blocks sign-in but keeps data \u2014 used for failed payments. Canceling ends billing at period end. Deleting is permanent after a 30-day grace window.</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="k-btn k-btn--ghost" title="Stops billing AND access at the customer's request — data untouched. Resuming requires payment and restarts the cycle.">Pause</button>
              <button className="k-btn k-btn--ghost">Suspend</button>
              <button className="k-btn k-btn--ghost k-btn--danger">Cancel subscription</button>
            </div>
          </div>
        </section>
      </div>

      {compOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.5)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'grid', placeItems: 'center' }} onClick={() => setCompOpen(false)}>
          <div className="k-set-card" style={{ width: 460, maxWidth: '92vw', background: 'var(--k-bg)' }} onClick={(e) => e.stopPropagation()}>
            <div className="k-set-card-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Comp this account</span>
              <button className="k-icon-btn" onClick={() => setCompOpen(false)}><ADM_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={14} /></button>
            </div>
            <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', margin: 0, lineHeight: 1.5 }}>
                Grants <strong>{a.biz}</strong> full product access at <strong>$0/mo</strong>. The account keeps every feature of the chosen plan but is excluded from MRR and revenue metrics. Written to the audit log.
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--k-fg-2)' }}>Access level</span>
                <select value={draft.plan} onChange={(e) => setDraft(d => ({ ...d, plan: e.target.value }))} className="k-input">
                  <option>Pro</option><option>Enterprise</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--k-fg-2)' }}>Expires <span style={{ color: 'var(--k-fg-4)', fontWeight: 400 }}>(optional — blank = no expiry)</span></span>
                <input type="text" value={draft.until} onChange={(e) => setDraft(d => ({ ...d, until: e.target.value }))} placeholder="e.g. Dec 31, 2026" className="k-input" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--k-fg-2)' }}>Reason</span>
                <input type="text" value={draft.reason} onChange={(e) => setDraft(d => ({ ...d, reason: e.target.value }))} placeholder="e.g. Design-partner beta" className="k-input" />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="k-btn k-btn--ghost" onClick={() => setCompOpen(false)}>Cancel</button>
                <button className="k-btn" onClick={() => { setComp({ plan: draft.plan, until: draft.until.trim(), reason: draft.reason.trim() }); setCompOpen(false); }}>Comp account</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

Object.assign(window, { AdminShell, AdminOverview, AdminAccounts, AdminAccountDetail, ADM_ACCOUNTS, ADM_STATUS_TONE, ADM_Wordmark, ADM_Icon, ADM_I, ADM_Badge });
