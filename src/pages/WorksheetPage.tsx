import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimStatusChip from '../components/ClaimStatusChip'
import ClaimTabs from '../components/ClaimTabs'
import CompsPopover from '../components/CompsPopover'
import EditableCell from '../components/EditableCell'
import ItemDrawer from '../components/ItemDrawer'
import ShareSheet from '../components/ShareSheet'
import ProposalsPanel from '../components/ProposalsPanel'
import RoomsPopover from '../components/RoomsPopover'
import ClaimStateMenu from '../components/ClaimStateMenu'
import { I, Icon } from '../components/Icon'
import { ApiError, api, downloadExport } from '../lib/api'
import {
  DEPR_ERROR_COPY,
  deprCellValue,
  deprChanged,
  deprEditable,
  deprOverrideBody,
  isManualDepr,
  parseDeprPercent,
} from '../lib/depr-rules'
import { fmtDate, fmtInt, fmtPct, fmtUSD } from '../lib/format'
import {
  bulkSetCategory,
  createBlankRow,
  deleteItems,
  editDisplayLine,
  overrideItem,
  retryDeferred,
} from '../lib/mutations'
import { moneyFrom } from '../lib/mutations'
import type {
  ClaimTotals,
  MoneyBlock,
  OverrideBody,
  RetryDeferredResponse,
} from '../lib/mutations'
import { numberRows, rowInvariant, windowRange } from '../lib/rows'
import { listProposals } from '../lib/proposals'
import { assignRoom, listRooms, setRoomArea } from '../lib/rooms'
import { assignPlan, assignSummary, planTextChunks } from '../lib/room-rules'
import type { NumberedItem } from '../lib/rows'
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
/**
 * Description is the flexible track, as in the design (minmax(200px, 2.4fr)).
 * With every track a fixed px the grid stopped filling the container, leaving
 * dead space right of the Link column that reads as a phantom column.
 */
const FLEX_COL = 4

/** Fixed row heights let the window be computed without measuring. */
/**
 * MUST equal the rendered height set in CSS. The design fixes rows at 42px
 * (comfortable) / 34px (compact); guessing 38 against content-height rows made
 * the spacers mis-size and the on-screen row count drift.
 */
const ROW_H = { comfortable: 42, compact: 34 }
const OVERSCAN = 8

export default function WorksheetPage() {
  const { claimId = '' } = useParams()
  const [openRow, setOpenRow] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  /** null = every room; 'none' = the Unassigned bucket; a number = one room. */
  const [roomFilter, setRoomFilter] = useState<number | null | 'none'>(null)
  /** Shared cache key with RoomsPopover -- one fetch feeds both. */
  const rooms = useQuery({
    queryKey: ['rooms', claimId],
    queryFn: () => listRooms(claimId),
    enabled: !!claimId,
  })
  const [docked, setDocked] = useState(false)
  /** Fixed internal setting: the design exposes no density control. */
  const density = 'comfortable' as 'comfortable' | 'compact'
  const [cols, setCols] = useState<number[]>(COL_DEFAULTS)
  const filterRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sbw, setSbw] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(600)
  const drag = useRef<{ index: number; startX: number; startW: number } | null>(null)

  const gridStyle = {
    ['--row-cols' as string]: cols
      .map((c, i) => (i === FLEX_COL ? `minmax(${c}px, 1fr)` : `${c}px`))
      .join(' '),
    // Sum of the tracks. .k-row, .k-row--head and .k-scroll all carry this as
    // min-width, so widening a column overflows .k-grid horizontally.
    ['--k-gridw' as string]: `${cols.reduce((a, b) => a + b, 0)}px`,
    // Reserve the vertical scrollbar on the header, which is a SIBLING of the
    // scrolling body -- otherwise ACV and Link drift out of alignment.
    ['--k-sbw' as string]: `${sbw}px`,
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
    queryFn: () =>
      api.get<{ categories: string[]; rules: Record<string, unknown> }>('/v1/depreciation-rules'),
    staleTime: Infinity,
  })

  /**
   * Client proposals waiting on the adjuster.
   *
   * Fetched at the page level rather than inside the panel so the count is
   * visible without opening anything -- a queue nobody can see is the failure
   * this whole surface exists to fix.
   */
  const proposals = useQuery({
    queryKey: ['proposals', claimId],
    queryFn: () => listProposals(claimId),
  })
  const pendingProposals =
    proposals.data?.proposals.filter((p) => p.status === 'pending').length ?? 0

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
  /** id -> the single field awaiting the server. Siblings keep their values. */
  const [pending, setPending] = useState<Map<number, string>>(new Map())
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [newRowId, setNewRowId] = useState<number | null>(null)
  /** The dry-run estimate awaiting confirmation. Null = no modal. */
  const [retryPlan, setRetryPlan] = useState<RetryDeferredResponse | null>(null)

  /**
   * Two-step by design. The blast radius is two vendor searches per deferred
   * line -- thousands on a large import -- so the adjuster sees the bill from
   * the server's own dry run before authorising the spend.
   */
  const retryPreview = useMutation({
    mutationFn: () => retryDeferred(claimId, true),
    onSuccess: (plan) => {
      if (plan.eligible === 0) {
        setNotice('Nothing to retry — no lines are waiting on capacity.')
        return
      }
      setRetryPlan(plan)
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Could not check deferred lines.'),
  })

  const retryRun = useMutation({
    mutationFn: () => retryDeferred(claimId, false),
    onSuccess: (result) => {
      setRetryPlan(null)
      setNotice(
        `Re-queued ${fmtInt(result.enqueued)} line${result.enqueued === 1 ? '' : 's'}` +
          (result.skipped ? ` · ${fmtInt(result.skipped)} skipped` : '') +
          '. Prices land as the engine works through them.',
      )
      refresh()
    },
    onError: (error) => {
      setRetryPlan(null)
      setNotice(error instanceof Error ? error.message : 'Retry failed.')
    },
  })

  // Toasts are transient: they carry failures, never confirmations.
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(t)
  }, [notice])

  const markPending = (id: number, field: string | null) =>
    setPending((prev) => {
      const next = new Map(prev)
      if (field) next.set(id, field)
      else next.delete(id)
      return next
    })

  /**
   * Full refetch. Only for edits that change the ROW SET (add, delete) --
   * invalidating an infinite query refetches every page it holds, which on a
   * 2,400-row claim is 25 requests.
   */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
    void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
  }

  /**
   * A single-row edit re-reads ONE row and splices it into the cached pages.
   * The contract says the tax-inclusive columns "follow on the next read", so a
   * read is required -- but it is one request, not one per loaded page. This is
   * what made a class change take seconds.
   */
  /**
   * Apply the claim totals the write just returned. The totals bar updates in
   * the SAME tick as the cell -- no second request, no debounce. Null means the
   * rollup could not be read, in which case the previous totals stand rather
   * than blanking.
   */
  const applyTotals = (totals: ClaimTotals | null | undefined) => {
    if (!totals) return
    queryClient.setQueryData<ClaimSummary>(
      ['claim', claimId],
      (prev) => prev && { ...prev, ...totals },
    )
  }

  /** Merge a partial row into the cached pages without a network call. */
  const patchRowInCache = (id: number, patch: Partial<ClaimItem>) => {
    queryClient.setQueryData<InfiniteData<ClaimItemListResponse>>(
      ['claim-items', claimId, status],
      (prev) =>
        prev && {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            items: page.items.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          })),
        },
    )
  }

  /**
   * Money and depreciation are server-owned: we send the edit, then re-read.
   * The four returned totals are applied verbatim -- no client arithmetic.
   */
  const override = useMutation({
    mutationFn: ({ id, body }: { id: number; body: OverrideBody }) => overrideItem(id, body),
    onMutate: ({ id, body }) => markPending(id, Object.keys(body)[0] ?? 'rcv'),
    onError: (error, { id }) => {
      markPending(id, null)
      setNotice(error instanceof Error ? error.message : 'That edit was rejected.')
    },
    onSuccess: (data, { id }) => {
      markPending(id, null)
      /**
       * ONE round trip. `applied` carries the stored fields (class, rate,
       * manual_reason) and the response now carries the tax-inclusive block
       * the worksheet renders, so there is nothing left to re-read. The
       * backend pins the two together in a test -- if they diverged the grid
       * would flicker between two answers.
       */
      patchRowInCache(id, { ...data.applied, ...moneyFrom(data) })
      applyTotals(data.claim_totals)
    },
  })

  /** Descriptive edits do not touch valuation and do not mark the row overridden. */
  const editLine = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, string | null> }) =>
      editDisplayLine(id, body),
    onSuccess: (result, { id }) => {
      patchRowInCache(id, { ...(result.applied as Partial<ClaimItem>), ...moneyFrom(result) })
      applyTotals(result.claim_totals)
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'That edit was rejected.'),
  })

  const [exporting, setExporting] = useState(false)
  /** Open only for the FIRST export, which is the one that stamps the date. */
  const [confirmExport, setConfirmExport] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [proposalsOpen, setProposalsOpen] = useState(false)

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
      setConfirmExport(false)
    }
  }

  const addItem = useMutation({
    /**
     * bulk requires a 2-300 char description, so a genuinely BLANK line takes
     * two steps: create, then clear the placeholder through the descriptive
     * PATCH (null clears it). Otherwise every added row reads "New item" and
     * turns up in search.
     */
    // items/bulk accepts a blank description with price:false (9dce2c1), so
    // this is one call -- no create-then-clear, and no "New item" flash.
    mutationFn: () => createBlankRow(claimId),
    onSuccess: async (created) => {
      const id = created.item_ids?.[0]
      if (id !== undefined) setNewRowId(id)
      await queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      if (id === undefined) return
      // Rows sort by id, so the new line is last: scroll it in and focus its
      // Description cell so the adjuster can just start typing.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-row-id="${id}"]`)
        el?.scrollIntoView({ block: 'center' })
        el?.querySelector<HTMLInputElement>('input[data-ws-cell]')?.focus()
      })
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Could not add a row.'),
  })

  /**
   * The proof URL gets its own mutation so its outcome is reported. A silent
   * save is unfalsifiable: this states plainly whether the write landed, and
   * echoes what the server said it applied.
   */
  const saveSource = useMutation({
    mutationFn: ({ id, url }: { id: number; url: string | null }) =>
      editDisplayLine(id, { manual_source_url: url }),
    onSuccess: (result, { id, url }) => {
      const applied = (result?.applied ?? {}) as Record<string, unknown>
      // A successful inline save is NOT announced -- the persisted value is the
      // confirmation. Only the contract anomaly is worth interrupting for.
      if (url && !applied.manual_source_url) {
        setNotice(
          `Saved, but the server did not echo manual_source_url (applied: ${Object.keys(applied).join(', ') || 'nothing'}).`,
        )
      }
      patchRowInCache(id, {
        ...(result.applied as Partial<ClaimItem>),
        ...moneyFrom(result as MoneyBlock),
      })
      applyTotals((result as MoneyBlock).claim_totals)
    },
    onError: (error) =>
      setNotice(
        error instanceof ApiError
          ? `Could not save the source link — HTTP ${error.status}: ${error.message422}`
          : 'Could not save the source link.',
      ),
  })

  const recategorize = useMutation({
    mutationFn: ({ ids, category }: { ids: number[]; category: string }) =>
      bulkSetCategory(ids, category),
    onSuccess: (result) => {
      setSelected(new Set())
      setNotice(
        `Re-classified to ${result.category}${result.repriced ? ` · ${result.repriced} repriced` : ''}.`,
      )
      refresh()
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Re-classify failed.'),
  })

  /**
   * File the selected lines in a room.
   *
   * TWO writes, because the API splits what the adjuster thinks of as one act:
   * `assign-room` sets `room_id` (filtering and rollups) and touches nothing
   * else, while the EXPORT prints `room_area` -- the free text. Assigning
   * without the second half would let someone file all 52 lines and hand the
   * carrier a schedule with a blank Room/Area column. See ask 28.
   */
  const fileInRoom = useMutation({
    mutationFn: async ({ ids, roomId }: { ids: number[]; roomId: number | null }) => {
      const chosen = items.filter((i) => ids.includes(i.id))
      const room = roomId == null ? null : (rooms.data?.rooms ?? []).find((r) => r.id === roomId)
      const plan = assignPlan(chosen, room ?? null)
      await assignRoom(plan.itemIds, plan.roomId)
      // Chunked: a 300-row selection must not open 300 sockets at once.
      for (const chunk of planTextChunks(plan.textUpdates)) {
        await Promise.all(chunk.map((u) => setRoomArea(u.id, u.room_area)))
      }
      return { plan, name: room?.name ?? null }
    },
    onSuccess: ({ plan, name }) => {
      setSelected(new Set())
      setNotice(assignSummary(plan, name))
      void queryClient.invalidateQueries({ queryKey: ['rooms', claimId] })
      refresh()
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Could not file those lines.'),
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

  /**
   * Numbered ONCE here, over the complete set, before filtering, grouping or
   * windowing. Every downstream view slices rows that already carry lineNo, so
   * a row's number can never depend on scroll position or on which filter is
   * active. See lib/rows.ts.
   */
  const items = useMemo(() => numberRows(rows.data?.pages.flatMap((p) => p.items) ?? []), [rows.data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    let out = items
    if (roomFilter === 'none') out = out.filter((item) => item.room_id == null)
    else if (roomFilter != null) out = out.filter((item) => item.room_id === roomFilter)
    if (!term) return out
    return out.filter((item) =>
      [item.description, item.make_mfr, item.category, item.model_number, item.room_area]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    )
  }, [items, search, roomFilter])

  /** Group headers aggregate the rows' own flags -- never re-derived from cat. */
  const groups = useMemo(() => {
    if (!groupBy) return null
    const map = new Map<string, NumberedItem[]>()
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

  const saving =
    override.isPending || editLine.isPending || addItem.isPending || removeRows.isPending

  const countCheck = rowInvariant(items, total)

  useEffect(() => {
    if (!rows.hasNextPage && !countCheck.ok) {
      console.warn('[worksheet] row count invariant failed', countCheck)
    }
  }, [countCheck, rows.hasNextPage])

  const rowH = ROW_H[density]

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      setViewportH(el.clientHeight)
      setSbw(el.offsetWidth - el.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [rows.data])

  const onScroll = (e: React.UIEvent<HTMLElement>) => {
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
  const win = windowRange(scrollTop, viewportH, rowH, visible.length, OVERSCAN)
  const startIdx = windowed ? win.startIdx : 0
  const endIdx = windowed ? win.endIdx : visible.length
  const padTop = windowed ? win.padTop : 0
  const padBottom = windowed ? win.padBottom : 0


  return (
    <div className="k-shell">
      <AppHeader
        actions={
          <>
            <button
              type="button"
              className="k-btn k-btn--ghost"
              onClick={() => setNotice('Photo staging is the next build — this will open the intake flow.')}
              title="Photo staging — coming in this build"
            >
              <Icon d={I.plus} size={12} /> Add photos
            </button>
            {/* Only when there IS something waiting: a permanent zero-badge
                teaches people to ignore the control. */}
            {pendingProposals > 0 ? (
              <button
                type="button"
                className="k-btn k-btn--ghost"
                onClick={() => setProposalsOpen(true)}
                title="Items your client proposed, waiting on you"
              >
                <Icon d={I.plus} size={12} /> Client items
                <span className="k-claim-tab-n" style={{ marginLeft: 6 }}>
                  {pendingProposals}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              className="k-btn k-btn--ghost"
              onClick={() => setShareOpen(true)}
              title="Send the client a read-only link"
            >
              <Icon d={I.link} size={12} /> Share
            </button>
            <button
              type="button"
              className="k-btn"
              /* Exports are repeatable: a later one is simply a new version.
                 Only a claim still processing has nothing settled to export. */
              disabled={claim.data?.status === 'processing' || exporting}
              /* The FIRST export stamps exported_at permanently -- that date is
                 the Proof of Loss timestamp. Re-downloads are unlimited and
                 never move it, so only the first one asks. */
              onClick={() => {
                if (claim.data?.exported_at) void runExport()
                else setConfirmExport(true)
              }}
              title={
                claim.data?.status === 'processing'
                  ? 'Still processing — some lines have no price yet'
                  : claim.data?.exported_at
                    ? `Re-download the XactContents .xlsx · Proof of Loss dated ${fmtDate(claim.data.exported_at)}`
                    : 'Generates the Proof of Loss and stamps its date'
              }
            >
              <Icon d={I.download} size={12} />{' '}
              {exporting
                ? 'Preparing…'
                : claim.data?.exported_at
                  ? 'Download export'
                  : 'Generate carrier export'}
            </button>
            {/* Finishing a claim happens while looking at it, not on the walk
                back to the dashboard. */}
            {claim.data ? <ClaimStateMenu claim={claim.data} onNotice={setNotice} /> : null}
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
            <span>
              <strong>DOL</strong> · {fmtDate(claim.data?.date_of_loss)}
            </span>
            <span>
              <strong>Loss address</strong> · {claim.data?.loss_address || '—'}
            </span>
            <span>
              <strong>Tax</strong> ·{' '}
              {claim.data?.tax_rate == null ? '—' : fmtPct(claim.data.tax_rate)}
            </span>
            <span>
              <strong>Carrier</strong> · {claim.data?.carrier || '—'}
            </span>
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
            {/* Read verbatim -- the last client-side money restatement is gone. */}
            <div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>
              {fmtUSD(claim.data?.total_depreciation)}
            </div>
          </div>
          <div>
            <div className="k-tot-l">Tax</div>
            <div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>
              {fmtUSD(claim.data?.total_tax)}
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
          <span className="k-selectwrap" style={{ width: 'auto' }}>
            <select
              className="k-btn k-btn--ghost k-batch"
              title="Multi-session claims — one session until the staging model lands"
            >
              <option>All batches</option>
            </select>
            <Icon d={I.chevdown} size={12} />
          </span>

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

          <RoomsPopover
            claimId={claimId}
            items={items}
            roomFilter={roomFilter}
            onFilter={setRoomFilter}
            onNotice={setNotice}
          />

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
            className={`k-btn k-btn--ghost ${docked ? 'k-btn--on' : ''}`}
            onClick={() => {
              const next = !docked
              setDocked(next)
              if (next && openRow === null && visible.length > 0) setOpenRow(visible[0].id)
            }}
            title={
              docked
                ? 'Close the item panel'
                : 'Open the item panel beside the grid — click any row to inspect it'
            }
          >
            <Icon d={I.pin} size={12} /> {docked ? 'Close panel' : 'Item panel'}
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
        <div className="k-toast" role="status">
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
          <button
            type="button"
            className="k-btn k-btn--sm"
            disabled={retryPreview.isPending || retryRun.isPending}
            onClick={() => retryPreview.mutate()}
            title="Check what would re-run, then confirm"
          >
            {retryPreview.isPending ? 'Checking…' : `Retry ${deferred.length} deferred`}
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
              disabled={fileInRoom.isPending}
              title="Sets the room AND the Room/Area text the export prints"
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                fileInRoom.mutate({ ids: [...selected], roomId: v === 'none' ? null : Number(v) })
                e.target.value = ''
              }}
            >
              <option value="">{fileInRoom.isPending ? 'Filing…' : 'File in room…'}</option>
              {(rooms.data?.rooms ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              <option value="none">— Unfile —</option>
            </select>

            <select
              className="k-insp-input"
              style={{ width: 190 }}
              defaultValue=""
              onChange={(e) => {
                const category = e.target.value
                if (!category) return
                recategorize.mutate({ ids: [...selected], category })
                e.target.value = ''
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
                {/* Two different promises. The photos line is reassurance --
                    nothing is destroyed. The renumber line is a WARNING, and
                    only on a claim that has actually been sent: line numbers
                    are positions (here and in the export), so removing a row
                    shifts every row beneath it, and the carrier's copy cites
                    the old ones. Silent on an unexported claim, where there is
                    no document to disagree with. */}
                <span className="k-claim-sub">
                  Photos stay on the claim.
                  {claim.data?.exported_at
                    ? ' Lines below these renumber — the export you already sent cites the old numbers.'
                    : ''}
                </span>
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
          {rows.error instanceof ApiError && rows.error.status >= 500
            ? 'The server could not return this claim’s items.'
            : 'Could not load items.'}
          {rows.error instanceof ApiError ? (
            <>
              {' '}
              HTTP {rows.error.status}
              {typeof rows.error.detail === 'string' ? ` — ${rows.error.detail}` : ''}
              {/* X-Request-ID is echoed on every response; quoting it is what
                  makes a 5xx traceable on the backend side. */}
              {rows.error.requestId ? (
                <>
                  {' · '}
                  <span className="k-portal-ref">Reference {rows.error.requestId}</span>
                </>
              ) : null}
            </>
          ) : null}{' '}
          <button
            type="button"
            className="k-btn k-btn--sm k-btn--ghost"
            onClick={() => void rows.refetch()}
            disabled={rows.isFetching}
          >
            {rows.isFetching ? 'Retrying…' : 'Retry'}
          </button>
        </p>
      ) : null}

      {rows.data ? (
        <div className={docked && openRow !== null ? 'k-grid-dock' : 'k-grid-dock k-grid-dock--off'}>
          <section className="k-grid" style={gridStyle}>
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

            <div ref={scrollRef} className="k-scroll" onScroll={onScroll}>
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
                      n={item.lineNo}
                      selected={selected.has(item.id)}
                      active={openRow === item.id}
                      onSelect={() => toggle(item.id)}
                      onOpen={() => setOpenRow(item.id)}
                      onRowClick={docked ? () => setOpenRow(item.id) : undefined}
                      pendingField={pending.get(item.id) ?? null}
                      categories={rules.data?.categories ?? []}
                      depRules={rules.data?.rules}
                      onNotice={setNotice}
                      onOverride={(body) => override.mutate({ id: item.id, body })}
                      onEditLine={(body) => editLine.mutate({ id: item.id, body })}
                      onSaveSource={(url) => saveSource.mutateAsync({ id: item.id, url })}
                      isNew={item.id === newRowId}
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
                  n={item.lineNo}
                  selected={selected.has(item.id)}
                  active={openRow === item.id}
                  onSelect={() => toggle(item.id)}
                  onOpen={() => setOpenRow(item.id)}
                    onRowClick={docked ? () => setOpenRow(item.id) : undefined}
                    pendingField={pending.get(item.id) ?? null}
                    categories={rules.data?.categories ?? []}
                    depRules={rules.data?.rules}
                    onNotice={setNotice}
                    onOverride={(body) => override.mutate({ id: item.id, body })}
                    onEditLine={(body) => editLine.mutate({ id: item.id, body })}
                    onSaveSource={(url) => saveSource.mutateAsync({ id: item.id, url })}
                    isNew={item.id === newRowId}
                    onAppend={
                      item.id === visible[visible.length - 1]?.id
                        ? () => addItem.mutate()
                        : undefined
                    }
                  />
                ))}
                {padBottom > 0 ? <div style={{ height: padBottom }} /> : null}
              </>
            )}
            </div>
          </section>

          {docked && openRow !== null ? (
            <ItemDrawer rowId={openRow} onClose={() => setOpenRow(null)} docked />
          ) : null}
        </div>
      ) : null}

      {rows.data ? (
        <>
          <footer className="k-footer">
            <span>
              Showing <strong style={{ color: 'var(--k-fg-2)' }}>{fmtInt(visible.length)}</strong> of{' '}
              {fmtInt(items.length)} items
              {rows.isFetchingNextPage ? ' · loading more…' : ''}
              {' · '}
              {saving ? 'Saving…' : 'All changes saved'}
              {/* The count comes from the rows actually rendered, never from the
                  API total alone -- a disagreement means rows are counted that
                  are not lines, and it is surfaced rather than papered over. */}
              {!countCheck.ok && !rows.hasNextPage ? (
                <span className="k-error">
                  {' · '}count mismatch: API reports {fmtInt(countCheck.apiCount)}, grid holds{' '}
                  {fmtInt(countCheck.rendered)} (highest line {fmtInt(countCheck.maxLineNo)})
                </span>
              ) : null}
            </span>
            <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: 'var(--k-fg-4)' }}>↑ ↓ navigate · ⏎ edit</span>
            </span>
          </footer>
        </>
      ) : null}

      {retryPlan ? (
        <div className="k-export-stage k-modal-stage">
          <div className="k-export-scrim" onClick={() => setRetryPlan(null)} />
          <div className="k-export-modal" style={{ maxWidth: 460 }}>
            <div className="k-export-hd">
              <div>
                <div className="k-modal-kicker">Retry deferred</div>
                <div className="k-modal-title">{claim.data?.name ?? claimId}</div>
              </div>
            </div>
            <div className="k-modal-body">
              <div className="k-modal-note">
                <strong>{fmtInt(retryPlan.eligible)}</strong> line
                {retryPlan.eligible === 1 ? '' : 's'} were deferred on capacity, not judged —
                the engine never looked at them. Re-running costs about{' '}
                <strong>{fmtInt(retryPlan.estimated_searches)}</strong> vendor searches.
                {retryPlan.skipped ? (
                  <>
                    {' '}
                    {fmtInt(retryPlan.skipped)} cannot be re-run (nothing to search) and are left
                    alone.
                  </>
                ) : null}
              </div>
              <span className="k-insp-hint">
                Reasons matched: {retryPlan.reasons.join(', ') || 'capacity defaults'}
              </span>
            </div>
            <div className="k-modal-foot">
              <button
                type="button"
                className="k-btn k-btn--ghost"
                onClick={() => setRetryPlan(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={retryRun.isPending}
                onClick={() => retryRun.mutate()}
              >
                {retryRun.isPending ? 'Re-queueing…' : `Retry ${fmtInt(retryPlan.eligible)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Undocked, the panel is a modal over the grid. */}
      {!docked && openRow !== null ? (
        <ItemDrawer rowId={openRow} onClose={() => setOpenRow(null)} />
      ) : null}

      {proposalsOpen ? (
        <ProposalsPanel claimId={claimId} onClose={() => setProposalsOpen(false)} />
      ) : null}

      {shareOpen ? (
        <ShareSheet claimId={claimId} items={items} onClose={() => setShareOpen(false)} />
      ) : null}

      {/* The first export is the one that matters: it stamps exported_at, and
          that date IS the Proof of Loss date. Re-downloads never move it, so
          this asks once and then gets out of the way. */}
      {confirmExport ? (
        <div className="k-stage-noteover" onClick={() => setConfirmExport(false)}>
          <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
            <div className="k-notemodal-hd">
              <div>
                <div className="k-notemodal-t">Generate the carrier export?</div>
                <div className="k-notemodal-s">
                  {fmtInt(claim.data?.item_count ?? 0)} line items ·{' '}
                  {claim.data?.claim_number ?? claimId}
                </div>
              </div>
              <button
                type="button"
                className="k-icon-btn"
                aria-label="Close"
                onClick={() => setConfirmExport(false)}
              >
                <Icon d={I.close} size={15} />
              </button>
            </div>

            <div className="k-notemodal-body">
              <p className="k-notemodal-lede">
                This is the finished document, not a preview. Generating it dates your{' '}
                <strong style={{ color: 'var(--k-fg-2)' }}>Proof of Loss</strong> as today, and
                that date is permanent — it is what the carrier reads as the day the schedule
                was produced.
              </p>
              <p className="k-notemodal-lede">
                You can re-download the file as often as you like afterwards, and keep editing
                the worksheet. Neither moves the date.
              </p>
            </div>

            <div className="k-notemodal-ft" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
              <button
                type="button"
                className="k-btn k-btn--ghost"
                onClick={() => setConfirmExport(false)}
              >
                Not yet
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={exporting}
                onClick={() => void runExport()}
              >
                {exporting ? 'Preparing…' : 'Generate export'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * "How this was calculated" for the % Depr. cell. Every value shown is
 * server-authored -- the item's own method and rule version, and the class's
 * schedule from GET /v1/depreciation-rules. Nothing here derives a rate, a
 * useful life or a cap (rule 20).
 */
function DepExplainer({
  item,
  depRules,
  onRelease,
  onClose,
}: {
  item: NumberedItem
  depRules?: Record<string, unknown>
  /** Drop the adjuster's rate and go back to the schedule. */
  onRelease: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  const schedule = item.category ? (depRules?.[item.category] as Record<string, unknown>) : undefined

  return (
    <div ref={ref} className="k-pop k-dep-pop">
      <div className="k-pop-hd">
        <span>How this was calculated</span>
      </div>
      <dl className="k-dep-meta">
        <dt>Rate</dt>
        <dd className="k-mono">{fmtPct(item.depreciation_pct)}</dd>
        <dt>Method</dt>
        <dd>{item.depreciation_method?.replace('_', ' ') ?? '—'}</dd>
        <dt>Content class</dt>
        <dd>{item.category ?? '—'}</dd>
        <dt>Age</dt>
        <dd className="k-mono">{item.age_years ?? 0}</dd>
        {schedule
          ? Object.entries(schedule).map(([key, value]) => (
              <React.Fragment key={key}>
                <dt>{key.replace(/_/g, ' ')}</dt>
                <dd className="k-mono">
                  {value === null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </dd>
              </React.Fragment>
            ))
          : null}
      </dl>
      {/* "Why is this 55%" and "how do I put it back" are the same question,
          so the release lives here rather than behind a gesture.

          It is a BUTTON, not "clear the cell": focusing a numeric cell blanks
          it, so there is nothing left to delete and blur restores the old value
          -- an adjuster trying to clear their way out would find the rate
          springing back with no explanation. */}
      <div className="k-dep-foot">
        {isManualDepr(item) ? (
          <>
            <p style={{ margin: '0 0 8px' }}>
              This rate is yours, not the schedule’s. It is held through later
              class and age changes.
            </p>
            <button
              type="button"
              className="k-btn k-btn--ghost k-btn--sm"
              onClick={() => {
                onRelease()
                onClose()
              }}
            >
              Back to the schedule
            </button>
          </>
        ) : (
          <p style={{ margin: 0 }}>
            Type a percentage into the cell to override the schedule on this line.
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * The Link column. An engine comp wins; otherwise the adjuster's own proof URL;
 * otherwise the dashed "+ add" chip that captures one. A manually priced line
 * must be able to carry its own substantiation into the export's Source column.
 */
function SourceCell({
  item,
  onSave,
}: {
  item: NumberedItem
  onSave: (url: string | null) => Promise<unknown>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  /**
   * The committed URL, held from the moment the mutation fires until the
   * server's value arrives. Without this the cell passes through
   * editing=false + prop-still-stale, which renders the empty "+ add" chip --
   * the commit -> empty -> refetch -> value flash. The in-between state must
   * show what was committed.
   */
  const [committed, setCommitted] = useState<string | null>(null)
  /** Escape unmounts the input, which fires blur -- without this the cancel
      would save the very text the adjuster just abandoned. */
  const cancelled = useRef(false)
  const comp = item.alternative_sources?.[0]

  // Release the hold once the server's value matches what we sent.
  useEffect(() => {
    if (committed !== null && (item.manual_source_url ?? '') === committed) setCommitted(null)
  }, [item.manual_source_url, committed])

  /** What the cell shows: the in-flight value first, then the stored one. */
  const shownUrl = committed !== null ? committed || null : item.manual_source_url

  const save = () => {
    if (cancelled.current) {
      cancelled.current = false
      setEditing(false)
      return
    }
    const url = draft.trim()
    setEditing(false)
    // Nothing typed and nothing stored: a blur here must not fire a pointless
    // clear, which would look like a failed save.
    if (!url && !item.manual_source_url) return
    const next = url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null
    // Render it immediately; only a rejection takes it back.
    setCommitted(next ?? '')
    void onSave(next).catch(() => setCommitted(null))
  }

  if (editing) {
    return (
      <input
        className="k-src-input"
        autoFocus
        value={draft}
        placeholder="Paste URL"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            cancelled.current = true
            e.currentTarget.blur()
          }
        }}
      />
    )
  }

  if (comp?.link) {
    return (
      <a
        className="k-src-link"
        href={comp.link}
        target="_blank"
        rel="noreferrer noopener"
        title={`${comp.source ?? 'Comp'} — ${comp.title ?? ''}`}
      >
        Link
      </a>
    )
  }

  if (shownUrl) {
    return (
      <a
        className="k-src-link"
        href={shownUrl}
        target="_blank"
        rel="noreferrer noopener"
        title={`Preparer-supplied source · ${shownUrl}`}
      >
        Link
      </a>
    )
  }

  // A real comp always wins, so a row that HAS engine comps never offers the
  // chip -- even when comp[0] carries no resolved merchant URL.
  if (item.alternative_sources?.length) return <Dash />

  return (
    <button
      type="button"
      className="k-src-add"
      title="Paste a source URL for this price"
      onClick={() => {
        setDraft('')
        setEditing(true)
      }}
    >
      + add
    </button>
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
  pendingField,
  categories,
  depRules,
  onSelect,
  onOpen,
  onRowClick,
  onOverride,
  onEditLine,
  onSaveSource,
  onAppend,
  onNotice,
  isNew,
}: {
  item: NumberedItem
  n: number
  selected: boolean
  active: boolean
  /** Which single field is awaiting the server, if any. */
  pendingField: string | null
  categories: string[]
  /** The server's depreciation schedule, rendered verbatim in the explainer. */
  depRules?: Record<string, unknown>
  onSelect: () => void
  onOpen: () => void
  /** Set only while the panel is docked: the whole row becomes the target. */
  onRowClick?: () => void
  onOverride: (body: OverrideBody) => void
  onEditLine: (body: Record<string, string | null>) => void
  onSaveSource: (url: string | null) => Promise<unknown>
  /** Client-side rejects (a rate outside 0-100) report the same way as 422s. */
  onNotice: (message: string) => void
  /** Set only on the last row: Enter there appends a new line. */
  onAppend?: () => void
  /** Just created in this session -- highlighted with the header grey. */
  isNew?: boolean
}) {
  const [compsOpen, setCompsOpen] = useState(false)
  const [depOpen, setDepOpen] = useState(false)
  const [pickedCategory, setPickedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (pickedCategory !== null && item.category === pickedCategory) setPickedCategory(null)
  }, [item.category, pickedCategory])
  const unpriced = item.status === 'needs_manual'
  // Capacity waits are NOT adjuster work -- quiet pending state, never amber.
  const waiting = Boolean(unpriced && item.manual_reason && CAPACITY_REASONS.has(item.manual_reason))
  /**
   * Amber is reserved for special limits -- the coverage-cap cue -- and nothing
   * else. manual_class is the payload's signal for the appraisal classes
   * (Jewelry, Firearms, Fine Arts, Furs); it is never derived from `cat`.
   * Tinting every unpriced row amber falsely flagged blank new lines as
   * Jewelry-class.
   */
  const specialLimits = item.manual_reason === 'manual_class'
  const depAmount = item.depreciation_amount
  // Depreciation is server-owned, so it spins only while age or class -- the
  // two inputs that drive it -- are actually in flight.
  const depRecalculating =
    pendingField === 'age_years' ||
    pendingField === 'category' ||
    pendingField === 'dep_manual' ||
    pendingField === 'depreciation_method'
  const deprManual = isManualDepr(item)
  /**
   * The four server-derived money cells while a write is in flight. They keep
   * their last values -- blanking them was the old flash -- but read as
   * not-yet-settled, which is honest for one round trip and dishonest for
   * nothing at all. Never a computed guess: rule 20.
   */
  const moneyStale = pendingField !== null

  return (
    <div
      data-row-id={item.id}
      className={`k-row${specialLimits ? ' k-row--manual' : ''}${isNew ? ' k-row--new' : ''}${selected ? ' k-row--sel' : ''}${active ? ' k-row--active' : ''}`}
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

      {/* Identity is always correctable, priced or not. These route through
          PATCH /v1/claim_items -- descriptive only: no valuation change, no
          overridden flag, comps untouched. Only rcv goes through override. */}
      <div className="k-c k-c--desc">
        <EditableCell
          value={item.description ?? ''}
          placeholder="Describe the item…"
          onCommit={(next) => onEditLine({ description: next || null })}
          onEnterPastEnd={onAppend}
        />
        {waiting ? <span className="k-pricing-chip">Pricing</span> : null}
      </div>

      <div className="k-c k-c--mfr">
        <EditableCell
          value={item.make_mfr ?? ''}
          placeholder="—"
          onCommit={(next) => onEditLine({ make_mfr: next || null })}
        />
      </div>

      <div className="k-c k-c--model">
        <EditableCell
          value={item.model_number ?? ''}
          placeholder="—"
          mono
          onCommit={(next) => onEditLine({ model_number: next || null })}
        />
      </div>

      {/* Content class is a picker in the design; read-state keeps the caret
          affordance so the column reads the same, without opening a menu. */}
      <div className="k-c k-c--cat">
        {/* A category-only edit KEEPS the comps -- the replacement cost is
            unchanged and still comp-supported. It does re-run depreciation. */}
        <span className="k-selectwrap">
          <select
            className="k-cell k-cell--select"
            /* Show the picked class immediately; the prop is stale until the
               row re-reads, and snapping back to the old value mid-flight is
               the same commit -> empty -> value flash. */
            value={pickedCategory ?? item.category ?? ''}
            disabled={pendingField === 'category'}
            /* A class change IS a valuation edit server-side (4eafa04): the
               engine recomputes the rate and re-evaluates manual_reason, so no
               age_years tag-along is needed to trigger it. */
            onChange={(e) => {
              setPickedCategory(e.target.value)
              onOverride({ category: e.target.value })
            }}
          >
            {item.category ? null : <option value="">—</option>}
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Icon d={I.chevdown} size={10} />
        </span>
      </div>

      {/* Every money cell below is the server's figure, read verbatim. */}
      <div className="k-c k-c--rcv">
        <span className="k-money-sym">$</span>
        <EditableCell
          value={item.rcv === null ? '' : String(item.rcv)}
          numeric
          decimals
          align="right"
          pending={pendingField === 'rcv'}
          placeholder="0.00"
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
      <div className={`k-c k-c--ext k-mono${moneyStale ? ' k-cell--stale' : ''}`}>
        <Money value={item.ext_cost} />
      </div>
      <div className={`k-c k-c--tax k-mono${moneyStale ? ' k-cell--stale' : ''}`}>
        <Money value={item.tax} />
      </div>
      <div
        className={`k-c k-c--rcvtax k-mono${item.alternative_sources?.length ? ' k-c--hascomps' : ''}${moneyStale ? ' k-cell--stale' : ''}`}
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
          value={String(item.age_years ?? 0)}
          numeric
          align="right"
          pending={pendingField === 'age_years'}
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

      {/* Depreciation is NEVER computed here. The adjuster may override the
          RATE, but $ Depr. and ACV come back from the server -- spinner until
          they do. Clearing the cell releases the lock back to the schedule. */}
      <div
        className={`k-c k-c--dep k-mono${depRecalculating ? ' k-cell--pending' : ''}${
          deprManual ? ' k-c--depmanual' : ''
        }`}
        style={{ position: 'relative' }}
      >
        {depRecalculating ? (
          <span className="k-dep-spin" title="Recalculating on the server…" />
        ) : (
          <EditableCell
            value={deprCellValue(item.depreciation_pct)}
            numeric
            align="right"
            mono
            placeholder="—"
            disabled={!deprEditable(item)}
            title={
              !deprEditable(item)
                ? 'Unpriced — set a price before entering a rate'
                : deprManual
                  ? 'Your rate, held against later class and age changes. Use “How this was calculated” to put it back on the schedule.'
                  : 'Type a percentage to override the schedule (55 for 55%). The server recalculates $ Depr. and ACV.'
            }
            onCommit={(next) => {
              const entry = parseDeprPercent(next)
              if (!entry.ok) {
                onNotice(DEPR_ERROR_COPY[entry.reason])
                return
              }
              if (!deprChanged(item, entry.fraction)) return
              onOverride(deprOverrideBody(entry.fraction))
            }}
          />
        )}
        {!depRecalculating && item.depreciation_pct !== null ? (
          <>
            <button
              type="button"
              className="k-icon-btn k-dep-info"
              title="How this was calculated"
              onClick={(e) => {
                e.stopPropagation()
                setDepOpen((o) => !o)
              }}
            >
              <Icon d={I.info} size={11} />
            </button>
            {depOpen ? (
              <DepExplainer
                item={item}
                depRules={depRules}
                onRelease={() => onOverride(deprOverrideBody(null))}
                onClose={() => setDepOpen(false)}
              />
            ) : null}
          </>
        ) : null}
      </div>
      <div className={`k-c k-c--depamt k-mono${moneyStale ? ' k-cell--stale' : ''}`}>
        {/* A positive amount WITHHELD -- ACV already subtracts it, so a minus
            sign here would read as a second subtraction. Never -$0.00. */}
        {depAmount === null || depAmount === undefined ? (
          <Dash />
        ) : (
          fmtUSD(Math.max(0, depAmount))
        )}
      </div>
      <div className={`k-c k-c--acv k-mono k-acv${moneyStale ? ' k-cell--stale' : ''}`}>
        <Money value={item.acv_total_incl} />
      </div>

      <div className="k-c k-c--src">
        <SourceCell item={item} onSave={onSaveSource} />
      </div>
    </div>
  )
}
