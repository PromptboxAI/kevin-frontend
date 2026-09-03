import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import SettingsShell, { NotWired } from '../components/SettingsShell'
import { api } from '../lib/api'
import { fmtInt } from '../lib/format'
import type { MeResponse } from '../lib/types'

/**
 * Screen 31 — My profile.
 *
 * The design draws a full editable identity: first/last name, work email,
 * phone, title, time zone, a profile photo and seven notification toggles.
 * `GET /v1/me` returns `id`, `email`, `roles`, `is_admin` and `quota`, and
 * there is no write route for any of it — so the editable half is not
 * pretended at (ask 33).
 *
 * The part worth getting right is the promise the design makes: "prints under
 * Prepared by on exported PDFs". That identity does exist, but it lives on the
 * CLAIM, not here — resolved deliberately in ask 25, because an estimate is a
 * point-in-time legal document and an adjuster who prepared an inventory in
 * March must still be named on it after they leave the firm. A profile field
 * that all claims pointed at would rewrite history retroactively.
 */
export default function SettingsProfilePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: Infinity,
  })

  const quota = me.data?.quota

  return (
    <SettingsShell activeId="my-profile" title="My profile" eyebrow="Personal · session">
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
          {me.data?.email ?? 'Your account'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
          Signed in{me.data?.roles?.length ? ` · ${me.data.roles.join(', ')}` : ''}
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">This account</div>
        <div className="k-set-card-body">
          <div className="k-set-row">
            <span>Email</span>
            <span className="k-mono">{me.data?.email ?? '—'}</span>
          </div>
          <div className="k-set-row">
            <span>Account ID</span>
            <span className="k-mono" style={{ fontSize: 11.5 }}>
              {me.data?.id ?? '—'}
            </span>
          </div>
          {quota ? (
            <>
              <div className="k-set-row">
                <span>Plan</span>
                <span>{quota.plan ?? '—'}</span>
              </div>
              <div className="k-set-row">
                <span>Items this cycle</span>
                {/* Rule 9c: the counter records items PRODUCED, not kept. */}
                <span className="k-mono">
                  {fmtInt(quota.items_used)} of {fmtInt(quota.included_items)}
                </span>
              </div>
            </>
          ) : null}
          <p
            style={{
              fontSize: 11.5,
              color: 'var(--k-fg-4)',
              lineHeight: 1.5,
              margin: '10px 0 0',
            }}
          >
            Identity comes from your sign-in, so it is not editable here. Plan
            and usage are managed in <Link to="/settings/billing">Billing</Link>.
          </p>
        </div>
      </section>

      <section className="k-set-card" style={{ marginTop: 18 }}>
        <div className="k-set-card-hd">“Prepared by” on an export</div>
        <div className="k-set-card-body">
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: 0 }}>
            The preparer name and firm that print on a Proof of Loss are set{' '}
            <strong>per claim</strong>, on the New claim screen — not from a
            profile. An estimate is a point-in-time document: whoever prepared an
            inventory in March has to still be named on it after they leave the
            firm, and a single profile field that every claim pointed at would
            rewrite that history retroactively.
          </p>
          <p
            style={{
              fontSize: 11.5,
              color: 'var(--k-fg-4)',
              lineHeight: 1.55,
              margin: '10px 0 0',
            }}
          >
            The retyping is handled instead by offering your previous entries
            back as you type. That list lives in this browser and has no
            authority over any claim already filed.
          </p>
        </div>
      </section>

      <div style={{ marginTop: 18 }}>
        <NotWired
          what="Your name, phone, title, time zone and photo"
          detail="GET /v1/me returns the identity carried on your sign-in token — email, roles and usage — and there is no route that writes a profile. These fields are designed (screen 31) and need an account-profile endpoint before they can do anything; a Save button over nothing would tell you your changes were kept."
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <NotWired
          what="Notification preferences"
          detail="The seven toggles on screen 31 pair with the sixteen transactional templates in design/emails/. Both the sending service and a preferences endpoint are engineering work; until they exist, toggling one here would change nothing about what arrives."
        />
      </div>
    </SettingsShell>
  )
}
