// Utility pages — destinations for previously-orphan buttons.
//   SignOut · BookCall · WatchDemo · Careers · AddItemModal · SSOSignIn
const { MktNav, MktFooter } = window;   // shared — defined in marketing-pages.jsx

const { KevinWordmark, Icon, I, Badge, Thumb } = window;

// ───────────────────────────────────────────────────────────────────────────
// 1 · SIGN OUT — post-sign-out confirmation
// ───────────────────────────────────────────────────────────────────────────
const SignOut = () => (
  <div className="k-auth">
    <div className="k-auth-l">
      <div style={{ padding: '24px 32px' }}><KevinWordmark href="02-Landing.html" size={18} suffix={true} /></div>
      <div className="k-auth-l-body">
        <div className="k-empty-art k-empty-art--accent" style={{ marginBottom: 18 }}>
          <Icon d={I.check} size={26} stroke={1.6} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Signed out</div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.025em', margin: '8px 0 10px', lineHeight: 1.05 }}>That's you, signed out.</h1>
        <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 26px', lineHeight: 1.5 }}>
          Every claim, export and photo is saved exactly where you left it. Nothing here expires.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a className="k-btn k-btn--lg" href="00-Sign-in.html" style={{ width: '100%', justifyContent: 'center' }}>Sign back in →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="02-Landing.html" style={{ width: '100%', justifyContent: 'center' }}>Back to kevin.co</a>
        </div>

        <div className="k-signout-note">
          <Icon d={I.lock} size={13} />
          <span>On a shared computer, close the browser to clear the session completely. To sign out everywhere else, use <a href="41-Security.html" style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>active sessions</a> after signing back in.</span>
        </div>
      </div>
      <div className="k-auth-l-foot">
        <span>AES-256 at rest</span><span>·</span><span>TLS 1.3 in transit</span><span>·</span><span>© 2026</span>
      </div>
    </div>
    <div className="k-auth-r">
      <div className="k-auth-r-inner">
        <div style={{ fontFamily: 'var(--k-font-display)', fontStyle: 'italic', fontSize: 26, color: 'rgba(255,255,255,0.92)', lineHeight: 1.25, maxWidth: 380, textWrap: 'balance' }}>
          "Two hundred photos in the morning, a finished contents list before lunch. That used to be a full weekend."
        </div>
        <div style={{ marginTop: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--k-font-mono)' }}>Kevin Godfrey · Long Island Public Adjusters, LLC</div>
      </div>
    </div>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 2 · BOOK CALL — Calendly INLINE EMBED.
// Scheduling is NOT built in-house: availability, timezones, double-booking,
// calendar sync, reminders, reschedule/cancel are a solved problem. The right
// column is the live Calendly widget region; the left column is ours and keeps
// selling while they pick a time. Engineering: drop Calendly's script + the
// <div class="calendly-inline-widget" data-url="..."> in place of .k-cal-embed
// and delete the placeholder. Prefill name/email/answers via Calendly's
// ?name=&email=&a1= query params if we ever capture them before the widget.
// ───────────────────────────────────────────────────────────────────────────
const BC_POINTS = [
  ['Bring a real claim', 'Drop your photos on the call. You leave with a finished inventory, not a follow-up email.'],
  ['We set up your defaults', 'Depreciation schedule, export format, tax region — configured while we talk.'],
  ['No deck', 'We open the app and work. If it is not a fit in ten minutes, we will tell you.'],
];

const BookCall = () => (
  <div className="k-landing">
    <MktNav />
    <main className="k-mkt-main">
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 40px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Badge tone="accent" dot={true}>30 minutes · no slides</Badge>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 44, letterSpacing: '-0.028em', margin: '16px 0 12px', lineHeight: 1.05 }}>
            Bring a real claim. We'll run it together.
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--k-fg-3)', margin: '0 auto', maxWidth: 560, lineHeight: 1.55 }}>
            Pick a time that works. You'll get a calendar invite with a video link — nothing else to fill out.
          </p>
        </div>

        <div className="k-cal-layout">
          <div className="k-cal-aside">
            {BC_POINTS.map(([t, d], i) => (
              <div key={i} className="k-cal-point">
                <span className="k-cal-point-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="k-cal-point-body">
                  <span className="k-cal-point-t">{t}</span>
                  <span className="k-cal-point-d">{d}</span>
                </span>
              </div>
            ))}
            <div className="k-cal-who">
              <img src="../assets/kevin-godfrey.png" alt="Kevin Godfrey" className="k-cal-who-img" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>You'll talk to Kevin Godfrey</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, lineHeight: 1.45 }}>22 years adjusting, 10,000+ claims settled. He built Kevin.</div>
              </div>
            </div>
            <div className="k-cal-alt">
              Rather write than talk? <a href="38-Contact.html" style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>Send us a note</a> or email <a href="mailto:kevin@kevin.co" style={{ color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>kevin@kevin.co</a>.
            </div>
          </div>

          {/* Calendly inline widget mounts here — see note at top of section. */}
          <div className="k-cal-embed" data-calendly-embed="true">
            <div className="k-cal-embed-ph">
              <Icon d={I.calendar} size={22} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--k-fg-2)' }}>Calendly scheduler</div>
              <div style={{ fontSize: 12, color: 'var(--k-fg-4)', lineHeight: 1.5, maxWidth: 300 }}>
                Live availability, timezone detection, and the calendar invite are handled by Calendly. The inline widget renders in this region at full height.
              </div>
              <code className="k-cal-embed-code">calendly.com/kevin-co/30min</code>
            </div>
          </div>
        </div>
      </section>
    </main>
    <MktFooter />
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 3 · WATCH DEMO — self-guided walkthrough (no recorded video yet)
// ───────────────────────────────────────────────────────────────────────────
// There is no recorded demo yet — the product isn't built. A fake player with a
// frozen timestamp is a lie the visitor discovers on click, so this page is a
// SELF-GUIDED walkthrough: every step opens the real screen in the prototype.
// When a recording exists, swap the step list for the player and keep the CTA.
// No recorded demo yet — the product isn't built. Instead of a fake player OR a
// set of jump links, this page walks through what the adjuster actually DOES at
// each step, with the real numbers from the Reyes kitchen-fire claim. When a
// recording exists, put the player above the steps and keep the steps as the
// written version.
const DEMO_STEPS = [
  ['01', 'Start the claim', '~1 min', [
    'Enter the claim number, policy number, date and cause of loss.',
    'Pick the carrier and the insured; type the loss address — the ZIP auto-resolves the sales-tax rate that lands in every line.',
    'Choose the contents coverage label off the declarations page (Coverage C, Personal Property, Contents…) and enter the limit, so Kevin warns you as the inventory approaches it.',
  ]],
  ['02', 'Drop the photos', '~2 min for hundreds of photos', [
    'Drag in a folder, a phone dump, or a whole .zip — no total-size cap, up to 15 MB per photo. Duplicates are hashed out on arrival.',
    'Kevin pre-groups shots taken seconds apart into photo sets, so three angles of one sofa become one line item, not three.',
    'Review the proposed sets: merge two that belong together, split one that does not, exclude context shots, and optionally add a note — additional identification for Kevin ("the TV is the Sony, not the Samsung").',
  ]],
  ['03', 'Let Kevin work', '~8 min, unattended', [
    'Each set is identified — item, make, model number off the plate or barcode where it is readable.',
    'Kevin assigns a content class, then pulls three live retail comps per item and takes the median as RCV.',
    'Depreciation comes from the schedule on the claim — straight-line by default — and ACV is derived from it. Anything Kevin cannot price confidently arrives blank instead of guessed.',
  ]],
  ['04', 'Review the worksheet', '20–40 min for a few hundred lines', [
    'One grid, every cell editable: room, quantity, description, make, model, class, unit cost, age and depreciation.',
    'Click a row number to open the item panel — source photo, the three comps with dated proof links, and the depreciation math. Pin it to keep it beside the grid as you work down the list.',
    'Fix a bad identification by editing the description and re-pricing against fresh comps; type a price for anything left blank. Filter by room, group by class, and check the special-limits flags.',
  ]],
  ['05', 'Export and send', '~1 min', [
    'Xactimate-ready .xlsx on the XactContents template — column parity, so it imports without cleanup.',
    'Or a client-facing PDF inventory, or the full bundle: spreadsheet, PDF, every photo, and the audit log.',
    'Download it or mint an expiring share link. Kevin never pushes into a carrier system — you send the file.',
  ]],
];

const WatchDemo = () => (
  <div className="k-landing">
    <MktNav />
    <main className="k-mkt-main">
      <section style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', padding: '52px 40px 30px' }}>
        <Badge tone="accent" dot={true}>Written walkthrough</Badge>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 48, letterSpacing: '-0.028em', margin: '18px 0 14px', lineHeight: 1.05 }}>
          Every step, start to export.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Exactly what you do on a real kitchen-fire claim — 50 photos in, a 44-line inventory out, about 20 minutes of your time.
        </p>
      </section>

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px' }}>
        <div className="k-demo-steps">
          {DEMO_STEPS.map(([n, t, time, items], i) => (
            <div key={i} className="k-demo-step">
              <div className="k-demo-step-hd">
                <span className="k-demo-step-n">{n}</span>
                <span className="k-demo-step-t">{t}</span>
                <span className="k-demo-step-time">{time}</span>
              </div>
              <ul className="k-demo-step-list">
                {items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="k-demo-note">
          <Icon d={I.info} size={14} />
          <span>Prefer to watch? We're recording a walkthrough as we finish the build — <a href="51-Book-call.html" style={{ fontSize: 'inherit', color: 'var(--k-accent)', fontWeight: 600, textDecoration: 'underline' }}>book a call</a> and we'll walk you through it live in the meantime.</span>
        </div>
      </section>

      <section className="k-mkt-cta" style={{ marginTop: 44 }}>
        <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.028em', margin: '0 0 14px', lineHeight: 1.05, textAlign: 'center' }}>Your 7-day free trial starts now.</h2>
        <div className="k-hero-actions" style={{ marginTop: 0 }}>
          <a className="k-btn k-btn--lg" href="58-Account-create.html">Start a new claim →</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="48-Sample-claim.html">Open the sample claim</a>
        </div>
      </section>
      <MktFooter />
    </main>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 4 · CAREERS — open roles list
// ───────────────────────────────────────────────────────────────────────────
const Careers = () => {
  const ROLES = [
    { team: 'Claims',       title: 'Adjuster in residence',                        loc: 'Remote (US)', type: 'Part-time / contract', new: true },
  ];
  const TEAMS = [...new Set(ROLES.map(r => r.team))];
  return (
    <div className="k-landing">
      <MktNav />
      <main className="k-mkt-main">
        <section style={{ maxWidth: 920, margin: '0 auto', padding: '60px 40px 40px' }}>
          <Badge tone="accent" dot={true}>We're hiring carefully</Badge>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 56, letterSpacing: '-0.028em', margin: '18px 0 16px', lineHeight: 1.02 }}>Open roles.</h1>
          <p style={{ fontSize: 16, color: 'var(--k-fg-2)', lineHeight: 1.55, margin: 0, maxWidth: 600 }}>
We're three people in Long Island, NY, and we hire slowly. If you've settled a claim, run an estate sale, or shipped software that people use all day to do their job, we want to hear from you.
          </p>
        </section>

        <section style={{ maxWidth: 920, margin: '0 auto', padding: '0 40px 60px' }}>
          {TEAMS.map(team => (
            <div key={team} style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: '0 0 10px' }}>{team}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROLES.filter(r => r.team === team).map((r, i) => (
                  <a key={i} className="k-career-row" href={`mailto:kevin@kevin.co?subject=${encodeURIComponent(r.title + ' — application')}`}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</span>
                        {r.new && <Badge tone="ok">New</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--k-fg-4)', marginTop: 3, fontFamily: 'var(--k-font-mono)' }}>{r.loc} · {r.type}</div>
                    </div>
                    <Icon d={I.chevright} size={14} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="k-mkt-band" style={{ maxWidth: 1180, margin: '0 auto 60px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-accent)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Don't see your role?</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.022em', margin: '8px 0 8px' }}>Send us a note anyway.</h2>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 480 }}>If you've spent time in insurance claims, restoration, estate sales, or content valuation — we want to talk even if there isn't a posted role.</p>
          </div>
          <a className="k-btn" href="mailto:kevin@kevin.co">kevin@kevin.co</a>
        </section>

        <MktFooter />
      </main>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// 5 · ADD ITEM — PARKED / UNREACHABLE BY DESIGN.
// No screen links here. The worksheet's own "Add item" button (and Enter on the
// last row) appends an inline blank row instead — faster for high-speed entry —
// and a photo is attached from the item drawer afterwards. This modal is kept
// intact in case user feedback asks for a form-based add with a photo up front;
// if that happens, wire it from a split-button next to Add item. Do NOT wire it
// as the default add path, and do not delete it.
// ───────────────────────────────────────────────────────────────────────────
const AddItemModal = () => (
  <div className="k-export-stage">
    {/* dimmed worksheet behind */}
    <div className="k-export-bg">
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--k-line)' }}>
        <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
      </div>
      <div style={{ flex: 1, opacity: 0.4, padding: '8px 16px' }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--k-line)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 3, background: 'var(--k-bg-3)' }} />
            <div style={{ flex: 1, height: 10, borderRadius: 99, background: 'var(--k-bg-2)' }} />
          </div>
        ))}
      </div>
    </div>
    <div className="k-export-scrim" />

    <div className="k-export-modal" style={{ maxWidth: 600 }}>
      <div className="k-export-hd">
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Add a line item</div>
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 0' }}>Add an item</h2>
        </div>
        <a className="k-icon-btn" href="05-Worksheet-flat.html" style={{ width: 32, height: 32 }} title="Close"><Icon d={I.close} size={16} /></a>
      </div>

      <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="k-insp-field">
          <label>Description</label>
          <input className="k-insp-input" placeholder="e.g. Velvet armchair, oxblood" autoFocus />
          <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Manually added items aren't auto-priced. Enter a unit cost, or use <strong style={{ color: 'var(--k-fg-3)', fontWeight: 600 }}>Edit &amp; re-price</strong> in the item panel to pull comps.</span>
        </div>

        <div className="k-insp-field">
          <label>Room / Area</label>
          <input className="k-insp-input" placeholder="e.g. Kitchen, Master closet, Garage" />
        </div>

        <div className="k-set-grid2">
          <div className="k-insp-field"><label>Make / Mfr</label><input className="k-insp-input" placeholder="Brand" /></div>
          <div className="k-insp-field"><label>Model #</label><input className="k-insp-input" placeholder="SKU or model number" style={{ fontFamily: 'var(--k-font-mono)' }} /></div>
        </div>

        <div className="k-insp-field">
          <label>Content class</label>
          <select className="k-insp-input" defaultValue="">
            <option value="" disabled>— pick a class —</option>
            {window.PCS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="k-set-grid2" style={{ gridTemplateColumns: '90px 1fr 1fr' }}>
          <div className="k-insp-field"><label>Qty</label><input className="k-insp-input" defaultValue="1" style={{ fontFamily: 'var(--k-font-mono)' }} /></div>
          <div className="k-insp-field"><label>Age (yrs)</label><input className="k-insp-input" defaultValue="1" style={{ fontFamily: 'var(--k-font-mono)' }} /></div>
          <div className="k-insp-field"><label>Unit cost ($)</label><input className="k-insp-input" placeholder="0.00" style={{ fontFamily: 'var(--k-font-mono)' }} /></div>
        </div>

        <div className="k-insp-field">
          <label>Photo · optional</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', border: '1px dashed var(--k-line-2)', borderRadius: 8, background: 'var(--k-bg-2)' }}>
            <Icon d={I.upload} size={18} />
            <div style={{ flex: 1, fontSize: 13 }}>Drag a photo or <button className="k-link">browse</button></div>
            <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>JPG · PNG · HEIC</span>
          </div>
        </div>
      </div>

      <div className="k-export-foot">
        <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>Appends to the end of the inventory as an ordinary line item.</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="k-btn k-btn--ghost" href="05-Worksheet-flat.html">Cancel</a>
          <a className="k-btn" href="05-Worksheet-flat.html">Add item →</a>
        </div>
      </div>
    </div>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────
// 6 · SSO SIGN-IN — the "Continue with Google" path, split out from 00-Sign-in
// so the passwordless options have room to explain themselves. No SAML/Okta/
// OneLogin: we run our own accounts plus Google, and a passkey once the account
// exists. Microsoft was dropped — adjusters are not a Microsoft-tenant audience.
// ─────────────────────────────────────────────────────────────────
const SSOSignIn = () => (
  <div className="k-auth">
    <div className="k-auth-l">
      <div style={{ padding: '24px 32px' }}><KevinWordmark href="02-Landing.html" size={18} suffix={true} /></div>
      <div className="k-auth-l-body">
        <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sign in</div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.025em', margin: '8px 0 10px', lineHeight: 1.05 }}>Welcome back.</h1>
        <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 26px', lineHeight: 1.5 }}>
          Continue with Google, use a passkey, or sign in with your email and password.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a className="k-sso-row" href="01-My-claims.html">
            <span className="k-sso-mark" style={{ background: '#fff', border: '1px solid var(--k-line)' }}><window.GoogleG size={18} /></span>
            <span className="k-sso-body">
              <span className="k-sso-t">Continue with Google</span>
              <span className="k-sso-d">Fastest if your work email is a Google account</span>
            </span>
            <Icon d={I.chevright} size={13} />
          </a>
          <a className="k-sso-row" href="01-My-claims.html">
            <span className="k-sso-mark" style={{ background: 'var(--k-accent)' }}><Icon d={I.lock} size={13} /></span>
            <span className="k-sso-body">
              <span className="k-sso-t">Use a passkey</span>
              <span className="k-sso-d">Set one up in Settings → Security after your first sign-in</span>
            </span>
            <Icon d={I.chevright} size={13} />
          </a>
        </div>

        <div className="k-auth-or"><span>or with email</span></div>

        <div className="k-insp-field">
          <label>Work email</label>
          <input className="k-insp-input" placeholder="you@example.com" autoFocus style={{ fontSize: 14, padding: '11px 13px' }} />
        </div>
        <div className="k-insp-field" style={{ marginTop: 10 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Password</span>
            <a className="k-link" href="45-Forgot-password.html">Forgot?</a>
          </label>
          <input className="k-insp-input" type="password" placeholder="Your password" style={{ fontSize: 14, padding: '11px 13px' }} />
        </div>
        <a className="k-btn k-btn--lg" href="01-My-claims.html" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>Sign in →</a>

        <div style={{ marginTop: 24, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
          New here? <a className="k-link" style={{ fontSize: 12.5 }} href="15-Request-access.html">Talk to us about your team →</a>
        </div>
      </div>
      <div className="k-auth-l-foot">
        <span>AES-256 at rest</span><span>·</span><span>TLS 1.3 in transit</span><span>·</span><span>© 2026</span>
      </div>
    </div>
    <div className="k-auth-r">
      <div className="k-auth-r-inner">
        <div style={{ fontFamily: 'var(--k-font-display)', fontStyle: 'italic', fontSize: 26, color: 'rgba(255,255,255,0.92)', lineHeight: 1.25, maxWidth: 380, textWrap: 'balance' }}>
          "I drop in a folder of photos and walk away. By the time I'm back, every item's identified, priced, and ready to review. What used to be two days is now an afternoon."
        </div>
        <div style={{ marginTop: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--k-font-mono)' }}>Kevin Godfrey · Long Island Public Adjusters, LLC</div>
      </div>
    </div>
  </div>
);

Object.assign(window, { SignOut, BookCall, WatchDemo, Careers, AddItemModal, SSOSignIn });
