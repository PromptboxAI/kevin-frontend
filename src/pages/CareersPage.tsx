import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Careers (/careers) — ported from `Careers` in
 * design/components/utility-pages.jsx, copy verbatim.
 *
 * There is no ATS. A role row is a `mailto:` with the title in the subject —
 * a three-person company takes applications by email, and a fake apply form
 * that posted nowhere would be worse. Roles are CMS content (admin console 68);
 * the array below is the seed until that exists.
 */

type Role = { team: string; title: string; loc: string; type: string; isNew?: boolean }

const ROLES: Role[] = [
  {
    team: 'Claims',
    title: 'Adjuster in residence',
    loc: 'Remote (US)',
    type: 'Part-time / contract',
    isNew: true,
  },
]

const TEAMS = [...new Set(ROLES.map((r) => r.team))]

export default function CareersPage() {
  return (
    <div className="k-landing">
      <MktNav />
      <main className="k-mkt-main">
        <section style={{ maxWidth: 920, margin: '0 auto', padding: '60px 40px 40px' }}>
          <Badge tone="accent" dot>
            We're hiring carefully
          </Badge>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 56,
              letterSpacing: '-0.028em',
              margin: '18px 0 16px',
              lineHeight: 1.02,
            }}
          >
            Open roles.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--k-fg-2)',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 600,
            }}
          >
            We're three people in Long Island, NY, and we hire slowly. If you've settled a claim, run
            an estate sale, or shipped software that people use all day to do their job, we want to
            hear from you.
          </p>
        </section>

        <section style={{ maxWidth: 920, margin: '0 auto', padding: '0 40px 60px' }}>
          {TEAMS.map((team) => (
            <div key={team} style={{ marginBottom: 28 }}>
              <h3
                style={{
                  fontFamily: 'var(--k-font-mono)',
                  fontSize: 11,
                  color: 'var(--k-fg-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  margin: '0 0 10px',
                }}
              >
                {team}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROLES.filter((r) => r.team === team).map((r) => (
                  <a
                    key={r.title}
                    className="k-career-row"
                    href={`mailto:kevin@kevin.co?subject=${encodeURIComponent(
                      r.title + ' — application',
                    )}`}
                  >
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</span>
                        {r.isNew && <Badge tone="ok">New</Badge>}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--k-fg-4)',
                          marginTop: 3,
                          fontFamily: 'var(--k-font-mono)',
                        }}
                      >
                        {r.loc} · {r.type}
                      </div>
                    </div>
                    <Icon d={I.chevright} size={14} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="k-mkt-band" style={{ maxWidth: 1180, margin: '0 auto 60px' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'var(--k-accent)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Don't see your role?
            </div>
            <h2
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 28,
                letterSpacing: '-0.022em',
                margin: '8px 0 8px',
              }}
            >
              Send us a note anyway.
            </h2>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 480 }}>
              If you've spent time in insurance claims, restoration, estate sales, or content
              valuation — we want to talk even if there isn't a posted role.
            </p>
          </div>
          <a className="k-btn" href="mailto:kevin@kevin.co">
            kevin@kevin.co
          </a>
        </section>

        <MktFooter />
      </main>
    </div>
  )
}
