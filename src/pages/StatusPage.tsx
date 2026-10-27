import { useQuery } from '@tanstack/react-query'

import Seo from '../components/Seo'
import { MktFooter, MktNav } from '../components/MarketingChrome'
import { SeoPageHead, crumbJsonLd } from '../components/seo-kit'
import { API_BASE_URL } from '../lib/env'
import { publicStatusFor, type PublicStatus } from '../lib/service-status-rules'

/**
 * /status — the public service status page.
 *
 * WHY IT EXISTS. `GET /v1/status` has been driving the in-app service banner
 * for a while; nothing rendered it publicly. A carrier or TPA procurement
 * review asks for a status URL, and "we have the signal internally" is not an
 * answer you can paste into a questionnaire.
 *
 * ⛔ IT REPORTS ONLY WHAT WE ACTUALLY MEASURE. One row: the pricing engine,
 * because that is the one component with a real health signal behind it. The
 * temptation on a page like this is a tidy grid -- API, Web app, Mobile,
 * Database -- all permanently green because nothing monitors them. That is a
 * page of decoration that becomes a lie on the first outage. One honest row
 * beats four decorative ones, and the page says so in as many words.
 *
 * ⛔ THE PRERENDERED SHELL MUST NEVER SAY "OPERATIONAL". The build-time render
 * has no data, so publicStatusFor(undefined) gives "Checking" -- which is what
 * lands in the static HTML and what a crawler or an AI answer engine can
 * cache. Ship an optimistic default here and the cached copy tells the world
 * everything is fine during an outage. Same reason `unknown` is not folded
 * into `ok`: a read we could not parse is not a healthy read.
 *
 * ⛔ NO VENDOR NAME (rule 10). "Search provider" is as specific as this gets,
 * exactly as in the banner copy.
 */

async function fetchStatus(): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/v1/status`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.json()
}

const DOT: Record<PublicStatus['tone'], string> = {
  ok: 'var(--k-ok)',
  degraded: 'var(--k-service)',
  paused: 'var(--k-service)',
  unknown: 'var(--k-fg-4)',
}

const fmt = (iso: string | null | undefined) => {
  if (!iso) return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  return new Date(t).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const CRUMBS = [{ to: '/status', t: 'Service status' }]

export default function StatusPage() {
  const { data, isError } = useQuery({
    queryKey: ['service-status'],
    queryFn: fetchStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  const status = publicStatusFor(data)
  // A read that failed outright says so, rather than sitting on "Checking"
  // forever and looking like a page that never loaded.
  const shown: PublicStatus = isError
    ? {
        label: 'Unavailable',
        detail:
          'This page could not reach the service to ask. That is a problem reading the status, which is not the same as an outage — and not the same as a clean bill of health either.',
        tone: 'unknown',
      }
    : status

  const updated = fmt(
    (data as { updated_at?: string } | undefined)?.updated_at ?? null,
  )

  return (
    <div className="k-landing">
      <Seo path="/status" jsonLd={[crumbJsonLd(CRUMBS)]} />
      <MktNav />

      <main className="k-mkt-main k-seopage">
        <SeoPageHead
          crumbs={CRUMBS}
          h1="Service status"
          lede="The live state of the Kevin pricing engine, read from the same signal the product uses. One component, because one component is what we actually measure."
        />

        <section className="k-seosec">
          <div
            style={{
              border: '1px solid var(--k-line)',
              borderRadius: 12,
              padding: '22px 24px',
              background: 'var(--k-bg-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: DOT[shown.tone],
                  flex: '0 0 auto',
                }}
              />
              <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.01em' }}>
                Pricing engine — {shown.label}
              </h2>
            </div>
            <p
              style={{
                margin: '12px 0 0',
                paddingLeft: 24,
                color: 'var(--k-fg-2)',
                lineHeight: 1.55,
                maxWidth: 620,
              }}
            >
              {shown.detail}
            </p>
            {updated ? (
              <p
                style={{
                  margin: '14px 0 0',
                  paddingLeft: 24,
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 12,
                  color: 'var(--k-fg-4)',
                }}
              >
                Reported {updated} · rechecked every 60 seconds
              </p>
            ) : null}
          </div>
        </section>

        <section className="k-seosec">
          <h2>What this page covers, and what it does not</h2>
          <p>
            The pricing engine is the component with a real health signal behind it, so it is the
            one this page reports. There is no grid of permanently green rows for the web app, the
            API or the database here &mdash; a tick that nothing measures is decoration, and it
            becomes untrue on the first outage, which is the one day anybody reads a status page.
          </p>
          <p>
            If the product is unreachable in a way this page does not show, that is worth telling
            us about: <a href="mailto:kevin@kevin.co">kevin@kevin.co</a>.
          </p>
        </section>

        <section className="k-seosec">
          <h2>What each state means for your work</h2>
          <dl className="k-seolist">
            <dt>
              <strong>Operational</strong>
            </dt>
            <dd>Items price as they are processed. Nothing to do.</dd>
            <dt style={{ marginTop: 14 }}>
              <strong>Degraded</strong>
            </dt>
            <dd>
              Pricing runs, but slower &mdash; a large claim takes noticeably longer to finish.
              Nothing is lost and nothing needs re-entering.
            </dd>
            <dt style={{ marginTop: 14 }}>
              <strong>Paused</strong>
            </dt>
            <dd>
              Nothing is pricing for the moment. Everything else works: uploading, staging,
              editing, exporting. Lines that were waiting show a <strong>Pricing</strong> chip
              rather than an error, and a worksheet bar offers <strong>Retry deferred</strong> once
              capacity returns. A line deferred during a pause needs that retry &mdash; it does not
              silently resume on its own.
            </dd>
            <dt style={{ marginTop: 14 }}>
              <strong>Checking / Unavailable</strong>
            </dt>
            <dd>
              This page could not get an answer. That is not the same as an outage, and it is not a
              clean bill of health &mdash; it means we do not know, and would rather say so.
            </dd>
          </dl>
        </section>
      </main>

      <MktFooter />
    </div>
  )
}
