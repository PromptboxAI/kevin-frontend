import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import IntakeField from '../components/IntakeField'
import IntakeSelect from '../components/IntakeSelect'
import PhotoUpload from '../components/PhotoUpload'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { isValidClaimId, parseMoney, slugify, toIsoDate } from '../lib/claim-id'
import {
  COVERAGE_LABELS,
  TAX_BY_ZIP,
  US_STATES,
  taxOptionsFor,
  type Jurisdiction,
} from '../lib/us-states'
import type { ClaimSummary } from '../lib/types'

const EYEBROW: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--k-fg-4)',
  fontFamily: 'var(--k-font-mono)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontWeight: 600,
}
const H1: React.CSSProperties = {
  fontFamily: 'var(--k-font-display)',
  fontWeight: 400,
  fontSize: 38,
  letterSpacing: '-0.025em',
  margin: '6px 0 4px',
  lineHeight: 1.1,
}
const LEDE: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--k-fg-3)',
  margin: 0,
  maxWidth: 580,
  lineHeight: 1.5,
}

/**
 * Start a new claim — the intake metadata screen, then photos.
 *
 * This is the ONLY place the claim's identity is captured. Claims that
 * auto-materialise from an upload carry no metadata at all, which is why every
 * such claim's header reads "DOL —". A field left blank here prints blank on
 * the carrier-facing export.
 */
export default function IntakePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [dateOfLoss, setDateOfLoss] = useState('')
  const [lossType, setLossType] = useState('')
  const [carrier, setCarrier] = useState('')
  /**
   * Captured as two fields because that is how an adjuster reads a declarations
   * page, but the API stores ONE `insured_name`, so they are joined before
   * sending and never sent as a pair.
   */
  const [insuredFirst, setInsuredFirst] = useState('')
  const [insuredLast, setInsuredLast] = useState('')
  /**
   * The address is SPLIT, not one string: the ZIP is what resolves the tax
   * jurisdiction, so it has to be a field the app can read on its own. The API
   * still stores one `loss_address`, so the parts are joined on send.
   */
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('NY')
  const [zip, setZip] = useState('')
  const [policyForm, setPolicyForm] = useState('')
  const [coverageLabel, setCoverageLabel] = useState(COVERAGE_LABELS[0])
  const [ppLimit, setPpLimit] = useState('')
  const [alreadyClaimed, setAlreadyClaimed] = useState('')

  /** Jurisdictions the adjuster added for a ZIP with no lookup. */
  const [added, setAdded] = useState<{ zip: string; label: string; rate: number }[]>([])
  const [jurOpen, setJurOpen] = useState(false)
  const [jurName, setJurName] = useState('')
  const [jurRate, setJurRate] = useState('')
  const [taxChoice, setTaxChoice] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const zipTax: Jurisdiction | null =
    added.find((j) => j.zip === zip) ?? TAX_BY_ZIP[zip] ?? null
  const taxOptions = useMemo(() => taxOptionsFor(zip, zipTax), [zip, zipTax])
  // The ZIP owns the rate, so a new ZIP resets the choice to that ZIP's first
  // option rather than carrying the previous jurisdiction across.
  const taxLabel =
    taxChoice && taxOptions.some((o) => o.label === taxChoice) ? taxChoice : taxOptions[0].label
  const taxRate = taxOptions.find((o) => o.label === taxLabel)?.rate ?? 0

  /**
   * The slug is internal identity, derived silently. It is never an editable
   * field: it is the claim's name in every URL and in every export already sent
   * to a carrier, so letting someone retype it would orphan them.
   */
  const claimId = slugify(name)
  const idValid = claimId === '' && name.trim() === '' ? true : isValidClaimId(claimId)

  const insuredName = [insuredFirst.trim(), insuredLast.trim()].filter(Boolean).join(' ')
  const lossAddress = [street.trim(), city.trim(), [state, zip].filter(Boolean).join(' ').trim()]
    .filter(Boolean)
    .join(', ')

  const ppLimitValue = useMemo(() => parseMoney(ppLimit), [ppLimit])
  const alreadyValue = useMemo(() => parseMoney(alreadyClaimed), [alreadyClaimed])
  const ppLimitInvalid = ppLimit.trim() !== '' && ppLimitValue === null
  const alreadyInvalid = alreadyClaimed.trim() !== '' && alreadyValue === null
  const dateInvalid = dateOfLoss.trim() !== '' && toIsoDate(dateOfLoss) === null

  const canSubmit =
    claimId !== '' && idValid && !dateInvalid && !ppLimitInvalid && !alreadyInvalid

  const create = useMutation({
    mutationFn: () =>
      api.post<ClaimSummary>('/v1/claims', {
        json: {
          claim_id: claimId,
          // Omit rather than send empty strings: the API treats an absent field
          // as "not provided", and a blank one would overwrite on a re-create.
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(insuredName ? { insured_name: insuredName } : {}),
          ...(carrier.trim() ? { carrier: carrier.trim() } : {}),
          ...(policyNumber.trim() ? { policy_number: policyNumber.trim() } : {}),
          ...(claimNumber.trim() ? { claim_number: claimNumber.trim() } : {}),
          ...(lossType.trim() ? { loss_type: lossType.trim() } : {}),
          ...(toIsoDate(dateOfLoss) ? { date_of_loss: toIsoDate(dateOfLoss) } : {}),
          ...(lossAddress ? { loss_address: lossAddress } : {}),
          // The select carries a percentage; the API stores a fraction.
          ...(zipTax ? { tax_rate: Math.round((taxRate / 100) * 1e6) / 1e6 } : {}),
          ...(policyForm.trim() ? { policy_form: policyForm.trim() } : {}),
          // The coverage LABEL has no field on the API yet (ClaimMetadata is a
          // strict model, so sending one 422s the whole create). The select
          // stays because rule 14 is explicit that the label travels with the
          // claim -- filed as backend ask 17; until it lands the label is
          // captured but not persisted.
          ...(ppLimitValue !== null ? { personal_property_limit: ppLimitValue } : {}),
          ...(alreadyValue !== null ? { amount_already_claimed: alreadyValue } : {}),
        },
      }),
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      // Stay on the page: step 2 needs the claim to exist before photos can be
      // staged against it. Continue is one action, not two.
      setCreated(claim.claim_id)
      document.getElementById('k-photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    onError: (err) =>
      setError(
        err instanceof ApiError
          ? `Could not create the claim — HTTP ${err.status}: ${err.message422}`
          : 'Could not create the claim.',
      ),
  })

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={EYEBROW}>Claim details, then photos</div>
            <h1 style={H1}>Start a new claim</h1>
            <p style={LEDE}>
              Enter the claim metadata, drop your photos, and Kevin starts working immediately.
              You’ll land in the review worksheet as soon as the first batch finishes processing.
            </p>
          </div>

          {/* Creating the claim and moving to photos is ONE action -- a separate
              "Create claim" button is not the flow. */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/claims" className="k-btn k-btn--ghost">
              Cancel
            </Link>
            <button
              type="button"
              className="k-btn"
              disabled={!canSubmit || create.isPending}
              title={created ? 'Drop the photos below' : 'Creates the claim, then opens upload'}
              onClick={() => {
                if (created) {
                  document
                    .getElementById('k-photos')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  return
                }
                setError(null)
                create.mutate()
              }}
            >
              {create.isPending ? 'Creating…' : 'Continue → Stage photos'}
            </button>
          </div>
        </div>

        <section className="k-intake-section">
          <div className="k-intake-section-hd">
            <span className="k-step-num">01</span>
            <div>
              <div className="k-intake-section-t">Claim details</div>
              <div className="k-intake-section-s">
                These appear on the export and govern sales tax calculation.
              </div>
            </div>
          </div>

          <div className="k-intake-form">
            {/* 1 — who */}
            <IntakeField
              label="Insured — first name"
              value={insuredFirst}
              width={200}
              placeholder="Kevin"
              onChange={setInsuredFirst}
            />
            <IntakeField
              label="Insured — last name"
              value={insuredLast}
              width={200}
              placeholder="Godfrey"
              onChange={setInsuredLast}
              hint={insuredName ? `Stored as “${insuredName}”` : undefined}
            />

            {/* 2 — where. The ZIP drives the tax lookup. */}
            <IntakeField
              label="Loss address"
              value={street}
              width={260}
              placeholder="123 Main St."
              onChange={setStreet}
            />
            <IntakeField
              label="City"
              value={city}
              width={160}
              placeholder="Smithtown"
              onChange={setCity}
            />
            <IntakeSelect
              label="State"
              value={state}
              options={US_STATES}
              width={92}
              onChange={setState}
            />
            <IntakeField
              label="Loss ZIP"
              value={zip}
              mono
              width={120}
              placeholder="11787"
              onChange={(v) => setZip(v.replace(/[^0-9]/g, '').slice(0, 5))}
              hint={
                zipTax
                  ? `${zipTax.county ?? zipTax.label} · ${zipTax.rate}%`
                  : zip
                    ? 'Not recognised — add the jurisdiction'
                    : 'Sets the sales tax rate'
              }
            />

            {/* 3 — the claim */}
            <IntakeField
              label="Claim number"
              value={claimNumber}
              mono
              width={220}
              placeholder="CLM-2026-04412"
              onChange={setClaimNumber}
            />
            <IntakeField
              label="Policy number"
              value={policyNumber}
              mono
              width={200}
              placeholder="942178036"
              onChange={setPolicyNumber}
            />
            <IntakeField
              label="Date of loss"
              value={dateOfLoss}
              mono
              width={170}
              type="date"
              invalid={dateInvalid}
              onChange={setDateOfLoss}
            />
            <IntakeField
              label="Cause of loss"
              value={lossType}
              width={200}
              placeholder="Kitchen fire"
              onChange={setLossType}
            />

            {/* 4 — money. The rate is RESOLVED, never free-typed. */}
            <IntakeSelect
              label="Local tax rate"
              value={taxLabel}
              options={taxOptions.map((o) => o.label)}
              addLabel="+ Add tax jurisdiction…"
              onAdd={() => setJurOpen(true)}
              width={230}
              onChange={setTaxChoice}
              hint={zipTax ? 'Resolved from the loss ZIP' : 'No lookup for this ZIP — add it'}
            />
            <IntakeSelect
              label="Contents coverage label"
              value={coverageLabel}
              options={COVERAGE_LABELS}
              width={280}
              onChange={setCoverageLabel}
              hint="Policies name this differently — matches the insured's declarations page"
            />
            <IntakeField
              label="Personal property limit"
              value={ppLimit}
              mono
              width={180}
              placeholder="$175,000"
              invalid={ppLimitInvalid}
              onChange={setPpLimit}
              hint={ppLimitInvalid ? 'Enter an amount, e.g. 175000' : 'Warns when the inventory nears it'}
            />
            <IntakeField
              label="Amount already claimed"
              value={alreadyClaimed}
              mono
              width={180}
              placeholder="$0"
              invalid={alreadyInvalid}
              onChange={setAlreadyClaimed}
              hint="Prior contents payments on this loss"
            />

            {/* 5 — the policy */}
            <IntakeField
              label="Policy form"
              value={policyForm}
              width={200}
              placeholder="HO-3 · Open perils"
              onChange={setPolicyForm}
            />
            <IntakeField
              label="Carrier / agency"
              value={carrier}
              width={240}
              placeholder="Allstate"
              onChange={setCarrier}
            />
            <IntakeField
              label="Claim name"
              value={name}
              width={300}
              placeholder="Godfrey — Kitchen fire"
              invalid={!idValid}
              onChange={setName}
              hint={
                idValid
                  ? 'Shown on the dashboard and the worksheet header'
                  : 'Needs at least one letter or number'
              }
            />
          </div>

          {error ? <p className="k-error">{error}</p> : null}
        </section>

        <section className="k-intake-section" id="k-photos">
          <div className="k-intake-section-hd">
            <span className="k-step-num">02</span>
            <div>
              <div className="k-intake-section-t">Add photos</div>
              <div className="k-intake-section-s">
                Select the whole pack-out folder and click once. Photos are chunked and sent against
                one session, so a dropped connection never loses the batch — re-selecting is safe.
              </div>
            </div>
          </div>

          {/* The drop zone always renders; before the claim exists it is inert
              with the reason as an overlay, not replaced by a line of text. */}
          <PhotoUpload
            claimId={created}
            lockedReason="Create the claim first — photos are staged against it"
            onStaged={() => navigate(`/claims/${created}/staging`)}
          />
        </section>
      </div>

      {jurOpen ? (
        <div
          className="k-export-stage"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'grid',
            placeItems: 'center',
            background: 'oklch(0.2 0.02 250 / 0.42)',
          }}
          onClick={() => setJurOpen(false)}
        >
          <div className="k-notemodal" onClick={(e) => e.stopPropagation()}>
            <div className="k-notemodal-hd">
              <div>
                <div className="k-notemodal-t">Add tax jurisdiction</div>
                <div className="k-notemodal-s">ZIP {zip || '—'}</div>
              </div>
              <button
                type="button"
                className="k-icon-btn"
                aria-label="Close"
                onClick={() => setJurOpen(false)}
              >
                <Icon d={I.close} size={15} />
              </button>
            </div>
            <div className="k-notemodal-body">
              <p className="k-notemodal-lede">
                Kevin has no rate on file for this ZIP. Add it once and it resolves for every claim
                at this address.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <IntakeField
                  label="Jurisdiction name"
                  value={jurName}
                  width={220}
                  placeholder="Scranton, PA"
                  onChange={setJurName}
                />
                <IntakeField
                  label="Rate"
                  value={jurRate}
                  mono
                  suffix="%"
                  width={110}
                  placeholder="6.0"
                  onChange={(v) => setJurRate(v.replace(/[^0-9.]/g, ''))}
                />
              </div>
            </div>
            <div className="k-notemodal-ft" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
              <button type="button" className="k-btn k-btn--ghost" onClick={() => setJurOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="k-btn"
                disabled={!jurName.trim() || !jurRate.trim() || !zip}
                onClick={() => {
                  const rate = parseFloat(jurRate) || 0
                  setAdded((a) => [...a, { zip, label: jurName.trim(), rate }])
                  setTaxChoice(`${jurName.trim()} (${zip}) · ${rate}%`)
                  setJurName('')
                  setJurRate('')
                  setJurOpen(false)
                }}
              >
                Add jurisdiction
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
