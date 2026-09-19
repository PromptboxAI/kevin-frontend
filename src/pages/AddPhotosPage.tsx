import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimMissing from '../components/ClaimMissing'
import { I, Icon } from '../components/Icon'
import PhotoUpload from '../components/PhotoUpload'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import type { ClaimSummary } from '../lib/types'

const H1: React.CSSProperties = {
  fontFamily: 'var(--k-font-display)',
  fontWeight: 400,
  fontSize: 38,
  letterSpacing: '-0.025em',
  margin: 0,
  lineHeight: 1.1,
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

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <div>
          <Link to={`/claims/${encodeURIComponent(claimId)}`} className="k-crumb" title="Back to the worksheet">
            <Icon d={I.chevleft} size={13} /> Back to {name}
          </Link>
          <h1 style={H1}>Add photos</h1>
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
