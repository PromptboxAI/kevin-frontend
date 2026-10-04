import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import NewClaimButton from '../components/NewClaimButton'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError, api, downloadExport, downloadRecovery } from '../lib/api'
import { fmtDate, fmtUSD } from '../lib/format'
import { formFrom, letterheadLines } from '../lib/business-rules'
import type { ClaimListResponse, ClaimSummary, MeResponse } from '../lib/types'

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

  /**
   * The firm, only to decide whether the plain/branded choice means anything.
   * With no letterhead saved both buttons produce the identical file, and
   * offering a choice that changes nothing is worse than not offering one.
   */
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: 60_000,
  })
  const hasFirm =
    letterheadLines(formFrom(me.data?.business)).length > 0 ||
    Boolean(me.data?.business?.logo_url)

  const exported = (claims.data?.claims ?? []).filter((c) => c.exported_at)

  const pull = async (
    claim: ClaimSummary,
    kind: 'export' | 'recovery',
    format: 'xlsx' | 'pdf',
    /**
     * Per EXPORT, never stored — the same rule as the Export screen, and the
     * owner's reason for it: the same claim goes to a client one day and to a
     * carrier the next, so a remembered setting is one somebody has to
     * remember to flip back. This page used to re-pull branded with no way to
     * choose, so a document pulled from here could not be the one the Export
     * screen offered.
     */
    letterhead = true,
  ) => {
    setBusy(`${claim.claim_id}:${kind}:${format}:${letterhead ? 'brand' : 'plain'}`)
    setNotice(null)
    try {
      if (kind === 'export') {
        await downloadExport(claim.claim_id, format, letterhead ? {} : { letterhead: false })
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
      <AppHeader actions={<NewClaimButton />} />

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
              {/* Names the tab, not a button label. It used to say "use
                  Generate carrier export", and no control anywhere says that —
                  the Export screen's button reads "Export XactContents .xlsx"
                  or "Export PDF — inventory", and it changes with the options.
                  An instruction that names a control the reader cannot find is
                  worse than one that names the screen. */}
              Nothing exported yet. Open a claim and use its <strong>Export</strong> tab — the date
              it goes out is stamped once, and shown here.
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
                      {[
                        c.insured_name,
                        c.carrier,
                        `${c.item_count} ${c.item_count === 1 ? 'item' : 'items'}`,
                      ]
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
                      /* Says what the .xlsx button says, for the same reason:
                         a re-pull is rebuilt from the claim as it stands now,
                         which is the one surprising thing about this page. */
                      title={
                        hasFirm
                          ? 'The Proof of Loss as a PDF, with your letterhead, rebuilt from the claim as it stands now'
                          : 'The Proof of Loss as a PDF, rebuilt from the claim as it stands now'
                      }
                      onClick={() => void pull(c, 'export', 'pdf')}
                    >
                      <Icon d={I.download} size={11} /> PDF
                    </button>
                    {/* Only when there is a letterhead to leave off. */}
                    {hasFirm ? (
                      <button
                        type="button"
                        className="k-btn k-btn--ghost k-btn--sm"
                        disabled={busy !== null}
                        title="The same PDF without your firm's letterhead — for a carrier or another adjuster"
                        onClick={() => void pull(c, 'export', 'pdf', false)}
                      >
                        <Icon d={I.download} size={11} /> PDF, plain
                      </button>
                    ) : null}
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
