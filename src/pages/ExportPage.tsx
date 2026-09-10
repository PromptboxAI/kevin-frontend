import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import ClaimMissing from '../components/ClaimMissing'
import ClaimTabs from '../components/ClaimTabs'
import { I, Icon } from '../components/Icon'
import {
  ApiError,
  api,
  downloadExport,
  retryUnlessMissing,
  type PdfContents,
  type PhotosPerPage,
} from '../lib/api'
import { fmtInt, fmtPct, fmtUSD } from '../lib/format'
import type { ClaimItem, ClaimItemListResponse, ClaimSummary } from '../lib/types'

/**
 * The claim's Export tab -- the full report builder (screen 06).
 *
 * Ported from design/components/export.jsx: the same two panes, summary and
 * validation on the left, format and options on the right, k-export-* classes
 * throughout. It is a tab page rather than the design's modal, because the
 * quick paths already exist: the worksheet's Export button and the claims
 * menu's Export… are one-click, and THIS is where the options live.
 *
 * Deviations from the design, by decision:
 * - Options are the ones agreed for carrier submissions: XactContents .xlsx or
 *   Inventory PDF, and for the PDF, Worksheet only or Full packet (worksheet +
 *   captioned photo pages) at 1, 2, 4 or 6 photos per page. The design's
 *   comps / notes toggles and Delivery radio are not ported: nothing produces
 *   them (sharing is the worksheet's Share button).
 * - No size estimate: the design's "~340 MB" was a literal.
 *
 * Validation flags, never blocks (rule 16), and is computed from the rows.
 */

/**
 * The photo packet needs backend work (photo pages in the PDF renderer, and
 * the `contents` / `photos_per_page` params). Until it ships, FastAPI would
 * drop those params and return the worksheet-only PDF with a 200 -- so the
 * option renders, disabled, instead of producing a packet with no photos.
 * Flip when the backend confirms.
 */
const PHOTO_PACKET_LIVE = false

const PER_PAGE: PhotosPerPage[] = [1, 2, 4, 6]

type Format = 'xlsx' | 'pdf'

const FORMATS: { id: Format; label: string; sub: string; recommended?: boolean }[] = [
  {
    id: 'xlsx',
    label: 'XactContents Template',
    sub: '.xlsx · the worksheet, ready to import',
    recommended: true,
  },
  { id: 'pdf', label: 'Inventory PDF', sub: '.pdf · formatted report' },
]

const ITEM_PAGE = 500

export default function ExportPage() {
  const { claimId = '' } = useParams()
  const queryClient = useQueryClient()

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
    retry: retryUnlessMissing,
  })

  // Same key as Overview's, so moving between the tabs costs one fetch.
  const itemsPage = useQuery({
    queryKey: ['claim-items-flat', claimId],
    queryFn: () =>
      api.get<ClaimItemListResponse>(
        `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=${ITEM_PAGE}`,
      ),
    enabled: !!claimId,
  })

  const [format, setFormat] = useState<Format>('xlsx')
  const [contents, setContents] = useState<PdfContents>('worksheet')
  const [perPage, setPerPage] = useState<PhotosPerPage>(2)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useMemo(() => itemsPage.data?.items ?? [], [itemsPage.data])
  const check = useMemo(() => validate(items), [items])
  // The flat read is capped; say so rather than presenting a partial count as whole.
  const partial = (itemsPage.data?.count ?? 0) > items.length

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const c = claim.data
  const packet = format === 'pdf' && contents === 'packet'

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await downloadExport(
        claimId,
        format,
        packet ? { contents: 'packet', photosPerPage: perPage } : {},
      )
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `The export failed — HTTP ${err.status}.${err.requestId ? ` Reference ${err.requestId}.` : ''}`
          : 'The export failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  const exportLabel =
    format === 'xlsx' ? 'Export XactContents .xlsx' : packet ? 'Export PDF packet' : 'Export Inventory PDF'

  return (
    <div className="k-claim-ov">
      <AppHeader />

      <ClaimTabs
        active="Export"
        claimId={claimId}
        itemCount={c?.item_count}
        photoCount={c?.photo_count}
      />

      <div className="k-export-page">
        <div className="k-export-hd">
          <div>
            <div className="k-export-kicker">Final review · Export claim</div>
            <h1 className="k-export-title">{c?.name ?? claimId}</h1>
            <div className="k-export-meta">
              {[c?.claim_number, c?.carrier, c?.loss_address].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>
        </div>

        <div className="k-export-grid">
          {/* — Left: summary + validation — */}
          <div className="k-export-l">
            <section className="k-export-sec">
              <div className="k-export-sec-h">Summary</div>
              <div className="k-export-totals">
                <div className="k-et">
                  <div className="k-et-l">Items</div>
                  <div className="k-et-v">{fmtInt(c?.item_count)}</div>
                </div>
                <div className="k-et">
                  <div className="k-et-l">Photos</div>
                  <div className="k-et-v">{fmtInt(c?.photo_count)}</div>
                </div>
                <div className="k-et">
                  <div className="k-et-l">RCV + Tax</div>
                  <div className="k-et-v">{fmtUSD(c?.total_rcv)}</div>
                </div>
                <div className="k-et">
                  <div className="k-et-l">Depreciation</div>
                  <div className="k-et-v" style={{ color: 'var(--k-fg-3)' }}>
                    {(c?.total_depreciation ?? 0) > 0
                      ? `−${fmtUSD(c?.total_depreciation)}`
                      : fmtUSD(0)}
                  </div>
                </div>
                <div className="k-et">
                  <div className="k-et-l">
                    Sales tax{c?.tax_rate != null ? ` (${fmtPct(c.tax_rate)})` : ''}
                  </div>
                  <div className="k-et-v" style={{ color: 'var(--k-fg-3)' }}>
                    {fmtUSD(c?.total_tax)}
                  </div>
                </div>
                <div className="k-et">
                  <div className="k-et-l">Content classes</div>
                  <div className="k-et-v">{items.length ? fmtInt(check.classes) : '—'}</div>
                </div>
                <div className="k-et k-et--big">
                  <div className="k-et-l" style={{ color: 'var(--k-accent)' }}>
                    ACV total
                  </div>
                  <div className="k-et-v" style={{ color: 'var(--k-accent)' }}>
                    {fmtUSD(c?.total_acv)}
                  </div>
                </div>
              </div>
            </section>

            <section className="k-export-sec">
              <div className="k-export-sec-h">
                <span>Validation</span>
                {items.length ? (
                  <Badge tone={check.attention ? 'warn' : 'ok'} dot>
                    {check.attention
                      ? `${fmtInt(check.attention)} item${check.attention === 1 ? '' : 's'} need attention`
                      : 'No issues'}
                  </Badge>
                ) : null}
              </div>

              {itemsPage.isPending ? <p className="k-note">Checking items…</p> : null}

              {items.length ? (
                <div className="k-validations">
                  {check.unpriced.length > 0 ? (
                    <Flag
                      tone="warn"
                      title={`${fmtInt(check.unpriced.length)} item${check.unpriced.length === 1 ? ' is' : 's are'} unpriced`}
                      detail={`${names(check.unpriced)} — they count $0 toward the totals until you enter a value.`}
                      to={`/claims/${claimId}`}
                      action="Price them →"
                    />
                  ) : null}
                  {check.noModel.length > 0 ? (
                    <Flag
                      tone="warn"
                      title={`${fmtInt(check.noModel.length)} item${check.noModel.length === 1 ? '' : 's'} missing a model number`}
                      detail={`${names(check.noModel)} — matched on the photo alone. A model number lets Kevin re-price against an exact match.`}
                      to={`/claims/${claimId}`}
                      action="Review →"
                    />
                  ) : null}
                  {check.noClass.length > 0 ? (
                    <Flag
                      tone="warn"
                      title={`${fmtInt(check.noClass.length)} item${check.noClass.length === 1 ? '' : 's'} without a content class`}
                      detail={names(check.noClass)}
                      to={`/claims/${claimId}`}
                      action="Review →"
                    />
                  ) : (
                    <Flag
                      tone="ok"
                      title={`All ${fmtInt(items.length)} items have a content class`}
                    />
                  )}
                  <Flag
                    tone={check.sourced === check.priced ? 'ok' : 'warn'}
                    title={`Priced items with a source link: ${fmtInt(check.sourced)} of ${fmtInt(check.priced)}`}
                  />
                  {partial ? (
                    <p className="k-note">
                      Checked the first {fmtInt(items.length)} of {fmtInt(itemsPage.data?.count)}{' '}
                      items.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          {/* — Right: format + options — */}
          <div className="k-export-r">
            <section className="k-export-sec">
              <div className="k-export-sec-h">Export format</div>
              <div className="k-format-grid">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`k-format ${format === f.id ? 'k-format--on' : ''}`}
                    aria-pressed={format === f.id}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</span>
                      {f.recommended ? <Badge tone="ok">Recommended</Badge> : null}
                    </div>
                    <div className="k-format-sub">{f.sub}</div>
                    {format === f.id ? (
                      <div className="k-format-check">
                        <Icon d={I.check} size={11} stroke={2.5} />
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>

            {format === 'xlsx' ? (
              <p className="k-export-hint">
                The worksheet only — every line, ready for the XactContents importer. For photos,
                choose Inventory PDF.
              </p>
            ) : (
              <>
                <section className="k-export-sec">
                  <div className="k-export-sec-h">PDF contents</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Choice
                      on={contents === 'worksheet'}
                      onPick={() => setContents('worksheet')}
                      label="Worksheet only"
                      sub="The line-item table and totals"
                    />
                    <Choice
                      on={contents === 'packet'}
                      onPick={() => setContents('packet')}
                      disabled={!PHOTO_PACKET_LIVE}
                      label="Full packet — worksheet + photos"
                      sub={
                        PHOTO_PACKET_LIVE
                          ? `The worksheet, then ${fmtInt(c?.photo_count)} photos`
                          : 'Coming soon — photo pages are being built'
                      }
                    />
                  </div>
                </section>

                {packet ? (
                  <section className="k-export-sec">
                    <div className="k-export-sec-h">Photos per page</div>
                    <div className="k-segwrap" role="radiogroup" aria-label="Photos per page">
                      {PER_PAGE.map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={perPage === n}
                          className={`k-seg ${perPage === n ? 'k-seg--on' : ''}`}
                          onClick={() => setPerPage(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="k-export-hint">
                      Each photo is captioned with its line #, description and room, in worksheet
                      order.
                    </p>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="k-export-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {error ? (
              <span className="k-error">{error}</span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>
                Flagged items are for your review. Nothing here blocks the export.
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="k-btn k-btn--ghost" to={`/claims/${claimId}`}>
              Back to worksheet
            </Link>
            <button
              type="button"
              className="k-btn"
              disabled={busy || !c || c.status === 'processing'}
              title={c?.status === 'processing' ? 'Still processing — some lines have no price yet' : undefined}
              onClick={() => void run()}
            >
              <Icon d={I.download} size={12} /> {busy ? 'Preparing…' : exportLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Flag({
  tone,
  title,
  detail,
  to,
  action,
}: {
  tone: 'warn' | 'ok'
  title: string
  detail?: string
  to?: string
  action?: string
}) {
  return (
    <div className={`k-val k-val--${tone}`}>
      <Icon d={tone === 'ok' ? I.check : I.warn} size={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="k-val-t">{title}</div>
        {detail ? <div className="k-val-s">{detail}</div> : null}
      </div>
      {to && action ? (
        <Link className="k-link" to={to}>
          {action}
        </Link>
      ) : null}
    </div>
  )
}

function Choice({
  on,
  onPick,
  label,
  sub,
  disabled,
}: {
  on: boolean
  onPick: () => void
  label: string
  sub: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      className={`k-radio k-export-choice ${disabled ? 'k-export-choice--off' : ''}`}
      onClick={onPick}
    >
      <span className={`k-radio-dot ${on ? 'k-radio-dot--on' : ''}`} />
      <span style={{ flex: 1, textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 12.5 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>{sub}</span>
      </span>
    </button>
  )
}

/** Counts straight from the rows; the export itself never refuses (rule 16). */
function validate(items: ClaimItem[]) {
  const unpriced = items.filter((r) => r.rcv == null && r.status === 'needs_manual')
  const noModel = items.filter((r) => !r.model_number?.trim())
  const noClass = items.filter((r) => !r.category)
  const pricedRows = items.filter((r) => r.rcv != null)
  const sourced = pricedRows.filter(
    (r) => (r.alternative_sources ?? []).length > 0 || !!r.manual_source_url,
  ).length
  return {
    unpriced,
    noModel,
    noClass,
    priced: pricedRows.length,
    sourced,
    classes: new Set(items.map((r) => r.category).filter(Boolean)).size,
    // Distinct ITEMS: an unpriced row with no model number is one item, not two.
    attention: new Set([...unpriced, ...noModel, ...noClass].map((r) => r.id)).size,
  }
}

function names(rows: ClaimItem[], n = 3): string {
  const shown = rows.slice(0, n).map((r) => r.description?.trim() || 'Not identified')
  return shown.join(' · ') + (rows.length > n ? ` · +${rows.length - n} more` : '')
}
