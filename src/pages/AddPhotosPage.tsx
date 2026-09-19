import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimMissing from '../components/ClaimMissing'
import { I, Icon } from '../components/Icon'
import PhotoUpload from '../components/PhotoUpload'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import type { ClaimSummary } from '../lib/types'

const EYEBROW: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--k-fg-4)',
  fontFamily: 'var(--k-font-mono)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontWeight: 600,
}
const H1: React.CSSProperties = {
  fontFamily: 'var(--k-font-display)',
  fontWeight: 400,
  fontSize: 38,
  letterSpacing: '-0.025em',
  margin: '6px 0 4px',
  lineHeight: 1.1,
}
const LEDE: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--k-fg-3)',
  margin: '6px 0 0',
  maxWidth: 620,
  lineHeight: 1.5,
}

/**
 * More photos for a claim that already exists -- the worksheet's, overview's
 * and staging's "Add photos".
 *
 * Rule 22: a second drop APPENDS. `POST …/staging` opens a NEW session once
 * the last one is processed, so these photos stage on their own, become new
 * line items, and continue the numbering; nothing already on the claim is
 * touched. The buttons used to go nowhere (a "next build" notice), back to a
 * processed staging record with no upload, or to New claim -- which would
 * have filed these photos under a second claim.
 */
export default function AddPhotosPage() {
  const { claimId = '' } = useParams()
  const navigate = useNavigate()
  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
    retry: retryUnlessMissing,
  })

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const name = claim.data?.name || claimId
  const items = claim.data?.item_count ?? 0

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <div>
          <Link to={`/claims/${encodeURIComponent(claimId)}`} className="k-crumb" title="Back to the worksheet">
            <Icon d={I.chevleft} size={12} /> {name}
          </Link>
          <div style={EYEBROW}>Add to this claim</div>
          <h1 style={H1}>Add photos</h1>
          <p style={LEDE}>
            New photos become new line items on <strong>{name}</strong>
            {items ? `, after the ${items === 1 ? 'item' : `${items} items`} already there` : ''}.
            Nothing already on the claim changes, and numbering carries on from where it stopped.
          </p>
        </div>

        <section className="k-intake-section" style={{ marginTop: 24 }}>
          <PhotoUpload
            claimId={claimId}
            onStaged={() => navigate(`/claims/${encodeURIComponent(claimId)}/staging`)}
          />
        </section>
      </div>
    </div>
  )
}
