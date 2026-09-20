# Backend prompts — running log

Written by the frontend session, for the owner to relay to the backend session.
Newest first. Each entry is self-contained: paste one whole, don't summarise it.

Mark an entry **SENT** when relayed, and **DONE** when the backend ships it, so
nothing gets asked twice and nothing quietly falls off.

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

## 2. Admin console: account and revenue data — NOT SENT

**Status:** new, 2026-09-20.

The admin console's System (`/admin/system`) and Platform (`/admin/platform`)
screens are live and read real data. The remaining screens — Overview, Accounts,
Account detail, Revenue — have no data source at all: there is no cross-account
query. We will not ship them on invented numbers, so they are unbuilt.

What would unblock four screens at once:

1. **`GET /v1/admin/accounts`** — one row per account, paged, searchable by
   email: `user_id`, `email`, `plan`, `billing_state`, `included_items`,
   `items_used`, `credit_balance`, `claims_count`, `photos_count`,
   `storage_bytes`, `created_at`, `last_active_at`. Accounts (65) is this table;
   Overview (64) is counts derived from it.
2. **`GET /v1/admin/accounts/{user_id}`** — the same for one account, plus its
   claims and recent activity, for Account detail (66).

For **Revenue (67)**, tell us what is knowable rather than us guessing: if Stripe
is the source of truth for MRR, does anything in our database mirror
subscriptions, or should that screen stay empty until it does? A real zero is
fine; a plausible chart is not.

Two notes carried from the design:

- **Comped and internal accounts carry `mrr: 0`** and must be excluded from every
  revenue rollup by construction, not by a filter someone remembers to apply.
- **No per-seat language anywhere** — pricing is flat monthly (rule 9).

---

## 1. Failed jobs: an admin can see them and do nothing — NOT SENT

**Status:** new, 2026-09-20.

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

To make the screen actionable rather than informational:

1. **`POST /v1/jobs/{job_id}/retry`** — re-enqueue one dead-letter job, and ideally
   a whole cause at once. Return what was enqueued.
2. **`POST /v1/jobs/failed/clear`** — acknowledge or discard rows that can never
   succeed (all of today's are that kind).
3. **An account lookup by id** — `actor_id` on a failure is a bare uuid. Support
   cannot reach a customer from that. Even `GET /v1/admin/accounts/{user_id}`
   from prompt 2 would do it.
