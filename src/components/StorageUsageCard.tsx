import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { barPct, buildStorage, fmtGB, fmtPool } from '../lib/storage-rules'
import type { ClaimListResponse } from '../lib/types'

/**
 * Storage & fair use. Ported from `StorageUsageCard` in
 * `design/components/settings-pages.jsx`.
 *
 * The design reads `KEVIN_STORAGE`, which derives GB from the claim roster's
 * photo counts. This does the same thing against the real roster — rule 19 is
 * explicit that the used figure is derived from actual photo counts, never a
 * typed-in literal, and `photo_count` is already on every ClaimSummary.
 *
 * The claim list is fetched with the same key the dashboard uses, so on a warm
 * cache this costs nothing; the card simply hides until the roster is in rather
 * than showing a zero that would read as "no storage used".
 */

export default function StorageUsageCard({
  includedGB,
  note,
}: {
  /** Enterprise contracts carry their own pool; omit for Pro's 500 GB. */
  includedGB?: number | null
  note?: React.ReactNode
}) {
  const claims = useQuery({
    queryKey: ['claims'],
    queryFn: () => api.get<ClaimListResponse>('/v1/claims'),
    staleTime: 60_000,
  })

  if (!claims.data) return null

  const s = buildStorage(claims.data.claims, includedGB ?? undefined)

  return (
    <section className="k-set-card">
      <div className="k-set-card-hd">Storage &amp; fair use</div>
      <div className="k-set-card-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--k-fg-3)' }}>
            <strong
              style={{ color: 'var(--k-fg)', fontFamily: 'var(--k-font-mono)', fontSize: 15 }}
            >
              {fmtGB(s.usedGB)}
            </strong>
            <span> of {fmtPool(s.includedGB)} included</span>
          </div>
          <div
            style={{ fontSize: 11.5, color: 'var(--k-fg-4)', fontFamily: 'var(--k-font-mono)' }}
          >
            {s.pct}%
          </div>
        </div>

        <div className="k-store-track">
          <div
            className="k-store-fill k-store-fill--warm"
            style={{ width: barPct(s.warmGB, s.includedGB) + '%' }}
          />
          <div
            className="k-store-fill k-store-fill--cold"
            style={{ width: barPct(s.coldGB, s.includedGB) + '%' }}
          />
        </div>

        <div className="k-store-keys">
          <span className="k-store-key">
            <i className="k-store-dot k-store-dot--warm" />
            Active · {fmtGB(s.warmGB)} · {s.warmClaims} claim{s.warmClaims === 1 ? '' : 's'}
          </span>
          <span className="k-store-key">
            <i className="k-store-dot k-store-dot--cold" />
            Archived · {fmtGB(s.coldGB)} · {s.coldClaims} claim{s.coldClaims === 1 ? '' : 's'}
          </span>
          <span className="k-store-key" style={{ color: 'var(--k-fg-4)' }}>
            {s.photos.toLocaleString()} photos · ~{s.avgPhotoMB} MB avg
          </span>
        </div>

        <div className="k-store-note">
          <p>
            <strong>Nothing is ever deleted to reclaim space.</strong> Claims you close move to
            archived storage after {s.coldAfterDays} days — still yours, still openable, just a
            moment slower to load the first time.
          </p>
          <p>
            {note ?? (
              <>
                Claims stay unlimited on Pro. If an account goes past {fmtPool(s.includedGB)} we
                email you first — never a lockout mid-claim — then additional storage bills at $
                {s.overagePrice}/mo per {s.overageGB} GB.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
