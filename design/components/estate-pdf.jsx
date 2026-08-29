// Estate inventory PDF — ⚠️ PREVIEW ONLY, and the whole Estate epic is DEFERRED
// on the backend (design finalized, implementation parked until after the core
// adjuster launch). Client-facing document: description · condition · FMV ·
// source. NO insurance math — no RCV/ACV, no depreciation, no tax.
// Backend-confirmed contract when unpaused:
//   route  GET /v1/claims/{id}/export?format=pdf|xlsx&mode=estate  (no /estates resource)
//   FMV V1 = category-specific haircut off the retail RCV from ACTIVE Google
//   Shopping listings — NOT sold-comp medians. Never label a source "sold" —
//   active listings are asking prices; claiming sold data is false provenance.
//   Condition and Sale price are frontend-only fields today (no DB columns);
//   they stay in the design pending the estate epic.

const { fmtUSD, KevinWordmark, Icon: EpdfIcon, I: EPDF_I } = window;

const EPDF_ESTATE = {
  name: 'Estate of W. Holt', client: 'Holt estate sale',
  addr: 'San Antonio, TX', datePrepared: 'May 25, 2026',
  preparer: 'M. Reyes · Reyes Adjusting, LLC',
};

// Median sold comp for a row — the source line the client can verify.
// Seed data multiplies one figure by fixed factors, so the literal median is
// always the same marketplace; rotate per row so the mock reads like real data.
const epdfMedian = (r) => {
  const s = r.alternative_sources || [];
  return s.length ? s[r.id % s.length] : null;
};

const EstatePdf = () => {
  const rows = React.useMemo(() => window.buildEstateRows(96), []);
  const total = rows.reduce((a, r) => a + r.fmv, 0);
  const sold = rows.filter((r) => r.disposition === 'Sold');
  const realised = sold.reduce((a, r) => a + (r.salePrice || 0), 0);
  const keepDonate = rows.filter((r) => r.disposition === 'Keep' || r.disposition === 'Donate');

  return (
    <React.Fragment>
    <div className="pdf-methodbar" data-noprint="true">
      <a className="pdf-methodbar-back" href="62-Estate-worksheet.html" title="Close — back to the estate worksheet"><EpdfIcon d={EPDF_I.close} size={14} /></a>
      <span className="pdf-methodbar-l">Estate inventory PDF · preview</span>
      <div style={{ flex: 1 }} />
      <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => window.print()}><EpdfIcon d={EPDF_I.printer} size={12} /> Print</button>
      <a className="k-btn k-btn--sm" href="62-Estate-worksheet.html"><EpdfIcon d={EPDF_I.download} size={12} /> Download</a>
    </div>
    <doc-page size="letter" margin="0.6in">
      <div slot="header" className="pdf-rh">
        <span className="pdf-rh-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--pdf-accent)', color: '#fff', display: 'inline-grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>RA</span>
          Reyes Adjusting, LLC
        </span>
        <span className="pdf-rh-meta">Estate Inventory · {EPDF_ESTATE.name}</span>
      </div>
      <div slot="footer" className="pdf-rf">
        <span>{EPDF_ESTATE.name} · {EPDF_ESTATE.addr}</span>
        <span>Prepared with Kevin · kevin.co · Confidential</span>
      </div>

      <div className="pdf-cover">
        <div className="pdf-eyebrow">Estate Inventory &amp; Valuation</div>
        <h1 className="pdf-title">{EPDF_ESTATE.name}</h1>
        <div className="pdf-sub">Itemized inventory with fair market values, prepared for the client</div>

        <div className="pdf-meta-grid">
          {[
            ['Estate', EPDF_ESTATE.name],
            ['Client', EPDF_ESTATE.client],
            ['Location', EPDF_ESTATE.addr],
            ['Date prepared', EPDF_ESTATE.datePrepared],
            ['Prepared by', EPDF_ESTATE.preparer],
            ['Valuation basis', 'Fair market value — current replacement cost, adjusted by category'],
          ].map(([l, v], i) => (
            <div key={i} className="pdf-meta">
              <div className="pdf-meta-l">{l}</div>
              <div className="pdf-meta-v">{v}</div>
            </div>
          ))}
        </div>

        <div className="pdf-totals">
          <div className="pdf-tot"><div className="pdf-tot-l">Items cataloged</div><div className="pdf-tot-v">{rows.length}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Sold to date</div><div className="pdf-tot-v">{sold.length}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Keep / donate</div><div className="pdf-tot-v" style={{ color: 'var(--pdf-muted)' }}>{keepDonate.length}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Realised to date</div><div className="pdf-tot-v" style={{ color: 'var(--pdf-muted)' }}>{fmtUSD(realised)}</div></div>
          <div className="pdf-tot pdf-tot--big"><div className="pdf-tot-l">Fair market value</div><div className="pdf-tot-v">{fmtUSD(total)}</div></div>
        </div>
        <div className="pdf-note">Each fair market value starts from the current retail replacement cost of the same or a comparable item, adjusted by a category-specific market factor. The source column names the retailer or marketplace behind each figure; dated links are retained in the digital file.</div>
      </div>

      <h2 className="pdf-h2">Itemized inventory</h2>
      <table className="pdf-table pdf-table--estate">
        <thead>
          <tr>
            <th className="pdf-c-num">#</th>
            <th className="pdf-c-room">Room / Area</th>
            <th className="pdf-c-desc">Description</th>
            <th className="pdf-c-cond">Condition</th>
            <th className="pdf-c-src">FMV source</th>
            <th className="pdf-c-num2">FMV</th>
            <th className="pdf-c-num2">Sale price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const m = epdfMedian(r);
            return (
              <tr key={r.id}>
                <td className="pdf-c-num pdf-mono">{String(i + 1).padStart(3, '0')}</td>
                <td className="pdf-c-room">{r.room || '—'}</td>
                <td className="pdf-c-desc">{r.desc}{r.mfr ? <div className="pdf-desc-sub">{r.mfr}{r.model ? <span className="pdf-model"> · {r.model}</span> : ''}</div> : null}</td>
                <td className="pdf-c-cond">{r.condition}</td>
                <td className="pdf-c-src">{m ? m.source : '—'}</td>
                <td className="pdf-c-num2 pdf-mono pdf-strong">{fmtUSD(r.fmv)}</td>
                <td className="pdf-c-num2 pdf-mono pdf-muted">{r.disposition === 'Sold' && r.salePrice != null ? fmtUSD(r.salePrice) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="pdf-total-row">
            <td colSpan={5}>Total · {rows.length} items</td>
            <td className="pdf-c-num2 pdf-mono pdf-strong">{fmtUSD(total)}</td>
            <td className="pdf-c-num2 pdf-mono pdf-muted">{fmtUSD(realised)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="pdf-certify">
        <div className="pdf-certify-t">Preparation notes</div>
        <p>This inventory was compiled from photographs of the estate's contents using Kevin's content-identification and valuation tools, then reviewed item-by-item by the preparer. Fair market values are derived from current retail replacement costs for the same or a comparable item, adjusted by category-specific market factors, and reflect the market at the date prepared. Sale prices shown are amounts actually realised. This document is an inventory and valuation summary, not a formal appraisal.</p>
      </div>
    </doc-page>
    </React.Fragment>
  );
};

window.EstatePdf = EstatePdf;
