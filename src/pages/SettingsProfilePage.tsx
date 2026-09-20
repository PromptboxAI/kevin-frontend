import { useEffect, useRef, useState } from 'react'
import { formatPhone } from '../lib/phone-rules'
import { useAuth } from '../lib/auth'
import { AvatarStorageMissing, EMPTY_PROFILE, profileFrom, removeAvatar, saveProfile, uploadAvatar } from '../lib/profile'
import { LOGO_ERROR, logoProblem } from '../lib/directory-rules'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import SettingsShell from '../components/SettingsShell'
import { F } from '../components/SettingsFields'
import { Icon, I } from '../components/Icon'
import { api } from '../lib/api'
import type { MeResponse } from '../lib/types'

/**
 * Screen 31 — My profile. Ported from `SettingsProfile` in
 * `design/components/settings-pages.jsx`.
 *
 * Deviations, all noted:
 *
 * 1. **No seeded identity.** The design fills every field with the demo
 *    adjuster (Mariana Reyes, Reyes Adjusting, Hauppauge NY). This app has a
 *    real signed-in account: `GET /v1/me` supplies the email, and the rest are
 *    empty fields with placeholders. Showing a stranger's name and firm as the
 *    user's own is not a placeholder, it is wrong — and on the screen that
 *    prints "Prepared by" on a carrier-facing document, doubly so.
 *
 * 2. **The Security rows describe CAPABILITY, not state.** The design's
 *    sub-lines assert facts about the account — "Enabled · Authenticator app
 *    (8 backup codes left)", "3 registered", "3 devices", "Last changed 4
 *    months ago". Nothing here can verify any of that, and telling someone
 *    two-factor is enabled when it is not is the most damaging thing this page
 *    could say. Same class of problem as the seeded card digits on Billing.
 *    The four rows and their CTAs are kept exactly; the sub-lines say what each
 *    control does. They point at real anchors on screen 41.
 *
 * 3. **Notification toggles are stateful.** The design renders the tick from a
 *    literal, and `.k-pref-toggle input` is `display:none` with no `:checked`
 *    rule — so in a live app the boxes did not move when clicked. They are
 *    React state now. They still do not PERSIST (no endpoint, and no sending
 *    service behind them), which the card says in one line rather than letting
 *    someone believe a preference was saved.
 *
 * "Prepared by" stays per claim and that is settled backend-side, not a gap:
 * migration 0043 puts `estimator_name` / `business_name` on the CLAIM
 * deliberately, because an inventory prepared by someone who has since left the
 * firm must keep saying so — "a profile table would rewrite history".
 *
 * Every control's production target is in INTERACTIONS.md.
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

/** [label, what the control does, CTA, anchor on screen 41] */
const SECURITY_ROWS: [string, string, string, string][] = [
  ['Password', 'Change the password you sign in with', 'Change', '#password'],
  ['Two-factor auth', 'Adds a second step at sign-in', 'Manage', '#two-factor'],
  ['Active sessions', 'Sign out the devices you are signed in on', 'Sign out others', '#sessions'],
]

/** [key, label, email default, push default, description] */
const NOTIFICATIONS: [string, string, boolean, boolean, string][] = [
  [
    'processing',
    'Processing complete',
    true,
    true,
    'Identification and pricing finished — the worksheet is ready to review',
  ],
  [
    'export_ready',
    'Export ready',
    true,
    false,
    'The file finished generating and is ready to download or share',
  ],
  ['export_failed', 'Export failed', true, true, 'With a reference ID and a retry'],
  ['share_opened', 'Share link opened', true, false, 'Someone you sent a link to has opened it'],
  [
    'special_limits',
    'Special-limits flagged',
    true,
    false,
    'An item may be capped under the policy’s special-limits provision',
  ],
  [
    'storage',
    'Storage nearing the pool',
    true,
    false,
    'An email first — never a lockout mid-claim',
  ],
  ['payment', 'Payment problem', true, true, 'Before anything is interrupted'],
]

type Channel = 'mail' | 'push'

/** A controlled version of `F`: this page tracks its values to save them. */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <div className="k-insp-field">
      <label>{label}</label>
      <input
        className={`k-insp-input${mono ? ' k-mono' : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function SettingsProfilePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })

  // Deviation 3: the ticks follow state, so the control responds to a click.
  const [prefs, setPrefs] = useState<Record<string, { mail: boolean; push: boolean }>>(() =>
    Object.fromEntries(NOTIFICATIONS.map(([k, , mail, push]) => [k, { mail, push }])),
  )
  const toggle = (key: string, channel: Channel) =>
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }))

  // The identity fields are uncontrolled (the design uses defaultValue), so a
  // key bump remounts them to clear what was typed. The prefs are state and
  // reset directly.
  const [fieldsKey, setFieldsKey] = useState(0)
  const discard = () => {
    setForm(profileFrom(session?.user?.user_metadata))
    setFieldsKey((n) => n + 1)
    setPrefs(Object.fromEntries(NOTIFICATIONS.map(([k, , mail, push]) => [k, { mail, push }])))
  }

  const email = me.data?.email ?? ''
  const initials = (email.split('@')[0]?.slice(0, 2) || 'K').toUpperCase()

  /**
   * The profile is stored on the AUTH USER (lib/profile.ts), so Save is real
   * even without our own profile route: the values come back on the next sign
   * in, on another machine, in any tab. Seeded from the session once it lands.
   */
  const { session } = useAuth()
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [seeded, setSeeded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (seeded || !session?.user) return
    setForm(profileFrom(session.user.user_metadata))
    setSeeded(true)
  }, [seeded, session])

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await saveProfile(form)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2600)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const takePhoto = async (file: File) => {
    const problem = logoProblem(file)
    if (problem) {
      setPhotoError(LOGO_ERROR[problem])
      return
    }
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      const url = await uploadAvatar(file, session!.user.id)
      setForm((prev) => ({ ...prev, avatar_url: url }))
    } catch (err) {
      setPhotoError(
        err instanceof AvatarStorageMissing
          ? 'Photo storage isn’t set up on this project yet — nothing to upload to.'
          : err instanceof Error
            ? err.message
            : 'Upload failed.',
      )
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <SettingsShell
      activeId="my-profile"
      title="My profile"
      eyebrow="Personal · session"
      onSave={() => void save()}
      saveLabel={saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
      onDiscard={discard}
      saveNote={
        saveError ? (
          <span style={{ color: 'var(--k-danger)' }}>{saveError}</span>
        ) : (
          <>Saved to your account. Your email comes from your sign-in, and “Prepared by” on a
          document is the estimator picked on that claim.</>
        )
      }
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
          Signed in with your work email.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Your details</div>
        <div className="k-set-card-body">
          <div className="k-set-avatar-row">
            {form.avatar_url ? (
              <img className="k-set-avatar k-set-avatar--img" src={form.avatar_url} alt="" />
            ) : (
              <div className="k-set-avatar">{initials}</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Profile photo</div>
              <div style={{ fontSize: 11.5, color: photoError ? 'var(--k-danger)' : 'var(--k-fg-4)', marginTop: 2 }}>
                {photoError ?? 'Square JPG, PNG or WebP, up to 512 KB.'}
              </div>
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void takePhoto(f)
                e.target.value = ''
              }}
            />
            {form.avatar_url ? (
              <button
                type="button"
                className="k-link"
                style={{ marginRight: 10 }}
                onClick={() => {
                  void removeAvatar(form.avatar_url)
                  setForm((prev) => ({ ...prev, avatar_url: '' }))
                }}
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              className="k-btn k-btn--ghost"
              disabled={photoBusy}
              onClick={() => photoRef.current?.click()}
            >
              {photoBusy ? 'Uploading…' : form.avatar_url ? 'Replace' : 'Upload new'}
            </button>
          </div>

          <div className="k-set-grid2" key={fieldsKey}>
            <TextField
              label="First name"
              value={form.first_name}
              placeholder="Your first name"
              onChange={set('first_name')}
            />
            <TextField
              label="Last name"
              value={form.last_name}
              placeholder="Your last name"
              onChange={set('last_name')}
            />
            <F label="Work email" value={email} readOnly hint="From your sign-in" />
            <TextField
              label="Phone"
              value={form.phone}
              mono
              placeholder="555-123-4567"
              onChange={(v) => set('phone')(formatPhone(v))}
            />
            <div className="k-insp-field">
              <label htmlFor="profile-title">Title</label>
              <div className="k-fselect">
                <select
                  id="profile-title"
                  value={form.title}
                  onChange={(e) => set('title')(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="k-fselect-ic">
                  <Icon d={I.chevdown} size={11} />
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--k-fg-4)' }}>
                Optional — how you’d be described on a document
              </span>
            </div>
            <div className="k-insp-field">
              <label htmlFor="timezone">Time zone</label>
              <div className="k-fselect">
                <select
                  id="timezone"
                  value={form.timezone || 'America/New_York'}
                  onChange={(e) => set('timezone')(e.target.value)}
                >
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
              <Link className="k-btn k-btn--ghost" to={`/settings/security${hash}`}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Notifications</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {NOTIFICATIONS.map(([key, l, , , sub]) => (
            <div key={key} className="k-set-pref">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>{sub}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, minWidth: 180, justifyContent: 'flex-end' }}>
                {(['mail', 'push'] as Channel[]).map((channel) => {
                  const on = prefs[key][channel]
                  return (
                    <label key={channel} className="k-pref-toggle">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(key, channel)}
                        aria-label={`${l} — ${channel === 'mail' ? 'Email' : 'Push'}`}
                      />
                      <span
                        className="k-toggle-box"
                        // .k-pref-toggle hides its input and carries no :checked
                        // rule, so the box is styled from state here rather than
                        // in CSS -- otherwise it never moves.
                        style={
                          on
                            ? { background: 'var(--k-accent)', borderColor: 'var(--k-accent)' }
                            : undefined
                        }
                      >
                        {on ? <Icon d={I.check} size={10} stroke={2.5} /> : null}
                      </span>
                      <span style={{ fontSize: 11.5 }}>
                        {channel === 'mail' ? 'Email' : 'Push'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 12, lineHeight: 1.5 }}>
            These are the sixteen transactional emails in <code>emails/</code>. Preferences do not
            save yet — there is no endpoint behind them and no sending service wired up.
          </div>
        </div>
      </section>

      <section className="k-set-card k-set-card--danger">
        <div className="k-set-card-hd">Danger zone</div>
        <div className="k-set-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Export my data</div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                One archive of every claim, export and audit-log entry on the account. Not built
                yet — export claims one at a time from the Export tab meanwhile.
              </div>
            </div>
            {/* No account-export route exists (BACKEND-ASKS). A button that
                does nothing is worse than saying so. */}
            <span className="k-claim-tab-soon">Soon</span>
          </div>
          <div className="k-set-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--k-danger)' }}>
                Delete my account
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                Not built yet. You can delete individual claims from My claims today; email us to
                close an account.
              </div>
            </div>
            {/* Same: deleting an account needs a server-side cascade and a
                Supabase admin call. Claims can be deleted today, one by one,
                from My claims. */}
            <span className="k-claim-tab-soon">Soon</span>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
