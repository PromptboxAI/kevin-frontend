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
import { groupByDay, lineLabel, nextOffset } from '../lib/claim-events-rules'
import type { ItemEvent } from '../lib/item-events'
import type { ClaimSummary } from '../lib/types'

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
 * ⚠️ ITEM EVENTS ONLY, by the shape of the data: `claim_item_events` is the
 * one audit table, so a claim being created, exported or shared is not in this
 * stream. The heading says "the lines on this claim" rather than "this claim"
 * so nobody reads a missing export as an unrecorded one. Folding those in
 * means building an event source, which is the backend's separate piece of
 * work.
 *
 * A 404 on this route means the claim is not yours, never an empty history --
 * the backend looks the claim up first precisely so those two cannot be
 * confused.
 */
/** The server's max is 200; a page is a screenful plus room to scroll. */
const PAGE = 100

type ClaimEvent = ItemEvent & { claim_item_id: number; claim_item_description?: string | null }
type EventPage = { items: ClaimEvent[]; count: number; total: number | null; limit: number }

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
    getNextPageParam: (last, pages) =>
      nextOffset(pages.reduce((n, p) => n + p.items.length, 0), last),
    // A 404 is "not your claim"; retrying it three times cannot change that.
    retry: retryUnlessMissing,
    staleTime: 30_000,
  })

  const all = useMemo(
    () => events.data?.pages.flatMap((p) => p.items) ?? [],
    [events.data],
  )
  const days = useMemo(() => groupByDay(all), [all])
  /** The claim's LIFETIME count, not this page's -- they are different numbers. */
  const total = events.data?.pages[0]?.total ?? null

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

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
                Every change to the lines on this claim, newest first — what Kevin did, and what
                you changed.
              </p>
            </div>
            {total ? (
              <span style={{ fontSize: 12, color: 'var(--k-fg-4)' }}>
                {fmtInt(total)} {total === 1 ? 'entry' : 'entries'}
              </span>
            ) : null}
          </div>

          {events.error ? (
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
                  {day.events.map((event) => (
                    <HistoryRow
                      key={event.id}
                      event={event}
                      /* The line this belongs to, named from the event itself. */
                      item={
                        <Link
                          className="k-audit-line"
                          to={`/claims/${encodeURIComponent(claimId)}`}
                          title="Open the worksheet"
                        >
                          {lineLabel(event)}
                        </Link>
                      }
                    />
                  ))}
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
                  {events.isFetchingNextPage
                    ? 'Loading…'
                    : total != null
                      ? `Show older (${fmtInt(total - all.length)})`
                      : 'Show older'}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
