// Carrier profile / settings — depreciation tables, special-limits caps, exclusions.

const { KevinWordmark, Icon, I, Badge } = window;

const CARRIERS = [
  { id: 'allstate',   name: 'Allstate',             short: 'AS',  active: true,  claims: 47, lastEdit: '3d ago' },
  { id: 'statefarm',  name: 'State Farm',           short: 'SF',  active: false, claims: 18, lastEdit: '2w ago' },
  { id: 'travelers',  name: 'Travelers',            short: 'TR',  active: false, claims:  9, lastEdit: '1mo ago' },
  { id: 'custom1',    name: 'Narragansett Bay',     short: 'NB',  active: false, claims:  0, lastEdit: 'never', custom: true },
];

// Per-carrier configuration. `configured: false` => empty setup state.
const CARRIER_DATA = {
  allstate: {
    version: 'v2026.04', editedBy: 'Edited 3 days ago by you', basis: 'Based on standard depreciation schedule', configured: true,
    depClasses: 24, limitCount: 6, exclCount: 6, taxFallback: '8.25%', depFloor: '10% (min residual value)',
    dep: [
      ['Electronics',          '15%',  '20%', '28%', '40%', '60%', '75%'],
      ['Audio / Video',        '15%',  '20%', '28%', '40%', '60%', '75%'],
      ['Major Appliances',     '8%',   '15%', '24%', '32%', '50%', '70%'],
      ['Small Appliances',     '14%',  '22%', '32%', '45%', '65%', '85%'],
      ['Furniture',            '8%',   '16%', '25%', '35%', '50%', '70%'],
      ['Bedding & Linens',     '22%',  '38%', '50%', '65%', '80%', '95%'],
      ['Kitchen & Housewares', '10%',  '18%', '28%', '40%', '58%', '75%'],
      ['Clothing — Adult',     '25%',  '40%', '55%', '70%', '85%', '95%'],
    ],
    limits: [
      { cls: 'Jewelry',     cap: '$2,500',  perItem: '$1,500',  scrutiny: 'high',   note: 'Appraisal required above $1,500/item' },
      { cls: 'Firearms',    cap: '$3,000',  perItem: '—',       scrutiny: 'high',   note: 'Serial number + photo of bore required' },
      { cls: 'Fine Arts',   cap: '$5,000',  perItem: '$2,500',  scrutiny: 'high',   note: 'Provenance / receipt required above cap' },
      { cls: 'Furs',        cap: '$2,500',  perItem: '$1,000',  scrutiny: 'medium', note: 'Appraisal required above per-item cap' },
      { cls: 'Collectibles', cap: '$2,500', perItem: '$500',    scrutiny: 'medium', note: 'Includes coins, stamps, trading cards, comics' },
      { cls: 'Cash / Bullion', cap: '$200', perItem: '—',       scrutiny: 'low',    note: 'Hard limit — no override allowed' },
    ],
    excl: [
      { cls: 'Motor vehicles',                cov: 'Excluded — refer to auto policy' },
      { cls: 'Watercraft & accessories',      cov: 'Excluded — refer to marine policy' },
      { cls: 'Aircraft & drones',             cov: 'Excluded' },
      { cls: 'Animals & livestock',           cov: 'Excluded' },
      { cls: 'Business property at residence', cov: '$2,500 limit — covered under Coverage B' },
      { cls: 'Property of roomers / boarders', cov: 'Excluded unless related to insured' },
    ],
  },
  statefarm: {
    version: 'v2026.02', editedBy: 'Edited 2 weeks ago by you', basis: 'Based on standard depreciation schedule', configured: true,
    depClasses: 22, limitCount: 5, exclCount: 5, taxFallback: '8.25%', depFloor: '15% (min residual value)',
    dep: [
      ['Electronics',          '18%',  '25%', '35%', '48%', '65%', '80%'],
      ['Audio / Video',        '18%',  '25%', '35%', '48%', '65%', '80%'],
      ['Major Appliances',     '10%',  '18%', '27%', '36%', '55%', '72%'],
      ['Small Appliances',     '16%',  '25%', '36%', '50%', '70%', '88%'],
      ['Furniture',            '10%',  '18%', '28%', '38%', '55%', '72%'],
      ['Bedding & Linens',     '25%',  '42%', '55%', '70%', '85%', '95%'],
      ['Kitchen & Housewares', '12%',  '20%', '30%', '42%', '60%', '78%'],
      ['Clothing — Adult',     '28%',  '44%', '58%', '72%', '88%', '95%'],
    ],
    limits: [
      { cls: 'Jewelry',     cap: '$1,500',  perItem: '$1,000',  scrutiny: 'high',   note: 'Appraisal required above $1,000/item' },
      { cls: 'Firearms',    cap: '$2,500',  perItem: '—',       scrutiny: 'high',   note: 'Serial number required' },
      { cls: 'Fine Arts',   cap: '$2,500',  perItem: '$2,000',  scrutiny: 'high',   note: 'Provenance / receipt required above cap' },
      { cls: 'Furs',        cap: '$1,500',  perItem: '$750',    scrutiny: 'medium', note: 'Appraisal required above per-item cap' },
      { cls: 'Cash / Bullion', cap: '$200', perItem: '—',       scrutiny: 'low',    note: 'Hard limit — no override allowed' },
    ],
    excl: [
      { cls: 'Motor vehicles',                cov: 'Excluded — refer to auto policy' },
      { cls: 'Watercraft & accessories',      cov: 'Excluded — refer to marine policy' },
      { cls: 'Aircraft & drones',             cov: 'Excluded' },
      { cls: 'Animals & livestock',           cov: 'Excluded' },
      { cls: 'Business property at residence', cov: '$2,500 limit — covered under Coverage B' },
    ],
  },
  travelers: {
    version: 'v2026.01', editedBy: 'Edited 1 month ago by you', basis: 'Based on standard depreciation schedule', configured: true,
    depClasses: 20, limitCount: 5, exclCount: 5, taxFallback: '8.25%', depFloor: '10% (min residual value)',
    dep: [
      ['Electronics',          '14%',  '19%', '27%', '38%', '58%', '74%'],
      ['Audio / Video',        '14%',  '19%', '27%', '38%', '58%', '74%'],
      ['Major Appliances',     '7%',   '14%', '22%', '30%', '48%', '68%'],
      ['Small Appliances',     '13%',  '21%', '31%', '44%', '63%', '84%'],
      ['Furniture',            '7%',   '15%', '24%', '34%', '48%', '68%'],
      ['Bedding & Linens',     '20%',  '36%', '48%', '63%', '78%', '93%'],
      ['Kitchen & Housewares', '9%',   '17%', '27%', '39%', '56%', '73%'],
      ['Clothing — Adult',     '24%',  '39%', '54%', '68%', '84%', '94%'],
    ],
    limits: [
      { cls: 'Jewelry',     cap: '$3,000',  perItem: '$2,000',  scrutiny: 'high',   note: 'Appraisal required above $2,000/item' },
      { cls: 'Firearms',    cap: '$3,000',  perItem: '—',       scrutiny: 'high',   note: 'Serial number + photo required' },
      { cls: 'Fine Arts',   cap: '$5,000',  perItem: '$2,500',  scrutiny: 'high',   note: 'Provenance / receipt required above cap' },
      { cls: 'Furs',        cap: '$2,500',  perItem: '$1,000',  scrutiny: 'medium', note: 'Appraisal required above per-item cap' },
      { cls: 'Cash / Bullion', cap: '$250', perItem: '—',       scrutiny: 'low',    note: 'Hard limit — no override allowed' },
    ],
    excl: [
      { cls: 'Motor vehicles',                cov: 'Excluded — refer to auto policy' },
      { cls: 'Watercraft & accessories',      cov: 'Excluded — refer to marine policy' },
      { cls: 'Aircraft & drones',             cov: 'Excluded' },
      { cls: 'Animals & livestock',           cov: 'Excluded' },
      { cls: 'Business property at residence', cov: '$2,500 limit — covered under Coverage B' },
    ],
  },
  custom1: { configured: false },
};

const CarrierSettings = () => {
  const [active, setActive] = React.useState('allstate');
  const [tab, setTab] = React.useState('depreciation');
  const carrier = CARRIERS.find(c => c.id === active);
  const data = CARRIER_DATA[active] || { configured: false };
  const DEP_ROWS = data.dep || [];
  const LIMITS = data.limits || [];
  const EXCLUSIONS = data.excl || [];

  return (
    <div className="k-settings">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="Settings" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <window.AvatarMenu />
        </div>
      </header>

      <div className="k-settings-body">
        {/* — Sidebar — */}
        <aside className="k-settings-side">
          <div style={{ padding: '20px 16px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Settings</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: '4px 0 0' }}>Carrier profiles</h2>
          </div>
          <nav style={{ padding: '4px 8px' }}>
            {[
              ['My profile',         null],
              ['Business',           null],
              ['Carrier profiles',   '4', true],
              ['Pricing',            null],
              ['Export defaults',    null],
              ['Xactimate',          null],
              ['Billing',            null],
              ['API & webhooks',     null],
            ].map(([l, n, active], i) => {
              const HREF = { 'My profile': '31-Settings-profile.html', 'Business': '32-Settings-agency.html', 'Carrier profiles': '10-Carrier-settings.html', 'Pricing': '14-Settings-pricing.html', 'Export defaults': '33-Settings-export-defaults.html', 'Xactimate': '34-Settings-integrations.html', 'Billing': '35-Settings-billing.html', 'API & webhooks': '36-Settings-api.html' };
              return (
              <a key={i} href={HREF[l]} className={`k-side-item ${active ? 'k-side-item--on' : ''}`}>
                <span style={{ flex: 1, textAlign: 'left' }}>{l}</span>
                {n && <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{n}</span>}
              </a>
            )})}
          </nav>
        </aside>

        {/* — Main — */}
        <main className="k-settings-main">
          <div className="k-settings-hd">
            <div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Carrier profiles</div>
              <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Depreciation, limits & exclusions per carrier.</h1>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620 }}>
                Kevin uses the active profile to pre-fill depreciation, flag special-limits items, and validate exports.
                Profiles are per-carrier, versioned, and never enforced — adjusters can always override at the row level.
              </p>
            </div>
            <button className="k-btn"><Icon d={I.plus} size={12}/> New carrier profile</button>
          </div>

          {/* — Carrier picker — */}
          <section className="k-carrier-picker">
            {CARRIERS.map(c => (
              <button key={c.id} onClick={() => setActive(c.id)} className={`k-carrier-card ${c.id === active ? 'k-carrier-card--on' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="k-carrier-monogram">{c.short}</div>
                  {c.id === active && <Badge tone="accent" dot={true}>Active</Badge>}
                  {c.custom && c.id !== active && <Badge tone="quiet">Custom</Badge>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 12 }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
                  <span>{c.claims} claims</span>
                  <span>·</span>
                  <span>Edited {c.lastEdit}</span>
                </div>
              </button>
            ))}
          </section>

          {/* — Active profile detail — */}
          <section className="k-profile-detail">
            <div className="k-profile-hd">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: 0 }}>{carrier.name}</h2>
                  {data.configured
                    ? <Badge tone="ok" dot={true}>{carrier.active ? 'Active · ' : ''}{carrier.claims} claims</Badge>
                    : <Badge tone="quiet">Not set up</Badge>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 4, fontFamily: 'var(--k-font-mono)' }}>
                  {data.configured ? `${data.version} · ${data.editedBy} · ${data.basis}` : 'No rate table imported yet'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="k-btn k-btn--ghost">Duplicate</button>
                <button className="k-btn k-btn--ghost">Version history</button>
                <button className="k-btn k-btn--ghost k-btn--danger"><Icon d={I.trash} size={12}/> Delete profile</button>
                <button className="k-btn">Save changes</button>
              </div>
            </div>

            {!data.configured ? (
              <div className="k-table-wrap" style={{ display: 'grid', placeItems: 'center', padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: 420 }}>
                  <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 19, letterSpacing: '-0.01em', marginBottom: 6 }}>Set up {carrier.name}</div>
                  <p style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: '0 0 18px' }}>
                    No depreciation schedule, special-limits caps, or exclusions yet. Import this carrier’s rate table as CSV, or start from another carrier’s profile and adjust.
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="k-btn"><Icon d={I.upload} size={12}/> Import rate table (CSV)</button>
                    <button className="k-btn k-btn--ghost">Start from standard schedule</button>
                  </div>
                </div>
              </div>
            ) : (
            <React.Fragment>
            {/* — Tabs — */}
            <div className="k-profile-tabs">
              {[
                ['depreciation', 'Depreciation tables',  `${data.depClasses} classes`],
                ['limits',       'Special limits',        `${data.limitCount} categories`],
                ['exclusions',   'Exclusions',            `${data.exclCount} rules`],
                ['rounding',     'Rounding & tax',        null],
                ['export',       'Excel mapping',         null],
              ].map(([id, l, n]) => (
                <button key={id} onClick={() => setTab(id)} className={`k-ptab ${tab === id ? 'k-ptab--on' : ''}`}>
                  <span>{l}</span>
                  {n && <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)', marginLeft: 6 }}>{n}</span>}
                </button>
              ))}
            </div>

            {tab === 'depreciation' && (
              <div className="k-table-wrap">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Depreciation by age</div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Percent depreciated when item age falls in column. Editable per cell.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="k-btn k-btn--ghost"><Icon d={I.upload} size={12}/> Import CSV</button>
                    <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12}/> Export</button>
                  </div>
                </div>
                <table className="k-dep-table">
                  <thead>
                    <tr>
                      <th>Content class</th>
                      <th>&lt; 1 yr</th><th>1–2 yr</th><th>3–5 yr</th><th>6–10 yr</th><th>11–15 yr</th><th>&gt; 15 yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEP_ROWS.map((row, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: 'left' }}>{row[0]}</td>
                        {row.slice(1).map((v, j) => <td key={j} className="k-mono">{v}</td>)}
                      </tr>
                    ))}
                    <tr className="k-dep-table-more">
                      <td colSpan="7">+ {Math.max(0, data.depClasses - DEP_ROWS.length)} more content classes — <button className="k-link">show all →</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'limits' && (
              <div className="k-table-wrap">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Special-limits caps</div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Amber flags in the worksheet trigger when items in these classes exceed caps.</div>
                  </div>
                </div>
                <div className="k-limits-list">
                  {LIMITS.map((l, i) => (
                    <div key={i} className="k-limit-row">
                      <div style={{ flex: '0 0 140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Badge tone="warn" dot={true}>{l.cls}</Badge>
                        </div>
                      </div>
                      <div className="k-limit-cells">
                        <div>
                          <div className="k-limit-l">Total cap</div>
                          <div className="k-mono" style={{ fontSize: 13, fontWeight: 600 }}>{l.cap}</div>
                        </div>
                        <div>
                          <div className="k-limit-l">Per item</div>
                          <div className="k-mono" style={{ fontSize: 13, fontWeight: 600 }}>{l.perItem}</div>
                        </div>
                        <div>
                          <div className="k-limit-l">Scrutiny</div>
                          <div style={{ fontSize: 12, color: l.scrutiny === 'high' ? 'oklch(0.45 0.13 70)' : 'var(--k-fg-3)', textTransform: 'capitalize' }}>{l.scrutiny}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, fontSize: 11.5, color: 'var(--k-fg-3)' }}>{l.note}</div>
                      <button className="k-icon-btn"><Icon d={I.more} size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'exclusions' && (
              <div className="k-table-wrap">
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Exclusions</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Classes this policy excludes from contents coverage. Flagged in the worksheet for review — never removed or blocked.</div>
                </div>
                <div className="k-limits-list">
                  {EXCLUSIONS.map((e, i) => (
                    <div key={i} className="k-limit-row">
                      <div style={{ flex: '0 0 240px', fontSize: 13, fontWeight: 500 }}>{e.cls}</div>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--k-fg-3)' }}>{e.cov}</div>
                      <button className="k-btn k-btn--ghost">Edit</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'rounding' && (
              <div className="k-table-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--k-fg-3)' }}>
                <div className="k-insp-grid2">
                  <div className="k-insp-field"><label>Currency rounding</label><div className="k-insp-input" style={{ fontFamily: 'var(--k-font-mono)' }}>Half-up · 2 decimal places</div></div>
                  <div className="k-insp-field"><label>Tax handling</label><div className="k-insp-input">Compute per-line, sum at export</div></div>
                  <div className="k-insp-field"><label>Default tax rate fallback</label><div className="k-insp-input k-mono">{data.taxFallback}</div></div>
                  <div className="k-insp-field"><label>Depreciation floor</label><div className="k-insp-input k-mono">{data.depFloor}</div></div>
                </div>
              </div>
            )}

            {tab === 'export' && (
              <div className="k-table-wrap" style={{ fontSize: 12.5, color: 'var(--k-fg-3)', fontFamily: 'var(--k-font-mono)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-fg)', fontFamily: 'var(--k-font-ui)', marginBottom: 4 }}>Excel column mapping</div>
                <div style={{ marginBottom: 12 }}>Kevin field → XactContents .xlsx template column</div>
                <pre style={{ background: 'var(--k-bg-2)', padding: 14, borderRadius: 8, margin: 0, fontSize: 12, lineHeight: 1.7 }}>
{`  desc      →  Column C   ·  Item Description
  qty       →  Column D   ·  Quantity
  cat       →  Column E   ·  Category / Class
  age       →  Column F   ·  Age (Years)
  rcv       →  Column G   ·  Replacement Cash Value
  dep       →  Column H   ·  Depreciation %
  depAmt    →  Column I   ·  Depreciation Amount ($)
  acv       →  Column J   ·  Actual Cash Value
  notes     →  Column K   ·  Comments`}
                </pre>
                <div style={{ fontFamily: 'var(--k-font-ui)', fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 10, lineHeight: 1.5 }}>Kevin writes the official XactContents Excel template. Download it, then import from Excel inside Xactimate.</div>
              </div>
            )}

            </React.Fragment>
            )}

          </section>
        </main>
      </div>
    </div>
  );
};

window.CarrierSettings = CarrierSettings;
