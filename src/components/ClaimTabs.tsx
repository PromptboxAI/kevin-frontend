import { Link } from 'react-router-dom'

type Tab = 'Overview' | 'Photos' | 'Worksheet' | 'Notes & audit' | 'Export'

/**
 * Ported from shared.jsx -> ClaimTabs. Counts ride on Photos and Worksheet.
 * Surfaces not built yet render as disabled spans rather than dead links.
 */
const TABS: [Tab, string | null][] = [
  ['Overview', null],
  ['Photos', null],
  ['Worksheet', 'worksheet'],
  ['Notes & audit', null],
  ['Export', null],
]

export default function ClaimTabs({
  active,
  claimId,
  itemCount,
}: {
  active: Tab
  claimId: string
  itemCount?: number | null
}) {
  return (
    <div className="k-claim-tabs">
      {TABS.map(([label, slug]) => {
        const count = label === 'Worksheet' ? itemCount : null
        const inner = (
          <>
            {label}
            {count ? <span className="k-claim-tab-n">{count}</span> : null}
          </>
        )

        if (label === active) {
          return (
            <span key={label} className="k-claim-tab k-claim-tab--on">
              {inner}
            </span>
          )
        }
        if (!slug) {
          return (
            <span
              key={label}
              className="k-claim-tab k-claim-tab--todo"
              title="Not built yet in the production app"
            >
              {inner}
            </span>
          )
        }
        return (
          <Link key={label} className="k-claim-tab" to={`/claims/${claimId}`}>
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
