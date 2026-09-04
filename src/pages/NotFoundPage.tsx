import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { useAuth } from '../lib/auth'

/**
 * 404 — ported from `NotFound` in design/components/system-pages.jsx, copy
 * verbatim.
 *
 * What was here before was a six-line placeholder on `k-portal`: "Page not
 * found. That address doesn't exist." It is the catch-all, so it is what every
 * mistyped or stale URL has been showing.
 *
 * THREE deviations:
 *
 * 1. **Real chrome.** The design's header is a stub — two buttons with no
 *    hrefs — and its footer is `k-footnote` with two links. Both become
 *    MktNav/MktFooter, the same as every other public page, so the one screen a
 *    lost visitor lands on is the one with the most ways out. MktNav is also
 *    auth-aware, which the stub is not.
 *
 * 2. **"Go to my claims" only when signed in.** Behind RequireAuth that link
 *    bounces a signed-out visitor to sign-in, which is a second wrong page
 *    after the one they already got.
 *
 * 3. **The suggestion list points at routes that exist.** The design lists
 *    "Review worksheet · /claim/:id/review", which cannot be linked without a
 *    claim id; it is "All claims" here. The search box was decorative — it now
 *    runs the docs search through /docs?q=, which DocsPage reads.
 */

const SUGGESTIONS: [string, string][] = [
  ['Start a new claim', '/claims/new'],
  ['All claims', '/claims'],
  ['Exports & history', '/exports'],
  ['Carrier profiles', '/settings/carriers'],
  ['Docs', '/docs'],
  ['Get help', '/contact'],
]

export default function NotFoundPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  function onSearch(event: FormEvent) {
    event.preventDefault()
    navigate(q.trim() ? `/docs?q=${encodeURIComponent(q.trim())}` : '/docs')
  }

  return (
    <div className="k-landing">
      <MktNav />

      <main className="k-404">
        <div className="k-404-num">404</div>
        <h1 className="k-404-h">This isn't a page we recognize.</h1>
        <p className="k-404-sub">
          The page you're looking for isn't here. It might have been moved, renamed, or the link you
          followed was wrong. The good news: Kevin doesn't lose your work, only this URL.
        </p>

        <div className="k-404-actions">
          {session && (
            <Link to="/claims" className="k-btn k-btn--lg">
              Go to my claims →
            </Link>
          )}
          <Link to="/" className={session ? 'k-btn k-btn--ghost k-btn--lg' : 'k-btn k-btn--lg'}>
            Back to homepage
          </Link>
        </div>

        <div className="k-404-suggest">
          <div className="k-404-suggest-h">You might be looking for…</div>
          <div className="k-404-suggest-grid">
            {SUGGESTIONS.map(([label, path]) => (
              <Link key={path} to={path} className="k-404-suggest-row">
                <Icon d={I.chevright} size={12} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{label}</span>
                <span
                  style={{
                    fontFamily: 'var(--k-font-mono)',
                    fontSize: 11,
                    color: 'var(--k-fg-4)',
                  }}
                >
                  {path}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <form className="k-404-search" onSubmit={onSearch}>
          <Icon d={I.search} size={14} />
          <input
            placeholder="Or search the docs and help center…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search the docs"
          />
          <kbd>⏎</kbd>
        </form>
      </main>

      <MktFooter />
    </div>
  )
}
