import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import ClaimMissing from '../components/ClaimMissing'
import ClaimTabs from '../components/ClaimTabs'
import { I, Icon } from '../components/Icon'
import {
  ApiError,
  api,
  downloadExport,
  printExport,
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
 *   a PDF, and for the PDF two toggles -- Inventory and Photos -- so it can be
 *   the inventory alone, the photos alone, or both, at 1, 2, 4 or 6 captioned
 *   photos per page. A 500-photo packet is often too big to send a carrier,
 *   which is why the inventory must stand alone. The design's comps / notes
 *   toggles and Delivery radio are not ported: nothing produces them (sharing
 *   is the worksheet's Share button).
 * - No size estimate: the design's "~340 MB" was a literal.
 *
 * Validation flags, never blocks (rule 16), and is computed from the rows.
 */

/**
 * What the backend can build: `contents=packet` (3c193aa) and `contents=photos`
 * (dae921c), so both toggles are free. Photos alone does NOT stamp
 * `exported_at` -- the Proof of Loss is the schedule -- so no copy on this page
 * may say it marks the claim exported.
 */
const PHOTO_PACKET_LIVE = true
const PHOTOS_ONLY_LIVE = true

const PER_PAGE: PhotosPerPage[] = [1, 2, 4, 6]

type Format = 'xlsx' | 'pdf'

const FORMATS: { id: Format; label: string; sub: string; recommended?: boolean }[] = [
  {
    id: 'xlsx',
    label: 'XactContents Template',
    sub: '.xlsx · the worksheet, ready to import',
    recommended: true,
  },
  { id: 'pdf', label: 'PDF', sub: '.pdf · inventory, photos, or both' },
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
  const [withInventory, setWithInventory] = useState(true)
  const [withPhotos, setWithPhotos] = useState(false)
  const [perPage, setPerPage] = useState<PhotosPerPage>(2)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** A successful export that still needs saying -- e.g. no photos linked. */
  const [info, setInfo] = useState<string | null>(null)

  const items = useMemo(() => itemsPage.data?.items ?? [], [itemsPage.data])
  const check = useMemo(() => validate(items), [items])
  // The flat read is capped; say so rather than presenting a partial count as whole.
  const partial = (itemsPage.data?.count ?? 0) > items.length

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const c = claim.data
  // The two toggles, as the API's one `contents` value.
  const pdfContents: PdfContents =
    withInventory && withPhotos ? 'packet' : withPhotos ? 'photos' : 'worksheet'

  const wantsPhotos = format === 'pdf' && pdfContents !== 'worksheet'

  /**
   * The same document, opened in the browser's PDF viewer instead of saved --
   * a look before it goes to a carrier or a client. It is the SERVER's PDF,
   * not a rendering of our own, so what is reviewed is what downloads.
   *
   * Caveat: it is the same endpoint, so it stamps `exported_at` like any
   * export (there is no non-stamping route yet; asked of the backend).
   * Exports are repeatable, so a later one is simply a new version.
   */
  const preview = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await printExport(claimId, wantsPhotos ? { contents: pdfContents, photosPerPage: perPage } : {})
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the preview.')
    } finally {
      setBusy(false)
    }
  }

  const run = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const result = await downloadExport(
        claimId,
        format,
        wantsPhotos ? { contents: pdfContents, photosPerPage: perPage } : {},
      )
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      // Verify against what the server built, never the query string: an
      // unrecognised param is dropped silently and the PDF comes back without
      // photos (FRONTEND.md "Photo packet").
      if (wantsPhotos && result.contents && result.contents !== pdfContents) {
        setError('The server sent the inventory without photos. Try again, or contact support.')
      } else if (wantsPhotos && result.photos === 0) {
        setInfo('No photos are linked to line items yet, so the PDF is the inventory alone.')
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 413
          ? 'This claim has more than 500 photos linked to items, too many for one PDF. Export the inventory alone, or contact support.'
          : // Photos alone with nothing linked: the API refuses rather than
            // hand back an empty PDF that looks finished.
            err instanceof ApiError && err.status === 409 && pdfContents === 'photos'
            ? 'No photos are linked to line items yet, so there is nothing for a photos PDF.'
            : err instanceof ApiError
            ? `The export failed — HTTP ${err.status}.${err.requestId ? ` Reference ${err.requestId}.` : ''}`
            : 'The export failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  const exportLabel =
    format === 'xlsx'
      ? 'Export XactContents .xlsx'
      : pdfContents === 'packet'
        ? 'Export PDF — inventory + photos'
        : pdfContents === 'photos'
          ? 'Export PDF — photos'
          : 'Export PDF — inventory'

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
                choose PDF.
              </p>
            ) : (
              <>
                {/* Two independent toggles, as Xactimate's report picker works:
                    inventory alone, photos alone, or both. At least one stays
                    on -- an empty PDF is not an export. */}
                <section className="k-export-sec">
                  <div className="k-export-sec-h">Include in the PDF</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Toggle
                      on={withInventory}
                      onChange={(next) => {
                        setWithInventory(next)
                        if (!next) setWithPhotos(true)
                      }}
                      disabled={!PHOTOS_ONLY_LIVE}
                      label="Inventory"
                      sub="The line-item worksheet and totals"
                    />
                    <Toggle
                      on={withPhotos}
                      onChange={(next) => {
                        setWithPhotos(next)
                        if (!next) setWithInventory(true)
                      }}
                      disabled={!PHOTO_PACKET_LIVE}
                      label="Photos"
                      sub={
                        PHOTO_PACKET_LIVE
                          ? 'Photos linked to line items, captioned, in worksheet order'
                          : 'Coming soon — photo pages are being built'
                      }
                    />
                  </div>
                </section>

                {pdfContents !== 'worksheet' ? (
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
                      Each photo is captioned with its line #, description and room. A PDF with
                      hundreds of photos takes up to a minute to build and is too large to email —
                      it downloads to your computer.
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
            ) : info ? (
              <span style={{ fontSize: 12, color: 'var(--k-fg-2)' }}>{info}</span>
            ) : busy && wantsPhotos ? (
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>
                Building the PDF with photos — this can take up to a minute.
              </span>
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
            {/* PDF only: a browser cannot render a spreadsheet, and offering
                a preview that downloads the file anyway would be a lie. */}
            {format === 'pdf' ? (
              <button
                type="button"
                className="k-btn k-btn--ghost"
                disabled={busy || !c || c.status === 'processing'}
                title="Opens the PDF in a new tab — the same document the download saves"
                onClick={() => void preview()}
              >
                <Icon d={I.eye} size={12} /> Preview
              </button>
            ) : null}
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

        {/* Checks live BELOW the export, not above it (owner, 2026-09-19):
            they are notes to read or ignore, never a gate (rule 16), and a
            wall of grey text above the controls read as a blocked export. */}
        {items.length ? (
          <section className="k-export-checks">
            <div className="k-export-sec-h">
              <span>Before you send it</span>
              <Badge tone={check.attention ? 'warn' : 'ok'} dot>
                {check.attention
                  ? `${fmtInt(check.attention)} to look at`
                  : 'Nothing to flag'}
              </Badge>
            </div>

            <div className="k-export-checklist">
              {check.unpriced.length > 0 ? (
                <Alert
                  tone="wait"
                  title={`${fmtInt(check.unpriced.length)} unpriced item${check.unpriced.length === 1 ? '' : 's'}`}
                  action={
                    <Link className="k-btn k-btn--sm k-btn--ghost" to={`/claims/${claimId}`}>
                      Price them →
                    </Link>
                  }
                >
                  They count $0 toward the totals until you enter a value.
                </Alert>
              ) : null}

              {check.noModel.length > 0 ? (
                <Alert
                  tone="info"
                  title={`${fmtInt(check.noModel.length)} without a model number`}
                  action={
                    <Link className="k-btn k-btn--sm k-btn--ghost" to={`/claims/${claimId}`}>
                      Review →
                    </Link>
                  }
                >
                  Matched on the photo alone. A model number prices against an exact match.
                </Alert>
              ) : null}

              {check.noClass.length > 0 ? (
                <Alert
                  tone="info"
                  title={`${fmtInt(check.noClass.length)} without a content class`}
                  action={
                    <Link className="k-btn k-btn--sm k-btn--ghost" to={`/claims/${claimId}`}>
                      Review →
                    </Link>
                  }
                >
                  A class sets the depreciation schedule for the line.
                </Alert>
              ) : null}

              {check.attention === 0 ? (
                <Alert tone="success" title="Every line is priced and classed">
                  Nothing needs your attention before this goes out.
                </Alert>
              ) : null}

              {partial ? (
                <p className="k-note" style={{ margin: 0 }}>
                  Checked the first {fmtInt(items.length)} of {fmtInt(itemsPage.data?.count)} items.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}


/** The design's `.k-toggle` checkbox row (export.jsx "Include" list). */
function Toggle({
  on,
  onChange,
  label,
  sub,
  disabled,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
  sub: string
  disabled?: boolean
}) {
  return (
    <label className={`k-toggle ${disabled ? 'k-toggle--off' : ''}`}>
      <input
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="k-toggle-box">{on ? <Icon d={I.check} size={10} stroke={2.5} /> : null}</span>
      <span style={{ flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12.5,
            color: disabled ? 'var(--k-fg-3)' : 'var(--k-fg)',
          }}
        >
          {label}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>{sub}</span>
      </span>
    </label>
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

