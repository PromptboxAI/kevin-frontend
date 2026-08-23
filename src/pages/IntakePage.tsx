import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import IntakeField from '../components/IntakeField'
import PhotoUpload from '../components/PhotoUpload'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { isValidClaimId, parseMoney, percentToFraction, slugify, toIsoDate } from '../lib/claim-id'
import type { ClaimSummary } from '../lib/types'

/**
 * New claim — the intake metadata screen.
 *
 * This is the ONLY place the claim's identity is captured. Claims that
 * auto-materialise from an upload carry no metadata at all, which is why every
 * existing claim's header reads "DOL —". Everything here is optional to the API
 * except claim_id, but the fields left blank are the ones that print blank on
 * the carrier-facing export.
 */
export default function IntakePage() {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  /** Derived from the name until the adjuster edits it, then left alone. */
  const [claimId, setClaimId] = useState('')
  const [claimIdTouched, setClaimIdTouched] = useState(false)
  const [claimNumber, setClaimNumber] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [dateOfLoss, setDateOfLoss] = useState('')
  const [lossType, setLossType] = useState('')
  const [carrier, setCarrier] = useState('')
  /**
   * Captured as two fields because that is how an adjuster reads a
   * declarations page, but the API stores ONE `insured_name` -- so they are
   * joined before sending, never sent as a pair.
   */
  const [insuredFirst, setInsuredFirst] = useState('')
  const [insuredLast, setInsuredLast] = useState('')
  const [lossAddress, setLossAddress] = useState('')
  const [taxRate, setTaxRate] = useState('')
  const [policyForm, setPolicyForm] = useState('')
  const [ppLimit, setPpLimit] = useState('')
  const [alreadyClaimed, setAlreadyClaimed] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const id = claimIdTouched ? claimId : slugify(name)
  const idValid = id === '' || isValidClaimId(id)
  const taxFraction = useMemo(() => percentToFraction(taxRate), [taxRate])
  const taxInvalid = taxRate.trim() !== '' && taxFraction === null
  const dateInvalid = dateOfLoss.trim() !== '' && toIsoDate(dateOfLoss) === null

  const insuredName = [insuredFirst.trim(), insuredLast.trim()].filter(Boolean).join(' ')
  const ppLimitValue = useMemo(() => parseMoney(ppLimit), [ppLimit])
  const alreadyValue = useMemo(() => parseMoney(alreadyClaimed), [alreadyClaimed])
  const ppLimitInvalid = ppLimit.trim() !== '' && ppLimitValue === null
  const alreadyInvalid = alreadyClaimed.trim() !== '' && alreadyValue === null

  const canSubmit =
    id !== '' && idValid && !taxInvalid && !dateInvalid && !ppLimitInvalid && !alreadyInvalid

  const create = useMutation({
    mutationFn: () =>
      api.post<ClaimSummary>('/v1/claims', {
        json: {
          claim_id: id,
          // Omit rather than send empty strings: the API treats an absent field
          // as "not provided", and a blank one would overwrite on a re-create.
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(insuredName ? { insured_name: insuredName } : {}),
          ...(carrier.trim() ? { carrier: carrier.trim() } : {}),
          ...(policyNumber.trim() ? { policy_number: policyNumber.trim() } : {}),
          ...(claimNumber.trim() ? { claim_number: claimNumber.trim() } : {}),
          ...(lossType.trim() ? { loss_type: lossType.trim() } : {}),
          ...(toIsoDate(dateOfLoss) ? { date_of_loss: toIsoDate(dateOfLoss) } : {}),
          ...(lossAddress.trim() ? { loss_address: lossAddress.trim() } : {}),
          ...(taxFraction !== null ? { tax_rate: taxFraction } : {}),
          ...(policyForm.trim() ? { policy_form: policyForm.trim() } : {}),
          ...(ppLimitValue !== null ? { personal_property_limit: ppLimitValue } : {}),
          ...(alreadyValue !== null ? { amount_already_claimed: alreadyValue } : {}),
        },
      }),
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      // Stay on the page: step 2 needs the claim to exist before photos can be
      // staged against it.
      setCreated(claim.claim_id)
    },
    onError: (err) =>
      setError(
        err instanceof ApiError
          ? `Could not create the claim — HTTP ${err.status}: ${String(err.detail)}`
          : 'Could not create the claim.',
      ),
  })

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-claims-body">
        <div>
          <Link to="/claims" className="k-crumb">
            <Icon d={I.chevleft} size={12} /> My claims
          </Link>
          <h1 className="k-claims-h1">New claim</h1>
          <p className="k-claims-sub">
            Capture the claim once — it prints on the worksheet header and the carrier-facing
            export.
          </p>
        </div>

        <section className="k-intake-section">
          <div className="k-intake-section-hd">
            <div className="k-step-num">1</div>
            <div>
              <div className="k-intake-section-t">Claim details</div>
              <div className="k-intake-section-s">
                Everything except the claim ID is optional — but a field left blank here prints
                blank on the export.
              </div>
            </div>
          </div>

          <div className="k-intake-grid">
            <IntakeField
              label="Claim name"
              value={name}
              width={300}
              placeholder="Godfrey — Kitchen fire"
              onChange={(v) => setName(v)}
              hint="Shown on the dashboard and the worksheet header"
            />
            <IntakeField
              label="Claim ID"
              value={id}
              mono
              width={240}
              invalid={!idValid}
              placeholder="godfrey-kitchen-fire"
              onChange={(v) => {
                setClaimIdTouched(true)
                setClaimId(v)
              }}
              hint={
                idValid
                  ? 'Its identity in every URL and export — set once, never changed'
                  : 'Letters, numbers, hyphen and underscore only (max 64)'
              }
            />
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
              width={180}
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
            <IntakeField
              label="Carrier / agency"
              value={carrier}
              width={240}
              placeholder="Allstate"
              onChange={setCarrier}
            />
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
            <IntakeField
              label="Loss address"
              value={lossAddress}
              width={380}
              placeholder="123 Main St., Smithtown, NY 11787"
              onChange={setLossAddress}
            />
            <IntakeField
              label="Policy form"
              value={policyForm}
              width={200}
              placeholder="HO-3 · Open perils"
              onChange={setPolicyForm}
            />
            <IntakeField
              label="Personal property limit"
              value={ppLimit}
              mono
              width={200}
              placeholder="$175,000"
              invalid={ppLimitInvalid}
              onChange={setPpLimit}
              hint={
                ppLimitInvalid
                  ? 'Enter an amount, e.g. 175000'
                  : 'Policies name this differently — check the declarations page'
              }
            />
            <IntakeField
              label="Amount already claimed"
              value={alreadyClaimed}
              mono
              width={200}
              placeholder="$0"
              invalid={alreadyInvalid}
              onChange={setAlreadyClaimed}
              hint="Prior contents payments on this loss"
            />
            <IntakeField
              label="Sales tax"
              value={taxRate}
              mono
              width={150}
              suffix="%"
              placeholder="8.625"
              invalid={taxInvalid}
              onChange={setTaxRate}
              hint={
                taxInvalid
                  ? 'Enter a percentage between 0 and 100'
                  : 'The loss ZIP sets this — address and tax must agree'
              }
            />
          </div>

          {error ? <p className="k-error">{error}</p> : null}

          <div className="k-intake-actions">
            <Link to="/claims" className="k-btn k-btn--ghost">
              Cancel
            </Link>
            <button
              type="button"
              className="k-btn"
              disabled={!canSubmit || create.isPending || created !== null}
              onClick={() => {
                setError(null)
                create.mutate()
              }}
            >
              {create.isPending ? 'Creating…' : created ? 'Claim created' : 'Create claim'}
            </button>
          </div>
        </section>

        <section className="k-intake-section">
          <div className="k-intake-section-hd">
            <div className="k-step-num">2</div>
            <div>
              <div className="k-intake-section-t">Add photos</div>
              <div className="k-intake-section-s">
                Select the whole pack-out folder and click once. Photos are chunked and sent
                against one session, so a dropped connection never loses the batch — re-selecting
                is safe.
              </div>
            </div>
          </div>

          {created ? (
            <PhotoUpload claimId={created} />
          ) : (
            <p className="k-ifield-hint" style={{ marginTop: 18 }}>
              Create the claim first — photos are staged against it.
            </p>
          )}
        </section>

        {created ? (
          <div className="k-intake-actions" style={{ border: 0, paddingTop: 0 }}>
            <Link to={`/claims/${created}`} className="k-btn">
              Open worksheet →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
