// Done-for-you — the service line: send Kevin the photos, we build the inventory.
// One-time per-claim engagements (admin revenue "Services" stream); no subscription needed.
// Layout: hero → hairline stats → asymmetric two-column (numbered rail ⟷ photo collage)
// → full-bleed on-site band → rate card → accent quote → closing CTA.
// Rates are MARGINAL with a $750 minimum (owner, 2026-10-22) -- see the
// rate-card comment; src/lib/dfy-pricing-rules.ts is the implementation.
// Site days are NOT part of this: they are an on-site charge and live in the
// on-site band, because a client who sends their own photos never incurs one.
const DoneForYou = () => (
  // k-dfy is a page hook: every section here is inline-styled with no class of
  // its own, so there is nothing for a breakpoint to target. Scoped to this
  // page rather than another global rule.
  <div className="k-landing k-dfy">
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
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--k-fg-4)' }}>From $750, priced per finished line and quoted before we start. One-time per engagement — no subscription, no seats, no retainer.</div>
      </section>

      {/* Hairline stat row */}
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '0 40px 44px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          ['1 business day', 'Typical turnaround', 'photo dump in, worksheet + PDF back'],
          ['One item, one line', 'However many photos it took', 'duplicates and context shots cost nothing'],
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
              A Kevin field photographer walks the loss and captures every item — wide shots, model plates, serial tags — then the claim runs straight through the same build. One engagement, from front door to finished worksheet.
            </p>
            <p style={{ fontSize: 13, color: 'var(--k-fg-2)', margin: '8px 0 0', lineHeight: 1.55, maxWidth: 600 }}>
              {/* A VISIT, not a day, and it counts toward the $750 minimum
                  rather than stacking on top of it (owner, 2026-10-24). 1,200
                  priced a week of field work as one day; a visit is ~300 items,
                  about four hours plus the drive. Outside the max() a 20-line
                  job we shot came to $1,025 and broke the "From $750" line on
                  exactly the small jobs most likely to want us on site. */}
              <strong>$275 a site visit</strong> — one visit covers up to 300 items, so a 400-item job is
              2 visits. It counts toward the $750 minimum rather than stacking on top of it, and it only
              applies when we do the shooting — send your own photos and there is no visit fee at all.
            </p>
          </div>
          <a className="k-btn" href="38-Contact.html" style={{ flex: '0 0 auto' }}>Ask about on-site →</a>
        </div>
      </section>

      {/* Social proof — accent quote. Extra top padding: the on-site band above
          is full-bleed and tinted, so the quote card needs room to read as a
          separate beat rather than as part of that band. */}
      <section className="k-dfy-quote-sec" style={{ maxWidth: 940, margin: '0 auto' }}>
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

      {/* Rate card. MARGINAL, $750 MINIMUM (owner, 2026-10-22): price =
          max(750, marginal line total). The public view leads with the
          minimum and dollar ranges; the per-line bands sit behind a
          disclosure for professionals. Live numbers are derived in
          src/lib/dfy-pricing-rules.ts -- these are its outputs, typed. */}
      <section className="k-dfy-rates-sec" style={{ maxWidth: 940, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>What it costs</div>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 34, letterSpacing: '-0.024em', margin: '8px 0 8px', lineHeight: 1.1 }}>
          Minimum project: $750.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: '0 0 22px', maxWidth: 620 }}>
          Most inventories land in one of these ranges. Final pricing is based on the number of completed insurance line items — send us your photos for an exact quote.
        </p>

        <dl className="k-dfy-rates">
          {[
            ['Small contents loss', '$750–$1,000', 'up to about 210 lines'],
            ['Medium inventory', '$1,000–$1,750', 'about 210–390 lines'],
            ['Large residential inventory', '$1,750–$3,000', 'about 390–740 lines'],
            ['Major or total-loss inventory', '$3,000+', 'over 740 lines'],
            ['Commercial', 'Custom', 'quoted per job'],
          ].map(([band, rate, note], i) => (
            <div key={i} className="k-dfy-rate">
              <dt className="k-dfy-rate-band">{band}</dt>
              <dd className="k-dfy-rate-v"><span className="k-mono">{rate}</span> <span className="k-dfy-rate-note">{note}</span></dd>
            </div>
          ))}
        </dl>

        <div className="k-faqx" style={{ maxWidth: 620 }}>
          <details className="k-faqx-item">
            <summary className="k-faqx-q">Per-line rates, for public adjusters and professionals</summary>
            <div className="k-faqx-a" style={{ fontSize: 14 }}>
              <p style={{ margin: '0 0 14px' }}>Rates are progressive. Each band prices only the lines inside it, so <strong>crossing into a lower tier does not reprice earlier items</strong> and adding a line never lowers the total. The price is the line total or the $750 minimum, whichever is higher.</p>
              <dl className="k-dfy-rates">
                {[
                  ['First 100 lines', '$5.00', 'a line'],
                  ['Lines 101–250', '$4.50', 'a line'],
                  ['Lines 251–500', '$4.00', 'a line'],
                  ['Lines 501–1,000', '$3.50', 'a line'],
                  ['1,001 and up', '$3.00', 'a line, or a custom volume rate'],
                ].map(([band, rate, note], i) => (
                  <div key={i} className="k-dfy-rate">
                    <dt className="k-dfy-rate-band">{band}</dt>
                    <dd className="k-dfy-rate-v"><span className="k-mono">{rate}</span> <span className="k-dfy-rate-note">{note}</span></dd>
                  </div>
                ))}
              </dl>
              <div className="k-dfy-worked">
                <div className="k-dfy-worked-hd">A 400-line contents inventory, worked through</div>
                <table className="k-dfy-worked-t">
                  <tbody>
                    {[
                      ['First 100 lines at $5.00', '$500'],
                      ['Lines 101–250 at $4.50', '$675'],
                      ['Lines 251–400 at $4.00', '$600'],
                      ['You sent the photos, so no visit fee', '—'],
                    ].map(([l, v], i) => (
                      <tr key={i}><td>{l}</td><td className="k-mono">{v}</td></tr>
                    ))}
                    <tr className="k-dfy-worked-tot"><td>Total · $4.44 a line</td><td className="k-mono">$1,775</td></tr>
                    {/* The other path, so the visit fee is not left abstract:
                        max(750, 1775 + 2 visits). */}
                    <tr><td>If we shoot it instead · 400 items is 2 visits at $275</td><td className="k-mono">$2,325</td></tr>
                  </tbody>
                </table>
                <p className="k-dfy-worked-foot">One more line would make it $1,779, never less.</p>
              </div>
            </div>
          </details>
        </div>
      </section>

      <section style={{ maxWidth: 780, margin: '0 auto', padding: '10px 40px 64px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.02em', margin: '32px 0 6px' }}>Rather run it yourself?</h2>
        <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: '0 0 18px', lineHeight: 1.6 }}>The full product is $249/mo and your first 250 line items are free — most adjusters who send us one claim run the next one themselves.</p>
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
