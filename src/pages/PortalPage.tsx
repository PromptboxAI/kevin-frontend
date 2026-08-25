import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { isApiConfigured } from '../lib/env'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import {
  AGE_MAX,
  POLL_ATTEMPTS,
  RETURNED_FROM_CHECKOUT,
  getPortal,
  parseAge,
  patchPortalItem,
  pollDelay,
  portalExportUrl,
  startCheckout,
} from '../lib/portal'
import type { PortalItem, PortalResponse } from '../lib/portal'

/**
 * The insured's read-only view of a shared claim — GET /p/{token}.
 *
 * The SERVER decides what this audience sees. A locked page never receives the
 * withheld line detail, so the blur below is presentation over data that was
 * never sent; there is nothing behind it to recover. Never fetch everything and
 * hide it client-side.
 *
 * Unlock releases on the payment WEBHOOK, never the browser's return URL.
 * Stripe sends the client back before the webhook lands as often as not, and
 * ?status=complete is forgeable — so a return is a reason to POLL, never a
 * reason to unlock.
 *
 * CONTRACT NOTE for the item list: portal item rows have exactly TWO states --
 * editable and resolved. Edits to an EXISTING item (age_years, claimed_rcv,
 * replaced_qty, rcv) write directly and are live on the next read, so they
 * never queue. The "Sent to your adjuster" pending state belongs ONLY to
 * proposed NEW items, which are the only thing that lands in the holding queue.
 * Do not build a third, pending-edit state.
 */

/** Export-parity columns minus the adjuster-only internals. */
const COLS = '40px 90px 40px 1.5fr 1fr 74px 78px 64px 84px 42px 52px 74px 84px 46px'
const NUM: React.CSSProperties = {
  textAlign: 'right',
  fontFamily: 'var(--k-font-mono)',
  fontSize: 11.5,
}
const CARD: React.CSSProperties = {
  background: 'var(--k-bg)',
  border: '1px solid var(--k-line)',
  borderRadius: 12,
}
const STAT_L: React.CSSProperties = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--k-fg-4)',
}
const STAT_V: React.CSSProperties = {
  fontFamily: 'var(--k-font-mono)',
  fontSize: 17,
  fontWeight: 600,
}

export default function PortalPage() {
  const { token = '' } = useParams()
  const queryClient = useQueryClient()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  /** Set while we wait for the webhook after a return from Stripe. */
  const [awaitingWebhook, setAwaitingWebhook] = useState(() =>
    RETURNED_FROM_CHECKOUT(window.location.search),
  )
  const [pollGaveUp, setPollGaveUp] = useState(false)

  const { data, error, isPending } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => getPortal(token),
    enabled: isApiConfigured && token !== '',
    // A dead link is a settled answer, not a blip.
    retry: (count, err) => !(err instanceof ApiError) && count < 2,
  })

  const paid = data?.paid ?? false

  /**
   * Poll until `paid_at` lands. Backs off so a webhook that never arrives stops
   * hammering the endpoint, and gives up rather than spinning forever -- the
   * payment may genuinely have failed.
   */
  const attempt = useRef(0)
  useEffect(() => {
    if (!awaitingWebhook || paid || pollGaveUp) return
    if (attempt.current >= POLL_ATTEMPTS) {
      setPollGaveUp(true)
      return
    }
    const wait = pollDelay(attempt.current)
    attempt.current += 1
    const t = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['portal', token] })
    }, wait)
    return () => clearTimeout(t)
  }, [awaitingWebhook, paid, pollGaveUp, queryClient, token, data])

  useEffect(() => {
    if (!paid || !awaitingWebhook) return
    setAwaitingWebhook(false)
    // Drop ?status so a hard reload does not re-enter the polling state. The
    // unlocked state survives regardless: it comes from the server, not here.
    window.history.replaceState({}, '', window.location.pathname)
  }, [paid, awaitingWebhook])

  const beginCheckout = async () => {
    setCheckoutError(null)
    setRedirecting(true)
    try {
      const { checkout_url } = await startCheckout(token)
      window.location.assign(checkout_url)
    } catch (err) {
      setRedirecting(false)
      setCheckoutError(
        err instanceof ApiError
          ? `Checkout could not be started — HTTP ${err.status}: ${err.message422}`
          : 'Checkout could not be started.',
      )
    }
  }

  if (!isApiConfigured) {
    return (
      <Shell title="Not configured">
        <p>
          This deployment has no <code>VITE_API_BASE_URL</code>. Set it to the backend web
          service origin and redeploy.
        </p>
      </Shell>
    )
  }

  if (isPending) {
    return (
      <Shell title="Loading your inventory…">
        <p>Fetching the items your adjuster shared with you.</p>
      </Shell>
    )
  }

  // 410 covers unknown, expired and revoked -- indistinguishable by design.
  if (error instanceof ApiError && error.status === 410) {
    return (
      <Shell title="This link is no longer active">
        <p>Ask your adjuster for a new one.</p>
      </Shell>
    )
  }

  if (error || !data) {
    return (
      <Shell title="Something went wrong">
        <p>We couldn't load this inventory. Please try again shortly.</p>
        {error instanceof ApiError && error.requestId ? (
          <p className="k-portal-ref">Reference: {error.requestId}</p>
        ) : null}
      </Shell>
    )
  }

  return <Portal
    token={token}
    data={data}
    paid={paid}
    awaitingWebhook={awaitingWebhook && !pollGaveUp}
    pollGaveUp={pollGaveUp}
    checkoutOpen={checkoutOpen}
    checkoutError={checkoutError}
    redirecting={redirecting}
    onOpenCheckout={() => setCheckoutOpen(true)}
    onCloseCheckout={() => setCheckoutOpen(false)}
    onPay={beginCheckout}
    onKeepWaiting={() => {
      attempt.current = 0
      setPollGaveUp(false)
      setAwaitingWebhook(true)
    }}
  />
}

function Portal({
  token,
  data,
  paid,
  awaitingWebhook,
  pollGaveUp,
  checkoutOpen,
  checkoutError,
  redirecting,
  onOpenCheckout,
  onCloseCheckout,
  onPay,
  onKeepWaiting,
}: {
  token: string
  data: PortalResponse
  paid: boolean
  awaitingWebhook: boolean
  pollGaveUp: boolean
  checkoutOpen: boolean
  checkoutError: string | null
  redirecting: boolean
  onOpenCheckout: () => void
  onCloseCheckout: () => void
  onPay: () => void
  onKeepWaiting: () => void
}) {
  const queryClient = useQueryClient()
  /** Rows whose recompute is in flight -- money dims, never blanks. */
  const [pending, setPending] = useState<Set<number>>(new Set())
  const [rowError, setRowError] = useState<string | null>(null)

  /**
   * The insured corrects one line.
   *
   * The server recomputes depreciation -> ACV and returns the money, which is
   * applied VERBATIM: the portal derives none of it, so it can never disagree
   * with the worksheet or the export. The refetch that follows picks up the
   * fields the ack does not carry ($ Depr.) and the claim totals.
   *
   * Two states only. This write is live on the next read -- it never queues,
   * and it is never "Sent to your adjuster"; that belongs to proposed NEW
   * items alone.
   */
  const saveAge = async (row: PortalItem, years: number | null) => {
    if (years === row.age_years) return
    setRowError(null)
    setPending((p) => new Set(p).add(row.id))
    try {
      const ack = await patchPortalItem(token, row.id, { age_years: years })
      queryClient.setQueryData<PortalResponse>(['portal', token], (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((it) =>
                it.id === row.id
                  ? {
                      ...it,
                      age_years: years,
                      rcv_total_incl: ack.rcv_total_incl,
                      depreciation_pct: ack.depreciation_pct,
                      acv_total_incl: ack.acv_total_incl,
                      recoverable: ack.recoverable,
                    }
                  : it,
              ),
            }
          : prev,
      )
      // $ Depr. and the claim totals are not on the ack -- re-read for them.
      await queryClient.invalidateQueries({ queryKey: ['portal', token] })
    } catch (err) {
      setRowError(
        err instanceof ApiError
          ? `That age could not be saved — HTTP ${err.status}: ${err.message422}`
          : 'That age could not be saved.',
      )
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(row.id)
        return next
      })
    }
  }

  const { claim, items, totals, locked_count: locked, unlock_price: price } = data
  const paywalled = price !== null
  const priceLabel = price !== null ? fmtUSD(price) : ''
  const shown = items.length
  const total = data.count

  return (
    <div className="k-landing" style={{ minHeight: '100vh', background: 'var(--k-bg-2)' }}>
      <header className="k-topbar" style={{ background: 'var(--k-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="k-wordmark">
            Kevin<span>.</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
            Contents inventory · read-only
          </span>
        </div>
        <Badge tone={paid || !paywalled ? 'ok' : 'quiet'} dot>
          {paid ? 'Unlocked' : paywalled ? 'Preview' : 'Shared'}
        </Badge>
      </header>

      <main
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '28px 24px 60px',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Identity is deliberately NOT redacted: it is their name, their house
            and their policy, and it answers "is this actually my claim?". */}
        <section style={{ ...CARD, padding: '18px 22px', marginBottom: 16 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}
          >
            <div>
              <div style={{ fontFamily: 'var(--k-font-display)', fontSize: 22 }}>
                {claim.name ?? claim.claim_id}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)', marginTop: 4 }}>
                {[claim.insured_name, claim.loss_address].filter(Boolean).join(' · ') || '—'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 11.5,
                  color: 'var(--k-fg-4)',
                  marginTop: 2,
                }}
              >
                {[
                  claim.claim_number ? `Claim ${claim.claim_number}` : null,
                  claim.policy_number ? `Policy ${claim.policy_number}` : null,
                  claim.date_of_loss ? `DOL ${fmtDate(claim.date_of_loss)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </div>
            </div>

            {/* Totals stay visible while locked ON PURPOSE: a number with no
                documentation cannot be submitted to a carrier, so the total is
                the proof that the documentation is worth buying. */}
            <div style={{ display: 'flex', gap: 22, textAlign: 'right' }}>
              <div>
                <div style={STAT_L}>Items</div>
                <div style={STAT_V}>{fmtInt(totals?.item_count ?? total)}</div>
              </div>
              <div>
                <div style={STAT_L}>Total RCV + tax</div>
                <div style={STAT_V}>{fmtUSD(totals?.total_rcv ?? 0)}</div>
              </div>
              <div>
                <div style={STAT_L}>Total ACV</div>
                <div style={{ ...STAT_V, color: 'var(--k-accent)' }}>
                  {fmtUSD(totals?.total_acv ?? 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Stated in the payload so a client cannot render the money without it. */}
          <div
            style={{
              fontSize: 11,
              color: 'var(--k-fg-4)',
              marginTop: 10,
              borderTop: '1px solid var(--k-line)',
              paddingTop: 8,
            }}
          >
            {locked > 0 && !paid
              ? `Totals cover all ${fmtInt(total)} items, including the ${fmtInt(locked)} not shown below. `
              : ''}
            {data.disclaimer}
          </div>
        </section>

        {awaitingWebhook ? (
          <section
            style={{
              ...CARD,
              padding: '14px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span className="k-paused-dot" />
            <div style={{ fontSize: 13 }}>
              <strong>Confirming your payment…</strong>
              <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 2 }}>
                Your inventory unlocks the moment Stripe confirms it — usually a few seconds. You
                can leave this page; the link stays unlocked.
              </div>
            </div>
          </section>
        ) : null}

        {pollGaveUp && !paid ? (
          <section style={{ ...CARD, padding: '14px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Still waiting on the payment</div>
            <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 3, lineHeight: 1.5 }}>
              Stripe hasn't confirmed this one yet. If you completed the payment it will unlock on
              its own — reload in a minute. If it was declined, nothing was charged.
            </div>
            <button
              type="button"
              className="k-btn k-btn--sm k-btn--ghost"
              style={{ marginTop: 10 }}
              onClick={onKeepWaiting}
            >
              Check again
            </button>
          </section>
        ) : null}

        {paywalled && !paid ? (
          <section
            style={{
              background: 'var(--k-navy, oklch(0.32 0.06 255))',
              color: '#fff',
              borderRadius: 12,
              padding: '16px 22px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                Your full inventory is ready — {fmtInt(total)} items, photographed and priced.
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>
                Preview shows {fmtInt(shown)} of {fmtInt(total)} lines. Pay once to unlock every
                line, the photos, and the download files (Excel + PDF).
              </div>
            </div>
            <button
              type="button"
              className="k-btn k-btn--lg"
              style={{ background: '#fff', color: 'var(--k-fg)' }}
              onClick={onOpenCheckout}
            >
              Unlock full inventory · {priceLabel}
            </button>
          </section>
        ) : null}

        {rowError ? (
          <div
            style={{
              ...CARD,
              padding: '10px 16px',
              marginBottom: 10,
              fontSize: 12.5,
              color: 'var(--k-danger)',
            }}
          >
            {rowError}
          </div>
        ) : null}

        {paid || !paywalled ? (
          <div
            style={{
              fontSize: 12,
              color: 'var(--k-fg-3)',
              margin: '0 2px 8px',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Icon d={I.info} size={13} />
            <span>
              Know how old something was? Type the age in years — your adjuster's depreciation
              and ACV estimate update straight away. These remain the adjuster's estimates; the
              carrier makes the final settlement decision.
            </span>
          </div>
        ) : null}

        {/* Export-parity column set minus the adjuster-only internals. */}
        <section style={{ ...CARD, overflow: 'auto' }}>
          <div style={{ minWidth: 1100 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                gap: 8,
                padding: '9px 16px',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--k-fg-4)',
                borderBottom: '1px solid var(--k-line)',
              }}
            >
              <span>#</span>
              <span>Room</span>
              <span style={{ textAlign: 'right' }}>Qty</span>
              <span>Description</span>
              <span>Make · Model</span>
              <span style={{ textAlign: 'right' }}>Unit Cost</span>
              <span style={{ textAlign: 'right' }}>Ext. Cost</span>
              <span style={{ textAlign: 'right' }}>Tax</span>
              <span style={{ textAlign: 'right' }}>RCV + Tax</span>
              <span style={{ textAlign: 'right' }}>Age</span>
              <span style={{ textAlign: 'right' }}>% Depr.</span>
              <span style={{ textAlign: 'right' }}>$ Depr.</span>
              <span style={{ textAlign: 'right' }}>ACV</span>
              <span style={{ textAlign: 'center' }}>Source</span>
            </div>

            {items.map((item, i) => (
              <Row
                key={item.id}
                item={item}
                n={i + 1}
                /* Locked/preview rows are read-only: a withheld inventory is
                   not one the holder has bought the right to correct. */
                editable={!paywalled || paid}
                pending={pending.has(item.id)}
                onAge={(years) => void saveAge(item, years)}
              />
            ))}

            {locked > 0 && !paid ? (
              <div style={{ position: 'relative' }}>
                {/* Decorative only. The payload carries no locked-line detail,
                    so there is nothing recoverable behind the blur. */}
                {Array.from({ length: Math.min(8, locked) }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: COLS,
                      gap: 8,
                      padding: '9px 16px',
                      fontSize: 12,
                      borderBottom: '1px solid var(--k-line)',
                      filter: 'blur(5px)',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5 }}>
                      {String(shown + i + 1).padStart(3, '0')}
                    </span>
                    <span>██████</span>
                    <span style={{ textAlign: 'right' }}>█</span>
                    <span>█████ ████████ ██████</span>
                    <span>████ · █████</span>
                    <span style={{ textAlign: 'right' }}>$███.██</span>
                    <span style={{ textAlign: 'right' }}>$███.██</span>
                    <span style={{ textAlign: 'right' }}>$██.██</span>
                    <span style={{ textAlign: 'right' }}>$███.██</span>
                    <span style={{ textAlign: 'right' }}>█</span>
                    <span style={{ textAlign: 'right' }}>██%</span>
                    <span style={{ textAlign: 'right' }}>$██.██</span>
                    <span style={{ textAlign: 'right' }}>$███.██</span>
                    <span style={{ textAlign: 'center' }}>█</span>
                  </div>
                ))}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(180deg, transparent, var(--k-bg) 85%)',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                      <Icon d={I.lock} size={13} /> {fmtInt(locked)} more{' '}
                      {locked === 1 ? 'line' : 'lines'} locked
                    </div>
                    <button
                      type="button"
                      className="k-btn"
                      style={{ marginTop: 10 }}
                      onClick={onOpenCheckout}
                    >
                      Unlock full inventory · {priceLabel}
                    </button>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 6 }}>
                      Secure checkout via Stripe · one-time payment
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* can_download is allow_download AND released_at -- the adjuster's own
            export stamps exported_at, which never means "I have been paid". */}
        {data.can_download ? (
          <section style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a className="k-btn" href={portalExportUrl(token, 'xlsx')}>
              <Icon d={I.download} size={13} /> Inventory · .xlsx
            </a>
            <a className="k-btn k-btn--ghost" href={portalExportUrl(token, 'pdf')}>
              <Icon d={I.download} size={13} /> PDF inventory
            </a>
          </section>
        ) : null}

        {data.proposals.length ? (
          <section style={{ ...CARD, marginTop: 16, padding: '14px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              Sent to your adjuster · {fmtInt(data.proposals.length)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 3 }}>
              Items you added. They appear on the inventory once your adjuster accepts them.
            </div>
            {data.proposals.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  fontSize: 12.5,
                  paddingTop: 8,
                }}
              >
                <span style={{ flex: 1 }}>{p.description}</span>
                {p.room ? <span style={{ color: 'var(--k-fg-4)' }}>{p.room}</span> : null}
                <Badge tone="quiet">Pending</Badge>
              </div>
            ))}
          </section>
        ) : null}

        {checkoutOpen && !paid ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              display: 'grid',
              placeItems: 'center',
              background: 'oklch(0.2 0.01 250 / 0.45)',
            }}
            onClick={onCloseCheckout}
          >
            <div
              style={{
                width: 400,
                background: 'var(--k-bg)',
                borderRadius: 14,
                border: '1px solid var(--k-line)',
                padding: '22px 24px',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 15, fontWeight: 600 }}>Continue to secure checkout</div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--k-fg-3)',
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                You'll be taken to Stripe to pay <strong>{priceLabel}</strong> (one-time). The full
                inventory unlocks automatically the moment payment is confirmed.
              </div>
              {checkoutError ? (
                <div style={{ fontSize: 12, color: 'var(--k-danger)', marginTop: 10 }}>
                  {checkoutError}
                </div>
              ) : null}
              {/* No card fields ever render on our page -- Checkout is hosted,
                  so card data never touches Kevin and PCI scope stays SAQ-A. */}
              <button
                type="button"
                className="k-btn k-btn--lg"
                style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                disabled={redirecting}
                onClick={onPay}
              >
                {redirecting ? 'Opening Stripe…' : `Pay ${priceLabel} with Stripe →`}
              </button>
              <button
                type="button"
                className="k-btn k-btn--ghost"
                style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                onClick={onCloseCheckout}
              >
                Cancel
              </button>
              <div style={{ fontSize: 10.5, color: 'var(--k-fg-4)', marginTop: 10 }}>
                Payments handled by Stripe — card details never touch Kevin.
              </div>
            </div>
          </div>
        ) : null}

        <footer
          style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 26, textAlign: 'center' }}
        >
          Prepared with Kevin · kevin.co
        </footer>
      </main>
    </div>
  )
}

function Row({
  item,
  n,
  editable,
  pending,
  onAge,
}: {
  item: PortalItem
  n: number
  editable: boolean
  pending: boolean
  onAge: (years: number | null) => void
}) {
  // While the server recomputes, the derived money DIMS rather than blanking:
  // a cell that empties reads as "your edit deleted the price".
  const dim: React.CSSProperties = pending ? { opacity: 0.45 } : {}
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COLS,
        gap: 8,
        padding: '9px 16px',
        fontSize: 12,
        borderBottom: '1px solid var(--k-line)',
        alignItems: 'center',
      }}
    >
      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>
        {String(n).padStart(4, '0')}
      </span>
      <span
        style={{
          color: 'var(--k-fg-3)',
          fontSize: 11.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.room_area ?? '—'}
      </span>
      <span style={NUM}>{item.quantity ?? 1}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.description || '—'}
      </span>
      <span
        style={{
          color: 'var(--k-fg-3)',
          fontSize: 11.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {[item.make_mfr, item.model_number].filter(Boolean).join(' · ') || '—'}
      </span>
      {/* Money read VERBATIM from the payload -- the frontend computes none of
          it, so the portal can never disagree with the worksheet or the export. */}
      <span style={NUM}>{item.rcv != null ? fmtUSD(item.rcv) : '—'}</span>
      <span style={NUM}>
        {item.rcv_total_incl != null && item.tax != null
          ? fmtUSD(item.rcv_total_incl - item.tax)
          : '—'}
      </span>
      <span style={NUM}>{item.tax != null ? fmtUSD(item.tax) : '—'}</span>
      <span style={NUM}>{item.rcv_total_incl != null ? fmtUSD(item.rcv_total_incl) : '—'}</span>
      {editable ? (
        <AgeCell value={item.age_years} disabled={pending} onCommit={onAge} />
      ) : (
        <span style={NUM}>{item.age_years ?? '—'}</span>
      )}
      <span style={{ ...NUM, color: 'var(--k-fg-3)', ...dim }}>
        {item.depreciation_pct != null ? `${Math.round(item.depreciation_pct * 100)}%` : '—'}
      </span>
      <span style={{ ...NUM, color: 'var(--k-fg-3)', ...dim }}>
        {item.depreciation_amount != null ? fmtUSD(item.depreciation_amount) : '—'}
      </span>
      <span style={{ ...NUM, fontWeight: 600, ...dim }}>
        {item.acv_total_incl != null ? fmtUSD(item.acv_total_incl) : '—'}
      </span>
      {/* The link IS the disclosure -- one source, never a comp list, and
          substitution is never labelled. */}
      <span style={{ textAlign: 'center' }}>
        {item.source_link ? (
          <a
            href={item.source_link}
            target="_blank"
            rel="noreferrer noopener"
            title="Where this price came from"
            style={{ color: 'var(--k-accent)' }}
          >
            <Icon d={I.link} size={12} />
          </a>
        ) : (
          <span style={{ color: 'var(--k-fg-4)' }}>—</span>
        )}
      </span>
    </div>
  )
}

/**
 * Age, as the insured types it.
 *
 * Same conventions as the worksheet: clear on focus so a stale number is not
 * edited by accident, Enter or Tab commits, Escape abandons. The cell renders
 * the DRAFT while focused and the server's value otherwise -- rendering the
 * prop mid-commit is what made worksheet cells flash their old value back.
 */
function AgeCell({
  value,
  disabled,
  onCommit,
}: {
  value: number | null
  disabled: boolean
  onCommit: (years: number | null) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [bad, setBad] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  // A REF, not state: the gate has to be readable in the same tick the user
  // typed, and state may still be a render behind.
  const dirty = useRef(false)

  /**
   * Commit reads the INPUT, not the draft state.
   *
   * Two bugs came out of doing it the other way. Routing Enter through
   * e.currentTarget.blur() silently did nothing: the field kept focus, the
   * number sat there looking saved, and no PATCH was ever sent. Reading
   * `draft` then failed too -- a character and the Enter that follows it can
   * land in one React batch, so the keydown handler still closed over the
   * previous render's empty draft. The DOM value is what the client actually
   * typed, and it is never stale.
   *
   * Setting draft to null makes the following onBlur a no-op, so Enter and the
   * blur it triggers cannot both fire the same write.
   */
  const commit = () => {
    if (!dirty.current) return
    const typed = ref.current?.value ?? draft ?? ''
    const parsed = parseAge(typed)
    if (!parsed.ok) {
      setBad(true)
      return
    }
    setBad(false)
    dirty.current = false
    setDraft(null)
    onCommit(parsed.value)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      aria-label="Age in years"
      title={`How old was this item? Years, up to ${AGE_MAX}.`}
      value={draft ?? (value ?? '')}
      placeholder="—"
      onFocus={() => setDraft('')}
      onChange={(e) => {
        dirty.current = true
        setDraft(e.target.value)
        setBad(false)
      }}
      ref={ref}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit()
          ref.current?.blur()
        } else if (e.key === 'Escape') {
          dirty.current = false
          setDraft(null)
          setBad(false)
          ref.current?.blur()
        }
        // Tab needs no case: it moves focus, which fires onBlur, which commits.
      }}
      style={{
        width: '100%',
        textAlign: 'right',
        fontFamily: 'var(--k-font-mono)',
        fontSize: 11.5,
        padding: '3px 4px',
        border: '1px solid transparent',
        borderRadius: 4,
        background: bad ? 'oklch(0.95 0.06 25)' : 'transparent',
        color: 'var(--k-fg)',
        outline: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = 'var(--k-line)'
      }}
      onMouseLeave={(e) => {
        if (document.activeElement !== e.currentTarget)
          e.currentTarget.style.borderColor = 'transparent'
      }}
    />
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="k-landing" style={{ minHeight: '100vh', background: 'var(--k-bg-2)' }}>
      <header className="k-topbar" style={{ background: 'var(--k-bg)' }}>
        <span className="k-wordmark">
          Kevin<span>.</span>
        </span>
      </header>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 30 }}>
          {title}
        </h1>
        <div style={{ fontSize: 14, color: 'var(--k-fg-3)', lineHeight: 1.6 }}>{children}</div>
      </main>
    </div>
  )
}
