import { useEffect, useMemo, useState } from 'react'
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
  EXPORT_JOB_TERMINAL,
  createExportLink,
  deleteExportLink,
  downloadExport,
  getExportJob,
  listExportJobs,
  printExport,
  retryUnlessMissing,
  startExportJob,
  type ExportJob,
  type ExportSort,
  type PdfContents,
  type PhotosPerPage,
} from '../lib/api'
import { matchesReview, reviewHref } from '../lib/review-filters'
import { fmtDate, fmtInt, fmtPct, fmtUSD } from '../lib/format'
import { letterheadLines, formFrom } from '../lib/business-rules'
import { fetchAllClaimItems } from '../lib/claim-items-all'
import type { ClaimItem, ClaimSummary, MeResponse } from '../lib/types'

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


export default function ExportPage() {
  const { claimId = '' } = useParams()
  const queryClient = useQueryClient()
  // The firm, only to decide whether offering the toggle means anything.
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: 60_000,
  })

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    enabled: !!claimId,
    retry: retryUnlessMissing,
  })

  /**
   * Same key as Overview, Photos and Recovery, so moving between tabs costs one
   * fetch -- and THEREFORE the same fetcher, which it was not.
   *
   * This asked for `limit=500` and silently got 100 (capped server-side) while
   * the other three had been moved to `fetchAllClaimItems`. One cache entry,
   * two different fetchers: whichever screen mounted first decided what the
   * others saw. Arriving here from Overview, the pre-export check ran over all
   * 161 lines; landing on this tab directly, it ran over 100 and said so. The
   * readiness summary on the screen that answers "is this fit to send" was
   * correct or incomplete depending on how you navigated to it.
   */
  const itemsPage = useQuery({
    queryKey: ['claim-items-flat', claimId],
    queryFn: () => fetchAllClaimItems(claimId),
    enabled: !!claimId,
  })

  const [format, setFormat] = useState<Format>('xlsx')
  const [withInventory, setWithInventory] = useState(true)
  const [withPhotos, setWithPhotos] = useState(false)
  const [perPage, setPerPage] = useState<PhotosPerPage>(2)
  /**
   * Per EXPORT, never stored: "if they are sending it direct to a client they
   * can add their letterhead but if they're sending it to an adjuster they can
   * opt not to" (owner). A remembered setting is one an adjuster has to
   * remember to flip back.
   */
  const [letterhead, setLetterhead] = useState(true)
  /**
   * Worksheet order unless the adjuster asks otherwise (owner, 2026-11-24:
   * room grouping is an option, never automatic). Per export, like the
   * letterhead. Each line keeps its own number in both orders.
   */
  const [sort, setSort] = useState<ExportSort>('line')
  /** The background build in progress or just finished, if any. */
  const [jobId, setJobId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** A successful export that still needs saying -- e.g. no photos linked. */
  const [info, setInfo] = useState<string | null>(null)

  /**
   * BACKGROUND EXPORTS (backend bd981ec). Every PDF with photos is built as a
   * job: one document at any photo count, which the old synchronous route
   * refused past 500. On arrival, pick up the newest job that is still
   * building or ready, so a reload or a trip to the worksheet loses nothing.
   */
  const recentJobs = useQuery({
    queryKey: ['export-jobs', claimId],
    queryFn: () => listExportJobs(claimId),
    enabled: !!claimId,
    staleTime: Infinity,
  })
  const activeJobId =
    jobId ??
    recentJobs.data?.jobs.find(
      (r) => r.status === 'queued' || r.status === 'building' || r.status === 'done',
    )?.job_id ??
    null

  const job = useQuery({
    queryKey: ['export-job', claimId, activeJobId],
    queryFn: () => getExportJob(claimId, activeJobId as string),
    enabled: !!activeJobId,
    // Every ~3 s while it builds. Once done, re-read before the signed link's
    // hour runs out: the server mints a fresh one on every GET.
    refetchInterval: (q) => {
      const s = q.state.data?.status
      if (!s || !EXPORT_JOB_TERMINAL.includes(s)) return 3000
      return s === 'done' ? 45 * 60_000 : false
    },
  })
  const j: ExportJob | undefined = job.data
  const building = !!j && (j.status === 'queued' || j.status === 'building')

  /* A real (non-preview) export stamps the claim when it finishes. */
  const finishedReal = j?.status === 'done' && !j.preview
  useEffect(() => {
    if (!finishedReal) return
    void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
    void queryClient.invalidateQueries({ queryKey: ['claims'] })
  }, [finishedReal, claimId, queryClient])

  const items = useMemo(() => itemsPage.data?.items ?? [], [itemsPage.data])
  const check = useMemo(() => validate(items), [items])
  /* Kept even though the fetcher now pages: fetchAllClaimItems stops at 30
     pages, so a claim beyond 3,000 lines would still be checked in part. The
     notice stays as the guard for that rather than as the normal case. */
  const partial = (itemsPage.data?.count ?? 0) > items.length

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const c = claim.data
  // The two toggles, as the API's one `contents` value.
  const pdfContents: PdfContents =
    withInventory && withPhotos ? 'packet' : withPhotos ? 'photos' : 'worksheet'

  const wantsPhotos = format === 'pdf' && pdfContents !== 'worksheet'
  const firmLines = letterheadLines(formFrom(me.data?.business))
  /** A logo with no text is still a letterhead. */
  const hasFirm = firmLines.length > 0 || Boolean(me.data?.business?.logo_url)
  const pdfOptions = () => ({
    ...(wantsPhotos ? { contents: pdfContents, photosPerPage: perPage } : {}),
    ...(hasFirm && !letterhead ? { letterhead: false } : {}),
    sort,
  })

  /** Photos (with or without the inventory) always build in the background. */
  const startJob = async (isPreview: boolean) => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const started = await startExportJob(claimId, {
        format: 'pdf',
        contents: pdfContents,
        photos_per_page: perPage,
        letterhead: !(hasFirm && !letterhead),
        sort,
        preview: isPreview,
      })
      queryClient.setQueryData(['export-job', claimId, started.job_id], started)
      setJobId(started.job_id)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? 'The export service is busy. Try again in a minute.'
          : err instanceof ApiError
            ? `Could not start the export — HTTP ${err.status}.${err.requestId ? ` Reference ${err.requestId}.` : ''}`
            : 'Could not start the export.',
      )
    } finally {
      setBusy(false)
    }
  }

  /**
   * The same document, opened in the browser's PDF viewer instead of saved --
   * a look before it goes to a carrier or a client. It is the SERVER's PDF,
   * not a rendering of our own, so what is reviewed is what downloads.
   *
   * `preview: true` is what keeps it a look. Without it this endpoint stamps
   * `exported_at`, which is first-write-wins and cannot be undone -- so every
   * Preview click used to file the claim and move its derived status.
   *
   * The server echoes X-Export-Preview because a mistyped param is dropped
   * silently. Only an explicit `false` is worth a word: the echo is null
   * whenever CORS hides it (which it does today), and treating that as "it
   * stamped" would warn on every successful preview.
   */
  const preview = async () => {
    if (wantsPhotos) return startJob(true)
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const { previewed } = await printExport(claimId, { preview: true, ...pdfOptions() })
      if (previewed === false) {
        void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
        setInfo('That opened as a real export, not a preview — the claim is now marked exported.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the preview.')
    } finally {
      setBusy(false)
    }
  }

  const run = async () => {
    if (wantsPhotos) return startJob(false)
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      // Inventory only (.xlsx, or a PDF without photos): small, so it is still
      // the direct download. Photos never reach here -- see startJob.
      await downloadExport(claimId, format, pdfOptions())
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

            <section className="k-export-sec">
              <div className="k-export-sec-h">Line order</div>
              {/* Radio buttons, from the design's export screen (.k-radio,
                  export.jsx "Delivery"): a filled dot says "pick one".
                  Owner, 2026-11-27: a checkbox read backwards, and the
                  segmented control didn't look selectable. Worksheet order
                  is the expected behaviour and needs no caption; the grouped
                  order explains itself, since its numbers skip and that could
                  read as a fault. */}
              <div
                role="radiogroup"
                aria-label="Line order"
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {(
                  [
                    ['line', 'Worksheet order', null],
                    [
                      'room',
                      'Grouped by room',
                      'Each line keeps its worksheet number, so the numbers skip within a room.',
                    ],
                  ] as const
                ).map(([id, label, sub]) => (
                  <label key={id} className="k-radio">
                    <input
                      type="radio"
                      name="export-line-order"
                      value={id}
                      checked={sort === id}
                      onChange={() => setSort(id)}
                      style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        margin: -1,
                        padding: 0,
                        overflow: 'hidden',
                        clipPath: 'inset(50%)',
                        border: 0,
                      }}
                    />
                    <span className={`k-radio-dot ${sort === id ? 'k-radio-dot--on' : ''}`} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 12.5, color: 'var(--k-fg)' }}>
                        {label}
                      </span>
                      {sub ? (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--k-fg-4)' }}>
                          {sub}
                        </span>
                      ) : null}
                    </span>
                  </label>
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

                <section className="k-export-sec">
                  <div className="k-export-sec-h">Your letterhead</div>
                  {hasFirm ? (
                    <>
                      <Toggle
                        on={letterhead}
                        onChange={setLetterhead}
                        label="Print it on this PDF"
                        sub={firmLines[0] ?? 'Your logo'}
                      />
                      {/* A per-export choice, so it says what THIS file will
                          carry rather than what the account is set to. */}
                      <p className="k-export-hint">
                        Turn it off when the file is going to a carrier or another adjuster. The
                        .xlsx never carries it either way — XactContents parses that file.
                      </p>
                    </>
                  ) : (
                    <p className="k-export-hint">
                      No firm details saved, so this PDF prints without a letterhead. Add them in{' '}
                      <Link className="k-link" to="/settings/business">
                        Settings → Business
                      </Link>
                      .
                    </p>
                  )}
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
                      Each photo is captioned with its line #, description and room. Every photo
                      goes into one PDF, however many there are. It builds in the background — you
                      can leave this page and come back — and a large one is too big to email, so
                      it downloads to your computer.
                    </p>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Wraps on a narrow screen so the build status and the buttons stack
            instead of squeezing each other or scrolling the page sideways. */}
        <div className="k-export-foot" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
            {error ? (
              <span className="k-error">{error}</span>
            ) : j ? (
              <JobLine
                claimId={claimId}
                job={j}
                onRefresh={() => void job.refetch()}
                onRetry={() => void startJob(!!j.preview)}
                retryDisabled={busy}
              />
            ) : info ? (
              <span style={{ fontSize: 12, color: 'var(--k-fg-2)' }}>{info}</span>
            ) : check.attention ? (
              /* Only when something IS flagged. It read "Flagged items are for
                 your review" directly above a panel saying "Nothing to flag",
                 which is the page contradicting itself on the screen an
                 adjuster uses to decide whether to send a document. */
              <span style={{ fontSize: 12, color: 'var(--k-fg-3)' }}>
                Flagged items are for your review. Nothing here blocks the export.
              </span>
            ) : null}
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
                disabled={busy || building || !c || c.status === 'processing'}
                title="Opens the PDF in a new tab — the same document the download saves, and nothing is recorded"
                onClick={() => void preview()}
              >
                <Icon d={I.eye} size={12} /> Preview
              </button>
            ) : null}
            <button
              type="button"
              className="k-btn"
              disabled={busy || building || !c || c.status === 'processing'}
              title={c?.status === 'processing' ? 'Still processing — some lines have no price yet' : undefined}
              onClick={() => void run()}
            >
              <Icon d={I.download} size={12} />{' '}
              {busy ? 'Preparing…' : building ? 'Building…' : exportLabel}
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
                    <Link
                      className="k-btn k-btn--sm k-btn--ghost"
                      to={reviewHref(claimId, 'unpriced')}
                    >
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
                    <Link
                      className="k-btn k-btn--sm k-btn--ghost"
                      to={reviewHref(claimId, 'no_model')}
                    >
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
                    <Link
                      className="k-btn k-btn--sm k-btn--ghost"
                      to={reviewHref(claimId, 'no_class')}
                    >
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


const JOB_ERROR: Record<string, string> = {
  no_photos: 'No photos are linked to line items yet, so there is nothing for a photos PDF.',
  worker_lost: 'The build stopped partway. Start the export again.',
  queue_unavailable: 'The export service is busy. Try again in a minute.',
  claim_not_found: 'This claim could not be found.',
}

function fmtBytes(n: number | null): string {
  if (n == null) return ''
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(n >= 100 * 1024 * 1024 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

/**
 * Where a background export stands: queued → building (photos done of
 * total) → a link to the one finished PDF. The link is opened by the
 * adjuster's own click, so no pop-up blocker is involved, and a link past its
 * hour is re-minted by re-reading the job.
 */
function JobLine({
  claimId,
  job,
  onRefresh,
  onRetry,
  retryDisabled,
}: {
  claimId: string
  job: ExportJob
  onRefresh: () => void
  onRetry: () => void
  retryDisabled?: boolean
}) {
  const muted = { fontSize: 12, color: 'var(--k-fg-3)' } as const
  // Wraps on a narrow screen: the text drops under the bar or button rather
  // than pushing the page sideways.
  const row = {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px 10px',
    minWidth: 0,
  } as const
  if (job.status === 'queued' || job.status === 'building') {
    const total = job.photos_total ?? 0
    const done = job.photos_done ?? 0
    const pct = total ? Math.round((done / total) * 100) : 0
    return (
      <div style={row}>
        <div
          className={`k-progress${job.status === 'queued' || !total ? ' k-progress--busy' : ''}`}
          style={{ width: 160, flex: '0 0 auto' }}
        >
          <div className="k-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <span style={muted} aria-live="polite">
          {job.status === 'queued' || !total
            ? 'Starting the build…'
            : `Building the PDF — ${fmtInt(done)} of ${fmtInt(total)} photos`}
        </span>
      </div>
    )
  }
  if (job.status === 'done') {
    const stale = !job.download_url
    const what = job.preview ? 'Preview' : 'PDF'
    return (
      <div style={row}>
        <span style={{ fontSize: 12, color: 'var(--k-fg-2)' }}>
          {what} ready{job.size_bytes ? ` · ${fmtBytes(job.size_bytes)}` : ''}
          {job.photos_total ? ` · ${fmtInt(job.photos_total)} photos` : ''}
        </span>
        {stale ? (
          <button type="button" className="k-btn k-btn--sm" onClick={onRefresh}>
            Refresh link
          </button>
        ) : (
          <a
            className="k-btn k-btn--sm"
            href={job.download_url as string}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // The page re-reads the job every 45 minutes, but a sleeping
              // laptop can outlast the link's hour: re-mint rather than open a
              // dead link.
              const until = job.download_url_expires_at
              if (until && Date.parse(until) <= Date.now()) {
                e.preventDefault()
                onRefresh()
              }
            }}
          >
            <Icon d={job.preview ? I.eye : I.download} size={12} />{' '}
            {job.preview ? 'Open preview' : 'Download PDF'}
          </a>
        )}
        {/* A preview is a look before it goes out, so it is never shared
            (the server refuses it too). */}
        {job.preview ? null : <ShareLinkControls claimId={claimId} job={job} onChanged={onRefresh} />}
      </div>
    )
  }
  if (job.status === 'expired') {
    return <span style={muted}>That export was kept for 7 days and has expired. Export again.</span>
  }
  // `no_photos` will fail the same way every time, so it gets no retry.
  const retryable = job.error_code !== 'no_photos' && job.error_code !== 'claim_not_found'
  return (
    <div style={row}>
      <span className="k-error">
        {(job.error_code && JOB_ERROR[job.error_code]) ||
          job.error ||
          'The PDF could not be built.'}
      </span>
      {retryable ? (
        <button type="button" className="k-btn k-btn--sm" disabled={retryDisabled} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}

/**
 * Share a finished PDF with the carrier's adjuster (BACKEND-PROMPTS 29).
 *
 * A 70-230 MB photo packet is far past an email attachment, and the job's own
 * download link is private and dies in an hour. The share link is one URL
 * that works for anyone, without an account, until the file is deleted
 * (7 days). One link per export: copying again returns the same URL.
 *
 * The clipboard write happens after a network round trip, by which time some
 * browsers no longer count it as part of the click. If it is refused, the URL
 * is shown selected so it can be copied by hand -- never lost.
 */
function ShareLinkControls({
  claimId,
  job,
  onChanged,
}: {
  claimId: string
  job: ExportJob
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manualUrl, setManualUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const link = job.share_link ?? null

  const copy = async () => {
    setBusy(true)
    setErr(null)
    setCopied(false)
    try {
      const minted = link ?? (await createExportLink(claimId, job.job_id))
      if (!link) onChanged()
      try {
        await navigator.clipboard.writeText(minted.url)
        setManualUrl(null)
        setCopied(true)
      } catch {
        setManualUrl(minted.url)
      }
    } catch (e) {
      const code =
        e instanceof ApiError && e.status === 409 && typeof e.detail === 'object' && e.detail
          ? (e.detail as { code?: string }).code
          : undefined
      setErr(
        code === 'expired'
          ? 'This export has expired, so it can no longer be shared. Export again.'
          : code === 'not_ready'
            ? 'The PDF is not finished yet.'
            : 'Could not make a share link. Try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const turnOff = async () => {
    if (
      !window.confirm(
        'Turn off this share link? Anyone who already has it will no longer be able to download the PDF. You can make a new link afterwards.',
      )
    )
      return
    setBusy(true)
    setErr(null)
    try {
      await deleteExportLink(claimId, job.job_id)
      setCopied(false)
      setManualUrl(null)
      onChanged()
    } catch {
      setErr('Could not turn the link off. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const muted = { fontSize: 12, color: 'var(--k-fg-3)' } as const
  return (
    <>
      <button type="button" className="k-btn k-btn--sm k-btn--ghost" disabled={busy} onClick={() => void copy()}>
        <Icon d={I.link} size={12} /> {link ? 'Copy share link' : busy ? 'Making link…' : 'Copy share link'}
      </button>
      {link ? (
        <>
          <span style={muted}>
            {copied ? 'Link copied · ' : 'Link on · '}
            {fmtInt(link.downloads)} {link.downloads === 1 ? 'open' : 'opens'} · anyone with it can
            download until {fmtDate(link.expires_at)}
          </span>
          <button type="button" className="k-link" disabled={busy} onClick={() => void turnOff()}>
            Turn off link
          </button>
        </>
      ) : copied ? (
        <span style={muted}>Link copied</span>
      ) : null}
      {manualUrl ? (
        <input
          className="k-insp-input"
          readOnly
          value={manualUrl}
          aria-label="Share link — copy it with Ctrl+C"
          style={{ width: 320, maxWidth: '100%' }}
          ref={(el) => el?.select()}
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
      {err ? <span className="k-error">{err}</span> : null}
    </>
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
  // Shared with the worksheet's filters, so a count can never disagree with
  // the rows its Review button filters to.
  const unpriced = items.filter((r) => matchesReview(r, 'unpriced'))
  const noModel = items.filter((r) => matchesReview(r, 'no_model'))
  const noClass = items.filter((r) => matchesReview(r, 'no_class'))
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

