import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { I, Icon } from './Icon'
import { ApiError } from '../lib/api'
import { fmtUSDshort } from '../lib/format'
import { createRoom, deleteRoom, listRooms, renameRoom } from '../lib/rooms'
import {
  ROOM_NAME_ERROR,
  checkRoomName,
  roomBuckets,
} from '../lib/room-rules'
import type { Room } from '../lib/room-rules'

/**
 * Rooms: filter the grid by one, and manage the set.
 *
 * There is no design screen for this -- the prototype has a free-text Room/Area
 * column and nothing else -- so the anatomy is lifted from the Filter popover
 * beside it rather than invented: same `.k-pop`, same `.k-pop-hd`, same
 * `.k-menu-item` rows.
 *
 * Assignment is NOT here. It belongs on the selection bar, because filing lines
 * is something you do to rows you have picked, and putting it in a popover
 * that also deletes rooms invites deleting one while meaning to file into it.
 */
export default function RoomsPopover({
  claimId,
  items,
  roomFilter,
  onFilter,
  onNotice,
}: {
  claimId: string
  items: { room_id: number | null }[]
  roomFilter: number | null | 'none'
  onFilter: (next: number | null | 'none') => void
  onNotice: (message: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState('')
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const rooms = useQuery({
    queryKey: ['rooms', claimId],
    queryFn: () => listRooms(claimId),
    enabled: !!claimId,
  })

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['rooms', claimId] })
    void queryClient.invalidateQueries({ queryKey: ['claim-items'] })
  }

  const fail = (verb: string) => (error: unknown) =>
    onNotice(
      error instanceof ApiError && error.status === 409
        ? ROOM_NAME_ERROR.duplicate
        : error instanceof Error
          ? error.message
          : `Could not ${verb} that room.`,
    )

  const create = useMutation({
    mutationFn: (name: string) => createRoom(claimId, name),
    onSuccess: (room) => {
      setAdding('')
      onNotice(`Added ${room.name}.`)
      refresh()
    },
    onError: fail('add'),
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameRoom(id, name),
    onSuccess: () => {
      setEditing(null)
      refresh()
    },
    onError: fail('rename'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteRoom(id),
    onSuccess: (_r, id) => {
      setConfirmDel(null)
      if (roomFilter === id) onFilter(null)
      // Rule 15's shape: say what survived, so "delete" is not read as
      // destruction. The API keeps the items; it drops the bucket.
      onNotice('Room removed. Its lines moved to Unassigned and kept their Room/Area text.')
      refresh()
    },
    onError: fail('remove'),
  })

  const list = rooms.data?.rooms ?? []
  const buckets = roomBuckets(list, items)
  const active =
    roomFilter === 'none'
      ? 'Unassigned'
      : roomFilter != null
        ? (list.find((r) => r.id === roomFilter)?.name ?? null)
        : null

  const submitNew = () => {
    const check = checkRoomName(adding, list)
    if (!check.ok) {
      onNotice(ROOM_NAME_ERROR[check.reason])
      return
    }
    create.mutate(check.name)
  }

  const submitRename = (room: Room) => {
    if (!editing) return
    const check = checkRoomName(editing.name, list, room.id)
    if (!check.ok) {
      onNotice(ROOM_NAME_ERROR[check.reason])
      return
    }
    if (check.name === room.name) {
      setEditing(null)
      return
    }
    rename.mutate({ id: room.id, name: check.name })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`k-btn k-btn--ghost ${active ? 'k-btn--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Filter by room, and manage the claim's rooms"
      >
        <Icon d={I.box} size={12} /> {active ?? 'Rooms'}
      </button>

      {open ? (
        <div
          className="k-pop"
          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 280, zIndex: 30 }}
        >
          <div className="k-pop-hd">
            <span>Rooms</span>
            {active ? (
              <button
                type="button"
                className="k-link"
                style={{ fontSize: 11 }}
                onClick={() => {
                  onFilter(null)
                  setOpen(false)
                }}
              >
                Show all
              </button>
            ) : null}
          </div>

          <div style={{ padding: 6, maxHeight: 300, overflowY: 'auto' }}>
            {/* The moment this helps is when the claim has NO ROOMS -- which
                is not the same as no buckets, since Unassigned is always there
                on a real claim and would suppress it. */}
            {list.length === 0 ? (
              <p style={{ fontSize: 11.5, color: 'var(--k-fg-4)', padding: '6px 8px', margin: 0, lineHeight: 1.5 }}>
                No rooms yet. Items land unfiled from processing — add a room
                below, then pick rows and file them from the selection bar.
              </p>
            ) : null}

            {buckets.map((b) => {
              const room = b.id == null ? null : list.find((r) => r.id === b.id)
              const key = b.id == null ? 'none' : (b.id as number)
              const isActive = b.id == null ? roomFilter === 'none' : roomFilter === b.id

              if (room && editing?.id === room.id) {
                return (
                  <div key={key} style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
                    <input
                      className="k-insp-input"
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing({ id: room.id, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(room)
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      onBlur={() => submitRename(room)}
                    />
                  </div>
                )
              }

              if (room && confirmDel === room.id) {
                return (
                  <div key={key} style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', lineHeight: 1.45 }}>
                      Remove {room.name}? Its {room.item_count}{' '}
                      {room.item_count === 1 ? 'line stays' : 'lines stay'} on the claim.
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        type="button"
                        className="k-btn k-btn--sm k-btn--ghost"
                        onClick={() => setConfirmDel(null)}
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        className="k-btn k-btn--sm k-btn--danger"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(room.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    className={`k-menu-item ${isActive ? 'k-menu-item--on' : ''}`}
                    style={{ flex: 1, minWidth: 0 }}
                    onClick={() => {
                      onFilter(isActive ? null : b.id == null ? 'none' : b.id)
                      setOpen(false)
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                      }}
                    >
                      {b.name}
                    </span>
                    <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                      {b.itemCount}
                      {b.totalRcv ? ` · ${fmtUSDshort(b.totalRcv)}` : ''}
                    </span>
                  </button>

                  {room ? (
                    <>
                      <button
                        type="button"
                        className="k-icon-btn"
                        title={`Rename ${room.name}`}
                        onClick={() => setEditing({ id: room.id, name: room.name })}
                      >
                        <Icon d={I.edit} size={11} />
                      </button>
                      <button
                        type="button"
                        className="k-icon-btn"
                        title={`Remove ${room.name} — its lines stay on the claim`}
                        onClick={() => setConfirmDel(room.id)}
                      >
                        <Icon d={I.trash} size={11} />
                      </button>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--k-line)', padding: 8, display: 'flex', gap: 6 }}>
            <input
              className="k-insp-input"
              placeholder="New room…"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew()
              }}
            />
            <button
              type="button"
              className="k-btn k-btn--sm"
              disabled={!adding.trim() || create.isPending}
              onClick={submitNew}
            >
              Add
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
