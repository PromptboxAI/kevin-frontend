// Docs — 44 articles across 8 sections, rendered from block data in
// docs-articles.jsx + docs-articles-2.jsx + docs-articles-3.jsx (parts 1-3).
// Every nav item resolves to an article; no dead links.
// Content is DATA on purpose: it lifts into GitBook or a CMS untouched.

const { KevinWordmark, Icon, I, Badge } = window;

const DOC_NAV = [
  { section: 'Getting started', items: [
    ['quick-start',           'Quick start'],
    ['first-claim',           'Creating your first claim'],
    ['uploading-photos',      'Uploading photos'],
    ['photo-sets',            'Reviewing photo sets'],
    ['reviewing-worksheet',   'Reviewing the worksheet'],
    ['exporting-xactimate',   'Exporting to Xactimate'],
  ]},
  { section: 'Worksheet', items: [
    ['editing-cells',         'Editing cells'],
    ['bulk-actions',          'Bulk actions'],
    ['search-filter',         'Search & filter'],
    ['content-classes',       'Content classes'],
    ['depreciation-overrides','Depreciation overrides'],
    ['rcv-comps',             'RCV comps & proof links'],
    ['unpriced-items',        'Unpriced items'],
    ['special-limits',        'Special-limits flags'],
    ['item-panel',            'The item panel'],
  ]},
  { section: 'Exporting', items: [
    ['format-xlsx',           'Xactimate (Excel) format'],
    ['format-pdf',            'PDF inventory'],
    ['format-bundle',         'The full bundle'],
    ['share-links',           'Share links'],
    ['export-history',        'Export history & re-exporting'],
  ]},
  { section: 'Claims & policies', items: [
    ['claim-statuses',        'Claim statuses'],
    ['pp-limit',              'Personal property limit'],
    ['depreciation-schedules','Depreciation schedules'],
    ['carrier-profiles',      'Carrier profiles'],
    ['audit-log',             'The audit log'],
    ['photos-tab',            'The Photos tab'],
    ['archive-delete',        'Archiving & deleting claims'],
    ['holdback-recovery',     'Recovering your holdback'],
  ]},
  { section: 'In the field', items: [
    ['mobile-capture',        'Capturing from your phone'],
    ['mobile-pairing',        'Pairing a phone to a claim'],
    ['mobile-notes',          'Notes while you shoot'],
    ['mobile-review',         'Reviewing on mobile'],
  ]},
  { section: 'Estate sale mode', items: [
    ['estate-mode',           'Estate sale mode'],
    ['fair-market-value',     'Fair market value'],
    ['condition-status',      'Condition & status'],
  ]},
  { section: 'Account', items: [
    ['storage-fair-use',      'Storage & fair use'],
    ['billing-plans',         'Billing & plans'],
    ['security-passkeys',     'Security & passkeys'],
    ['team-roles',            'Team & roles'],
    ['api-webhooks',          'API & webhooks'],
  ]},
  { section: 'Troubleshooting', items: [
    ['trouble-upload',        'Photos won\u2019t upload'],
    ['trouble-wrong-item',    'An item came back wrong'],
    ['trouble-export',        'An export failed'],
    ['notifications',         'Notifications & alerts'],
    ['glossary',              'Glossary'],
  ]},
];

const DOC_ALL = Object.assign({}, window.DOC_ARTICLES_A, window.DOC_ARTICLES_B, window.DOC_ARTICLES_C);
const DOC_SECTION_OF = (slug) => (DOC_NAV.find(s => s.items.some(([id]) => id === slug)) || {}).section || '';
const DOC_FLAT = DOC_NAV.flatMap(s => s.items.map(([id, label]) => ({ id, label, section: s.section })));

// ── Block renderer — one component per block type, no markup in the content ──
const docSlugify = (s) => 'h-' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const DocBlock = ({ block }) => {
  const [kind, payload] = block;
  if (kind === 'h2')   return <h2 className="k-docs-h2" id={docSlugify(payload)}>{payload}</h2>;
  if (kind === 'p')    return <p>{payload}</p>;
  if (kind === 'ul')   return <ul className="k-docs-list">{payload.map((it, i) => <li key={i}>{it}</li>)}</ul>;
  if (kind === 'ol')   return <ol className="k-docs-list k-docs-list--num">{payload.map((it, i) => <li key={i}>{it}</li>)}</ol>;
  if (kind === 'code') return <pre className="k-docs-code">{payload}</pre>;
  if (kind === 'note') return (
    <div className="k-docs-callout">
      <Icon d={I.info} size={14} />
      <div>{payload}</div>
    </div>
  );
  if (kind === 'table') {
    const [head, ...rows] = payload;
    return (
      <div className="k-docs-tablewrap">
        <table className="k-docs-table">
          <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  return null;
};

const Docs = () => {
  const [slug, setSlug] = React.useState('quick-start');
  const [q, setQ] = React.useState('');
  const art = DOC_ALL[slug];
  const idx = DOC_FLAT.findIndex(a => a.id === slug);
  const prev = idx > 0 ? DOC_FLAT[idx - 1] : null;
  const next = idx < DOC_FLAT.length - 1 ? DOC_FLAT[idx + 1] : null;

  // Search matches title, summary, and body text across every article.
  const fold = (s) => (s || '').toLowerCase();
  const hits = q.trim()
    ? DOC_FLAT.filter(a => {
        const d = DOC_ALL[a.id];
        if (!d) return false;
        const body = d.blocks.map(b => (Array.isArray(b[1]) ? JSON.stringify(b[1]) : b[1])).join(' ');
        return fold(a.label + ' ' + d.summary + ' ' + body).includes(fold(q));
      })
    : null;

  const headings = art ? art.blocks.filter(b => b[0] === 'h2').map(b => b[1]) : [];

  return (
    <div className="k-docs">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <span style={{ fontSize: 13, color: 'var(--k-fg-2)' }}>Docs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="k-search" style={{ minWidth: 320 }}>
            <Icon d={I.search} size={12} />
            <input placeholder={`Search ${DOC_FLAT.length} articles`} value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="k-icon-btn" onClick={() => setQ('')} title="Clear">✕</button>}
          </div>
          <a className="k-btn k-btn--ghost" href="00-Sign-in.html">Sign in</a>
          <a className="k-btn" href="58-Account-create.html">Start a claim</a>
        </div>
      </header>

      <div className="k-docs-body">
        <aside className="k-docs-nav">
          {DOC_NAV.map((sec, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div className="k-docs-nav-h">{sec.section}</div>
              {sec.items.map(([id, label]) => (
                <button
                  key={id}
                  className={`k-docs-nav-item ${id === slug ? 'k-docs-nav-item--on' : ''}`}
                  onClick={() => { setSlug(id); setQ(''); }}
                >{label}</button>
              ))}
            </div>
          ))}
        </aside>

        <main className="k-docs-main">
          {hits ? (
            <React.Fragment>
              <h1 className="k-docs-h1">{hits.length} result{hits.length === 1 ? '' : 's'}</h1>
              <p className="k-docs-lede">Matching “{q}” across all {DOC_FLAT.length} articles.</p>
              <div className="k-docs-results">
                {hits.map(h => (
                  <button key={h.id} className="k-docs-result" onClick={() => { setSlug(h.id); setQ(''); }}>
                    <span className="k-docs-result-sec">{h.section}</span>
                    <span className="k-docs-result-t">{h.label}</span>
                    <span className="k-docs-result-d">{DOC_ALL[h.id].summary}</span>
                  </button>
                ))}
                {hits.length === 0 && <p style={{ color: 'var(--k-fg-3)' }}>Nothing matched. Try a shorter phrase, or email kevin@kevin.co.</p>}
              </div>
            </React.Fragment>
          ) : art ? (
            <React.Fragment>
              <div className="k-docs-bread">
                <span>{DOC_SECTION_OF(slug)}</span>
                <Icon d={I.chevright} size={10} />
                <span style={{ color: 'var(--k-fg)' }}>{art.title}</span>
              </div>
              <h1 className="k-docs-h1">{art.title}</h1>
              <p className="k-docs-lede">{art.summary}</p>

              {headings.length > 2 && (
                <div className="k-docs-toc">
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>In this article</div>
                  {headings.map((h, i) => (
                    <button key={i} className="k-docs-toc-item" onClick={() => {
                      const el = document.getElementById(docSlugify(h));
                      if (!el) return;
                      // Walk up to whatever actually scrolls — the docs pane at tall
                      // viewports, the document (or a host wrapper) at laptop heights.
                      let node = el.parentElement;
                      while (node && node !== document.body) {
                        const oy = getComputedStyle(node).overflowY;
                        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 4) break;
                        node = node.parentElement;
                      }
                      const target = el.getBoundingClientRect().top;
                      if (node && node !== document.body) {
                        node.scrollTop += target - node.getBoundingClientRect().top - 16;
                      } else {
                        const se = document.scrollingElement || document.documentElement;
                        se.scrollTop += target - 76;
                      }
                    }}>
                      <span style={{ fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-4)', fontSize: 11, width: 26 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span>{h}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="k-docs-article">
                {art.blocks.map((b, i) => <DocBlock key={i} block={b} />)}
              </div>

              <div className="k-docs-pager">
                {prev ? (
                  <button className="k-docs-pagebtn" onClick={() => setSlug(prev.id)}>
                    <span className="k-docs-pagebtn-l">← Previous</span>
                    <span className="k-docs-pagebtn-t">{prev.label}</span>
                  </button>
                ) : <div />}
                {next ? (
                  <button className="k-docs-pagebtn k-docs-pagebtn--next" onClick={() => setSlug(next.id)}>
                    <span className="k-docs-pagebtn-l">Next →</span>
                    <span className="k-docs-pagebtn-t">{next.label}</span>
                  </button>
                ) : <div />}
              </div>

              <div className="k-docs-help">
                Still stuck? Email <a href="mailto:kevin@kevin.co" style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>kevin@kevin.co</a> — it goes straight to a person who has settled claims.
              </div>
            </React.Fragment>
          ) : null}
        </main>
      </div>
    </div>
  );
};

window.Docs = Docs;
