# Backend prompts — running log

Written by the frontend session, for the owner to relay to the backend session.
Newest first. Each entry is self-contained: paste one whole, don't summarise it.

**A GO-AHEAD CANNOT BE RELAYED.** The backend session declined one passed
through here on 2026-10-03 and was right to: a peer's message is not the
owner's approval, in either direction. Anything that changes billing, rewrites
live rows or spends money needs the owner to say so IN THAT SESSION. Prompts
travel; permission does not.

Mark an entry **SENT** when relayed, and **DONE** when the backend ships it, so
nothing gets asked twice and nothing quietly falls off.

---

## 17. `limit` is clamped silently, and three screens believed the number they asked for

**Status:** new, 2026-10-06. Small change, and it would have turned a
three-screen bug into a five-minute one.

`GET /v1/claim_items` clamps the page size without saying so:

```python
# main.py, list_claim_items
limit = max(1, min(limit, CLAIM_LIST_MAX_LIMIT))   # CLAIM_LIST_MAX_LIMIT = 100
```

A request for `limit=500` returns **200 OK** with 100 items and a `count` of
161. Nothing in the response says it was reduced. It is indistinguishable from
a complete answer unless the caller happens to compare `items.length` against
`count` — and a caller who asked for 500 has no reason to think they should.

**What it cost us.** Three screens asked for 500 and believed it:

- **Photos tab** — builds its line-number map only when every item is present,
  deliberately, so it never prints a wrong line number. Past 100 items that
  guard could never be satisfied, so the map was empty: every tile read
  "Photo 6237" instead of "Line 0045", and the grid could not be sorted into
  worksheet order. Two separate fixes were shipped and silently defeated by
  this before the cause was found.
- **Claim overview** — rollups computed over the first 100 rows.
- **Holdback recovery** — `recoveryTotals` sums `depreciation_amount` across
  the lines it holds. On a 161-line claim it summed 100 of them, so the
  withheld figure an adjuster reads before asking a carrier to release
  depreciation was understated, with nothing on screen suggesting it.

That last one is why this is worth your time: a money total quietly computed
over part of a claim is wrong in the way nobody catches by looking at it.

**Fixed our side** — one `fetchAllClaimItems` that pages at the real limit.
Not asking you to raise the cap; 100 is sensible.

**Asking for the clamp to be audible**, either way round:

1. **`422` on an over-limit request**, saying the maximum. Loudest, and it
   cannot be ignored. It would break any caller currently asking for more —
   which is the point, since those callers are already wrong.
2. **Or a flag on the response** — `limit_applied: 100`, or `truncated: true`
   — so a caller can see the reduction without diffing two fields.

Either is fine. What does not work is the current silence. Same question for
any other list route that clamps: `/v1/claims`, `/v1/admin/accounts`,
`/v1/claims/{id}/events`, `/v1/jobs/failed`. We have already been bitten once
by `/v1/jobs/failed` returning a per-page `count` the System screen read as a
total, reporting "50 failed jobs" when there were 79 — same family of bug.

---

## 16. Does the engine still route comps by retailer? — NO. IT IS DISPLAY ORDER.

**Status:** **answered 2026-10-05.** It is display ORDER, not routing: the
lists say what order sources are shown in for a category, not where a comp is
fetched from. **Rule 10 is intact** — one unified comp source, no per-retailer
scrapers, nothing to reintroduce.

So the screen was the problem, not the config. "Comp routing · 9 categories",
on the one surface whose job is to answer "why did that line price like that?",
was an answer and a wrong one: an admin reading it would have concluded a
Furniture comp came from Wayfair because the table said so. Retitled **"Comp
source order"** with a line underneath saying it is not where comps come from.

**Original question follows.** A question, not a request — one line answers it.

`/admin/platform` renders a **"Comp routing · 9 categories"** table straight
from `GET /v1/depreciation-rules`: Furniture to Wayfair / West Elm / CB2 /
Pottery Barn, Jewelry to Blue Nile, Art to 1stDibs / LiveAuctioneers / eBay,
everything else to Google Shopping / Amazon / Walmart / Target.

Domain rule 10 says source-priority-by-retailer routing was **scrapped** when
the backend consolidated onto one comp source, and that there are no per-store
adapters. So one of two things is true:

- the engine really does route by retailer, and rule 10 is out of date; or
- that config is dead and the endpoint is still serving it, in which case an
  admin reading the screen believes something false about how a price was
  found.

Which is it? If it is dead we will stop rendering it. Nothing customer-facing
is affected either way — rule 10's vendor-naming ban covers customer surfaces
and this screen is internal — but "why did that line price like that?" is the
whole job of that screen, so it should not answer it wrongly.

---

## 15. Revenue needs ONE rollup endpoint — SHIPPED BEFORE WE SENT IT

**Status:** **done, found live 2026-10-05.** `GET /v1/admin/revenue` exists and
returns the shape below almost exactly: `mrr_cents`, `mrr_previous_cents`,
`mrr_change_pct_mom`, `arr_run_rate_cents`, `mrr_by_plan[]`,
`net_new_mrr_cents`, `new_count`, `churned_count`,
`net_revenue_retention_pct`, `failed_payments[]`, `enterprise_contracts[]` and
a `one_time` block — plus `stripe_mode`, which answers question 2 below by
saying out loud that these are test-mode numbers. `GET /v1/admin/limits` came
with it. Nothing to send; we are building the screen against it.

The original ask is kept below because its two questions are still worth an
answer, and because the "we asked for something that already existed" lesson is
worth not repeating — check `openapi.json` before writing the next one.

**Original status:** new, 2026-10-05. Owner asked when the remaining admin screens get
built. Accounts and Support are waiting on `feat/admin-accounts`; Revenue is
waiting on something that does not exist at all, so it is worth asking for now.

**Where it stands.** The live API has 86 routes and the only billing ones are
`/v1/billing/checkout`, `/v1/billing/credits/checkout`, `/v1/billing/portal`
and `/v1/webhooks/stripe` — all customer-side. Stripe holds the truth and
nothing rolls it up, so the Revenue screen has nothing to render.

**Asking for:** `GET /v1/admin/revenue` (admin only), one response, all money
in cents, so the screen does no arithmetic of its own:

- `mrr_cents`, `mrr_change_pct_mom`, `arr_run_rate_cents`
- `mrr_by_plan`: `[{plan, mrr_cents, account_count}]` — Pro and Enterprise
- `net_new_mrr_cents` with `new_count` and `churned_count` for the period
- `net_revenue_retention_pct`
- `failed_payments`: `[{user_id, email, plan, amount_cents, failed_at,
  attempt_count, next_retry_at}]` — the queue an owner acts on
- `enterprise_contracts`: `[{user_id, account_name, annual_value_cents,
  volume_label, renews_on, status}]`

**Two things we need you to settle rather than guess at:**

1. **Comped and Internal accounts must be excluded from every MRR, ARR, net-new
   and NRR figure**, by construction rather than by a filter we remember to
   apply. They carry `mrr: 0` in the design for exactly this reason. Please
   confirm that is how the rollup treats them.
2. **What one-time streams actually exist in Stripe today?** The design screen
   shows a "Services & paywall · last 30 days" table listing done-for-you
   engagements and $49 client-share unlocks. The DFY price has since changed
   ($199 setup plus marginal per-line bands, rule 9) and we are not confident
   the $49 share paywall is a real product rather than a stale mock. Credit
   purchases at $0.75/item ARE real. Rather than us inventing the shape: tell
   us which one-time charge types exist, and we will render those. Whatever
   they are they stay OUT of MRR/ARR/NRR, which track subscriptions only.

No write routes wanted here. "New invoice" on the Enterprise card stays static
until there is a flow behind it.

---

## 14. A mattress depreciates on the wrong life — ANSWERED, AND WE ASKED FOR THE WRONG FIX

**Status:** **answered 2026-10-05, and our fix was wrong.**

**Do not add a mattress line at 8-10 years** — the backend's answer, and it is
right. The owner's schedule already files mattresses, mattress pads and pillows
under **`Linens & Softgoods > All Other Linens & Softgoods` (10 years)**, and
the backend now routes typed/imported items there. We asked for a new row
because we could not find a mattress by searching for the word; it was in a
line whose name does not contain it.

**`rules` and `schedule` are not two competing truths**, which is the part we
got wrong in the follow-up. The life applied follows the item's `category`: if
that string equals a `schedule` line id, that line's life applies; otherwise
`rules[category]` does. One resolution order, not two tables disagreeing.

**What is still true, and is now the owner's call:** photographed items carry a
CLASS name, so they take the class life — a photographed mattress is classed
`Furniture` and depreciates on **15 years** (the 66.6% at age 10 that started
this), while the same item typed in lands on the Linens line and depreciates on
**10**. Same object, two answers, decided by how it got into the claim. The
backend says the owner is deciding whether to move photographed items onto
schedule lines; until he does, that gap is live.

**Done on our side:** `/admin/platform` now shows BOTH lists with the
resolution order stated between them, rather than the 87-line schedule alone —
which could not answer "why did that line depreciate like that?" for any
photographed item.

**Original report follows.** Owner found it: entered **10 years** on a mattress
and got **66.6%** back, and said the expected life looked too long.

**He is right, and the arithmetic names the cause.** From the live
`GET /v1/depreciation-rules` (30 classes):

- `Furniture` -> `useful_life_years: 15`. 10/15 = **66.6%**. That is the number.
- `Bedding & Linens` -> `useful_life_years: 5`. 10/5 = 200%, clamped to
  **100%**, ACV **$0.00**.

Those are the only two classes a mattress can land in, and nothing in the list
is a mattress: no Mattresses, no Beds, no Bedroom. So the same item is either
66.6% depreciated or worthless at ten years old, a spread of the entire
valuation, decided by which of two wrong boxes it falls into.

**The detailed schedule does not rescue it, and the two disagree.** The same
response carries `schedule`, 87 PCS sub-lines across 30 categories (what
/admin/platform renders). No mattress line there either; the nearest homes are

| schedule line | life |
|---|---|
| `Furniture — Home & Office > All Other Furniture Items` | **20 y** |
| `Furniture — Home & Office > Upholstered Furniture` | 10 y |
| `Linens & Softgoods > Quilts` | 20 y |
| `Linens & Softgoods > All Other Linens & Softgoods` | 10 y |

A mattress falling to "All Other Furniture Items" depreciates on a **20-year**
life -- further from the truth than the 15 the owner saw. And note that
`rules["Furniture"]` is 15 while the Furniture sub-lines it stands for run 10
to 20, so the single-word class is an average of sub-lines a mattress belongs
to none of. Whichever vocabulary an item is tagged in changes its answer.

**It is not stable either, which is how we found it.** The SAME photo file
(`loss/w480/mattress.jpg`) has been classed both ways by the live engine:

| run | class | life | depr at age 10 |
|---|---|---|---|
| earlier QA claim `test-b-append` line 0018 | Bedding & Linens | 5 | 100% |
| `retest-mattress-1` / `-2` (after build 464cc13) | Furniture | 15 | 66.6% |

Build 464cc13 has pinned the identification, so runs are consistent *now* --
both retest runs agree exactly (see the retest results we sent separately).
But the two classes it has used sit on opposite ends of the schedule, and the
pinning froze whichever one it happened to pick.

**Two things we think are needed, and the second matters more:**

1. **A mattress line with a life to match, in BOTH vocabularies.** Industry
   useful life for a mattress is about 8-10 years, which is none of 5, 15 or
   20. It needs a `rules` class and a `schedule` sub-line (`Furniture — Home &
   Office > Mattresses & Box Springs` would sit naturally), plus whatever the
   classifier picks labels from.
2. **A look at how many other items have no right box.** A mattress is not an
   exotic item; it is in a large share of residential contents claims. If it
   has no home in a 30-class schedule, the question is what else does not --
   and the failure is silent, because a wrong class still returns a confident
   percentage. Nothing in the payload says "this class is a poor fit".

**What the frontend will not do about it:** anything. Per rule 20 the UI does
not derive or correct a class, and per rule 13 it renders the percentage as it
comes, including a clamped 100% and a $0.00 ACV. An adjuster can override the
class by hand, and that is the only workaround we have.

---

## 13. Sales tax rounds half-DOWN on a line and half-UP in the rollup, so the tax column does not foot

**Status:** new, 2026-10-04. Found in an end-to-end test, claim
`test-b-append` (21 lines, 8.75% Suffolk). Small, but it lands in the one
document that gets added up by somebody else.

**What the claim says.** `total_tax` = **$825.35**. Summing the 21 lines'
own `tax` values gives **$825.31**. Four lines are each a cent light:

| # | Ext. Cost | ext x 0.0875 | line `tax` | half-up |
|---|---|---|---|---|
| 0012 | 30.00 | 2.625 | **2.62** | 2.63 |
| 0017 | 5034.00 | 440.475 | **440.47** | 440.48 |
| 0018 | 2414.00 | 211.225 | **211.22** | 211.23 |
| 0021 | 358.00 | 31.325 | **31.32** | 31.33 |

Every one is an exact half-cent, and every one goes down. Recomputing each
line as `round_half_up(ext * rate)` and summing reproduces `total_tax`
**exactly** ($825.35) -- so the rollup is already half-up and only the
per-line value is not. Two rounding modes, one codebase.

The cause looks like Python's float `round()`: 2.625 is exactly representable
and banker's rounding takes it to the even 2.62, while 440.475, 211.225 and
31.325 are stored a hair below their decimal value and round down for that
reason instead. Different mechanisms, same direction.

**Why it is worth a fix rather than a shrug.** Rule 18 puts tax on every line,
and the .xlsx carries static values (no formulas) -- so an adjuster or a
carrier who sums the Sales Tax column in Excel gets a number that disagrees
with the total Kevin printed. It scales with line count, not with amount: 4
cents on 21 lines, and an estate runs hundreds to thousands.

RCV + Tax and ACV inherit it: they are built from the rounded tax, so the
same four lines carry the cent forward, and the RCV and ACV totals are each
4 cents above the sum of their own column.

**What we are asking for:** per-line money through `Decimal` with
`ROUND_HALF_UP`, which is what the rollup already effectively does and what
sales tax conventionally uses. The frontend reads all of this verbatim and
will not patch it -- `computeACV()` was deleted precisely so there is one
answer, and it is yours.

**Not asking** for the existing rows to be rewritten. Lines already exported
cite numbers a carrier has seen; a silent restatement is worse than a cent.
New lines being right is enough, unless you would rather do both.

---

## 12. Self-serve Done-for-you: quote before work, deposit, balance — NEEDS THE OWNER IN THE BACKEND SESSION

**Status:** new, 2026-10-02. Owner's design. This is a flow, not an endpoint,
so it is worth agreeing the shape before anyone builds a piece of it.

**What the client does.** Drops a `.zip` (or pastes a Drive link) with no
account. Clustering runs. They get back a quote: `$199` setup plus the marginal
line price for the number of sets. They accept, pay the $199, we build, and the
balance is collected on delivery.

**Why the set count is the right number to quote on.** Clustering is pre-Vision
and costs us nothing to run, and a set becomes **at most** one line — a context
or duplicate set promotes to zero. So the set count is a CEILING the final
invoice cannot pass, which is what makes a per-line price acceptable to someone
who cannot count the lines themselves. The page now promises exactly that, so
the quote must be computed from sets and the invoice must never exceed it.

**The pricing is already written and tested on our side.**
`src/lib/dfy-pricing-rules.ts`: marginal bands ($5.00 first 100, $4.50 to 250,
$4.00 to 500, $3.50 to 1,000, custom past that), `$199` setup, integer-cent
arithmetic, and a test asserting the total strictly increases at every count
from 1 to 1,000. Port it or call it — but it should exist once, and if the
server recomputes independently the two will disagree on a cent eventually.

### What we think we need from you

1. **An anonymous intake bucket.** A pre-claim upload that needs no account:
   `POST /v1/dfy/quotes` with files (or a Drive URL), returning a quote id. It
   has to tolerate a 2 GB zip the same way the authenticated path does — chunked
   client-side, duplicates reconciled, the same `rejected[]` enum.
2. **Cluster without pricing.** The existing clusterer, stopping before Vision,
   so a quote costs us compute and no vendor spend. `GET /v1/dfy/quotes/{id}`
   returns `photo_count`, `set_count`, status.
3. **The quote record itself** — set count, the computed total, and the
   **ceiling**, frozen at acceptance so a later re-cluster cannot raise it.
4. **Deposit checkout.** `POST /v1/dfy/quotes/{id}/accept` → a Stripe Checkout
   session for $199. `services/payments.py` already builds sessions with ad-hoc
   `price_data`/`unit_amount`, so **no new Stripe price object and no dashboard
   work** — the same helper covers the deposit and the balance.
5. **Promotion to a real claim** on payment, via the webhook rather than the
   browser return (the portal already does it this way).
6. **The balance.** We would rather reuse the share-link paywall than build a
   second payment surface: the finished claim goes out as a share link priced at
   `total − 199`, and paying unlocks the files. That machinery exists
   (`/v1/claims/{id}/share`, `/p/{token}/checkout`, unlock on webhook). The only
   new part is setting that price from the quote.

### Three things the owner has now decided

- **No claim exists until the deposit clears.** The quote holds the photos; the
  claim and worksheet are created when the $199 is paid. Nothing half-built sits
  in a stranger's account.
- **The invoice caps at the quote.** If a hand-added line pushes the final count
  past the ceiling, we eat the difference — we promised a ceiling in writing.
- **A quote stands for 14 days.** Deliberately not shorter: a client whose quote
  lapses just re-drops the same zip and gets the same number, so a tight expiry
  only adds a round trip.

### The client is a HOMEOWNER, not an adjuster

This is the part that changes the data model rather than the flow. A
done-for-you client is typically the insured, and must not be asked for the
intake an adjuster fills in — no carrier, no policy number, no policy form, no
date of loss, no preparer fields.

**Collected: first name, last name, address, phone, email. Only NAME and EMAIL
are required.**

Both consequences of that are now decided (owner, 2026-10-03):

1. **ZIP IS REQUIRED**, as the one address field. `claims.tax_rate` is nullable
   and `_compute_tax` returns None when it is unset, so an addressless claim
   prices every line tax-free and the Sales Tax column comes out empty — honest,
   but it understates what the client is owed, and tax is real money in their
   favour. The ZIP is what resolves the rate. So: **name, email and ZIP
   required; first/last name split, street address and phone optional.**
2. **The claim is created under a COMPED INTERNAL ACCOUNT.** Quota is per owner
   and a homeowner has none, so DFY work runs on an account with no ceiling,
   billed to us rather than metered. Tell us the account id and we will show no
   quota UI for it, and keep it out of revenue rollups the way comped and
   internal accounts already are.
3. **The Kevin letterhead on the client's PDF stays, deliberately.** The
   business profile on that account is ours, so a homeowner who hands the
   worksheet to their own adjuster is handing over a Kevin-branded document.
   The owner's call: that is top-of-funnel awareness, not a leak.

### What we will build when the shape is agreed

The drop-and-quote screen, the accept/deposit step, and the delivery view with
the balance. None of it is worth starting before the quote record exists,
because every screen is a view of it.

---

## 11. The trial renews every month — it should be 250 LIFETIME — NEEDS THE OWNER IN THE BACKEND SESSION

**Status:** new, 2026-10-02. Owner's decision, and it changes what a free
account costs us in aggregate.

**What happens today.** `services/quota.py` sets `PLAN_INCLUDED_ITEMS["trial"]
= 250`, and `current_period()` lazily creates a `billing_periods` row per
calendar month with `included_items` snapshotted from the plan. A trial account
therefore gets **a fresh 250 every month, indefinitely**, without ever being
charged. At ~$0.08 an item that is ~$20 a month, per account, forever, and it
grows with every signup that never converts.

**What the owner wants:** 250 items **for the lifetime of the account**, not per
cycle. The trial ends when the 250th item is produced and never refills; the
only ways past it are Pro or credits.

Note the marketing has always described it this way — /pricing says "your
**first** 250 line items" and "what happens when I use up the 250 items?" — so
this is the implementation catching up to the offer, not a change to it.

Four things we need pinned down, because the frontend renders them:

1. **Where the lifetime count lives.** A sum over the account's
   `billing_periods.items_used` works until a period is deleted or a plan
   changes mid-cycle; a counter on the plan row is harder to get wrong. Either
   way `/v1/me`'s `quota` block needs `items_used` and `items_remaining` to mean
   *lifetime* while `billing_state` is `trial`, or the usage meter will reset on
   screen on the 1st of the month.
2. **`period_end` on a trial.** It currently drives "renews" language. If the
   pool never renews, send it null for trials, or tell us to ignore it — we have
   just changed the Billing strip to say "one pool" rather than "per month", and
   a renewal date beside that reads as a contradiction.
3. **What happens on upgrade.** Converting to Pro should start a clean 2,000
   period rather than inheriting a spent trial counter. Confirm, since the
   lifetime counter would otherwise follow them.
4. **Credits on a trial.** Rule 9c sells overage credits at $0.20; if a trial
   user can buy them, the lifetime cap has a paid escape hatch and the copy
   should say so. If they cannot, buying credits must surface as "upgrade to
   Pro" rather than failing.

Existing trial accounts that have already consumed several months of 250s are a
one-time migration question — our vote is to count only what they have used
rather than retroactively locking anyone out, but it is your data.

**Backend's findings, 2026-10-03, before building:** `set_plan` on upgrade
already starts a fresh period at `items_used = 0` (question 3 answered, nothing
to change), and `POST /v1/billing/credits/checkout` has **no plan check**, so a
trial user can buy credits today (question 4 answered). That second one is left
as it is for now and put back to the owner: a trial that can buy credits is
pay-as-you-go without subscribing, which is a pricing decision rather than an
implementation detail. **OPEN QUESTION FOR THE OWNER.**

---

## 10. Line numbers must survive a delete — BUILT (26eb4c2), AWAITING DEPLOY

**Status:** **built by the backend 2026-10-03** as `26eb4c2`, migration
`0062_line_no.sql`: the counter lives on `claims.next_line_no`, an insert
trigger assigns it, it is never reused, and existing claims are backfilled in
id order. `line_no` rides on `ClaimItemSummary` for both list and detail.
**Not yet on production** — checked the live sample claim on 2026-10-03 and the
field is absent from the payload entirely, so the worksheet is still numbering
by position (correctly, via the fallback). Legacy rows with a null `created_by`
keep `line_no` null, which is exactly why the fallback is all-or-nothing: a
claim holding both would otherwise mingle two schemes.

This settles the open question in **BACKEND-ASKS 29**, which laid the problem out and ended "happy to render whatever you land
on". The owner has landed on it: **numbers stay stable across deletes.**

Today both sides derive the number from POSITION — `enumerate(items, start=1)`
in `services/export.py`, and `numberRows` (id-ascending, `index + 1`) in the
worksheet. There is no `line_no` column on `claim_items`. So deleting a row
shifts every row beneath it up by one, and a carrier holding an exported
schedule has numbers that now point at different items.

**What we need: a `line_no` assigned at item creation, never reused, returned
on the list and detail payloads.** That is the same behaviour rule 22(b)
already describes for appends — "numbering continues, session 2 starts at
#0045" — extended to deletes, which is the case the rule was written about in
the first place ("an export already sent to a carrier cites those numbers").

Two details that decide whether it actually works:

- **Never reused, and never renumbered.** Deleting #0002 leaves a gap, and the
  gap is the point: it is evidence the line was removed, and it keeps every
  other number pointing where the carrier thinks it does.
- **Backfill the existing claims** in id order, so numbers do not jump the
  first time a live claim is reloaded.

The frontend cannot do this alone and should not try: if the UI invented a
stable number it would disagree with the export, which is worse than both
being wrong the same way. `numberRows` will read `line_no` and fall back to
position while the field is null, so the change can land without a flag day.
The delete confirmation's warning comes out on the day it does.

---

## 9. `vendor_watch` has been reporting "unreadable" — ANSWERED (698dd9c)

**Status:** **answered 2026-10-03.** Our reading (14:56Z on the 29th) predates
`698dd9c` from the same day: the status page is intermittent rather than broken,
so the check now retries once and the heartbeat carries `reason` (`http_503`, a
timeout string) and `impact: "none: the breaker and control search are
unaffected"`. The status stays `unreadable` when both attempts fail, so the row
still flags — which is right, and now it flags with its own explanation beside
it: the System screen renders `reason` and `impact` on the row rather than
leaving them in the expandable JSON, because an amber row with no context read
as an outage. Not yet verified on production.

The original report follows.

`/v1/jobs/health` on the admin System screen:

```json
{"job": "vendor_watch", "last_status": "unreadable", "runs_total": 1971,
 "last_detail": {"error": "status page unreadable", "status": "unreadable",
                 "checked_at": "2026-09-29T14:56:58Z"}}
```

Last run a minute before we looked, so it is running fine — it just cannot read
what it went to read. The other three scheduled jobs are `ok`, `jobs_degraded`
is empty, pricing reads `ok` and the search canary is returning 40 comps a
probe, so **nothing is wrong with pricing right now**. That is rather the point:
the watcher whose job is to notice when something goes wrong with the vendor has
not been able to see the vendor's status page, and the only surface that says so
is one admin row.

Worth knowing either way: if the vendor changed their status page, the check
needs updating; if it is expected (an anti-scraping block, say), it may be worth
reporting as `skipped` rather than `unreadable`, so the row stops looking like a
fault. We render `last_status` verbatim and flag anything that is not `ok`, so
whatever you call it is what the screen will say.

---

## 8. `PUT /v1/me/logo` cannot be called from a browser — DONE

**Status:** raised 2026-09-27, **shipped by the backend 2026-09-28**. Verified:
the PUT preflight now returns 200 with `access-control-allow-methods: GET, POST,
PUT, PATCH, DELETE, OPTIONS`, and a 1,053-byte PNG uploads end to end and lands
on the PDF. The backend also added a test deriving the allowed-method list from
the route table, so a future PUT route cannot ship unreachable.

The letterhead route is `PUT`, and the API's CORS config does not allow PUT:

```
main.py:552  allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
```

Measured against the live API today:

```
OPTIONS /v1/me/logo   Origin: https://www.kevin.co
                      Access-Control-Request-Method: PUT
-> 400 Bad Request
   access-control-allow-methods: GET, POST, PATCH, DELETE, OPTIONS
```

The same preflight with `PATCH` returns 200. So the browser refuses the upload
before it is sent, `fetch` rejects with a bare "Failed to fetch", and the
adjuster is told nothing useful about a file that was perfectly fine. Confirmed
end-to-end: picking a valid 180x48 PNG in Settings → Business fails this way
every time.

**Please add `"PUT"` to `allow_methods`.** The route itself is right — PUT is
exactly what "an account has ONE logo and re-uploading replaces it" means, and
it should not have to become a POST to be reachable.

The frontend now names this cause instead of printing "Failed to fetch"; that
branch stops being reached the moment PUT is allowed, with no frontend change.

---

## 7. `X-Export-Preview` is invisible to the browser — DONE

**Status:** raised 2026-09-27, **shipped by the backend 2026-09-28**. Verified
on a live response: `X-Export-Preview: true` now reads through from the browser.
The null handling stays as written — the header can go missing for other
reasons, and null means "no information", never "it stamped".

The export route echoes **`X-Export-Preview: true|false`**, and the docstring
says why: "A mistyped query param (`?previw=true`) is dropped by the framework
without a word, and no server-side check can catch that." Exactly right — so we
read it.

We cannot. CORS hides any response header that is not in
`Access-Control-Expose-Headers`, and `main.py:564` lists
`X-Request-ID`, `Content-Disposition`, `X-Export-Contents`, `X-Export-Photos` —
not `X-Export-Preview`. Measured against the live API on 2026-09-27 from
kevin.co: a `?format=pdf&preview=true` response arrives with
`content-disposition, content-length, content-type, x-export-contents,
x-request-id` and nothing else. `headers.get('X-Export-Preview')` is null.

**Please add `"X-Export-Preview"` to that list.** One string, same reasoning as
`X-Export-Contents` beside it: a header the client cannot read verifies nothing.

We have shipped the safe reading in the meantime — a null echo is treated as *no
information*, not as "it stamped", because a false alarm under every successful
preview is worse than silence. Once the header is exposed, the check starts
working with no frontend change.

While you are in there: the same call is the one that carries `?letterhead=`.
That one we can verify by eye (a branded PDF is bigger), so it is not urgent —
but if an `X-Export-Letterhead` echo is cheap, it closes the same hole.

---

## 6. Pricing has been `degraded` for six days, and the demo blames the listings — PARTLY RESOLVED

**Status:** raised 2026-09-20. **Checked 2026-09-26: `/v1/status` now reads
`pricing.state: "ok"`, so question 1 answered itself — the flag cleared. Questions 2
and 3 stand, because the next degraded spell will do the same thing: a visitor was
told the market was thin when the vendor was the problem.**

`GET /v1/status` right now:

```json
{"pricing":{"state":"degraded","reason":"vendor_degraded",
  "since":"2026-09-14T10:21:29.774Z","next_check_at":null,
  "check":{"result":"unverified","at":"2026-09-21T00:10:54Z","seconds":null}}}
```

Six days in `degraded`, `next_check_at: null`, and the only check recorded is
`unverified`. Everything else is healthy: 4/4 workers live, every queue at 0,
all four workers on `dcda4d5`.

**What it did to a visitor.** The owner dropped a 1990s Star Trek: The Next
Generation Thermos lunchbox on the homepage demo. It identified perfectly, then
came back `no_price`, which the demo renders as *"Not enough live listings —
Kevin found the item but too few current listings to stand behind a number."*
**The same kind of item found multiple comps yesterday.** So the demo made a
factual claim about the market that was probably a claim about our vendor.

Three questions, in order of how much they matter:

1. **Is `degraded` real, or is the flag stuck?** If pricing has genuinely been
   impaired since 14 Sep that is the headline; if the state is sticky and
   nothing re-clears it, the flag is worse than useless because it will still
   say `degraded` on the day something actually breaks. `next_check_at: null`
   and `check.result: "unverified"` suggest nothing is re-testing it.
2. **`no_price` should not be returned while the vendor is degraded.** Rule 12b
   is explicit that capacity and vendor problems are not editorial findings: a
   throttled or failing vendor means *we* could not look, not that the market is
   thin. The demo already has a separate `budget_paused` reason that says
   exactly this and blames nobody's photo. Either reuse it, or add a
   `service_degraded` reason to `NotPricedReason` and we will write the copy.
   As it stands the frontend cannot tell the two apart — and per rule 20 it must
   not guess, so this has to come from the payload.
3. **Did the resale fall-through run?** Rule 11 (amended 2026-08-10) says a thin
   retail bucket falls through to `comparable_sale` and the resale median
   becomes the RCV raw, rather than short-circuiting. A vintage collectible
   lunchbox is the exact case that path exists for, so `no_price` on it is
   surprising even with a healthy vendor. If the demo route does not run that
   fall-through, say so — the demo is what a visitor judges the product by, and
   it should not be a worse pricer than the product.

One more, smaller: while `pricing.state` is `degraded`, nothing on the public
site says so. The service banner (rule 6b) is not on the marketing pages, so a
visitor gets a bare "not enough listings" with no context. That is ours to fix
and we will, but it is worth knowing that a degraded flag is currently invisible
to everyone who is not signed in.

---

## 5. A claim-wide audit trail (the Notes & audit tab) — DONE

**Status:** **shipped 2026-09-29** and consumed the same day. `?limit=&offset=`,
newest first, `claim_item_description` on every row so the tab needs no item
list, and `total` (lifetime) distinct from `count` (this page) — we page on
`total`, which the first cut got wrong and would have stopped at the first short
page. A 404 is "not your claim", never an empty history.

**Known scope:** ITEM events only. Claim created / processed / exported / shared
are not in the stream because there is no claim-level event table; folding them
in is a separate piece of work, not a wider query. The tab's heading says "the
lines on this claim" so nobody reads a missing export as an unrecorded one.

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

## 4. The admin panel needs to ACT on an account — §4.1 + §4.2 SHIPPED; §4.3–§4.5 OPEN

**Status:** new, 2026-09-20. **§4.1 AND §4.2 are both live, and §4.1 is already
consumed (2026-10-05).** `/admin/accounts` and `/admin/accounts/{user_id}` are
real screens reading real accounts.

**We did not know §4.2 had shipped** — we checked `openapi.json`, saw three
admin routes, and wrote a prompt asking for work that already existed. The live
API now serves 95 paths and twelve admin ones. For the record, everything §4.2
asked for is there, nested under the account rather than at `/admin/claims`,
which is the right call since `claim_id` is only unique per owner:

| §4.2 asked for | shipped as |
|---|---|
| their failed jobs | `GET /v1/admin/accounts/{user_id}/jobs/failed` |
| read their claim | `GET /v1/admin/accounts/{user_id}/claims/{claim_id}` |
| their claim items | `GET /v1/admin/accounts/{user_id}/claim_items` |
| audit trail we do not own | `GET /v1/admin/accounts/{user_id}/claims/{claim_id}/events` |

All verified answering 200 against a real account. Filters and paging are in
the spec (`status`, `include_archived`, `room_id`, `unassigned`, `limit`,
`offset`), so there is nothing we need to ask about them — we are building.

**`/v1/admin/revenue` and `/v1/admin/limits` also landed**, which closes
prompt 15 before it was sent; see that entry.

Two notes back:

- **Does `count` mean the whole registry or just this page?** The response is
  `{accounts, count, limit, offset}` with no `total`. We are NOT reading
  `count` as a total, because `/v1/jobs/failed` returns a `count` that means
  this page and the System screen once reported "50 failed jobs" when there
  were 79. Paging falls back to "was the page full?" until you say. If `count`
  is the registry total, say so and we will use it; if you would rather add
  `total`, better still.
- **The plan/billing_state split is real in live data and worth keeping.**
  Three of the five accounts are `plan: "pro", billing_state: "trial"`. We size
  the allowance off `plan`, so those correctly read 2,000/month; had we read
  the state they would have shown a 250 lifetime pool (rule 9b). Flagging only
  because it confirms the rule rather than contradicting it.

**What is actually left is §4.3–§4.5: there is no way to ACT.** Every admin
route is a `GET` (the only non-GET under `/v1/admin` is the demo-preset pair).
So the console can now diagnose completely and repair nothing — the owner can
see that a customer's job died, read their claim, and read who changed what,
then has to go and do something about it by hand.

In the order they matter:

1. **`POST /v1/admin/accounts/{user_id}/credits`** `{items, reason}` — grant
   items after OUR failure burned their quota. This is the one that turns a
   support email into a fix, and quota being append-only (rule 9c) means there
   is no other way to make someone whole.
2. **`POST …/claims/{claim_id}/reprice`** and **`…/unstick`** — re-run pricing
   on someone else's stuck lines, and free a claim wedged in `processing`
   because a worker died. Today only the scheduled reaper can do the second.
3. **`PATCH …/accounts/{user_id}/plan`** — set plan / billing_state, including
   `comped` and `internal`. Note `plan` is still constrained to
   `('trial','pro')`, so this needs a migration; both states must stay excluded
   from the revenue rollup by construction, which `/v1/admin/revenue` already
   appears to do.
4. **`POST …/suspend` / `…/restore`**, then **`…/delete`** (the cascade behind
   "delete my account", currently an email to us).

The two rules at the top of this section still hold: no impersonation, and
every one of these audited and readable back through §4.2.


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

## 3. Make the depreciation schedule and comp routing editable — DECLINED

**Status:** sent 2026-09-28. **The contract question is answered: a schedule
edit cannot rewrite priced lines.** Depreciation amount, pct, method and rule
version are stored on each item at pricing time, so a claim exported last week
reopens exactly as it was — rule 22 holds by construction, and no re-price is
implied by an edit.

**DECLINED 2026-09-29.** Kevin stays on the XactContents schedule, and
depreciation is edited PER LINE inside a worksheet — `dep_manual` (0–1) on the
override/edit path already locks a line's depreciation, and that path works. No
schedule write routes are coming, so the Platform screen is final as a
read-only surface: it answers "why did that line depreciate like that?", which
is what it is for.

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

## 1. Failed jobs: an admin can see them and do nothing — DONE

**Status:** **shipped 2026-09-29.** `POST /v1/jobs/{id}/retry` (409 rather than
a second enqueue for a job that is not dead-lettered) and
`POST /v1/jobs/failed/clear` (admin only, must name `job_ids` or
`all_failed: true`). Both wired into the System screen, per cause group, with a
confirm on Clear because it destroys the traceback.

**Two corrections to what that screen was telling us**, both ours to own: the
"50 rows" was the server's DEFAULT `limit=50` read as a total — the real number
was 79 — and it now asks for 500 and prints "N+" if it ever fills. And 77 of
those were not a fixed bug but a live race (deleting a claim while its photos
were still extracting dead-lettered every queued job), since fixed. The queue
reads 0.

The original diagnosis follows, kept because it is how the count stopped meaning
"needs attention".

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
