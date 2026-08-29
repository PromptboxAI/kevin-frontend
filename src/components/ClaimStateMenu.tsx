import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { I, Icon } from './Icon'
import { ApiError } from '../lib/api'
import { claimAction } from '../lib/mutations'
import { CLOSED_STATUSES } from '../lib/types'
import type { ClaimSummary } from '../lib/types'

/**
 * Finish a claim from inside it.
 *
 * The same four verbs the dashboard row menu offers, on the worksheet header,
 * because the moment an adjuster decides a claim is done is the moment they are
 * looking AT it -- not the moment they happen to be back on the list.
 *
 * Deliberately NOT duplicating delete or duplicate here. Those are list
 * operations: you delete a claim you are not in, and duplicating one you are
 * editing invites confusion about which copy you are now looking at.
 */
export default function ClaimStateMenu({
  claim,
  onNotice,
}: {
  claim: ClaimSummary
  onNotice: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const act = useMutation({
    mutationFn: (action: 'close' | 'reopen' | 'archive' | 'unarchive') =>
      claimAction(claim.claim_id, action),
    onSuccess: (result, action) => {
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['claim', claim.claim_id] })
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      onNotice(
        {
          close: 'Claim marked closed. It stays on your dashboard.',
          reopen: 'Claim re-opened.',
          // Rule 15: archive keeps everything and is reversible. Say so, or it
          // reads like the destructive option next to it.
          archive: 'Archived. Everything is kept — find it under the Archived filter.',
          unarchive: 'Back on your dashboard.',
        }[action] + ` Status: ${result.status}.`,
      )
    },
    onError: (error) =>
      onNotice(
        error instanceof ApiError
          ? `That action failed — HTTP ${error.status}: ${error.message422}`
          : 'That action failed.',
      ),
  })

  /**
   * Gate on work in flight, not on the label -- the same rule the row menu
   * uses. A closed claim can still have lines pricing, because `closed`
   * outranks `processing` in the derived status.
   */
  const busy =
    act.isPending || claim.status === 'processing' || (claim.status_counts?.processing ?? 0) > 0
  const shelved = CLOSED_STATUSES.includes(claim.status)
  const archived = claim.archived_at !== null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="k-btn k-btn--ghost"
        aria-label="Claim actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={busy ? 'Lines are still pricing' : 'Close or archive this claim'}
      >
        <Icon d={I.more} size={14} />
      </button>

      {open ? (
        <div className="k-avatar-menu" style={{ right: 0, top: 'calc(100% + 6px)', minWidth: 220 }}>
          <button
            type="button"
            className="k-avatar-menu-item"
            disabled={busy}
            title={busy ? 'Wait for pricing to finish' : undefined}
            onClick={() => act.mutate(shelved ? 'reopen' : 'close')}
          >
            <Icon d={I.check} size={13} />
            {shelved ? 'Re-open claim' : 'Mark closed'}
          </button>

          <button
            type="button"
            className="k-avatar-menu-item"
            disabled={busy}
            title={
              archived
                ? 'Put it back on the dashboard'
                : 'Takes it off the dashboard. Nothing is deleted.'
            }
            onClick={() => act.mutate(archived ? 'unarchive' : 'archive')}
          >
            <Icon d={I.box} size={13} />
            {archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
