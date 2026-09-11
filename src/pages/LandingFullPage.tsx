import Seo from '../components/Seo'
import { Link } from 'react-router-dom'
import StickyCta from '../components/StickyCta'
import { I, Icon } from '../components/Icon'
import Badge from '../components/Badge'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import {
  ConfPip,
  HERO_ROWS,
  ItemThumb,
  MktROISection,
  MktShot,
  MktSocialProof,
  PlainThumb,
} from './LandingPage'

/**
 * THE FULL LANDING PAGE, PRESERVED.
 *
 * This is the long-form homepage as it stood on 2026-09-11, kept whole and
 * intact so nothing written for it is lost: the visual-proof section, the
 * "Inside the grid" gallery, the how-it-works band, the compatible-with row,
 * the mid-funnel CTA and the social proof. The live homepage was cut down to
 * a hero, a working demo, the ROI calculator and a CTA, on the reasoning that
 * a first-time visitor needs to SEE the product work, not read an argument
 * about it.
 *
 * IT IS NOT LINKED AND NOT INDEXED. Reachable only at /landing-full, by
 * someone who knows the path. It exists to be read and to have parts lifted
 * back out, not to be a second homepage competing with / for the same search
 * intent -- two pages at one intent split their own ranking signals.
 *
 * The shared blocks (MktShot, MktROISection, MktSocialProof) are IMPORTED from
 * LandingPage rather than copied. They are used by four other pages too, and a
 * forked second definition would drift from the original within a week without
 * anything failing to say so.
 *
 * Most of this content also lives, in better shape, on /product -- which is
 * the real home for detailed product information.
 */

export default function LandingFullPage() {
  return (
    <div className="k-landing">
      <Seo noindex path="/landing-full" />
      <MktNav />

      <main className="k-hero">
        <div className="k-hero-l">
          <Badge tone="accent" dot>
            Photos in. XactContents-ready inventory out.
          </Badge>
          {/* No manual breaks. The old copy was three hand-set lines; this one
              is long enough that a fixed break left "Estimate" alone on a line
              at desktop. `text-wrap: balance` evens the lines at every width
              instead, and still lands on three lines, which is what sets this
              column's height against the hero card. */}
          <h1 className="k-h1" style={{ textWrap: 'balance' }}>
            The Content List that writes itself
          </h1>
          {/* Short at every width. The long version listed items identified,
              brands matched, depreciation suggested and three comps per line —
              every one of which the stats ribbon and gallery restate directly
              below, so the hero was spending six lines to say what the page
              says twice more anyway. */}
          <p className="k-lede">
            Bulk-ingest hundreds of photos and Kevin returns a complete, Xactimate-ready personal
            property inventory.
          </p>
          <div className="k-hero-actions">
            <Link className="k-btn k-btn--lg" to="/sign-up">
              Start for Free
            </Link>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/sample">
              See a finished claim
            </Link>
          </div>
          <div className="k-trust">
            <span>250 free items, no deadline</span>
            <span className="k-trust-dot">·</span>
            <span>$249/mo · 2,000 items included</span>
            <span className="k-trust-dot">·</span>
            <span>No per-claim or per-seat fees</span>
          </div>
        </div>

        <div className="k-hero-r">
          <div className="k-card">
            <div className="k-card-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--k-font-mono)',
                    fontSize: 11,
                    color: 'var(--k-fg-4)',
                  }}
                >
                  CLM-2026-04412
                </span>
                <Badge tone="ok" dot>
                  Processing complete
                </Badge>
              </div>
              {/* Deliberately NOT a photo/item count. This card sits directly
                  above "See a finished claim", so any aggregate here is one a
                  visitor compares against the claim the CTA opens — and the
                  two are set by different authorities (CLAUDE.md's canonical
                  demo here, the live API there), so they drift apart with
                  nothing failing. Non-numeric copy cannot. */}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--k-fg-4)',
                  fontFamily: 'var(--k-font-mono)',
                }}
              >
                Xactimate ready
              </span>
            </div>
            <div className="k-card-rows">
              {HERO_ROWS.map((r, i) => (
                <div key={i} className="k-card-row">
                  {/* Matches the design's <Thumb>: a real <img> so the browser
                      can defer it, cover-fitted in a 4px-radius 28px box. */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      overflow: 'hidden',
                      flex: '0 0 auto',
                      position: 'relative',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                    }}
                  >
                    <img
                      src={`/marketing/items/w192/${r.photo}`}
                      alt={r.desc}
                      loading="lazy"
                      decoding="async"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Classed so the phone crop can let it wrap; the inline
                        nowrap below is right on the wide desktop card and
                        wrong in a 333px row, where it left 87px for the name
                        and cut it mid-word. */}
                    <div
                      className="k-card-row-title"
                      style={{
                        fontSize: 12.5,
                        color: 'var(--k-fg)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.desc}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 1 }}>
                      {r.meta}
                    </div>
                  </div>
                  <Badge tone={r.tone}>{r.note}</Badge>
                  <div
                    style={{
                      fontFamily: 'var(--k-font-mono)',
                      fontSize: 12.5,
                      fontFeatureSettings: '"tnum"',
                      color: 'var(--k-fg)',
                      minWidth: 70,
                      textAlign: 'right',
                    }}
                  >
                    {r.price}
                  </div>
                </div>
              ))}
              {/* Count and RCV total removed for the same reason as the bar
                  above — see that comment. The row stays so the card still
                  reads as truncated rather than as a five-item inventory. */}
              <div className="k-card-row k-card-row--more">
                <span>+ more items</span>
              </div>
            </div>
          </div>

          <div className="k-anno k-anno--1">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'var(--k-accent)',
                fontWeight: 600,
              }}
            >
              <Icon d={I.spark} size={11} /> Two frames, one item
            </div>
            <div style={{ fontSize: 12, color: 'var(--k-fg-2)', marginTop: 2 }}>
              Wide shot + label close-up merged at staging — priced once, never twice
            </div>
          </div>
          <div className="k-anno k-anno--2">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'oklch(0.45 0.13 70)',
                fontWeight: 600,
              }}
            >
              <Icon d={I.warn} size={11} /> Priced from proof, not guesses
            </div>
            <div style={{ fontSize: 12, color: 'var(--k-fg-2)', marginTop: 2 }}>
              Every cell cites live retailer comps with dated links — and when Kevin can't
              corroborate, the cell stays blank for you
            </div>
          </div>
        </div>
      </main>

      {/* — Stats / outcomes ribbon — */}
      <section className="k-stats-ribbon">
        <div className="k-stats-ribbon-inner">
          {[
            { n: '310+', l: 'Claims processed', s: 'Since 2025 · across 12 carriers' },
            {
              n: '~29 min',
              l: '256 photos, machine-unattended',
              s: 'Same claim by hand at 4 min/row: 13.3 hours',
            },
            {
              n: '11×',
              l: 'Adjuster-hours saved',
              s: 'You touch exceptions only, not a day of searching, typing and adjusting',
            },
            {
              n: '100%',
              l: 'Live proof links',
              s: 'Every price cites a direct merchant URL · zero invented prices',
            },
          ].map((stat, i) => (
            <div key={i} className="k-stat-cell">
              <div className="k-stat-cell-n">{stat.n}</div>
              <div className="k-stat-cell-l">{stat.l}</div>
              <div className="k-stat-cell-s">{stat.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* — Audience strip — */}
      <section className="k-audience">
        <div className="k-audience-inner">
          <div className="k-audience-l">Built for</div>
          <div className="k-audience-r">
            <span>Independent adjusters</span>
            <span className="k-trust-dot">·</span>
            <span>Public adjusters</span>
            <span className="k-trust-dot">·</span>
            <span>Small adjusting agencies</span>
            <span className="k-trust-dot">·</span>
            <span>Estate liquidators</span>
          </div>
        </div>
      </section>

      {/* — Visual proof — real product screenshots — */}
      <section className="k-proof">
        <div className="k-proof-hd">
          <div className="k-pg-eyebrow-top">What you actually get</div>
          <h2 className="k-proof-h2">
            Three screens between a photo dump and a completed estimate.
          </h2>
          <p className="k-proof-sub">
            No new workflow to learn. The photos you already take, the file your carrier already
            accepts.
          </p>
        </div>

        <div className="k-proof-row">
          <div className="k-proof-copy">
            <div className="k-proof-eyebrow">Automated photo triage</div>
            <h3 className="k-proof-h">300 photos in. Nothing sorted by hand.</h3>
            <p className="k-proof-body">
              Kevin clusters the dump into photo sets before you review a single frame — the wide
              shot and the model-plate close-up of the same item land together, duplicates collapse,
              context shots are set aside. You approve a proposal instead of sorting a folder.
            </p>
            <ul className="k-proof-list">
              {[
                'One item per photo set — a photo is never counted twice',
                'Duplicates caught by hash across the whole claim, not just the batch',
                'Merge, split or annotate any set before it is processed',
              ].map((t) => (
                <li key={t}>
                  <Icon d={I.check} size={13} stroke={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <MktShot
            src="/marketing/staging-sets-2x.webp"
            mobileSrc="/marketing/staging-sets-mobile.webp"
            mobileRatio="388 / 266"
            ratio="3156 / 1720"
            alt="Kevin photo staging — proposed photo sets awaiting review, one merged into a single item with an adjuster note"
            label="kevin.co/claims/CLM-2026-04412/staging"
            slot="Photo staging — proposed sets"
            caption="Proposed photo sets, before processing — merge, split, or set aside."
          />
        </div>

        <div className="k-proof-row k-proof-row--flip">
          <div className="k-proof-copy">
            <div className="k-proof-eyebrow">One reviewable grid</div>
            <h3 className="k-proof-h">Every line defends itself.</h3>
            <p className="k-proof-body">
              Each priced line cites live retail comps with dated merchant links — the median sets
              RCV. Depreciation comes off the schedule you selected. And when Kevin cannot
              corroborate a price, it leaves the cell blank for you rather than inventing one.
            </p>
            <ul className="k-proof-list">
              {[
                'Editable everywhere — qty, description, make, model, class, age, depreciation',
                'Special-limits classes flagged, never blocked',
                'Source URLs travel with the export',
              ].map((t) => (
                <li key={t}>
                  <Icon d={I.check} size={13} stroke={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <MktShot
            src="/marketing/worksheet-review-2x.webp"
            mobileSrc="/marketing/worksheet-review-mobile.webp"
            mobileRatio="770 / 418"
            ratio="3186 / 1766"
            alt="Kevin review worksheet — priced line items with make, model, content class, depreciation and ACV columns"
            label="kevin.co/claims/CLM-2026-04412/worksheet"
            slot="Review worksheet — 57 priced lines"
            caption="The RCV popover open on a line — live comps with dated proof links."
          />
        </div>

        <div className="k-proof-row">
          <div className="k-proof-copy">
            <div className="k-proof-eyebrow">Carrier-ready export</div>
            <h3 className="k-proof-h">One click to XactContents.</h3>
            <p className="k-proof-body">
              Kevin writes the pre-formatted{' '}
              <strong>Xactimate (Excel) · .xlsx · XactContents template</strong> — static values in
              every derived cell, because the importer breaks on formulas. Download it, share a
              link, or email it. Kevin shows you what deserves a second look and lets you decide; it
              never holds your export hostage.
            </p>
            <ul className="k-proof-list">
              {[
                'Xactimate-parity columns — per-line sales tax, age, % depreciation and ACV',
                'A client-facing PDF inventory generated alongside it',
                'Nothing to reformat, retype, or paste',
              ].map((t) => (
                <li key={t}>
                  <Icon d={I.check} size={13} stroke={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <MktShot
            src="/marketing/export-modal-2x.webp"
            mobileSrc="/marketing/export-modal-mobile.webp"
            mobileRatio="508 / 216"
            ratio="3156 / 1916"
            alt="Kevin export modal — Xactimate Excel XactContents template, client PDF and full bundle, with download and share actions"
            label="Export claim · CLM-2026-04412"
            slot="Carrier export modal"
            caption="The export modal — formats, what needs attention, and live download buttons."
          />
        </div>
      </section>

      {/* — Mid-funnel CTA —
          The next action after this point used to be 6,000px away in the
          footer. A visitor who has just seen the three product screenshots is
          the most convinced they will be all page; this catches them there. */}
      <section className="k-midcta">
        <div className="k-midcta-inner">
          <div className="k-midcta-l">
            <div className="k-midcta-eyebrow">Seen enough?</div>
            <h2 className="k-midcta-h">Run it on a real loss.</h2>
            <p className="k-midcta-p">
              Your first 250 line items are free, with no deadline and no card charged until you
              start Pro. Or open a finished claim and look around first.
            </p>
          </div>
          <div className="k-midcta-r">
            {/* Echoes the hero's pair deliberately: same two actions, same
                two labels. "View sample claim" was a third phrasing for a
                thing the site already calls "See a finished claim". */}
            <Link className="k-cta-primary" to="/sign-up">
              Start for Free
            </Link>
            <Link className="k-cta-secondary" to="/sample">
              See a finished claim
            </Link>
          </div>
        </div>
      </section>

      {/* — Product gallery: "Inside the grid" — */}
      <section className="k-pg">
        <div className="k-pg-hd">
          <div className="k-pg-eyebrow-top">Inside the grid</div>
          {/* Count-free on purpose: mobile shows two of these four cards, and a
              heading that says "Four" while showing two is a mismatch the
              reader notices. */}
          <h2 className="k-pg-h2">What you’ll actually use, every claim.</h2>
          <p className="k-pg-sub" style={{ textAlign: 'center' }}>
            Each one earns its keep on the first claim.
          </p>
        </div>

        <div className="k-pg-grid">
          {/* Card 1 — RCV with three retailer comps */}
          <article className="k-pg-card">
            <div className="k-pg-eyebrow">RCV with proof</div>
            <h3 className="k-pg-h">Three retailers behind every number.</h3>
            <div className="k-pg-viz k-pg-viz--rcv">
              <div className="k-pg-mockrow">
                <ItemThumb file="20260805_143711.jpg" size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="k-pg-mockrow-t">Black Rubber-Soled Boot, Madden Brand</div>
                  <div className="k-pg-mockrow-s">Madden · Clothing — Adult</div>
                </div>
                <div className="k-pg-rcv-focus">
                  <span className="k-mono">$141.16</span>
                  <Icon d={I.chevdown} size={10} />
                </div>
              </div>
              <div className="k-pg-pop">
                <div className="k-pg-pop-hd">Live comps · median sets RCV</div>
                {[
                  ['Target', '$152.19', false],
                  ['Madden', '$141.16', true],
                  ['Google Shopping', '$124.75', false],
                ].map(([source, price, isMedian], i) => (
                  <div key={i} className="k-pg-pop-row">
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 12.5,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {source}
                    </span>
                    <span className={`k-mini-dot k-mini-dot--${isMedian ? 'ok' : 'quiet'}`} />
                    <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                      {isMedian ? 'Direct listing' : 'Search result'}
                    </span>
                    <span className="k-mono" style={{ fontWeight: 600 }}>
                      {price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="k-pg-body">
              Click any RCV cell to see the live retailer comps behind it — the median sets the
              price, the alternates stay one click away. Source URLs travel with the export.
            </p>
          </article>

          {/* Card 2 — Special-limits flagging */}
          <article className="k-pg-card">
            <div className="k-pg-eyebrow">Carrier-aware flagging</div>
            <h3 className="k-pg-h">Jewelry. Firearms. Fine arts. Furs.</h3>
            <div className="k-pg-viz k-pg-viz--sl">
              <div className="k-pg-mockrow k-pg-mockrow--flag">
                <PlainThumb size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="k-pg-mockrow-t">Diamond solitaire engagement ring, 1.5ct</div>
                  <div className="k-pg-mockrow-s">Tiffany &amp; Co. · Jewelry</div>
                </div>
                <Badge tone="warn">Special limits</Badge>
                <span className="k-mono" style={{ fontWeight: 600, fontSize: 13 }}>
                  $18,500.00
                </span>
              </div>
              <div className="k-pg-mockrow k-pg-mockrow--flag">
                <PlainThumb size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="k-pg-mockrow-t">Semi-auto pistol, 9mm</div>
                  <div className="k-pg-mockrow-s">Sig Sauer · Firearms</div>
                </div>
                <Badge tone="warn">Special limits</Badge>
                <span className="k-mono" style={{ fontWeight: 600, fontSize: 13 }}>
                  $799.00
                </span>
              </div>
              <div className="k-pg-cap">
                <Icon d={I.warn} size={11} />
                <span>
                  <strong>Most policies cap Jewelry at $2,500/item.</strong> Above cap requires
                  appraisal on file or adjuster override.
                </span>
              </div>
            </div>
            <p className="k-pg-body">
              Items in carrier-capped classes are flagged inline — never blocked. Override anything
              with a click; the cap policy and proof requirement are one hover away.
            </p>
          </article>

          {/* Card 3 — Barcode auto-match */}
          <article className="k-pg-card">
            <div className="k-pg-eyebrow">Reads model stickers</div>
            <h3 className="k-pg-h">Make. Model. Category. Filled.</h3>
            <div className="k-pg-viz k-pg-viz--match">
              <div className="k-pg-match">
                <div className="k-pg-photo">
                  <ItemThumb file="20260805_144542.jpg" size={88} />
                  <span className="k-pg-bcode">BG7811-BLK</span>
                </div>
                <div className="k-pg-arrow">
                  <Icon
                    d={
                      <>
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </>
                    }
                    size={18}
                    stroke={2}
                  />
                </div>
                <div className="k-pg-fields">
                  {[
                    ['Make', 'Guess'],
                    ['Model', 'BG7811-BLK'],
                    ['Category', 'Clothing — Adult'],
                    ['RCV', '$77.25'],
                  ].map(([k, v]) => (
                    <div key={k} className="k-pg-field">
                      <Icon d={I.check} size={10} stroke={2.5} />
                      <span className="k-pg-field-k">{k}</span>
                      <span
                        className={`k-pg-field-v ${k === 'Model' || k === 'RCV' ? 'k-mono' : ''}`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="k-pg-body">
              Kevin reads barcodes and model labels in your photos, matches them to manufacturer
              SKUs, and fills make / model / category / price in one pass.{' '}
              <strong>87% prefill rate</strong> on a typical claim.
            </p>
          </article>

          {/* Card 4 — Live processing */}
          <article className="k-pg-card">
            <div className="k-pg-eyebrow">Watch it work</div>
            <h3 className="k-pg-h">60 photos in, 57 items out — in 2m 41s.</h3>
            <div className="k-pg-viz k-pg-viz--feed">
              <div className="k-pg-feed-hd">
                <span className="k-pulse k-pulse--sm" />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>Kevin is working</span>
                <span
                  className="k-mono"
                  style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--k-fg-4)' }}
                >
                  42 / 60
                </span>
              </div>
              {[
                ['20260805_144542.jpg', 'Guess Branded Leather Belt with Silver Buckle, Black', '$77.25', 'just now'],
                ['20260805_143711.jpg', 'Black Rubber-Soled Boot, Madden Brand', '$141.16', '2s ago'],
                ['20260805_143757.jpg', 'Honeywell FilterPower Replacement Vacuum Filter', '$17.91', '4s ago'],
                ['20260805_144556.jpg', 'Yellow-Handled Household Scissors', '$14.98', '6s ago'],
              ].map(([file, desc, price, age]) => (
                <div key={file} className="k-pg-feed-row">
                  <ItemThumb file={file} size={22} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {desc}
                  </span>
                  <ConfPip />
                  <span className="k-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                    {price}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'var(--k-fg-4)',
                      fontFamily: 'var(--k-font-mono)',
                      width: 56,
                      textAlign: 'right',
                    }}
                  >
                    {age}
                  </span>
                </div>
              ))}
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: 11,
                  color: 'var(--k-fg-4)',
                  fontFamily: 'var(--k-font-mono)',
                  textAlign: 'center',
                }}
              >
                + 38 earlier items …
              </div>
            </div>
            <p className="k-pg-body">
              Items resolve into the grid as Kevin processes — confidence dots show what it’s sure
              of. Open the worksheet the moment the first batch is done; you don’t wait for the last
              photo.
            </p>
          </article>
        </div>
      </section>

      <MktSocialProof />

      {/* — How it works — */}
      <section className="k-howband">
        <div className="k-how">
          <div className="k-step">
            <div className="k-step-n">01 · Ingest</div>
            <div className="k-step-h">One drop, hundreds of photos.</div>
            <p>
              Drag a folder, multi-select, or a whole .zip — no total-size cap, up to 15&nbsp;MB per
              photo. Duplicates are skipped via SHA-256 hashing. Built for mass ingestion — hundreds
              of photos at once, not one at a time.
            </p>
          </div>
          <div className="k-step">
            <div className="k-step-n">02 · Identify</div>
            <div className="k-step-h">Items, brands, models, categories.</div>
            <p>
              Kevin reads model numbers and barcodes, matches them to a manufacturer, picks the
              right property content class, and pulls three live retailer comps per item with
              replacement-cost proof.
            </p>
          </div>
          <div className="k-step">
            <div className="k-step-n">03 · Review</div>
            <div className="k-step-h">One worksheet. Zero locks.</div>
            <p>
              Every cell is editable — qty, description, mfr, model, category, age, depreciation,
              RCV, tax, ACV. Override Kevin freely. Special limits are flagged but never enforced.
            </p>
          </div>
        </div>
      </section>

      {/* — Logos / trust band — */}
      <section className="k-band">
        <div className="k-band-l">Compatible with the tools you already use.</div>
        <div className="k-band-r">
          <span className="k-comp">Xactimate</span>
          <span className="k-comp">Symbility</span>
          <span className="k-comp">Encircle</span>
          <span className="k-comp">CoreLogic</span>
        </div>
      </section>

      <MktROISection />

      {/* — Final CTA band — */}
      <section className="k-cta">
        <div className="k-cta-inner">
          <div className="k-cta-eyebrow">Your first 250 items are free</div>
          <h2 className="k-cta-h">Stop typing. Start adjusting.</h2>
          <p className="k-cta-sub">
            Bring a real loss. Your first 250 line items are free with no clock running — and if you
            want company, we'll walk the worksheet with you on a 30-minute call.
          </p>
          <div className="k-cta-actions">
            <Link className="k-cta-primary" to="/sign-up">
              Start for Free
            </Link>
            <Link className="k-cta-secondary" to="/book-call">
              Book a 30-min call
            </Link>
          </div>
          <div className="k-cta-trust">
            <span>250 free items</span>
            <span className="k-cta-dot">·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      <MktFooter />
      {/* Mobile only (CSS-gated). Appears once the hero CTA scrolls away. */}
      <StickyCta watchSelector=".k-hero-actions" />
    </div>
  )
}
