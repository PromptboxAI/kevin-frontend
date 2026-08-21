// Four security sub-pages — focused modal-style pages reachable from Settings → My profile.
// ChangePassword · TwoFactor · Passkeys · ActiveSessions

const { KevinWordmark, Icon, I, Badge } = window;

// Shell — narrow card sitting under a top bar and "back to profile" link.
// embedded=true → renders just the card (no top bar / no main wrapper), for SecurityHub.
const SecShell = ({ title, eyebrow, sub, children, footer, embedded, id }) => {
  const card = (
    <div className="k-sec-card" id={id}>
      <div className="k-sec-hd">
        <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{eyebrow}</div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: embedded ? 26 : 32, letterSpacing: '-0.022em', margin: '6px 0 6px' }}>{title}</h1>
        {sub && <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: 0, lineHeight: 1.55, maxWidth: 560 }}>{sub}</p>}
      </div>
      <div className="k-sec-body">{children}</div>
      {footer && <div className="k-sec-foot">{footer}</div>}
    </div>
  );
  if (embedded) return card;
  return (
    <div className="k-sec">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <a className="k-link" style={{ fontSize: 12 }} href="31-Settings-profile.html">
            <Icon d={I.chevleft} size={11} /> Back to My profile
          </a>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--k-fg-2)', color: 'var(--k-bg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 11 }}>MR</div>
      </header>
      <main className="k-sec-main">{card}</main>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 1 · CHANGE PASSWORD
// ───────────────────────────────────────────────────────────────────────────
const ChangePassword = ({ embedded }) => {
  const [pw, setPw] = React.useState('');
  const strength = !pw ? 0 : pw.length < 8 ? 1 : pw.length < 12 ? 2 : /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) && pw.length >= 14 ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'OK', 'Strong', 'Excellent'][strength];
  const strengthTone  = ['line', 'danger', 'warn', 'ok', 'ok'][strength];
  return (
    <SecShell
      embedded={embedded} id="password"
      eyebrow="Security · password"
      title="Change your password"
      sub="Last changed 4 months ago. We require 7+ characters and recommend a passphrase or a password manager."
      footer={
        <>
          <button className="k-btn k-btn--ghost">Cancel</button>
          <button className="k-btn" disabled={strength < 2}>Change password →</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="k-insp-field">
          <label>Current password</label>
          <input className="k-insp-input" type="password" placeholder="Your password" style={{ padding: '10px 13px', fontSize: 14 }} />
        </div>
        <div className="k-insp-field">
          <label>New password</label>
          <input className="k-insp-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Type a new password" style={{ padding: '10px 13px', fontSize: 14, fontFamily: 'var(--k-font-mono)' }} />
          <div className="k-pw-meter">
            <div className="k-pw-bar">
              {[1,2,3,4].map(i => <span key={i} className={`k-pw-cell ${i <= strength ? `k-pw-cell--${strengthTone}` : ''}`} />)}
            </div>
            <span style={{ fontSize: 11.5, color: strength >= 3 ? 'var(--k-ok)' : strength === 2 ? 'var(--k-warn)' : strength === 1 ? 'var(--k-danger)' : 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', fontWeight: 600, minWidth: 80 }}>
              {strengthLabel || 'No password yet'}
            </span>
          </div>
        </div>
        <div className="k-insp-field">
          <label>Confirm new password</label>
          <input className="k-insp-input" type="password" placeholder="Type it again" style={{ padding: '10px 13px', fontSize: 14, fontFamily: 'var(--k-font-mono)' }} />
        </div>
        <div className="k-sec-rules">
          {[
            ['7+ characters',                     pw.length >= 7],
            ['One uppercase letter',              /[A-Z]/.test(pw)],
            ['One number',                        /\d/.test(pw)],
            ['One symbol (recommended)',          /[^A-Za-z0-9]/.test(pw)],
            ["Doesn't match any of your last 5 passwords", pw.length > 0],
          ].map(([l, ok], i) => (
            <div key={i} className="k-sec-rule">
              <span className={`k-sec-tick ${ok ? 'k-sec-tick--on' : ''}`}>
                {ok ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
              </span>
              <span style={{ color: ok ? 'var(--k-fg-2)' : 'var(--k-fg-4)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </SecShell>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · TWO-FACTOR AUTH
// ───────────────────────────────────────────────────────────────────────────
const TwoFactor = ({ embedded }) => (
  <SecShell
    embedded={embedded} id="two-factor"
    eyebrow="Security · two-factor"
    title="Two-factor authentication"
    sub="Adds a second factor when you sign in, on top of your password."
    footer={
      <>
        <button className="k-btn k-btn--ghost">Cancel</button>
        <button className="k-btn">Save changes</button>
      </>
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="k-set-row" style={{ borderBottom: 'none', padding: 0 }}>
        <div className="k-tfa-icon k-tfa-icon--ok"><Icon d={I.check} size={16} stroke={2.5} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Authenticator app — enabled</div>
          <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 2 }}>Added Jan 4, 2026 · 1Password (Mariana's MacBook)</div>
        </div>
        <Badge tone="ok" dot={true}>Active</Badge>
      </div>

      <div className="k-tfa-methods">
        <div className="k-tfa-method">
          <div className="k-tfa-method-hd">
            <div className="k-tfa-method-ic"><Icon d={<><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M11 7h2M10 18h4"/></>} size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Authenticator app</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>1Password · Authy · Google Authenticator</div>
            </div>
            <label className="k-switch">
              <input type="checkbox" defaultChecked />
              <span className="k-switch-track"><span className="k-switch-thumb" /></span>
            </label>
          </div>
        </div>

        <div className="k-tfa-method">
          <div className="k-tfa-method-hd">
            <div className="k-tfa-method-ic"><Icon d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></>} size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Email codes</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Less secure · only enable as a fallback</div>
            </div>
            <label className="k-switch">
              <input type="checkbox" />
              <span className="k-switch-track"><span className="k-switch-thumb" /></span>
            </label>
          </div>
        </div>

        <div className="k-tfa-method">
          <div className="k-tfa-method-hd">
            <div className="k-tfa-method-ic"><Icon d={<><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M11 6h2"/></>} size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>SMS text codes</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>To <span style={{ fontFamily: 'var(--k-font-mono)' }}>(631) •••-•142</span> · NIST advises against SMS for new accounts</div>
            </div>
            <label className="k-switch">
              <input type="checkbox" />
              <span className="k-switch-track"><span className="k-switch-thumb" /></span>
            </label>
          </div>
        </div>

        <div className="k-tfa-method">
          <div className="k-tfa-method-hd">
            <div className="k-tfa-method-ic"><Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Hardware security key</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>YubiKey, Titan, etc. · strongest factor</div>
            </div>
            <button className="k-btn k-btn--ghost">Register key</button>
          </div>
        </div>
      </div>

      <div className="k-set-card" style={{ margin: 0, background: 'var(--k-bg-2)' }}>
        <div className="k-set-card-body">
          <div className="k-set-row" style={{ padding: 0, borderBottom: 'none', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Backup codes · 8 of 10 remaining</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, lineHeight: 1.5 }}>
                Single-use codes you can use if you lose access to your authenticator. Store in a password manager — not a sticky note.
              </div>
            </div>
            <button className="k-btn k-btn--ghost"><Icon d={I.download} size={12}/> Download</button>
            <button className="k-btn k-btn--ghost"><Icon d={I.refresh} size={12}/> Regenerate</button>
          </div>
          <div className="k-backup-codes">
            {['4G3Y-92PA','8HK2-M11P','LM7K-44XR','RV92-7QQ8','C3D1-Y6ZN','7K2L-8QQH','BB91-MNNN','RK02-X45P'].map(c => (
              <span key={c} className="k-backup-code">{c}</span>
            ))}
            <span className="k-backup-code k-backup-code--used">used</span>
            <span className="k-backup-code k-backup-code--used">used</span>
          </div>
        </div>
      </div>
    </div>
  </SecShell>
);

// ───────────────────────────────────────────────────────────────────────────
// 3 · PASSKEYS MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────
const Passkeys = ({ embedded }) => {
  const PK = [
    { name: "Mariana's MacBook Pro",   device: 'macOS · Safari',                 added: 'Jan 12, 2026', last: 'Active now',     status: 'active' },
    { name: 'iPhone 15 Pro',           device: 'iOS · Safari',                  added: 'Jan 18, 2026', last: '2h ago',         status: 'active' },
    { name: 'YubiKey 5 NFC (work)',    device: 'Hardware key · USB-C',           added: 'Feb 02, 2026', last: '6d ago',         status: 'active' },
    { name: 'Old iPad (Air, 2020)',    device: 'iPadOS · Safari',               added: 'Aug 14, 2025', last: '4 months ago',   status: 'stale' },
  ];
  return (
    <SecShell
      embedded={embedded} id="passkeys"
      eyebrow="Security · passkeys"
      title="Passkeys"
      sub="Sign in with a device passkey or a hardware security key — no password to remember. Each device gets its own passkey, and you can revoke any of them here."
      footer={
        <>
          <button className="k-btn k-btn--ghost">Done</button>
          <button className="k-btn"><Icon d={I.plus} size={12}/> Add a passkey to this device</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PK.map((p, i) => (
          <div key={i} className="k-pk-row">
            <div className="k-pk-icon">
              <Icon d={p.device.includes('Hardware')
                ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>
                : p.device.includes('iOS')
                  ? <><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M11 6h2"/></>
                  : <><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/></>
              } size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                {p.status === 'stale' && <Badge tone="warn">Unused 4+ months</Badge>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, fontFamily: 'var(--k-font-mono)' }}>
                {p.device} · Added {p.added} · Last used {p.last}
              </div>
            </div>
            <button className="k-btn k-btn--ghost">Rename</button>
            <button className="k-btn k-btn--ghost k-btn--danger" title="Remove passkey"><Icon d={I.trash} size={12}/></button>
          </div>
        ))}

        <div className="k-docs-callout k-docs-callout--warn" style={{ marginTop: 12 }}>
          <Icon d={I.warn} size={14} />
          <div>
            <strong>One passkey doesn't have to be enough.</strong> We recommend at least two so you don't lock yourself out — typically your laptop + your phone. Hardware keys are great for shared/borrowed devices.
          </div>
        </div>
      </div>
    </SecShell>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 4 · ACTIVE SESSIONS
// ───────────────────────────────────────────────────────────────────────────
const ActiveSessions = ({ embedded }) => {
  const SES = [
    { device: 'MacBook Pro 14"',  browser: 'Safari 18.4',  os: 'macOS 14.5',  loc: 'Hauppauge NY',  ip: '70.114.xx.xx',  last: 'Active now',  current: true },
    { device: 'iPhone 15 Pro',     browser: 'Kevin iOS app', os: 'iOS 17.5',   loc: 'Hauppauge NY',  ip: '70.114.xx.xx',  last: '2h ago',      current: false },
    { device: 'iPad Air',          browser: 'Safari',       os: 'iPadOS 17.3', loc: 'Hauppauge NY',  ip: '70.114.xx.xx',  last: 'Yesterday',   current: false },
    { device: 'Windows desktop',   browser: 'Chrome 122',   os: 'Windows 11',  loc: 'Phoenix AZ',  ip: '136.32.xx.xx',  last: '3 days ago',  current: false, suspicious: true },
  ];
  return (
    <SecShell
      embedded={embedded} id="sessions"
      eyebrow="Security · sessions"
      title="Active sessions"
      sub="Every device currently signed in with your account. If you see something you don't recognize, sign it out — your password and 2FA stay unchanged."
      footer={
        <>
          <button className="k-btn k-btn--ghost">Done</button>
          <button className="k-btn k-btn--ghost k-btn--danger">Sign out all other sessions</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SES.map((s, i) => (
          <div key={i} className={`k-ses-row ${s.suspicious ? 'k-ses-row--warn' : ''}`}>
            <div className="k-pk-icon" style={s.current ? { background: 'var(--k-accent-soft)', color: 'var(--k-accent)' } : {}}>
              <Icon d={s.device.startsWith('iPhone') || s.device.startsWith('iPad')
                ? <><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M11 6h2"/></>
                : <><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/></>
              } size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.device}</span>
                {s.current && <Badge tone="accent" dot={true}>This device</Badge>}
                {s.suspicious && <Badge tone="warn" dot={true}>Unfamiliar location</Badge>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, fontFamily: 'var(--k-font-mono)' }}>
                {s.browser} · {s.os} · {s.loc} · IP {s.ip}
              </div>
              <div style={{ fontSize: 11.5, color: s.current ? 'var(--k-ok)' : 'var(--k-fg-3)', marginTop: 2 }}>
                {s.last}
              </div>
            </div>
            {!s.current && <button className="k-btn k-btn--ghost k-btn--danger">Sign out</button>}
          </div>
        ))}

        <div className="k-docs-callout" style={{ marginTop: 12 }}>
          <Icon d={I.lock} size={14} />
          <div>
            <strong>Sessions auto-expire after 8 hours idle.</strong> If your laptop is unattended, we sign you out for you. Lower the timeout to 1 hour in <a className="k-link" href="31-Settings-profile.html">My profile → Security</a>.
          </div>
        </div>
      </div>
    </SecShell>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// CONSOLIDATED · SECURITY HUB — all four security areas on one page
// ───────────────────────────────────────────────────────────────────────────
const SecurityHub = () => {
  const NAV = [
    ['password',   'Password',     <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>],
    ['two-factor', 'Two-factor',   <><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></>],
    ['passkeys',   'Passkeys',     <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>],
    ['sessions',   'Sessions',     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>],
  ];
  const [active, setActive] = React.useState('password');
  const go = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };
  return (
    <div className="k-sec">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <a className="k-link" style={{ fontSize: 12 }} href="31-Settings-profile.html">
            <Icon d={I.chevleft} size={11} /> Back to My profile
          </a>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--k-fg-2)', color: 'var(--k-bg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 11 }}>MR</div>
      </header>
      <main className="k-sechub-main">
        <aside className="k-sechub-nav">
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, padding: '0 12px 10px' }}>Security</div>
          {NAV.map(([id, label, icon]) => (
            <button key={id} onClick={() => go(id)} className={`k-sechub-navitem ${active === id ? 'k-sechub-navitem--on' : ''}`}>
              <Icon d={icon} size={15} /> <span>{label}</span>
            </button>
          ))}
        </aside>
        <div className="k-sechub-col">
          <div className="k-sec-hd" style={{ padding: '0 0 4px' }}>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 36, letterSpacing: '-0.025em', margin: '0 0 6px' }}>Security</h1>
            <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: 0, lineHeight: 1.55, maxWidth: 560 }}>Manage how you sign in and keep your account safe — password, passkeys, two-factor methods, and active sessions.</p>
          </div>
          <ChangePassword embedded={true} />
          <TwoFactor embedded={true} />
          <Passkeys embedded={true} />
          <ActiveSessions embedded={true} />
        </div>
      </main>
    </div>
  );
};

Object.assign(window, { ChangePassword, TwoFactor, Passkeys, ActiveSessions, SecurityHub });
