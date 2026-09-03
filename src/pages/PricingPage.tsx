import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { MktROISection, MktSocialProof } from './LandingPage'

/**
 * Pricing — ported from design/components/pricing.jsx, copy verbatim.
 *
 * Two tiers, flat monthly. NOT per-claim and NOT per-seat (domain rule 9): the
 * Solo per-claim and Agency per-seat tiers were scrapped. Must stay in sync
 * with the Billing settings page.
 *
 * MktSocialProof and MktROISection are imported from the landing page rather
 * than duplicated, exactly as the prototype shares them — the quotes, the
 * settled-with roster and the ROI maths cannot drift between the two pages.
 *
 * Fixed in the source while porting: the hero lede still ended "every account
 * starts with a 7-day free trial", which rule 9b scrapped. check-domain-rules
 * had missed it because the same sentence contains "No per-seat math", and a
 * negation anywhere on the line makes the guard treat it as denial copy.
 */

type Feature = [string, boolean, string?]

const TIERS: {
  id: string
  name: string
  tag: string
  price: number | string
  suffix: string
  blurb: string
  cta: string
  primary: boolean
  features: Feature[]
}[] = [
  {
    id: 'pro',
    name: 'Pro',
    tag: 'One adjuster. Unlimited claims.',
    price: 249,
    suffix: '/mo',
    blurb:
      'One flat monthly subscription. Unlimited claims, 2,000 items a month included, then $0.20 an item. Cancel anytime.',
    cta: 'Start with 250 free items',
    primary: true,
    features: [
      ['Photo-dump ingest — hundreds of photos, auto-grouped into item sets', true],
      ['One item, one line, one evidence chain', true],
      ['Automatic identification: description, make, model, serial', true],
      [
        'Live market pricing with like-kind-and-quality substitution for discontinued items',
        true,
      ],
      ['Comparable source link on every line', true],
      ['RCV and ACV, multi-method depreciation, adjuster override', true],
      ['24 content classes mapped to Xactimate PCS codes', true],
      ['Every price traceable — unpriced lines arrive blank and editable, never guessed', true],
      ['Written-inventory import — spreadsheet in, priced list out', true],
      ['Editable worksheet with per-item photo drawer and full audit trail', true],
      ['XactContents-format XLSX and PDF export', true],
      ['Client-facing share links', true],
      ['Version retention and change history on every line', true],
      ['Mobile capture, any phone, nothing to install', true],
      ['Unlimited claims · 2,000 items a month · $0.20 an item after', true],
      ['500 GB photo storage, archive and restore', true],
    ],
  },
  {
    id: 'ent',
    name: 'Enterprise',
    tag: 'Two or more adjusters, one invoice.',
    price: 'Custom',
    suffix: '',
    blurb:
      'Volume licensing for a whole desk or agency, with the controls a larger operation needs.',
    cta: 'Talk to us about your desk',
    primary: false,
    features: [
      ['Everything in Pro', true],
      ['Volume licensing · one invoice', true],
      ['Shared carrier profiles & dep tables', true],
      ['Reviewer roles & team workspace', true],
      ['API access · webhooks', true],
      ['99.9% SLA · priority support', true],
      ['Custom contract & DPA', true],
    ],
  },
]

const FAQS: [string, string][] = [
  [
    'Do I need a credit card to start?',
    'Yes. We verify your card at signup so we know you are a real adjuster, but nothing is charged until you choose to start Pro or pass your 250 free items.',
  ],
  [
    'What does the free tier include?',
    'Everything in Pro — real claims, full exports, live comps — for your first 250 line items. That is roughly four 60-photo claims, and there is no clock: take a week or take three months.',
  ],
  [
    'What happens when I use up the 250 items?',
    'Kevin stops producing new line items and asks you to start Pro or add credits. Nothing you have already built goes away, and no claim is deleted — the photos you have not processed yet simply wait until you have quota again.',
  ],
  [
    'Am I locked in? Can I cancel?',
    'No contract, month to month. Cancel in one click in Settings → Billing. On the free tier there is nothing to cancel and nothing is owed; on Pro you keep access through the period you have already paid for. No cancellation fee, no notice period, no phone call.',
  ],
  ['Do I lose my work if I cancel?', 'No. Your claims, worksheets and exports stay available to download.'],
  [
    'Is “unlimited claims” really unlimited?',
    'Yes — run as many claims as you like, with no per-claim fee. What is metered is line items: 2,000 a month are included, and past that it is $0.20 an item. A 60-photo kitchen fire is about 57 items, so 2,000 is roughly 35 claims of that size in a month.',
  ],
  [
    'What counts as a claim?',
    "One loss event — one insured, one date of loss, one address. On Pro it doesn't matter: claims are unlimited, so run as many as you need.",
  ],
  [
    'Do I pay extra for photos or items?',
    'Photos, no — upload as many as you like, with 500 GB of active storage on the account. Items, only past the 2,000 a month included, and then $0.20 each. The count is in Settings → Billing before it costs anything, and going over never locks a claim.',
  ],
  [
    'If I delete an item, do I get the quota back?',
    'No, and this is the one part of the meter worth knowing up front. The count records items Kevin produced, not items you kept, because the pricing lookups are already paid for by the time the row appears. Delete a duplicate and the row goes away; the count does not move.',
  ],
  [
    'Are pricing comps included or extra?',
    "Included. Every RCV cell gets top-3 retailer comps. We don't charge per comp or per refresh.",
  ],
  [
    'Is the AI included, or is it extra?',
    'Included — all of it. Vision identification, live retail comps, depreciation, and every future model improvement ship inside the price. No add-ons and no tier upgrades; the AI is never billed separately from your item allowance.',
  ],
  [
    'Who owns my data — and how long do you keep it?',
    'You do, and forever. Claims get audited years after they settle, so nothing is ever deleted — closed claims move to slower archived storage but stay fully accessible, and you can export everything at any time.',
  ],
  [
    'Does this work for estate sales?',
    'Yes, but it is priced separately. Estate sales are $249 per estate from the first one — one price for the whole job, billed per engagement rather than per month, because an estate runs hundreds to thousands of items and would swallow a monthly allowance whole. Estate mode catalogs a whole home, tracks condition and disposition, and exports a client-ready PDF.',
  ],
]

export default function PricingPage() {
  return (
    <div className="k-landing">
      <MktNav active="pri" />

      <main className="k-mkt-main">
        <section
          className="k-mkt-hero k-price-hero"
          style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}
        >
          <Badge tone="accent" dot>
            Pricing
          </Badge>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              letterSpacing: '-0.028em',
              margin: '18px 0 16px',
              lineHeight: 1.04,
            }}
          >
            One subscription. Unlimited claims.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--k-fg-2)',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            A flat monthly price, the way you already pay for Xactimate. $249 covers 2,000 line
            items a month — more claims than most adjusters write — and anything past that is $0.20
            an item. No per-seat math, no per-claim fee, and your first 250 line items are free.
          </p>
        </section>

        {/* — Tier cards — */}
        <section className="k-tiers">
          {TIERS.map((t) => (
            <div key={t.id} className={`k-tier ${t.primary ? 'k-tier--on' : ''}`}>
              {t.primary && <div className="k-tier-flag">Most popular</div>}
              <div className="k-tier-hd">
                <div
                  style={{
                    fontFamily: 'var(--k-font-mono)',
                    fontSize: 11,
                    color: 'var(--k-fg-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                  }}
                >
                  {t.tag}
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--k-font-display)',
                    fontWeight: 400,
                    fontSize: 30,
                    letterSpacing: '-0.022em',
                    margin: '4px 0 0',
                  }}
                >
                  {t.name}
                </h2>
              </div>
              <div className="k-tier-price">
                {typeof t.price === 'number' ? (
                  <>
                    <span className="k-tier-currency">$</span>
                    <span className="k-tier-num">{t.price}</span>
                    <span className="k-tier-suffix">{t.suffix}</span>
                  </>
                ) : (
                  <span className="k-tier-num" style={{ fontSize: 36 }}>
                    {t.price}
                  </span>
                )}
              </div>
              <p className="k-tier-blurb">{t.blurb}</p>
              {t.primary ? (
                <Link
                  className="k-btn k-btn--lg"
                  to="/sign-in"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {t.cta}
                </Link>
              ) : (
                <span
                  className="k-btn k-btn--lg k-btn--ghost k-mkt-soon"
                  title="Coming soon"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {t.cta}
                </span>
              )}
              {/* The card question is THE objection for cold traffic. Answer it
                  at the button, not 15 FAQ rows below the fold. */}
              {t.primary && (
                <div className="k-tier-trial">
                  Card verified at signup · not charged until you pass 250 items · one-click cancel
                  in Settings → Billing
                </div>
              )}
              <div className="k-tier-features">
                {t.features.map(([label, on, hint], i) => (
                  <div key={i} className={`k-tier-feat ${!on ? 'k-tier-feat--off' : ''}`}>
                    {on ? (
                      <Icon d={I.check} size={12} stroke={2.5} />
                    ) : (
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          display: 'inline-block',
                          textAlign: 'center',
                          color: 'var(--k-fg-4)',
                        }}
                      >
                        –
                      </span>
                    )}
                    <span style={{ flex: 1 }}>
                      {label}
                      {hint && (
                        <span
                          style={{
                            color: 'var(--k-fg-4)',
                            display: 'block',
                            fontSize: 11,
                            marginTop: 1,
                          }}
                        >
                          {hint}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Straight under the tiers: the price has just landed and proof is what
            carries the click. Shared with the landing page so the quotes and the
            settled-with roster cannot drift. */}
        <MktSocialProof />

        {/* — Performance metrics, same figures as landing/segments — */}
        <section className="k-price-stats" style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 34,
              letterSpacing: '-0.024em',
              margin: '0 0 28px',
            }}
          >
            Measured on real claims, not a demo
          </h2>
          <div className="k-stat-row k-stat-row--3">
            <div className="k-stat-card">
              <div className="k-stat-n">~29 min</div>
              <div className="k-stat-l">256 photos → priced inventory</div>
              <div className="k-stat-s">
                Machine time, unattended — vs. 13.3 hours typing at 4 min a row
              </div>
            </div>
            <div className="k-stat-card k-stat-card--accent">
              <div className="k-stat-n">11×</div>
              <div className="k-stat-l">less adjuster time per claim</div>
              <div className="k-stat-s">
                You touch exceptions only — ~19 rows of 256, about 1.3 hours
              </div>
            </div>
            <div className="k-stat-card">
              <div className="k-stat-n">$249</div>
              <div className="k-stat-l">a month · 2,000 items included</div>
              <div className="k-stat-s">At $150/hr, 1.7 recovered hours pays for the month</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 14 }}>
            Times measured on a 256-photo pack-out and a 200-row written inventory against a
            4-minute-per-row manual baseline.
          </div>
        </section>

        <MktROISection />

        {/* — FAQ — */}
        <section className="k-faq">
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 34,
              letterSpacing: '-0.025em',
              margin: '0 0 32px',
            }}
          >
            Frequently asked.
          </h2>
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
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 44,
              letterSpacing: '-0.028em',
              margin: '0 0 14px',
              lineHeight: 1.05,
            }}
          >
            Your first 250 items are free.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--k-fg-3)',
              margin: '0 0 28px',
              maxWidth: 480,
              textAlign: 'center',
            }}
          >
            Bring a real loss. We'll get you set up and walk you through the worksheet in a
            30-minute call.
          </p>
          <div className="k-hero-actions" style={{ marginTop: 0 }}>
            <Link className="k-btn k-btn--lg" to="/sign-in">
              Start free — 250 items →
            </Link>
            <span className="k-btn k-btn--ghost k-btn--lg k-mkt-soon" title="Coming soon">
              Talk to sales
            </span>
          </div>
        </section>

        <MktFooter />
      </main>
    </div>
  )
}
