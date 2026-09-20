import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import IntakeField from '../components/IntakeField'
import { api } from '../lib/api'
import { fmtPct, fmtUSD } from '../lib/format'
import { useTaxRate } from '../lib/tax-rate'
import { pct } from '../lib/tax-rate-rules'

/**
 * Screen 70 — Support. The tools for answering a customer's question without
 * touching their claim.
 *
 * Both run the REAL engine, read-only:
 *  - GET /v1/worksheet/preview is the money chain itself (services.money +
 *    services.depreciation, the same functions the stored worksheet reads
 *    through), so "why is my ACV that?" is answered with the engine's own
 *    arithmetic rather than a re-implementation that can drift.
 *  - GET /v1/tax-rate is the live rate table, so "what rate would this address
 *    get?" needs no claim.
 *
 * The design's ticket queue and per-account audit access are NOT here: there is
 * no ticket store and no cross-account read. What exists, exists.
 */
type Preview = {
  tax: number | null
  ext_cost: number | null
  rcv_total_incl: number | null
  depreciation_pct: number | null
  depreciation_amount: number | null
  acv_total_incl: number | null
  depreciation_capped: boolean
}

type DepreciationRules = { categories?: string[]; schedule?: Record<string, unknown> }

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="k-set-card">
      <div className="k-set-card-hd">{title}</div>
      <div className="k-set-card-body">
        {sub ? (
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--k-fg-3)', maxWidth: 640 }}>
            {sub}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  )
}

export default function AdminSupportPage() {
  // — The valuation calculator —
  const [rcv, setRcv] = useState('349.99')
  const [qty, setQty] = useState('1')
  const [age, setAge] = useState('5')
  const [category, setCategory] = useState('')
  const [method, setMethod] = useState<'straight_line' | 'bracketed'>('straight_line')
  const [taxPct, setTaxPct] = useState('8.75')

  const rules = useQuery({
    queryKey: ['admin', 'depreciation-rules'],
    queryFn: () => api.get<DepreciationRules>('/v1/depreciation-rules'),
    staleTime: 5 * 60_000,
  })

  const classes = useMemo(() => {
    const fromSchedule = Object.keys(rules.data?.schedule ?? {})
    return fromSchedule.length ? fromSchedule.sort() : (rules.data?.categories ?? []).sort()
  }, [rules.data])

  const params = useMemo(() => {
    const q = new URLSearchParams()
    if (rcv.trim()) q.set('rcv', rcv.trim())
    if (qty.trim()) q.set('quantity', qty.trim())
    if (taxPct.trim()) q.set('tax_rate', String(Number(taxPct) / 100))
    if (age.trim()) q.set('age_years', age.trim())
    if (category) q.set('category', category)
    q.set('depreciation_method', method)
    return q.toString()
  }, [rcv, qty, taxPct, age, category, method])

  const preview = useQuery({
    queryKey: ['admin', 'worksheet-preview', params],
    queryFn: () => api.get<Preview>(`/v1/worksheet/preview?${params}`),
    // The adjuster is typing; don't hammer it on every keystroke's first frame.
    staleTime: 10_000,
    retry: false,
  })

  // — The ZIP lookup —
  const [zip, setZip] = useState('')
  const tax = useTaxRate(zip)

  const p = preview.data

  return (
    <AdminShell active="Support">
      <div className="k-adm-body">
        <div className="k-adm-sec-hd">
          <div>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 28,
                letterSpacing: '-0.022em',
                margin: '0 0 4px',
              }}
            >
              Support tools
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              Answer a customer’s question without opening their claim. Both tools run the live
              engine and change nothing.
            </p>
          </div>
          <Badge tone="quiet">Read-only</Badge>
        </div>

        <Card
          title="Valuation calculator"
          sub="The same money chain the worksheet uses — depreciation applies to the tax-inclusive RCV, and tax is already inside the totals. Use it to explain a number, or to check what a class change would do before telling someone."
        >
          <div className="k-set-grid3">
            <IntakeField label="Price (per unit, pre-tax)" value={rcv} width="100%" mono onChange={setRcv} />
            <IntakeField label="Quantity" value={qty} width="100%" mono onChange={setQty} />
            <IntakeField label="Age (years)" value={age} width="100%" mono onChange={setAge} />
          </div>

          <div className="k-set-grid3" style={{ marginTop: 14 }}>
            <div className="k-insp-field">
              <label htmlFor="calc-class">Content class</label>
              <select
                id="calc-class"
                className="k-insp-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">— None (no schedule) —</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="k-insp-field">
              <label htmlFor="calc-method">Method</label>
              <select
                id="calc-method"
                className="k-insp-input"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'straight_line' | 'bracketed')}
              >
                <option value="straight_line">Straight line</option>
                <option value="bracketed">Bracketed</option>
              </select>
            </div>
            <IntakeField label="Tax rate %" value={taxPct} width="100%" mono onChange={setTaxPct} />
          </div>

          {preview.error ? (
            <Alert tone="error" title="The engine refused those values">
              {preview.error instanceof Error ? preview.error.message : 'Check the inputs.'}
            </Alert>
          ) : (
            <div className="k-adm-calc">
              {[
                ['Ext. cost', p?.ext_cost],
                ['Sales tax', p?.tax],
                ['RCV + tax', p?.rcv_total_incl],
                ['$ Depreciation', p?.depreciation_amount],
                ['ACV', p?.acv_total_incl],
              ].map(([label, value]) => (
                <div key={String(label)} className="k-adm-calc-cell">
                  <div className="k-adm-kpi-l">{String(label)}</div>
                  <div className="k-adm-calc-v">
                    {typeof value === 'number' ? fmtUSD(value) : '—'}
                  </div>
                </div>
              ))}
              <div className="k-adm-calc-cell">
                <div className="k-adm-kpi-l">% Depreciation</div>
                <div className="k-adm-calc-v">
                  {p?.depreciation_pct === null || p?.depreciation_pct === undefined
                    ? '—'
                    : fmtPct(p.depreciation_pct)}
                  {p?.depreciation_capped ? <Badge tone="warn">capped</Badge> : null}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Sales tax by ZIP"
          sub="The live rate table, the same lookup the New claim screen uses. A ZIP that spans two jurisdictions returns the range rather than an average, because a midpoint is a rate nobody charges."
        >
          <div style={{ maxWidth: 220 }}>
            <IntakeField
              label="ZIP"
              value={zip}
              width="100%"
              mono
              onChange={(v) => setZip(v.replace(/[^0-9]/g, '').slice(0, 5))}
            />
          </div>

          {zip.length === 5 ? (
            tax.isPending ? (
              <p className="k-note">Looking up {zip}…</p>
            ) : tax.data?.suggested_rate !== null && tax.data?.suggested_rate !== undefined ? (
              <Alert
                tone="success"
                title={`${pct(tax.data.suggested_rate)}% — ${tax.data.jurisdictions?.join(' + ') || zip}`}
              >
                {tax.data.state ? `${tax.data.state} · ` : ''}
                rates as of {tax.data.as_of ?? 'unknown'}
                {tax.data.stale ? ' · the table is older than its refresh window' : ''}.
              </Alert>
            ) : tax.data?.ambiguous && tax.data.rate_range ? (
              <Alert tone="wait" title={`${zip} spans ${pct(tax.data.rate_range[0])}–${pct(tax.data.rate_range[1])}%`}>
                The ZIP crosses tax lines, so the adjuster picks the side the loss is on.
              </Alert>
            ) : (
              <Alert tone="info" title={`No rate on file for ${zip}`}>
                {tax.data?.reason ? `Reported as ${tax.data.reason}.` : 'The table has no entry.'} A
                claim there leaves the rate empty rather than guessing.
              </Alert>
            )
          ) : null}
        </Card>

        <Alert tone="info" title="Tickets and per-account audit aren’t here">
          The design’s support queue needs a ticket store, and reading another account’s claims
          needs a cross-account route. Neither exists — see BACKEND-PROMPTS.md.
        </Alert>
      </div>
    </AdminShell>
  )
}
