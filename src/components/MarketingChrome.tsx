import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

/**
 * Marketing nav and footer, ported from design/components/marketing-pages.jsx
 * (MktNav / MktFooter). Markup and class names lifted verbatim; only the hrefs
 * change, from standalone .html files to router paths.
 *
 * ROUTE MAP — design page → public route:
 *   02-Landing            /
 *   37-Product-overview   /product
 *   22-For-Adjusters      /for-adjusters
 *   23-For-Estate-…       /for-estate-liquidators
 *   21-Pricing            /pricing
 *   76-Done-for-you       /done-for-you
 *   39-About              /about
 *   38-Contact            /contact
 *   24-Docs               /docs
 *   41-Security           /security
 *   25-Legal-hub          /legal
 *   53-Careers            /careers
 *   48-Sample-claim       /sample-claim
 *   52-Watch-demo         /demo
 *   00-Sign-in            /sign-in      (already in the app)
 *   58-Account-create     /sign-up
 *
 * Links to routes that do not exist yet render as plain text rather than dead
 * links — the same treatment AvatarMenu gives unbuilt destinations. Each one
 * becomes a Link the moment its page lands.
 */

/** Routes that actually resolve today. Add as pages are ported. */
const LIVE = new Set<string>(['/', '/sign-in', '/sign-up'])

function MktLink({
  to,
  children,
  className,
  style,
}: {
  to: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  if (LIVE.has(to)) {
    return (
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    )
  }
  // NOT `k-tab--todo`: that is defined in index.css as opacity 0.4 with a
  // transparent hover, which is right for one unbuilt item among working ones
  // and very wrong here. Applied across a whole nav and footer it dimmed every
  // link to 40% -- the chrome read as broken rather than as one page pending --
  // and on the dark primary button the transparent hover left light text on a
  // light page, so the button disappeared under the cursor.
  return (
    <span
      className={className ? `${className} k-mkt-soon` : 'k-mkt-soon'}
      style={style}
      title="Coming soon"
    >
      {children}
    </span>
  )
}

export function MktNav({ active }: { active?: string }) {
  const { session, loading } = useAuth()
  const items: [string, string, string][] = [
    ['product', 'Product', '/product'],
    ['adj', 'For Adjusters', '/for-adjusters'],
    ['pri', 'Pricing', '/pricing'],
  ]
  return (
    <header className="k-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" className="k-wordmark">
          Kevin<span>.</span>
        </Link>
        <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--k-fg-3)' }}>
          {items.map(([id, label, to]) => (
            <MktLink key={id} to={to} style={{ color: active === id ? 'var(--k-fg)' : undefined }}>
              {label}
            </MktLink>
          ))}
        </nav>
      </div>
      {/* Signed in, the marketing page is still the marketing page -- the nav
          just offers the way back into the app instead of asking someone who is
          already authenticated to sign in again. `loading` renders neither, so
          the header never flashes "Sign in" at a signed-in visitor. */}
      <div style={{ display: 'flex', gap: 8 }}>
        {loading ? null : session ? (
          <Link className="k-btn" to="/claims">
            Go to app →
          </Link>
        ) : (
          <>
            <Link className="k-btn k-btn--ghost" to="/sign-in">
              Sign in
            </Link>
            <Link className="k-btn" to="/sign-in">
              Start a new claim
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export function MktFooter() {
  return (
    <footer className="k-footx">
      <div className="k-footx-cols">
        <div className="k-footx-brand">
          <Link to="/" className="k-wordmark">
            Kevin<span>.</span>
          </Link>
          <p>A content inventory adjuster. Photos in, inventory out.</p>
        </div>
        <div className="k-footx-col">
          <div className="k-footx-h">Product</div>
          <MktLink to="/product">How it works</MktLink>
          <MktLink to="/pricing">Pricing</MktLink>
          <MktLink to="/sample-claim">Sample claim</MktLink>
          <MktLink to="/done-for-you">Done-for-you claims</MktLink>
          <MktLink to="/for-estate-liquidators">For estate liquidators</MktLink>
          <MktLink to="/demo">Watch demo</MktLink>
          <MktLink to="/docs">Docs</MktLink>
        </div>
        <div className="k-footx-col">
          <div className="k-footx-h">Company</div>
          <MktLink to="/about">About</MktLink>
          <MktLink to="/careers">Careers</MktLink>
          <MktLink to="/contact">Contact</MktLink>
        </div>
        <div className="k-footx-col">
          <div className="k-footx-h">Legal</div>
          <MktLink to="/legal">Privacy</MktLink>
          <MktLink to="/legal#terms">Terms</MktLink>
          <MktLink to="/security">Security</MktLink>
        </div>
      </div>
      <div className="k-footx-base">
        <span>Kevin.co, LLC · 34 E. Main St. Ste 347, Smithtown, NY 11787</span>
        <a href="mailto:kevin@kevin.co">kevin@kevin.co</a>
        <span>© 2026</span>
      </div>
    </footer>
  )
}
