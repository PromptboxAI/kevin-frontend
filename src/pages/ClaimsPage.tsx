import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import NewClaimButton from '../components/NewClaimButton'
import ClaimRowMenu from '../components/ClaimRowMenu'
import ClaimStatusChip from '../components/ClaimStatusChip'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
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
 * Resizable like the worksheet: drag a header's right edge, double-click it to
 * reset. Project is the flexible track -- `minmax(width, 1fr)` -- so the grid
 * still fills the list when every other column is narrow. The last column (the
 * row menu) has no header and no handle.
 */
const COLUMNS: { label: string; width: number; align?: 'right' }[] = [
  { label: 'Project', width: 220 },
  { label: 'Claim number', width: 140 },
  { label: 'Insured', width: 150 },
  { label: 'Carrier', width: 130 },
  { label: 'Items / photos', width: 100, align: 'right' },
  { label: 'Status', width: 130 },
  { label: 'Total', width: 130, align: 'right' },
  { label: '', width: 100 },
]
const COL_DEFAULTS = COLUMNS.map((c) => c.width)
const COL_MIN = 60
/** Per-browser convenience only; a missing or unreadable value means defaults. */
const COLS_KEY = 'kevin.claims.cols.v1'

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
    // From the RENDERED width, not the stored one: Project is a flexible
    // track, drawn wider than its stored minimum, so starting from the stored
    // value made the column jump narrower on the first pixel of a drag.
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
    ['--claim-cols' as string]: cols
      .map((c, i) => (i === 0 ? `minmax(${c}px, 1fr)` : `${c}px`))
      .join(' '),
    // Tracks + 7 gaps of 14px + 36px of row padding: widening a column past
    // the list overflows it horizontally rather than squeezing Project.
    ['--claim-roww' as string]: `${cols.reduce((a, b) => a + b, 0) + 7 * 14 + 36}px`,
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
          if (c.status === 'in_review') acc.review += 1
          if (c.status === 'processing') acc.processing += 1
          return acc
        },
        { items: 0, rcv: 0, review: 0, processing: 0 },
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
              <strong>{fmtInt(kpis.review)}</strong> claims awaiting your review ·{' '}
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

        {notice ? (
          <div className="k-ws-bar">
            <span>{notice.text}</span>
            <button type="button" className="k-link" onClick={() => setNoticeState(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        {isPending ? <p className="k-note">Loading claims…</p> : null}

        {error ? (
          <p className="k-error">
            Couldn&rsquo;t load claims
            {error instanceof ApiError ? ` (HTTP ${error.status})` : ''}.
          </p>
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
              <Row key={claim.claim_id} claim={claim} onNotice={setNotice} />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function Row({
  claim,
  onNotice,
}: {
  claim: ClaimSummary
  onNotice: (m: string, tone?: 'error') => void
}) {
  return (
    <div className="k-claim-row">
      {/* The saved name the adjuster typed at intake. The slug stays out of
          sight -- it is identity for URLs, not something anyone reads. */}
      <Link
        className="k-claim-name k-claim-cell k-link"
        to={`/claims/${claim.claim_id}`}
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
