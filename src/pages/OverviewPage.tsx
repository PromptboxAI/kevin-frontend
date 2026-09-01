import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimTabs from '../components/ClaimTabs'
import ClaimStateMenu from '../components/ClaimStateMenu'
import { I, Icon } from '../components/Icon'
import { api } from '../lib/api'
import { fmtDate, fmtPct, fmtUSD, fmtUSDshort } from '../lib/format'
import { getClaimPhotos } from '../lib/photos'
import {
  CLASS_COLORS,
  attention,
  classBreakdown,
  highestValue,
  pendingPhotos,
  stateFacets,
  withTail,
} from '../lib/photo-rules'
import type { ClaimItemListResponse, ClaimSummary } from '../lib/types'

/**
 * Screen 12 -- the claim's landing page, before the worksheet.
 *
 * Ported from `design/components/claim-overview.jsx`. Layout and class names
 * lifted verbatim; every number is the live payload. Where the prototype
 * derived a figure the API does not carry, the card says what it knows instead
 * of inventing the rest -- each such case is marked below.
 */

const CLASS_KEEP = 12

export default function OverviewPage() {
  const { claimId = '' } = useParams()

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
  })

  const { data: itemsPage } = useQuery({
    queryKey: ['claim-items-flat', claimId],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=500`,
      ),
    enabled: !!claimId,
  })

  const { data: photoPage } = useQuery({
    queryKey: ['claim-photos', claimId],
    queryFn: () => getClaimPhotos(claimId),
    enabled: !!claimId,
  })

  const items = useMemo(() => itemsPage?.items ?? [], [itemsPage])
  const photos = useMemo(() => photoPage?.photos ?? [], [photoPage])

  const classes = useMemo(() => withTail(classBreakdown(items), CLASS_KEEP), [items])
  const top = useMemo(() => highestValue(items, 6), [items])
  const flags = useMemo(() => attention(items), [items])
  const pending = useMemo(() => pendingPhotos(photos), [photos])
  /** The SAME buckets the gallery filters by, so the two cannot disagree. */
  const facets = useMemo(() => stateFacets(photos), [photos])

  const classTotal = classes.reduce((a, c) => a + c.rcv, 0)

  /** Lifecycle changes report here rather than silently. */
  const [notice, setNotice] = useState<string | null>(null)

  if (isLoading || !claim) {
    return (
      <div className="k-claim-ov">
        <AppHeader />
        <div style={{ padding: 24, fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading claim…</div>
      </div>
    )
  }

  return (
    <div className="k-claim-ov">
      <AppHeader
        actions={
          <>
            <Link className="k-btn k-btn--ghost" to={`/claims/${claimId}/staging`}>
              <Icon d={I.plus} size={12} /> Add photos
            </Link>
            <Link className="k-btn k-btn--ghost" to={`/claims/${claimId}/import`}>
              <Icon d={I.file} size={12} /> Import a list
            </Link>
            <ClaimStateMenu claim={claim} onNotice={setNotice} />
            <Link className="k-btn" to={`/claims/${claimId}`}>
              Open worksheet →
            </Link>
          </>
        }
      />

      <ClaimTabs
        active="Overview"
        claimId={claimId}
        itemCount={claim.item_count}
        photoCount={claim.photo_count}
      />

      <section className="k-claim-ov-hd">
        <div>
          <div
            className="k-mono"
            style={{
              fontSize: 11,
              color: 'var(--k-fg-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Claim overview
          </div>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 36,
              letterSpacing: '-0.025em',
              margin: '6px 0 6px',
              lineHeight: 1.05,
            }}
          >
            {claim.name}
          </h1>
          <div className="k-claim-ov-meta">
            {claim.insured_name ? (
              <span>
                <strong>Insured</strong> · {claim.insured_name}
              </span>
            ) : null}
            {claim.date_of_loss || claim.loss_type ? (
              <span>
                <strong>Loss</strong> ·{' '}
                {[fmtDate(claim.date_of_loss), claim.loss_type].filter(Boolean).join(' · ')}
              </span>
            ) : null}
            {claim.loss_address ? (
              <span>
                <strong>Address</strong> · {claim.loss_address}
              </span>
            ) : null}
            {claim.carrier ? (
              <span>
                <strong>Carrier</strong> · {claim.carrier}
              </span>
            ) : null}
            {claim.claim_number ? (
              <span>
                <strong>Claim #</strong> · {claim.claim_number}
              </span>
            ) : null}
            {claim.tax_rate != null ? (
              <span>
                <strong>Tax</strong> · {fmtPct(claim.tax_rate)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Totals are the claim's own server-computed sums, read verbatim --
            never re-added from the rows (the money chain is server-owned). */}
        <div className="k-claim-ov-stats">
          <div>
            <div className="k-tot-l">Items</div>
            <div className="k-tot-v">{claim.item_count}</div>
          </div>
          <div>
            <div className="k-tot-l">Photos</div>
            <div className="k-tot-v">{claim.photo_count}</div>
          </div>
          <div>
            <div className="k-tot-l">RCV</div>
            <div className="k-tot-v">{fmtUSD(claim.total_rcv)}</div>
          </div>
          <div>
            <div className="k-tot-l">$ Depr.</div>
            <div className="k-tot-v" style={{ color: 'var(--k-fg-3)' }}>
              −{fmtUSD(claim.total_depreciation)}
            </div>
          </div>
          <div>
            <div className="k-tot-l" style={{ color: 'var(--k-accent)' }}>
              ACV
            </div>
            <div className="k-tot-v" style={{ color: 'var(--k-accent)' }}>
              {fmtUSD(claim.total_acv)}
            </div>
          </div>
        </div>
      </section>

      <div className="k-claim-ov-body">
        {notice ? (
          <section className="k-flags-band k-flags-band--one">
            <div className="k-flag-card">
              <Icon d={I.info} size={16} />
              <div style={{ fontSize: 12.5 }}>{notice}</div>
            </div>
          </section>
        ) : null}

        {/* One strip, and only when something is actually waiting. A permanent
            "0 items need attention" card is noise, which is why the design
            dropped the celebratory variants. */}
        {flags.total > 0 ? (
          <section className="k-flags-band k-flags-band--one">
            <div className="k-flag-card">
              <Icon d={I.info} size={16} />
              {/* flex:1 so the trailing link sits at the card's edge. The
                  design's markup omits it because `.k-flags-band` is a
                  3-column grid there; at `--one` the card is full width and
                  the link would otherwise strand mid-row. */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {flags.total} item{flags.total === 1 ? '' : 's'} waiting on your
                  price
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 2 }}>
                  Kevin found no confident price — blank cells, ready for your value
                </div>
              </div>
              <Link className="k-link" to={`/claims/${claimId}`}>
                Review →
              </Link>
            </div>
          </section>
        ) : null}

        {/* Rule 22(e): staged photos have produced no line items and must never
            inflate the claim's counts. They are still the adjuster's, so they
            are named rather than hidden. */}
        {pending > 0 ? (
          <section className="k-flags-band k-flags-band--one">
            <div className="k-flag-card">
              <Icon d={I.clock} size={16} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {pending} photo{pending === 1 ? '' : 's'} still in staging
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-3)', marginTop: 2 }}>
                  Uploaded but not promoted, so nothing above counts them yet.
                </div>
              </div>
              <Link className="k-link" to={`/claims/${claimId}/staging`}>
                Open staging →
              </Link>
            </div>
          </section>
        ) : null}

        <div className="k-claim-ov-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Items by content class</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                  {claim.item_count} items · {classBreakdown(items).length} classes ·{' '}
                  {fmtUSDshort(classTotal)} priced
                </span>
              </div>

              {classTotal > 0 ? (
                <div className="k-stack-bar" title="Composition by RCV">
                  {classes.map((c, i) => (
                    <div
                      key={c.cls}
                      title={`${c.cls} · ${c.n} items · ${fmtUSDshort(c.rcv)}`}
                      style={{
                        width: `${(c.rcv / classTotal) * 100}%`,
                        background: CLASS_COLORS[i] ?? 'var(--k-line-2)',
                      }}
                    />
                  ))}
                </div>
              ) : null}

              <div className="k-class-list">
                {classes.map((c, i) => (
                  <div key={c.cls} className="k-class-row">
                    <span
                      className="k-class-dot"
                      style={{ background: CLASS_COLORS[i] ?? 'var(--k-line-2)' }}
                    />
                    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--k-fg)' }}>
                      {c.cls}
                      {/* Not amber: the payload carries no special-limits flag,
                          and deriving one from the class name at render time is
                          the exact bug rule 20 names. Unpriced is its own
                          neutral state (rule 12). */}
                      {c.unpriced > 0 ? (
                        <span style={{ marginLeft: 6 }}>
                          <Badge tone="quiet">{c.unpriced} unpriced</Badge>
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="k-mono"
                      style={{ fontSize: 12, color: 'var(--k-fg-3)', width: 56, textAlign: 'right' }}
                    >
                      {c.n}
                    </span>
                    <span
                      className="k-mono"
                      style={{ fontSize: 12.5, fontWeight: 600, width: 84, textAlign: 'right' }}
                    >
                      {fmtUSDshort(c.rcv)}
                    </span>
                  </div>
                ))}
                {classes.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--k-fg-4)', padding: '4px 0' }}>
                    No items on this claim yet.
                  </p>
                ) : null}
              </div>
            </section>

            {/*
              The design's second card was "Photos by room". Every photo on a
              real claim comes back room: null -- nothing sends the per-batch
              room at upload -- and the prototype filled that card by
              DISTRIBUTING the claim's photo count across rooms by largest
              remainder. That is a plausible-looking fiction on a document an
              adjuster defends, so the card reports the real split instead.
            */}
            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Photos</span>
                <Link className="k-link" to={`/claims/${claimId}/photos`}>
                  Open photo gallery →
                </Link>
              </div>
              <div style={{ padding: '4px 14px 14px' }}>
                {facets.map((f) => (
                  <div className="k-class-row" key={f.key}>
                    <span style={{ flex: 1, fontSize: 12.5 }} title={f.blurb}>
                      {f.label}
                    </span>
                    <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {f.n}
                    </span>
                  </div>
                ))}
                <p
                  style={{
                    fontSize: 11.5,
                    color: 'var(--k-fg-4)',
                    lineHeight: 1.5,
                    margin: '10px 0 0',
                  }}
                >
                  Photos are always at least as many as items — context shots and
                  second frames of an item already counted.
                </p>
              </div>
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Highest-value items</span>
                <Link className="k-link" to={`/claims/${claimId}`}>
                  View all →
                </Link>
              </div>
              <div style={{ padding: '4px 14px 12px' }}>
                {top.map((it) => (
                  <div key={it.id} className="k-hv-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {it.description ?? `Line ${it.id}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 1 }}>
                        {[it.make_mfr, it.category].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="k-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                      {fmtUSD(it.rcv_total_incl)}
                    </div>
                  </div>
                ))}
                {top.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--k-fg-4)', padding: '4px 0' }}>
                    Nothing priced yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="k-ov-card">
              <div className="k-ov-card-hd">
                <span>Where this claim stands</span>
              </div>
              <div style={{ padding: '4px 14px 14px' }}>
                <div className="k-class-row">
                  <span style={{ flex: 1, fontSize: 12.5 }}>Priced</span>
                  <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {claim.status_counts.completed}
                  </span>
                </div>
                <div className="k-class-row">
                  <span style={{ flex: 1, fontSize: 12.5 }}>Waiting on your price</span>
                  <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {claim.status_counts.needs_manual}
                  </span>
                </div>
                {claim.status_counts.overridden > 0 ? (
                  <div className="k-class-row">
                    <span style={{ flex: 1, fontSize: 12.5 }}>Edited by you</span>
                    <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {claim.status_counts.overridden}
                    </span>
                  </div>
                ) : null}
                {claim.status_counts.processing > 0 ? (
                  <div className="k-class-row">
                    <span style={{ flex: 1, fontSize: 12.5 }}>Still pricing</span>
                    <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {claim.status_counts.processing}
                    </span>
                  </div>
                ) : null}
                {claim.status_counts.failed > 0 ? (
                  <div className="k-class-row">
                    <span style={{ flex: 1, fontSize: 12.5 }}>Failed</span>
                    <span className="k-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {claim.status_counts.failed}
                    </span>
                  </div>
                ) : null}
                {/* Coverage, deliberately NOT an alarm: most soft goods have
                    no model number to be missing. It still belongs here -- it is
                    an export column, and it is what makes a line defensible. */}
                <div className="k-class-row">
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--k-fg-3)' }}>
                    With a model number
                  </span>
                  <span
                    className="k-mono"
                    style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--k-fg-3)' }}
                  >
                    {items.length - flags.noModel} of {items.length}
                  </span>
                </div>

                {claim.exported_at ? (
                  <p
                    style={{
                      fontSize: 11.5,
                      color: 'var(--k-fg-4)',
                      lineHeight: 1.5,
                      margin: '10px 0 0',
                    }}
                  >
                    Last exported {fmtDate(claim.exported_at)}. A later export is a
                    new version — the one already sent still opens as it was.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
