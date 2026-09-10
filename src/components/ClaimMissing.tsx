import { Link } from 'react-router-dom'
import AppHeader from './AppHeader'
import NewClaimButton from './NewClaimButton'

/**
 * What every screen inside a claim shows when `GET /v1/claims/{id}` is a 404.
 *
 * Before this, the worksheet rendered the URL slug as the claim's title with
 * Add photos, Share and Export all live, over an empty grid -- a claim that
 * does not exist looked exactly like a new one with no items yet. Overview and
 * Recovery showed "Loading claim…" forever. One component, so the claim
 * screens cannot drift into three different answers again.
 *
 * 404 is deliberately "not found OR not yours" (ApiError.isMissing), so the
 * copy never says which: a deleted claim, a mistyped link and someone else's
 * claim all read the same.
 *
 * The header carries NewClaimButton rather than the claim's own actions --
 * there is no claim for them to act on.
 */
export default function ClaimMissing({ claimId }: { claimId: string }) {
  return (
    <div className="k-intake">
      <AppHeader actions={<NewClaimButton />} />
      <div className="k-intake-body">
        <div className="k-empty">
          <h2>Claim not found</h2>
          <p>
            There’s no claim at <code>/claims/{claimId}</code> on this account. It may have been
            deleted, or the link may be mistyped.
          </p>
          <Link to="/claims" className="k-btn">
            Back to My claims
          </Link>
        </div>
      </div>
    </div>
  )
}
