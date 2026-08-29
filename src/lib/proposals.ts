import { api } from './api'

/**
 * Items the insured says the inventory missed.
 *
 * MEDIATED, unlike every other client write. Age, receipts and a corrected
 * price write DIRECTLY and are attributed -- those are attestations about the
 * insured's own property, and in a contents claim the insured IS the attesting
 * party. A NEW item is different: it has no query behind it, and a client
 * typing "clothes" would burn two vendor searches on an unpriceable line. So it
 * waits for an adjuster to turn it into something searchable.
 *
 * Which makes this queue the one place client feedback can go silent. Nothing
 * read it until now.
 */

export type ProposalStatus = 'pending' | 'accepted' | 'rejected'

export type Proposal = {
  id: number
  claim_id: string
  description: string
  room: string | null
  quantity: number
  age_years: number | null
  claimed_rcv: number | null
  status: ProposalStatus
  /** Set on accept: the claim_items row this became. */
  item_id: number | null
  created_at: string | null
}

/**
 * The adjuster's enrichment, applied as the proposal becomes a real line.
 *
 * Every field overrides what the insured wrote. This is where "clothes"
 * becomes "Nike Air Max 270 mens size 10" -- the whole reason new items are
 * mediated rather than written straight through.
 */
export type ProposalAccept = {
  description?: string
  room_area?: string
  make_mfr?: string
  model_number?: string
  category?: string
  quantity?: number
  age_years?: number | null
  /**
   * Opt-in, and defaults FALSE on the server for a reason: accepting must not
   * silently spend vendor budget. An unpriced row is a normal state that
   * reprice or retry-deferred picks up later.
   */
  price?: boolean
}

export function listProposals(claimId: string) {
  return api.get<{ claim_id: string; proposals: Proposal[]; count: number }>(
    `/v1/claims/${encodeURIComponent(claimId)}/proposals`,
  )
}

/** 409 if already decided -- accepting twice would duplicate the line item. */
export function acceptProposal(id: number, body: ProposalAccept) {
  return api.post<{ status: string; proposal_id: number; item_id: number }>(
    `/v1/proposals/${id}/accept`,
    { json: body },
  )
}

/**
 * Rejecting carries NO message back to the insured, by design -- their input
 * simply returns. So the adjuster should not be told they are "notifying" one.
 */
export function rejectProposal(id: number) {
  return api.post<{ status: string; proposal_id: number }>(`/v1/proposals/${id}/reject`)
}

export const PROPOSAL_MIN_DESC = 3

/**
 * Is this description one the pricing engine could actually search?
 *
 * The server enforces a 3-character floor so "tv" cannot become a line item.
 * That is not a quality bar -- the adjuster rewrites it anyway -- but a
 * single bare word is exactly what the accept step exists to fix, so the UI
 * says so before the adjuster spends a search on it.
 */
export function looksUnsearchable(description: string): boolean {
  const words = description.trim().split(/\s+/).filter(Boolean)
  return words.length < 2
}
