import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { ApiError, portal } from '../lib/api'
import { isApiConfigured } from '../lib/env'

/**
 * The insured's read-only view of a shared claim.
 *
 * Scaffold state: this renders the link's real lifecycle (loading, dead link,
 * reachable) but not yet the redacted claim itself. The server decides what
 * this audience may see -- never fetch everything and hide it client-side.
 *
 * CONTRACT NOTE for whoever builds the item list here (backend, 2026-08):
 * portal item rows have exactly TWO states -- editable and resolved. Edits to
 * an EXISTING item (age_years, claimed_rcv, replaced_qty, rcv) write directly
 * and are live on the next read, so they never queue. The "Sent to your
 * adjuster" pending state belongs ONLY to proposed NEW items, which are the
 * only thing that lands in the holding queue. Do not build a third,
 * pending-edit state.
 */
export default function PortalPage() {
  const { token = '' } = useParams()

  const { data, error, isPending } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => portal.get<Record<string, unknown>>(token),
    enabled: isApiConfigured && token !== '',
    // A dead link is a settled answer, not a blip.
    retry: (count, err) => !(err instanceof ApiError) && count < 2,
  })

  if (!isApiConfigured) {
    return (
      <Shell title="Not configured">
        <p>
          This deployment has no <code>VITE_API_BASE_URL</code>. Set it to the backend web
          service origin and redeploy.
        </p>
      </Shell>
    )
  }

  if (isPending) {
    return (
      <Shell title="Loading your inventory…">
        <p>Fetching the items your adjuster shared with you.</p>
      </Shell>
    )
  }

  // 410 covers unknown, expired and revoked -- indistinguishable by design.
  if (error instanceof ApiError && error.status === 410) {
    return (
      <Shell title="This link is no longer active">
        <p>Ask your adjuster for a new one.</p>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell title="Something went wrong">
        <p>We couldn't load this inventory. Please try again shortly.</p>
        {error instanceof ApiError && error.requestId ? (
          <p className="k-portal-ref">Reference: {error.requestId}</p>
        ) : null}
      </Shell>
    )
  }

  return (
    <Shell title="Your inventory">
      <p>This link is active. The shared inventory will render here.</p>
      <p className="k-portal-ref">
        {Array.isArray((data as { items?: unknown[] })?.items)
          ? `${(data as { items: unknown[] }).items.length} items shared`
          : 'Connected to the claim.'}
      </p>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="k-portal">
      <div className="k-portal-card">
        <p className="k-portal-brand">
          Kevin<span>.</span>
        </p>
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  )
}
