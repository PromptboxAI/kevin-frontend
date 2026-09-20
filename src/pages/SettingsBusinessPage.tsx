import { useEffect, useRef, useState } from 'react'
import SettingsShell from '../components/SettingsShell'
import IntakeField from '../components/IntakeField'
import { I, Icon } from '../components/Icon'
import { useDirectory } from '../lib/directory'
import {
  BRAND_DEFAULT,
  LOGO_ERROR,
  accentFor,
  companyLines,
  logoProblem,
  newId,
  normalizeHex,
} from '../lib/directory-rules'
import type { Company } from '../lib/directory-rules'

/**
 * The firm's own details — the company header a claim carries.
 *
 * REWRITTEN 2026-09-19. This screen used to display the design's demo values
 * (Reyes Adjusting, a licence number, an EIN) as though they were the
 * account's, with a dead Upload logo button and a line promising that exports
 * carried them. None of it was true: there is no business write route, so
 * nothing saved and nothing reached a document. Showing another firm's details
 * as yours is worse than showing none.
 *
 * What is real now: these fields edit the company header kept in THIS BROWSER
 * (lib/directory), the same one New claim offers, and the brand colour
 * actually repaints the app. What still is not: none of it reaches the
 * exported PDF, because that generator is server-side and the backend has no
 * profile to read (BACKEND-ASKS 33). The page says so rather than implying
 * otherwise.
 */
const SWATCHES = ['#2E4B6F', '#1F3A5F', '#2F5D50', '#6B4E3D', '#5B4B8A', '#1a1d21']

/** A setting the backend cannot store yet: shown, inert, labelled. */
function Soon({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="k-set-soon">
      <div>
        <div className="k-set-soon-l">{label}</div>
        <div className="k-set-soon-s">{detail}</div>
      </div>
      <span className="k-claim-tab-soon">Soon</span>
    </div>
  )
}

export default function SettingsBusinessPage() {
  const { dir, saveCompany } = useDirectory()
  /** One company header per account, for now: the first saved one. */
  const stored: Company | null = dir.companies[0] ?? null

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [license, setLicense] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [logo, setLogo] = useState('')
  const [brand, setBrand] = useState(BRAND_DEFAULT)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Seed from storage once it has been read (an outside system, so an effect).
  useEffect(() => {
    if (!stored) return
    setName(stored.name)
    setAddress(stored.address ?? '')
    setLicense(stored.license ?? '')
    setPhone(stored.phone ?? '')
    setEmail(stored.email ?? '')
    setWebsite(stored.website ?? '')
    setLogo(stored.logo ?? '')
    setBrand(stored.brandColor ?? BRAND_DEFAULT)
  }, [stored])

  const takeLogo = (file: File) => {
    const problem = logoProblem(file)
    if (problem) {
      setLogoError(LOGO_ERROR[problem])
      return
    }
    setLogoError(null)
    const reader = new FileReader()
    reader.onload = () => setLogo(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => setLogoError('That file could not be read.')
    reader.readAsDataURL(file)
  }

  const save = () => {
    saveCompany({
      id: stored?.id ?? newId(),
      name: name.trim() || 'My business',
      address: address.trim() || undefined,
      license: license.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      logo: logo || undefined,
      brandColor: normalizeHex(brand) ?? BRAND_DEFAULT,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const preview: Company = {
    id: 'preview',
    name: name.trim() || 'Your business',
    address: address.trim() || undefined,
    license: license.trim() || undefined,
    phone: phone.trim() || undefined,
    email: email.trim() || undefined,
    website: website.trim() || undefined,
  }

  const derived = normalizeHex(brand) && accentFor(brand) !== normalizeHex(brand)

  return (
    <SettingsShell activeId="agency" title="Business" eyebrow="Your business · branding" save={false}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          {name.trim() || 'Your business'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620 }}>
          The header your claims carry. Pick it on any claim under Personnel &amp; company.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">Company header</div>
        <div className="k-set-card-body">
          <div className="k-set-logo-row" style={{ marginBottom: 16 }}>
            <div className="k-dirmodal-logo-box">
              {logo ? <img src={logo} alt="" /> : <span>No logo</span>}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) takeLogo(f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                className="k-btn k-btn--ghost k-btn--sm"
                onClick={() => fileRef.current?.click()}
              >
                {logo ? 'Replace logo' : 'Upload logo'}
              </button>
              {logo ? (
                <button
                  type="button"
                  className="k-link"
                  style={{ marginLeft: 10 }}
                  onClick={() => setLogo('')}
                >
                  Remove
                </button>
              ) : null}
              <div className="k-dirmodal-hint">
                {logoError ?? 'PNG, JPG, SVG or WebP, up to 512 KB.'}
              </div>
            </div>
          </div>

          <div className="k-set-grid2">
            <IntakeField label="Business name" value={name} width="100%" onChange={setName} />
            <IntakeField label="License #" value={license} width="100%" onChange={setLicense} />
            <IntakeField label="Address" value={address} width="100%" onChange={setAddress} />
            <IntakeField label="Phone" value={phone} width="100%" onChange={setPhone} />
            <IntakeField label="Email" value={email} width="100%" onChange={setEmail} />
            <IntakeField label="Website" value={website} width="100%" onChange={setWebsite} />
          </div>

          <div className="k-set-brand">
            <div className="k-modal-label">Primary brand color</div>
            <div className="k-brand-row">
              {SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setBrand(hex)}
                  className={`k-brand-sw${brand.toLowerCase() === hex.toLowerCase() ? ' is-on' : ''}`}
                  style={{ background: hex }}
                  title={hex}
                  aria-label={`Use ${hex}`}
                />
              ))}
              <label className="k-brand-custom" title="Pick any color">
                <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)} />
                <Icon d={I.edit} size={11} />
              </label>
              <span className="k-mono" style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>
                {brand.toUpperCase()}
              </span>
            </div>
            <div className="k-dirmodal-hint">
              Saving repaints Kevin in this color for you.
              {derived
                ? ` Buttons use ${accentFor(brand).toUpperCase()} — a darkened version, because white text on this one would be unreadable.`
                : ''}
            </div>
          </div>

          <div className="k-intake-letterhead" style={{ marginTop: 16 }}>
            {logo ? <img src={logo} alt="" /> : null}
            <div>
              {companyLines(preview).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="k-set-savebar">
            <button type="button" className="k-btn" onClick={save}>
              {saved ? 'Saved' : 'Save business details'}
            </button>
            <span className="k-dirmodal-hint" style={{ marginTop: 0 }}>
              Saved in this browser. Exports don’t carry it yet — the document generator is
              server-side and has nowhere to read it from.
            </span>
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Not built yet</div>
        <div className="k-set-card-body">
          <Soon
            label="Defaults for new claims"
            detail="Tax jurisdiction, policy form and depreciation method, prefilled on every claim."
          />
          <Soon
            label="Branding on exports"
            detail="Your logo and details on the inventory PDF and share links."
          />
          <Soon label="Team" detail="Invite colleagues and share one company header." />
        </div>
      </section>
    </SettingsShell>
  )
}
