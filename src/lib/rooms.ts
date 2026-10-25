import { api } from './api'
import type { Room } from './room-rules'

/**
 * Rooms CRUD and bulk assignment.
 *
 * Note what `assignRoom` does NOT do: it does not touch `room_area`, the field
 * the export actually prints. Keeping the two in step is the caller's job --
 * see `assignPlan` in room-rules.ts for why, and `BACKEND-ASKS.md` ask 28 for
 * the server-side fix that would retire the whole dance.
 */

export type RoomListResponse = { rooms: Room[]; count: number }

export function listRooms(claimId: string) {
  return api.get<RoomListResponse>(`/v1/claims/${encodeURIComponent(claimId)}/rooms`)
}

/** `409` when the claim already has a room with this name. */
export function createRoom(claimId: string, name: string) {
  return api.post<Room>(`/v1/claims/${encodeURIComponent(claimId)}/rooms`, { json: { name } })
}

export function renameRoom(roomId: number, name: string) {
  return api.patch<Room>(`/v1/rooms/${roomId}`, { json: { name } })
}

/** Items are NOT deleted -- they fall back to Unassigned. */
export function deleteRoom(roomId: number) {
  return api.delete<{ status: string; room_id: number }>(`/v1/rooms/${roomId}`)
}

/**
 * The server's ceiling on `item_ids` (schemas.py BulkAssignRoomRequest).
 *
 * Raised from 500 to 20,000 on 2026-10-22: the server batches internally and
 * the bound now only stops an absurd request body. A whole claim goes in one
 * call, so the all-or-nothing guarantee holds across the entire selection
 * rather than per chunk — which is the point of keeping one call.
 */
export const ASSIGN_ROOM_MAX = 20_000

/**
 * Bulk (un)assign. All-or-nothing: a foreign id or a room from another claim
 * fails the whole batch and changes nothing.
 *
 * Above `ASSIGN_ROOM_MAX` it necessarily becomes several calls, and the
 * guarantee then holds per call rather than across the set — unavoidable, and
 * better than a 422 that files nothing on a 600-line claim.
 */
export async function assignRoom(itemIds: number[], roomId: number | null) {
  if (itemIds.length <= ASSIGN_ROOM_MAX) {
    return api.patch<{ assigned: number; item_ids: number[] }>('/v1/claim_items/assign-room', {
      json: { item_ids: itemIds, room_id: roomId },
    })
  }
  let assigned = 0
  const done: number[] = []
  for (let i = 0; i < itemIds.length; i += ASSIGN_ROOM_MAX) {
    const slice = itemIds.slice(i, i + ASSIGN_ROOM_MAX)
    const res = await api.patch<{ assigned: number; item_ids: number[] }>(
      '/v1/claim_items/assign-room',
      { json: { item_ids: slice, room_id: roomId } },
    )
    assigned += res.assigned
    done.push(...(res.item_ids ?? slice))
  }
  return { assigned, item_ids: done }
}

/**
 * The Room/Area TEXT on one line.
 *
 * The descriptive endpoint, deliberately: it touches no valuation field and
 * does not mark the row overridden. Filing an item is not a re-pricing.
 */
export function setRoomArea(rowId: number, roomArea: string) {
  return api.patch<unknown>(`/v1/claim_items/${rowId}`, { json: { room_area: roomArea } })
}
