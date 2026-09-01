import { useState } from 'react'
import { ApiError } from '../lib/api'
import { startProCheckout } from '../lib/billing'

/**
 * Ported from design/components/shared.jsx (UpgradeProButton).
 *
 * Shared because the same action is offered from the usage meter and from the
 * quota-truncation alert. An in-app upgrade goes straight to Stripe rather than
 * bouncing an already signed-in adjuster to a pricing page to start over.
 * Disabled in flight: a second click mints a second Stripe session.
 */
export default function UpgradeProButton({
  planBefore,
  className,
  label,
}: {
  planBefore: string
  className?: string
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const go = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await startProCheckout(planBefore)
      // Success redirects to Stripe; nothing below runs.
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message422
          : err instanceof Error
            ? err.message
            : 'Could not reach billing. Try again in a moment.',
      )
      setBusy(false)
    }
  }

  return (
    <span
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}
    >
      <button
        type="button"
        className={className ?? 'k-btn'}
        onClick={() => void go()}
        disabled={busy}
      >
        {busy ? 'Redirecting…' : (label ?? 'Upgrade to Pro')}
      </button>
      {error ? (
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--k-danger)',
            lineHeight: 1.4,
            maxWidth: 260,
          }}
        >
          {error}
        </span>
      ) : null}
    </span>
  )
}
