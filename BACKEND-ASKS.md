# Backend asks from the frontend build

Raised while wiring the production worksheet against the live API.

## 1. `ClaimSummary` needs `total_tax` (and ideally `total_depreciation`)

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

## 2. Bulk retry for capacity-deferred rows

`POST /v1/claim_items/retry-deferred` appears in the prototype spec but does not
exist on the live API. **Confirmed being built as
`POST /v1/claims/{claim_id}/retry-deferred`** (claim-scoped, retries only
`quota_exhausted` / `budget_exhausted` rows, skips genuine `needs_manual`).

Interim frontend behavior: the deferred bar renders and names the count, but the
Retry action is **disabled** pending that route. Looping per-row
`POST …/reprice` would burn the shared `/process` 30/min limit — on a claim with
200+ deferred rows that is several minutes and multiple passes for a worse
result.

## 3. Smaller notes

- `ClaimItemSummary` has no `ext_cost`. The worksheet's **Ext. Cost** column is
  restated from `rcv_total_incl − tax` (the contract guarantees
  `Ext + Tax == RCV + Tax`). A server field would remove the last piece of
  client-side money restatement.
- No bulk category endpoint — re-categorizing a selection loops
  `PATCH …/override` per row. Fine at current selection sizes; worth revisiting
  if bulk edits get large.
