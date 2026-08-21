// Cookie banner + 404 / not-found page.

const { KevinWordmark, Icon, I, Badge } = window;

// ───────────────────────────────────────────────────────────────────────────
// 1 · COOKIE BANNER — bottom-pinned, two-tier (accept / customize)
// ───────────────────────────────────────────────────────────────────────────
const CookieBanner = () => {
  const [view, setView] = React.useState('default');   // 'default' | 'customize'
  const [prefs, setPrefs] = React.useState({
    essential:  true,     // always-on
    functional: true,
    analytics:  false,
    marketing:  false,
  });
  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="k-landing">
      {/* Fake page content behind the banner so designers see context */}
      <header className="k-nav">
        <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="k-btn k-btn--ghost" href="00-Sign-in.html">Sign in</a>
          <a className="k-btn" href="03-Intake.html">Start a new claim</a>
        </div>
      </header>
      <main className="k-mkt-main" style={{ padding: '60px 40px', opacity: 0.45 }}>
        <div style={{ height: 320, background: 'var(--k-bg-2)', borderRadius: 12, marginBottom: 18 }} />
        <div style={{ height: 220, background: 'var(--k-bg-2)', borderRadius: 12 }} />
      </main>

      {/* — Banner: default view — */}
      {view === 'default' && (
        <div className="k-cookie">
          <div className="k-cookie-inner">
            <div className="k-cookie-icon">
              <Icon d={<><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="0.8" fill="currentColor"/><circle cx="14" cy="14" r="0.8" fill="currentColor"/><circle cx="15" cy="9" r="0.8" fill="currentColor"/></>} size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>We use cookies to make Kevin work.</div>
              <p style={{ fontSize: 12, color: 'var(--k-fg-3)', margin: '3px 0 0', lineHeight: 1.5 }}>
                Essential cookies keep you signed in and your work saved. Optional ones help us understand how the product is used. You can change preferences anytime in your account.
                {' '}<a className="k-link" href="25-Legal-hub.html" style={{ fontSize: 12 }}>Privacy policy</a> · <a className="k-link" href="25-Legal-hub.html" style={{ fontSize: 12 }}>Cookie details</a>
              </p>
            </div>
            <div className="k-cookie-actions">
              <button className="k-btn k-btn--ghost" onClick={() => setView('customize')}>Customize</button>
              <button className="k-btn k-btn--ghost">Reject optional</button>
              <button className="k-btn">Accept all</button>
            </div>
          </div>
        </div>
      )}

      {/* — Banner: customize view — */}
      {view === 'customize' && (
        <div className="k-cookie k-cookie--full">
          <div className="k-cookie-modal">
            <div className="k-cookie-modal-hd">
              <div>
                <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Cookie preferences</div>
                <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 24, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Choose what we collect.</h2>
              </div>
              <button className="k-icon-btn" onClick={() => setView('default')}><Icon d={I.close} size={14} /></button>
            </div>

            <div className="k-cookie-list">
              {[
                ['essential',  'Essential',                'Required to sign in, keep your work saved, and process claims. Cannot be disabled.', true, '4 cookies', true],
                ['functional', 'Functional',               'Remembers preferences like density and column widths between sessions.',              false, '3 cookies'],
                ['analytics',  'Product analytics',        'Helps us see which features adjusters use and where they get stuck. Anonymous.',     false, '2 cookies'],
                ['marketing',  'Marketing',                'Used for our website ads. Never enabled inside the authenticated app.',               false, '6 cookies'],
              ].map(([k, label, body, locked, count]) => (
                <div key={k} className="k-cookie-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
                      {locked && <Badge tone="quiet">Always on</Badge>}
                      <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{count}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', margin: '4px 0 0', lineHeight: 1.5 }}>{body}</p>
                  </div>
                  <label className="k-switch">
                    <input type="checkbox" checked={prefs[k]} onChange={() => !locked && toggle(k)} disabled={locked} />
                    <span className="k-switch-track" style={locked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                      <span className="k-switch-thumb" />
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div className="k-cookie-modal-foot">
              <button className="k-link" onClick={() => setView('default')}>← Back</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="k-btn k-btn--ghost">Reject optional</button>
                <button className="k-btn">Save preferences</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · 404 / NOT FOUND
// ───────────────────────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="k-landing">
    <header className="k-nav">
      <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="k-btn k-btn--ghost">Sign in</button>
        <button className="k-btn">Start a new claim</button>
      </div>
    </header>

    <main className="k-404">
      <div className="k-404-num">404</div>
      <h1 className="k-404-h">This isn't a page we recognize.</h1>
      <p className="k-404-sub">
        The page you're looking for isn't here. It might have been moved, renamed,
        or the link you followed was wrong. The good news: Kevin doesn't lose your work,
        only this URL.
      </p>

      <div className="k-404-actions">
        <a href="../pages/01-My-claims.html" className="k-btn k-btn--lg">Go to my claims →</a>
        <a href="../pages/02-Landing.html" className="k-btn k-btn--ghost k-btn--lg">Back to homepage</a>
      </div>

      <div className="k-404-suggest">
        <div className="k-404-suggest-h">You might be looking for…</div>
        <div className="k-404-suggest-grid">
          {[
            ['Start a new claim',         '/claim/new',     '03-Intake.html'],
            ['Review worksheet',           '/claim/:id/review', '05-Worksheet-flat.html'],
            ['Exports & history',          '/exports',       '13-Exports-history.html'],
            ['Carrier profiles',           '/settings/carriers', '10-Carrier-settings.html'],
            ['Docs',                       '/docs',          '24-Docs.html'],
            ['Get help',                   '/contact',       '38-Contact.html'],
          ].map(([label, path, file]) => (
            <a key={file} href={`../pages/${file}`} className="k-404-suggest-row">
              <Icon d={I.chevright} size={12} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{label}</span>
              <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>{path}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="k-404-search">
        <Icon d={I.search} size={14} />
        <input placeholder="Or search the docs and help center…" />
        <kbd>⌘K</kbd>
      </div>
    </main>

    <footer className="k-footnote">
      <KevinWordmark href="02-Landing.html" size={13} suffix={true} />
      <span style={{ color: 'var(--k-fg-4)' }}>· A content inventory adjuster</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 16, color: 'var(--k-fg-4)' }}>
          <a href="25-Legal-hub.html" style={{ color: 'inherit' }}>Privacy</a>
          <a href="25-Legal-hub.html" style={{ color: 'inherit' }}>Terms</a>
          <span>© 2026 · Built for adjusters</span>
        </span>
    </footer>
  </div>
);

Object.assign(window, { CookieBanner, NotFound });
