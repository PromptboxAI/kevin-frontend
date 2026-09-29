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

/**
 * A field diff, read the way an adjuster would describe the change.
 *
 * WHAT THE PERSON DID vs WHAT THE SERVER RECOMPUTED. An edit to `age_years`
 * arrives with `acv`, `depreciation_pct` and the engine version in the same
 * diff, because they all moved. Leading with the ACV would credit the adjuster
 * with changing a number they never touched: they answered "how old was it"
 * and the server did the arithmetic. So a consequence is never the headline
 * while a primary field is present -- it rides along as a result.
 */
const CONSEQUENCE = new Set([
  'acv',
  'acv_total_incl',
  'rcv_total_incl',
  'ext_cost',
  'tax',
  'depreciation_amount',
  'depreciation_pct',
  'depreciation_capped',
  'engine_version',
  'rule_version',
  'previous_status',
  'status',
])

/** Money fields print as money; everything else prints as itself. */
const MONEY = new Set(['rcv', 'acv', 'unit_cost', 'ext_cost', 'depreciation_amount'])

const FIELD_LABEL: Record<string, string> = {
  rcv: 'the price',
  acv: 'the ACV',
  age_years: 'the age',
  make_mfr: 'the make',
  model_number: 'the model number',
  room_area: 'the room',
  category: 'the content class',
  depreciation_method: 'the depreciation method',
  depreciation_pct: 'the depreciation',
  description: 'the description',
  quantity: 'the quantity',
  qty: 'the quantity',
}

const label = (field: string) => FIELD_LABEL[field] ?? field.replace(/_/g, ' ')

/** `null` is "none": an empty cell is a real before-state, not a missing one. */
function fieldValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return 'none'
  if (MONEY.has(field)) return usd(v) ?? String(v)
  if (field === 'depreciation_pct') return pct(v) ?? String(v)
  return str(v) ?? String(v)
}

type Diff = Record<string, { from?: unknown; to?: unknown }>

/**
 * The one field a change is ABOUT, from the diff the server sent.
 *
 * `fields` names it outright when the payload carries it. When it does not --
 * and the live `edited` payload does not, it is a bare `{diff: {...}}` -- the
 * first non-consequence key is the answer, and a diff of nothing but
 * consequences means the money itself was the edit.
 */
export function primaryField(diff: Diff, fields: string[]): string | undefined {
  const keys = Object.keys(diff)
  const named = fields.find((f) => keys.includes(f))
  if (named) return named
  return keys.find((k) => !CONSEQUENCE.has(k)) ?? keys[0]
}

/** The change as a line: what moved, from what to what, and what followed. */
function describeChange(
  diff: Diff,
  fields: string[],
  actor: string,
  verb: 'Changed' | 'Overrode',
): EventLine | null {
  const field = primaryField(diff, fields)
  if (!field || !diff[field]) return null
  const entry = diff[field]
  const acv = diff.acv && field !== 'acv' ? usd(diff.acv.to) : undefined
  return {
    title: `${verb} ${label(field)}`,
    diff: { from: fieldValue(field, entry.from), to: fieldValue(field, entry.to) },
    detail: acv ? `ACV now ${acv}` : undefined,
    actor,
    tone: 'neutral',
  }
}

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

    /*
     * BOTH SPELLINGS. The live event_type is `overridden`; `override` was the
     * name this branch was written against and nothing on the server emits it.
     * The mismatch meant every override on a real claim fell through to the
     * default and rendered as the bare word "Overridden" -- five consecutive
     * rows reading identically on the audit tab, while the payload carried
     * `{diff: {acv: {from: 35.99, to: 31.99}, age_years: {from: 1, to: 2}}}`.
     * An audit trail that will not say what changed is not one.
     */
    case 'override':
    case 'overridden': {
      const diff = (p.diff ?? {}) as Record<string, { from?: unknown; to?: unknown }>
      const fields = Array.isArray(p.fields)
        ? (p.fields as unknown[]).map(str).filter(Boolean) as string[]
        : []
      const line = describeChange(diff, fields, actor, 'Overrode')
      if (line) return line
      // The older shape, kept because old rows still carry it.
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
      const fields = Array.isArray(p.fields)
        ? (p.fields as unknown[]).map(str).filter(Boolean) as string[]
        : []

      /*
       * `fields` is absent on the live payload -- an edit arrives as a bare
       * `{diff: {make_mfr: {from: null, to: "WWE"}}}` -- and this branch used
       * to require it, so a real edit rendered as the word "Edited" and
       * nothing else. The diff itself names the field.
       */
      const line = describeChange(diff, fields, actor, 'Changed')
      if (line) return line
      // Nothing usable in the diff -- name the fields rather than say nothing.
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
