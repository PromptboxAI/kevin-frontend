import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { I, Icon } from './Icon'
import { downloadExport } from '../lib/api'
import { claimAction, deleteClaim, duplicateClaim } from '../lib/mutations'
import { fmtInt } from '../lib/format'
import type { ClaimSummary } from '../lib/types'

/** Ported from ClaimRowMenu in design/components/claims-dashboard.jsx. */
const CLOSED_STATUSES = ['closed', 'archived']

type Modal = 'duplicate' | 'export' | 'archive' | 'delete' | null

export default function ClaimRowMenu({
  claim,
  onNotice,
}: {
  claim: ClaimSummary
  onNotice: (message: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['claims'] })

  const state = useMutation({
    mutationFn: (action: 'close' | 'reopen' | 'archive' | 'unarchive') =>
      claimAction(claim.claim_id, action),
    onSuccess: (result) => {
      void refresh()
      onNotice(`${claim.name} is now ${result.status.replace('_', ' ')}.`)
    },
    onError: (error) => onNotice(error instanceof Error ? error.message : 'That action failed.'),
  })

  const remove = useMutation({
    mutationFn: () => deleteClaim(claim.claim_id),
    onSuccess: (result) => {
      void refresh()
      // Photos are never destroyed by a claim delete -- say so.
      onNotice(
        `Deleted ${claim.name} · ${fmtInt(result.deleted_items)} items removed · photos kept in storage.`,
      )
    },
    onError: (error) => onNotice(error instanceof Error ? error.message : 'Delete failed.'),
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
        type="button"
        className="k-icon-btn"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-label={`Actions for ${claim.name}`}
      >
        <Icon d={I.more} size={14} />
      </button>

      {open ? (
        <div className="k-pop k-rowmenu" role="menu">
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
            onClick={() => act(() => void downloadExport(claim.claim_id, 'pdf'))}
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
        </div>
      ) : null}

      {modal === 'duplicate' ? (
        <DuplicateModal claim={claim} onClose={() => setModal(null)} onNotice={onNotice} />
      ) : null}
      {modal === 'export' ? (
        <ExportModal claim={claim} onClose={() => setModal(null)} onNotice={onNotice} />
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
  onNotice: (m: string) => void
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
    onError: (error) => onNotice(error instanceof Error ? error.message : 'Duplicate failed.'),
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

function ExportModal({
  claim,
  onClose,
  onNotice,
}: {
  claim: ClaimSummary
  onClose: () => void
  onNotice: (m: string) => void
}) {
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx')
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const run = async () => {
    setBusy(true)
    try {
      await downloadExport(claim.claim_id, format)
      // Exporting stamps exported_at, so the derived status moves.
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      onClose()
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      kicker="Export claim"
      title={claim.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="k-btn" disabled={busy} onClick={() => void run()}>
            {busy ? 'Preparing…' : 'Download'}
          </button>
        </>
      }
    >
      <label className="k-insp-field">
        <span className="k-modal-label">Format</span>
        <select
          className="k-insp-input"
          value={format}
          onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}
        >
          <option value="xlsx">Xactimate (Excel) · .xlsx · XactContents template</option>
          <option value="pdf">Inventory PDF</option>
        </select>
      </label>
      <div className="k-modal-note">
        Saves as <span className="k-mono">{claim.claim_id}-inventory.{format}</span>. Every cell is
        a static value — the file is a snapshot of the claim record.
      </div>
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
            Permanently deletes this claim and all {fmtInt(claim.item_count)} of its items.{' '}
            <strong>Photos are kept</strong> — they stay in storage, detached. This cannot be
            undone.
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
