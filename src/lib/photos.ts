import { api } from './api'
import type { ClaimPhoto } from './photo-rules'

/**
 * Every photo on a claim, and where it sits.
 *
 * `GET /v1/claims/{id}/photos` is the only endpoint that sees the whole set --
 * staged and attached together. The worksheet reaches photos one row at a time;
 * this is the claim-wide view the gallery needs.
 */

export type ClaimPhotosResponse = {
  photos: ClaimPhoto[]
  count: number
  limit: number
  offset: number
}

/** The contract's cap. A claim past this pages. */
export const PHOTO_PAGE = 500

export function getClaimPhotos(
  claimId: string,
  opts: { state?: ClaimPhoto['state']; limit?: number; offset?: number } = {},
) {
  const q = new URLSearchParams()
  if (opts.state) q.set('state', opts.state)
  q.set('limit', String(opts.limit ?? PHOTO_PAGE))
  if (opts.offset) q.set('offset', String(opts.offset))
  return api.get<ClaimPhotosResponse>(
    `/v1/claims/${encodeURIComponent(claimId)}/photos?${q.toString()}`,
  )
}

/**
 * Point existing photos back at a line.
 *
 * Note the PLURAL path -- `POST …/photo` (singular) uploads a new file, which
 * is a different job. Ineligible ids are skipped rather than failing the batch,
 * so `changed` is what actually moved and is the only honest thing to report.
 */
export function attachPhotos(rowId: number, photoIds: number[]) {
  return api.post<{ status: string; row_id: number; changed: number }>(
    `/v1/claim_items/${rowId}/photos`,
    { json: { photo_ids: photoIds } },
  )
}
