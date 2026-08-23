# Backend asks from the frontend build

Raised while wiring the production worksheet against the live API.

## 1. ~~`ClaimSummary` needs `total_tax` / `total_depreciation`~~ — SHIPPED (a004e82, migration 0037)

The design's totals bar is five boxes: **Items · RCV · Depreciation · Tax · ACV**.
`GET /v1/claims` returns `total_rcv`, `total_acv`, `item_count`, `photo_count` —
no tax or depreciation total.

- **Depreciation** is currently restated from the money contract's own identity
  (`acv_total_incl = rcv_total_incl − depreciation_amount`, so
  `Depr = total_rcv − total_acv`). It works, but clients should not have to
  restate server math. There is a `TODO` on that line to read
  `total_depreciation` verbatim once it exists.
- **Tax has no identity to recover it from.** The box renders a dash. Summing
  the loaded page client-side would be wrong money — only part of the claim is
  in memory, and the frontend does not do money arithmetic.

## 2. ~~Bulk retry for capacity-deferred rows~~ — SHIPPED (09b891e)

`POST /v1/claim_items/retry-deferred` appears in the prototype spec but does not
exist on the live API. **Confirmed being built as
`POST /v1/claims/{claim_id}/retry-deferred`** (claim-scoped, retries only
`quota_exhausted` / `budget_exhausted` rows, skips genuine `needs_manual`).

Interim frontend behavior: the deferred bar renders and names the count, but the
Retry action is **disabled** pending that route. Looping per-row
`POST …/reprice` would burn the shared `/process` 30/min limit — on a claim with
200+ deferred rows that is several minutes and multiple passes for a worse
result.

## 3. ~~`items/bulk` should accept an empty description with `price: false`~~ — SHIPPED (9dce2c1)

Adding a line item without a photo is a one-row `POST /v1/claims/{id}/items/bulk`
call, which is right. But `description` is required at **2–300 chars**, so a
deliberately blank template line cannot be created in one call.

That conflicts with the contract's own `placeholder_row` concept — a line that
means *the adjuster fills this in*. The frontend currently works around it:

1. create the row with a throwaway description, then
2. immediately `PATCH /v1/claim_items/{id}` with `description: null` to clear it.

Two round-trips, and a transient "New item" flashes in the grid before the PATCH
lands (it also matches searches for that moment). **Allowing an empty-string
description when `price: false`** would make this one call with no flash — the
row is deliberately unpriced anyway, so there is nothing to search against.

## 4. Claim intake metadata is null on every existing claim

`ClaimSummary` *does* carry `date_of_loss`, `loss_address`, `carrier`,
`policy_number` and `claim_number` — the fields exist. But every claim in the
demo account has them null, because claims auto-materialise from
`POST /v1/process` / staging uploads, which capture no intake metadata.

The worksheet header now renders the labels with a dash rather than omitting
them (silent omission is what the design forbids). Nothing is needed from the
API — but the **intake flow must send this metadata on create**, or the header
stays dashed in production too.

## 5. ~~Adjuster-entered proof URL on manually priced lines~~ — SHIPPED (a004e82)

**When Kevin prices a line, `alternative_sources[0].link` is the
substantiation. When an adjuster overrides or manually prices a line, the comps
drop and there is no field to carry their own proof** — a receipt page, a
retailer listing they found, an appraisal URL. The export's Source Link column
then prints blank for exactly the lines a carrier questions hardest.

This blocks a locked product rule: CLAUDE.md rule 12 says entering a manual
value "exposes the `+` affordance to attach a proof URL". It is a backend gap,
not a design cut.

**Request:** a `manual_source_url` (or accept a single-element
`alternative_sources` write) on `PATCH /v1/claim_items/{row_id}` — descriptive
edit semantics, so no valuation change and no `overridden` flag — validated as
a URL, rendered in the Link column and emitted in exports the same way an
engine comp link is.

**Frontend behavior is already designed and waiting:** a dashed `+ add` chip on
link-less rows (`k-src-add`) → inline URL input (`k-src-input`) → saves on
commit. Until the field exists the Link cell stays **empty** — not a chip —
because a control that accepts a URL and discards it leaves the adjuster
believing the line is substantiated.

## 6. ~~A category-only override should re-run the depreciation engine~~ — SHIPPED (4eafa04)

`PATCH …/override` documents that only **`age_years`, `depreciation_method` or
`dep_manual`** "always route through the engine". So a **category-only**
override changes the content class and leaves the previous rate standing: row
at age 2 reads 66.7% as Pet Supplies (3-yr life) and still reads 66.7% after
being reclassified to Electronics, where it should be 40%.

Content class **is** a valuation input — it selects the schedule the rate comes
from — so a class change without a recompute leaves the row internally
inconsistent, and the export inherits it.

**Frontend workaround in place:** the class picker resends the row's own
`age_years` alongside `category`, which fires the documented trigger. That
works, but "every client must know to resend age_years" is a trap the next
integrator falls into.

**Request:** treat `category` as an engine trigger on `override`, same as
`age_years`. The `dep_manual` lock should keep surviving it, per 80f8831.

## 7. ~~`manual_reason` is not re-evaluated when the content class changes~~ — SHIPPED (4eafa04)

Reclassifying a row **out of** an appraisal class leaves `manual_reason:
"manual_class"` on it. A Jewelry line moved to Books & Media keeps the reason,
so it keeps rendering the amber special-limits highlight and stays unpriced —
the row now claims a coverage-cap constraint that no longer applies.

Verified in `main.py`: the override handler never touches `manual_reason`; only
`reprice` clears it (`{"status": "processing", "manual_reason": None}`).

**The frontend cannot fix this.** There is no `special_limits` field on the
item, so `manual_reason === "manual_class"` is the only payload signal for the
amber cue — and CLAUDE.md rule 20 explicitly forbids deriving special limits
from the category at render time (`SPECIAL_LIMITS.has(row.cat)` in a component
is called out as a bug). Rendering the stale reason is the correct behaviour
for a payload that is itself stale.

**Request:** re-evaluate `manual_reason` when `category` changes on
`…/override` — clear `manual_class` when the new class is not an appraisal
class, and set it when it is. Ideally the row also becomes priceable again,
since the reason it was withheld no longer holds. (Pairs naturally with ask #6,
which asks the same edit to re-run the depreciation engine.)

**Adjuster workaround meanwhile:** reprice the row after reclassifying — that
clears `manual_reason` and re-runs the pipeline.

## 9. ~~502 on `GET /v1/claim_items` for one claim~~ — RESOLVED (deploy/migration race)

`claim_id=chaos3new-1786734681` returns **502** to an authenticated caller while
`GET /v1/claims` succeeds, so the failure is per-claim rather than endpoint-wide.
Checked from the frontend side: `/healthz` and `/readyz` both 200, and the same
path answers 401 unauthenticated — so it is reachable and routed, and the 502 is
upstream (the contract's DB/storage/queue case).

The worksheet now prints the server's `detail` and the `X-Request-ID` with a
Retry, so the next occurrence carries a traceable reference.

## 11. ~~`override` should return the tax-inclusive line totals~~ — SHIPPED (b443ee5 / 091dc33)

Editing a price is currently TWO sequential round trips, and the adjuster waits
through both:

1. `PATCH …/override` — recomputes and returns `applied` (rcv, acv, category,
   depreciation_pct, manual_reason)
2. a re-read — because the contract computes `ext_cost`, `tax`,
   `rcv_total_incl`, `depreciation_amount` and `acv_total_incl` **on read**, so
   the write response cannot carry them

The frontend already applies everything in `applied` on the first trip, so the
class, the rate and the amber update immediately. But Ext. Cost, Sales Tax,
RCV + Tax and ACV — the columns the adjuster is actually watching when they
type a price — cannot settle until the second trip returns.

**Request:** include the five tax-inclusive columns on `OverrideResponse`
(either inside `applied` or alongside it). The server has just computed them;
returning them removes an entire round trip from every money edit and is the
only way to make the money columns update instantly without the client doing
valuation math, which rule 20 forbids.

Same applies to `PATCH /v1/claim_items` and `PATCH /v1/claim_items/category`,
both of which can change quantity or class and therefore the totals.

## 12. `access-control-max-age: 600` re-preflights all day

Every write pays a ~192 ms CORS preflight because the cached preflight expires
after ten minutes. Raising it (86400 is the Chromium cap) removes that hop from
all but the first write of a session. Backend-side; noted here so it is not
lost.

## 13. Smaller notes

- `ClaimItemSummary` has no `ext_cost`. The worksheet's **Ext. Cost** column is
  restated from `rcv_total_incl − tax` (the contract guarantees
  `Ext + Tax == RCV + Tax`). A server field would remove the last piece of
  client-side money restatement.
- No bulk category endpoint — re-categorizing a selection loops
  `PATCH …/override` per row. Fine at current selection sizes; worth revisiting
  if bulk edits get large.
