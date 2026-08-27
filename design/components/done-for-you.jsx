// Done-for-you — the service line: send Kevin the photos, we build the inventory.
// One-time per-claim engagements (admin revenue "Services" stream); no subscription needed.
// Layout: hero → hairline stats → asymmetric two-column (numbered rail ⟷ photo collage)
// → full-bleed on-site band → accent quote → closing CTA. Deliberately non-linear.
const DoneForYou = () => (
  <div className="k-landing">
    <window.MktNav active="product" />
    <main className="k-mkt-main">
      <section className="k-mkt-hero" style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto', padding: '60px 40px 30px' }}>
        <Badge tone="accent" dot={true}>Done-for-you · per claim</Badge>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 56, letterSpacing: '-0.028em', margin: '20px 0 16px', lineHeight: 1.04 }}>
          Send us the photos.<br/>We'll build the inventory.
        </h1>
        <p style={{ fontSize: 16.5, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: '0 auto', maxWidth: 620 }}>
          No time to run it yourself? Our team takes your photo dump or written list through Kevin — identification, live pricing, depreciation, line-by-line review — and returns an XactContents-ready .xlsx and a client-facing PDF, usually within one business day.
        </p>
        <div className="k-hero-actions" style={{ justifyContent: 'center', marginTop: 26 }}>
          <a className="k-btn k-btn--lg" href="38-Contact.html">Send us a claim →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="51-Book-call.html">Talk it through first</a>
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--k-fg-4)' }}>Flat per-claim pricing, quoted up front from photo count. No subscription required.</div>
      </section>

      {/* Hairline stat row */}
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '0 40px 44px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          ['1 business day', 'Typical turnaround', 'photo dump in, worksheet + PDF back'],
          ['Every photo', 'Becomes a priced line', 'duplicates and context shots sorted out for you'],
          ['3 sources', 'On every priced line', 'live comps with dated proof links'],
        ].map(([n, l, sub], i) => (
          <div key={i} style={{ textAlign: 'center', padding: '18px 12px', borderTop: '1px solid var(--k-line)', borderBottom: '1px solid var(--k-line)', borderLeft: i > 0 ? '1px solid var(--k-line)' : 'none' }}>
            <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 30, letterSpacing: '-0.02em' }}>{n}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{l}</div>
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </section>

      {/* How it works — numbered rail beside the evidence collage */}
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '0 40px 48px', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 44, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>How an engagement runs</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '-0.022em', margin: '8px 0 22px', lineHeight: 1.15 }}>Three touches on your side. That's all.</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['You send', 'A folder, a .zip, or a written list — plus the claim basics (insured, loss address, policy form if you have it). No photos yet? We can shoot the site for you — see below.'],
              ['We build', 'Your claim runs through the same engine, and a Kevin reviewer works every exception line: blanks, no-comps, special-limits classes.'],
              ['You review & export', "The finished worksheet lands in your account (or we email the files). Every line carries its source link — it's your inventory, defensibly built."],
            ].map(([t, s], i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 99, background: 'var(--k-accent)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--k-font-mono)', fontSize: 12.5, fontWeight: 700 }}>{i + 1}</span>
                  {i < arr.length - 1 && <span style={{ flex: 1, width: 2, background: 'var(--k-line)', margin: '4px 0' }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 22 : 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: '30px' }}>{t}</div>
                  <p style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: '2px 0 0' }}>{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['20260805_144436', '20260805_144542', '20260805_144723', '20260805_144808'].map((f, i) => (
              <img key={i} src={'../assets/claim/web/' + f + '.jpg'} alt="" style={{ width: '100%', aspectRatio: i % 3 === 0 ? '4/5' : '4/4.2', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--k-line)', transform: `translateY(${i % 2 === 1 ? 14 : 0}px)` }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 24, textAlign: 'center' }}>
            Real captures from the sample claim — <a className="k-link" href="48-Sample-claim.html" style={{ fontSize: 11.5 }}>open the finished worksheet they became →</a>
          </div>
        </div>
      </section>

      {/* On-site capture — full-bleed tinted band, breaks the card rhythm */}
      <section style={{ background: 'var(--k-bg-2)', borderTop: '1px solid var(--k-line)', borderBottom: '1px solid var(--k-line)', padding: '34px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--k-accent)', color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <Icon d={I.camera} size={24} stroke={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Can't get to the site? We'll shoot it too.</div>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: '4px 0 0', lineHeight: 1.55, maxWidth: 600 }}>
              For an additional fee, a Kevin field photographer walks the loss and captures every item — wide shots, model plates, serial tags — then the claim runs straight through the same build. One engagement, from front door to finished worksheet.
            </p>
          </div>
          <a className="k-btn" href="38-Contact.html" style={{ flex: '0 0 auto' }}>Ask about on-site →</a>
        </div>
      </section>

      {/* Social proof — accent quote */}
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '44px 40px 26px' }}>
        <div style={{ background: 'var(--k-accent)', borderRadius: 14, padding: '30px 34px', color: '#fff', display: 'flex', gap: 22, alignItems: 'center' }}>
          <img src="../assets/kevin-godfrey.png" alt="" style={{ width: 56, height: 56, borderRadius: 99, objectFit: 'cover', flex: '0 0 auto', border: '2px solid oklch(1 0 0 / 0.35)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div>
            <p style={{ fontFamily: 'var(--k-font-display)', fontSize: 19, lineHeight: 1.5, margin: 0, letterSpacing: '-0.01em' }}>
              "A contents inventory that used to eat a full day of searching, typing and adjusting now comes back the next morning, sourced and ready for XactContents. It gives adjusters their evenings back."
            </p>
            <div style={{ marginTop: 10, fontSize: 12.5, opacity: 0.85 }}>Kevin Godfrey · Long Island Public Adjusters, LLC</div>
          </div>
        </div>
      </section>

      {/* Closing — self-serve upsell */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '10px 40px 64px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Rather run it yourself?</h2>
        <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: '0 0 18px', lineHeight: 1.6 }}>The full product is $249/mo with a 7-day free trial — most adjusters who send us one claim run the next one themselves.</p>
        <div className="k-hero-actions" style={{ justifyContent: 'center', marginTop: 0 }}>
          <a className="k-btn" href="21-Pricing.html">See pricing →</a>
          <a className="k-btn k-btn--ghost" href="48-Sample-claim.html">Open the sample claim</a>
        </div>
      </section>
    </main>
    <window.MktFooter />
  </div>
);
window.DoneForYou = DoneForYou;
