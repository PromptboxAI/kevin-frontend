import { useEffect, useRef, useState } from 'react'
import { I, Icon } from '../components/Icon'

/**
 * Calendly inline scheduler.
 *
 * The booking handle lives in ONE place — `VITE_CALENDLY_URL` — because it
 * appears on both /contact and /book-call and a stale copy on one of them is a
 * visitor who cannot book. Set it in the Vercel project env (and .env.local for
 * dev) as the full event URL, e.g.
 *
 *   VITE_CALENDLY_URL=https://calendly.com/<handle>/30min
 *
 * With the variable UNSET the component renders the email fallback instead of
 * an empty frame. That is deliberate: an embed pointed at a handle that does
 * not exist renders Calendly's own 404 inside the page, which looks like a
 * broken site rather than a missing setting. Same reason the script-load error
 * path falls back — an ad blocker or a corporate proxy that blocks
 * assets.calendly.com must not leave a hole where the booking was.
 */

const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js'
const SCRIPT_ID = 'calendly-widget-js'

export const CALENDLY_URL: string = import.meta.env.VITE_CALENDLY_URL ?? ''

function EmailFallback({ minHeight }: { minHeight: number }) {
  return (
    <div className="k-cal-embed" style={{ minHeight }}>
      <div className="k-cal-embed-ph">
        <Icon d={I.clock} size={22} />
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-fg-2)' }}>
          Pick a time by email
        </div>
        <div style={{ fontSize: 12, color: 'var(--k-fg-4)', lineHeight: 1.5, maxWidth: 320 }}>
          Say when you're free and Kevin sends an invite the same day — usually within a couple of
          hours during business hours, 8a–6p ET.
        </div>
        <a
          className="k-btn"
          style={{ marginTop: 4 }}
          href="mailto:kevin@kevin.co?subject=Booking%20a%2030-minute%20walkthrough"
        >
          Email to book →
        </a>
        <code className="k-cal-embed-code">kevin@kevin.co · 30 min · video</code>
      </div>
    </div>
  )
}

export default function CalendlyInline({ minHeight = 660 }: { minHeight?: number }) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!CALENDLY_URL) return
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      // Already loaded once this session — Calendly only auto-initialises on
      // its own load, so a second mount has to ask for the widget explicitly.
      const w = window as unknown as { Calendly?: { initInlineWidget: (o: object) => void } }
      if (w.Calendly && host.current) {
        w.Calendly.initInlineWidget({ url: CALENDLY_URL, parentElement: host.current })
      }
      return
    }
    const s = document.createElement('script')
    s.id = SCRIPT_ID
    s.src = SCRIPT_SRC
    s.async = true
    s.onerror = () => setFailed(true)
    document.head.appendChild(s)
  }, [])

  if (!CALENDLY_URL || failed) return <EmailFallback minHeight={minHeight} />

  return (
    <div
      ref={host}
      className="calendly-inline-widget k-cal-embed"
      data-url={CALENDLY_URL}
      style={{ minWidth: 0, height: minHeight }}
    />
  )
}
