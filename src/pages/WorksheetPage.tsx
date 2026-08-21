import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimStatusChip from '../components/ClaimStatusChip'
import ItemDrawer from '../components/ItemDrawer'
import { ApiError, api } from '../lib/api'
import { extCost, fmtAge, fmtInt, fmtPct, fmtUSD } from '../lib/format'
import { CAPACITY_REASONS } from '../lib/types'
import type { ClaimItem, ClaimItemListResponse, ClaimSummary } from '../lib/types'

const PAGE_SIZE = 100

/** Server-side filter -- the API takes ?status=, so this is not a client sieve. */
const STATUS_FILTERS = [
  ['', 'All'],
  ['needs_manual', 'Unpriced'],
  ['completed', 'Completed'],
  ['overridden', 'Overridden'],
  ['processing', 'Processing'],
  ['failed', 'Failed'],
] as const

/** Column order and labels, mirroring the prototype's HEADERS table exactly. */
const HEADERS: [string, string][] = [
  ['k-c--idx', '#'],
  ['k-c--room', 'Room / Area'],
  ['k-c--qty', 'Qty'],
  ['k-c--desc', 'Description'],
  ['k-c--mfr', 'Make / Mfr'],
  ['k-c--model', 'Model #'],
  ['k-c--cat', 'Content class'],
  ['k-c--rcv', 'Unit Cost'],
  ['k-c--ext', 'Ext. Cost'],
  ['k-c--tax', 'Sales Tax'],
  ['k-c--rcvtax', 'RCV + Tax'],
  ['k-c--age', 'Age'],
  ['k-c--dep', '% Depr.'],
  ['k-c--depamt', '$ Depr.'],
  ['k-c--acv', 'ACV'],
  ['k-c--src', 'Link'],
]

/**
 * The prototype's grid template minus the leading checkbox column, which
 * belongs to multi-select (a mutation) and is not part of the read-state.
 */
const ROW_COLS = [
  '52px', // idx
  '130px', // room
  '46px', // qty
  'minmax(200px, 2.4fr)', // desc
  'minmax(110px, 1.1fr)', // mfr
  'minmax(120px, 1.2fr)', // model
  'minmax(150px, 1.6fr)', // category
  '118px', // unit cost
  '96px', // ext cost
  '78px', // sales tax
  '100px', // rcv + tax
  '58px', // age
  '84px', // % depr
  '100px', // $ depr
  '100px', // ACV
  '48px', // src
].join(' ')

const GRID_STYLE = {
  ['--row-cols' as string]: ROW_COLS,
  ['--k-gridw' as string]: '1548px',
} as React.CSSProperties

export default function WorksheetPage() {
  const { claimId = '' } = useParams()
  const [offset, setOffset] = useState(0)
  const [openRow, setOpenRow] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
  })

  const rows = useQuery({
    queryKey: ['claim-items', claimId, offset, status],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=${PAGE_SIZE}&offset=${offset}` +
          (status ? `&status=${status}` : ''),
      ),
    placeholderData: keepPreviousData,
  })

  const total = rows.data?.count ?? 0
  const shown = rows.data?.items.length ?? 0
  const pageEnd = offset + shown

  return (
    <div className="k-shell">
      <AppHeader />

      <div className="k-ws-page">
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

        <section className="k-claims-toolbar">
          <div className="k-segwrap">
            {STATUS_FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`k-seg ${value === status ? 'k-seg--on' : ''}`}
                onClick={() => {
                  setStatus(value)
                  setOffset(0)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {rows.isPending ? <p className="k-note">Loading items…</p> : null}

        {rows.error ? (
          <p className="k-error">
            Could not load items
            {rows.error instanceof ApiError ? ` (HTTP ${rows.error.status})` : ''}.
          </p>
        ) : null}

        {rows.data ? (
          <>
            <div className="k-grid k-grid--ws" style={GRID_STYLE}>
              <div className="k-row k-row--head">
                {HEADERS.map(([cls, label]) => (
                  <div key={cls} className={`k-c ${cls}`}>
                    {label}
                  </div>
                ))}
              </div>

              {rows.data.items.map((item, index) => (
                <Row
                  key={item.id}
                  item={item}
                  n={offset + index + 1}
                  onOpen={() => setOpenRow(item.id)}
                />
              ))}
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

      {openRow !== null ? <ItemDrawer rowId={openRow} onClose={() => setOpenRow(null)} /> : null}
    </div>
  )
}

/** A derived cell with no value reads as a muted dash, as in the prototype. */
function Dash() {
  return <span className="k-dash">—</span>
}

function Money({ value }: { value: number | null | undefined }) {
  return value === null || value === undefined ? <Dash /> : <>{fmtUSD(value)}</>
}

function Row({ item, n, onOpen }: { item: ClaimItem; n: number; onOpen: () => void }) {
  const unpriced = item.status === 'needs_manual'
  // Capacity waits are NOT adjuster work -- quiet pending state, never amber.
  const waiting = Boolean(unpriced && item.manual_reason && CAPACITY_REASONS.has(item.manual_reason))
  const comp = item.alternative_sources?.[0]
  const depAmount = item.depreciation_amount

  return (
    <div className={`k-row${unpriced && !waiting ? ' k-row--manual' : ''}`}>
      <div className="k-c k-c--idx">
        <button type="button" className="k-idx-btn" onClick={onOpen} title="Open item">
          {String(n).padStart(4, '0')}
        </button>
      </div>

      <div className="k-c k-c--room">{item.room_area || <Dash />}</div>
      <div className="k-c k-c--qty k-mono">{item.quantity}</div>

      <div className="k-c k-c--desc">
        <span className="k-desc-text">{item.description || <Dash />}</span>
        {waiting ? <span className="k-pricing-chip">Pricing</span> : null}
      </div>

      <div className="k-c k-c--mfr">{item.make_mfr || <Dash />}</div>
      <div className="k-c k-c--model k-mono">{item.model_number || <Dash />}</div>

      <div className="k-c k-c--cat">
        <span>{item.category || <Dash />}</span>
        {item.pcs_code ? <span className="k-pcs">{item.pcs_code}</span> : null}
      </div>

      {/* Every money cell below is the server's figure, read verbatim. */}
      <div className="k-c k-c--rcv k-mono">
        <Money value={item.rcv} />
      </div>
      <div className="k-c k-c--ext k-mono">
        <Money value={extCost(item.rcv_total_incl, item.tax)} />
      </div>
      <div className="k-c k-c--tax k-mono">
        <Money value={item.tax} />
      </div>
      <div className="k-c k-c--rcvtax k-mono">
        <Money value={item.rcv_total_incl} />
      </div>
      <div className="k-c k-c--age k-mono">
        {item.age_years === null ? <Dash /> : fmtAge(item.age_years)}
      </div>
      <div className="k-c k-c--dep k-mono">
        {item.depreciation_pct === null ? <Dash /> : fmtPct(item.depreciation_pct)}
      </div>
      <div className="k-c k-c--depamt k-mono">
        {/* Depreciation is always >= 0, so a signed zero is a formatting artifact. */}
        {depAmount === null || depAmount === undefined ? (
          <Dash />
        ) : depAmount > 0 ? (
          `−${fmtUSD(depAmount)}`
        ) : (
          fmtUSD(0)
        )}
      </div>
      <div className="k-c k-c--acv k-mono k-acv">
        <Money value={item.acv_total_incl} />
      </div>

      <div className="k-c k-c--src">
        {/* Only alternative_sources[0] resolves to a merchant listing. */}
        {comp?.link ? (
          <a className="k-src-link" href={comp.link} target="_blank" rel="noreferrer noopener">
            Link
          </a>
        ) : (
          <Dash />
        )}
      </div>
    </div>
  )
}
