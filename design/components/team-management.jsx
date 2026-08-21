// Team management — invite members, roles, claim assignments

const { KevinWordmark, Icon, I, Badge } = window;

const ROLES = {
  owner:    { label: 'Owner',         tone: 'accent', perms: 'Everything' },
  admin:    { label: 'Admin',         tone: 'accent', perms: 'All except billing' },
  adjuster: { label: 'Adjuster',      tone: 'quiet',  perms: 'Create + edit own claims, export, view team claims' },
  reviewer: { label: 'Reviewer',      tone: 'quiet',  perms: 'View + comment on any claim, no edits' },
  guest:    { label: 'Read-only',     tone: 'quiet',  perms: 'View specific claims shared with them' },
};

const MEMBERS = [
  { name: 'Mariana Reyes',  email: 'mariana@reyesadjusting.com',     role: 'owner',    claims:  47, last: 'Active now',        joined: 'Mar 2024', avatar: 'MR', you: true },
  { name: 'Jin Tanaka',     email: 'jin@reyesadjusting.com',         role: 'admin',    claims:  31, last: '8m ago',            joined: 'May 2024', avatar: 'JT' },
  { name: 'Anabel Mendez',  email: 'anabel@reyesadjusting.com',      role: 'adjuster', claims:  18, last: '2h ago',            joined: 'Jul 2024', avatar: 'AM' },
  { name: 'Dev Patel',      email: 'dev@reyesadjusting.com',         role: 'adjuster', claims:  22, last: 'Yesterday',         joined: 'Oct 2024', avatar: 'DP' },
  { name: 'Sun-mi Park',    email: 'sunmi@reyesadjusting.com',       role: 'adjuster', claims:   9, last: '3d ago',            joined: 'Jan 2025', avatar: 'SP' },
  { name: 'R. Caldwell',    email: 'rcaldwell@reyesadjusting.com',     role: 'reviewer', claims:   0, last: '1w ago',            joined: 'Sep 2024', avatar: 'RC' },
  { name: 'L. Vasquez',     email: 'lvasquez@reyesadjusting.com',       role: 'reviewer', claims:   0, last: '3w ago',            joined: 'Nov 2024', avatar: 'LV' },
];

const PENDING = [
  { email: 'theo@reyesadjusting.com',  role: 'adjuster', invitedBy: 'M. Reyes',  sent: '2d ago',   expires: 'in 5d' },
  { email: 'cwatts@reyesadjusting.com',        role: 'reviewer', invitedBy: 'J. Tanaka', sent: '6d ago',   expires: 'in 1d', warn: true },
];

const TeamManagement = () => (
  <div className="k-settings">
    <header className="k-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <KevinWordmark size={16} suffix={true} />
        <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
        <window.TopNavTabs active="Settings" />
      </div>
      <window.AvatarMenu />
    </header>

    <div className="k-settings-body">
      <aside className="k-settings-side">
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Settings</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: '4px 0 0' }}>Agency settings</h2>
        </div>
        <nav style={{ padding: '4px 8px' }}>
          {[
            ['My profile',         null],
            ['Agency · Team',      '7',  true],
            ['Carrier profiles',   '4'],
            ['Pricing',            null],
            ['Export defaults',    null],
            ['Xactimate',          null],
            ['Billing',            null],
            ['API & webhooks',     null],
          ].map(([l, n, on], i) => {
            const HREF = { 'My profile': '31-Settings-profile.html', 'Agency · Team': '19-Team-management.html', 'Carrier profiles': '10-Carrier-settings.html', 'Pricing': '14-Settings-pricing.html', 'Export defaults': '33-Settings-export-defaults.html', 'Xactimate': '34-Settings-integrations.html', 'Billing': '35-Settings-billing.html', 'API & webhooks': '36-Settings-api.html' };
            return (
            <a key={i} href={HREF[l]} className={`k-side-item ${on ? 'k-side-item--on' : ''}`}>
              <span style={{ flex: 1, textAlign: 'left' }}>{l}</span>
              {n && <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{n}</span>}
            </a>
          )})}
        </nav>
      </aside>

      <main className="k-settings-main">
        <div className="k-settings-hd">
          <div>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Team</div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>5 adjusters · 2 reviewers · 2 pending invites.</h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Reviewers can open and comment on any claim but can't edit line items. Invite as many teammates as you need — Enterprise covers your whole team on one invoice.</p>
          </div>
          <button className="k-btn"><Icon d={I.plus} size={12}/> Invite people</button>
        </div>

        {/* — Role explainer — */}
        <section className="k-roles-band">
          {Object.entries(ROLES).map(([id, r]) => (
            <div key={id} className="k-role-card">
              <Badge tone={r.tone}>{r.label}</Badge>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 6, lineHeight: 1.45 }}>{r.perms}</div>
            </div>
          ))}
        </section>

        {/* — Invite form — */}
        <section className="k-invite-form">
          <div className="k-invite-row">
            <div className="k-insp-input" style={{ flex: 1, color: 'var(--k-fg-4)' }}>names@reyesadjusting.com · comma-separate to invite multiple</div>
            <select className="k-insp-input" style={{ width: 140 }} defaultValue="adjuster">
              {Object.entries(ROLES).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
            </select>
            <button className="k-btn">Send invites</button>
          </div>
        </section>

        {/* — Active members — */}
        <section style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Active members <span style={{ color: 'var(--k-fg-4)', fontWeight: 400, fontFamily: 'var(--k-font-mono)', marginLeft: 6 }}>{MEMBERS.length}</span></div>
            <div className="k-search" style={{ minWidth: 240 }}>
              <Icon d={I.search} size={12} />
              <input placeholder="Search members…" />
            </div>
          </div>
          <div className="k-team-list">
            <div className="k-team-row k-team-row--head">
              <div></div>
              <div>Member</div>
              <div>Role</div>
              <div style={{ textAlign: 'right' }}>Claims</div>
              <div>Last active</div>
              <div>Joined</div>
              <div></div>
            </div>
            {MEMBERS.map((m, i) => (
              <div key={i} className="k-team-row">
                <span className={`k-audit-avatar k-audit-avatar--${m.role === 'reviewer' ? 'reviewer' : m.role === 'owner' || m.role === 'admin' ? 'owner' : 'adjuster'}`} style={{ width: 32, height: 32, fontSize: 11 }}>{m.avatar}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                    {m.you && <Badge tone="quiet">You</Badge>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 1 }}>
                    {m.email}
                    {m.external && <span style={{ color: 'var(--k-fg-3)', marginLeft: 6, fontFamily: 'var(--k-font-ui)' }}>· External · {m.external}</span>}
                  </div>
                </div>
                <Badge tone={ROLES[m.role].tone}>{ROLES[m.role].label}</Badge>
                <div style={{ textAlign: 'right', fontFamily: 'var(--k-font-mono)', fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{m.claims}</div>
                <div style={{ fontSize: 11.5, color: m.last === 'Active now' ? 'var(--k-ok)' : 'var(--k-fg-3)', fontFamily: 'var(--k-font-mono)' }}>{m.last}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>{m.joined}</div>
                <button className="k-icon-btn"><Icon d={I.more} size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        {/* — Pending invites — */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Pending invites <span style={{ color: 'var(--k-fg-4)', fontWeight: 400, fontFamily: 'var(--k-font-mono)', marginLeft: 6 }}>{PENDING.length}</span></div>
          </div>
          <div className="k-team-list">
            {PENDING.map((p, i) => (
              <div key={i} className="k-team-row">
                <span className="k-audit-avatar k-audit-avatar--pending" style={{ width: 32, height: 32 }}>
                  <Icon d={<><path d="M3 8l9 6 9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></>} size={13} />
                </span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--k-fg)', fontWeight: 500 }}>{p.email}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>Invited by {p.invitedBy} · {p.sent}</div>
                </div>
                <Badge tone={ROLES[p.role].tone}>{ROLES[p.role].label}</Badge>
                <div></div>
                <div></div>
                <div style={{ fontSize: 11.5, color: p.warn ? 'oklch(0.50 0.13 70)' : 'var(--k-fg-3)' }}>
                  Expires {p.expires}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="k-btn k-btn--ghost" style={{ padding: '4px 8px' }}>Resend</button>
                  <button className="k-icon-btn k-btn--danger"><Icon d={I.trash} size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  </div>
);

window.TeamManagement = TeamManagement;
