import { OVERAGE_PRICE } from '../lib/billing'
import type { Quota } from '../lib/types'

/**
 * Ported from design/components/settings-pages.jsx (ItemUsageCard).
 *
 * Standard SaaS usage meter: ONE paradigm throughout, and that paradigm is
 * CONSUMPTION. The headline counts what has been used, the bar fills
 * left-to-right as it is used, and the percentage is of the same thing. An
 * earlier pass mixed them -- a headline counting what was left above a
 * percentage counting what was spent -- which made a brand-new account read as
 * both completely full and completely empty at the same time.
 *
 * At zero used the bar is genuinely EMPTY. No minimum-width sliver: a visible
 * indicator on an account that has produced nothing implies consumption that
 * did not happen, and this is a billing surface.
 *
 * Credits stay a separate block below, not folded into the cycle number. The
 * cycle RESETS at period_end and credits ROLL OVER forever, so a combined
 * figure would collapse on renewal day with nothing on screen to explain it.
 * Spend order is cycle-first: credits are only drawn once the cycle hits 0.
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

  // Everything below is CONSUMPTION against the cycle allowance.
  const cycleUsed = Math.min(quota.items_used, quota.included_items)
  const pct =
    quota.included_items > 0
      ? Math.min(Math.round((cycleUsed / quota.included_items) * 1000) / 10, 100)
      : 0

  // Billable overage begins only once BOTH pools are empty.
  const over = Math.max(quota.items_used - (quota.included_items + credits), 0)
  const overageCost = Math.round(over * OVERAGE_PRICE * 100) / 100
  const tight = over === 0 && credits === 0 && cycleRemaining <= quota.included_items * 0.2
  const onCredits = cycleRemaining === 0 && credits > 0

  const resetsOn = quota.period_end
    ? new Date(quota.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

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
              {quota.items_used.toLocaleString()}
            </strong>
            <span>
              {' '}
              of {quota.included_items.toLocaleString()} used{free ? '' : ' this cycle'}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
            {pct}%
          </div>
        </div>

        {/* Fills left-to-right with usage. Width is exactly pct -- at 0 used the
            track is empty, with no sliver implying work that never happened. */}
        <div className="k-store-track">
          {pct > 0 ? (
            <div
              className={`k-store-fill ${over > 0 ? 'k-store-fill--cold' : 'k-store-fill--warm'}`}
              style={{ width: `${pct}%` }}
            />
          ) : null}
        </div>

        <div className="k-store-keys">
          <span className="k-store-key" style={{ color: tight ? 'var(--k-warn)' : 'var(--k-fg-4)' }}>
            {cycleRemaining.toLocaleString()} left this cycle
            {resetsOn && !free ? ` · resets ${resetsOn}` : ''}
          </span>
          {over > 0 ? (
            <span className="k-store-key" style={{ color: 'var(--k-warn)' }}>
              {over.toLocaleString()} over · ${overageCost.toFixed(2)} on the next invoice
            </span>
          ) : null}
        </div>

        {/* Credits keep their own block: money the customer spent, and the first
            thing they look for coming back from Stripe. */}
        {credits > 0 ? (
          <div className={`k-credit-bal ${onCredits ? 'k-credit-bal--active' : ''}`}>
            <div className="k-credit-bal-n">+{credits.toLocaleString()}</div>
            <div className="k-credit-bal-t">
              <strong>item credits{onCredits ? ' · in use now' : ''}</strong>
              <span>
                {onCredits
                  ? 'Your cycle allowance is spent, so new items draw on these.'
                  : `Drawn only once this cycle’s allowance runs out. They never expire${
                      resetsOn && !free ? ` and the ${resetsOn} reset does not clear them` : ''
                    }.`}
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
              bills after — items past your allowance{credits > 0 ? ' and credits' : ''} are $
              {OVERAGE_PRICE.toFixed(2)} each.
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
