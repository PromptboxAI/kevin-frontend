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
 * Bulk (un)assign. All-or-nothing: a foreign id or a room from another claim
 * fails the whole batch and changes nothing.
 */
export function assignRoom(itemIds: number[], roomId: number | null) {
  return api.patch<{ assigned: number; item_ids: number[] }>('/v1/claim_items/assign-room', {
    json: { item_ids: itemIds, room_id: roomId },
  })
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
