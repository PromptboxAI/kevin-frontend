// Holdback recovery — POST-SETTLEMENT surface for a settled claim.
// The carrier paid ACV and withheld the depreciation; recovering it means proving
// each item was actually replaced (claimed_rcv) and attaching the receipt.
// Contract (51072f0): claimed_rcv NEVER moves rcv/acv/depreciation — the settled
// schedule stays put. null = not claimed yet; 0 is a REAL value (warranty/gifted).
// One receipt per line (re-upload replaces). NO export button here — the backend
// is building the dedicated "Depreciation Recovery Request" export concurrently.
// Settled schedule comes from the seed layer (buildSettledRows in data.jsx —
// the backend stand-in owns the math per rule 20); this component renders it
// verbatim, exactly as it will render the API's stored schedule.
const HB_ROWS = window.buildSettledRows(57);

const HoldbackRecovery = ({ sample = false }) => {
  // Sample tour prefill: one fully documented line, one claimed-without-receipt
  // (mirrors the export's MISSING), one partial spend showing the unclaimed hint.
  const [claims, setClaims] = React.useState(() => {
    if (!sample) return {};
    const seed = {};
    const a = HB_ROWS[0], b = HB_ROWS[1];
    const p = HB_ROWS.find(r => r !== a && r !== b && (r.qty || 1) > 1 && (r.depreciation_amount || 0) > 5)
      || HB_ROWS.find(r => r !== a && r !== b && (r.depreciation_amount || 0) > 20) || HB_ROWS[2];
    // The list payload ships recoverable per line — the seed mirrors that shape.
    const rec = (row, claimed, k) => { const qty = row.qty || 1, kk = Math.min(k != null ? k : qty, qty); const acvK = (row.acv_total_incl || 0) / qty * kk; const wK = (row.depreciation_amount || 0) / qty * kk; return Math.round(Math.max(0, Math.min(claimed - acvK, wK)) * 100) / 100; };
    if (a) seed[a.id] = { claimed: a.rcv_total_incl, receipt: 'receipt_' + a.id + '.pdf', recoverable: rec(a, a.rcv_total_incl) };
    if (b) seed[b.id] = { claimed: b.rcv_total_incl, recoverable: rec(b, b.rcv_total_incl) };
    if (p) {
      const qty = p.qty || 1, k = qty > 1 ? 1 : qty;
      // Spent exactly one unit's replacement cost → clean "1 of N replaced" story.
      const pc = Math.round((p.rcv_total_incl || 0) / qty * k * 100) / 100;
      seed[p.id] = { replaced: k, claimed: pc, receipt: 'invoice_' + p.id + '.jpg', recoverable: rec(p, pc, k) };
    }
    return seed;
  });   // id → { claimed, receipt }
  const patch = (id, p) => setClaims(c => ({ ...c, [id]: { ...(c[id] || {}), ...p } }));
  // Money edits round-trip the server: the PATCH response carries the recomputed
  // recoverable and the UI stores it verbatim (same pattern as depreciation recalc).
  const commit = (row, p) => {
    setClaims(c => {
      const cur = { ...(c[row.id] || {}), ...p, recoverable: undefined, recPending: true };
      window.KevinAPI.patchReplacement(row, { claimed: cur.claimed ?? null, replaced_qty: cur.replaced ?? null })
        .then(res => setClaims(c2 => ({ ...c2, [row.id]: { ...(c2[row.id] || {}), recoverable: res.recoverable, recPending: false } })));
      return { ...c, [row.id]: cur };
    });
  };
  // Recovery math: the insured gets back what they actually spent ABOVE the ACV
  // already paid, capped at the withheld depreciation. Spend the full est. RCV
  // → full holdback; spend less → the shortfall stays with the carrier.
  // recoverable ships on the payload (ClaimItemSummary + Detail), computed by the
  // SAME function the export uses — the UI never derives it (money contract).
  // 0.0, never null; legitimately less than depreciation_amount on partial spend.
  // The seed's stand-in lives in data.jsx (settledRecoverable) as the mock API.
  const replacedOf = (r, c) => Math.min(c.replaced != null ? c.replaced : (r.qty || 1), r.qty || 1);
  // recoverable is READ, never derived — it arrives on the payload (rule 20).
  const recoverable = (r, c) => c.recoverable == null ? 0 : c.recoverable;
  const withheld = HB_ROWS.reduce((t, r) => t + (r.depreciation_amount || 0), 0);
  const entries = HB_ROWS.map(r => ({ r, c: claims[r.id] || {} }));
  const documented = entries.filter(({ c, r }) => c.claimed != null && c.receipt && replacedOf(r, c) !== 0);
  const docAmt = documented.reduce((t, { r, c }) => t + recoverable(r, c), 0);
  const fmt = window.fmtUSD;
  return (
    <div className="k-worksheet">
      {!sample && <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="01-My-claims.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="My claims" />
        </div>
        <window.AvatarMenu />
      </header>}

      <section className="k-claim-hd">
        <div>
          {!sample && <a href="12-Claim-overview.html" className="k-crumb" title="Back to the claim"><Icon d={I.chevleft} size={12} /> Godfrey — Kitchen fire</a>}
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.02em', margin: '6px 0 2px' }}>Holdback recovery</h1>
          <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>Settled at ACV · the carrier withheld the depreciation. Prove each replacement to recover it — the settled schedule itself never changes.</div>
        </div>
        <div className="k-claim-ov-stats">
          <div><div className="k-tot-l">Withheld</div><div className="k-tot-v">{fmt(withheld)}</div></div>
          <div><div className="k-tot-l">Recoverable · documented</div><div className="k-tot-v" style={{ color: 'var(--k-ok)' }}>{fmt(docAmt)}</div></div>
          <div><div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>Still on the table</div><div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>{fmt(withheld - docAmt)}</div></div>
        </div>
      </section>

      <div style={{ padding: '14px 24px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge tone="quiet">{documented.length} of {entries.length} lines documented</Badge>
        <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Every edit saves as you go</span>
        {entries.some(({ c }) => c.claimed != null && !c.receipt) && (
          <Badge tone="warn" dot={true}>{(n => `${n} missing receipt${n === 1 ? '' : 's'}`)(entries.filter(({ c }) => c.claimed != null && !c.receipt).length)}</Badge>
        )}
        <span style={{ flex: 1 }} />
        {/* GET /v1/claims/{id}/holdback-export — repeatable by design: requests go out
            in batches as receipts arrive; never stamps exported_at. format=xlsx|pdf →
            worksheet only · format=receipts → receipts-only .zip · format=zip → PDF
            worksheet + receipts in one archive. 409 with zero claimed lines; receipt
            formats need ≥1 attached receipt. Claimed-without-receipt prints MISSING. */}
        {entries.every(({ c }) => c.claimed == null) ? (
          <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>No replaced items yet — enter an actual cost to start a recovery request.</span>
        ) : (
          <React.Fragment>
            <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12} /> Worksheet · .xlsx</button>
            <button className="k-btn k-btn--ghost" onClick={() => { window.location.href = '78-Recovery-request-PDF.html'; }}><Icon d={I.download} size={12} /> Worksheet · PDF</button>
            <button className="k-btn k-btn--ghost" disabled={documented.length === 0} title={documented.length === 0 ? 'Needs at least one attached receipt' : 'Just the receipt files, zipped'}>
              <Icon d={I.zip} size={12} /> Receipts · .zip
            </button>
            <button className="k-btn" disabled={documented.length === 0} title={documented.length === 0 ? 'Needs at least one line with a cost and a receipt' : 'PDF worksheet plus every attached receipt, zipped — ready to send to the carrier'}>
              <Icon d={I.zip} size={12} /> Worksheet + receipts · .zip{documented.length > 0 ? ` (${documented.length})` : ''}
            </button>
          </React.Fragment>
        )}
      </div>

      <section className="k-set-card" style={{ margin: '0 24px 28px', padding: 0, overflow: 'hidden' }}>
        <div className="k-adm-tbl-hd" style={{ '--adm-cols': '52px 2fr 0.5fr 0.7fr 0.8fr 0.8fr 0.8fr 1fr 0.95fr 1.1fr 1.1fr' }}>
          <span>#</span><span>Description</span><span>Qty</span><span>Replaced</span><span>Est. RCV</span><span>ACV paid</span><span>Withheld</span><span>Actual cost</span><span>Back to insured</span><span>Receipt</span><span>Status</span>
        </div>
        {entries.map(({ r, c }, i) => {
          const done = c.claimed != null && c.receipt;
          return (
          <div key={r.id} className="k-adm-tr" style={{ '--adm-cols': '52px 2fr 0.5fr 0.7fr 0.8fr 0.8fr 0.8fr 1fr 0.95fr 1.1fr 1.1fr', cursor: 'default' }}>
            <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-4)' }}>{String(i + 1).padStart(4, '0')}</span>
            <span style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</span>
            <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)' }}>{r.qty || 1}</span>
            <span>
              {(r.qty || 1) > 1 ? (
                <input className="k-insp-input" inputMode="numeric" placeholder={String(r.qty)}
                  value={c.replacedText ?? (c.replaced != null ? String(c.replaced) : '')}
                  onFocus={() => patch(r.id, { replacedText: '' })}
                  onChange={(e) => patch(r.id, { replacedText: e.target.value })}
                  onBlur={() => {
                    const t = (c.replacedText || '').trim();
                    commit(r, { replaced: t === '' ? (c.replaced ?? null) : Math.max(0, Math.min(r.qty || 1, Math.round(parseFloat(t) || 0))), replacedText: undefined });
                  }}
                  title="How many of these units were actually replaced — recovery pro-rates to this count"
                  style={{ width: 44, padding: '5px 6px', fontFamily: 'var(--k-font-mono)', fontSize: 12, textAlign: 'right' }} />
              ) : <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-4)' }}>1</span>}
            </span>
            <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)' }}>{fmt(r.rcv_total_incl || 0)}</span>
            <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, color: 'var(--k-fg-3)' }}>{fmt(r.acv_total_incl || 0)}</span>
            <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, fontWeight: 600 }}>{fmt(r.depreciation_amount || 0)}</span>
            <span>
              <input className="k-insp-input" inputMode="decimal" placeholder="$ actual"
                value={c.claimedText ?? (c.claimed != null ? '$' + c.claimed.toFixed(2) : '')}
                onFocus={() => patch(r.id, { claimedText: '' })}
                onChange={(e) => patch(r.id, { claimedText: e.target.value })}
                onBlur={() => {
                  const t = (c.claimedText || '').replace(/[$,\s]/g, '');
                  // PATCH …/{row_id} { claimed_rcv } — empty clears (null); 0 is a real value.
                  commit(r, { claimed: t === '' ? (c.claimed ?? null) : Math.max(0, Math.round((parseFloat(t) || 0) * 100) / 100), claimedText: undefined });
                }}
                style={{ width: 92, padding: '5px 8px', fontFamily: 'var(--k-font-mono)', fontSize: 12 }} />
            </span>
            <span>
              {c.claimed == null ? <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>—</span> : (
                <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--k-ok)' }}>{c.recPending ? '…' : fmt(recoverable(r, c))}</span>
                  {replacedOf(r, c) === 0 && c.claimed != null && (
                    <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)' }} title="Replaced count of 0 is stored as a real value — this line is left off the recovery request until a count is entered.">
                      0 replaced — left off the request
                    </span>
                  )}
                  {replacedOf(r, c) > 0 && (r.depreciation_amount || 0) - recoverable(r, c) > 0.005 && (
                    <span style={{ fontSize: 10.5, color: 'var(--k-warn-ink, oklch(0.5 0.1 80))' }} title="Recovery is capped at the replaced units' share of the holdback, and at what was actually spent above those units' ACV — the rest stays with the carrier.">
                      {fmt((r.depreciation_amount || 0) - recoverable(r, c))} unclaimed{replacedOf(r, c) < (r.qty || 1) ? ` · ${replacedOf(r, c)} of ${r.qty} replaced` : ''}
                    </span>
                  )}
                </span>
              )}
            </span>
            <span>
              {c.receipt ? (
                <button className="k-btn k-btn--ghost k-btn--sm" title="One receipt per line — uploading again replaces it" onClick={() => document.getElementById('hb-file-' + r.id).click()}>
                  <Icon d={I.check} size={11} /> {c.receipt.length > 14 ? c.receipt.slice(0, 12) + '…' : c.receipt}
                </button>
              ) : c.claimed != null ? (
                <button className="k-btn k-btn--ghost k-btn--sm" style={{ borderColor: 'var(--k-warn)', color: 'var(--k-warn-ink, oklch(0.5 0.1 80))' }} title="Prints as MISSING on the recovery request until a receipt is attached" onClick={() => document.getElementById('hb-file-' + r.id).click()}>
                  <Icon d={I.warn} size={11} /> Missing — add receipt
                </button>
              ) : (
                <button className="k-btn k-btn--ghost k-btn--sm" onClick={() => document.getElementById('hb-file-' + r.id).click()}>
                  <Icon d={I.upload} size={11} /> Add receipt
                </button>
              )}
              <input id={'hb-file-' + r.id} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files[0]; if (f) patch(r.id, { receipt: f.name }); }} />
            </span>
            <span>
              {done ? <Badge tone="ok" dot={true}>Documented</Badge>
                : c.claimed != null ? <Badge tone="warn" dot={true}>Needs receipt</Badge>
                : <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Not replaced yet</span>}
            </span>
          </div>
        );})}
      </section>
    </div>
  );
};
window.HoldbackRecovery = HoldbackRecovery;
