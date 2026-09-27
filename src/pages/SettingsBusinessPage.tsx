import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SettingsShell from '../components/SettingsShell'
import IntakeField from '../components/IntakeField'
import Alert from '../components/Alert'
import { I, Icon } from '../components/Icon'
import { ApiError, api } from '../lib/api'
import { useBrand } from '../lib/brand'
import { BRAND_DEFAULT, accentFor, normalizeHex } from '../lib/directory-rules'
import {
  BUSINESS_MAX,
  EMPTY_BUSINESS_FORM,
  LOGO_ERROR,
  businessPatch,
  formFrom,
  isDirty,
  letterheadLines,
  logoProblem,
} from '../lib/business-rules'
import type { BusinessField, BusinessForm } from '../lib/business-rules'
import type { MeResponse } from '../lib/types'

/**
 * The firm's letterhead — the account's own details, stored on the account.
 *
 * REWRITTEN 2026-09-26, when the backend shipped it (0058). The previous
 * version kept these fields in localStorage and said so: "Exports don't carry
 * it yet — the document generator is server-side and has nowhere to read it
 * from." There is somewhere now. `GET/PATCH /v1/me` carry a `business` block
 * and `PUT/DELETE /v1/me/logo` own the mark, so what is typed here is what
 * prints.
 *
 * ⛔ THIS IS NOT THE PER-CLAIM PREPARER. A claim carries its own
 * `estimator_name` / `business_name` recording who prepared THAT inventory,
 * and keeps them even after the person leaves the firm. This is the account's
 * CURRENT letterhead; the cover prints both.
 *
 * Where it appears: the client-facing PDF and the share-link portal — the
 * documents an adjuster puts in front of their client. Deliberately not the
 * .xlsx, which XactContents parses and which already holds the firm roster.
 */
const SWATCHES = ['#2E4B6F', '#1F3A5F', '#2F5D50', '#6B4E3D', '#5B4B8A', '#1a1d21']

const LABELS: Record<BusinessField, string> = {
  business_name: 'Business name',
  contact_name: 'Contact name',
  license_number: 'License #',
  address: 'Address',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
}

const ORDER: BusinessField[] = [
  'business_name',
  'contact_name',
  'license_number',
  'address',
  'phone',
  'email',
  'website',
]

export default function SettingsBusinessPage() {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: 60_000,
  })
  const profile = me.data?.business ?? null

  const [form, setForm] = useState<BusinessForm>(EMPTY_BUSINESS_FORM)
  const [touched, setTouched] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { brand, commit: commitBrand } = useBrand()

  /**
   * Seed from the server once, and never again while they are typing: the
   * `me` query refetches on window focus, and re-seeding on every answer
   * would wipe an edit made between two of them.
   */
  useEffect(() => {
    if (!profile || touched) return
    setForm(formFrom(profile))
  }, [profile, touched])

  const edit = (field: BusinessField) => (value: string) => {
    setTouched(true)
    setNote(null)
    setForm((prev) => ({ ...prev, [field]: value.slice(0, BUSINESS_MAX[field]) }))
  }

  const held = (res: MeResponse) => {
    queryClient.setQueryData(['me'], res)
    setForm(formFrom(res.business))
    setTouched(false)
  }

  const save = useMutation({
    mutationFn: async () => {
      const patch = businessPatch(form, profile)
      // Nothing changed: no request, and the save bar still answers.
      if (!patch) return me.data ?? null
      return api.patch<MeResponse>('/v1/me', { json: { business: patch } })
    },
    onSuccess: (res) => {
      if (res) held(res)
      setProblem(null)
      setNote('Saved. New documents carry it.')
    },
    onError: (err) => setProblem(message(err, 'Could not save the business details.')),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      // `image`, not `logo` -- the field name is the route's.
      body.append('image', file)
      return api.put<MeResponse>('/v1/me/logo', { form: body })
    },
    onSuccess: (res) => {
      held(res)
      setProblem(null)
      setNote('Logo saved.')
    },
    onError: (err) => setProblem(logoMessage(err)),
  })

  const removeLogo = useMutation({
    mutationFn: () => api.delete<MeResponse>('/v1/me/logo'),
    onSuccess: (res) => {
      held(res)
      setProblem(null)
      setNote('Logo removed. Your firm’s details still print.')
    },
    onError: (err) => setProblem(message(err, 'Could not remove the logo.')),
  })

  const takeLogo = (file: File) => {
    const bad = logoProblem(file)
    if (bad) {
      setNote(null)
      setProblem(LOGO_ERROR[bad])
      return
    }
    upload.mutate(file)
  }

  const busy = save.isPending || upload.isPending || removeLogo.isPending
  const dirty = isDirty(form, profile)
  const lines = letterheadLines(form)
  const logoUrl = profile?.logo_url ?? null
  const derived = normalizeHex(brand) && accentFor(brand) !== normalizeHex(brand)

  return (
    <SettingsShell
      activeId="agency"
      title="Business"
      eyebrow="Your firm · letterhead"
      saveLabel={save.isPending ? 'Saving…' : 'Save business details'}
      saveDisabled={busy || !dirty || me.isPending}
      onSave={() => save.mutate()}
      onDiscard={
        dirty
          ? () => {
              setForm(formFrom(profile))
              setTouched(false)
              setNote(null)
              setProblem(null)
            }
          : undefined
      }
      saveNote={
        dirty ? 'Not saved yet.' : 'This prints on the PDF and the share link you send a client.'
      }
    >
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
          {form.business_name.trim() || 'Your firm'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620 }}>
          The letterhead on documents your client reads — the inventory PDF and the share link.
          The .xlsx carries none of it: XactContents parses that file and already holds your firm.
        </p>
      </div>

      {problem ? (
        <Alert tone="error" title="That did not go through" onDismiss={() => setProblem(null)}>
          {problem}
        </Alert>
      ) : null}
      {note && !problem ? (
        <Alert tone="success" onDismiss={() => setNote(null)}>
          {note}
        </Alert>
      ) : null}
      {me.isError ? (
        <Alert tone="error" title="Could not read your firm">
          {message(me.error, 'Reload the page to try again.')}
        </Alert>
      ) : null}

      <section className="k-set-card">
        <div className="k-set-card-hd">Letterhead</div>
        <div className="k-set-card-body">
          <div className="k-set-logo-row" style={{ marginBottom: 16 }}>
            <div className="k-dirmodal-logo-box">
              {logoUrl ? <img src={logoUrl} alt="" /> : <span>No logo</span>}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
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
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {upload.isPending ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              </button>
              {logoUrl ? (
                <button
                  type="button"
                  className="k-link"
                  style={{ marginLeft: 10 }}
                  disabled={busy}
                  onClick={() => removeLogo.mutate()}
                >
                  {removeLogo.isPending ? 'Removing…' : 'Remove'}
                </button>
              ) : null}
              {/* PNG and JPEG only because those are the two the PDF engine
                  draws. A WebP or HEIC would store fine and then print as
                  nothing, so it is refused here rather than silently lost. */}
              <div className="k-dirmodal-hint">PNG or JPEG, up to 2 MB. Saved when you pick it.</div>
            </div>
          </div>

          <div className="k-set-grid2">
            {ORDER.map((field) => (
              <IntakeField
                key={field}
                label={LABELS[field]}
                value={form[field]}
                width="100%"
                onChange={edit(field)}
              />
            ))}
          </div>

          <div className="k-intake-letterhead" style={{ marginTop: 16 }}>
            {logoUrl ? <img src={logoUrl} alt="" /> : null}
            <div>
              {lines.length ? (
                lines.map((line) => <div key={line}>{line}</div>)
              ) : (
                /* An empty firm is a complete answer: the cover prints no
                   letterhead and nothing fails. Say that rather than showing
                   a placeholder firm nobody typed. */
                <div style={{ color: 'var(--k-fg-4)' }}>
                  Nothing filled in — documents print without a letterhead.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="k-set-card">
        <div className="k-set-card-hd">Accent colour</div>
        <div className="k-set-card-body">
          <div className="k-set-brand">
            <div className="k-brand-row">
              {SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => commitBrand(hex)}
                  className={`k-brand-sw${brand.toLowerCase() === hex.toLowerCase() ? ' is-on' : ''}`}
                  style={{ background: hex }}
                  title={hex}
                  aria-label={`Use ${hex}`}
                />
              ))}
              <label className="k-brand-custom" title="Pick any colour">
                <input type="color" value={brand} onChange={(e) => commitBrand(e.target.value)} />
                <Icon d={I.edit} size={11} />
              </label>
              <span className="k-mono" style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>
                {brand.toUpperCase()}
              </span>
              {brand.toLowerCase() !== BRAND_DEFAULT.toLowerCase() ? (
                <button type="button" className="k-link" onClick={() => commitBrand(BRAND_DEFAULT)}>
                  Reset
                </button>
              ) : null}
            </div>
            <div className="k-dirmodal-hint">
              Repaints Kevin for you, in this browser — it is a display preference, not part of
              the letterhead, and documents do not use it.
              {derived
                ? ` Buttons use ${accentFor(brand).toUpperCase()} — a darkened version, because white text on this one would be unreadable.`
                : ''}
            </div>
          </div>
        </div>
      </section>
    </SettingsShell>
  )
}

/**
 * The logo upload has one failure that is not the adjuster's file and not the
 * server's answer: the route is `PUT /v1/me/logo`, and the API's CORS config
 * does not allow PUT from a browser (`allow_methods` is GET, POST, PATCH,
 * DELETE, OPTIONS). The preflight is refused with a 400, the real request is
 * never sent, and `fetch` rejects with a bare "Failed to fetch" -- which reads
 * as "your connection" or "your file", and is neither. Verified against the
 * live API on 2026-09-27; backend prompt 8. When PUT is allowed this branch
 * simply stops being reached.
 */
function logoMessage(err: unknown): string {
  if (!(err instanceof ApiError))
    return 'Kevin could not reach the upload. The API does not accept this request from a browser yet — nothing is wrong with your file, and we have asked for the fix.'
  return message(err, 'Could not upload the logo.')
}

/** A server sentence if there is one, ours if there is not. */
function message(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}
