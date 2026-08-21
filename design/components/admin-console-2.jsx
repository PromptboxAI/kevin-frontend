// Owner admin console — part 2. Tier-1 (Revenue · Content · Platform) and
// Tier-2 (Support · Staff · System) screens. Loads AFTER admin-console.jsx,
// reusing window.AdminShell + window.ADM_* helpers and data.
// Static by design — engineering wires to the real backend.

const A2_Shell = window.AdminShell;
const A2_Icon  = window.ADM_Icon;
const A2_I     = window.ADM_I;
const A2_Badge = window.ADM_Badge;
const A2_ACCOUNTS = window.ADM_ACCOUNTS || [];
const A2_TONE  = window.ADM_STATUS_TONE || {};

const A2_Card = ({ title, action, children, pad = true }) => (
  <section className="k-set-card" style={pad ? undefined : { padding: 0 }}>
    {title && <div className="k-set-card-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{title}{action}</div>}
    {children}
  </section>
);

// ─── 4 · REVENUE ────────────────────────────────────────────────────────────
// One-time revenue — NOT MRR. Two sources: client-share paywall unlocks (a
// homeowner/heir pays to open a shared inventory) and done-for-you service
// claims (we build the inventory for the customer). Kept out of every MRR/NRR
// rollup by construction; production sums Stripe one-time charges.
const A2_SERVICES_30D = [
  ['Done-for-you claims', 3, 2850, 'Flat per-claim engagements — we run intake → export'],
  ['Client-share unlocks', 11, 539, 'Paywalled share links opened by clients ($49 each)'],
];

const AdminRevenue = () => {
  const pro = A2_ACCOUNTS.filter(a => a.plan === 'Pro' && a.mrr > 0);
  const ent = A2_ACCOUNTS.filter(a => a.plan === 'Enterprise');
  const proMrr = pro.reduce((s, a) => s + a.mrr, 0);
  const entMrr = ent.reduce((s, a) => s + a.mrr, 0);
  const mrr = proMrr + entMrr;
  return (
    <A2_Shell active="Revenue">
      <div className="k-adm-body">
        <div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Revenue</h1>
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Recurring revenue, movement, and what needs attention this month.</p>
        </div>

        <div className="k-adm-kpis">
          {[
            ['MRR', '$' + mrr.toLocaleString(), '+12.4% MoM', true],
            ['ARR (run-rate)', '$' + (mrr * 12).toLocaleString(), 'Annualized', true],
            ['One-time · 30d', '$' + A2_SERVICES_30D.reduce((t, r) => t + r[2], 0).toLocaleString(), 'Services + paywall unlocks', true],
            ['Net new MRR', '+$1,001', '4 new · 1 churned', true],
            ['Net revenue retention', '112%', 'Expansion > churn', true],
          ].map(([l, v, d, up], i) => (
            <div key={i} className="k-adm-kpi">
              <div className="k-adm-kpi-l">{l}</div>
              <div className="k-adm-kpi-v">{v}</div>
              <div className={`k-adm-kpi-d ${up ? 'k-adm-up' : 'k-adm-down'}`}><A2_Icon d={A2_I.upload} size={12} /> {d}</div>
            </div>
          ))}
        </div>

        <div className="k-adm-split">
          {/* MRR by plan */}
          <A2_Card title="MRR by plan" pad={false}>
            <div className="k-set-card-body">
              {[
                ['Enterprise', entMrr, ent.length + ' accounts', 'var(--k-accent)'],
                ['Pro', proMrr, pro.length + ' accounts', 'var(--k-ok)'],
              ].map(([l, v, sub, c], i) => (
                <div key={i} style={{ marginBottom: i === 0 ? 16 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{l} <span style={{ color: 'var(--k-fg-4)', fontWeight: 400 }}>· {sub}</span></span>
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontWeight: 600 }}>${v.toLocaleString()}/mo</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 99, background: 'var(--k-bg-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${(v / mrr) * 100}%`, height: '100%', background: c, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--k-line)', fontSize: 12, color: 'var(--k-fg-3)' }}>
                Enterprise is {Math.round((entMrr / mrr) * 100)}% of MRR from {ent.length} accounts — concentration to watch as Pro self-serve scales.
              </div>
            </div>
          </A2_Card>

          {/* Failed payments */}
          <A2_Card title="Needs attention" pad={false}>
            <div className="k-set-card-body" style={{ padding: 0 }}>
              {[
                ['Cunningham Loss Consulting', 'Payment failed · $249 · retrying', 'warn'],
                ['Three Rivers Adjusting', 'Canceled 31 days ago · win-back?', 'quiet'],
                ['Brightwater Estate Sales', 'Trial ends in 3 days', 'accent'],
              ].map(([who, what, tone], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < 2 ? '1px solid var(--k-line)' : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: tone === 'warn' ? 'var(--k-warn)' : tone === 'accent' ? 'var(--k-accent)' : 'var(--k-fg-4)', flex: '0 0 auto' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{who}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{what}</div>
                  </div>
                  <a className="k-btn k-btn--ghost" href={typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname) ? '66-Admin-account-detail.html' : 'pages/66-Admin-account-detail.html'}>Open</a>
                </div>
              ))}
            </div>
          </A2_Card>
        </div>

        {/* One-time: done-for-you services + client-share paywall */}
        <A2_Card title="Services & paywall · one-time, last 30 days" pad={false}>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': '2fr 0.8fr 1fr 3fr' }}>
            <span>Stream</span><span>Count</span><span>Revenue</span><span>What it is</span>
          </div>
          {A2_SERVICES_30D.map(([l, n, rev, sub], i) => (
            <div key={i} className="k-adm-tr" style={{ '--adm-cols': '2fr 0.8fr 1fr 3fr', cursor: 'default' }}>
              <span style={{ fontWeight: 600 }}>{l}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)' }}>{n}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontWeight: 600 }}>${rev.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{sub}</span>
            </div>
          ))}
          <div style={{ padding: '11px 16px', fontSize: 12, color: 'var(--k-fg-3)', borderTop: '1px solid var(--k-line)' }}>
            One-time revenue stays OUT of MRR, ARR and retention — those track subscriptions only. Paywall pricing and the done-for-you rate card live in Platform once the Stripe flow ships.
          </div>
        </A2_Card>

        {/* Enterprise contracts */}
        <A2_Card title="Enterprise contracts" action={<button className="k-btn">New invoice</button>} pad={false}>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': '2fr 1fr 1fr 1fr 1fr' }}>
            <span>Account</span><span>Annual value</span><span>Seats / volume</span><span>Renews</span><span>Status</span>
          </div>
          {[
            ['Cardinal TPA Services', '$45,600', 'Unlimited · 1 desk', 'Sep 2026', 'Active'],
            ['Gulf Coast Claims Group', '$28,800', 'Unlimited · 1 agency', 'Aug 2026', 'Active'],
          ].map((r, i) => (
            <div key={i} className="k-adm-tr" style={{ '--adm-cols': '2fr 1fr 1fr 1fr 1fr', cursor: 'default' }}>
              <span style={{ fontWeight: 600 }}>{r[0]}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)' }}>{r[1]}</span>
              <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{r[2]}</span>
              <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{r[3]}</span>
              <span><A2_Badge tone="ok" dot={true}>{r[4]}</A2_Badge></span>
            </div>
          ))}
        </A2_Card>
      </div>
    </A2_Shell>
  );
};

// ─── 5 · CONTENT (CMS) ──────────────────────────────────────────────────────
const AdminContent = () => {
  const PAGES = [
    ['Landing', 'Hero, social proof, stats, testimonials', '02-Landing.html', 'Mariana R.', '2 days ago'],
    ['Pricing', 'Pro / Enterprise tiers, FAQ', '21-Pricing.html', 'Kevin G.', '1 day ago'],
    ['About', 'Team bios, company stats', '39-About.html', 'Kevin G.', '4 hours ago'],
    ['Product overview', 'Surfaces, benefits', '37-Product-overview.html', 'Kevin G.', '3 hours ago'],
    ['Careers', 'Open roles, perks', '57-Careers.html', 'Kevin G.', '2 weeks ago'],
    ['Docs', 'Help articles', '22-Docs.html', 'Mariana R.', '6 days ago'],
    ['Legal', 'Privacy, Terms, DPA', '25-Legal-hub.html', 'Counsel', '1 month ago'],
  ];
  const inPages = typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname);
  return (
    <A2_Shell active="Content">
      <div className="k-adm-body">
        <div className="k-adm-sec-hd">
          <div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Content</h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Edit the public marketing &amp; help pages without touching code. Changes publish on save.</p>
          </div>
          <button className="k-btn"><A2_Icon d={A2_I.plus} size={13}/> New page</button>
        </div>

        <A2_Card pad={false}>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': '1.6fr 2fr 1fr 1fr 0.6fr' }}>
            <span>Page</span><span>What it controls</span><span>Last edited by</span><span>When</span><span></span>
          </div>
          {PAGES.map((p, i) => (
            <div key={i} className="k-adm-tr" style={{ '--adm-cols': '1.6fr 2fr 1fr 1fr 0.6fr', cursor: 'default' }}>
              <span style={{ fontWeight: 600 }}>{p[0]}</span>
              <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{p[1]}</span>
              <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{p[3]}</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{p[4]}</span>
              <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <a href={inPages ? p[2] : 'pages/' + p[2]} className="k-btn k-btn--ghost" target="_blank" rel="noreferrer">View</a>
                <button className="k-btn k-btn--ghost">Edit</button>
              </span>
            </div>
          ))}
        </A2_Card>

        <div className="k-adm-split">
          <A2_Card title="Editable blocks" pad={false}>
            <div className="k-set-card-body" style={{ padding: 0 }}>
              {[
                ['Testimonials', '6 quotes · drag to reorder'],
                ['Stats ribbon', '310+ claims · <3 min per run · 88% auto-priced'],
                ['Carrier logos', '13 “Settled with” logos'],
                ['FAQ', '6 questions on Pricing'],
              ].map(([l, s], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < 3 ? '1px solid var(--k-line)' : 0 }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div><div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{s}</div></div>
                  <button className="k-btn k-btn--ghost">Manage</button>
                </div>
              ))}
            </div>
          </A2_Card>
          <A2_Card title="Publishing">
            <div className="k-set-card-body">
              <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', margin: '0 0 12px', lineHeight: 1.55 }}>Edits save as a draft, then publish to the live site. Every change is versioned — roll back anytime.</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="k-btn">Preview draft</button>
                <button className="k-btn k-btn--ghost">Version history</button>
              </div>
            </div>
          </A2_Card>
        </div>
      </div>
    </A2_Shell>
  );
};

// ─── 6 · PLATFORM CONFIG ────────────────────────────────────────────────────
const AdminPlatform = () => (
  <A2_Shell active="Platform">
    <div className="k-adm-body">
      <div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Platform</h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>The global defaults Kevin ships to every account — pricing sources, carrier tables, and feature flags.</p>
      </div>

      <div className="k-adm-split">
        <A2_Card title="Comp source" pad={false}>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {[
              ['Google Shopping API', 'Unified', '99.6% uptime'],
              ['Immersive Product API', 'Unified', '99.4% uptime'],
              ['SerpApi quota', 'Capacity', '61% of plan'],
              ['Median resolution', 'Healthy', '±6.2% variance'],
              ['Brand-direct tiebreaker', 'Enabled', '>15% spread'],
            ].map(([n, w, up], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < 4 ? '1px solid var(--k-line)' : 0 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{n}</span>
                <A2_Badge tone={w === 'Unified' ? 'accent' : 'quiet'}>{w}</A2_Badge>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', minWidth: 84, textAlign: 'right' }}>{up}</span>
              </div>
            ))}
          </div>
        </A2_Card>

        <A2_Card title="Carrier depreciation tables" action={<button className="k-btn k-btn--ghost">Add carrier</button>} pad={false}>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {[
              ['Allstate', '24 classes', 'Updated Apr 2026'],
              ['State Farm', '24 classes', 'Updated Mar 2026'],
              ['Nationwide', '22 classes', 'Updated Feb 2026'],
              ['Travelers', '24 classes', 'Updated Apr 2026'],
              ['Chubb', '20 classes', 'Updated Jan 2026'],
            ].map(([n, c, u], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < 4 ? '1px solid var(--k-line)' : 0 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{n}</span>
                <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{c}</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{u}</span>
              </div>
            ))}
          </div>
        </A2_Card>
      </div>

      <A2_Card title="Special-limits thresholds" pad={false}>
        <div className="k-set-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: 0 }}>
          {[['Jewelry', '$1,500'], ['Firearms', '$2,500'], ['Fine arts', '$5,000'], ['Furs', '$1,500']].map(([l, v], i) => (
            <div key={i} className="k-billing-cell" style={{ borderRight: i < 3 ? '1px solid var(--k-line)' : 0 }}>
              <div className="k-billing-l">{l}</div>
              <div className="k-billing-v" style={{ fontSize: 22 }}>{v}</div>
              <div className="k-billing-s">Default cap · per-policy override</div>
            </div>
          ))}
        </div>
      </A2_Card>

      <A2_Card title="Feature flags" pad={false}>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          {[
            ['Estate sale mode', 'On for all', true],
            ['Mobile capture (PWA)', 'On for all', true],
            ['Live processing animation', 'On for all', true],
            ['Barcode auto-match v2', 'Beta · 12 accounts', false],
            ['Public API', 'Enterprise only', true],
          ].map(([l, s, on], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--k-line)' : 0 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div><div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{s}</div></div>
              <span style={{ width: 36, height: 20, borderRadius: 99, background: on ? 'var(--k-accent)' : 'var(--k-bg-2)', position: 'relative', flex: '0 0 auto', border: on ? 'none' : '1px solid var(--k-line)' }}>
                <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: '#fff', transition: 'left 0.15s' }} />
              </span>
            </div>
          ))}
        </div>
      </A2_Card>
    </div>
  </A2_Shell>
);

// ─── 7 · SUPPORT ────────────────────────────────────────────────────────────
const AdminSupport = () => {
  const TICKETS = [
    ['#1421', 'Export missing 3 model numbers', 'Cunningham Loss Consulting', 'Open', 'warn', '20m ago'],
    ['#1419', 'How do I switch to Enterprise?', 'Harbor Estate Liquidation', 'Open', 'warn', '1h ago'],
    ['#1417', 'Depreciation looks high on jewelry', 'Coastal Public Adjusters', 'Waiting', 'accent', '3h ago'],
    ['#1415', 'Can\'t upload .zip over 1GB', 'Meridian Adjusters', 'Open', 'warn', '5h ago'],
    ['#1410', 'Refund for double charge', 'Three Rivers Adjusting', 'Resolved', 'ok', '1d ago'],
    ['#1404', 'Add my license # to PDF export', 'Brightwater Estate Sales', 'Resolved', 'ok', '2d ago'],
  ];
  const THREADS = {
    '#1421': [['customer', 'The .xlsx I exported is missing model numbers on 3 TVs. Can you help?', '20m ago'], ['staff', 'Thanks — those 3 rows were flagged low-confidence on OCR. Re-run “Edit & re-price” on each and the model # will populate before export.', '12m ago']],
    '#1419': [['customer', 'We’re adding two more adjusters. How do we move to Enterprise?', '1h ago']],
    '#1417': [['customer', 'Depreciation on a diamond ring looks too high.', '3h ago'], ['staff', 'Jewelry is a special-limits class — it’s appraisal-required and never auto-priced. You can enter a custom value on that row.', '2h ago']],
    '#1415': [['customer', 'My .zip is 1.4GB and the upload fails.', '5h ago']],
    '#1410': [['customer', 'I was charged twice this month.', '1d ago'], ['staff', 'Confirmed a duplicate charge — refunded $249 to your card. Sorry about that.', '1d ago']],
    '#1404': [['customer', 'Can the PDF export include my adjuster license #?', '2d ago'], ['staff', 'Yes — add it under Settings → Profile and it prints in the PDF footer.', '2d ago']],
  };
  const [open, setOpen] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [inboxOpen, setInboxOpen] = React.useState(false);
  const inPages = typeof window !== 'undefined' && /\/pages\//.test(window.location.pathname);
  return (
    <A2_Shell active="Support">
      <div className="k-adm-body">
        <div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Support</h1>
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Email-based tickets and account audit access in one place. Customers reach you at <span style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-2)' }}>support@kevin.co</span> or the in-product Help button — each becomes a ticket here.</p>
        </div>

        <div className="k-adm-kpis">
          {[['Open tickets', String(TICKETS.filter(t => t[3] === 'Open').length)], ['Waiting on customer', String(TICKETS.filter(t => t[3] === 'Waiting').length)], ['Median first reply', '42m'], ['Resolved · 7d', '18']].map(([l, v], i) => (
            <div key={i} className="k-adm-kpi"><div className="k-adm-kpi-l">{l}</div><div className="k-adm-kpi-v">{v}</div></div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--k-line)', borderRadius: 12, background: 'var(--k-bg)' }}>
          <span style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--k-ok-soft)', color: 'var(--k-ok)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><A2_Icon d={A2_I.mail || <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>} size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>Connected inbox</span><A2_Badge tone="ok" dot={true}>Connected</A2_Badge></div>
            <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 2 }}>Google Workspace · <span style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-3)' }}>support@kevin.co</span> · synced 2m ago. New email lands here as a ticket; replies send from this address.</div>
          </div>
          <button className="k-btn k-btn--ghost" onClick={() => setInboxOpen(true)}>Reconnect</button>
          <button className="k-btn k-btn--ghost" onClick={() => setInboxOpen(true)}>Inbox settings</button>
        </div>

        <A2_Card title="Tickets" action={<button className="k-btn" onClick={() => setCreating(true)}><A2_Icon d={A2_I.plus} size={13}/> New ticket</button>} pad={false}>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': '0.6fr 2.2fr 1.4fr 1fr 0.8fr' }}>
            <span>ID</span><span>Subject</span><span>Account</span><span>Status</span><span>Updated</span>
          </div>
          {TICKETS.map((t, i) => (
            <div key={i} className="k-adm-tr k-adm-pipe-row" style={{ '--adm-cols': '0.6fr 2.2fr 1.4fr 1fr 0.8fr', cursor: 'pointer' }} onClick={() => setOpen(t)}>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-4)' }}>{t[0]}</span>
              <span style={{ fontWeight: 600 }}>{t[1]}</span>
              <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>{t[2]}</span>
              <span><A2_Badge tone={t[4]} dot={true}>{t[3]}</A2_Badge></span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{t[5]}</span>
            </div>
          ))}
        </A2_Card>

        <A2_Card title="Audit log access">
          <div className="k-set-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)', maxWidth: 520 }}>Every account keeps a signed who-changed-what-when log. Look one up to investigate a dispute or support ticket — read-only, and your access is itself logged.</span>
            <button className="k-btn">Look up an audit log</button>
          </div>
        </A2_Card>
      </div>
      {open && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setOpen(null)}>
          <div style={{ width: 560, maxWidth: '94vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-4)' }}>{open[0]}</span><A2_Badge tone={open[4]} dot={true}>{open[3]}</A2_Badge></div>
                <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 21, letterSpacing: '-0.02em', margin: '7px 0 2px' }}>{open[1]}</h2>
                <div style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{open[2]}</div>
              </div>
              <button className="k-icon-btn" onClick={() => setOpen(null)}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--k-line)', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)', display: 'flex', alignItems: 'center', gap: 5 }}><A2_Icon d={A2_I.mail || <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>} size={13} /> Email · support@kevin.co</span>
              <div style={{ flex: 1 }} />
              <a href={inPages ? '66-Admin-account-detail.html' : 'pages/66-Admin-account-detail.html'} className="k-btn k-btn--ghost">Open account</a>
              <button className="k-btn k-btn--ghost">{open[3] === 'Resolved' ? 'Reopen' : 'Mark resolved'}</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(THREADS[open[0]] || []).map((m, i) => (
                <div key={i} style={{ alignSelf: m[0] === 'staff' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', margin: '0 4px 3px', textAlign: m[0] === 'staff' ? 'right' : 'left', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m[0] === 'staff' ? 'Kevin support' : open[2]} · {m[2]}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, padding: '10px 13px', borderRadius: 12, background: m[0] === 'staff' ? 'var(--k-accent-soft)' : 'var(--k-bg-2)', color: 'var(--k-fg-2)' }}>{m[1]}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--k-line)' }}>
              <textarea placeholder="Write a reply — sends as an email to the customer…" rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8, fontSize: 13, resize: 'vertical', background: 'var(--k-bg)', color: 'var(--k-fg)', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Sends from support@kevin.co</span>
                <div style={{ flex: 1 }} />
                <button className="k-btn k-btn--ghost">Send & keep open</button>
                <button className="k-btn">Send & resolve</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {creating && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setCreating(false)}>
          <div style={{ width: 480, maxWidth: '92vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
              <div style={{ flex: 1 }}><div className="k-adm-kpi-l">New ticket</div><h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', margin: '6px 0 0' }}>Log a ticket for a customer</h2></div>
              <button className="k-icon-btn" onClick={() => setCreating(false)}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><div className="k-adm-kpi-l" style={{ marginBottom: 6 }}>Account</div><input placeholder="Search business or email…" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8, fontSize: 13, background: 'var(--k-bg)', color: 'var(--k-fg)' }} /></div>
              <div><div className="k-adm-kpi-l" style={{ marginBottom: 6 }}>Subject</div><input placeholder="Short summary" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8, fontSize: 13, background: 'var(--k-bg)', color: 'var(--k-fg)' }} /></div>
              <div><div className="k-adm-kpi-l" style={{ marginBottom: 6 }}>Details</div><textarea rows={5} placeholder="What does the customer need?" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8, fontSize: 13, resize: 'vertical', background: 'var(--k-bg)', color: 'var(--k-fg)', fontFamily: 'inherit' }} /></div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Most tickets arrive by email to support@kevin.co or the in-product Help button. Use this to log one that came in by phone.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--k-line)' }}>
              <div style={{ flex: 1 }} /><button className="k-btn k-btn--ghost" onClick={() => setCreating(false)}>Cancel</button><button className="k-btn" onClick={() => setCreating(false)}>Create ticket</button>
            </div>
          </div>
        </div>
      )}
      {inboxOpen && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setInboxOpen(false)}>
          <div style={{ width: 480, maxWidth: '92vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
              <div style={{ flex: 1 }}><div className="k-adm-kpi-l">Inbox settings</div><h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', margin: '6px 0 0' }}>Connected inbox</h2></div>
              <button className="k-icon-btn" onClick={() => setInboxOpen(false)}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px', border: '1px solid var(--k-line)', borderRadius: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--k-ok-soft)', color: 'var(--k-ok)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><A2_Icon d={A2_I.mail || <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>} size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Google Workspace</div><div style={{ fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>support@kevin.co</div></div>
                <A2_Badge tone="ok" dot={true}>Connected</A2_Badge>
              </div>
              <div>
                <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Connection</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="k-btn k-btn--ghost" style={{ justifyContent: 'flex-start' }}><A2_Icon d={A2_I.link} size={13} /> Reconnect — opens Google sign-in (OAuth)</button>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Re-grants Gmail access if the token expired or the scope changed. You’ll pick the Google account and approve on Google’s screen.</div>
                </div>
              </div>
              <div>
                <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Options</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8 }}><input type="checkbox" defaultChecked /><span style={{ fontSize: 12.5 }}>Auto-create a ticket from every new email</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8, marginTop: 8 }}><input type="checkbox" defaultChecked /><span style={{ fontSize: 12.5 }}>Append signature to outgoing replies</span></label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--k-line)' }}>
              <button className="k-btn k-btn--ghost" style={{ color: 'var(--k-danger)' }}>Disconnect inbox</button>
              <div style={{ flex: 1 }} />
              <button className="k-btn" onClick={() => setInboxOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </A2_Shell>
  );
};

// ─── 8 · STAFF & ROLES ──────────────────────────────────────────────────────
const A2_ROLES = ['Owner', 'Admin', 'Support', 'Service account'];
const A2_SCOPES = ['Accounts', 'Revenue', 'Content', 'Platform', 'Support', 'System', 'Staff', 'Billing'];
const A2_ROLE_SCOPES = {
  'Owner': ['Accounts', 'Revenue', 'Content', 'Platform', 'Support', 'System', 'Staff', 'Billing'],
  'Admin': ['Accounts', 'Revenue', 'Content', 'Platform', 'Support', 'System'],
  'Support': ['Accounts', 'Content', 'Support'],
  'Service account': ['Platform', 'System'],
};

const A2_StaffDrawer = ({ member, role, onClose }) => {
  const [sel, setSel] = React.useState(member ? member[2] : (role || 'Admin'));
  React.useEffect(() => { setSel(member ? member[2] : (role || 'Admin')); }, [member, role]);
  if (!member && !role) return null;
  const isRole = !member;
  const scopes = A2_ROLE_SCOPES[isRole ? role : sel] || [];
  return (
    <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 480, maxWidth: '92vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
          <div style={{ flex: 1 }}>
            <div className="k-adm-kpi-l">{isRole ? 'Edit role' : 'Edit member'}</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', margin: '6px 0 2px' }}>{isRole ? role : member[0]}</h2>
            {!isRole && <div style={{ fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{member[1]}</div>}
          </div>
          <button className="k-icon-btn" onClick={onClose}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isRole && (
            <div>
              <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Role</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {A2_ROLES.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid ' + (sel === r ? 'var(--k-accent)' : 'var(--k-line)'), borderRadius: 8, cursor: 'pointer', background: sel === r ? 'var(--k-accent-soft)' : 'transparent' }}>
                    <input type="radio" name="role" checked={sel === r} onChange={() => setSel(r)} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Access {isRole ? '' : '· from role'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {A2_SCOPES.map(sc => {
                const on = scopes.includes(sc);
                return (
                  <label key={sc} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--k-line)', borderRadius: 7, opacity: isRole ? 1 : 0.85 }}>
                    <input type="checkbox" checked={on} readOnly />
                    <span style={{ fontSize: 12.5 }}>{sc}</span>
                  </label>
                );
              })}
            </div>
            {!isRole && <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 8 }}>Access follows the role. Change the role above, or edit the role itself to adjust its scopes for everyone.</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--k-line)' }}>
          {!isRole && member[2] !== 'Owner' && <button className="k-btn k-btn--ghost" style={{ color: 'var(--k-danger)' }}>Remove member</button>}
          <div style={{ flex: 1 }} />
          <button className="k-btn k-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="k-btn" onClick={onClose}>Save changes</button>
        </div>
      </div>
    </div>
  );
};

const AdminStaff = () => {
  const [editMember, setEditMember] = React.useState(null);
  const [editRole, setEditRole] = React.useState(null);
  const [inviting, setInviting] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('Support');
  const STAFF = [
    ['Kevin Godfrey', 'kevin@kevin.co', 'Owner', 'Full access', 'KG', 'now'],
    ['Sam Okafor', 'sam@kevin.co', 'Support', 'Accounts · Support · Content', 'SO', '2h ago'],
    ['Dev (service)', 'api@kevin.co', 'Service account', 'Platform · System (API)', 'DV', '5m ago'],
  ];
  return (
    <A2_Shell active="Staff">
      <div className="k-adm-body">
        <div className="k-adm-sec-hd">
          <div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>Staff &amp; roles</h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Who on your team can reach the admin console, and what they can do.</p>
          </div>
          <button className="k-btn" onClick={() => { setInviteEmail(''); setInviteRole('Support'); setInviting(true); }}><A2_Icon d={A2_I.plus} size={13}/> Invite staff</button>
        </div>

        <A2_Card pad={false}>
          <div className="k-adm-tbl-hd" style={{ '--adm-cols': '1.6fr 1.4fr 1fr 1.4fr 0.6fr' }}>
            <span>Member</span><span>Email</span><span>Role</span><span>Access</span><span>Active</span>
          </div>
          {STAFF.map((s, i) => (
            <div key={i} className="k-adm-tr" style={{ '--adm-cols': '1.6fr 1.4fr 1fr 1.4fr 0.6fr', cursor: 'pointer' }} onClick={() => setEditMember(s)}>
              <span className="k-adm-acct">
                <span className="k-adm-avatar">{s[4]}</span>
                <span style={{ fontWeight: 600 }}>{s[0]}</span>
              </span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)' }}>{s[1]}</span>
              <span><A2_Badge tone={s[2] === 'Owner' ? 'accent' : 'quiet'}>{s[2]}</A2_Badge></span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{s[3]}</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}><span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{s[5]}</span><A2_Icon d={<path d="m9 6 6 6-6 6"/>} size={13} style={{ color: 'var(--k-fg-4)' }} /></span>
            </div>
          ))}
        </A2_Card>

        <A2_Card title="Roles" pad={false}>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {[
              ['Owner', 'Everything, including billing, staff, and deletion. That\'s you.'],
              ['Admin', 'Accounts, revenue, content, platform — no staff management or deletion.'],
              ['Support', 'Accounts (read-only), support tickets, content. No revenue or platform. Diagnoses from the back office — never by signing in as a customer.'],
              ['Service account', 'Programmatic access for integrations. Scoped API keys only.'],
            ].map(([l, s], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < 3 ? '1px solid var(--k-line)' : 0 }}>
                <div style={{ maxWidth: 560 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div><div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{s}</div></div>
                <button className="k-btn k-btn--ghost" onClick={() => setEditRole(l)}>Edit</button>
              </div>
            ))}
          </div>
        </A2_Card>
      </div>
      <A2_StaffDrawer member={editMember} onClose={() => setEditMember(null)} />
      <A2_StaffDrawer role={editRole} onClose={() => setEditRole(null)} />
      {inviting && (
        <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setInviting(false)}>
          <div style={{ width: 480, maxWidth: '92vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
              <div style={{ flex: 1 }}>
                <div className="k-adm-kpi-l">Invite staff</div>
                <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', margin: '6px 0 0' }}>Add a team member</h2>
              </div>
              <button className="k-icon-btn" onClick={() => setInviting(false)}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Work email</div>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@kevin.co" autoFocus style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--k-line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--k-font-mono)', background: 'var(--k-bg)', color: 'var(--k-fg)' }} />
                <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 7 }}>We email an invite link. They set their own name and password on first sign-in — the email you enter here becomes their login.</div>
              </div>
              <div>
                <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Role</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {A2_ROLES.filter(r => r !== 'Owner').map(r => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid ' + (inviteRole === r ? 'var(--k-accent)' : 'var(--k-line)'), borderRadius: 8, cursor: 'pointer', background: inviteRole === r ? 'var(--k-accent-soft)' : 'transparent' }}>
                      <input type="radio" name="inviterole" checked={inviteRole === r} onChange={() => setInviteRole(r)} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--k-line)' }}>
              <div style={{ flex: 1 }} />
              <button className="k-btn k-btn--ghost" onClick={() => setInviting(false)}>Cancel</button>
              <button className="k-btn" disabled={!/.+@.+\..+/.test(inviteEmail)} onClick={() => setInviting(false)}>Send invite</button>
            </div>
          </div>
        </div>
      )}
    </A2_Shell>
  );
};

const A2_SERVICES = {
  'Vision pipeline': {
    metric: '142,901 photos today · p95 3.1s', tone: 'ok',
    components: [
      ['Detect & crop', 'ok', 'Isolates one item per photo', 'p95 0.9s'],
      ['Item match (make/model)', 'ok', 'Vision → catalog match', '87.2% match'],
      ['OCR (model # / barcode)', 'warn', '2 photos failed today · low-res', '0.1% fail'],
      ['Auto-group', 'ok', 'Clusters multi-angle shots of one item', 'p95 1.2s'],
    ],
    resolve: ['Failures land in the Error queue below — Retry re-runs just the failed stage.', 'Persistent OCR misses (blur / glare) are re-shot by the adjuster or entered manually; they never block the claim.'],
  },
  'Pricing comps': {
    metric: 'Aggregator healthy · median resolving', tone: 'ok',
    components: [
      ['Google Shopping (SerpApi)', 'ok', 'Primary comp source', '210ms'],
      ['Immersive Product API', 'ok', 'Offer detail + merchant links', '260ms'],
      ['Median resolution', 'ok', '±6.2% variance', '18ms'],
      ['Brand-direct tiebreaker', 'ok', 'manufacturer.com', '190ms'],
    ],
    resolve: ['If the aggregator returns no usable offers, the item is flagged needs_manual rather than priced off a weak comp.', 'Check SerpApi quota and key health in Platform → Comp source; a quota block shows as elevated no-match rates.'],
  },
  'Exports': {
    metric: '1,240 generated today · p95 42s', tone: 'ok',
    components: [
      ['XactContents .xlsx', 'ok', 'Contents template', 'p95 38s'],
      ['PDF inventory', 'ok', 'Printable report', 'p95 44s'],
      ['Share link', 'ok', 'Signed, expiring URL', 'p95 0.4s'],
      ['Export worker queue', 'ok', 'Depth 12 · autoscaling', 'healthy'],
    ],
    resolve: ['A backlog means the worker queue is deep — autoscaling adds workers; exports complete once dequeued.', 'A single failed export can be re-run from the claim’s Export dialog.'],
  },
  'API & webhooks': {
    metric: '99.98% · 30d · 1.2M calls', tone: 'ok',
    components: [
      ['REST API /v1', 'ok', 'Claims, items, exports', '99.99%'],
      ['XactAnalysis webhook', 'ok', 'Outbound claim/estimate payloads', 'last 2m ago'],
      ['Reprice callback', 'ok', 'POST /reprice results', 'last 40s ago'],
      ['Export-ready webhook', 'ok', 'Fires when a bundle is built', 'last 5m ago'],
      ['Auth / token service', 'ok', 'API keys & OAuth', '99.99%'],
    ],
    resolve: ['Each hook shows last-fired + delivery rate — a red one names the exact endpoint.', 'Failed deliveries auto-retry with backoff; inspect payloads and replay from Platform → API logs.'],
  },
  'Image storage': {
    metric: 'Degraded · elevated latency · us-east', tone: 'warn', incident: 'image-storage',
    components: [
      ['us-east bucket', 'warn', 'p99 read latency ~4s', 'degraded'],
      ['us-west replica', 'ok', 'Healthy · failover target', 'p99 0.3s'],
      ['Upload ingest', 'ok', 'Writes succeeding', 'ok'],
      ['CDN cache', 'ok', 'Serving cached thumbs', '96% hit'],
    ],
    resolve: ['Open the linked incident for the live timeline and failover steps.', 'Fail reads over to the us-west replica (one toggle) if latency persists >30m.'],
  },
};

const A2_ServiceDrawer = ({ svc, name, onOpenIncident, onClose }) => {
  if (!svc) return null;
  return (
    <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 560, maxWidth: '92vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
          <div style={{ flex: 1 }}>
            <A2_Badge tone={svc.tone} dot={true}>{svc.tone === 'ok' ? 'Operational' : 'Degraded'}</A2_Badge>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', margin: '8px 0 2px' }}>{name}</h2>
            <div style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{svc.metric}</div>
          </div>
          <button className="k-icon-btn" onClick={onClose}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Components</div>
            <div style={{ border: '1px solid var(--k-line)', borderRadius: 10, overflow: 'hidden' }}>
              {svc.components.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderBottom: i < svc.components.length - 1 ? '1px solid var(--k-line)' : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: c[1] === 'ok' ? 'var(--k-ok)' : 'var(--k-warn)', flex: '0 0 auto' }} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{c[0]}</div><div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{c[2]}</div></div>
                  <span style={{ fontSize: 11, color: c[1] === 'ok' ? 'var(--k-fg-4)' : 'var(--k-warn)', fontFamily: 'var(--k-font-mono)', whiteSpace: 'nowrap' }}>{c[3]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>How to resolve</div>
            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {svc.resolve.map((s, i) => <li key={i} style={{ fontSize: 12.5, color: 'var(--k-fg-2)', lineHeight: 1.45 }}>{s}</li>)}
            </ol>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--k-line)' }}>
          {svc.incident && <button className="k-btn" onClick={() => onOpenIncident(svc.incident)}>Open incident</button>}
          <div style={{ flex: 1 }} />
          <button className="k-btn k-btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── 9 · SYSTEM / STATUS ────────────────────────────────────────────────────
const A2_INCIDENTS = {
  'image-storage': {
    title: 'Image storage latency', service: 'Image storage', sev: 'Minor · degraded', tone: 'warn', open: true,
    impact: 'Photo uploads and lightbox loads in us-east are slow (~4s). No data loss; processing still completes. New claims in other regions unaffected.',
    runbook: ['Confirm the alert in the storage dashboard (us-east bucket p99 latency).', 'Fail reads over to the us-west replica — one toggle, no redeploy.', 'If latency persists >30m, page the on-call infra engineer.', 'Post a status update so affected accounts see it in-app.'],
    timeline: [
      ['Auto-detected', 'p99 read latency crossed 3s on us-east', '40m ago'],
      ['Acknowledged', 'On-call paged · investigating replica failover', '31m ago'],
    ],
  },
  'wayfair': {
    title: 'SerpApi comp latency elevated', service: 'Pricing comps', sev: 'Resolved', tone: 'ok', open: false,
    impact: 'The aggregator responded slowly for ~5 hours. Comps still resolved, so RCV medians were unaffected — items took longer to price and a small number retried.',
    runbook: ['Kevin retries a slow comp request up to 3 times before flagging the item needs_manual — no data is lost.', 'Check SerpApi status and account quota in Platform → Comp source; open a provider ticket if latency persists past an hour.'],
    timeline: [
      ['Auto-detected', 'Comp request p95 above threshold', 'Jun 24, 9:12a'],
      ['Auto-mitigated', 'Retry budget raised · requests queued', 'Jun 24, 9:12a'],
      ['Resolved', 'Provider latency recovered', 'Jun 24, 2:40p'],
    ],
  },
  'export-backlog': {
    title: 'Export queue backlog', service: 'Exports', sev: 'Resolved', tone: 'ok', open: false,
    impact: 'Export generation queued behind a traffic spike; .xlsx bundles took up to 8 min instead of <1 min. All exports eventually completed.',
    runbook: ['Scale export workers (autoscaling now covers this pattern).', 'No customer action — exports complete once dequeued.'],
    timeline: [
      ['Auto-detected', 'Export queue depth > 500', 'Jun 19, 4:02p'],
      ['Mitigated', 'Added 4 export workers', 'Jun 19, 4:20p'],
      ['Resolved', 'Queue drained', 'Jun 19, 5:05p'],
    ],
  },
};

const A2_IncidentDrawer = ({ inc, onClose }) => {
  if (!inc) return null;
  return (
    <div className="k-export-stage" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 520, maxWidth: '92vw', height: '100%', background: 'var(--k-bg)', borderLeft: '1px solid var(--k-line)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--k-line)' }}>
          <div style={{ flex: 1 }}>
            <A2_Badge tone={inc.tone} dot={true}>{inc.sev}</A2_Badge>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', margin: '8px 0 2px' }}>{inc.title}</h2>
            <div style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>Affected service · {inc.service}</div>
          </div>
          <button className="k-icon-btn" onClick={onClose}><A2_Icon d={<path d="M6 6l12 12M18 6 6 18"/>} size={15} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="k-adm-kpi-l" style={{ marginBottom: 6 }}>Impact</div>
            <p style={{ fontSize: 13, color: 'var(--k-fg-2)', margin: 0, lineHeight: 1.5 }}>{inc.impact}</p>
          </div>
          <div>
            <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>How to resolve</div>
            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {inc.runbook.map((s, i) => <li key={i} style={{ fontSize: 12.5, color: 'var(--k-fg-2)', lineHeight: 1.45 }}>{s}</li>)}
            </ol>
          </div>
          <div>
            <div className="k-adm-kpi-l" style={{ marginBottom: 8 }}>Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {inc.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--k-line)' : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--k-accent)', marginTop: 5, flex: '0 0 auto' }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{t[0]}</div><div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{t[1]}</div></div>
                  <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', whiteSpace: 'nowrap' }}>{t[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--k-line)' }}>
          {inc.open ? (<>
            <button className="k-btn k-btn--ghost">Post status update</button>
            <div style={{ flex: 1 }} />
            <button className="k-btn">Mark resolved</button>
          </>) : (<>
            <span style={{ fontSize: 12, color: 'var(--k-fg-4)', alignSelf: 'center' }}>Resolved · read-only</span>
            <div style={{ flex: 1 }} />
            <button className="k-btn k-btn--ghost" onClick={onClose}>Close</button>
          </>)}
        </div>
      </div>
    </div>
  );
};

const AdminSystem = () => {
  const [incKey, setIncKey] = React.useState(null);
  const [svcKey, setSvcKey] = React.useState(null);
  const [refQ, setRefQ] = React.useState('');
  const [queue, setQueue] = React.useState([
    { id: 'EXP-2026-1142',  biz: 'Long Island Public Adjusters', err: 'Export failed · XLSX_WRITE_TIMEOUT', stage: 'Export → rebuild the XactContents workbook', state: 'failed' },
    { id: 'CLM-2026-05120', biz: 'Gulf Coast Claims', err: '2 photos failed OCR', stage: 'Vision → re-run OCR on the 2 failed photos', state: 'failed' },
    { id: 'CLM-2026-05301', biz: 'Cardinal TPA',      err: 'Comp source timeout',  stage: 'Pricing → re-fetch comps for affected items', state: 'failed' },
    { id: 'CLM-2026-04999', biz: 'Meridian Adjusters', err: '.zip partially corrupt', stage: 'Ingest → re-unpack the archive', state: 'blocked' },
  ]);
  const retry = (i) => setQueue(q => q.map((r, j) => j === i ? { ...r, state: 'retrying' } : r));

  return (
  <A2_Shell active="System">
    <div className="k-adm-body">
      <div className="k-adm-sec-hd">
        <div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '0 0 4px' }}>System</h1>
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Pipeline health, incidents, and the processing error queue.</p>
        </div>
        <A2_Badge tone="warn" dot={true}>1 service degraded</A2_Badge>
      </div>

      <A2_Card title="Service status" pad={false}>
        <div className="k-set-card-body" style={{ padding: 0 }}>
          {[
            ['Vision pipeline', 'Operational', '142,901 photos today', 'ok'],
            ['Pricing comps', 'Operational', 'Aggregator healthy', 'ok'],
            ['Exports', 'Operational', '1,240 generated today', 'ok'],
            ['API & webhooks', 'Operational', '99.98% · 30d', 'ok'],
            ['Image storage', 'Degraded', 'Elevated latency · us-east', 'warn'],
          ].map(([l, st, sub, tone], i) => {
            const style = { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < 4 ? '1px solid var(--k-line)' : 0 };
            return (
            <button key={i} className="k-adm-pipe-row" style={{ ...style, width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: style.borderBottom, cursor: 'pointer' }} onClick={() => setSvcKey(l)}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: tone === 'ok' ? 'var(--k-ok)' : 'var(--k-warn)', flex: '0 0 auto' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>{sub}</span>
              <A2_Badge tone={tone} dot={false}>{st}</A2_Badge>
              <A2_Icon d={<path d="m9 6 6 6-6 6"/>} size={13} style={{ color: 'var(--k-fg-4)' }} />
            </button>
          )})}
        </div>
      </A2_Card>

      <div className="k-adm-split">
        <A2_Card title="Error queue · 6 claims" action={<button className="k-btn k-btn--ghost" onClick={() => setQueue(q => q.map(r => r.state === 'failed' ? { ...r, state: 'retrying' } : r))}>Retry all</button>} pad={false}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--k-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 6 }}>
              <A2_Icon d={A2_I.search} size={13} />
              <input
                value={refQ}
                onChange={(e) => setRefQ(e.target.value)}
                placeholder="Look up a reference — EXP-2026-1142 or CLM-2026-04412"
                style={{ border: 0, outline: 0, background: 'transparent', flex: 1, font: 'inherit', fontSize: 12.5, fontFamily: 'var(--k-font-mono)' }} />
              {refQ && <button className="k-link" onClick={() => setRefQ('')}>Clear</button>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 6 }}>
              Matches the reference a customer quotes from an export-failure or processing-error screen.
            </div>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--k-line)', fontSize: 11.5, color: 'var(--k-fg-4)', lineHeight: 1.45 }}>
            Retry re-runs only the failed stage — earlier work is kept. If it fails 3× it's marked <strong style={{ color: 'var(--k-fg-3)' }}>blocked</strong> for manual fix (e.g. re-upload a corrupt .zip); the adjuster is notified and the claim never silently drops.
          </div>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {queue.filter((r) => !refQ.trim() || (r.id + ' ' + r.biz + ' ' + r.err).toLowerCase().includes(refQ.trim().toLowerCase())).length === 0 && (
              <div style={{ padding: '18px 16px', fontSize: 12, color: 'var(--k-fg-4)' }}>
                No job matches “{refQ.trim()}”. References older than 90 days live in the job archive.
              </div>
            )}
            {queue.filter((r) => !refQ.trim() || (r.id + ' ' + r.biz + ' ' + r.err).toLowerCase().includes(refQ.trim().toLowerCase())).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < queue.length - 1 ? '1px solid var(--k-line)' : 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--k-font-mono)' }}>{r.id}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{r.biz} · {r.err}</div>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-3)', marginTop: 3 }}><span style={{ color: 'var(--k-fg-4)' }}>Retry runs:</span> {r.stage}</div>
                </div>
                {r.state === 'retrying'
                  ? <A2_Badge tone="accent" dot={true}>Retrying…</A2_Badge>
                  : r.state === 'blocked'
                    ? <button className="k-btn k-btn--ghost" onClick={() => setIncKey('image-storage')}>Open claim</button>
                    : <button className="k-btn k-btn--ghost" onClick={() => retry(i)}>Retry</button>}
              </div>
            ))}
            <a href="#" className="k-link" style={{ display: 'block', padding: '11px 16px', fontSize: 12, borderTop: '1px solid var(--k-line)' }}>View all 6 →</a>
          </div>
        </A2_Card>

        <A2_Card title="Recent incidents" pad={false}>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {[
              ['Image storage latency', 'Investigating · started 40m ago', 'warn', 'image-storage'],
              ['SerpApi comp latency elevated', 'Resolved · Jun 24', 'ok', 'wayfair'],
              ['Export queue backlog', 'Resolved · Jun 19', 'ok', 'export-backlog'],
            ].map((r, i) => (
              <button key={i} className="k-adm-pipe-row" style={{ display: 'flex', width: '100%', textAlign: 'left', background: 'none', border: 0, alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--k-line)' : 0, cursor: 'pointer' }} onClick={() => setIncKey(r[3])}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: r[2] === 'ok' ? 'var(--k-ok)' : 'var(--k-warn)', flex: '0 0 auto' }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{r[0]}</div><div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{r[1]}</div></div>
                <A2_Icon d={<path d="m9 6 6 6-6 6"/>} size={13} style={{ color: 'var(--k-fg-4)' }} />
              </button>
            ))}
          </div>
        </A2_Card>
      </div>
    </div>
    <A2_IncidentDrawer inc={incKey ? A2_INCIDENTS[incKey] : null} onClose={() => setIncKey(null)} />
    <A2_ServiceDrawer svc={svcKey ? A2_SERVICES[svcKey] : null} name={svcKey} onClose={() => setSvcKey(null)} onOpenIncident={(k) => { setSvcKey(null); setIncKey(k); }} />
  </A2_Shell>
  );
};

Object.assign(window, { AdminRevenue, AdminContent, AdminPlatform, AdminSupport, AdminStaff, AdminSystem });
