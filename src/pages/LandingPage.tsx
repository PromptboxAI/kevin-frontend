import { useState } from 'react'
import { Link } from 'react-router-dom'
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
function ItemThumb({ file, size }: { file: string; size: number }) {
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
        src={`/marketing/items/${file}`}
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
function ConfPip({ level = 'high' }: { level?: 'high' | 'med' | 'low' }) {
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
}: {
  src?: string
  alt?: string
  label?: string
  slot?: string
  size?: string
  caption?: string
  ratio?: string
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
      <div className="k-shot-body" style={ratio ? { aspectRatio: ratio } : undefined}>
        {src && !broken ? (
          <img
            src={src}
            alt={alt || slot || label}
            loading="lazy"
            decoding="async"
            onError={() => setFailedSrc(src ?? null)}
          />
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
      <MktNav />

      <main className="k-hero">
        <div className="k-hero-l">
          <Badge tone="accent" dot>
            Photos in. XactContents-ready inventory out.
          </Badge>
          {/* Explicit breaks, not wrapping: three lines set the left column's
              height against the hero card on the right. Each line is short
              enough to still fit at the 34px mobile clamp. */}
          <h1 className="k-h1">
            The contents
            <br />
            estimate writes
            <br />
            itself.
          </h1>
          <p className="k-lede">
            Bulk-ingest hundreds of photos and Kevin returns a complete, Xactimate-ready personal
            property inventory — items identified, brands matched, depreciation suggested, and three
            live pricing comps per line. Hundreds of items reviewed in one grid — not one at a time.
          </p>
          <div className="k-hero-actions">
            <Link className="k-btn k-btn--lg" to="/sign-up">
              Start free — 250 items →
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
            <span>AES-256 at rest</span>
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
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--k-fg-4)',
                  fontFamily: 'var(--k-font-mono)',
                }}
              >
                60 photos → 57 items
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
                      src={`/marketing/items/${r.photo}`}
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
                    <div
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
              <div className="k-card-row k-card-row--more">
                <span>+ 52 more items</span>
                <span style={{ fontFamily: 'var(--k-font-mono)' }}>$2,786.20 RCV</span>
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
            ratio="3156 / 1916"
            alt="Kevin export modal — Xactimate Excel XactContents template, client PDF and full bundle, with download and share actions"
            label="Export claim · CLM-2026-04412"
            slot="Carrier export modal"
            caption="The export modal — formats, what needs attention, and live download buttons."
          />
        </div>
      </section>

      {/* — Product gallery: "Inside the grid" — */}
      <section className="k-pg">
        <div className="k-pg-hd">
          <div className="k-pg-eyebrow-top">Inside the grid</div>
          <h2 className="k-pg-h2">Four things you’ll actually use, every claim.</h2>
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
              Start free — 250 items →
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
    </div>
  )
}
