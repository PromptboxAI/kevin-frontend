import { Link } from 'react-router-dom'
import SettingsShell from '../components/SettingsShell'
import Badge from '../components/Badge'

/**
 * Screen 34 — Xactimate. Ported from `SettingsIntegrations` in
 * `design/components/settings-pages.jsx`, verbatim.
 *
 * This screen has nothing to save by design — `save={false}` in the design too.
 * Its whole point is rule 2 plus rule 4: there is no live Xactimate connection,
 * no credentials and no sync. Kevin produces the XactContents .xlsx and the
 * adjuster imports it.
 *
 * Two deviations, noted: the Enterprise CTA points at `/contact` and the docs
 * link at `/docs`, which are this app's routes for `15-Request-access.html` and
 * `24-Docs.html`.
 */

const STEPS: [string, string, string][] = [
  [
    '1',
    'Finish your inventory in Kevin',
    'Review every line in the worksheet, resolve flags, and confirm your totals.',
  ],
  [
    '2',
    'Download the XactContents Excel template',
    'Kevin formats your items into the pre-built XactContents .xlsx — descriptions, quantities, depreciation, and replacement costs, mapped to the columns Xactimate expects.',
  ],
  [
    '3',
    'Import it in Xactimate',
    "In Xactimate, open your estimate → XactContents tab → Import from Excel → select Kevin's file. Your inventory lands as line items, ready to finalize.",
  ],
]

const FORMATS: [string, string, string, boolean][] = [
  [
    'XLSX',
    'XactContents Excel template',
    'The pre-formatted .xlsx Xactimate imports directly. This is the default.',
    true,
  ],
  [
    'PDF',
    'PDF inventory',
    'The readable version, for an insured, an attorney, or an estate-sale client. Carries photos and comps.',
    false,
  ],
  [
    'CSV',
    'Universal CSV',
    'A plain spreadsheet for any other estimating tool, accounting, or your own records.',
    false,
  ],
]

export default function SettingsXactimatePage() {
  return (
    <SettingsShell
      activeId="integrations"
      title="Xactimate"
      eyebrow="Export · compatibility"
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
          Xactimate-ready, by design.
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--k-fg-3)',
            margin: 0,
            maxWidth: 620,
            lineHeight: 1.55,
          }}
        >
          Kevin doesn&apos;t plug into your Xactimate account — it doesn&apos;t need to. You finish
          the inventory here, download the XactContents Excel template, and upload it in Xactimate.
          No credentials, no sync, nothing to connect.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">How it works</div>
        <div
          className="k-set-card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}
        >
          {STEPS.map(([n, t, s], i) => (
            <div
              key={n}
              style={{
                display: 'flex',
                gap: 14,
                padding: '16px 18px',
                borderBottom: i < STEPS.length - 1 ? '1px solid var(--k-line)' : 0,
              }}
            >
              <div
                style={{
                  flex: '0 0 auto',
                  width: 26,
                  height: 26,
                  borderRadius: 99,
                  background: 'var(--k-accent-soft)',
                  color: 'var(--k-accent)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Export formats</div>
        <div className="k-set-card-body" style={{ padding: 0 }}>
          {FORMATS.map(([tag, name, desc, primary]) => (
            <div key={tag} className="k-int-row">
              <div
                className="k-int-logo"
                style={{
                  background: primary ? '#2E4B6F' : 'var(--k-fg-3)',
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {tag}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                  {primary ? (
                    <Badge tone="accent" dot={true}>
                      Default
                    </Badge>
                  ) : null}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 3 }}>{desc}</div>
              </div>
              <button type="button" className="k-btn k-btn--ghost">
                Download sample
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Need a live integration?</div>
        <div className="k-set-card-body">
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: '0 0 12px', lineHeight: 1.55 }}>
            The .xlsx and CSV exports cover virtually every workflow on their own. Larger operations
            that want Kevin wired straight into their own systems can do that on Enterprise via API
            + webhooks.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="k-btn" to="/contact">
              Talk to us about Enterprise →
            </Link>
            <Link className="k-btn k-btn--ghost" to="/docs">
              See API docs
            </Link>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
