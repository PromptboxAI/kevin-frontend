import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { fmtInt } from '../lib/format'
import {
  PARSE_ACCEPT,
  importItems,
  parseInventory,
  previewImport,
} from '../lib/import'
import type { ParseResponse, PreviewResponse } from '../lib/import'
import {
  MAPPABLE,
  confirmSpend,
  guardImport,
  initialSelection,
  planImportChunks,
  toBulkRow,
  truncationWarning,
} from '../lib/import-rules'
import type { BulkRow, MappableField } from '../lib/import-rules'

/**
 * Written inventories import WITHOUT photographs.
 *
 * A total-loss list arrives as a PDF, CSV or XLSX, and a described item prices
 * exactly like a photographed one -- just without brand/model precision. This
 * is NOT staging: staging turns photos into items via cluster -> review ->
 * promote, and a written row already IS a line item.
 *
 * parse -> map -> preview -> import, and THE FIRST THREE CREATE NOTHING.
 */

const STEPS = ['Upload', 'Map columns', 'Review', 'Import'] as const
type Step = 0 | 1 | 2 | 3

const FIELD_LABEL: Record<MappableField, string> = {
  description: 'Description',
  room: 'Room / area',
  quantity: 'Qty',
  category: 'Content class',
  make_mfr: 'Make',
  model_number: 'Model #',
  age_years: 'Age (yrs)',
}

export default function ImportPage() {
  const { claimId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(0)
  const [parsed, setParsed] = useState<ParseResponse | null>(null)
  const [mapping, setMapping] = useState<Partial<Record<MappableField, number>>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [price, setPrice] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number; created: number } | null>(
    null,
  )

  const fail = (label: string) => (error: unknown) =>
    setNotice(
      error instanceof ApiError
        ? `${label} — HTTP ${error.status}: ${error.message422}`
        : `${label}.`,
    )

  const doParse = useMutation({
    mutationFn: (file: File) => parseInventory(claimId, file),
    onSuccess: (result) => {
      setParsed(result)
      // Partial by design -- the step still shows so the guess is visible and
      // correctable rather than silent.
      setMapping(result.suggested_mapping as Partial<Record<MappableField, number>>)
      setSelected(initialSelection(result.rows))
      setNotice(null)
      setStep(1)
    },
    onError: fail('Could not read that file'),
  })

  /** The rows the adjuster has kept, mapped into what the API takes. */
  const rows: BulkRow[] = useMemo(() => {
    if (!parsed) return []
    return parsed.rows.filter((r) => selected.has(r.index)).map((r) => toBulkRow(r, mapping))
  }, [parsed, mapping, selected])

  const doPreview = useMutation({
    mutationFn: () => previewImport(claimId, rows),
    onSuccess: (result) => {
      setPreview(result)
      setNotice(null)
      setStep(2)
    },
    onError: fail('Could not check that list'),
  })

  /**
   * Chunked, and resumable from the FAILED chunk.
   *
   * The route has no idempotency key, so restarting from zero would create the
   * earlier chunks' rows a second time -- and a duplicate line is a real money
   * error.
   */
  const doImport = useMutation({
    mutationFn: async () => {
      const chunks = planImportChunks(rows)
      const start = progress?.done ?? 0
      let created = progress?.created ?? 0
      let truncated = false
      const ids: number[] = []

      for (let i = start; i < chunks.length; i += 1) {
        setProgress({ done: i, total: chunks.length, created })
        const ack = await importItems(claimId, chunks[i], price)
        created += ack.items_created
        ids.push(...ack.item_ids)
        if (ack.truncated) {
          truncated = true
          setProgress({ done: i + 1, total: chunks.length, created })
          break
        }
        setProgress({ done: i + 1, total: chunks.length, created })
      }
      return { created, truncated, ids }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      if (result.truncated) {
        setNotice(
          `Imported ${fmtInt(result.created)} rows, then your allowance ran out. The rest are still in your file — top up and import it again to add them.`,
        )
        return
      }
      navigate(`/claims/${claimId}`)
    },
    onError: (error) => {
      fail('Import stopped')(error)
      setNotice((n) => `${n ?? ''} Nothing before this point was lost — Resume picks up where it stopped.`)
    },
  })

  const guard = guardImport(rows, price)
  const truncation = preview ? truncationWarning(preview.would_truncate, preview.would_drop) : null

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <div>
          <Link to={`/claims/${claimId}`} className="k-crumb">
            <Icon d={I.chevleft} size={12} /> Back to claim
          </Link>
          <h1 className="k-claims-h1">Import a written list</h1>
          <p className="k-claims-sub">
            A typed or exported inventory — PDF, CSV or Excel — with no photographs. Each row
            becomes a line item and prices from its description.
          </p>
        </div>

        <div className="k-wi-steps">
          {STEPS.map((label, i) => (
            <div key={label} className="k-wi-step-n" data-on={i <= step ? 'true' : undefined}>
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {notice ? (
          <div className="k-skipline">
            <Icon d={I.info} size={13} />
            <span style={{ flex: 1 }}>{notice}</span>
            <button type="button" className="k-link" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        {/* ── 1 · Upload. Server-side parse; no browser parser, ever. ── */}
        {step === 0 ? (
          <section className="k-intake-section">
            <div className="k-dropzone">
              <div className="k-dropzone-inner">
                <div className="k-dropzone-icon">
                  <Icon d={I.file} size={26} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--k-font-display)',
                    fontSize: 26,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Drop the inventory file.
                </div>
                <div style={{ fontSize: 13, color: 'var(--k-fg-3)', marginTop: 6 }}>
                  PDF, CSV, XLSX or XLS. Kevin reads it and shows you every row before anything is
                  created.
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={PARSE_ACCEPT}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) doParse.mutate(f)
                    e.target.value = ''
                  }}
                />
                <div style={{ marginTop: 22 }}>
                  <button
                    type="button"
                    className="k-btn"
                    disabled={doParse.isPending}
                    onClick={() => fileRef.current?.click()}
                  >
                    {doParse.isPending ? 'Reading…' : 'Choose file'}
                  </button>
                </div>
              </div>
              <div className="k-dropzone-ghosts" />
            </div>
          </section>
        ) : null}

        {/* ── 2 · Map. Shown even when pre-filled. ── */}
        {step === 1 && parsed ? (
          <section className="k-intake-section">
            <div className="k-wi-filebar">
              <Icon d={I.file} size={13} />
              <span>{parsed.filename ?? 'inventory'}</span>
              <Badge tone="quiet">{parsed.format.toUpperCase()}</Badge>
              <span style={{ color: 'var(--k-fg-4)' }}>
                {fmtInt(parsed.row_count)} rows
                {parsed.heading_count
                  ? ` · ${fmtInt(parsed.heading_count)} look like section headings`
                  : ''}
              </span>
            </div>

            <p className="k-claims-sub" style={{ marginTop: 12 }}>
              Kevin guessed these columns. Check them — a wrong Description column changes what
              gets searched, and <strong>Room stays its own column</strong> so a room name never
              lands in the search query.
            </p>

            <div className="k-wi-maprow">
              {MAPPABLE.map((field) => (
                <label
                  key={field}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}
                >
                  <span className="k-ifield-label">{FIELD_LABEL[field]}</span>
                  <select
                    className="k-fselect"
                    value={mapping[field] ?? -1}
                    onChange={(e) => {
                      const col = Number(e.target.value)
                      setMapping((m) => ({ ...m, [field]: col < 0 ? undefined : col }))
                    }}
                  >
                    <option value={-1}>—</option>
                    {(parsed.headers.length
                      ? parsed.headers
                      : parsed.rows[0]?.cells.map((_, i) => `Column ${i + 1}`) ?? []
                    ).map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {/* Headings are PRE-DESELECTED, never dropped: it is the adjuster's
                list, and a wrong flag would silently delete property. */}
            <div className="k-wi-rows" style={{ marginTop: 14 }}>
              {parsed.rows.slice(0, 60).map((r) => (
                <div key={r.index} className="k-wi-row" data-off={!selected.has(r.index) || undefined}>
                  <span className="k-wi-row-n">{r.index + 1}</span>
                  <input
                    type="checkbox"
                    checked={selected.has(r.index)}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (next.has(r.index)) next.delete(r.index)
                        else next.add(r.index)
                        return next
                      })
                    }
                  />
                  <span className="k-wi-row-cells">{r.cells.join('  ·  ')}</span>
                  {r.likely_heading ? <Badge tone="quiet">Looks like a heading</Badge> : null}
                </div>
              ))}
              {parsed.rows.length > 60 ? (
                <div className="k-wi-row" style={{ color: 'var(--k-fg-4)' }}>
                  + {fmtInt(parsed.rows.length - 60)} more rows — all included unless you deselect
                  them
                </div>
              ) : null}
            </div>

            <div className="k-intake-actions">
              <button type="button" className="k-btn k-btn--ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={doPreview.isPending || mapping.description === undefined || rows.length === 0}
                title={
                  mapping.description === undefined
                    ? 'Map the Description column first — it is what Kevin searches on'
                    : undefined
                }
                onClick={() => doPreview.mutate()}
              >
                {doPreview.isPending ? 'Checking…' : `Check ${fmtInt(rows.length)} rows →`}
              </button>
            </div>
          </section>
        ) : null}

        {/* ── 3 · Review. The dry run: creates nothing, spends nothing. ── */}
        {step === 2 && preview ? (
          <section className="k-intake-section">
            <div className="k-wi-filebar">
              <span>
                <strong>{fmtInt(preview.total_rows)}</strong> rows checked · nothing created yet
              </span>
            </div>

            <div style={{ display: 'flex', gap: 22, margin: '14px 0' }}>
              {(
                [
                  ['Will price', preview.priceable, 'ok'],
                  ['Needs your price', preview.needs_manual, 'neutral'],
                  ['No content class', preview.uncategorised, 'neutral'],
                ] as [string, number, string][]
              ).map(([label, value, tone]) => (
                <div key={label} className="k-billing-cell">
                  <div
                    className="k-billing-v"
                    style={{
                      color:
                        value === 0
                          ? 'var(--k-fg-4)'
                          : tone === 'ok'
                            ? 'var(--k-ok)'
                            : 'var(--k-fg-2)',
                    }}
                  >
                    {fmtInt(value)}
                  </div>
                  <div className="k-billing-l">{label}</div>
                </div>
              ))}
            </div>

            {preview.uncategorised > 0 ? (
              <div className="k-skipline">
                <Icon d={I.info} size={13} />
                <span>
                  {fmtInt(preview.uncategorised)} rows have no content class. They will import and
                  price — content class drives depreciation, so set it on those rows in the
                  worksheet afterwards.
                </span>
              </div>
            ) : null}

            {truncation ? (
              <div className="k-reject">
                <div className="k-reject-hd">
                  <Icon d={I.warn} size={14} />
                  <span className="k-reject-t">This file is bigger than your allowance</span>
                </div>
                <div className="k-reject-ft">{truncation}</div>
              </div>
            ) : null}

            <div className="k-wi-rows">
              {preview.rows.slice(0, 60).map((r) => (
                <div key={r.index} className="k-wi-row">
                  <span className="k-wi-row-n">{r.index + 1}</span>
                  <span className="k-wi-row-cells">
                    {/* Identity-first, as it will actually be searched. */}
                    {r.description}
                    {r.room ? (
                      <span style={{ color: 'var(--k-fg-4)' }}> · {r.room}</span>
                    ) : null}
                  </span>
                  {r.will_price ? null : <Badge tone="quiet">{r.reason ?? 'Not priced'}</Badge>}
                </div>
              ))}
            </div>

            <label
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                marginTop: 14,
                fontSize: 12.5,
              }}
            >
              <input
                type="checkbox"
                checked={price}
                onChange={(e) => setPrice(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Price these now
                {/* price:false is NOT a dry run -- it still creates every row.
                    The copy says exactly that. */}
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--k-fg-4)' }}>
                  Unchecked still imports every row — it just leaves them unpriced for you to price
                  later.
                </span>
              </span>
            </label>

            {!guard.ok && guard.reason === 'blank_rows_priced' ? (
              <div className="k-skipline">
                <Icon d={I.warn} size={13} />
                <span>
                  {fmtInt(guard.rows.length)} selected rows have nothing to search on. Untick
                  “Price these now” to import them as blank lines, or deselect them.
                </span>
              </div>
            ) : null}

            <div className="k-intake-actions">
              <button type="button" className="k-btn k-btn--ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={!guard.ok || doImport.isPending}
                onClick={() => {
                  setStep(3)
                  doImport.mutate()
                }}
              >
                {/* SEARCHES, not rows: each priced item is a comp search plus a
                    merchant-link resolution. */}
                {price
                  ? `Import & price ${fmtInt(preview.priceable)} →`
                  : `Import ${fmtInt(preview.total_rows)} unpriced →`}
              </button>
            </div>
            <span className="k-ifield-hint">
              {price ? confirmSpend(preview.estimated_searches, preview.priceable) : 'No vendor searches.'}
            </span>
          </section>
        ) : null}

        {/* ── 4 · Import. The only step that creates anything. ── */}
        {step === 3 ? (
          <section className="k-intake-section">
            <div style={{ fontSize: 14 }}>
              {doImport.isPending
                ? `Importing… batch ${fmtInt((progress?.done ?? 0) + 1)} of ${fmtInt(progress?.total ?? 1)}`
                : doImport.isError
                  ? 'Import stopped'
                  : 'Imported'}
            </div>
            <div className="k-progress" style={{ marginTop: 10, maxWidth: 460 }}>
              <div
                className="k-progress-bar"
                style={{
                  width: `${progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                }}
              />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--k-fg-3)', marginTop: 8 }}>
              {fmtInt(progress?.created ?? 0)} line items created
            </div>

            {doImport.isError ? (
              <div className="k-intake-actions">
                <Link to={`/claims/${claimId}`} className="k-btn k-btn--ghost">
                  Open worksheet
                </Link>
                {/* Resumes at the FAILED chunk. Restarting would duplicate every
                    row already created. */}
                <button type="button" className="k-btn" onClick={() => doImport.mutate()}>
                  Resume from batch {fmtInt((progress?.done ?? 0) + 1)}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
