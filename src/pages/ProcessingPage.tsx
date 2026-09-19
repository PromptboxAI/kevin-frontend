import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import ClaimMissing from '../components/ClaimMissing'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { fmtInt, fmtUSD } from '../lib/format'
import type { ClaimSummary, StatusCounts } from '../lib/types'

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
          <div className="k-proc-eyebrow">
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
