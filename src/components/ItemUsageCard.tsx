import { OVERAGE_PRICE } from '../lib/billing'
import type { ItemUsage } from '../lib/types'

/**
 * Ported from design/components/settings-pages.jsx (ItemUsageCard).
 *
 * Reuses the storage card's .k-store-* meter vocabulary rather than inventing
 * a second one. Everything shown is read from the payload; nothing about the
 * allowance is derived here (rule 20).
 */
export default function ItemUsageCard({
  plan,
  items,
  onAddCredits,
  onUpgrade,
}: {
  plan: string
  items: ItemUsage
  onAddCredits: () => void
  onUpgrade?: React.ReactNode
}) {
  const free = plan === 'free'
  const allowance = items.included + items.credits
  const over = Math.max(items.used - allowance, 0)
  const remaining = Math.max(allowance - items.used, 0)
  const pct = allowance > 0 ? Math.min(Math.round((items.used / allowance) * 1000) / 10, 100) : 100
  const overageCost = Math.round(over * OVERAGE_PRICE * 100) / 100
  // Warn on the last fifth, so running out is never a surprise.
  const tight = over === 0 && remaining <= allowance * 0.2

  return (
    <section className="k-set-card">
      <div className="k-set-card-hd">Line items{free ? ' · free tier' : ''}</div>
      <div className="k-set-card-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--k-fg-3)' }}>
            <strong
              style={{ color: 'var(--k-fg)', fontFamily: 'var(--k-font-mono)', fontSize: 15 }}
            >
              {items.used.toLocaleString()}
            </strong>
            <span>
              {' '}
              of {allowance.toLocaleString()} {free ? 'free items' : 'included'}
            </span>
            {items.credits > 0 ? (
              <span style={{ color: 'var(--k-fg-4)' }}>
                {' '}
                ({items.included.toLocaleString()} + {items.credits.toLocaleString()} credits)
              </span>
            ) : null}
          </div>
          <div
            style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}
          >
            {pct}%
          </div>
        </div>

        <div className="k-store-track">
          <div
            className={`k-store-fill ${over > 0 ? 'k-store-fill--cold' : 'k-store-fill--warm'}`}
            style={{ width: `${Math.max(pct, 0.6)}%` }}
          />
        </div>

        <div className="k-store-keys">
          <span className="k-store-key">
            <i className={`k-store-dot ${over > 0 ? 'k-store-dot--cold' : 'k-store-dot--warm'}`} />
            {items.used.toLocaleString()} items produced
          </span>
          <span
            className="k-store-key"
            style={{ color: over > 0 || tight ? 'var(--k-warn)' : 'var(--k-fg-4)' }}
          >
            {over > 0
              ? `${over.toLocaleString()} over · $${overageCost.toFixed(2)} on the next invoice`
              : `${remaining.toLocaleString()} remaining`}
          </span>
        </div>

        <div className="k-store-note">
          {free ? (
            <p>
              <strong>No clock on the free tier.</strong> Your {items.included.toLocaleString()}{' '}
              items last as long as you need them — take a week or take three months. Kevin asks you
              to start Pro when they run out, not before.
            </p>
          ) : (
            <p>
              <strong>Going over never locks a claim.</strong> The work finishes and the overage
              bills after — items past {allowance.toLocaleString()} are ${OVERAGE_PRICE.toFixed(2)}{' '}
              each.
            </p>
          )}
          {/* Rule 9c. The likeliest support ticket, answered on the meter itself. */}
          <p className="k-usage-fine">
            <strong>Deleting an item does not give the quota back.</strong> The count records items
            Kevin produced, not items you kept — the pricing lookups behind a row are already paid
            for by the time it appears.
          </p>
          <p>
            {free
              ? 'Claims are unlimited even on the free tier. Estate sales are billed per estate rather than against these items.'
              : 'Claims stay unlimited on Pro. Estate sales are billed per estate rather than against this allowance.'}
          </p>
        </div>

        <div className="k-usage-actions">
          <button type="button" className="k-btn k-btn--ghost k-btn--sm" onClick={onAddCredits}>
            Add credits
          </button>
          {free ? onUpgrade : null}
        </div>
      </div>
    </section>
  )
}
