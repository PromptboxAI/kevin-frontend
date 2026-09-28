import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Alert from '../components/Alert'
import ClaimMissing from '../components/ClaimMissing'
import ClaimTabs from '../components/ClaimTabs'
import { HistoryRow } from '../components/ItemHistory'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import { fmtInt } from '../lib/format'
import { numberRows } from '../lib/rows'
import { claimLevelCount, groupByDay, itemLabel } from '../lib/claim-events-rules'
import type { ItemRef } from '../lib/claim-events-rules'
import type { ItemEvent } from '../lib/item-events'
import type { ClaimItemListResponse, ClaimSummary } from '../lib/types'

/**
 * Screen 17 — the claim's audit trail. Who changed what, when.
 *
 * Rule 5: a single-pane timeline, never a collaboration tool. There is no
 * thread, no @mention and no reply; what makes this worth having is that an
 * adjuster can show a carrier exactly how a number got where it is.
 *
 * ONE DESCRIBER. Every line is rendered by `describeEvent` through the same
 * `HistoryRow` the item drawer uses, so a sentence does not change meaning
 * depending on where it is read. What this page adds is arrangement: by day,
 * newest first, with the line each event belongs to.
 *
 * `GET /v1/claims/{id}/events` is new (backend prompt 5). Until it is
 * deployed the call 404s, and a 404 here means "not shipped yet", NOT "this
 * claim has no history" -- saying "nothing recorded" over a missing route
 * would tell an adjuster their audit trail is empty, which is the one lie an
 * audit trail cannot afford.
 */
const PAGE = 100

type ClaimEvent = ItemEvent & { claim_item_id: number | null }
type EventPage = { items: ClaimEvent[]; count: number; limit: number; offset?: number }

export default function AuditPage() {
  const { claimId = '' } = useParams()

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    retry: retryUnlessMissing,
  })

  const events = useInfiniteQuery({
    queryKey: ['claim-events', claimId],
    queryFn: ({ pageParam }) =>
      api.get<EventPage>(
        `/v1/claims/${encodeURIComponent(claimId)}/events?limit=${PAGE}&offset=${pageParam}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const seen = pages.reduce((n, p) => n + p.items.length, 0)
      return seen < last.count ? seen : undefined
    },
    // A missing ROUTE is not a missing claim: do not spend three retries on it.
    retry: retryUnlessMissing,
    staleTime: 30_000,
  })

  /**
   * The claim's rows, only to name the lines. Line numbers are assigned by
   * `numberRows` over the whole set, exactly as the worksheet assigns them --
   * an event pointing at "#0042" has to mean the same row on both screens.
   */
  const items = useQuery({
    queryKey: ['claim-items-for-audit', claimId],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=500`,
      ),
    staleTime: 60_000,
  })

  const byId = useMemo(() => {
    const map = new Map<number, ItemRef>()
    for (const row of numberRows(items.data?.items ?? []))
      map.set(row.id, { lineNo: row.lineNo, description: row.description })
    return map
  }, [items.data])

  const all = useMemo(
    () => events.data?.pages.flatMap((p) => p.items) ?? [],
    [events.data],
  )
  const days = useMemo(() => groupByDay(all), [all])
  const total = events.data?.pages[0]?.count ?? 0

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const notShippedYet = events.error instanceof ApiError && events.error.isMissing

  return (
    <div className="k-shell">
      <AppHeader />
      <div className="k-claim-wrap">
        <ClaimTabs
          active="Notes & audit"
          claimId={claimId}
          itemCount={claim.data?.item_count}
          photoCount={claim.data?.photo_count}
        />

        <div className="k-audit">
          <div className="k-adm-sec-hd" style={{ marginBottom: 14 }}>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontWeight: 400,
                  fontSize: 26,
                  letterSpacing: '-0.022em',
                  margin: '0 0 4px',
                }}
              >
                Notes &amp; audit
              </h1>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
                Every change on this claim, newest first — what Kevin did, and what you changed.
              </p>
            </div>
            {total ? (
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
                {fmtInt(total)} {total === 1 ? 'entry' : 'entries'}
                {claimLevelCount(all) ? ` · ${fmtInt(claimLevelCount(all))} claim-level` : ''}
              </span>
            ) : null}
          </div>

          {notShippedYet ? (
            <Alert tone="info" title="The claim-wide trail is still being built">
              Each line's own history is complete and readable now — open any row from the
              worksheet and expand History. This page joins them into one timeline as soon as the
              API can return them together.
            </Alert>
          ) : events.error ? (
            <Alert tone="error" title="Could not load the audit trail">
              {events.error instanceof Error ? events.error.message : 'Try again in a moment.'}
            </Alert>
          ) : events.isPending ? (
            <p className="k-note">Reading…</p>
          ) : all.length === 0 ? (
            /* A claim with no events is genuinely possible -- one created and
               never processed -- and is not the same as a missing route. */
            <p className="k-note">
              Nothing recorded on this claim yet. Entries appear as photos are processed and lines
              are edited.
            </p>
          ) : (
            <>
              {days.map((day) => (
                <section key={day.key} className="k-audit-day">
                  <div className="k-audit-day-h">{day.label}</div>
                  {day.events.map((event) => {
                    const label = itemLabel(event.claim_item_id, byId)
                    return (
                      <HistoryRow
                        key={event.id}
                        event={event}
                        /* The line this belongs to, and a way to open it.
                           A claim-level event has none, and says so by
                           carrying nothing rather than a placeholder. */
                        item={
                          label ? (
                            event.claim_item_id != null && byId.has(event.claim_item_id) ? (
                              <Link
                                className="k-audit-line"
                                to={`/claims/${encodeURIComponent(claimId)}`}
                                title="Open the worksheet"
                              >
                                {label}
                              </Link>
                            ) : (
                              <span className="k-audit-line k-audit-line--gone">{label}</span>
                            )
                          ) : (
                            <span className="k-audit-line k-audit-line--claim">This claim</span>
                          )
                        }
                      />
                    )
                  })}
                </section>
              ))}

              {events.hasNextPage ? (
                <button
                  type="button"
                  className="k-btn k-btn--ghost"
                  style={{ marginTop: 12 }}
                  disabled={events.isFetchingNextPage}
                  onClick={() => void events.fetchNextPage()}
                >
                  {events.isFetchingNextPage ? 'Loading…' : `Show older (${fmtInt(total - all.length)})`}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
