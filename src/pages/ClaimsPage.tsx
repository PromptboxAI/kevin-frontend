import { useQuery } from '@tanstack/react-query'
import AppHeader from '../components/AppHeader'
import ClaimStatusChip from '../components/ClaimStatusChip'
import { ApiError, api } from '../lib/api'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import type { ClaimListResponse } from '../lib/types'

export default function ClaimsPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ['claims'],
    queryFn: () => api.get<ClaimListResponse>('/v1/claims?limit=100'),
  })

  return (
    <div className="k-app">
      <AppHeader />
      <main className="k-main">
        <div className="k-head">
          <h1>Claims</h1>
          {data ? <p className="k-count">{fmtInt(data.count)} total</p> : null}
        </div>

        {isPending ? <p className="k-note">Loading claims…</p> : null}

        {error ? (
          <p className="k-error">
            Couldn't load claims
            {error instanceof ApiError ? ` (HTTP ${error.status})` : ''}.
            {error instanceof ApiError && error.requestId ? (
              <span className="k-portal-ref"> Reference: {error.requestId}</span>
            ) : null}
          </p>
        ) : null}

        {data && data.claims.length === 0 ? (
          <div className="k-empty">
            <h2>No claims yet</h2>
            <p>
              A claim is the named parent of every item. Uploading photos creates one
              automatically, or you can capture the intake details up front.
            </p>
          </div>
        ) : null}

        {data && data.claims.length > 0 ? (
          <div className="k-tablewrap">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Insured</th>
                  <th>Carrier</th>
                  <th>Date of loss</th>
                  <th className="k-num">Items</th>
                  <th className="k-num">RCV</th>
                  <th className="k-num">ACV</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.claims.map((claim) => (
                  <tr key={claim.claim_id}>
                    <td>
                      <span className="k-strong">{claim.name}</span>
                      <span className="k-sub">{claim.claim_id}</span>
                    </td>
                    <td>{claim.insured_name ?? '—'}</td>
                    <td>{claim.carrier ?? '—'}</td>
                    <td>{fmtDate(claim.date_of_loss)}</td>
                    <td className="k-num">{fmtInt(claim.item_count)}</td>
                    {/* Tax-inclusive server totals -- rendered verbatim. */}
                    <td className="k-num">{fmtUSD(claim.total_rcv)}</td>
                    <td className="k-num">{fmtUSD(claim.total_acv)}</td>
                    <td>
                      <ClaimStatusChip status={claim.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
    </div>
  )
}
