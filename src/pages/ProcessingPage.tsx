import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { fmtInt, fmtUSD } from '../lib/format'
import type { ClaimSummary } from '../lib/types'

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

  const counts = claim.data?.status_counts
  const inFlight = counts?.processing ?? 0
  // Everything that has reached a terminal state. needs_manual is DONE, not
  // failed: it is a line waiting on a human, which is a normal outcome.
  const settled =
    (counts?.completed ?? 0) +
    (counts?.needs_manual ?? 0) +
    (counts?.failed ?? 0) +
    (counts?.overridden ?? 0)
  const total = settled + inFlight
  const pct = total > 0 ? Math.round((settled / total) * 100) : 0
  const done = total > 0 && inFlight === 0

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
    return (
      <div className="k-intake">
        <AppHeader />
        <div className="k-intake-body">
          <div className="k-empty">
            <h2>That claim is gone</h2>
            <Link to="/claims" className="k-btn">
              My claims
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const rows: [string, number, string][] = [
    ['Priced', counts?.completed ?? 0, 'ok'],
    ['Needs your price', counts?.needs_manual ?? 0, 'warn'],
    ['You overrode', counts?.overridden ?? 0, 'quiet'],
    ['Failed', counts?.failed ?? 0, (counts?.failed ?? 0) > 0 ? 'danger' : 'quiet'],
  ]

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
            <span style={{ color: 'var(--k-fg-3)' }}> items priced</span>
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
          <div style={{ marginTop: 22, maxWidth: 520 }}>
            {rows.map(([label, value, tone], i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  fontSize: 13,
                  borderBottom: i < rows.length - 1 ? '1px solid var(--k-line)' : 0,
                }}
              >
                <span style={{ color: 'var(--k-fg-3)' }}>{label}</span>
                <span
                  className="k-mono"
                  style={{
                    fontWeight: 600,
                    color:
                      value === 0
                        ? 'var(--k-fg-4)'
                        : tone === 'ok'
                          ? 'var(--k-ok)'
                          : tone === 'warn'
                            ? 'var(--k-warn)'
                            : tone === 'danger'
                              ? 'var(--k-danger)'
                              : 'var(--k-fg-3)',
                  }}
                >
                  {fmtInt(value)}
                </span>
              </div>
            ))}
          </div>

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
