import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { fmtInt } from '../lib/format'
import { ACCOUNTS_PAGE, useAdminAccounts, unavailableFrom } from '../lib/admin-accounts'
import type { AdminAccount } from '../lib/admin-accounts'
import {
  accountFlags,
  allowanceLabel,
  fmtBytes,
  isNonBilling,
  itemsRemaining,
  nextOffset,
  planLabel,
  shouldSearch,
  sinceLabel,
  stateLabel,
  stateTone,
  totalFrom,
} from '../lib/admin-accounts-rules'

/**
 * Screen 65 — Accounts. Every customer account, searchable, and a route into
 * one of them.
 *
 * Ported in SHAPE from design/components/admin-console.jsx (`AdminAccounts`),
 * not in content: the design seeds a dozen invented firms with invented MRR.
 * This renders GET /v1/admin/accounts and nothing else. In particular there is
 * NO MRR column -- §4.1 does not return one, and a revenue figure assembled in
 * the browser from a plan name would be exactly the invented number the back
 * office exists to not show. Revenue lives on its own screen, from its own
 * rollup (BACKEND-PROMPTS 15).
 */

const COLS = '2.4fr 1fr 1.1fr 1.3fr 0.8fr 0.9fr 0.9fr'

function Empty({ q }: { q: string }) {
  return (
    <div style={{ padding: '38px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
      {q.trim() ? (
        <>
          No account matches <strong>{q.trim()}</strong>.
        </>
      ) : (
        'No accounts yet.'
      )}
    </div>
  )
}

function Row({ a }: { a: AdminAccount }) {
  const remaining = itemsRemaining(a)
  const flags = accountFlags(a)
  const last = sinceLabel(a.last_active_at)

  return (
    <Link className="k-adm-tr" style={{ '--adm-cols': COLS } as React.CSSProperties} to={`/admin/accounts/${encodeURIComponent(a.user_id)}`}>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {a.email}
        </span>
        {flags.length ? (
          <span style={{ fontSize: 11.5, color: 'var(--k-danger)' }}>{flags.join(' · ')}</span>
        ) : (
          <span style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}>
            {a.user_id.slice(0, 8)}
          </span>
        )}
      </span>

      <span>{planLabel(a.plan)}</span>

      <span>
        <Badge tone={stateTone(a.billing_state)} dot>
          {stateLabel(a.billing_state)}
        </Badge>
      </span>

      {/* Items, the metered dimension (rule 9). The period comes from PLAN,
          never billing_state -- a pro plan in a trial billing state still has
          a monthly allowance. */}
      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>
        {a.items_used == null || a.included_items == null ? (
          '—'
        ) : (
          <>
            {fmtInt(a.items_used)} / {fmtInt(a.included_items)}
            <span style={{ color: 'var(--k-fg-4)' }}> {allowanceLabel(a.plan)}</span>
            {remaining != null && (a.credit_balance ?? 0) > 0 ? (
              <span style={{ color: 'var(--k-fg-4)', display: 'block' }}>
                +{fmtInt(a.credit_balance)} credits
              </span>
            ) : null}
          </>
        )}
      </span>

      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>
        {a.claims_count == null ? '—' : fmtInt(a.claims_count)}
      </span>
      <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 12.5 }}>
        {fmtBytes(a.storage_bytes)}
      </span>
      <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>{last ?? '—'}</span>
    </Link>
  )
}

export default function AdminAccountsPage() {
  const [typed, setTyped] = useState('')
  const [q, setQ] = useState('')
  const [offset, setOffset] = useState(0)

  // Debounced, and only for a query worth sending (one character matches most
  // of the table and costs a round trip to say so).
  useEffect(() => {
    if (!shouldSearch(typed)) return
    const t = setTimeout(() => {
      setQ(typed.trim())
      setOffset(0)
    }, 280)
    return () => clearTimeout(t)
  }, [typed])

  const accounts = useAdminAccounts(q, offset)
  const unavailable = unavailableFrom(accounts.error)
  const rows = useMemo(() => accounts.data?.accounts ?? [], [accounts.data])
  const total = totalFrom(accounts.data)
  const more = nextOffset({ offset, limit: ACCOUNTS_PAGE, returned: rows.length, total })

  /* Counted over THIS PAGE and labelled as such. A figure headed "past due"
     that silently means "past due among the 50 I happen to be showing" is the
     kind of number an owner would act on and be wrong. */
  const pastDue = rows.filter((a) => (a.billing_state ?? '').toLowerCase() === 'past_due').length
  const nonBilling = rows.filter((a) => isNonBilling(a.billing_state)).length

  return (
    <AdminShell active="Accounts">
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
              Accounts
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              Every customer account, what they are on, and what they have used — live from the API.
            </p>
          </div>
          {rows.length ? (
            <Badge tone={pastDue ? 'warn' : 'ok'} dot>
              {pastDue ? `${pastDue} past due on this page` : 'None past due here'}
            </Badge>
          ) : null}
        </div>

        {unavailable === 'not_built' ? (
          <Alert
            tone="info"
            title="The accounts API is not on production yet"
            action={
              <a className="k-btn k-btn--sm k-btn--ghost" href="/admin/system">
                System status →
              </a>
            }
          >
            This screen is built against the agreed shape of{' '}
            <code>GET /v1/admin/accounts</code> (BACKEND-PROMPTS 4 §4.1). It turns on by itself
            once <code>feat/admin-accounts</code> is merged and migration 0064 is applied — there
            is nothing further to build here. An empty table would have read as “no customers”,
            which is why this says what it says instead.
          </Alert>
        ) : null}

        {unavailable === 'forbidden' ? (
          <Alert tone="error" title="This account cannot read the admin API">
            The admin routes are gated on <code>app_metadata.role = "admin"</code>. Signing in as
            an owner is the fix; there is no impersonation path by design.
          </Alert>
        ) : null}

        {accounts.error && unavailable === null ? (
          <Alert tone="error" title="Could not load accounts">
            {accounts.error instanceof Error ? accounts.error.message : 'Unknown error'}
          </Alert>
        ) : null}

        <section className="k-set-card">
          <div
            className="k-set-card-hd"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
          >
            <span>
              Accounts
              {total != null ? (
                <span style={{ color: 'var(--k-fg-4)', fontWeight: 400 }}> · {fmtInt(total)}</span>
              ) : null}
            </span>
            <span className="k-search" style={{ maxWidth: 320, flex: 1 }}>
              <Icon d={I.search} size={13} />
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Search email or user id…"
                aria-label="Search accounts"
              />
            </span>
          </div>

          <div className="k-adm-tbl-hd" style={{ '--adm-cols': COLS } as React.CSSProperties}>
            <span>Account</span>
            <span>Plan</span>
            <span>Billing</span>
            <span>Items used</span>
            <span>Claims</span>
            <span>Storage</span>
            <span>Last active</span>
          </div>

          {accounts.isLoading ? (
            <div style={{ padding: '38px 18px', textAlign: 'center', color: 'var(--k-fg-3)', fontSize: 13 }}>
              Loading…
            </div>
          ) : rows.length === 0 ? (
            unavailable ? null : <Empty q={q} />
          ) : (
            rows.map((a) => <Row key={a.user_id} a={a} />)
          )}

          {rows.length && (more != null || offset > 0) ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 18px',
                borderTop: '1px solid var(--k-line)',
                fontSize: 12,
                color: 'var(--k-fg-3)',
              }}
            >
              <span>
                {fmtInt(offset + 1)}–{fmtInt(offset + rows.length)}
                {total != null ? ` of ${fmtInt(total)}` : ''}
                {nonBilling ? ` · ${nonBilling} comped or internal` : ''}
              </span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--ghost"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(offset - ACCOUNTS_PAGE, 0))}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--sm k-btn--ghost"
                  disabled={more == null}
                  onClick={() => more != null && setOffset(more)}
                >
                  Next →
                </button>
              </span>
            </div>
          ) : null}
        </section>
      </div>
    </AdminShell>
  )
}
