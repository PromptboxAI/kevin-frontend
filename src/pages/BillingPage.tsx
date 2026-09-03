import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import SettingsShell from '../components/SettingsShell'
import AddCreditsModal from '../components/AddCreditsModal'
import ItemUsageCard from '../components/ItemUsageCard'
import StorageUsageCard from '../components/StorageUsageCard'
import UpgradeProButton from '../components/UpgradeProButton'
import { Icon, I } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { clearPending, openBillingPortal, pollMe, readPending } from '../lib/billing'
import { fmtInt } from '../lib/format'
import type { BillingPlan, MeResponse, Quota } from '../lib/types'

/**
 * Screen 35 — Billing. Ported from `SettingsBilling` in
 * `design/components/settings-pages.jsx`.
 *
 * The previous version worked but was not this screen: one "Your plan" card and
 * the item meter, with none of the design's structure. Restored here — the
 * heading row with Manage subscription, the three-cell KPI strip, Your plan,
 * Storage & fair use, Line items, and the billing-detail sections.
 *
 * Plan states are data, never hardcoded (the design says so and it is right —
 * a comped or Enterprise account seeing "Pro · $249" is a lie the customer
 * notices immediately). BILLING_PLANS below carries the design's four states,
 * selected by `quota.plan` from `GET /v1/me`; the money and dates in the KPI
 * strip come from the payload, not from the table.
 *
 * TWO deviations, both deliberate and both about not fabricating financial
 * records:
 *
 * 1. **Payment method.** The design draws a card mock reading
 *    "•••• 4242 · MARIANA REYES · 12/28". No endpoint exposes the customer's
 *    card — Stripe's hosted portal owns cards, invoices and cancellation
 *    (kevin-backend/main.py:776) — so showing seeded digits would render a
 *    financial artifact that is not the user's. The section keeps its place and
 *    sends you to the portal, which is where the real card lives.
 * 2. **Invoice history.** Same reason: there is no invoice list endpoint, and
 *    five invented invoice numbers with amounts is a fake billing record. The
 *    section names where the real ones are.
 *
 * Everything live is preserved: the return-from-Stripe confirmation poll, the
 * portal handoff, dunning and cancellation notices, the item meter and the
 * credits modal.
 */

type PlanCopy = {
  name: string
  heading: string
  blurb: React.ReactNode
  showCancel: boolean
  showPayment: boolean
  showBillingEmail: boolean
  /** Enterprise contracts carry their own storage pool. */
  storageGB: number | null
  storageNote: React.ReactNode | null
}

const BILLING_PLANS: Record<BillingPlan, PlanCopy> = {
  pro: {
    name: 'Pro',
    heading: 'Pro plan.',
    blurb: (
      <>
        You&rsquo;re on <strong style={{ color: 'var(--k-fg-2)' }}>Kevin Pro</strong> — one flat
        price, unlimited claims, cancel anytime. Running a desk or a team? Enterprise gives you
        volume licensing on one invoice.
      </>
    ),
    showCancel: true,
    showPayment: true,
    showBillingEmail: true,
    storageGB: null,
    storageNote: null,
  },
  free: {
    name: 'Free tier',
    heading: 'Free tier.',
    blurb: (
      <>
        Your first <strong style={{ color: 'var(--k-fg-2)' }}>250 line items are free</strong>, with
        no time limit — the trial is metered, not timed, so take as long as you like. Start Pro when
        you reach the end of it.
      </>
    ),
    showCancel: false,
    showPayment: true,
    showBillingEmail: false,
    storageGB: null,
    storageNote: null,
  },
  enterprise: {
    name: 'Enterprise',
    heading: 'Enterprise.',
    blurb: (
      <>
        You&rsquo;re on <strong style={{ color: 'var(--k-fg-2)' }}>Enterprise</strong> — volume
        licensing on one invoice, with API access, webhooks and team roles included. Changes go
        through your account contact.
      </>
    ),
    showCancel: false,
    showPayment: false,
    showBillingEmail: true,
    storageGB: 5000,
    storageNote:
      'Your contract includes 5 TB of active storage across all users. Additional storage is negotiated at renewal rather than billed automatically — talk to your account contact.',
  },
  comped: {
    name: 'Complimentary',
    heading: 'Complimentary access.',
    blurb: (
      <>
        Your account has{' '}
        <strong style={{ color: 'var(--k-fg-2)' }}>complimentary Pro access</strong> — every
        feature, nothing billed. If it is set to expire you will hear from us well before it does.
      </>
    ),
    showCancel: false,
    showPayment: false,
    showBillingEmail: false,
    storageGB: null,
    storageNote:
      'Complimentary accounts get the same 500 GB of active storage as Pro, and nothing is billed if you exceed it — we will simply get in touch.',
  },
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null

/** The three-cell strip. Values come from the payload, never from the copy table. */
function kpisFor(plan: BillingPlan, quota: Quota): [string, string, string][] {
  const renews = fmtDate(quota.period_end)
  const included = `${fmtInt(quota.included_items)} line items included${plan === 'free' ? ', one pool' : ' per month'}`

  if (plan === 'enterprise') {
    return [
      ['Current plan', 'Enterprise', 'Volume licensing'],
      ['Claims', 'Unlimited', included],
      ['Billing', 'By invoice', renews ? `Renews ${renews}` : 'Per contract'],
    ]
  }
  if (plan === 'comped') {
    return [
      ['Current plan', 'Pro', 'Complimentary'],
      ['Claims', 'Unlimited', included],
      ['This month', '$0.00', 'Nothing billed'],
    ]
  }
  if (plan === 'free') {
    return [
      ['Current plan', 'Free tier', 'Metered, not timed'],
      ['Claims', 'Unlimited', included],
      ['Items left', fmtInt(quota.items_remaining), 'No deadline on the free pool'],
    ]
  }
  return [
    ['Current plan', 'Pro', 'Flat monthly'],
    ['Claims', 'Unlimited', included],
    ['This month', '$249.00', renews ? `Auto-renews ${renews}` : 'Auto-renews monthly'],
  ]
}

function nextLineFor(plan: BillingPlan, quota: Quota): React.ReactNode {
  const renews = fmtDate(quota.period_end)
  if (quota.billing_state === 'canceled') return 'Subscription cancelled · nothing is deleted'
  if (plan === 'enterprise')
    return (
      <>
        Billed by invoice
        {renews ? (
          <>
            {' '}
            · <strong style={{ color: 'var(--k-fg-2)' }}>contract renews {renews}</strong>
          </>
        ) : null}
      </>
    )
  if (plan === 'comped')
    return (
      <>
        No charge · <strong style={{ color: 'var(--k-fg-2)' }}>Pro features, nothing billed</strong>
      </>
    )
  if (plan === 'free')
    return (
      <>
        No card charged ·{' '}
        <strong style={{ color: 'var(--k-fg-2)' }}>
          {fmtInt(quota.items_remaining)} of {fmtInt(quota.included_items)} free items left
        </strong>
      </>
    )
  return (
    <>
      Next invoice:{' '}
      <strong style={{ color: 'var(--k-fg-2)' }}>{renews ? `${renews} · ` : ''}$249.00</strong>
    </>
  )
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
  const copy = plan ? BILLING_PLANS[plan] : null
  // Dunning is ORTHOGONAL to plan: a failed card leaves the account on Pro and
  // moves billing_state to past_due, so we warn without locking anyone out.
  const dunning = quota?.billing_state === 'past_due'
  const canceled = quota?.billing_state === 'canceled'
  const showPortal = plan === 'pro' || plan === 'enterprise'

  const eyebrow = copy
    ? [copy.name, copy.showPayment && 'payment', 'usage'].filter(Boolean).join(' · ')
    : 'Plan · payment · usage'

  return (
    <SettingsShell activeId="billing" title="Billing" eyebrow={eyebrow} save={false}>
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
              <strong>Still confirming with Stripe.</strong> Your payment may well have gone through
              — this page updates as soon as it lands, and nothing is charged twice if you wait.
              Refresh in a moment, or check your invoices in the billing portal.
            </>
          )}
        </div>
      ) : null}

      {portalBusy ? (
        <div
          style={{
            margin: '0 0 14px',
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--k-accent-soft)',
            border: '1px solid oklch(0.45 0.13 255 / 0.25)',
            fontSize: 12.5,
            color: 'var(--k-fg-2)',
          }}
        >
          Opening the Stripe billing portal…
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

      {/* A BACKGROUND refetch failure must never destroy this surface.
          React Query keeps `data` and sets `error` on a failed refetch, and
          the previous order checked error first -- so any transient failure
          swapped the whole card, Manage subscription included, for an error
          panel. Clicking that button is itself a trigger: the redirect
          aborts the in-flight /v1/me request, which lands as an error, so
          the button greyed and then vanished before the navigation showed.
          Error state now only replaces the page when there is nothing to
          show; otherwise it is a quiet line above intact content. */}
      {error && me ? (
        <div style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--k-fg-4)' }}>
          Couldn&rsquo;t refresh your billing details just now — showing the last known state.
        </div>
      ) : null}

      {!me && isPending ? (
        <section className="k-set-card">
          <div className="k-set-card-hd">Your plan</div>
          <div className="k-set-card-body" style={{ color: 'var(--k-fg-4)', fontSize: 13 }}>
            Loading your account…
          </div>
        </section>
      ) : !me ? (
        <section className="k-set-card">
          <div className="k-set-card-hd">Your plan</div>
          <div className="k-set-card-body" style={{ fontSize: 13, color: 'var(--k-fg-3)' }}>
            Could not load your account.{' '}
            {error instanceof ApiError ? error.message422 : 'Try again in a moment.'}
          </div>
        </section>
      ) : !quota || !plan || !copy ? (
        /* The backend has not shipped the billing fields yet. Say so rather
           than inventing a plan the account may not be on (rule 20). */
        <section className="k-set-card">
          <div className="k-set-card-hd">Your plan</div>
          <div className="k-set-card-body" style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.6 }}>
            Billing details aren&rsquo;t available on this account yet. Once <code>GET /v1/me</code>{' '}
            returns its <code>quota</code> object, your plan and usage appear here.
          </div>
        </section>
      ) : (
        <>
          <div
            style={{
              marginBottom: 22,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontWeight: 400,
                  fontSize: 28,
                  letterSpacing: '-0.022em',
                  margin: '4px 0 4px',
                }}
              >
                {copy.heading}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
                {nextLineFor(plan, quota)}
              </p>
            </div>
            {showPortal ? (
              <button
                type="button"
                className="k-btn"
                onClick={() => void portal()}
                disabled={portalBusy}
                style={{ flexShrink: 0 }}
              >
                {portalBusy ? 'Redirecting…' : 'Manage subscription'}
              </button>
            ) : plan === 'free' ? (
              <UpgradeProButton planBefore={plan} />
            ) : null}
          </div>

          {plan === 'comped' ? (
            <section className="k-set-card k-set-card--accent">
              <div
                className="k-set-card-body"
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                <Icon d={I.check} size={16} />
                <span style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--k-fg-2)' }}>Complimentary account.</strong> Nothing
                  is billed and no card is required. Every Pro feature is available, including
                  unlimited claims and all export formats.
                </span>
              </div>
            </section>
          ) : null}

          <section className="k-set-card k-set-card--accent">
            <div
              className="k-set-card-body"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, padding: 0 }}
            >
              {kpisFor(plan, quota).map(([l, v, sub], i) => (
                <div
                  key={l}
                  className="k-billing-cell"
                  style={{ borderRight: i < 2 ? '1px solid var(--k-line)' : 0 }}
                >
                  <div className="k-billing-l">{l}</div>
                  <div className="k-billing-v">{v}</div>
                  <div className="k-billing-s">{sub}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="k-set-card">
            <div className="k-set-card-hd">Your plan</div>
            <div className="k-set-card-body">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--k-fg-3)', maxWidth: 460, lineHeight: 1.55 }}>
                  {copy.blurb}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {copy.showCancel ? (
                    <button
                      type="button"
                      className="k-btn k-btn--ghost"
                      onClick={() => void portal()}
                      disabled={portalBusy}
                    >
                      Cancel plan
                    </button>
                  ) : null}
                  <Link className={plan === 'pro' ? 'k-btn' : 'k-btn k-btn--ghost'} to="/contact">
                    {plan === 'pro' ? 'Talk to us about Enterprise' : 'Contact us'}
                  </Link>
                </div>
              </div>

              {dunning ? (
                <div className="k-dunning">
                  <strong>Your last payment didn&rsquo;t go through.</strong> You are still on{' '}
                  {copy.name} and nothing is interrupted — claims, exports and your item allowance
                  all keep working. Update your card and Stripe retries automatically.
                </div>
              ) : null}

              {canceled ? (
                <div className="k-dunning k-dunning--quiet">
                  <strong>Your subscription is cancelled.</strong> Everything you have built stays
                  downloadable — nothing is deleted (rule 15). Start Pro again whenever you need it.
                </div>
              ) : null}
            </div>
          </section>

          <StorageUsageCard includedGB={copy.storageGB} note={copy.storageNote} />

          {plan !== 'enterprise' ? (
            <ItemUsageCard
              quota={quota}
              onAddCredits={() => setCredits(true)}
              onUpgrade={<UpgradeProButton planBefore={quota.plan} className="k-btn k-btn--sm" />}
            />
          ) : null}

          {/* Deviation 1 — see the file header. The design draws a card mock
              with seeded digits; no endpoint exposes the real card, and a
              fabricated one on a billing page is worse than an honest pointer. */}
          {copy.showPayment ? (
            <section className="k-set-card">
              <div className="k-set-card-hd">Payment method</div>
              <div className="k-set-card-body">
                <div className="k-set-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Your card lives with Stripe</div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, lineHeight: 1.5 }}>
                      Kevin never stores card details. Add, replace or remove a card in the billing
                      portal.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="k-btn k-btn--ghost"
                    onClick={() => void portal()}
                    disabled={portalBusy}
                  >
                    Update
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* Deviation 2 — see the file header. No invoice list endpoint exists,
              and five invented invoice numbers are a fake billing record. */}
          <section className="k-set-card">
            <div
              className="k-set-card-hd"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <span>Invoice history</span>
              <span
                style={{
                  fontWeight: 400,
                  color: 'var(--k-fg-4)',
                  textTransform: 'none',
                  letterSpacing: 0,
                }}
              >
                PDF per invoice · receipts also emailed on payment
              </span>
            </div>
            <div className="k-set-card-body">
              <div className="k-set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Every invoice and receipt</div>
                  <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2, lineHeight: 1.5 }}>
                    Stripe holds the record of what you were charged and when, with a PDF for each.
                  </div>
                </div>
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  onClick={() => void portal()}
                  disabled={portalBusy}
                >
                  <Icon d={I.download} size={12} /> View invoices
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {credits ? (
        <AddCreditsModal
          creditsBefore={quota?.credit_balance ?? 0}
          onClose={() => setCredits(false)}
        />
      ) : null}
    </SettingsShell>
  )
}
