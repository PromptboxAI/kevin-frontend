# Backend prompts — running log

Written by the frontend session, for the owner to relay to the backend session.
Newest first. Each entry is self-contained: paste one whole, don't summarise it.

Mark an entry **SENT** when relayed, and **DONE** when the backend ships it, so
nothing gets asked twice and nothing quietly falls off.

---

## 5. A claim-wide audit trail (the Notes & audit tab) — NOT SENT

**Status:** new, 2026-09-20.

The claim's fourth tab has been greyed "Soon" since the port, because the audit
trail is per ITEM: `GET /v1/claim_items/{row_id}/events` exists and works, but
there is no claim-wide read. Assembling one in the browser means a request per
row — 57 on the canonical claim, hundreds on a real one — so we have not.

**`GET /v1/claims/{claim_id}/events?limit=&offset=`** would build it: the same
event shape you already return, across every item on the claim, newest first,
with the item id on each row so the UI can link to the line. Claim-level events
(created, processed, exported, shared, status changed) in the same stream would
make it the whole story rather than just the rows.

That is the one endpoint standing between us and finishing the claim surface —
the tab is designed, and the item drawer already renders this exact shape.

---

## 4. The admin panel needs to ACT on an account — NOT SENT

**Status:** new, 2026-09-20. This supersedes prompt 2 — read this one first.

Three admin screens are live and read real data: System (`/admin/system`),
Platform (`/admin/platform`) and, until it was deleted today, a "support tools"
screen that let an admin compute a depreciation figure. The owner's verdict on
that one, and he is right: *"they don't call Xactimate and ask how much drywall
would depreciate for, they just enter drywall and see what it comes out to. This
admin panel needs to be actually useful."*

So the question is not "what data can we display" but **"what does the owner do
when a customer writes in?"** Today: nothing, because every path stops at
owner-scoped data. Here is the whole list, in the order it matters.

### 4.1 Find the account, see its state

- **`GET /v1/admin/accounts?q=&limit=&offset=`** — search by email or user id.
  Per row: `user_id`, `email`, `plan`, `billing_state`, `included_items`,
  `items_used`, `credit_balance`, `claims_count`, `photos_count`,
  `storage_bytes`, `created_at`, `last_active_at`.
- **`GET /v1/admin/accounts/{user_id}`** — the same, plus that account's claims
  (id, name, status, item/photo counts, totals, created/updated) and its recent
  activity.

Everything below hangs off being able to reach one account.

### 4.2 See what went wrong for THEM

- **`GET /v1/admin/accounts/{user_id}/jobs/failed`** — their dead-letter rows,
  or let the existing `/v1/jobs/failed` take `?actor_id=`. Right now a failure
  carries a bare uuid and no way to reach the customer it belonged to.
- **`GET /v1/admin/claims/{claim_id}`** and **`…/claim_items?claim_id=`** — read
  another account's claim, so "my worksheet looks wrong" can be looked at
  instead of guessed at. Read-only is fine.
- **`GET /v1/admin/claims/{claim_id}/events`** — the audit trail for a claim we
  do not own. This is what answers "who changed that price?".

### 4.3 Fix it

- **`POST /v1/jobs/{job_id}/retry`** and **`POST /v1/jobs/failed/clear`** — from
  prompt 1, still needed: re-run a customer's failed work, and clear rows that
  can never succeed.
- **`POST /v1/admin/claims/{claim_id}/reprice`** — re-run pricing on someone
  else's claim (or their stuck lines), the admin equivalent of Retry deferred.
- **`POST /v1/admin/claims/{claim_id}/unstick`** — for a claim wedged in
  `processing` because a worker died: mark its in-flight rows failed so the
  adjuster can retry. Today only the global reaper can do this, on a schedule.

### 4.4 Change what they are entitled to

- **`POST /v1/admin/accounts/{user_id}/credits`** — grant items after our own
  failure burned their quota. `{ items: 250, reason: "…" }`, audited.
- **`PATCH /v1/admin/accounts/{user_id}/plan`** — set `plan` / `billing_state`,
  including a **comped** state ($0, full features) and an **internal** one for
  staff accounts. Both must be excluded from revenue rollups by construction.
  Note `plan` is currently constrained to `('trial','pro')`, so this needs a
  migration.
- **`POST /v1/admin/accounts/{user_id}/suspend`** / `…/restore` — for abuse or
  non-payment, without deleting anything (rule 15: nothing is ever deleted to
  reclaim space, and the customer's data stays theirs).

### 4.5 Account lifecycle

- **`POST /v1/admin/accounts/{user_id}/delete`** — the cascade behind "Delete my
  account", which is currently an email to us. Server-side, audited, and with
  the same file-reference rules as claim deletion (`kept_shared`).
- **Password reset / resend invite** — if these live in Supabase admin, say so
  and we will point the console at whatever you expose; we will not hold service
  keys in the browser.

### Two rules for all of the above

1. **No impersonation.** The design is explicit: support diagnoses from the back
   office, never by entering the customer's session. Read-only cross-account
   reads plus named actions, never a "sign in as" token.
2. **Every action is audited** — who, what, when, why — and readable back
   through 4.2. An admin action that leaves no trace is worse than no action.

### What we would build first

Given 4.1 and 4.2 alone, the console gets: an account search, an account page
showing plan, usage, storage, claims and failures, and a route from a failed job
to the customer it hurt. That is the minimum for the owner to answer a support
email. 4.3 turns it from diagnosis into repair.

If any of this already exists under a different path, tell us the shape and we
will build against it.

---

## 3. Make the depreciation schedule and comp routing editable — NOT SENT

**Status:** new, 2026-09-20.

The admin console's Platform screen (`/admin/platform`) reads
`GET /v1/depreciation-rules` and `GET /v1/sources` and renders both: 87 schedule
lines (class, useful life, mode, ceiling, PCS code, appraisal-only) and the comp
routing per category. It is read-only because there is no write route, which
makes it a diagnostic screen rather than a control.

The owner wants to change these without a deploy. What we need:

1. **`PATCH /v1/admin/schedule/{line_key}`** — edit one schedule line:
   `useful_life_years`, `mode`, `flat_pct`, `max_pct`, `appraisal`. The key is
   the one you already return (`"Jewelry & Watches > All Other Jewelry"`).
2. **`PATCH /v1/admin/sources/routing/{category}`** — reorder or replace the
   source list for a category.

Three things we'd want in the contract, because money depends on them:

- **What happens to existing lines.** Our assumption: a schedule edit changes
  what FUTURE recalculations produce, and never silently rewrites items already
  priced — a claim exported last week must still open as it was (rule 22).
  Confirm, and say whether a re-price is needed to pick up a new life.
- **An audit trail.** Who changed which line, from what to what, when. This is
  the number a carrier argument turns on; an unlogged edit is worse than no edit.
- **Validation you enforce.** Life of 0 vs null (null = never auto-depreciates),
  `max_pct` bounds, and whether `appraisal: true` may be cleared at all for the
  four special-limits classes (Jewelry, Fine Arts, Firearms, Furs).

The frontend already renders every field; wiring an editor on top is small once
the routes exist.

---

## 2. Admin console: account and revenue data — SUPERSEDED by prompt 4

Kept for the revenue question, which prompt 4 does not cover:

For **Revenue (67)**, tell us what is knowable rather than us guessing: if Stripe
is the source of truth for MRR, does anything in our database mirror
subscriptions, or should that screen stay empty until it does? A real zero is
fine; a plausible chart is not. Comped and internal accounts carry `mrr: 0` and
must be excluded from every rollup by construction, not by a filter someone
remembers to apply. No per-seat language anywhere — pricing is flat monthly
(rule 9).

---

## 1. Failed jobs: an admin can see them and do nothing — NOT SENT

**Status:** new, 2026-09-20. Folded into prompt 4 (§4.3), but the diagnosis is
here.

`/admin/system` now surfaces `GET /v1/jobs/failed`, grouped by cause. Today's
queue is 50 rows in 2 causes:

- **48 × `RuntimeError: staging_photos row N not found`** from
  `extract_staging_photo_task`, rows 88–135, 9 Jun – 5 Aug, one account
  (`5f8bfb1f-7125-45bf-9767-91997fd256b0`).
- **2 × `TypeError: process_claim_item_task() takes 1 positional argument but 4
  were given`**, 2 Jun, no actor.

Both look like bugs since fixed, leaving dead-letter rows behind. Please confirm,
and clear them if so — the count on that screen should mean "needs attention",
not "history".
