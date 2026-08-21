// Settings sub-pages — 6 remaining sub-pages that the carrier-settings sidebar links to:
//   My profile · Agency settings · Export defaults · Integrations · Billing · API & webhooks
//
// They share the same shell (topbar + sidebar) defined in carrier-settings + settings-pricing.
// Each exports an individual component window.SettingsXxx.

const { KevinWordmark, Icon, I, Badge } = window;

// ─── Shared shell ──────────────────────────────────────────────────────────
const SettingsShell = ({ activeId, title, eyebrow, children, save = true, saveNote }) => {
  const NAV = [
    ['my-profile',     'My profile',         null,   { active: false }],
    ['agency',         'Business',           null,   { active: false }],
    ['carriers',       'Carrier profiles',   '4',    { active: false }],
    ['pricing',        'Pricing',            null,   { active: false }],
    ['export',         'Export defaults',    null,   { active: false }],
    ['integrations',   'Xactimate',          null,   { active: false }],
    ['billing',        'Billing',            null,   { active: false }],
    ['api',            'API & webhooks',     null,   { active: false }],
  ];
  return (
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
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: '4px 0 0' }}>{title}</h2>
          </div>
          <nav style={{ padding: '4px 8px' }}>
            {NAV.map(([id, l, n]) => {
              const HREF = { 'my-profile': '31-Settings-profile.html', 'agency': '32-Settings-agency.html', 'carriers': '10-Carrier-settings.html', 'pricing': '14-Settings-pricing.html', 'export': '33-Settings-export-defaults.html', 'integrations': '34-Settings-integrations.html', 'billing': '35-Settings-billing.html', 'api': '36-Settings-api.html' };
              return (
              <a key={id} href={HREF[id]} className={`k-side-item ${id === activeId ? 'k-side-item--on' : ''}`}>
                <span style={{ flex: 1, textAlign: 'left' }}>{l}</span>
                {n && <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{n}</span>}
              </a>
            )})}
          </nav>
        </aside>
        <main className="k-settings-main">
          <div className="k-settings-hd">
            <div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{eyebrow}</div>
            </div>
          </div>
          {children}
          {save && (
            <div className="k-set-savebar">
              {saveNote && <span>{saveNote}</span>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="k-btn k-btn--ghost">Discard</button>
                <button className="k-btn">Save changes</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Select variant of F. Used wherever a value must come from a known set — tax
// regions, condition grades, depreciation schedules — so nobody can type a rate
// that does not exist. Same frame as F so settings read uniformly.
const FSelect = ({ label, value, options, mono = false, hint, width = '100%' }) => (
  <div className="k-insp-field" style={{ width }}>
    <label>{label}</label>
      <div className="k-fselect">
        <select defaultValue={value} style={{ fontFamily: mono ? 'var(--k-font-mono)' : 'inherit' }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
        <span className="k-fselect-ic"><Icon d={I.chevdown} size={11} /></span>
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
  </div>
);

// Select with an "Other" escape hatch — constrained for everyone who fits a
// known category, free text for anyone who doesn't.
const FSelectOther = ({ label, value, options, hint, width = '100%', placeholder = 'Describe your business' }) => {
  const [v, setV] = React.useState(value);
  const other = v === 'Other';
  return (
    <div className="k-insp-field" style={{ width }}>
      <label>{label}</label>
      <div className="k-fselect">
        <select value={v} onChange={(e) => setV(e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="Other">Other…</option>
        </select>
        <span className="k-fselect-ic"><Icon d={I.chevdown} size={11} /></span>
      </div>
      {other && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 6, padding: '8px 11px', background: 'var(--k-bg)', border: '1px solid var(--k-accent)', borderRadius: 6 }}>
          <input autoFocus placeholder={placeholder} style={{ border: 0, outline: 0, background: 'transparent', flex: 1, font: 'inherit', fontSize: 13, color: 'var(--k-fg)' }} />
        </div>
      )}
      {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
    </div>
  );
};

// US_STATES lives in data.jsx so every page has it — see window.US_STATES.

// Brand colour — curated swatches plus a native picker. The value drives
// --pdf-accent on exported PDFs and the header on share links; nothing in the
// app chrome changes, so the preview shows it where it actually appears.
const BRAND_SWATCHES = ['#2E4B6F', '#1F3A5F', '#2F5D50', '#6B4E3D', '#5B4B8A', '#1a1d21'];

const FBrandColor = ({ value = '#2E4B6F' }) => {
  const [c, setC] = React.useState(value);
  return (
    <div className="k-insp-field">
      <label>Primary brand colour</label>
      <div className="k-brand-row">
        {BRAND_SWATCHES.map((h) => (
          <button key={h} type="button" onClick={() => setC(h)}
            className={'k-brand-sw' + (c.toLowerCase() === h.toLowerCase() ? ' is-on' : '')}
            style={{ background: h }} title={h} />
        ))}
        <label className="k-brand-custom" title="Pick any colour">
          <input type="color" value={c} onChange={(e) => setC(e.target.value)} />
          <Icon d={I.edit} size={11} />
        </label>
        <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-3)', marginLeft: 2 }}>{c.toUpperCase()}</span>
      </div>
      <div className="k-brand-preview">
        <span className="k-brand-preview-l" style={{ color: c }}>PERSONAL PROPERTY INVENTORY</span>
        <span style={{ fontFamily: 'var(--k-font-display)', fontSize: 15 }}>Godfrey — Kitchen fire</span>
        <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)' }}>How it appears on PDF exports and share links</span>
      </div>
    </div>
  );
};

// Reusable form field for settings
const F = ({ label, value, mono = false, suffix, hint, width = '100%', readOnly }) => (
  <div className="k-insp-field" style={{ width }}>
    <label>{label}</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 11px', background: readOnly ? 'var(--k-bg-2)' : 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 6 }}>
      <input
        defaultValue={value}
        readOnly={readOnly}
        style={{
          border: 0, outline: 0, background: 'transparent', flex: 1,
          font: 'inherit', fontSize: 13,
          fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
          color: 'var(--k-fg)',
        }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{suffix}</span>}
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 1 · MY PROFILE
// ───────────────────────────────────────────────────────────────────────────
const SettingsProfile = () => (
  <SettingsShell activeId="my-profile" title="My profile" eyebrow="Personal · session" saveNote="Your name and title appear on exports you prepare from now on.">
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Mariana Reyes</h1>
      <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>General Adjuster · Reyes Adjusting, LLC · Hauppauge, NY</p>
    </div>

    <section className="k-set-card">
      <div className="k-set-card-hd">Personal · prints as “Prepared by” on exports</div>
      <div className="k-set-card-body">
        <div className="k-set-avatar-row">
          <div className="k-set-avatar">MR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Profile photo</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>Square JPG/PNG up to 2 MB. Shows in the audit log.</div>
          </div>
          <button className="k-btn k-btn--ghost">Upload new</button>
        </div>
        <div className="k-set-grid2">
          <F label="First name" value="Mariana" />
          <F label="Last name" value="Reyes" />
          <F label="Work email" value="mariana@reyesadjusting.com" />
          <F label="Phone" value="(631) 555-0142" mono />
          <FSelectOther label="Title" value="General Adjuster"
                        placeholder="Your title as it should print"
                        options={['General Adjuster', 'Independent Adjuster', 'Public Adjuster', 'Staff Adjuster', 'Senior Adjuster', 'Estate Sale Manager', 'Appraiser', 'Owner']}
                        hint="Prints under Prepared by on exported PDFs" />
          <div className="k-insp-field">
            <label>Time zone</label>
            <div className="k-fselect">
              <select defaultValue="America/New_York">
                <optgroup label="United States">
                  <option value="America/New_York">Eastern Time (ET, GMT−5)</option>
                  <option value="America/Chicago">Central Time (CT, GMT−6)</option>
                  <option value="America/Denver">Mountain Time (MT, GMT−7)</option>
                  <option value="America/Phoenix">Arizona (MST, GMT−7, no DST)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT, GMT−8)</option>
                  <option value="America/Anchorage">Alaska Time (AKT, GMT−9)</option>
                  <option value="Pacific/Honolulu">Hawaii (HST, GMT−10)</option>
                </optgroup>
                <optgroup label="Canada">
                  <option value="America/Halifax">Atlantic (AT, GMT−4)</option>
                  <option value="America/Toronto">Toronto (ET, GMT−5)</option>
                  <option value="America/Winnipeg">Winnipeg (CT, GMT−6)</option>
                  <option value="America/Edmonton">Edmonton (MT, GMT−7)</option>
                  <option value="America/Vancouver">Vancouver (PT, GMT−8)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Europe/Dublin">Dublin (GMT+0)</option>
                  <option value="Europe/Paris">Paris (CET, GMT+1)</option>
                  <option value="Europe/Berlin">Berlin (CET, GMT+1)</option>
                  <option value="Europe/Madrid">Madrid (CET, GMT+1)</option>
                  <option value="Europe/Rome">Rome (CET, GMT+1)</option>
                  <option value="Europe/Amsterdam">Amsterdam (CET, GMT+1)</option>
                  <option value="Europe/Stockholm">Stockholm (CET, GMT+1)</option>
                  <option value="Europe/Helsinki">Helsinki (EET, GMT+2)</option>
                  <option value="Europe/Athens">Athens (EET, GMT+2)</option>
                </optgroup>
                <optgroup label="Asia / Pacific">
                  <option value="Asia/Dubai">Dubai (GST, GMT+4)</option>
                  <option value="Asia/Kolkata">Mumbai · Delhi (IST, GMT+5:30)</option>
                  <option value="Asia/Singapore">Singapore (SGT, GMT+8)</option>
                  <option value="Asia/Hong_Kong">Hong Kong (HKT, GMT+8)</option>
                  <option value="Asia/Shanghai">Shanghai · Beijing (CST, GMT+8)</option>
                  <option value="Asia/Tokyo">Tokyo (JST, GMT+9)</option>
                  <option value="Asia/Seoul">Seoul (KST, GMT+9)</option>
                  <option value="Australia/Sydney">Sydney (AEDT, GMT+11)</option>
                  <option value="Pacific/Auckland">Auckland (NZDT, GMT+13)</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="UTC">UTC (GMT+0)</option>
                </optgroup>
              </select>
              <span className="k-fselect-ic"><Icon d={I.chevdown} size={11} /></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Security</div>
      <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['Password',              'Last changed 4 months ago',                  'Change',          '#password'],
          ['Two-factor auth',       'Enabled · Authenticator app (8 backup codes left)', 'Manage',    '#two-factor'],
          ['Passkeys',              '3 registered · MacBook Pro, iPhone, 1Password', 'Manage',       '#passkeys'],
          ['Active sessions',       '3 devices · Mac Safari · iPhone · iPad',     'Sign out others', '#sessions'],
        ].map(([l, sub, cta, hash], i) => (
          <div key={i} className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
            </div>
            <a className="k-btn k-btn--ghost" href={`41-Security.html${hash}`}>{cta}</a>
          </div>
        ))}
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Notifications</div>
      <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
        {[
          ['Processing complete',    true,  true,  'Identification and pricing finished — the worksheet is ready to review'],
          ['Export ready',           true,  false, 'The file finished generating and is ready to download or share'],
          ['Export failed',          true,  true,  'With a reference ID and a retry'],
          ['Share link opened',      true,  false, 'Someone you sent a link to has opened it'],
          ['Special-limits flagged', true,  false, 'An item may be capped under the policy’s special-limits provision'],
          ['Storage nearing the pool', true, false, 'An email first — never a lockout mid-claim'],
          ['Payment problem',        true,  true,  'Before anything is interrupted'],
        ].map(([l, mail, push, sub], i) => (
          <div key={i} className="k-set-pref">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, minWidth: 180, justifyContent: 'flex-end' }}>
              <label className="k-pref-toggle">
                <input type="checkbox" defaultChecked={mail} />
                <span className="k-toggle-box">{mail && <Icon d={I.check} size={10} stroke={2.5} />}</span>
                <span style={{ fontSize: 11.5 }}>Email</span>
              </label>
              <label className="k-pref-toggle">
                <input type="checkbox" defaultChecked={push} />
                <span className="k-toggle-box">{push && <Icon d={I.check} size={10} stroke={2.5} />}</span>
                <span style={{ fontSize: 11.5 }}>Push</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="k-set-card k-set-card--danger">
      <div className="k-set-card-hd">Danger zone</div>
      <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="k-set-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Export my data</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>Download every claim, export, and audit-log entry you've ever created. ZIP delivered to your email within 24 hours.</div>
          </div>
          <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12}/> Request export</button>
        </div>
        <div className="k-set-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-danger)' }}>Delete my account</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>Permanently deletes your account and all its claims, exports, and audit logs. Cannot be undone.</div>
          </div>
          <button className="k-btn k-btn--ghost k-btn--danger"><Icon d={I.trash} size={12}/> Delete account</button>
        </div>
      </div>
    </section>
  </SettingsShell>
);

// ───────────────────────────────────────────────────────────────────────────
// 2 · AGENCY SETTINGS  (organization-level)
// ───────────────────────────────────────────────────────────────────────────
const SettingsAgency = () => (
  <SettingsShell activeId="agency" title="Business" eyebrow="Your business · branding" saveNote="Defaults apply to new claims. Anything already in a claim keeps the value it was created with.">
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Reyes Adjusting, LLC</h1>
      <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>Your business details and branding. These appear on the inventories and PDFs you export.</p>
    </div>

    <section className="k-set-card">
      <div className="k-set-card-hd">Business details</div>
      <div className="k-set-card-body">
        <div className="k-set-grid2">
          <F label="Legal name"          value="Reyes Adjusting, LLC" />
          <F label="DBA / brand"         value="Reyes Adjusting" />
          <F label="License # (New York)" value="2401-44210" mono />
          <F label="Tax ID (EIN)"        value="46-2018553" mono />
          <FSelectOther label="Type" value="Independent adjuster"
                        options={['Independent adjuster', 'Public adjuster', 'Staff adjuster', 'Third-party administrator', 'Restoration contractor', 'Estate sale company', 'Estate liquidator', 'Appraiser']} />
          <F label="Founded"             value="2020" mono />
        </div>
        <div style={{ marginTop: 14 }}>
          <F label="Street" value="150 Motor Pkwy, Suite 401" />
        </div>
        <div className="k-set-grid3" style={{ marginTop: 14 }}>
          <F label="City"  value="Hauppauge" />
          <FSelect label="State" value="NY" mono options={US_STATES} />
          <F label="ZIP"   value="11788" mono hint="Your office — does not affect claim tax" />
        </div>
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Branding · on your exports</div>
      <div className="k-set-card-body">
        <div className="k-set-row" style={{ marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>"Prepared with Kevin" footer</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>A small line in the PDF footer. Your firm stays the brand on the document — this just credits the tool. On by default; turn it off any time.</div>
          </div>
          <label className="k-switch">
            <input type="checkbox" defaultChecked={true} />
            <span className="k-switch-track"><span className="k-switch-thumb" /></span>
          </label>
        </div>
        <div className="k-set-grid2">
          <div className="k-insp-field">
            <label>Logo</label>
            <div className="k-set-logo-row">
              <div className="k-set-logo">RA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5 }}>reyes-logo.svg</div>
                <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 2 }}>Your exports and share links carry YOUR name and logo in the header — Kevin never brands the document itself.</div>
              </div>
              <label className="k-btn k-btn--ghost" style={{ cursor: 'pointer' }}>
                Upload
                <input type="file" accept="image/svg+xml,image/png" style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <FBrandColor value="#2E4B6F" />
        </div>
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Defaults · applied to new claims</div>
      <div className="k-set-card-body">
        <div className="k-set-grid2">
          <FSelect label="Default tax-rate fallback" value="Suffolk County, NY · 8.625%" mono
                   options={['Suffolk County, NY · 8.625%', 'Nassau County, NY · 8.625%', 'New York City · 8.875%', 'New York State only · 4%', 'No sales tax · 0%']}
                   hint="Only used when the loss ZIP doesn't resolve" />
          <FSelectOther label="Default policy form" value="HO-3 · Open perils"
                        placeholder="e.g. MH-3, FR-1, a state-specific form"
                        options={['None · estate sale work', 'HO-1 · Basic', 'HO-2 · Broad', 'HO-3 · Open perils', 'HO-5 · Comprehensive', 'HO-4 · Renters', 'HO-6 · Condo', 'HO-8 · Older home', 'DP-1 · Dwelling basic', 'DP-3 · Dwelling fire', 'CP · Commercial property', 'BOP · Business owners']} />
          <FSelect label="Default condition" value="Average"
                   options={['Excellent', 'Good', 'Average', 'Fair', 'Poor']}
                   hint="Starting grade on every new item" />
          <FSelect label="Default depreciation schedule" value="Straight-line · standard"
                   options={['Straight-line · standard', 'Bracketed · standard', 'Custom · preparer-entered']}
                   hint="Selectable per claim at intake" />
        </div>
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Working with a team?</div>
      <div className="k-set-card-body">
        <div className="k-set-row" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.55, maxWidth: 460 }}>Pro is a single-user subscription. Reviewer roles, shared workspaces, and team management are available on Enterprise — volume licensing for a whole desk or agency on one invoice.</div>
          </div>
          <a className="k-btn" href="15-Request-access.html">Talk to us about Enterprise →</a>
        </div>
      </div>
    </section>
  </SettingsShell>
);

// ───────────────────────────────────────────────────────────────────────────
// 3 · EXPORT DEFAULTS
// ───────────────────────────────────────────────────────────────────────────
const SettingsExport = () => (
  <SettingsShell activeId="export" title="Export defaults" eyebrow="Defaults · per export format" saveNote="These pre-fill the export modal. You can still override anything per claim.">
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>What's in the box, by default.</h1>
      <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620 }}>These defaults pre-fill the Export modal whenever you start an export. You can still override anything per-claim.</p>
    </div>

    <section className="k-set-card">
      <div className="k-set-card-hd">Default export format</div>
      <div className="k-set-card-body">
        <div className="k-format-grid">
          {[
            ['Xactimate (Excel)', '.xlsx · XactContents template', true],
            ['PDF inventory',     '.pdf · client-facing',          false],
            ['Generic CSV',       '.csv · any other tool',         false],
          ].map(([l, sub, on], i) => (
            <button key={i} className={`k-format ${on ? 'k-format--on' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{l}</span>
                {on && <Badge tone="ok">Default</Badge>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 4 }}>{sub}</div>
              {on && <div className="k-format-check"><Icon d={I.check} size={11} stroke={2.5} /></div>}
            </button>
          ))}
        </div>
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Include by default</div>
      <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
        {[
          ['head1',        'In the spreadsheet',              null,                             null],
          ['depreciated',  'Depreciation % and $ columns',    'From the schedule on the claim',  true],
          ['taxBreakout',  'Sales tax per line item',         'Rate resolved from the loss ZIP', true],
          ['proofLinks',   'Proof link column',               'The comp each price came from',   true],
          ['head2',        'In the PDF and bundle only',      null,                             null],
          ['photos',       'Item photos (high-res)',          'Adds 50-500 MB per claim',        true],
          ['comps',        'All three pricing comps',         'With source URLs and fetch dates', true],
          ['notes',        'Adjuster notes',                  'Free-text notes on the claim',    true],
          ['audit',        'Full audit log',                  'Every edit, with who and when',   true],
          ['watermark',    'Watermark with business name',    'Useful on share-link exports',    false],
        ].map(([k, l, s, on], i) => (
          k.startsWith('head') ? (
            <div key={k} style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, padding: i === 0 ? '2px 0 8px' : '16px 0 8px' }}>{l}</div>
          ) : (
          <label key={k} className="k-toggle">
            <input type="checkbox" defaultChecked={on} />
            <span className="k-toggle-box">{on && <Icon d={I.check} size={10} stroke={2.5} />}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--k-fg)' }}>{l}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>{s}</span>
            </span>
          </label>
          )
        ))}
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Delivery</div>
      <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label className="k-radio">
          <span className="k-radio-dot k-radio-dot--on" />
          <span style={{ flex: 1, fontSize: 13 }}>Download to my computer</span>
          <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Default</span>
        </label>
        <label className="k-radio">
          <span className="k-radio-dot" />
          <span style={{ flex: 1, fontSize: 13 }}>Copy a secure share link</span>
          <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Expires in 7 days</span>
        </label>

      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Filename pattern</div>
      <div className="k-set-card-body">
        <F label="Pattern" value="{claim_number}_{insured_last}_{format}_{date}.{ext}" mono
           hint="Variables: {claim_number} {insured_last} {format} {date} {carrier} {adjuster}" />
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 7 }}>
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Example</div>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg)' }}>CLM-2026-04412_Godfrey_xactimate_2026-08-04.xlsx</div>
        </div>
      </div>
    </section>
  </SettingsShell>
);

// ───────────────────────────────────────────────────────────────────────────
// 4 · INTEGRATIONS
// ───────────────────────────────────────────────────────────────────────────
const SettingsIntegrations = () => {
  const STEPS = [
    ['1', 'Finish your inventory in Kevin', 'Review every line in the worksheet, resolve flags, and confirm your totals.'],
    ['2', 'Download the XactContents Excel template', 'Kevin formats your items into the pre-built XactContents .xlsx — descriptions, quantities, depreciation, and replacement costs, mapped to the columns Xactimate expects.'],
    ['3', 'Import it in Xactimate', 'In Xactimate, open your estimate → XactContents tab → Import from Excel → select Kevin\'s file. Your inventory lands as line items, ready to finalize.'],
  ];
  return (
    <SettingsShell activeId="integrations" title="Xactimate" eyebrow="Export · compatibility" save={false}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Xactimate-ready, by design.</h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620, lineHeight: 1.55 }}>Kevin doesn't plug into your Xactimate account — it doesn't need to. You finish the inventory here, download the XactContents Excel template, and upload it in Xactimate. No credentials, no sync, nothing to connect.</p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">How it works</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
          {STEPS.map(([n, t, s], i) => (
            <div key={n} style={{ display: 'flex', gap: 14, padding: '16px 18px', borderBottom: i < STEPS.length - 1 ? '1px solid var(--k-line)' : 0 }}>
              <div style={{ flex: '0 0 auto', width: 26, height: 26, borderRadius: 99, background: 'var(--k-accent-soft)', color: 'var(--k-accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--k-font-mono)', fontSize: 12, fontWeight: 700 }}>{n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Export formats</div>
        <div className="k-set-card-body" style={{ padding: 0 }}>
          {[
            ['XLSX', 'XactContents Excel template', 'The pre-formatted .xlsx Xactimate imports directly. This is the default.', true],
            ['PDF',  'PDF inventory',                'The readable version, for an insured, an attorney, or an estate-sale client. Carries photos and comps.', false],
            ['CSV',  'Universal CSV',                'A plain spreadsheet for any other estimating tool, accounting, or your own records.', false],
          ].map(([tag, name, desc, primary], i) => (
            <div key={i} className="k-int-row">
              <div className="k-int-logo" style={{ background: primary ? '#2E4B6F' : 'var(--k-fg-3)', fontFamily: 'var(--k-font-mono)', fontSize: 10, fontWeight: 700 }}>{tag}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                  {primary && <Badge tone="accent" dot={true}>Default</Badge>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 3 }}>{desc}</div>
              </div>
              <button className="k-btn k-btn--ghost">Download sample</button>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Need a live integration?</div>
        <div className="k-set-card-body">
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: '0 0 12px', lineHeight: 1.55 }}>
            The .xlsx and CSV exports cover virtually every workflow on their own. Larger operations that want Kevin wired straight into their own systems can do that on Enterprise via API + webhooks.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="k-btn" href="15-Request-access.html">Talk to us about Enterprise →</a>
            <a className="k-btn k-btn--ghost" href="24-Docs.html">See API docs</a>
          </div>
        </div>
      </section>
    </SettingsShell>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 5 · BILLING
// ───────────────────────────────────────────────────────────────────────────
const KS = () => window.KEVIN_STORAGE;
const fmtGB = (n) => (n >= 10 ? n.toFixed(0) : n.toFixed(1)) + ' GB';
const fmtPool = (n) => (n >= 1000 ? (n / 1000) + ' TB' : n + ' GB');

const StorageUsageCard = ({ includedGB, note }) => {
  const base = KS();
  if (!base) return null;
  // Pro's 500 GB is Pro's allowance (CLAUDE.md rule 19) — an Enterprise contract
  // carries its own, so the pool is a prop rather than a constant.
  const s = includedGB ? { ...base, includedGB, pct: Math.min(Math.round((base.usedGB / includedGB) * 1000) / 10, 100) } : base;
  return (
    <section className="k-set-card">
      <div className="k-set-card-hd">Storage &amp; fair use</div>
      <div className="k-set-card-body">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--k-fg-3)' }}>
            <strong style={{ color: 'var(--k-fg)', fontFamily: 'var(--k-font-mono)', fontSize: 15 }}>{fmtGB(s.usedGB)}</strong>
            <span> of {fmtPool(s.includedGB)} included</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{s.pct}%</div>
        </div>
        <div className="k-store-track">
          <div className="k-store-fill k-store-fill--warm" style={{ width: Math.max((s.warmGB / s.includedGB) * 100, 0.6) + '%' }}></div>
          <div className="k-store-fill k-store-fill--cold" style={{ width: Math.max((s.coldGB / s.includedGB) * 100, 0.6) + '%' }}></div>
        </div>
        <div className="k-store-keys">
          <span className="k-store-key"><i className="k-store-dot k-store-dot--warm"></i>Active · {fmtGB(s.warmGB)} · {s.warmClaims} claims</span>
          <span className="k-store-key"><i className="k-store-dot k-store-dot--cold"></i>Archived · {fmtGB(s.coldGB)} · {s.coldClaims} claim{s.coldClaims === 1 ? '' : 's'}</span>
          <span className="k-store-key" style={{ color: 'var(--k-fg-4)' }}>{s.photos.toLocaleString()} photos · ~{s.avgPhotoMB} MB avg</span>
        </div>
        <div className="k-store-note">
          <p><strong>Nothing is ever deleted to reclaim space.</strong> Claims you close move to archived storage after {s.coldAfterDays} days — still yours, still openable, just a moment slower to load the first time.</p>
          <p>{note || <React.Fragment>Claims stay unlimited on Pro. If an account goes past {fmtPool(s.includedGB)} we email you first — never a lockout mid-claim — then additional storage bills at ${s.overagePrice}/mo per {s.overageGB} GB.</React.Fragment>}</p>
        </div>
      </div>
    </section>
  );
};

// Billing renders the plan the account is ACTUALLY on. Three billing states
// exist and the page must not hardcode any of them: 'pro' (flat $249),
// 'enterprise' (custom, invoiced), and 'comped' (granted from the admin console —
// $0, full features, excluded from MRR). A comped or Enterprise account seeing
// "Pro plan · $249" would be a lie the customer notices immediately.
const BILLING_PLANS = {
  pro: {
    name: 'Pro', heading: 'Pro plan.', price: '$249.00', renews: 'Sep 1',
    nextLine: <React.Fragment>Next invoice: <strong style={{ color: 'var(--k-fg-2)' }}>Sep 1, 2026 · $249.00</strong></React.Fragment>,
    kpis: [['Current plan', 'Pro', 'Flat monthly'], ['Claims', 'Unlimited', 'No per-claim charges'], ['This month', '$249.00', 'Auto-renews Sep 1']],
    blurb: <React.Fragment>You're on <strong style={{ color: 'var(--k-fg-2)' }}>Kevin Pro</strong> — one flat price, unlimited claims, cancel anytime. Running a desk or a team? Enterprise gives you volume licensing on one invoice.</React.Fragment>,
    showCancel: true, showPayment: true, showBillingEmail: true, storageGB: null, storageNote: null,
    invoices: [
      ['INV-2026-008', 'Aug 01, 2026', 'Pro · monthly', '$249.00'],
      ['INV-2026-007', 'Jul 01, 2026', 'Pro · monthly', '$249.00'],
      ['INV-2026-006', 'Jun 01, 2026', 'Pro · monthly', '$249.00'],
      ['INV-2026-005', 'May 01, 2026', 'Pro · monthly', '$249.00'],
      ['INV-2026-004', 'Apr 01, 2026', 'Pro · monthly', '$249.00'],
    ],
  },
  enterprise: {
    name: 'Enterprise', heading: 'Enterprise.', price: 'Invoiced', renews: 'per contract',
    nextLine: <React.Fragment>Billed by invoice · <strong style={{ color: 'var(--k-fg-2)' }}>contract renews Jan 1, 2027</strong></React.Fragment>,
    kpis: [['Current plan', 'Enterprise', 'Volume licensing'], ['Claims', 'Unlimited', 'Across all users'], ['Billing', 'By invoice', 'Net 30']],
    blurb: <React.Fragment>You're on <strong style={{ color: 'var(--k-fg-2)' }}>Enterprise</strong> — volume licensing on one invoice, with API access, webhooks and team roles included. Changes go through your account contact.</React.Fragment>,
    showCancel: false, showPayment: false, showBillingEmail: true, storageGB: 5000,
    storageNote: 'Your contract includes 5 TB of active storage across all users. Additional storage is negotiated at renewal rather than billed automatically — talk to your account contact.',
    invoices: [
      ['INV-2026-Q3', 'Jul 01, 2026', 'Enterprise · Q3 2026', '$7,200.00'],
      ['INV-2026-Q2', 'Apr 01, 2026', 'Enterprise · Q2 2026', '$7,200.00'],
      ['INV-2026-Q1', 'Jan 01, 2026', 'Enterprise · Q1 2026', '$7,200.00'],
      ['INV-2025-Q4', 'Oct 01, 2025', 'Enterprise · Q4 2025', '$6,600.00'],
    ],
  },
  comped: {
    name: 'Complimentary', heading: 'Complimentary access.', price: '$0.00', renews: 'no charge',
    nextLine: <React.Fragment>No charge · <strong style={{ color: 'var(--k-fg-2)' }}>Pro features through Dec 31, 2026</strong></React.Fragment>,
    kpis: [['Current plan', 'Pro', 'Complimentary'], ['Claims', 'Unlimited', 'No per-claim charges'], ['This month', '$0.00', 'Nothing billed']],
    blurb: <React.Fragment>Your account has <strong style={{ color: 'var(--k-fg-2)' }}>complimentary Pro access</strong> — every feature, nothing billed. If it is set to expire you will hear from us well before it does.</React.Fragment>,
    showCancel: false, showPayment: false, showBillingEmail: false, invoices: [], storageGB: null,
    storageNote: 'Complimentary accounts get the same 500 GB of active storage as Pro, and nothing is billed if you exceed it — we will simply get in touch.',
  },
};

const SettingsBilling = ({ plan = 'pro' }) => {
  const P = BILLING_PLANS[plan] || BILLING_PLANS.pro;
  return (
  <SettingsShell activeId="billing" title="Billing" save={false} eyebrow={[P.name, P.showPayment && 'payment', P.invoices.length && 'invoices'].filter(Boolean).join(' · ')}>
    <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>{P.heading}</h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>{P.nextLine}</p>
      </div>
      {plan === 'pro' && <button className="k-btn">Manage subscription</button>}
    </div>

    {plan === 'comped' && (
      <section className="k-set-card k-set-card--accent">
        <div className="k-set-card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon d={I.check} size={16} />
          <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--k-fg-2)' }}>Complimentary account.</strong> Nothing is billed and no card is required. Every Pro feature is available, including unlimited claims and all export formats.
          </span>
        </div>
      </section>
    )}

    <section className="k-set-card k-set-card--accent">
      <div className="k-set-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, padding: 0 }}>
        {P.kpis.map(([l, v, sub], i) => (
          <div key={i} className="k-billing-cell" style={{ borderRight: i < 2 ? '1px solid var(--k-line)' : 0 }}>
            <div className="k-billing-l">{l}</div>
            <div className="k-billing-v">{v}</div>
            <div className="k-billing-s">{sub}</div>
          </div>
        ))}
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Your plan</div>
      <div className="k-set-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
          <span style={{ color: 'var(--k-fg-3)', maxWidth: 460 }}>{P.blurb}</span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {P.showCancel && <button className="k-btn k-btn--ghost">Cancel plan</button>}
            {plan === 'pro' && <a className="k-btn" href="15-Request-access.html">Talk to us about Enterprise</a>}
            {plan !== 'pro' && <a className="k-btn k-btn--ghost" href="38-Contact.html">Contact us</a>}
          </div>
        </div>
      </div>
    </section>

    <StorageUsageCard includedGB={P.storageGB} note={P.storageNote} />

    {P.showPayment && (
      <section className="k-set-card">
        <div className="k-set-card-hd">Payment method</div>
        <div className="k-set-card-body">
          <div className="k-set-row">
            <div className="k-card-mock">
              <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 14, letterSpacing: '0.06em', color: '#fff' }}>•••• •••• •••• 4242</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--k-font-mono)' }}>
                <span>MARIANA REYES</span>
                <span>12/28</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Visa ending in 4242</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>Expires 12/2028 · Billing address on file in Hauppauge, NY</div>
            </div>
            <button className="k-btn k-btn--ghost">Update</button>
          </div>
        </div>
      </section>
    )}

    {P.showBillingEmail && (
      <section className="k-set-card">
        <div className="k-set-card-hd">Invoice recipient</div>
        <div className="k-set-card-body">
          <F label="Invoice billing email" value="mariana@reyesadjusting.com" hint="Where invoices and receipts are sent" />
        </div>
      </section>
    )}

    {P.invoices.length > 0 && (
      <section className="k-set-card">
        <div className="k-set-card-hd" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Invoice history</span><span style={{ fontWeight: 400, color: 'var(--k-fg-4)', textTransform: 'none', letterSpacing: 0 }}>PDF per invoice · receipts also emailed on payment</span></div>
        <div className="k-set-card-body" style={{ padding: 0 }}>
          {P.invoices.map(([id, date, desc, amt], i) => (
            <div key={i} className="k-invoice-row">
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg)' }}>{id}</span>
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{date}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--k-fg-2)' }}>{desc}</span>
              <span className="k-mono" style={{ fontWeight: 600, fontSize: 13 }}>{amt}</span>
              <Badge tone="ok" dot={true}>Paid</Badge>
              <button className="k-icon-btn" title="Download PDF"><Icon d={I.download} size={13}/></button>
            </div>
          ))}
        </div>
      </section>
    )}

  </SettingsShell>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 6 · API & WEBHOOKS
// ───────────────────────────────────────────────────────────────────────────
// Programmatic access is ENTERPRISE-ONLY. A solo adjuster or estate-sale pro on
// Pro has nothing to integrate — they work in the app and download the file.
// Keys and webhooks exist for carriers, TPAs and multi-adjuster desks pushing
// claims in from their own systems. The demo account (Mariana Reyes) is on Pro,
// so this page renders the locked state; `plan="enterprise"` shows the real
// keys/webhooks panels. Webhooks fire on Kevin's OWN lifecycle events only —
// Kevin never pushes into a carrier system (rule 4).
const API_EVENTS = [
  ['claim.created',              'A claim was opened, by anyone on the account'],
  ['claim.processing.complete',  'Identification and pricing finished — the worksheet is ready'],
  ['claim.item.needs_manual',    'Kevin could not price an item confidently and left it blank'],
  ['claim.status.changed',       'Processing → In review → Open → Closed'],
  ['export.generated',           'A spreadsheet, PDF or bundle was produced'],
  ['export.link.viewed',         'Someone opened a share link'],
];

const SettingsApi = ({ plan = 'pro' }) => {
  const enterprise = plan === 'enterprise';
  return (
  <SettingsShell activeId="api" title="API & webhooks" eyebrow={enterprise ? 'Enterprise · 2 keys · 3 hooks' : 'Enterprise feature'}
                 save={enterprise} saveNote={enterprise ? 'Key and webhook changes take effect immediately.' : undefined}>
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Programmatic access.</h1>
      <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 640 }}>
        For carriers, TPAs and multi-adjuster desks that open claims from their own system and collect the finished inventory automatically. If you work claim by claim in Kevin, you don't need any of this.
      </p>
    </div>

    {!enterprise && (
      <section className="k-set-card k-set-card--accent">
        <div className="k-set-card-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div className="k-empty-art k-empty-art--accent" style={{ width: 40, height: 40, marginBottom: 0, flex: '0 0 auto' }}>
            <Icon d={I.lock} size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Included with Enterprise</div>
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: '0 0 12px', maxWidth: 560 }}>
              You're on <strong style={{ color: 'var(--k-fg-2)' }}>Pro</strong> — unlimited claims, every export format, no API. Enterprise adds scoped API keys, webhooks, and volume licensing on one invoice.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a className="k-btn" href="15-Request-access.html">Talk to us about Enterprise →</a>
              <a className="k-btn k-btn--ghost" href="21-Pricing.html">Compare plans</a>
            </div>
          </div>
        </div>
      </section>
    )}

    {enterprise && (
      <React.Fragment>
        <section className="k-set-card">
          <div className="k-set-card-hd">API keys · 2</div>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {[
              { name: 'Production · claim intake', key: 'sk_live_4G3y...92Pa', scopes: ['claims:write', 'exports:read'], last: '14m ago', created: 'Mar 2026' },
              { name: 'Read-only · reporting',     key: 'sk_live_8Hk2...M11p', scopes: ['claims:read'],                  last: '3h ago',  created: 'Feb 2026' },
            ].map((k, i) => (
              <div key={i} className="k-api-row">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{k.name}</span>
                    {k.scopes.map(sc => <Badge key={sc} tone="quiet">{sc}</Badge>)}
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                    <span style={{ fontFamily: 'var(--k-font-mono)' }}>{k.key}</span>
                    <span>Created {k.created}</span>
                    <span>Last used {k.last}</span>
                  </div>
                </div>
                <button className="k-btn k-btn--ghost">Rotate</button>
                <button className="k-btn k-btn--ghost k-btn--danger">Revoke</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)' }}>
            <button className="k-btn"><Icon d={I.plus} size={12}/> Create new key</button>
          </div>
        </section>

        <section className="k-set-card">
          <div className="k-set-card-hd">Webhooks · 3 active</div>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {[
              { url: 'https://hooks.example-tpa.com/kevin/claim',   events: ['claim.created', 'claim.processing.complete'], last: 'ok · 2m ago',  status: 'ok'   },
              { url: 'https://hooks.example-tpa.com/kevin/export',  events: ['export.generated', 'export.link.viewed'],     last: 'ok · 14m ago', status: 'ok'   },
              { url: 'https://hooks.example-tpa.com/kevin/manual',  events: ['claim.item.needs_manual'],                    last: 'failing · 3 retries pending · last 5xx · 30m ago', status: 'warn' },
            ].map((h, i) => (
              <div key={i} className="k-api-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {h.events.map(e => <Badge key={e} tone="quiet">{e}</Badge>)}
                    <Badge tone={h.status} dot={true}>{h.last}</Badge>
                  </div>
                </div>
                <button className="k-btn k-btn--ghost">Logs</button>
                <button className="k-btn k-btn--ghost">Edit</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)' }}>
            <button className="k-btn"><Icon d={I.plus} size={12}/> Add webhook</button>
          </div>
        </section>
      </React.Fragment>
    )}

    <section className="k-set-card">
      <div className="k-set-card-hd">What you can do with it</div>
      <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: '0 0 6px', maxWidth: 660 }}>
          Open a claim from your own system, poll or subscribe until the inventory is ready, then pull the spreadsheet. Kevin fires events about its own work — it never writes into a carrier system, so there is no submit endpoint.
        </p>
        {API_EVENTS.map(([e, d], i) => (
          <div key={i} className="k-rule">
            <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-2)', width: 240, flexShrink: 0 }}>{e}</span>
            <span style={{ flex: 1, fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>{d}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="k-set-card">
      <div className="k-set-card-hd">Try a request</div>
      <div className="k-set-card-body" style={{ padding: 0 }}>
        <pre style={{ margin: 0, padding: 20, fontFamily: 'var(--k-font-mono)', fontSize: 12, lineHeight: 1.7, background: 'var(--k-bg-2)', color: 'var(--k-fg)', overflowX: 'auto' }}>
{`# List claims opened in the last 30 days
curl https://api.kevin.co/v1/claims \\
  -H "Authorization: Bearer sk_live_4G3y..." \\
  -G --data-urlencode "since=2026-07-03" \\
  --data-urlencode "limit=50"`}
        </pre>
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)' }}>
        <a className="k-btn k-btn--ghost" href="24-Docs.html">Open API docs →</a>
      </div>
    </section>

    {enterprise && (
      <section className="k-set-card">
        <div className="k-set-card-hd">Rate limits · your contract</div>
        <div className="k-set-card-body">
          <div className="k-set-grid2">
            <F label="Requests / second"   value="100" mono readOnly hint="Burst: 200/s for 10s" />
            <F label="Webhook concurrency" value="10"  mono readOnly hint="Per endpoint" />
            <F label="Max export size"     value="2 GB per export" mono readOnly />
            <F label="API key max age"     value="365 days" mono readOnly hint="Rotation required, can be earlier" />
          </div>
        </div>
      </section>
    )}
  </SettingsShell>
  );
};

Object.assign(window, {
  SettingsProfile, SettingsAgency, SettingsExport,
  SettingsIntegrations, SettingsBilling, SettingsApi, StorageUsageCard,
});
