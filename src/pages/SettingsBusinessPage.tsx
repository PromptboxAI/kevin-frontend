import { Link } from 'react-router-dom'
import SettingsShell from '../components/SettingsShell'
import { F, FSelect, FSelectOther, FBrandColor } from '../components/SettingsFields'
import { US_STATES } from '../lib/us-states'

/**
 * Screen 32 — Business. Ported from `SettingsAgency` in
 * `design/components/settings-pages.jsx`.
 *
 * One deviation, noted: the Enterprise CTA points at `/contact` rather than
 * `15-Request-access.html`, since that is where the app's request-access flow
 * lives.
 *
 * No business write route exists yet (BACKEND-ASKS ask 33), so the fields hold
 * the design's values and nothing persists. Each control's production target is
 * in INTERACTIONS.md.
 */

const BUSINESS_TYPES = [
  'Independent adjuster',
  'Public adjuster',
  'Staff adjuster',
  'Third-party administrator',
  'Restoration contractor',
  'Estate sale company',
  'Estate liquidator',
  'Appraiser',
]

const TAX_FALLBACKS = [
  'Suffolk County, NY · 8.625%',
  'Nassau County, NY · 8.625%',
  'New York City · 8.875%',
  'New York State only · 4%',
  'No sales tax · 0%',
]

const POLICY_FORMS = [
  'None · estate sale work',
  'HO-1 · Basic',
  'HO-2 · Broad',
  'HO-3 · Open perils',
  'HO-5 · Comprehensive',
  'HO-4 · Renters',
  'HO-6 · Condo',
  'HO-8 · Older home',
  'DP-1 · Dwelling basic',
  'DP-3 · Dwelling fire',
  'CP · Commercial property',
  'BOP · Business owners',
]

export default function SettingsBusinessPage() {
  return (
    <SettingsShell
      activeId="agency"
      title="Business"
      eyebrow="Your business · branding"
      saveDisabled
      saveNote={
        <>
          Defaults apply to new claims, and anything already in a claim keeps
          the value it was created with — but nothing saves yet: there is no
          business write route (BACKEND-ASKS ask 35).
        </>
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
          Reyes Adjusting, LLC
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
          Your business details and branding. These appear on the inventories and PDFs you export.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Business details</div>
        <div className="k-set-card-body">
          <div className="k-set-grid2">
            <F label="Legal name" value="Reyes Adjusting, LLC" />
            <F label="DBA / brand" value="Reyes Adjusting" />
            <F label="License # (New York)" value="2401-44210" mono />
            <F label="Tax ID (EIN)" value="46-2018553" mono />
            <FSelectOther label="Type" value="Independent adjuster" options={BUSINESS_TYPES} />
            <F label="Founded" value="2020" mono />
          </div>
          <div style={{ marginTop: 14 }}>
            <F label="Street" value="150 Motor Pkwy, Suite 401" />
          </div>
          <div className="k-set-grid3" style={{ marginTop: 14 }}>
            <F label="City" value="Hauppauge" />
            <FSelect label="State" value="NY" mono options={US_STATES} />
            <F label="ZIP" value="11788" mono hint="Your office — does not affect claim tax" />
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Branding · on your exports</div>
        <div className="k-set-card-body">
          <div className="k-set-row" style={{ marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                &quot;Prepared with Kevin&quot; footer
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--k-fg-4)', marginTop: 2 }}>
                A small line in the PDF footer. Your firm stays the brand on the document — this
                just credits the tool. On by default; turn it off any time.
              </div>
            </div>
            <label className="k-switch">
              <input type="checkbox" defaultChecked={true} />
              <span className="k-switch-track">
                <span className="k-switch-thumb" />
              </span>
            </label>
          </div>
          <div className="k-set-grid2">
            <div className="k-insp-field">
              <label>Logo</label>
              <div className="k-set-logo-row">
                <div className="k-set-logo">RA</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5 }}>reyes-logo.svg</div>
                  <div style={{ fontSize: 11, color: 'var(--k-fg-4)', marginTop: 2 }}>
                    Your exports and share links carry YOUR name and logo in the header — Kevin
                    never brands the document itself.
                  </div>
                </div>
                <label className="k-btn k-btn--ghost" style={{ cursor: 'pointer' }}>
                  Upload
                  <input type="file" accept="image/svg+xml,image/png" style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            <FBrandColor value="#2E4B6F" />
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Defaults · applied to new claims</div>
        <div className="k-set-card-body">
          <div className="k-set-grid2">
            <FSelect
              label="Default tax-rate fallback"
              value="Suffolk County, NY · 8.625%"
              mono
              options={TAX_FALLBACKS}
              hint="Only used when the loss ZIP doesn’t resolve"
            />
            <FSelectOther
              label="Default policy form"
              value="HO-3 · Open perils"
              placeholder="e.g. MH-3, FR-1, a state-specific form"
              options={POLICY_FORMS}
            />
            <FSelect
              label="Default condition"
              value="Average"
              options={['Excellent', 'Good', 'Average', 'Fair', 'Poor']}
              hint="Starting grade on every new item"
            />
            <FSelect
              label="Default depreciation schedule"
              value="Straight-line · standard"
              options={[
                'Straight-line · standard',
                'Bracketed · standard',
                'Custom · preparer-entered',
              ]}
              hint="Selectable per claim at intake"
            />
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Working with a team?</div>
        <div className="k-set-card-body">
          <div className="k-set-row" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, color: 'var(--k-fg-3)', lineHeight: 1.55, maxWidth: 460 }}
              >
                Pro is a single-user subscription. Reviewer roles, shared workspaces, and team
                management are available on Enterprise — volume licensing for a whole desk or agency
                on one invoice.
              </div>
            </div>
            <Link className="k-btn" to="/contact">
              Talk to us about Enterprise →
            </Link>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}
