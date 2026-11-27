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
 * EVERY photo on the claim, paged.
 *
 * `getClaimPhotos` caps at the contract's 500 and says so, but saying so is
 * not the same as handling it: the processing screen asked for 500 and used
 * the answer as if it were the whole claim, so on a 1,164-item claim the
 * photo index covered the first 500 and every tile past that drew a
 * placeholder. The live feed shows the NEWEST items, which are exactly the
 * ones beyond the cap — so in practice almost every thumbnail was blank.
 *
 * Same shape as `fetchAllClaimItems`: read the first page, then keep going
 * while the rows are short of `count`. Bounded, because a server that keeps
 * answering with a full page and a larger count would otherwise loop here.
 */
export const PHOTO_MAX_PAGES = 40

export async function fetchAllClaimPhotos(
  claimId: string,
  opts: { state?: ClaimPhoto['state'] } = {},
): Promise<ClaimPhotosResponse> {
  const first = await getClaimPhotos(claimId, { ...opts, limit: PHOTO_PAGE })
  const photos = [...first.photos]
  for (let page = 1; photos.length < first.count && page < PHOTO_MAX_PAGES; page += 1) {
    const next = await getClaimPhotos(claimId, {
      ...opts,
      limit: PHOTO_PAGE,
      offset: page * PHOTO_PAGE,
    })
    if (next.photos.length === 0) break
    photos.push(...next.photos)
  }
  return { ...first, photos }
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
