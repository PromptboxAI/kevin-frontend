# Frontend backlog — the adjuster product

Audited 2026-08-26 against the routed pages, the design screens in
`design/pages/`, and the 71 live `/v1` routes. The backend has confirmed every
route on this list is live and tested, so nothing here is blocked on them.

Ordered by what breaks an adjuster's day, not by screen count.

---

## Settled during the audit — do not re-open

- **Proof-of-Loss timezone (old ask 22): NOT A BUG.** The export prints no
  generated-on timestamp. The only date on the document is `date_of_loss`, a
  static `YYYY-MM-DD` string the adjuster typed. There is no UTC-vs-local
  conversion to build, and the worksheet's `exported_at` tooltip is display
  only.
- **`GET /claims/{id}/preview` is GONE.** It was a redundant alias for the
  claim detail and has now been removed — it returns 404. Nothing in this
  codebase called it, and `ROUTES.md`'s only "preview" mention is the
  written-import wizard step, which is unrelated. An export preview must be
  rendered client-side from item fields already in state.
- **Claim progress does NOT come from a jobs endpoint.** `/v1/jobs/*` is
  admin-only worker health. Poll `GET /v1/claims/{id}` and read
  `status_counts` → `{processing, completed, needs_manual, failed, overridden}`.

---

## 1. Client proposals have no adjuster side — IN PROGRESS

The portal lets an insured propose an item Kevin missed, and it lands in a
queue nothing reads. A client can report the garage freezer and watch it
vanish. This is the only gap where a shipped feature actively misleads someone.

Routes: `GET /v1/claims/{id}/proposals` ·
`POST /v1/proposals/{id}/accept` · `POST /v1/proposals/{id}/reject`

Contract that shapes the UI:

- Accepting is an **enrichment step**, not a rubber stamp. `ProposalAcceptRequest`
  takes `description`, `room_area`, `make_mfr`, `model_number`, `category`,
  `quantity`, `age_years` — every field optional, each overriding what the
  insured wrote. This is where "clothes" becomes "Nike Air Max 270 mens size 10",
  and it is the whole reason new items are mediated rather than written straight
  through.
- **`price` defaults to FALSE.** Accepting must not silently spend SerpApi
  budget. An unpriced row is a normal state that `/reprice` or
  `/retry-deferred` picks up later.
- **409 on a second decision.** Accepting twice would put the same item on the
  schedule twice, and a duplicate line is a real money error.
- A rejected proposal carries no messaging back to the insured by design; the
  portal input simply returns.

## 2. ~~Claim lifecycle is unreachable~~ — MY AUDIT WAS WRONG

I reported this as unbuilt and orphaned. It was neither. The dashboard row menu
already wired all four verbs, the **Archived** filter chip already existed, and
the mutation is called `claimAction`, not `setClaimStatus` — I had the name
wrong too, which is how I convinced myself it had no callers.

The real gap was one screen wide: **the worksheet header had no lifecycle
action**, so an adjuster deciding a claim was done had to walk back to the
dashboard to say so. Built as a `⋯` menu beside Export, reusing `claimAction`
and the row menu's own gate (work in flight, never the label — a closed claim
can still have lines pricing, because `closed` outranks `processing` in the
derived status).

Delete and Duplicate are deliberately NOT repeated there: they are list
operations. You delete a claim you are not inside, and duplicating one you are
editing invites confusion about which copy you are now looking at.

Along the way, `CLOSED_STATUSES` was hoisted into `types.ts`. Two copies had
already been declared locally and a third was about to be; a divergent answer
to "which statuses are shelved" shows up as a menu offering Re-open on a live
claim.

## 3. ~~Processing has no screen~~ — BUILT

`/claims/:claimId/processing`, and Process now lands there instead of dropping
the adjuster onto a half-built worksheet.

Every figure is the real `status_counts` tally. The design's `processing.jsx`
is a 90-second animation driven by wall time and is deliberately NOT ported: a
progress bar that is lying is worse than none. Polling backs off (2s → 4s → 8s)
and stops when `processing` hits zero, then hands off to the worksheet on its
own — the adjuster asked for an inventory, not a progress screen.

Two judgement calls worth keeping:

- `needs_manual` counts as SETTLED, not failed. It is a line waiting on a
  human, which is a normal outcome, and counting it as incomplete would leave
  the bar stuck below 100% forever on a claim with jewellery in it.
- The outcomes render as a flat list, not the design's sequential stage bar.
  They are terminal buckets a line lands in; drawing them as a pipeline would
  imply an order that does not exist.

Never blocks: "Open worksheet so far (N)" is live throughout, because rows
exist as they land. A run that stops moving for 90s says so rather than
spinning silently.

## 4. ~~Audit log~~ — BUILT, item-scoped

`ItemHistory` in the item drawer: lazy `GET /v1/claim_items/{row_id}/events` on
first expand, because an item's history is unbounded and most rows are never
asked about.

There is NO claim-wide feed endpoint and none should be built. The claim-level
"Notes & audit" tab now points at the worksheet, where opening any row reaches
the trail. Rule 5: a timeline, never a collaboration tool.

Copy branches on `event_type`, never on payload shape, and unknown types render
rather than disappear — a trail that silently omits what it does not recognise
is worse than one saying "status changed", because the gap is invisible.

`lkq` and `bucket_used` are surfaced here deliberately: adjuster-facing IN THE
APP, never in an export. The export builder has no access to this endpoint.

## 5. ~~Row-level evidence~~ — BUILT (photos + receipt + holdback)

`ItemEvidence` in the drawer, beside the history panel.

**The receipt does NOT set `claimed_rcv`.** The route "touches no valuation
field" by design -- the schedule is what the carrier reconciles the holdback
against, so it must not move because a file arrived. The file proves the spend;
the numbers claim it; they are separate actions and the copy says so, or an
adjuster attaches a PDF, sees nothing change, and concludes it is broken.

**PDFs are accepted here and nowhere else in the API** -- forwarded email
invoices arrive as PDFs, and the image pipeline cannot decode one. HEIC is
normalised server-side with EXIF stripped, which matters more on a receipt
(photographed at home) than on contents evidence.

**Holdback is gated to closed/archived claims.** It is post-settlement by
definition, and showing it during the estimating pass invites receipts attached
before anyone has been paid.

`claimed_rcv` and `replaced_qty` are always PAIRED, and the count pre-fills
from the line quantity: an amount without a count computes $0 recoverable on
money genuinely owed. `recoverable` is the server's figure applied verbatim --
`services/holdback.py` owns the formula and nothing here recomputes it.

Photo detach says "Unlink", because "Remove" beside a claim's only evidence
reads as destruction when the route explicitly does not delete.

### Unverified: commit-on-blur delivery

The commit LOGIC is verified against live data (claimed $60 on a line
scheduled $71.84 / paid $43.10 -> recoverable $16.90, count auto-filled). But
the browser pane would not composite this session, and a backgrounded page
dispatches no focus events -- a native blur listener recorded zero on a real
focus move. So blur DELIVERY could not be exercised. Enter was added as a
second path for the same reason. Worth 30 seconds with the pane displayed.

## 6. Written import — the second intake path

Total-loss lists arrive as PDF/CSV/XLSX with no photographs. Routes live:
`items/parse` → `items/bulk/preview` → `items/bulk`. Design screen `75`.

Rule 24: parsing is server-side (real inventories are PDFs — never add a
browser parser); the first three steps create nothing; `price:false` on `bulk`
is NOT a dry run, it still inserts; capped at 500 rows per request; rows
flagged `likely_heading` are pre-selected for removal, never auto-dropped.

## 7. Claim overview + Photos tab

`Overview` is inert; `Photos` currently routes to staging as a stand-in.
`GET /claims/{id}/photos` is live. Design screens `12` and `16`.

## 8. Rooms

Full CRUD live (`GET/POST /claims/{id}/rooms`, `PATCH/DELETE /rooms/{id}`)
plus `PATCH /claim_items/assign-room` for bulk assignment. The worksheet has a
free-text room field and no way to manage the set or bulk-assign.

Note: nothing currently sends the per-batch `room` at upload, which is why
every row on the demo claim reads `—`.

## 9. ~~Bulk row delete~~ — NOT A GAP

`DELETE /v1/claim_items` takes `item_ids`, documented at `FRONTEND.md:575`, and
it is the consistent key across assign-room, staging process and bulk import.
The 422 I hit was the API enforcing its contract, not an inconsistency. The
worksheet still has no delete CONTROL, which is worth building, but there is
nothing to reconcile.

## 10. Mobile capture

`POST /claims/{id}/pair-token`, `/pair-token/revoke`, `POST /v1/pair`. Four
design screens (`11`, `26`, `27`, `28`). Whole surface, field-facing.

## 11. Settings

Six screens designed (`31`–`36`: profile, agency, export defaults,
integrations, billing, API), plus `10-Carrier-settings` and
`14-Settings-pricing`. None built. `GET /v1/depreciation-rules` and
`GET /v1/sources` feed these.

## 12. Exports history · holdback recovery

Design `13` and `77`. `GET /claims/{id}/holdback-export` is live.

---

## Carrying unverified — check when the data exists

- **`delivered_at` / `delivery_error`** render in the share sheet but are null
  everywhere until Increment 3 ships. The redeliver button has never seen a
  real delivery.
- **The substantiation warning** has only ever fired in unit tests: Godfrey has
  51 of 51 priced lines substantiated, so it correctly stays silent there.
- **The `vision_fallback` cue** was verified by forcing the flag; every real set
  clustered so far has validated.
