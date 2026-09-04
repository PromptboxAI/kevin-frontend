import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SettingsShell from '../components/SettingsShell'
import { Icon, I } from '../components/Icon'
import { api } from '../lib/api'
import { fmtInt } from '../lib/format'
import type { MeResponse } from '../lib/types'

/**
 * Screen 36 — API & webhooks. Ported from `SettingsApi` in
 * `design/components/settings-pages.jsx`, verbatim.
 *
 * Programmatic access is ENTERPRISE-ONLY. A solo adjuster or estate-sale pro on
 * Pro has nothing to integrate — they work in the app and download the file.
 * Keys and webhooks exist for carriers, TPAs and multi-adjuster desks pushing
 * claims in from their own systems. The demo account is on Pro, so this page
 * renders the locked state; `plan="enterprise"` shows the keys/webhooks panels.
 * Webhooks fire on Kevin's OWN lifecycle events only — Kevin never pushes into
 * a carrier system (rule 4).
 *
 * Deviations, noted: `/contact`, `/pricing` and `/docs` stand in for
 * `15-Request-access.html`, `21-Pricing.html` and `24-Docs.html`.
 *
 * THE PLAN COMES FROM THE ACCOUNT. The design takes it as a prop so the
 * prototype can demo both states, and this page inherited that with a default
 * of 'pro' -- which meant it rendered the locked state for EVERY account,
 * including a real Enterprise customer, who would have been told they were on
 * Pro and never reached their own keys. It reads `quota.plan` now; the prop
 * survives only so a caller can force a state deliberately.
 *
 * THE ENTERPRISE PANELS SHOW NO INVENTED CREDENTIALS. The design seeds them
 * with `sk_live_4G3y...92Pa` and three example-tpa.com endpoints. There is no
 * key or webhook route in the backend, and displaying a fabricated API key to a
 * paying customer is worse than the fake card digits on Billing -- someone may
 * try to use it, or read it as their real key having leaked. The sections keep
 * their structure and say plainly that nothing is provisioned yet. See
 * BACKEND-ASKS ask 36.
 */

const API_EVENTS: [string, string][] = [
  ['claim.created', 'A claim was opened, by anyone on the account'],
  [
    'claim.processing.complete',
    'Identification and pricing finished — the worksheet is ready',
  ],
  ['claim.item.needs_manual', 'Kevin could not price an item confidently and left it blank'],
  ['claim.status.changed', 'Processing → In review → Open → Closed'],
  ['export.generated', 'A spreadsheet, PDF or bundle was produced'],
  ['export.link.viewed', 'Someone opened a share link'],
]

const CURL = `# List claims opened in the last 30 days
curl https://api.kevin.co/v1/claims \\
  -H "Authorization: Bearer sk_live_4G3y..." \\
  -G --data-urlencode "since=2026-07-03" \\
  --data-urlencode "limit=50"`

export default function SettingsApiPage({ plan: forced }: { plan?: string } = {}) {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })
  const quota = me.data?.quota
  const plan = forced ?? quota?.plan ?? 'pro'
  const enterprise = plan === 'enterprise'
  const planLabel =
    plan === 'free' ? 'the free tier' : plan === 'comped' ? 'a complimentary plan' : 'Pro'
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null)

  /**
   * `navigator.clipboard` is not always available -- it needs a secure context
   * and can be refused outright by permissions policy, which is exactly what
   * happened the first time this was tested. The original wrote the text in a
   * bare `.then()` with no rejection handler, so a denied clipboard produced an
   * unhandled rejection and a button that did nothing at all.
   *
   * Falls back to the old selection-based copy, and if BOTH fail it says so
   * rather than pretending. Silence is the one outcome a copy button must not
   * have.
   */
  const copyCurl = async () => {
    const done = () => {
      setCopied('yes')
      window.setTimeout(() => setCopied(null), 1600)
    }
    try {
      await navigator.clipboard.writeText(CURL)
      done()
      return
    } catch {
      // fall through
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = CURL
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      if (!ok) throw new Error('execCommand refused')
      done()
    } catch {
      setCopied('failed')
      window.setTimeout(() => setCopied(null), 2600)
    }
  }
  return (
    <SettingsShell
      activeId="api"
      title="API & webhooks"
      eyebrow={enterprise ? 'Enterprise · keys · webhooks' : 'Enterprise feature'}
      save={false}
    >
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          Programmatic access.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 640 }}>
          For carriers, TPAs and multi-adjuster desks that open claims from their own system and
          collect the finished inventory automatically. If you work claim by claim in Kevin, you
          don&apos;t need any of this.
        </p>
      </div>

      {!enterprise ? (
        <section className="k-set-card k-set-card--accent">
          <div
            className="k-set-card-body"
            style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
          >
            <div
              className="k-empty-art k-empty-art--accent"
              style={{ width: 40, height: 40, marginBottom: 0, flex: '0 0 auto' }}
            >
              <Icon d={I.lock} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>
                Included with Enterprise
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--k-fg-3)',
                  lineHeight: 1.55,
                  margin: '0 0 12px',
                  maxWidth: 560,
                }}
              >
                You&apos;re on <strong style={{ color: 'var(--k-fg-2)' }}>{planLabel}</strong> —
                unlimited claims
                {quota ? `, ${fmtInt(quota.included_items)} items included` : null}, every export
                format, no API. Enterprise adds scoped API keys, webhooks, and volume licensing on
                one invoice.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link className="k-btn" to="/contact">
                  Talk to us about Enterprise →
                </Link>
                <Link className="k-btn k-btn--ghost" to="/pricing">
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {enterprise ? (
        <>
          <section className="k-set-card">
            <div className="k-set-card-hd">API keys</div>
            <div className="k-set-card-body">
              <div className="k-set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No keys provisioned yet</div>
                  <div
                    style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, lineHeight: 1.5 }}
                  >
                    Keys are issued per environment and scoped to what they may read or write. A
                    key is shown once, at creation, and never again.
                  </div>
                </div>
                <Link className="k-btn k-btn--ghost" to="/contact">
                  Request a key
                </Link>
              </div>
            </div>
          </section>

          <section className="k-set-card">
            <div className="k-set-card-hd">Webhooks</div>
            <div className="k-set-card-body">
              <div className="k-set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No endpoints registered yet</div>
                  <div
                    style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, lineHeight: 1.5 }}
                  >
                    Kevin posts the events below to your endpoint and retries on failure. It never
                    writes into a carrier system, so there is no submit hook.
                  </div>
                </div>
                <Link className="k-btn k-btn--ghost" to="/contact">
                  Add an endpoint
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section className="k-set-card">
        <div className="k-set-card-hd">What you can do with it</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--k-fg-3)',
              lineHeight: 1.55,
              margin: '0 0 6px',
              maxWidth: 660,
            }}
          >
            Open a claim from your own system, poll or subscribe until the inventory is ready, then
            pull the spreadsheet. Kevin fires events about its own work — it never writes into a
            carrier system, so there is no submit endpoint.
          </p>
          {API_EVENTS.map(([e, d]) => (
            <div key={e} className="k-rule">
              <span
                style={{
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 12,
                  color: 'var(--k-fg-2)',
                  width: 240,
                  flexShrink: 0,
                }}
              >
                {e}
              </span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>
                {d}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Try a request</div>
        <div className="k-set-card-body" style={{ padding: 0 }}>
          <pre
            style={{
              margin: 0,
              padding: 20,
              fontFamily: 'var(--k-font-mono)',
              fontSize: 12,
              lineHeight: 1.7,
              background: 'var(--k-bg-2)',
              color: 'var(--k-fg)',
              overflowX: 'auto',
            }}
          >
            {CURL}
          </pre>
        </div>
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--k-line)',
            background: 'var(--k-bg-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button type="button" className="k-btn k-btn--ghost" onClick={() => void copyCurl()}>
            {copied === 'yes' ? 'Copied' : copied === 'failed' ? 'Press Ctrl+C' : 'Copy'}
          </button>
          {copied === 'failed' ? (
            <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
              Your browser blocked the clipboard — the command is selected.
            </span>
          ) : null}
          <Link className="k-btn k-btn--ghost" to="/docs">
            Open API docs →
          </Link>
        </div>
      </section>
    </SettingsShell>
  )
}
