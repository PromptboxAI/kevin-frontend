import { useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Screen 15 — Request access (/request-access). Ported from `RequestAccess` in
 * design/components/request-access.jsx. The Enterprise tier's "Talk to us about
 * your desk" and the Business settings "Talk to us about Enterprise" both land
 * here.
 *
 * THREE deviations:
 *
 * 1. **The demo answers are gone.** The prototype ships the form pre-filled
 *    with Marcus Delgado of Delgado & Co., Tampa, phone and all — seed data
 *    that reads correctly on a design canvas and, live, hands a visitor a
 *    stranger's details to submit. They are placeholders now. The testimonial
 *    from the same firm stays: that is approved marketing copy, not a form
 *    value.
 *
 * 2. **The trial sentence.** The design's aside said Pro came with a "7-day
 *    free trial", which CLAUDE.md rule 9b scrapped — the trial is metered at
 *    250 items with no deadline. Fixed here AND at source in the design file;
 *    check-domain-rules.py had missed it because the negation hint elsewhere on
 *    the line ("You don't need this") suppressed the whole line.
 *
 * 3. **Submit composes a mail rather than posting.** There is no
 *    /v1/enterprise-lead endpoint. /contact solves this with a bare mailto, but
 *    this form asks nine questions and a bare mailto would throw all nine away,
 *    so the answers are composed into the message body. Recorded in
 *    INTERACTIONS.md; when the endpoint exists, POST instead and keep the
 *    mailto as the failure path.
 */

const CARRIERS = [
  'Nationwide',
  'Allstate',
  'State Farm',
  'Travelers',
  'Chubb',
  'SageSure',
  'Narragansett Bay',
  'GEICO',
  'Liberty Mutual',
  'AFICS',
  'AIG',
  'Amica',
  'USAA',
  'Other (custom)',
]

const VOLUMES = [
  { id: 'low', label: 'Low', sub: '< 10 claims/mo' },
  { id: 'mid', label: 'Steady', sub: '10–50 claims/mo' },
  { id: 'high', label: 'High', sub: '50–200 claims/mo' },
  { id: 'ent', label: 'Bulk', sub: '> 200 claims/mo · est.' },
]

const EYEBROW: CSSProperties = {
  fontSize: 11,
  color: 'var(--k-fg-4)',
  fontFamily: 'var(--k-font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
}

const BULLETS: [string, string][] = [
  ['You submit this form', '~2 minutes · no commitment'],
  [
    'A call within two business days',
    '30 min · workspace, export defaults, reviewer roles and your carrier profiles, set up together',
  ],
  [
    'Pilot on your own losses',
    'Your whole team on the free tier, real claims, before a contract exists',
  ],
]

function InputField({
  name,
  label,
  placeholder,
  hint,
  mono = false,
  width = '100%',
  value,
  onChange,
  type = 'text',
}: {
  name: string
  label: string
  placeholder?: string
  hint?: string
  mono?: boolean
  width?: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="k-insp-field" style={{ width }}>
      <label htmlFor={name}>{label}</label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 11px',
          background: 'var(--k-bg)',
          border: '1px solid var(--k-line)',
          borderRadius: 6,
        }}
      >
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            border: 0,
            outline: 0,
            background: 'transparent',
            flex: 1,
            font: 'inherit',
            fontSize: 13,
            fontFamily: mono ? 'var(--k-font-mono)' : 'inherit',
            color: 'var(--k-fg)',
            minWidth: 0,
          }}
        />
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>{hint}</span>}
    </div>
  )
}

export default function RequestAccessPage() {
  const [carriers, setCarriers] = useState<Set<string>>(new Set())
  const [volume, setVolume] = useState('mid')
  const [f, setF] = useState({
    agency: '',
    kind: '',
    hq: '',
    years: '',
    staff: '',
    name: '',
    title: '',
    email: '',
    phone: '',
    note: '',
  })
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const toggle = (c: string) =>
    setCarriers((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const vol = VOLUMES.find((v) => v.id === volume)
    const body = [
      `Agency: ${f.agency || '—'}`,
      `Type: ${f.kind || '—'}`,
      `Headquartered in: ${f.hq || '—'}`,
      `Years in business: ${f.years || '—'}`,
      `Adjusters on staff: ${f.staff || '—'}`,
      '',
      `Contact: ${f.name || '—'}${f.title ? `, ${f.title}` : ''}`,
      `Email: ${f.email || '—'}`,
      `Phone: ${f.phone || '—'}`,
      '',
      `Carriers: ${carriers.size ? [...carriers].join(', ') : '—'}`,
      `Expected volume: ${vol ? `${vol.label} (${vol.sub})` : '—'}`,
      '',
      // Capped: a mailto href has a practical length limit, and silently
      // truncating the whole message would lose the fields above it too.
      `Notes: ${f.note.slice(0, 900) || '—'}`,
    ].join('\n')
    window.location.href =
      `mailto:kevin@kevin.co?subject=${encodeURIComponent(
        `Enterprise quote — ${f.agency || 'new enquiry'}`,
      )}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="k-req">
      <MktNav />

      <main className="k-req-main">
        <aside className="k-req-l">
          <div style={EYEBROW}>Enterprise · teams</div>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 44,
              letterSpacing: '-0.028em',
              margin: '8px 0 14px',
              lineHeight: 1.04,
            }}
          >
            Two or more adjusters,
            <br />
            one invoice.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--k-fg-2)',
              lineHeight: 1.55,
              margin: '0 0 20px',
              maxWidth: 460,
            }}
          >
            Volume licensing for agencies, carriers and TPAs — every adjuster on one bill, with
            shared carrier profiles and depreciation schedules so two people on the same desk price
            a claim the same way. Tell us how your team works and we will quote it.
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'var(--k-fg-3)',
              lineHeight: 1.5,
              margin: '0 0 32px',
              maxWidth: 460,
            }}
          >
            One adjuster? You don't need this —{' '}
            <Link className="k-link" to="/sign-up">
              start on Pro
            </Link>{' '}
            at $249/mo, unlimited claims with 2,000 line items a month included, and your first 250
            line items free with no deadline.
          </p>

          <div className="k-req-bullets">
            {BULLETS.map(([t, d], i) => (
              <div key={t} className="k-req-bullet">
                <span className="k-req-step">{i + 1}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--k-fg-3)', marginTop: 2 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="k-req-quote">
            <div
              style={{
                fontFamily: 'var(--k-font-display)',
                fontStyle: 'italic',
                fontSize: 19,
                color: 'var(--k-fg-2)',
                lineHeight: 1.35,
                textWrap: 'balance',
              }}
            >
              “Onboarding took one call. By the next claim my whole team was running inventories in
              Kevin instead of typing them into a spreadsheet.”
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 11.5,
                color: 'var(--k-fg-4)',
                fontFamily: 'var(--k-font-mono)',
              }}
            >
              M. Delgado · Delgado &amp; Co. Public Adjusting · Tampa, FL
            </div>
          </div>
        </aside>

        <form className="k-req-form" onSubmit={onSubmit}>
          <section className="k-req-section">
            <div className="k-req-section-hd">
              <span className="k-step-num">01</span>
              <div>
                <div className="k-intake-section-t">About your agency</div>
                <div className="k-intake-section-s">
                  We'll never share these details outside Kevin.
                </div>
              </div>
            </div>
            <div className="k-req-row">
              <InputField
                name="agency"
                label="Agency name"
                placeholder="Your firm"
                width="60%"
                value={f.agency}
                onChange={set('agency')}
              />
              <InputField
                name="kind"
                label="Agency type"
                placeholder="Public adjusting firm"
                width="40%"
                hint="Independent · Public · IA agency · Estate liquidator"
                value={f.kind}
                onChange={set('kind')}
              />
            </div>
            <div className="k-req-row">
              <InputField
                name="hq"
                label="Headquartered in"
                placeholder="City, State"
                width="55%"
                value={f.hq}
                onChange={set('hq')}
              />
              <InputField
                name="years"
                label="Years in business"
                placeholder="6"
                mono
                width="22%"
                value={f.years}
                onChange={set('years')}
              />
              <InputField
                name="staff"
                label="Adjusters on staff"
                placeholder="8"
                mono
                width="22%"
                value={f.staff}
                onChange={set('staff')}
              />
            </div>
          </section>

          <section className="k-req-section">
            <div className="k-req-section-hd">
              <span className="k-step-num">02</span>
              <div>
                <div className="k-intake-section-t">Your primary contact</div>
                <div className="k-intake-section-s">Who should we set up the call with?</div>
              </div>
            </div>
            <div className="k-req-row">
              <InputField
                name="name"
                label="Full name"
                placeholder="First and last name"
                width="50%"
                value={f.name}
                onChange={set('name')}
              />
              <InputField
                name="title"
                label="Title"
                placeholder="Managing Partner"
                width="50%"
                value={f.title}
                onChange={set('title')}
              />
            </div>
            <div className="k-req-row">
              <InputField
                name="email"
                label="Work email"
                type="email"
                placeholder="you@yourfirm.com"
                width="60%"
                value={f.email}
                onChange={set('email')}
              />
              <InputField
                name="phone"
                label="Phone"
                type="tel"
                placeholder="(555) 555-0142"
                mono
                width="40%"
                value={f.phone}
                onChange={set('phone')}
              />
            </div>
          </section>

          <section className="k-req-section">
            <div className="k-req-section-hd">
              <span className="k-step-num">03</span>
              <div>
                <div className="k-intake-section-t">How you work</div>
                <div className="k-intake-section-s">
                  This determines which carrier profiles we pre-load and how we model your pricing
                  region.
                </div>
              </div>
            </div>
            <div className="k-insp-field">
              <label>Carriers you commonly work with</label>
              <div className="k-chip-grid">
                {CARRIERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    aria-pressed={carriers.has(c)}
                    className={`k-chip ${carriers.has(c) ? 'k-chip--on' : ''}`}
                  >
                    {carriers.has(c) && <Icon d={I.check} size={10} stroke={2.5} />}
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="k-insp-field" style={{ marginTop: 14 }}>
              <label>Expected claim volume</label>
              <div className="k-volume-grid">
                {VOLUMES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setVolume(o.id)}
                    aria-pressed={volume === o.id}
                    className={`k-volume ${volume === o.id ? 'k-volume--on' : ''}`}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--k-fg-4)',
                        fontFamily: 'var(--k-font-mono)',
                        marginTop: 4,
                      }}
                    >
                      {o.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="k-insp-field" style={{ marginTop: 14 }}>
              <label htmlFor="note">
                Anything else we should know? <span style={{ color: 'var(--k-fg-4)' }}>(optional)</span>
              </label>
              <textarea
                id="note"
                className="k-insp-input"
                rows={3}
                value={f.note}
                onChange={(e) => set('note')(e.target.value)}
                placeholder="Special workflows, reviewer roles, volume you're planning for, things you've tried before…"
              />
            </div>
          </section>

          <div className="k-req-foot">
            <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', maxWidth: 360 }}>
              By submitting you agree to Kevin's{' '}
              <Link className="k-link" to="/legal">
                Privacy Policy
              </Link>{' '}
              and to us contacting you within two business days. AES-256 at rest, TLS 1.3 in transit
              — your data stays yours.
            </div>
            <div className="k-hero-actions" style={{ marginTop: 0 }}>
              <Link className="k-btn k-btn--ghost" to="/book-call">
                Book a call instead
              </Link>
              <button type="submit" className="k-btn k-btn--lg">
                Request a quote →
              </button>
            </div>
          </div>
        </form>
      </main>

      <MktFooter />
    </div>
  )
}
