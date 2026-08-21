// ============================================================================
// PROCESSING SCREEN — DESIGN PROTOTYPE. NOTHING HERE IS REAL.
// ============================================================================
// ⚠️  BACKEND: this entire screen is a 90-second scripted ANIMATION. It does not
//     upload anything, does not call Vision, and does not observe a real job.
//     Every number on it is produced by a clock, not by work:
//
//       • `progress`      — derived from elapsed wall time (Date.now vs. a start
//                           stamp in localStorage), NOT from job state.
//       • `processed` / `found` / stage transitions / ETA / elapsed
//                         — all computed from `progress`. Fake.
//       • the live feed   — replays `SAMPLE_BASE` items on a timer to look like
//                           results streaming in. No item is really identified.
//       • in-flight bars  — four decorative bars on independent sine cycles.
//       • it LOOPS         — holds "done" 8s, then restarts. Real jobs finish once.
//
//     MUST BE REPLACED before production with real job progress — a WebSocket
//     subscription (preferred) or polling on the claim's processing job. Bind:
//       progress/stage → server-reported stage + %,
//       processed/found/counts → server counters,
//       live feed → items as the API emits them,
//       "Open worksheet" → enabled by job completion, not by a timer.
//
//     Keep the VISUAL DESIGN (stage bar, feed, counters, reduced-motion
//     support); replace the CLOCK that drives it. Nothing below should survive
//     as logic. See INTERACTIONS.md → "04 Processing".
// ============================================================================
//
// Prototype implementation notes (all animation-only):
//   • Cycle runs over 90s (then holds at "done" for 8s before looping)
//   • Smooth 80ms tick; respects prefers-reduced-motion
//   • Persists start time in localStorage so the artboard survives reloads
//   • Live feed slides items in as they resolve (CSS keyframe via stable keys)
//   • In-flight progress bars cycle independently for each of 4 photos
//   • Stages transition at thresholds (Uploaded → Hashed → Identifying → Pricing → Ready)

const { KevinWordmark, Icon, I, Thumb, Badge, ConfPip } = window;
const { SAMPLE_BASE } = window;

const Processing = ({ onOpenWorksheet }) => {
  const TOTAL          = 60;
  const TARGET_ITEMS   = 57;
  const DURATION_S     = 90;     // runtime of one full cycle
  const HOLD_S         = 8;      // pause at "done" before looping
  const CYCLE_S        = DURATION_S + HOLD_S;

  const [paused, setPaused] = React.useState(() => typeof window !== 'undefined' && window.__KEVIN_PRINT__ === true);
  const [now, setNow]       = React.useState(() => Date.now());

  // Persisted start time so reloads don't reset to 0
  const startRef = React.useRef(null);
  if (startRef.current === null) {
    // In print mode, freeze at ~55% (visually rich mid-cycle frame)
    if (typeof window !== 'undefined' && window.__KEVIN_PRINT__) {
      startRef.current = Date.now() - 50000;
    } else {
      try {
        const stored = parseFloat(localStorage.getItem('kevin-proc-start') || '');
        const fresh = !stored || !Number.isFinite(stored) || (Date.now() - stored > CYCLE_S * 1000 * 50);
        if (fresh) {
          startRef.current = Date.now();
          localStorage.setItem('kevin-proc-start', String(startRef.current));
        } else {
          startRef.current = stored;
        }
      } catch (e) {
        startRef.current = Date.now();
      }
    }
  }
  // Adjust for paused time so resuming doesn't jump
  const pauseAccumRef = React.useRef(0);
  const pauseStartRef = React.useRef(null);

  React.useEffect(() => {
    if (paused) {
      pauseStartRef.current = Date.now();
      return;
    }
    if (pauseStartRef.current) {
      pauseAccumRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    const reduced = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = reduced ? 1000 : 80;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [paused]);

  const elapsed_s = Math.max(0, ((paused ? pauseStartRef.current || now : now) - startRef.current - pauseAccumRef.current) / 1000);
  const cyclePos  = elapsed_s % CYCLE_S;
  const progress  = Math.min(1, cyclePos / DURATION_S);
  const done      = progress >= 1;
  const remaining_s = Math.max(0, Math.ceil(DURATION_S - cyclePos));

  const UNIQUE    = TOTAL - 1;   // one duplicate is hashed out at ingest
  const processed = Math.floor(progress * UNIQUE);
  const found     = Math.floor(progress * TARGET_ITEMS);

  const restart = () => {
    pauseAccumRef.current = 0;
    pauseStartRef.current = null;
    startRef.current = Date.now();
    try { localStorage.setItem('kevin-proc-start', String(startRef.current)); } catch (e) {}
    setPaused(false);
    setNow(Date.now());
  };

  // ── Live feed — most-recent 7 resolved items ──
  const feedSize = 7;
  const resolvedItems = [];
  for (let i = found - 1; i >= Math.max(0, found - feedSize); i--) {
    const item = SAMPLE_BASE[i % SAMPLE_BASE.length];
    if (!item) continue;
    const itemFinishedAt_s = ((i + 1) / TARGET_ITEMS) * DURATION_S;
    const age_s = Math.max(0, cyclePos - itemFinishedAt_s);
    const ageLabel =
      age_s < 1   ? 'just now' :
      age_s < 60  ? `${Math.floor(age_s)}s ago` :
                    `${Math.floor(age_s / 60)}m ago`;
    resolvedItems.push({
      id: i,
      ...item,
      photoIdx: i,
      age: ageLabel,
      confidence: item.conf || 'med',
    });
  }

  // ── In-flight — 4 simultaneous photos at phase-shifted progress ──
  const inFlightLabels = ['Identifying', 'Matching brand', 'Fetching comps', 'Reading model #'];
  const inFlight = done ? [] : inFlightLabels.map((step, i) => {
    const photoNum = 2840 + processed + i;
    const phase = ((cyclePos / 5) + i * 0.27) % 1;
    return {
      id: `IMG_${String(photoNum).padStart(4, '0')}`,
      step,
      pct: Math.floor(phase * 100),
    };
  });

  // ── Stage progression ──
  const stages = [
    { label: 'Uploaded',          count: TOTAL,                                                  status: 'done' },
    { label: 'Hashed & deduped',  count: progress >= 0.04 ? `${UNIQUE} · 1 dup` : '…',         status: progress >= 0.04 ? 'done' : 'active' },
    { label: 'Identifying items', count: `${processed} / ${UNIQUE}`,                          status: progress >= 0.78 ? 'done' : progress >= 0.04 ? 'active' : 'pending' },
    { label: 'Pricing comps',     count: progress >= 0.78 ? `${Math.min(found * 3, TARGET_ITEMS * 3)}` : '—', status: progress >= 0.96 ? 'done' : progress >= 0.78 ? 'active' : 'pending' },
    { label: 'Ready for review',  count: done ? '57 items' : '—',                                status: done ? 'done' : 'pending' },
  ];

  // ── Running totals ──
  const stats = [
    ['Photos uploaded',         TOTAL.toLocaleString(),                                              null],
    ['Photos analyzed',         processed.toLocaleString(),                                          done ? 'ok' : 'in progress'],
    ['Items identified',        found.toLocaleString(),                                              null],
    ['Barcodes matched',        Math.floor(found * 0.46).toLocaleString(),                           found > 30 ? 'ok' : null],
    ['Models read',             Math.floor(found * 0.58).toLocaleString(),                           null],
    ['Special-limits flagged',  Math.floor(found * 0.018).toLocaleString(),                          found > 80 ? 'warn' : null],
    ['Pricing comps fetched',   (found * 3).toLocaleString(),                                         null],
    ['Estimated RCV so far',    '$' + Math.floor((found / TARGET_ITEMS) * window.REYES_TOTALS.rcv).toLocaleString('en-US'), null],
  ];

  return (
    <div className="k-proc">
      <header className="k-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KevinWordmark size={16} suffix={true} />
          <div style={{ width: 1, height: 16, background: 'var(--k-line)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--k-fg-2)' }}>Godfrey — Kitchen fire</span>
          <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11, color: 'var(--k-fg-4)' }}>CLM-2026-04412</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!done && (
            <Badge tone="accent" dot={true}>
              Processing · {Math.round(progress * 100)}% · {remaining_s}s left
            </Badge>
          )}
          {done && <Badge tone="ok" dot={true}>Ready for review · 57 items in {DURATION_S}s</Badge>}
          {/* Inline replay/pause for the demo */}
          <button className="k-icon-btn" onClick={() => setPaused(p => !p)} title={paused ? 'Resume' : 'Pause'}>
            {paused
              ? <Icon d={<path d="m8 5 12 7-12 7z" fill="currentColor"/>} size={12} fill="currentColor" stroke={0} />
              : <Icon d={<><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></>} size={12} fill="currentColor" stroke={0} />}
          </button>
          <button className="k-icon-btn" onClick={restart} title="Restart">
            <Icon d={I.refresh} size={12} />
          </button>
        </div>
      </header>

      <main className="k-proc-main">
        {/* — Hero status — */}
        <section className="k-proc-hero">
          <div className="k-proc-eyebrow">
            <span className={`k-pulse ${done ? 'k-pulse--done' : ''}`} />
            <span>{done ? 'Kevin finished' : 'Kevin is working'}</span>
          </div>
          <h1 className="k-proc-h1">
            <span className="k-mono" style={{ color: 'var(--k-accent)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{processed}</span>
            <span style={{ color: 'var(--k-fg-3)' }}> of </span>
            <span className="k-mono" style={{ color: 'var(--k-fg)' }}>{UNIQUE}</span>
            <span style={{ color: 'var(--k-fg-3)' }}> photos analyzed</span>
          </h1>
          <p className="k-proc-sub">
            <span className="k-mono">{found}</span> unique items identified so far · <span className="k-mono">{Math.round(progress * 100)}%</span> complete · {done ? 'done' : `~${remaining_s}s remaining`}
          </p>

          {/* — Stage bar — */}
          <div className="k-stage-bar">
            {stages.map((s, i) => {
              const isActive = s.status === 'active';
              const isDone = s.status === 'done';
              const labelStyle = isDone ? { color: 'var(--k-fg)' }
                : isActive ? { color: 'var(--k-accent)', fontWeight: 600 }
                : { color: 'var(--k-fg-4)' };
              return (
                <React.Fragment key={s.label}>
                  <div className="k-stage" data-on={isDone || isActive ? 'true' : undefined} data-active={isActive ? 'true' : undefined}>
                    <span className={`k-stage-i ${isActive ? 'k-stage-i--active' : ''}`}>
                      {isDone && <Icon d={I.check} size={10} stroke={2.5} />}
                      {isActive && <span className="k-pulse k-pulse--sm" />}
                    </span>
                    <span style={labelStyle}>{s.label}</span>
                    <span className="k-stage-c">{s.count}</span>
                  </div>
                  {i < stages.length - 1 && (
                    <div className={`k-stage-conn ${stages[i + 1].status === 'done' || stages[i + 1].status === 'active' ? 'k-stage-conn--done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="k-proc-cta">
            <button className="k-btn k-btn--lg" onClick={onOpenWorksheet} disabled={found < 30}>
              {done ? 'Open worksheet →' : `Open worksheet so far (${found}) →`}
            </button>
            <button className="k-btn k-btn--ghost k-btn--lg">Get notified when done</button>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--k-fg-4)' }}>You can safely close this tab — Kevin keeps working server-side.</span>
          </div>
        </section>

        <div className="k-proc-grid">
          {/* — Live feed — */}
          <section className="k-proc-feed">
            <div className="k-proc-sec-hd">
              <span>Live feed</span>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>Items as they resolve · newest on top</span>
            </div>
            <div className="k-proc-feed-list">
              {resolvedItems.length === 0 && (
                <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 12, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
                  Waiting for the first match …
                </div>
              )}
              {resolvedItems.map((it) => (
                <div key={it.id} className="k-feed-row">
                  <Thumb idx={it.photoIdx} size={36} desc={it.desc} label={it.mfr.slice(0,3)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.desc}</span>
                      {it.barcode && <Badge tone="ok">Barcode</Badge>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 11, color: 'var(--k-fg-4)' }}>
                      <span>{it.mfr}</span>
                      <span>·</span>
                      <span className="k-mono">{it.model}</span>
                      <span>·</span>
                      <span>{it.cat}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ConfPip level={it.confidence} />
                    {it.needs_manual
                      ? <span style={{ fontSize: 11, fontWeight: 600, color: it.manual_reason === 'manual_class' ? 'var(--k-warn)' : 'var(--k-fg-4)' }}>
                          {it.manual_reason === 'manual_class' ? "Appraisal req'd" : it.manual_reason === 'low_sample' ? 'Low sample' : 'No comps'}
                        </span>
                      : <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>${it.rcv.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                    <span style={{ fontSize: 10.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)', width: 56, textAlign: 'right' }}>{it.age}</span>
                  </div>
                </div>
              ))}
              {found > feedSize && (
                <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
                  + {found - feedSize} earlier items …
                </div>
              )}
            </div>
          </section>

          {/* — Right column: now scanning + stats — */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section className="k-proc-now">
              <div className="k-proc-sec-hd">
                <span>Now scanning</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                  {done ? 'all done' : `${inFlight.length} photos in flight`}
                </span>
              </div>
              <div style={{ padding: 4 }}>
                {done ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 99, background: 'var(--k-ok-soft)', color: 'oklch(0.36 0.08 175)', display: 'inline-grid', placeItems: 'center', marginBottom: 10 }}>
                      <Icon d={I.check} size={18} stroke={2.5} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Pipeline drained</div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 3 }}>All photos analyzed · all comps fetched</div>
                  </div>
                ) : (
                  inFlight.map((f, i) => (
                    <div key={f.id} className="k-inflight">
                      <div className="k-inflight-thumb"><Thumb idx={i + 7} size={32} label={f.id.slice(-3)} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-2)' }}>{f.id}.heic</div>
                        <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 1 }}>{f.step}</div>
                        <div className="k-progress" style={{ marginTop: 4, width: '100%' }}>
                          <div className="k-progress-bar" style={{ width: `${f.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="k-proc-stats">
              <div className="k-proc-sec-hd"><span>Running totals</span></div>
              <div style={{ padding: '4px 14px 12px' }}>
                {stats.map(([l, v, badge], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderBottom: i < stats.length - 1 ? '1px solid var(--k-line)' : 0 }}>
                    <span style={{ color: 'var(--k-fg-3)' }}>{l}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {badge === 'ok' && <Badge tone="ok" dot={true}>{badge}</Badge>}
                      {badge === 'warn' && <Badge tone="warn" dot={true}>{badge}</Badge>}
                      {badge === 'in progress' && <Badge tone="accent" dot={true}>{badge}</Badge>}
                      <span className="k-mono" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

window.Processing = Processing;
