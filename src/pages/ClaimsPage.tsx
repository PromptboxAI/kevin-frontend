import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimRowMenu from '../components/ClaimRowMenu'
import ClaimStatusChip from '../components/ClaimStatusChip'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { fmtDate, fmtInt, fmtSince, fmtUSD, greetingFor } from '../lib/format'
import { useAuth } from '../lib/auth'
import type { ClaimListResponse, ClaimSummary } from '../lib/types'

/**
 * The locked chip set from claims-dashboard.jsx. `draft` and `exported` are
 * flavours of OPEN, never chips -- exported is a row badge. Only `archived` is
 * excluded from GET /v1/claims by default, so it needs an explicit request.
 */
const CLOSED_STATUSES = ['closed', 'archived']

type Chip = 'All' | 'Processing' | 'In review' | 'Open' | 'Closed' | 'Archived'

const CHIPS: Chip[] = ['All', 'Processing', 'In review', 'Open', 'Closed', 'Archived']

/** Which chips the API can filter server-side; the rest are shaped locally. */
const SERVER_STATUS: Partial<Record<Chip, string>> = {
  Processing: 'processing',
  'In review': 'in_review',
  Closed: 'closed',
  Archived: 'archived',
}

export default function ClaimsPage() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<Chip>('All')
  const [notice, setNotice] = useState<string | null>(null)

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
      // "Open" is not an API value: it means anything not closed or archived.
      .filter((c) => (chip === 'Open' ? !CLOSED_STATUSES.includes(c.status) : true))
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
      <AppHeader
        actions={
          <button type="button" className="k-btn" title="Intake — coming in this build">
            <Icon d={I.plus} size={12} /> New claim
          </button>
        }
      />

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
              <div className="k-tot-l">RCV · open claims</div>
              <div className="k-tot-v">{fmtUSD(kpis.rcv)}</div>
            </div>
          </div>
        </div>

        <section className="k-claims-toolbar">
          <div className="k-search" style={{ minWidth: 280 }}>
            <Icon d={I.search} size={12} />
            <input
              placeholder="Filter claims · name, claim #, carrier, cause…"
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
            <span>{notice}</span>
            <button type="button" className="k-link" onClick={() => setNotice(null)}>
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
          <section className="k-claims-list">
            <div className="k-claim-row k-claim-row--head">
              <div>Claim</div>
              <div>Insured / cause</div>
              <div>Carrier</div>
              <div style={{ textAlign: 'right' }}>Items / photos</div>
              <div style={{ textAlign: 'right' }}>RCV</div>
              <div>Status</div>
              <div />
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

function Row({ claim, onNotice }: { claim: ClaimSummary; onNotice: (m: string) => void }) {
  return (
    <div className="k-claim-row">
      <div>
        <Link className="k-claim-id" to={`/claims/${claim.claim_id}`} title={claim.claim_id}>
          {claim.claim_id}
        </Link>
        {/* Keep the dash when the record has no date rather than omitting it. */}
        <div className="k-claim-dol">DOL {fmtDate(claim.date_of_loss)}</div>
      </div>

      <div>
        <Link className="k-claim-name k-link" to={`/claims/${claim.claim_id}`}>
          {claim.name}
        </Link>
        <div className="k-claim-sub">
          {[claim.insured_name, claim.loss_type].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>

      <div className="k-claim-carrier">{claim.carrier ?? '—'}</div>

      <div className="k-claim-num">
        <div>{fmtInt(claim.item_count)}</div>
        <div className="k-claim-photos">{fmtInt(claim.photo_count)} photos</div>
      </div>

      {/* Tax-inclusive server total, rendered verbatim. */}
      <div className="k-claim-rcv">{fmtUSD(claim.total_rcv)}</div>

      {/* Status badge only. Unpriced counts belong on the claim, not the roster. */}
      <div className="k-claim-status">
        <ClaimStatusChip status={claim.status} />
        {claim.exported_at && claim.status !== 'exported' ? (
          <Badge tone="quiet">Exported</Badge>
        ) : null}
      </div>

      <ClaimRowMenu claim={claim} onNotice={onNotice} />
    </div>
  )
}
