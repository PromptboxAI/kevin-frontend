// Sample claim — wraps the Worksheet in a read-only-feeling banner.
// Reached from the landing page's "Open a sample claim" button.

const { Icon, I, Badge, KevinWordmark, Worksheet } = window;

// Panes the tour can show. Each is the REAL screen the product uses, so nothing
// here is a mock of a mock — and the banner stays put, which is why the sample
// owns these tabs instead of letting ClaimTabs navigate out of the demo.
const SAMPLE_PANES = [
  ['Worksheet', 'the grid'],
  ['Photos',    'what Kevin read'],
  ['Recovery',  'after settlement'],
];

const SampleClaim = ({ onStartClaim, density = 'comfortable' }) => {
  const [pane, setPane] = React.useState('Worksheet');
  const [wsFocus, setWsFocus] = React.useState(null);
  return (
    <div className="k-sample">
      {/* Banner pinned to the top */}
      <div className="k-sample-banner">
        <div className="k-sample-banner-l">
          <span className="k-sample-pulse" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
              You're exploring a sample claim
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 2 }}>
              Godfrey — Kitchen fire · Allstate · 57 items · Click anything · Nothing saves
            </div>
            <div className="k-sample-tabs">
              {SAMPLE_PANES.map(([id, label]) => (
                <button key={id} className={'k-sample-tab' + (pane === id ? ' k-sample-tab--on' : '')} onClick={() => setPane(id)}>
                  {id}<span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="k-sample-banner-r">
          <div className="k-sample-bullets">
            <span><Icon d={I.check} size={10} stroke={2.5} /> All cells editable in this demo</span>
            <span><Icon d={I.check} size={10} stroke={2.5} /> RCV popover, special-limits, lightbox all live</span>
            <span style={{ opacity: 0.55 }}><Icon d={I.close} size={10} stroke={2.5} /> Downloads and share links disabled</span>
          </div>
          <button className="k-btn k-sample-cta" onClick={onStartClaim}>
            Start your own claim →
          </button>
        </div>
      </div>

      <div className="k-sample-stage">
        {pane === 'Photos'
          ? <window.ClaimPhotos sample={true} onGoToWorksheet={(itemId) => { setWsFocus(itemId || null); setPane('Worksheet'); }} />
          : pane === 'Recovery'
          ? <window.HoldbackRecovery sample={true} />
          : <Worksheet density={density} sample={true} focusItem={wsFocus} />}
      </div>

      {/* Bottom CTA strip — appears once you've scrolled */}
      <div className="k-sample-floor">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Liked the grid?</div>
          <div style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>Try Kevin free for 7 days — full product, real claims.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="k-btn k-btn--ghost" href="51-Book-call.html">Book a call</a>
          <button className="k-btn" onClick={onStartClaim}>Start your own claim →</button>
        </div>
      </div>
    </div>
  );
};

window.SampleClaim = SampleClaim;
