// Two segment pages — For Adjusters & For Estate Liquidators
// Share the same shell, different copy + visuals to make each segment feel "this is mine"

const { KevinWordmark, Icon, I, Badge, Thumb } = window;

// ─── For Adjusters ────────────────────────────────────────────────
const ForAdjusters = () => (
  <div className="k-landing">
    {/* Shared nav — hand-rolled dead <a>s replaced (nothing was clickable) */}
    <window.MktNav active="adj" />

    <main className="k-mkt-main">
      <section className="k-seg-hero">
        <div className="k-seg-hero-l">
          <Badge tone="accent" dot={true}>For independent, carrier &amp; public adjusters</Badge>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 64, letterSpacing: '-0.028em', margin: '20px 0 18px', lineHeight: 1.02 }}>
            Stop typing. Start adjusting.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--k-fg-2)', lineHeight: 1.5, margin: 0, maxWidth: 530 }}>
            Drop a folder of damage photos. Kevin returns a complete personal-property inventory — items identified, brands matched, depreciation suggested, three live retailer comps per line. Then you do the part that requires judgment.
          </p>
          <div className="k-hero-actions" style={{ marginTop: 32 }}>
            <a className="k-btn k-btn--lg" href="58-Account-create.html">Start a new claim →</a>
            <a className="k-btn k-btn--ghost k-btn--lg" href="52-Watch-demo.html">Watch demo</a>
          </div>
        </div>
        <div className="k-seg-hero-r">
          <div style={{ background: 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 14, boxShadow: 'var(--k-shadow)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--k-line)', background: 'var(--k-bg-2)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--k-ok)', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Godfrey — Kitchen fire</span>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginLeft: 'auto' }}>57 items · {window.fmtUSDshort(window.REYES_TOTALS.rcv)} RCV</span>
            </div>
            <div style={{ padding: '4px 16px 10px' }}>
              {[
                ['../assets/claim/web/20260805_142226.jpg', "Hot Wheels '70 Plymouth Road Runner", 'Toys & Games',     '$12.99'],
                ['../assets/claim/web/20260805_144545.jpg', 'GUESS studded leather belt',           'Clothing — Adult', '$38.00'],
                ['../assets/claim/web/20260805_143757.jpg', 'Honeywell HPA300 HEPA filter',         'Small Appliances', '$47.72'],
                ['../assets/claim/web/20260805_144140.jpg', 'Studded dome handbag',                 'Clothing — Adult', '$64.00'],
                ['../assets/claim/web/20260805_144556.jpg', 'Fiskars yellow-handle scissors',       'Kitchen & Housewares', '$9.97'],
              ].map(([k, d, c, v, sl], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', gap: 11, alignItems: 'center', padding: '9px 0', borderBottom: i < 4 ? '1px solid var(--k-line)' : 'none' }}>
                  <Thumb idx={i} size={30} src={k} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c}{sl && <Badge tone="warn">SL</Badge>}
                    </div>
                  </div>
                  <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* — Stat strip — */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, margin: '4px 0' }}>
        <div className="k-stat-card">
          <div className="k-stat-n">2m 41s</div>
          <div className="k-stat-l">Avg time to a complete inventory</div>
          <div className="k-stat-s">60 photos → 57 items</div>
        </div>
        <div className="k-stat-card">
          <div className="k-stat-n">87%</div>
          <div className="k-stat-l">Items prefilled with no edits needed</div>
          <div className="k-stat-s">Make, model, category, pricing</div>
        </div>
        <div className="k-stat-card k-stat-card--accent">
          <div className="k-stat-n">3×</div>
          <div className="k-stat-l">More claims through in a week</div>
          <div className="k-stat-s">vs. their previous manual workflow — the field work doesn't change, the typing does</div>
        </div>
      </section>

      {/* — Workflow breakdown — */}
      <section className="k-seg-work">
        <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 48px' }}>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>The workflow</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 42, letterSpacing: '-0.025em', margin: '8px 0 14px', lineHeight: 1.05 }}>
            From driveway to Xactimate in one sitting.
          </h2>
        </div>
        <div className="k-seg-work-grid">
          {[
            ['01', 'In the field', 'Capture photos any way you want. Phone, DSLR, restoration GC\'s contact sheet. Drop them in.', 'Phone · DSLR · .zip'],
            ['02', 'On the laptop', 'Kevin processes everything. Reads barcodes, picks categories, pulls 3 retailer comps per line.', 'Avg 3m / 100 items'],
            ['03', 'Review &amp; override', 'One spreadsheet, every cell editable. Fix a description, re-price it against fresh comps, move on.', 'Special-limits flagged'],
            ['04', 'Export &amp; send', 'Xactimate (Excel), CSV, or PDF. Audit log signed at export.', 'One click · validated'],
          ].map(([n, t, body, sub], i) => (
            <div key={i} className="k-workstep">
              <div className="k-workstep-n">{n}</div>
              <div className="k-workstep-t" dangerouslySetInnerHTML={{__html: t}} />
              <p className="k-workstep-b" dangerouslySetInnerHTML={{__html: body}} />
              <div className="k-workstep-s">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* — Side-by-side example — */}
      <section className="k-seg-example">
        <div className="k-seg-example-l">
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>What you give Kevin</div>
          <h3 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 14px' }}>60 photos from the loss</h3>
          <div className="k-photo-grid-mini">
            {['142226','143825','143757','144058','144140','144225','144545','144718'].map((f, i) => (
              <Thumb key={i} idx={i + 2} size={80} src={'../assets/claim/web/20260805_' + f + '.jpg'} />
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>+ 52 more</div>
        </div>
        <div className="k-seg-example-r">
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>What Kevin gives back</div>
          <h3 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 14px' }}>A 57-line inventory</h3>
          <div className="k-mini-grid">
            {[
              ['Hot Wheels \'70 Plymouth Road Runner', 'Toys & Games',         '$12.99'],
              ['GUESS studded leather belt',           'Clothing — Adult',     '$38.00'],
              ['Honeywell HPA300 HEPA filter',         'Small Appliances',     '$47.72'],
              ['Studded dome handbag',                 'Clothing — Adult',     '$64.00'],
              ['Samsung 35MM camera',                  'Electronics',          '$89.99'],
              ['Steve Madden leather boot',            'Clothing — Adult',     '$129.78'],
              ['+ 51 more lines',                      '—',                    window.fmtUSDshort(window.REYES_TOTALS.rcv), null, true],
            ].map(([d, c, v, flag, last], i) => (
              <div key={i} className="k-mini-row">
                <span style={{ fontSize: 12, color: last ? 'var(--k-fg-3)' : 'var(--k-fg)' }}>{d}</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{c}</span>
                {flag && <Badge tone="warn">SL</Badge>}
                {!flag && !last && <span />}
                {last && <span />}
                <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* — Testimonial — */}
      <section className="k-seg-quote" style={{ background: 'var(--k-accent)' }}>
        <div className="k-seg-quote-inner">
          <div style={{ fontFamily: 'var(--k-font-display)', fontStyle: 'italic', fontSize: 32, color: '#fff', lineHeight: 1.3, textWrap: 'balance', maxWidth: 760 }}>
            “Friday afternoon: 50 photos from a kitchen fire. Saturday morning at 9: the inventory was on the carrier's desk. The old version of me would still be on row 80 by then.”
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 46, height: 46, borderRadius: 99, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)' }}>
              <img src="../assets/kevin-godfrey.png" alt="Kevin Godfrey" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Kevin Godfrey</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Long Island Public Adjusters, LLC</div>
            </div>
          </div>
        </div>
      </section>

      {/* — Why adjusters pick Kevin — */}
      <section className="k-seg-why">
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Why adjusters pick Kevin</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 38, letterSpacing: '-0.025em', margin: '8px 0 0', lineHeight: 1.1 }}>
            Built for the way adjusters actually work.
          </h2>
        </div>
        <div className="k-seg-why-grid">
          {[
            ['Built for volume',            'Bulk ingest, mass review, mass export. Hundreds of items reviewed in one grid — not one item at a time.'],
            ['No locking your data',         'Every export bundles the source photos and a signed audit log. You can leave and take your last 10 years of claims with you.'],
            ['No hand-holding the AI',       'Kevin pre-fills, you decide. Anything it could not price confidently arrives blank instead of guessed.'],
            ['No surprise pricing',          'Flat monthly. Comps included. No "AI usage" fees, no per-photo charges.'],
            ['No carrier lock-in',           'Xactimate (Excel), CSV, and PDF. Bring your own carrier profiles or use our starter set.'],
            ['No "contact sales" for basics', 'The Pro tier is self-serve. Click, drop photos, get a worksheet. Done.'],
          ].map(([t, body], i) => (
            <div key={i} className="k-seg-why-card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t}</div>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* — CTA — */}
      <section className="k-mkt-cta">
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '0 0 14px', lineHeight: 1.05, textAlign: 'center' }}>
          Try Kevin on your next claim.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 480, textAlign: 'center' }}>
          7-day free trial — full product, real claims. Carrier profile pre-loaded for the major ones.
        </p>
        <div className="k-hero-actions" style={{ marginTop: 0 }}>
          <a className="k-btn k-btn--lg" href="58-Account-create.html">Start a claim →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="38-Contact.html">Talk to an adjuster who uses Kevin</a>
        </div>
      </section>

      <window.MktFooter />
    </main>
  </div>
);

// ─── For Estate Liquidators ──────────────────────────────────────
const ForLiquidators = () => (
  <div className="k-landing">
    <window.MktNav active="liq" />

    <main className="k-mkt-main">
      <section className="k-seg-hero">
        <div className="k-seg-hero-l">
          <Badge tone="accent" dot={true}>For estate liquidators &amp; trust officers</Badge>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 64, letterSpacing: '-0.028em', margin: '20px 0 18px', lineHeight: 1.02 }}>
            Catalog an entire estate in an afternoon.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--k-fg-2)', lineHeight: 1.5, margin: 0, maxWidth: 530 }}>
            Walk every room with your phone. Kevin builds the inventory: brand-matched, fair-market-valued, categorized into estate-friendly classes — ready to print, share, or take to auction.
          </p>
          <div className="k-hero-actions" style={{ marginTop: 32 }}>
            <a className="k-btn k-btn--lg" href="58-Account-create.html">Start an estate →</a>
            <a className="k-btn k-btn--ghost k-btn--lg" href="48-Sample-claim.html">See a sample inventory</a>
          </div>
        </div>
        <div className="k-seg-hero-r">
          <div className="k-stat-stack">
            <div className="k-stat-card">
              <div className="k-stat-n">1,200+</div>
              <div className="k-stat-l">Items in a single estate</div>
              <div className="k-stat-s">One walkthrough · zero typing</div>
            </div>
            <div className="k-stat-card">
              <div className="k-stat-n">$412k</div>
              <div className="k-stat-l">Fair market value found</div>
              <div className="k-stat-s">Every line backed by a photo + live price comp</div>
            </div>
            <div className="k-stat-card k-stat-card--accent">
              <div className="k-stat-n">3 weeks → 2 days</div>
              <div className="k-stat-l">Typical cycle time per estate</div>
              <div className="k-stat-s">From photo walkthrough to finished inventory</div>
            </div>
          </div>
        </div>
      </section>

      {/* — Estate-specific value props — */}
      <section className="k-seg-work">
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Built for the estate workflow</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 42, letterSpacing: '-0.025em', margin: '8px 0 14px', lineHeight: 1.05 }}>
            Built for the way an estate actually gets cleared.
          </h2>
        </div>
        <div className="k-seg-work-grid">
          {[
            ['01', 'Walk &amp; capture',  'One person, one phone, one estate. Room-by-room labeling, no field assistant needed.', 'Avg 2.6s / photo'],
            ['02', 'Fair-market-value',   'Kevin pulls retail + auction + comparable-sale data — appraisal-grade for non-specialty items.', 'eBay · LiveAuctioneers · retail'],
            ['03', 'Estate categories',   'Categorized into estate-friendly categories for clean splits and accounting. Jewelry, fine arts, furniture, sentimental.', '24 estate categories'],
            ['04', 'Inventory PDF',       'Numbered inventory, photo per line, with a signature block at the bottom. Or CSV for accountants.', 'Print, share, sign'],
          ].map(([n, t, body, sub], i) => (
            <div key={i} className="k-workstep">
              <div className="k-workstep-n">{n}</div>
              <div className="k-workstep-t" dangerouslySetInnerHTML={{__html: t}} />
              <p className="k-workstep-b" dangerouslySetInnerHTML={{__html: body}} />
              <div className="k-workstep-s">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* — Side-by-side estate example — */}
      <section className="k-seg-example">
        <div className="k-seg-example-l">
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>What you give Kevin</div>
          <h3 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 14px' }}>318 phone photos</h3>
          <div className="k-photo-grid-mini">
            {['sofa','chair','console','guitar','watch','ring','mixer','range'].map((k, i) => (
              <Thumb key={i} idx={i + 3} size={80} src={(window.PRODUCT_IMG||{})[k]} />
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>+ 310 more</div>
        </div>
        <div className="k-seg-example-r">
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>What Kevin gives back</div>
          <h3 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 14px' }}>A 297-line inventory</h3>
          <div className="k-mini-grid">
            {[
              ['Steinway upright piano, 1958',     'Musical Instruments',  '$12,500', true],
              ['Persian rug, hand-knotted, 9×12',  'Fine Arts',            '$3,800',  true],
              ['Sterling silver tea service, 6pc', 'Fine Arts',            '$2,400',  true],
              ['Mid-century walnut sideboard',     'Furniture',            '$1,950'],
              ['Pearl strand, 18" Akoya',          'Jewelry',              '$1,800',  true],
              ['Vintage Rolex Datejust',           'Jewelry',              '$5,200',  true],
              ['Watercolor, signed E.M. Bauer',    'Fine Arts',            '$650'],
              ['+ 290 more lines',                 '—',                    '$384k', null, true],
            ].map(([d, c, v, flag, last], i) => (
              <div key={i} className="k-mini-row">
                <span style={{ fontSize: 12, color: last ? 'var(--k-fg-3)' : 'var(--k-fg)' }}>{d}</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{c}</span>
                {flag && <Badge tone="warn">SL</Badge>}
                {!flag && !last && <span />}
                {last && <span />}
                <span className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* — CTA — */}
      <section className="k-mkt-cta">
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '0 0 14px', lineHeight: 1.05, textAlign: 'center' }}>
          One estate. On us.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 500, textAlign: 'center' }}>
          Process a real estate end-to-end before you decide. We'll configure the export and class scheme on the kickoff call.
        </p>
        <div className="k-hero-actions" style={{ marginTop: 0 }}>
          <a className="k-btn k-btn--lg" href="58-Account-create.html">Start your first estate →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="51-Book-call.html">Book a 30-min call</a>
        </div>
      </section>

      <window.MktFooter />
    </main>
  </div>
);

Object.assign(window, { ForAdjusters, ForLiquidators });
