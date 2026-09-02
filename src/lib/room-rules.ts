/**
 * Rooms: the optional buckets inside a claim, and the one hazard they carry.
 *
 * THE THING TO UNDERSTAND BEFORE CHANGING ANY OF THIS. An item has two
 * independent room fields, and the contract says so explicitly:
 *
 *   room_id    the relational link to a `rooms` row. Drives filtering and the
 *              per-room rollups. Set ONLY by PATCH /claim_items/assign-room.
 *   room_area  free text. The worksheet's Room/Area column, and -- the part
 *              that matters -- THE ONLY ONE THE EXPORT PRINTS.
 *
 * `services/export.py` reads `item["room_area"]` for both the .xlsx and the
 * PDF; `room_id` never reaches the document. And `assign-room` updates only
 * `room_id` -- verified in main.py, it writes a single column.
 *
 * So assigning items to a room, on its own, changes NOTHING the carrier sees.
 * An adjuster could file all 52 lines into rooms, export, and hand over a
 * schedule with an empty Room/Area column. That is why every assignment here
 * also stamps `room_area`, and why `assignPlan` exists at all.
 *
 * Import-free so it can be tested.
 */

export type Room = {
  id: number
  claim_id: string
  name: string
  item_count: number
  /** Tax-inclusive, same basis as the claim totals. Read verbatim. */
  total_rcv: number | null
  total_acv: number | null
  total_tax: number | null
  total_depreciation: number | null
}

/** The server's cap on a free-text room, per the edit endpoint. */
export const ROOM_NAME_MAX = 200

export type NameCheck =
  | { ok: true; name: string }
  | { ok: false; reason: 'empty' | 'too_long' | 'duplicate' }

/**
 * Validate a room name before it costs a round trip.
 *
 * The duplicate check is the useful one: the server answers `409`, which
 * surfaces as "That failed" unless it is caught here where the existing name
 * is in hand. Case-insensitive, because "Kitchen" and "kitchen" are one room
 * to everybody except a database.
 */
export function checkRoomName(raw: string, existing: Room[], selfId?: number): NameCheck {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!name) return { ok: false, reason: 'empty' }
  if (name.length > ROOM_NAME_MAX) return { ok: false, reason: 'too_long' }
  const clash = existing.some(
    (r) => r.id !== selfId && r.name.trim().toLowerCase() === name.toLowerCase(),
  )
  return clash ? { ok: false, reason: 'duplicate' } : { ok: true, name }
}

export const ROOM_NAME_ERROR: Record<Exclude<NameCheck, { ok: true }>['reason'], string> = {
  empty: 'Give the room a name.',
  too_long: `Room names stop at ${ROOM_NAME_MAX} characters.`,
  duplicate: 'This claim already has a room with that name.',
}

export type RoomBucket = {
  /** null is the Unassigned bucket, which is not a row in the rooms table. */
  id: number | null
  name: string
  itemCount: number
  totalRcv: number | null
}

/**
 * The sidebar list: every room, plus Unassigned.
 *
 * Unassigned is DERIVED from the items rather than counted server-side, and it
 * is always present when it is non-empty -- items land there from processing
 * and stay there unless someone files them, so it is the bucket that is
 * actually full on a real claim.
 */
export function roomBuckets(rooms: Room[], items: { room_id: number | null }[]): RoomBucket[] {
  const unassigned = items.filter((i) => i.room_id == null).length
  const buckets: RoomBucket[] = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    itemCount: r.item_count,
    totalRcv: r.total_rcv,
  }))
  if (unassigned > 0) {
    buckets.push({ id: null, name: 'Unassigned', itemCount: unassigned, totalRcv: null })
  }
  return buckets
}

export type AssignPlan = {
  /** The bulk call: one request, sets room_id on every id. */
  itemIds: number[]
  roomId: number | null
  /**
   * The rows whose `room_area` text disagrees with where they now live.
   * Each needs its own PATCH -- there is no bulk text endpoint (only
   * `category` and `assign-room` are bulk). Empty when nothing would change,
   * so re-assigning items already in a room costs one call, not N+1.
   */
  textUpdates: { id: number; room_area: string }[]
}

/**
 * What to send for an assignment.
 *
 * Both halves, because only one of them reaches the carrier. `room_area` is
 * overwritten rather than merged: the adjuster just said, explicitly and most
 * recently, which room these belong to, and a stale "Kitchen counter" sitting
 * under a Dining Room assignment is a contradiction on a document someone
 * defends. The UI says that is what will happen before it happens.
 *
 * Unassigning clears `room_id` but LEAVES the text. Deleting the bucket an
 * item sits in is not a statement that the item has no room -- the words are
 * the adjuster's, they are what exports, and dropping them would silently
 * blank a column on the strength of a filing decision.
 */
export function assignPlan(
  items: { id: number; room_area: string | null; room_id: number | null }[],
  target: Room | null,
): AssignPlan {
  const itemIds = items.map((i) => i.id)
  if (target === null) {
    return { itemIds, roomId: null, textUpdates: [] }
  }
  const textUpdates = items
    .filter((i) => (i.room_area ?? '').trim() !== target.name)
    .map((i) => ({ id: i.id, room_area: target.name }))
  return { itemIds, roomId: target.id, textUpdates }
}

/**
 * What a rename has to touch.
 *
 * The room row is one PATCH, but every item still carrying the OLD name in
 * `room_area` is exporting a name that no longer exists. Only the rows that
 * actually match are rewritten -- an item someone typed over by hand keeps
 * what they typed.
 */
export function renamePlan(
  items: { id: number; room_area: string | null; room_id: number | null }[],
  room: Room,
  newName: string,
): { id: number; room_area: string }[] {
  return items
    .filter((i) => i.room_id === room.id && (i.room_area ?? '').trim() === room.name)
    .map((i) => ({ id: i.id, room_area: newName }))
}

/**
 * How to describe the write before it happens.
 *
 * Says the part that surprises people: the Room/Area column changes too, and
 * that is the column the carrier reads.
 */
export function assignSummary(plan: AssignPlan, targetName: string | null): string {
  const n = plan.itemIds.length
  const rows = `${n} ${n === 1 ? 'line' : 'lines'}`
  if (plan.roomId === null) {
    return `Take ${rows} out of their room. The Room/Area text stays as it is.`
  }
  if (plan.textUpdates.length === 0) {
    return `File ${rows} under ${targetName}.`
  }
  return `File ${rows} under ${targetName}, and set Room/Area to “${targetName}” on ${
    plan.textUpdates.length === n ? 'each' : `${plan.textUpdates.length} of them`
  } — that is the column the export prints.`
}

/** Chunk the per-item text writes so a big selection cannot open 300 sockets. */
export const TEXT_CHUNK = 10

export function planTextChunks<T>(rows: T[], size = TEXT_CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size))
  return out
}
