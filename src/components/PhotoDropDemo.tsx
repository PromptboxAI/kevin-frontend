import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  createDrop,
  demoConfigured,
  DropRefused,
  isTerminal,
  pollDrop,
  previewDepreciation,
  probeFile,
  type Drop,
  type DropIdentified,
  type DropRefusal,
  type DropResult,
  type NotPricedReason,
  type PreviewMoney,
} from '../lib/demo-drop'
import { TURNSTILE_SITE_KEY } from '../lib/env'

/**
 * Drop ONE photo, watch the product identify and price it.
 *
 * This replaced most of the old homepage, which spent six sections ASSERTING
 * that photos go in and a defensible inventory comes out. A visitor can now
 * watch it happen to something in their own house.
 *
 * Runs on the real pipeline: POST /v1/demo/drops then poll, per
 * kevin-backend/FRONTEND.md "Home-page demo". Identification takes 5-10s and a
 * live price 30-70s, because the price is real and carries a merchant deep
 * link. The `identified` block lands first and is shown while the price is
 * still coming, so the wait has something in it.
 *
 * WHAT THE COPY MUST NOT SAY -- both straight from the contract:
 *
 *   1. It does NOT assess damage. It identifies the item and prices its
 *      REPLACEMENT. "Analyzing image damage" promises a thing the product does
 *      not do, and on an insurance product that is the worst kind of wrong.
 *   2. `not_priced` is NOT a failure. Each reason gets its own sentence.
 *      "No single household item in the frame" is the engine working.
 *
 * AND IT NEVER INVENTS A RESULT. If the demo is off, at capacity, or the
 * visitor is rate-limited, it says so and offers the samples. A canned answer
 * dressed as a reading of someone's photo would be a lie on the homepage of a
 * product whose whole promise is a number that holds up.
 *
 * The three sample photos are real captures whose real output is held below,
 * normalised into the SAME shape a live drop returns, so there is one render
 * path and the two cannot drift. Once the backend pins them as presets they
 * will come back from the API instantly (`cached: true`) and these go.
 */

/* -- sample photos: real output, in the live result shape --------------- */

type Sample = { photo: string; label: string; identified: DropIdentified; result: DropResult }

const SAMPLES: Sample[] = [
  {
    photo: '20260805_144542.jpg',
    label: 'A belt',
    identified: {
      description: "Chico's Silver Studded Rhinestone Belt",
      make: "Chico's",
      model: null,
      category: 'Clothing — Adult',
      pcs_code: null,
    },
    result: {
      rcv: 74.94,
      source_link: 'https://romanvalleyranch.com/products/bella-silver-rhinestones-belt',
      source_name: 'Roman Valley Ranch',
      // NOT a count. These fixtures were read off the sample claim, where
      // `alternative_sources` holds 3 comps -- but that is the number of comps
      // KEPT, and the backend reports the engine actually searched 28 for a
      // price. Asserting "based on 3 live listings" therefore understates the
      // evidence by roughly 9x, on the one number whose whole job is to make
      // the price look defensible. Until a preset comes back from the API with
      // the engine's own figure, the card says "from live retail listings"
      // and counts nothing.
      comp_count: null,
      basis: 'retail',
    },
  },
  {
    photo: '20260805_143757.jpg',
    label: 'A vacuum filter',
    identified: {
      description: 'Honeywell FilterPower Replacement Vacuum Filter for Bissell 7.9',
      make: 'Honeywell',
      model: 'FilterPower',
      category: 'Small Appliances',
      pcs_code: null,
    },
    result: {
      rcv: 14.47,
      source_link: 'https://www.myvacuumplace.com/hepa-filter-bissell-envirocare-style-7-9.html',
      source_name: 'MyVacuumPlace',
      // NOT a count. These fixtures were read off the sample claim, where
      // `alternative_sources` holds 3 comps -- but that is the number of comps
      // KEPT, and the backend reports the engine actually searched 28 for a
      // price. Asserting "based on 3 live listings" therefore understates the
      // evidence by roughly 9x, on the one number whose whole job is to make
      // the price look defensible. Until a preset comes back from the API with
      // the engine's own figure, the card says "from live retail listings"
      // and counts nothing.
      comp_count: null,
      basis: 'like_kind_new',
    },
  },
  {
    photo: '20260805_144556.jpg',
    label: 'Scissors',
    identified: {
      description: 'Fiskars Yellow-Handled Household Scissors',
      make: 'Fiskars',
      model: null,
      category: 'Tools & Garage',
      pcs_code: null,
    },
    result: {
      rcv: 13.0,
      source_link:
        'https://www.walmart.com/ip/LIVINGO-Office-Scissors-Titanium-Non-Stick-Sharp-Steel-for-Adult-8-2-Pack-Yellow/2554926370',
      source_name: 'Walmart',
      // NOT a count. These fixtures were read off the sample claim, where
      // `alternative_sources` holds 3 comps -- but that is the number of comps
      // KEPT, and the backend reports the engine actually searched 28 for a
      // price. Asserting "based on 3 live listings" therefore understates the
      // evidence by roughly 9x, on the one number whose whole job is to make
      // the price look defensible. Until a preset comes back from the API with
      // the engine's own figure, the card says "from live retail listings"
      // and counts nothing.
      comp_count: null,
      basis: 'retail',
    },
  },
]

/* -- copy tables -------------------------------------------------------- */

/** Every one of these is a normal outcome, not an error page. */
const NOT_PRICED: Record<NotPricedReason, { head: string; body: string }> = {
  not_an_item: {
    head: 'No single item in that frame',
    body: 'Kevin prices one household item at a time. A whole room, a person, or a close-up of a surface has nothing to look up, so no search was spent. Try a photo of one object.',
  },
  needs_adjuster: {
    head: 'This one goes to an adjuster',
    body: 'Jewellery, fine art, firearms and furs are valued by a person rather than a search — exactly as in the product, where they arrive unpriced for you to fill in.',
  },
  no_price: {
    head: 'Not enough live listings',
    body: 'Kevin found the item but too few current listings to stand behind a number. In the worksheet that arrives as a blank, editable price rather than a guess.',
  },
  budget_paused: {
    head: 'Live pricing is paused for today',
    body: "Kevin identified it, but today's share of live pricing is spent. Every price is a real lookup, so the demo has a daily ceiling. The samples below are already priced.",
  },
  unavailable: {
    head: 'Something went wrong',
    body: 'That one did not make it through. Try another photo.',
  },
}

const REFUSAL: Record<DropRefusal['kind'], { head: string; body: string }> = {
  not_configured: {
    head: 'Live drops are not switched on yet',
    body: 'Rather than show a made-up answer for your own photo, here is nothing. The sample photos below are real output from the same pipeline.',
  },
  turnstile: {
    head: 'The bot check would not clear',
    body: 'Kevin took a fresh check and tried your photo again, and the server turned it down both times. That is usually a configuration problem on our side rather than anything you did. The samples below are unaffected.',
  },
  too_large: {
    head: 'That photo is too large',
    body: 'The limit is 15 MB. Most phone photos are well under it.',
  },
  not_a_photo: { head: 'That is not a photo', body: 'Try a JPEG, PNG or HEIC of one item.' },
  empty_local: {
    head: 'That file has no data in it',
    body: 'Your browser reports the file as zero bytes, so nothing was sent — this is not a rejection by Kevin. It usually means the photo lives in iCloud or another cloud library and only a placeholder is on this device. Open it once in your photo app so it downloads in full, then drop it again. A screenshot of it will also work.',
  },
  unreadable: {
    head: 'That photo could not be read',
    body: 'The file was picked but its contents would not load — the photo may be cloud-only, or it may have moved since you chose it. Opening it in your photo app first, or dropping a screenshot, both get around it.',
  },
  dragged_from_web: {
    head: 'That came from a web page, not a file',
    body: 'Dragging a picture straight out of a web page or an image-search tab hands Kevin a link rather than the picture — the browser never makes a file, so there are no bytes to read. Save the image to your device first (right-click, Save image as…), then drop the saved file. Nothing was wrong with the photo itself.',
  },
  nothing_dropped: {
    head: 'Nothing came through in that drop',
    body: 'The drop carried no file Kevin could read. Tapping the box to choose a photo from your device is the reliable route.',
  },
  rejected_empty: {
    head: 'The upload arrived empty',
    body: 'The photo read fine here but reached Kevin with no data in it. That is on us rather than on your file. Dropping it again is worth one try; if it repeats, the samples below are unaffected.',
  },
  rate_limited: {
    head: 'That is the limit for now',
    body: 'Three photos an hour, ten a day — each live price is a lookup we pay for. The samples below are free and already priced.',
  },
  capacity: {
    head: 'The demo is busy',
    body: "Too many photos at once, or today's ceiling is reached. Try a sample below — those are instant — or come back a little later.",
  },
  network: {
    head: 'Could not reach Kevin',
    body: 'The request did not get through. Check your connection and try again.',
  },
  timeout: {
    head: 'That one is taking too long',
    body: 'A live price is usually under a minute and this went past three. It may still finish server-side, but nothing is kept, so the quickest thing is another photo. The samples below are instant.',
  },
  unexpected: {
    head: 'Something broke on our side',
    body: 'Not your photo and not your connection — Kevin hit an error handling the response. The details are in the browser console if you want to send them over. The samples below still work.',
  },
}

/** Rule 10/11: the basis is stated, never inferred, so a like-kind or resale
 *  price can never read as a new-replacement one. */
const BASIS_COPY: Record<string, string> = {
  retail: 'Retail comp — still sold new',
  like_kind_new: 'Like-kind substitute — priced as the nearest new equivalent',
  market_comp: 'Resale market — a used asking price, not a new-replacement price',
  comparable_sale: 'Comparable sale — resale market',
  manual: 'Entered by hand',
}

/* -- client-side pre-checks, matching the server ------------------------ */

const MAX_BYTES = 15 * 1024 * 1024

/**
 * Pre-checks that mirror the server WITHOUT being stricter than it.
 *
 * The first version rejected anything whose `file.type` did not start with
 * "image/" — and a perfectly good .jpg often arrives with an EMPTY type: the
 * browser could not determine it, which happens with some drag sources and
 * with files the OS has not fully materialised. A real JPEG was told "that is
 * not a photo" and then worked on a second attempt.
 *
 * So an empty type is no longer a rejection. The server sniffs the bytes and
 * answers 415 if it really is not an image; guessing from a hint the browser
 * itself declined to supply is worse than asking.
 *
 * Zero bytes gets its own answer too. On Windows a OneDrive placeholder reads
 * as 0 until it hydrates, which is why a retry succeeds — that is a "try
 * again", not "this is not a photo".
 */
async function clientReject(file: File): Promise<DropRefusal | null> {
  if (file.type && !file.type.startsWith('image/')) return { kind: 'not_a_photo' }
  if (file.size > MAX_BYTES) return { kind: 'too_large' }

  // Read a byte rather than trusting `size`. The name and type ride along on
  // the refusal so the screen can say WHICH file failed and how -- the old
  // single "came through empty" message covered a zero-byte read and a server
  // 400 with identical words, so there was no way to tell them apart from the
  // page, which is exactly the position we were in.
  const state = await probeFile(file)
  if (state === 'empty') return { kind: 'empty_local', name: file.name, type: file.type || '(none)' }
  if (state === 'unreadable')
    return { kind: 'unreadable', name: file.name, type: file.type || '(none)' }
  return null
}

/* -- formatting --------------------------------------------------------- */

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

/** Not rounded to whole percent: "29%" beside "-$4.49" on a $15.72 total is
 *  two numbers that cannot both be right, which is the one error this product
 *  cannot afford. */
const pct = (fraction: number) => {
  const v = fraction * 100
  return (Number.isInteger(v) ? v : Number(v.toFixed(2))).toString()
}

/* -- Turnstile ---------------------------------------------------------- */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

/**
 * The bot check. Rendered only when a site key exists, because the widget
 * cannot draw without one and every drop needs its token.
 */
function Turnstile({ onToken }: { onToken: (t: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const mount = () => {
      if (cancelled || !box.current || !window.turnstile || widget.current) return
      widget.current = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
        theme: 'light',
      })
    }

    if (window.turnstile) {
      mount()
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
      if (existing) {
        existing.addEventListener('load', mount)
      } else {
        const s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        s.async = true
        s.defer = true
        s.dataset.turnstile = 'true'
        s.addEventListener('load', mount)
        document.head.appendChild(s)
      }
    }
    return () => {
      cancelled = true
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = null
    }
  }, [onToken])

  return <div className="k-demo-turnstile" ref={box} />
}

/**
 * Retire the single-use token WITHOUT letting Cloudflare's bookkeeping abort a
 * drop that already succeeded.
 *
 * `turnstile.reset()` throws "Nothing to reset found for provided container"
 * when the widget is no longer mounted -- and it never is by the time we call
 * it, because submitting switches the view away from the idle state that
 * renders it. That exception escaped into the drop's catch and was reported as
 * "Could not reach Kevin" immediately after a 202, which is the opposite of
 * what had happened. Resetting a widget is housekeeping; it is never worth
 * failing a job the server already accepted.
 */
function retireToken() {
  try {
    window.turnstile?.reset()
  } catch {
    /* the widget is gone; nothing to retire */
  }
}

/**
 * The visitor's own photo, with a fallback for formats the BROWSER cannot draw.
 *
 * We invite HEIC on purpose -- it is what an iPhone shoots and the server reads
 * it fine -- but Chrome cannot decode HEIC in an <img> at all. So
 * createObjectURL hands back a perfectly valid URL that the browser then
 * refuses to render: a broken-image icon sitting next to a result that
 * succeeded, which reads as "my upload failed" when nothing failed.
 *
 * There is no client-side rescue available: converting through a canvas needs
 * a decode, and the decode is the part that is missing. So the tile says what
 * is true instead, and the pipeline carries on regardless.
 */
function Shot({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <div className={`${className} k-demo-shot--none`} role="img" aria-label={alt || 'Your photo'}>
        {/* The favicon file itself, so the placeholder cannot drift from the
            mark -- but drawn as a CSS BACKGROUND, not an <img>. favicon.svg
            carries only a viewBox and no width/height, so in an <img> it has
            zero intrinsic size and Chrome renders the broken-image glyph even
            with CSS dimensions set. A background is sized by its own box and
            has no such problem. */}
        <span className="k-demo-shot-k" aria-hidden />
        <span className="k-demo-shot-note">This browser cannot preview that format — the photo itself is fine</span>
      </div>
    )
  }
  return <img className={className} src={src} alt={alt} onError={() => setBroken(true)} />
}

/* -- component ---------------------------------------------------------- */

type View =
  | { k: 'idle' }
  | { k: 'awaiting'; src: string }
  | { k: 'running'; src: string; stage: Drop['stage']; identified: DropIdentified | null }
  | { k: 'done'; src: string; identified: DropIdentified; result: DropResult; own: boolean }
  | { k: 'not_priced'; src: string; reason: NotPricedReason; identified: DropIdentified | null }
  | { k: 'refused'; src: string | null; refusal: DropRefusal }

const AGES = [0, 1, 2, 3, 5, 8, 12]

export default function PhotoDropDemo() {
  /** The payoff CTA has to land somewhere useful for both visitors: /sign-up
   *  is the one page a signed-in adjuster has no use for. */
  const { session } = useAuth()
  const [view, setView] = useState<View>({ k: 'idle' })
  const [over, setOver] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const objectUrls = useRef<string[]>([])
  const stopped = useRef(false)
  /** A photo picked before a token existed, waiting for one. */
  const pending = useRef<{ file: File; src: string } | null>(null)
  /** One silent retry with a fresh token, then we stop and say so. */
  const retried = useRef(false)

  useEffect(
    () => () => {
      stopped.current = true
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u))
    },
    [],
  )

  /* the age slider, straight off the product's own depreciation endpoint */
  const [age, setAge] = useState(3)
  const [money, setMoney] = useState<PreviewMoney | null>(null)
  const rcv = view.k === 'done' ? view.result.rcv : null
  const category = view.k === 'done' ? view.identified.category : null
  useEffect(() => {
    if (rcv == null) {
      setMoney(null)
      return
    }
    let live = true
    previewDepreciation(rcv, age, category)
      .then((m) => {
        if (live) setMoney(m)
      })
      .catch(() => {
        if (live) setMoney(null)
      })
    return () => {
      live = false
    }
  }, [rcv, age, category])

  /** Post the drop and follow it to a terminal stage. */
  const submit = useCallback(async (file: File, src: string, tok: string) => {
    setView({ k: 'running', src, stage: 'queued', identified: null })
    try {
      let drop = await createDrop(file, tok)
      // The token is single-use; make the widget issue a fresh one.
      setToken(null)
      retireToken()

      // THE POLL RIDES OUT BLIPS. A live price is 30-70s, so this loop runs
      // 20-35 times, and this backend throws intermittent 5xx bursts. Letting
      // one failed poll abandon the whole drop threw away a job that had
      // already uploaded and was very likely still running server-side --
      // which is what produced "Could not reach Kevin" AFTER the photo had
      // gone up. Consecutive failures are what matter; a single one is noise.
      const deadline = Date.now() + 180_000
      let misses = 0
      while (!isTerminal(drop.stage)) {
        if (stopped.current) return
        setView({ k: 'running', src, stage: drop.stage, identified: drop.identified })
        await new Promise((r) => setTimeout(r, 2000))
        if (stopped.current) return

        if (Date.now() > deadline) throw new DropRefused({ kind: 'timeout' })

        try {
          drop = await pollDrop(drop.drop_id)
          misses = 0
        } catch (e) {
          // A 404 means the drop is genuinely gone; retrying cannot help.
          if (e instanceof DropRefused && e.refusal.kind === 'capacity') throw e
          misses += 1
          if (misses >= 6) throw e
          // Keep the last good stage on screen and try again.
        }
      }
      if (stopped.current) return

      if (drop.stage === 'done' && drop.result && drop.identified) {
        setAge(3)
        setView({ k: 'done', src, identified: drop.identified, result: drop.result, own: true })
      } else {
        setView({
          k: 'not_priced',
          src,
          reason: drop.reason ?? 'unavailable',
          identified: drop.identified,
        })
      }
    } catch (e) {
      // An unplanned exception is OURS, not the visitor's connection. Saying
      // "check your connection" for a TypeError sends them to reboot a router
      // over our bug, and hides the bug from us.
      const refusal: DropRefusal =
        e instanceof DropRefused
          ? e.refusal
          : { kind: 'unexpected', detail: e instanceof Error ? e.message : String(e) }
      if (refusal.kind === 'unexpected') console.error('[demo] drop failed:', e)
      // A rejected token is usually an EXPIRED one -- Turnstile tokens last
      // about five minutes and this section sits below a hero people read. So
      // take a fresh one and resubmit the same photo, once, without saying
      // anything: the token lifecycle is not the visitor's problem. Only a
      // second rejection is worth a message.
      if (refusal.kind === 'turnstile' && !retried.current) {
        retried.current = true
        setToken(null)
        retireToken()
        pending.current = { file, src }
        setView({ k: 'awaiting', src })
        return
      }
      setView({ k: 'refused', src, refusal })
    }
  }, [])

  const runOwn = useCallback(
    async (file: File) => {
      const bad = await clientReject(file)
      if (bad) {
        console.error('[demo] file rejected before upload:', bad.kind, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        })
        setView({ k: 'refused', src: null, refusal: bad })
        return
      }
      if (!demoConfigured()) {
        setView({ k: 'refused', src: null, refusal: { kind: 'not_configured' } })
        return
      }

      const src = URL.createObjectURL(file)
      objectUrls.current.push(src)
      retried.current = false

      // No token yet, or it expired while they were reading: HOLD the photo and
      // go as soon as one lands. Refusing here is what produced "That check did
      // not pass" for people who had in fact passed it.
      if (!token) {
        pending.current = { file, src }
        setView({ k: 'awaiting', src })
        return
      }
      void submit(file, src, token)
    },
    [token, submit],
  )

  // A token arrived and a photo is waiting on it.
  useEffect(() => {
    if (!token || !pending.current) return
    const held = pending.current
    pending.current = null
    // RE-PROBE. The photo was readable when it was picked, but it has been
    // held while the bot check cleared, and on mobile a picker handle can go
    // stale in that window -- which would post an empty body and come back as
    // the server's 400. Better to say the file went away than to blame the
    // upload for it.
    void (async () => {
      const state = await probeFile(held.file)
      if (state !== 'ok') {
        console.error('[demo] held file went stale:', state, {
          name: held.file.name,
          size: held.file.size,
        })
        setView({
          k: 'refused',
          src: held.src,
          refusal: { kind: 'unreadable', name: held.file.name, type: held.file.type || '(none)' },
        })
        return
      }
      void submit(held.file, held.src, token)
    })()
  }, [token, submit])

  const runSample = useCallback((s: Sample) => {
    setAge(3)
    setView({
      k: 'done',
      src: `/marketing/items/w480/${s.photo}`,
      identified: s.identified,
      result: s.result,
      own: false,
    })
  }, [])

  const reset = () => setView({ k: 'idle' })

  return (
    <section className="k-demo">
      <div className="k-demo-hd">
        <div className="k-proof-eyebrow">Try it on one photo</div>
        <h2 className="k-demo-h2">Drop a photo. Watch it get priced.</h2>
        <p className="k-demo-sub">
          One item, about a minute, no account. The same pipeline that runs a claim of hundreds of
          photos — stopped at one item so you can read it.
        </p>
      </div>

      {view.k === 'idle' ? (
        <div className="k-demo-body">
          <div
            className={`k-demo-drop${over ? ' k-demo-drop--over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              const f = e.dataTransfer.files?.[0]
              // A picture dragged out of a web page or an image-search result
              // arrives as a URL, not bytes: dataTransfer.files is empty or
              // holds a zero-byte placeholder, and the image itself is only in
              // text/uri-list. Previously an empty drop did NOTHING AT ALL --
              // no message, no state change -- and a zero-byte one was blamed
              // on cloud storage, which is wrong for a file that was never on
              // the device.
              const types = Array.from(e.dataTransfer.types || [])
              const looksLikeALink =
                types.includes('text/uri-list') || types.includes('text/html')
              if (!f || f.size === 0) {
                setView({
                  k: 'refused',
                  src: null,
                  refusal: looksLikeALink ? { kind: 'dragged_from_web' } : { kind: 'nothing_dropped' },
                })
                return
              }
              void runOwn(f)
            }}
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
            <div className="k-demo-drop-s">
              or tap to choose · JPEG, PNG or HEIC · up to 15 MB · nothing is saved
            </div>
          </div>

          {demoConfigured() ? <Turnstile onToken={setToken} /> : null}

          <div className="k-demo-or">or try one of ours</div>
          <div className="k-demo-samples">
            {SAMPLES.map((s) => (
              <button
                key={s.photo}
                type="button"
                className="k-demo-sample"
                onClick={() => runSample(s)}
              >
                <img src={`/marketing/items/w192/${s.photo}`} alt={s.label} loading="lazy" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {view.k === 'awaiting' ? (
        <div className="k-demo-body">
          <div className="k-demo-run">
            <Shot className="k-demo-run-img" src={view.src} alt="Your photo" />
            <div>
              <div className="k-demo-seen">
                <span className="k-demo-seen-l">Holding your photo</span>
                <strong>Waiting on the bot check</strong>
              </div>
              <p className="k-demo-unavail">
                Nothing to do — Kevin sends the photo the moment the check below clears. If it is
                asking you to tick a box, that is the last step.
              </p>
            </div>
          </div>
          {/* The widget stays mounted here, so a fresh token can arrive without
              sending the visitor back to the start. */}
          {demoConfigured() ? <Turnstile onToken={setToken} /> : null}
        </div>
      ) : null}

      {view.k === 'running' ? (
        <div className="k-demo-body">
          <div className="k-demo-run">
            <Shot className="k-demo-run-img" src={view.src} alt="Your photo" />
            <div>
              {view.identified ? (
                <div className="k-demo-seen">
                  <span className="k-demo-seen-l">We see</span>
                  <strong>{view.identified.description}</strong>
                </div>
              ) : null}
              <ol className="k-demo-stages">
                <li
                  className={`k-demo-stage${
                    view.stage === 'pricing' ? ' k-demo-stage--done' : ' k-demo-stage--now'
                  }`}
                >
                  <span className="k-demo-stage-dot" /> Identifying the item
                </li>
                <li
                  className={`k-demo-stage${view.stage === 'pricing' ? ' k-demo-stage--now' : ''}`}
                >
                  <span className="k-demo-stage-dot" /> Pricing a replacement from live listings
                </li>
              </ol>
              <div className="k-demo-wait">
                {view.stage === 'pricing'
                  ? 'Checking live retail prices — this is the slow part, about a minute.'
                  : 'Identifying the item…'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {view.k === 'not_priced' ? (
        <div className="k-demo-body">
          <div className="k-demo-run">
            <Shot className="k-demo-run-img" src={view.src} alt="Your photo" />
            <div className="k-demo-unavail">
              {view.identified ? (
                <div className="k-demo-seen">
                  <span className="k-demo-seen-l">We see</span>
                  <strong>{view.identified.description}</strong>
                </div>
              ) : null}
              <strong>{NOT_PRICED[view.reason].head}</strong>
              <p>{NOT_PRICED[view.reason].body}</p>
              <button type="button" className="k-btn k-btn--ghost" onClick={reset}>
                Try another photo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {view.k === 'refused' ? (
        <div className="k-demo-body">
          <div className="k-demo-run">
            {view.src ? <Shot className="k-demo-run-img" src={view.src} alt="Your photo" /> : null}
            <div className="k-demo-unavail">
              <strong>{REFUSAL[view.refusal.kind].head}</strong>
              <p>{REFUSAL[view.refusal.kind].body}</p>
              {/* Name the file and its type when the refusal knows them. "That
                  file has no data" with no indication of WHICH file, on a page
                  where someone may have tried three, is not a diagnosis. */}
              {'name' in view.refusal ? (
                <div className="k-demo-filefact">
                  {view.refusal.name} · type {view.refusal.type}
                </div>
              ) : null}
              <button type="button" className="k-btn k-btn--ghost" onClick={reset}>
                Back to the samples
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {view.k === 'done' ? (
        <div className="k-demo-body">
          <div className="k-demo-result">
            <div className="k-demo-result-top">
              <Shot className="k-demo-result-img" src={view.src} alt={view.identified.description} />
              <div className="k-demo-result-id">
                <div className="k-demo-result-desc">{view.identified.description}</div>
                <div className="k-demo-result-meta">
                  {[view.identified.make, view.identified.model, view.identified.category]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {view.result.basis ? (
                  <div className="k-demo-basis">
                    {BASIS_COPY[view.result.basis] ?? view.result.basis}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="k-demo-comps">
              <div className="k-demo-comps-h">Replacement cost, new</div>
              <div className="k-demo-rcv">{usd(view.result.rcv)}</div>
              <div className="k-demo-prov">
                {view.result.comp_count
                  ? `Based on ${view.result.comp_count} live listing${
                      view.result.comp_count === 1 ? '' : 's'
                    }`
                  : 'From live retail listings'}
                {view.result.source_name ? ` · ${view.result.source_name}` : ''}
              </div>
              {view.result.source_link ? (
                <a
                  className="k-demo-comp-link"
                  href={view.result.source_link}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open the listing Kevin priced it from →
                </a>
              ) : null}
            </div>

            {/* WHY THIS LINE EXISTS. The card reads as a finished answer, and the
                engine will sometimes be wrong -- it returned a generic replica
                for a photo whose plate plainly said WORLD WRESTLING
                ENTERTAINMENT. A visitor who knows their own item and sees a
                miss concludes "their AI is wrong" when the truthful reading is
                "this is the row I would correct". The product's promise is that
                Kevin proposes and the adjuster reviews; the demo was not saying
                so. Stated as fact, not apology: rule 12 is exactly this -- type
                into the cell, the basis becomes manual, the row takes your
                proof link. */}
            <div className="k-demo-review">
              <strong>Kevin proposes the line. You review it.</strong> In a claim this is a row you
              edit: correct the description and it re-prices, or type your own figure and attach the
              source you trust. Nothing leaves for a carrier until you say so.
            </div>

            {/* The slider runs on GET /v1/worksheet/preview -- the product's own
                depreciation, so the demo cannot disagree with the worksheet. */}
            <div className="k-demo-dep">
              <label className="k-demo-dep-l" htmlFor="k-demo-age">
                How old is it?
                <span className="k-demo-dep-v">
                  {age === 0 ? 'New' : `${age} year${age === 1 ? '' : 's'}`}
                </span>
              </label>
              <input
                id="k-demo-age"
                className="k-demo-dep-range"
                type="range"
                min={0}
                max={AGES.length - 1}
                step={1}
                value={AGES.indexOf(age) === -1 ? 3 : AGES.indexOf(age)}
                onChange={(e) => setAge(AGES[Number(e.target.value)])}
              />
              <dl className="k-demo-money">
                <div>
                  <dt>Depreciation</dt>
                  <dd>
                    {money
                      ? `${pct(money.depreciation_pct)}% · −${usd(money.depreciation_amount)}`
                      : '—'}
                  </dd>
                </div>
                <div className="k-demo-money--acv">
                  <dt>Actual cash value</dt>
                  <dd>{money ? usd(money.acv_total_incl) : '—'}</dd>
                </div>
              </dl>
              <div className="k-demo-taxnote">
                Figures are pre-tax — sales tax depends on the loss address, which a demo does not
                have. On a claim Kevin adds it per line.
              </div>
            </div>

            <div className="k-demo-foot">
              <span className="k-demo-disclosure">
                {view.own
                  ? 'Identified and priced from your photo just now. The photo is already deleted.'
                  : 'A real capture, with the output the pipeline produced for it.'}
              </span>
              <div className="k-demo-foot-a">
                <button type="button" className="k-btn k-btn--ghost" onClick={reset}>
                  Try another photo
                </button>
                <Link className="k-btn" to={session ? '/claims/new' : '/sign-up'}>
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
