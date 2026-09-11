import { useState } from 'react'
import Seo from '../components/Seo'
import { Link } from 'react-router-dom'
import StickyCta from '../components/StickyCta'
import PhotoDropDemo from '../components/PhotoDropDemo'
import { I, Icon } from '../components/Icon'
import Badge from '../components/Badge'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * The public landing page — ported from design/components/landing.jsx.
 *
 * Copy, class names and section order are lifted verbatim; the porting rule in
 * design/CLAUDE.md says never restyle a k- class or approximate a value.
 *
 * TWO DISCLOSED DEVIATIONS, both because the app has no demo seed:
 *
 *  1. The prototype builds its hero rows from `buildWorksheetRows(57)` /
 *     `REYES_TOTALS`, so the marketing figures can never drift from the
 *     worksheet. Nothing like that exists here, so HERO_ROWS is an explicit
 *     constant — same five descriptions, prices and field photos, read off the
 *     rendered prototype rather than paraphrased. ILLUSTRATIVE MARKETING, not
 *     claim data: if the demo claim changes, update it here by hand.
 *
 *  2. The four "inside the grid" gallery cards keep their headings and copy
 *     verbatim, but their inner mock visualisations are simplified — the
 *     originals compose seed rows, comps arrays and per-row flags that do not
 *     exist here. The claim each card makes is unchanged.
 *
 * Also corrected in passing: the prototype's how-it-works step still said
 * ".zip up to 2 GB", which domain rule 21 scrapped (15 MB per photo, no total
 * cap). Ported with the correct limit.
 */

/* ── Illustrative hero rows (see deviation 1) ─────────────────────────── */

type HeroRow = {
  desc: string
  meta: string
  note: string
  tone: 'accent' | 'ok'
  price: string
  photo: string
}

/** The same five rows and the same five field captures the design hero shows —
 *  descriptions and photo filenames read off the rendered prototype, not
 *  paraphrased. Photos live in public/marketing/items/. */
export
const HERO_ROWS: HeroRow[] = [
  { desc: 'Guess Branded Leather Belt with Silver Buckle, Black', meta: 'Guess · Clothing — Adult', note: '2 photos merged', tone: 'accent', price: '$77.25', photo: '20260805_144542.jpg' },
  { desc: 'Black Rubber-Soled Boot, Madden Brand', meta: 'Madden · Clothing — Adult', note: 'Vision match', tone: 'ok', price: '$141.16', photo: '20260805_143711.jpg' },
  { desc: 'Honeywell FilterPower Replacement Vacuum Filter for Bissell', meta: 'Honeywell · Major Appliances', note: 'Vision match', tone: 'ok', price: '$17.91', photo: '20260805_143757.jpg' },
  { desc: 'Yellow-Handled Household Scissors', meta: 'Tools & Garage', note: 'Vision match', tone: 'ok', price: '$14.98', photo: '20260805_144556.jpg' },
  { desc: 'Decorative Shell Ornament, Brown/White', meta: 'Decor & Accessories', note: 'Live comps ×3', tone: 'ok', price: '$16.28', photo: '20260805_143831.jpg' },
]

/** Carriers whose claims Kevin-built inventories have settled with. Real
 *  insurers only, and never framed as partners or customers (domain rule 3). */
const LANDING_CARRIERS = [
  { name: 'Nationwide', mark: 'N', color: 'oklch(0.32 0.10 252)' },
  { name: 'Allstate', mark: 'A', color: 'oklch(0.42 0.18 252)' },
  { name: 'State Farm', mark: 'SF', color: 'oklch(0.48 0.18 25)' },
  { name: 'Travelers', mark: 'T', color: 'oklch(0.45 0.18 25)' },
  { name: 'Chubb', mark: 'C', color: 'oklch(0.52 0.18 35)' },
  { name: 'SageSure', mark: 'S', color: 'oklch(0.50 0.15 145)' },
  { name: 'Narragansett Bay', mark: 'NB', color: 'oklch(0.50 0.13 235)' },
  { name: 'GEICO', mark: 'G', color: 'oklch(0.50 0.15 165)' },
  { name: 'Liberty Mutual', mark: 'LM', color: 'oklch(0.30 0.13 252)' },
  { name: 'AFICS', mark: 'AF', color: 'oklch(0.40 0.10 240)' },
  { name: 'AIG', mark: 'AIG', color: 'oklch(0.35 0.14 252)' },
  { name: 'Amica', mark: 'A', color: 'oklch(0.45 0.12 215)' },
  { name: 'USAA', mark: 'U', color: 'oklch(0.38 0.11 252)' },
]

/** Matches the design's <Thumb src=…>: cover-fitted, 4px radius, inset hairline. */
export function ItemThumb({ file, size }: { file: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        overflow: 'hidden',
        flex: '0 0 auto',
        position: 'relative',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    >
      <img
        // w192 derivative: this renders at 22-88px, and the source is a
        // 900x1200 camera original. See public/marketing/items/README.
        src={`/marketing/items/w192/${file}`}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

/** The design's <Thumb> with no src: a striped placeholder. Used where the
 *  prototype pulls an Unsplash stock image the app has no reason to ship. */
export
function PlainThumb({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        flex: '0 0 auto',
        backgroundImage:
          'repeating-linear-gradient(135deg, var(--k-bg-2) 0 6px, var(--k-bg-3) 6px 12px)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    />
  )
}

/** ConfPip from design/components/shared.jsx — the AI confidence dot. */
export function ConfPip({ level = 'high' }: { level?: 'high' | 'med' | 'low' }) {
  const c = level === 'high' ? 'var(--k-ok)' : level === 'med' ? 'var(--k-fg-3)' : 'var(--k-fg-4)'
  return (
    <span
      title={`AI confidence: ${level}`}
      style={{ width: 5, height: 5, borderRadius: 99, background: c, display: 'inline-block', flex: '0 0 auto' }}
    />
  )
}

/* ── Shared marketing pieces (pricing will reuse these) ───────────────── */

/**
 * Screenshot frame. A capture that 404s falls back to the labelled slot rather
 * than a broken-image icon — this page takes paid traffic. Reset on src change
 * so fixing the path recovers without a reload.
 */
export function MktShot({
  src,
  alt,
  label,
  slot,
  size,
  caption,
  ratio,
  mobileSrc,
  mobileRatio,
}: {
  src?: string
  alt?: string
  label?: string
  slot?: string
  size?: string
  caption?: string
  ratio?: string
  /**
   * A phone-sized CROP of the same screen, not a scaled copy. The desktop
   * captures are 1740px wide and render at ~325px on a phone -- about 19%,
   * where none of the text can be read and the shot is decoration. A crop of
   * the part that matters displays near 1:1 instead.
   */
  mobileSrc?: string
  /** Aspect of mobileSrc; it is a different shape from the full shot. */
  mobileRatio?: string
}) {
  // Remember WHICH src failed rather than a bare boolean, so fixing the path
  // recovers on the next render with no effect and no reset to sequence.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const broken = failedSrc !== null && failedSrc === src
  return (
    <figure className="k-shot" style={{ margin: 0 }}>
      <div className="k-shot-chrome">
        <span className="k-shot-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="k-shot-label">{label}</span>
      </div>
      {/* The ratio travels as a CUSTOM PROPERTY rather than as `aspectRatio`
          directly: an inline aspect-ratio cannot be overridden by a media
          query, and the mobile crop is a different shape from the full shot.
          kevin.css reads --shot-ar, and --shot-ar-m below 640px. */}
      <div
        className="k-shot-body"
        style={
          ratio
            ? ({ '--shot-ar': ratio, ...(mobileRatio ? { '--shot-ar-m': mobileRatio } : {}) } as React.CSSProperties)
            : undefined
        }
      >
        {src && !broken ? (
          <picture>
            {mobileSrc ? <source media="(max-width: 640px)" srcSet={mobileSrc} /> : null}
            <img
              src={src}
              alt={alt || slot || label}
              loading="lazy"
              decoding="async"
              onError={() => setFailedSrc(src ?? null)}
            />
          </picture>
        ) : (
          <div className="k-shot-ph">
            <span className="k-shot-ph-badge">Screenshot slot</span>
            <div className="k-shot-ph-t">{slot}</div>
            <div className="k-shot-ph-s">{size || '1600 × 1000 · PNG'}</div>
          </div>
        )}
      </div>
      {caption ? <figcaption className="k-shot-cap">{caption}</figcaption> : null}
    </figure>
  )
}

function ROICalculator() {
  const [claims, setClaims] = useState(15)
  const [rate, setRate] = useState(150)
  const HOURS_SAVED = 4.5
  const mHours = claims * HOURS_SAVED
  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
  return (
    <div className="k-roi-card">
      <div className="k-roi-sliders">
        <label className="k-roi-slider">
          <span className="k-roi-slider-l">
            Contents claims per month <strong>{claims}</strong>
          </span>
          <input
            type="range"
            min="1"
            max="100"
            value={claims}
            onChange={(e) => setClaims(+e.target.value)}
          />
        </label>
        <label className="k-roi-slider">
          <span className="k-roi-slider-l">
            Your hourly rate <strong>${rate}</strong>
          </span>
          <input
            type="range"
            min="50"
            max="300"
            step="5"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </label>
      </div>
      <div className="k-roi-stats">
        <div className="k-roi-stat">
          <div className="k-roi-stat-v">
            {mHours.toFixed(1).replace(/\.0$/, '')}
            <span> hrs</span>
          </div>
          <div className="k-roi-stat-l">Reclaimed per month</div>
        </div>
        <div className="k-roi-stat">
          <div className="k-roi-stat-v">
            {Math.round(mHours * 12).toLocaleString()}
            <span> hrs</span>
          </div>
          <div className="k-roi-stat-l">Back per year</div>
        </div>
        <div className="k-roi-stat k-roi-stat--money">
          <div className="k-roi-stat-v">{money(mHours * 12 * rate)}</div>
          <div className="k-roi-stat-l">Your time, back on the books · yearly</div>
        </div>
      </div>
      <div className="k-roi-foot">
        Based on 4.5 hours saved per claim vs. manual lookup. Kevin is $249/mo, including 2,000 line
        items.
      </div>
    </div>
  )
}

/** ROI section — shared with pricing, where a visitor who has just read $249
 *  wants the number against their own caseload, not a restatement of it. */
export function MktROISection() {
  return (
    <section className="k-roi">
      <div className="k-roi-inner">
        <div className="k-roi-copy">
          <div className="k-cta-eyebrow">What's your time worth?</div>
          <h2 className="k-roi-h">The math on your own caseload.</h2>
          <p className="k-roi-sub">
            Adjusters spend 4–6 hours typing and pricing a single contents claim. Kevin does that
            pass on autopilot — set your volume and rate, and see what comes back.
          </p>
        </div>
        <ROICalculator />
      </div>
    </section>
  )
}

/** Testimonials + the scrolling settled-with roster. Shared with pricing so the
 *  quotes and the carrier roster can never drift between the two pages. */
export function MktSocialProof() {
  const testimonials = [
    {
      quote:
        "Friday's claim, Saturday's export. The grid does the typing — I do the review. Six adjusters here, all the same story.",
      name: 'James Cunningham',
      role: 'Principal · Loss Consulting',
      initials: 'JC',
    },
    {
      quote:
        'Liberty Mutual challenged a $4,200 RCV on a dining set. I clicked the cell, sent the three source URLs, settled in 20 minutes. Every number defends itself.',
      name: 'A. Mendez',
      role: 'Independent Adjuster',
      initials: 'AM',
    },
    {
      quote:
        "Kevin flagged $54k of jewelry against Chubb's per-item cap before I sent the export. Saved me a back-and-forth I would have lost.",
      name: 'Tricia O’Connell',
      role: 'Public Adjuster',
      initials: 'TO',
    },
  ]
  return (
    <section className="k-social">
      <div className="k-social-hd">
        <div className="k-pg-eyebrow-top">From the people who use it</div>
        <h2 className="k-pg-h2">The grid does the typing. They do the work.</h2>
      </div>

      <div className="k-testimonials">
        {testimonials.map((t) => (
          <figure key={t.name} className="k-testi">
            <blockquote className="k-testi-quote">“{t.quote}”</blockquote>
            <figcaption className="k-testi-who">
              <span
                className="k-audit-avatar k-audit-avatar--adjuster"
                style={{ width: 36, height: 36, fontSize: 12 }}
              >
                {t.initials}
              </span>
              <div>
                <div className="k-testi-name">{t.name}</div>
                <div className="k-testi-role">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* The roster scrolls; the "Settled with" label stays put so the claim
          never detaches from the logos and reads as a partner/customer wall --
          Kevin has no carrier relationships. Duplicated once for a seamless
          loop; spacing is margin-right on each pill, NOT gap on the track, or
          the two copies leave a half-gap seam. */}
      <div className="k-carrier-band">
        <div className="k-carrier-band-l">Settled with</div>
        <div className="k-carrier-marquee">
          <div className="k-carrier-track">
            {LANDING_CARRIERS.concat(LANDING_CARRIERS).map((c, i) => (
              <div
                key={i}
                className="k-carrier-pill"
                aria-hidden={i >= LANDING_CARRIERS.length ? true : undefined}
              >
                <span className="k-carrier-mark" style={{ background: c.color }}>
                  {c.mark}
                </span>
                <span className="k-carrier-name">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── The page ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="k-landing">
      <Seo path="/" />
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
            <span className="k-trust-dot">·</span>
            {/* Plain language here on purpose. The cipher name meant
                nothing to an adjuster reading a trust line; the exact
                algorithms still appear on /security, where precision is
                the point and rule 7 wants them. */}
            <span>Your photos stay encrypted</span>
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

      {/* — The demo: drop one photo, watch it resolve —

           This is where the long-form argument used to be: a visual-proof
           section, an "Inside the grid" gallery, a how-it-works band, a
           compatible-with row and a mid-funnel CTA. All of it asserted that
           photos go in and a priced inventory comes out. A visitor can now
           just watch that happen instead, which is a shorter and much less
           arguable version of the same claim.

           The long-form page is preserved whole at /landing-full (unlinked,
           noindex), and most of it lives in better shape on /product, which
           is the real home for detailed product information. — */}
      <PhotoDropDemo />


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
            <span>Encrypted at rest</span>
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
