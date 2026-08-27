// Four remaining marketing/utility pages so every link resolves:
//   ProductOverview · ContactSales · About · PricingSourceDetail

const { KevinWordmark, Icon, I, Badge, Thumb } = window;

// Shared marketing top-nav (mirrors landing)
const MktNav = ({ active }) => (
  <header className="k-nav">
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
      <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--k-fg-3)' }}>
        {[['product','Product','37-Product-overview.html'],['adj','For Adjusters','22-For-Adjusters.html'],['pri','Pricing','21-Pricing.html']].map(([id,l,href]) => (
          <a key={id} href={href} style={{ color: active === id ? 'var(--k-fg)' : undefined }}>{l}</a>
        ))}
      </nav>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <a className="k-btn k-btn--ghost" href="00-Sign-in.html">Sign in</a>
      <a className="k-btn" href="58-Account-create.html">Start a new claim</a>
    </div>
  </header>
);

const MktFooter = () => (
  <footer className="k-footx">
    <div className="k-footx-cols">
      <div className="k-footx-brand">
        <KevinWordmark href="02-Landing.html" size={15} suffix={true} />
        <p>A content inventory adjuster. Photos in, inventory out.</p>
      </div>
      <div className="k-footx-col">
        <div className="k-footx-h">Product</div>
        <a href="37-Product-overview.html">How it works</a>
        <a href="21-Pricing.html">Pricing</a>
        <a href="48-Sample-claim.html">Sample claim</a>
        <a href="76-Done-for-you.html">Done-for-you claims</a>
        <a href="23-For-Estate-Liquidators.html">For estate liquidators</a>
        <a href="52-Watch-demo.html">Watch demo</a>
        <a href="24-Docs.html">Docs</a>
      </div>
      <div className="k-footx-col">
        <div className="k-footx-h">Company</div>
        <a href="39-About.html">About</a>
        <a href="53-Careers.html">Careers</a>
        <a href="38-Contact.html">Contact</a>
      </div>
      <div className="k-footx-col">
        <div className="k-footx-h">Legal</div>
        <a href="25-Legal-hub.html">Privacy</a>
        <a href="25-Legal-hub.html#terms">Terms</a>
        <a href="25-Legal-hub.html#security">Security</a>
      </div>
    </div>
    <div className="k-footx-base">
      <span>Kevin.co, LLC · 34 E. Main St. Ste 347, Smithtown, NY 11787</span>
      <a href="mailto:kevin@kevin.co">kevin@kevin.co</a>
      <span>© 2026</span>
    </div>
  </footer>
);

// ───────────────────────────────────────────────────────────────────────────
// 1 · PRODUCT OVERVIEW
// ───────────────────────────────────────────────────────────────────────────
const ProductOverview = () => {
  const IMG = window.PRODUCT_IMG || {};
  return (
    <div className="k-landing">
      <MktNav active="product" />
      <main className="k-mkt-main">
        <section className="k-mkt-hero k-prod-hero" style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <Badge tone="accent" dot={true}>Product overview</Badge>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, letterSpacing: '-0.028em', margin: '20px 0 18px', lineHeight: 1.02 }}>
            Photo dump in. XactContents out.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--k-fg-2)', lineHeight: 1.5, margin: 0, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            Kevin turns a folder of photos into a complete, priced personal-property inventory — for adjusters settling contents claims and estate professionals cataloging a home. It triages the dump, identifies each item, prices it against live retail comps, and writes the spreadsheet your carrier already accepts.
          </p>
          <div className="k-hero-actions" style={{ justifyContent: 'center' }}>
            <a className="k-btn k-btn--lg" href="58-Account-create.html">Start your 7-day free trial →</a>
            <a className="k-btn k-btn--ghost k-btn--lg" href="21-Pricing.html">See pricing</a>
          </div>
        </section>

        {/* Visual proof — the screen the whole product exists to produce.
            MktShot (landing.jsx) renders a labeled slot until a PNG is passed
            to `src`; the frame is identical either way, so dropping the capture
            in never reflows the page. */}
        <section className="k-proof-solo">
          <window.MktShot
            label="kevin.co/claims/CLM-2026-04412/worksheet"
            slot="Review worksheet — 57 priced lines"
            size="Capture from pages/05-Worksheet-flat.html · 2000 × 1125"
            ratio="16 / 9"
            caption="One grid, every cell editable — and every price traceable to the comp it came from."
          />
        </section>

        {/* Five surfaces */}
        <section style={{ padding: '40px 0 60px' }}>
          <div className="k-prod-surfaces">
            {[
              { n: '01', t: 'Intake',   img: 'CP:20260805_142226.jpg',   href: '03-Intake.html',        body: 'Claim and policy details, the contents coverage limit, and a loss ZIP that resolves the sales-tax rate. One short form, then straight to the photos.' },
              { n: '02', t: 'Stage',    img: 'CP:20260805_143825.jpg',   href: '73-Photo-staging.html', body: 'Drop a folder, a phone dump, or a whole .zip — no total-size cap. Duplicates are hashed out, and shots taken seconds apart are grouped into one set — merge, split, or exclude before anything is identified.' },
              { n: '03', t: 'Process',  img: 'CP:20260805_143757.jpg',       href: '04-Processing.html',    body: 'Item, make, model number, content class. Three live comps per item, with the median becoming the replacement cost and a dated proof link on the line.' },
              { n: '04', t: 'Review',   img: 'CP:20260805_144545.jpg',     href: '05-Worksheet-flat.html', body: 'One grid, every cell editable. Pin the item panel to see the source photo and comps beside the row. Special-limits flags, room filters, class grouping.' },
              { n: '05', t: 'Export',   img: 'CP:20260805_144140.jpg', href: '06-Export-modal.html',  body: 'The XactContents spreadsheet for claims, a client-ready PDF for estate sales, or the whole bundle with photos and the audit log.' },
            ].map((s) => ({ ...s, img: s.img.startsWith('CP:') ? ('../assets/claim/web/' + s.img.slice(3)) : s.img })).map((s, i) => (
              <a key={i} className="k-prod-surface" href={s.href}>
                <div className="k-prod-surface-img">
                  <Thumb idx={i} size={88} src={s.img} label={s.t.slice(0,3)} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>{s.n}</div>
                  <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 8px' }}>{s.t}</div>
                  <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>{s.body}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Two-up proof — the two screens that absorb the manual hours. */}
        <div className="k-proof-hd">
          <div className="k-proof-eyebrow">Where the hours actually go</div>
          <h2 className="k-proof-h2">Triage before you look. Export when you’re done.</h2>
          <p className="k-proof-sub">The dump gets sorted without you. The file lands in XactContents without reformatting.</p>
        </div>
        <section className="k-proof-two">
          <window.MktShot
            label="kevin.co/claims/CLM-2026-04412/staging"
            slot="Photo staging — proposed sets"
            size="Capture from pages/73-Photo-staging.html · 1400 × 875"
            caption="Shots seconds apart become one set — the wide frame and the model plate, priced once. Merge, split, or set aside before anything is identified."
          />
          <window.MktShot
            label="Export claim · CLM-2026-04412"
            slot="Carrier export modal"
            size="Capture from pages/06-Export-modal.html · 1400 × 875"
            caption="Xactimate (Excel) · .xlsx · XactContents template — static values in every derived cell, because the importer breaks on formulas."
          />
        </section>

        {/* Defensibility band */}
        <section className="k-mkt-band">
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Why people pick Kevin</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 38, letterSpacing: '-0.025em', margin: '8px 0 14px', lineHeight: 1.06 }}>
              Every price has a receipt.
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 480 }}>
              Every priced line carries a dated link to the comp the price came from, and the audit log records who changed what, and when. Months later — at supplement, at reinspection, at the call where someone questions a number — you can show your work without remembering a thing.
            </p>
          </div>
          <div className="k-mkt-band-r" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['A dated proof link on every priced line', 'ok'],
              ['Audit log of every edit, exportable',     'ok'],
              ['Special-limits flags for coverage caps',  'ok'],
              ['Unpriced items left blank, never guessed', 'ok'],
            ].map(([l, t], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--k-bg)', borderRadius: 8, border: '1px solid var(--k-line)' }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: 'var(--k-ok-soft)', color: 'oklch(0.36 0.08 175)', display: 'grid', placeItems: 'center' }}>
                  <Icon d={I.check} size={11} stroke={2.5} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="k-mkt-cta">
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '0 0 14px', lineHeight: 1.05, textAlign: 'center' }}>
            Try it on a real claim.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 480, textAlign: 'center' }}>Seven days, the full product, your own claims. $249/mo flat after that — unlimited claims, no per-seat or per-claim fees.</p>
          <div className="k-hero-actions" style={{ marginTop: 0 }}>
            <a className="k-btn k-btn--lg" href="58-Account-create.html">Start your 7-day free trial →</a>
            <a className="k-btn k-btn--ghost k-btn--lg" href="48-Sample-claim.html">See a finished claim</a>
          </div>
        </section>
        <MktFooter />
      </main>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · CONTACT / SALES
// ───────────────────────────────────────────────────────────────────────────
const ContactSales = () => (
  <div className="k-landing">
    <MktNav />
    <main className="k-mkt-main">
      <section className="k-contact">
        <div className="k-contact-l">
          <Badge tone="accent" dot={true}>Talk to us</Badge>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 56, letterSpacing: '-0.028em', margin: '20px 0 18px', lineHeight: 1.02 }}>
Tell us what you're working on.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 480 }}>
Every message comes to Kevin Godfrey — 22 years adjusting before he built this. No chatbot, no ticket queue, no sales team to get past.
          </p>

          <div className="k-contact-channels">
            {[
              { l: 'Sales, support, security — everything', sub: 'It comes straight to me', email: 'kevin@kevin.co', icon: 'spark' },
            ].map((c, i) => (
              <div key={i} className="k-contact-row">
                <span className="k-contact-icon"><Icon d={I[c.icon]} size={14} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.l}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{c.sub}</div>
                </div>
                <a className="k-link" style={{ fontSize: 13, fontFamily: 'var(--k-font-mono)' }} href={`mailto:${c.email}`}>{c.email}</a>
              </div>
            ))}
          </div>

          <div className="k-contact-meta">
            <div>
              <div className="k-contact-meta-l">Based in</div>
              <div className="k-contact-meta-v">Long Island, NY</div>
            </div>
            <div>
              <div className="k-contact-meta-l">Hours</div>
              <div className="k-contact-meta-v">8a–6p ET · Mon–Fri</div>
            </div>
            <div>
              <div className="k-contact-meta-l">Founded</div>
              <div className="k-contact-meta-v">2024</div>
            </div>
          </div>
        </div>

        <form className="k-contact-form" onSubmit={(e) => e.preventDefault()}>
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 14 }}>Or send a message</div>
          <div className="k-insp-field">
            <label>Your name</label>
            <input className="k-insp-input" placeholder="Your full name" style={{ padding: '10px 13px' }} />
          </div>
          <div className="k-insp-field">
            <label>Work email</label>
            <input className="k-insp-input" placeholder="you@example.com" style={{ padding: '10px 13px' }} />
          </div>
          <div className="k-insp-field">
            <label>What's on your mind?</label>
            <select className="k-insp-input" defaultValue="agency" style={{ padding: '10px 13px' }}>
              <option value="solo">I adjust claims and want to try it</option>
              <option value="estate">I run estate sales and want to try it</option>
              <option value="ent">Carrier, TPA, or multi-adjuster team</option>
              <option value="cust">I'm a customer and need help</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div className="k-insp-field">
            <label>Anything you'd like us to know? <span style={{ color: 'var(--k-fg-4)' }}>(optional)</span></label>
            <textarea className="k-insp-input" rows={5} placeholder="Claim volume, how you work today, what you'd want to see…" style={{ padding: '10px 13px' }} />
          </div>
          <button className="k-btn k-btn--lg" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={() => { window.location.href = 'mailto:kevin@kevin.co'; }}>Send message →</button>
          <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--k-fg-4)' }}>
            Or <a className="k-link" style={{ fontSize: 11.5 }} href="51-Book-call.html">book a call</a> directly · We never share your info.
          </div>
        </form>
      </section>
      <MktFooter />
    </main>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 3 · ABOUT
// ───────────────────────────────────────────────────────────────────────────
const About = () => (
  <div className="k-landing">
    <MktNav />
    <main className="k-mkt-main">
      <section className="k-about-hero">
        <Badge tone="accent" dot={true}>About</Badge>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 72, letterSpacing: '-0.03em', margin: '20px 0 22px', lineHeight: 1, maxWidth: 780, textWrap: 'balance' }}>
          Adjusters have typed long enough.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--k-fg-2)', lineHeight: 1.5, margin: 0, maxWidth: 640 }}>
          Kevin is built by people who've typed 540 line items into Xactimate on a Friday night, and decided that wasn't a problem we should still be solving in 2026.
        </p>
      </section>

      <section className="k-about-pillars">
        {[
          { t: 'One grid, no wizard',        body: 'Everything Kevin found sits in a single editable spreadsheet — room, description, make, model, class, cost, age, depreciation. No locked steps, no modal asking if you are sure. Pin the item panel and work down the list.' },
          { t: 'One item per photo',         body: 'Kevin groups shots taken seconds apart into one item, so three angles of a sofa are one line, not three. You merge, split, or skip a set before anything is identified — and add a note that steers what Kevin looks for.' },
          { t: 'Priced, or honestly blank',  body: 'Three live comps per item; the median becomes the replacement cost, with a dated proof link on the line. When Kevin cannot find a confident comp it leaves the cell empty for you to fill — never a guess dressed up as a number.' },
          { t: 'Yours to take anywhere',     body: 'Export the XactContents spreadsheet, a client PDF, or the whole bundle with every photo and the audit log. Kevin never pushes into a carrier system — you send the file. Nothing is ever deleted to reclaim space.' },
          { t: 'Like kind and quality, priced',  body: 'Half of what is inventoried is discontinued. Kevin finds the nearest model still sold new, prices that, and records the swap on the line so the carrier sees the reasoning. Replacement cost always holds a new-replacement price — never a used listing that has already lost value once.' },
          { t: 'The math is the backend\u2019s job',  body: 'Depreciation comes from the schedule on the claim, computed server-side, so the number in your worksheet is the number in the exported spreadsheet — to the penny. Change a class or an age and the cell waits for the answer rather than guessing at one.' },
        ].map((p, i) => (
          <div key={i} className="k-about-pillar">
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>0{i + 1}</div>
            <h3 style={{ fontFamily: 'var(--k-font-display)', fontSize: 26, letterSpacing: '-0.022em', margin: '8px 0 8px', lineHeight: 1.15 }}>{p.t}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>{p.body}</p>
          </div>
        ))}
      </section>

      <section className="k-about-team">
        <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Team</div>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 38, letterSpacing: '-0.025em', margin: '8px 0 32px' }}>
          A small team in Long Island, NY.
        </h2>
        <div className="k-about-team-grid">
          {[
            { name: 'Kevin Godfrey',   role: 'Founder',  bio: 'Insurance adjuster for 22 years, settling over 10,000 claims. Built Kevin because his nights and weekends were going to Xactimate, not his kids.', initials: 'KG', photo: '../assets/kevin-godfrey.png' },
          ].map((p, i) => (
            <div key={i} className="k-about-card">
              {p.photo
                ? <span className="k-about-avatar" style={{ overflow: 'hidden', padding: 0 }}><img src={p.photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></span>
                : <span className="k-about-avatar">{p.initials}</span>}
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 2 }}>{p.role}</div>
              <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.5, margin: '12px 0 0' }}>{p.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="k-about-stats">
        {[
          ['2024', 'Founded'],
          ['3',          'Full-time team'],
          ['$1B+',       'In total claims settled'],
          ['310+',       'Claims processed in beta'] /* was 'Line items processed in beta' — 310 now counts claims; flag if you want line items back */,
        ].map(([n, l], i) => (
          <div key={i} className="k-stat-cell" style={{ borderRight: i < 3 ? '1px solid var(--k-line)' : 0 }}>
            <div className="k-stat-cell-n">{n}</div>
            <div className="k-stat-cell-l">{l}</div>
          </div>
        ))}
      </section>

      <section className="k-mkt-cta">
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.028em', margin: '0 0 14px', lineHeight: 1.05, textAlign: 'center' }}>
          We're hiring carefully.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 480, textAlign: 'center' }}>A couple of roles at a time. If you've settled a claim, run an estate sale, or shipped software people use all day, we want to hear from you.</p>
        <a className="k-btn k-btn--lg" href="53-Careers.html">See open roles →</a>
      </section>

      <MktFooter />
    </main>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 4 · PRICING SOURCE DETAIL  (settings sub-page)
// ───────────────────────────────────────────────────────────────────────────
// Comp-source detail — DIAGNOSTICS ONLY. Valuation behavior is configured in
// one place (Settings → Pricing); duplicating those controls here would let the
// two screens disagree about what the engine is doing. This page answers "is the
// comp source healthy and what did it just return", nothing else.
const PricingSourceDetail = () => (
  <div className="k-settings">
    <header className="k-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
        <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
        <window.TopNavTabs active="Settings" />
      </div>
      <window.AvatarMenu />
    </header>

    <div style={{ padding: '24px 32px 40px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <a className="k-link" style={{ fontSize: 12 }} href="14-Settings-pricing.html"><Icon d={I.chevleft} size={11} /> Back to Pricing</a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, marginBottom: 22 }}>
        <div className="k-source-logo" style={{ width: 56, height: 56, background: 'var(--k-accent)', color: '#fff', fontSize: 20 }}>G</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 32, letterSpacing: '-0.022em', margin: 0 }}>Google Shopping</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone="accent">Unified comp source</Badge>
            <Badge tone="ok" dot={true}>Operational</Badge>
            <span style={{ fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>Immersive Product API via SerpApi · last fetch 3m ago</span>
          </div>
        </div>
      </div>

      <section className="k-set-card k-set-card--accent">
        <div className="k-set-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0, padding: 0 }}>
          {[
            ['Comps fetched today',     '2,189',  'Your account'],
            ['Items priced this month', '6,840',  'Your account'],
            ['Match rate',              '87%',    'Platform · 30d'],
            ['Avg variance · comps',    '\u00b16.2%', 'Platform · 30d'],
          ].map(([l, v, scope], i) => (
            <div key={i} className="k-billing-cell" style={{ borderRight: i < 3 ? '1px solid var(--k-line)' : 0 }}>
              <div className="k-billing-l">{l}</div>
              <div className="k-billing-v">{v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{scope}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">How it's configured</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: '0 0 6px', maxWidth: 660 }}>
            Valuation behavior lives in one place so this screen and the engine can never disagree. Change any of it in <a href="14-Settings-pricing.html" style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>Settings → Pricing</a>.
          </p>
          {[
            ['Offers kept per item',       'Top 3 · RCV is the median'],
            ['LKQ substitutions',          'On — discontinued models priced as the nearest new equivalent'],
            ['Class depreciation ceilings', 'Enforced'],
            ['Brand-direct tiebreaker',    'On — applied when offers disagree by more than 15%'],
            ['Refresh cadence',            'Every 24 hours'],
          ].map(([l, v], i) => (
            <div key={i} className="k-rule">
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--k-fg-2)', width: 210, flexShrink: 0 }}>{l}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>{v}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  </div>
);

// MktNav / MktFooter are shared with utility-pages.jsx — export them so there is
// exactly one definition (a second top-level const would collide in global scope).
Object.assign(window, { ProductOverview, ContactSales, About, PricingSourceDetail, MktNav, MktFooter });
