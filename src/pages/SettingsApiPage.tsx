import { Link } from 'react-router-dom'
import SettingsShell from '../components/SettingsShell'
import { Icon, I } from '../components/Icon'

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

export default function SettingsApiPage({ plan = 'pro' }: { plan?: string }) {
  const enterprise = plan === 'enterprise'
  return (
    <SettingsShell
      activeId="api"
      title="API & webhooks"
      eyebrow={enterprise ? 'Enterprise · 2 keys · 3 hooks' : 'Enterprise feature'}
      save={enterprise}
      saveNote={enterprise ? 'Key and webhook changes take effect immediately.' : undefined}
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
                You&apos;re on <strong style={{ color: 'var(--k-fg-2)' }}>Pro</strong> — unlimited
                claims, 2,000 items a month, every export format, no API. Enterprise adds scoped API
                keys, webhooks, and volume licensing on one invoice.
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
          }}
        >
          <Link className="k-btn k-btn--ghost" to="/docs">
            Open API docs →
          </Link>
        </div>
      </section>
    </SettingsShell>
  )
}
