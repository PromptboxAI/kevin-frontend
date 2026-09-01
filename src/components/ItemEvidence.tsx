import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { I, Icon } from './Icon'
import { ApiError, api } from '../lib/api'
import { RECEIPT_ACCEPT, attachItemPhoto, detachItemPhotos, uploadReceipt } from '../lib/evidence'
import {
  HOLDBACK_WARNING_COPY,
  defaultReplacedQty,
  holdbackApplies,
  holdbackWarning,
  parseClaimed,
  parseQty,
} from '../lib/holdback-rules'
import { fmtUSD } from '../lib/format'
import type { ClaimItemDetail } from '../lib/types'

/**
 * Evidence on one line: the photos, and the replacement receipt.
 *
 * Two different jobs that look alike and must not be merged. Photos are CLAIM
 * evidence -- what the item was. A receipt is HOLDBACK-RECOVERY evidence,
 * post-settlement: proof the item was really replaced and for how much, which
 * is what a carrier wants before releasing withheld depreciation.
 *
 * And attaching the receipt does NOT assert the amount. The route "touches no
 * valuation field" on purpose -- the schedule is what the carrier reconciles
 * against, so it must not move because a file arrived. The file proves it; the
 * numbers claim it; they are separate actions on purpose.
 */
export default function ItemEvidence({
  item,
  claimStatus,
}: {
  item: ClaimItemDetail
  claimStatus: string | undefined
}) {
  const queryClient = useQueryClient()
  const photoRef = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['claim-item', item.id] })
    void queryClient.invalidateQueries({ queryKey: ['claim-items'] })
  }

  const fail = (label: string) => (error: unknown) =>
    setNotice(
      error instanceof ApiError
        ? `${label} — HTTP ${error.status}: ${error.message422}`
        : `${label}.`,
    )

  const addPhoto = useMutation({
    mutationFn: (file: File) => attachItemPhoto(item.id, file),
    onSuccess: (ack) => {
      setNotice(ack.is_primary ? 'Added — this is now the line’s thumbnail.' : 'Photo added.')
      refresh()
    },
    onError: fail('Could not attach that photo'),
  })

  const detach = useMutation({
    mutationFn: (photoId: number) => detachItemPhotos(item.id, [photoId]),
    onSuccess: () => {
      setNotice('Removed from this line. The photo is still on the claim.')
      refresh()
    },
    onError: fail('Could not remove that photo'),
  })

  const addReceipt = useMutation({
    mutationFn: (file: File) => uploadReceipt(item.id, file),
    onSuccess: () => {
      setNotice('Receipt attached. Enter what was spent below to claim it.')
      refresh()
    },
    onError: fail('Could not attach that receipt'),
  })

  const photos = item.photos ?? []
  const busy = addPhoto.isPending || detach.isPending || addReceipt.isPending

  return (
    <>
      <div className="k-insp-field">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>Photos</span>
          <button
            type="button"
            className="k-link"
            disabled={busy}
            onClick={() => photoRef.current?.click()}
          >
            {addPhoto.isPending ? 'Adding…' : 'Add'}
          </button>
        </label>

        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) addPhoto.mutate(f)
            e.target.value = ''
          }}
        />

        {photos.length === 0 ? (
          <span className="k-insp-hint">
            No photo on this line. Add one if you have evidence the run missed.
          </span>
        ) : (
          photos.map((p) => (
            <div className="k-hist-row" key={p.photo_id}>
              <span className="k-hist-actor k-hist-actor--sys">
                {p.is_primary ? 'Thumbnail' : 'Photo'}
              </span>
              <span className="k-hist-what">
                {p.room ?? p.note ?? `Photo ${p.photo_id}`}
              </span>
              {/* "Remove" beside a claim's only evidence reads as destruction,
                  so the word and the tooltip both say what it really does. */}
              <button
                type="button"
                className="k-link"
                disabled={busy}
                title="Unpoints it from this line. The photo stays on the claim."
                onClick={() => detach.mutate(p.photo_id)}
              >
                Unlink
              </button>
            </div>
          ))
        )}
      </div>

      {/*
        Post-settlement only. The carrier has paid ACV and withheld
        depreciation; this is the ask to release it. During the estimating pass
        it would invite receipts attached before anyone has been paid.
      */}
      {holdbackApplies(claimStatus) ? (
        <Holdback item={item} notice={notice} setNotice={setNotice} onDone={refresh} />
      ) : null}

      {holdbackApplies(claimStatus) ? (
        <div className="k-insp-field">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span>Replacement receipt</span>
            <button
              type="button"
              className="k-link"
              disabled={busy}
              onClick={() => receiptRef.current?.click()}
            >
              {addReceipt.isPending ? 'Attaching…' : item.receipt_url ? 'Replace' : 'Attach'}
            </button>
          </label>

          {/* PDFs are accepted HERE and nowhere else in the API: forwarded
              email invoices arrive as PDFs. */}
          <input
            ref={receiptRef}
            type="file"
            accept={RECEIPT_ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) addReceipt.mutate(f)
              e.target.value = ''
            }}
          />

          {item.receipt_url ? (
            <a
              className="k-src-link"
              href={item.receipt_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon d={I.file} size={11} /> View receipt
            </a>
          ) : (
            <span className="k-insp-hint">
              Photo or PDF. Attaching it proves the spend — it does not claim it.
            </span>
          )}
        </div>
      ) : null}

      {notice ? <span className="k-insp-hint">{notice}</span> : null}
    </>
  )
}

/**
 * What was actually spent, and on how many units.
 *
 * PAIRED, always. The server's ratio silently zeroes a line when an amount
 * arrives without a count -- a receipt for four of six chairs recovering $0 on
 * money genuinely owed -- so the count is pre-filled and the pair is checked
 * before it is sent.
 *
 * `recoverable` is the SERVER's number, applied verbatim. The formula lives in
 * services/holdback.py and nothing here recomputes it.
 */
function Holdback({
  item,
  notice,
  setNotice,
  onDone,
}: {
  item: ClaimItemDetail
  notice: string | null
  setNotice: (s: string | null) => void
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [claimed, setClaimed] = useState(
    item.claimed_rcv != null ? String(item.claimed_rcv) : '',
  )
  const [qty, setQty] = useState(
    item.replaced_qty != null ? String(item.replaced_qty) : '',
  )
  const [bad, setBad] = useState(false)
  /**
   * Commit reads the INPUTS, not the parsed state.
   *
   * The same trap the portal's age cell hit: a keystroke and the blur that
   * follows can land in one React batch, so a handler closing over parsed
   * state sees the previous render's value and the write never fires. The DOM
   * value is what the adjuster actually typed.
   */
  const claimedRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)

  const parsedClaimed = parseClaimed(claimed)
  const parsedQty = parseQty(qty)
  const warning =
    parsedClaimed.ok && parsedQty.ok
      ? holdbackWarning({
          claimedRcv: parsedClaimed.value,
          replacedQty: parsedQty.value,
          quantity: item.quantity ?? 1,
        })
      : null

  const save = useMutation({
    mutationFn: (body: { claimed_rcv: number | null; replaced_qty: number | null }) =>
      api.patch<{ recoverable: number }>(`/v1/claim_items/${item.id}`, { json: body }),
    onSuccess: (ack) => {
      // The server's figure, verbatim -- the frontend computes no recovery math.
      queryClient.setQueryData<ClaimItemDetail>(['claim-item', item.id], (prev) =>
        prev ? { ...prev, recoverable: ack.recoverable } : prev,
      )
      setNotice(
        ack.recoverable > 0
          ? `Claiming ${fmtUSD(ack.recoverable)} back from the carrier on this line.`
          : 'Saved. Nothing recoverable on this line.',
      )
      onDone()
    },
    onError: (error) =>
      setNotice(
        error instanceof ApiError
          ? `Could not save — HTTP ${error.status}: ${error.message422}`
          : 'Could not save.',
      ),
  })

  const commit = () => {
    const c = parseClaimed(claimedRef.current?.value ?? claimed)
    const q = parseQty(qtyRef.current?.value ?? qty)
    if (!c.ok || !q.ok) {
      setBad(true)
      return
    }
    setBad(false)

    // Pre-fill the count rather than sending an amount that recovers $0. This
    // is the trap the whole panel exists to avoid, so it is closed here rather
    // than left to the adjuster to notice.
    const count =
      c.value !== null && q.value === null ? defaultReplacedQty(item.quantity) : q.value
    if (count !== q.value) setQty(String(count))

    // Nothing changed -- do not spend a write saying so.
    if (c.value === (item.claimed_rcv ?? null) && count === (item.replaced_qty ?? null)) return

    save.mutate({ claimed_rcv: c.value, replaced_qty: count })
  }

  return (
    <div className="k-insp-field">
      <label>Holdback recovery</label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <span style={{ flex: 1 }}>
          <span className="k-insp-hint">Actually spent</span>
          <input
            ref={claimedRef}
            className="k-cell k-cell--input k-mono"
            value={claimed}
            placeholder="—"
            inputMode="decimal"
            onChange={(e) => setClaimed(e.target.value)}
            onBlur={commit}
            // Enter commits too. Blur alone is one delivery path, and a
            // holdback figure is not something to lose because focus moved in
            // a way the browser did not report.
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
            style={bad && !parsedClaimed.ok ? { borderColor: 'var(--k-danger)' } : undefined}
          />
        </span>
        <span style={{ width: 92 }}>
          <span className="k-insp-hint">Units replaced</span>
          <input
            ref={qtyRef}
            className="k-cell k-cell--input k-mono"
            value={qty}
            placeholder={String(item.quantity ?? 1)}
            inputMode="numeric"
            onChange={(e) => setQty(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
            style={bad && !parsedQty.ok ? { borderColor: 'var(--k-danger)' } : undefined}
          />
        </span>
      </div>

      {warning ? (
        <span className="k-insp-hint" style={{ color: 'var(--k-danger)' }}>
          {HOLDBACK_WARNING_COPY[warning]}
        </span>
      ) : null}

      {/* Server-computed. Shown with the figures either side so the number is
          legible rather than asserted. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--k-line)',
          fontSize: 12.5,
        }}
      >
        <span style={{ color: 'var(--k-fg-3)' }}>
          Scheduled {fmtUSD(item.rcv_total_incl)} · paid {fmtUSD(item.acv_total_incl)}
        </span>
        <span
          className="k-mono"
          style={{
            fontWeight: 600,
            color: (item.recoverable ?? 0) > 0 ? 'var(--k-ok)' : 'var(--k-fg-4)',
          }}
        >
          {fmtUSD(item.recoverable ?? 0)}
        </span>
      </div>
      {notice === null ? (
        <span className="k-insp-hint">
          Recoverable is capped at the schedule — the policy owes RCV, never more.
        </span>
      ) : null}
    </div>
  )
}
