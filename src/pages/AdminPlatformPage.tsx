import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminShell from '../components/AdminShell'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { api } from '../lib/api'
import { fmtInt } from '../lib/format'

/**
 * Screen 69 — Platform. What the engine believes, read from the engine.
 *
 * Two things drive every number an adjuster sees: the depreciation schedule
 * (class -> useful life, mode, ceiling) and the comp source list. Both are
 * live reads — GET /v1/depreciation-rules and
 * GET /v1/sources — so this screen can be trusted when a customer asks why a
 * line depreciated the way it did.
 *
 * READ-ONLY, deliberately. There is no write route for either, and the honest
 * version of that is a screen that says so once rather than a form that
 * discards. The design's editable weights and feature flags wait for the
 * backend.
 */
type DepreciationLine = {
  category: string
  subline: string | null
  useful_life_years: number | null
  mode: string | null
  flat_pct: number | null
  max_pct: number | null
  appraisal: boolean
  pcs_code: string | null
  source_group: string | null
  note: string | null
  boundary: string | null
}

type DepreciationRules = {
  rules: Record<string, { useful_life_years: number | null; manual?: boolean; pcs_code?: string }>
  categories: string[]
  schedule: Record<string, DepreciationLine>
  schedule_categories?: string[]
}

type Source = {
  key: string
  name: string
  kind: string
  tier: string
  categories: string[]
}

type Sources = {
  sources: Source[]
  category_priority: Record<string, string[]>
  class_priority?: Record<string, string[]>
  default_priority?: string[]
  telemetry?: string
}

function Card({
  title,
  action,
  children,
}: {
  title: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="k-set-card">
      <div
        className="k-set-card-hd"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {title}
        {action}
      </div>
      {children}
    </section>
  )
}

export default function AdminPlatformPage() {
  const [q, setQ] = useState('')

  const rules = useQuery({
    queryKey: ['admin', 'depreciation-rules'],
    queryFn: () => api.get<DepreciationRules>('/v1/depreciation-rules'),
    staleTime: 5 * 60_000,
  })
  const sources = useQuery({
    queryKey: ['admin', 'sources'],
    queryFn: () => api.get<Sources>('/v1/sources'),
    staleTime: 5 * 60_000,
  })

  const schedule = useMemo(() => {
    const entries = Object.entries(rules.data?.schedule ?? {})
    const term = q.trim().toLowerCase()
    return entries
      .filter(([name, line]) =>
        !term
          ? true
          : [name, line.category, line.subline, line.pcs_code, line.source_group]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(term)),
      )
      .sort(([a], [b]) => a.localeCompare(b))
  }, [rules.data, q])

  /*
   * THE 30 CLASSES, shown beside the 87 schedule lines rather than instead of
   * them. The two are not competing truths and must not be presented as one
   * list: the life applied to an item follows its `category` -- if that string
   * is a schedule line id, that line's life applies; otherwise `rules[category]`
   * does (backend, 2026-10-05).
   *
   * This matters because photographed items currently carry a CLASS name, so
   * they take the class life. A photographed mattress is classed Furniture and
   * depreciates on 15 years, while the same item typed in lands on
   * "Linens & Softgoods > All Other Linens & Softgoods" and depreciates on 10.
   * An admin asking "why did that line depreciate like that?" cannot answer it
   * from the schedule table alone, which is why both are here.
   */
  const classes = useMemo(() => {
    const entries = Object.entries(rules.data?.rules ?? {})
    const needle = q.trim().toLowerCase()
    const hits = needle
      ? entries.filter(([name, r]) =>
          `${name} ${r.pcs_code ?? ''}`.toLowerCase().includes(needle),
        )
      : entries
    return hits.sort((a, b) => a[0].localeCompare(b[0]))
  }, [rules.data, q])

  const routing = Object.entries(sources.data?.category_priority ?? {})
  const byKey = new Map((sources.data?.sources ?? []).map((s) => [s.key, s]))
  const manualLines = Object.values(rules.data?.schedule ?? {}).filter((l) => l.appraisal).length

  return (
    <AdminShell active="Platform">
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
              Platform
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              The depreciation schedules and comp sources the engine is running right now.
            </p>
          </div>
          <Badge tone="quiet">Read-only</Badge>
        </div>

        <Alert tone="info" title="These are the live values, not a copy">
          Changing them is a backend deploy — there is no write route — so this screen is for
          answering “why did that line depreciate like that?”, and for spotting a schedule that
          moved under you.
        </Alert>

        <div className="k-adm-kpis">
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Schedule lines</div>
            <div className="k-adm-kpi-v">{fmtInt(Object.keys(rules.data?.schedule ?? {}).length)}</div>
            <div className="k-adm-kpi-d">
              <span style={{ color: 'var(--k-fg-3)' }}>
                across{' '}
                {fmtInt(
                  (rules.data?.schedule_categories?.length
                    ? rules.data.schedule_categories
                    : (rules.data?.categories ?? [])
                  ).length,
                )}{' '}
                categories
              </span>
            </div>
          </div>
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Appraisal-only</div>
            <div className="k-adm-kpi-v">{fmtInt(manualLines)}</div>
            <div className="k-adm-kpi-d">
              <span style={{ color: 'var(--k-fg-3)' }}>never auto-priced</span>
            </div>
          </div>
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Comp sources</div>
            <div className="k-adm-kpi-v">{fmtInt(sources.data?.sources?.length ?? 0)}</div>
            <div className="k-adm-kpi-d">
              <span style={{ color: 'var(--k-fg-3)' }}>
                {fmtInt(routing.length)} categories order them
              </span>
            </div>
          </div>
          <div className="k-adm-kpi">
            <div className="k-adm-kpi-l">Source telemetry</div>
            <div className="k-adm-kpi-v" style={{ fontSize: 20, paddingTop: 10 }}>
              {sources.data?.telemetry ?? '—'}
            </div>
            <div className="k-adm-kpi-d">
              <span style={{ color: 'var(--k-fg-3)' }}>as the API reports it</span>
            </div>
          </div>
        </div>

        <Card
          title={`Depreciation schedule · ${fmtInt(schedule.length)}`}
          action={
            <div className="k-search" style={{ minWidth: 260 }}>
              <Icon d={I.search} size={12} />
              <input
                placeholder="Filter by class, subline or code…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          }
        >
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {rules.isPending ? (
              <p className="k-note" style={{ padding: '14px 16px' }}>
                Reading…
              </p>
            ) : (
              <div className="k-adm-sched">
                <div className="k-adm-sched-hd">
                  <span>Class</span>
                  <span>Life</span>
                  <span>Mode</span>
                  <span>Ceiling</span>
                  <span>Code</span>
                </div>
                {schedule.map(([name, line]) => (
                  <div key={name} className="k-adm-sched-row" title={line.boundary ?? undefined}>
                    <span className="k-adm-sched-name">
                      {name}
                      {line.appraisal ? (
                        <Badge tone="warn">appraisal</Badge>
                      ) : null}
                    </span>
                    <span className="k-mono">
                      {line.useful_life_years === null ? '—' : `${line.useful_life_years} y`}
                    </span>
                    <span style={{ color: 'var(--k-fg-3)' }}>{line.mode ?? '—'}</span>
                    <span className="k-mono">
                      {line.max_pct === null ? '100%' : `${Math.round(line.max_pct * 100)}%`}
                    </span>
                    <span className="k-mono" style={{ color: 'var(--k-fg-4)' }}>
                      {line.pcs_code ?? '—'}
                    </span>
                  </div>
                ))}
                {schedule.length === 0 ? (
                  <p className="k-note" style={{ padding: '14px 16px' }}>
                    Nothing matches “{q}”.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card title={`Content classes · ${fmtInt(classes.length)}`}>
          <p className="k-note" style={{ padding: '12px 16px 0', margin: 0 }}>
            A second, shorter vocabulary — and the one a <strong>photographed</strong> item
            currently gets. Which list applies follows the item’s category: if it names a
            schedule line above, that line’s life is used; otherwise the class below is.{' '}
            <strong>The two do not always agree</strong>, and neither is a summary of the other —
            Furniture is one class here and several lines above, spanning 10 to 20 years.
          </p>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {rules.isPending ? (
              <p className="k-note" style={{ padding: '14px 16px' }}>
                Reading…
              </p>
            ) : (
              <div className="k-adm-sched">
                <div className="k-adm-sched-hd">
                  <span>Class</span>
                  <span>Life</span>
                  <span>Mode</span>
                  <span>Ceiling</span>
                  <span>Code</span>
                </div>
                {classes.map(([name, r]) => (
                  <div key={name} className="k-adm-sched-row">
                    <span className="k-adm-sched-name">
                      {name}
                      {r.manual ? <Badge tone="warn">appraisal</Badge> : null}
                    </span>
                    <span className="k-mono">
                      {r.useful_life_years === null ? '—' : `${r.useful_life_years} y`}
                    </span>
                    <span style={{ color: 'var(--k-fg-3)' }}>
                      {r.manual ? 'appraisal' : 'age_based'}
                    </span>
                    <span className="k-mono">—</span>
                    <span className="k-mono" style={{ color: 'var(--k-fg-4)' }}>
                      {r.pcs_code ?? '—'}
                    </span>
                  </div>
                ))}
                {classes.length === 0 ? (
                  <p className="k-note" style={{ padding: '14px 16px' }}>
                    Nothing matches “{q}”.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        {/*
          * NOT ROUTING. The backend settled this on 2026-10-05: these lists are
          * the order sources are DISPLAYED in for a category, not a routing
          * table that decides where a comp is fetched from. Rule 10 is intact —
          * there is one unified comp source and no per-retailer scrapers.
          *
          * The old title said "Comp routing", which on the one screen whose job
          * is to answer "why did that line price like that?" was an answer, and
          * a wrong one: an admin reading it would have believed a Furniture
          * comp came from Wayfair because this table said so.
          */}
        <Card title={`Comp source order · ${fmtInt(routing.length)} categories`}>
          <p className="k-note" style={{ padding: '12px 16px 0', margin: 0 }}>
            The order sources are listed in for a category — not where a comp is fetched from.
            Every comp comes from the one unified source regardless of what appears here.
          </p>
          <div className="k-set-card-body" style={{ padding: 0 }}>
            {sources.isPending ? (
              <p className="k-note" style={{ padding: '14px 16px' }}>
                Reading…
              </p>
            ) : (
              routing.map(([category, keys]) => (
                <div key={category} className="k-adm-route">
                  <span className="k-adm-route-cat">{category}</span>
                  <span className="k-adm-route-list">
                    {keys.map((key, i) => (
                      <span key={key} className="k-adm-route-src" title={byKey.get(key)?.kind}>
                        {byKey.get(key)?.name ?? key}
                        {i < keys.length - 1 ? <Icon d={I.chevright} size={10} /> : null}
                      </span>
                    ))}
                  </span>
                </div>
              ))
            )}
            {sources.data?.default_priority?.length ? (
              <div className="k-adm-route">
                <span className="k-adm-route-cat" style={{ color: 'var(--k-fg-3)' }}>
                  Everything else
                </span>
                <span className="k-adm-route-list">
                  {sources.data.default_priority.map((key, i) => (
                    <span key={key} className="k-adm-route-src">
                      {byKey.get(key)?.name ?? key}
                      {i < (sources.data?.default_priority?.length ?? 0) - 1 ? (
                        <Icon d={I.chevright} size={10} />
                      ) : null}
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AdminShell>
  )
}
