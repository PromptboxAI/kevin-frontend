// Shared bits — logo, icons, swatch placeholder, currency fmt

const fmtUSD = (n) => (n == null || isNaN(n)) ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSDshort = (n) => (n == null || isNaN(n)) ? '—' : '$' + Math.round(n).toLocaleString('en-US');

// --- Logo --------------------------------------------------------------------
// Wordmark — "Kevin" + optional accent-color period. When `suffix={true}` the
// brand mark shows the trailing accent dot, like in card 02 of the logo page.
// Wordmark — "Kevin" + optional accent-color period. `href` makes it a link home
// (every authenticated screen carries it, so it doubles as the universal way out
// of a leaf page — pass href={null} for print or auth screens with no home).
// Official Google "G" — brand-spec sign-in mark (white button, neutral border).
const GoogleG = ({ size = 16 }) => (
  <span style={{ display: 'inline-flex', width: size, height: size }} dangerouslySetInnerHTML={{ __html: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#EA4335\" d=\"M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z\"/><path fill=\"#4285F4\" d=\"M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z\"/><path fill=\"#FBBC05\" d=\"M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z\"/><path fill=\"#34A853\" d=\"M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z\"/></svg>".replace('width="16" height="16"', 'width="' + size + '" height="' + size + '"') }} />
);

const KevinWordmark = ({ size = 18, tone = 'dark', suffix = false, href = '01-My-claims.html' }) => {
  const mark = (
  <span style={{
    display: 'inline-flex', alignItems: 'baseline', gap: 0,
    color: tone === 'dark' ? 'var(--k-fg)' : 'var(--k-bg)',
    fontFamily: 'var(--k-font-ui)', fontWeight: 600,
    fontSize: size, letterSpacing: '-0.025em',
  }}>
    <span>Kevin</span>
    {suffix && <span style={{ color: 'var(--k-accent)', fontWeight: 600, transform: 'translateY(-0.05em)', display: 'inline-block' }}>.</span>}
  </span>
  );
  if (!href) return mark;
  return <a href={href} style={{ textDecoration: 'none', display: 'inline-flex' }} title="Kevin home">{mark}</a>;
};
const KevinMark = KevinWordmark; // legacy alias — same wordmark

// --- Icons (hand-rolled, geometric only) -------------------------------------
const Icon = ({ d, size = 14, stroke = 1.5, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const I = {
  edit:      <><path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4 17v3z"/></>,
  calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  lock:      <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  close:     <><path d="M6 6l12 12M18 6 6 18"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  pin:       <><path d="M9 4h6l-1 6 3 3H7l3-3-1-6Z"/><path d="M12 13v7"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  download:  <><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></>,
  upload:    <><path d="M12 20V8m0 0-4 4m4-4 4 4M5 4h14"/></>,
  filter:    <><path d="M4 5h16M7 12h10M10 19h4"/></>,
  link:      <><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11 5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07L13 19"/></>,
  trash:     <><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></>,
  box:       <><path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 8V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3M10 13h4"/></>,
  expand:    <><path d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6"/></>,
  check:     <><path d="m5 12 5 5 9-11"/></>,
  chevleft:  <><path d="m15 18-6-6 6-6"/></>,
  chevdown:  <><path d="m6 9 6 6 6-6"/></>,
  chevright: <><path d="m9 6 6 6-6 6"/></>,
  spark:     <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/><circle cx="12" cy="12" r="2.5"/></>,
  file:      <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></>,
  clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  camera:    <><path d="M3 7h3l2-3h8l2 3h3v12H3z"/><circle cx="12" cy="13" r="4"/></>,
  flash:     <><path d="m13 2-9 12h7l-1 8 9-12h-7z" fill="currentColor"/></>,
  more:      <><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></>,
  warn:      <><path d="M12 4 2 21h20z"/><path d="M12 10v5M12 18v.5"/></>,
  zip:       <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M9 7h6M9 11h6M9 15h6"/></>,
  wifi:      <><path d="M2 9a18 18 0 0 1 20 0"/><path d="M5 12.5a13 13 0 0 1 14 0"/><path d="M8.5 16a8 8 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></>,
  refresh:   <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
  info:      <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.75" r="0.75" fill="currentColor"/></>,
  eye:       <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  copy:      <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></>,
  printer:   <><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/></>,
};

// --- Thumbnail — supports real image src OR striped tone swatch fallback ----
// `fill` drops the fixed square and expands to the parent instead, for the cases
// where the placeholder stands in for a full-bleed photo (mobile photo detail).
// Without it the inline width/height beat any stylesheet rule and the swatch
// stays 36px inside a 200px box.
const Thumb = ({ idx = 0, size = 36, label = 'IMG', src, desc, fill = false }) => {
  src = src || productImgFor(desc);
  const [a, b] = (window.THUMB_TONES || [['#ccc','#999']])[idx % (window.THUMB_TONES?.length || 1)];
  return (
    <div style={{
      width: fill ? '100%' : size, height: fill ? '100%' : size,
      borderRadius: fill ? 0 : 4, overflow: 'hidden',
      backgroundColor: a,
      backgroundImage: src
        ? 'none'
        : `repeating-linear-gradient(135deg, ${a} 0 6px, ${b} 6px 12px)`,
      backgroundSize: src ? 'cover' : 'auto',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative', flex: fill ? '1 1 auto' : '0 0 auto',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
    }}>
      {/* Real <img> when there is a photo, so the browser can defer off-screen
          fetches — a background-image cannot lazy-load, and 50 full-size field
          captures loading at once is what made the grid crawl. */}
      {src && (
        <img src={src} alt={desc || label} loading="lazy" decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      {!src && (
        <span style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontFamily: 'var(--k-font-mono)', fontSize: fill ? 13 : 8, color: 'rgba(0,0,0,0.45)',
          textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
        }}>{label}</span>
      )}
    </div>
  );
};

// --- Confidence pip — tiny dot rendered next to AI-prepopulated values -------
const ConfPip = ({ level = 'med' }) => {
  const c = level === 'high' ? 'var(--k-ok)' : level === 'med' ? 'var(--k-fg-3)' : 'var(--k-fg-4)';
  return (
    <span title={`AI confidence: ${level}`} style={{
      width: 5, height: 5, borderRadius: 99, background: c, display: 'inline-block',
      flex: '0 0 auto',
    }} />
  );
};

// --- Status badge ------------------------------------------------------------
const Badge = ({ tone = 'quiet', children, dot = false }) => (
  <span className={`k-badge k-badge--${tone}`}>
    {dot && <span className="k-badge-dot" />}
    {children}
  </span>
);

// Real product imagery — Unsplash CDN, cropped to square via URL params.
// Used by landing-page gallery + Reyes claim references so the "contents" actually look like contents.
const PRODUCT_IMG = {
  tv:       'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=240&h=240&fit=crop&auto=format',
  soundbar: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=240&h=240&fit=crop&auto=format',
  fridge:   'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=240&h=240&fit=crop&auto=format',
  mixer:    'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=240&h=240&fit=crop&auto=format',
  sofa:     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=240&h=240&fit=crop&auto=format',
  mattress: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=240&h=240&fit=crop&auto=format',
  laptop:   'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=240&h=240&fit=crop&auto=format',
  ring:     'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=240&h=240&fit=crop&auto=format',
  watch:    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&h=240&fit=crop&auto=format',
  pistol:   'https://images.unsplash.com/photo-1584432743501-7d20c93f5f7e?w=240&h=240&fit=crop&auto=format',
  chair:    'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=240&h=240&fit=crop&auto=format',
  drill:    'https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=240&h=240&fit=crop&auto=format',
  espresso: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=240&h=240&fit=crop&auto=format',
  range:    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=240&h=240&fit=crop&auto=format',
  console:  'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=240&h=240&fit=crop&auto=format',
  guitar:   'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=240&h=240&fit=crop&auto=format',
};

// Description → product photo. Keyed on words an adjuster would actually type,
// so seed rows, staging cards and the photos grid all resolve without a manual
// per-row mapping. Falls back to the striped placeholder when nothing matches.
const PRODUCT_IMG_MATCH = [
  [/\b(tv|television|oled|qled)\b/i,            'tv'],
  [/\b(soundbar|sound bar|speaker|sonos|arc)\b/i,'soundbar'],
  [/\b(refrigerat|fridge|sub-?zero)\b/i,        'fridge'],
  [/\b(mixer|kitchenaid|blender)\b/i,           'mixer'],
  [/\b(sofa|sectional|couch|loveseat)\b/i,      'sofa'],
  [/\b(mattress|bed|box spring)\b/i,            'mattress'],
  [/\b(laptop|macbook|notebook|computer)\b/i,   'laptop'],
  [/\b(ring|diamond|solitaire|earring)\b/i,     'ring'],
  [/\b(watch|rolex|omega)\b/i,                  'watch'],
  [/\b(pistol|rifle|firearm|shotgun|9mm)\b/i,   'pistol'],
  [/\b(chair|stool|recliner|bench)\b/i,         'chair'],
  [/\b(drill|saw|tool|dewalt|wrench)\b/i,       'drill'],
  [/\b(espresso|coffee|breville)\b/i,           'espresso'],
  [/\b(range|oven|stove|cooktop|wolf)\b/i,      'range'],
  [/\b(console|playstation|xbox|nintendo)\b/i,  'console'],
  [/\b(guitar|fender|gibson|amp)\b/i,           'guitar'],
  [/\b(dishwasher|washer|dryer|whirlpool)\b/i,  'fridge'],
  [/\b(lamp|floor lamp|sconce)\b/i,             'chair'],
  [/\b(rug|carpet|persian)\b/i,                 'sofa'],
  [/\b(coat|jacket|apparel|wool|leather)\b/i,   'watch'],
];
const productImgFor = (text) => {
  if (!text) return undefined;
  const hit = PRODUCT_IMG_MATCH.find(([re]) => re.test(text));
  return hit ? PRODUCT_IMG[hit[1]] : undefined;
};

// Claim-level sub-nav. It used to live inside claim-photos only, so leaving
// Photos for the worksheet stranded the adjuster — the only way back was the
// overview, which did not carry it either. One component, every claim screen.
const ClaimTabs = ({ active, sample }) => {
  // Inside the sample claim the tour owns navigation — these links would leave
  // the demo, losing the banner and the "nothing saves" framing.
  if (sample) return null;
  const T = [
    ['Overview',      '12-Claim-overview.html', null],
    ['Photos',        '16-Claim-photos.html',   (window.CLAIM_INGEST || {}).photos],
    ['Worksheet',     '05-Worksheet-flat.html', (window.CLAIM_INGEST || {}).items],
    ['Notes & audit', '17-Audit-log.html',      null],
    ['Export',        '06-Export-modal.html',   null],
  ];
  return (
    <div className="k-claim-tabs">
      {T.map(([label, href, n]) => {
        const inner = <React.Fragment>{label}{n ? <span className="k-claim-tab-n">{n}</span> : null}</React.Fragment>;
        return active === label
          ? <span key={label} className="k-claim-tab k-claim-tab--on">{inner}</span>
          : <a key={label} className="k-claim-tab" href={href}>{inner}</a>;
      })}
    </div>
  );
};

// Starts the Pro subscription checkout. Shared because the same action is
// offered from the usage meter and from the quota-truncation alert, and an
// in-app upgrade must go straight to Stripe rather than bouncing an already
// signed-in adjuster back to the marketing pricing page to start over.
// Disabled in flight: a second click mints a second Stripe session.
const UpgradeProButton = ({ className, label }) => {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const go = async () => {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      // Record the plan being left so the return leg knows what changed.
      const u = window.KEVIN_ITEM_USAGE;
      await window.KevinAPI.billing.checkout({ kind: 'plan', plan_before: (u && u.plan) || 'free' });
    } catch (e) {
      setErr(e.message); setBusy(false);
    }
  };
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
      <button className={className || 'k-btn'} onClick={go} disabled={busy}>
        {busy ? 'Redirecting…' : (label || 'Upgrade to Pro')}
      </button>
      {err && <span style={{ fontSize: 11.5, color: 'var(--k-danger)', lineHeight: 1.4, maxWidth: 260 }}>{err}</span>}
    </span>
  );
};

Object.assign(window, { GoogleG, fmtUSD, fmtUSDshort, KevinMark, KevinWordmark, Icon, I, Thumb, ConfPip, Badge, PRODUCT_IMG, productImgFor, ClaimTabs, UpgradeProButton });
