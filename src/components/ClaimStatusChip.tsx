import Badge from './Badge'
import type { ClaimStatus } from '../lib/types'

/** Status is DERIVED by the backend from item states -- never set by hand. */
const STATUS: Record<ClaimStatus, { label: string; tone: 'ok' | 'warn' | 'quiet' | 'accent' }> = {
  draft: { label: 'Draft', tone: 'quiet' },
  processing: { label: 'Processing', tone: 'accent' },
  in_review: { label: 'In review', tone: 'ok' },
  exported: { label: 'Exported', tone: 'quiet' },
}

export default function ClaimStatusChip({ status }: { status: ClaimStatus }) {
  const meta = STATUS[status] ?? { label: status, tone: 'quiet' as const }
  return (
    <Badge tone={meta.tone} dot title="Derived from the claim's items — not set by hand">
      {meta.label}
    </Badge>
  )
}
