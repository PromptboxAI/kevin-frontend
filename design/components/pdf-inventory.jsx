// PDF inventory — ⚠️ PREVIEW ONLY.
// The carrier-facing PDF is generated SERVER-SIDE at
// GET /v1/claims/{claim_id}/export?format=pdf, with the money contract, the
// totals row, PCS codes and the Source Link column already applied. This page
// renders the SAME server fields for on-screen review; it must never compute
// money, or the document a carrier reads has two sources of truth.

const { fmtUSD, fmtUSDshort, buildWorksheetRows, KevinWordmark, Icon, I } = window;

// Reads the server's tax-inclusive line totals. Defined locally on purpose —
// relying on worksheet.jsx's copy via shared Babel scope silently couples this
// document to another file's internals.
const lineTotals = (r) => ({
  subtotal: r.rcv == null ? null : Math.round(r.rcv * r.qty * 100) / 100,   // Ext. Cost, PRE-tax (§5b)
  tax: r.tax,
  rcvIncl: r.rcv_total_incl,
  dep: r.depreciation_amount,
  acv: r.acv_total_incl,
  unpriced: r.rcv == null,
});

const PDF_METHODS = {
  straight_line: {
    label: 'Straight-line',
    meta: 'Straight-line · (age ÷ useful life), capped at 90%',
    note: 'Depreciation was calculated on a straight-line basis: each item’s age divided by the useful life for its content class, capped at 90% so a salvage floor is always retained.',
  },
  bracketed: {
    label: 'Bracketed',
    meta: 'Bracketed · standard schedule (class × age bracket)',
    note: 'Depreciation was applied from the standard bracketed schedule, which assigns a percentage by content class and age bracket (<1 yr, 1–2, 3–5, 6–10, 11–15, >15 yr). Rates follow the industry-standard table carried by every carrier profile.',
  },
  custom: {
    label: 'Custom',
    meta: 'Custom · preparer-entered rates',
    note: 'Depreciation percentages on this inventory were entered by the preparer rather than derived from a schedule. Each figure reflects the preparer’s assessment of the item’s condition and remaining life; all changes are recorded in the claim audit log.',
  },
};
const PDF_CAP = 90;

const CLAIM = {
  id: 'CLM-2026-04412', insured: 'Kevin Godfrey', carrier: 'Allstate',
  addr: '123 Main St., Smithtown, NY 11787', loss: 'Kitchen fire',
  dateLoss: 'Apr 2, 2026', datePrepared: 'May 25, 2026', taxRate: '8.625%',
  adjuster: 'M. Reyes · Reyes Adjusting, LLC',
  license: 'NY 2401-44210',
};

// method comes from the claim (`depreciation_method` on the payload). It is NOT
// selectable here — a finished document does not offer to recompute itself.
const PdfInventory = ({ method = 'straight_line' }) => {
  const [rows, setRows] = React.useState(null);
  const [busy, setBusy] = React.useState(true);
  const M = PDF_METHODS[method];
  const baseRows = React.useMemo(() => buildWorksheetRows(57), []);
  // No depreciation math happens in this file. Switching method fires a request
  // and the document re-renders from whatever the server returns, so the printed
  // figures can never drift from the backend by a rounding penny (rule 20).
  React.useEffect(() => {
    let live = true;
    setBusy(true);
    window.KevinAPI.recalcClaimDepreciation(CLAIM.number, method, baseRows).then((res) => {
      if (!live) return;
      const byId = new Map(res.items.map((i) => [i.id, i]));
      setRows(baseRows.map((r) => {
        const s = byId.get(r.id) || {};
        return { ...r, depreciation_pct: s.dep != null ? s.dep : r.depreciation_pct, life: s.life || null };
      }));
      setBusy(false);
    });
    return () => { live = false; };
  }, [baseRows, method]);

  if (!rows) return <div className="pdf-loading">Rendering inventory…</div>;
  const totals = rows.reduce((a, r) => {
    const { subtotal, dep, tax, acv } = lineTotals(r);
    a.rcv += subtotal || 0; a.dep += dep || 0; a.tax += tax || 0; a.acv += acv || 0; a.qty += r.qty;
    return a;
  }, { rcv: 0, dep: 0, tax: 0, acv: 0, qty: 0 });

  return (
    <React.Fragment>
    <div className="pdf-methodbar" data-noprint="true">
      <a className="pdf-methodbar-back" href="05-Worksheet-flat.html" title="Close — back to the worksheet"><Icon d={I.close} size={14} /></a>
      <span className="pdf-methodbar-l">PDF inventory · preview</span>
      {busy && <span className="pdf-methodbar-busy">Calculating on the server…</span>}
      <div style={{ flex: 1 }} />
      <button className="k-btn k-btn--sm k-btn--ghost" onClick={() => window.print()}><Icon d={I.printer} size={12} /> Print</button>
      <a className="k-btn k-btn--sm" href="06-Export-modal.html"><Icon d={I.download} size={12} /> Download</a>
    </div>
    <doc-page size="letter" orientation="landscape" margin="0.55in">
      {/* running header — the PREPARER's brand, never Kevin's. Firm name + logo
          come from Settings → Business; Kevin appears only in the small footer. */}
      <div slot="header" className="pdf-rh">
        <span className="pdf-rh-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--pdf-accent)', color: '#fff', display: 'inline-grid', placeItems: 'center', fontSize: 9, fontWeight: 700, letterSpacing: 0 }}>RA</span>
          Reyes Adjusting, LLC
        </span>
        <span className="pdf-rh-meta">Personal Property Inventory · {CLAIM.id}</span>
      </div>
      {/* running footer */}
      <div slot="footer" className="pdf-rf">
        <span>{CLAIM.insured} · {CLAIM.loss}</span>
        {/* On by default; removable in Settings → Business → Branding. A carrier
            adjuster reading a clean, sourced schedule is the best advertisement. */}
        <span>Prepared with Kevin · kevin.co · Confidential</span>
      </div>

      {/* — Cover / summary block — */}
      <div className="pdf-cover">
        <div className="pdf-eyebrow">Personal Property Inventory</div>
        <h1 className="pdf-title">{CLAIM.loss} — {CLAIM.insured}</h1>
        <div className="pdf-sub">Contents inventory prepared for claim review</div>

        <div className="pdf-meta-grid">
          {[
            ['Claim number', CLAIM.id],
            ['Insured', CLAIM.insured],
            ['Carrier', CLAIM.carrier],
            ['Loss location', CLAIM.addr],
            ['Date of loss', CLAIM.dateLoss],
            ['Date prepared', CLAIM.datePrepared],
            ['Prepared by', CLAIM.adjuster],
            ['Adjuster licence', CLAIM.license],
            ['Valuation basis', 'RCV plus sales tax, less depreciation = ACV'],
            ['Depreciation method', M.meta],
          ].map(([l, v], i) => (
            <div key={i} className="pdf-meta">
              <div className="pdf-meta-l">{l}</div>
              <div className="pdf-meta-v">{v}</div>
            </div>
          ))}
        </div>

        <div className="pdf-totals">
          <div className="pdf-tot"><div className="pdf-tot-l">Line items</div><div className="pdf-tot-v">{rows.length}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Total quantity</div><div className="pdf-tot-v">{totals.qty}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Replacement cost (RCV)</div><div className="pdf-tot-v">{fmtUSD(totals.rcv)}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Plus sales tax</div><div className="pdf-tot-v" style={{ color: 'var(--pdf-muted)' }}>{fmtUSD(totals.tax)}</div></div>
          <div className="pdf-tot"><div className="pdf-tot-l">Less depreciation</div><div className="pdf-tot-v" style={{ color: 'var(--pdf-muted)' }}>{totals.dep > 0 ? '−' + fmtUSD(totals.dep) : fmtUSD(0)}</div></div>
          <div className="pdf-tot pdf-tot--big"><div className="pdf-tot-l">Actual cash value (ACV)</div><div className="pdf-tot-v">{fmtUSD(totals.acv)}</div></div>
        </div>
        <div className="pdf-note">Sales tax ({CLAIM.taxRate}) of {fmtUSD(totals.tax)} is shown per line item and included in the ACV above. Each replacement cost is backed by three live retailer comps (median shown); dated source links are retained in the digital file.</div>
      </div>

      {/* — Itemized table — */}
      <h2 className="pdf-h2">Itemized inventory</h2>
      <table className="pdf-table">
        <thead>
          <tr>
            <th className="pdf-c-num">#</th>
            <th className="pdf-c-room">Room / Area</th>
            <th className="pdf-c-qty">Qty</th>
            <th className="pdf-c-desc">Description</th>
            <th className="pdf-c-make">Make · Model</th>
            <th className="pdf-c-num2">Unit Cost</th>
            <th className="pdf-c-num2">Ext. Cost</th>
            <th className="pdf-c-num2">Sales Tax</th>
            <th className="pdf-c-num2">RCV + Tax</th>
            <th className="pdf-c-age">Age</th>
            <th className="pdf-c-num2">% Depr.</th>
            <th className="pdf-c-num2">$ Depr.</th>
            <th className="pdf-c-num2">ACV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const { subtotal, dep, tax, acv, rcvIncl, unpriced } = lineTotals(r);
            return (
              <tr key={r.id} className={r.special_limits ? 'pdf-row-sl' : ''}>
                <td className="pdf-c-num pdf-mono">{String(i + 1).padStart(3, '0')}</td>
                <td className="pdf-c-room">{r.room || '—'}</td>
                <td className="pdf-c-qty pdf-mono">{r.qty}</td>
                <td className="pdf-c-desc">
                  {r.desc}
                  {r.special_limits && <span className="pdf-sl-tag">Special limits</span>}
                </td>
                <td className="pdf-c-make">{r.mfr}{r.model ? <span className="pdf-model"> · {r.model}</span> : ''}</td>
                <td className="pdf-c-num2 pdf-mono">{fmtUSD(r.rcv || 0)}</td>
                <td className="pdf-c-num2 pdf-mono">{fmtUSD(subtotal || 0)}</td>
                <td className="pdf-c-num2 pdf-mono pdf-muted">{fmtUSD(tax || 0)}</td>
                <td className="pdf-c-num2 pdf-mono">{fmtUSD(rcvIncl || 0)}</td>
                <td className="pdf-c-age pdf-mono">{r.age_years ?? 0}</td>
                <td className="pdf-c-num2 pdf-mono pdf-muted">{unpriced || r.depreciation_pct == null ? '0%' : Math.round(r.depreciation_pct * 1000) / 10 + '%'}</td>
                <td className="pdf-c-num2 pdf-mono pdf-muted">{dep > 0 ? '−' + fmtUSD(dep) : fmtUSD(0)}</td>
                <td className="pdf-c-num2 pdf-mono pdf-strong">{fmtUSD(acv || 0)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="pdf-total-row">
            <td colSpan={5}>Total · {rows.length} line items</td>
            <td className="pdf-c-num2 pdf-mono pdf-muted"></td>
            <td className="pdf-c-num2 pdf-mono">{fmtUSD(totals.rcv)}</td>
            <td className="pdf-c-num2 pdf-mono pdf-muted">{fmtUSD(totals.tax)}</td>
            <td className="pdf-c-num2 pdf-mono">{fmtUSD(totals.rcv + totals.tax)}</td>
            <td className="pdf-c-age"></td>
            <td className="pdf-c-num2 pdf-mono pdf-muted"></td>
            <td className="pdf-c-num2 pdf-mono pdf-muted">{totals.dep > 0 ? '−' + fmtUSD(totals.dep) : fmtUSD(0)}</td>
            <td className="pdf-c-num2 pdf-mono pdf-strong">{fmtUSD(totals.acv)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="pdf-certify">
        <div className="pdf-certify-t">Preparation notes</div>
        <p>This inventory was compiled from {CLAIM.insured}'s uploaded photographs using Kevin's content-identification and pricing tools, then reviewed line-by-line by the preparer. Replacement costs reflect like-kind-and-quality pricing at the date prepared. {M.note} Items in special-limits classes are flagged for coverage review and are subject to policy caps.</p>
      </div>
    </doc-page>
    </React.Fragment>
  );
};

window.PdfInventory = PdfInventory;
