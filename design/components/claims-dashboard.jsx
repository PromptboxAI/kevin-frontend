// My Claims dashboard — landing screen for returning users.
// Also includes a sign-in screen for first-time auth.

const { KevinWordmark, Icon, I, Badge, fmtUSDshort } = window;

// ─── Sign in ───────────────────────────────────────────────────
const SignIn = () => (
  <div className="k-auth">
    <div className="k-auth-l">
      <div style={{ padding: '24px 32px' }}>
        <KevinWordmark href="02-Landing.html" size={18} suffix={true} />
      </div>
      <div className="k-auth-l-body">
        <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sign in</div>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 40, letterSpacing: '-0.025em', margin: '8px 0 10px', lineHeight: 1.05 }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '0 0 28px', lineHeight: 1.5 }}>
          Your claims, exports, and inventories — all where you left them.
        </p>

        <form className="k-auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="k-insp-field">
            <label>Work email</label>
            <input className="k-insp-input" placeholder="you@example.com" />
          </div>
          <div className="k-insp-field">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Password</span>
              <a className="k-link" href="45-Forgot-password.html">Forgot?</a>
            </label>
            <input className="k-insp-input" type="password" placeholder="Your password" />
          </div>
          <label className="k-toggle" style={{ marginTop: 4 }}>
            <input type="checkbox" defaultChecked />
            <span className="k-toggle-box"><Icon d={I.check} size={10} stroke={2.5} /></span>
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)' }}>Keep me signed in on this device</span>
          </label>
          <a className="k-btn k-btn--lg" href="01-My-claims.html" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>Sign in →</a>
        </form>

        <div className="k-auth-or"><span>or</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a className="k-btn k-btn--ghost k-btn--lg" href="01-My-claims.html" style={{ width: '100%', justifyContent: 'center', gap: 10, background: '#fff', borderColor: 'var(--k-line-2, var(--k-line))', color: 'var(--k-fg)', fontWeight: 600 }}><window.GoogleG size={16} /> Continue with Google</a>
          <a className="k-btn k-btn--ghost k-btn--lg" href="01-My-claims.html" style={{ width: '100%', justifyContent: 'center' }}><Icon d={I.lock} size={13} /> Use a passkey</a>
        </div>

        <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
          New to Kevin? <a className="k-link" style={{ fontSize: 12.5 }} href="58-Account-create.html">Create an account →</a>
        </div>
      </div>
      <div className="k-auth-l-foot">
        <span>AES-256 at rest</span>
        <span>·</span>
        <span>TLS 1.3 in transit</span>
        <span>·</span>
        <span>© 2026</span>
      </div>
    </div>

    {/* — Right side: visual hook — */}
    <div className="k-auth-r">
      <div className="k-auth-r-inner">
        <div style={{ fontFamily: 'var(--k-font-display)', fontStyle: 'italic', fontSize: 26, color: 'rgba(255,255,255,0.92)', lineHeight: 1.25, maxWidth: 380, textWrap: 'balance' }}>
          “I used to spend the morning typing what I shot the night before. Now I spend it reviewing.”
        </div>
        <div style={{ marginTop: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--k-font-mono)' }}>
          Kevin Godfrey · Long Island Public Adjusters, LLC · Long Island, NY
        </div>
        <div style={{ marginTop: 60, display: 'flex', gap: 32, fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          <div>
            <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--k-font-display)', fontStyle: 'italic', textTransform: 'none', letterSpacing: '-0.02em', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>310+</div>
            <div style={{ marginTop: 6 }}>Claims processed</div>
          </div>
          <div>
            <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--k-font-display)', fontStyle: 'italic', textTransform: 'none', letterSpacing: '-0.02em', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>430K</div>
            <div style={{ marginTop: 6 }}>Items inventoried</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── My Claims dashboard ─────────────────────────────────────────
const CLAIMS = window.KEVIN_CLAIMS;

// Contract §5b — derived, never set by hand.
const STATUS_BADGE = {
  draft:      { tone: 'quiet',  label: 'Draft' },
  exported:   { tone: 'quiet',  label: 'Exported' },
  processing: { tone: 'accent', label: 'Processing' },
  in_review:  { tone: 'ok',     label: 'In review' },
  review:     { tone: 'ok',     label: 'In review' },
  open:       { tone: 'quiet',  label: 'Open' },
  closed:     { tone: 'quiet',  label: 'Closed' },
  // Archived was unreachable until the archive action was wired, so the row
  // rendered the raw key. It outranks every other derived status.
  archived:   { tone: 'quiet',  label: 'Archived' },
};
// A claim stays OPEN through draft → processing → review → exported. Exporting is
// not closing — adjusters routinely export, get carrier feedback, and revise.
// Only the adjuster explicitly marking it Closed (or archiving it) takes it out
// of the open count.
// Backend reality (7440c90 · 6959f37 · 63f0bd2, migration 0029 w/ closed_at):
// SIX derived statuses, top-down — archived (hidden, outranks all) → closed
// (SETTLED, still visible) → exported → draft → processing → in_review. Open =
// anything not closed/archived (Xactimate's three-way grouping). Close/reopen/
// archive/unarchive are idempotent no-body POSTs whose response carries the
// derived status AFTER the change — apply verbatim, never re-derive. The Closed
// chip maps to `closed`; only Archived hides (?status=archived reaches them).
// ?status= filtering is fixed (derived in SQL; count/pagination consistent).
// photo_count rides every claim row (staged + attached).
const CLOSED_STATUSES = ['closed', 'archived'];

// ─── Duplicate-claim modal — clones a claim, requires a unique name ───
const DuplicateClaimModal = ({ claim, onClose }) => {
  const existing = CLAIMS.map(c => c.name.toLowerCase());
  const [name, setName] = React.useState(`${claim.name} (copy)`);
  const trimmed = name.trim();
  const dupe = existing.includes(trimmed.toLowerCase());
  const invalid = !trimmed || dupe;
  return (
    <div className="k-export-stage" style={{ position: 'fixed', inset: 0, background: 'transparent', height: '100%', zIndex: 100 }}>
      <div className="k-export-scrim" onClick={onClose} />
      <div className="k-export-modal" style={{ maxWidth: 480 }}>
        <div className="k-export-hd">
          <div>
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Duplicate claim</div>
            <div style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', marginTop: 2 }}>Make a copy</div>
          </div>
          <button className="k-btn k-btn--ghost" onClick={onClose} style={{ padding: 6, lineHeight: 0 }}><span style={{ display: 'inline-flex', transform: 'rotate(45deg)' }}><Icon d={I.plus} size={16} /></span></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <window.IntakeField label="New claim name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Claim name" width="100%" hint={dupe ? undefined : 'Must be unique — no two claims can share a name.'} />
          {dupe && <div style={{ fontSize: 12, color: 'var(--k-danger)', marginTop: -6 }}>A claim named “{trimmed}” already exists. Choose a different name.</div>}
          <div style={{ background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
            Copies all <strong style={{ color: 'var(--k-fg-2)' }}>{claim.items} items</strong>, {claim.photos} photos, content classes, valuation basis, and depreciation settings. A fresh claim number is assigned. The original is left untouched.
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="k-btn k-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="k-btn" disabled={invalid}><Icon d={I.copy} size={12} /> Create copy</button>
        </div>
      </div>
    </div>
  );
};

// ─── Archive / delete confirm ────────────────────────────────────
// Archiving is reversible and the claim stays reachable under the Archived
// filter; delete is permanent. It's the customer's account — both are always
// available, never blocked.
const ClaimArchiveModal = ({ claim, mode, onClose, onConfirm }) => {
  const del = mode === 'delete';
  const [typed, setTyped] = React.useState('');
  const ok = !del || typed.trim().toUpperCase() === 'DELETE';
  return (
    <div className="k-export-stage" style={{ position: 'fixed', inset: 0, background: 'transparent', height: '100%', zIndex: 100 }}>
      <div className="k-export-scrim" onClick={onClose} />
      <div className="k-export-modal" style={{ maxWidth: 470 }}>
        <div className="k-export-hd">
          <div>
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: del ? 'var(--k-danger)' : 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{del ? 'Delete claim' : 'Archive claim'}</div>
            <div style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', marginTop: 2 }}>{claim.name}</div>
          </div>
          <button className="k-btn k-btn--ghost" onClick={onClose} style={{ padding: 6, lineHeight: 0 }}><span style={{ display: 'inline-flex', transform: 'rotate(45deg)' }}><Icon d={I.plus} size={16} /></span></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--k-bg-2)', border: '1px solid ' + (del ? 'var(--k-danger)' : 'var(--k-line)'), borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: 'var(--k-fg-2)', lineHeight: 1.6 }}>
            {del ? (
              <>Permanently deletes <strong>{claim.items} items</strong>, {claim.photos} photos, every export, and the audit log. <strong style={{ color: 'var(--k-danger)' }}>This cannot be undone.</strong> Download an export first if you may need it later.</>
            ) : (
              <>Moves this claim out of your active list. Everything is kept — items, photos, exports, audit log — and you can reopen or unarchive it any time from the <strong>Archived</strong> filter.</>
            )}
          </div>
          {del && <window.IntakeField label="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" mono width="100%" />}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="k-btn k-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="k-btn" disabled={!ok} onClick={() => { if (!ok) return; onConfirm && onConfirm(); onClose(); }} style={del ? { background: 'var(--k-danger)', borderColor: 'var(--k-danger)' } : undefined}>
            <Icon d={del ? I.trash : I.box} size={12} /> {del ? 'Delete permanently' : 'Archive claim'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Export-claim modal — Save As with format + filename ─────────
const EXPORT_FORMATS = [
  { id: 'xlsx', ext: '.xlsx', label: 'Xactimate (Excel)', sub: 'XactContents import template' },
  { id: 'pdf',  ext: '.pdf',  label: 'PDF inventory',      sub: 'Printable, carrier-ready document' },
];
const ExportClaimModal = ({ claim, onClose }) => {
  const [fmt, setFmt] = React.useState('xlsx');
  const slug = claim.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const [fname, setFname] = React.useState(`${claim.id}-${slug}`);
  const cur = EXPORT_FORMATS.find(f => f.id === fmt);
  const invalid = !fname.trim();
  return (
    <div className="k-export-stage" style={{ position: 'fixed', inset: 0, background: 'transparent', height: '100%', zIndex: 100 }}>
      <div className="k-export-scrim" onClick={onClose} />
      <div className="k-export-modal" style={{ maxWidth: 500 }}>
        <div className="k-export-hd">
          <div>
            <div style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Export · {claim.id}</div>
            <div style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', marginTop: 2 }}>Save inventory as…</div>
          </div>
          <button className="k-btn k-btn--ghost" onClick={onClose} style={{ padding: 6, lineHeight: 0 }}><span style={{ display: 'inline-flex', transform: 'rotate(45deg)' }}><Icon d={I.plus} size={16} /></span></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--k-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXPORT_FORMATS.map(f => (
                <button key={f.id} onClick={() => setFmt(f.id)} style={{ textAlign: 'left', padding: '11px 13px', borderRadius: 8, cursor: 'pointer', background: fmt === f.id ? 'var(--k-accent-soft)' : 'var(--k-bg-2)', border: `1px solid ${fmt === f.id ? 'var(--k-accent)' : 'var(--k-line)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12, fontWeight: 600, color: fmt === f.id ? 'var(--k-accent)' : 'var(--k-fg-2)' }}>{f.ext}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{f.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 3 }}>{f.sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--k-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>File name</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--k-line)', borderRadius: 7, overflow: 'hidden', background: 'var(--k-bg)' }}>
              <input value={fname} onChange={(e) => setFname(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '9px 12px', fontFamily: 'var(--k-font-mono)', fontSize: 13, color: 'var(--k-fg-1)' }} />
              <span style={{ padding: '9px 12px', fontFamily: 'var(--k-font-mono)', fontSize: 13, color: 'var(--k-fg-4)', background: 'var(--k-bg-2)', borderLeft: '1px solid var(--k-line)' }}>{cur.ext}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--k-line)', background: 'var(--k-bg-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="k-btn k-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="k-btn" disabled={invalid}><Icon d={I.download} size={12} /> Export {cur.ext}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Status picker — the status badge IS the control ─────────────
// Processing and In review are set automatically by the pipeline. Open and
// Closed are the adjuster's call — exporting does NOT close a claim, since
// adjusters routinely export, get carrier feedback, and revise.
const CLAIM_STATUS_ORDER = ['processing', 'review', 'open', 'closed'];
const CLAIM_STATUS_AUTO = { processing: 'set automatically while Kevin runs', review: 'set when Kevin finishes', open: 'active work — you set this', closed: 'finished — you set this' };

const ClaimStatusPicker = ({ status, status_counts, onStatus }) => {
  const [open, setOpen] = React.useState(false);
  const cur = status;
  // The gate keys on WORK IN FLIGHT, not the derived label: closed outranks
  // processing in the ladder, so a closed claim with a repricing line reads
  // status:'closed' + status_counts.processing:1 — status alone misses it.
  const locked = cur === 'processing' || ((status_counts && status_counts.processing) || 0) > 0;
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const c = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', c);
    return () => document.removeEventListener('mousedown', c);
  }, [open]);
  const b = STATUS_BADGE[cur];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="k-status-pick" disabled={locked} onClick={(e) => { e.stopPropagation(); if (!locked) setOpen(o => !o); }} aria-haspopup="menu" aria-expanded={open} title={locked ? 'Kevin sets this automatically — items are still processing' : 'Change status'} style={locked ? { cursor: 'default' } : undefined}>
        <Badge tone={b.tone} dot={true}>{b.label}</Badge>
        {!locked && <Icon d={I.chevdown} size={10} />}
      </button>
      {open && (
        <div className="k-avatar-menu" role="menu" style={{ top: 'calc(100% + 5px)', right: 0, left: 'auto', width: 224 }}>
          <div className="k-avatar-menu-hd" style={{ fontSize: 10.5 }}>Set status</div>
          {CLAIM_STATUS_ORDER.map((s) => (
            <button key={s} className="k-menu-item" role="menuitem" onClick={() => { onStatus(s); setOpen(false); }} style={{ width: '100%', textAlign: 'left' }}>
              <span style={{ display: 'inline-grid', width: 14, color: 'var(--k-accent)' }}>{s === cur ? <Icon d={I.check} size={12} /> : null}</span>
              <span style={{ marginLeft: 8 }}>{STATUS_BADGE[s].label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--k-fg-4)' }}>{s === 'closed' || s === 'open' ? 'manual' : 'auto'}</span>
            </button>
          ))}
          <div className="k-avatar-menu-div" />
          <div style={{ padding: '7px 11px 9px', fontSize: 11, color: 'var(--k-fg-4)', lineHeight: 1.45 }}>
            {CLAIM_STATUS_AUTO[cur]}. Overrides are recorded in the audit log.
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Per-row action menu — mirrors Xactimate's claim actions ─────
const ClaimRowMenu = ({ claim, onStatus, onDelete }) => {
  const [open, setOpen] = React.useState(false);
  const [modal, setModal] = React.useState(null);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Gate on work in flight, not the label: status==='processing' misses a
  // closed claim with lines still pricing (closed outranks processing).
  // status_counts.processing rides every claim row and survives close/archive.
  const busy = claim && (claim.status === 'processing' || ((claim.status_counts && claim.status_counts.processing) || 0) > 0);
  const archived = claim && claim.status === 'archived';
  const items = [
    { icon: I.expand,   label: 'Open', act: 'open' },
    { icon: I.eye,      label: 'Preview', act: 'open' },
    { icon: I.copy,     label: 'Duplicate', act: 'duplicate' },
    { kind: 'div' },
    { icon: I.download, label: 'Export…',   act: 'export', disabled: busy, why: 'Available when processing finishes' },
    { icon: I.printer,  label: 'Print' },
    { kind: 'div' },
    // Close/Reopen is hidden while archived: unarchiving is the move that
    // brings the claim back, and offering both reads as two ways to do one
    // thing. Reopen returns a CLOSED claim to open work.
    ...(archived ? [] : [{ icon: I.check, label: claim && claim.status === 'closed' ? 'Reopen claim' : 'Mark closed', act: 'close', disabled: busy, why: 'Available when processing finishes' }]),
    // Unarchive is reversible and additive, so it needs no confirm -- unlike
    // archive, which changes what the adjuster's active list shows.
    archived
      ? { icon: I.box, label: 'Unarchive', act: 'unarchive' }
      : { icon: I.box, label: 'Archive', act: 'archive', disabled: busy, why: 'Available when processing finishes' },
    // Delete stays LIVE mid-processing (not unsafe — no corruption) but is not
    // free: the cascade fails in-flight pricing jobs and wastes spent SerpApi
    // quota. The confirm surfaces it instead of gating.
    { icon: I.trash,    label: 'Delete', danger: true, act: 'delete' },
  ];

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', position: 'relative' }}>
      <a className="k-btn k-btn--ghost" href="12-Claim-overview.html" title="Open this claim">Open →</a>
      <button
        className="k-icon-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="More actions"
        aria-expanded={open}
        style={{ background: open ? 'var(--k-bg-2)' : 'transparent' }}
      >
        <Icon d={I.more} size={14} />
      </button>
      {open && (
        <div className="k-pop" role="menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 170, zIndex: 40 }}>
          <div style={{ padding: 4 }}>
            {items.map((it, i) => it.kind === 'div'
              ? <div key={`d-${i}`} className="k-avatar-menu-div" />
              : (
                <button key={i} className={`k-menu-item ${it.danger ? 'k-menu-item--danger' : ''}`} disabled={it.disabled} title={it.disabled ? it.why : undefined} onClick={() => { if (it.disabled) return; setOpen(false); if (it.act === 'open') { window.location.href = '12-Claim-overview.html'; return; } if (it.act === 'close') onStatus(claim.status === 'closed' ? 'open' : 'closed'); else if (it.act === 'unarchive') onStatus('open'); else if (it.act) setModal(it.act); }} role="menuitem" style={{ width: '100%', justifyContent: 'flex-start', ...(it.disabled ? { opacity: 0.45, cursor: 'default' } : null) }}>
                  <span style={{ display: 'inline-grid', width: 14, color: it.danger ? 'inherit' : 'var(--k-fg-4)' }}><Icon d={it.icon} size={12} /></span>
                  <span style={{ marginLeft: 8 }}>{it.label}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
      {modal === 'duplicate' && <DuplicateClaimModal claim={claim} onClose={() => setModal(null)} />}
      {modal === 'export' && <ExportClaimModal claim={claim} onClose={() => setModal(null)} />}
      {(modal === 'archive' || modal === 'delete') && (
        <ClaimArchiveModal
          claim={claim}
          mode={modal}
          onClose={() => setModal(null)}
          onConfirm={() => (modal === 'delete' ? onDelete && onDelete() : onStatus('archived'))}
        />
      )}
    </div>
  );
};

// ─── Quota truncation alert (rule 9c) ────────────────────────────
// The backend truncates rather than rejects: it processes up to the remaining
// allowance and drops the rest, flagging `truncated` / `dropped_count`. That is
// the ONE sanctioned exception to rule 21's "a failed photo is never silently
// dropped" — sanctioned only because this alert makes it loud.
//
// Deliberately NOT dismissible. A dismiss control turns "63 items are missing
// from your inventory" into something an adjuster can wave away at 6pm and
// rediscover after the claim is exported to the carrier. It clears when the
// quota is restored and the held photos process — i.e. by fixing it, not by
// acknowledging it.
//
// The reassurance line is load-bearing too: the photos are NOT deleted (rule
// 22), so the inventory is late, not lost. Without that sentence this alert
// reads as data loss and generates exactly the panicked support ticket the
// truncation design was meant to avoid.
const ClaimTruncationAlert = ({ trunc, onAddCredits }) => {
  if (!trunc || !trunc.truncated) return null;
  const n = trunc.dropped_count;
  return (
    <section className="k-trunc" role="alert">
      <div className="k-trunc-icon"><Icon d={I.warn} size={18} /></div>
      <div className="k-trunc-body">
        <div className="k-trunc-h">You hit your limit — {n.toLocaleString()} items were not processed.</div>
        <p className="k-trunc-p">
          <strong>{trunc.claim_name}</strong> reached your {trunc.allowance.toLocaleString()}-item
          allowance {trunc.occurred}. Kevin priced {trunc.processed_count.toLocaleString()} of the
          {' '}{trunc.attempted.toLocaleString()} it found and stopped at your limit.
        </p>
        <p className="k-trunc-p k-trunc-p--calm">
          Nothing was deleted. The photos behind them are still on the claim, unprocessed — add credits
          or start Pro and Kevin picks up exactly where it stopped.
        </p>
      </div>
      <div className="k-trunc-actions">
        <button className="k-btn" onClick={onAddCredits}>Add credits</button>
        <a className="k-btn k-btn--ghost" href="21-Pricing.html">Upgrade to Pro</a>
      </div>
    </section>
  );
};

const Claims = () => {
  // One source of truth for status: the badge picker writes here, so the header
  // stats and every row menu recompute from the same list.
  const [claims, setClaims] = React.useState(CLAIMS);
  // Truncation arrives on the ingest response; the dashboard is where the
  // adjuster will actually see it, so it is read here rather than in intake.
  const [credits, setCredits] = React.useState(false);
  const trunc = window.CLAIM_TRUNCATION;
  const setStatus = (id, next) => setClaims(cs => cs.map(c => c.id === id ? { ...c, status: next } : c));
  // Rule 15: delete is permanent and always available -- it is the customer's
  // account. The confirm (type DELETE) is the guard, not a policy gate.
  const removeClaim = (id) => setClaims(cs => cs.filter(c => c.id !== id));
  // A claim stays open until the adjuster marks it Closed (or archives it) —
  // exported claims are still open work and still count toward workload.
  const open = claims.filter(c => !CLOSED_STATUSES.includes(c.status));
  const totals = open.reduce((a, c) => {
    a.items += c.items; a.rcv += c.rcv;
    if (c.status === 'review') a.review++;
    if (c.status === 'processing') a.processing++;
    return a;
  }, { items: 0, rcv: 0, review: 0, processing: 0 });

  return (
    <div className="k-claims">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark href="02-Landing.html" size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <window.TopNavTabs active="My claims" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="k-btn k-btn--ghost"><Icon d={I.search} size={12} /> Search all claims <kbd style={{ marginLeft: 6 }}>⌘K</kbd></button>
          <button className="k-btn"><Icon d={I.plus} size={12}/> New claim</button>
          <window.AvatarMenu />
        </div>
      </header>

      <div className="k-claims-body">
        <ClaimTruncationAlert trunc={trunc} onAddCredits={() => setCredits(true)} />
        {credits && window.AddCreditsModal && <window.AddCreditsModal usage={window.KEVIN_ITEM_USAGE} onClose={() => setCredits(false)} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 32, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.05 }}>Good morning, Mariana.</h1>
            <p style={{ fontSize: 14, color: 'var(--k-fg-3)', margin: '6px 0 0' }}>
              <strong style={{ color: 'var(--k-fg-2)' }}>{totals.review}</strong> claims awaiting your review · {totals.processing} processing now · Last sign-in 14h ago
            </p>
          </div>
          <div className="k-claims-stats">
            <div><div className="k-tot-l">Open claims</div><div className="k-tot-v">{open.length}</div></div>
            <div><div className="k-tot-l">Items · open claims</div><div className="k-tot-v">{totals.items.toLocaleString()}</div></div>
            <div><div className="k-tot-l">RCV · open claims</div><div className="k-tot-v">{fmtUSDshort(totals.rcv)}</div></div>
          </div>
        </div>

        <section className="k-claims-toolbar">
          <div className="k-search" style={{ minWidth: 280 }}>
            <Icon d={I.search} size={12} />
            <input placeholder="Filter claims · name, claim #, carrier, cause…" />
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--k-bg-2)', borderRadius: 6 }}>
            {['All', 'Mine', 'Processing', 'In review', 'Open', 'Closed', 'Archived'].map((s, i) => (
              <button key={s} className={`k-seg ${i === 0 ? 'k-seg--on' : ''}`}>{s}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button className="k-btn k-btn--ghost"><Icon d={I.filter} size={12} /> Sort: Most recent</button>
        </section>

        <section className="k-claims-list">
          <div className="k-claim-row k-claim-row--head">
            <div>Claim</div>
            <div>Insured / cause</div>
            <div>Carrier</div>
            <div style={{ textAlign: 'right' }}>Items / photos</div>
            <div style={{ textAlign: 'right' }}>RCV</div>
            <div>Status</div>
            <div></div>
          </div>
          {claims.map((c, i) => (
            <div key={i} className="k-claim-row">
              <div>
                <div title={c.id} style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)', maxWidth: 118, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.id}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 1 }}>DOL {c.dol} · {c.age}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 1 }}>{c.cause} · {c.loc}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--k-fg-2)' }}>{c.carrier}</div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--k-font-mono)', fontSize: 12.5, fontFeatureSettings: '"tnum"' }}>
                <div>{c.items.toLocaleString()}</div>
                <div style={{ color: 'var(--k-fg-4)', fontSize: 11 }}>{c.photos} photos</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--k-font-mono)', fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                {fmtUSDshort(c.rcv)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
<Badge tone={(STATUS_BADGE[c.status] || {}).tone || 'quiet'} dot={true} title="Derived from the claim's items — not set by hand">{(STATUS_BADGE[c.status] || {}).label || c.status}</Badge>
                {c.pct && (
                  <div className="k-progress" style={{ width: 50 }}>
                    <div className="k-progress-bar" style={{ width: `${c.pct}%` }} />
                  </div>
                )}
                {c.flags > 0 && <Badge tone="warn">{c.flags} flag{c.flags > 1 ? 's' : ''}</Badge>}
              </div>
              <ClaimRowMenu claim={c} onStatus={(s) => setStatus(c.id, s)} onDelete={() => removeClaim(c.id)} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

Object.assign(window, { SignIn, Claims, ClaimTruncationAlert });
