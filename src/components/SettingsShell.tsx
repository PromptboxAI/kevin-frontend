import { Link } from 'react-router-dom'
import AppHeader from './AppHeader'

/**
 * The settings frame: sidebar nav plus a titled pane.
 *
 * Ported from `SettingsShell` in `design/components/settings-pages.jsx`. The
 * design's `save` prop is kept as-is — default true, `save={false}` on the
 * pages that genuinely have nothing to save (Xactimate, and API off Enterprise).
 *
 * I previously inverted that: no endpoint, therefore no Save button, therefore
 * prose where the fields should be. That was wrong. The no-dead-ends rule is
 * satisfied by INTERACTIONS.md — "every actionable control must EITHER do
 * something visible in-prototype OR have its intended production behavior
 * recorded" — so the designed control ships and the wiring is written down.
 * Replacing it with an explanation satisfies neither branch and loses the
 * design.
 *
 * ONE nav for every settings page, this one. A page carrying its own copy is
 * how Billing became a trap: its private NAV rendered the other seven rows as
 * spans, so landing there was one-way.
 */

type NavItem = {
  id: string
  label: string
  to: string
  /** Count badge, per the design nav. */
  n?: string
  /**
   * Not offered in beta. The row stays visible and greyed so the shape of the
   * product is still legible, but it is a span rather than a link -- and its
   * route redirects, so a bookmarked URL cannot reach it either.
   */
  off?: boolean
}

const NAV: NavItem[] = [
  { id: 'my-profile', label: 'My profile', to: '/settings/profile' },
  { id: 'agency', label: 'Business', to: '/settings/business' },
  // Carrier profiles is BUILT (SettingsCarriersPage) but not offered in beta.
  // Flip `off` and restore the route in App.tsx to bring it back.
  { id: 'carriers', label: 'Carrier profiles', to: '/settings/carriers', off: true },
  { id: 'pricing', label: 'Pricing', to: '/settings/pricing' },
  { id: 'export', label: 'Export defaults', to: '/settings/export' },
  { id: 'integrations', label: 'Xactimate', to: '/settings/xactimate' },
  { id: 'billing', label: 'Billing', to: '/settings/billing' },
  { id: 'api', label: 'API & webhooks', to: '/settings/api' },
]

export default function SettingsShell({
  activeId,
  title,
  eyebrow,
  children,
  save = true,
  saveNote,
  saveDisabled = false,
  onDiscard,
  carrierCount,
}: {
  activeId: string
  title: string
  eyebrow: string
  children: React.ReactNode
  save?: boolean
  saveNote?: React.ReactNode
  /**
   * The UI boundary. A screen whose fields have no write route keeps the
   * designed bar but disables the button, so nobody types into a form that
   * silently discards. An enabled Save over a missing endpoint is a
   * false-positive save state -- the user believes the work is stored, and
   * finds out otherwise on the next page load. See BACKEND-ASKS ask 35.
   */
  saveDisabled?: boolean
  /**
   * Resets the screen's own state. Deliberately independent of `saveDisabled`:
   * discarding is a purely local action, so it works whether or not there is
   * anywhere to save to. Disabling it with Save was over-broad -- it left the
   * user with edits they could neither keep nor clear.
   */
  onDiscard?: () => void
  /** Count badge on the Carrier profiles row. */
  carrierCount?: number
}) {
  return (
    <div className="k-settings">
      <AppHeader />

      <div className="k-settings-body">
        <aside className="k-settings-side">
          <div style={{ padding: '20px 16px 12px' }}>
            <div
              className="k-mono"
              style={{
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Settings
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 22,
                letterSpacing: '-0.018em',
                margin: '4px 0 0',
              }}
            >
              {title}
            </h2>
          </div>

          <nav style={{ padding: '4px 8px' }}>
            {NAV.map((item) => {
              const n = item.id === 'carriers' && carrierCount != null ? String(carrierCount) : item.n

              if (item.off) {
                return (
                  <span
                    key={item.id}
                    className="k-side-item k-side-item--off"
                    title="Not available in beta"
                  >
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)' }}>Soon</span>
                  </span>
                )
              }

              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`k-side-item ${item.id === activeId ? 'k-side-item--on' : ''}`}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {n ? (
                    <span
                      style={{
                        fontFamily: 'var(--k-font-mono)',
                        fontSize: 10.5,
                        color: 'var(--k-fg-4)',
                      }}
                    >
                      {n}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="k-settings-main">
          <div className="k-settings-hd">
            <div>
              <div
                className="k-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--k-fg-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                {eyebrow}
              </div>
            </div>
          </div>

          {children}

          {save ? (
            <div className="k-set-savebar">
              {saveNote ? <span>{saveNote}</span> : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  onClick={onDiscard}
                  disabled={!onDiscard}
                >
                  Discard
                </button>
                <button type="button" className="k-btn" disabled={saveDisabled}>
                  Save changes
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

/**
 * ⚠ ADDED TO UNBLOCK A BROKEN BUILD, not designed here.
 *
 * SettingsApiPage, SettingsExportPage, SettingsXactimatePage and
 * SettingsBusinessPage all `import { NotWired }` from this module, but nothing
 * exported it — so those four modules failed to load, and the uncaught
 * SyntaxError took the WHOLE app blank at every route, including `/` and the
 * landing page. This is the smallest thing that makes the app boot again.
 *
 * It is deliberately additive: it does not touch the default export or any
 * existing markup. If you had a different component in mind, replace this
 * outright — the call sites pass `what` and `detail` and expect a notice
 * explaining that a surface has no backend yet.
 */
export function NotWired({ what, detail }: { what: string; detail: string }) {
  return (
    <section className="k-set-card">
      <div className="k-set-card-hd">Not wired yet</div>
      <div className="k-set-card-body">
        <p style={{ fontSize: 13, color: 'var(--k-fg-2)', margin: '0 0 8px', lineHeight: 1.6 }}>
          <strong>{what}</strong> has no backend behind it yet.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)', margin: 0, lineHeight: 1.6 }}>
          {detail}
        </p>
      </div>
    </section>
  )
}
