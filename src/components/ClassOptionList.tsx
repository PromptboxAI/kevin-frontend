import { buildClassOptions, type DepreciationRules } from '../lib/schedule-rules'

/**
 * The <option>s for a Content Class <select>, grouped by schedule category.
 *
 * Renders children only, so each picker keeps its own <select> — the grid
 * cell, the drawer, the bulk re-categorize menu and the proposal form all have
 * different styling and handlers, and this is the one part they must agree on.
 *
 * The row's current value is ALWAYS rendered, first, when it is not a schedule
 * id. Legacy flat names still resolve and there is no migration, so a claim
 * holds both shapes at once; a native <select> whose value matches no option
 * silently shows the first one, and the adjuster reads the row as the wrong
 * class. See schedule-rules.ts.
 */
export default function ClassOptionList({
  rules,
  current,
}: {
  rules: DepreciationRules | null | undefined
  current?: string | null
}) {
  const { groups, current: extra } = buildClassOptions(rules, current)
  return (
    <>
      {extra ? (
        <option value={extra.value} title="Current class — pick a schedule line to re-classify">
          {extra.label}
        </option>
      ) : null}
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((o) => (
            <option key={o.value} value={o.value} title={o.title}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}
