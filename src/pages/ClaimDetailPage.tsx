import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Alert from '../components/Alert'
import ClaimMissing from '../components/ClaimMissing'
import ClaimTabs from '../components/ClaimTabs'
import IntakeField from '../components/IntakeField'
import IntakeSelect from '../components/IntakeSelect'
import { CompanyModal, PersonModal } from '../components/DirectoryModals'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import { COVERAGE_LABELS, US_STATES } from '../lib/us-states'
import { useDirectory } from '../lib/directory'
import { companyLabel, personLabel } from '../lib/directory-rules'
import type { Company, Person } from '../lib/directory-rules'
import { useTaxRate } from '../lib/tax-rate'
import { taxPlanFor } from '../lib/tax-rate-rules'
import {
  EMPTY_FORM,
  claimPatch,
  formFromClaim,
  isDirty,
  joinAddress,
  joinInsured,
  splitAddress,
  splitInsured,
  validateClaimForm,
 zipOf} from '../lib/claim-detail-rules'
import type { ClaimDetailForm } from '../lib/claim-detail-rules'
import type { ClaimSummary } from '../lib/types'

/**
 * Claim detail — the first tab, and the same form as New claim.
 *
 * Everything typed at intake lived nowhere afterwards: the Overview printed it
 * as static text and `PATCH /v1/claims/{claim_id}` had never been called from
 * the frontend at all. So a claim was write-once — a name misspelled on site
 * stayed misspelled on the export, and a claim number issued a week later had
 * nowhere to go. Xactimate lets an adjuster change this for the life of the
 * file, and that is right: a claim is a document in progress.
 *
 * ▸ IT MIRRORS `IntakePage` DELIBERATELY (owner, 2026-10-07): the same two
 *   numbered sections, the same field order, the same controls and widths. An
 *   adjuster who has filled the form once should not have to learn a second one
 *   to correct it, and two layouts over one set of fields drift the moment
 *   either changes.
 *
 * Three things that are NOT the intake form, because editing is not creating:
 *
 *   1. It sends ONLY what changed. A PATCH of every field would stamp the audit
 *      trail for things nobody touched, and would let two people editing
 *      different fields overwrite each other.
 *   2. The insured and the address arrive JOINED — `"Robyn Beck"`, `"215 Rocky
 *      Point Landing Rd., Rocky Point, NY 11778"` — and must be split back into
 *      the boxes intake collected them in. That is lossy, so the splitters
 *      refuse to guess: anything not matching intake's own shape comes back
 *      whole in the first box rather than carved at invented boundaries.
 *   3. A name saved on the claim before it existed in the directory still has
 *      to appear in its select, or opening this page would silently clear it.
 */

export default function ClaimDetailPage() {
  const { claimId = '' } = useParams()
  const queryClient = useQueryClient()
  const { dir, savePerson, saveCompany } = useDirectory()

  const [form, setForm] = useState<ClaimDetailForm>(EMPTY_FORM)
  const [original, setOriginal] = useState<ClaimDetailForm>(EMPTY_FORM)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [personModal, setPersonModal] = useState<'new' | Person | null>(null)
  const [companyModal, setCompanyModal] = useState<'new' | Company | null>(null)

  /* The split halves are their own state, so typing in City does not re-parse
     a string this page assembled a keystroke ago. */
  const [insured, setInsured] = useState({ first: '', last: '' })
  const [addr, setAddr] = useState({ street: '', city: '', state: '', zip: '' })

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    retry: retryUnlessMissing,
  })

  const hydrate = (source: unknown) => {
    const next = formFromClaim(source as Record<string, unknown>)
    setForm(next)
    setOriginal(next)
    setInsured(splitInsured(next.insured_name))
    setAddr(splitAddress(next.loss_address))
  }

  /**
   * ⛔ SEED ONCE PER CLAIM, never on every `claim.data`.
   *
   * This used to re-seed whenever the query produced a new object, which
   * silently DISCARDED whatever was typed: TanStack refetches on window focus,
   * so switching to another window and back — or any other component
   * invalidating ['claim', id] — reset every field. The adjuster then pressed
   * Save on a form that had quietly reverted, `claimPatch` found nothing
   * changed, sent an empty PATCH, and the API answered 200. "Saved." was
   * true about the request and false about the intent.
   *
   * After a real save the response itself re-seeds the form, which is both
   * authoritative and the only moment overwriting the fields is correct.
   */
  const seededFor = useRef<string | null>(null)
  useEffect(() => {
    if (!claim.data || seededFor.current === claimId) return
    seededFor.current = claimId
    hydrate(claim.data)
    // hydrate is stable enough for this one-shot seed; re-running on its
    // identity would reintroduce exactly the clobber this guard prevents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.data, claimId])

  const set = (key: keyof ClaimDetailForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  /**
   * The two composed fields are DERIVED, not synced.
   *
   * Intake builds `first last` and `street, city, STATE ZIP` immediately before
   * POSTing; here the parts are the state and the joined value is computed from
   * them each render. Mirroring them into `form` through effects would work
   * until it did not: an effect runs after the render that caused it, so for
   * one frame `dirty`, the validation and a save fired in that window would all
   * read the PREVIOUS address.
   */
  const edited = useMemo(
    () => ({
      ...form,
      insured_name: joinInsured(insured),
      loss_address: joinAddress(addr),
    }),
    [form, insured, addr],
  )

  const errors = useMemo(() => validateClaimForm(edited), [edited])
  const errorFor = (k: keyof ClaimDetailForm) => errors.find((e) => e.field === k)?.message
  const dirty = isDirty(original, edited)

  /* The ZIP drives the rate, and it is the same select intake shows. */
  const taxLookup = useTaxRate(addr.zip)
  const taxPlan = taxPlanFor(addr.zip, taxLookup.data ?? null, null, taxLookup.isFetching)
  /* What the claim currently holds, which may be a rate no longer offered for
     this ZIP -- it has to stay selectable or saving would change it by accident. */
  const currentTaxLabel =
    taxPlan.options.find((o) => o.rate != null && String(o.rate) === edited.tax_rate)?.label ??
    (edited.tax_rate ? `${edited.tax_rate}% · on this claim` : '')

  /*
   * THE ZIP OWNS THE RATE, and this screen was the only one that did not act
   * on that.
   *
   * Intake defaults to the resolved option for the ZIP; here the lookup filled
   * the dropdown and left `tax_rate` exactly as it was, so typing a ZIP in
   * looked like it had worked and saved nothing. Every money column is
   * computed on read from the claim's `tax_rate` (FRONTEND.md: "all computed
   * on read"), so the consequence showed up a screen away -- the worksheet's
   * Tax column stayed blank on every line.
   *
   * Two ways in, and both are things the adjuster did: they changed the ZIP,
   * or the claim has NO rate at all and a ZIP now resolves one. The second
   * matters because the ZIP no longer persists in `loss_address` (a ZIP is not
   * an address), so "has it changed" alone would stop firing the moment the
   * page reloaded and leave the claim with no rate and a blank Tax column.
   *
   * What it will never do is overwrite a rate the claim already holds just
   * because a page loaded -- that claim may be in a carrier's hands, and
   * restamping its tax is a silent change to money nobody asked for.
   */
  const originalZip = zipOf(original.loss_address)
  const rateKey = taxPlan.options.map((o) => o.rate ?? '').join('|')
  useEffect(() => {
    if (!addr.zip || taxLookup.isFetching) return
    if (addr.zip === originalZip && form.tax_rate.trim() !== '') return
    const first = taxPlan.options[0]
    if (first?.rate == null) return
    // An ambiguous ZIP offers a choice and no default -- let them pick.
    if (taxPlan.needsChoice) return
    const already = taxPlan.options.some(
      (o) => o.rate != null && String(o.rate) === form.tax_rate,
    )
    if (already) return
    setForm((f) => ({ ...f, tax_rate: String(first.rate) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr.zip, originalZip, taxLookup.isFetching, rateKey, taxPlan.needsChoice, form.tax_rate])

  const estimator = dir.people.find((p) => personLabel(p) === form.estimator_name) ?? null
  const company = dir.companies.find((c) => companyLabel(c) === form.business_name) ?? null

  const save = useMutation({
    mutationFn: () =>
      api.patch<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`, {
        json: claimPatch(original, edited),
      }),
    onSuccess: async (updated) => {
      setError(null)
      setNotice('Saved.')
      /* Re-seed from the RESPONSE, which is what the claim now holds -- the
         one moment overwriting these fields is right. */
      hydrate(updated)
      /* Every money column is computed on read from the claim's tax_rate, so
         a saved rate only reaches the worksheet once its rows are refetched.
         Without this the claim header updated and the Tax column did not. */
      await queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
      void queryClient.invalidateQueries({ queryKey: ['claim-items-flat', claimId] })
    },
    onError: (e) => {
      setNotice(null)
      setError(
        e instanceof ApiError
          ? `Could not save (HTTP ${e.status}). Nothing was changed.`
          : 'Could not save. Nothing was changed.',
      )
    },
  })

  if (claim.error instanceof ApiError && claim.error.isMissing) {
    return <ClaimMissing claimId={claimId} />
  }

  const c = claim.data

  return (
    <div className="k-intake">
      <AppHeader />

      <div className="k-intake-body">
        <ClaimTabs
          active="Claim detail"
          claimId={claimId}
          itemCount={c?.item_count}
          photoCount={c?.photo_count}
        />

        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 400,
                fontSize: 28,
                letterSpacing: '-0.022em',
                margin: '0 0 4px',
              }}
            >
              Claim detail
            </h1>
            <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0 }}>
              The same details you entered when you started this claim. Change any of them, at any
              point — they all print on the export.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dirty ? (
              <button
                type="button"
                className="k-btn k-btn--ghost"
                disabled={save.isPending}
                onClick={() => {
                  setForm(original)
                  setInsured(splitInsured(original.insured_name))
                  setAddr(splitAddress(original.loss_address))
                  setNotice(null)
                  setError(null)
                }}
              >
                Discard changes
              </button>
            ) : null}
            <button
              type="button"
              className="k-btn"
              disabled={!dirty || errors.length > 0 || save.isPending}
              title={
                !dirty
                  ? 'Nothing has changed'
                  : errors.length > 0
                    ? 'Fix the highlighted fields first'
                    : 'Save these details'
              }
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        {error ? (
          <Alert tone="error" title="Not saved">
            {error}
          </Alert>
        ) : null}
        {/* Just the fact. The body used to name every surface that reads these
            fields, which is true and is not an answer to "did it save" -- it
            arrived at the moment the adjuster had already moved on. */}
        {notice && !dirty ? <Alert tone="success" title={notice} /> : null}

        {/* Not a block -- it is the customer's claim, and rule 16 never gates on
            editorial readiness -- but a carrier is holding a document built from
            these values. */}
        {c?.exported_at && dirty ? (
          <Alert tone="info" title="This claim has already been exported">
            Changing these details does not change the file a carrier already has. Re-export when
            you are done so the two agree.
          </Alert>
        ) : null}

        {claim.isLoading ? (
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading…</p>
        ) : (
          <>
            {/* ── 01 — the same fields, in the same order, as New claim ── */}
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
                <IntakeField
                  label="Project name"
                  value={form.name}
                  width={300}
                  onChange={set('name')}
                  invalid={Boolean(errorFor('name'))}
                  hint={errorFor('name')}
                />
                <IntakeField
                  label="Insured — first name"
                  value={insured.first}
                  onChange={(v) => setInsured((p) => ({ ...p, first: v }))}
                />
                <IntakeField
                  label="Insured — last name"
                  value={insured.last}
                  onChange={(v) => setInsured((p) => ({ ...p, last: v }))}
                />
                <IntakeField
                  label="Loss address"
                  value={addr.street}
                  width={300}
                  onChange={(v) => setAddr((p) => ({ ...p, street: v }))}
                />
                <IntakeField
                  label="City"
                  value={addr.city}
                  onChange={(v) => setAddr((p) => ({ ...p, city: v }))}
                />
                <IntakeSelect
                  label="State"
                  value={addr.state}
                  options={US_STATES}
                  width={92}
                  onChange={(v) => setAddr((p) => ({ ...p, state: v }))}
                >
                  <option value="">—</option>
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </IntakeSelect>
                <IntakeField
                  label="Loss ZIP"
                  value={addr.zip}
                  mono
                  width={120}
                  onChange={(v) =>
                    setAddr((p) => ({ ...p, zip: v.replace(/\D/g, '').slice(0, 5) }))
                  }
                  hint="Sets the sales tax rate"
                />
                <IntakeField
                  label="Claim number"
                  value={form.claim_number}
                  mono
                  onChange={set('claim_number')}
                />
                <IntakeField
                  label="Policy number"
                  value={form.policy_number}
                  mono
                  onChange={set('policy_number')}
                />
                <IntakeField
                  label="Date of loss"
                  value={form.date_of_loss}
                  type="date"
                  onChange={set('date_of_loss')}
                  invalid={Boolean(errorFor('date_of_loss'))}
                  hint={errorFor('date_of_loss')}
                />
                <IntakeField
                  label="Cause of loss"
                  value={form.loss_type}
                  onChange={set('loss_type')}
                />
                <IntakeField
                  label="Carrier / agency"
                  value={form.carrier}
                  onChange={set('carrier')}
                />
                <IntakeSelect
                  label="Local tax rate"
                  value={currentTaxLabel}
                  options={taxPlan.options.map((o) => o.label)}
                  width={300}
                  onChange={(label) => {
                    const picked = taxPlan.options.find((o) => o.label === label)
                    if (picked?.rate != null) set('tax_rate')(String(picked.rate))
                  }}
                  // Same rule as intake: only an ambiguous ZIP has anything to
                  // say here. A resolved rate is what it is.
                  hint={taxPlan.needsChoice ? taxPlan.hint : undefined}
                >
                  {currentTaxLabel ? (
                    <option value={currentTaxLabel}>{currentTaxLabel}</option>
                  ) : null}
                  {taxPlan.options
                    .filter((o) => o.label !== currentTaxLabel)
                    .map((o) => (
                      <option key={o.label} value={o.label}>
                        {o.label}
                      </option>
                    ))}
                </IntakeSelect>
                {/* Rule 14: the LABEL is the insured's own wording, never a
                    coverage letter assumed to be universal. */}
                <IntakeSelect
                  label="Contents coverage label"
                  value={form.personal_property_limit_label}
                  options={COVERAGE_LABELS}
                  width={280}
                  onChange={set('personal_property_limit_label')}
                  hint="Policies name this differently — matches the insured's declarations page"
                />
                <IntakeField
                  label="Personal property limit"
                  value={form.personal_property_limit}
                  mono
                  onChange={set('personal_property_limit')}
                  invalid={Boolean(errorFor('personal_property_limit'))}
                  hint={errorFor('personal_property_limit')}
                />
                <IntakeField
                  label="Amount already claimed"
                  value={form.amount_already_claimed}
                  mono
                  onChange={set('amount_already_claimed')}
                  invalid={Boolean(errorFor('amount_already_claimed'))}
                  hint={errorFor('amount_already_claimed') ?? 'Prior contents payments'}
                />
                <IntakeField
                  label="Policy form"
                  value={form.policy_form}
                  onChange={set('policy_form')}
                />
              </div>
            </section>

            {/* ── 02 — as on New claim ── */}
            <section className="k-intake-section">
              <div className="k-intake-section-hd">
                <span className="k-step-num">02</span>
                <div>
                  <div className="k-intake-section-t">Personnel &amp; company</div>
                  <div className="k-intake-section-s">
                    Saved on your account and offered on every claim.
                  </div>
                </div>
              </div>

              <div className="k-intake-form">
                <IntakeSelect
                  label="Estimator"
                  value={form.estimator_name}
                  options={dir.people.map(personLabel)}
                  addLabel="+ Add a person…"
                  onAdd={() => setPersonModal('new')}
                  width={280}
                  onChange={set('estimator_name')}
                  hint={estimator ? undefined : 'Prints on the export as the preparer'}
                >
                  <option value="">— None —</option>
                  {/* A name saved on the claim before it was in the directory
                      must still show, or opening this page would silently
                      clear it on the next save. */}
                  {form.estimator_name && !estimator ? (
                    <option value={form.estimator_name}>{form.estimator_name}</option>
                  ) : null}
                  {dir.people.map((x) => (
                    <option key={x.id} value={personLabel(x)}>
                      {personLabel(x)}
                    </option>
                  ))}
                </IntakeSelect>
                {estimator ? (
                  <button
                    type="button"
                    className="k-link"
                    style={{ alignSelf: 'end', paddingBottom: 9, fontSize: 12 }}
                    onClick={() => setPersonModal(estimator)}
                  >
                    Edit {estimator.name}
                  </button>
                ) : null}

                <IntakeSelect
                  label="Company header"
                  value={form.business_name}
                  options={dir.companies.map(companyLabel)}
                  addLabel="+ Add a company…"
                  onAdd={() => setCompanyModal('new')}
                  width={320}
                  onChange={set('business_name')}
                  hint={company ? undefined : 'Your letterhead on the inventory PDF and share links'}
                >
                  <option value="">— None —</option>
                  {form.business_name && !company ? (
                    <option value={form.business_name}>{form.business_name}</option>
                  ) : null}
                  {dir.companies.map((x) => (
                    <option key={x.id} value={companyLabel(x)}>
                      {companyLabel(x)}
                    </option>
                  ))}
                </IntakeSelect>
                {company ? (
                  <button
                    type="button"
                    className="k-link"
                    style={{ alignSelf: 'end', paddingBottom: 9, fontSize: 12 }}
                    onClick={() => setCompanyModal(company)}
                  >
                    Edit {company.name}
                  </button>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>

      {personModal ? (
        <PersonModal
          person={personModal === 'new' ? undefined : personModal}
          onClose={() => setPersonModal(null)}
          onSave={(person: Person) => {
            savePerson(person)
            set('estimator_name')(personLabel(person))
            setPersonModal(null)
          }}
        />
      ) : null}

      {companyModal ? (
        <CompanyModal
          company={companyModal === 'new' ? undefined : companyModal}
          onClose={() => setCompanyModal(null)}
          onSave={(next: Company) => {
            saveCompany(next)
            set('business_name')(companyLabel(next))
            setCompanyModal(null)
          }}
        />
      ) : null}
    </div>
  )
}
