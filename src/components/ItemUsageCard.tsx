import { OVERAGE_PRICE } from '../lib/billing'
import type { Quota } from '../lib/types'

/**
 * Ported from design/components/settings-pages.jsx (ItemUsageCard).
 *
 * Reuses the storage card's .k-store-* meter vocabulary rather than inventing
 * a second one. Everything shown is read from the payload (rule 20).
 *
 * TWO POOLS, SHOWN SEPARATELY -- never summed into one number:
 *
 *   cycle quota   `items_remaining` of `included_items`, RESETS at period_end
 *   credits       `credit_balance`, bought, ROLLS OVER forever
 *
 * They are spent cycle-first: credits are only drawn once the cycle allowance
 * hits 0. Summing them into a single "2,500 remaining" reads fine today and
 * then lurches on renewal day, when the same account silently drops to 500 --
 * a collapse the customer has no way to explain. Showing the cycle in the
 * meter and credits as their own balance makes the reset legible in advance.
 */
export default function ItemUsageCard({
  quota,
  onAddCredits,
  onUpgrade,
}: {
  quota: Quota
  onAddCredits: () => void
  onUpgrade?: React.ReactNode
}) {
  const free = quota.plan === 'free'
  const credits = quota.credit_balance
  const cycleRemaining = quota.items_remaining

  // The bar tracks the CYCLE only -- that is the pool that resets, so it is the
  // only one with a meaningful "full". Credits sit beside it as a balance.
  const cycleUsed = Math.min(quota.items_used, quota.included_items)
  const pct =
    quota.included_items > 0
      ? Math.min(Math.round((cycleUsed / quota.included_items) * 1000) / 10, 100)
      : 100

  // Billable overage begins only once BOTH pools are empty.
  const over = Math.max(quota.items_used - (quota.included_items + credits), 0)
  const overageCost = Math.round(over * OVERAGE_PRICE * 100) / 100
  const tight = over === 0 && credits === 0 && cycleRemaining <= quota.included_items * 0.2
  const onCredits = cycleRemaining === 0 && credits > 0

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
              {cycleRemaining.toLocaleString()}
            </strong>
            <span>
              {' '}
              of {quota.included_items.toLocaleString()} {free ? 'free items' : 'this cycle'}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
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
            {quota.items_used.toLocaleString()} items produced
          </span>
          <span
            className="k-store-key"
            style={{ color: over > 0 || tight ? 'var(--k-warn)' : 'var(--k-fg-4)' }}
          >
            {over > 0
              ? `${over.toLocaleString()} over · $${overageCost.toFixed(2)} on the next invoice`
              : `${cycleRemaining.toLocaleString()} left this cycle`}
          </span>
        </div>

        {/* Credits get their own block rather than a clause in a sentence: it is
            money the customer spent, and after a purchase they look here first
            to confirm it landed. */}
        {credits > 0 ? (
          <div className={`k-credit-bal ${onCredits ? 'k-credit-bal--active' : ''}`}>
            <div className="k-credit-bal-n">+{credits.toLocaleString()}</div>
            <div className="k-credit-bal-t">
              <strong>item credits{onCredits ? ' · in use now' : ''}</strong>
              <span>
                {onCredits
                  ? 'Your cycle allowance is spent, so new items draw on these.'
                  : 'Drawn only once this cycle’s allowance runs out. They never expire and the renewal does not reset them.'}
              </span>
            </div>
          </div>
        ) : null}

        <div className="k-store-note">
          {free ? (
            <p>
              <strong>No clock on the free tier.</strong> Your{' '}
              {quota.included_items.toLocaleString()} items last as long as you need them — take a
              week or take three months. Kevin asks you to start Pro when they run out, not before.
            </p>
          ) : (
            <p>
              <strong>Going over never locks a claim.</strong> The work finishes and the overage
              bills after — items past your allowance and credits are ${OVERAGE_PRICE.toFixed(2)}{' '}
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
