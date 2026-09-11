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
  downloadPortalExport,
  getPortal,
  parseAge,
  patchPortalItem,
  pollDelay,
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

/**
 * Export-parity columns minus the adjuster-only internals, plus the item's
 * photo (second). The payload always carried `image_url` per row; nothing
 * rendered it, while the paywall promised "the photos".
 */
const COLS = '40px 48px 90px 40px 1.5fr 1fr 74px 78px 64px 84px 42px 52px 74px 84px 46px'
/** An `inventory` link carries no photo URLs, so it has no Photo column. */
const COLS_NO_PHOTO = '40px 90px 40px 1.5fr 1fr 74px 78px 64px 84px 42px 52px 74px 84px 46px'
/** A `photos` link: #, a larger photo, room, description -- nothing else exists. */
const PHOTO_COLS = '48px 88px 160px 1fr'
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

/** A share-page download: the two worksheet formats, or a photo document. */
type DownloadKind = 'xlsx' | 'pdf' | 'photos' | 'packet'

/** Every refusal `/p/{token}/export` can give, in words (FRONTEND.md, 0054). */
function downloadErrorCopy(err: unknown): string {
  if (!(err instanceof ApiError)) return 'The download failed. Please try again.'
  switch (err.status) {
    case 410:
      return 'This link is no longer active. Ask your adjuster for a new one.'
    case 402:
      return 'Unlock this link to download its files.'
    case 403:
      return 'This link doesn’t include that download. Ask your adjuster if you need it.'
    case 409:
      return 'No photos are linked to items yet, so there is nothing for a photos PDF.'
    case 413:
      return 'This claim has more photos than fit in one PDF. Ask your adjuster for the file.'
    case 429: {
      const minutes = err.retryAfter ? Math.max(1, Math.ceil(err.retryAfter / 60)) : null
      return `This link has reached its photo downloads for the hour.${minutes ? ` Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` : ' Try again later.'}`
    }
    default:
      return `The download failed (HTTP ${err.status}). Please try again.`
  }
}

/**
 * Every line, not just the first page.
 *
 * The page used to make one call at the default page size (100), so a claim
 * with 300 lines showed 100 and said nothing about the rest. Pages of the
 * server's maximum (500) are read until `count` is reached. A LOCKED link is
 * left alone: its items are the paywall sample, and `count` is the claim's
 * total, which the page shows as locked skeletons -- paging would ask for
 * rows the server will never send.
 */
async function getAllPortal(token: string): Promise<PortalResponse> {
  const PAGE = 500
  const first = await getPortal(token, 0, PAGE)
  const locked = first.locked_count > 0 && !first.paid
  if (locked) return first
  const items = [...first.items]
  while (items.length < first.count) {
    const next = await getPortal(token, items.length, PAGE)
    if (next.items.length === 0) break
    items.push(...next.items)
  }
  return { ...first, items }
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
    queryFn: () => getAllPortal(token),
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
  /** The photo open full-size, if any. */
  const [viewing, setViewing] = useState<PortalItem | null>(null)
  const [downloading, setDownloading] = useState<DownloadKind | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [perPage, setPerPage] = useState<1 | 2 | 4 | 6>(2)

  const download = async (kind: DownloadKind) => {
    setDownloading(kind)
    setDownloadError(null)
    try {
      if (kind === 'xlsx' || kind === 'pdf') await downloadPortalExport(token, kind)
      else await downloadPortalExport(token, 'pdf', kind, perPage)
    } catch (err) {
      setDownloadError(downloadErrorCopy(err))
    } finally {
      setDownloading(null)
    }
  }

  /**
   * `image_url` is a signed URL that lives ~5 minutes (FRONTEND.md), so a page
   * left open goes stale and its images 403. A failed image re-reads the
   * portal for fresh URLs -- at most once a minute, so a photo that is truly
   * missing cannot loop the request.
   */
  const lastImageRefresh = useRef(0)
  const refreshImages = () => {
    const now = Date.now()
    if (now - lastImageRefresh.current < 60_000) return
    lastImageRefresh.current = now
    void queryClient.invalidateQueries({ queryKey: ['portal', token] })
  }

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

  /**
   * What the link grants (0054). The SERVER enforces it -- a photos link's
   * payload has no money in it at all -- so this only decides layout: which
   * columns exist, which copy fits, which downloads to offer. A pre-0054
   * payload has no `contents` and reads as `both`.
   */
  const contents = data.contents ?? 'both'
  const photosOnly = contents === 'photos'
  const showPhotos = contents !== 'inventory'
  const documents = data.documents ?? ['worksheet']
  const cols = photosOnly ? PHOTO_COLS : showPhotos ? COLS : COLS_NO_PHOTO
  // Photos links are read-only server-side (403 on every write).
  const editable = (!paywalled || paid) && !photosOnly

  return (
    <div className="k-landing" style={{ minHeight: '100vh', background: 'var(--k-bg-2)' }}>
      <header className="k-topbar" style={{ background: 'var(--k-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="k-wordmark">
            Kevin<span>.</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
            {photosOnly ? 'Contents photos · read-only' : 'Contents inventory · read-only'}
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
              {/* No money stats on a photos link -- there is no money in its
                  payload. Elsewhere a dash, never $0.00, if totals are absent:
                  "$0.00" over a priced inventory says it is worth nothing. */}
              {photosOnly ? null : (
                <>
                  <div>
                    <div style={STAT_L}>Total RCV + tax</div>
                    <div style={STAT_V}>{fmtUSD(totals?.total_rcv)}</div>
                  </div>
                  <div>
                    <div style={STAT_L}>Total ACV</div>
                    <div style={{ ...STAT_V, color: 'var(--k-accent)' }}>
                      {fmtUSD(totals?.total_acv)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stated in the payload so a client cannot render the money without
              it -- and so not shown where there is no money: the disclaimer
              is about dollar figures, and a photos link has none. */}
          {photosOnly ? null : (
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
          )}
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
              {/* Promise exactly what the link grants: an inventory link has no
                  photos to unlock, a photos link no prices or spreadsheet. */}
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                {photosOnly
                  ? `Your photos are ready — ${fmtInt(total)} items, photographed.`
                  : contents === 'inventory'
                    ? `Your full inventory is ready — ${fmtInt(total)} items, priced.`
                    : `Your full inventory is ready — ${fmtInt(total)} items, photographed and priced.`}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>
                Preview shows {fmtInt(shown)} of {fmtInt(total)} lines. Pay once to unlock{' '}
                {photosOnly
                  ? 'every photo and the photos PDF.'
                  : contents === 'inventory'
                    ? 'every line and the download files (Excel + PDF).'
                    : 'every line, the photos, and the download files (Excel + PDF).'}
              </div>
            </div>
            <button
              type="button"
              className="k-btn k-btn--lg"
              style={{ background: '#fff', color: 'var(--k-fg)' }}
              onClick={onOpenCheckout}
            >
              {photosOnly ? 'Unlock all photos' : 'Unlock full inventory'} · {priceLabel}
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

        {editable ? (
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
          <div style={{ minWidth: photosOnly ? 0 : 1100 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
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
              {showPhotos ? <span>Photo</span> : null}
              <span>Room</span>
              {photosOnly ? (
                <span>Description</span>
              ) : (
                <>
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
                </>
              )}
            </div>

            {items.map((item, i) =>
              photosOnly ? (
                <PhotoOnlyRow
                  key={item.id}
                  item={item}
                  n={i + 1}
                  onPhoto={() => setViewing(item)}
                  onPhotoError={refreshImages}
                />
              ) : (
                <Row
                  key={item.id}
                  item={item}
                  n={i + 1}
                  cols={cols}
                  showPhoto={showPhotos}
                  /* Locked/preview rows are read-only: a withheld inventory is
                     not one the holder has bought the right to correct. */
                  editable={editable}
                  pending={pending.has(item.id)}
                  onAge={(years) => void saveAge(item, years)}
                  onPhoto={() => setViewing(item)}
                  onPhotoError={refreshImages}
                />
              ),
            )}

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
                      gridTemplateColumns: cols,
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
                    {showPhotos ? <span className="k-portal-thumb k-portal-thumb--ghost" /> : null}
                    <span>██████</span>
                    {photosOnly ? (
                      <span>█████ ████████ ██████</span>
                    ) : (
                      <>
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
                      </>
                    )}
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
                      {photosOnly ? 'Unlock all photos' : 'Unlock full inventory'} · {priceLabel}
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
        {/* The picker is built from `documents` -- what this link's grant
            lets the export serve -- never guessed from `contents`. */}
        {data.can_download ? (
          <section style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {documents.includes('worksheet') ? (
                <>
                  <DownloadButton
                    label="Inventory · .xlsx"
                    busy={downloading === 'xlsx'}
                    disabled={downloading !== null}
                    primary
                    onClick={() => void download('xlsx')}
                  />
                  <DownloadButton
                    label="Inventory PDF"
                    busy={downloading === 'pdf'}
                    disabled={downloading !== null}
                    onClick={() => void download('pdf')}
                  />
                </>
              ) : null}
              {documents.includes('photos') ? (
                <DownloadButton
                  label="Photos PDF"
                  busy={downloading === 'photos'}
                  disabled={downloading !== null}
                  primary={!documents.includes('worksheet')}
                  onClick={() => void download('photos')}
                />
              ) : null}
              {documents.includes('packet') ? (
                <DownloadButton
                  label="Inventory + photos PDF"
                  busy={downloading === 'packet'}
                  disabled={downloading !== null}
                  onClick={() => void download('packet')}
                />
              ) : null}
              {documents.includes('photos') || documents.includes('packet') ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--k-fg-3)' }}>
                  Photos per page
                  <span className="k-segwrap" role="radiogroup" aria-label="Photos per page">
                    {([1, 2, 4, 6] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={perPage === n}
                        className={`k-seg ${perPage === n ? 'k-seg--on' : ''}`}
                        onClick={() => setPerPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </span>
                </span>
              ) : null}
            </div>
            {downloading === 'photos' || downloading === 'packet' ? (
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--k-fg-3)' }}>
                Building the PDF with photos — this can take up to a minute.
              </p>
            ) : null}
            {downloadError ? (
              <p className="k-error" style={{ marginTop: 8 }}>
                {downloadError}
              </p>
            ) : null}
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

        {/* Read the row fresh from the payload: a refresh after an expired
            URL replaces image_url, and the open viewer should get the new one. */}
        {viewing ? (
          <PhotoViewer
            item={items.find((it) => it.id === viewing.id) ?? viewing}
            onClose={() => setViewing(null)}
          />
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

function DownloadButton({
  label,
  busy,
  disabled,
  primary,
  onClick,
}: {
  label: string
  busy: boolean
  disabled: boolean
  primary?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={primary ? 'k-btn' : 'k-btn k-btn--ghost'}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon d={I.download} size={13} /> {busy ? 'Preparing…' : label}
    </button>
  )
}

/**
 * A row on a `photos` link: number, photo, room, description -- the only
 * fields the payload carries. Read-only (the server 403s every write).
 */
function PhotoOnlyRow({
  item,
  n,
  onPhoto,
  onPhotoError,
}: {
  item: PortalItem
  n: number
  onPhoto: () => void
  onPhotoError: () => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: PHOTO_COLS,
        gap: 8,
        padding: '10px 16px',
        fontSize: 13,
        borderBottom: '1px solid var(--k-line)',
        alignItems: 'center',
      }}
    >
      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 10.5, color: 'var(--k-fg-4)' }}>
        {String(n).padStart(4, '0')}
      </span>
      <PhotoThumb item={item} onOpen={onPhoto} onError={onPhotoError} large />
      <span style={{ color: 'var(--k-fg-3)', fontSize: 12 }}>{item.room_area ?? '—'}</span>
      <span>{item.description || '—'}</span>
    </div>
  )
}

function Row({
  item,
  n,
  cols,
  showPhoto,
  editable,
  pending,
  onAge,
  onPhoto,
  onPhotoError,
}: {
  item: PortalItem
  n: number
  cols: string
  /** False on an `inventory` link, which carries no photo URLs. */
  showPhoto: boolean
  editable: boolean
  pending: boolean
  onAge: (years: number | null) => void
  onPhoto: () => void
  onPhotoError: () => void
}) {
  // While the server recomputes, the derived money DIMS rather than blanking:
  // a cell that empties reads as "your edit deleted the price".
  const dim: React.CSSProperties = pending ? { opacity: 0.45 } : {}
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
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
      {showPhoto ? <PhotoThumb item={item} onOpen={onPhoto} onError={onPhotoError} /> : null}
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
 * The item's photo in its row. A button, so it is reachable by keyboard and
 * opens the full-size view. No photo (a written-list item, or none stored)
 * reads as a dash, like any other empty cell.
 */
function PhotoThumb({
  item,
  onOpen,
  onError,
  large,
}: {
  item: PortalItem
  onOpen: () => void
  onError: () => void
  /** The bigger cell a photos-only link uses. */
  large?: boolean
}) {
  // The ~240px thumbnail (~13 KB) where the API sends one; the full original
  // (~2.7 MB) was the only option before 0054 and stays the fallback.
  const src = item.thumb_url || item.image_url
  const [broken, setBroken] = useState(false)
  // A fresh URL after a refresh gets a fresh try.
  const [triedUrl, setTriedUrl] = useState(src)
  if (triedUrl !== src) {
    setTriedUrl(src)
    setBroken(false)
  }

  if (!src || broken) {
    return <span style={{ color: 'var(--k-fg-4)', fontSize: 11.5 }}>—</span>
  }
  return (
    <button
      type="button"
      className={large ? 'k-portal-thumb k-portal-thumb--lg' : 'k-portal-thumb'}
      onClick={onOpen}
      title="View photo"
      aria-label={`View photo of ${item.description || `line ${item.id}`}`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => {
          setBroken(true)
          onError()
        }}
      />
    </button>
  )
}

/** Full-size photo over the page. Click outside, the ×, or Escape closes it. */
function PhotoViewer({ item, onClose }: { item: PortalItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="k-portal-viewer" role="dialog" aria-modal="true" onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <button type="button" className="k-icon-btn" aria-label="Close" onClick={onClose}>
          <Icon d={I.close} size={15} />
        </button>
        {item.image_url ? <img src={item.image_url} alt={item.description ?? ''} /> : null}
        <figcaption>
          <strong>{item.description || '—'}</strong>
          {item.room_area ? <span> · {item.room_area}</span> : null}
        </figcaption>
      </figure>
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
