import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { I, Icon } from './Icon'
import { downloadExport, printExport } from '../lib/api'
import { claimAction, deleteClaim, duplicateClaim } from '../lib/mutations'
import { fmtInt } from '../lib/format'
import { CLOSED_STATUSES } from '../lib/types'
import type { ClaimSummary } from '../lib/types'

/** Ported from ClaimRowMenu in design/components/claims-dashboard.jsx. */

type Modal = 'duplicate' | 'export' | 'print' | 'archive' | 'delete' | null

export default function ClaimRowMenu({
  claim,
  onNotice,
}: {
  claim: ClaimSummary
  /** `error` notices stay until dismissed; everything else clears itself. */
  onNotice: (message: string, tone?: 'error') => void
}) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  /**
   * The menu is PORTALLED to the body and positioned in viewport coordinates.
   *
   * It used to be `position: absolute` inside the row, which cannot escape an
   * overflow ancestor -- and `.k-claims-list` is an `overflow: auto` box sized
   * to its rows, so on an account with one or two claims the box is ~107px tall
   * and the menu was clipped to a sliver you had to scroll inside to read. A
   * dropdown that opens off-screen is not a dropdown.
   */
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const MENU_W = 210
  /**
   * Only the FIRST paint's guess. The real height is measured below and the
   * position corrected, because the menu is not a fixed size -- an archived
   * claim offers fewer actions, and a constant would flip a short menu
   * upward for room it never needed.
   */
  const MENU_H_GUESS = 300

  useLayoutEffect(() => {
    if (!open) {
      setAt(null)
      return
    }
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect()
      if (!b) return
      const h = menuRef.current?.offsetHeight || MENU_H_GUESS
      // Right-aligned to the trigger, like the absolute version was.
      const left = Math.max(8, Math.min(b.right - MENU_W, window.innerWidth - MENU_W - 8))
      // Below by default; above when the viewport has no room there -- the
      // last row of a full list is where this menu is most often opened.
      // Either way it is clamped to stay wholly on screen: a menu that opens
      // half off the bottom is the bug this whole change exists to fix.
      const below = window.innerHeight - b.bottom - 6
      const top =
        h <= below || b.top - 6 < h
          ? Math.min(b.bottom + 6, Math.max(8, window.innerHeight - h - 8))
          : b.top - 6 - h
      // Only when it actually moved: this runs on every scroll frame, and a
      // setState per frame would re-render the menu the whole way down a list.
      setAt((prev) => (prev && prev.top === top && prev.left === left ? prev : { top, left }))
    }
    place()
    // Second pass once the menu exists: `place` above used a guess for the
    // height on the very first call, and now it can read the real one.
    const raf = requestAnimationFrame(place)
    // A fixed menu anchored to a scrolled row detaches from it; reposition
    // rather than leaving it floating over unrelated rows.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      // The menu is portalled, so it is NOT inside `ref` -- without this the
      // first click on any menu item would close it before the item fired.
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['claims'] })

  const state = useMutation({
    mutationFn: (action: 'close' | 'reopen' | 'archive' | 'unarchive') =>
      claimAction(claim.claim_id, action),
    onSuccess: (result) => {
      void refresh()
      onNotice(`${claim.name} is now ${result.status.replace('_', ' ')}.`)
    },
    onError: (error) => onNotice(error instanceof Error ? error.message : 'That action failed.', 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteClaim(claim.claim_id),
    // No success notice. The adjuster typed DELETE and confirmed; the row
    // leaving the list is the confirmation, and a banner they then had to
    // dismiss was noise. (It also used to say "photos kept in storage", which
    // was false for a CLAIM delete -- see the confirm copy below.)
    onSuccess: () => void refresh(),
    onError: (error) => onNotice(error instanceof Error ? error.message : 'Delete failed.', 'error'),
  })

  /**
   * Gate on work in flight, not on the label: a closed claim can still have
   * lines pricing, because closed outranks processing in the derived status.
   */
  const busy =
    claim.status === 'processing' || (claim.status_counts?.processing ?? 0) > 0
  const shelved = CLOSED_STATUSES.includes(claim.status)

  const act = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div
      ref={ref}
      style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', position: 'relative' }}
    >
      <button
        type="button"
        className="k-btn k-btn--ghost"
        onClick={() => navigate(`/claims/${claim.claim_id}`)}
      >
        Open →
      </button>
      <button
        ref={btnRef}
        type="button"
        className="k-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-label={`Actions for ${claim.name}`}
      >
        <Icon d={I.more} size={14} />
      </button>

      {open && at
        ? createPortal(
        <div
          ref={menuRef}
          className="k-pop k-rowmenu"
          role="menu"
          style={{ top: at.top, left: at.left }}
        >
          <MenuItem icon={I.expand} label="Open" onClick={() => act(() => navigate(`/claims/${claim.claim_id}`))} />
          <MenuItem icon={I.eye} label="Preview" onClick={() => act(() => navigate(`/claims/${claim.claim_id}`))} />
          <MenuItem icon={I.copy} label="Duplicate" onClick={() => act(() => setModal('duplicate'))} />

          <div className="k-avatar-menu-div" />

          <MenuItem
            icon={I.download}
            label="Export…"
            disabled={busy}
            why="Available when processing finishes"
            onClick={() => act(() => setModal('export'))}
          />
          <MenuItem
            icon={I.printer}
            label="Print"
            disabled={busy}
            why="Available when processing finishes"
            /* Print hits the Proof of Loss endpoint, so it STAMPS the date on a
               claim not yet exported -- it used to do that silently, and put up
               a save dialog rather than a print dialog. Same rule as the
               worksheet's Export: exported goes straight through, otherwise
               ask first. */
            onClick={() =>
              act(() =>
                claim.exported_at
                  ? void printExport(claim.claim_id).catch((error) =>
                      onNotice(error instanceof Error ? error.message : 'Print failed.', 'error'),
                    )
                  : setModal('print'),
              )
            }
          />

          <div className="k-avatar-menu-div" />

          <MenuItem
            icon={I.check}
            label={shelved ? 'Reopen claim' : 'Mark closed'}
            disabled={busy}
            why="Available when processing finishes"
            onClick={() => act(() => state.mutate(shelved ? 'reopen' : 'close'))}
          />
          <MenuItem
            icon={I.box}
            label={claim.archived_at ? 'Unarchive' : 'Archive'}
            disabled={busy}
            why="Available when processing finishes"
            onClick={() =>
              act(() =>
                claim.archived_at ? state.mutate('unarchive') : setModal('archive'),
              )
            }
          />
          {/* Delete stays live mid-processing -- it is not unsafe, but it fails
              in-flight pricing jobs and wastes spent vendor quota. The confirm
              surfaces that rather than gating the action. */}
          <MenuItem
            icon={I.trash}
            label="Delete"
            danger
            onClick={() => act(() => setModal('delete'))}
          />
        </div>,
            document.body,
          )
        : null}

      {modal === 'duplicate' ? (
        <DuplicateModal claim={claim} onClose={() => setModal(null)} onNotice={onNotice} />
      ) : null}
      {modal === 'export' || modal === 'print' ? (
        <ExportModal
          claim={claim}
          intent={modal}
          onClose={() => setModal(null)}
          onNotice={onNotice}
        />
      ) : null}
      {modal === 'archive' || modal === 'delete' ? (
        <ConfirmModal
          claim={claim}
          danger={modal === 'delete'}
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={() => {
            setModal(null)
            if (modal === 'delete') remove.mutate()
            else state.mutate('archive')
          }}
        />
      ) : null}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
  why,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  why?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`k-avatar-menu-item ${danger ? 'k-avatar-menu-item--danger' : ''}`}
      disabled={disabled}
      title={disabled ? why : undefined}
      onClick={onClick}
    >
      <span style={{ display: 'inline-grid', width: 14, color: 'var(--k-fg-4)' }}>
        <Icon d={icon} size={13} />
      </span>
      {label}
    </button>
  )
}

function Shell({
  kicker,
  title,
  danger,
  onClose,
  children,
  footer,
}: {
  kicker: string
  title: string
  danger?: boolean
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="k-export-stage k-modal-stage">
      <div className="k-export-scrim" onClick={onClose} />
      <div className="k-export-modal" style={{ maxWidth: 480 }}>
        <div className="k-export-hd">
          <div>
            <div className="k-modal-kicker" style={danger ? { color: 'var(--k-danger)' } : undefined}>
              {kicker}
            </div>
            <div className="k-modal-title">{title}</div>
          </div>
          <button type="button" className="k-btn k-btn--ghost k-modal-x" onClick={onClose}>
            <span style={{ display: 'inline-flex', transform: 'rotate(45deg)' }}>
              <Icon d={I.plus} size={16} />
            </span>
          </button>
        </div>
        <div className="k-modal-body">{children}</div>
        <div className="k-modal-foot">{footer}</div>
      </div>
    </div>
  )
}

function DuplicateModal({
  claim,
  onClose,
  onNotice,
}: {
  claim: ClaimSummary
  onClose: () => void
  onNotice: (m: string, tone?: 'error') => void
}) {
  const [name, setName] = useState(`${claim.name} (copy)`)
  const queryClient = useQueryClient()
  const trimmed = name.trim()

  const run = useMutation({
    mutationFn: () => duplicateClaim(claim.claim_id, { name: trimmed }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      onNotice(`Copied to ${result.name}.`)
      onClose()
    },
    onError: (error) => onNotice(error instanceof Error ? error.message : 'Duplicate failed.', 'error'),
  })

  return (
    <Shell
      kicker="Duplicate claim"
      title="Make a copy"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="k-btn"
            disabled={!trimmed || run.isPending}
            onClick={() => run.mutate()}
          >
            {run.isPending ? 'Copying…' : 'Duplicate'}
          </button>
        </>
      }
    >
      <label className="k-insp-field">
        <span className="k-modal-label">New claim name</span>
        <input
          className="k-insp-input"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="k-modal-note">
        Copies all <strong>{fmtInt(claim.item_count)} items</strong>, content classes, valuation
        basis and depreciation settings. A fresh claim id is assigned. The original is untouched.
      </div>
    </Shell>
  )
}

/**
 * Export or print, from the claims menu.
 *
 * Both hit the Proof of Loss endpoint, and the FIRST call on a claim stamps
 * `exported_at` permanently. This dialog used to say nothing about that -- only
 * a code comment did -- so the dashboard offered two unguarded ways to date a
 * claim while the worksheet's Export asked first. It now shows the same warning
 * on a claim not yet exported, and says the date is already set on one that is.
 */
function ExportModal({
  claim,
  intent,
  onClose,
  onNotice,
}: {
  claim: ClaimSummary
  intent: 'export' | 'print'
  onClose: () => void
  onNotice: (m: string, tone?: 'error') => void
}) {
  const printing = intent === 'print'
  // Printing is the PDF by definition; there is nothing to choose.
  const [format, setFormat] = useState<'xlsx' | 'pdf'>(printing ? 'pdf' : 'xlsx')
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()
  const firstExport = !claim.exported_at

  const run = async () => {
    setBusy(true)
    try {
      if (printing) await printExport(claim.claim_id)
      else await downloadExport(claim.claim_id, format)
      // Exporting stamps exported_at, so the derived status moves.
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      onClose()
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'Export failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      kicker={printing ? 'Print claim' : 'Export claim'}
      title={claim.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="k-btn" disabled={busy} onClick={() => void run()}>
            {busy ? 'Preparing…' : printing ? 'Print' : 'Download'}
          </button>
        </>
      }
    >
      {printing ? null : (
        <label className="k-insp-field">
          <span className="k-modal-label">Format</span>
          <select
            className="k-insp-input"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}
          >
            <option value="xlsx">XactContents Template - .xlsx</option>
            <option value="pdf">Inventory PDF</option>
          </select>
        </label>
      )}
      {/* Only the FIRST export warns: it is the one that dates the Proof of
          Loss. Once exported there is nothing to decide, so no note -- and no
          file name either: the browser's Save dialog is where it gets named. */}
      {firstExport ? (
        <div className="k-modal-note k-modal-note--danger">
          This is the finished document, not a preview.{' '}
          {printing ? 'Printing' : 'Exporting'} it dates your <strong>Proof of Loss</strong> as
          today, and that date is permanent — it is what a client or carrier reads as the day the
          schedule was produced.
        </div>
      ) : null}
    </Shell>
  )
}

function ConfirmModal({
  claim,
  danger,
  busy,
  onClose,
  onConfirm,
}: {
  claim: ClaimSummary
  danger: boolean
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [typed, setTyped] = useState('')
  const ok = !danger || typed.trim().toUpperCase() === 'DELETE'

  return (
    <Shell
      kicker={danger ? 'Delete claim' : 'Archive claim'}
      title={claim.name}
      danger={danger}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? 'k-btn k-btn--danger' : 'k-btn'}
            disabled={!ok}
            onClick={onConfirm}
          >
            {danger ? 'Delete permanently' : 'Archive'}
          </button>
        </>
      }
    >
      <div className={danger ? 'k-modal-note k-modal-note--danger' : 'k-modal-note'}>
        {danger ? (
          <>
            Permanently deletes this claim, its {fmtInt(claim.item_count)} item
            {claim.item_count === 1 ? '' : 's'}
            {(claim.photo_count ?? 0) > 0
              ? ` and ${fmtInt(claim.photo_count)} photo${claim.photo_count === 1 ? '' : 's'}`
              : ''}
            . This cannot be undone.{' '}
            <strong>To keep everything, archive it instead</strong> — archived claims stay under
            the Archived filter and can be restored.
            {busy ? ' Lines are still pricing; deleting now fails those jobs.' : ''}
          </>
        ) : (
          <>
            Archiving hides this claim from the dashboard. Nothing is deleted — items, photos,
            exports and the audit log all stay, and you can reach it again under the Archived
            filter.
          </>
        )}
      </div>

      {danger ? (
        <label className="k-insp-field">
          <span className="k-modal-label">Type DELETE to confirm</span>
          <input
            className="k-insp-input k-mono"
            value={typed}
            autoFocus
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
          />
        </label>
      ) : null}
    </Shell>
  )
}
