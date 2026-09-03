import { useQuery } from '@tanstack/react-query'
import SettingsShell from '../components/SettingsShell'
import { F, FSelectOther } from '../components/SettingsFields'
import { Icon, I } from '../components/Icon'
import { api } from '../lib/api'
import type { MeResponse } from '../lib/types'

/**
 * Screen 31 — My profile. Ported from `SettingsProfile` in
 * `design/components/settings-pages.jsx`.
 *
 * TWO deviations, both noted per the Porting rule:
 *
 * 1. The design seeds every field with the demo adjuster (Mariana Reyes). This
 *    app has a real signed-in account, and printing someone else's name as the
 *    user's own is not a placeholder, it's wrong. So `GET /v1/me` supplies the
 *    email and the heading; the fields with no endpoint behind them keep the
 *    design's values as the placeholders they are.
 * 2. The Security rows link to `/settings/security` (screen 41) rather than to
 *    `41-Security.html#hash`. Same destination, app routing.
 *
 * Everything else is lifted: the avatar row, the two-column grid, the timezone
 * optgroups, the seven notification rows with their Email/Push pair, and the
 * danger zone. None of it saves — see INTERACTIONS.md for each control's
 * production target, which is the contract the no-dead-ends rule asks for.
 */

const TITLES = [
  'General Adjuster',
  'Independent Adjuster',
  'Public Adjuster',
  'Staff Adjuster',
  'Senior Adjuster',
  'Estate Sale Manager',
  'Appraiser',
  'Owner',
]

const SECURITY_ROWS: [string, string, string, string][] = [
  ['Password', 'Last changed 4 months ago', 'Change', '#password'],
  ['Two-factor auth', 'Enabled · Authenticator app (8 backup codes left)', 'Manage', '#two-factor'],
  ['Passkeys', '3 registered · MacBook Pro, iPhone, 1Password', 'Manage', '#passkeys'],
  ['Active sessions', '3 devices · Mac Safari · iPhone · iPad', 'Sign out others', '#sessions'],
]

const NOTIFICATIONS: [string, boolean, boolean, string][] = [
  [
    'Processing complete',
    true,
    true,
    'Identification and pricing finished — the worksheet is ready to review',
  ],
  ['Export ready', true, false, 'The file finished generating and is ready to download or share'],
  ['Export failed', true, true, 'With a reference ID and a retry'],
  ['Share link opened', true, false, 'Someone you sent a link to has opened it'],
  [
    'Special-limits flagged',
    true,
    false,
    'An item may be capped under the policy’s special-limits provision',
  ],
  ['Storage nearing the pool', true, false, 'An email first — never a lockout mid-claim'],
  ['Payment problem', true, true, 'Before anything is interrupted'],
]

export default function SettingsProfilePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })

  const email = me.data?.email ?? ''
  const local = email.split('@')[0] ?? ''
  const initials = (local.slice(0, 2) || 'K').toUpperCase()

  return (
    <SettingsShell
      activeId="my-profile"
      title="My profile"
      eyebrow="Personal · session"
      saveNote="Your name and title appear on exports you prepare from now on."
    >
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          {email || 'Your account'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
          General Adjuster · Reyes Adjusting, LLC · Hauppauge, NY
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Personal · prints as “Prepared by” on exports</div>
        <div className="k-set-card-body">
          <div className="k-set-avatar-row">
            <div className="k-set-avatar">{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Profile photo</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Square JPG/PNG up to 2 MB. Shows in the audit log.
              </div>
            </div>
            <button type="button" className="k-btn k-btn--ghost">
              Upload new
            </button>
          </div>
          <div className="k-set-grid2">
            <F label="First name" value="Mariana" />
            <F label="Last name" value="Reyes" />
            <F label="Work email" value={email} readOnly hint="From your sign-in" />
            <F label="Phone" value="(631) 555-0142" mono />
            <FSelectOther
              label="Title"
              value="General Adjuster"
              placeholder="Your title as it should print"
              options={TITLES}
              hint="Prints under Prepared by on exported PDFs"
            />
            <div className="k-insp-field">
              <label>Time zone</label>
              <div className="k-fselect">
                <select defaultValue="America/New_York">
                  <optgroup label="United States">
                    <option value="America/New_York">Eastern Time (ET, GMT−5)</option>
                    <option value="America/Chicago">Central Time (CT, GMT−6)</option>
                    <option value="America/Denver">Mountain Time (MT, GMT−7)</option>
                    <option value="America/Phoenix">Arizona (MST, GMT−7, no DST)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT, GMT−8)</option>
                    <option value="America/Anchorage">Alaska Time (AKT, GMT−9)</option>
                    <option value="Pacific/Honolulu">Hawaii (HST, GMT−10)</option>
                  </optgroup>
                  <optgroup label="Canada">
                    <option value="America/Halifax">Atlantic (AT, GMT−4)</option>
                    <option value="America/Toronto">Toronto (ET, GMT−5)</option>
                    <option value="America/Winnipeg">Winnipeg (CT, GMT−6)</option>
                    <option value="America/Edmonton">Edmonton (MT, GMT−7)</option>
                    <option value="America/Vancouver">Vancouver (PT, GMT−8)</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="Europe/London">London (GMT+0)</option>
                    <option value="Europe/Dublin">Dublin (GMT+0)</option>
                    <option value="Europe/Paris">Paris (CET, GMT+1)</option>
                    <option value="Europe/Berlin">Berlin (CET, GMT+1)</option>
                    <option value="Europe/Madrid">Madrid (CET, GMT+1)</option>
                    <option value="Europe/Rome">Rome (CET, GMT+1)</option>
                    <option value="Europe/Amsterdam">Amsterdam (CET, GMT+1)</option>
                    <option value="Europe/Stockholm">Stockholm (CET, GMT+1)</option>
                    <option value="Europe/Helsinki">Helsinki (EET, GMT+2)</option>
                    <option value="Europe/Athens">Athens (EET, GMT+2)</option>
                  </optgroup>
                  <optgroup label="Asia / Pacific">
                    <option value="Asia/Dubai">Dubai (GST, GMT+4)</option>
                    <option value="Asia/Kolkata">Mumbai · Delhi (IST, GMT+5:30)</option>
                    <option value="Asia/Singapore">Singapore (SGT, GMT+8)</option>
                    <option value="Asia/Hong_Kong">Hong Kong (HKT, GMT+8)</option>
                    <option value="Asia/Shanghai">Shanghai · Beijing (CST, GMT+8)</option>
                    <option value="Asia/Tokyo">Tokyo (JST, GMT+9)</option>
                    <option value="Asia/Seoul">Seoul (KST, GMT+9)</option>
                    <option value="Australia/Sydney">Sydney (AEDT, GMT+11)</option>
                    <option value="Pacific/Auckland">Auckland (NZDT, GMT+13)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="UTC">UTC (GMT+0)</option>
                  </optgroup>
                </select>
                <span className="k-fselect-ic">
                  <Icon d={I.chevdown} size={11} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Security</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECURITY_ROWS.map(([l, sub, cta, hash]) => (
            <div key={l} className="k-set-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
              </div>
              <a className="k-btn k-btn--ghost" href={`/settings/security${hash}`}>
                {cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Notifications</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {NOTIFICATIONS.map(([l, mail, push, sub]) => (
            <div key={l} className="k-set-pref">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, minWidth: 180, justifyContent: 'flex-end' }}>
                <label className="k-pref-toggle">
                  <input type="checkbox" defaultChecked={mail} />
                  <span className="k-toggle-box">
                    {mail ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
                  </span>
                  <span style={{ fontSize: 11.5 }}>Email</span>
                </label>
                <label className="k-pref-toggle">
                  <input type="checkbox" defaultChecked={push} />
                  <span className="k-toggle-box">
                    {push ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
                  </span>
                  <span style={{ fontSize: 11.5 }}>Push</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card k-set-card--danger">
        <div className="k-set-card-hd">Danger zone</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Export my data</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Download every claim, export, and audit-log entry you&apos;ve ever created. ZIP
                delivered to your email within 24 hours.
              </div>
            </div>
            <button type="button" className="k-btn k-btn--ghost">
              <Icon d={I.download} size={12} /> Request export
            </button>
          </div>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-danger)' }}>
                Delete my account
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Permanently deletes your account and all its claims, exports, and audit logs. Cannot
                be undone.
              </div>
            </div>
            <button type="button" className="k-btn k-btn--ghost k-btn--danger">
              <Icon d={I.trash} size={12} /> Delete account
            </button>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
