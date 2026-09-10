import Badge from './Badge'
import type { ClaimStatus } from '../lib/types'

/**
 * Four statuses: Processing, In progress, Closed, Archived.
 *
 * The API derives six (FRONTEND.md). `draft`, `in_review` and `exported` are
 * flavours of open, and showing them told the adjuster things they did not
 * need at a glance -- above all "Exported", which only meant a file had been
 * downloaded and read as though the claim were finished. They all show as
 * In progress. `processing` keeps its own label because it means the claim is
 * still being built and the numbers are not settled yet. Closed and archived
 * are the two states the adjuster sets.
 *
 * `closed` outranks `processing` server-side, so a closed claim with one line
 * repricing reads Closed, not Processing.
 */
type Tone = 'ok' | 'quiet' | 'accent'

const LABEL: Partial<Record<ClaimStatus, { label: string; tone: Tone }>> = {
  processing: { label: 'Processing', tone: 'accent' },
  // Grey, not mint: a coloured Closed read as the live one beside navy In
  // progress. Only open work carries colour.
  closed: { label: 'Closed', tone: 'quiet' },
  archived: { label: 'Archived', tone: 'quiet' },
}
const IN_PROGRESS: { label: string; tone: Tone } = { label: 'In progress', tone: 'accent' }

export default function ClaimStatusChip({ status }: { status: ClaimStatus }) {
  const meta = LABEL[status] ?? IN_PROGRESS
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  )
}
