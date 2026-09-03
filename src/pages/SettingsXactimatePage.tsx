import SettingsShell, { NotWired } from '../components/SettingsShell'
import { Link } from 'react-router-dom'

/**
 * Screen 34 — Xactimate.
 *
 * The screen most at risk of promising the wrong thing, so the copy carries
 * two locked product facts rather than a connector list.
 *
 * Xactimate ingests a pre-formatted .xlsx — never XML (rule 2). And Kevin does
 * NOT push into carrier systems: it produces a file the adjuster sends, and has
 * no carrier-facing surface at all (rule 4). An "integration" screen with a
 * Connect button would imply both of the things the product deliberately does
 * not do.
 */
export default function SettingsXactimatePage() {
  return (
    <SettingsShell activeId="integrations" title="Xactimate" eyebrow="Integration">
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
          Getting an inventory into Xactimate
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 640, lineHeight: 1.55 }}>
          Kevin produces the file; you send it. There is nothing to connect,
          and that is the design rather than a missing feature.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">How it works</div>
        <div className="k-set-card-body">
          <ol style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
            <li>Review the worksheet until the inventory reads the way you want it to.</li>
            <li>
              <strong>Generate carrier export</strong> — an .xlsx in the
              XactContents template, with the columns in the order the importer
              expects.
            </li>
            <li>Import it in XactContents, or send it on as the file it is.</li>
          </ol>
          <p style={{ fontSize: 11.5, color: 'var(--k-fg-4)', lineHeight: 1.55, margin: '12px 0 0' }}>
            Everything you have exported is listed under{' '}
            <Link to="/exports">Exports</Link>.
          </p>
        </div>
      </section>

      <section className="k-set-card" style={{ marginTop: 18 }}>
        <div className="k-set-card-hd">Two things Kevin deliberately does not do</div>
        <div className="k-set-card-body">
          <div className="k-set-row" style={{ alignItems: 'flex-start' }}>
            <span style={{ minWidth: 150 }}>No XML</span>
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
              Xactimate and XactContents import a pre-formatted{' '}
              <strong>.xlsx</strong>, and whole estimates travel as .ESX
              archives. There is no Xactimate XML path.
            </span>
          </div>
          <div className="k-set-row" style={{ alignItems: 'flex-start' }}>
            <span style={{ minWidth: 150 }}>No direct submit</span>
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
              Kevin never pushes into a carrier's system and has no
              carrier-facing review surface. You download, share or email the
              file — which keeps you the one who decides what goes out.
            </span>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 18 }}>
        <NotWired
          what="Programmatic delivery"
          detail="The path for it is XactAnalysis API and webhooks, and none of it is built — no credential store, no endpoint, no delivery log. It is also a different product decision from this screen: an automated push means Kevin decides when a document leaves, which is the opposite of the deliberate hand-off above. Worth agreeing that before wiring it."
        />
      </div>
    </SettingsShell>
  )
}
