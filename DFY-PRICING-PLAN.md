# Done-for-you pricing: audit and implementation plan

**Status:** 2026-10-22, deposit decided 2026-10-24. Owner's spec: progressive
per-line pricing with a $750 minimum, and a $750 deposit. The frontend half is
done (see "Shipped"). The backend half is specced in BACKEND-PROMPTS 12 and is
not built.

---

## 1. Audit: what already exists

| Area | Where | State |
|---|---|---|
| DFY pricing math | `src/lib/dfy-pricing-rules.ts` | **Existed, already marginal** (since 2026-10-02), integer-cent arithmetic. It carried a **$199 setup fee added on top** and **no price past 1,000 lines**. Its header said a monotonicity test existed, but none did. |
| Public DFY page | `src/pages/DoneForYouPage.tsx` → `/done-for-you` | Existed. Its rate card led with the per-line band table and a 400-line worked example ($199 + $1,775). Intake is by email (`mailto:`), not self-serve. |
| Design canvas | `design/components/done-for-you.jsx` (page 76) | **Stale**: still showed the scrapped flat-per-tier table ($7/$5/$3.50/$2.50, which falls at every boundary). |
| DFY backend | `kevin-backend/` | **Nothing exists.** `MCP-INTEGRATION.md` Q17 confirms there's no DFY code, no quote record, and no `/v1/dfy/*`. Self-serve flow specced in BACKEND-PROMPTS 12. |
| Staging / extraction / clustering | `StagingPage.tsx`, `src/lib/staging*.ts`; backend `/v1/claims/{id}/staging/*` | **Exists and reusable.** Upload, extraction status, proposed photo sets, merge, split, reclassify as context or duplicate, and process. Scoped to an authenticated owner's claim (no anonymous or pre-claim bucket). |
| Admin console (live) | `src/pages/Admin*Page.tsx` → `/admin/{overview,accounts,accounts/:id,revenue,platform,support,system}` | Exists. Has accounts, per-account claims (read), revenue, failed jobs, stuck-staging restart and demo presets. **No DFY intake, no quote screen, no admin pricing controls.** |
| Admin console (design) | `design/components/admin-console*.jsx` (pages 64–72) | The Revenue mock has a "Done-for-you claims" one-time row. Platform mock mentions "the done-for-you rate card lives in Platform once Stripe…" (not designed). |
| Balance collection | `/v1/claims/{id}/share`, `/p/{token}/checkout` (share-link paywall) | **Exists and reusable** for collecting the balance on delivery (BACKEND-PROMPTS 12 §6). |
| Payments | backend `services/payments.py` | Exists. Builds Checkout sessions with ad-hoc `price_data`, so a deposit needs no new Stripe price object. |

**Conclusion:** don't rebuild staging, clustering, the admin shell or the
paywall. What's missing is the **quote record**, the **pricing config** and
an **internal DFY desk** screen that ties them together.

## 2. Shipped in this change (frontend)

- `dfy-pricing-rules.ts`: `DFY_MINIMUM_FEE = 750`; price = `max(750, marginal
  total)` (`priceForLines`, `quoteFor`); the setup fee is gone; the 1,001+ band
  prices at $3.00 with `customEligible` flagging a custom volume rate;
  `DFY_TYPICAL` holds the public ranges; `linesWithin(budget)` translates each
  range into the line count it buys.
- `scripts/test-dfy-pricing.mjs` (`npm run test:dfy`) checks:
  - every boundary the spec lists, and that the price never falls (n+1 ≥ n) at each one
  - a full sweep from 1 to 5,000
  - the $750 minimum, applied with `max()` and never added
  - the spec's worked totals
  - the breakdown adds up to the total
  - invalid counts return no quote
  - `linesWithin` gives back the line count each budget buys
- `/done-for-you`: leads with **Minimum project: $750** and the five typical
  ranges, then the line-item / ceiling explanation. The band table and the
  worked 400-line example ($1,775, "one more line would make it $1,779")
  moved into a **professionals' disclosure** that reuses the FAQ
  `k-faqx` details/summary.
- Design canvas page 76 brought in line; SEO description no longer says
  "flat per-item"; `check-domain-rules.py` rule 9d flags a returning setup fee
  or flat-per-tier wording; CLAUDE.md rule 9d records the model.

The frontend module is a **display mirror**. The server's quote is the
authority (integrity rules 8–9).

## 3. Backend (BACKEND-PROMPTS 12, amended)

1. **Pricing config table** `dfy_pricing_bands(tier_start, tier_end NULL,
   per_item_rate_cents, active, effective_date)` and a `dfy_pricing(minimum_fee_cents,
   effective_date)` row. Quotes **snapshot** the bands they used, so a later
   price change never restates a sent quote.
2. **One pure function** `dfy_price(lines, config) -> {breakdown, line_total,
   minimum_applied, total}` in integer cents, with the same boundary tests as
   `scripts/test-dfy-pricing.mjs`.
3. **Quote record** `dfy_quotes`: customer name, email, phone, ZIP, claim name,
   loss type, estimated scope, notes, `photo_count`, `set_count` (validated
   candidate sets: kind = item, never context or duplicate), `quoted_lines`,
   computed total, `override_total` plus a reason, `status ∈
   draft|sent|accepted|declined|expired`, `expires_at` (14 days), and
   `final_lines` / `final_total` on delivery.
4. **Billable unit = promoted claim items.** The invoice is
   `min(price(final_lines), quoted total)`, because the quote is a ceiling the
   invoice can't pass (owner, 2026-10-02).
5. **Overrides** are written to an audit table (who, when, old → new, reason).
   Only `admin` or `owner` roles can set them.
6. **Analytics events:** `dfy_quote_requested`, `dfy_quote_sent`,
   `dfy_quote_accepted`, `dfy_quote_declined`, `dfy_quote_expired`,
   `dfy_delivered`. Each carries photo_count, set_count, quoted_lines,
   quote_total, final_lines, final_total and variance. That's enough to report
   conversion by quote size.

**Deposit: the $750 minimum** (owner, 2026-10-24). It replaces the old $199
deposit (which was the setup fee). Every job owes at least $750, so the
deposit is never refundable on size grounds, and a quote at the minimum is paid
in full at acceptance. The balance is `final_total − 750`, collected through the
share-link paywall. It is never negative, and when it's zero the link goes out
with no paywall.

## 4. Proposed: the internal DFY desk (minimum viable)

It doesn't exist yet and needs the quote record first. It's one admin route,
`/admin/dfy` (list) → `/admin/dfy/:quoteId` (detail), built inside the existing
admin console shell:

- **Intake card:** the customer and claim fields from §3.3, editable while the
  quote is in draft.
- **Photos:** upload into the quote's staging session. It reuses the staging
  upload and chunking (`src/lib/upload.ts`) and shows extraction and
  clustering status from the existing poll.
- **Candidate review:** **link into the existing staging screen** for that
  session rather than rebuilding it. Merge, split, mark duplicate or context,
  and set notes all exist there. The desk shows only the counts: candidate
  sets, photos per set, and context/duplicate excluded.
- **Quote panel:** validated sets → estimated lines → the band breakdown →
  minimum applied? → total. Values come from the **server's** quote, not
  recomputed here. Override field with a required reason. Status pill and
  Send, Mark accepted and Mark declined actions.
- **History:** the audit trail of overrides and status changes.

Gap to close first: staging today belongs to a claim, and §12 says no claim
exists until the deposit clears. Either the quote owns a pre-claim staging
session, or the desk creates the claim under the comped DFY account at
draft time. That's a backend shape decision for §12.
