// Edge-states gallery — 6 empty / error / loading states in one frame.
// First-time user · Upload failed · No items identified · Processing error
// · Session expired · Export failed (technical) · Suspended · Paused.

const { Icon, I, KevinWordmark, Badge } = window;

// Generic "panel" wrapper — looks like a focused screen with chrome
const StatePanel = ({ title, label, children, dark = false }) => (
  <div className="k-state">
    <div className="k-state-hd">
      <span className="k-state-label">{label}</span>
      <span className="k-state-title">{title}</span>
    </div>
    <div className={`k-state-body ${dark ? 'k-state-body--dark' : ''}`}>
      {children}
    </div>
  </div>
);

const EdgeStates = () => (
  <div className="k-states-page">
    <header className="k-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <KevinWordmark size={16} suffix={true} />
        <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
        <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>Design reference · empty &amp; error states</span>
      </div>
      <Badge tone="quiet">8 states</Badge>
    </header>

    <div className="k-states-body">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>States gallery</div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 32, letterSpacing: '-0.025em', margin: '6px 0 4px', lineHeight: 1.05 }}>
          When things are empty, broken, or in between.
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
          Every state pairs a clear cause with the next reasonable action. Kevin never blames the user, never blocks the workflow, and always lets the adjuster proceed manually.
        </p>
      </div>

      <div className="k-states-grid">

        {/* ── 1 · First-time user · zero claims ───────────── */}
        <StatePanel label="01 · First run" title="Empty: My claims">
          <div className="k-empty">
            <div className="k-empty-art k-empty-art--accent">
              <Icon d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">No claims yet.</div>
            <div className="k-empty-s">Drop a folder of damage photos and Kevin turns them into an Xactimate-ready inventory in minutes.</div>
            <div className="k-fail-acts">
              <a className="k-btn" href="03-Intake.html">Start your first claim →</a>
              <a className="k-btn k-btn--ghost" href="48-Sample-claim.html">Open sample claim</a>
            </div>
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--k-line)', fontSize: 11.5, color: 'var(--k-fg-4)', display: 'flex', gap: 14, justifyContent: 'center' }}>
              <span>Loss ZIP sets the tax rate</span>
              <span>·</span>
              <span>7-day free trial active</span>
            </div>
          </div>
        </StatePanel>

        {/* ── 2 · Upload failed ──────────────────────────── */}
        <StatePanel label="02 · Upload failed" title="Intake · 3 files rejected">
          <div className="k-empty">
            <div className="k-empty-art k-empty-art--warn">
              <Icon d={<><path d="M12 4 2 21h20z"/><path d="M12 10v5M12 18v.5"/></>} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">3 of 50 photos couldn't upload.</div>
            <div className="k-empty-s">Two arrived as empty files (the transfer was cut off) and one is an invisible iOS edit-sidecar — not a photo at all. The other 47 uploaded and are staged.</div>
            <div className="k-fail-list">
              <div className="k-fail-row">
                <Icon d={I.warn} size={11} />
                <span className="k-mono">IMG_2841.heic</span>
                <span>· empty file — the upload was interrupted</span>
                <button className="k-link" style={{ marginLeft: 'auto' }}>Retry</button>
              </div>
              <div className="k-fail-row">
                <Icon d={I.warn} size={11} />
                <span className="k-mono">IMG_2842.heic</span>
                <span>· empty file — the upload was interrupted</span>
                <button className="k-link" style={{ marginLeft: 'auto' }}>Retry</button>
              </div>
              <div className="k-fail-row" style={{ opacity: 0.7 }}>
                <Icon d={I.info} size={11} />
                <span className="k-mono">IMG_2899.AAE</span>
                <span>· non-image sidecar — skipped quietly</span>
              </div>
            </div>
            <div className="k-fail-acts">
              <button className="k-btn">Retry 2 failed</button>
              <a className="k-btn k-btn--ghost" href="73-Photo-staging.html">Continue with 47 →</a>
            </div>
          </div>
        </StatePanel>

        {/* ── 3 · No items identified ───────────────────── */}
        <StatePanel label="03 · No items" title="Worksheet · empty result">
          <div className="k-empty">
            <div className="k-empty-art">
              <Icon d={I.search} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">Kevin couldn't identify any items in 41 photos.</div>
            <div className="k-empty-s">Looks like most shots are of the room itself (walls, floors, structure) rather than personal property. That's expected for a structure claim — but Kevin only handles contents.</div>
            <div style={{ background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 8, padding: '12px 14px', marginTop: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--k-fg)', marginBottom: 4 }}>Want to add items manually?</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>You can add line items by hand and Kevin will price each one — same as if it had found them.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <a className="k-btn" href="75-Written-import.html"><Icon d={I.plus} size={12}/> Add items manually</a>
              <a className="k-btn k-btn--ghost" href="03-Intake.html">Upload more photos</a>
            </div>
          </div>
        </StatePanel>

        {/* ── 4 · Processing error ──────────────────────── */}
        <StatePanel label="04 · Processing error" title="Worksheet · partial result">
          <div className="k-empty">
            <div className="k-empty-art k-empty-art--warn">
              <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16v.5"/></>} size={28} stroke={1.4} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Processing stalled at 73%.</span>
              <Badge tone="warn" dot={true}>Partial</Badge>
            </div>
            <div className="k-empty-s">Kevin read 36 of 50 photos and found 31 items before a vision hiccup. Your work is saved — you can keep editing the items already found while the rest re-runs.</div>
            <div className="k-fail-list">
              <div className="k-fail-row">
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>err-vp-422 ·</span>
                <span>Vision model · rate limit · auto-retrying in 90s</span>
              </div>
              <div className="k-fail-row">
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>queued ·</span>
                <span>44 photos waiting · up to 57 items remaining</span>
              </div>
            </div>
            <div className="k-fail-acts">
              <button className="k-btn">Retry now</button>
              <a className="k-btn k-btn--ghost" href="05-Worksheet-flat.html">Open partial worksheet →</a>
              <button className="k-btn k-btn--ghost">Contact support</button>
            </div>
          </div>
        </StatePanel>

        {/* ── 5 · Session expired ───────────────────────── */}
        <StatePanel label="05 · Session expired" title="Modal · re-auth">
          <div className="k-empty">
            <div className="k-empty-art">
              <Icon d={<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">Your session expired for security.</div>
            <div className="k-empty-s">After 8 hours idle, we sign you out so an unattended laptop can't leak claim data. Your work since the last save is preserved — you'll land back where you were.</div>
            <div style={{ marginTop: 18, padding: 14, background: 'var(--k-bg-2)', borderRadius: 8, textAlign: 'left' }}>
              <div className="k-insp-field" style={{ marginBottom: 10 }}>
                <label>Password</label>
                <input className="k-insp-input" type="password" placeholder="Your password" autoFocus />
              </div>
              <a className="k-btn k-btn--lg" style={{ width: '100%', justifyContent: 'center' }} href="05-Worksheet-flat.html">Continue where you left off →</a>
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--k-fg-4)' }}>
              <button className="k-link">Sign out fully</button>
            </div>
          </div>
        </StatePanel>

        {/* ── 6 · Export failed — TECHNICAL only (rule 16: Kevin never blocks on readiness) ── */}
        <StatePanel label="06 · Export failed" title="Exports · technical error">
          <div className="k-empty">
            <div className="k-empty-art k-empty-art--warn">
              <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16v.5"/></>} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">Export failed — something went wrong on our end.</div>
            <div className="k-empty-s">The file didn't finish generating. Your claim and every line item are untouched — this is a technical failure, not a problem with your inventory. Retrying usually resolves it.</div>
            <div className="k-fail-list">
              <div className="k-fail-row">
                <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>ref ·</span>
                <span className="k-mono">exp-9f27-4c1a</span>
                <span style={{ color: 'var(--k-fg-4)' }}>· quote this if you contact support</span>
              </div>
            </div>
            <div className="k-fail-acts">
              <button className="k-btn">Retry export</button>
              <a className="k-btn k-btn--ghost" href="38-Contact.html">Contact support</a>
            </div>
          </div>
        </StatePanel>

        {/* ── 7 · Account suspended — payment failed ───────── */}
        <StatePanel label="07 · Suspended" title="Sign-in · payment required">
          <div className="k-empty">
            <div className="k-empty-art k-empty-art--warn">
              <Icon d={<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">Your account is suspended.</div>
            <div className="k-empty-s">Your card was declined and the retries over the last 7 days didn't go through, so access is paused until the balance is settled. Every claim, worksheet and export is safe — nothing has been deleted.</div>
            <div className="k-fail-list">
              <div className="k-fail-row">
                <span className="k-mono" style={{ color: 'var(--k-fg-4)' }}>balance ·</span>
                <span>$249.00 · Pro renewal · Sep 1</span>
              </div>
            </div>
            <div className="k-fail-acts">
              <button className="k-btn">Update card &amp; pay $249 →</button>
              <a className="k-btn k-btn--ghost" href="38-Contact.html">Contact us — we'll sort it out</a>
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--k-fg-4)' }}>Paying restores access immediately. Questions about the charge? kevin@kevin.co</div>
          </div>
        </StatePanel>

        {/* ── 8 · Account paused — voluntary, no billing ───── */}
        <StatePanel label="08 · Paused" title="Sign-in · account paused">
          <div className="k-empty">
            <div className="k-empty-art">
              <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/></>} size={28} stroke={1.4} />
            </div>
            <div className="k-empty-t">Your account is paused.</div>
            <div className="k-empty-s">You asked us to pause billing while you're not running claims — your card isn't charged and sign-in is off, but everything you built is exactly where you left it.</div>
            <div className="k-fail-acts">
              <button className="k-btn">Resume · restart my subscription →</button>
              <a className="k-btn k-btn--ghost" href="38-Contact.html">Contact us</a>
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--k-fg-4)' }}>Resuming charges the card on file and unlocks the account immediately — a fresh billing cycle starts today.</div>
          </div>
        </StatePanel>
      </div>
    </div>
  </div>
);

window.EdgeStates = EdgeStates;
