import { Link } from 'react-router-dom'

type Tab = 'Overview' | 'Photos' | 'Worksheet' | 'Notes & audit' | 'Export'

/**
 * Ported from shared.jsx -> ClaimTabs. Counts ride on Photos and Worksheet.
 * Surfaces not built yet render as greyed "Soon" spans rather than dead links.
 */
const TABS: [Tab, string | null][] = [
  ['Overview', 'overview'],
  // The gallery, not staging. Staging is one INGEST SESSION; this is every
  // photo on the claim, including the ones a session already promoted.
  ['Photos', 'photos'],
  ['Worksheet', 'worksheet'],
  // Greyed "Soon", by decision. It used to link to the worksheet -- where the
  // per-item History panel lives -- which from the worksheet itself was a
  // click that did nothing. A claim-wide timeline needs a claim-wide events
  // endpoint the backend does not have; until then the tab says so.
  ['Notes & audit', null],
  // The full report builder. The worksheet's Export button and the claims
  // menu's Export… stay the quick, one-click paths.
  ['Export', 'export'],
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
              title="Coming soon. Each item's change history is in its item panel."
              aria-disabled="true"
            >
              {inner}
              <span className="k-claim-tab-soon">Soon</span>
            </span>
          )
        }
        return (
          <Link
            key={label}
            className="k-claim-tab"
            to={slug === 'worksheet' ? `/claims/${claimId}` : `/claims/${claimId}/${slug}`}
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
