import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { describeEvent, internalSignals } from '../lib/item-events'
import type { ItemEvent } from '../lib/item-events'

/**
 * One item's audit trail. Ported from `ItemHistory` in worksheet.jsx.
 *
 * LAZY on first expand: an item's history is unbounded and most rows are never
 * asked about, so fetching it with the drawer would spend a request per row
 * click for something nobody opened.
 *
 * This is the whole audit surface. There is no claim-wide feed endpoint and
 * none should be built -- the claim-level "Notes & audit" tab collapses into
 * this item-scoped panel. Rule 5: a timeline, never a collaboration tool.
 *
 * The payload can carry internal signals (`lkq`, `bucket_used`). They are
 * adjuster-facing IN THE APP and must never reach a carrier-facing document;
 * the export builder has no access to this endpoint.
 */
export default function ItemHistory({ rowId }: { rowId: number }) {
  const [open, setOpen] = useState(false)

  const events = useQuery({
    queryKey: ['item-events', rowId],
    queryFn: () =>
      api.get<{ items: ItemEvent[]; count: number; limit: number }>(
        `/v1/claim_items/${rowId}/events`,
      ),
    // Nothing is fetched until the adjuster asks.
    enabled: open,
    staleTime: 30_000,
  })

  const rows = events.data?.items ?? []

  return (
    <div className="k-insp-field">
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>History</span>
        <button type="button" className="k-link" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show'}
        </button>
      </label>

      {open ? (
        events.isPending ? (
          <div className="k-hist-row" style={{ color: 'var(--k-fg-4)' }}>
            Loading…
          </div>
        ) : events.error ? (
          <div className="k-hist-row" style={{ color: 'var(--k-danger)' }}>
            Could not load this item's history.
          </div>
        ) : rows.length === 0 ? (
          <div className="k-hist-row" style={{ color: 'var(--k-fg-4)' }}>
            Nothing recorded yet.
          </div>
        ) : (
          rows.map((event) => <HistoryRow key={event.id} event={event} />)
        )
      ) : null}
    </div>
  )
}

function HistoryRow({ event }: { event: ItemEvent }) {
  const line = describeEvent(event)
  const signals = internalSignals(event)
  // `worker` and `system` are Kevin; everyone else is a person, and the styling
  // says which so the adjuster can tell their own edits from the machine's.
  const machine = event.actor_kind === 'worker' || event.actor_kind === 'system'

  return (
    <div className="k-hist-row">
      <span className={'k-hist-actor' + (machine ? ' k-hist-actor--sys' : '')}>{line.actor}</span>

      <span className="k-hist-what">
        <span
          style={
            line.tone === 'ok'
              ? { color: 'var(--k-ok)' }
              : line.tone === 'danger'
                ? { color: 'var(--k-danger)' }
                : undefined
          }
        >
          {line.title}
        </span>

        {/* A before → after reads as a diff, not a sentence: the adjuster is
            checking what changed, not reading prose. */}
        {line.diff ? (
          <>
            {' '}
            <span
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 10.5,
                color: 'var(--k-fg-4)',
                textDecoration: 'line-through',
              }}
            >
              {line.diff.from}
            </span>
            <span style={{ color: 'var(--k-fg-4)' }}> → </span>
            <span
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 10.5,
                color: 'var(--k-fg-2)',
              }}
            >
              {line.diff.to}
            </span>
          </>
        ) : null}

        {line.detail ? (
          <span style={{ color: 'var(--k-fg-4)' }}> — {line.detail}</span>
        ) : null}

        {signals.length ? (
          <span
            style={{
              display: 'block',
              fontSize: 10.5,
              color: 'var(--k-fg-4)',
              fontFamily: 'var(--k-font-mono)',
            }}
            title="Shown in Kevin only — never printed on an export"
          >
            {signals.join(' · ')}
          </span>
        ) : null}
      </span>

      <span className="k-hist-when">
        {event.created_at
          ? new Date(event.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : '—'}
      </span>
    </div>
  )
}
