import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../lib/env'

/**
 * Drop ONE photo, watch it come back identified and priced.
 *
 * This replaced most of the old homepage. The page used to spend six sections
 * arguing that photos go in and a defensible inventory comes out; a visitor
 * can now watch it happen to their own belt in about fifteen seconds, which is
 * a shorter and far less arguable version of the same claim. Neither
 * competitor lets you try anything without booking a call.
 *
 * ONE photo on purpose. The product ingests hundreds, but a demo that asks for
 * a folder is a demo nobody finishes, and each processed item costs real money
 * to produce (~$0.08 in vision and pricing calls).
 *
 * TWO PATHS, and the difference is disclosed on screen:
 *
 *   Sample photos -- real captures from the sample claim, with the REAL output
 *   the pipeline produced for them, held in SAMPLE_RESULTS below. The values
 *   are not illustrative and not rounded: they were read from
 *   GET /v1/claim_items?claim_id=sample on 2026-09-11 and they foot.
 *
 *   Your own photo -- posted to the live endpoint and identified for real.
 *
 * WHY NOT FAKE THE SECOND PATH. A scripted animation that pretends to read the
 * visitor's photo and then shows a canned answer would be a lie on the
 * homepage of a product whose entire promise is a defensible number. If the
 * endpoint is unavailable the drop path says so plainly and offers the samples
 * instead -- see the `unavailable` state. It never invents a result.
 */

/* ── the contract ─────────────────────────────────────────────────────── */

type Comp = { title: string; source: string; price: number; link: string }

type DemoItem = {
  description: string
  make_mfr: string | null
  model_number: string | null
  category: string | null
  rcv: number
  quantity: number
  age_years: number
  depreciation_pct: number
  ext_cost: number
  tax: number
  rcv_total_incl: number
  depreciation_amount: number
  acv_total_incl: number
  valuation_basis: string
  confidence: number
  source_link: string
  alternative_sources: Comp[]
}

/** Proposed: anonymous, one photo, stores nothing. See BACKEND-ASKS.md #38. */
const DEMO_ENDPOINT = `${API_BASE_URL}/v1/demo/identify`

/* ── sample photos: real captures, real output ────────────────────────── */

type Sample = { photo: string; label: string; item: DemoItem }

const SAMPLE_RESULTS: Sample[] = [
  {
    photo: '20260805_144542.jpg',
    label: 'A belt',
    item: {
      description: "Chico's Silver Studded Rhinestone Belt",
      make_mfr: "Chico's",
      model_number: null,
      category: 'Clothing — Adult',
      rcv: 74.94,
      quantity: 1,
      age_years: 3,
      depreciation_pct: 0.6,
      ext_cost: 74.94,
      tax: 6.46,
      rcv_total_incl: 81.4,
      depreciation_amount: 48.84,
      acv_total_incl: 32.56,
      valuation_basis: 'retail',
      confidence: 0.6,
      source_link: 'https://romanvalleyranch.com/products/bella-silver-rhinestones-belt',
      alternative_sources: [
        {
          title: 'Bella Silver Rhinestones Belt',
          source: 'Roman Valley Ranch',
          price: 69.99,
          link: 'https://romanvalleyranch.com/products/bella-silver-rhinestones-belt',
        },
        { title: 'Rhinestone Western Cowboy Belt', source: 'Arimonz', price: 79.9, link: '' },
        { title: 'Studded Rhinestone Belt', source: 'Google Shopping', price: 74.94, link: '' },
      ],
    },
  },
  {
    photo: '20260805_143757.jpg',
    label: 'A vacuum filter',
    item: {
      description: 'Honeywell FilterPower Replacement Vacuum Filter for Bissell 7.9',
      make_mfr: 'Honeywell',
      model_number: 'FilterPower',
      category: 'Small Appliances',
      rcv: 14.47,
      quantity: 1,
      age_years: 2,
      depreciation_pct: 0.2857,
      ext_cost: 14.47,
      tax: 1.25,
      rcv_total_incl: 15.72,
      depreciation_amount: 4.49,
      acv_total_incl: 11.23,
      valuation_basis: 'like_kind_new',
      confidence: 0.427,
      source_link:
        'https://www.myvacuumplace.com/hepa-filter-bissell-envirocare-style-7-9.html',
      alternative_sources: [
        {
          title: 'Bissell Style 7 & 9 Exhaust Filter',
          source: 'MyVacuumPlace',
          price: 10.95,
          link: 'https://www.myvacuumplace.com/hepa-filter-bissell-envirocare-style-7-9.html',
        },
        {
          title: 'Bissell PowerForce & Helix Turbo Filter Set',
          source: 'Vacuum Center',
          price: 17.99,
          link: '',
        },
        { title: 'Style 7/9 Replacement Filter', source: 'Google Shopping', price: 14.47, link: '' },
      ],
    },
  },
  {
    photo: '20260805_144556.jpg',
    label: 'Scissors',
    item: {
      description: 'Fiskars Yellow-Handled Household Scissors',
      make_mfr: 'Fiskars',
      model_number: null,
      category: 'Tools & Garage',
      rcv: 13.0,
      quantity: 1,
      age_years: 5,
      depreciation_pct: 0.5,
      ext_cost: 13.0,
      tax: 1.12,
      rcv_total_incl: 14.12,
      depreciation_amount: 7.06,
      acv_total_incl: 7.06,
      valuation_basis: 'retail',
      confidence: 0.6,
      source_link:
        'https://www.walmart.com/ip/LIVINGO-Office-Scissors-Titanium-Non-Stick-Sharp-Steel-for-Adult-8-2-Pack-Yellow/2554926370',
      alternative_sources: [
        {
          title: 'Livingo Office Scissors',
          source: 'Walmart',
          price: 12.99,
          link: 'https://www.walmart.com/ip/LIVINGO-Office-Scissors-Titanium-Non-Stick-Sharp-Steel-for-Adult-8-2-Pack-Yellow/2554926370',
        },
        { title: 'Yellow Stainless Steel Straight Scissor', source: 'Walmart', price: 11.9, link: '' },
        { title: 'Household Scissors, 8in', source: 'Google Shopping', price: 13.0, link: '' },
      ],
    },
  },
]

/* ── upload limits, matching the server ───────────────────────────────── */

/** Rule 21: the server caps a photo at 15 MB. Checked here so a doomed
 *  upload never leaves the browser. */
const MAX_BYTES = 15 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function rejectReason(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'That is not an image — try a JPEG, PNG or HEIC.'
  if (!OK_TYPES.includes(file.type) && file.type !== '')
    return `Kevin cannot read ${file.type.replace('image/', '.')} — try a JPEG, PNG or HEIC.`
  if (file.size === 0) return 'That file is empty.'
  if (file.size > MAX_BYTES)
    return `That photo is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is 15 MB.`
  return null
}

/* ── formatting ───────────────────────────────────────────────────────── */

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

/**
 * The depreciation rate, NOT rounded to whole percent.
 *
 * `Math.round(0.2857 * 100)` printed "29%" beside "-$4.49" -- and 29% of the
 * $15.72 inclusive total is $4.56, not $4.49. Two numbers on one line that
 * cannot both be right is the precise failure this product exists to avoid, so
 * the rate is shown to the precision the server actually used. Whole rates
 * still print clean: 60, not 60.00.
 */
const pct = (fraction: number) => {
  const v = fraction * 100
  return (Number.isInteger(v) ? v : Number(v.toFixed(2))).toString()
}

/** Rule 10/11: the basis is shown, never inferred, and a resale price is
 *  never allowed to read as a new-replacement one. */
const BASIS_COPY: Record<string, string> = {
  retail: 'Retail comp — still sold new',
  like_kind_new: 'Like-kind substitute — priced as the nearest new equivalent',
  market_comp: 'Resale market — a used asking price, not a new-replacement price',
  comparable_sale: 'Comparable sale — resale market',
  manual: 'Entered by hand',
}

const STAGES = ['Reading the photo', 'Identifying the item', 'Matching make and model', 'Pricing from live comps']

/* ── component ────────────────────────────────────────────────────────── */

type State =
  | { k: 'idle' }
  | { k: 'working'; src: string; stage: number; own: boolean }
  | { k: 'done'; src: string; item: DemoItem; own: boolean }
  | { k: 'rejected'; why: string }
  | { k: 'unavailable'; src: string }

export default function PhotoDropDemo() {
  const [state, setState] = useState<State>({ k: 'idle' })
  const [over, setOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  // Object URLs are revoked on unmount; a leaked blob keeps the whole photo in
  // memory for the life of the tab.
  const objectUrls = useRef<string[]>([])
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u))
    },
    [],
  )

  const runStages = useCallback((src: string, own: boolean, total: number) => {
    setState({ k: 'working', src, stage: 0, own })
    timers.current.forEach(clearTimeout)
    timers.current = STAGES.slice(1).map((_, i) =>
      window.setTimeout(
        () => setState((s) => (s.k === 'working' ? { ...s, stage: i + 1 } : s)),
        (total / STAGES.length) * (i + 1),
      ),
    )
  }, [])

  const runSample = useCallback(
    (s: Sample) => {
      const src = `/marketing/items/w480/${s.photo}`
      runStages(src, false, 2400)
      const t = window.setTimeout(() => setState({ k: 'done', src, item: s.item, own: false }), 2600)
      timers.current.push(t)
    },
    [runStages],
  )

  const runOwn = useCallback(
    async (file: File) => {
      const why = rejectReason(file)
      if (why) return setState({ k: 'rejected', why })

      const src = URL.createObjectURL(file)
      objectUrls.current.push(src)
      // The stages are paced for a typical run, but the RESULT waits on the
      // real response -- the animation never reports a finish that has not
      // happened.
      runStages(src, true, 9000)

      try {
        const body = new FormData()
        body.append('photo', file)
        const res = await fetch(DEMO_ENDPOINT, { method: 'POST', body })
        if (!res.ok) throw new Error(String(res.status))
        const item = (await res.json()) as DemoItem
        if (!item || typeof item.rcv !== 'number') throw new Error('shape')
        timers.current.forEach(clearTimeout)
        setState({ k: 'done', src, item, own: true })
      } catch {
        timers.current.forEach(clearTimeout)
        setState({ k: 'unavailable', src })
      }
    },
    [runStages],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) runOwn(file)
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    setState({ k: 'idle' })
  }

  return (
    <section className="k-demo">
      <div className="k-demo-hd">
        <div className="k-proof-eyebrow">Try it on one photo</div>
        <h2 className="k-demo-h2">Drop a photo. Watch it get priced.</h2>
        <p className="k-demo-sub">
          One photo, about fifteen seconds, no account. The same pipeline that runs a
          three-hundred-photo claim — just stopped at one item so you can read it.
        </p>
      </div>

      {state.k === 'idle' || state.k === 'rejected' ? (
        <div className="k-demo-body">
          <div
            className={`k-demo-drop${over ? ' k-demo-drop--over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click()
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) runOwn(f)
                e.target.value = ''
              }}
            />
            <div className="k-demo-drop-i" aria-hidden>
              +
            </div>
            <div className="k-demo-drop-t">Drop a photo of one item</div>
            <div className="k-demo-drop-s">or tap to choose · JPEG, PNG or HEIC · up to 15 MB</div>
            {state.k === 'rejected' ? <div className="k-demo-err">{state.why}</div> : null}
          </div>

          <div className="k-demo-or">or try one of ours</div>
          <div className="k-demo-samples">
            {SAMPLE_RESULTS.map((s) => (
              <button key={s.photo} type="button" className="k-demo-sample" onClick={() => runSample(s)}>
                <img src={`/marketing/items/w192/${s.photo}`} alt={s.label} loading="lazy" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {state.k === 'working' ? (
        <div className="k-demo-body">
          <div className="k-demo-run">
            <img className="k-demo-run-img" src={state.src} alt="" />
            <ol className="k-demo-stages">
              {STAGES.map((label, i) => (
                <li
                  key={label}
                  className={
                    i < state.stage ? 'k-demo-stage k-demo-stage--done' : i === state.stage ? 'k-demo-stage k-demo-stage--now' : 'k-demo-stage'
                  }
                >
                  <span className="k-demo-stage-dot" />
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}

      {state.k === 'unavailable' ? (
        <div className="k-demo-body">
          <div className="k-demo-run">
            <img className="k-demo-run-img" src={state.src} alt="" />
            <div className="k-demo-unavail">
              <strong>Live identification is not answering right now.</strong>
              <p>
                We would rather show you nothing than a made-up answer for your own photo. Go back
                and run one of the sample photos to see real output, or{' '}
                <Link className="k-link" to="/sample">
                  open a finished claim
                </Link>
                .
              </p>
              <button type="button" className="k-btn k-btn--ghost" onClick={reset}>
                Back to the samples
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state.k === 'done' ? (
        <div className="k-demo-body">
          <div className="k-demo-result">
            <div className="k-demo-result-top">
              <img className="k-demo-result-img" src={state.src} alt={state.item.description} />
              <div className="k-demo-result-id">
                <div className="k-demo-result-desc">{state.item.description}</div>
                <div className="k-demo-result-meta">
                  {[state.item.make_mfr, state.item.model_number, state.item.category]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                <div className="k-demo-basis">
                  {BASIS_COPY[state.item.valuation_basis] ?? state.item.valuation_basis}
                </div>
              </div>
            </div>

            <div className="k-demo-comps">
              <div className="k-demo-comps-h">Priced from live comps</div>
              {state.item.alternative_sources.slice(0, 3).map((c, i) => (
                <div key={i} className="k-demo-comp">
                  <span className="k-demo-comp-src">{c.source}</span>
                  <span className="k-demo-comp-t">{c.title}</span>
                  <span className="k-demo-comp-p">{usd(c.price)}</span>
                </div>
              ))}
              {state.item.source_link ? (
                <a className="k-demo-comp-link" href={state.item.source_link} target="_blank" rel="noreferrer noopener">
                  Open the source listing →
                </a>
              ) : null}
            </div>

            <dl className="k-demo-money">
              <div>
                <dt>Unit cost</dt>
                <dd>{usd(state.item.rcv)}</dd>
              </div>
              <div>
                <dt>Sales tax</dt>
                <dd>{usd(state.item.tax)}</dd>
              </div>
              <div>
                <dt>RCV + tax</dt>
                <dd>{usd(state.item.rcv_total_incl)}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{state.item.age_years}</dd>
              </div>
              <div>
                <dt>Depreciation</dt>
                <dd>
                  {pct(state.item.depreciation_pct)}% · −{usd(state.item.depreciation_amount)}
                </dd>
              </div>
              <div className="k-demo-money--acv">
                <dt>ACV</dt>
                <dd>{usd(state.item.acv_total_incl)}</dd>
              </div>
            </dl>

            <div className="k-demo-foot">
              <span className="k-demo-disclosure">
                {state.own
                  ? 'Identified and priced from your photo just now. Nothing was saved.'
                  : 'A real capture from the sample claim, with the output the pipeline produced for it.'}
              </span>
              <div className="k-demo-foot-a">
                <button type="button" className="k-btn k-btn--ghost" onClick={reset}>
                  Try another photo
                </button>
                <Link className="k-btn" to="/sign-up">
                  Do this to a whole folder
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
