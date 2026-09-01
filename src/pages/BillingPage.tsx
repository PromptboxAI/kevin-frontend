import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AppHeader from '../components/AppHeader'
import AddCreditsModal from '../components/AddCreditsModal'
import ItemUsageCard from '../components/ItemUsageCard'
import UpgradeProButton from '../components/UpgradeProButton'
import { ApiError, api } from '../lib/api'
import { clearPending, openBillingPortal, pollMe, readPending } from '../lib/billing'
import type { MeResponse } from '../lib/types'

/**
 * Settings → Billing. Ported from design/components/settings-pages.jsx
 * (SettingsBilling) and design/pages/35-Settings-billing.html.
 *
 * Only Billing exists in the production app so far, so the other sidebar
 * entries render inert with a tooltip — the same treatment AvatarMenu gives
 * unbuilt destinations. A visible label beats a link to nowhere.
 */

const NAV: { id: string; label: string; built?: boolean }[] = [
  { id: 'my-profile', label: 'My profile' },
  { id: 'agency', label: 'Business' },
  { id: 'carriers', label: 'Carrier profiles' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'export', label: 'Export defaults' },
  { id: 'integrations', label: 'Xactimate' },
  { id: 'billing', label: 'Billing', built: true },
  { id: 'api', label: 'API & webhooks' },
]

const PLAN_NAME: Record<string, string> = {
  free: 'Free tier',
  pro: 'Pro',
  enterprise: 'Enterprise',
  comped: 'Complimentary',
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [credits, setCredits] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const {
    data: me,
    isPending,
    error,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
    // The shared ['me'] query is staleTime: Infinity and AppHeader has usually
    // already cached it, so without this Billing would render whatever was
    // fetched before checkout and never ask again -- the page just sits there
    // showing the old balance. This is the ONE surface where /v1/me changing
    // underneath us is the whole point, so it always refetches on mount.
    refetchOnMount: 'always',
  })

  /**
   * RETURN FROM STRIPE. The redirect is not proof of payment — the customer can
   * beat the webhook home — so this never trusts having landed here. It polls
   * /v1/me until the field it is waiting for actually moves.
   *
   * A timeout is NOT a failure: the money may be fine and the webhook merely
   * slow, so the copy says "still confirming", never "payment failed".
   */
  // Derived at first render rather than set inside the effect: if a checkout is
  // pending we are already confirming, and there is no frame where the page
  // claims otherwise.
  const [confirming, setConfirming] = useState<'waiting' | 'slow' | null>(() =>
    readPending() ? 'waiting' : null,
  )

  useEffect(() => {
    const pending = readPending()
    if (!pending) {
      // No marker. It can genuinely go missing -- sessionStorage is per-tab and
      // per-origin, so a checkout finished in another tab, or returned to a
      // different host than it started from, comes back with nothing stored.
      // The refetchOnMount above still pulls fresh state, so the page is
      // correct; it simply shows the result without narrating the wait.
      return
    }
    let cancelled = false
    void pollMe(pending).then((result) => {
      if (cancelled) return
      clearPending()
      setConfirming(result.settled ? null : 'slow')
      // The ['me'] query is staleTime: Infinity, so it will not refetch on its
      // own — push the settled payload in so the header and meter both update.
      if (result.settled && result.me) queryClient.setQueryData(['me'], result.me)
    })
    return () => {
      cancelled = true
    }
  }, [queryClient])

  const portal = async () => {
    if (portalBusy) return
    setPortalBusy(true)
    setPortalError(null)
    try {
      await openBillingPortal()
      // Success redirects to Stripe; nothing below runs.
    } catch (err) {
      setPortalError(
        err instanceof ApiError
          ? err.message422
          : err instanceof Error
            ? err.message
            : 'Could not reach billing. Try again in a moment.',
      )
      setPortalBusy(false)
    }
  }

  const quota = me?.quota
  const plan = quota?.plan
  // Dunning is ORTHOGONAL to plan: a failed card leaves the account on Pro and
  // moves billing_state to past_due, so we warn without locking anyone out.
  const dunning = quota?.billing_state === 'past_due'
  const canceled = quota?.billing_state === 'canceled'
  const showPortal = plan === 'pro' || plan === 'enterprise'

  return (
    <div className="k-settings">
      <AppHeader />

      <div className="k-settings-body">
        <aside className="k-settings-side">
          <div style={{ padding: '20px 16px 12px' }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--k-fg-4)',
                fontFamily: 'var(--k-font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Settings
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 22,
                letterSpacing: '-0.018em',
                margin: '4px 0 0',
              }}
            >
              Billing
            </h2>
          </div>
          <nav style={{ padding: '4px 8px' }}>
            {NAV.map((item) =>
              item.built ? (
                <span key={item.id} className="k-side-item k-side-item--on">
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                </span>
              ) : (
                <span
                  key={item.id}
                  className="k-side-item k-tab--todo"
                  title="Not built yet in the production app"
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                </span>
              ),
            )}
          </nav>
        </aside>

        <main className="k-settings-main">
          <div className="k-settings-hd">
            <div
              style={{
                fontSize: 11,
                color: 'var(--k-fg-4)',
                fontFamily: 'var(--k-font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Plan · payment · usage
            </div>
          </div>

          {confirming ? (
            <div
              style={{
                margin: '0 0 14px',
                padding: '12px 14px',
                borderRadius: 8,
                background: 'var(--k-accent-soft)',
                border: '1px solid oklch(0.45 0.13 255 / 0.25)',
                fontSize: 13,
                color: 'var(--k-fg-2)',
                lineHeight: 1.55,
              }}
            >
              {confirming === 'waiting' ? (
                <>
                  <strong>Confirming your payment…</strong> This usually takes a few seconds.
                </>
              ) : (
                <>
                  <strong>Still confirming with Stripe.</strong> Your payment may well have gone
                  through — this page updates as soon as it lands, and nothing is charged twice if
                  you wait. Refresh in a moment, or check your invoices in the billing portal.
                </>
              )}
            </div>
          ) : null}

          {portalError ? (
            <div
              style={{
                margin: '0 0 14px',
                padding: '10px 12px',
                borderRadius: 8,
                background: 'oklch(0.58 0.19 25 / 0.07)',
                border: '1px solid oklch(0.58 0.19 25 / 0.3)',
                fontSize: 12.5,
                color: 'var(--k-fg-2)',
              }}
            >
              {portalError}
            </div>
          ) : null}

          {isPending ? (
            <section className="k-set-card">
              <div className="k-set-card-hd">Your plan</div>
              <div className="k-set-card-body" style={{ color: 'var(--k-fg-4)', fontSize: 13 }}>
                Loading your account…
              </div>
            </section>
          ) : error ? (
            <section className="k-set-card">
              <div className="k-set-card-hd">Your plan</div>
              <div className="k-set-card-body" style={{ fontSize: 13, color: 'var(--k-fg-3)' }}>
                Could not load your account.{' '}
                {error instanceof ApiError ? error.message422 : 'Try again in a moment.'}
              </div>
            </section>
          ) : (
            <>
              <section className="k-set-card">
                <div className="k-set-card-hd">Your plan</div>
                <div className="k-set-card-body">
                  {plan ? (
                    <>
                      <div style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.6 }}>
                        You're on{' '}
                        <strong style={{ color: 'var(--k-fg-2)' }}>
                          {PLAN_NAME[plan] ?? plan}
                        </strong>
                        {plan === 'pro' ? ' — $249/mo, unlimited claims, 2,000 line items a month included, cancel anytime.' : null}
                        {plan === 'free' ? ' — your first 250 line items are free, with no time limit.' : null}
                        {plan === 'comped' ? ' — nothing is billed and no card is required.' : null}
                        {plan === 'enterprise' ? ' — billed under your order form.' : null}
                      </div>
                      {dunning ? (
                        <div className="k-dunning">
                          <strong>Your last payment didn't go through.</strong> You are still on{' '}
                          {PLAN_NAME[plan] ?? plan} and nothing is interrupted — claims, exports and
                          your item allowance all keep working. Update your card and Stripe retries
                          automatically.
                        </div>
                      ) : null}
                      {canceled ? (
                        <div className="k-dunning k-dunning--quiet">
                          <strong>Your subscription is cancelled.</strong> Everything you have built
                          stays downloadable — nothing is deleted (rule 15). Start Pro again whenever
                          you need it.
                        </div>
                      ) : null}
                      {quota?.period_end && plan === 'pro' && !canceled ? (
                        <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--k-fg-4)' }}>
                          Renews {new Date(quota.period_end).toLocaleDateString()} · your item
                          allowance resets then.
                        </div>
                      ) : null}
                      <div className="k-usage-actions">
                        {showPortal ? (
                          <button
                            type="button"
                            className="k-btn"
                            onClick={() => void portal()}
                            disabled={portalBusy}
                          >
                            {portalBusy ? 'Redirecting…' : 'Manage subscription'}
                          </button>
                        ) : null}
                        {plan === 'free' ? <UpgradeProButton planBefore={plan} /> : null}
                      </div>
                    </>
                  ) : (
                    /* The backend has not shipped the billing fields yet. Say so
                       rather than inventing a plan the account may not be on. */
                    <div style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.6 }}>
                      Billing details aren't available on this account yet. Once{' '}
                      <code>GET /v1/me</code> returns its <code>quota</code> object, your plan and
                      usage appear here.
                    </div>
                  )}
                </div>
              </section>

              {quota ? (
                <ItemUsageCard
                  quota={quota}
                  onAddCredits={() => setCredits(true)}
                  onUpgrade={<UpgradeProButton planBefore={quota.plan} className="k-btn k-btn--sm" />}
                />
              ) : null}
            </>
          )}
        </main>
      </div>

      {credits ? (
        <AddCreditsModal
          creditsBefore={quota?.credit_balance ?? 0}
          onClose={() => setCredits(false)}
        />
      ) : null}
    </div>
  )
}
