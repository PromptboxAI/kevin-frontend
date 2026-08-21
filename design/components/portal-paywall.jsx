// Client portal — PAYWALL state of GET /p/{token} for done-for-you customers.
// Server-shaped: the payload carries ONLY the preview rows in full detail
// (~10%, server-picked across rooms), row COUNT + totals for the rest, and
// blurred placeholders. The client never receives locked line detail —
// blurring is presentation over data that isn't there (devtools-safe).
// Unlock: Stripe hosted checkout; released on the payment WEBHOOK, never the
// browser return URL (per future-client-share-paywall.md).
// Visibility follows the share spec: identity + full money chain visible,
// confidence / comps / substitution internals never sent.

const { fmtUSD, Icon, I, KevinWordmark, Badge } = window;

const PortalPaywall = () => {
  // GET /p/{token} carries the share record incl. unlock_price — set per claim
  // at mint time (inventory size varies); never hardcoded in the UI.
  const share = { unlock_price: 149 }; // mock payload field
  const price = '$' + share.unlock_price;
  // A done-for-you inventory is a FINISHED schedule — ages entered, depreciation
  // applied — so the portal renders the settled seed, not the age-0 live seed.
  const rows = window.buildSettledRows(57);
  const priced = rows.filter(r => r.rcv != null);
  // Server-picked preview: ~10%, spread across rooms (first priced row per room, capped at 6)
  const seen = new Set(); const preview = [];
  for (const r of priced) { if (!seen.has(r.room) && preview.length < 6) { seen.add(r.room); preview.push(r); } }
  const [paid, setPaid] = React.useState(false);
  // Payload fields verbatim (rule 20): tax-inclusive line totals, no client math.
  const money = (r) => ({ ext: r.rcv_total_incl || 0, acv: r.acv_total_incl || 0 });
  const totIncl = priced.reduce((a, r) => ({ rcv: a.rcv + (r.rcv_total_incl || 0), acv: a.acv + (r.acv_total_incl || 0) }), { rcv: 0, acv: 0 });
  return (
    <div className="k-landing" style={{ minHeight: '100vh', background: 'var(--k-bg-2)' }}>
      <header className="k-topbar" style={{ background: 'var(--k-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KevinWordmark size={16} suffix={true} />
          <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>Contents inventory · read-only</span>
        </div>
        <Badge tone={paid ? 'ok' : 'quiet'} dot={true}>{paid ? 'Unlocked' : 'Preview'}</Badge>
      </header>
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 60px' }}>
        <section style={{ background: 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 12, padding: '18px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 22 }}>Godfrey — Kitchen fire</div>
              <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)', marginTop: 4 }}>Kevin Godfrey · 123 Main St., Smithtown, NY 11787</div>
              <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>Claim CLM-2026-04412 · Policy HO3-4471-8829</div>
            </div>
            <div style={{ display: 'flex', gap: 22, textAlign: 'right' }}>
              <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--k-fg-4)' }}>Items</div><div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 17, fontWeight: 600 }}>57</div></div>
              <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--k-fg-4)' }}>Total RCV + tax</div><div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 17, fontWeight: 600 }}>{fmtUSD(totIncl.rcv)}</div></div>
              <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--k-fg-4)' }}>Total ACV</div><div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 17, fontWeight: 600, color: 'var(--k-accent)' }}>{fmtUSD(totIncl.acv)}</div></div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 10, borderTop: '1px solid var(--k-line)', paddingTop: 8 }}>All figures are the adjuster's estimates — the carrier makes the final settlement decision.</div>
        </section>
        {!paid && (
          <section style={{ background: 'var(--k-navy, oklch(0.32 0.06 255))', color: '#fff', borderRadius: 12, padding: '16px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Your full inventory is ready — 57 items, photographed and priced.</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>Preview shows {preview.length} of 57 lines. Pay once to unlock every line, the photos, and the download files (Excel + PDF).</div>
            </div>
            <button className="k-btn k-btn--lg" style={{ background: '#fff', color: 'var(--k-fg)' }} onClick={() => setPaid(true)}>Unlock full inventory · {price}</button>
          </section>
        )}
        {/* Full worksheet column set (export parity, rule 17) minus adjuster-only
            internals (comps, confidence). Horizontal scroll on narrow screens. */}
        <section style={{ background: 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 12, overflow: 'auto' }}>
          <div style={{ minWidth: 1050 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 90px 40px 1.5fr 1fr 74px 78px 64px 84px 42px 52px 74px 84px', gap: 8, padding: '9px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--k-fg-4)', borderBottom: '1px solid var(--k-line)' }}>
            <span>#</span><span>Room</span><span style={{ textAlign: 'right' }}>Qty</span><span>Description</span><span>Make · Model</span><span style={{ textAlign: 'right' }}>Unit Cost</span><span style={{ textAlign: 'right' }}>Ext. Cost</span><span style={{ textAlign: 'right' }}>Tax</span><span style={{ textAlign: 'right' }}>RCV + Tax</span><span style={{ textAlign: 'right' }}>Age</span><span style={{ textAlign: 'right' }}>% Depr.</span><span style={{ textAlign: 'right' }}>$ Depr.</span><span style={{ textAlign: 'right' }}>ACV</span>
          </div>
          {(paid ? priced : preview).map((r) => {
            const num = { textAlign: 'right', fontFamily: 'var(--k-font-mono)', fontSize: 11.5 };
            return (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '40px 90px 40px 1.5fr 1fr 74px 78px 64px 84px 42px 52px 74px 84px', gap: 8, padding: '9px 16px', fontSize: 12, borderBottom: '1px solid var(--k-line)', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{r.id}</span>
                <span style={{ color: 'var(--k-fg-3)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.room}</span>
                <span style={num}>{r.qty}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</span>
                <span style={{ color: 'var(--k-fg-3)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.mfr}{r.model ? ' · ' + r.model : ''}</span>
                <span style={num}>{r.rcv != null ? fmtUSD(r.rcv) : '—'}</span>
                <span style={num}>{r.rcv != null ? fmtUSD(r.rcv * r.qty) : '—'}</span>
                <span style={num}>{fmtUSD(r.tax || 0)}</span>
                <span style={num}>{fmtUSD(r.rcv_total_incl || 0)}</span>
                <span style={num}>{r.age_years != null ? r.age_years : '—'}</span>
                <span style={{ ...num, color: 'var(--k-fg-3)' }}>{r.depreciation_pct != null ? Math.round(r.depreciation_pct * 100) + '%' : '—'}</span>
                <span style={{ ...num, color: 'var(--k-fg-3)' }}>{fmtUSD(r.depreciation_amount || 0)}</span>
                <span style={{ ...num, fontWeight: 600 }}>{fmtUSD(r.acv_total_incl || 0)}</span>
              </div>
            );
          })}
          {!paid && (
            <div style={{ position: 'relative' }}>
              {/* Blurred placeholders — decorative only; the real payload carries no
                  locked-line detail, so there is nothing recoverable behind the blur. */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '40px 90px 40px 1.5fr 1fr 74px 78px 64px 84px 42px 52px 74px 84px', gap: 8, padding: '9px 16px', fontSize: 12, borderBottom: '1px solid var(--k-line)', filter: 'blur(5px)', userSelect: 'none' }}>
                  <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5 }}>00{i + 7}</span>
                  <span>██████</span><span style={{ textAlign: 'right' }}>█</span>
                  <span>█████ ████████ ██████</span><span>████ · █████</span>
                  <span style={{ textAlign: 'right' }}>$███.██</span><span style={{ textAlign: 'right' }}>$███.██</span><span style={{ textAlign: 'right' }}>$██.██</span><span style={{ textAlign: 'right' }}>$███.██</span>
                  <span style={{ textAlign: 'right' }}>█</span><span style={{ textAlign: 'right' }}>██%</span><span style={{ textAlign: 'right' }}>$██.██</span><span style={{ textAlign: 'right' }}>$███.██</span>
                </div>
              ))}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, transparent, var(--k-bg) 85%)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}><Icon d={I.lock} size={13} /> 51 more lines locked</div>
                  <button className="k-btn" style={{ marginTop: 10 }} onClick={() => setPaid(true)}>Unlock full inventory · {price}</button>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 6 }}>Secure checkout via Stripe · one-time payment</div>
                </div>
              </div>
            </div>
          )}
          </div>
        </section>
        {paid && (
          <section style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="k-btn"><Icon d={I.download} size={13} /> Inventory · .xlsx</button>
            <button className="k-btn k-btn--ghost"><Icon d={I.download} size={13} /> PDF inventory</button>
            <button className="k-btn k-btn--ghost"><Icon d={I.download} size={13} /> Photos · .zip</button>
          </section>
        )}
        <footer style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 26, textAlign: 'center' }}>Prepared with Kevin · kevin.co</footer>
      </main>
    </div>
  );
};
window.PortalPaywall = PortalPaywall;
