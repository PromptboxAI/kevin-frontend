import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { HistoryRow } from '../components/ItemHistory'
import { I, Icon } from '../components/Icon'
import { api } from '../lib/api'
import { fmtInt } from '../lib/format'
import { groupByDay, lineLabel, nextOffset } from '../lib/claim-events-rules'
import type { ItemEvent } from '../lib/item-events'
import { ACCOUNTS_PAGE, useAdminAccounts, unavailableFrom } from '../lib/admin-accounts'
import type { AdminAccountClaim } from '../lib/admin-accounts'
import { shouldSearch, sinceLabel, stateLabel, stateTone } from '../lib/admin-accounts-rules'

/**
 * Screen 70 — Support.
 *
 * AUDIT LOG ONLY, and that is the owner's decision (2026-10-07), not a first
 * cut. A ticket queue inside Kevin is a product — schema, states, assignment,
 * notifications — and support arrives by email today. What the owner cannot do
 * by email is answer "who changed that price, and when", which is exactly what
 * the audit trail holds and what every other route to it stops at owner-scoped
 * data.
 *
 * Three steps, left to right: find the account, pick the claim, read the trail.
 * Nothing here writes. §4.3–§4.5 (retry, reprice, credits, suspend) are not
 * built, and a dead action on a support screen implies a lever the owner does
 * not have.
 *
 * The event payload is IDENTICAL to the customer-facing audit tab's, so this
 * reuses `groupByDay` / `lineLabel` and `HistoryRow` rather than growing a
 * second renderer that would drift from it.
 */

const EVENTS_PAGE = 50

type EventsResponse = { items: ItemEvent[]; count: number; total?: number | null }
type ClaimsResponse = { claims?: AdminAccountClaim[] | null; count?: number | null }

export default function AdminSupportPage() {
  const [typed, setTyped] = useState('')
  const [q, setQ] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [claimId, setClaimId] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldSearch(typed)) return
    const t = setTimeout(() => setQ(typed.trim()), 280)
    return () => clearTimeout(t)
  }, [typed])

  const accounts = useAdminAccounts(q, 0, ACCOUNTS_PAGE)
  const unavailable = unavailableFrom(accounts.error)
  const rows = accounts.data?.accounts ?? []
  const account = rows.find((a) => a.user_id === userId) ?? null

  const claims = useQuery({
    enabled: Boolean(userId),
    queryKey: ['admin', 'support-claims', userId],
    queryFn: () =>
      api.get<ClaimsResponse>(
        `/v1/admin/accounts/${encodeURIComponent(userId as string)}/claims?limit=100&include_archived=true`,
      ),
    staleTime: 30_000,
  })

  const events = useInfiniteQuery({
    enabled: Boolean(userId && claimId),
    queryKey: ['admin', 'support-events', userId, claimId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api.get<EventsResponse>(
        `/v1/admin/accounts/${encodeURIComponent(userId as string)}/claims/${encodeURIComponent(
          claimId as string,
        )}/events?limit=${EVENTS_PAGE}&offset=${pageParam}`,
      ),
    /* Same shape as the customer audit tab, and the same helper: page on
       `total` when there is one, otherwise on "was the page full?". */
    getNextPageParam: (last, pages) =>
      nextOffset(pages.reduce((n, p) => n + p.items.length, 0), {
        count: last.count,
        total: last.total ?? null,
        limit: EVENTS_PAGE,
      }),
    staleTime: 15_000,
  })

  const allEvents = useMemo(
    () => events.data?.pages.flatMap((p) => p.items) ?? [],
    [events.data],
  )
  const days = useMemo(() => groupByDay(allEvents), [allEvents])
  const total = events.data?.pages[0]?.total ?? null

  /* Picking a different account must not leave the previous account's claim
     selected -- the trail below would be of someone else entirely. */
  const pickAccount = (id: string) => {
    setUserId(id)
    setClaimId(null)
  }

  return (
    <AdminShell active="Support">
      <div className="k-adm-body">
        <div className="k-adm-sec-hd">
          <div>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 28,
                letterSpacing: '-0.022em',
                margin: '0 0 4px',
              }}
            >
              Support
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              Find an account, open one of its claims, and read who changed what.
            </p>
          </div>
          <Badge tone="quiet">Read-only</Badge>
        </div>

        {unavailable === 'forbidden' ? (
          <Alert tone="error" title="This account cannot read the admin API">
            The admin routes are gated on <code>app_metadata.role = "admin"</code>.
          </Alert>
        ) : null}

        {/*
          * Says what this screen is NOT, because the design's version is a
          * ticket queue and someone arriving from it will look for one.
          */}
        <Alert tone="neutral" title="There is no ticket queue here, by design">
          Support reaches us by email. What email cannot answer is “who changed that price, and
          when” — so this is the audit trail, for claims you do not own. Nothing on this page
          writes: there is no impersonation, and the actions that would repair an account
          (retry, re-price, grant credits) are not built yet.
        </Alert>

        <div className="k-adm-split">
          <section className="k-set-card">
            <div
              className="k-set-card-hd"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
            >
              <span>Account</span>
              <span className="k-search" style={{ maxWidth: 260, flex: 1 }}>
                <Icon d={I.search} size={13} />
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Email or user id…"
                  aria-label="Search accounts"
                />
              </span>
            </div>

            {accounts.isLoading ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
                {q ? `No account matches “${q}”.` : 'No accounts.'}
              </div>
            ) : (
              rows.map((a) => (
                <button
                  key={a.user_id}
                  type="button"
                  className={`k-adm-tr${a.user_id === userId ? ' k-adm-tr--on' : ''}`}
                  style={{ '--adm-cols': '1fr auto', width: '100%', textAlign: 'left' } as React.CSSProperties}
                  onClick={() => pickAccount(a.user_id)}
                >
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 600,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.email}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                      {sinceLabel(a.last_active_at) ?? 'never active'}
                    </span>
                  </span>
                  <Badge tone={stateTone(a.billing_state)}>{stateLabel(a.billing_state)}</Badge>
                </button>
              ))
            )}
          </section>

          <section className="k-set-card">
            <div className="k-set-card-hd">
              <span>
                Claims
                {account ? (
                  <span style={{ fontWeight: 400, color: 'var(--k-fg-4)' }}> · {account.email}</span>
                ) : null}
              </span>
            </div>

            {!userId ? (
              <div style={{ padding: '24px 18px', color: 'var(--k-fg-3)', fontSize: 13 }}>
                Pick an account on the left.
              </div>
            ) : claims.isLoading ? (
              <div style={{ padding: '24px 18px', color: 'var(--k-fg-3)', fontSize: 13 }}>Loading…</div>
            ) : (claims.data?.claims ?? []).length === 0 ? (
              <div style={{ padding: '24px 18px', color: 'var(--k-fg-3)', fontSize: 13 }}>
                No claims on this account.
              </div>
            ) : (
              (claims.data?.claims ?? []).map((c) => (
                <button
                  key={c.claim_id}
                  type="button"
                  className={`k-adm-tr${c.claim_id === claimId ? ' k-adm-tr--on' : ''}`}
                  style={{ '--adm-cols': '1fr auto', width: '100%', textAlign: 'left' } as React.CSSProperties}
                  onClick={() => setClaimId(c.claim_id)}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 600, display: 'block' }}>
                      {c.name || c.claim_id}
                    </span>
                    <span
                      className="k-mono"
                      style={{ fontSize: 11, color: 'var(--k-fg-4)' }}
                    >
                      {c.claim_id}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--k-fg-3)', whiteSpace: 'nowrap' }}>
                    {c.item_count == null ? '' : `${fmtInt(c.item_count)} items`}
                  </span>
                </button>
              ))
            )}
          </section>
        </div>

        <section className="k-set-card">
          <div
            className="k-set-card-hd"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Audit trail
              {total != null ? (
                <span style={{ fontWeight: 400, color: 'var(--k-fg-4)' }}> · {fmtInt(total)}</span>
              ) : null}
            </span>
            {claimId ? (
              <span className="k-mono" style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                {claimId}
              </span>
            ) : null}
          </div>

          <div style={{ padding: '10px 14px 14px' }}>
            {!claimId ? (
              <p className="k-note">Pick a claim to read its history.</p>
            ) : events.isLoading ? (
              <p className="k-note">Loading…</p>
            ) : allEvents.length === 0 ? (
              <p className="k-note">
                Nothing recorded on this claim. Entries appear as photos are processed and lines are
                edited.
              </p>
            ) : (
              <>
                {days.map((day) => (
                  <section key={day.key} className="k-audit-day">
                    <div className="k-audit-day-h">{day.label}</div>
                    {day.events.map((event) => (
                      /* No link on the line: this claim belongs to someone
                         else, and /claims/{id} would 404 for us. The
                         description is what identifies it. */
                      <HistoryRow
                        key={event.id}
                        event={event}
                        item={<span className="k-audit-line">{lineLabel(event)}</span>}
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
                        ? `Show older (${fmtInt(total - allEvents.length)})`
                        : 'Show older'}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </section>

        {account ? (
          <p style={{ fontSize: 12, color: 'var(--k-fg-4)', margin: 0 }}>
            <Link className="k-link" to={`/admin/accounts/${encodeURIComponent(account.user_id)}`}>
              Open {account.email} in Accounts
            </Link>{' '}
            for plan, usage and storage.
          </p>
        ) : null}
      </div>
    </AdminShell>
  )
}
