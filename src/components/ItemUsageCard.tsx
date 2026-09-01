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
 * Below the bar: TOTAL AVAILABLE, then the two pools it is made of. The
 * customer's actual question is "how much can I run right now?", and the answer
 * spans both -- but the cycle RESETS at period_end while credits ROLL OVER
 * forever, so the total alone would drop on renewal day with nothing to explain
 * it, and the parts alone made them do arithmetic. Both, total first.
 *
 * Spend order is cycle-first; credits are drawn once the cycle hits 0. That
 * is stated ON SCREEN, not just here: the first person to read this page
 * guessed it the other way round, and getting it backwards changes what a
 * customer thinks they are buying.
 *
 * PROVENANCE: `credit_balance` is a bare number -- the payload carries no
 * source field. "Purchased" is accurate because buying is currently the only
 * way credits are minted; if the backend ever grants them (a comp, a goodwill
 * credit), this needs a real field rather than a hardcoded word.
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
  // The question the customer arrives with: how much can I run right now?
  const available = cycleRemaining + credits

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

        {/* Below the bar: the TOTAL first, then what it is made of.
            The bar tracks the cycle (the pool that resets, so the only one with
            a meaningful "full"), but the question a customer actually arrives
            with is "how much can I do right now?" -- and the answer is both
            pools added. Showing only the parts made them do the arithmetic;
            showing only the total hid the renewal-day drop. Both, in that
            order, answers the question without losing the distinction. */}
        {credits > 0 ? (
          <div className="k-usage-total">
            <div className="k-usage-total-hd">
              <span>Total available</span>
              <strong>{available.toLocaleString()} line items</strong>
            </div>
            <ul className="k-usage-breakdown">
              <li>
                <span className="k-usage-bd-n">{cycleRemaining.toLocaleString()}</span> left this
                cycle <span className="k-usage-bd-q">(resets {resetsOn ?? 'at renewal'})</span>
              </li>
              <li>
                <span className="k-usage-bd-n">{credits.toLocaleString()}</span> rollover credits{' '}
                <span className="k-usage-bd-q">
                  {onCredits ? '(purchased · in use now · never expire)' : '(purchased · never expire)'}
                </span>
              </li>
            </ul>
            {/* Spend order was only ever in a code comment, and the first person
                to read this screen guessed it backwards -- so it is on screen
                now. Cycle first, credits after: that is what makes the rollover
                worth having, since unspent credits survive the reset. */}
            <p className="k-usage-order">
              Your cycle allowance is used first — credits are only drawn once it reaches zero.
            </p>
          </div>
        ) : (
          <div className="k-store-keys">
            <span
              className="k-store-key"
              style={{ color: tight ? 'var(--k-warn)' : 'var(--k-fg-4)' }}
            >
              {cycleRemaining.toLocaleString()} left this cycle
              {resetsOn && !free ? ` · resets ${resetsOn}` : ''}
            </span>
          </div>
        )}

        {over > 0 ? (
          <div className="k-store-keys">
            <span className="k-store-key" style={{ color: 'var(--k-warn)' }}>
              {over.toLocaleString()} over · ${overageCost.toFixed(2)} on the next invoice
            </span>
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
