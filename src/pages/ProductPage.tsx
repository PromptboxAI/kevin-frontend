import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { MktShot } from './LandingPage'

/**
 * Product overview — ported from design/components/marketing-pages.jsx
 * (ProductOverview), copy verbatim.
 *
 * The five surface cards link into the PRODUCT screens, which already exist in
 * this app — /claims/new, staging, processing, the worksheet. Those are the
 * other agent's routes: linked to, never touched.
 */

const SURFACES: { n: string; t: string; img: string; to: string; body: string }[] = [
  {
    n: '01',
    t: 'Intake',
    img: 'intake-form',
    to: '/claims/new',
    body: 'Claim and policy details, the contents coverage limit, and a loss ZIP that resolves the sales-tax rate. One short form, then straight to the photos.',
  },
  {
    n: '02',
    t: 'Stage',
    img: 'staging-sets',
    to: '/claims',
    body: 'Drop a folder, a phone dump, or a whole .zip — no total-size cap. Duplicates are hashed out, and shots taken seconds apart are grouped into one set — merge, split, or exclude before anything is identified.',
  },
  {
    n: '03',
    t: 'Process',
    img: 'processing-live',
    to: '/claims',
    body: 'Item, make, model number, content class. Three live comps per item, with the median becoming the replacement cost and a dated proof link on the line.',
  },
  {
    n: '04',
    t: 'Review',
    img: 'worksheet-review',
    to: '/claims',
    body: 'One grid, every cell editable. Pin the item panel to see the source photo and comps beside the row. Special-limits flags, room filters, class grouping.',
  },
  {
    n: '05',
    t: 'Export',
    img: 'export-modal',
    to: '/exports',
    body: 'The XactContents spreadsheet for claims, a client-ready PDF for estate sales, or the whole bundle with photos and the audit log.',
  },
]

export default function ProductPage() {
  return (
    <div className="k-landing">
      <MktNav active="product" />
      <main className="k-mkt-main">
        <section
          className="k-mkt-hero k-prod-hero"
          style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}
        >
          <Badge tone="accent" dot>
            Product overview
          </Badge>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              letterSpacing: '-0.028em',
              margin: '20px 0 18px',
              lineHeight: 1.02,
            }}
          >
            Photo dump in. XactContents out.
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'var(--k-fg-2)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 620,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Kevin turns a folder of photos into a complete, priced personal-property inventory —
            for adjusters settling contents claims and estate professionals cataloging a home. It
            triages the dump, identifies each item, prices it against live retail comps, and writes
            the spreadsheet your carrier already accepts.
          </p>
          <div className="k-hero-actions" style={{ justifyContent: 'center' }}>
            <Link className="k-btn k-btn--lg" to="/sign-in">
              Start free — 250 items →
            </Link>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/pricing">
              See pricing
            </Link>
          </div>
        </section>

        <section className="k-proof-solo">
          <MktShot
            src="/marketing/worksheet-review-2x.webp"
            alt="Kevin review worksheet — priced line items with make, model, content class, depreciation and ACV columns"
            label="kevin.co/claims/CLM-2026-04412/worksheet"
            slot="Review worksheet — 57 priced lines"
            ratio="3186 / 1766"
            caption="One grid, every cell editable — and every price traceable to the comp it came from."
          />
        </section>

        {/* Five surfaces */}
        <section style={{ padding: '40px 0 60px' }}>
          <div className="k-prod-surfaces">
            {SURFACES.map((s) => (
              <Link key={s.n} className="k-prod-surface" to={s.to}>
                <div className="k-prod-surface-img">
                  <img
                    className="k-prod-surface-shot"
                    src={`/marketing/${s.img}-thumb.webp`}
                    alt={`Kevin ${s.t} screen`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--k-font-mono)',
                      fontSize: 11,
                      color: 'var(--k-accent)',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--k-font-display)',
                      fontSize: 26,
                      letterSpacing: '-0.022em',
                      margin: '6px 0 8px',
                    }}
                  >
                    {s.t}
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>
                    {s.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Intake */}
        <div className="k-proof-row k-proof-row--flip" style={{ paddingTop: 8 }}>
          <div className="k-proof-copy">
            <div className="k-proof-eyebrow">Where a claim starts</div>
            <h3 className="k-proof-h">One short form, then the photos.</h3>
            <p className="k-proof-body">
              Claim and policy details, the contents coverage limit under whatever name the policy
              gives it, and the loss ZIP — which resolves the sales-tax rate so every line carries
              the right tax without anyone looking it up.
            </p>
            <ul className="k-proof-list">
              {[
                'Contents limit carries the policy’s own label, never a hardcoded coverage letter',
                'Loss ZIP sets the tax rate — 8.625% on a Smithtown claim, applied per line',
                'Takes a minute; everything after it is review, not data entry',
              ].map((t) => (
                <li key={t}>
                  <Icon d={I.check} size={13} stroke={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <MktShot
            src="/marketing/intake-form-2x.webp"
            alt="Kevin new-claim intake form — insured, carrier, policy and loss details with the contents coverage limit and loss ZIP"
            label="kevin.co/claims/new"
            slot="New claim — intake"
            ratio="1740 / 1034"
            caption="The loss ZIP resolves the tax rate; the coverage limit keeps the policy’s own wording."
          />
        </div>

        {/* Two-up proof */}
        <div className="k-proof-hd">
          <div className="k-proof-eyebrow">Where the hours actually go</div>
          <h2 className="k-proof-h2">Processing runs unattended. Exporting takes one click.</h2>
          <p className="k-proof-sub">
            Items resolve into the grid as Kevin identifies them. The file lands in XactContents
            without reformatting.
          </p>
        </div>
        <section className="k-proof-two">
          <MktShot
            src="/marketing/processing-live-anim.webp"
            alt="Kevin processing — items resolving into the worksheet as photos are identified, each with a confidence indicator and a live price"
            label="kevin.co/claims/CLM-2026-04412/processing"
            slot="Processing — items resolving live"
            ratio="1600 / 950"
            caption="Items land in the grid as Kevin identifies them — confidence dots show what it is sure of. Open the worksheet on the first batch; you never wait for the last photo."
          />
          <MktShot
            src="/marketing/export-modal-2x.webp"
            alt="Kevin export modal — Xactimate Excel XactContents template, client PDF and full bundle, with download and share actions"
            label="Export claim · CLM-2026-04412"
            slot="Carrier export modal"
            ratio="3156 / 1916"
            caption="Xactimate (Excel) · .xlsx · XactContents template — static values in every derived cell, because the importer breaks on formulas."
          />
        </section>

        {/* Defensibility band */}
        <section className="k-mkt-band">
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-accent)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Why people pick Kevin
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 38,
                letterSpacing: '-0.025em',
                margin: '8px 0 14px',
                lineHeight: 1.06,
              }}
            >
              Every price has a receipt.
            </h2>
            <p
              style={{
                fontSize: 14.5,
                color: 'var(--k-fg-2)',
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 480,
              }}
            >
              Every priced line carries a dated link to the comp the price came from, and the audit
              log records who changed what, and when. Months later — at supplement, at
              reinspection, at the call where someone questions a number — you can show your work
              without remembering a thing.
            </p>
          </div>
          <div
            className="k-mkt-band-r"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {[
              'A dated proof link on every priced line',
              'Audit log of every edit, exportable',
              'Special-limits flags for coverage caps',
              'Unpriced items left blank, never guessed',
            ].map((l) => (
              <div
                key={l}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--k-bg)',
                  borderRadius: 8,
                  border: '1px solid var(--k-line)',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 99,
                    background: 'var(--k-ok-soft)',
                    color: 'oklch(0.36 0.08 175)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon d={I.check} size={11} stroke={2.5} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="k-mkt-cta">
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 44,
              letterSpacing: '-0.028em',
              margin: '0 0 14px',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            Try it on a real claim.
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
            Your first 250 line items are free, with no clock running. $249/mo after that —
            unlimited claims, 2,000 line items a month included, no per-seat fee.
          </p>
          <div className="k-hero-actions" style={{ marginTop: 0 }}>
            <Link className="k-btn k-btn--lg" to="/sign-in">
              Start free — 250 items →
            </Link>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/claims">
              See a finished claim
            </Link>
          </div>
        </section>
        <MktFooter />
      </main>
    </div>
  )
}
