import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'

function initialsOf(email: string | null, id: string): string {
  if (!email) return id.slice(0, 2).toUpperCase()
  const [local] = email.split('@')
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

/** Ported from avatar-menu.jsx: initials chip -> Settings / Billing / Sign out. */
export default function AvatarMenu({ email, id }: { email: string | null; id: string }) {
  const { signOut } = useAuth()
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="k-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={email ?? id}
      >
        {initialsOf(email, id)}
      </button>

      {open ? (
        <div className="k-pop k-avatar-menu" role="menu">
          <div className="k-avatar-menu-hd">
            <div className="k-avatar-chip">{initialsOf(email, id)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="k-avatar-name">{email ?? 'Signed in'}</div>
              <div className="k-avatar-mail">{id}</div>
            </div>
          </div>
          <div style={{ padding: 4 }}>
            <span className="k-avatar-menu-item k-tab--todo" role="menuitem">
              Settings
            </span>
            <span className="k-avatar-menu-item k-tab--todo" role="menuitem">
              Billing
            </span>
            <div className="k-avatar-menu-div" />
            <button
              type="button"
              className="k-avatar-menu-item k-avatar-menu-item--danger"
              role="menuitem"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
