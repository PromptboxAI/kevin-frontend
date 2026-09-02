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

## 4. ~~Claim intake metadata is null on every existing claim~~ — FRONTEND, BUILT (59ac6be: /claims/new)

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

## 12. ~~`access-control-max-age: 600` re-preflights all day~~ — SHIPPED (e8d7d4b, now 86400)

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

## 14. ~~Staging `group.reason` carries identified data~~ — MY BUG, fixed in 0bebc43

`GET /v1/claims/{id}/staging` returns, on the live `godfrey-kitchen-fire`
session, `reason` strings like:

- "Single Hot Wheels '70 Plymouth Road Runner die-cast car in original packaging."
- "Single shoe sole, Madden brand, distinct item shown wet on ground."
- "Honeywell Bissell vacuum filter package, distinct product."

Staging is a **pre-Vision** surface: the clusterer is only supposed to know
capture time and EXIF proximity, and the screen must never show item names,
makes or models before the adjuster has agreed to spend the run. Brand names in
`reason` mean identification has already happened, or that the field is being
reused for something else.

The frontend therefore **does not render `reason`** on the staging card, which
loses the design's raw-metadata line ("2 photos · 4s apart"). Two asks:

1. Make `reason` structural clustering metadata (span, gap, gate that fired) —
   or add a separate field for it — and keep identified text out of this
   response entirely.
2. Add `filename` and `taken_at` to `StagingPhoto`. The design's card prints
   `IMG_4417.HEIC · IMG_4418.HEIC` and `2 photos · 4s apart`; the payload
   currently carries only `id`, `note`, `room`, `status`, so both lines
   degrade to "N photos".

## 15. `GET /v1/staging/photos/thumbnails` returns full-size originals

The signed URLs resolve to the 4000×3000 originals (~3–5 MB each). The frame
they land in is 285×186. Sixty of those is roughly 250 MB of transfer to draw a
grid of postage stamps, and it is the single slowest thing on the screen. A
server-side resize (long edge ~600px) on this endpoint only — the lightbox and
the worksheet still want the original — would cut it by two orders of
magnitude.

## 16. ~~No delete path for a staging photo or group~~ — WRONG, it exists

**Retracted.** `DELETE /v1/claims/{claim_id}/staging/photos/{photo_id}` has
been there all along (main.py:4857) — "Remove a staged photo BEFORE processing
— an accidental upload, or a personal shot that came along with the camera
roll." My route survey missed it because the decorator spans two lines and the
line carrying `staging` is not the line carrying `@v1.delete`.

Nothing is asked of the backend here. The frontend owes the work: the design's
per-card trash action is buildable today as one DELETE per member photo, with
the destructive confirm the design already specifies ("N photos will be removed
from this claim. This cannot be undone. To keep the photos but leave them out
of the run, use Exclude instead.").

Worth keeping in view while building it: the endpoint is scoped to BEFORE
processing, so the action belongs only on a session that has not been promoted
— the same `editable` gate the processed-session pass added.

## 17. ~~No field for the contents-coverage LABEL on a claim~~ — SHIPPED, now wired

Rule 14 is explicit that a claim carries BOTH a `ppLimitLabel` (Coverage C ·
Personal Property · Contents · Coverage B for renters · Business Personal
Property) and the `ppLimit` amount, because policies name contents coverage
differently and printing a coverage letter as though it were universal
misrepresents the policy.

`ClaimMetadata` has `personal_property_limit` but no label field, and it is a
strict model — sending `pp_limit_label` 422s the entire create. The New-claim
screen therefore captures the label in a select (the design's control, and the
one the rule requires) but cannot persist it.

Ask: add `pp_limit_label: str | None` to `ClaimMetadata`, defaulting to null
rather than to "Coverage C" — the whole point of the field is that the default
is wrong for renters and commercial policies.

## 18. Deleting the last photo in a staging group leaves an empty group behind

`DELETE …/staging/photos/{id}` removes the photo but not the group row it
emptied. Verified on a scratch session: after deleting the only photo,
`GET …/staging` returns `photo_count: 0` alongside
`groups: [{group_key: "51-0", kind: "context", photos: []}]`.

The frontend filters zero-photo groups out — an empty set has nothing to show
and promotes nothing, and counting it reported "1 photo set" for a session with
0 photos. Flagging it because the same row is presumably visible to anything
else reading the session, and because `/staging/process` would iterate it.

Not urgent; a prune in the delete path (or a `having count(*) > 0` on the read)
would settle it.

## 19. ~~BLOCKER — `resolve_share` never selects `paid_at`~~ — SHIPPED (f662e79)

The payment landed. Stripe shows `checkout.session.completed` delivered
**200 OK at 8:02:59 PM**, and a manual resend at 8:12:17 correctly returned
`{"share_id":"9554aacb-…","unlocked":false}` — the conditional update matching
zero rows is exactly what an idempotent retry looks like once `paid_at` is set.

But `GET /p/{token}` still reports `paid: false`, because the read path never
loads the column:

    # services/shares.py:331 — resolve_share()
    .select("id, owner, claim_id, audience, expires_at, revoked_at, "
            "allow_download, released_at, view_count, unlock_price")

`paid_at` is absent, so `share.get("paid_at")` is always `None`, so
`_paywall_unlocked()` (main.py:3295) always returns False. No payment can ever
unlock a share through this path, no matter how many webhooks succeed.

Fix: add `paid_at` to that select list.

### Second gate, independent of the above

`can_download = allow_download AND released_at` (main.py:3522), and the webhook
sets only `paid_at` / `payment_ref` / `payment_event_id` — never `released_at`.
On share `9554aacb` `released_at` is null, so **downloads stay off even once
`paid_at` is visible**, until someone calls `POST /v1/shares/{id}/release`.

That may well be deliberate for an adjuster-sent link. It is worth a decision
for a PAYWALLED one: the customer has paid for the document, and asking them to
wait for the adjuster to also release it makes the purchase feel unfinished.
Either the webhook stamps `released_at` alongside `paid_at` on a paywalled
share, or the product accepts that paying unlocks the lines but not the files.


## 20. Increment 3 (paid-document delivery) — what the frontend needs settled

`delivered_at` / `delivery_error` are already on `ShareSummary`, which is the
right shape. Four things to agree BEFORE the job ships, because each one is a
404 or a dead pixel if we guess differently.

**a. The emailed link must resolve to a route that exists.** The public router
has exactly one public path: `/p/:token`. If the delivery email points at the
existing share URL, nothing is needed. If it mints a SEPARATE signed
document URL, send the path shape and I will add the route — a backend-minted
link 404ing on the frontend is what started this rebuild, and it should not
be the thing that greets someone who has just paid.

**b. `delivered_at` and `delivery_error` currently have nowhere to render.**
There is no share-management UI in the app yet: every share in testing was
minted by hand against the API. So the adjuster cannot see delivery state at
all — the same gap you just closed for `paid_at`, one screen further along. I
am building the share sheet; flagging it so nobody assumes the field is
already visible because the model declares it.

**c. Is there a retry?** If `delivery_error` is set, the adjuster needs an
action, not just a red line. If a retry endpoint is coming, name it and I will
wire the control in the same pass. If delivery only ever retries internally,
say so and the UI will state that instead of offering a button that lies.

**d. Reuse an existing email, don't mint a 17th.** `design/emails/` holds 16
send-ready templates. `06-export-ready.html` is the closest fit and
`10-payment-receipt.html` covers the charge. If delivery needs its own, it
should join that folder so the set stays the single source — the notification
rows in Settings and the `notifications` docs article are kept in sync with it.

## 21. Sparse source links — the frontend warning, and the one number it needs

Agreed the API should not block minting on this, and that the warning belongs
here. Making it concrete needs one thing from the payload.

`ClaimItemSummary` carries `manual_source_url`, and the portal's `PortalItem`
carries the derived `source_link`. At MINT time the adjuster is not looking at
the portal, so the count that matters — *priced lines with no substantiation* —
has to come from either the claim rollup or a scan of the items already loaded.

Deriving it client-side is fine and I will do that by default. But it is only
correct if the worksheet's item payload exposes the SAME derivation the portal
and the xlsx use (`sources.substantiation_link`), not just `manual_source_url`.
If the two can disagree, the warning will quote a number the document does not
honour, which is worse than no warning. Confirm which, or add the derived
`source_link` to `ClaimItemSummary` and the question disappears.

## 22. Proof of Loss date: UTC stamp vs. local rendering

Verified stamping on a throwaway claim: `exported_at` came back as
`2026-08-26T00:21:39Z`, and the worksheet tooltip reads **Aug 25, 2026** —
correct for the adjuster's timezone (00:21 UTC = 20:21 EDT the previous day),
and correct as "the day I produced this".

But this is the Proof of Loss date, and the .xlsx presumably prints its own
rendering of the same instant. If the document formats `exported_at` in UTC
while the app shows the adjuster's local date, a schedule produced any evening
after 8pm Eastern carries **one date on screen and the next day's date in the
file the carrier receives**.

Not asking for a change yet — asking which one the document prints. If the
xlsx renders UTC, the two should be reconciled deliberately, and the answer is
probably that the export should carry the adjuster's local calendar date, since
that is what "the day the schedule was produced" means to everyone reading it.


---

# Issue 14 — CLOSED, and it was mine

**The rendered string was `group.reason`, and my own component was rendering
it.** The scaffold printed it into `.k-stage-rowreason` on the set card. On
2026-08-24 I queried the live page:

    [...document.querySelectorAll('.k-stage-rowreason')].map(e => e.innerText)
    -> "Single Hot Wheels '70 Plymouth Road Runner die-cast car in original
        packaging. || Single shoe sole, Madden brand, distinct item shown wet
        on ground. || ..."

That is a query against the DOM, so those strings were on screen — but they
were on screen because I put them there. `0bebc43` rewrote the card and
stopped rendering the field; its subject line is literally "stop showing
pre-Vision item names". The same commit filed this ask, which is the mistake:
I fixed my own defect and reported it as the backend's in one action.

Nothing is owed here. `reason` is load-bearing for
`vision_cluster.is_fallback(reason)` at promote and is not for display, which
is exactly how it is now treated: read from the payload, never rendered.

`suggested_description` / `suggested_make` naming brands is correct and has
never been rendered on staging — an inventory line a carrier reconciles against
a receipt should say "Hot Wheels '70 Plymouth Road Runner".

## 24. `vision_fallback` — which surface should render it?

Noted: key "couldn't validate" off `vision_fallback`, never off a `reason`
prefix, and render `suggested_description` as the adjuster-facing line. Both
will be wired.

One question before they are, because the answer differs by screen:

- On the **worksheet / item drawer** this is straightforward — an adjuster-
  facing surface, post-promote, where a "couldn't validate" chip and the
  long-form description both belong.
- On **staging** it collides with a locked rule: rule 23 says staging is a
  PRE-Vision surface that must never show identified data — no item names, no
  makes, no models — because the adjuster has not yet agreed to spend the run.
  `suggested_description` is an item name by construction.

If those fields are populated on staging groups, rendering them there would
undo the fix above. So: is `vision_fallback` meant for the staging card (as a
neutral "Kevin could not read this one" cue, with NO description shown), for
the worksheet, or for both with different content? Happy to wire whichever —
just not to guess a fourth time on this one.
## 23. `filename` is permanently null on older photos — handled

Noted that pre-this-week uploads cannot be backfilled. The UI already degrades
rather than breaking: `photoLabel()` falls back to `Photo {id}` and
`photoFilenames()` drops the nulls, so a set with no captured filenames shows
its capture metadata line instead of an empty separator run. Unit-tested for
null, absent, and whitespace-only.

One request in return: send `filename` as **null**, not as an empty string or
the literal `"null"`. The guard handles all three, but only null is honest
about the field never having been captured.


## 25. ~~Two accepted fields the intake screen never collects~~ — BUILT, per-claim

`ClaimMetadata` accepts `estimator_name` and `business_name` (schemas.py:152-3)
and both store correctly — verified with a round-trip. The New-claim screen
asks for neither, so every claim created through the UI has them null.

They are preparer identity, which is the block a carrier looks at first on a
Proof of Loss: who prepared this schedule, and for which firm. Two questions
before adding fields for them:

1. **Should they be on the claim at all, or on the account?** They are the same
   two values on every claim an adjuster creates — Mariana Reyes / Reyes
   Adjusting, every time. Asking per claim is 14 keystrokes of retyping and an
   invitation to inconsistent spellings across a book of claims, which is worse
   than blank on a document a carrier reconciles.
2. If they belong on the account, is there a profile endpoint they should
   default from, with the intake fields prefilled and editable for the case
   where one claim is prepared by someone else?

Happy to add two plain fields if the answer is "per claim" — just flagging that
the shape of the question changes the right UI.


**Resolved:** per-claim, mirroring Xactimate. An estimate is a point-in-time
legal document — an adjuster who prepared an inventory in March must still be
named on it after they leave the firm, so a shared profile row that all claims
pointed at would rewrite history retroactively.

The retyping is solved client-side instead: previous values are offered back
from this browser as a native datalist, type-or-pick. That list is a
convenience with no authority — the claim holds its own copy of whatever was
submitted, so clearing it, editing it, or moving machines leaves every existing
claim untouched. Which is the same property the per-claim decision is protecting.


## 26. `unattached` never happens on a claim that staged its photos

Not blocking — the frontend handles it — but the documented contract and the
observed behaviour disagree, and the doc is the one I would have trusted.

`FRONTEND.md` on `?state=unattached`: *"This is where a photo goes when its
line item is deleted — nothing is destroyed, so a wrong bulk-delete is
recoverable."*

Observed on `godfrey-kitchen-fire`, detaching one frame from item 5556:

```
DELETE /v1/claim_items/5556/photos  {"photo_ids":[3909]}

photo 3909 →  { state: "staged", status: "promoted", session_id: 45, item_id: null }
GET  …/photos?state=unattached  →  { count: 0 }
```

The photo still belongs to staging session 45, so `state` derives to `staged`
rather than `unattached`, and the "re-use a photo" picker the doc describes
comes back empty on exactly the claims that have photos to re-use. Since every
photographed claim goes through staging, I think `unattached` may only ever be
reachable for photos attached outside a session.

`status` does separate the two cases cleanly, which is what I built on:

| state | status | meaning |
|---|---|---|
| `staged` | `clustered` | never processed — genuinely waiting |
| `staged` | `promoted` | its session ran; unlinked from a line, or promoted to nothing |

So the gallery derives a bucket rather than reading `state`, and an unlinked
photo is labelled *Backing nothing* instead of being sent back to a session
that already ran.

Two questions, whichever is cheaper:

1. Should `state` derive to `unattached` whenever `item_id IS NULL AND
   status = 'promoted'`, regardless of `session_id`? That would make
   `?state=unattached` mean what the doc says and let the picker work.
2. Or is the session tie deliberate, and the doc line the thing to correct?

Either answer is fine — I only need to know which, before the "re-use a photo"
picker gets built on `?state=unattached` and quietly returns nothing.


## 27. Two small additions the photo gallery wants

Screen 16 is built and working on `GET /v1/claims/{id}/photos`. Two gaps, both
minor, neither blocking — I have shipped around both.

### (a) No per-photo route to the original

`GET /v1/staging/photos/thumbnails` is the only per-photo image route, and it
serves the 600×450 derivative from `make_thumbnail`. The original is 4000×3000
and it does exist in storage — the only way to reach it is
`GET /v1/claim_items/{id}` → `image_url`, which is that line's **primary**
photo.

So on a screen whose job is examining evidence, "view full size" was showing a
600px thumbnail. For a single-photo item I can use the item detail's
`image_url` (48 of 52 items on the demo claim), but for the second and third
frames of a merged set there is no route to the capture at all — and a model
plate is exactly the kind of frame that is a second frame. The viewer now
labels those *"Preview — the original is only served for a line's main photo"*
rather than captioning a thumbnail as full size.

A `?size=full` on the thumbnails endpoint, or any per-`photo_id` signed URL for
the original, would close it. Same short TTL is fine.

### (b) `filename` and `taken_at` are stored but not returned

`main.py` writes both onto `staging_photos` at upload (`safe_filename`,
`parse_capture_ts`), and `ClaimPhoto` in `schemas.py` exposes neither. Two
consequences:

- The gallery captions every tile `Photo 3886`. The adjuster's own filename is
  what they recognise, and it is what they will quote in an email.
- **Timeline view stays disabled.** It needs a capture timestamp, which is the
  one thing `taken_at` is. Map stays disabled regardless — GPS is stripped at
  upload by design, which is correct and I am not asking for it back.

I know `taken_at` is the camera's clock and is often unset or wrong. Display
and ordering only is exactly what it would be used for, and a photo with a null
`taken_at` simply would not appear on the timeline.

Both are additive fields on a response model, so nothing I have shipped breaks
either way — happy to take them whenever they are convenient.


## 28. `assign-room` should stamp `room_area` — the export only prints the text

Rooms are built (backlog #8) and working, but the feature needs a two-step
dance on the client that one line server-side would remove.

An item carries two independent room fields, and `FRONTEND.md:455` says so
plainly: `room_id` is the relational link, `room_area` is the free text. What
that line does not say is which one matters at the end:

```
services/export.py:114   item.get("room_area") or ""      # .xlsx
services/export.py:435   item.get("room_area") or ""      # PDF
```

**`room_id` never reaches the document.** And `assign-room` (main.py:6772)
writes exactly one column:

```python
supabase.table("claim_items").update({"room_id": body.room_id})...
```

So filing items into a room — the whole point of rooms — changes nothing the
carrier sees. An adjuster could sort all 52 lines into Kitchen / Garage /
Master Bedroom, export, and hand over a schedule with a blank Room/Area
column. Verified live: `assign-room` alone leaves `room_area` null.

The frontend therefore does both halves — one `assign-room` call, then a
`PATCH /claim_items/{id}` per row to set the text, chunked ten at a time. It
works, and it is what shipped, but it has two costs:

1. **N+1 writes.** Filing 40 lines is 1 + 40 calls. There is no bulk text
   endpoint (`category` and `assign-room` are the only bulk ones).
2. **It can drift.** Two fields kept in step by a client is a race with any
   other writer, and a rename has to sweep the room's items a second time to
   stop them exporting a name that no longer exists.

Would you consider having `assign-room` set `room_area` to the room's name in
the same update (and leave it alone on unassign, since the words are the
adjuster's and are what exports)? That makes the two agree by construction and
turns the whole operation back into one call.

If you would rather they stay independent, the alternative that also closes it
is for the **export** to fall back to the room's name when `room_area` is null
— then the client can stop writing text at all. Either is fine; the current
split is the only shape that needs client-side syncing.

Not blocking — shipped and tested as-is.
