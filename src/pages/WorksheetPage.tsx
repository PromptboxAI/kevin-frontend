import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimStatusChip from '../components/ClaimStatusChip'
import ClaimTabs from '../components/ClaimTabs'
import CompsPopover from '../components/CompsPopover'
import EditableCell from '../components/EditableCell'
import ItemDrawer from '../components/ItemDrawer'
import { I, Icon } from '../components/Icon'
import { ApiError, api, downloadExport } from '../lib/api'
import { extCost, fmtDate, fmtInt, fmtPct, fmtUSD } from '../lib/format'
import { createBlankItem, deleteItems, editDisplayLine, overrideItem } from '../lib/mutations'
import type { OverrideBody } from '../lib/mutations'
import { CAPACITY_REASONS } from '../lib/types'
import type { ClaimItem, ClaimItemListResponse, ClaimSummary } from '../lib/types'

const PAGE_SIZE = 100

/** Server-side filter -- the API takes ?status=, so this is not a client sieve. */
const STATUS_FILTERS: [string, string][] = [
  ['', 'All rows'],
  ['needs_manual', 'Unpriced'],
  ['completed', 'Completed'],
  ['overridden', 'Overridden'],
  ['processing', 'Processing'],
  ['failed', 'Failed'],
]

/** Column order and labels, mirroring HEADERS in worksheet.jsx exactly. */
const HEADERS: [string, string][] = [
  ['k-c--check', ''],
  ['k-c--idx', '#'],
  ['k-c--room', 'Room / Area'],
  ['k-c--qty', 'Qty'],
  ['k-c--desc', 'Description'],
  ['k-c--mfr', 'Make / Mfr'],
  ['k-c--model', 'Model #'],
  ['k-c--cat', 'Content class'],
  ['k-c--rcv', 'Unit Cost'],
  ['k-c--ext', 'Ext. Cost'],
  ['k-c--tax', 'Sales Tax'],
  ['k-c--rcvtax', 'RCV + Tax'],
  ['k-c--age', 'Age'],
  ['k-c--dep', '% Depr.'],
  ['k-c--depamt', '$ Depr.'],
  ['k-c--acv', 'ACV'],
  ['k-c--src', 'Link'],
]

/**
 * Column widths in px, matching the prototype's track order. Kept numeric so a
 * header drag has a concrete value to move; --row-cols is rebuilt from these.
 */
const COL_DEFAULTS = [
  36, 46, 130, 46, 280, 130, 140, 175, 118, 96, 78, 100, 58, 84, 100, 100, 36,
]
const COL_MIN = 36

/** Fixed row heights let the window be computed without measuring. */
const ROW_H = { comfortable: 38, compact: 30 }
const OVERSCAN = 8

export default function WorksheetPage() {
  const { claimId = '' } = useParams()
  const [openRow, setOpenRow] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [docked, setDocked] = useState(false)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [cols, setCols] = useState<number[]>(COL_DEFAULTS)
  const filterRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(600)
  const drag = useRef<{ index: number; startX: number; startW: number } | null>(null)

  const gridStyle = {
    ['--row-cols' as string]: cols.map((c) => `${c}px`).join(' '),
    ['--k-gridw' as string]: `${cols.reduce((a, b) => a + b, 0)}px`,
  } as React.CSSProperties

  // Google-Sheets style: drag a header boundary, double-click to reset.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return
      const { index, startX, startW } = drag.current
      const next = Math.max(COL_MIN, startW + (e.clientX - startX))
      setCols((prev) => prev.map((c, i) => (i === index ? next : c)))
    }
    const up = () => {
      drag.current = null
      document.body.style.cursor = ''
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
    e.stopPropagation()
    drag.current = { index, startX: e.clientX, startW: cols[index] }
    document.body.style.cursor = 'col-resize'
  }

  useEffect(() => {
    if (!filterOpen) return
    const close = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [filterOpen])

  /** GET /v1/depreciation-rules is the live taxonomy; do not retype the classes. */
  const rules = useQuery({
    queryKey: ['depreciation-rules'],
    queryFn: () => api.get<{ categories: string[] }>('/v1/depreciation-rules'),
    staleTime: Infinity,
  })

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
  })

  /**
   * One continuous grid, as the design specifies -- no Previous/Next. Pages are
   * pulled behind the scroll (the API caps limit at 100) and the DOM is
   * windowed, so a 2,400-row claim renders ~40 rows at a time.
   */
  const rows = useInfiniteQuery({
    queryKey: ['claim-items', claimId, status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=${PAGE_SIZE}&offset=${pageParam}` +
          (status ? `&status=${status}` : ''),
      ),
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length
      return next < last.count ? next : undefined
    },
  })

  const queryClient = useQueryClient()
  const [pending, setPending] = useState<Set<number>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  const markPending = (id: number, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
    void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
  }

  /**
   * Money and depreciation are server-owned: we send the edit, then re-read.
   * The four returned totals are applied verbatim -- no client arithmetic.
   */
  const override = useMutation({
    mutationFn: ({ id, body }: { id: number; body: OverrideBody }) => overrideItem(id, body),
    onMutate: ({ id }) => markPending(id, true),
    onError: (error, { id }) => {
      markPending(id, false)
      setNotice(error instanceof Error ? error.message : 'That edit was rejected.')
    },
    onSuccess: (_data, { id }) => {
      markPending(id, false)
      refresh()
    },
  })

  /** Descriptive edits do not touch valuation and do not mark the row overridden. */
  const editLine = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, string | null> }) =>
      editDisplayLine(id, body),
    onSuccess: refresh,
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'That edit was rejected.'),
  })

  const [exporting, setExporting] = useState(false)

  const runExport = async () => {
    setExporting(true)
    try {
      await downloadExport(claimId, 'xlsx')
      // Exporting stamps exported_at, so the derived status moves.
      refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const addItem = useMutation({
    mutationFn: () => createBlankItem(claimId),
    onSuccess: (result) => {
      setNotice(`Added ${result.items_created} unpriced line — fill in the description, then reprice.`)
      refresh()
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Could not add a row.'),
  })

  const removeRows = useMutation({
    mutationFn: (ids: number[]) => deleteItems(ids),
    onSuccess: (result) => {
      setSelected(new Set())
      // No photo is ever deleted -- say so rather than leaving them to guess.
      setNotice(
        `Deleted ${result.deleted} row${result.deleted === 1 ? '' : 's'}` +
          (result.photos_detached ? ` · ${result.photos_detached} photos kept` : ''),
      )
      refresh()
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Delete failed.'),
  })

  const items = useMemo(() => rows.data?.pages.flatMap((page) => page.items) ?? [], [rows.data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) =>
      [item.description, item.make_mfr, item.category, item.model_number, item.room_area]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    )
  }, [items, search])

  /** Group headers aggregate the rows' own flags -- never re-derived from cat. */
  const groups = useMemo(() => {
    if (!groupBy) return null
    const map = new Map<string, ClaimItem[]>()
    for (const item of visible) {
      const key = item.category ?? 'Unclassified'
      const bucket = map.get(key)
      if (bucket) bucket.push(item)
      else map.set(key, [item])
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [groupBy, visible])

  const total = rows.data?.pages[0]?.count ?? 0
  const filterCount = status ? 1 : 0

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allShown = visible.length > 0 && visible.every((item) => selected.has(item.id))
  const toggleAll = () =>
    setSelected(allShown ? new Set() : new Set(visible.map((item) => item.id)))

  /**
   * The claim rollup carries no total_depreciation, but the money contract
   * guarantees acv_total_incl = rcv_total_incl - depreciation_amount, and the
   * server sums both. Restating the difference is the same move as Ext. Cost:
   * a server identity, not a second implementation of the math.
   */
  // TODO: read total_depreciation verbatim once ClaimSummary carries it.
  const claimDepreciation =
    claim.data?.total_rcv != null && claim.data?.total_acv != null
      ? Math.round((claim.data.total_rcv - claim.data.total_acv) * 100) / 100
      : null

  /**
   * Capacity-deferred rows. The prototype spec names a bulk
   * POST /v1/claim_items/retry-deferred, but the live API has no such route --
   * the documented retry path is per-row reprice, which shares the /process
   * 30/min limit. So this sequences, and stops cleanly on a 429.
   */
  const deferred = items.filter(
    (item) =>
      item.status === 'needs_manual' &&
      item.manual_reason &&
      CAPACITY_REASONS.has(item.manual_reason) &&
      (item.query ?? '').length >= 3,
  )

  const rowH = ROW_H[density]

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const measure = () => setViewportH(el.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onGridScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget
    setScrollTop(el.scrollTop)
    // Pull the next page well before the adjuster reaches the bottom.
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < rowH * 20 &&
      rows.hasNextPage &&
      !rows.isFetchingNextPage
    ) {
      void rows.fetchNextPage()
    }
  }

  // Grouped view is a review mode over a filtered set, so it renders whole.
  const windowed = groups === null
  const startIdx = windowed ? Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN) : 0
  const endIdx = windowed
    ? Math.min(visible.length, Math.ceil((scrollTop + viewportH) / rowH) + OVERSCAN)
    : visible.length
  const padTop = windowed ? startIdx * rowH : 0
  const padBottom = windowed ? Math.max(0, (visible.length - endIdx) * rowH) : 0

  let counter = 0

  return (
    <div className="k-shell">
      <AppHeader
        actions={
          <>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              disabled
              title="Appends a new ingest session — the staging screens are not built yet, so there is nowhere for this to land"
            >
              <Icon d={I.plus} size={12} /> Add photos
            </button>
            <button
              type="button"
              className="k-btn"
              /* Exports are repeatable: a later one is simply a new version.
                 Only a claim still processing has nothing settled to export. */
              disabled={claim.data?.status === 'processing' || exporting}
              onClick={() => void runExport()}
              title={
                claim.data?.status === 'processing'
                  ? 'Still processing — some lines have no price yet'
                  : 'Download the XactContents .xlsx'
              }
            >
              <Icon d={I.download} size={12} /> {exporting ? 'Preparing…' : 'Export claim'}
            </button>
          </>
        }
      />

      <ClaimTabs
        active="Worksheet"
        claimId={claimId}
        itemCount={claim.data?.item_count}
        photoCount={claim.data?.photo_count}
      />

      <section className="k-claim-hd">
        <div>
          <Link to="/claims" className="k-crumb">
            <Icon d={I.chevleft} size={12} /> Claims
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="k-claim-h1">{claim.data?.name ?? claimId}</h1>
            {claim.data ? <ClaimStatusChip status={claim.data.status} /> : null}
          </div>
          <div className="k-claim-facts">
            <span>
              <strong>Claim</strong> · <span className="k-mono">{claimId}</span>
            </span>
            {claim.data?.date_of_loss ? (
              <span>
                <strong>DOL</strong> · {fmtDate(claim.data.date_of_loss)}
              </span>
            ) : null}
            {claim.data?.loss_address ? (
              <span>
                <strong>Loss address</strong> · {claim.data.loss_address}
              </span>
            ) : null}
            {claim.data?.tax_rate != null ? (
              <span>
                <strong>Tax</strong> · {fmtPct(claim.data.tax_rate)}
              </span>
            ) : null}
            {claim.data?.carrier ? (
              <span>
                <strong>Carrier</strong> · {claim.data.carrier}
              </span>
            ) : null}
          </div>
        </div>

        {/* Claim-level totals are the server's rollups, read verbatim. */}
        <div className="k-totals">
          <div>
            <div className="k-tot-l">Items</div>
            <div className="k-tot-v">{fmtInt(claim.data?.item_count)}</div>
          </div>
          <div>
            <div className="k-tot-l">RCV</div>
            <div className="k-tot-v">{fmtUSD(claim.data?.total_rcv)}</div>
          </div>
          <div>
            <div className="k-tot-l">Depreciation</div>
            <div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>
              {claimDepreciation === null ? '—' : fmtUSD(Math.max(0, claimDepreciation))}
            </div>
          </div>
          <div title="ClaimSummary carries no total_tax — needs a backend field">
            <div className="k-tot-l">Tax</div>
            <div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>
              —
            </div>
          </div>
          <div>
            <div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>
              ACV total
            </div>
            <div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>
              {fmtUSD(claim.data?.total_acv)}
            </div>
          </div>
        </div>
      </section>

      <section className="k-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="k-search">
            <Icon d={I.search} size={12} />
            <input
              placeholder={`Search ${fmtInt(total)} items…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Scaffolded at a single state until the staging session model lands. */}
          <select className="k-btn k-btn--ghost k-batch" disabled title="Multi-session claims — pending the staging model">
            <option>All batches</option>
          </select>

          <div ref={filterRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`k-btn k-btn--ghost ${filterCount > 0 ? 'k-btn--active' : ''}`}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <Icon d={I.filter} size={12} /> Filter
              {filterCount > 0 ? <span className="k-filter-count">{filterCount}</span> : null}
            </button>

            {filterOpen ? (
              <div
                className="k-pop"
                style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 220, zIndex: 30 }}
              >
                <div className="k-pop-hd">
                  <span>Row status</span>
                  {filterCount > 0 ? (
                    <button
                      type="button"
                      className="k-link"
                      style={{ fontSize: 11 }}
                      onClick={() => setStatus('')}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div style={{ padding: 6 }}>
                  {STATUS_FILTERS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`k-menu-item ${value === status ? 'k-menu-item--on' : ''}`}
                      onClick={() => {
                        setStatus(value)
                        setFilterOpen(false)
                      }}
                    >
                      {label}
                      {value === status ? <Icon d={I.check} size={12} stroke={2.5} /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`k-btn k-btn--ghost ${groupBy ? 'k-btn--active' : ''}`}
            onClick={() => setGroupBy((g) => !g)}
          >
            {groupBy ? (
              <>
                <Icon d={I.check} size={12} stroke={2.5} /> Grouped by class
              </>
            ) : (
              'Group by class'
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected.size > 0 ? (
            <span className="k-claim-sub" title="Bulk delete and re-categorize are mutations — not built yet">
              {selected.size} selected
            </span>
          ) : null}

          <button
            type="button"
            className={`k-btn k-btn--ghost ${density === 'compact' ? 'k-btn--active' : ''}`}
            onClick={() => setDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))}
            title={density === 'comfortable' ? 'Comfortable rows — switch to compact' : 'Compact rows — switch to comfortable'}
            aria-label="Row density"
          >
            <Icon d={density === 'compact' ? I.rowsCompact : I.rowsComfy} size={13} />
            {density === 'compact' ? 'Compact' : 'Comfortable'}
          </button>

          <button
            type="button"
            className={`k-btn k-btn--ghost ${docked ? 'k-btn--on' : ''}`}
            onClick={() => setDocked((d) => !d)}
            title="Dock the item panel beside the grid — it re-syncs to whichever row you click"
          >
            Item panel
          </button>
          <button
            type="button"
            className="k-btn"
            disabled={addItem.isPending}
            onClick={() => addItem.mutate()}
            title="Add a line item without a photo"
          >
            <Icon d={I.plus} size={12} /> Add item
          </button>
        </div>
      </section>

      {notice ? (
        <div className="k-ws-bar">
          <span>{notice}</span>
          <button type="button" className="k-link" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {deferred.length > 0 ? (
        <div className="k-ws-bar k-ws-bar--quiet">
          <span>
            {deferred.length} row{deferred.length === 1 ? '' : 's'} deferred — the pricing service
            was at capacity, not a problem with these items.
          </span>
          {/* Paused: the backend is building POST /v1/claims/{id}/retry-deferred.
              Looping per-row reprice would burn the shared 30/min limit for a
              worse result, so the action waits for the batch route. */}
          <button
            type="button"
            className="k-btn k-btn--sm"
            disabled
            title="Waiting on POST /v1/claims/{claim_id}/retry-deferred"
          >
            Retry {deferred.length} deferred
          </button>
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="k-ws-bar k-ws-bar--sel">
          <span>{selected.size} selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="k-insp-input"
              style={{ width: 190 }}
              defaultValue=""
              onChange={(e) => {
                const category = e.target.value
                if (!category) return
                // No bulk category endpoint -- override each row. Comps survive
                // a category-only edit, so this does not strip substantiation.
                for (const id of selected) override.mutate({ id, body: { category } })
                e.target.value = ''
                setSelected(new Set())
              }}
            >
              <option value="">Re-categorize…</option>
              {(rules.data?.categories ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {confirmDel ? (
              <>
                <span className="k-claim-sub">Photos stay on the claim.</span>
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--ghost"
                  onClick={() => setConfirmDel(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--danger"
                  disabled={removeRows.isPending}
                  onClick={() => {
                    setConfirmDel(false)
                    removeRows.mutate([...selected])
                  }}
                >
                  Delete {selected.size}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="k-btn k-btn--ghost k-btn--danger"
                onClick={() => setConfirmDel(true)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ) : null}

      {rows.isPending ? <p className="k-note k-ws-note">Loading items…</p> : null}

      {rows.error ? (
        <p className="k-error k-ws-note">
          Could not load items
          {rows.error instanceof ApiError ? ` (HTTP ${rows.error.status})` : ''}.
        </p>
      ) : null}

      {rows.data ? (
        <div className={docked && openRow !== null ? 'k-grid-dock' : 'k-grid-dock k-grid-dock--off'}>
          <section
            ref={gridRef}
            onScroll={onGridScroll}
            className={`k-grid k-grid--ws${density === 'compact' ? ' k-grid--compact' : ''}`}
            style={gridStyle}
          >
            <div className="k-row k-row--head">
              {HEADERS.map(([cls, label]) =>
                cls === 'k-c--check' ? (
                  <div key={cls} className={`k-c ${cls}`}>
                    <button
                      type="button"
                      className={`k-check ${allShown ? 'k-check--on' : ''}`}
                      onClick={toggleAll}
                      aria-label="Select all rows"
                    >
                      {allShown ? <Icon d={I.check} size={10} stroke={2} /> : null}
                    </button>
                  </div>
                ) : (
                  <div key={cls} className={`k-c ${cls}`}>
                    {label}
                    <span
                      className="k-col-resize"
                      onMouseDown={(e) => startResize(HEADERS.findIndex(([c]) => c === cls), e)}
                      onDoubleClick={() =>
                        setCols((prev) =>
                          prev.map((c, j) =>
                            j === HEADERS.findIndex(([hc]) => hc === cls) ? COL_DEFAULTS[j] : c,
                          ),
                        )
                      }
                      title="Drag to resize · double-click to reset"
                    />
                  </div>
                ),
              )}
            </div>

            {visible.length === 0 ? (
              <div className="k-ws-empty">
                <div className="k-empty-art k-empty-art--accent">
                  <Icon d={items.length ? I.search : I.camera} size={24} />
                </div>
                <div className="k-ws-empty-t">
                  {items.length ? 'No rows match your search' : 'No items on this claim yet'}
                </div>
              </div>
            ) : groups ? (
              groups.map(([category, groupItems]) => (
                <div key={category}>
                  <div className="k-grp">
                    <span>
                      {category}
                      <span className="k-grp-n">{groupItems.length}</span>
                    </span>
                  </div>
                  {groupItems.map((item) => (
                    <Row
                      key={item.id}
                      item={item}
                      n={++counter}
                      selected={selected.has(item.id)}
                      active={openRow === item.id}
                      onSelect={() => toggle(item.id)}
                      onOpen={() => setOpenRow(item.id)}
                      onRowClick={docked ? () => setOpenRow(item.id) : undefined}
                      pending={pending.has(item.id)}
                      categories={rules.data?.categories ?? []}
                      onOverride={(body) => override.mutate({ id: item.id, body })}
                      onEditLine={(body) => editLine.mutate({ id: item.id, body })}
                    />
                  ))}
                </div>
              ))
            ) : (
              <>
                {padTop > 0 ? <div style={{ height: padTop }} /> : null}
                {visible.slice(startIdx, endIdx).map((item) => (
                  <Row
                  key={item.id}
                  item={item}
                  n={++counter}
                  selected={selected.has(item.id)}
                  active={openRow === item.id}
                  onSelect={() => toggle(item.id)}
                  onOpen={() => setOpenRow(item.id)}
                    onRowClick={docked ? () => setOpenRow(item.id) : undefined}
                    pending={pending.has(item.id)}
                    categories={rules.data?.categories ?? []}
                    onOverride={(body) => override.mutate({ id: item.id, body })}
                    onEditLine={(body) => editLine.mutate({ id: item.id, body })}
                  />
                ))}
                {padBottom > 0 ? <div style={{ height: padBottom }} /> : null}
              </>
            )}
          </section>

          {docked && openRow !== null ? (
            <ItemDrawer rowId={openRow} onClose={() => setOpenRow(null)} docked />
          ) : null}
        </div>
      ) : null}

      {rows.data ? (
        <>
          <div className="k-ws-foot">
            <span className="k-claim-sub">
              {total === 0
                ? 'No items'
                : `Showing ${fmtInt(items.length)} of ${fmtInt(total)}` +
                  (rows.isFetchingNextPage ? ' · loading more…' : '')}
            </span>
          </div>
        </>
      ) : null}

      {/* Undocked, the panel is a modal over the grid. */}
      {!docked && openRow !== null ? (
        <ItemDrawer rowId={openRow} onClose={() => setOpenRow(null)} />
      ) : null}
    </div>
  )
}

/** A derived cell with no value reads as a muted dash, as in the prototype. */
function Dash() {
  return <span className="k-dash">—</span>
}

function Money({ value }: { value: number | null | undefined }) {
  return value === null || value === undefined ? <Dash /> : <>{fmtUSD(value)}</>
}

function Row({
  item,
  n,
  selected,
  active,
  pending,
  categories,
  onSelect,
  onOpen,
  onRowClick,
  onOverride,
  onEditLine,
}: {
  item: ClaimItem
  n: number
  selected: boolean
  active: boolean
  /** The server is recomputing this row -- derived cells lock until it answers. */
  pending: boolean
  categories: string[]
  onSelect: () => void
  onOpen: () => void
  /** Set only while the panel is docked: the whole row becomes the target. */
  onRowClick?: () => void
  onOverride: (body: OverrideBody) => void
  onEditLine: (body: Record<string, string | null>) => void
}) {
  const [compsOpen, setCompsOpen] = useState(false)
  const unpriced = item.status === 'needs_manual'
  // Capacity waits are NOT adjuster work -- quiet pending state, never amber.
  const waiting = Boolean(unpriced && item.manual_reason && CAPACITY_REASONS.has(item.manual_reason))
  const comp = item.alternative_sources?.[0]
  const depAmount = item.depreciation_amount

  return (
    <div
      className={`k-row${unpriced && !waiting ? ' k-row--manual' : ''}${selected ? ' k-row--sel' : ''}${active ? ' k-row--active' : ''}`}
      onClick={onRowClick}
    >
      <div className="k-c k-c--check">
        <button
          type="button"
          className={`k-check ${selected ? 'k-check--on' : ''}`}
          onClick={onSelect}
          aria-label="Select row"
        >
          {selected ? <Icon d={I.check} size={10} stroke={2} /> : null}
        </button>
      </div>

      <div className="k-c k-c--idx">
        <button type="button" className="k-idx-btn" onClick={onOpen} title="Open item">
          {String(n).padStart(4, '0')}
        </button>
      </div>

      <div className="k-c k-c--room">
        <EditableCell
          value={item.room_area ?? ''}
          placeholder="Room / area…"
          onCommit={(next) => onEditLine({ room_area: next || null })}
        />
      </div>

      <div className="k-c k-c--qty">
        <EditableCell
          value={String(item.quantity)}
          numeric
          align="right"
          onCommit={(next) => {
            const quantity = parseInt(next, 10)
            if (Number.isFinite(quantity) && quantity >= 1 && quantity !== item.quantity)
              onOverride({ quantity })
          }}
        />
      </div>

      <div className="k-c k-c--desc">
        <span className="k-desc-text">{item.description || <Dash />}</span>
        {waiting ? <span className="k-pricing-chip">Pricing</span> : null}
      </div>

      <div className="k-c k-c--mfr">{item.make_mfr || <Dash />}</div>
      <div className="k-c k-c--model k-mono">{item.model_number || <Dash />}</div>

      {/* Content class is a picker in the design; read-state keeps the caret
          affordance so the column reads the same, without opening a menu. */}
      <div className="k-c k-c--cat">
        {/* A category-only edit KEEPS the comps -- the replacement cost is
            unchanged and still comp-supported. It does re-run depreciation. */}
        <select
          className="k-cell k-cell--select"
          value={item.category ?? ''}
          disabled={pending}
          onChange={(e) => onOverride({ category: e.target.value })}
        >
          {item.category ? null : <option value="">—</option>}
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Every money cell below is the server's figure, read verbatim. */}
      <div className="k-c k-c--rcv">
        <EditableCell
          value={item.rcv === null ? '' : String(item.rcv)}
          numeric
          money
          align="right"
          pending={pending}
          placeholder={item.status === 'needs_manual' ? '' : undefined}
          title="Per-unit, pre-tax. Editing this clears the comparable sources."
          onCommit={(next) => {
            if (next === '') return
            const rcv = Number(next)
            if (!Number.isFinite(rcv) || rcv < 0 || rcv === item.rcv) return
            // No dialog. The comps drop, the Source cell empties and the basis
            // flips to Manual -- that visible change is the signal. We do not
            // make the adjuster justify a price to the tool.
            onOverride({ rcv })
          }}
        />
      </div>
      <div className="k-c k-c--ext k-mono">
        <Money value={extCost(item.rcv_total_incl, item.tax)} />
      </div>
      <div className="k-c k-c--tax k-mono">
        <Money value={item.tax} />
      </div>
      <div
        className={`k-c k-c--rcvtax k-mono${item.alternative_sources?.length ? ' k-c--hascomps' : ''}`}
        style={{ position: 'relative' }}
        onClick={(e) => {
          if (!item.alternative_sources?.length) return
          e.stopPropagation()
          setCompsOpen((o) => !o)
        }}
        title={item.alternative_sources?.length ? 'Comparable listings behind this price' : undefined}
      >
        <Money value={item.rcv_total_incl} />
        {compsOpen ? (
          <CompsPopover comps={item.alternative_sources} onClose={() => setCompsOpen(false)} />
        ) : null}
      </div>
      <div className="k-c k-c--age">
        {/* Items land at age 0 -> ACV = RCV. Entering age is the core loop:
            the server re-runs the engine and returns the four line totals. */}
        <EditableCell
          value={item.age_years === null || item.age_years === 0 ? '' : String(item.age_years)}
          numeric
          align="right"
          pending={pending}
          disabled={item.status === 'needs_manual'}
          title={
            item.status === 'needs_manual'
              ? 'Unpriced — set a price before entering age'
              : 'Age in years; depreciation is recomputed by the server'
          }
          onCommit={(next) => {
            if (next === '') return
            const age = Number(next)
            if (!Number.isFinite(age) || age < 0 || age === item.age_years) return
            onOverride({ age_years: age })
          }}
        />
      </div>

      {/* Depreciation is NEVER computed here -- spinner until the server answers. */}
      <div className={`k-c k-c--dep k-mono${pending ? ' k-cell--pending' : ''}`}>
        {pending ? (
          <span className="k-dep-spin" />
        ) : item.depreciation_pct === null ? (
          <Dash />
        ) : (
          <span title={item.depreciation_method ? `Method: ${item.depreciation_method.replace('_', ' ')}` : undefined}>
            {fmtPct(item.depreciation_pct)}
          </span>
        )}
      </div>
      <div className="k-c k-c--depamt k-mono">
        {/* A positive amount WITHHELD -- ACV already subtracts it, so a minus
            sign here would read as a second subtraction. Never -$0.00. */}
        {depAmount === null || depAmount === undefined ? (
          <Dash />
        ) : (
          fmtUSD(Math.max(0, depAmount))
        )}
      </div>
      <div className="k-c k-c--acv k-mono k-acv">
        <Money value={item.acv_total_incl} />
      </div>

      <div className="k-c k-c--src">
        {/* Only alternative_sources[0] resolves to a merchant listing. The
            prototype offers "+ Add" when there is none -- that is a mutation,
            so read-state shows nothing rather than a control that cannot act. */}
        {unpriced ? null : comp?.link ? (
          <a
            className="k-src-link"
            href={comp.link}
            target="_blank"
            rel="noreferrer noopener"
            title={`${comp.source ?? 'Comp'} — ${comp.title ?? ''}`}
          >
            Link
          </a>
        ) : null}
      </div>
    </div>
  )
}
