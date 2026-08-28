// Settings · Pricing sources — the valuation engine's behavior.
// Kevin does NOT run per-retailer scrapers. All comps come from ONE unified
// aggregator: Google Shopping + the Google Immersive Product API (via SerpApi),
// which already covers major retailers, specialty stores and marketplaces.
// This screen controls global valuation BEHAVIOR, not individual store toggles.

const { KevinWordmark, Icon, I, Badge } = window;

// Coverage the aggregator returns — informational, NOT toggleable sources.
const PRICING_COVERAGE = [
  ['Major retailers',   'Amazon · Walmart · Target · Best Buy · Home Depot · Lowe\u2019s'],
  ['Furniture & home',  'Wayfair · West Elm · CB2 · Pottery Barn · Article'],
  ['Specialty',         'Category retailers surfaced automatically by query match'],
  ['Marketplaces',      'Returned when a retail listing exists \u2014 marketplace offers are included in the comp set'],
  ['Brand direct',      'Manufacturer storefronts, used as tiebreaker when merchants disagree'],
];

const PRICING_BASES = [
  ['Retail comp',          'Item still sold new \u2014 RCV = median of the live merchant comps returned for the query. Two alternates stay one click away in the worksheet, each with a dated proof link.'],
  ['Like-kind substitute', 'Exact model discontinued but a comparable is still sold new \u2014 Kevin prices the nearest NEW equivalent as RCV. Substitution is noted on the row.'],
  ['Manual / appraisal',   'No confident new-replacement comp came back, or the class is manual-only (Jewelry, Fine Arts, Firearms, Furs) — the item arrives flagged needs_manual with a reason, RCV and ACV null, and the adjuster types the value and attaches a proof link. Kevin never prices an item off a used listing to avoid leaving it blank.'],
];

const SettingsPricing = () => {
  const [lkq, setLkq]         = React.useState(true);
  const [ceilings, setCeil]   = React.useState(true);
  const [tiebreak, setTie]    = React.useState(true);

  const Toggle = ({ on, set, title, desc }) => (
    <div className="k-rule" style={{ alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-fg)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', lineHeight: 1.5, marginTop: 3 }}>{desc}</div>
      </div>
      <label className="k-switch" style={{ marginTop: 2 }}>
        <input type="checkbox" checked={on} onChange={() => set(v => !v)} />
        <span className="k-switch-track"><span className="k-switch-thumb" /></span>
      </label>
    </div>
  );

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
        <aside className="k-settings-side">
          <div style={{ padding: '20px 16px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Settings</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.018em', margin: '4px 0 0' }}>Pricing</h2>
          </div>
          <nav style={{ padding: '4px 8px' }}>
            {[
              ['My profile',       null, false],
              ['Business',         null, false],
              ['Carrier profiles', '4',  false],
              ['Pricing',          null, true],
              ['Export defaults',  null, false],
              ['Xactimate',        null, false],
              ['Billing',          null, false],
              ['API & webhooks',   null, false],
            ].map(([l, n, on], i) => {
              const HREF = { 'My profile': '31-Settings-profile.html', 'Business': '32-Settings-agency.html', 'Carrier profiles': '10-Carrier-settings.html', 'Pricing': '14-Settings-pricing.html', 'Export defaults': '33-Settings-export-defaults.html', 'Xactimate': '34-Settings-integrations.html', 'Billing': '35-Settings-billing.html', 'API & webhooks': '36-Settings-api.html' };
              return (
              <a key={i} href={HREF[l]} className={`k-side-item ${on ? 'k-side-item--on' : ''}`}>
                <span style={{ flex: 1, textAlign: 'left' }}>{l}</span>
                {n && <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{n}</span>}
              </a>
              );
            })}
          </nav>
        </aside>

        <main className="k-settings-main">
          <div className="k-settings-hd">
            <div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Pricing</div>
              <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '4px 0 4px' }}>Where Kevin gets Replacement Cost Values.</h1>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 760 }}>
                Every comp comes from <strong>one unified aggregator</strong> — there are no per-retailer integrations. What the source roster below controls is not <em>where</em> we fetch, but how results are <strong>classified and ranked</strong>: whether a confident new-replacement comp exists chooses the valuation basis, and the priority chain sets which comp leads. Jewelry, Fine Arts, Firearms and Furs are never auto-priced — they arrive flagged for a person. Google Shopping and the Google Immersive Product API span major retailers, specialty stores, brand-direct storefronts and marketplaces. There are no per-store scrapers to maintain or switch on. RCV defaults to the <strong>median of the live comps</strong> returned for an item, with the alternates one click away in the worksheet and a dated proof link kept for the file.
              </p>
            </div>
          </div>

          {/* — Engine status — */}
          <section className="k-pricing-stats">
            <div className="k-ps">
              <div className="k-ps-l">Comp source</div>
              <div className="k-ps-v" style={{ fontSize: 15 }}>Google Shopping</div>
            </div>
            <div className="k-ps">
              <div className="k-ps-l">Comps fetched · today</div>
              <div className="k-ps-v">2,189</div>
            </div>
            <div className="k-ps">
              <div className="k-ps-l">Avg match rate</div>
              <div className="k-ps-v" style={{ color: 'var(--k-ok)' }}>87%</div>
            </div>
            <div className="k-ps">
              <div className="k-ps-l">Avg variance · comps</div>
              <div className="k-ps-v">±6.2%</div>
            </div>
            <div className="k-ps">
              <div className="k-ps-l">Refresh cadence</div>
              <div className="k-ps-v" style={{ fontFamily: 'var(--k-font-mono)', fontSize: 14 }}>24h</div>
            </div>
          </section>

          {/* — Aggregator card — */}
          <section className="k-ov-card" style={{ background: 'var(--k-bg)' }}>
            <div className="k-ov-card-hd">
              <span>Comp source</span>
              <Badge tone="ok">Operational</Badge>
            </div>
            <div style={{ padding: '4px 14px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 14px' }}>
                <div className="k-source-logo">G</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>Google Shopping · Immersive Product API</span>
                    <Badge tone="accent">unified</Badge>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 3 }}>Served via SerpApi · one query per item returns live merchant offers with prices, links and availability</div>
                </div>
                <div className="k-source-stat">
                  <div className="k-ps-l">Last fetch</div>
                  <div className="k-source-stat-v">3m ago</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--k-line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>What the aggregator covers</div>
                {PRICING_COVERAGE.map(([t, d], i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--k-fg-2)', width: 140, flexShrink: 0 }}>{t}</span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* — Valuation behavior — */}
          <section className="k-ov-card" style={{ background: 'var(--k-bg)' }}>
            <div className="k-ov-card-hd">
              <span>Valuation behavior</span>
            </div>
            <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Toggle
                on={lkq} set={setLkq}
                title="Like-kind and quality (LKQ) substitutions"
                desc="When the exact make/model is discontinued or unmatched, price the nearest comparable item still sold new. The substitution is recorded on the row so the carrier can see what was priced."
              />
              <Toggle
                on={ceilings} set={setCeil}
                title="Enforce class depreciation ceilings"
                desc="Cap each item's depreciation at the maximum for its content class, so a salvage floor is always retained no matter the age. Off, straight-line runs uncapped to the schedule's own limit."
              />
              <Toggle
                on={tiebreak} set={setTie}
                title="Brand-direct tiebreaker"
                desc="When merchant offers disagree by more than 15%, weight the manufacturer's own storefront price to settle the median."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="k-btn">Save changes</button>
              </div>
            </div>
          </section>

          {/* — How Kevin sets each value — */}
          <section className="k-ov-card" style={{ background: 'var(--k-bg)' }}>
            <div className="k-ov-card-hd">
              <span>How Kevin sets each value</span>
            </div>
            <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRICING_BASES.map(([t, d], i) => (
                <div key={i} className="k-rule">
                  <Badge tone="quiet">{t}</Badge>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4, padding: '10px 12px', background: 'var(--k-bg-2)', borderRadius: 8, border: '1px solid var(--k-line)' }}>
                <Icon d={I.warn} size={13} />
                <span style={{ fontSize: 11.5, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--k-fg-2)' }}>The valuation service decides what gets priced.</strong> Every item arrives from the backend either priced or flagged <span style={{ fontFamily: 'var(--k-font-mono)' }}>needs_manual</span> with a reason — the worksheet renders that status, it never routes items by class itself. RCV always holds a new-replacement price; ACV is derived as <span style={{ fontFamily: 'var(--k-font-mono)' }}>Ext. Cost + Tax − $ Depr.</span>
                </span>
              </div>
            </div>
          </section>

          
        </main>
      </div>
    </div>
  );
};

window.SettingsPricing = SettingsPricing;
