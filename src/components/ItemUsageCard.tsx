import { CREDIT_BLOCKS, OVERAGE_PRICE } from '../lib/billing'
import type { Quota } from '../lib/types'

/**
 * Line items — the metered dimension of Pro. Ported from `LineItemUsageCard` in
 * the design's settings-pages.jsx: headline + right-aligned percent, the
 * k-store-track bar, two k-store-key dots (cycle / rollover), the two-paragraph
 * k-store-note, then Add credits above a price hint.
 *
 * Data is LIVE from `quota` on /v1/me. The design's LI_USAGE seed
 * (1,418 of 2,000 · 500 credits · resets Oct 1) stands in for
 * GET /v1/account/usage and is not reproduced.
 *
 * THREE deviations, each noted:
 *
 * 1. **Empty bar at zero.** The design floors the width at 0.6% so a small
 *    non-zero value stays visible. Correct — but applied at exactly 0 it draws
 *    a sliver on an account that has produced nothing, implying consumption
 *    that never happened, on a billing surface. The floor is kept for every
 *    non-zero value and dropped at 0.
 *
 * 2. **Credit block prices are derived, not literal.** The design's hint reads
 *    "500 for $75 · 1,000 for $140" — $0.15 and $0.14 an item. CLAUDE.md rule
 *    9c says credits sell at the SAME $0.20 as Pro overage, and AddCreditsModal
 *    charges exactly that, so the literal hint would have contradicted the
 *    modal one click away. It is computed from the same constants the modal
 *    uses. Flagged to design: if credits are meant to be discounted, rule 9c
 *    and the modal need to change too, not just this line.
 *
 * 3. **An overage line when both pools are spent.** Not in the design, which
 *    has no over-allowance state. What is owed belongs on the page that bills
 *    it.
 *
 * The free tier gets its own copy (rule 9b: 250 items, metered, NO clock — no
 * reset date, because that pool never resets).
 *
 * PROVENANCE: `credit_balance` is a bare number — the payload carries no source
 * field. "Purchased" is accurate because buying is currently the only way
 * credits are minted; if the backend ever grants them, this needs a real field.
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

  // Consumption against the cycle allowance, which is the pool the bar tracks.
  const cycleUsed = Math.min(quota.items_used, quota.included_items)
  const pct =
    quota.included_items > 0
      ? Math.min(Math.round((cycleUsed / quota.included_items) * 1000) / 10, 100)
      : 0

  // Billable overage begins only once BOTH pools are empty.
  const over = Math.max(quota.items_used - (quota.included_items + credits), 0)
  const overageCost = Math.round(over * OVERAGE_PRICE * 100) / 100

  const resetsOn = quota.period_end
    ? new Date(quota.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  const hint = CREDIT_BLOCKS.slice(0, 2)
    .map((n) => `${n.toLocaleString()} for $${(n * OVERAGE_PRICE).toFixed(0)}`)
    .join(' · ')

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

        <div className="k-store-track">
          {/* Deviation 1: the design's 0.6% floor, but only above zero. */}
          {pct > 0 ? (
            <div
              className={`k-store-fill ${over > 0 ? 'k-store-fill--cold' : 'k-store-fill--warm'}`}
              style={{ width: Math.max(pct, 0.6) + '%' }}
            />
          ) : null}
        </div>

        <div className="k-store-keys">
          <span className="k-store-key">
            <i className="k-store-dot k-store-dot--warm" />
            {cycleRemaining.toLocaleString()} left
            {free ? ' · no deadline' : resetsOn ? ` this cycle · resets ${resetsOn}` : ' this cycle'}
          </span>
          <span className="k-store-key">
            <i className="k-store-dot k-store-dot--cold" />
            {credits.toLocaleString()} rollover credits · purchased, never expire
          </span>
          {/* Deviation 3: what is actually owed, once both pools are spent. */}
          {over > 0 ? (
            <span className="k-store-key" style={{ color: 'var(--k-warn)' }}>
              {over.toLocaleString()} over · ${overageCost.toFixed(2)} on the next invoice
            </span>
          ) : null}
        </div>

        <div className="k-store-note">
          {free ? (
            <p>
              <strong>No clock on the free tier.</strong> Your{' '}
              {quota.included_items.toLocaleString()} items last as long as you need them — take a
              week or take three months. Kevin asks you to start Pro when they run out, not before.
            </p>
          ) : (
            <p>
              Your cycle allowance is used first — credits are only drawn once it reaches zero.{' '}
              <strong>Going over never locks a claim.</strong> The work finishes and the overage
              bills after — items past your allowance and credits are ${OVERAGE_PRICE.toFixed(2)}{' '}
              each.
            </p>
          )}
          {/* Rule 9c. The likeliest support ticket, answered on the meter itself. */}
          <p>
            Deleting an item does not give the quota back — the count records items Kevin produced,
            not items you kept.{' '}
            {free
              ? 'Claims are unlimited even on the free tier; estate sales bill per estate rather than against these items.'
              : 'Claims stay unlimited on Pro; estate sales bill per estate rather than against this allowance.'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--k-line)',
          }}
        >
          <button type="button" className="k-btn" onClick={onAddCredits}>
            Add credits
          </button>
          {free ? onUpgrade : null}
          <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
            {hint} · credits never expire
          </span>
        </div>
      </div>
    </section>
  )
}
