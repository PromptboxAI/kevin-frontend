import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError, api, downloadRecovery } from '../lib/api'
import { RECEIPT_ACCEPT, uploadReceipt } from '../lib/evidence'
import { fmtUSD } from '../lib/format'
import {
  HOLDBACK_WARNING_COPY,
  canRequestRecovery,
  defaultReplacedQty,
  holdbackApplies,
  holdbackWarning,
  isRecoverableLine,
  missingReceiptWarning,
  parseClaimed,
  parseQty,
  recoveryTotals,
} from '../lib/holdback-rules'
import type { RecoveryLine } from '../lib/holdback-rules'
import type { ClaimItemListResponse, ClaimSummary } from '../lib/types'

/**
 * Screen 77 -- holdback recovery, the post-settlement surface.
 *
 * The carrier paid ACV and withheld the depreciation; this is where the
 * adjuster proves each replacement to get it released. The settled schedule
 * NEVER changes here: `claimed_rcv` moves no valuation field, which is the
 * whole reason a carrier can reconcile the request against the Proof of Loss.
 *
 * Ported from `design/components/holdback-recovery.jsx`, with one addition the
 * design explicitly deferred ("NO export button here -- the backend is building
 * the dedicated Depreciation Recovery Request export concurrently"). It exists
 * now, so the button does too -- in the two formats the route actually accepts.
 */
export default function RecoveryPage() {
  const { claimId = '' } = useParams()
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
  })

  const items = useQuery({
    queryKey: ['claim-items-flat', claimId],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=500`,
      ),
    enabled: !!claimId,
  })

  /** Only priced lines can be recovered against -- there is nothing withheld on an unpriced one. */
  const lines = useMemo<RecoveryLine[]>(
    () => (items.data?.items ?? []).filter((i) => i.rcv_total_incl != null),
    [items.data],
  )
  const totals = useMemo(() => recoveryTotals(lines), [lines])
  const warning = missingReceiptWarning(totals)

  const download = async (format: 'xlsx' | 'pdf') => {
    setBusy(true)
    try {
      await downloadRecovery(claimId, format)
      setNotice('Recovery request downloaded. This does not mark the claim exported.')
    } catch (error) {
      setNotice(
        error instanceof ApiError && error.status === 409
          ? 'Nothing to request yet — enter what was actually spent on at least one line.'
          : error instanceof Error
            ? error.message
            : 'Could not build the request.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (claim.isLoading || !claim.data) {
    return (
      <div className="k-worksheet">
        <AppHeader />
        <div style={{ padding: 24, fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading claim…</div>
      </div>
    )
  }

  /**
   * Post-settlement by definition. Before the carrier has paid there is no
   * withheld depreciation to recover, and the screen would invite receipts
   * attached against money nobody has been given yet.
   */
  if (!holdbackApplies(claim.data.status)) {
    return (
      <div className="k-worksheet">
        <AppHeader />
        <section className="k-claim-hd">
          <div>
            <Link to={`/claims/${claimId}`} className="k-crumb">
              <Icon d={I.chevleft} size={12} /> {claim.data.name}
            </Link>
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, margin: '6px 0 2px' }}>
              Holdback recovery
            </h1>
            <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)', maxWidth: 560, lineHeight: 1.5 }}>
              This claim is still open. Recovery starts after it settles — the
              carrier pays ACV, withholds the depreciation, and the insured
              replaces what they choose to. Close the claim when that has
              happened and this becomes a working page.
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="k-worksheet">
      <AppHeader
        actions={
          <Link className="k-btn k-btn--ghost" to={`/claims/${claimId}`}>
            Open worksheet →
          </Link>
        }
      />

      <section className="k-claim-hd">
        <div>
          <Link to={`/claims/${claimId}`} className="k-crumb" title="Back to the claim">
            <Icon d={I.chevleft} size={12} /> {claim.data.name}
          </Link>
          <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.02em', margin: '6px 0 2px' }}>
            Holdback recovery
          </h1>
          <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)' }}>
            Settled at ACV · the carrier withheld the depreciation. Prove each
            replacement to recover it — the settled schedule itself never changes.
          </div>
        </div>
        <div className="k-claim-ov-stats">
          <div>
            <div className="k-tot-l">Withheld</div>
            <div className="k-tot-v">{fmtUSD(totals.withheld)}</div>
          </div>
          <div>
            <div className="k-tot-l">Recoverable</div>
            <div className="k-tot-v" style={{ color: 'var(--k-ok)' }}>
              {fmtUSD(totals.recoverable)}
            </div>
          </div>
          <div>
            <div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>
              Still on the table
            </div>
            <div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>
              {fmtUSD(Math.max(0, totals.withheld - totals.recoverable))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: '14px 24px 10px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Badge tone="quiet">
          {totals.claimedLines} of {totals.totalLines} lines claimed
        </Badge>
        <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>Every edit saves as you go</span>
        {/* Amber is for special limits only (rule 6). A missing receipt is a
            thing to fix before sending, not a coverage cap. */}
        {warning ? <Badge tone="quiet">{totals.missingReceipts} missing receipt</Badge> : null}

        <span style={{ flex: 1 }} />

        {canRequestRecovery(lines) ? (
          <>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              disabled={busy}
              onClick={() => void download('xlsx')}
            >
              <Icon d={I.download} size={12} /> Request · .xlsx
            </button>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              disabled={busy}
              onClick={() => void download('pdf')}
            >
              <Icon d={I.download} size={12} /> Request · PDF
            </button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
            No replaced items yet — enter an actual cost to start a recovery request.
          </span>
        )}
      </div>

      {warning ? (
        <p style={{ padding: '0 24px 8px', margin: 0, fontSize: 12, color: 'var(--k-fg-3)', maxWidth: 720, lineHeight: 1.5 }}>
          {warning}
        </p>
      ) : null}
      {notice ? (
        <p style={{ padding: '0 24px 8px', margin: 0, fontSize: 12, color: 'var(--k-fg-2)' }}>{notice}</p>
      ) : null}

      <div style={{ padding: '4px 24px 32px', overflowX: 'auto' }}>
        <table className="k-rec-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Description</th>
              <th style={{ textAlign: 'left' }}>Room</th>
              <th>Qty</th>
              <th>Scheduled</th>
              <th>ACV paid</th>
              <th>Withheld</th>
              <th>Actually spent</th>
              <th>Units</th>
              <th>Recoverable</th>
              <th style={{ textAlign: 'left' }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <RecoveryRow key={line.id} line={line} onNotice={setNotice} />
            ))}
          </tbody>
        </table>
        {lines.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>
            No priced lines on this claim, so there is nothing withheld to recover.
          </p>
        ) : null}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------

function RecoveryRow({
  line,
  onNotice,
}: {
  line: RecoveryLine
  onNotice: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [claimed, setClaimed] = useState(line.claimed_rcv != null ? String(line.claimed_rcv) : '')
  const [qty, setQty] = useState(line.replaced_qty != null ? String(line.replaced_qty) : '')
  const [bad, setBad] = useState(false)

  const parsedClaimed = parseClaimed(claimed)
  const parsedQty = parseQty(qty)
  const warn =
    parsedClaimed.ok && parsedQty.ok
      ? holdbackWarning({
          claimedRcv: parsedClaimed.value,
          replacedQty: parsedQty.value,
          quantity: line.quantity ?? 1,
        })
      : null

  const save = useMutation({
    mutationFn: (body: { claimed_rcv: number | null; replaced_qty: number | null }) =>
      api.patch<{ recoverable: number }>(`/v1/claim_items/${line.id}`, { json: body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claim-items-flat'] })
    },
    onError: (error) =>
      onNotice(error instanceof Error ? error.message : 'Could not save that line.'),
  })

  const receipt = useMutation({
    mutationFn: (file: File) => uploadReceipt(line.id, file),
    onSuccess: () => {
      onNotice('Receipt attached. It proves the spend — the numbers claim it.')
      void queryClient.invalidateQueries({ queryKey: ['claim-items-flat'] })
    },
    onError: (error) =>
      onNotice(error instanceof Error ? error.message : 'Could not attach that receipt.'),
  })

  /**
   * Same pairing rule as the item drawer: an amount with no count computes $0
   * recoverable on money genuinely owed, so the count is filled in rather than
   * left for the adjuster to discover.
   */
  const commit = () => {
    const c = parseClaimed(claimed)
    const q = parseQty(qty)
    if (!c.ok || !q.ok) {
      setBad(true)
      return
    }
    setBad(false)
    const count = c.value !== null && q.value === null ? defaultReplacedQty(line.quantity) : q.value
    if (count !== q.value) setQty(String(count))
    if (c.value === (line.claimed_rcv ?? null) && count === (line.replaced_qty ?? null)) return
    save.mutate({ claimed_rcv: c.value, replaced_qty: count })
  }

  const onRequest = isRecoverableLine({ ...line, claimed_rcv: parsedClaimed.ok ? parsedClaimed.value : null })

  return (
    <>
      <tr className={onRequest ? 'k-rec-row--on' : undefined}>
        <td>{line.description ?? `Line ${line.id}`}</td>
        <td style={{ color: 'var(--k-fg-4)' }}>{line.room_area ?? '—'}</td>
        <td className="k-mono">{line.quantity ?? 1}</td>
        <td className="k-mono">{fmtUSD(line.rcv_total_incl)}</td>
        <td className="k-mono">{fmtUSD(line.acv_total_incl)}</td>
        <td className="k-mono">{fmtUSD(line.depreciation_amount)}</td>
        <td>
          <input
            className="k-cell k-cell--input k-mono"
            style={{ textAlign: 'right', width: 96, ...(bad && !parsedClaimed.ok ? { borderColor: 'var(--k-danger)' } : {}) }}
            value={claimed}
            placeholder="—"
            inputMode="decimal"
            onChange={(e) => setClaimed(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
          />
        </td>
        <td>
          <input
            className="k-cell k-cell--input k-mono"
            style={{ textAlign: 'right', width: 56, ...(bad && !parsedQty.ok ? { borderColor: 'var(--k-danger)' } : {}) }}
            value={qty}
            placeholder={String(line.quantity ?? 1)}
            inputMode="numeric"
            onChange={(e) => setQty(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
          />
        </td>
        {/* The SERVER's figure, applied verbatim -- services/holdback.py owns
            the lesser-of math and nothing here recomputes it. */}
        <td
          className="k-mono"
          style={{ fontWeight: 600, color: (line.recoverable ?? 0) > 0 ? 'var(--k-ok)' : 'var(--k-fg-4)' }}
        >
          {save.isPending ? '…' : fmtUSD(line.recoverable ?? 0)}
        </td>
        <td>
          {line.receipt_url ? (
            <a className="k-src-link" href={line.receipt_url} target="_blank" rel="noreferrer noopener">
              <Icon d={I.file} size={11} /> View
            </a>
          ) : (
            <label className="k-link" style={{ cursor: 'pointer', fontSize: 11.5 }}>
              {receipt.isPending ? 'Attaching…' : onRequest ? 'MISSING — attach' : 'Attach'}
              <input
                type="file"
                accept={RECEIPT_ACCEPT}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) receipt.mutate(f)
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </td>
      </tr>
      {warn ? (
        <tr>
          <td colSpan={10} style={{ fontSize: 11.5, color: 'var(--k-danger)', paddingBottom: 8 }}>
            {HOLDBACK_WARNING_COPY[warn]}
          </td>
        </tr>
      ) : null}
    </>
  )
}
