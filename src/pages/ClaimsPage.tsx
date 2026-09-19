import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import AppHeader from '../components/AppHeader'
import NewClaimButton from '../components/NewClaimButton'
import ClaimRowMenu, { DeleteClaimModal } from '../components/ClaimRowMenu'
import ClaimStatusChip from '../components/ClaimStatusChip'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { claimAction, deleteClaim } from '../lib/mutations'
import { useDeferred } from '../lib/deferred'
import { rosterSummary } from '../lib/deferred-rules'
import { fmtInt, fmtSince, fmtUSD, greetingFor } from '../lib/format'
import { useAuth } from '../lib/auth'
import { CLOSED_STATUSES } from '../lib/types'
import type { ClaimListResponse, ClaimSummary } from '../lib/types'

/**
 * The filter chips match the status chips (ClaimStatusChip): Processing, In
 * progress, Closed, Archived. The design's set also had In review and Open,
 * which only made sense while the rows showed those statuses.
 *
 * Only `archived` is excluded from GET /v1/claims by default, so it needs an
 * explicit request.
 */

type Chip = 'All' | 'Processing' | 'In progress' | 'Closed' | 'Archived'

const CHIPS: Chip[] = ['All', 'Processing', 'In progress', 'Closed', 'Archived']

/** Which chips the API can filter server-side; In progress is shaped locally. */
const SERVER_STATUS: Partial<Record<Chip, string>> = {
  Processing: 'processing',
  Closed: 'closed',
  Archived: 'archived',
}

/** What ClaimStatusChip labels "In progress": open, and not still building. */
const IN_PROGRESS = new Set(['draft', 'in_review', 'exported'])

/**
 * Roster columns, in Xactimate's project-list order, with default widths in px.
 * Resizable like the worksheet: drag the divider on a header's RIGHT edge,
 * double-click it to reset.
 *
 * Every labelled column is an exact px width, so a drag moves exactly the
 * column it belongs to. The row menu (last, unlabelled) is the only flexible
 * track, `minmax(width, 1fr)`, and right-aligns its buttons, so spare width
 * collects there. It used to be Project that flexed: on a wide window it
 * absorbed all the slack, so dragging its divider changed nothing on screen.
 */
const COLUMNS: { label: string; width: number; align?: 'right' }[] = [
  { label: 'Project', width: 280 },
  { label: 'Claim number', width: 150 },
  { label: 'Insured', width: 160 },
  { label: 'Carrier', width: 140 },
  { label: 'Items / photos', width: 110, align: 'right' },
  { label: 'Status', width: 130 },
  { label: 'Total', width: 130, align: 'right' },
  { label: '', width: 100 },
]
const COL_DEFAULTS = COLUMNS.map((c) => c.width)
const FLEX_COL = COLUMNS.length - 1
const COL_MIN = 60
/**
 * Per-browser convenience only; a missing or unreadable value means defaults.
 * v2: v1 widths were saved when Project flexed, so they meant something else.
 */
const COLS_KEY = 'kevin.claims.cols.v2'

function loadCols(): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem(COLS_KEY) ?? 'null') as unknown
    if (
      Array.isArray(saved) &&
      saved.length === COL_DEFAULTS.length &&
      saved.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= COL_MIN)
    ) {
      return saved as number[]
    }
  } catch {
    // Storage blocked (private window, site data off): defaults.
  }
  return COL_DEFAULTS
}

function saveCols(cols: number[]) {
  try {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols))
  } catch {
    // Not worth surfacing: the widths still apply for this visit.
  }
}

export default function ClaimsPage() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<Chip>('All')
  /**
   * Success notices clear themselves; errors stay until dismissed.
   *
   * Every notice here used to wait for a click on "Dismiss", so confirming a
   * delete left a banner the adjuster then had to clear -- after they had
   * already typed DELETE and confirmed. An error is different: one that
   * vanished before it was read is worse than one you had to close.
   */
  const [notice, setNoticeState] = useState<{ text: string; error: boolean } | null>(null)
  const setNotice = (text: string, tone?: 'error') =>
    setNoticeState({ text, error: tone === 'error' })
  useEffect(() => {
    if (!notice || notice.error) return
    const t = window.setTimeout(() => setNoticeState(null), 5000)
    return () => window.clearTimeout(t)
  }, [notice])

  const [cols, setCols] = useState<number[]>(loadCols)
  const drag = useRef<{ index: number; startX: number; startW: number } | null>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return
      const { index, startX, startW } = drag.current
      const next = Math.max(COL_MIN, Math.round(startW + (e.clientX - startX)))
      setCols((prev) => prev.map((c, i) => (i === index ? next : c)))
    }
    const up = () => {
      if (!drag.current) return
      drag.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setCols((prev) => {
        saveCols(prev)
        return prev
      })
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
  }, [])

  const startResize = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    // From the RENDERED width, not the stored one, so a column never jumps on
    // the first pixel of a drag if what is drawn differs from what is stored.
    const cell = e.currentTarget.parentElement
    const startW = cell ? Math.round(cell.getBoundingClientRect().width) : cols[index]
    drag.current = { index, startX: e.clientX, startW }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }
  const resetCol = (index: number) =>
    setCols((prev) => {
      const next = prev.map((c, i) => (i === index ? COL_DEFAULTS[index] : c))
      saveCols(next)
      return next
    })

  const listStyle = {
    // A fixed 16px checkbox track leads; the resizable columns follow it.
    ['--claim-cols' as string]: [
      '16px',
      ...cols.map((c, i) => (i === FLEX_COL ? `minmax(${c}px, 1fr)` : `${c}px`)),
    ].join(' '),
    // Tracks + 8 gaps of 14px + 36px of row padding: widening a column past
    // the list overflows it horizontally rather than squeezing Project.
    ['--claim-roww' as string]: `${cols.reduce((a, b) => a + b, 0) + 16 + 8 * 14 + 36}px`,
  } as React.CSSProperties

  const status = SERVER_STATUS[chip]

  const { data, error, isPending } = useQuery({
    queryKey: ['claims', status ?? 'default'],
    queryFn: () =>
      api.get<ClaimListResponse>(`/v1/claims?limit=100${status ? `&status=${status}` : ''}`),
  })

  const all = useMemo(() => data?.claims ?? [], [data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return all
      // "In progress" is not an API value; it is three of them.
      .filter((c) => (chip === 'In progress' ? IN_PROGRESS.has(c.status) : true))
      .filter((c) =>
        !term
          ? true
          : [c.name, c.claim_id, c.insured_name, c.carrier, c.claim_number]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(term)),
      )
  }, [all, chip, search])

  /**
   * Multi-select, for clearing out several claims at once. Actions apply to
   * the selected rows that are SHOWN: a selection hidden by a filter or a
   * search is never deleted out of sight.
   */
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  const chosen = useMemo(() => visible.filter((c) => picked.has(c.claim_id)), [visible, picked])
  const allPicked = visible.length > 0 && chosen.length === visible.length
  const somePicked = chosen.length > 0 && !allPicked
  const togglePick = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAllPicked = () =>
    setPicked(allPicked ? new Set() : new Set(visible.map((c) => c.claim_id)))
  const [bulkDelete, setBulkDelete] = useState(false)
  const queryClient = useQueryClient()

  /**
   * One request per claim (there is no bulk route), in sequence so a failure
   * stops cleanly and says how far it got. Whatever succeeded stays done.
   */
  const bulk = useMutation({
    mutationFn: async ({ action, ids }: { action: 'delete' | 'archive'; ids: string[] }) => {
      let done = 0
      for (const id of ids) {
        try {
          if (action === 'delete') await deleteClaim(id)
          else await claimAction(id, 'archive')
          done += 1
        } catch (err) {
          throw Object.assign(err instanceof Error ? err : new Error('Request failed'), { done })
        }
      }
      return { action, done }
    },
    onSuccess: ({ action, done }) => {
      setPicked(new Set())
      setNotice(
        `${action === 'delete' ? 'Deleted' : 'Archived'} ${fmtInt(done)} ${done === 1 ? 'claim' : 'claims'}.`,
      )
    },
    onError: (err, { action, ids }) => {
      const done = (err as { done?: number }).done ?? 0
      setNotice(
        `${action === 'delete' ? 'Deleted' : 'Archived'} ${fmtInt(done)} of ${fmtInt(ids.length)}, then one failed${
          err instanceof ApiError ? ` (HTTP ${err.status})` : ''
        }. Try again for the rest.`,
        'error',
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
    },
  })

  /**
   * KPIs are scoped to OPEN claims -- live exposure, not lifetime totals.
   * Folding settled and archived work in makes the number read as workload
   * that is still on the adjuster's desk.
   */
  const open = useMemo(() => all.filter((c) => !CLOSED_STATUSES.includes(c.status)), [all])
  const kpis = useMemo(
    () =>
      open.reduce(
        (acc, c) => {
          acc.items += c.item_count ?? 0
          acc.rcv += c.total_rcv ?? 0
          // The status chip's two open labels, counted the same way.
          if (IN_PROGRESS.has(c.status)) acc.inProgress += 1
          if (c.status === 'processing') acc.processing += 1
          return acc
        },
        { items: 0, rcv: 0, inProgress: 0, processing: 0 },
      ),
    [open],
  )

  /**
   * The design's header is a greeting, not a page title. Time of day comes
   * from the client clock, the name from the session user, and last sign-in
   * from Supabase's own `last_sign_in_at` -- no backend field needed.
   */
  const user = session?.user
  const fullName = (user?.user_metadata?.full_name ?? user?.user_metadata?.name) as
    | string
    | undefined
  const firstName = (fullName?.trim().split(/\s+/)[0] ?? user?.email?.split('@')[0] ?? '')
    .replace(/^./, (c) => c.toUpperCase())
  const now = Date.now()
  const lastSignIn = fmtSince(user?.last_sign_in_at, now)

  /**
   * Lines stranded by a pause, across every claim (GET /v1/deferred).
   *
   * This list is where an adjuster decides what to open, and a claim whose
   * lines deferred looks finished from here -- the row count is right, the
   * total just quietly isn't. The server orders the claims most-stuck-first,
   * so the one worth opening is named. Nothing renders on the healthy answer
   * (`total: 0`) or on a failed read.
   */
  const stranded = rosterSummary(useDeferred().data)

  return (
    <div className="k-shell">
      <AppHeader actions={<NewClaimButton />} />

      <div className="k-claims-body">
        <div className="k-claims-head">
          <div>
            <h1 className="k-claims-h1">
              {greetingFor(new Date(now).getHours())}
              {firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="k-claims-sub">
              {/* Same words as the status chips: "In review" is no longer a
                  status anyone sees, so "awaiting your review" counted a
                  state the page never names. */}
              <strong>{fmtInt(kpis.inProgress)}</strong> in progress ·{' '}
              {fmtInt(kpis.processing)} processing now
              {lastSignIn ? ` · Last sign-in ${lastSignIn}` : ''}
            </p>
          </div>

          <div className="k-claims-stats">
            <div>
              <div className="k-tot-l">Open claims</div>
              <div className="k-tot-v">{fmtInt(open.length)}</div>
            </div>
            <div>
              <div className="k-tot-l">Items · open claims</div>
              <div className="k-tot-v">{fmtInt(kpis.items)}</div>
            </div>
            <div>
              <div className="k-tot-l">Total · open claims</div>
              <div className="k-tot-v">{fmtUSD(kpis.rcv)}</div>
            </div>
          </div>
        </div>

        <section className="k-claims-toolbar">
          <div className="k-search" style={{ minWidth: 280 }}>
            <Icon d={I.search} size={12} />
            <input
              placeholder="Filter claims · project, claim #, insured, carrier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="k-segwrap">
            {CHIPS.map((option) => (
              <button
                key={option}
                type="button"
                className={`k-seg ${option === chip ? 'k-seg--on' : ''}`}
                onClick={() => setChip(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="k-btn k-btn--ghost"
            title="Newest first — the order GET /v1/claims returns"
          >
            <Icon d={I.filter} size={12} /> Sort: Most recent
          </button>
        </section>

        {stranded ? (
          <Alert
            tone={stranded.total > 0 ? 'wait' : 'info'}
            title={stranded.total > 0 ? 'Lines waiting on a retry' : 'Lines waiting on a description'}
            action={
              <Link
                className="k-btn k-btn--sm"
                to={`/claims/${encodeURIComponent(stranded.lead.claim_id)}`}
                title="The retry lives on the claim, where the estimate is shown before anything is spent"
              >
                Open claim
              </Link>
            }
          >
            {stranded.text}
          </Alert>
        ) : null}

        {chosen.length > 0 ? (
          <div className="k-ws-bar k-ws-bar--sel k-claims-selbar">
            <span>
              <strong>{fmtInt(chosen.length)}</strong> selected
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="k-link" onClick={() => setPicked(new Set())}>
                Clear
              </button>
              {chosen.some((c) => c.status !== 'archived') ? (
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--ghost"
                  disabled={bulk.isPending}
                  onClick={() =>
                    bulk.mutate({
                      action: 'archive',
                      ids: chosen.filter((c) => c.status !== 'archived').map((c) => c.claim_id),
                    })
                  }
                >
                  Archive
                </button>
              ) : null}
              <button
                type="button"
                className="k-btn k-btn--sm k-btn--delete"
                disabled={bulk.isPending}
                onClick={() => setBulkDelete(true)}
              >
                <Icon d={I.trash} size={12} /> {bulk.isPending ? 'Working…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : null}

        {bulkDelete ? (
          <DeleteClaimModal
            claims={chosen}
            busy={chosen.some((c) => c.status === 'processing')}
            onClose={() => setBulkDelete(false)}
            onArchive={() => {
              setBulkDelete(false)
              bulk.mutate({
                action: 'archive',
                ids: chosen.filter((c) => c.status !== 'archived').map((c) => c.claim_id),
              })
            }}
            onConfirm={() => {
              setBulkDelete(false)
              bulk.mutate({ action: 'delete', ids: chosen.map((c) => c.claim_id) })
            }}
          />
        ) : null}

        {notice ? (
          <Alert
            tone={notice.error ? 'error' : 'success'}
            title={notice.error ? 'That didn’t go through' : undefined}
            onDismiss={() => setNoticeState(null)}
          >
            {notice.text}
          </Alert>
        ) : null}

        {isPending ? <p className="k-note">Loading claims…</p> : null}

        {error ? (
          <Alert tone="error" title="Couldn’t load claims">
            The list didn’t come back
            {error instanceof ApiError ? ` (HTTP ${error.status})` : ''}. Reload the page to try again.
          </Alert>
        ) : null}

        {data && visible.length === 0 ? (
          <div className="k-empty">
            <h2>{all.length === 0 ? 'No claims yet' : 'No claims match'}</h2>
            <p>
              {all.length === 0
                ? 'A claim is the named parent of every item. Dropping a folder of photos creates one automatically.'
                : 'Try a different search term or filter.'}
            </p>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <section className="k-claims-list" style={listStyle}>
            {/* Column order follows Xactimate's project list -- Project, Claim
                number, Insured, then Status before Total -- because that is
                the list these adjusters already scan all day. "Total" is the
                tax-inclusive RCV; the worksheet still calls it RCV + Tax. */}
            <div className="k-claim-row k-claim-row--head">
              <div>
                <button
                  type="button"
                  className={`k-check${allPicked ? ' k-check--on' : ''}${somePicked ? ' k-check--some' : ''}`}
                  onClick={toggleAllPicked}
                  aria-label={allPicked ? 'Clear selection' : 'Select all shown claims'}
                  aria-pressed={allPicked}
                >
                  {allPicked ? <Icon d={I.check} size={10} stroke={2} /> : null}
                </button>
              </div>
              {COLUMNS.map((col, i) =>
                col.label ? (
                  <div key={col.label} style={col.align ? { textAlign: col.align } : undefined}>
                    {col.label}
                    <span
                      className="k-col-resize"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${col.label} column`}
                      onMouseDown={(e) => startResize(i, e)}
                      onDoubleClick={() => resetCol(i)}
                      title="Drag to resize · double-click to reset"
                    />
                  </div>
                ) : (
                  <div key="menu" />
                ),
              )}
            </div>

            {visible.map((claim) => (
              <Row
                key={claim.claim_id}
                claim={claim}
                onNotice={setNotice}
                picked={picked.has(claim.claim_id)}
                onPick={() => togglePick(claim.claim_id)}
              />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Photos uploaded and nothing processed: the claim's work is in Group &
 * stage, so that is where opening it goes. (The worksheet also redirects, for
 * links that arrive another way.)
 */
function claimHref(claim: ClaimSummary): string {
  const id = encodeURIComponent(claim.claim_id)
  return claim.item_count === 0 && (claim.photo_count ?? 0) > 0 ? `/claims/${id}/staging` : `/claims/${id}`
}

function Row({
  claim,
  onNotice,
  picked,
  onPick,
}: {
  claim: ClaimSummary
  onNotice: (m: string, tone?: 'error') => void
  picked: boolean
  onPick: () => void
}) {
  return (
    <div className={`k-claim-row${picked ? ' k-claim-row--picked' : ''}`}>
      <div>
        <button
          type="button"
          className={`k-check${picked ? ' k-check--on' : ''}`}
          onClick={onPick}
          aria-label={`Select ${claim.name || claim.claim_id}`}
          aria-pressed={picked}
        >
          {picked ? <Icon d={I.check} size={10} stroke={2} /> : null}
        </button>
      </div>
      {/* The saved name the adjuster typed at intake. The slug stays out of
          sight -- it is identity for URLs, not something anyone reads. */}
      <Link
        className="k-claim-name k-claim-cell k-link"
        to={claimHref(claim)}
        title={claim.name}
      >
        {claim.name || claim.claim_id}
      </Link>

      <div className="k-claim-number k-claim-cell" title={claim.claim_number ?? undefined}>
        {claim.claim_number || '—'}
      </div>

      <div className="k-claim-insured k-claim-cell" title={claim.insured_name ?? undefined}>
        {claim.insured_name || '—'}
      </div>

      <div className="k-claim-carrier k-claim-cell">{claim.carrier || '—'}</div>

      <div className="k-claim-num">
        <div>{fmtInt(claim.item_count)}</div>
        <div className="k-claim-photos">{fmtInt(claim.photo_count)} photos</div>
      </div>

      {/* Status only -- no "Exported" badge beside it. Downloading a file is
          not a state of the claim. Unpriced counts belong on the claim. */}
      <div className="k-claim-status">
        <ClaimStatusChip status={claim.status} />
      </div>

      {/* "Total": the tax-inclusive server RCV, rendered verbatim. */}
      <div className="k-claim-rcv">{fmtUSD(claim.total_rcv)}</div>

      <ClaimRowMenu claim={claim} onNotice={onNotice} />
    </div>
  )
}
