# `06-export-ready.html` — merge variables

Source: `design/emails/06-export-ready.html` (63 lines, static HTML with literal
placeholder values). Every literal that must become a variable is listed below
with the exact string currently in the file, so you can find-and-replace with
confidence.

Palette, dark-mode notes and the "never use pure #ffffff" rule are in
`design/emails/README.md` — worth reading before editing the markup.

---

## ⚠️ Read this before wiring it to the delivery job

**This template is addressed to the ADJUSTER, not to the client who paid.**
Three things in it only make sense for an account holder:

| Line | Copy | Problem for a paying client |
| --- | --- | --- |
| Footer | "Change what emails you get in **Settings → My profile**." | They have no account and no Settings. |
| Body | "Kevin never sends anything to a carrier on your behalf. You download the file, or mint a share link, and send it yourself." | They cannot mint share links; this is adjuster workflow copy. |
| Body | "Three files: the XactContents spreadsheet… a client-facing PDF inventory… the full bundle with every photo and the audit log." | The paid delivery is the document they bought, not the adjuster's three-file bundle. |
| CTA href | `https://kevin.co/claims/CLM-2026-04412/exports` | An authenticated app route. A client following it hits the sign-in wall. |

So: use this template for the **adjuster's** export-ready notification (which is
what it was written for), and give the client delivery its own variant. The
delta is small — same card, same panel, different CTA target and footer — but
sending this one as-is means someone who has just paid $149 is told to adjust
their notification preferences in an app they cannot log into.

If you want, I will write `17-inventory-delivered.html` into
`design/emails/` in the same house style and send it over; say the word. The
notification rows on `31-Settings-profile` and the `notifications` docs article
are kept in sync with that folder, so a new template should land there rather
than live in the job.

---

## Variables — `06-export-ready.html` as written (adjuster-facing)

| Variable | Current literal in the file | Notes |
| --- | --- | --- |
| `claim_name` | `Godfrey — Kitchen fire` | Bold, inside "The files for **…** finished generating". Em dash is part of the claim name, not markup. |
| `claim_number` | `CLM-2026-04412` | Panel row "Claim". This is `claim_number`, the carrier's reference — NOT `claim_id`, the slug. |
| `item_count` | `142` | Panel row "Line items". Plain integer, no thousands separator in the template; add one if counts get large. |
| `export_ref` | `EXP-2026-1142` | Panel row "Reference". Rendered in monospace bold — it is the string a support ticket will quote. |
| `bundle_size` | `340 MB` | Panel row "Bundle size". Pre-formatted STRING including the unit, not bytes — the template does no math. |
| `exports_url` | `https://kevin.co/claims/CLM-2026-04412/exports` | CTA href. Note it embeds the claim number today; if it should be the slug, it is `/claims/{claim_id}/exports`. |

### Fixed, do not templatise

`https://kevin.co` (wordmark), `https://kevin.co/docs`, `https://kevin.co/legal`,
`mailto:kevin@kevin.co`, and the postal address
`Kevin.co, LLC · 34 E. Main St. Ste 347, Smithtown, NY 11787`.

### Subject line

Not in the file — the template is body-only. Suggested, matching the eyebrow:
`Your export is ready — {claim_name}`

---

## If you do reuse it for client delivery, the minimum changes

1. `exports_url` → the **signed storage URL** (you said the link is a direct
   Supabase signed URL, so this is a straight swap; the CTA already renders as a
   button).
2. Add `expires_at` next to the CTA — a signed URL dies, and a client who opens
   the mail a week later needs to know why the link is dead rather than
   assuming they were cut off after paying.
3. Replace the footer preferences line with something a non-account holder can
   act on (reply-to the adjuster, or nothing at all).
4. Drop the "mint a share link" sentence and the three-files sentence.
5. Eyebrow `Export ready` → something the buyer recognises, e.g.
   `Your inventory`.

Item 2 is the one I would not skip. Everything else is tone; a dead link with
no explanation on something already paid for is the failure you already called
the worst one this feature has.
