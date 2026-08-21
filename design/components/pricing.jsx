// Pricing page — clean three-tier table with per-claim pricing & enterprise tier

const { KevinWordmark, Icon, I, Badge } = window;

const TIERS = [
  {
    id: 'pro', name: 'Pro', tag: "For Content Inventory Specialists, IA's and Public Adjusters",
    price: 249, suffix: '/mo',
    blurb: 'One flat monthly subscription. Unlimited claims, unlimited photos. Cancel anytime.',
    cta: 'Start 7-day free trial',
    primary: true,
    features: [
      ['Photo-dump ingest — hundreds of photos, auto-grouped into item sets', true],
      ['One item, one line, one evidence chain',                        true],
      ['Automatic identification: description, make, model, serial',    true],
      ['Live market pricing with like-kind-and-quality substitution for discontinued items', true],
      ['Comparable source link on every line',                          true],
      ['RCV and ACV, multi-method depreciation, adjuster override',     true],
      ['24 content classes mapped to Xactimate PCS codes',              true],
      ['Confidence gating — low-confidence high-value lines held for review, never published silently', true],
      ['Written-inventory import — spreadsheet in, priced list out',    true],
      ['Editable worksheet with per-item photo drawer and full audit trail', true],
      ['XactContents-format XLSX and PDF export',                       true],
      ['Client-facing share links',                                     true],
      ['Version retention and change history on every line',            true],
      ['Mobile capture, any phone, nothing to install',                 true],
      ['Unlimited claims, unlimited storage, archive and restore',      true],
    ],
  },
  {
    id: 'ent', name: 'Enterprise', tag: 'For carriers, TPAs & multi-adjuster agencies',
    price: 'Custom', suffix: '',
    blurb: 'Volume licensing for a whole desk or agency, with the controls a larger operation needs.',
    cta: 'Contact sales',
    primary: false,
    features: [
      ['Everything in Pro',                      true],
      ['Volume licensing · one invoice',         true],
      ['Shared carrier profiles & dep tables',   true],
      ['Reviewer roles & team workspace',        true],
      ['API access · webhooks',                  true],
      ['99.9% SLA · priority support',           true],
      ['Custom contract & DPA',                  true],
    ],
  },
];

const FAQS = [
  ['What counts as a claim?',
   'One loss event — one insured, one date of loss, one address. On Pro it doesn\'t matter: claims are unlimited, so run as many as you need.'],
  ['Do I pay extra for photos or items?',
   'No. Pro includes unlimited photos and items on every claim, with 500 GB of active photo storage on the account — no per-claim caps.'],
  ['Is the AI included, or is it extra?',
   'Included — all of it. Vision identification, live retail comps, depreciation, and every future model improvement ship inside the flat price. No add-ons, no tier upgrades, no per-item AI fees.'],
  ['What does the 7-day free trial include?',
   'Everything in Pro — real claims, full exports, live comps. Run an actual loss through Kevin end-to-end before your subscription starts.'],
  ['Does this work for estate sales?',
   'Yes. Pro includes estate sale mode — catalog a whole home, track condition and disposition, and export a clean inventory PDF. Same flat price.'],
  ['Can I cancel anytime?',
   'Yes. Pro is month-to-month, cancel whenever. No annual lock-in unless you want one (we discount it).'],
  ['Are pricing comps included or extra?',
   'Included. Every RCV cell gets top-3 retailer comps. We don\'t charge per comp or per refresh.'],
  ['Who owns my data — and how long do you keep it?',
   'You do, and forever. Claims get audited years after they settle, so nothing is ever deleted — closed claims move to slower archived storage but stay fully accessible, and you can export everything at any time.'],
  ['Is “unlimited claims” really unlimited?',
   'Yes. No claim caps, no per-claim fees. The one metered thing is photo storage (500 GB included — real cost, generous pool); going over triggers an email, never a mid-claim lockout.'],
  ['Do I need a credit card to start the trial?',
   "Yes. We verify your card at signup, but you're not charged during the 7-day trial."],
  ['What happens when the trial ends?',
   "Your Pro subscription starts automatically and your card is charged $249. We email you at signup and again 3 days before, so it's never a surprise."],
  ['Can I cancel during the trial?',
   "Yes — one click in Settings → Billing, any time before your charge date, and you're never charged."],
  ['Can I cancel after I’ve been charged?',
   'Yes, any time. You keep access through the period you’ve paid for. No cancellation fee, no notice period, no phone call.'],
  ['Do I lose my work if I cancel?',
   'No. Your claims, worksheets and exports stay available to download.'],
  ['Is there a contract?',
   'No. Month to month, cancel any time.'],
];

const Pricing = () => (
  <div className="k-landing">
    <window.MktNav active="pri" />

    <main className="k-mkt-main">
      <section className="k-mkt-hero" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto', padding: '60px 40px 40px' }}>
        <Badge tone="accent" dot={true}>Pricing</Badge>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 56, letterSpacing: '-0.028em', margin: '18px 0 16px', lineHeight: 1.04 }}>
          One subscription. Unlimited claims.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          A flat monthly price, the way you already pay for Xactimate. No per-seat math, no per-photo charges, no surprises. Pricing comps are always included, and every account starts with a 7-day free trial.
        </p>
      </section>

      {/* — Tier cards — */}
      <section className="k-tiers">
        {TIERS.map(t => (
          <div key={t.id} className={`k-tier ${t.primary ? 'k-tier--on' : ''}`}>
            {t.primary && <div className="k-tier-flag">Most popular</div>}
            <div className="k-tier-hd">
              <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t.tag}</div>
              <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '-0.022em', margin: '4px 0 0' }}>{t.name}</h2>
            </div>
            <div className="k-tier-price">
              {typeof t.price === 'number' ? (
                <>
                  <span className="k-tier-currency">$</span>
                  <span className="k-tier-num">{t.price}</span>
                  <span className="k-tier-suffix">{t.suffix}</span>
                </>
              ) : (
                <span className="k-tier-num" style={{ fontSize: 36 }}>{t.price}</span>
              )}
            </div>
            <p className="k-tier-blurb">{t.blurb}</p>
            <a className={`k-btn k-btn--lg ${t.primary ? '' : 'k-btn--ghost'}`} href={t.primary ? '58-Account-create.html' : '38-Contact.html'} style={{ width: '100%', justifyContent: 'center' }}>{t.cta}</a>
            <div className="k-tier-features">
              {t.features.map(([label, on, hint], i) => (
                <div key={i} className={`k-tier-feat ${!on ? 'k-tier-feat--off' : ''}`}>
                  {on
                    ? <Icon d={I.check} size={12} stroke={2.5} />
                    : <span style={{ width: 12, height: 12, display: 'inline-block', textAlign: 'center', color: 'var(--k-fg-4)' }}>–</span>
                  }
                  <span style={{ flex: 1 }}>{label}{hint && <span style={{ color: 'var(--k-fg-4)', display: 'block', fontSize: 11, marginTop: 1 }}>{hint}</span>}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* — Performance metrics — measured on real claims, same figures as landing/segments — */}
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '56px 40px 8px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>What $249 buys back</div>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 34, letterSpacing: '-0.024em', margin: '0 0 28px' }}>Measured on real claims, not a demo</h2>
        <div className="k-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, textAlign: 'left' }}>
          <div className="k-stat-card">
            <div className="k-stat-n">~29 min</div>
            <div className="k-stat-l">256 photos → priced inventory</div>
            <div className="k-stat-s">Machine time, unattended — vs. 13.3 hours typing at 4 min a row</div>
          </div>
          <div className="k-stat-card k-stat-card--accent">
            <div className="k-stat-n">11×</div>
            <div className="k-stat-l">less adjuster time per claim</div>
            <div className="k-stat-s">You touch exceptions only — ~19 rows of 256, about 1.3 hours</div>
          </div>
          <div className="k-stat-card">
            <div className="k-stat-n">$249</div>
            <div className="k-stat-l">flat, unlimited claims</div>
            <div className="k-stat-s">One recovered claim-day covers months of Kevin</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 14 }}>Times measured on a 256-photo pack-out and a 200-row written inventory against a 4-minute-per-row manual baseline.</div>
      </section>
      {/* — Value band — */}
      <section className="k-mkt-band">
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', lineHeight: 1.2, marginBottom: 8 }}>
            Priced like the tools you already use.
          </div>
          <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: 0, maxWidth: 480 }}>
            One flat monthly subscription, billed per user — same as Xactimate or XactContents. Run one claim or fifty; the price doesn't move. Running a whole desk or agency? Enterprise gives you volume licensing on a single invoice.
          </p>
        </div>
        <div className="k-calc">
          <div className="k-calc-l">Kevin Pro</div>
          <div className="k-calc-row">
            <span className="k-calc-num">$249</span>
            <span className="k-calc-unit">/ month</span>
          </div>
          <div className="k-calc-bar"><div style={{ width: '100%' }} /></div>
          <div className="k-calc-foot">
            <span>Unlimited claims</span>
            <span style={{ color: 'var(--k-accent)', fontWeight: 600 }}>7-day free trial</span>
          </div>
        </div>
      </section>

      {/* — FAQ — */}
      <section className="k-faq">
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 34, letterSpacing: '-0.025em', margin: '0 0 32px' }}>Frequently asked.</h2>
        <div className="k-faq-grid">
          {FAQS.map(([q, a], i) => (
            <div key={i} className="k-faq-card">
              <div className="k-faq-q">{q}</div>
              <div className="k-faq-a">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* — CTA — */}
      <section className="k-mkt-cta">
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '0 0 14px', lineHeight: 1.05 }}>
          Try Kevin free for 7 days.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--k-fg-3)', margin: '0 0 28px', maxWidth: 480, textAlign: 'center' }}>
          Bring a real loss. We'll get you set up and walk you through the worksheet in a 30-minute call.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="k-btn k-btn--lg" href="58-Account-create.html">Start your free trial →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="38-Contact.html">Talk to sales</a>
        </div>
      </section>

      <window.MktFooter />
    </main>
  </div>
);

window.Pricing = Pricing;
