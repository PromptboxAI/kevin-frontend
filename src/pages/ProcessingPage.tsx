import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimMissing from '../components/ClaimMissing'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { fmtInt, fmtUSD } from '../lib/format'
import { fetchAllClaimItems } from '../lib/claim-items-all'
import type { ClaimItem, ClaimSummary, StatusCounts } from '../lib/types'

/**
 * Kevin working, while it works.
 *
 * Before this screen, Process dropped the adjuster straight onto the worksheet
 * and rows filled in silently. After a 52-set run that is a long unexplained
 * wait whose first impression is an inventory that looks wrong because it is
 * half-built.
 *
 * Every figure here is the REAL tally from `status_counts` on the claim. The
 * design's `processing.jsx` is a 90-second animation driven by wall time --
 * deliberately not ported, because a progress bar that is lying is worse than
 * no progress bar. There is no per-claim jobs endpoint; `/v1/jobs/*` is
 * admin-only worker health.
 */

/**
 * The run this screen is watching, handed over by staging's Process.
 *
 * `before` is the claim's tallies read just before the run started, so every
 * figure below can be THIS run's -- the lines already on the claim are not
 * part of it. A direct visit (no state) falls back to the claim-wide tally.
 */
export type ProcessingRun = {
  created: number
  skipped: number
  before: StatusCounts | null
}

/** Polling is cheap, but not free -- back off once the burst is over. */
function pollDelay(elapsedMs: number): number {
  if (elapsedMs < 30_000) return 2000
  if (elapsedMs < 120_000) return 4000
  return 8000
}

/** A run that has not moved in this long is stuck, not slow. */
const STALL_MS = 90_000

/** How many resolved lines the feed keeps on screen. */
const FEED_MAX = 40

export default function ProcessingPage() {
  const { claimId = '' } = useParams()
  const navigate = useNavigate()
  const startedAt = useRef(Date.now())
  const [delay, setDelay] = useState(2000)
  /** Last time the done-count actually changed. */
  const lastProgressAt = useRef(Date.now())
  const lastDone = useRef(-1)

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    refetchInterval: delay,
    retry: (count, err) => !(err instanceof ApiError && err.isMissing) && count < 2,
  })

  /**
   * THE LIVE FEED — lines appearing as they resolve.
   *
   * The design has one and the port dropped it, leaving a counter: "47 of 161
   * priced" tells you the machine is alive and nothing about what it is
   * finding. Watching the actual items land is the difference between waiting
   * and seeing your claim get built, and it is the first chance to notice
   * Vision is reading things wrongly — before 160 rows exist.
   *
   * Built from a DIFF, not from a timestamp. Items are all created at promote
   * time, so `created_at` orders them by nothing useful; what changes as a line
   * resolves is its `status`. Each poll, any item that has reached a terminal
   * state since the last poll is pushed onto the front of the feed. That makes
   * "newest on top" literally true, with no new field from the backend.
   */
  const feedQuery = useQuery({
    queryKey: ['processing-feed', claimId],
    /*
     * PAGED, not the first 100.
     *
     * `limit=100` was silently truncating the read: on a 158-item run the
     * resolved lines can sit entirely past the first page, so the feed showed
     * "waiting for the first line" while the counter beside it said 26 were
     * priced. The two numbers came from different reads of the same claim and
     * only one of them was complete.
     *
     * Same cap, same symptom, as the worksheet and the photos tab -- which is
     * why the paging lives in one shared fetcher rather than being rewritten
     * per screen.
     */
    queryFn: () => fetchAllClaimItems(claimId),
    refetchInterval: delay,
    enabled: !!claimId,
  })

  const seen = useRef<Set<number>>(new Set())
  const [feed, setFeed] = useState<ClaimItem[]>([])
  useEffect(() => {
    const items = feedQuery.data?.items ?? []
    if (items.length === 0) return
    const landed = items.filter((i) => i.status !== 'processing' && !seen.current.has(i.id))
    if (landed.length === 0) return
    for (const i of landed) seen.current.add(i.id)
    // Newest first, and bounded: this runs for minutes on a large claim and an
    // unbounded list would grow a DOM node per line for the whole run.
    setFeed((prev) => [...landed.reverse(), ...prev].slice(0, FEED_MAX))
  }, [feedQuery.data])

  const run = (useLocation().state as { run?: ProcessingRun } | null)?.run ?? null
  const all = claim.data?.status_counts
  /** This run's share of a bucket: now, minus what was there before it. */
  const mine = (k: keyof StatusCounts) =>
    run?.before ? Math.max(0, (all?.[k] ?? 0) - run.before[k]) : (all?.[k] ?? 0)
  const counts: StatusCounts | undefined = all && {
    processing: all.processing,
    completed: mine('completed'),
    needs_manual: mine('needs_manual'),
    failed: mine('failed'),
    overridden: mine('overridden'),
  }
  const inFlight = counts?.processing ?? 0
  // Everything that has reached a terminal state. needs_manual is DONE, not
  // failed: it is a line waiting on a human, which is a normal outcome.
  const finished =
    (counts?.completed ?? 0) +
    (counts?.needs_manual ?? 0) +
    (counts?.failed ?? 0) +
    (counts?.overridden ?? 0)
  const total = run?.before ? run.created : finished + inFlight
  const settled = Math.min(finished, total)
  const pct = total > 0 ? Math.round((settled / total) * 100) : 0
  const done = total > 0 && (settled >= total || inFlight === 0)
  /** A run that made no line items -- said plainly, never "0 of 0 priced". */
  const nothingNew = run !== null && run.created === 0

  useEffect(() => {
    setDelay(pollDelay(Date.now() - startedAt.current))
    if (settled !== lastDone.current) {
      lastDone.current = settled
      lastProgressAt.current = Date.now()
    }
  }, [settled, claim.dataUpdatedAt])

  const stalled = !done && Date.now() - lastProgressAt.current > STALL_MS

  // Hand off on its own once the work is finished. The adjuster asked for an
  // inventory, not for a progress screen.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => navigate(`/claims/${claimId}`, { replace: true }), 1400)
    return () => clearTimeout(t)
  }, [done, claimId, navigate])

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  /**
   * Outcome buckets, in the design's colour semantics.
   *
   * AMBER IS NOT USED HERE. Rule 6 reserves it for special-limits classes, and
   * a `needs_manual` line is not a warning -- it is a normal terminal state
   * waiting on a human price (rule 12). Colouring it amber would teach the
   * adjuster that amber means "unpriced", which is exactly the signal the
   * worksheet needs it NOT to mean.
   */
  const rows: [string, number, 'ok' | 'neutral' | 'danger'][] = [
    ['Priced', counts?.completed ?? 0, 'ok'],
    ['Needs your price', counts?.needs_manual ?? 0, 'neutral'],
    ['You overrode', counts?.overridden ?? 0, 'neutral'],
    ['Failed', counts?.failed ?? 0, 'danger'],
  ]

  if (nothingNew) {
    return (
      <div className="k-intake">
        <AppHeader />
        <div className="k-intake-body">
          <section className="k-proc-hero">
            <h1 className="k-proc-h1">No new line items</h1>
            <p className="k-proc-sub" style={{ maxWidth: 560 }}>
              This upload didn’t add anything to the worksheet
              {run.skipped
                ? ` — ${fmtInt(run.skipped)} ${run.skipped === 1 ? 'photo was' : 'photos were'} in no set`
                : ''}
              . Nothing already on the claim changed, and every photo stays on it.
            </p>
            <div className="k-proc-cta" style={{ marginTop: 22 }}>
              <Link to={`/claims/${claimId}`} className="k-btn k-btn--lg">
                Open worksheet →
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <section className="k-proc-hero">
          {/* The dot has always carried the state's colour -- navy working,
              mint done -- while the words beside it stayed grey, so the one
              line saying what is happening was the quietest thing on screen. */}
          <div className={`k-proc-eyebrow${done ? ' k-proc-eyebrow--done' : ''}`}>
            <span className={`k-pulse ${done ? 'k-pulse--done' : ''}`} />
            <span>{done ? 'Kevin finished' : 'Kevin is working'}</span>
          </div>

          <h1 className="k-proc-h1">
            <span
              className="k-mono"
              style={{
                color: 'var(--k-accent)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtInt(settled)}
            </span>
            <span style={{ color: 'var(--k-fg-3)' }}> of </span>
            <span className="k-mono" style={{ color: 'var(--k-fg)' }}>
              {fmtInt(total)}
            </span>
            <span style={{ color: 'var(--k-fg-3)' }}>
              {' '}
              {run?.before ? 'new ' : ''}
              {total === 1 ? 'item' : 'items'} priced
            </span>
          </h1>

          <p className="k-proc-sub">
            <span className="k-mono">{pct}%</span> complete
            {inFlight > 0 ? (
              <>
                {' '}
                · <span className="k-mono">{fmtInt(inFlight)}</span> still pricing
              </>
            ) : null}
            {claim.data?.total_rcv ? <> · {fmtUSD(claim.data.total_rcv)} so far</> : null}
          </p>

          <div className="k-progress" style={{ width: '100%', maxWidth: 520, marginTop: 14 }}>
            <div className="k-progress-bar" style={{ width: `${pct}%` }} />
          </div>

          {/* The lines themselves, as they land. */}
          <section className="k-proc-stats" style={{ marginTop: 22, maxWidth: 520 }}>
            <div className="k-proc-sec-hd">
              <span>Live feed</span>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                Items as they resolve · newest on top
              </span>
            </div>
            <div className="k-proc-feed-list">
              {feed.length === 0 ? (
                <div
                  style={{
                    padding: '22px 14px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--k-fg-4)',
                    fontFamily: 'var(--k-font-mono)',
                  }}
                >
                  {done ? 'Nothing landed in this run.' : 'Waiting for the first line…'}
                </div>
              ) : (
                feed.map((it) => (
                  <div key={it.id} className="k-feed-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {/* Rule 2b: a no_query line arrives with an EMPTY
                            description. That is a blank to be typed into, not
                            an error, so it reads as one. */}
                        {it.description?.trim() || 'Not identified — describe it on the worksheet'}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          marginTop: 3,
                          fontSize: 11,
                          color: 'var(--k-fg-4)',
                        }}
                      >
                        {it.make_mfr ? <span>{it.make_mfr}</span> : null}
                        {it.model_number ? <span className="k-mono">{it.model_number}</span> : null}
                        {it.category ? <span>{it.category}</span> : null}
                      </div>
                    </div>
                    {/* Rule 12: an unpriced line is BLANK, not badged. */}
                    <span
                      className="k-mono"
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: it.rcv_total_incl == null ? 'var(--k-fg-4)' : 'var(--k-fg)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {it.rcv_total_incl == null ? '—' : fmtUSD(it.rcv_total_incl)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Terminal buckets, not sequential stages. These are outcomes a line
              can land in, and drawing them as a pipeline would imply an order
              that does not exist. */}
          <section className="k-proc-stats" style={{ marginTop: 22, maxWidth: 520 }}>
            <div className="k-proc-sec-hd">
              <span>Outcomes</span>
            </div>
            <div style={{ padding: '4px 14px 12px' }}>
              {rows.map(([label, value, tone], i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    fontSize: 12.5,
                    borderBottom: i < rows.length - 1 ? '1px solid var(--k-line)' : 0,
                  }}
                >
                  <span style={{ color: 'var(--k-fg-3)' }}>{label}</span>
                  <span
                    className="k-mono"
                    style={{
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      // A zero is not an outcome worth colouring.
                      color:
                        value === 0
                          ? 'var(--k-fg-4)'
                          : tone === 'ok'
                            ? 'var(--k-ok)'
                            : tone === 'danger'
                              ? 'var(--k-danger)'
                              : 'var(--k-fg-2)',
                    }}
                  >
                    {fmtInt(value)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {stalled ? (
            <div className="k-share-snapnote" style={{ marginTop: 18, maxWidth: 520 }}>
              <Icon d={I.info} size={13} />
              <span>
                This is taking longer than usual. The lines already priced are safe on the
                worksheet — you can open it and keep working while the rest finish.
              </span>
            </div>
          ) : null}

          <div className="k-proc-cta" style={{ marginTop: 22 }}>
            {/* Rows exist as they land, so the worksheet is useful before the
                run ends. Never blocked -- waiting is the adjuster's choice. */}
            <Link to={`/claims/${claimId}`} className="k-btn k-btn--lg">
              {done
                ? 'Open worksheet →'
                : settled > 0
                  ? `Open worksheet so far (${fmtInt(settled)}) →`
                  : 'Open worksheet →'}
            </Link>
            <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
              {done
                ? 'Taking you there…'
                : 'Pricing continues if you leave this page or close the tab.'}
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
