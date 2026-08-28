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
            src="../assets/marketing/worksheet-review-2x.webp"
            alt="Kevin review worksheet — priced line items with make, model, content class, depreciation and ACV columns"
            label="kevin.co/claims/CLM-2026-04412/worksheet"
            slot="Review worksheet — 57 priced lines"
            size="Capture from pages/05-Worksheet-flat.html · 2000 × 1125"
            ratio="3186 / 1766"
            caption="One grid, every cell editable — and every price traceable to the comp it came from."
          />
        </section>

        {/* Five surfaces */}
        <section style={{ padding: '40px 0 60px' }}>
          <div className="k-prod-surfaces">
            {[
              { n: '01', t: 'Intake',   img: 'intake-form',      href: '03-Intake.html',        body: 'Claim and policy details, the contents coverage limit, and a loss ZIP that resolves the sales-tax rate. One short form, then straight to the photos.' },
              { n: '02', t: 'Stage',    img: 'staging-sets',     href: '73-Photo-staging.html', body: 'Drop a folder, a phone dump, or a whole .zip — no total-size cap. Duplicates are hashed out, and shots taken seconds apart are grouped into one set — merge, split, or exclude before anything is identified.' },
              { n: '03', t: 'Process',  img: 'processing-live', href: '04-Processing.html',    body: 'Item, make, model number, content class. Three live comps per item, with the median becoming the replacement cost and a dated proof link on the line.' },
              { n: '04', t: 'Review',   img: 'worksheet-review', href: '05-Worksheet-flat.html', body: 'One grid, every cell editable. Pin the item panel to see the source photo and comps beside the row. Special-limits flags, room filters, class grouping.' },
              { n: '05', t: 'Export',   img: 'export-modal',     href: '06-Export-modal.html',  body: 'The XactContents spreadsheet for claims, a client-ready PDF for estate sales, or the whole bundle with photos and the audit log.' },
            ].map((s, i) => (
              <a key={i} className="k-prod-surface" href={s.href}>
                <div className="k-prod-surface-img">
                  <img
                    className="k-prod-surface-shot"
                    src={'../assets/marketing/' + s.img + '-thumb.webp'}
                    alt={'Kevin ' + s.t + ' screen'}
                    loading="lazy"
                    decoding="async"
                  />
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

        {/* Intake — the first screen a trial user touches, and the one that
            decides whether the tax rate and the coverage label are right for
            every line that follows. */}
        <div className="k-proof-row k-proof-row--flip" style={{ paddingTop: 8 }}>
          <div className="k-proof-copy">
            <div className="k-proof-eyebrow">Where a claim starts</div>
            <h3 className="k-proof-h">One short form, then the photos.</h3>
            <p className="k-proof-body">
              Claim and policy details, the contents coverage limit under whatever name the
              policy gives it, and the loss ZIP — which resolves the sales-tax rate so every
              line carries the right tax without anyone looking it up.
            </p>
            <ul className="k-proof-list">
              {[
                'Contents limit carries the policy\u2019s own label, never a hardcoded coverage letter',
                'Loss ZIP sets the tax rate — 8.625% on a Smithtown claim, applied per line',
                'Takes a minute; everything after it is review, not data entry',
              ].map(t => (
                <li key={t}><Icon d={I.check} size={13} stroke={2.5} />{t}</li>
              ))}
            </ul>
          </div>
          <window.MktShot
            src="../assets/marketing/intake-form-2x.webp"
            alt="Kevin new-claim intake form — insured, carrier, policy and loss details with the contents coverage limit and loss ZIP"
            label="kevin.co/claims/new"
            slot="New claim — intake"
            size="Capture from pages/03-Intake.html · 1740 × 1034"
            ratio="1740 / 1034"
            caption="The loss ZIP resolves the tax rate; the coverage limit keeps the policy’s own wording."
          />
        </div>

        {/* Two-up proof — the two screens that absorb the manual hours. */}
        <div className="k-proof-hd">
          <div className="k-proof-eyebrow">Where the hours actually go</div>
          <h2 className="k-proof-h2">Processing runs unattended. Exporting takes one click.</h2>
          <p className="k-proof-sub">Items resolve into the grid as Kevin identifies them. The file lands in XactContents without reformatting.</p>
        </div>
        <section className="k-proof-two">
          <window.MktShot
            src="../assets/marketing/processing-live-anim.webp"
            alt="Kevin processing — items resolving into the worksheet as photos are identified, each with a confidence indicator and a live price"
            label="kevin.co/claims/CLM-2026-04412/processing"
            slot="Processing — items resolving live"
            size="Capture from pages/04-Processing.html · 1600 × 950"
            ratio="1600 / 950"
            caption="Items land in the grid as Kevin identifies them — confidence dots show what it is sure of. Open the worksheet on the first batch; you never wait for the last photo."
          />
          <window.MktShot
            src="../assets/marketing/export-modal-2x.webp"
            alt="Kevin export modal — Xactimate Excel XactContents template, client PDF and full bundle, with download and share actions"
            label="Export claim · CLM-2026-04412"
            slot="Carrier export modal"
            size="Capture from pages/06-Export-modal.html · 1400 × 875"
            ratio="3156 / 1916"
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

      <section className="k-about-belief-hd">
        <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>What we hold to</div>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 38, letterSpacing: '-0.025em', margin: '8px 0 0', lineHeight: 1.1 }}>
          Four things we will not trade away.
        </h2>
      </section>

      <section className="k-about-pillars">
        {[
          { t: 'The adjuster decides',        body: 'Kevin flags — special limits, thin evidence, a class that needs an appraiser — and then gets out of the way. Nothing is blocked, no export is held hostage, no approval gate stands between you and your own file. You can override every number on the page.' },
          { t: 'Every number shows its work',  body: 'Each price cites the live comps behind it with a dated link, and the audit log records who changed what and when. When Kevin cannot corroborate a price it leaves the cell blank rather than inventing one — a confident wrong number is worse than an honest gap.' },
          { t: 'One grid, no wizard',          body: 'Everything sits in a single editable spreadsheet — room, description, make, model, class, cost, age, depreciation. No locked steps, no modal asking whether you are sure. Pin the item panel and work down the list the way you already work.' },
          { t: 'Your data, your file',         body: 'Export the XactContents spreadsheet, a client PDF, or the whole bundle with every photo and the audit log. Kevin never pushes into a carrier system — you send the file. Nothing is deleted to reclaim space, because it is your record, not ours.' },
        ].map((p, i) => (
          <div key={i} className="k-about-pillar">
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>0{i + 1}</div>
            <h3 style={{ fontFamily: 'var(--k-font-display)', fontSize: 26, letterSpacing: '-0.022em', margin: '8px 0 8px', lineHeight: 1.15 }}>{p.t}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>{p.body}</p>
          </div>
        ))}
      </section>

      {/* Was a single card in a repeat(4, 1fr) grid — one person at 25% width
          with three empty columns beside them, which is most of why this page
          read as unfinished. A founder-led section instead: the photo carries
          the credibility an About page is actually here to establish. */}
      <section className="k-about-founder">
        <div className="k-about-founder-media">
          <img src="../assets/kevin-godfrey.png" alt="Kevin Godfrey, founder" loading="lazy" decoding="async" />
        </div>
        <div className="k-about-founder-body">
          <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Why Kevin exists</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 36, letterSpacing: '-0.025em', margin: '10px 0 18px', lineHeight: 1.1 }}>
            Twenty-two years of contents, and the same Friday night.
          </h2>
          <p className="k-about-founder-p">
            Kevin Godfrey spent twenty-two years as an adjuster and settled more than ten thousand
            claims. Contents was always the part that ate the weekend: the structure gets scoped in
            an afternoon, then the personal property list takes days — photograph everything,
            identify it, find what it costs today, argue the depreciation, type all of it in.
          </p>
          <p className="k-about-founder-p">
            None of that work needed a person. Reading a model number off a photograph, finding
            three live prices, applying the schedule to the age — that is machine work. Deciding
            whether the number is right, whether the class is right, whether the carrier will wear
            it: that is the adjuster's work, and it is the only part worth an evening.
          </p>
          <p className="k-about-founder-quote">
            “The field work never changed. The typing did.”
          </p>
          <div className="k-about-founder-attrib">
            <span>Kevin Godfrey</span>
            <span className="k-trust-dot">·</span>
            <span>Founder</span>
            <span className="k-trust-dot">·</span>
            <span>Smithtown, New York</span>
          </div>
        </div>
      </section>

      <section className="k-about-stats">
        {[
          ['2024', 'Founded'],
          ['3',          'People behind it'],
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
