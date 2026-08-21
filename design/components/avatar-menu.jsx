// Avatar menu — reusable popover shown when the "MR" avatar is clicked.
// Drop-in for every topbar across the authenticated app.

const { Icon: AIcon, I: AI } = window;

const AvatarMenu = ({ initials = 'MR', name = 'Mariana Reyes', email = 'mariana@reyesadjusting.com', size = 28 }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Resolve href — works in pages/XX.html (sibling relative) AND falls back gracefully on the canvas.
  const link = (file) => {
    if (typeof window === 'undefined') return '#';
    const inPagesFolder = /\/pages\//.test(window.location.pathname);
    return inPagesFolder ? file : `pages/${file}`;
  };

  const ITEMS = [
    { kind: 'link', icon: AI.spark,    label: 'My profile',         file: '31-Settings-profile.html' },
    { kind: 'link', icon: AI.spark,    label: 'Business',           file: '32-Settings-agency.html' },
    { kind: 'link', icon: AI.spark,    label: 'Billing',            file: '35-Settings-billing.html' },
    { kind: 'link', icon: AI.spark,    label: 'Security',           file: '41-Security.html' },
    { kind: 'div'  },
    { kind: 'link', icon: AI.spark,    label: 'Docs',               file: '24-Docs.html' },
    { kind: 'link', icon: AI.spark,    label: 'Get help',           file: '38-Contact.html' },
    { kind: 'div'  },
    { kind: 'link', icon: AI.spark,    label: 'Sign out',           file: '49-Sign-out.html', danger: true },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="k-avatar-btn"
        style={{ width: size, height: size, borderRadius: 99, background: 'var(--k-fg-2)', color: 'var(--k-bg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: Math.max(10, size * 0.39), border: 0, cursor: 'pointer', padding: 0, letterSpacing: 0.5 }}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div className="k-pop k-avatar-menu" role="menu">
          <div className="k-avatar-menu-hd">
            <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--k-fg-2)', color: 'var(--k-bg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 11, flex: '0 0 auto' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{email}</div>
            </div>
          </div>
          <div style={{ padding: 4 }}>
            {ITEMS.map((it, i) => it.kind === 'div'
              ? <div key={`d-${i}`} className="k-avatar-menu-div" />
              : (
                <a key={i} href={link(it.file)} className={`k-avatar-menu-item ${it.danger ? 'k-avatar-menu-item--danger' : ''}`} role="menuitem">
                  <span style={{ display: 'inline-grid', width: 14, color: 'var(--k-fg-4)' }}>
                    <AIcon d={it.icon} size={12} />
                  </span>
                  <span>{it.label}</span>
                </a>
              )
            )}
          </div>
          <div className="k-avatar-menu-foot">
            <span>kevin.co · v2026.05</span>
            <span style={{ marginLeft: 'auto' }}>⌘K to search</span>
          </div>
        </div>
      )}
    </div>
  );
};

window.AvatarMenu = AvatarMenu;
