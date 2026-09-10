/**
 * The Content Class picker's options, built from the depreciation schedule.
 *
 * Import-free on purpose: it runs under `node --input-type=module` for the unit
 * tests, the same way photo-rules / depr-rules / room-rules do.
 *
 * WHY THIS CHANGED (backend, 2026-09-10). Items now carry COMPOSITE schedule
 * ids — "Sporting Goods > Athletic Shoes & Cleats" — instead of the 25 flat
 * class names. `GET /v1/depreciation-rules` keeps returning the legacy
 * `categories` list so nothing breaks mid-migration, but a picker offering
 * only those shows an adjuster a Content Class value that is not in its own
 * list. The picker reads `schedule_categories` (31 categories -> 85 sub-lines)
 * and `schedule` (per-line metadata) instead.
 *
 * TWO THINGS THIS MODULE EXISTS TO GET RIGHT.
 *
 * 1. The current value is ALWAYS an option. Legacy names still resolve
 *    everywhere and there is no migration — rows adopt schedule lines only as
 *    they are re-classified — so a claim holds both shapes at once. The live
 *    sample did on the day this shipped: 50 legacy rows and one composite.
 *    A native <select> whose value matches no <option> silently DISPLAYS THE
 *    FIRST ONE, so an adjuster would read a row as a class it is not in. That
 *    is worse than an empty cell, and it is invisible.
 *
 * 2. Cells show the sub-line, not the composite id. The longest id is 77
 *    characters ("Automotive & Motorcycle Accessories > All Other Auto &
 *    Motorcycle Accessories"), which no grid cell can hold. The sub-line is
 *    specific enough on its own for 84 of the 85 lines. The exception is
 *    "Children's Furniture", which exists under both Furniture and Toys &
 *    Games — so a sub-line that repeats gets its category appended. That is
 *    computed, not hardcoded, so it stays correct if the schedule grows
 *    another collision.
 */

export type ScheduleMode = 'age_based' | 'flat_rate' | 'replacement_cost' | 'never' | 'manual'

export type ScheduleLine = {
  category: string
  subline: string
  /** A FLOAT: 4.5 for computers, 0.1667 for a two-month line. */
  useful_life_years: number | null
  mode: ScheduleMode
  flat_pct: number | null
  max_pct: number | null
  /** Never auto-priced; arrives needs_manual on purpose. */
  appraisal: boolean
  pcs_code: string | null
  source_group: string | null
  note: string | null
  /** Prose on which side of a contested edge this line owns. */
  boundary: string | null
}

export type DepreciationRules = {
  /** The 25 legacy flat classes. Kept for mid-migration fallback only. */
  categories: string[]
  rules: Record<string, unknown>
  /** Category -> its sub-lines, in the order the schedule lists them. */
  schedule_categories?: Record<string, string[]>
  /** Composite id -> line metadata. */
  schedule?: Record<string, ScheduleLine>
}

export type ClassOption = {
  /** What is stored on the item and sent to the API: the composite id. */
  value: string
  /** What the adjuster reads in the closed cell and in the list. */
  label: string
  /** Help text for the option, from the line's `boundary`. */
  title?: string
}

export type ClassGroup = { label: string; options: ClassOption[] }

export type ClassOptions = {
  groups: ClassGroup[]
  /**
   * The row's current value when it is not a schedule id — a legacy flat name,
   * or anything else the API stored. Rendered as its own option so the select
   * never displays a class the row is not in.
   */
  current: ClassOption | null
}

export const SCHEDULE_SEPARATOR = ' > '

export function scheduleId(category: string, subline: string): string {
  return `${category}${SCHEDULE_SEPARATOR}${subline}`
}

/** Split a composite id; a legacy flat name comes back with no subline. */
export function parseClassId(value: string): { category: string; subline: string | null } {
  const at = value.indexOf(SCHEDULE_SEPARATOR)
  if (at === -1) return { category: value, subline: null }
  return {
    category: value.slice(0, at),
    subline: value.slice(at + SCHEDULE_SEPARATOR.length),
  }
}

/**
 * The short label for a stored value, for anywhere the class is shown as text
 * rather than inside a select. A composite id reads as its sub-line; a legacy
 * name reads as itself.
 */
export function classLabel(value: string | null | undefined, rules?: DepreciationRules): string {
  if (!value) return ''
  const { subline } = parseClassId(value)
  if (subline == null) return value
  const repeats = rules?.schedule_categories
    ? Object.values(rules.schedule_categories).filter((subs) => subs.includes(subline)).length > 1
    : false
  return repeats ? `${subline} (${parseClassId(value).category})` : subline
}

export function buildClassOptions(
  rules: DepreciationRules | null | undefined,
  current?: string | null,
): ClassOptions {
  const grouped = rules?.schedule_categories

  // An older backend, or a response mid-deploy: fall back to the flat list so
  // the picker still works rather than rendering empty.
  if (!grouped || Object.keys(grouped).length === 0) {
    const flat = rules?.categories ?? []
    const options = flat.map((c) => ({ value: c, label: c }))
    const known = new Set(flat)
    return {
      groups: options.length ? [{ label: 'Content class', options }] : [],
      current: current && !known.has(current) ? { value: current, label: current } : null,
    }
  }

  // How many categories each sub-line appears under, to disambiguate repeats.
  const seen = new Map<string, number>()
  for (const subs of Object.values(grouped)) {
    for (const s of subs) seen.set(s, (seen.get(s) ?? 0) + 1)
  }

  const known = new Set<string>()
  const groups: ClassGroup[] = Object.entries(grouped).map(([category, subs]) => ({
    label: category,
    options: subs.map((subline) => {
      const value = scheduleId(category, subline)
      known.add(value)
      const line = rules?.schedule?.[value]
      return {
        value,
        label: (seen.get(subline) ?? 0) > 1 ? `${subline} (${category})` : subline,
        title: line?.boundary ?? undefined,
      }
    }),
  }))

  return {
    groups,
    current: current && !known.has(current) ? { value: current, label: current } : null,
  }
}
