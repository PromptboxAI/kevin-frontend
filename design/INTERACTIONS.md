# INTERACTIONS.md — wiring manifest

Source of truth for **what every actionable control does**. Prototype is design-fidelity;
this file tells the backend agent which controls are already wired, which are static-by-design,
and what each static one must do in production.

**Legend**
- ✅ **wired** — works in the prototype now (state/nav), keep behavior.
- 🔌 **static → wire** — visual only now; production target noted. Build it.
- 🎭 **static (visual)** — intentionally inert (demo affordance); safe to leave until backend exists.
- ➡️ **nav** — real `<a>` link to another page (works now).

Rule: no control may be BOTH inert AND absent from this file. If you add/change a control,
update its row here in the same edit. Anything not listed → flag back, don't guess.

---


## Conversion events — what the ad spend is measured against

The design package fires nothing. This table is the CONTRACT: it says which
control marks which event and where the event actually happens, so the app build
wires the pixel/GA calls to the right moment rather than inferring it. The
wiring itself belongs to the app build, not here.

The one that matters commercially is **`trial_activated`**. A visitor who
submits step 1 has typed an email; a visitor who clears the SetupIntent at
step 3 has attached a card and started a paid trial. Optimising a campaign
against `trial_start` buys addresses; optimising against `trial_activated`
buys trials. Send `trial_activated` as the conversion, and keep the earlier two
as funnel steps so drop-off between them stays visible.

`AccountCreate` lives in `components/onboarding.jsx` and is a three-step wizard
(details → verify → card), not three routes — every step below is a state
change inside `58-Account-create.html`, so a page-view trigger will not see any
of them.

| Event | Fires when | Where | Notes |
|---|---|---|---|
| `signup_started` | Step 1 submitted — name, email and a password meeting the rules | `58` → `AccountCreate` step 0 → 1 | Top of funnel. An email exists; nothing is billable yet. Renamed from `trial_start` when the timed trial was scrapped — if the old name is already live in the ads account, alias it rather than breaking history. |
| `account_created` | Step 2 submitted — verification code accepted | `58` → step 1 → 2 | The account exists. Still no card. |
| `card_added` | Step 3 SetupIntent succeeds | `58` → step 2 complete | **THE ads conversion event.** Card attached and the 250 free items unlock. Nothing is charged and no subscription exists yet — under the metered trial (rule 9b) there is no timer to start, so `trial_activated` was dropped as a synonym. Fire once; do not re-fire if the user revisits. |
| `quota_exhausted` | The 250th free item is produced | app — wherever processing completes | The real intent signal on a metered trial: the adjuster has used the product enough to run out. Worth optimising toward, and worth an email. |
| `plan_upgraded` | Pro subscription created — by choosing it or by passing 250 items | `35-Settings-billing` / quota wall | **The revenue event.** This is what `trial_activated` used to approximate on day 7; now it is an explicit act. |
| `credits_purchased` | Add-credits checkout succeeds | `35-Settings-billing` / truncation alert | Overage block bought at $0.20/item. Not a plan change — keep it out of the upgrade count. |
| `enterprise_quote_submitted` | **Request a quote** submitted | `15-Request-access` | Enterprise lead. Distinct from a trial — it is sales-qualified, not self-serve, so keep it out of the trial conversion count. |
| `contact_submitted` | Contact form submitted | `38-Contact` | General enquiry. |
| `sample_claim_viewed` | Page reaches the sample claim | `48-Sample-claim` | Engagement, not conversion. Public and unauthenticated, so it is also the one event a bot can trigger — do not optimise against it. |

Two things to get right when wiring:

- **De-duplicate `card_added`.** It is a state change, not a navigation, so
  a re-render or a back-and-forward can fire it twice and inflate the conversion
  count the bidding algorithm trains on.
- **Do not attach events to the marketing CTAs themselves.** `Start free — 250
  items` on landing, pricing, product and both segment pages all route to
  `58`; counting the click counts intent, not outcome. The events above are the
  outcomes.


## Billing — Stripe events and the UI state they produce

> **Now built in the production app** (`src/`), not just the prototype:
> `/settings/billing` → `src/pages/BillingPage.tsx`, with
> `src/lib/billing.ts` (checkout / credits / portal / pollMe),
> `ItemUsageCard`, `AddCreditsModal` and `UpgradeProButton`. The avatar menu's
> Billing entry is a real link; the other settings destinations stay inert
> until their screens exist.
>
> **Blocked on the backend:** `GET /v1/me` does not yet return `plan`,
> `items`, `billing_state` or `period_end`. Those fields are typed OPTIONAL,
> so the page renders and says billing is unavailable rather than inventing a
> plan (rule 20). The meter, the credit modal and the upgrade button appear
> the moment the payload carries them — no frontend change needed.


The contract for the end-to-end run. Written frontend-side so both halves test
against the same document; anything here the backend disagrees with should be
corrected **here first**, not worked around in a component.

Three endpoints, all minting a Stripe-hosted session and returning `{ url }`
that the client redirects to. `KevinAPI.billing` in `data.jsx` is the only
place they are called:

| Action | Endpoint | Body |
|---|---|---|
| Start Pro | `POST /v1/billing/checkout` | `{}` |
| Buy credits | `POST /v1/billing/credits/checkout` | `{ items: <int> }` — confirmed; integer, **50–20,000** |
| Manage card / cancel / invoices | `POST /v1/billing/portal` | `{}` |

All three answer **`{ checkout_url, session_id }`** — note `checkout_url`, not
`url`. `success_url` / `cancel_url` are set **server-side**, and the client never
sends a `price_id`: the server holds the price, so a tampered request cannot buy
20,000 items for the price of 50, and a tampered link cannot bounce a paying
customer somewhere of an attacker's choosing. The 50–20,000 bound is mirrored in
`KevinAPI.billing` so a bad call fails immediately with a readable message
instead of a 422 mid-checkout.

### Returning from checkout — the polling leg

`_session` stashes the pending session in `sessionStorage` (`kevin.checkout`)
along with **what the caller expects to change** — `plan_before` for an upgrade,
`credits_before` for a credit block. On mount, Billing reads that, shows
**“Confirming your payment…”**, and calls `KevinAPI.pollMe(settled)`: `GET /v1/me`
up to 8 times at 1.2s, resolving as soon as the expected field actually moves.

**A timeout is not a failure.** The money may be fine and the webhook merely
slow, so the copy degrades to “Still confirming with Stripe” and explicitly says
nothing is charged twice by waiting. It must never say the payment failed — the
UI does not know that, and only `GET /v1/me` ever will.

### The rule that matters most

**A redirect back from Stripe is not proof of anything.** The customer can beat
the webhook back to the app, hit Back, refresh, or close the tab mid-flow. The
UI therefore reads billing state from `GET /v1/me` **only**, and never infers it
from having landed on `success_url` — same discipline as rule 20 everywhere
else: the frontend renders the state the payload carries.

That means the success page must render a **pending** state gracefully. If
`GET /v1/me` still says `free` a second after checkout, that is normal and not
an error; poll or re-fetch, and never show "payment failed" for it.

Webhooks are also **retried** by Stripe and can arrive **out of order**. The
item counter is append-only (rule 9c), so a credit block applied twice is real
money the customer did not buy. Key every grant on the Stripe event id.

### What `GET /v1/me` carries

Confirmed against the live backend. Everything billing-related is nested under
**`quota`** — there are no top-level `plan` / `items` fields.

```json
{ "id": "…", "email": "…", "roles": [], "is_admin": false,
  "quota": { "plan": "pro", "billing_state": "active",
             "included_items": 2000, "items_used": 0, "items_remaining": 2000,
             "credit_balance": 0,
             "period_start": "2026-09-01T15:31:51+00:00",
             "period_end": "2026-10-01T15:31:51+00:00" } }
```

| Field | Values | Drives |
|---|---|---|
| `quota.plan` | `free` · `pro` · `enterprise` · `comped` | The allowance shown, and whether **Upgrade to Pro** renders |
| `quota.billing_state` | `trial` · `active` · `past_due` · `canceled` | Dunning banners. **Orthogonal to `plan`** — see below |
| `quota.included_items` | int | The plan's allowance before credits |
| `quota.credit_balance` | int | Purchased credits still unspent. **Added to** the allowance |
| `quota.items_used` | int | Append-only count of items PRODUCED. Never decreases — not on delete |
| `quota.items_remaining` | int | **Server-computed headroom.** Render it; do NOT recompute it from included + credits − used, or the meter will disagree with the backend the moment credit consumption changes |
| `quota.period_end` | ISO date | “Renews…” line; also when `items_used` resets |

**`billing_state` is orthogonal to `plan`, and that is the point.** A failed card
leaves the account on `pro` and moves it to `past_due`, so the UI warns and
nothing locks: claims, exports and the item allowance all keep working while
Stripe retries. Never infer one field from the other, and never gate work on
`billing_state`.

**Settling a credit purchase reads `credit_balance`, not `items_remaining`.**
Remaining also moves when items are produced, so a claim finishing while the
customer was at Stripe would report a purchase that never happened.

### Event → state

| Stripe event | Backend does | `GET /v1/me` becomes | UI result |
|---|---|---|---|
| `checkout.session.completed` (mode `subscription`) | Create the subscription; move the account to Pro | `plan: "pro"`, `billing_state: "active"`, `items.included: 2000`, `period_end` set | Meter flips 250 → 2,000 and drops the "free tier" label; **Upgrade to Pro** disappears; truncation alert clears once the held photos are re-run |
| `checkout.session.completed` (mode `payment`) | Grant the credit block, keyed on the event id | `items.credits` += block | Meter shows `included + credits`; **not** a plan change — `plan` is untouched, and this must stay out of upgrade metrics (fire `credits_purchased`, not `plan_upgraded`) |
| `invoice.paid` (renewal) | Roll the period | `period_end` advances; `items.used` resets to 0 | Meter resets. **`items.credits` does NOT reset** — credits are bought, not granted, so they carry over |
| `invoice.payment_failed` | Start dunning; do not cut access yet | `billing_state: "past_due"` | Warning banner. Work continues — never lock a claim mid-edit over billing |
| `customer.subscription.deleted` (dunning exhausted or cancelled) | End the subscription | `plan: "free"`, `billing_state: "canceled"`, `items.included: 250` | Account returns to the free tier. **Nothing is deleted** (rule 15) — claims, worksheets and exports stay downloadable |
| Credit checkout abandoned or card declined | Nothing. No session completion, no grant | unchanged | Nothing happens. A failed **one-time** purchase must never touch `plan`, `billing_state`, or the subscription |

### The distinction the test needs to prove

A failed **subscription** payment and a failed **credit** purchase are not the
same failure and must not share a code path:

- **Subscription failure is a relationship problem.** It has dunning, it emails
  (`emails/09-payment-failed.html`), it degrades the account after retries, and
  it eventually changes `plan`. It is never silent.
- **Credit-purchase failure is a transaction problem.** There is no dunning, no
  email, no account change, and no effect on Pro. The customer simply did not
  buy credits; the modal shows the error and they can retry. If a declined
  credit card ever moves `billing_state`, that is a bug.

### Already-hit edges worth asserting in the run

1. **Credits bought while already over the allowance.** `items.used` may exceed
   `included + credits` at the moment of purchase; the meter must show the new
   allowance and the reduced overage, not clamp to 100% or go negative.
2. **Upgrade while truncated.** RESOLVED: the promote session is resumable, so
   the UI drives it. Once the account has headroom the alert offers **Process
   remaining photos**, which re-fires the SAME `POST /v1/claims/{id}/staging/process`
   with no body; the backend skips what it already promoted and processes the
   remainder. No resume endpoint, and no list of held photos is sent. Assert in
   the run that a partial headroom (fewer items of room than are held) processes
   what fits and re-truncates cleanly rather than erroring.
3. **Comped accounts** (`plan: "comped"`) receive no Stripe events at all. They
   must not fall into any dunning or downgrade path.
4. **Double-submit.** Both checkout buttons disable in flight, but the backend
   should key on an idempotency header too — two completed sessions is two real
   charges.

## Global chrome (all authenticated pages)
| Control | State | Production behavior |
|---|---|---|
| Top-nav tabs (New claim / My claims / Exports / Settings) | ➡️ | Route to each section |
| Avatar (initials) menu → Profile / Settings / Sign out | ✅ | Menu opens; items route; Sign out ends session |
| Notification bell | 🎭 | Open notifications panel (backend feed) |
| Kevin wordmark | ➡️ | Home / claims dashboard |

## Owner admin console (64–72) — heavily wired this pass
| Page | Control | State | Production behavior |
|---|---|---|---|
| 64 Overview | KPI cards (Active/Trials/Past due) | ✅→➡️ | Link to Accounts filtered by `?status=` |
| 64 | MRR KPI + "Revenue →" | ➡️ | Revenue page |
| 64 | Pipeline "Error queue" row + "System →" | ➡️ | System page |
| 64 | MRR chart | ✅ | Bars/label derive from summed account MRR |
| 64 | Recent-activity rows | ➡️ | Account detail |
| 65 Accounts | Search / filter chips | ✅ | Client filter; reads `?status=` on load |
| 65 | Row click | ➡️ | Account detail |
| 65 | Export CSV | 🔌 | Server CSV of filtered set |
| 66 Account detail | ⋯ overflow (reset pw, resend invite, export data, note, transfer owner) | 🎭 | Each wires to backend action |
| 66 | Suspend / Refund / Cancel (danger zone) | 🔌 | Billing + account state mutations |
| 66 | Comp account → modal (level/expiry/reason) → Comped state; End comp | ✅ | POST billing_state=comped {plan,until,reason}; exclude from MRR; audit-log entry |
| 67 Revenue | Failed-payment "Retry" | 🔌 | Re-run charge via processor |
| 68 Content/CMS | Edit block → draft → publish | 🔌 | CMS write + version history |
| 69 Platform | Pricing-source weights, depr tables, flags | 🔌 | Global config writes |
| 70 Support | Connected-inbox **Reconnect** / **Inbox settings** | ✅ (drawer) → 🔌 | Google OAuth (Gmail) connect/disconnect + inbox opts |
| 70 | Ticket row click → drawer, reply, resolve | ✅ → 🔌 | Reply sends email from support@kevin.co; status writes |
| 70 | New ticket | ✅ (drawer) → 🔌 | Create ticket record |
| 70 | KPI Open/Waiting | ✅ | Derived from ticket list; median/resolved are backend aggregates |
| 70 | Look up an audit log | 🔌 | Opens account audit log (read-only) |
| 71 Staff | Row click → member drawer (role radios, remove) | ✅ → 🔌 | Role/permission + removal writes |
| 71 | Roles "Edit" → role drawer | ✅ → 🔌 | Edit role scopes |
| 71 | Invite staff | ✅ (drawer) → 🔌 | Email invite; entered email becomes login |
| 72 System | Service rows → service drawer (components + resolve) | ✅ | Live health from monitoring |
| 72 | Incident rows / degraded → incident drawer | ✅ | Live incident timeline |
| 72 | Error queue Retry / Retry all | ✅ (state) → 🔌 | Re-run failed pipeline stage; 3× → blocked |

## Core claim loop
| Page | Control | State | Production behavior |
|---|---|---|---|
| 01 My claims | Open → | ➡️ | Open claim (worksheet/processing per status) |
| 01 My claims | **Quota truncation alert** (`ClaimTruncationAlert`) | ✅ renders from payload | Shown whenever the ingest response carries `truncated: true`; reads `dropped_count` / `processed_count` verbatim (rule 9c). **Non-dismissible by design** — it clears when quota is restored and the held photos process, not when the adjuster acknowledges it. Never infer truncation by comparing counts. **Hidden on the demo dashboard**: the canonical account is Pro at 921 of 2,000, so it has 1,079 items of headroom and cannot truncate — seeding it there would print numbers contradicting the meter and the claim rows. |
| 20 Edge states | Panel **09 · Quota truncation** | ✅ | The same component, fed the case that actually occurs: free tier, 250 allowance, 57 already spent, a 300-photo shoot → 193 priced, 107 held. Numbers are DERIVED by `buildTruncation()` (`processed = min(attempted, remaining)`), never picked. |
| 01 My claims | Alert **Process remaining photos** | ✅ LIVE | Appears only once the account has headroom (`items` remaining > 0) — offering it at zero quota would just fail on the adjuster. Re-fires `KevinAPI.stagingProcess(claim_id)` → `POST /v1/claims/{id}/staging/process`, **no body**: the session is resumable and the backend already knows which photos it skipped. On success the alert flips to a mint confirmation (`role="status"`). |
| 01 My claims | Alert **Add credits** | ✅ LIVE | Same modal as Billing. Production: Stripe one-time charge for the block, then re-run the held photos. |
| 01 My claims | Alert **Upgrade to Pro** (`UpgradeProButton`) | ✅ LIVE | Production: in-app upgrade → `POST /v1/billing/checkout`, then re-run the held photos. |
| 01 | Row ⋯ (Open/Preview/Duplicate/Export/Print) | ✅ (Duplicate+Export modals) / 🔌 rest | Duplicate=new claim w/ new name; Export=save-as .pdf/.xlsx; Print |
| 01 | **Mark closed** / **Reopen claim** | ✅ LIVE | Toggles `closed` ↔ `open` in the roster. Hidden entirely while the claim is archived — unarchive is the move that brings it back, and offering both reads as two ways to do one thing. Disabled while work is in flight. |
| 01 | **Archive** → confirm modal | ✅ LIVE | Sets `archived`; the claim leaves the active list and stays reachable under the **Archived** filter with everything intact (rule 15). Confirm was previously inert — the button had no handler at all. |
| 01 | **Unarchive** | ✅ LIVE | Returns an archived claim to `open`. **No confirm** — it is reversible and additive, unlike archive, which changes what the active list shows. Only rendered when the claim is archived. |
| 01 | **Delete** → type-DELETE confirm | ✅ LIVE | Removes the claim from the roster. Permanent and always available — it is the customer's account (rule 15); the typed confirm is the guard, not a policy gate. Confirm was previously inert. |
| 01 | Status badge picker | ✅ LIVE | Offers processing/review/open/closed only. `archived` is deliberately NOT in the picker — archiving is an action with a confirm, not a status you slide to. |
| — | **Production contract for all four** | 🔌 | Close/reopen/archive/unarchive are **idempotent no-body POSTs**; the response carries the derived status AFTER the change. Apply it verbatim — never re-derive the status client-side. `?status=archived` reaches archived claims. |
| 12 Claim overview | **Whole screen** (`OverviewPage`, `/claims/:id/overview`) | ✅ LIVE | Built. Header meta + the five stats read the claim payload verbatim (`total_rcv`/`total_acv`/`total_depreciation` are server-computed sums — never re-added from rows). Class breakdown, highest-value and the attention strip derive from `GET /v1/claim_items?claim_id=`. |
| 12 | Attention strip | ✅ LIVE | Counts **unpriced lines only** (`needs_manual` or null RCV). The prototype also counted missing model numbers; on the first real claim that read "51 of 52 items need attention" because soft goods have no model number to be missing. Model coverage moved to a neutral row in *Where this claim stands*. |
| 12 | **N photos still in staging** strip | ✅ LIVE | Rule 22(e): staged photos have produced no line items, so they are excluded from every count above and named separately. Links to staging. |
| 12 | Items-by-class card | ✅ LIVE | `needs_manual` classes count toward the item tally and contribute $0 (rule 12), tagged `N unpriced` in **quiet**, never amber — the payload carries no special-limits flag and deriving one from `category` is the bug rule 20 names. Tail collapses past 12 classes, keeping its own count and sum so the card still foots. |
| 12 | Photos card | ✅ LIVE | Renders the same buckets the gallery filters by (one `stateFacets()` call), so the two screens cannot drift. The design's *Photos by room* card is deliberately NOT ported: every photo comes back `room: null` and the prototype filled the card by distributing the claim's photo count across rooms by largest remainder — a plausible-looking fiction. |
| 12 | Add photos · Import a list · ⋯ lifecycle · Open worksheet | ✅ LIVE | Staging, written import, `ClaimStateMenu`, worksheet. |
| 16 Claim photos | **Whole screen** (`PhotosPage`, `/claims/:id/photos`) | ✅ LIVE | Built on `GET /v1/claims/{id}/photos` (≤500/page). The payload carries no `image_url`, filename, timestamp, device or GPS — thumbnails come from `GET /v1/staging/photos/thumbnails?ids=` via the shared `useThumb` (IntersectionObserver, ≤100 ids/request, cached per id). |
| 16 | Left facets | ✅ LIVE | Three real buckets, not the prototype's matched/unmatched/low-confidence/scene/duplicate — none of those is a field on this payload. **`state` alone is ambiguous**: a photo unlinked from a row comes back `state: 'staged', status: 'promoted'`, so `bucketOf()` splits *Waiting in staging* (`clustered`, never processed) from *Backing nothing* (`promoted`, or truly unattached). |
| 16 | Room facet | ✅ LIVE (empty-state) | Renders only when the claim has rooms. It never does today — nothing sends the per-batch `room` at upload (backlog #8) — so it explains that instead of showing one bucket called "—". |
| 16 | Search | ✅ LIVE | Matches description / make / model / class / room / note / photo id. |
| 16 | Grid tile | ✅ LIVE | Badge reads `1 item` or `—`: **never a count above 1** (rule 1). `N frames` marks an item backed by several photos — the reverse direction, which is allowed. |
| 16 | Timeline / Map toggles | 🚫 disabled | Kept disabled as designed: no capture timestamp and no GPS on the payload. Tooltips say so. |
| 16 | Detail panel | ✅ LIVE | Joins the photo to its line for description, make/model, confidence and tax-inclusive RCV (`—` when unpriced, rule 12). *Frame N of M* and *Session N* only render when they have a value. |
| 16 | **Unlink from this line** | ✅ LIVE | `DELETE /v1/claim_items/{row_id}/photos`. Replaces the design's **Delete photo** + "deleting is permanent" modal, which describes something the API does not do: there is no delete for a promoted photo, and in a property claim evidence is excluded, never destroyed (rule 22). Verified live — primary thumbnail preserved, RCV untouched. Only rendered on a photo that backs a line. |
| 16 | Full-screen viewer | ✅ LIVE | ←/→/Esc plus the header arrows, paging within the current filter. |
| 03 Intake | Begin processing | ➡️ | → Photo staging |
| 03 | Depreciation schedule dropdown + "Add new" modal | ✅ | Persist schedule to claim; add to library |
| 03 | Add-schedule modal — editable class×age rate grid (24 classes × 6 brackets, prefilled from standard, "Reset to standard") | ✅ | Persist full custom rate table to schedule library |
| 03 | Tax / condition dropdowns | ✅ | Persist to claim settings |
| 73 Staging | Select → Group / Ungroup / Skip; tally | ✅ | Persists groupings; feeds processing |
| 73 | Group selected / Ungroup (merge + split overrides) | ✅ | Adjuster override of the backend's proposed sets |
| 73 | + Note / Add note to selection (`user_note`, ≤120 chars) | ✅ | Attached to the set container; pre-processing only |
| 73 | Start processing | ➡️ | `POST /claims/:id/photo-sets` {set_id, photos, skip, user_note} → Vision |
| 11 | Add a note for this item (mobile) | ✅ | Same `user_note` payload on the current capture set |
| 04 Processing | **The whole screen is a scripted 90s animation** — no upload, no Vision call, no job observed. Every counter, stage, ETA and feed row is derived from elapsed wall time, and it loops. | ⚠️ REPLACE | Bind to real job progress: WebSocket subscription (preferred) or polling. progress/stage → server stage+%, counters → server counts, feed → items as emitted, "Open worksheet" gated on completion not a timer. Keep the visuals, replace the clock. See the boundary comment at the top of `components/processing.jsx`. |
| 05 Worksheet | Cell edits, class dropdown, depr recalc (server-owned: `POST /claim_items/:id` returns the authoritative %), RCV popover, lightbox, reprice, filter, group, column resize | ✅ | Persist row edits; reprice hits `POST /reprice` |
| 05 | RCV cell edit (priced row) | ✅ | Sends `{rcv}` alone — the BACKEND recomputes ACV from age + depreciation rules and returns the four line totals; UI applies verbatim, zero client ACV math. Explicit ACV typed too → send `{rcv, acv}`, stored exactly as typed (manual math never overwritten). |
| 05 | Unpriced (`needs_manual`) row → RCV cell is blank + editable, no badge | ✅ | Type a value → `PATCH /v1/claim_items/{row_id}/override` — `override_reason` OPTIONAL (3674060) — never auto-fill a default ("Adjuster manual valuation" on every row is uniform noise); a free-text reason field is offered, empty otherwise; if sent, min 3 chars or 422. Adjuster-facing only — stored on the row + audit event, never in the export, money `rcv`/`acv` ≥ 0 with `acv > rcv` → 422 (checked against effective values), accepts basis fields + worksheet fields (room/make/model/desc/qty; nothing implicitly nulled), `extra="forbid"` so stray keys 422. Sets `valuationBasis: manual`, clears `needsManual`, tags row **Manual** |
| 05 | **Link** column + RCV popover comps | ✅ | Render `alternative_sources` `[{title, source, price, link}]`; column href = median offer's `link`, popover lists all three. Raw URLs, no snapshot |
| 05 | Bulk **Re-categorize** (menu → sets class on selection, each row goes `depPending` then takes the server % ) | ✅ | `PATCH /v1/claim_items` batch + per-row depreciation recalc |
| 05 | Bulk **Delete** (confirm popover → removes rows, clears selection) | ✅ LIVE (7440c90/63f0bd2) | `DELETE /v1/claim_items` `{item_ids}` (1–500) → `{deleted, photos_detached}`. Hard delete, unowned ids skipped (compare `deleted` to sent = stale-selection tell). NO photo ever deleted — surface "N photos kept". Recovery: detached photos land in `GET …/photos?state=unattached` and re-attach via `POST …/{row_id}/photos` `{photo_ids}` (plural = reuse; singular `/photo` = new upload). |
| 05 | **Depr % manual override** (grid cell) | ✅ wired | ONE server path: `PATCH /v1/claim_items/{row_id}/override` `{ dep_manual: 0.55 }` — a FRACTION 0–1 (sending 55 = 5500% = 422; the % cell divides by 100 out, multiplies in). Never send `depreciation_method` alongside — `dep_manual` sets `custom` automatically. Server recomputes and returns all four line totals; UI applies verbatim, incl. the Depr $ preview. Lock persists across later age/class/RCV edits (80f8831 — rides with ede87f3, not live until the Railway deploy). Release is EXPLICIT: popover's "Use the schedule instead" sends `depreciation_method: "straight_line"` — never a null rate. Same contract on the sample claim (same Worksheet component). |
| 05 | Item panel **Edit & re-price** (desc + make + model) | ✅ | ONE atomic call (backend 673e5e1): `POST …/reprice` `{query, category, make_mfr, model_number, description}` — the server persists identity in the same write as the status flip (no PATCH-first race). query = UI-composed "make model desc", 3–200 verbatim — NEVER sliced mid-token: over 200 the description tail trims at a word boundary and the panel shows the exact trimmed string ("priced from: …"). make/model ≤200, description ≤500 (422 over). Omitted = untouched, ""/null = cleared. Response returns money + recomputed line totals; UI applies verbatim. DEPLOY PAIRING: 673e5e1 (identity fields accepted) and 4b50292 (unknown keys → 422) ship together — against a backend with 4b50292 but not 673e5e1, `make_mfr` would 422 instead of being ignored. Deploy main, never cherry-pick one. |
| 05 | Item panel **History** (Show/Hide) | ✅ | Lazy `GET /v1/claim_items/{row_id}/events` on first expand. Branch on event_type (c70e9cc): `priced`/worker = "Searched — query", `repriced`/user = "Refined the query — old → new" (diff rendered), `completed` = "Priced at $ — basis, N% confidence". In-app only — lkq/bucket_used never export. |
| 26 Mobile capture | **ROOM** mode + room sheet | ✅ | Sets the session's room tag (free text + recent chips); rides the upload as the per-BATCH `room` field → worksheet Room/Area at promote. Clear = untagged batch. |
| 05 | Item panel **frame pager** (photo sets) | ✅ | Pages through `photos[]` from `GET /v1/claim_items/{row_id}` (primary first); frames fetched via the batch thumbnail endpoint; `[]` → fall back to `image_url`. Per-frame note/room in the caption. |
| 05 | **Add item** / press Enter on the last row | ✅ | Appends a blank editable row, scrolls to it, focuses first input. Persists via `POST …/items/bulk` (one-row list) — there is no bare `POST /v1/claim_items`; see the CLIENT-ONLY row below |
| 05 | Export claim | ➡️ | → Export review (06) |
| 06 Export | Format cards (Xactimate / PDF / Generic) · Include toggles · Delivery radio | ✅ | Client state only — drives gating, payload size and which file the buttons request |
| 12 Overview / 05 Worksheet | **Add photos** | ➡️ 03 `?claim=:id` | Opens intake in **append mode** — claim-details form hidden (the claim owns those values; an editable copy would fork them), header reads "Add photos to this claim", breadcrumb back to the claim, and the lede states the next line number. Without the param it is the normal new-claim page. Staging scopes to the new batch, numbering continues, dedupe spans the whole claim (rule 22) |
| 12 Claim overview / 03 Intake | **Import a list** / **Import a written list** | ➡️ 75 | Entry points for a total-loss inventory that arrives as a document rather than photographs |
| 75 Written import | **Choose file** / drop | 🔌 | `POST /v1/claims/:id/items/parse` (multipart, field `file`). **Server-side on purpose** — real total-loss inventories arrive as PDFs and a browser parser cannot read them. Do NOT add PapaParse/SheetJS. .pdf/.csv/.xlsx/.xls, 20 MB. 415/400/413/422 surface as copy |
| 75 Written import | **Column mapping** | ✅ wired | One screen for every format. `suggested_mapping` is partial by design — unrecognised headers stay blank rather than guessed. A PDF arrives pre-filled but the step is still SHOWN so the adjuster confirms. Only `description` required; `room` stays its own field because the description doubles as the search query. **`make_mfr` and `model_number` are optional mapping targets** — additive, and worth mapping when present: a described item otherwise lacks the brand a photo would have given, and an exact model number narrows pricing more than any other field |
| 75 Written import | **Heading removal** | ✅ wired | Rows with `likely_heading` are PRE-SELECTED for removal, never auto-dropped — we flag, the adjuster confirms. A heading left in prices as property (WALL ART/DÉCOR did, at $236.39) |
| 75 Written import | **Preview import** | 🔌 | Rows render `composed_description` — the server-composed `make_mfr + model_number + description` string the pricing engine actually searches. Never show the raw description cell alone; it hides the identity the adjuster just mapped. `POST …/items/bulk/preview` — creates nothing, spends nothing, up to 5,000 rows in one call. ⚠️ `price:false` on `…/items/bulk` is NOT a dry run: it still inserts every row, so using it as a pre-flight creates the inventory twice |
| 75 Written import | **Import N items** | 🔌 | `POST …/items/bulk`, **hard cap 500 rows** per request in every mode. Sequential chunks with progress; a mid-run failure resumes from the failed batch and never re-sends completed ones. Confirmation shows `estimated_searches` (2 per priced item), not the row count |
| 75 Written import | **Add a single item** | 🔌 | Same four fields, posts a one-row list to `…/items/bulk` |
| 05 Worksheet | **Add item** (inline row) | ⚠️ CLIENT-ONLY | Appends a local row and posts nothing — there was no endpoint that created an item without a photo until `…/items/bulk` shipped. Point it there |
| 73 Staging | **Group by capture time** (was "Group these for me") | 🔌 | `POST /staging/cluster/remainder` — the SAME timestamp + EXIF-proximity clusterer as the initial pass, **not** vision: staging is pre-Vision (rule 23) and nothing here knows what a photo shows. Named for the mechanism so it does not promise like-kind image matching. Appends only; never touches existing sets |
| 73 Staging | **Add photos** (action bar) | ✅ wired | Real file picker. New photos land as their own single-photo sets — merge them if they belong together. Avoids sending the adjuster back to intake mid-review |
| 73 Staging | **Loose photos render as ordinary cards** | ✅ wired | A photo the clusterer left with `group_key = NULL` appears in the grid as a set of one with an amber edge, so merge / note / exclude all work through the controls already learned. There is **no separate assign sheet** — that was a second vocabulary for what the grid already does |
| 73 Staging | **Unassigned photos tray** | ✅ wired | Renders only when `ungrouped_photos` holds photos with `status === "extracted"`. Real states are **`uploaded` → `extracted` → `clustered` → `promoted`** — the pending one is `uploaded`, and `status` must be present on `StagingPhotoProposal` for this filter to work at all. Late uploads arrive with `group_key = NULL` while still extracting — the frontend filters on status, because a photo the clusterer has not tried yet must not prompt action. It drops into the tray the moment extraction finishes; the count updates in place without stealing focus. Photos render inline as real thumbnails, not ids |
| 73 Staging | **Group by capture time** (was "Cluster remaining") | ✅ wired | `POST /staging/cluster/remainder` — groups ONLY the loose photos and APPENDS the new sets. Never call `/staging/cluster` after staging has been touched: it deletes and rebuilds every group, silently discarding manual merges |
| 73 Staging | **Reset to proposed sets** | ✅ wired | `POST …/staging/reset` rebuilds every group. Confirms first when any set carries an adjuster-authored note (notes don't set `manually_edited`, so the backend fires no 409 — the warning is the UI's job). Photo notes survive; derived summaries return. |
| 73 Staging | **Merge note inheritance** | ✅ wired | Single-source only: one authored note carries forward as `adjuster`; merging 2+ authored sets falls back to the fused `derived` summary (no non-arbitrary winner). Not a failed save — photo notes untouched. |
| 73 Staging | **Begin processing** with loose photos | ✅ wired | Never blocked. Label carries the cost ("· 7 photos excluded"); one confirm offers *Cluster them first* / *Process without them*. Response `skipped_photos` is reconciled — excluded photos stay on the claim and are recorded in the audit log as **excluded, not deleted** |
| 05 Worksheet | **Price N** (bulk bar, appears when the selection holds hand-added rows with a description) | ✅ wired | NO bulk endpoint exists — `POST /claim_items/{id}/reprice` once per row, SEQUENTIAL (shares the /process 30/min limit; production honors 429 Retry-After between calls). Each row goes `pricePending` (shows the same quiet "Pricing" chip as deferred rows) and takes its OWN result: rcv, `alternative_sources`, `compsFetchedAt`. Rows still blank are skipped — the lookup keys off the description, and a photo is not a search term |
| 05 Item panel | **Add a photo** / drag-drop onto the photo pane | ✅ LIVE (822f79f) | `POST /v1/claim_items/{row_id}/photo` multipart `image`; 201 returns full `photos[]` (pager re-renders, no second fetch); thumbnails via batch endpoint. DUMB STORAGE — no Vision/re-valuation/money/event; copy must never imply pricing. First photo on imageless row = primary + grid thumb; later = extra evidence. Idempotent by content hash. 404/415/400/413/429 (shares /process 30-min)/502. Only on rows the adjuster added by hand (`valuationBasis: manual`, no barcode) — Kevin-identified rows already have a source capture. Real file picker + drop target; the URL rides on the row so the PDF and bundle export it. `POST /v1/claim_items/:id/photo` |
| 06 Export | .xlsx generation | 🔌 | **Static values only — no formulas.** Xactimate's importer breaks on them. Write every derived cell (Ext. Cost, RCV+Tax, $ Depr., ACV, totals) as the computed number |
| 06 Export | **Download inventory** | 🔌 | `POST /v1/claims/:id/export {format}` → server generates ONE file and returns a download URL. `xactimate` → **.xlsx** written into the XactContents import template, columns exactly per CLAUDE.md rule 17 (`# · Room/Area · Qty · Description · Make·Model · Unit Cost · Ext. Cost · Sales Tax · RCV + Tax · Age · % Depr. · $ Depr. · ACV`), Age as a bare number, null money coerced to `0.00`, no negative-zero. `pdf` → server-rendered **.pdf** of the document `74-PDF-inventory.html` renders, using the claim's `depreciation_method`. `csv` → **.csv**, same columns as the .xlsx. Photos/comps/notes are NOT included in xlsx or csv — the UI already disables them. |
| 06 Export | **Download bundle** | 🔌 | Same file **+ `photos/`** in a .zip. ⚠️ ~340 MB for the demo claim — build as an ASYNC job (queue → progress → email/notify when ready), not a synchronous click. |
| 06 Export | **Copy share link** | 🔌 | `POST /v1/claims/:id/share` → signed URL, 30-day expiry, revocable. Recipient sees the export only, never the app. |

## Recurring patterns (apply to EVERY page that has them)
| Pattern | Where | State | Production behavior |
|---|---|---|---|
| 02 Landing **Start free — 250 items** (hero + final CTA) | landing | ✅ wired | Prototype → `58-Account-create.html` via the `onStartTrial` prop (falls back to `onStartClaim` when a host doesn't pass it, so the design canvas is unaffected). The trial CTA is the paid-ads conversion event — capture the account before any work starts, never route it to a claim surface. The header's **Start a new claim** stays on `onStartClaim` → `00-Sign-in.html` for returning adjusters. Superseded note: PRODUCTION: if a session exists, go straight to `/claim/new` (intake); if not, sign-in → (new users) account create + onboarding → intake. Claims are auth-gated; the sample claim is the only unauthenticated claim surface. |
| 02 Landing **See a finished claim** (hero) | landing | ✅ wired | → `48-Sample-claim.html` — public, no auth. Relabelled from "Open a sample claim" in the Aug 2026 funnel pass; same handler. |
| 02 Landing **MktShot** screenshot slots (×3) | landing | — static (visual) | Not a control. Presentational frame in the visual-proof section; renders a labeled drop target when `src` is absent or 404s. All three filled: `staging-sets-2x.webp`, `worksheet-review-2x.webp`, `export-modal-2x.webp` — 1740px WebP downscaled from the ~3156px PNG originals, which are kept alongside. Frames take each image's own aspect ratio so nothing crops. |
| 58 Account-create — 3-step trial signup (account → verify email → add card) | signup | ✅ wired | Step 1: name/email/password/firm/worktype → `POST /v1/auth/signup`. Step 2: 6-digit code or magic link. Step 3 (legally load-bearing): disclosure block ABOVE the card field, Stripe Elements SetupIntent (card saved, $0 charged), TWO separate unchecked consents (auto-renewal · terms+privacy) stored as a consent record; Subscription created with trial_period_days=8; EMAIL 1 fires immediately → 59-Onboarding, app shows "Free trial · N days left · Manage" banner. Day 4 EMAIL 2 reminder; day 8 charge $249 → EMAIL 3 receipt; failure → EMAIL 4 + 3 retries over 7 days → suspend. |
| Marketing/public **Start a claim / Start an estate** CTAs | landing, pricing, product, segments, docs, watch-demo | ✅ wired | Gated: → `58-Account-create.html` (landing routes to `00-Sign-in.html` via its page wrapper). Public visitors are never dropped straight into `03-Intake` — that entry is for signed-in users (dashboard "New claim"). |
| 13 Exports-history — list rows (click selects → detail), filter chips (All/Downloaded/Link shared/Superseded), **Download again** (re-downloads the STORED snapshot verbatim — never rebuilt), **New export of this claim →** (→ 06 export modal; produces the next version) | exports | ✅ wired | `GET /v1/claims/{id}/export` history; statuses only downloaded/shared/superseded — Kevin never sends to carriers (rule 4) and has no acknowledgement function; bundle = worksheet snapshot + photos only. |
| 18 Notifications — category filters (live, derived counts), row click marks read, **Mark all read** (both surfaces), CTA links (worksheet/exports/settings), **Notification settings** → 31 | inbox | ✅ wired | `GET /v1/notifications`; categories processing/shares/flags/pricing/system — no team events on Pro (Enterprise-only) and no carrier-cap evaluation copy (rule 6). |
| 27 Mobile-pair — back ‹ / **Cancel** → 26 sign-in, **Pair to this claim** → 11 capture | mobile | ✅ wired | Production: QR scan resolves `kvn-pair-*` token → `POST /v1/pair` binds the phone to the open desktop claim; pairing only grants photo upload, never edit/export. Scan state is a static mock (camera feature). |
| 12 Claim-overview — **From phone** (QR modal: mint on open, 2-min countdown, expired → regenerate, close ✕/backdrop) | pairing | ✅ wired | Backend-agreed design: REUSE the `claim_shares` primitive (audience: `capture`) — one token-resolution path, hashed at rest, expiry + revocation for free. TWO clocks: handoff QR token ~2 min; the REDEEMED capture credential gets its own long lifetime (a walk-through is 20+ min; 296-photo upload measured ~9.5 min) — bounded + revocable, never 2 min. Bind to the CLAIM, not a staging session (a session processed mid-capture would strand the phone; upload resolves the active session as today). Scope = exactly two endpoints: `POST /staging/photos` AND `PATCH /staging/photos/{photo_id}` (per-photo notes don't ride the upload payload; strict bodies 422 extras). Uploads attribute to the ADJUSTER's owner uuid resolved from the token, not `user["sub"]`. Persist the redeemed credential client-side (or allow one re-fetch) so a phone reload doesn't force a walk back to the desktop. |
| 32 Business — **"Prepared with Kevin" footer** toggle (default ON) | branding | 🔌 | Account setting; controls the one-line footer credit on exported PDFs and share views. The document header always carries the FIRM's name/logo/colour, never Kevin's. |
| 65 Admin-accounts — **Export CSV** (downloads the FILTERED rows: business/owner/email/plan/status/MRR/age/LTV/claims/joined/last-active), Age + Lifetime-value columns (seed derives LTV as months × MRR; production = sum of paid invoices) | admin | ✅ wired | `GET /v1/admin/accounts?format=csv` in production. |
| 20 Edge-states 07/08 — **Update card & pay** / **Resume subscription** | billing | 🔌 | Suspended = payment failed after 3 retries over 7 days (email 4); pay → immediate restore. Paused = customer-requested, no billing, no access; resume charges the card and starts a fresh cycle. Both keep all data. |
| 66 Admin account-detail — **Pause** (customer-requested billing hold) / **Suspend** (failed payment) | admin | 🔌 | `POST /v1/admin/accounts/{id}/pause` / `suspend` — both block sign-in, keep data; the sign-in edge states (20) tell the customer how to restore. |
| 31→Billing — invoice rows | billing | 🔌 | Each row downloads its PDF (`GET /v1/invoices/{id}.pdf`); receipts are also emailed on payment (email 10) to the billing address. "View invoices" in admin opens this same list scoped to the account. |
| 05/48 Worksheet — hand-priced rows carry NO visible "Manual" badge: once a unit cost is typed the line renders like any other (the manual/overridden fact stays on the payload + audit trail only, and NEVER reaches the .xlsx — XactContents parity columns only, rule 18/19) | worksheet | ✅ | — |
| 67 Admin-revenue — **One-time · 30d** KPI + "Services & paywall" card (done-for-you claims, client-share unlocks); Needs-attention **Open** → 66 | admin | ✅/🔌 | One-time revenue = Stripe one-time charges (paywall unlocks + service engagements), NEVER summed into MRR/ARR/NRR. **New invoice** static — Enterprise invoicing, engineering wires. |
| 76 Done-for-you — **Ask about on-site →** (→ 38 Contact; on-site photo capture is an additional-fee add-on quoted with the engagement) · **Send us a claim →** (→ 38 Contact) / **Talk it through first** (→ 51 Book call) / **See pricing →** (→ 21) | marketing | ✅ wired | Service engagements are quoted from photo count and billed one-time (admin Revenue "Services" stream); intake in production = contact form or call, files delivered into the customer account. |
| 05/48 Worksheet — RCV edit on a row WITH comps asks a one-line confirm ("clears the comparable sources"), then sends the price; server nulls `alternative_sources` + flips basis to manual. acv-only / category-only / age-only edits KEEP comps | worksheet | ✅ | PATCH …/override |
| 12 Claim-overview — **Holdback recovery** → 77 (production gate, per backend: show when claim is `exported` OR `closed` OR any line has a `claimed_rcv` — the last clause is the escape hatch; `exported` fires at Proof of Loss, before settlement) | recovery | ✅ | — |
| 48 Sample-claim — Recovery pane (third tab): HoldbackRecovery in sample mode, chrome hidden, three prefilled rows (documented / missing receipt / partial spend with unclaimed hint) | sample | ✅ | demo only — nothing saves |
| 77 Holdback-recovery — **Export**: Worksheet .xlsx / Worksheet PDF / Receipts .zip / Worksheet + receipts .zip | recovery | PDF button → 78 preview; rest static | `GET /v1/claims/{id}/holdback-export?format=xlsx\|pdf\|receipts\|zip` — xlsx/pdf = worksheet only (only claimed lines print, no-receipt lines print MISSING); receipts = receipt files zipped; zip = PDF worksheet + receipts in one archive. Receipt formats need ≥1 attached receipt; 409 with zero claimed lines. Repeatable — never stamps exported_at. Mock of the PDF: `78-Recovery-request-PDF.html` |
| 77 Holdback-recovery — **Replaced** count (qty>1 lines only; clamped 0..qty; default/null = whole line) | recovery | ✅ wired | `replaced_qty` SHIPPED (d3958eb): rides the same PATCH as `claimed_rcv`; on the list payload with pro-rated `recoverable` (no N+1). Semantics: null clears to whole-line · 0 is a real value and DROPS the line from the export (409 when none remain) · >qty = 422, writes nothing. Export has the Replaced column ("All" for whole-line) and Scheduled/ACV Paid/Recoverable tie out |
| 77 Holdback-recovery — "Back to insured" renders the payload's `recoverable` verbatim (on Summary + Detail; 0.0 never null; same function as the export — never derive client-side; can legitimately be < withheld); partial spend shows "$X unclaimed" hint; Actual-cost cell (`PATCH …/{row_id} {claimed_rcv}`; blank=null, 0 real, negative 422), receipt chip (`POST …/receipt`, one per line, replace on re-upload; PDFs allowed here only), status derives (Documented = claimed + receipt), totals derive (Withheld / Documented / Remaining from `depreciation_amount`) | recovery | ✅ wired | Export LIVE (b49cf91): `GET /v1/claims/{id}/holdback-export?format=xlsx|pdf` — repeatable (no exported_at stamp, no status flip); 409 with zero claimed lines surfaces as the disabled "No replaced items yet" state, never an error; claimed-without-receipt rows print MISSING and mirror as the amber "Missing — add receipt" chip; totals: Recoverable is a lesser-of sum and may legitimately be below Withheld — never flag the difference. Settled schedule read-only. |
| Marketing header **"Sign in"** | landing, pricing, product, about, contact, careers, segment, docs, legal, security | ✅ wired | `href` → `00-Sign-in.html` |
| Marketing header **"Start a new claim"** | same | ✅ wired | → `03-Intake.html` |
| Marketing top-nav links (Product / For Adjusters / For Estate Liquidators / Pricing / Docs) | landing | ✅ wired | Route to matching marketing page (other marketing pages: add nav hrefs if nav present) |
| Footer **Privacy / Terms** | all marketing | ➡️ | → `25-Legal-hub.html` (works) |
| Settings **left-nav items** (`k-side-item`) | settings-*, carrier-settings, team-management | ✅ wired | Anchor-route to each settings sub-page |
| **Save changes / Upload / Cancel / Update** (settings) | all settings pages | 🔌 | Persist to backend |
| Avatar menu | all authed | ✅ | works |

## Marketing
| Page | Control | State | Production behavior |
|---|---|---|---|
| 02 Landing | Hero **Start free — 250 items** / **See a finished claim** | ✅ | onStartClaim → intake; onSampleClaim → sample claim. PRODUCTION: the trial CTA is the paid-ads conversion event — point it at account-create (`58`), not intake. |
| 02 | Final CTA **Start your first claim** / **Book a 30-min call** | ✅ / 🔌 | first→intake; Book→ `51-Book-call.html` |
| 15 Request-access | **Request a quote** (primary) | ✅ | Submits the Enterprise form (`type="submit"`, prevented in-prototype). PRODUCTION: `POST` the lead to the CRM, then confirm on-page. It previously read "Request access" while pointing at `51-Book-call.html`, so the primary action skipped the form the page exists to collect. |
| 15 Request-access | **Book a call instead** (secondary) | ✅ | → `51-Book-call.html` |
| 21 Pricing | **Start with 250 free items** (Pro tier) | ✅ | → `58-Account-create.html`. Trial terms strip sits under the button — card verified, 7 days, one-click cancel. |
| 21 Pricing | **Talk to us about your desk** (Enterprise tier) | ✅ | → `38-Contact.html`. Relabelled from "Contact sales", which reads heavyweight to a small regional firm. |
| 21 Pricing | **MktSocialProof** / **MktROISection** | — shared render | Both defined in `landing.jsx`, exported on `window`, consumed by landing and pricing so testimonials, the settled-with roster and the ROI math cannot drift between pages. Pricing's wrapper loads `landing.jsx` before `pricing.jsx`. |
| 20 Product (37) | Hero **Start free — 250 items** / **See pricing** | ✅ | → `58-Account-create.html` / `21-Pricing.html`. The trial CTA is the paid-ads conversion event — account-create, never intake. |
| 20 Product (37) | Footer CTA **Start free — 250 items** / **See a finished claim** | ✅ | → `58-Account-create.html` / `48-Sample-claim.html` |
| 22 For-Adjusters | **MktShot** two-up | — static (visual) | `worksheet-review-2x.webp` + `export-modal-2x.webp`. Page also renders the shared `MktSocialProof` and `MktROISection` from `landing.jsx`. |
| 23 For-Estate-Liquidators | **MktShot** two-up | — static (visual) | `estate-worksheet-2x.webp` + `estate-pdf-sheet-2x.webp` — the estate worksheet and the client PDF, NOT the Xactimate export: an estate professional never touches XactContents. Social proof is `MktEstateProof` (defined in `segment-pages.jsx`), NOT the shared `MktSocialProof`, whose quotes and "Settled with" carrier roster are insurance-only. |
| 23 For-Estate-Liquidators | **MktEstateProof** (testimonials + "Used for" band) | — static (visual) | Defined in `segment-pages.jsx`, rendered only here. NOT the shared `MktSocialProof`: those quotes are insurance-only and sit under a "Settled with" carrier roster, which means nothing to a liquidator or a trust officer. The three quotes are PLACEHOLDER personas, accepted as such — replace before they carry ad traffic. The band deliberately lists WORK TYPES (probate, downsizing, consignment) rather than named auction houses or firms: a roster of third-party names would be an unverifiable claim about relationships, the same reason domain rule 3 bans invented carriers. |
| 23 For-Estate-Liquidators | **Start your first estate** / **Book a 30-min call** (closing CTA) | ✅ | → `58-Account-create.html` / `51-Book-call.html`. Heading and sub-line were the scrapped free-first-claim offer ("One estate. On us.") until it was replaced with the 7-day trial and the flat $249 — domain rule 9 says not to reintroduce it, in any wording. |
| 62 Estate worksheet | **Condition** and **Sale price** columns | — seed only | DESIGN-ONLY. No database columns exist for either; they render from `buildEstateRows` seed data and the payload carries nothing for them. Do not wire, and do not treat their absence from an API response as a bug. |
| 20 Product (37) | **MktShot** screenshot slots (×3) | — static (visual) | Not controls. Presentational frames (component defined in `landing.jsx`, read as `window.MktShot`); each renders a labeled drop target when `src` is absent or 404s. All three filled: `worksheet-review-2x.webp` (solo), `processing-live-anim.webp` + `export-modal-2x.webp` (two-up). The processing slot is an ANIMATED WebP — 1600×950, 14 frames, ~6.3s loop — converted from `processing-live.gif`, which stays in `assets/marketing/` as the source. |
| 21 Pricing | Tier CTAs (Pro **Start**, Enterprise **Talk to sales**) | 🔌 | Pro→intake/checkout; Enterprise→ `38-Contact.html` |
| 21 | Footer CTA **Start your first claim** / **Talk to sales** | 🔌 | intake / contact |
| 22 For-Adjusters / 23 For-Estate | Hero + CTA (**Start a claim/estate**, **Watch demo**, **See a sample inventory**, **Talk to an adjuster**, **Book a call**) | 🔌 | intake/estate; `52-Watch-demo`; sample; contact; `51-Book-call` |
| 38 Contact | **Send message** / inline **book a 30-minute call** | 🔌 | POST contact form; → book-call |
| 39 About | **See open roles** | 🔌 | → `53-Careers.html` |
| 40 Pricing-source (detail) | Back to Pricing sources; **Pause source**; **Force refresh** | 🔌 | ← settings-pricing; toggle/refresh source (admin/platform) |
| 03 Intake | **Cancel** | ➡️ 01 | Discards the draft claim and returns to the claims dashboard. Production: confirm first if photos are already uploading |
| 51 Book-call | **Calendly inline widget** (`.k-cal-embed[data-calendly-embed]`) | 🔌 | Replace the placeholder with Calendly's `<script src="assets.calendly.com/assets/external/widget.js">` + `<div class="calendly-inline-widget" data-url="calendly.com/kevin-co/30min">`. Calendly owns availability, timezones, the invite and reminders — do NOT build scheduling. Optional prefill via `?name=&email=` |
| 51 Book-call | Send us a note · kevin@kevin.co | ✅ | `href` → 38-Contact / `mailto:` |
| 40 Pricing-source | **Back to Pricing** · "Settings → Pricing" link | ✅ | `href` → 14-Settings-pricing.html |
| 40 Pricing-source | Stat strip — **two scopes, each labeled**: comps fetched today + items priced this month are PER-ACCOUNT; match rate + avg variance are PLATFORM-wide 30d rolling (one account is too small a sample to be meaningful). Keep the scope label on every cell | 🔌 | Read-only diagnostics from the comp-source health endpoint. **No config controls here** — valuation behavior is set once in Settings → Pricing so the two screens cannot disagree. Per-item comp history lives on the item drawer, not here |
| 36 Settings-API | **Enterprise-gated.** Pro renders a locked state (→ 15-Request-access / 21-Pricing); `plan="enterprise"` renders keys + webhooks. Rotate / Revoke / Create key / Add webhook / Logs / Edit | 🔌 | `/v1/api-keys`, `/v1/webhooks`. Events are Kevin lifecycle only — **no carrier submit endpoint** (rule 4). Do not offer API on Pro |
| 35 Settings-billing | **Plan-aware** — renders `plan="pro"` (flat $249), `"enterprise"` (invoiced, no card/cancel), or `"comped"` ($0, banner, no card/cancel). Never hardcode Pro/$249: the admin console can comp an account | 🔌 | Read the account's billing state; `BILLING_PLANS` in `settings-pages.jsx` stands in for it |
| 35 Settings-billing | **Manage subscription** / **Cancel plan** / **Update** card | ✅ LIVE | All three mint ONE `POST /v1/billing/portal` session and redirect; the portal owns card updates, cancellation and invoice history, so Kevin does not rebuild them. Disabled in flight; failures surface above the cards. Was: Stripe (or equivalent) customer portal session. Cancel keeps access through the paid period |
| 35 Settings-billing | Invoice row **download** | 🔌 | `GET /v1/invoices/:id.pdf` |
| 35 Settings-billing | **Line items** meter (`ItemUsageCard`) | ✅ derived | Used count is DERIVED from the claim roster, never typed in. `plan` selects the pool — `free` = 250 one-time (no reset, no clock), `pro` = 2,000 a billing month; `included` overrides for an Enterprise contract. Production: `GET /v1/usage/items`. |
| 35 Settings-billing | Meter **append-only note** | ✅ static copy | Rule 9c. States that deleting an item does not return quota. Do not remove — it is the cheapest support-ticket deflection on the page. |
| 35 Settings-billing | **Add credits** → `AddCreditsModal` | ✅ LIVE | Blocks of 250/500/1,000/2,500 at $0.20 an item (same rate as Pro overage). Buying credits is NOT a plan change — keep it out of upgrade metrics; fire `credits_purchased`. Production: `POST /v1/billing/credits/checkout`. |
| 35 Settings-billing | Credits modal **Cancel** / scrim / Esc | ✅ | All three close the modal. |
| 35 Settings-billing | **Upgrade to Pro** (free tier only, `UpgradeProButton`) | ✅ LIVE | `POST /v1/billing/checkout` → redirect. Goes straight to Stripe rather than bouncing a signed-in adjuster to the marketing pricing page. Only rendered on the free tier. Shared with the truncation alert so there is one implementation. |
| 35 Settings-billing | **Talk to us about Enterprise** / **Contact us** | ✅ | `href` → 15-Request-access / 38-Contact |
| 34 Settings-Xactimate | **Talk to us about Enterprise** / **See API docs** | ✅ | `href` → 15-Request-access / 24-Docs |
| 34 Settings-Xactimate | **Download sample** (xlsx / pdf / csv) | 🔌 | `GET /v1/samples/:format` — a small fixture inventory so a user can test their import before running a real claim. No OAuth, no connect flow: Kevin has no Xactimate integration (rule 2, rule 4) |
| 33 Settings-export-defaults | Format tiles · include checkboxes · delivery radios · filename pattern | 🔌 | `PATCH /v1/account/export-defaults`. These pre-fill the export modal; per-claim overrides always win. Photos/comps/notes/audit are PDF-and-bundle only — a .xlsx cannot carry them, so the modal greys them out for spreadsheet formats |
| 31 Settings-profile | First/last name + **Title** compose the PDF “Prepared by” line; the business legal name and licence come from 32. There is no per-claim preparer field — the signed-in user IS the preparer | 🔌 | `PATCH /v1/account/profile` |
| 32 Settings-business | Legal name, DBA, address, **licence #** and brand colour print in the PDF header. EIN, Type and Founded are record-keeping only and must NOT appear on an export | 🔌 |
| 32 Settings-business | Business detail + branding + default fields | 🔌 | `PATCH /v1/account/business`. Branding rides on PDF exports and share links only |
| 32 Settings-business | **Upload** logo | 🔌 | `POST /v1/account/logo` — SVG or PNG |
| 32 Settings-business | **Brand colour** swatches + native picker | ✅ picker / 🔌 persist | Sets `--pdf-accent` on the PDF inventory and the share-link header. Does NOT restyle app chrome. Persist on the account and inject as a CSS var at PDF render |
| 32 Settings-business | **Talk to us about Enterprise** | ✅ | `href` → 15-Request-access.html |
| 31–36 Settings (all) | **Save changes** / **Discard** in the shell save bar | 🔌 | `PATCH` the relevant account resource. Billing (35) and Xactimate (34) pass `save={false}` — nothing on them is editable here |
| 53 Careers | Role row · **kevin@kevin.co** | ✅ | `mailto:` with the role in the subject. No ATS — a 3-person company takes applications by email. Roles are CMS content (admin 68) |
| 24 Docs | Nav item → article (**44 articles across 8 sections**, all written) · full-text search · in-article TOC (scrolls to the heading) · prev/next pager | ✅ | Content is DATA in `docs-articles.jsx` + `-2` + `-3` (block tuples), rendered by `docs.jsx`. Lifts into GitBook or a CMS untouched — treat as CMS content (admin 68), not markup |
| 25 Legal-hub | section tabs (Privacy/Terms/DPA/etc.) | 🔌/✅ | In-page anchor or route |
| 41 Security | Breadcrumb **Back to My profile** · "My profile → Session timeout" link | ✅ | `href` → 31-Settings-profile.html |
| 41 Security | **Change password →** | 🔌 | `POST /v1/auth/password` — validate current, enforce strength + last-5 reuse block, then invalidate other sessions |
| 41 Security | **Register key** (passkey) | 🔌 | WebAuthn `navigator.credentials.create()` → `POST /v1/auth/passkeys`. No biometrics branding |
| 41 Security | Recovery codes **Download** / **Regenerate** | 🔌 | `GET`/`POST /v1/auth/recovery-codes` — regenerate invalidates the old set |
| 41 Security | Per-session **Sign out** · **Sign out all other sessions** | 🔌 | `DELETE /v1/auth/sessions/:id` and `/sessions?others=true` |
| 41 Security | **Save changes** (session timeout) | 🔌 | `PATCH /v1/account/security` |
| 41 Security | CTA / contact security | ✅ | → contact |
| 51 Book-call | scheduler embed | 🔌 | Calendar (Cal.com/Calendly) |
| 52 Watch-demo | video player | 🎭 | Real demo video |

## Auth
| Page | Control | State | Production behavior |
|---|---|---|---|
| 00 Sign-in | Email/password **Sign in** | 🔌 | Auth → claims dashboard |
| 00 | **Forgot?** | ➡️ | → `45-Forgot-password.html` (works) |
| 00 | Google sign-in | 🔌 | Google OAuth |
| 45 Forgot | **Send reset link** / Back to sign in | 🔌 / ➡️ | Email reset token |
| 46 Reset-sent | **Send another link** / Back to sign in | 🔌 / ➡️ | Resend |
| 47 Reset-password | **Set new password & sign in** | 🔌 | Set password, auth |
| 50 SSO sign-in | SSO continue | 🔌 | Enterprise SSO (if used) |
| 58 Account-create | Create account | 🔌 | Provision account → onboarding |
| 59 Onboarding | wizard steps / finish | ✅/🔌 | Save setup, → first claim |
| 49 Sign-out | confirm | ✅/🔌 | End session |

## Settings (31–36, Carrier 10, Team 19)
| Page | Control | State | Production behavior |
|---|---|---|---|
| 31 Profile | Security card rows → **Change** / **Manage** / **Manage** / **Sign out others** | ✅ | `href` → `41-Security.html#password` / `#two-factor` / `#passkeys` / `#sessions`. The card summarizes all four sections of 41 — keep them in sync |
| 31 Profile | **Upload new** avatar; field saves | 🔌 | `POST /v1/account/avatar`; `PATCH /v1/account/profile` |
| 31 Profile | **Request export** (Danger zone) | 🔌 | `POST /v1/account/data-export` — emails a link when the archive is ready. Everything the account holds: claims, items, photos, exports, audit logs |
| 31 Profile | **Delete account** (Danger zone) | 🔌 | Two-step: modal requiring the account email typed to confirm, then `DELETE /v1/account`. Permanent, and takes every claim with it. Must state that clearly before the second step — this is the most destructive control in the product |
| 32 Agency | logo **Upload**; **Talk to sales about Enterprise** | 🔌 | Upload; → contact. (Business identity now "Reyes Adjusting, LLC") |
| 33 Export-defaults | format cards (`k-format`); **Download sample** | 🔌 | Set default export format; sample file |
| 34 Integrations | Xactimate-friendly info; (no connect/sync) | 🎭 | Informational only — export .xlsx, user uploads to Xactimate |
| 35 Billing | **Manage subscription** / **Cancel plan** / **Update** card / invoice **download** | 🔌 | Stripe portal; cancel; update PM; invoice PDF |
| 35 | Storage & fair use meter (used / included, active vs archived split) | ✅ | Derived from `KEVIN_STORAGE`; production: GET /account/storage — sum of photo bytes, split by claim status (closed >90d = archived tier). No action, read-only |
| 36 API | **Rotate** / **Revoke** / **Create new key**; **Add webhook** / **Logs** / **Edit**; **Open API docs** | 🔌 | Key + webhook CRUD; docs link |
| 10 Carrier profiles | carrier card select; sub-tabs (depr/limits/export) | ✅ | works (client state) |
| 10 | **New carrier profile**; **Duplicate**; **Version history**; **Delete profile**; **Save changes**; **Import rate table (CSV)**; **Start from standard schedule**; **Import/Export**; **Edit** exclusion; **show all** | 🔌 | Profile CRUD, CSV import/export, versions |
| 19 Team | **Invite people** / **Send invites**; member ⋯; **Resend**; remove (trash) | 🔌 | Enterprise-only; invite/role/remove |

## Estate-sale worksheet (62)
| Control | State | Production behavior |
|---|---|---|
| Row select (checkbox) | ✅ | works |
| **Add item** / press Enter on last row | ✅ | Appends editable row |
| **Filter** (Room/Status/Condition/FMV) + **Search** | ✅ | works (client) |
| Cell edits (description, condition dropdown, FMV, status) | ✅ | Persist row |
| **Export inventory** dropdown → **PDF inventory** | ✅ | → `80-Estate-PDF.html` — estate client PDF (# · Room · Description · Make·Model · Condition · FMV source · FMV · Sale price; no insurance math). **Estate epic DEFERRED on backend** — confirmed route when unpaused: `GET /v1/claims/:id/export?format=pdf&mode=estate` (no `/estates` resource). V1 FMV = category-specific haircut off retail RCV from ACTIVE listings — never label sources as "sold comps" (false provenance). Condition + Sale price have no DB columns yet; design-only |
| **Export inventory** dropdown → **PDF inventory** | ✅ | → `80-Estate-PDF.html` — estate client PDF (# · Room · Description · Make·Model · Condition · FMV source · FMV · Sale price; no insurance math). **Estate epic DEFERRED on backend** — confirmed route when unpaused: `GET /v1/claims/:id/export?format=pdf&mode=estate` (no `/estates` resource). V1 FMV = category-specific haircut off retail RCV from ACTIVE listings — never label sources as "sold comps" (false provenance). Condition + Sale price have no DB columns yet; design-only |
| **Export inventory** → **CSV · .csv** | 🔌 | Same columns, plain CSV |

> Estate export deliberately does NOT use the insurance export modal (06). There is no Xactimate template, no photo bundle, no share link — an estate-sale pro just downloads the file. Do not route 62 to `06-Export-modal.html`.

## Mobile
| Page | Control | State | Production behavior |
|---|---|---|---|
| 11 Capture | Back / ⋯ | 🔌 | Nav / menu |
| 11 | Mode strip (SCAN BARCODE / PHOTO / ROOM) | 🎭 | Switch capture mode |
| 11 | Shutter / flash / flip | 🎭 | `<input capture>` shot; camera controls |
| 11 | **View all** / **Done — open on desktop** | 🔌 | Queue view; hand off to desktop session |
| 26 Mobile sign-in | sign in / pair | 🔌 | Auth / pairing token |
| 27 Mobile pair | pair-with-desktop | 🔌 | Pairing |
| 28 Mobile review | **PRE-VISION surface** (rule 21) — rows show filename, capture time, adjuster-picked room, and on-device duplicate/blur only. No item names, makes, models or special-limits flags: nothing is identified until Process runs | 🔌 | Renders the local capture session |
| 28 Mobile review | Filter chips (All / Untagged / Blurry / Duplicates) | 🔌 | Client-side filter of the session list |
| 28 Mobile review | **Assign room** / **Rename** per group · tap any row | ✅ | Opens a bottom sheet: free-text room plus recent-room chips. Assigning clears the "No room" state. Rooms are free text because houses have arbitrary names (same rule as the worksheet). Persist via `PATCH` on the capture record |
| 28 Mobile review | Stat strip — **uploaded** is the transfer state (photos move to the claim as you shoot, so it lags on bad signal); **to check** counts on-device duplicate + blurry detections | 🔌 | Upload progress from the client queue |
| 73 Staging | **Set list** (replaced the card grid) — every frame in a set renders inline, so the grouping is visible without opening anything. Click any frame → photo viewer with prev/next inside that set | ✅ | Thumbnails are placeholders; production renders the real captures |
| 73 Staging | **Split apart** (was "Ungroup") | ✅ | Children replace the parent **in place, in capture order** — they do not jump to the end or re-sort by filename. A merged note stays on the first child only |
| 73 Staging | **Don't process** / **Include** (was "Skip") | ✅ | Labels name the consequence. Excluded photos stay on the claim but produce no line item |
| 03 Intake | **Loss ZIP** → tax jurisdiction | ✅ | ZIP is the input of record; it resolves the jurisdiction and rate (`TAX_BY_ZIP` stands in for the lookup). An unrecognised ZIP shows "no jurisdiction on file" rather than keeping a stale rate — tax lands on every line |
| 03 Intake | **+ Add tax jurisdiction…** | 🔌 | Opens a dialog for name + rate, remembered against that ZIP. There is **no Xactimate jurisdiction lookup** — don't imply one |
| 03 Intake | ~~Processing settings (step 03)~~ **REMOVED** | — | Depreciation schedule comes from Settings → Business; condition is reference-only and never affects the depreciation math; comps-per-item and pricing region were not user-changeable. The add-schedule modal is parked in `intake.jsx`, unreachable by design |
| 03 Intake | **Upload & stage N photos →** (sticky bar) | ✅ | Starts a real chunked upload: one `uploadChunk` per 20-file batch, sequential, bar shows "Uploading batch 3 of 15" + a % ring. A 413 halves that chunk and retries it alone. Does NOT navigate — the adjuster stays and watches |
| 03 Intake | **Continue to staging →** | ➡️ 73 | Enabled once the FIRST chunk lands; the rest uploads behind them. Passes the remaining count so staging shows its background-upload banner |
| 03 Intake | **Choose files** / **Choose folder** / **Upload .zip** / drag-and-drop | ✅ wired | Dropping a FOLDER needs `webkitGetAsEntry()` + recursive `readEntries()` drained in a loop (it returns ≤100 per call) — `dataTransfer.files` alone yields only the directory name. | Real `<input type="file">` pickers and a drop target. The selection REPLACES the seed queue: rows, count, batch plan and per-photo size checks all derive from the actual FileList via `planUploadChunks`. A `.zip` runs through `expandZip`, which is a **real zip.js expansion** (loaded from CDN) — it reads the actual archive sequentially, filters OS junk, reports `junkSkipped`, and surfaces a read failure. Only the POST itself is stubbed | 🔌 | Client chunks the payload: `KevinAPI.planUploadChunks()` caps each POST at **20 files AND 65 MB** — the server accepts 50, but a ~160 MB chunk took >2 min and tripped a gateway **502**; 20/65 keeps every request under 60s, then `POST /v1/claims/{id}/staging/photos` per chunk. A **413** means halve that chunk and retry it alone — never the whole batch. UI reports one upload with a "batch N of M" pill; never make the adjuster chunk manually |
| 03 Intake | **Upload queue** — row per file, counts, % bars, GB readout, "batch N of M" | ⚠️ **SEED — must be replaced, not merely wired** | Every literal in `intake.jsx` (`TOTAL_FILES`, `filesDone`, `chunkDone`, the 10 `queueFiles` rows, the GB readout) is display sample only. Build from the real FileList + chunk responses: one row per selected file, status `queued → uploading % → stored \| already stored \| failed`; `storedTotal` = `accepted` + `rejected` entries with reason `duplicate`; `realFails` = the rest minus `undecodable_image`, which goes to `quietSkips`; GB = bytes sent / bytes selected. A 312-file drop renders 312 rows. The file carries a boundary comment naming every faked value |
| 03 Intake | **Rejected panel** · Retry these N | 🔌 | `reason` is a CLOSED enum (`unsupported_format` · `empty_file` · `oversized_photo` · `oversized_dimensions` · `undecodable_image` · `duplicate` · `storage_error`; no `truncated_file`), mapped to copy by `REJECT_COPY` in `intake.jsx` — never print a raw code. **`duplicate` is a SUCCESS, not a failure**: the photo is already stored in the session. It arrives in bulk after a 502 retry, so it reconciles into the "safely stored" count and must never appear in the red panel or the failed total. Duplicates arrive on **one channel only** — a `duplicate` reason code in `rejected[]`. There is no parallel `duplicates: []` array; two shapes for one condition forces the UI to sum them to state one number. Retry resends only those files |
| 03 Intake | **Quiet skip line** | 🔌 | `undecodable_image` is flagged `quiet` because it is how iOS `.AAE` edit-sidecars arrive — not a photo, and not something the adjuster can fix. Those collapse into one info line ("38 non-image files skipped"), NOT the red failure panel; a folder synced from a Mac routinely contains dozens. Archive junk filtered locally reports the same way |
| 05 Worksheet | **Retry N deferred** (bar appears only when capacity-parked items exist) | ✅ | `POST /v1/claim_items/retry-deferred {ids}` — re-queues every item whose `manual_reason` is `quota_exhausted` or `budget_exhausted`. Response says which priced; any still limited stay deferred |
| 05 Worksheet | Capacity-wait row state | 🔌 | `quota_exhausted` / `budget_exhausted` render a quiet pulsing "Pricing" chip, **not** the blank editable cell a real `needs_manual` gets and **not** an amber error — the service hit a SerpApi rate limit or spend cap and will re-price itself. Nothing is asked of the adjuster |
| 05 Worksheet | **Batch filter** | ✅ | Hidden unless the claim has **2+ processed** sessions — a one-option filter is clutter, and an in-staging batch has no rows to filter to. Changes what you SEE only; an export always covers the whole claim |
| 73 Staging | **Session scope banner** | 🔌 | Staging renders ONLY `CLAIM_INGEST.current`. Prior sessions are never re-staged and never renumbered; the banner states how many photos/items already exist and the line number new items continue from |
| 03 Intake | **Upload .zip** | 🔌 | Expanded **in the browser** with zip.js (`KevinAPI.expandZip`) — a 1 GB archive is never posted whole. **Extraction is SEQUENTIAL, upload is parallel**: a ZipReader holds a file position, so concurrent `getData()` on one reader corrupts the stream and zip.js reports "Overlapped entries / possible zip bomb" — a `for..of` with `await`, never `Promise.all`. If extraction must parallelise, each worker builds its OWN ZipReader over its own BlobReader slice. `__MACOSX/`, `.DS_Store`, `Thumbs.db`, `._*` filtered locally, then extracted photos feed the SAME 40-file/120 MB chunking pipeline as a folder drop |
| 73 Staging | **Lazy thumbnails** | 🔌 | The `/staging` poll carries NO signed image_url (minting 300 every 4s crashed the server). An IntersectionObserver (400px rootMargin) collects visible set ids → one batched `GET /v1/staging/photos/thumbnails?ids=`, cached per id, **capped at `THUMB_BATCH_MAX` (100) ids per request** — a fast scroll otherwise exceeds what the endpoint accepts. Skeleton until the URL lands. Do not put image_urls back in the poll |
| 73 Staging | Tally strip — **two scopes, each labelled**: photos uploaded and photo sets are FULL-CLAIM (162 → 148); multi-photo sets, marked skip and notes attached count only the sample of cards rendered below. Keep the scope label on every cell | 🔌 | Full-claim figures from the cluster job |
| 28 → 73 | Field note carry-in | 🔌 | Mobile notes are per-photo; the BACKEND fuses them into the set's derived note (`merge_notes`: " | ", deduped, 120-char cap) — the client never concatenates. Groups carry `note_source` (`derived` read-only / `adjuster` editable, ≤300 chars via `PATCH …/groups/{key}/note`; null restores derived). Staging shows the string in its note chip (title says "Written in the field") and it is editable before Process. **Never drop a note on merge, and never duplicate one on split** — a merged note stays on the first child only |
| 28 Mobile review | Per-row **⋯** | ✅ | Menu: Assign room · **Exclude from processing** (toggles to Include) · Delete. Excluded photos stay on the claim as context shots but produce no line item — labelled by consequence, never "skip", which reads as navigation. Rows carrying a `note` show a `.k-stage-notechip` (same chip as desktop staging) that taps through to the detail sheet |
| 28 Mobile review | Header **⋯** | ✅ | Session sheet: Remove duplicates · Remove blurry photos · Assign rooms to untagged · Discard session… |
| 28 Mobile review | **Discard this session…** | ✅ | Two-step: a confirm sheet naming the photo count, stating it cannot be undone and that photos already sent to the claim are unaffected. Never one-tap — a mis-tap in the field would lose a whole shoot |
| 28 Mobile review | Empty state (session discarded or nothing shot) | ✅ | Explains where photos come from and routes to 26-Mobile-capture. The process button is disabled at zero |
| 28 Mobile review | **Keep shooting** · back ‹ | ✅ | `href` → 26-Mobile-capture.html |
| 28 Mobile review | **Process N photos →** | 🔌 | `POST /v1/claims/:id/photo-sets` — submits the approved photos for identification. Distinct from uploading: uploading moves bytes, this starts the run. Excludes the duplicate/blurry rows |

## Utility / system
| Page | Control | State | Production behavior |
|---|---|---|---|
| 12 Claim overview | **Export** / **Open worksheet**; flag **Review →**; **Open photo gallery**; **View all**; **View full audit log**; My claims back | 🔌/➡️ | Export flow; → worksheet/photos/audit |
| 13 Exports history | segment tabs; **Sort**; row select; row ⋯; **Compare**; **Download bundle**; **Regenerate & resend** | ✅ (select) / 🔌 | Filter/sort; regenerate export |
| 16 Photos | tabs; filters; lightbox | ✅/🔌 | works (client), data from vision output |
| 17 Audit log | **Export audit log** | static (visual) | Downloads the event history as PDF/CSV. OPEN BACKEND QUESTION: the shipped events endpoint is item-scoped (GET /v1/claim_items/{row_id}/events) — a claim-wide export needs either a claim-level endpoint or a per-item aggregation pass |
| 17 Audit log | claim tabs; search; filter chips | 🔌 | Tabs route; server-side log query |
| 18 Notifications | category filter; **Mark all read**; **Notification settings**; item CTAs; bell | ✅ (filter) / 🔌 | Read state, settings, deep-links |
| 54 Add-item | **PARKED — do not build.** No screen links to this page; manual add happens inline on the worksheet (Add item / Enter on last row). Kept as a designed spare in case feedback asks for a form-based add with a photo. If revived: `POST /v1/claim_items`, return to the grid, new rows `valuationBasis:"manual"` and never auto-priced | ⏸ | — |
| 61 Claims-empty | greeting derives from clock + `session.user.firstName` | ✅ | Render from session; no fixed "Good morning, Mariana" |
| 61 Claims-empty | **New claim** / **Start your first claim →** | ✅ → `/claim/new` | Real links to 03-Intake |
| 61 Claims-empty | **Open a sample claim** | ✅ → `/claims/sample` | Read-only seeded demo claim (48) |
| 61 Claims-empty | **Watch the demo** / **Read the quick-start** / **Book onboarding** | ✅ → 52 / 24 / 51 | Help cards are anchors, not buttons |
| 60 Export-success | Artifact row 1 — **Download** `aria-label="Download Inventory spreadsheet (.xlsx, 84 KB)"` | 🔌 | `GET /v1/exports/:ref/artifacts/xlsx` — the XactContents-template spreadsheet |
| 60 Export-success | Artifact row 2 — **Download** `aria-label="Download PDF inventory (.pdf, 1.2 MB)"` | ➡️ 74 | Anchor to the PDF inventory. In production `GET /v1/exports/:ref/artifacts/pdf` |
| 60 Export-success | Artifact row 3 — **Download** `aria-label="Download Full bundle (.zip, 340 MB)"` | 🔌 | `GET /v1/exports/:ref/artifacts/zip` — spreadsheet + PDF + all photos + audit log |
| 60 Export-success | **Copy link** (share row) | 🔌 | `POST /v1/claims/:id/share` — signed, 30-day expiry, revocable, export-only view |
| 60 Export-success | **Back to claim** / **View all exports** | ✅ → 12 / 13 | Real links |
| 63 Export-failed | **Try export again** / **Back to worksheet** / **Contact support**; downloads disabled | 🔌 | Reached ONLY on a technical job failure (generation error, storage read failure, share-link mint failure) — **never** as a validation gate. Kevin does not decide when an adjuster is ready to export; unpriced rows and missing model numbers are surfaced on 06 and the adjuster proceeds if they choose. Retry re-queues the same export job; the reference ID links to the job log. |
| 74 PDF-inventory | print/download | 🔌 | Server-rendered PDF |
| 29 Share-claim | ⚠️ **FEATURE GAP (whole screen's link mode)** | — | Backend-confirmed: NO share-link route, snapshot table, expiry or redaction exists (design doc `future-client-share-paywall.md` only). The UI's snapshot-at-mint semantics below are the build spec. Invites/hand-off PATCH paths also unconfirmed. |
| 29 Share-claim | **Mode tabs** — Co-edit / Read-only link / Hand off | ✅ | Local view switch. Co-edit and Hand off are **Enterprise-only**; Pro sees the upgrade notice and only the link mode is usable |
| 29 Share-claim | Person rows (co-edit multi-select · hand-off single-select), role select, message textarea | ✅ | Selection is local; the values POST with the primary action below |
| 29 Share-claim | **Send invites · N** | 🔌 | `POST /v1/claims/:id/collaborators` — `{email, role}` per invite plus the optional message. Fires the team-invite email (`emails/12-team-invite.html`). Enterprise only |
| 29 Share-claim | **Confirm handoff** (disabled until a recipient is picked) | 🔌 | `PATCH /v1/claims/:id` `{owner}`. Reassignment is written to the audit log and fires `emails/13-claim-assigned.html`. The previous owner becomes a reviewer. Enterprise only |
| 29 Share-claim | **Copy link** / inline **Copy** | 🔌 | `POST /v1/claims/:id/share-links` mints a NEW signed link each time and returns its URL. **The link is a SNAPSHOT taken at mint time, not a live view** — the recipient sees the inventory exactly as it stood when you sent it, and later edits to the claim do not change it. That is what makes it defensible: the audit log can prove what was sent, and a carrier cannot see figures move under them. Re-sending after edits means minting a new link |
| 29 Share-claim | **Hide insured personal info** | ✅ preview / 🔌 persist | Drives a live "What the recipient sees" panel — toggling it redacts the insured name and loss address on screen, so the effect is demonstrable. Claim number and the worksheet stay visible either way. Persist on the link and apply at snapshot time |
| 29 Share-claim | Expiry select · **Require email to view** · watermark · download toggles | 🔌 | Stored **on the share link, not on the claim** — so a redacted link to one party and a full link to another can coexist from the same claim, each revocable independently. The toggles are read at mint time and baked into that snapshot. "Require email" mints a one-time code and records who viewed and when; that view fires `emails/08-share-link-viewed.html` |
| 29 Share-claim | **Talk to us about Enterprise** (both callouts) · **Cancel** · close ✕ | ✅ | `href` → 15-Request-access / 12-Claim-overview |
| 48 Sample-claim | guided tour / open worksheet | ✅/🔌 | Loads demo claim |
| 55 Cookie-banner | Accept / Manage | 🔌 | Consent store |
| 56 404 | back home / links | ➡️ | Nav |
| 57 Logos | (internal exploration, not a product page) | 🎭 | n/a |

---
**Fixed during this audit pass:**
- Marketing header **Sign in / Start a new claim / top-nav** links now have real `href`s (were inert) across landing, pricing, product, contact, about, careers, segment, docs, 404.
- Settings **left-nav** (settings-pages, carrier-settings, team-management) now anchor-routes to each sub-page; labels standardized (Business, Xactimate, Pricing sources · 11).
- Scrubbed name **"Stateside Adjusting"** → **"Reyes Adjusting"** site-wide (settings, share, avatar, admin, pdf, auth, team, onboarding, utility).
- **Claim sub-nav wired**: claim-overview, claim-photos, and audit-log — the claim tabs (Overview/Photos/Worksheet/Audit/Export), back-links, "Open worksheet", "Review →", "Open photo gallery", "View all", "View full audit log", and worksheet "Export claim" now route to real pages (12/16/05/17/06/01).

---

## Email templates — `emails/`

Fourteen send-ready HTML emails, one file each, previewable together at `emails/index.html`.
Table layout, fully inlined styles, no images and no web fonts, so they survive Gmail,
Outlook and Apple Mail. Every merge value is a placeholder from the demo claim.

| File | Trigger | Notes |
|---|---|---|
| `01-verify-email` | Account created | Token link, 24h expiry |
| `02-password-reset` | Forgot password | Token link, 1h, single use |
| `03-password-changed` | Password changed | Other sessions ended; danger-toned "not you?" path |
| `04-new-sign-in` | Sign-in from an unknown device | Names the method (password / Google / passkey) |
| `05-processing-complete` | `claim.processing.complete` | Item count, RCV, and how many rows need a price |
| `06-export-ready` | `export.generated` | Reference ID + bundle size; states Kevin sends nothing to a carrier |
| `07-export-failed` | `export.failed` | Technical only (rule 16). Reference ID + retry |
| `08-share-link-viewed` | `export.link.viewed` | Viewer, device, location, link expiry |
| `09-payment-failed` | Card declined | Retry date; explicitly no data loss over billing |
| `10-payment-receipt` | Payment succeeded | Invoice number, plan, next invoice |
| `11-storage-nearing` | Storage above ~85% of pool | Rule 19: email first, never a lockout, nothing deleted |
| `14-special-limits-flagged` | `claim.item.special_limits` | Flags classes the policy may cap. States plainly that nothing is blocked (rule 16) |
| `12-team-invite` | Team invite (Enterprise) | Role stated; 7-day expiry |
| `13-claim-assigned` | Claim reassigned (Enterprise) | Recorded in the audit log |

**Rules these encode:** no carrier submit and no carrier acknowledgement (rule 4); export
failures are technical, never an editorial gate (rule 16); storage warnings never lock or
delete (rule 19); unpriced items are described as deliberate blanks, not errors (rule 12).
Transactional emails carry no unsubscribe (service messages); notification emails point at
Settings → My profile. **The seven notification rows on 31, the seven events in the
`notifications` docs article, and the seven notification templates (05, 06, 07, 08, 09, 11, 14)
are one set — change one and change all three.**

## Audit sweep — remaining static controls (documented, not dead)

| Page | Control | State | Production behavior |
|---|---|---|---|
| 66 Admin account | **View invoices** · **Issue refund** · **Change plan** · **Cancel subscription** | 🔌 | Stripe-backed: `GET /admin/accounts/:id/invoices`, `POST /admin/refunds`, `PATCH /admin/accounts/:id/plan`, `DELETE /admin/subscriptions/:id`. Refund and cancel need a typed confirm; both write to the account audit log |
| 67 Admin revenue | **New invoice** | 🔌 | `POST /admin/invoices` — Enterprise contracts are invoiced manually |
| 68 Admin content | **Preview draft** | 🔌 | Renders the draft against the live template at a signed preview URL |
| 69 Admin platform | **Add carrier** | 🔌 | `POST /admin/carriers` — global carrier list, distinct from a customer's own profiles |
| 70 Admin support | **Send & keep open** · **Send & resolve** · **Mark resolved** · **Disconnect inbox** | 🔌 | `POST /admin/tickets/:id/reply` with a `resolve` flag; `DELETE /admin/inbox/connection` revokes the OAuth grant |
| 71 Admin staff | **Remove member** | 🔌 | `DELETE /admin/staff/:id`. Cannot remove the last Owner |
| 72 Admin status | **Post status update** | 🔌 | `POST /admin/incidents/:id/updates` — appends to the public incident timeline |
| 12 Claim overview | **Notes export with the claim** | 🔌 | Toggles whether adjuster notes ride in the PDF/bundle. Per-claim, saved on change |
| 16 Claim photos | **Delete photo** (detail panel) | 🔌 | `DELETE /v1/claims/:id/photos/:photoId`, behind a confirm. Offered on **every** photo — it is the customer's claim (rule 15) and Kevin does not decide which evidence an adjuster may keep. The confirm states the consequence and branches on whether the photo backs a line item: deleting one that does leaves that row without its source photo, while the row and its price are untouched. Never block, never instruct. **Rotate removed** — rotation is a viewer nicety, not claim work, and the raw capture is the artifact of record |
| 16 Claim photos | **Go to worksheet** (detail panel, matched photos only) | ✅ wired | `05-Worksheet-flat.html#item-<id>` — the worksheet must read that hash on load, scroll the row into its virtual window and open the item panel on it. A photo is the evidence; the worksheet row is where it gets corrected, so the two need a direct hop |
| 16 Claim photos | **Grid / Timeline** view toggle | ✅ wired | Client-side re-arrangement of the same photo set grouped by capture hour — no refetch. **Map stays disabled**: it needs GPS the payload does not carry on most captures |
| 03 Intake | **Pause all / Resume** | ✅ wired | Local queue state — halts BETWEEN requests, never mid-POST, so an in-flight chunk always finishes and the server is never left half-written. Shows a quiet "Paused" chip so a stalled progress bar does not read as a failure |
| 04 Processing | **Get notified when done** | 🔌 | Subscribes the adjuster to the processing-complete email (template 05 in `emails/`) |
| 26/27 Mobile | **Pair to this claim** · **Open kevin.co on a laptop →** | 🔌 | `POST /v1/pairing/claim` binds the phone to one claim; the second is guidance copy with no target by design |
| 63 Export failed | **Retry now** · **Auto-fix & retry** · **View error log** | 🔌 | `POST /v1/exports/:id/retry`; auto-fix re-runs with the failing artifact dropped; the log is the job's stderr behind an admin-visible reference ID |
| 20 Edge states | **Retry all failed** | 🔌 | Re-sends only the failed chunk ids from the upload session |
| 41 Security | **Sign out fully** | 🔌 | `DELETE /v1/auth/sessions?all=true` — ends every session including the current one |
| 20 Edge states | **Start your first claim →** · **Open sample claim** · **Add items manually** · **Upload more photos** · **Open in worksheet** (×3) · **Open partial worksheet →** · **Continue where you left off →** · **Continue with 159 →** | ✅ wired | Navigation to 03 / 48 / 75 / 05 — every panel on this page now routes rather than mixing live and dead controls of the same kind |
| 20 Edge states | Per-file **Retry** / **Skip** (failed-upload rows) | 🔌 | `POST /v1/claims/{id}/staging/photos` re-sends that ONE file (not the chunk); Skip drops it from the session and decrements the expected count so the tally still reconciles. Distinct from 03's **Retry these N** (whole rejected set) and 05's **Retry N deferred** (capacity waits) |
| 20 Edge states | **Contact support** | 🔌 | `mailto:kevin@kevin.co` prefilled with the claim number and the failure reference. Distinct from 63 Export-failed, where the surrounding downloads are disabled |
| 20 Edge states | **Download anyway** | 🔌 | Structure-claim panel: generates the export with the flagged rows left as-is so the adjuster can finish in Xactimate. **Distinct from 63 Export-failed**, where the same-named buttons are deliberately DISABLED — there the artifact does not exist; here it does and the adjuster is choosing to accept it |
| 02 Landing | **ROI calculator** (sliders → reclaimed hours + dollars) | ✅ wired | Client-side only. Baseline 4.5h saved/claim from the backend spec (kevin-web-spec-claude.pdf §3); all figures derive from the two sliders. No submit, no capture |
| 56 Cookie banner | **Accept all** · **Reject optional** · **Save preferences** | 🔌 | Writes the consent cookie and gates analytics loading. Reject must leave the product fully usable |


**Share manager (29, Link tab):** tokens are RETRIEVABLE — `GET …/shares` returns `token`/`url` on active links (null on revoked/expired); every active row has a plain **Copy** button (Google-Sheets style; the shown-once modal is retired and must not be rebuilt). No label field (owner decision). Redaction toggle REMOVED per final visibility spec — insured name/address/policy/claim number and the full money chain are always visible to the client (server-shaped payload; see SCHEMAS.md → Share-link visibility); confidence/comps/substitution internals never are. **Create link** → \`POST /v1/claims/{id}/share\` — mints a link. Active list + history from \`GET …/shares\` — liveness is the payload's derived \`active\` boolean, NEVER computed from expires_at; revoked/expired rows stay visible as history retaining \`view_count\`. **Revoke** → \`DELETE …/shares/{share_id}\`. Links are INDEPENDENT — minting a new link never breaks an existing one; only Revoke kills a link.

**Holdback replaced_qty (rule):** \`recoverable\` ships on the list/detail payload and PATCH response — the UI stores it verbatim and never derives it (\`KevinAPI.patchReplacement\` is the mock boundary; the cell shows a pending "…" during the round trip). \`replaced_qty\`: null = all units · k = pro-rate · 0 = line drops from the export.

**Holdback zip structure (locked):** the "Worksheet + receipts" .zip contains the request document plus each receipt as a SEPARATE original file (receipt_<row>.pdf) — receipts are never merged/flattened into one PDF. The PDF\u2019s row-numbered appendix is the index that ties files to lines.

**79 Client-portal-paywall (GET /p/{token}, done-for-you customers):** server sends ~10% preview rows (picked across rooms) in FULL detail + counts/totals only for the rest — locked line detail is never in the payload (blur is decorative, devtools-safe). Totals + identity block always visible; every figure labeled adjuster-estimate. **Unlock** → Stripe hosted checkout; access released on the payment WEBHOOK, never the browser return URL. Paid state adds .xlsx / PDF / photos downloads (gated by `allow_download`/`released_at`). `unlock_price` is PER-CLAIM: set at mint (share Link tab price input; null = no paywall), stored on the share record, read verbatim by the portal — never hardcoded. Unlocked state stays READ-ONLY: all lines + .xlsx/PDF/photos downloads, no worksheet editing (changes go through the done-for-you service; client edits would break the prepared document\u2019s defensibility). Unlock buttons open a checkout interstitial → production redirects to the Stripe Checkout session (`POST /p/{token}/checkout`); no card fields on our page; unlock releases on the payment webhook. Prototype: the interstitial\u2019s Pay button toggles the paid state locally.
