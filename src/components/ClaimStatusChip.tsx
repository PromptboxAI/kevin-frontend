import type { ClaimStatus } from '../lib/types'

/** Status is derived server-side; this only labels it. */
const LABEL: Record<ClaimStatus, string> = {
  draft: 'Draft',
  processing: 'Processing',
  in_review: 'In review',
  exported: 'Exported',
}

export default function ClaimStatusChip({ status }: { status: ClaimStatus }) {
  return <span className={`k-chip k-chip--${status}`}>{LABEL[status] ?? status}</span>
}
