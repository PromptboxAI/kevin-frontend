import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Alert from '../components/Alert'
import ClaimMissing from '../components/ClaimMissing'
import ClaimTabs from '../components/ClaimTabs'
import IntakeField from '../components/IntakeField'
import { ApiError, api, retryUnlessMissing } from '../lib/api'
import { useTaxRate } from '../lib/tax-rate'
import { taxPlanFor } from '../lib/tax-rate-rules'
import {
  EMPTY_FORM,
  claimPatch,
  formFromClaim,
  isDirty,
  validateClaimForm,
  zipChanged,
} from '../lib/claim-detail-rules'
import type { ClaimDetailForm } from '../lib/claim-detail-rules'
import type { ClaimSummary } from '../lib/types'

/**
 * Claim detail — the first tab, and the only editable one.
 *
 * Everything typed at intake lived nowhere afterwards: the Overview printed it
 * as static text and `PATCH /v1/claims/{claim_id}` had never been called from
 * the frontend at all. So a claim was write-once. An insured's name misspelled
 * at 7am on site stayed misspelled on the export; a carrier that issues its
 * claim number a week later had nowhere to put it; a policy limit found on the
 * declarations page after the photos were already in meant starting over.
 *
 * Xactimate lets an adjuster change all of this for the life of the file, and
 * that is the right model — a claim is a document in progress, not a form you
 * submit once.
 *
 * Two rules shape the behaviour:
 *
 *   1. It sends ONLY what changed. A PATCH of every field would stamp an edit
 *      on the audit trail for things nobody touched, and would let two people
 *      editing different fields overwrite each other.
 *   2. The loss ZIP resolves the sales tax rate, so the two may never drift
 *      apart (CLAUDE.md). Change the address to a new ZIP and the form offers
 *      the rate for it rather than silently keeping the old one, which would be
 *      wrong on every line of the export.
 */

function Section({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <section className="k-intake-section">
      <div className="k-intake-section-hd">
        <div>
          <div className="k-intake-section-t">{title}</div>
          {sub ? <div className="k-intake-section-s">{sub}</div> : null}
        </div>
      </div>
      <div className="k-intake-form">{children}</div>
    </section>
  )
}

export default function ClaimDetailPage() {
  const { claimId = '' } = useParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ClaimDetailForm>(EMPTY_FORM)
  const [original, setOriginal] = useState<ClaimDetailForm>(EMPTY_FORM)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const claim = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.get<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`),
    retry: retryUnlessMissing,
  })

  /* Seed once the claim lands, and re-seed after a save so `original` is the
     server's answer rather than what we hoped it accepted. */
  useEffect(() => {
    if (!claim.data) return
    const next = formFromClaim(claim.data as unknown as Record<string, unknown>)
    setForm(next)
    setOriginal(next)
  }, [claim.data])

  const set = (key: keyof ClaimDetailForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const errors = useMemo(() => validateClaimForm(form), [form])
  const errorFor = (field: keyof ClaimDetailForm) =>
    errors.find((e) => e.field === field)?.message
  const dirty = isDirty(original, form)

  /* The address moved to a ZIP the current rate was not resolved from. */
  const newZip = zipChanged(original, form)
  const taxLookup = useTaxRate(newZip ?? '')
  /*
   * Through `taxPlanFor`, not off `suggested_rate` directly. It already knows
   * the two things a hand-rolled read gets wrong: `suggested_rate` is a
   * FRACTION needing conversion, and a ZIP that straddles two jurisdictions
   * comes back `ambiguous` with a RANGE -- offering one number there would
   * quietly pick a side of a tax line on the adjuster's behalf.
   */
  const taxPlan = taxPlanFor(newZip ?? '', taxLookup.data ?? null, null, taxLookup.isFetching)
  const offer =
    newZip && !taxPlan.needsChoice
      ? (taxPlan.options.find((o) => o.rate != null && o.rate > 0) ?? null)
      : null

  const save = useMutation({
    mutationFn: () =>
      api.patch<ClaimSummary>(`/v1/claims/${encodeURIComponent(claimId)}`, {
        json: claimPatch(original, form),
      }),
    onSuccess: async () => {
      setError(null)
      setNotice('Saved.')
      await queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      /* Every surface that prints claim metadata, because the tax rate reaches
         the money and the name reaches the export. */
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
      void queryClient.invalidateQueries({ queryKey: ['claim-items', claimId] })
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
              Everything here prints on the export. Change any of it, at any point in the claim.
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

        {error ? <Alert tone="error" title="Not saved">{error}</Alert> : null}
        {notice && !dirty ? (
          <Alert tone="success" title={notice}>
            The export, the share link and the claims list all read these fields.
          </Alert>
        ) : null}

        {/*
          * The export is already out. Not a block -- it is the customer's claim
          * and rule 16 says we never gate on editorial readiness -- but a
          * carrier is holding a document built from these values.
          */}
        {c?.exported_at && dirty ? (
          <Alert tone="info" title="This claim has already been exported">
            Changing these details does not change the file a carrier already has. Re-export when
            you are done so the two agree.
          </Alert>
        ) : null}

        {/*
          * The one cross-field rule on this page. The ZIP resolves the rate, so
          * moving the address without moving the rate is how an export ends up
          * taxed at the wrong county on every line.
          */}
        {newZip ? (
          <Alert
            tone="wait"
            title={`The loss address moved to ${newZip}`}
            action={
              offer ? (
                <button
                  type="button"
                  className="k-btn k-btn--sm"
                  onClick={() => set('tax_rate')(String(offer.rate))}
                >
                  Use {offer.rate}%
                </button>
              ) : undefined
            }
          >
            {offer
              ? `${offer.label}. The rate below still says ${form.tax_rate || '—'}%, and tax is applied to every line.`
              : taxPlan.needsChoice
                ? `${taxPlan.hint}. Set the rate below by hand — Kevin will not pick a side of a tax line for you.`
                : taxLookup.isFetching
                  ? 'Looking up the rate for that ZIP…'
                  : 'Kevin has no rate on file for that ZIP. Set the rate below by hand.'}
          </Alert>
        ) : null}

        {claim.isLoading ? (
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-4)' }}>Loading…</p>
        ) : (
          <>
            <Section title="Claim" sub="How this file is identified, here and on the export.">
              <IntakeField
                label="Project name"
                value={form.name}
                width={300}
                onChange={set('name')}
                invalid={Boolean(errorFor('name'))}
                hint={errorFor('name')}
              />
              <IntakeField
                label="Claim number"
                value={form.claim_number}
                mono
                onChange={set('claim_number')}
                hint="From the carrier. Often issued after the inspection."
              />
              <IntakeField
                label="Policy number"
                value={form.policy_number}
                mono
                onChange={set('policy_number')}
              />
              <IntakeField label="Carrier" value={form.carrier} onChange={set('carrier')} />
              <IntakeField
                label="Cause of loss"
                value={form.loss_type}
                onChange={set('loss_type')}
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
                label="Policy form"
                value={form.policy_form}
                onChange={set('policy_form')}
              />
            </Section>

            <Section
              title="Insured & loss location"
              sub="The ZIP in the address sets the sales tax rate for every line."
            >
              <IntakeField
                label="Insured"
                value={form.insured_name}
                width={300}
                onChange={set('insured_name')}
              />
              <IntakeField
                label="Loss address"
                value={form.loss_address}
                width={420}
                onChange={set('loss_address')}
              />
              <IntakeField
                label="Sales tax rate"
                value={form.tax_rate}
                suffix="%"
                width={160}
                onChange={set('tax_rate')}
                invalid={Boolean(errorFor('tax_rate'))}
                hint={errorFor('tax_rate') ?? 'Applied to every line'}
              />
            </Section>

            <Section
              title="Coverage"
              sub="Printed on the export summary. Policies name contents coverage differently, so the label travels with the limit."
            >
              {/* Rule 14: never print a coverage letter as though it were
                  universal -- the LABEL is the insured's own wording. */}
              <IntakeField
                label="Contents coverage label"
                value={form.personal_property_limit_label}
                width={300}
                onChange={set('personal_property_limit_label')}
                hint="e.g. Coverage C — Personal Property"
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
                label="Already claimed"
                value={form.amount_already_claimed}
                mono
                onChange={set('amount_already_claimed')}
                invalid={Boolean(errorFor('amount_already_claimed'))}
                hint={errorFor('amount_already_claimed') ?? 'Prior contents payments'}
              />
              <IntakeField
                label="Deductible label"
                value={form.deductible_label}
                onChange={set('deductible_label')}
              />
              <IntakeField
                label="Deductible"
                value={form.deductible}
                mono
                onChange={set('deductible')}
                invalid={Boolean(errorFor('deductible'))}
                hint={errorFor('deductible')}
              />
            </Section>

            <Section title="Preparer" sub="Who built this inventory, as it appears on the document.">
              <IntakeField
                label="Estimator"
                value={form.estimator_name}
                width={280}
                onChange={set('estimator_name')}
              />
              <IntakeField
                label="Company header"
                value={form.business_name}
                width={280}
                onChange={set('business_name')}
                hint="Your letterhead on the inventory PDF"
              />
              <IntakeField
                label="Claim rep"
                value={form.claim_rep}
                width={280}
                onChange={set('claim_rep')}
              />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
