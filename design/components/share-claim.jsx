// Share-a-claim handoff — modal over the worksheet
// Three sharing modes: hand off ownership · co-edit · read-only link

const { KevinWordmark, Icon, I, Badge, fmtUSDshort } = window;

const PEOPLE = [
  { name: 'James Cunningham', email: 'james@reyesadjusting.com',  role: 'adjuster', avatar: 'JC', active: true },
  { name: 'Anabel Mendez',   email: 'anabel@reyesadjusting.com', role: 'adjuster', avatar: 'AM' },
  { name: 'Tricia O\'Connell', email: 'tricia@reyesadjusting.com', role: 'adjuster', avatar: 'TO' },
  { name: 'Dev Patel',       email: 'dev@reyesadjusting.com',    role: 'reviewer', avatar: 'DP' },
];

const SHARE_ENTERPRISE = { 'co-edit': true, 'handoff': true, 'link': false };

const ShareClaim = () => {
  const [mode, setMode] = React.useState('link');
  const [picked, setPicked] = React.useState(new Set());
  const [shares, setShares] = React.useState(() => window.KevinAPI.listShares());
  const [minting, setMinting] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(null);
  // Done-for-you paywall: unlock price is per-claim (scales with inventory size),
  // set at mint and stored on the share record — the portal reads it verbatim.
  const [unlockPrice, setUnlockPrice] = React.useState('');
  const [handoffTo, setHandoffTo] = React.useState(null);


  return (
    <div className="k-export-stage">
      {/* — Dimmed worksheet behind — */}
      <div className="k-export-bg">
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--k-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <KevinWordmark size={16} suffix={true} />
            <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>Godfrey — Kitchen fire</span>
          </div>
          <Badge tone="quiet">Review</Badge>
        </div>
        <div style={{ flex: 1, opacity: 0.4, padding: '8px 16px' }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--k-line)' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--k-bg-2)' }} />
              <div style={{ width: 28, height: 28, borderRadius: 3, background: 'var(--k-bg-3)' }} />
              <div style={{ flex: 1, height: 10, borderRadius: 99, background: 'var(--k-bg-2)' }} />
              <div style={{ width: 80, height: 10, borderRadius: 99, background: 'var(--k-bg-2)' }} />
              <div style={{ width: 60, height: 10, borderRadius: 99, background: 'var(--k-bg-3)' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="k-export-scrim" />

      {/* — Modal — */}
      <div className="k-export-modal k-share-modal">
        <div className="k-export-hd">
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Share claim</div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.022em', margin: '6px 0 0' }}>Godfrey — Kitchen fire</h2>
            <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 4, fontFamily: 'var(--k-font-mono)' }}>CLM-2026-04412 · 57 items · {fmtUSDshort(window.REYES_TOTALS.rcv)} RCV</div>
          </div>
          <a className="k-icon-btn" href="12-Claim-overview.html" style={{ width: 32, height: 32 }} title="Close"><Icon d={I.close} size={16} /></a>
        </div>

        <div className="k-share-body">
          {/* Mode picker */}
          <div className="k-share-modes">
            {[
              { id: 'link',    label: 'Read-only link', sub: 'Anyone with the link views · no sign-in needed', icon: I.link },
              { id: 'co-edit', label: 'Co-edit',  sub: 'Both can edit and see live changes',         icon: <><circle cx="9" cy="9" r="3"/><circle cx="15" cy="15" r="3"/><path d="M11.5 11.5 12.5 12.5"/></> },
              { id: 'handoff', label: 'Hand off', sub: 'Transfer ownership · you become a reviewer',           icon: <><path d="m9 18 6-6-6-6"/><path d="M3 12h12"/></> },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`k-share-mode ${mode === m.id ? 'k-share-mode--on' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="k-share-mode-icon"><Icon d={m.icon} size={16} /></div>
                  {SHARE_ENTERPRISE[m.id] && <Badge tone="accent">Enterprise</Badge>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 3, lineHeight: 1.45 }}>{m.sub}</div>
              </button>
            ))}
          </div>

          {/* Mode-specific body */}
          {mode === 'co-edit' && (
            <>
              <div className="k-docs-callout" style={{ marginBottom: 14, background: 'var(--k-accent-soft)', border: '1px solid var(--k-accent)', color: 'var(--k-accent)' }}>
                <Icon d={I.spark} size={14} />
                <div style={{ color: 'var(--k-fg-2)' }}>
                  <strong>Co-edit is an Enterprise feature.</strong> Pro is a single-user subscription — to work a claim alongside teammates, upgrade to Enterprise. <a className="k-link" href="15-Request-access.html">Talk to us about Enterprise →</a>
                </div>
              </div>
              <section className="k-share-sec">
                <div className="k-share-sec-h">Share with</div>
                <div className="k-share-pick">
                  <Icon d={I.search} size={12} />
                  <input placeholder="Add by name or email…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', font: 'inherit' }} />
                  <select className="k-share-roleselect" defaultValue="adjuster">
                    <option value="adjuster">Can edit</option>
                    <option value="reviewer">Can comment</option>
                    <option value="guest">Can view only</option>
                  </select>
                </div>
                <div className="k-share-people">
                  {PEOPLE.map(p => {
                    const on = picked.has(p.email);
                    return (
                      <button key={p.email} onClick={() => {
                        const n = new Set(picked);
                        on ? n.delete(p.email) : n.add(p.email);
                        setPicked(n);
                      }} className={`k-share-person ${on ? 'k-share-person--on' : ''}`}>
                        <span className={`k-audit-avatar k-audit-avatar--${p.role === 'reviewer' ? 'reviewer' : 'adjuster'}`} style={{ width: 32, height: 32, fontSize: 11 }}>{p.avatar}</span>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                            {p.external && <Badge tone="quiet">{p.external}</Badge>}
                            {p.active && <Badge tone="ok" dot={true}>Online</Badge>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 1 }}>{p.email}</div>
                        </div>
                        <span className={`k-check ${on ? 'k-check--on' : ''}`} style={{ width: 18, height: 18 }}>
                          {on && <Icon d={I.check} size={10} stroke={2.5} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="k-share-sec">
                <div className="k-share-sec-h">Message <span style={{ color: 'var(--k-fg-4)', fontWeight: 400, marginLeft: 6 }}>optional</span></div>
                <textarea className="k-insp-input" rows={3} placeholder="They'll get an email with this note attached…" defaultValue="James — pulled you in to double-check the special-limits items before I export. The diamond ring and tennis bracelet are both over the policy's special-limit cap. Thoughts?" />
              </section>
            </>
          )}

          {mode === 'handoff' && (
            <section className="k-share-sec">
              <div className="k-docs-callout" style={{ marginBottom: 14, background: 'var(--k-accent-soft)', border: '1px solid var(--k-accent)' }}>
                <Icon d={I.spark} size={14} style={{ color: 'var(--k-accent)' }} />
                <div>
                  <strong>Handing off a claim is an Enterprise feature.</strong> It moves ownership to another adjuster on your team. <a className="k-link" href="15-Request-access.html">Talk to us about Enterprise →</a>
                </div>
              </div>
              <div className="k-share-sec-h">Transfer ownership to</div>
              <div className="k-share-people">
                {PEOPLE.filter(p => p.role !== 'reviewer').map(p => (
                  <button key={p.email} onClick={() => setHandoffTo(p.email)}
                    aria-label={`Hand off to ${p.name}`}
                    className={`k-share-person ${handoffTo === p.email ? 'k-share-person--on' : ''}`}>
                    <span className="k-audit-avatar k-audit-avatar--adjuster" style={{ width: 32, height: 32, fontSize: 11 }}>{p.avatar}</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', marginTop: 1 }}>{p.email}</div>
                    </div>
                    <span className="k-link" aria-hidden="true">{handoffTo === p.email ? 'Selected' : 'Hand off →'}</span>
                  </button>
                ))}
              </div>
              <div className="k-docs-callout k-docs-callout--warn" style={{ marginTop: 14 }}>
                <Icon d={I.warn} size={14} />
                <div>
                  <strong>After handoff —</strong> you keep view + comment access for 30 days, then are removed from this claim. The audit log preserves all your edits.
                </div>
              </div>
            </section>
          )}

          {mode === 'link' && (
            <>
              <section className="k-share-sec">
                <div className="k-share-sec-h">Read-only links</div>
                {/* Retrievable tokens: GET …/shares returns token/url on ACTIVE
                    links, so every row gets a plain Copy button — the shown-once
                    modal is retired. Liveness is the payload's derived `active`
                    boolean, never expires_at. No label field (owner decision). */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button className="k-btn" disabled={minting} onClick={async () => {
                    setMinting(true);
                    // audience is who the link is FOR (client | carrier) — distinct
                    // from the paywall mechanism. unlock_price only applies when the
                    // link is paywalled (done-for-you); blank = no paywall.
                    const res = await window.KevinAPI.mintShare({ audience: 'client', expires_days: null, unlock_price: unlockPrice === '' ? null : Math.max(0, Math.round(parseFloat(unlockPrice) * 100) / 100) });
                    setShares(list => [{ ...res, label: 'Client link' }, ...list]);
                    setMinting(false);
                  }}><Icon d={I.link} size={12} /> {minting ? 'Creating…' : 'Create link'}</button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--k-fg-3)' }}>
                    Unlock price
                    <input className="k-input" value={unlockPrice} onChange={(e) => setUnlockPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="none" style={{ width: 76, fontFamily: 'var(--k-font-mono)', fontSize: 12 }} />
                  </label>
                  <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Anyone with the link sees a read-only snapshot. Only Revoke disables it.</span>
                </div>
                <div className="k-share-mgr">
                  {shares.filter(x => x.active).map(x => (
                    <div key={x.share_id} className="k-share-linkrow" style={{ marginBottom: 6 }}>
                      <Icon d={I.link} size={12} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500 }}>{x.label || 'Client link'}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>Created {x.created} · expires {x.expires} · {x.view_count} view{x.view_count === 1 ? '' : 's'}</span>
                      </span>
                      <button className="k-btn k-btn--ghost" onClick={() => { try { navigator.clipboard.writeText(x.url_base ? x.url_base + x.token : x.url); } catch (e) {} setCopiedId(x.share_id); setTimeout(() => setCopiedId(null), 1600); }}>
                        <Icon d={I.check} size={11} /> {copiedId === x.share_id ? 'Copied' : 'Copy'}
                      </button>
                      <button className="k-btn k-btn--ghost k-btn--danger" onClick={() => setShares(list => list.map(y => y.share_id === x.share_id ? { ...y, active: false, status: 'Revoked', token: null, url: null } : y))}>Revoke</button>
                    </div>
                  ))}
                  {shares.some(x => !x.active) && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--k-fg-4)', marginBottom: 5 }}>History</div>
                      {shares.filter(x => !x.active).map(x => (
                        <div key={x.share_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                          <span style={{ flex: 1 }}>{x.label} · created {x.created}</span>
                          <span>{x.view_count} view{x.view_count === 1 ? '' : 's'}</span>
                          <Badge tone="quiet">{x.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Snapshot, not a live view — stated on screen because it is the
                    whole reason the link is defensible. See SCHEMAS.md → ShareLink. */}
                <div className="k-share-snapnote">
                  <Icon d={I.info} size={13} />
                  <span>
                    <strong style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>This link is a snapshot.</strong> Whoever opens it sees the inventory exactly as it stands right now — 57 items, {fmtUSDshort(window.REYES_TOTALS.rcv)} RCV. Editing the claim afterwards will not change what they see. To send updated figures, copy a new link.
                  </span>
                </div>


                {/* Visibility is SERVER-shaped: GET /p/{token} returns only what the
                    audience may see — this preview mirrors that contract, it never
                    filters a full payload client-side (devtools defeats that).
                    Identity + the full money chain are always visible to the client;
                    confidence / comps / substitution internals never are. */}
                <div className="k-share-preview">
                  <div className="k-share-preview-h">What the client sees</div>
                  <div className="k-share-preview-row">
                    <span>Insured</span>
                    <span className="k-mono">Kevin Godfrey</span>
                  </div>
                  <div className="k-share-preview-row">
                    <span>Loss address</span>
                    <span className="k-mono">123 Main St., Smithtown, NY 11787</span>
                  </div>
                  <div className="k-share-preview-row">
                    <span>Claim · policy number</span>
                    <span className="k-mono">CLM-2026-04412 · HO3-4471-8829</span>
                  </div>
                  <div className="k-share-preview-row">
                    <span>Money, end to end</span>
                    <span className="k-mono">RCV → Depr. % → ACV → actual cost → recoverable</span>
                  </div>
                  <div className="k-share-preview-row">
                    <span>Per item</span>
                    <span className="k-mono">description · room · photos · age · receipt</span>
                  </div>
                  <div className="k-share-preview-row">
                    <span>Never shown</span>
                    <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>match confidence · pricing comps · substitution notes</span>
                  </div>
                  <div className="k-share-preview-row">
                    <span>The worksheet</span>
                    <span className="k-mono">57 items · always visible</span>
                  </div>
                </div>

                <div className="k-docs-callout" style={{ margin: '10px 0' }}>
                  <Icon d={I.info} size={13} />
                  <div style={{ fontSize: 11.5 }}>Every dollar figure on the shared page is labeled <strong>"adjuster's estimate — the carrier makes the final settlement decision"</strong> so the insured doesn't anchor on our ACV.</div>
                </div>
                <div className="k-share-linkopts">
                  <label className="k-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="k-toggle-box"><Icon d={I.check} size={10} stroke={2.5} /></span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 12.5 }}>Expire in 7 days</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>Link stops working in 7 days</span>
                    </span>
                  </label>
                  <label className="k-toggle">
                    <input type="checkbox" />
                    <span className="k-toggle-box" />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 12.5 }}>Require email to view</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>Recipient gets a one-time code · captures who viewed and when</span>
                    </span>
                  </label>
                </div>
              </section>

              <section className="k-share-sec">
                <div className="k-share-sec-h">Recent link views <span style={{ color: 'var(--k-fg-4)', fontWeight: 400, marginLeft: 6 }}>last 24h</span></div>
                <div style={{ background: 'var(--k-bg-2)', border: '1px solid var(--k-line)', borderRadius: 8, padding: '8px 0' }}>
                  {[
                    ['rcaldwell@allstate.com',        'Melville NY', '14m ago', 'desktop'],
                    ['lvasquez@libertymutual.com',    'Syosset NY', '2h ago', 'mobile'],
                    ['—',                                'Unknown',  'Yesterday', 'expired token'],
                  ].map(([who, where, when, dev], i) => (
                    <div key={i} className="k-share-view-row">
                      <span style={{ flex: 1, fontFamily: 'var(--k-font-mono)', fontSize: 11.5, color: 'var(--k-fg-2)' }}>{who}</span>
                      <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{where} · {dev}</span>
                      <span style={{ fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', width: 90, textAlign: 'right' }}>{when}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="k-export-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--k-fg-3)' }}>
            <Icon d={I.lock} size={13} />
            <span>All sharing is logged in the claim audit trail</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="k-btn k-btn--ghost" href="12-Claim-overview.html">Cancel</a>
            {mode === 'co-edit' && <button className="k-btn">Send invites · {picked.size}</button>}
            {mode === 'handoff' && <button className="k-btn k-btn--ghost k-btn--danger" disabled={!handoffTo}>Confirm handoff</button>}
            {mode === 'link' && <button className="k-btn" onClick={() => { const x = shares.find(y => y.active); if (x) { try { navigator.clipboard.writeText(x.url_base ? x.url_base + x.token : x.url); } catch (e) {} setCopiedId(x.share_id); setTimeout(() => setCopiedId(null), 1600); } }}>Copy link</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

window.ShareClaim = ShareClaim;
