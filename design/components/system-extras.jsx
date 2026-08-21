// Gap-fill system screens: export confirmation + empty claims dashboard.

const { KevinWordmark, Icon, I, Badge, TopNavTabs } = window;

const TopBar = ({ active }) => (
  <header className="k-topbar">
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <KevinWordmark size={16} suffix={true} />
      <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
      <window.TopNavTabs active={active} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <window.AvatarMenu />
    </div>
  </header>
);

// ── 1 · EXPORT SUCCESS — confirmation after exporting a claim ────────────────
const ExportSuccess = () => (
  <div className="k-claims">
    <TopBar active="Exports" />
    <div className="k-exsucc">
      <div className="k-exsucc-burst"><Icon d={I.check} size={40} stroke={2.5} /></div>
      <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Export complete</div>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.028em', margin: '8px 0 10px', lineHeight: 1.05, textAlign: 'center' }}>
        Godfrey — Kitchen fire is ready to send.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 520, textAlign: 'center', lineHeight: 1.55 }}>
        57 items exported to the Xactimate (Excel) template. Take the spreadsheet on its
        own, a printable PDF inventory, or the full bundle — spreadsheet, PDF, all 49
        photos and the audit log in one .zip.
      </p>

      <div className="k-exsucc-card">
        <div className="k-exsucc-file">
          <div className="k-exsucc-file-ic"><Icon d={I.check} size={18} stroke={2.4} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--k-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }}>CLM-2026-04412_Reyes_2026-06-22</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>57 items · 60 photos · ref EXP-2026-1142</div>
          </div>
          <Badge tone="ok" dot={true}>Ready</Badge>
        </div>
        <div className="k-artifacts">
          {[
            [I.box,      'Inventory spreadsheet', 'XactContents template · imports straight into Xactimate', '.xlsx', '84 KB', null, true],
            [I.printer,  'PDF inventory',         'Print-ready document for the client or carrier file',      '.pdf',  '1.2 MB', '74-PDF-inventory.html', false],
            [I.zip,      'Full bundle',           'Spreadsheet, PDF, all 161 photos and the audit log',       '.zip',  '340 MB', null, false],
          ].map(([ic, name, desc, ext, size, href, primary], i) => (
            <div className="k-artifact" key={i}>
              <div className="k-artifact-ic"><Icon d={ic} size={16} /></div>
              <div className="k-artifact-t">
                <div className="k-artifact-n">{name} <span className="k-artifact-x">{ext} · {size}</span></div>
                <div className="k-artifact-d">{desc}</div>
              </div>
              {href
                ? <a className={`k-btn ${primary ? '' : 'k-btn--ghost'}`} href={href} aria-label={`Download ${name} (${ext}, ${size})`}><Icon d={I.download} size={12} /> Download</a>
                : <button className={`k-btn ${primary ? '' : 'k-btn--ghost'}`} aria-label={`Download ${name} (${ext}, ${size})`}><Icon d={I.download} size={12} /> Download</button>}
            </div>
          ))}
        </div>
        <div className="k-artifact-share">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="k-artifact-n">Share link <span className="k-artifact-x">expires in 30 days</span></div>
            <div className="k-artifact-d">Anyone with the link can view and download this export — they never see the app.</div>
          </div>
          <button className="k-btn k-btn--ghost"><Icon d={I.link} size={12} /> Copy link</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <a className="k-btn" href="12-Claim-overview.html">Back to claim →</a>
        <a className="k-btn k-btn--ghost" href="13-Exports-history.html">View all exports</a>
      </div>
    </div>
  </div>
);

// ── 1b · EXPORT FAILED — validation blocked, downloads disabled ─────────────
const ExportFailed = () => (
  <div className="k-claims">
    <TopBar active="Exports" />
    <div className="k-exsucc">
      <div className="k-exsucc-burst k-exsucc-burst--fail"><Icon d={I.warn} size={38} stroke={2} /></div>
      <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Export failed</div>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.028em', margin: '8px 0 10px', lineHeight: 1.05, textAlign: 'center' }}>
        Something went wrong on our end.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 540, textAlign: 'center', lineHeight: 1.55 }}>
        Kevin couldn't finish building this export. Your claim and every line item are
        untouched — nothing was lost. Try again, and if it keeps failing send us the
        reference below.
      </p>

      <div className="k-exsucc-card">
        <div className="k-exsucc-file">
          <div className="k-exsucc-file-ic k-exsucc-file-ic--fail"><Icon d={I.zip} size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-3)' }}>CLM-2026-04412_Reyes_xactimate_2026-06-22.xlsx</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>57 items · attempted 2:41p · EXP-2026-1142</div>
          </div>
          <Badge tone="warn" dot={true}>Failed</Badge>
        </div>

        <div className="k-exfail-list">
          {[
            ['Spreadsheet generation failed', 'The XactContents template did not finish writing · error XLSX_WRITE_TIMEOUT'],
            ['Attempted 3 times', 'Last attempt 2:41p · retries are automatic for the first two'],
            ['Reference EXP-2026-1142', 'Quote this if you contact support — it links to the full job log'],
          ].map(([t, s], i) => (
            <div key={i} className="k-exfail-row">
              <span className="k-exfail-ic"><Icon d={I.warn} size={13} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{s}</div>
              </div>
              <span />
            </div>
          ))}
        </div>

        <div className="k-exsucc-actions">
          <button className="k-btn k-btn--lg" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}><Icon d={I.download} size={13}/> Download inventory <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 4 }}>.xlsx</span></button>
          <button className="k-btn k-btn--ghost k-btn--lg" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}><Icon d={I.download} size={13}/> Download bundle</button>
          <button className="k-btn k-btn--ghost k-btn--lg" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>Copy share link</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="k-btn"><Icon d={I.refresh} size={13}/> Try export again</button>
        <a className="k-btn k-btn--ghost" href="05-Worksheet-flat.html">Back to worksheet</a>
        <a className="k-btn k-btn--ghost" href="38-Contact.html">Contact support</a>
      </div>
    </div>
  </div>
);

// ── 2 · EMPTY CLAIMS DASHBOARD — real first-run state ────────────────────────
const ClaimsEmpty = () => {
  // Time-of-day + first name come from the session in production; the constants
  // below stand in for `session.user.firstName`.
  const h = new Date().getHours();
  const partOfDay = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const firstName = 'Mariana';
  return (
  <div className="k-claims">
    <TopBar active="My claims" />
    <div className="k-claims-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 32, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.05 }}>Good {partOfDay}, {firstName}.</h1>
          <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '6px 0 0' }}>Time for your first claim.</p>
        </div>
        <a className="k-btn" href="03-Intake.html"><Icon d={I.plus} size={12}/> New claim</a>
      </div>

      <div className="k-empty" style={{ margin: '60px auto' }}>
        <div className="k-empty-art k-empty-art--accent">
          <Icon d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>} size={28} stroke={1.4} />
        </div>
        <div className="k-empty-t">No claims yet.</div>
        <div className="k-empty-s">Drop a folder of damage photos and Kevin turns them into an Xactimate-ready inventory in minutes.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <a className="k-btn" href="03-Intake.html">Start your first claim →</a>
          <a className="k-btn k-btn--ghost" href="48-Sample-claim.html">Open a sample claim</a>
        </div>
      </div>

      <div className="k-empty-help">
        {[
          ['Watch the demo', 'See the full flow end to end', I.spark, '52-Watch-demo.html'],
          ['Read the quick-start', 'Five steps to your first export', <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6"/></>, '24-Docs.html'],
          ['Book onboarding', 'We configure your first claim live', <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, '51-Book-call.html'],
        ].map(([t, s, ic, href], i) => (
          <a key={i} className="k-empty-help-card" href={href}>
            <span className="k-empty-help-ic"><Icon d={ic} size={16} /></span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{s}</div>
            </div>
            <Icon d={I.chevright} size={13} />
          </a>
        ))}
      </div>
    </div>
  </div>
  );
};

Object.assign(window, { ExportSuccess, ExportFailed, ClaimsEmpty });
