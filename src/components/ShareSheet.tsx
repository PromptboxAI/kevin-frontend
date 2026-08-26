import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Badge from './Badge'
import { I, Icon } from './Icon'
import { ApiError } from '../lib/api'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import {
  SHARE_STATE_LABEL,
  SHARE_STATE_TONE,
  countUnsubstantiated,
  listShares,
  mintShare,
  redeliverShare,
  revokeShare,
  shareState,
} from '../lib/shares'
import type { ShareSummary } from '../lib/shares'

/**
 * Share links — the adjuster's side of the client portal.
 *
 * Ported from `design/components/share-claim.jsx`, Link tab. Two classes the
 * design references (`k-input`, `k-share-mgr`) were never written into
 * kevin.css, so they are defined app-side in index.css rather than approximated
 * with something else — noted as a deviation.
 *
 * The point of this sheet is the lifecycle the payload already tracks and
 * nothing surfaced until now: whether a priced link was PAID, whether the
 * document was DELIVERED, and whether that delivery FAILED — which is the one
 * state someone has to act on, and the worst one to leave silent.
 */
export default function ShareSheet({
  claimId,
  items,
  onClose,
}: {
  claimId: string
  /** For the substantiation warning; counted the way the document counts it. */
  items: { rcv: number | null; source_link?: string | null }[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [price, setPrice] = useState('')
  const [allowDownload, setAllowDownload] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<ShareSummary | null>(null)

  const shares = useQuery({
    queryKey: ['shares', claimId],
    queryFn: () => listShares(claimId),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['shares', claimId] })

  const fail = (label: string) => (error: unknown) =>
    setNotice(
      error instanceof ApiError
        ? `${label} — HTTP ${error.status}: ${error.message422}`
        : `${label}.`,
    )

  const mint = useMutation({
    mutationFn: () =>
      mintShare(claimId, {
        audience: 'client',
        allow_download: allowDownload,
        // Blank means no paywall. Zero would render a lock screen that charges
        // nothing, so it is treated as blank rather than sent.
        unlock_price: price.trim() === '' ? null : Math.round(parseFloat(price) * 100) / 100 || null,
      }),
    onSuccess: () => {
      setPrice('')
      void refresh()
    },
    onError: fail('Could not create the link'),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => revokeShare(id),
    onSuccess: () => {
      setConfirmRevoke(null)
      void refresh()
    },
    onError: fail('Could not revoke the link'),
  })

  const redeliver = useMutation({
    mutationFn: (id: string) => redeliverShare(id),
    onSuccess: () => {
      setNotice('Delivery queued. The client gets the email again shortly.')
      void refresh()
    },
    onError: fail('Could not queue delivery'),
  })

  const rows = shares.data?.shares ?? []
  const live = rows.filter((s) => s.active)
  const history = rows.filter((s) => !s.active)
  const { priced, missing } = countUnsubstantiated(items)

  return (
    <div className="k-export-stage k-modal-stage" onClick={onClose}>
      <div className="k-export-scrim" />
      <div className="k-export-modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="k-export-hd">
          <div>
            <div className="k-modal-kicker">Share this claim</div>
            <div className="k-modal-title">Read-only links</div>
          </div>
          <button type="button" className="k-icon-btn" aria-label="Close" onClick={onClose}>
            <Icon d={I.close} size={15} />
          </button>
        </div>

        <div className="k-share-body">
          {notice ? (
            <div className="k-share-snapnote" style={{ marginBottom: 12 }}>
              <Icon d={I.info} size={13} />
              <span style={{ flex: 1 }}>{notice}</span>
              <button type="button" className="k-link" onClick={() => setNotice(null)}>
                Dismiss
              </button>
            </div>
          ) : null}

          {/* Counted from source_link -- the same derivation the portal and the
              .xlsx use -- so this quotes a number the document honours. */}
          {missing > 0 ? (
            <div className="k-share-snapnote" style={{ marginBottom: 12 }}>
              <Icon d={I.warn} size={13} />
              <span>
                <strong style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>
                  {fmtInt(missing)} of {fmtInt(priced)} priced lines have no source link.
                </strong>{' '}
                Those lines carry a price the document cannot show evidence for. A carrier reading
                it sees a total with {fmtInt(priced - missing)}{' '}
                {priced - missing === 1 ? 'line' : 'lines'} substantiated. Attaching proof URLs
                before you send is what makes the schedule defensible — you can still share now.
              </span>
            </div>
          ) : null}

          <section className="k-share-sec">
            <div className="k-share-sec-h">Create a link</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="k-btn"
                disabled={mint.isPending}
                onClick={() => mint.mutate()}
              >
                <Icon d={I.link} size={12} /> {mint.isPending ? 'Creating…' : 'Create link'}
              </button>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--k-fg-3)',
                }}
              >
                Unlock price
                <input
                  className="k-input"
                  value={price}
                  placeholder="none"
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{ width: 76, fontFamily: 'var(--k-font-mono)', fontSize: 12 }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--k-fg-3)',
                }}
              >
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                />
                Allow downloads
              </label>
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
              Anyone with the link sees a read-only snapshot. Only Revoke disables it. A price is
              frozen at creation — a different price is a different link.
            </span>
          </section>

          <section className="k-share-sec">
            <div className="k-share-sec-h">Active links</div>

            {shares.isPending ? (
              <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading…</div>
            ) : live.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>
                No active links. Create one above to send this inventory.
              </div>
            ) : (
              <div className="k-share-mgr">
                {live.map((s) => (
                  <ShareRow
                    key={s.id}
                    share={s}
                    copied={copied === s.id}
                    busy={revoke.isPending || redeliver.isPending}
                    onCopy={() => {
                      if (s.url) void navigator.clipboard?.writeText(s.url)
                      setCopied(s.id)
                      setTimeout(() => setCopied(null), 1600)
                    }}
                    onRevoke={() => setConfirmRevoke(s)}
                    onRedeliver={() => redeliver.mutate(s.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {history.length ? (
            <section className="k-share-sec">
              <div className="k-share-sec-h">History</div>
              {history.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 0',
                    fontSize: 11.5,
                    color: 'var(--k-fg-4)',
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {s.audience === 'carrier' ? 'Carrier link' : 'Client link'} · created{' '}
                    {fmtDate(s.created_at)}
                    {s.paid_at ? ` · paid ${fmtDate(s.paid_at)}` : ''}
                  </span>
                  <span>
                    {fmtInt(s.view_count)} view{s.view_count === 1 ? '' : 's'}
                  </span>
                  <Badge tone="quiet">{SHARE_STATE_LABEL[shareState(s)]}</Badge>
                </div>
              ))}
            </section>
          ) : null}

          {/* Stated on screen because it is the whole reason the link is
              defensible. */}
          <div className="k-share-snapnote">
            <Icon d={I.info} size={13} />
            <span>
              <strong style={{ color: 'var(--k-fg-2)', fontWeight: 600 }}>
                A link is a snapshot.
              </strong>{' '}
              Whoever opens it sees the inventory as it stands when they look. Ages the client
              enters come back to your worksheet; nothing else they do changes the claim.
            </span>
          </div>
        </div>

        {confirmRevoke ? (
          <div className="k-stage-noteover" onClick={() => setConfirmRevoke(null)}>
            <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
              <div className="k-notemodal-hd">
                <div>
                  <div className="k-notemodal-t" style={{ color: 'var(--k-danger)' }}>
                    Revoke this link?
                  </div>
                  <div className="k-notemodal-s">
                    {fmtInt(confirmRevoke.view_count)} view
                    {confirmRevoke.view_count === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="k-notemodal-body">
                <p className="k-notemodal-lede">
                  The link stops working immediately and its token is destroyed — it cannot be
                  turned back on. Anyone holding it sees only that the link is no longer active.
                </p>
                {confirmRevoke.paid_at ? (
                  <p className="k-notemodal-lede">
                    <strong style={{ color: 'var(--k-fg-2)' }}>This link was paid for</strong> on{' '}
                    {fmtDate(confirmRevoke.paid_at)}. Revoking takes away access the client bought.
                    Send them a new link first if they still need one.
                  </p>
                ) : null}
              </div>
              <div className="k-notemodal-ft" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  onClick={() => setConfirmRevoke(null)}
                >
                  Keep it
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--danger"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(confirmRevoke.id)}
                >
                  {revoke.isPending ? 'Revoking…' : 'Revoke link'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ShareRow({
  share,
  copied,
  busy,
  onCopy,
  onRevoke,
  onRedeliver,
}: {
  share: ShareSummary
  copied: boolean
  busy: boolean
  onCopy: () => void
  onRevoke: () => void
  onRedeliver: () => void
}) {
  const state = shareState(share)
  const paywalled = share.unlock_price !== null

  return (
    <div className="k-share-linkrow" style={{ marginBottom: 6, alignItems: 'flex-start' }}>
      <Icon d={I.link} size={12} />

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>
            {share.audience === 'carrier' ? 'Carrier link' : 'Client link'}
            {paywalled ? ` · ${fmtUSD(share.unlock_price)}` : ''}
          </span>
          <Badge tone={SHARE_STATE_TONE[state]}>{SHARE_STATE_LABEL[state]}</Badge>
        </span>

        <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)', marginTop: 2 }}>
          Created {fmtDate(share.created_at)}
          {share.expires_at ? ` · expires ${fmtDate(share.expires_at)}` : ' · no expiry'} ·{' '}
          {fmtInt(share.view_count)} view{share.view_count === 1 ? '' : 's'}
        </span>

        {/* The lifecycle, in the order it happens. A paywalled link that has
            not been paid is not a problem -- it is the normal waiting state. */}
        {paywalled ? (
          <span style={{ display: 'block', fontSize: 11, marginTop: 3 }}>
            {share.paid_at ? (
              <span style={{ color: 'var(--k-ok, var(--k-fg-3))' }}>
                Paid {fmtDate(share.paid_at)}
                {share.delivered_at ? ` · document delivered ${fmtDate(share.delivered_at)}` : ''}
              </span>
            ) : (
              <span style={{ color: 'var(--k-fg-4)' }}>Awaiting payment</span>
            )}
          </span>
        ) : null}

        {/* Never only logged. This is the one state someone must act on. */}
        {share.delivery_error ? (
          <span
            style={{
              display: 'block',
              fontSize: 11,
              marginTop: 4,
              color: 'var(--k-danger)',
              lineHeight: 1.45,
            }}
          >
            Delivery failed: {share.delivery_error}
          </span>
        ) : null}
      </span>

      <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {/* Redeliver only exists for a PAID link -- the API 409s otherwise, and
            offering a button that cannot work is worse than not offering it. */}
        {share.paid_at ? (
          <button
            type="button"
            className="k-btn k-btn--ghost k-btn--sm"
            disabled={busy}
            title="Send the document email again"
            onClick={onRedeliver}
          >
            {share.delivery_error ? 'Retry delivery' : 'Resend'}
          </button>
        ) : null}

        <button type="button" className="k-btn k-btn--ghost k-btn--sm" onClick={onCopy}>
          <Icon d={copied ? I.check : I.copy} size={11} /> {copied ? 'Copied' : 'Copy'}
        </button>

        <button
          type="button"
          className="k-btn k-btn--ghost k-btn--sm k-btn--danger"
          disabled={busy}
          onClick={onRevoke}
        >
          Revoke
        </button>
      </span>
    </div>
  )
}
