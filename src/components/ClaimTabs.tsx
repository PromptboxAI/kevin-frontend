import { Link } from 'react-router-dom'

type Tab = 'Overview' | 'Photos' | 'Worksheet' | 'Notes & audit' | 'Export'

/**
 * Ported from shared.jsx -> ClaimTabs. Counts ride on Photos and Worksheet.
 * Surfaces not built yet render as disabled spans rather than dead links.
 */
const TABS: [Tab, string | null][] = [
  ['Overview', 'overview'],
  // The gallery, not staging. Staging is one INGEST SESSION; this is every
  // photo on the claim, including the ones a session already promoted.
  ['Photos', 'photos'],
  ['Worksheet', 'worksheet'],
  // There is no claim-wide audit feed and none should be built: the trail is
  // per item, and it lives in the item drawer's History panel. The tab points
  // at the worksheet, where opening any row reaches it.
  ['Notes & audit', 'worksheet'],
  ['Export', null],
]

export default function ClaimTabs({
  active,
  claimId,
  itemCount,
  photoCount,
}: {
  active: Tab
  claimId: string
  itemCount?: number | null
  photoCount?: number | null
}) {
  return (
    <div className="k-claim-tabs">
      {TABS.map(([label, slug]) => {
        const count =
          label === 'Worksheet' ? itemCount : label === 'Photos' ? photoCount : null
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
          <Link
            key={label}
            className="k-claim-tab"
            to={slug === 'worksheet' ? `/claims/${claimId}` : `/claims/${claimId}/${slug}`}
            title={
              label === 'Notes & audit'
                ? "Open any row to see that item's history"
                : undefined
            }
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
