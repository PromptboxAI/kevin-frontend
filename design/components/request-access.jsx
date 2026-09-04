// Request access — agency sign-up flow from the landing page.

const { KevinWordmark, Icon, I, Badge } = window;

const InputField = ({ label, value, placeholder, hint, mono = false, width = '100%', suffix }) => (
  <div className="k-insp-field" style={{ width }}>
    <label>{label}</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 11px', background: 'var(--k-bg)', border: '1px solid var(--k-line)', borderRadius: 6 }}>
      <input
        defaultValue={value}
        placeholder={placeholder}
        style={{
          border: 0, outline: 0, background: 'transparent', flex: 1, font: 'inherit', fontSize: 13,
          fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
          color: 'var(--k-fg)',
        }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>{suffix}</span>}
    </div>
    {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
  </div>
);

const RequestAccess = () => {
  const [carriers, setCarriers] = React.useState(new Set());
  const [volume, setVolume] = React.useState('mid');

  const CARRIERS = [
    'Nationwide', 'Allstate', 'State Farm', 'Travelers', 'Chubb',
    'SageSure', 'Narragansett Bay', 'GEICO', 'Liberty Mutual',
    'AFICS', 'AIG', 'Amica', 'USAA', 'Other (custom)',
  ];
  const togglec = (c) => {
    const n = new Set(carriers);
    n.has(c) ? n.delete(c) : n.add(c);
    setCarriers(n);
  };

  return (
    <div className="k-req">
      <header className="k-nav">
        <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="k-btn k-btn--ghost">Sign in</button>
        </div>
      </header>

      <main className="k-req-main">
        <aside className="k-req-l">
          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Enterprise · teams</div>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '8px 0 14px', lineHeight: 1.04 }}>
            Two or more adjusters,<br />one invoice.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: '0 0 20px', maxWidth: 460 }}>
            Volume licensing for agencies, carriers and TPAs — every adjuster on one bill, with shared carrier profiles and depreciation schedules so two people on the same desk price a claim the same way. Tell us how your team works and we will quote it.
          </p>
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.5, margin: '0 0 32px', maxWidth: 460 }}>
            One adjuster? You don't need this — <a className="k-link" href="58-Account-create.html">start on Pro</a> at $249/mo, unlimited claims with 2,000 line items a month included, and your first 250 line items free with no deadline.
          </p>

          <div className="k-req-bullets">
            <div className="k-req-bullet">
              <span className="k-req-step">1</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>You submit this form</div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 2 }}>~2 minutes · no commitment</div>
              </div>
            </div>
            <div className="k-req-bullet">
              <span className="k-req-step">2</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>A call within two business days</div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 2 }}>30 min · workspace, export defaults, reviewer roles and your carrier profiles, set up together</div>
              </div>
            </div>
            <div className="k-req-bullet">
              <span className="k-req-step">3</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Pilot on your own losses</div>
                <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 2 }}>Your whole team on the free tier, real claims, before a contract exists</div>
              </div>
            </div>
          </div>

          <div className="k-req-quote">
            <div style={{ fontFamily: 'var(--k-font-display)', fontStyle: 'italic', fontSize: 19, color: 'var(--k-fg-2)', lineHeight: 1.35, textWrap: 'balance' }}>
              “Onboarding took one call. By the next claim my whole team was running inventories in Kevin instead of typing them into a spreadsheet.”
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
              M. Delgado · Delgado & Co. Public Adjusting · Tampa, FL
            </div>
          </div>
        </aside>

        <form className="k-req-form" onSubmit={(e) => e.preventDefault()}>
          <section className="k-req-section">
            <div className="k-req-section-hd">
              <span className="k-step-num">01</span>
              <div>
                <div className="k-intake-section-t">About your agency</div>
                <div className="k-intake-section-s">We'll never share these details outside Kevin.</div>
              </div>
            </div>
            <div className="k-req-row">
              <InputField label="Agency name" value="Delgado & Co. Public Adjusting" width="60%" />
              <InputField label="Agency type" value="Public adjusting firm" width="40%" hint="Independent · Public · IA agency · Estate liquidator" />
            </div>
            <div className="k-req-row">
              <InputField label="Headquartered in" value="Tampa, FL" width="55%" />
              <InputField label="Years in business" value="6" mono width="22%" />
              <InputField label="Adjusters on staff" value="8" mono width="22%" />
            </div>
          </section>

          <section className="k-req-section">
            <div className="k-req-section-hd">
              <span className="k-step-num">02</span>
              <div>
                <div className="k-intake-section-t">Your primary contact</div>
                <div className="k-intake-section-s">Who should we set up the call with?</div>
              </div>
            </div>
            <div className="k-req-row">
              <InputField label="Full name" value="Marcus Delgado" width="50%" />
              <InputField label="Title" value="Managing Partner" width="50%" />
            </div>
            <div className="k-req-row">
              <InputField label="Work email" value="marcus@delgadoadjusting.com" width="60%" />
              <InputField label="Phone" value="(813) 555-0142" mono width="40%" />
            </div>
          </section>

          <section className="k-req-section">
            <div className="k-req-section-hd">
              <span className="k-step-num">03</span>
              <div>
                <div className="k-intake-section-t">How you work</div>
                <div className="k-intake-section-s">This determines which carrier profiles we pre-load and how we model your pricing region.</div>
              </div>
            </div>
            <div className="k-insp-field">
              <label>Carriers you commonly work with</label>
              <div className="k-chip-grid">
                {CARRIERS.map(c => (
                  <button key={c} type="button" onClick={() => togglec(c)} className={`k-chip ${carriers.has(c) ? 'k-chip--on' : ''}`}>
                    {carriers.has(c) && <Icon d={I.check} size={10} stroke={2.5} />}
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="k-insp-field" style={{ marginTop: 14 }}>
              <label>Expected claim volume</label>
              <div className="k-volume-grid">
                {[
                  { id: 'low',  label: 'Low',    sub: '< 10 claims/mo'         },
                  { id: 'mid',  label: 'Steady', sub: '10–50 claims/mo'        },
                  { id: 'high', label: 'High',   sub: '50–200 claims/mo'       },
                  { id: 'ent',  label: 'Bulk',   sub: '> 200 claims/mo · est.' },
                ].map(o => (
                  <button key={o.id} type="button" onClick={() => setVolume(o.id)} className={`k-volume ${volume === o.id ? 'k-volume--on' : ''}`}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 4 }}>{o.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="k-insp-field" style={{ marginTop: 14 }}>
              <label>Anything else we should know? <span style={{ color: 'var(--k-fg-4)' }}>(optional)</span></label>
              <textarea className="k-insp-input" rows={3} placeholder="Special workflows, reviewer roles, volume you're planning for, things you've tried before…" />
            </div>
          </section>

          <div className="k-req-foot">
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', maxWidth: 360 }}>
              By submitting you agree to Kevin's <a className="k-link" href="25-Legal-hub.html">Privacy Policy</a> and to us contacting you within two business days. AES-256 at rest, TLS 1.3 in transit — your data stays yours.
            </div>
            <div className="k-hero-actions" style={{ marginTop: 0 }}>
              <a className="k-btn k-btn--ghost" href="51-Book-call.html">Book a call instead</a>
              {/* Submits the form. The label used to read "Request access" while
                  pointing at Book-call, so the primary action skipped the form
                  the page exists to collect. */}
              <button type="submit" className="k-btn k-btn--lg">Request a quote →</button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

window.RequestAccess = RequestAccess;
