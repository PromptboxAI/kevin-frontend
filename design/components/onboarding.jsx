// Onboarding sequence — the first-run experience after sign-up.
// A single stepped wizard component (account → welcome → pricing region → export default → done).
// Team invites are Enterprise-only and live in Settings → Team, never in onboarding (rule 9).
// plus AccountCreate as the entry point. "Fully engaging" = progress rail, live preview,
// celebratory finish, skippable steps.

const { KevinWordmark, Icon, I, Badge } = window;

// ── Shared: split shell with navy story panel on the right ───────────────────
const OnbShell = ({ children, panel }) => (
  <div className="k-auth">
    <div className="k-auth-l">
      <div style={{ padding: '24px 32px' }}><KevinWordmark href="02-Landing.html" size={18} suffix={true} /></div>
      <div className="k-auth-l-body" style={{ maxWidth: 520 }}>{children}</div>
      <div className="k-auth-l-foot">
        <span>Carrier-grade encryption at rest</span><span>·</span><span>TLS 1.3 in transit</span><span>·</span><span>© 2026</span>
      </div>
    </div>
    <div className="k-auth-r">
      <div className="k-auth-r-inner">{panel}</div>
    </div>
  </div>
);

// ── 1 · ACCOUNT CREATE (from the sign-up email) ──────────────────────────────
const ONB_WORKTYPES = [
  ['insurance', 'Insurance claims',  'Adjuster or public adjuster — your workspace holds Claims, prices to RCV/ACV, and exports to Xactimate.'],
  ['estate',    'Estate sales',      'Estate-sale or liquidation professional — your workspace holds Estates, prices to fair market value, and tracks what each item sold for.'],
];

// Field wrapper hoisted to module scope — defining it inside the component made
// React remount every input per keystroke (new component type each render).
const AccField = ({ label, children }) => <div className="k-insp-field"><label>{label}</label>{children}</div>;
const ACC_INPUT = { padding: '11px 13px', fontSize: 14 };

const fmtCardNum = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const fmtExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : d.slice(0, 2) + ' / ' + d.slice(2);
};

const AccountCreate = () => {
  // Signup per the locked flow: 1 CREATE ACCOUNT (name/email/password/firm) →
  // 2 VERIFY EMAIL (6-digit code) → 3 ADD CARD (disclosure ABOVE the field,
  // Stripe Elements, two separate unchecked consents) → app with trial banner.
  // Stripe SetupIntent saves the card at $0; subscription trial_period_days = 8;
  // consent record stored; EMAIL 1 fires on completion. Day 4 reminder, day 8
  // charge $249 → receipt; card failure → 3 retries over 7 days → suspend.
  const [step, setStep]   = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [name, setName]   = React.useState('');
  const [firm, setFirm]   = React.useState('');
  const [pw, setPw]       = React.useState('');
  const [work, setWork]   = React.useState('insurance');
  const [code, setCode]   = React.useState('');
  const [card, setCard]   = React.useState('');
  const [exp, setExp]     = React.useState('');
  const [cvc, setCvc]     = React.useState('');
  const [consentRenew, setConsentRenew] = React.useState(false);
  const [consentTerms, setConsentTerms] = React.useState(false);
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const strength = !pw ? 0 : pw.length < 7 ? 1 : pw.length < 12 ? 2 : (/[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) && pw.length >= 14) ? 4 : 3;
  const tone = ['line','danger','warn','ok','ok'][strength];
  const label = ['','Too short','OK','Strong','Excellent'][strength];
  const meets = pw.length >= 7 && /[A-Z]/.test(pw) && /\d/.test(pw);
  const codeOk = code.replace(/\D/g, '').length === 6;
  const cardOk = card.replace(/\s/g, '').length >= 15 && /^\d{2}\s*\/\s*\d{2}$/.test(exp) && cvc.length >= 3;
  const chargeDate = new Date(Date.now() + 8 * 864e5).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div className="k-onb-page">
      <header className="k-onb-top">
        <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
        <a className="k-link" href="00-Sign-in.html" style={{ fontSize: 12.5 }}>Already have an account? Sign in</a>
      </header>

      <main className="k-onb-col" style={{ maxWidth: 560 }}>
        <div className="k-onb-card">
        <div className="k-onb-eyebrow">Start your 7-day free trial · step {step + 1} of 3</div>
        <div className="k-onb-dots" style={{ marginBottom: 18 }}>{[0,1,2].map(i => <span key={i} className={`k-onb-dot ${i < step ? 'k-onb-dot--done' : i === step ? 'k-onb-dot--on' : ''}`} />)}</div>

        {step === 0 && (<>
          <h1 className="k-onb-h">Create your account.</h1>
          <p className="k-onb-sub">Full access for 7 days — real claims, real exports. No charge until the trial ends.</p>
          <form className="k-auth-form" onSubmit={(e) => { e.preventDefault(); if (emailOk && name.trim() && meets) setStep(1); }} style={{ marginTop: 22, gap: 18 }}>
            <AccField label="Your name"><input className="k-insp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" autoFocus style={ACC_INPUT} /></AccField>
            <AccField label="Work email"><input className="k-insp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={ACC_INPUT} /></AccField>
            <AccField label="Password">
              <input className="k-insp-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="7+ characters, one uppercase, one number" style={{ ...ACC_INPUT, fontFamily: 'var(--k-font-mono)' }} />
              <div className="k-pw-meter">
                <div className="k-pw-bar">{[1,2,3,4].map(i => <span key={i} className={`k-pw-cell ${i <= strength ? `k-pw-cell--${tone}` : ''}`} />)}</div>
                <span style={{ fontSize: 11.5, color: strength >= 3 ? 'var(--k-ok)' : strength === 2 ? 'var(--k-warn)' : strength === 1 ? 'var(--k-danger)' : 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', fontWeight: 600, minWidth: 80 }}>{label || 'No password yet'}</span>
              </div>
            </AccField>
            <AccField label="Firm name (optional)"><input className="k-insp-input" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="e.g. Long Island Public Adjusters, LLC" style={ACC_INPUT} /></AccField>
            <AccField label="What will you inventory?">
              <div className="k-onb-worktypes">
                {ONB_WORKTYPES.map(([id, t, sub]) => (
                  <button key={id} type="button" onClick={() => setWork(id)}
                    className={`k-format ${work === id ? 'k-format--on' : ''}`} style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
                    {work === id && <div className="k-format-check"><Icon d={I.check} size={11} stroke={2.5} /></div>}
                  </button>
                ))}
              </div>
            </AccField>
            <button className="k-btn k-btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={!emailOk || !name.trim() || !meets}>Continue →</button>
          </form>
        </>)}

        {step === 1 && (<>
          <h1 className="k-onb-h">Check your email.</h1>
          <p className="k-onb-sub">
            We sent a 6-digit code to <span style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>{email}</span>. Enter it here, or click the magic link in the email — either works.
          </p>
          <form className="k-auth-form" onSubmit={(e) => { e.preventDefault(); if (codeOk) setStep(2); }} style={{ marginTop: 22, gap: 18 }}>
            <AccField label="Verification code">
              <input className="k-insp-input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" autoFocus
                style={{ ...ACC_INPUT, fontFamily: 'var(--k-font-mono)', fontSize: 22, letterSpacing: '0.35em', textAlign: 'center', maxWidth: 240 }} />
            </AccField>
            <button className="k-btn k-btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={!codeOk}>Verify email →</button>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button type="button" className="k-link" style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12.5 }}>Resend code</button>
              <button type="button" className="k-link" onClick={() => setStep(0)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12.5 }}>← Back</button>
            </div>
          </form>
        </>)}

        {step === 2 && (<>
          <h1 className="k-onb-h">Add a card to start your trial.</h1>
          {/* Disclosure ABOVE the card field — the legally load-bearing block. */}
          <div style={{ background: 'var(--k-accent-soft)', border: '1px solid oklch(0.45 0.13 255 / 0.25)', borderRadius: 10, padding: '14px 16px', margin: '18px 0 4px', fontSize: 13, lineHeight: 1.65, color: 'var(--k-fg)', maxWidth: 480 }}>
            <strong style={{ fontWeight: 700 }}>Your card is not charged today.</strong> Your 7-day free trial starts now. Unless you cancel before <strong style={{ fontWeight: 700 }}>{chargeDate}</strong>, your subscription begins automatically and this card is charged <strong style={{ fontWeight: 700 }}>$249/month</strong>. We email you today and again 3 days before the charge. Cancel any time in Settings → Billing.
          </div>
          <form className="k-auth-form" onSubmit={(e) => e.preventDefault()} style={{ marginTop: 18, gap: 18 }}>
            <AccField label="Card number"><input className="k-insp-input" inputMode="numeric" value={card} onChange={(e) => setCard(fmtCardNum(e.target.value))} placeholder="1234 5678 9012 3456" autoFocus style={{ ...ACC_INPUT, fontFamily: 'var(--k-font-mono)' }} /></AccField>
            <div style={{ display: 'flex', gap: 10 }}>
              <AccField label="Expiry"><input className="k-insp-input" value={exp} onChange={(e) => setExp(fmtExpiry(e.target.value))} placeholder="MM / YY" style={{ ...ACC_INPUT, fontFamily: 'var(--k-font-mono)', width: 110 }} /></AccField>
              <AccField label="CVC"><input className="k-insp-input" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" style={{ ...ACC_INPUT, fontFamily: 'var(--k-font-mono)', width: 90 }} /></AccField>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--k-fg-4)' }}>
              <Icon d={I.lock} size={12} /> <span>Processed by Stripe — card details never touch Kevin's servers.</span>
            </div>
            {/* Two SEPARATE consents, both unchecked by default. */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.55, color: 'var(--k-fg-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={consentRenew} onChange={(e) => setConsentRenew(e.target.checked)} style={{ marginTop: 2 }} />
              <span>I understand my subscription auto-renews at $249/month after the free trial, and I can cancel any time.</span>
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.55, color: 'var(--k-fg-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} style={{ marginTop: 2 }} />
              <span>I agree to the <a className="k-link" href="25-Legal-hub.html">Terms of Service and Privacy Policy</a>.</span>
            </label>
            <a className={`k-btn k-btn--lg ${(!cardOk || !consentRenew || !consentTerms) ? '' : ''}`} href="59-Onboarding.html"
               style={{ width: '100%', justifyContent: 'center', pointerEvents: (cardOk && consentRenew && consentTerms) ? 'auto' : 'none', opacity: (cardOk && consentRenew && consentTerms) ? 1 : 0.45 }}>
              Start free trial →
            </a>
            <button type="button" className="k-link" onClick={() => setStep(1)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12.5 }}>← Back</button>
          </form>
        </>)}
        </div>
        <div className="k-onb-trust">
          <span><Icon d={I.lock} size={11} /> Stripe-secured checkout</span>
          <span>AES-256 at rest</span>
          <span>TLS 1.3 in transit</span>
        </div>
      </main>

      <footer className="k-onb-bot">Carrier-grade encryption at rest · TLS 1.3 in transit · © 2026</footer>
    </div>
  );
};

// ── SETUP WIZARD ─────────────────────────────────────────────────────────────
// Single centered column — no side panel. Only the three real setup choices are
// numbered; Welcome and Done are bookends, so the count the user sees (1..3)
// matches the number of decisions they actually make.
const STEPS = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'region',  n: 1, label: 'Pricing region' },
  { key: 'export',  n: 2, label: 'Export default' },
  { key: 'done',    label: 'Done' },
];
const ONB_TOTAL = 2;

const OnbCenter = ({ children, step, center }) => (
  <div className="k-onb-page">
    <header className="k-onb-top">
      <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
      <div className="k-onb-dots">
        {STEPS.filter(s => s.n).map(s => (
          <span key={s.key} className={`k-onb-dot ${step.n === s.n ? 'k-onb-dot--on' : ''} ${(step.n > s.n || step.key === 'done') ? 'k-onb-dot--done' : ''}`} title={s.label} />
        ))}
      </div>
    </header>
    <main className={`k-onb-col ${center ? 'k-onb-col--center' : ''}`}>{children}</main>
    <footer className="k-onb-bot">Everything here is a default you can change later in Settings — nothing is locked in.</footer>
  </div>
);

const OnboardingWizard = () => {
  const [step, setStep] = React.useState(0);     // index into STEPS
  const cur = STEPS[step];
  const go = (d) => setStep(s => Math.max(0, Math.min(STEPS.length - 1, s + d)));

  const [fmt, setFmt] = React.useState('Xactimate (Excel)');
  const FORMATS = ['Xactimate (Excel)', 'CSV'];

  return (
    <OnbCenter step={cur} center={cur.key === 'welcome' || cur.key === 'done'}>
      {cur.n && <div className="k-onb-eyebrow">Step {cur.n} of {ONB_TOTAL} · {cur.label}</div>}

      {/* — WELCOME — */}
      {cur.key === 'welcome' && (
        <div>
          <h1 className="k-onb-h">Welcome, Mariana.</h1>
          <p className="k-onb-sub">Two quick steps and you're ready to process content inventories. You can change any of this later in Settings.</p>
          <div className="k-onb-checklist">
            {[
              ['Confirm your pricing region', 'Sets your default sales-tax fallback'],
              ['Pick your export default', 'Xactimate (Excel) or CSV'],
            ].map(([t, s], i) => (
              <div key={i} className="k-onb-check-row">
                <span className="k-onb-check-n">{i + 1}</span>
                <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 1 }}>{s}</div></div>
              </div>
            ))}
          </div>
          <button className="k-btn k-btn--lg" style={{ marginTop: 24 }} onClick={() => go(1)}>Let's go →</button>
        </div>
      )}

      {/* — CARRIER — */}
      {/* — REGION — */}
      {cur.key === 'region' && (
        <div>
          <h1 className="k-onb-h">Where do you work?</h1>
          <p className="k-onb-sub">Your primary metro sets the default sales-tax fallback. Each claim still uses its own loss-ZIP, so this only applies when a ZIP doesn't resolve.</p>
          <div className="k-set-grid2" style={{ marginTop: 20 }}>
            <div className="k-insp-field"><label>Primary city</label><input className="k-insp-input" placeholder="City, ST" /></div>
            <div className="k-insp-field"><label>Default tax rate</label><div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 11px', background: 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 6 }}><input placeholder="0.00" style={{ border: 0, outline: 0, flex: 1, font: 'inherit', fontFamily: 'var(--k-font-mono)' }} /><span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>%</span></div></div>
          </div>
          <div className="k-onb-preview">
            <Icon d={I.spark} size={13} style={{ color: 'var(--k-accent)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)', marginLeft: 8 }}>Each claim still uses its own loss-ZIP for tax and pricing — this is just the fallback when a ZIP doesn't resolve.</span>
          </div>
          <div className="k-onb-nav">
            <button className="k-btn k-btn--ghost" onClick={() => go(-1)}>← Back</button>
            <button className="k-btn" onClick={() => go(1)}>Continue →</button>
          </div>
        </div>
      )}

      {/* — EXPORT DEFAULTS — */}
      {cur.key === 'export' && (
        <div>
          <h1 className="k-onb-h">How do you usually export?</h1>
          <p className="k-onb-sub">Pick a default format for new claims. Depreciation schedules and special-limits caps aren't set here — those come from each claim's policy when you review.</p>
          <div className="k-chip-grid" style={{ marginTop: 20 }}>
            {FORMATS.map(c => (
              <button key={c} type="button" onClick={() => setFmt(c)} className={`k-chip ${fmt === c ? 'k-chip--on' : ''}`}>
                {fmt === c && <Icon d={I.check} size={10} stroke={2.5} />}<span>{c}</span>
              </button>
            ))}
          </div>
          <div className="k-onb-preview">
            <Icon d={I.spark} size={13} style={{ color: 'var(--k-accent)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)', marginLeft: 8 }}>Each export bundles item photos, pricing comps, and a signed audit log. Change the default anytime in Settings → Export defaults.</span>
          </div>
          <div className="k-onb-nav">
            <button className="k-btn k-btn--ghost" onClick={() => go(-1)}>← Back</button>
            <button className="k-btn" onClick={() => go(1)}>Continue →</button>
          </div>
        </div>
      )}

      {/* — DONE — */}
      {cur.key === 'done' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="k-onb-done-burst"><Icon d={I.check} size={34} stroke={2.5} /></div>
          <h1 className="k-onb-h" style={{ marginTop: 18 }}>You're all set.</h1>
          <p className="k-onb-sub" style={{ margin: '8px auto 0', maxWidth: 380 }}>Pricing region set · export default chosen. Your 7-day free trial is running.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
            <button className="k-btn k-btn--lg" style={{ width: '100%', justifyContent: 'center' }}>Start your first claim →</button>
            <a className="k-btn k-btn--ghost k-btn--lg" style={{ width: '100%', justifyContent: 'center' }} href="48-Sample-claim.html">Explore a sample claim first</a>
          </div>
        </div>
      )}
    </OnbCenter>
  );
};

Object.assign(window, { AccountCreate, OnboardingWizard });
