/** The reprice endpoint caps `query` at 200 chars and uses it VERBATIM. */
export const QUERY_MAX = 200
export const QUERY_MIN = 3

/**
 * Compose the search text the way the pipeline wants it read: brand and model
 * lead, because query specificity is the single biggest lever on pricing
 * accuracy — "Whirlpool WRS325SDHZ Refrigerator" prices the item, "Refrigerator"
 * prices the category.
 *
 * A part already named in the description is not repeated, so an adjuster who
 * typed the brand into the description does not get it twice.
 */
export function composeQuery(parts: {
  make_mfr?: string | null
  model_number?: string | null
  description?: string | null
}): string {
  const description = (parts.description ?? '').trim()
  const lower = description.toLowerCase()
  const lead = [parts.make_mfr, parts.model_number]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0 && !lower.includes(p.toLowerCase()))
  return trimQuery([...lead, description].filter(Boolean).join(' '))
}

/**
 * Trim to the cap at a WORD boundary. Slicing mid-token would hand the engine
 * a fragment like "Refrigera" and quietly change what gets priced.
 */
export function trimQuery(query: string, max = QUERY_MAX): string {
  const text = query.trim().replace(/\s+/g, ' ')
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const boundary = cut.lastIndexOf(' ')
  return (boundary > 0 ? cut.slice(0, boundary) : cut).trim()
}

export function isQueryValid(query: string): boolean {
  const text = query.trim()
  return text.length >= QUERY_MIN && text.length <= QUERY_MAX
}
