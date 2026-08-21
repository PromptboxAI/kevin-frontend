// Forgot-password flow — 3 screens reachable from sign-in's "Forgot?" link.
//   ForgotPassword   · enter email, send link
//   ResetSent        · "check your email" confirmation
//   ResetPassword    · set a new password (linked from email)

const { KevinWordmark, Icon, I } = window;

// Shared two-pane shell that matches SignIn — left form, right navy quote panel
const AuthShell = ({ children, quote = null, stats = true }) => (
  <div className="k-auth">
    <div className="k-auth-l">
      <div style={{ padding: '24px 32px' }}>
        <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
      </div>
      <div className="k-auth-l-body">{children}</div>
      <div className="k-auth-l-foot">
        <span>Carrier-grade encryption at rest</span>
        <span>·</span>
        <span>TLS 1.3 in transit</span>
        <span>·</span>
        <span>© 2026</span>
      </div>
    </div>
    <div className="k-auth-r">
      <div className="k-auth-r-inner">
        {quote && (
          <>
            <div style={{ fontFamily: 'var(--k-font-display)', fontStyle: 'italic', fontSize: 26, color: 'rgba(255,255,255,0.92)', lineHeight: 1.25, maxWidth: 380, textWrap: 'balance' }}>
              "{quote.text}"
            </div>
            <div style={{ marginTop: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--k-font-mono)' }}>
              {quote.who}
            </div>
          </>
        )}
        {stats && (
          <div style={{ marginTop: quote ? 60 : 80, display: 'flex', gap: 32, fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <div>
              <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--k-font-display)', fontStyle: 'italic', textTransform: 'none', letterSpacing: '-0.02em', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>TLS 1.3</div>
              <div style={{ marginTop: 6 }}>Encrypted in transit</div>
            </div>
            <div>
              <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--k-font-display)', fontStyle: 'italic', textTransform: 'none', letterSpacing: '-0.02em', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>AES-256</div>
              <div style={{ marginTop: 6 }}>Encryption at rest</div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 1 · FORGOT PASSWORD — enter email
// ───────────────────────────────────────────────────────────────────────────
const ForgotPassword = () => (
  <AuthShell quote={{ text: "A claim that used to eat two days of typing now takes an afternoon. Kevin reads the photos and writes the inventory — I just review and send.", who: "Kevin Godfrey · Long Island Public Adjusters, LLC" }}>
    <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Reset password</div>
    <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.025em', margin: '8px 0 10px', lineHeight: 1.05 }}>
      Forgot it? It happens.
    </h1>
    <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 28px', lineHeight: 1.5 }}>
      Enter your work email and we'll send a single-use link. The link expires in 30 minutes.
    </p>

    <form className="k-auth-form" onSubmit={(e) => e.preventDefault()}>
      <div className="k-insp-field">
        <label>Work email</label>
        <input className="k-insp-input" placeholder="you@example.com" autoFocus style={{ fontSize: 14, padding: '11px 13px' }} />
      </div>
      <a className="k-btn k-btn--lg" href="46-Reset-sent.html" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>Send reset link →</a>
    </form>

    <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
      Remembered it? <a className="k-link" style={{ fontSize: 12.5 }} href="00-Sign-in.html">Back to sign in →</a>
    </div>
  </AuthShell>
);

// ───────────────────────────────────────────────────────────────────────────
// 2 · RESET LINK SENT — check your inbox
// ───────────────────────────────────────────────────────────────────────────
const ResetSent = () => (
  <AuthShell quote={{ text: "Three retailer price comps on every line, pulled live. When a carrier questions a value, the proof is already attached.", who: "Kevin Godfrey · Long Island Public Adjusters, LLC" }}>
    <div style={{ width: 56, height: 56, borderRadius: 99, background: 'var(--k-accent-soft)', color: 'var(--k-accent)', display: 'grid', placeItems: 'center', marginBottom: 22 }}>
      <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></>} size={26} stroke={1.4} />
    </div>
    <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Reset link sent</div>
    <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.025em', margin: '8px 0 10px', lineHeight: 1.05 }}>
      Check your inbox.
    </h1>
    <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
      We sent a one-time link to the email on your account. Click it within 30 minutes to set a new password.
    </p>

    <div className="k-sent-card">
      <div className="k-sent-card-hd">
        <span>From: Kevin &lt;noreply@kevin.co&gt;</span>
        <span style={{ marginLeft: 'auto' }}>Now</span>
      </div>
      <div className="k-sent-card-body">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Reset your Kevin password</div>
        <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>Click the button below to choose a new password. This link expires in 30 minutes.</div>
        <div style={{ marginTop: 10 }}>
          <a className="k-btn" href="47-Reset-password.html">Reset password →</a>
        </div>
      </div>
    </div>

    <div className="k-set-card" style={{ background: 'var(--k-bg-2)', marginTop: 24 }}>
      <div className="k-set-card-body" style={{ padding: '14px 16px', fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--k-fg-2)' }}>Didn't get the email?</strong>
        <ul style={{ margin: '6px 0 0', padding: '0 0 0 20px' }}>
          <li>Check spam/junk — it'll come from <span style={{ fontFamily: 'var(--k-font-mono)' }}>noreply@kevin.co</span></li>
          <li>Make sure you typed the email exactly as it's on your account</li>
        </ul>
        <a className="k-link" style={{ marginTop: 10, display: 'inline-block' }} href="45-Forgot-password.html">Send another link</a>
      </div>
    </div>

    <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
      <a className="k-link" style={{ fontSize: 12.5 }} href="00-Sign-in.html">← Back to sign in</a>
    </div>
  </AuthShell>
);

// ───────────────────────────────────────────────────────────────────────────
// 3 · RESET PASSWORD — set a new one (reached from the email link)
// ───────────────────────────────────────────────────────────────────────────
const ResetPassword = () => {
  const [pw, setPw] = React.useState('');
  const strength = !pw ? 0 : pw.length < 7 ? 1 : pw.length < 10 ? 2 : /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) && pw.length >= 12 ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'OK', 'Strong', 'Excellent'][strength];
  const strengthTone  = ['line', 'danger', 'warn', 'ok', 'ok'][strength];
  return (
    <AuthShell quote={{ text: "I drop a folder of fire-damage photos and walk away. By the time I'm back, every item is identified, priced, and ready to send to Xactimate.", who: "Kevin Godfrey · Long Island Public Adjusters, LLC" }} stats={false}>
      <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Reset password</div>
      <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.025em', margin: '8px 0 10px', lineHeight: 1.05 }}>
        Choose a new password.
      </h1>
      <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Set it once — your other devices will be signed out for safety. You'll need to sign back in on each.
      </p>

      <form className="k-auth-form" onSubmit={(e) => e.preventDefault()}>
        <div className="k-insp-field">
          <label>New password</label>
          <input className="k-insp-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Type a new password" autoFocus style={{ padding: '11px 13px', fontSize: 14, fontFamily: 'var(--k-font-mono)' }} />
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
          <input className="k-insp-input" type="password" placeholder="Type it again" style={{ padding: '11px 13px', fontSize: 14, fontFamily: 'var(--k-font-mono)' }} />
        </div>

        <div className="k-sec-rules">
          {[
            ['7+ characters',                              pw.length >= 7],
            ['One uppercase letter',                        /[A-Z]/.test(pw)],
            ['One number',                                  /\d/.test(pw)],
            ['One symbol (recommended)',                    /[^A-Za-z0-9]/.test(pw)],
            ["Doesn't match any of your last 5 passwords",  pw.length > 0],
          ].map(([l, ok], i) => (
            <div key={i} className="k-sec-rule">
              <span className={`k-sec-tick ${ok ? 'k-sec-tick--on' : ''}`}>
                {ok ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
              </span>
              <span style={{ color: ok ? 'var(--k-fg-2)' : 'var(--k-fg-4)' }}>{l}</span>
            </div>
          ))}
        </div>

        <label className="k-toggle" style={{ marginTop: 4 }}>
          <input type="checkbox" defaultChecked />
          <span className="k-toggle-box"><Icon d={I.check} size={10} stroke={2.5} /></span>
          <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)' }}>Sign out my other devices for safety</span>
        </label>

        <button className="k-btn k-btn--lg" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={strength < 2} onClick={() => { window.location.href = '01-My-claims.html'; }}>
          Set new password &amp; sign in →
        </button>
      </form>
    </AuthShell>
  );
};

Object.assign(window, { ForgotPassword, ResetSent, ResetPassword });
