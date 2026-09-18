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
import { COVERAGE_LABELS, US_STATES } from '../lib/us-states'
import { useTaxRate } from '../lib/tax-rate'
import { taxPlanFor } from '../lib/tax-rate-rules'
import {
  RECENT_BUSINESS,
  RECENT_ESTIMATOR,
  browserStore,
  recentValues,
  rememberValue,
} from '../lib/recent-values'
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

/** The project name's slug already names one of this account's claims. */
class ProjectNameTaken extends Error {
  existing: string
  constructor(existing: string) {
    super(`Project name taken: ${existing}`)
    this.existing = existing
  }
}

/**
 * Start a new claim — the intake metadata screen, then photos.
 *
 * This is the ONLY place the claim's identity is captured. Claims that
 * auto-materialise from an upload carry no metadata at all, which is why every
 * such claim's header reads "DOL —". A field left blank here prints blank on
 * the carrier-facing export.
 */
/**
 * Common policy forms, offered as a list on a free-text field -- the design's
 * control is a text input, and a carrier's own form name must still fit.
 */
const POLICY_FORMS = [
  'HO-2 · Broad form',
  'HO-3 · Special form',
  'HO-4 · Renters',
  'HO-5 · Comprehensive',
  'HO-6 · Condo',
  'HO-8 · Modified coverage',
  'DP-1 · Basic dwelling',
  'DP-2 · Broad dwelling',
  'DP-3 · Special dwelling',
]

export default function IntakePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [policyForm, setPolicyForm] = useState('')
  /**
   * Preparer identity, stored ON THE CLAIM by decision, mirroring Xactimate.
   * An estimate is a point-in-time document: if the adjuster who prepared this
   * inventory later leaves the firm, the claim must still name them. A profile
   * table that all claims pointed at would rewrite history retroactively.
   *
   * The retyping that implies is solved client-side -- previous values are
   * offered back from this browser, and are only ever a shortcut.
   */
  const [estimatorName, setEstimatorName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const store = browserStore()
  const [recentEstimator, setRecentEstimator] = useState(() =>
    recentValues(store, RECENT_ESTIMATOR),
  )
  const [recentBusiness, setRecentBusiness] = useState(() => recentValues(store, RECENT_BUSINESS))
  const [coverageLabel, setCoverageLabel] = useState(COVERAGE_LABELS[0])
  const [ppLimit, setPpLimit] = useState('')
  const [alreadyClaimed, setAlreadyClaimed] = useState('')

  /** Jurisdictions the adjuster added for a ZIP with no lookup. */
  const [added, setAdded] = useState<{ zip: string; label: string; rate: number }[]>([])
  const [jurOpen, setJurOpen] = useState(false)
  const [jurName, setJurName] = useState('')
  const [jurRate, setJurRate] = useState('')
  const [taxChoice, setTaxChoice] = useState<string | null>(null)

  /**
   * The claim NAME is the PROJECT name, and the adjuster types it first.
   *
   * It used to be derived -- insured surname + cause of loss, the way the
   * canonical claim reads ("Godfrey — Kitchen fire") -- with no field at all.
   * Adjusters coming from Xactimate expect the opposite: its first step on a
   * new project is naming the saved file (GRECO-TREE_DAMAGE, 31HALLOCK-REBUILD),
   * and that name is how they find the job again in their project list. My
   * claims now leads with it under the same heading, so it has to be theirs,
   * not a string Kevin assembled from two other fields.
   *
   * Required: without it there is no slug, and no claim.
   */
  const [projectName, setProjectName] = useState('')
  const name = projectName.trim()

  /**
   * The slug is internal identity, derived silently from that name. It is never
   * an editable field: it names the claim in every URL and in every export
   * already sent to a carrier, so letting someone retype it would orphan them.
   */
  const claimId = slugify(name)
  const idValid = claimId === '' ? true : isValidClaimId(claimId)

  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  /**
   * The rate comes from the live table (GET /v1/tax-rate) -- every US ZIP,
   * not the five the prototype carried. It is a SUGGESTION the adjuster
   * confirms by picking it (tax-rate-rules.ts), never prefilled.
   */
  const taxLookup = useTaxRate(zip)
  const taxAnswer = taxLookup.data ?? null
  const manualTax = added.find((j) => j.zip === zip) ?? null
  const taxPlan = taxPlanFor(zip, taxAnswer, manualTax, taxLookup.isFetching)
  const taxOptions = taxPlan.options
  // The ZIP owns the rate, so a new ZIP resets the choice to that ZIP's first
  // option rather than carrying the previous jurisdiction across.
  const taxLabel =
    taxChoice && taxOptions.some((o) => o.label === taxChoice) ? taxChoice : taxOptions[0].label
  /** Percent, or null when nothing is chosen -- then no tax_rate is sent. */
  const taxRate = taxOptions.find((o) => o.label === taxLabel)?.rate ?? null
  const taxUnconfirmed = taxPlan.needsChoice && taxRate === null

  /** Blank until chosen, then the ZIP's own state fills it -- real data. */
  const stateShown = state || (taxAnswer?.zip === zip ? (taxAnswer?.state ?? '') : '')


  const insuredName = [insuredFirst.trim(), insuredLast.trim()].filter(Boolean).join(' ')
  const lossAddress = [street.trim(), city.trim(), [stateShown, zip].filter(Boolean).join(' ').trim()]
    .filter(Boolean)
    .join(', ')

  const ppLimitValue = useMemo(() => parseMoney(ppLimit), [ppLimit])
  const alreadyValue = useMemo(() => parseMoney(alreadyClaimed), [alreadyClaimed])
  const ppLimitInvalid = ppLimit.trim() !== '' && ppLimitValue === null
  const alreadyInvalid = alreadyClaimed.trim() !== '' && alreadyValue === null
  const dateInvalid = dateOfLoss.trim() !== '' && toIsoDate(dateOfLoss) === null

  const canSubmit =
    claimId !== '' &&
    idValid &&
    !dateInvalid &&
    !ppLimitInvalid &&
    !alreadyInvalid &&
    !taxUnconfirmed

  const create = useMutation({
    mutationFn: async () => {
      /**
       * Refuse a project name that is already taken, BEFORE posting.
       *
       * `POST /v1/claims` is idempotent on the slug: a claim_id that already
       * exists comes back UNCHANGED with a 200, not a 409 (FRONTEND.md). With
       * a derived name that was rare; with a typed one it is ordinary -- two
       * jobs for the same insured, "GODFREY-KITCHEN" and "Godfrey Kitchen"
       * -- and the page would carry on and stage the new photos into the old
       * claim. Nothing on screen would say so.
       */
      const existing = await api
        .get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`)
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.isMissing) return null
          throw err
        })
      if (existing) throw new ProjectNameTaken(existing.name || existing.claim_id)
      return api.post<ClaimSummary>('/v1/claims', {
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
          ...(taxRate !== null ? { tax_rate: Math.round((taxRate / 100) * 1e6) / 1e6 } : {}),
          ...(policyForm.trim() ? { policy_form: policyForm.trim() } : {}),
          ...(estimatorName.trim() ? { estimator_name: estimatorName.trim() } : {}),
          ...(businessName.trim() ? { business_name: businessName.trim() } : {}),
          // Rule 14: the claim carries BOTH the limit and the LABEL, because
          // policies name contents coverage differently and printing a coverage
          // letter as though it were universal misrepresents the policy.
          ...(coverageLabel ? { personal_property_limit_label: coverageLabel } : {}),
          ...(ppLimitValue !== null ? { personal_property_limit: ppLimitValue } : {}),
          ...(alreadyValue !== null ? { amount_already_claimed: alreadyValue } : {}),
        },
      })
    },
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      // Only after it lands on a real claim: a value that never got submitted
      // is not one worth offering back.
      if (estimatorName.trim())
        setRecentEstimator(rememberValue(store, RECENT_ESTIMATOR, estimatorName))
      if (businessName.trim())
        setRecentBusiness(rememberValue(store, RECENT_BUSINESS, businessName))
      // Stay on the page: step 2 needs the claim to exist before photos can be
      // staged against it. Continue is one action, not two.
      setCreated(claim.claim_id)
      document.getElementById('k-photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    onError: (err) =>
      setError(
        err instanceof ProjectNameTaken
          ? `You already have a project named “${err.existing}”. Give this one a different project name.`
          : err instanceof ApiError
            ? `Could not create the claim — HTTP ${err.status}: ${err.message422}`
            : 'Could not create the claim.',
      ),
  })

  /** The Upload button's way in when the claim does not exist yet. */
  const ensureClaim = async (): Promise<string> => {
    if (created) return created
    if (claimId === '') {
      // The project name is the form's first input.
      document.querySelector<HTMLInputElement>('.k-intake-form input')?.focus()
      throw new Error('Add a project name under Claim details first — it’s how you’ll find this claim in My claims.')
    }
    if (taxUnconfirmed) {
      throw new Error('Confirm the local tax rate under Claim details, then upload again.')
    }
    if (!canSubmit) {
      throw new Error('Fix the highlighted fields under Claim details, then upload again.')
    }
    setError(null)
    try {
      return (await create.mutateAsync()).claim_id
    } catch {
      // onError has written the reason next to the form; repeat it here, where
      // the adjuster is looking.
      throw new Error('Could not create the claim — see Claim details above.')
    }
  }

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
            {/* 0 — the saved name, before anything else, as in Xactimate. */}
            <IntakeField
              label="Project name"
              value={projectName}
              width={320}
              onChange={setProjectName}
              invalid={name !== '' && (claimId === '' || !idValid)}
              hint={
                name === ''
                  ? 'Required · how you’ll find this claim in My claims'
                  : claimId === ''
                    ? 'Use at least one letter or number'
                    : 'How you’ll find this claim in My claims'
              }
            />

            {/* 1 — who */}
            <IntakeField
              label="Insured — first name"
              value={insuredFirst}
              width={200}
              onChange={setInsuredFirst}
            />
            <IntakeField
              label="Insured — last name"
              value={insuredLast}
              width={200}
              onChange={setInsuredLast}
              hint={insuredName ? `Stored as “${insuredName}”` : undefined}
            />

            {/* 2 — where. The ZIP drives the tax lookup. */}
            <IntakeField
              label="Loss address"
              value={street}
              width={260}
              onChange={setStreet}
            />
            <IntakeField
              label="City"
              value={city}
              width={160}
              onChange={setCity}
            />
            <IntakeSelect
              label="State"
              value={stateShown}
              options={US_STATES}
              width={92}
              onChange={setState}
            >
              {/* Blank until chosen: a preset state is sample data that
                  quietly lands on the export if nobody changes it. */}
              <option value="">—</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </IntakeSelect>
            <IntakeField
              label="Loss ZIP"
              value={zip}
              mono
              width={120}
              onChange={(v) => setZip(v.replace(/[^0-9]/g, '').slice(0, 5))}
              hint={
                'Sets the sales tax rate'
              }
            />

            {/* 3 — the claim */}
            <IntakeField
              label="Claim number"
              value={claimNumber}
              mono
              width={220}
              onChange={setClaimNumber}
            />
            <IntakeField
              label="Policy number"
              value={policyNumber}
              mono
              width={200}
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
              onChange={setLossType}
            />

            {/* 4 — money. The rate is RESOLVED, never free-typed. */}
            <IntakeSelect
              label="Local tax rate"
              value={taxLabel}
              options={taxOptions.map((o) => o.label)}
              addLabel="+ Add tax jurisdiction…"
              onAdd={() => setJurOpen(true)}
              width={300}
              onChange={setTaxChoice}
              // Only an ambiguous ZIP has something to say here: which side
              // of the line. A resolved rate is what it is (owner, 2026-09-18).
              hint={taxUnconfirmed ? taxPlan.hint : undefined}
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
              placeholder="$0"
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
              suggestions={POLICY_FORMS}
              onChange={setPolicyForm}
              hint="Pick a common form or type your own"
            />
            {/* 5 — who prepared it. Last because it is the one block that
                repeats across a book of claims, and the suggestions make it
                two clicks rather than two fields. */}
            <IntakeField
              label="Prepared by"
              value={estimatorName}
              width={220}
              suggestions={recentEstimator}
              onChange={setEstimatorName}
              hint={
                recentEstimator.length
                  ? 'Pick a previous name or type a new one'
                  : 'Prints on the export as the preparer'
              }
            />
            <IntakeField
              label="Firm / business"
              value={businessName}
              width={240}
              suggestions={recentBusiness}
              onChange={setBusinessName}
              hint={
                recentBusiness.length
                  ? 'Pick a previous firm or type a new one'
                  : 'Stays on this claim even if you move firms'
              }
            />
            <IntakeField
              label="Carrier / agency"
              value={carrier}
              width={240}
              onChange={setCarrier}
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
          {/* Live from the start. Photos stage against a claim, so the first
              Upload creates it from the details above -- the adjuster started
              the claim by clicking New claim and never has a separate step. */}
          <PhotoUpload
            claimId={created}
            ensureClaim={ensureClaim}
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
