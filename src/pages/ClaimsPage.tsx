import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimStatusChip from '../components/ClaimStatusChip'
import { ApiError, api } from '../lib/api'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import type { ClaimListResponse, ClaimSummary } from '../lib/types'

const FILTERS = ['All', 'Draft', 'Processing', 'In review', 'Exported'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_STATUS: Record<Exclude<Filter, 'All'>, ClaimSummary['status']> = {
  Draft: 'draft',
  Processing: 'processing',
  'In review': 'in_review',
  Exported: 'exported',
}

export default function ClaimsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const { data, error, isPending } = useQuery({
    queryKey: ['claims'],
    queryFn: () => api.get<ClaimListResponse>('/v1/claims?limit=100'),
  })

  const claims = useMemo(() => {
    const all = data?.claims ?? []
    const term = search.trim().toLowerCase()
    return all.filter((claim) => {
      if (filter !== 'All' && claim.status !== FILTER_STATUS[filter]) return false
      if (!term) return true
      return [claim.name, claim.claim_id, claim.insured_name, claim.carrier, claim.claim_number]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    })
  }, [data, search, filter])

  // Rollups sum the server's tax-inclusive totals; nothing is derived here.
  const totals = useMemo(
    () => ({
      claims: claims.length,
      items: claims.reduce((sum, c) => sum + (c.item_count ?? 0), 0),
      rcv: claims.reduce((sum, c) => sum + (c.total_rcv ?? 0), 0),
    }),
    [claims],
  )

  return (
    <div className="k-shell">
      <AppHeader />

      <div className="k-claims-body">
        <div className="k-claims-head">
          <h1 className="k-claims-title">Claims</h1>
          <div className="k-claims-stats">
            <div>
              <div className="k-tot-l">Claims</div>
              <div className="k-tot-v">{fmtInt(totals.claims)}</div>
            </div>
            <div>
              <div className="k-tot-l">Items</div>
              <div className="k-tot-v">{fmtInt(totals.items)}</div>
            </div>
            <div>
              <div className="k-tot-l">RCV</div>
              <div className="k-tot-v">{fmtUSD(totals.rcv)}</div>
            </div>
          </div>
        </div>

        <section className="k-claims-toolbar">
          <div className="k-search" style={{ minWidth: 280 }}>
            <input
              placeholder="Filter claims · name, claim #, carrier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="k-segwrap">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                className={`k-seg ${option === filter ? 'k-seg--on' : ''}`}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {isPending ? <p className="k-note">Loading claims…</p> : null}

        {error ? (
          <p className="k-error">
            Couldn't load claims{error instanceof ApiError ? ` (HTTP ${error.status})` : ''}.
            {error instanceof ApiError && error.requestId ? ` Reference: ${error.requestId}` : ''}
          </p>
        ) : null}

        {data && claims.length === 0 ? (
          <div className="k-empty">
            <h2>{data.claims.length === 0 ? 'No claims yet' : 'No claims match'}</h2>
            <p>
              {data.claims.length === 0
                ? 'A claim is the named parent of every item. Uploading photos creates one automatically, or you can capture the intake details up front.'
                : 'Try a different search term or filter.'}
            </p>
          </div>
        ) : null}

        {claims.length > 0 ? (
          <section className="k-claims-list">
            <div className="k-claim-row k-claim-row--head">
              <div>Claim</div>
              <div>Insured / cause</div>
              <div>Carrier</div>
              <div style={{ textAlign: 'right' }}>Items</div>
              <div style={{ textAlign: 'right' }}>RCV</div>
              <div>Status</div>
              <div />
            </div>

            {claims.map((claim) => (
              <div key={claim.claim_id} className="k-claim-row">
                <div>
                  <div className="k-claim-id" title={claim.claim_id}>
                    {claim.claim_id}
                  </div>
                  <div className="k-claim-sub">DOL {fmtDate(claim.date_of_loss)}</div>
                </div>

                <div>
                  <div className="k-claim-name">{claim.name}</div>
                  <div className="k-claim-sub">
                    {[claim.insured_name, claim.loss_type].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>

                <div className="k-claim-carrier">{claim.carrier ?? '—'}</div>

                <div className="k-claim-num">{fmtInt(claim.item_count)}</div>

                {/* Tax-inclusive server total, rendered verbatim. */}
                <div className="k-claim-rcv">{fmtUSD(claim.total_rcv)}</div>

                <div className="k-claim-status">
                  <ClaimStatusChip status={claim.status} />
                  {claim.status_counts?.needs_manual > 0 ? (
                    <Badge tone="warn">{claim.status_counts.needs_manual} unpriced</Badge>
                  ) : null}
                </div>

                <div />
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
