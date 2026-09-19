import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Alert from './Alert'
import { ApiError } from '../lib/api'
import { fmtInt } from '../lib/format'
import { getStaging } from '../lib/staging'

/**
 * Photos uploaded to a claim but not yet processed -- the latest staging
 * session, while it is anything but `processed`.
 *
 * Shares the staging page's cache key, so opening Group & stage from here
 * shows the session at once. A claim with no session answers 404, which is
 * "nothing waiting", not an error.
 */
export function usePendingStaging(claimId: string, enabled = true) {
  const q = useQuery({
    queryKey: ['staging', claimId],
    queryFn: () => getStaging(claimId),
    enabled: enabled && !!claimId,
    retry: (count, err) => !(err instanceof ApiError && err.isMissing) && count < 2,
    staleTime: 15_000,
  })
  const s = q.data
  const waiting = s && s.status !== 'processed' ? s.photo_count : 0
  return { waiting, loaded: q.isSuccess || q.isError }
}

/**
 * The way back to Group & stage, said plainly wherever a claim is opened while
 * an upload is waiting. The only route used to be a small "Open staging" link
 * inside a photo's panel on the Photos tab.
 */
export default function PendingStagingAlert({
  claimId,
  className,
}: {
  claimId: string
  className?: string
}) {
  const { waiting } = usePendingStaging(claimId)
  if (!waiting) return null
  return (
    <Alert
      tone="info"
      className={className}
      title={`${fmtInt(waiting)} ${waiting === 1 ? 'photo is' : 'photos are'} waiting to be grouped`}
      action={
        <Link className="k-btn k-btn--sm" to={`/claims/${encodeURIComponent(claimId)}/staging`}>
          Continue to Group &amp; stage →
        </Link>
      }
    >
      {waiting === 1 ? 'It hasn’t' : 'They haven’t'} been processed yet, so{' '}
      {waiting === 1 ? 'it isn’t' : 'they aren’t'} on the worksheet.
    </Alert>
  )
}
