import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimMissing from '../components/ClaimMissing'
import { I, Icon } from '../components/Icon'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import { getReceiptBatch, uploadReceipts } from '../lib/receipts'
import {
  RECEIPTS_ACCEPT,
  fmtReceiptDate,
  keepReceiptFiles,
  progressLine,
  receiptRejectText,
  receiptStatusText,
  splitRejections,
  sumBatches,
  type ReceiptProgress,
  type ReceiptRejection,
} from '../lib/receipt-rules'
import type { ClaimSummary } from '../lib/types'

const H1: React.CSSProperties = {
  fontFamily: 'var(--k-font-display)',
  fontWeight: 400,
  fontSize: 38,
  letterSpacing: '-0.025em',
  margin: 0,
  lineHeight: 1.1,
}

const MONO: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 12.5,
  fontFamily: 'var(--k-font-mono)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

/**
 * Purchase receipts → line items (FRONTEND.md §5e).
 *
 * For a total loss where the items are gone: each item on the insured's
 * receipts becomes a worksheet line -- printed description, regular unit price,
 * age from the purchase date. Nothing is searched, there is no Source Link,
 * and receipt lines never count toward the plan.
 *
 * A separate path from photo upload on purpose: a receipt is not evidence of
 * an item to identify, it IS the line, so it skips staging entirely.
 */
export default function AddReceiptsPage() {
  const { claimId = '' } = useParams()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
    retry: retryUnlessMissing,
  })

  const [over, setOver] = useState(false)
  const [uploading, setUploading] = useState<{ sent: number; total: number } | null>(null)
  const [batchIds, setBatchIds] = useState<string[]>([])
  const [rejected, setRejected] = useState<ReceiptRejection[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [unsent, setUnsent] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const batches = useQueries({
    queries: batchIds.map((id) => ({
      queryKey: ['receipt-batch', claimId, id],
      queryFn: () => getReceiptBatch(claimId, id),
      refetchInterval: (q: { state: { data?: { finished: boolean } } }) =>
        q.state.data?.finished ? false : 3000,
      retry: retryUnlessMissing,
    })),
  })

  const totals = useMemo(
    () => sumBatches(batches.map((b) => b.data), batchIds.length),
    [batches, batchIds.length],
  )
  const receipts: ReceiptProgress[] = useMemo(
    () => batches.flatMap((b) => b.data?.receipts ?? []),
    [batches],
  )
  const batchError = batches.find((b) => b.error)?.error

  /** When every batch has finished, the worksheet's rows are stale. Refresh once per finish. */
  const finishedKey = totals.finished && batchIds.length ? batchIds.join(',') : ''
  useEffect(() => {
    if (!finishedKey) return
    void queryClient.invalidateQueries({ queryKey: ['claim-items'] })
    void queryClient.invalidateQueries({ queryKey: ['claim-items-flat', claimId] })
    void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
  }, [finishedKey, claimId, queryClient])

  const take = async (picked: File[]) => {
    const { kept, skipped: off } = keepReceiptFiles(picked)
    if (off.length) setSkipped((prev) => [...prev, ...off.map((f) => f.name)])
    if (!kept.length) return
    setError(null)
    setUploading({ sent: 0, total: kept.length })
    try {
      const res = await uploadReceipts(claimId, kept, (sent, total) => setUploading({ sent, total }))
      setBatchIds((prev) => [...prev, ...res.batchIds])
      setRejected((prev) => [...prev, ...res.rejected])
      setUnsent(res.unsent)
      setError(res.error)
    } finally {
      setUploading(null)
    }
  }

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const name = claim.data?.name || claimId
  const { duplicates, failed } = splitRejections(rejected)
  const started = batchIds.length > 0 || rejected.length > 0 || uploading !== null
  const worksheet = `/claims/${encodeURIComponent(claimId)}`

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <div>
          <Link to={worksheet} className="k-crumb" title="Back to the worksheet">
            <Icon d={I.chevleft} size={13} /> Back to {name}
          </Link>
          <h1 style={{ ...H1, margin: '6px 0 6px' }}>Add receipts</h1>
          <p style={{ margin: 0, color: 'var(--k-fg-3)', fontSize: 13.5, maxWidth: 640, lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--k-fg-2)' }}>Lost the items but kept the receipts?</strong>{' '}
            Upload them, and every item on each receipt becomes a line on your worksheet. Kevin uses
            the description as printed, the regular price (not a sale or coupon price), and works out
            the age from the purchase date. Anything it can’t read clearly is flagged for you to
            check. Receipt lines are free and don’t use your plan’s line items. You can add rooms
            afterward on the worksheet.
          </p>
        </div>

        <section className="k-intake-section" style={{ marginTop: 24 }}>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={RECEIPTS_ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = [...(e.target.files ?? [])]
              e.target.value = ''
              void take(files)
            }}
          />
          <div
            className={`k-dropzone${over ? ' k-dropzone--over' : ''}`}
            role="button"
            tabIndex={uploading ? -1 : 0}
            aria-label="Add receipts: drop them here, or press Enter to choose files"
            onClick={() => {
              if (!uploading) fileRef.current?.click()
            }}
            onKeyDown={(e) => {
              if (uploading || e.target !== e.currentTarget) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              if (uploading) return
              e.preventDefault()
              if (!over) setOver(true)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              if (!uploading) void take([...e.dataTransfer.files])
            }}
            style={uploading ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
          >
            <div className="k-dropzone-inner">
              <div className="k-dropzone-icon">
                <Icon d={I.upload} size={24} />
              </div>
              <div className="k-dropzone-h">{over ? 'Let go to add them' : 'Drag receipts here'}</div>
              <div className="k-dropzone-or">or</div>
              <div className="k-dropzone-actions" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="k-btn k-btn--lg" onClick={() => fileRef.current?.click()}>
                  Choose receipts
                </button>
              </div>
              <div className="k-dropzone-meta">
                JPG, PNG, HEIC or PDF, or a .zip of them · select them all at once, receipts already
                on this claim are skipped
              </div>
            </div>
            <div className="k-dropzone-ghosts" />
          </div>
        </section>

        {started ? (
          <section className="k-intake-section" style={{ marginTop: 20 }}>
            <div className="k-queue">
              <div className="k-queue-hd">
                <strong style={{ fontSize: 13 }} aria-live="polite">
                  {uploading
                    ? `Uploading receipts: ${uploading.sent} of ${uploading.total}`
                    : batchIds.length
                      ? totals.total
                        ? progressLine(totals)
                        : 'Reading receipts…'
                      : 'Nothing new to read'}
                </strong>
                {uploading || (batchIds.length && !totals.finished) ? (
                  <div className={`k-progress${totals.total || uploading ? '' : ' k-progress--busy'}`} style={{ width: 220 }}>
                    <div
                      className="k-progress-bar k-progress-bar--live"
                      style={{
                        width: uploading
                          ? `${Math.round((uploading.sent / Math.max(1, uploading.total)) * 100)}%`
                          : totals.total
                            ? `${Math.round((totals.done / totals.total) * 100)}%`
                            : undefined,
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {failed.length ? (
                <div className="k-reject">
                  <div className="k-reject-hd">
                    <Icon d={I.warn} size={14} />
                    <span className="k-reject-t">
                      {failed.length} {failed.length === 1 ? 'file' : 'files'} could not be uploaded
                    </span>
                  </div>
                  {failed.map((r, i) => (
                    <div key={`${r.filename}:${i}`} className="k-reject-row">
                      <span className="k-reject-file">{r.filename}</span>
                      <span className="k-reject-why">{receiptRejectText(r)}</span>
                    </div>
                  ))}
                  <div className="k-reject-ft">
                    Nothing was added from these. Fix or re-export them as PDF or photos and add them again.
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="k-reject">
                  <div className="k-reject-hd">
                    <Icon d={I.warn} size={14} />
                    <span className="k-reject-t">{error}</span>
                    <div style={{ flex: 1 }} />
                    {unsent.length && !uploading ? (
                      <button
                        type="button"
                        className="k-btn k-btn--sm k-btn--ghost"
                        onClick={() => void take(unsent)}
                      >
                        Try {unsent.length} again
                      </button>
                    ) : null}
                  </div>
                  <div className="k-reject-ft">
                    Sending them again is safe — a receipt already on the claim is skipped, never doubled.
                  </div>
                </div>
              ) : null}

              {batchError ? (
                <div className="k-skipline">
                  <Icon d={I.info} size={13} />
                  <span>
                    Couldn’t check progress just now
                    {batchError instanceof ApiError ? ` (HTTP ${batchError.status})` : ''}. Reading
                    carries on on the server; this page tries again.
                  </span>
                </div>
              ) : null}

              {duplicates.length ? (
                <div className="k-skipline">
                  <Icon d={I.info} size={13} />
                  <span>
                    {duplicates.length} {duplicates.length === 1 ? 'receipt' : 'receipts'} already on
                    this claim, skipped —{' '}
                    <span style={{ fontFamily: 'var(--k-font-mono)' }}>
                      {duplicates.map((d) => d.filename).join(', ')}
                    </span>
                    . Sending one again never doubles lines.
                  </span>
                </div>
              ) : null}

              {skipped.length ? (
                <div className="k-skipline">
                  <Icon d={I.info} size={13} />
                  <span>
                    {skipped.length} {skipped.length === 1 ? 'file' : 'files'} not sent — not a JPG,
                    PNG, HEIC, PDF or .zip:{' '}
                    <span style={{ fontFamily: 'var(--k-font-mono)' }}>{skipped.join(', ')}</span>
                  </span>
                </div>
              ) : null}

              {receipts.length ? (
                <div className="k-queue-list" style={{ maxHeight: 420 }}>
                  {receipts.map((r, i) => (
                    <ReceiptRow
                      key={`${r.filename}:${i}`}
                      receipt={r}
                      onReupload={() => fileRef.current?.click()}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {batchIds.length ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link className="k-btn k-btn--lg" to={worksheet}>
                  Open worksheet →
                </Link>
                {!totals.finished ? (
                  <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
                    You can leave this page. Reading carries on, and the lines appear on the worksheet
                    as it finishes.
                  </span>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function ReceiptRow({ receipt: r, onReupload }: { receipt: ReceiptProgress; onReupload: () => void }) {
  const where = [r.store, r.date_readable === false ? null : fmtReceiptDate(r.purchase_date)]
    .filter(Boolean)
    .join(' · ')
  const reading = !r.status
  const failed = r.status === 'failed'
  return (
    <div className="k-queue-row">
      {reading ? (
        <span className="k-spinner" aria-hidden="true" />
      ) : r.status === 'read' ? (
        <span style={{ color: 'var(--k-ok)', width: 14, textAlign: 'center' }} aria-hidden="true">
          <Icon d={I.check} size={14} />
        </span>
      ) : failed ? (
        <span style={{ color: 'var(--k-danger)' }} aria-hidden="true">
          <Icon d={I.warn} size={14} />
        </span>
      ) : (
        <span style={{ color: 'var(--k-fg-4)', width: 14, textAlign: 'center' }} aria-hidden="true">–</span>
      )}
      <span style={{ ...MONO, color: 'var(--k-fg-2)' }} title={r.filename}>
        {r.filename}
      </span>
      {where && !failed ? (
        <span style={{ fontSize: 12, color: 'var(--k-fg-3)', whiteSpace: 'nowrap' }}>{where}</span>
      ) : null}
      <span
        style={{
          fontSize: 12,
          textAlign: 'right',
          color: failed ? 'var(--k-danger)' : reading || r.status === 'not_a_receipt' ? 'var(--k-fg-4)' : 'var(--k-fg-2)',
        }}
      >
        {receiptStatusText(r)}
      </span>
      {failed ? (
        <button type="button" className="k-btn k-btn--sm k-btn--ghost" onClick={onReupload}>
          Re-upload
        </button>
      ) : null}
    </div>
  )
}
