import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Badge from './Badge'
import IntakeField from './IntakeField'
import IntakeSelect from './IntakeSelect'
import { I, Icon } from './Icon'
import { ApiError, api } from '../lib/api'
import { fmtDate, fmtInt, fmtUSD } from '../lib/format'
import {
  acceptProposal,
  listProposals,
  looksUnsearchable,
  rejectProposal,
} from '../lib/proposals'
import type { Proposal, ProposalAccept } from '../lib/proposals'

/**
 * The adjuster's side of client proposals.
 *
 * Accepting is an ENRICHMENT step, not a rubber stamp: the insured reported
 * "clothes", and what reaches the schedule has to be searchable. Every field
 * here overrides what they wrote, which is the whole reason new items are
 * mediated rather than written straight through.
 *
 * Pricing is opt-in and defaults OFF, matching the server. Accepting should
 * not silently spend vendor budget -- the adjuster may want to fix the
 * description first, and an unpriced line is a normal state that reprice picks
 * up later.
 */
export default function ProposalsPanel({
  claimId,
  onClose,
}: {
  claimId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Proposal | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const proposals = useQuery({
    queryKey: ['proposals', claimId],
    queryFn: () => listProposals(claimId),
  })

  /** The live taxonomy (rule 13) -- fetched, never retyped. Shared cache key
      with the worksheet, so opening this costs no extra request. */
  const rules = useQuery({
    queryKey: ['depreciation-rules'],
    queryFn: () =>
      api.get<{ categories: string[]; rules: Record<string, unknown> }>('/v1/depreciation-rules'),
    staleTime: Infinity,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['proposals', claimId] })
    // An accepted proposal becomes a line item, so the worksheet is stale too.
    void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
    void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
  }

  const fail = (label: string) => (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      // Already decided elsewhere -- re-read rather than insist.
      setNotice('That one was already decided. Refreshed the queue.')
      refresh()
      return
    }
    setNotice(
      error instanceof ApiError
        ? `${label} — HTTP ${error.status}: ${error.message422}`
        : `${label}.`,
    )
  }

  const accept = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProposalAccept }) => acceptProposal(id, body),
    onSuccess: () => {
      setEditing(null)
      refresh()
    },
    onError: fail('Could not accept'),
  })

  const reject = useMutation({
    mutationFn: (id: number) => rejectProposal(id),
    onSuccess: refresh,
    onError: fail('Could not reject'),
  })

  const all = proposals.data?.proposals ?? []
  const pending = all.filter((p) => p.status === 'pending')
  const decided = all.filter((p) => p.status !== 'pending')
  const busy = accept.isPending || reject.isPending

  return (
    <div className="k-export-stage k-modal-stage" onClick={onClose}>
      <div className="k-export-scrim" />
      <div className="k-export-modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="k-export-hd">
          <div>
            <div className="k-modal-kicker">From your client</div>
            <div className="k-modal-title">
              {pending.length ? `${fmtInt(pending.length)} to review` : 'Proposed items'}
            </div>
          </div>
          <button type="button" className="k-icon-btn" aria-label="Close" onClick={onClose}>
            <Icon d={I.close} size={15} />
          </button>
        </div>

        <div className="k-share-body">
          {notice ? (
            <div className="k-share-snapnote" style={{ marginBottom: 12 }}>
              <Icon d={I.info} size={13} />
              <span style={{ flex: 1 }}>{notice}</span>
              <button type="button" className="k-link" onClick={() => setNotice(null)}>
                Dismiss
              </button>
            </div>
          ) : null}

          {proposals.isPending ? (
            <div style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading…</div>
          ) : all.length === 0 ? (
            <div className="k-empty" style={{ padding: '28px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--k-fg-3)' }}>
                Nothing proposed yet. Items your client adds through their link land here for you
                to review before they reach the schedule.
              </p>
            </div>
          ) : null}

          {pending.length ? (
            <section className="k-share-sec">
              <div className="k-share-sec-h">Waiting on you</div>
              <div className="k-share-snapnote" style={{ marginBottom: 10 }}>
                <Icon d={I.info} size={13} />
                <span>
                  Your client described these in their own words. Accepting is where you make one
                  searchable — <strong style={{ color: 'var(--k-fg-2)' }}>&ldquo;clothes&rdquo;</strong>{' '}
                  becomes <strong style={{ color: 'var(--k-fg-2)' }}>&ldquo;Nike Air Max 270 mens size 10&rdquo;</strong>.
                  Nothing reaches the schedule until you do.
                </span>
              </div>
              {pending.map((p) => (
                <ProposalRow
                  key={p.id}
                  proposal={p}
                  busy={busy}
                  onAccept={() => setEditing(p)}
                  onReject={() => reject.mutate(p.id)}
                />
              ))}
            </section>
          ) : null}

          {decided.length ? (
            <section className="k-share-sec">
              <div className="k-share-sec-h">Decided</div>
              {decided.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    fontSize: 12,
                    color: 'var(--k-fg-4)',
                  }}
                >
                  <span style={{ flex: 1 }}>{p.description}</span>
                  {p.item_id ? (
                    <span style={{ fontFamily: 'var(--k-font-mono)', fontSize: 11 }}>
                      → line {p.item_id}
                    </span>
                  ) : null}
                  <Badge tone={p.status === 'accepted' ? 'ok' : 'quiet'}>
                    {p.status === 'accepted' ? 'Added' : 'Not added'}
                  </Badge>
                </div>
              ))}
            </section>
          ) : null}
        </div>

        {editing ? (
          <AcceptForm
            proposal={editing}
            categories={rules.data?.categories ?? []}
            saving={accept.isPending}
            onCancel={() => setEditing(null)}
            onAccept={(body) => accept.mutate({ id: editing.id, body })}
          />
        ) : null}
      </div>
    </div>
  )
}

function ProposalRow({
  proposal,
  busy,
  onAccept,
  onReject,
}: {
  proposal: Proposal
  busy: boolean
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div className="k-share-linkrow" style={{ marginBottom: 6, alignItems: 'flex-start' }}>
      <Icon d={I.plus} size={12} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{proposal.description}</span>
          {looksUnsearchable(proposal.description) ? (
            <Badge tone="warn">Needs detail</Badge>
          ) : null}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)', marginTop: 3 }}>
          {[
            proposal.room,
            proposal.quantity > 1 ? `Qty ${proposal.quantity}` : null,
            proposal.age_years != null ? `${proposal.age_years} yr` : null,
            // What they say they spent replacing it -- holdback recovery, not a
            // price for the schedule.
            proposal.claimed_rcv != null ? `spent ${fmtUSD(proposal.claimed_rcv)}` : null,
            proposal.created_at ? fmtDate(proposal.created_at) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button type="button" className="k-btn k-btn--sm" disabled={busy} onClick={onAccept}>
          Review &amp; add
        </button>
        <button
          type="button"
          className="k-btn k-btn--sm k-btn--ghost"
          disabled={busy}
          title="Leaves it off the schedule. Your client is not notified."
          onClick={onReject}
        >
          Dismiss
        </button>
      </span>
    </div>
  )
}

function AcceptForm({
  proposal,
  categories,
  saving,
  onCancel,
  onAccept,
}: {
  proposal: Proposal
  categories: string[]
  saving: boolean
  onCancel: () => void
  onAccept: (body: ProposalAccept) => void
}) {
  const [description, setDescription] = useState(proposal.description)
  const [room, setRoom] = useState(proposal.room ?? '')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState(String(proposal.quantity))
  const [age, setAge] = useState(proposal.age_years != null ? String(proposal.age_years) : '')
  const [price, setPrice] = useState(false)

  const thin = looksUnsearchable(description)
  const tooShort = description.trim().length < 3

  return (
    <div className="k-stage-noteover" onClick={onCancel}>
      <div className="k-notemodal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="k-notemodal-hd">
          <div>
            <div className="k-notemodal-t">Add to the schedule</div>
            <div className="k-notemodal-s">
              Client wrote &ldquo;{proposal.description}&rdquo;
            </div>
          </div>
          <button type="button" className="k-icon-btn" aria-label="Close" onClick={onCancel}>
            <Icon d={I.close} size={15} />
          </button>
        </div>

        <div className="k-notemodal-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <IntakeField
              label="Description"
              value={description}
              width="100%"
              invalid={tooShort}
              onChange={setDescription}
              hint={
                tooShort
                  ? 'At least 3 characters'
                  : thin
                    ? 'One word rarely prices — add make, model or size'
                    : 'This is what Kevin searches on'
              }
            />
            <IntakeField label="Room / area" value={room} width={180} onChange={setRoom} />
            <IntakeField
              label="Make / mfr"
              value={make}
              width={160}
              placeholder="Nike"
              onChange={setMake}
            />
            <IntakeField
              label="Model #"
              value={model}
              mono
              width={160}
              onChange={setModel}
            />
            <IntakeSelect
              label="Content class"
              value={category}
              options={['', ...categories]}
              width={220}
              onChange={setCategory}
            />
            <IntakeField label="Qty" value={quantity} mono width={80} onChange={setQuantity} />
            <IntakeField
              label="Age (years)"
              value={age}
              mono
              width={110}
              onChange={setAge}
              hint="Their answer, editable"
            />
          </div>

          {/* Opt-in, and off by default on the server too: accepting must not
              silently spend vendor budget. */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginTop: 14,
              fontSize: 12.5,
              color: 'var(--k-fg-2)',
            }}
          >
            <input
              type="checkbox"
              checked={price}
              onChange={(e) => setPrice(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              Price it now
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                Runs the valuation and spends two searches. Leave off to add the line unpriced and
                price it later — a thin description usually prices badly.
              </span>
            </span>
          </label>
        </div>

        <div className="k-notemodal-ft" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
          <button type="button" className="k-btn k-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="k-btn"
            disabled={saving || tooShort}
            onClick={() => {
              const qty = Number(quantity)
              const years = age.trim() === '' ? null : Number(age)
              onAccept({
                // Only send what changes something. The API treats an absent
                // field as "keep what the insured wrote".
                ...(description.trim() ? { description: description.trim() } : {}),
                ...(room.trim() ? { room_area: room.trim() } : {}),
                ...(make.trim() ? { make_mfr: make.trim() } : {}),
                ...(model.trim() ? { model_number: model.trim() } : {}),
                ...(category ? { category } : {}),
                ...(Number.isFinite(qty) && qty >= 1 ? { quantity: Math.round(qty) } : {}),
                ...(years === null || (Number.isFinite(years) && years >= 0)
                  ? { age_years: years }
                  : {}),
                price,
              })
            }}
          >
            {saving ? 'Adding…' : price ? 'Add and price' : 'Add unpriced'}
          </button>
        </div>
      </div>
    </div>
  )
}
