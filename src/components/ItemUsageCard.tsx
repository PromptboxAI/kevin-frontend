import { OVERAGE_PRICE } from '../lib/billing'
import type { Quota } from '../lib/types'

/**
 * Ported from design/components/settings-pages.jsx (ItemUsageCard).
 *
 * ONE capacity number, TWO visible pools.
 *
 * The adjuster's actual question is "how many items can I run?", and the answer
 * is cycle + credits -- so that total is the headline. But the two halves are
 * not interchangeable: the cycle RESETS at period_end and credits ROLL OVER
 * forever, so a bare "2,500" would collapse to 500 on renewal day with nothing
 * on screen to explain it.
 *
 * Both are true at once, so the meter shows the total and splits the track into
 * the two pools -- the same one-track-two-segments pattern the storage card
 * uses for active vs archived. The reset date is attached to the cycle segment,
 * so what will change and what will not is legible before it happens.
 *
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
  const available = cycleRemaining + credits

  // Track widths are shares of the account's full capacity, so the bar shrinks
  // as items are produced rather than always looking full.
  const capacity = quota.included_items + credits
  const pctOf = (n: number) => (capacity > 0 ? (n / capacity) * 100 : 0)

  // Billable overage begins only once BOTH pools are empty.
  const over = Math.max(quota.items_used - capacity, 0)
  const overageCost = Math.round(over * OVERAGE_PRICE * 100) / 100
  const tight = over === 0 && available > 0 && available <= capacity * 0.2
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
              {available.toLocaleString()}
            </strong>
            <span> items available</span>
            {credits > 0 ? (
              <span style={{ color: 'var(--k-fg-4)' }}>
                {' '}
                — {cycleRemaining.toLocaleString()} this cycle + {credits.toLocaleString()} credits
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
            {quota.items_used.toLocaleString()} used
          </div>
        </div>

        {/* One track, two pools. Cycle in accent, credits in their own tone --
            deliberately NOT the storage card's greyed "archived" fill, which
            would make paid capacity read as the lesser half. */}
        <div className="k-store-track">
          <div className="k-store-fill k-store-fill--warm" style={{ width: `${pctOf(cycleRemaining)}%` }} />
          {credits > 0 ? (
            <div className="k-store-fill k-store-fill--credit" style={{ width: `${pctOf(credits)}%` }} />
          ) : null}
        </div>

        <div className="k-store-keys">
          <span className="k-store-key">
            <i className="k-store-dot k-store-dot--warm" />
            {cycleRemaining.toLocaleString()} this cycle
            {resetsOn && !free ? ` · resets ${resetsOn}` : ''}
          </span>
          {credits > 0 ? (
            <span className="k-store-key">
              <i className="k-store-dot k-store-dot--credit" />
              {credits.toLocaleString()} credits · never expire
              {onCredits ? ' · in use now' : ''}
            </span>
          ) : null}
          {over > 0 ? (
            <span className="k-store-key" style={{ color: 'var(--k-warn)' }}>
              {over.toLocaleString()} over · ${overageCost.toFixed(2)} on the next invoice
            </span>
          ) : tight ? (
            <span className="k-store-key" style={{ color: 'var(--k-warn)' }}>
              running low
            </span>
          ) : null}
        </div>

        <div className="k-store-note">
          {credits > 0 ? (
            <p>
              <strong>Your cycle allowance is spent first.</strong> Credits are only drawn once this
              cycle&rsquo;s {quota.included_items.toLocaleString()} run out
              {onCredits ? ' — which is where you are now' : ''}. The cycle resets
              {resetsOn && !free ? ` on ${resetsOn}` : ''}; your{' '}
              {credits.toLocaleString()} credits carry over and are not reset by it.
            </p>
          ) : free ? (
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
