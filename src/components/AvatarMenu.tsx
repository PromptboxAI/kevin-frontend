import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { I, Icon } from './Icon'
import { useAuth } from '../lib/auth'

/**
 * Ported from design/components/avatar-menu.jsx.
 *
 * Two deliberate deviations from the prototype, both forced by real auth:
 *  - Sign out is a button calling supabase signOut, not a link to a static page.
 *  - Destinations render inert until those settings screens exist, the same
 *    treatment ClaimTabs gives unbuilt tabs -- a visible label with a tooltip
 *    beats a link to nowhere. Billing is built, so it is a real link; the rest
 *    stay inert until their screens land.
 */
const ITEMS: ({ kind: 'div' } | { kind: 'link'; label: string; to?: string })[] = [
  // Routes per the design contract (avatar-menu.jsx). Docs and Get help are
  // IN-APP: the marketing pages are being ported into this router as public
  // routes, so these are ordinary links. They 404 until those pages land.
  { kind: 'link', label: 'My profile', to: '/settings/profile' },
  { kind: 'link', label: 'Business', to: '/settings/business' },
  { kind: 'link', label: 'Billing', to: '/settings/billing' },
  { kind: 'link', label: 'Security', to: '/settings/security' },
  { kind: 'div' },
  { kind: 'link', label: 'Docs', to: '/docs' },
  { kind: 'link', label: 'Get help', to: '/contact' },
  { kind: 'div' },
]

/** Two letters from the person's NAME. Never from an id, never a UUID. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0] ?? '?').slice(0, 2).toUpperCase()
}

export default function AvatarMenu({ email }: { email: string | null }) {
  const { session, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const meta = session?.user?.user_metadata as Record<string, unknown> | undefined
  const profileName = (meta?.full_name ?? meta?.name) as string | undefined
  /**
   * Falls back to the email's local part, humanised -- NEVER the user id. An
   * internal uuid must not reach the adjuster. If the session carries no
   * profile name this reads "Test" rather than "Mariana Reyes"; the fix is a
   * name on the profile, not a different fallback.
   */
  const name =
    profileName?.trim() ||
    (email?.split('@')[0] ?? '')
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.replace(/^./, (c) => c.toUpperCase()))
      .join(' ') ||
    'Account'
  const initials = initialsOf(name)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="k-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        title={email ?? undefined}
      >
        {initials}
      </button>

      {open ? (
        <div className="k-pop k-avatar-menu" role="menu">
          <div className="k-avatar-menu-hd">
            <div className="k-avatar-chip">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="k-avatar-name">{name}</div>
              <div className="k-avatar-mail">{email ?? '—'}</div>
            </div>
          </div>

          <div style={{ padding: 4 }}>
            {ITEMS.map((item, index) =>
              item.kind === 'div' ? (
                <div key={`d-${index}`} className="k-avatar-menu-div" />
              ) : item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="k-avatar-menu-item"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span style={{ display: 'inline-grid', width: 14, color: 'var(--k-fg-4)' }}>
                    <Icon d={I.spark} size={12} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  key={item.label}
                  className="k-avatar-menu-item k-tab--todo"
                  role="menuitem"
                  title="Lives on the marketing site, which is a separate deployment"
                >
                  <span style={{ display: 'inline-grid', width: 14, color: 'var(--k-fg-4)' }}>
                    <Icon d={I.spark} size={12} />
                  </span>
                  <span>{item.label}</span>
                </span>
              ),
            )}

            <button
              type="button"
              className="k-avatar-menu-item k-avatar-menu-item--danger"
              role="menuitem"
              onClick={() => void signOut()}
            >
              <span style={{ display: 'inline-grid', width: 14, color: 'var(--k-fg-4)' }}>
                <Icon d={I.spark} size={12} />
              </span>
              <span>Sign out</span>
            </button>
          </div>

          <div className="k-avatar-menu-foot">
            <span>kevin.co · v2026.05</span>
            <span style={{ marginLeft: 'auto' }}>⌘K to search</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
