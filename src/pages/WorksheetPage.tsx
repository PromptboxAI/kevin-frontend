import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimStatusChip from '../components/ClaimStatusChip'
import { ApiError, api } from '../lib/api'
import { extCost, fmtAge, fmtInt, fmtPct, fmtUSD } from '../lib/format'
import { CAPACITY_REASONS } from '../lib/types'
import type { ClaimItem, ClaimItemListResponse, ClaimSummary } from '../lib/types'

const PAGE_SIZE = 100

export default function WorksheetPage() {
  const { claimId = '' } = useParams()
  const [offset, setOffset] = useState(0)

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
  })

  const rows = useQuery({
    queryKey: ['claim-items', claimId, offset],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=${PAGE_SIZE}&offset=${offset}`,
      ),
    // Keep the grid on screen while paging instead of flashing empty.
    placeholderData: keepPreviousData,
  })

  const total = rows.data?.count ?? 0
  const shown = rows.data?.items.length ?? 0
  const pageEnd = offset + shown

  return (
    <div className="k-shell">
      <AppHeader />

      <div className="k-claims-body">
        <div className="k-ws-head">
          <div>
            <Link to="/claims" className="k-back">
              ← Claims
            </Link>
            <h1 className="k-claims-title">{claim.data?.name ?? claimId}</h1>
            <p className="k-claim-sub">
              {[claim.data?.insured_name, claim.data?.carrier, claim.data?.loss_type]
                .filter(Boolean)
                .join(' · ') || claimId}
            </p>
          </div>
          {claim.data ? (
            <div className="k-claims-stats">
              <div>
                <div className="k-tot-l">Items</div>
                <div className="k-tot-v">{fmtInt(claim.data.item_count)}</div>
              </div>
              <div>
                <div className="k-tot-l">RCV</div>
                <div className="k-tot-v">{fmtUSD(claim.data.total_rcv)}</div>
              </div>
              <div>
                <div className="k-tot-l">ACV</div>
                <div className="k-tot-v">{fmtUSD(claim.data.total_acv)}</div>
              </div>
            </div>
          ) : null}
        </div>

        {claim.data ? (
          <div className="k-ws-meta">
            <ClaimStatusChip status={claim.data.status} />
            {claim.data.tax_rate !== null ? (
              <span className="k-claim-sub">Tax {fmtPct(claim.data.tax_rate)}</span>
            ) : null}
          </div>
        ) : null}

        {rows.isPending ? <p className="k-note">Loading items…</p> : null}

        {rows.error ? (
          <p className="k-error">
            Couldn't load items
            {rows.error instanceof ApiError ? ` (HTTP ${rows.error.status})` : ''}.
          </p>
        ) : null}

        {rows.data ? (
          <>
            <div className="k-ws-wrap">
              <table className="k-ws">
                <thead>
                  <tr>
                    <th className="k-ws-n">#</th>
                    <th>Room/Area</th>
                    <th className="k-ws-n">Qty</th>
                    <th>Description</th>
                    <th>Make/Mfr</th>
                    <th>Model #</th>
                    <th>Content class</th>
                    <th className="k-ws-n">Unit Cost</th>
                    <th className="k-ws-n">Ext. Cost</th>
                    <th className="k-ws-n">Sales Tax</th>
                    <th className="k-ws-n">RCV + Tax</th>
                    <th className="k-ws-n">Age</th>
                    <th className="k-ws-n">% Depr.</th>
                    <th className="k-ws-n">$ Depr.</th>
                    <th className="k-ws-n">ACV</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.data.items.map((item, index) => (
                    <Row key={item.id} item={item} n={offset + index + 1} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="k-ws-foot">
              <span className="k-claim-sub">
                {total === 0
                  ? 'No items'
                  : `${fmtInt(offset + 1)}–${fmtInt(pageEnd)} of ${fmtInt(total)}`}
              </span>
              <div className="k-ws-pager">
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  disabled={pageEnd >= total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function Row({ item, n }: { item: ClaimItem; n: number }) {
  const unpriced = item.status === 'needs_manual'
  // Capacity waits are NOT adjuster work -- quiet pending state, never amber.
  const waiting = unpriced && item.manual_reason !== null && CAPACITY_REASONS.has(item.manual_reason)
  const comp = item.alternative_sources?.[0]

  return (
    <tr className={unpriced && !waiting ? 'k-ws-row k-ws-row--manual' : 'k-ws-row'}>
      <td className="k-ws-n k-ws-idx">{n}</td>
      <td>{item.room_area ?? '—'}</td>
      <td className="k-ws-n">{item.quantity}</td>
      <td className="k-ws-desc">
        {item.description || <span className="k-ws-blank">—</span>}
        {waiting ? <Badge tone="quiet">Pricing</Badge> : null}
        {item.is_manually_queried ? <Badge tone="quiet">Repriced</Badge> : null}
        {item.valuation_basis === 'manual' ? <Badge tone="quiet">Manual</Badge> : null}
      </td>
      <td>{item.make_mfr || '—'}</td>
      <td className="k-ws-mono">{item.model_number || '—'}</td>
      <td>{item.category ?? '—'}</td>
      {/* Every money cell below is the server's figure, read verbatim. */}
      <td className="k-ws-n k-ws-mono">{fmtUSD(item.rcv)}</td>
      <td className="k-ws-n k-ws-mono">{fmtUSD(extCost(item.rcv_total_incl, item.tax))}</td>
      <td className="k-ws-n k-ws-mono">{fmtUSD(item.tax)}</td>
      <td className="k-ws-n k-ws-mono">{fmtUSD(item.rcv_total_incl)}</td>
      <td className="k-ws-n k-ws-mono">{fmtAge(item.age_years)}</td>
      <td className="k-ws-n k-ws-mono">{fmtPct(item.depreciation_pct)}</td>
      <td className="k-ws-n k-ws-mono">{fmtUSD(item.depreciation_amount)}</td>
      <td className="k-ws-n k-ws-mono">{fmtUSD(item.acv_total_incl)}</td>
      <td>
        {/* Only alternative_sources[0] has a direct merchant link; runners-up
            carry a Google Shopping search url and must render as plain text. */}
        {comp?.link ? (
          <a className="k-link" href={comp.link} target="_blank" rel="noreferrer noopener">
            Link
          </a>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}
