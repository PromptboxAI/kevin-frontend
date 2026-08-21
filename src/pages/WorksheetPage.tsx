import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimStatusChip from '../components/ClaimStatusChip'
import ClaimTabs from '../components/ClaimTabs'
import ItemDrawer from '../components/ItemDrawer'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { extCost, fmtAge, fmtDate, fmtInt, fmtPct, fmtUSD } from '../lib/format'
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

export default function WorksheetPage() {
  const { claimId = '' } = useParams()
  const [offset, setOffset] = useState(0)
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

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
  })

  const rows = useQuery({
    queryKey: ['claim-items', claimId, offset, status],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=${PAGE_SIZE}&offset=${offset}` +
          (status ? `&status=${status}` : ''),
      ),
    placeholderData: keepPreviousData,
  })

  const items = rows.data?.items ?? []

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

  const total = rows.data?.count ?? 0
  const pageEnd = offset + items.length
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
  const claimDepreciation =
    claim.data?.total_rcv != null && claim.data?.total_acv != null
      ? Math.round((claim.data.total_rcv - claim.data.total_acv) * 100) / 100
      : null

  let counter = offset

  return (
    <div className="k-shell">
      <AppHeader />

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
                <strong>Date of loss</strong> · {fmtDate(claim.data.date_of_loss)}
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
              {claimDepreciation === null
                ? '—'
                : claimDepreciation > 0
                  ? `−${fmtUSD(claimDepreciation)}`
                  : fmtUSD(0)}
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
                      onClick={() => {
                        setStatus('')
                        setOffset(0)
                      }}
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
                        setOffset(0)
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
            className="k-btn k-btn--ghost"
            onClick={() => setDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))}
            title="Row density"
          >
            {density === 'comfortable' ? 'Comfortable' : 'Compact'}
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
            disabled
            title="Adding an item is a mutation — not built yet"
          >
            <Icon d={I.plus} size={12} /> Add item
          </button>
        </div>
      </section>

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
                    />
                  ))}
                </div>
              ))
            ) : (
              visible.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  n={++counter}
                  selected={selected.has(item.id)}
                  active={openRow === item.id}
                  onSelect={() => toggle(item.id)}
                  onOpen={() => setOpenRow(item.id)}
                  onRowClick={docked ? () => setOpenRow(item.id) : undefined}
                />
              ))
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
              {total === 0 ? 'No items' : `${fmtInt(offset + 1)}–${fmtInt(pageEnd)} of ${fmtInt(total)}`}
            </span>
            <div className="k-ws-pager">
              <button
                type="button"
                className="k-btn k-btn--ghost"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </button>
              <button
                type="button"
                className="k-btn k-btn--ghost"
                disabled={pageEnd >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
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
  onSelect,
  onOpen,
  onRowClick,
}: {
  item: ClaimItem
  n: number
  selected: boolean
  active: boolean
  onSelect: () => void
  onOpen: () => void
  /** Set only while the panel is docked: the whole row becomes the target. */
  onRowClick?: () => void
}) {
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

      <div className="k-c k-c--room">{item.room_area || <Dash />}</div>
      <div className="k-c k-c--qty k-mono">{item.quantity}</div>

      <div className="k-c k-c--desc">
        <span className="k-desc-text">{item.description || <Dash />}</span>
        {waiting ? <span className="k-pricing-chip">Pricing</span> : null}
      </div>

      <div className="k-c k-c--mfr">{item.make_mfr || <Dash />}</div>
      <div className="k-c k-c--model k-mono">{item.model_number || <Dash />}</div>

      {/* Content class is a picker in the design; read-state keeps the caret
          affordance so the column reads the same, without opening a menu. */}
      <div className="k-c k-c--cat">
        <span className="k-cell k-cell--button k-cell--static">
          <span className="k-cat-text">{item.category || '—'}</span>
          <Icon d={I.chevdown} size={11} />
        </span>
      </div>

      {/* Every money cell below is the server's figure, read verbatim. */}
      <div className="k-c k-c--rcv k-mono">
        <Money value={item.rcv} />
      </div>
      <div className="k-c k-c--ext k-mono">
        <Money value={extCost(item.rcv_total_incl, item.tax)} />
      </div>
      <div className="k-c k-c--tax k-mono">
        <Money value={item.tax} />
      </div>
      <div className="k-c k-c--rcvtax k-mono">
        <Money value={item.rcv_total_incl} />
      </div>
      <div className="k-c k-c--age k-mono">
        {item.age_years === null ? <Dash /> : fmtAge(item.age_years)}
      </div>
      <div className="k-c k-c--dep k-mono">
        {item.depreciation_pct === null ? <Dash /> : fmtPct(item.depreciation_pct)}
      </div>
      <div className="k-c k-c--depamt k-mono">
        {/* Depreciation is always >= 0, so a signed zero is a formatting artifact. */}
        {depAmount === null || depAmount === undefined ? (
          <Dash />
        ) : depAmount > 0 ? (
          `−${fmtUSD(depAmount)}`
        ) : (
          fmtUSD(0)
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
