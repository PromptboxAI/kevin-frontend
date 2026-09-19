import { useRef, useState } from 'react'
import IntakeField from './IntakeField'
import { I, Icon } from './Icon'
import type { Company, Person } from '../lib/directory-rules'
import { LOGO_ERROR, logoProblem, newId } from '../lib/directory-rules'

/**
 * Adding a person or a company to the account's directory — Xactimate's "Add
 * Estimator" and "Company Header" dialogs, minus the fields nobody fills in
 * (latitude, XactNet address, quick code, position, notes).
 *
 * A person is an individual; a company is the letterhead, and only a company
 * carries a logo. Keeping them apart is why Xactimate has two lists, and it is
 * the right split: three adjusters at one firm share one header.
 */
function Shell({
  title,
  sub,
  onClose,
  onSave,
  saveLabel,
  canSave,
  children,
}: {
  title: string
  sub?: string
  onClose: () => void
  onSave: () => void
  saveLabel: string
  canSave: boolean
  children: React.ReactNode
}) {
  return (
    <div className="k-export-stage k-modal-stage">
      <div className="k-export-scrim" onClick={onClose} />
      <div className="k-export-modal k-dirmodal" role="dialog" aria-modal="true">
        <div className="k-notemodal-hd">
          <div>
            <div className="k-notemodal-t">{title}</div>
            {sub ? <div className="k-dirmodal-s">{sub}</div> : null}
          </div>
          <button type="button" className="k-icon-btn" aria-label="Close" onClick={onClose}>
            <Icon d={I.close} size={15} />
          </button>
        </div>
        <div className="k-dirmodal-body">{children}</div>
        <div className="k-dirmodal-ft">
          <button type="button" className="k-btn k-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="k-btn" disabled={!canSave} onClick={onSave}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PersonModal({
  person,
  onClose,
  onSave,
}: {
  /** An existing entry to edit, or undefined to add one. */
  person?: Person
  onClose: () => void
  onSave: (person: Person) => void
}) {
  const [name, setName] = useState(person?.name ?? '')
  const [company, setCompany] = useState(person?.company ?? '')
  const [license, setLicense] = useState(person?.license ?? '')
  const [phone, setPhone] = useState(person?.phone ?? '')
  const [email, setEmail] = useState(person?.email ?? '')

  return (
    <Shell
      title={person ? 'Edit person' : 'Add a person'}
      sub="Saved for every claim after this one"
      onClose={onClose}
      canSave={name.trim().length > 0}
      saveLabel={person ? 'Save' : 'Add person'}
      onSave={() =>
        onSave({
          id: person?.id ?? newId(),
          name: name.trim(),
          company: company.trim() || undefined,
          license: license.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        })
      }
    >
      <IntakeField label="Name" value={name} width="100%" onChange={setName} />
      <IntakeField label="Firm" value={company} width="100%" onChange={setCompany} />
      <IntakeField label="License #" value={license} width="100%" onChange={setLicense} />
      <IntakeField label="Phone" value={phone} width="100%" onChange={setPhone} />
      <IntakeField label="Email" value={email} width="100%" onChange={setEmail} />
    </Shell>
  )
}

export function CompanyModal({
  company,
  onClose,
  onSave,
}: {
  company?: Company
  onClose: () => void
  onSave: (company: Company) => void
}) {
  const [name, setName] = useState(company?.name ?? '')
  const [address, setAddress] = useState(company?.address ?? '')
  const [phone, setPhone] = useState(company?.phone ?? '')
  const [email, setEmail] = useState(company?.email ?? '')
  const [website, setWebsite] = useState(company?.website ?? '')
  const [license, setLicense] = useState(company?.license ?? '')
  const [logo, setLogo] = useState(company?.logo ?? '')
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  return (
    <Shell
      title={company ? 'Edit company' : 'Add a company'}
      sub="The letterhead on your exports"
      onClose={onClose}
      canSave={name.trim().length > 0}
      saveLabel={company ? 'Save' : 'Add company'}
      onSave={() =>
        onSave({
          id: company?.id ?? newId(),
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
          license: license.trim() || undefined,
          logo: logo || undefined,
        })
      }
    >
      <div className="k-dirmodal-logo">
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
          <button type="button" className="k-btn k-btn--ghost k-btn--sm" onClick={() => fileRef.current?.click()}>
            {logo ? 'Replace logo' : 'Upload logo'}
          </button>
          {logo ? (
            <button type="button" className="k-link" style={{ marginLeft: 10 }} onClick={() => setLogo('')}>
              Remove
            </button>
          ) : null}
          <div className="k-dirmodal-hint">
            {logoError ?? 'PNG, JPG, SVG or WebP. It prints on the export header.'}
          </div>
        </div>
      </div>

      <IntakeField label="Company name" value={name} width="100%" onChange={setName} />
      <IntakeField label="Address" value={address} width="100%" onChange={setAddress} />
      <IntakeField label="License #" value={license} width="100%" onChange={setLicense} />
      <IntakeField label="Phone" value={phone} width="100%" onChange={setPhone} />
      <IntakeField label="Email" value={email} width="100%" onChange={setEmail} />
      <IntakeField label="Website" value={website} width="100%" onChange={setWebsite} />
    </Shell>
  )
}
