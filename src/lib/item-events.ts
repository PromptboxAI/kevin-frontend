/**
 * One item's audit trail, turned into sentences.
 *
 * Import-free so the branching can be unit-tested -- it IS the contract, and a
 * wrong branch here misattributes a change to the wrong party on the one record
 * that exists to say who did what.
 *
 * The backend has always written these; nothing read them back, so the history
 * existed and was invisible to the adjuster who caused it.
 */

export type ItemEvent = {
  id: string
  claim_item_id: number
  /** completed | needs_manual | override | edited | repriced | failed | … */
  event_type: string
  actor_kind: string
  actor_id: string | null
  /**
   * Which SHARE LINK a client write came through; null for every other actor.
   * This is what makes an unauthenticated write acceptable -- the adjuster can
   * see what the insured changed and revoke the specific link it came from.
   */
  share_id: string | null
  /**
   * Free-form per event type. ADJUSTER-FACING, and it can carry internal
   * signals (`lkq`, `bucket_used`) that must never reach a carrier-facing
   * document. Render in the app, never in an export.
   */
  payload: Record<string, unknown>
  created_at: string | null
}

export type EventLine = {
  /** The headline, e.g. "Refined the query". */
  title: string
  /** Supporting detail, already resolved from the payload. */
  detail?: string
  /** A before → after pair, rendered as a diff rather than prose. */
  diff?: { from: string; to: string }
  /** Who did it, in words the adjuster reads rather than an enum. */
  actor: string
  tone: 'ok' | 'neutral' | 'danger'
}

const str = (v: unknown): string | undefined => {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return undefined
}

const usd = (v: unknown): string | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n)) return undefined
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

const pct = (v: unknown): string | undefined => {
  const n = typeof v === 'number' ? v : NaN
  if (!Number.isFinite(n)) return undefined
  // Confidence arrives as a fraction; a whole number would already be a percent.
  return `${Math.round(n <= 1 ? n * 100 : n)}%`
}

/**
 * Who did this, said plainly.
 *
 * `client` is the one that matters: it is the insured writing through a share
 * link, and naming it is the reason that write is allowed at all.
 */
export function actorLabel(event: ItemEvent): string {
  switch (event.actor_kind) {
    case 'client':
      return event.share_id ? 'Your client, via their link' : 'Your client'
    case 'worker':
      return 'Kevin'
    case 'system':
      return 'Kevin'
    case 'user':
      return 'You'
    default:
      return event.actor_kind || 'Unknown'
  }
}

/**
 * Branch on `event_type` -- never on payload shape, which varies freely.
 *
 * Unknown types are RENDERED, not dropped: a trail that silently omits what it
 * does not recognise is worse than one that says "status changed", because the
 * gap is invisible.
 */
export function describeEvent(event: ItemEvent): EventLine {
  const p = event.payload ?? {}
  const actor = actorLabel(event)

  switch (event.event_type) {
    case 'priced': {
      // Live shape: refined_query / previous_query. They are equal on a first
      // pass, and only a genuine CHANGE is worth rendering as one.
      const to = str(p.refined_query) ?? str(p.query) ?? str(p.search_query)
      const from = str(p.previous_query)
      if (from && to && from !== to) {
        return { title: 'Refined the query', diff: { from, to }, actor, tone: 'neutral' }
      }
      return { title: 'Searched', detail: to, actor, tone: 'neutral' }
    }

    case 'repriced': {
      const from = str(p.old_query) ?? str(p.previous_query)
      const to = str(p.query) ?? str(p.new_query)
      if (from && to) {
        return { title: 'Refined the query', diff: { from, to }, actor, tone: 'neutral' }
      }
      return { title: 'Re-priced', detail: to ?? from, actor, tone: 'neutral' }
    }

    case 'completed': {
      const price = usd(p.rcv) ?? usd(p.price)
      const basis = str(p.valuation_basis) ?? str(p.basis)
      const conf = pct(p.confidence)
      const detail = [basis, conf ? `${conf} confidence` : undefined].filter(Boolean).join(' · ')
      return {
        title: price ? `Priced at ${price}` : 'Priced',
        detail: detail || undefined,
        actor,
        tone: 'ok',
      }
    }

    case 'needs_manual': {
      // NOT a failure (rule 12): a normal terminal state awaiting a human.
      return {
        title: 'Left for you to price',
        detail: str(p.manual_reason) ?? str(p.reason),
        actor,
        tone: 'neutral',
      }
    }

    case 'override': {
      const from = usd(p.old_rcv) ?? str(p.old_value)
      const to = usd(p.new_rcv) ?? str(p.new_value)
      if (from && to) return { title: 'Price overridden', diff: { from, to }, actor, tone: 'neutral' }
      return { title: 'Price overridden', detail: to, actor, tone: 'neutral' }
    }

    case 'edited': {
      /*
       * Live shape: { fields: ["age_years"], diff: { age_years: {from,to},
       * acv: {...}, depreciation_pct: {...} } }
       *
       * `fields` is what the PERSON changed; `diff` also carries everything
       * that moved as a CONSEQUENCE -- acv, depreciation_pct, the engine
       * version. Rendering the whole diff as edits would credit the client
       * with changing the ACV, which they did not do: they answered "how old
       * was it" and the server recomputed. So the headline names the edited
       * field, and the recomputed money rides along as a result.
       */
      const diff = (p.diff ?? {}) as Record<string, { from?: unknown; to?: unknown }>
      const fields = Array.isArray(p.fields) ? (p.fields as unknown[]).map(str).filter(Boolean) : []
      const field = fields[0] as string | undefined

      if (field && diff[field]) {
        const from = str(diff[field].from) ?? 'none'
        const to = str(diff[field].to) ?? 'none'
        const acv = diff.acv ? usd(diff.acv.to) : undefined
        return {
          title: `Changed ${field.replace(/_/g, ' ')}`,
          diff: { from, to },
          detail: acv ? `ACV now ${acv}` : undefined,
          actor,
          tone: 'neutral',
        }
      }
      // Older or unrecognised shape -- name the fields rather than say nothing.
      return {
        title: fields.length ? `Changed ${fields.join(', ').replace(/_/g, ' ')}` : 'Edited',
        actor,
        tone: 'neutral',
      }
    }

    case 'failed':
      return {
        title: 'Pricing failed',
        detail: str(p.error) ?? str(p.detail) ?? str(p.reason),
        actor,
        tone: 'danger',
      }

    case 'retry_scheduled':
      return { title: 'Queued to try again', detail: str(p.reason), actor, tone: 'neutral' }

    default:
      // Readable rather than dropped.
      return {
        title: event.event_type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
        detail: str(p.reason) ?? str(p.detail),
        actor,
        tone: 'neutral',
      }
  }
}

/**
 * Signals that are adjuster-facing IN THE APP and must never reach a
 * carrier-facing document. Surfaced here deliberately; the export builder
 * has no access to this endpoint.
 */
export function internalSignals(event: ItemEvent): string[] {
  const p = event.payload ?? {}
  const out: string[] = []
  if (p.lkq === true || str(p.lkq)) out.push('Like-kind substitute')
  const bucket = str(p.bucket_used)
  if (bucket) out.push(`Bucket: ${bucket}`)
  return out
}
