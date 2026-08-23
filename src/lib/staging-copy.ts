/** Lifted verbatim from CONFLICT_COPY in design/components/photo-staging.jsx. */
export const CONFLICT_COPY: Record<string, string> = {
  merge_unextracted:
    'Kevin is still reading one of these photos. It can join a set as soon as that finishes — a moment.',
  cluster_extracting: 'Still reading photos. Grouping starts once every photo has been read.',
  cluster_after_edits:
    'You have arranged sets by hand, so a full regroup would discard that work. Use Group ungrouped photos for the late ones, or Start over to rebuild from scratch.',
  cluster_none_left: 'Every photo is already in a set.',
}

export const SET_LABEL = (i: number) => `Set ${String(i + 1).padStart(2, '0')}`

/**
 * Pick the conflict copy for a 409 from what we know, so the adjuster reads an
 * explanation rather than a status code. Never a red banner: none of these are
 * failures, they are "not yet" or "that would undo your work".
 */
export function conflictCopy(action: 'merge' | 'cluster' | 'remainder', detail?: unknown): string {
  const text = typeof detail === 'string' ? detail.toLowerCase() : ''
  if (action === 'merge') return CONFLICT_COPY.merge_unextracted
  if (action === 'remainder') return CONFLICT_COPY.cluster_none_left
  if (text.includes('manual') || text.includes('edit')) return CONFLICT_COPY.cluster_after_edits
  return CONFLICT_COPY.cluster_extracting
}
