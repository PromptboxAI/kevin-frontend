import { Link } from 'react-router-dom'
import AppHeader from './AppHeader'

/**
 * The settings frame: sidebar nav plus a titled pane.
 *
 * Ported from `SettingsShell` in `design/components/settings-pages.jsx`, with
 * one structural change: **the save bar is opt-in, not default.**
 *
 * In the design every settings page ends in Discard / Save changes. Nothing
 * here is writable — `GET /v1/me` is read-only and there is no route for a
 * profile, a business, export defaults, an integration or an API key (see
 * BACKEND-ASKS ask 33). A Save button over an endpoint that does not exist is
 * the dead-end the no-dead-ends rule exists to forbid: it reads as "your
 * changes are stored" and nothing is. So a page passes `onSave` only when it
 * genuinely has somewhere to put the data, and the rest say so in words.
 */

type NavItem = {
  id: string
  label: string
  to: string | null
  /** Why it is not reachable yet, for the tooltip. */
  why?: string
}

const NAV: NavItem[] = [
  { id: 'my-profile', label: 'My profile', to: '/settings/profile' },
  { id: 'agency', label: 'Business', to: '/settings/business' },
  {
    id: 'carriers',
    label: 'Carrier profiles',
    to: null,
    why: 'Not built yet — design screen 10',
  },
  { id: 'pricing', label: 'Pricing', to: null, why: 'Not built yet — design screen 14' },
  { id: 'export', label: 'Export defaults', to: '/settings/export' },
  { id: 'integrations', label: 'Xactimate', to: '/settings/integrations' },
  { id: 'billing', label: 'Billing', to: '/settings/billing' },
  { id: 'api', label: 'API & webhooks', to: '/settings/api' },
]

export default function SettingsShell({
  activeId,
  title,
  eyebrow,
  children,
  onSave,
  saveNote,
}: {
  activeId: string
  title: string
  eyebrow: string
  children: React.ReactNode
  /** Omit unless there is a real endpoint behind it. */
  onSave?: () => void
  saveNote?: string
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
              const className = `k-side-item ${item.id === activeId ? 'k-side-item--on' : ''}`
              // A nav row that goes nowhere renders as a disabled span rather
              // than a link, so nothing in the sidebar is a dead click.
              return item.to ? (
                <Link key={item.id} to={item.to} className={className}>
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                </Link>
              ) : (
                <span
                  key={item.id}
                  className={`${className} k-side-item--todo`}
                  title={item.why}
                  aria-disabled
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                </span>
              )
            })}
          </nav>
        </aside>

        <main className="k-settings-main">
          <div className="k-settings-hd">
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

          {children}

          {onSave ? (
            <div className="k-set-savebar">
              {saveNote ? <span>{saveNote}</span> : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="k-btn" onClick={onSave}>
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
 * The panel a screen shows when its fields have no endpoint behind them.
 *
 * Deliberately specific about WHAT is missing rather than a generic "coming
 * soon": engineering reads these, and "there is no write route for this" is
 * actionable where "coming soon" is not.
 */
export function NotWired({ what, detail }: { what: string; detail: string }) {
  return (
    <div className="k-set-card" style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{what} isn’t stored yet</div>
      <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: '6px 0 0' }}>
        {detail}
      </p>
    </div>
  )
}
