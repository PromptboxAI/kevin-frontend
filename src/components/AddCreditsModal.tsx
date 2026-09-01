import { useEffect, useState } from 'react'
import { I, Icon } from './Icon'
import { CREDIT_BLOCKS, OVERAGE_PRICE, startCreditsCheckout } from '../lib/billing'
import { ApiError } from '../lib/api'

/**
 * Ported from design/components/settings-pages.jsx (AddCreditsModal).
 *
 * Credits are priced at the SAME $0.20 an item as Pro overage, so this must
 * never read as an upgrade path or a discount — no plan comparison, no "best
 * value" nudge, just a quantity and a price. Built from the export-modal shell
 * and the .k-volume option grid the intake form already uses.
 */
export default function AddCreditsModal({
  creditsBefore,
  onClose,
}: {
  creditsBefore: number
  onClose: () => void
}) {
  const [pick, setPick] = useState<number>(CREDIT_BLOCKS[1])
  // Disabled in flight: a second click mints a second Stripe session, and a
  // customer who completes both is charged twice.
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const buy = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await startCreditsCheckout(pick, creditsBefore)
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
    <div
      className="k-export-stage"
      style={{ position: 'fixed', inset: 0, background: 'transparent', height: '100%', zIndex: 100 }}
    >
      <div className="k-export-scrim" onClick={onClose} />
      <div
        className="k-export-modal"
        style={{ maxWidth: 520 }}
        role="dialog"
        aria-modal="true"
        aria-label="Add item credits"
      >
        <div className="k-export-hd">
          <div>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-fg-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              Item credits
            </div>
            <div
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 22,
                letterSpacing: '-0.02em',
                marginTop: 2,
              }}
            >
              Add credits
            </div>
          </div>
          <button
            type="button"
            className="k-btn k-btn--ghost"
            onClick={onClose}
            style={{ padding: 6, lineHeight: 0 }}
            aria-label="Close"
          >
            <span style={{ display: 'inline-flex', transform: 'rotate(45deg)' }}>
              <Icon d={I.plus} size={16} />
            </span>
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="k-volume-grid">
            {CREDIT_BLOCKS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPick(n)}
                className={`k-volume ${pick === n ? 'k-volume--on' : ''}`}
                aria-pressed={pick === n}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{n.toLocaleString()}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--k-fg-4)',
                    fontFamily: 'var(--k-font-mono)',
                    marginTop: 4,
                  }}
                >
                  ${(n * OVERAGE_PRICE).toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          <div
            style={{
              background: 'var(--k-bg-2)',
              border: '1px solid var(--k-line)',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 12.5,
              color: 'var(--k-fg-3)',
              lineHeight: 1.55,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {pick.toLocaleString()} items × ${OVERAGE_PRICE.toFixed(2)}
              </span>
              <span className="k-mono" style={{ color: 'var(--k-fg-2)' }}>
                ${(pick * OVERAGE_PRICE).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--k-line)',
                fontWeight: 600,
              }}
            >
              <span style={{ color: 'var(--k-fg-2)' }}>Charged today</span>
              <span className="k-mono" style={{ color: 'var(--k-fg)' }}>
                ${(pick * OVERAGE_PRICE).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--k-fg-4)', lineHeight: 1.55 }}>
            Credits are used only after your included allowance runs out, and they carry over month
            to month. Buying credits does not change your plan or your renewal date.
          </div>

          {error ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'oklch(0.58 0.19 25 / 0.07)',
                border: '1px solid oklch(0.58 0.19 25 / 0.3)',
                fontSize: 12.5,
                color: 'var(--k-fg-2)',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--k-line)',
            background: 'var(--k-bg-2)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="k-btn" onClick={() => void buy()} disabled={busy}>
            {busy
              ? 'Redirecting to Stripe…'
              : `Add ${pick.toLocaleString()} items — $${(pick * OVERAGE_PRICE).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
