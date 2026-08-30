// Pricing page — two tiers, flat monthly. NOT per-claim and NOT per-seat
// (domain rule 9): the Solo per-claim and Agency per-seat tiers were scrapped.
// Must stay in sync with settings-pages.jsx -> SettingsBilling.

const { KevinWordmark, Icon, I, Badge } = window;

const TIERS = [
  {
    id: 'pro', name: 'Pro', tag: 'One adjuster. Unlimited claims.',
    price: 249, suffix: '/mo',
    blurb: 'One flat monthly subscription. Unlimited claims, 2,000 items a month included, then $0.20 an item. Cancel anytime.',
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
      ['Every price traceable — unpriced lines arrive blank and editable, never guessed', true],
      ['Written-inventory import — spreadsheet in, priced list out',    true],
      ['Editable worksheet with per-item photo drawer and full audit trail', true],
      ['XactContents-format XLSX and PDF export',                       true],
      ['Client-facing share links',                                     true],
      ['Version retention and change history on every line',            true],
      ['Mobile capture, any phone, nothing to install',                 true],
      ['Unlimited claims · 2,000 items a month · $0.20 an item after',  true],
      ['500 GB photo storage, archive and restore',                     true],
    ],
  },
  {
    id: 'ent', name: 'Enterprise', tag: 'Two or more adjusters, one invoice.',
    price: 'Custom', suffix: '',
    blurb: 'Volume licensing for a whole desk or agency, with the controls a larger operation needs.',
    cta: 'Talk to us about your desk',
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
  ['Do I need a credit card to start the trial?',
   "Yes. We verify your card at signup, but you're not charged during the 7-day trial."],
  ['What does the 7-day free trial include?',
   'Everything in Pro \u2014 real claims, full exports, live comps. Run an actual loss through Kevin end-to-end before your subscription starts.'],
  ['What happens when the trial ends?',
   "Your Pro subscription starts automatically and your card is charged $249. We email you at signup and again 3 days before, so it's never a surprise."],
  ['Am I locked in? Can I cancel?',
   "No contract, month to month. Cancel in one click in Settings \u2192 Billing \u2014 before your charge date and you're never charged at all; after it, you keep access through the period you've paid for. No cancellation fee, no notice period, no phone call."],
  ['Do I lose my work if I cancel?',
   'No. Your claims, worksheets and exports stay available to download.'],
  ['Is \u201cunlimited claims\u201d really unlimited?',
   'Yes \u2014 run as many claims as you like, with no per-claim fee. What is metered is line items: 2,000 a month are included, and past that it is $0.20 an item. A 60-photo kitchen fire is about 57 items, so 2,000 is roughly 35 claims of that size in a month.'],
  ['What counts as a claim?',
   'One loss event \u2014 one insured, one date of loss, one address. On Pro it doesn\'t matter: claims are unlimited, so run as many as you need.'],
  ['Do I pay extra for photos or items?',
   'Photos, no \u2014 upload as many as you like, with 500 GB of active storage on the account. Items, only past the 2,000 a month included, and then $0.20 each. The count is in Settings \u2192 Billing before it costs anything, and going over never locks a claim.'],
  ['Are pricing comps included or extra?',
   'Included. Every RCV cell gets top-3 retailer comps. We don\'t charge per comp or per refresh.'],
  ['Is the AI included, or is it extra?',
   'Included — all of it. Vision identification, live retail comps, depreciation, and every future model improvement ship inside the price. No add-ons and no tier upgrades; the AI is never billed separately from your item allowance.'],
  ['Who owns my data \u2014 and how long do you keep it?',
   'You do, and forever. Claims get audited years after they settle, so nothing is ever deleted \u2014 closed claims move to slower archived storage but stay fully accessible, and you can export everything at any time.'],
  ['Does this work for estate sales?',
   'Yes, but it is priced separately. Estate sales are $249 per estate — one price for the whole job, billed per engagement rather than per month, because an estate runs hundreds to thousands of items. Estate mode catalogs a whole home, tracks condition and disposition, and exports a client-ready PDF.'],
];

const Pricing = () => (
  <div className="k-landing">
    <window.MktNav active="pri" />

    <main className="k-mkt-main">
      <section className="k-mkt-hero k-price-hero" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        <Badge tone="accent" dot={true}>Pricing</Badge>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, letterSpacing: '-0.028em', margin: '18px 0 16px', lineHeight: 1.04 }}>
          One subscription. Unlimited claims.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          A flat monthly price, the way you already pay for Xactimate. $249 covers 2,000 line items a month — more claims than most adjusters write — and anything past that is $0.20 an item. No per-seat math, no per-claim fee, and every account starts with a 7-day free trial.
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
            {/* The card question is THE objection for cold traffic. Answer it at
                the button, not 15 FAQ rows below the fold. */}
            {t.primary && (
              <div className="k-tier-trial">Card verified at signup · not charged for 7 days · one-click cancel in Settings → Billing</div>
            )}
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

      {/* — Social proof, straight under the tiers. The price has just landed and
            proof is what carries the click; shared with the landing page via
            MktSocialProof (landing.jsx) so the quotes and the settled-with
            roster can never drift between the two. — */}
      <window.MktSocialProof />

      {/* — Performance metrics — measured on real claims, same figures as landing/segments — */}
      <section className="k-price-stats" style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 34, letterSpacing: '-0.024em', margin: '0 0 28px' }}>Measured on real claims, not a demo</h2>
        <div className="k-stat-row k-stat-row--3">
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
            <div className="k-stat-l">a month · 2,000 items included</div>
            <div className="k-stat-s">At $150/hr, 1.7 recovered hours pays for the month</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 14 }}>Times measured on a 256-photo pack-out and a 200-row written inventory against a 4-minute-per-row manual baseline.</div>
      </section>
      {/* — ROI calculator, shared with the landing page (MktROISection in
            landing.jsx). Replaces the old 'Priced like the tools you already
            use' value band, which restated the price the visitor had just
            read; the sliders answer the question they actually have. — */}
      <window.MktROISection />


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
        <div className="k-hero-actions" style={{ marginTop: 0 }}>
          <a className="k-btn k-btn--lg" href="58-Account-create.html">Start your free trial →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="38-Contact.html">Talk to sales</a>
        </div>
      </section>

      <window.MktFooter />
    </main>
  </div>
);

window.Pricing = Pricing;
