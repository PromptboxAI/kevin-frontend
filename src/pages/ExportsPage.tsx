import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError, api, downloadExport, downloadRecovery } from '../lib/api'
import { fmtDate, fmtUSD } from '../lib/format'
import type { ClaimListResponse, ClaimSummary } from '../lib/types'

/**
 * Screen 13 -- exports.
 *
 * WHAT THIS IS NOT. The design draws a full ledger: an id per export
 * (`EXP-2026-1138`), a version number, a file size, and a per-file status of
 * downloaded / link shared / superseded. None of that exists. There is no
 * exports table and no exports endpoint -- the only record an export leaves is
 * `claims.exported_at`, a single first-write-wins timestamp, and re-exporting
 * overwrites nothing because it never wrote a row in the first place.
 *
 * So this page is built from what is true: the claims that have been exported,
 * when they were first exported, and the two documents you can pull again for
 * each. Inventing version numbers and file sizes would produce a screen that
 * looks authoritative about a history nobody is keeping -- on the one artifact
 * that goes to a carrier. Filed as ask 30.
 */
export default function ExportsPage() {
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const claims = useQuery({
    queryKey: ['claims', 'exported'],
    queryFn: () => api.get<ClaimListResponse>('/v1/claims?limit=100'),
  })

  const exported = (claims.data?.claims ?? []).filter((c) => c.exported_at)

  const pull = async (claim: ClaimSummary, kind: 'export' | 'recovery', format: 'xlsx' | 'pdf') => {
    setBusy(`${claim.claim_id}:${kind}:${format}`)
    setNotice(null)
    try {
      if (kind === 'export') {
        await downloadExport(claim.claim_id, format)
        // Re-pulling the Proof of Loss does NOT re-stamp: exported_at is
        // first-write-wins, so the date on screen stays the date it went out.
        setNotice(`${claim.name} — Proof of Loss downloaded.`)
      } else {
        await downloadRecovery(claim.claim_id, format)
        setNotice(`${claim.name} — recovery request downloaded.`)
      }
    } catch (error) {
      setNotice(
        error instanceof ApiError && error.status === 409
          ? `${claim.name} has no replaced items yet, so there is no recovery request to build.`
          : error instanceof Error
            ? error.message
            : 'That download failed.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="k-shell">
      <AppHeader />

      <div className="k-claims-body">
        <div style={{ padding: '22px 28px 0' }}>
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
            Exports
          </div>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 28,
              letterSpacing: '-0.022em',
              margin: '4px 0 4px',
            }}
          >
            Everything you’ve sent.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 680, lineHeight: 1.55 }}>
            Kevin records when a claim was first exported, not a copy of each
            file. Pulling a document again rebuilds it from the claim as it
            stands today — so a claim edited since going out will not match the
            copy the carrier is holding.
          </p>

          {notice ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-2)', marginTop: 10 }}>{notice}</p>
          ) : null}
        </div>

        <div style={{ padding: '18px 28px 40px' }}>
          {claims.isLoading ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading…</p>
          ) : exported.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)', lineHeight: 1.55 }}>
              Nothing exported yet. Open a claim and use <strong>Generate carrier
              export</strong> — the date it goes out is stamped once and shown here.
            </p>
          ) : (
            <div className="k-exp-rows">
              {exported.map((c) => (
                <div key={c.claim_id} className="k-exp-row">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Link to={`/claims/${c.claim_id}`} style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {c.name}
                      </Link>
                      <Badge tone="quiet">{fmtDate(c.exported_at)}</Badge>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                      {[c.insured_name, c.carrier, `${c.item_count} items`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>

                  <div className="k-mono" style={{ fontSize: 12.5, textAlign: 'right', minWidth: 110 }}>
                    <div style={{ fontWeight: 600 }}>{fmtUSD(c.total_rcv)}</div>
                    <div style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                      ACV {fmtUSD(c.total_acv)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="k-btn k-btn--ghost k-btn--sm"
                      disabled={busy !== null}
                      title="The Proof of Loss, rebuilt from the claim as it stands now"
                      onClick={() => void pull(c, 'export', 'xlsx')}
                    >
                      <Icon d={I.download} size={11} /> .xlsx
                    </button>
                    <button
                      type="button"
                      className="k-btn k-btn--ghost k-btn--sm"
                      disabled={busy !== null}
                      onClick={() => void pull(c, 'export', 'pdf')}
                    >
                      <Icon d={I.download} size={11} /> PDF
                    </button>
                    {/* A different document, not a variant -- and one that
                        409s until something has actually been replaced, which
                        is why the failure says so in words. */}
                    <button
                      type="button"
                      className="k-btn k-btn--ghost k-btn--sm"
                      disabled={busy !== null}
                      title="Depreciation Recovery Request — post-settlement, and never stamps the claim"
                      onClick={() => void pull(c, 'recovery', 'xlsx')}
                    >
                      <Icon d={I.clock} size={11} /> Recovery
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
