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

## 1. ~~Client proposals have no adjuster side~~ — BUILT

`ProposalsPanel`, opened from the worksheet header. Accept is the enrichment
step (every field overridable), `price` defaults to false so accepting cannot
silently spend vendor budget, and the `409` on a second decision is handled as
"already decided" rather than an error — accepting twice would put the same
item on the schedule twice.

The heading read IN PROGRESS long after the work landed. The contract notes
below are kept because they are the reasoning, not a to-do.

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

### Commit-on-blur — VERIFIED (2026-09-02)

Exercised on a closed `godfrey-kitchen-fire`, item 5543 (UGG sandal, scheduled
$162.93 / paid $40.73). Typed `150` with real keystrokes, moved focus to the
units field, and the blur committed on its own:

```
blur fired      -> true
claimed_rcv     -> 150
replaced_qty    -> 1        (auto-filled from the line quantity)
recoverable     -> 109.27   = min(162.93, 150) - 40.73
```

So the panel's whole reason for existing holds end to end: the count filled
itself rather than letting an amount-without-a-count silently recover $0 on
money genuinely owed. The earlier "a native blur listener recorded zero" was
the hidden tab, not the code.

**Still untested: clearing a figure by blur.** The browser tooling delivers
printable keys but not Delete or BackSpace, so the field could not be emptied
by hand — only overwritten. The clear path went through the API instead
(`{claimed_rcv: null, replaced_qty: null}` -> `recoverable: 0`), which proves
the endpoint but not the component's empty-string branch. Note that `Holdback`
uses raw inputs, NOT `EditableCell`, so it does not blank on focus and has no
`untouched` guard -- the two behaviours that made "clear the cell" unworkable
for the depreciation override do not apply here.

Claim restored afterwards: figures cleared, claim reopened to `in_review`,
`closed_at` back to null.

## 6. ~~Written import~~ — BUILT

`/claims/:claimId/import`, reachable from the photo drop zone ("No photos?
Import a typed or exported list"). parse -> map -> preview -> import, and the
first three create nothing.

Rules live in `import-rules.ts`, import-free, 24 cases. Decisions the live
parser then justified:

- **The mapping step shows even when pre-filled**, and that is not politeness.
  On a real CSV with an `Item` number column, `suggested_mapping.description`
  came back as column 0 -- the row number. Every other field was right. Auto-
  advancing would have searched "2", "4", "7" and priced a total-loss claim off
  row numbers.
- **Review shows the COMPOSED description**, not just counts. The preview
  reported `priceable: 3` for both the wrong and the right mapping and would
  have spent 6 searches either way. Counts cannot catch a mis-mapped column;
  reading "Whirlpool WRF535SWHZ French door refrigerator" can.
- Headings pre-deselected, never dropped. Both were flagged correctly on the
  test file.
- Room never folds into the description -- it IS the search query here.
- Resume restarts at the failed chunk; the route has no idempotency key.
- Spend quoted in searches (2 per priced item), not rows.

### Chunk boundary and resume — EXERCISED LIVE

1,200-row CSV, section headings every 200 rows, `price:false` so no vendor
budget was touched. Both paths hold.

- **Chunking.** Parsed 1,200 / 6 headings flagged. Preview: 1,194 will price,
  0 needs-your-price. Spend line read "about 2,388 vendor searches" and
  unticking price changed it to "No vendor searches" — the estimate tracks the
  toggle rather than being computed once. Three chunks ran (500 / 500 / 194)
  and the claim finished at exactly **1,194** items.
- **Resume.** With a throw forced on chunk index 1, the wizard stopped at 500
  created and offered "Resume from batch 2". Resuming climbed 866 → 1,038 →
  1,194 — **exact, no duplicates**. Restarting from zero would have written
  500 phantom lines, which is the whole reason `resumeFrom` exists.

`suggested_mapping.description` again came back as the `Item` number column on
a second, differently-shaped file. That is now twice out of two. The mapping
step earns its place.

**One thing this run cost.** The harness — a deliberate `throw` on chunk 2 —
reached `main`. A commit from the parallel billing session picked up my
in-flight `ImportPage.tsx` along with its own files, and every multi-chunk
import on that build would have stopped at 500 rows. Removed in `c10a0bc`.
A test that fails on purpose does not belong in a file another session may
sweep; next time it goes behind a query param, or on a branch.

## 7. ~~Claim overview + Photos tab~~ — BUILT

`/claims/:id/overview` and `/claims/:id/photos`. The Photos tab no longer
routes to staging as a stand-in: staging is ONE ingest session, this is every
photo on the claim including the ones a session already promoted.

Rules in `photo-rules.ts`, import-free, 32 cases. `useThumb` was lifted out of
`StagingPage` into `lib/thumbnails.ts` — two caches would mean two round-trips
for the same photo the moment an adjuster moved between the screens.

What the live payload changed, versus the prototype:

- **`state` alone is ambiguous.** Unlinking a photo from a row leaves it
  `state: 'staged', status: 'promoted'` — NOT `unattached`, and
  `?state=unattached` still answers 0. The contract's note ("this is where a
  photo goes when its line item is deleted") only holds for a photo with no
  staging session. `bucketOf()` splits *Waiting in staging* (`clustered`, never
  processed) from *Backing nothing*, so nobody is sent to a session that has
  already run. Filed as ask 26.
- **The attention strip was crying wolf.** Counting missing model numbers, as
  the prototype did, read "51 of 52 items need your attention" on a finished
  claim — because 50 of those lines are belts, sandals and handbags, which have
  no model number to be missing. It now counts unpriced lines only (1), and
  model coverage is a neutral row in *Where this claim stands* (2 of 52).
- **"Photos by room" is not ported.** Every photo comes back `room: null`, and
  the prototype filled that card by distributing the claim's photo count across
  rooms by largest remainder. Plausible-looking fiction on a document an
  adjuster defends.
- **No filename, timestamp, device or GPS** on the payload. Timeline and Map
  stay disabled, as designed; the detail panel shows what is known rather than
  three em dashes.
- **"Delete photo" became "Unlink from this line."** There is no delete for a
  promoted photo, and rule 22 says evidence is excluded, never destroyed.
  Verified live on item 5556: 3 frames → 2, primary preserved, RCV unchanged at
  $54.26, then re-attached and confirmed byte-identical.

Both screens read one claim record and one item fetch, so the header stats,
class rollup and gallery captions cannot disagree.

### Verified with the pane displayed

Thumbnails render — the IntersectionObserver fires and the grid fills as it
scrolls. Two layout defects only a real viewport could show, both now fixed:

- **The page did not fill the viewport.** `.k-photos` is
  `height: 100%; overflow: hidden` and scrolls INSIDE itself, so with no height
  on the shell it collapsed to content height: 1845px tall, sidebar stretched
  to 1753px, and the document scrolled instead of the grid. The design opts
  into a full-height shell per page — 05, 12, 16 and 17 each carry
  `html, body { height: 100% }` + `#root { height: 100% }` in their wrapper,
  and that never got ported. Added as a `:has()`-scoped rule, because the other
  73 design pages deliberately scroll the document.
- **The detail panel was a reserved empty column.** Its 360px track is held by
  the grid whether or not anything is focused, so an unfocused gallery rendered
  a quarter of the screen as blank paper. It now opens on the first photo, as
  the design does.

Two more found with it open:

- **The attention-strip links stranded mid-card.** The design's markup gives the
  text block no `flex`, which reads fine in the 3-column `.k-flags-band` but
  leaves the trailing link floating in the middle of a `--one` full-width card.
- **"View full size" was showing a 600×450 thumbnail.** The thumbnails endpoint
  is the only per-photo image route and serves a derivative; the 4000×3000
  original is reachable only through the item detail's `image_url`, which is
  that line's primary photo. The viewer now uses the original when the photo is
  the primary (48 of 52 items are single-photo) and labels the rest *Preview*
  rather than captioning a thumbnail as full size. Ask 27(a) would close it
  properly.

The `ItemEvidence` blur check is still outstanding — it needs a focus move the
pane can report, not just compositing.

## 8. ~~Rooms~~ — BUILT

A **Rooms** control in the worksheet toolbar (filter by room, create, rename,
remove) and **File in room…** on the selection bar. Rules in `room-rules.ts`,
import-free, 26 cases.

### The thing that shaped the whole feature

An item has **two independent room fields**, and only one of them reaches the
carrier:

| field | set by | reaches the export? |
|---|---|---|
| `room_id` | `PATCH /claim_items/assign-room` | **no** |
| `room_area` | free text, `PATCH /claim_items/{id}` | **yes** — `export.py:114` (.xlsx) and `:435` (PDF) |

`assign-room` writes one column (`main.py:6772`). So filing lines into a room —
the entire point of rooms — changes nothing the carrier sees. Verified live:
assign alone leaves `room_area` null. An adjuster could sort all 52 lines into
rooms, export, and hand over a schedule with a blank Room/Area column.

So **every assignment writes both**: one bulk `assign-room`, then a text PATCH
per row that needs one, chunked ten at a time. `assignPlan` only queues the
rows whose text actually disagrees, so re-filing rows already in a room costs
one call rather than N+1. Filed as **ask 28** — one line server-side retires
the dance.

Decisions worth keeping:

- **Unfiling clears the link but keeps the text.** Deleting the bucket an item
  sits in is not a statement that it has no room; the words are the adjuster's
  and they are what exports.
- **Renaming sweeps the room's items**, but only rows still carrying the old
  name — hand-typed text like "Kitchen counter" survives.
- **Removing a room says what survived** ("its lines moved to Unassigned and
  kept their Room/Area text"), because "delete" next to 40 line items reads as
  destruction when the API explicitly keeps them.
- **Unassigned is derived from the items**, not counted server-side, and is the
  bucket that is actually full on a real claim — everything lands there from
  processing.
- Assignment is on the **selection bar**, not in the rooms popover: filing is
  something you do to rows you picked, and putting it beside a delete control
  invites removing a room while meaning to file into it.

Verified live on `godfrey-kitchen-fire`: created Kitchen, filed 3 rows, and
both fields landed (`room_id: 4` + `room_area: "Kitchen"`), the Room/Area
column filled in, and the room rollup read 3 items / $102.19. Filing marks
nothing `overridden` — proved by isolating each call, and by the audit trail
(the filing logs as `edited`; the `overridden` events on those rows were price
changes from the parallel session, timestamped before the filing).

Claim restored afterwards: rooms deleted, nothing filed.

## 9. ~~Bulk row delete~~ — ALREADY BUILT (verified), and a real finding underneath

My earlier note said "the worksheet still has no delete CONTROL, which is worth
building." It has one, and it works — the entry was stale, not the code. This
is the second time I have filed something as missing that was already there
(see #2), so I checked before writing a line.

Verified live on a throwaway claim: select rows -> **Delete** arms a confirm
("Photos stay on the claim." · Cancel · Delete 2) -> **Cancel changes nothing**
-> confirm removes exactly those two, notice reads "Deleted 2 rows", and the
server agrees. `DELETE /v1/claim_items` with `item_ids`, `photos_detached`
surfaced in the notice when non-zero.

### What the test actually turned up: deletes renumber the claim

Line numbers are **positions**, not identities. `numberRows` is `index + 1` over
id-ascending rows, and the export does the same thing
(`enumerate(items, start=1)`, `services/export.py:135`). Nothing persists a
line number.

So deleting a row shifts every row beneath it. Four rows, delete #1 and #2, and
the survivors that were #0003/#0004 come back as **#0001/#0002** — confirmed.
Rule 22(b) says exactly this must not happen, because *"an export already sent
to a carrier cites those numbers."*

The frontend cannot fix it: there is no stored number to render, and inventing
a stable one here would disagree with the export, which is worse than the
current honest-but-shifting behaviour. Filed as **ask 29** (a `line_no` at
creation). What shipped meanwhile is the confirmation telling the truth — on a
claim with `exported_at` set it now reads "Lines below these renumber — the
export you already sent cites the old numbers." Silent before the first export,
where there is no document to contradict.

## 10. Mobile capture — PAIRING + CAPTURE BUILT AND VERIFIED

Split in two, because the handoff is the security-critical half and stands on
its own: the desktop can hand a phone an upload-only credential and take it
back. What that phone then *does* is the second half.

### Built: the handoff (`PairPhoneModal`, on the claim overview)

Two credentials, and conflating them is the mistake `pair-rules.ts` exists to
prevent:

| | lifetime | scope |
|---|---|---|
| **handoff token** (the QR) | ~2 min, single-use, burns on redemption | redeemable once |
| **capture token** (what the phone keeps) | ~hours | ONE claim, upload only |

- **The QR is real.** The design used `FauxQR`, a decorative grid, and a
  `Math.random` token. Added `qrcode-generator` (1 dep, encoding only) and draw
  its module grid as a single SVG path — no canvas, crisp at any size.
- **The token rides in the URL FRAGMENT**, never the query string. A fragment
  is not sent to servers, not logged, and not forwarded in a Referer — and this
  value is a bearer credential for someone's claim photos.
- **The countdown reads the wall clock**, not a decrementing counter: a
  backgrounded tab stops firing timers, and resuming from where it paused would
  show time the token does not have.
- **Revoke is honest about its limits.** It kills paired PHONES; it cannot
  recall a code nobody has redeemed yet — those die on their own in ~2 minutes,
  and the zero-case copy says exactly that instead of implying a recall.
- **One failure message.** The API returns the same `401` for unknown, expired
  and already-used so a caller cannot probe; the UI does not invent a
  distinction it was deliberately denied.

Verified live end to end: 43-char token → `200` with a capture credential
scoped to `godfrey-kitchen-fire` → **the same token again → `401`**, the
atomic burn working, with the identical message an invented token gets. Revoke
reported "Signed out 1 paired phone", and a second revoke reported the
no-phones case as a normal answer rather than an error.

### Built: the capture surface — VERIFIED END TO END (2026-09-02)

`/pair` and `/capture`, both PUBLIC routes: the phone has no account, and
requiring one is the friction the flow exists to remove.

The CORS fix (`2c2d030`) landed and the whole path works. Verified against
production on a throwaway claim:

```
pair          token in the fragment -> redeemed -> hash CLEARED from the URL
upload        2 photos, room "Kitchen"          -> both stored
room change   -> "Garage", 1 photo              -> batched separately, tagged Garage
note          "Ashley Trinell 6-drawer dresser" -> saved on that photo only
cross-claim   tmp-mob credential vs. godfrey    -> 403, "for a different claim"
```

The per-batch `room` now genuinely lands — the gap #8 left open, and the reason
every row on a real claim read `—`.

**A bug the live run caught, which no unit test could.** Photo ids were
assigned by a counter incremented INSIDE a `setShots` updater. React invokes
updaters more than once (StrictMode does it deliberately), so the counter ran
past the end of `photo_ids`, every shot got `undefined`, and `notesToWrite`
skipped them — **notes silently never saved**. The mapping is now computed
before state is touched, so it is the same however many times the updater runs.

It stayed invisible because the note failure was swallowed "so as not to
block". It no longer is: nothing blocks and the photo is safe either way, but
the screen says a note did not save. The adjuster typed that sentence standing
in the room, and on a set Vision cannot name it is the only thing steering
identification.

What is deliberately NOT ported from the design's camera app, each because it
would lie or cost something real: the live viewfinder (`getUserMedia` yields a
downscaled frame, while `<input capture>` returns the full-resolution file with
EXIF intact — and EXIF timestamps are what the clusterer groups on), flash and
SCAN BARCODE (torch needs a live stream; `BarcodeDetector` is Chrome-only), the
"queueing photos locally" banner (offline queueing is not built, so nothing
claims it), and the artboards' fake status bar and battery.

### Built: review (screen 28)

Reached from the camera ("Review N photos"), grouped by room, with the untagged
bucket sorted LAST — it is the one that needs work, and burying it above the
rooms that are already fine hides it.

**It reads local state, because it has to.** The capture credential is accepted
on exactly two routes; `GET /claims/{id}/staging` needs a full session, so the
phone cannot list what it sent. Review is therefore a view over this session's
own shots, and the footer says so rather than implying it is the claim's whole
staging set.

The one genuinely new capability: **a room can be fixed after upload.** The
per-photo PATCH takes `room` as well as `note`, which turns the design's "No
room" pill from a complaint into a fix. Verified live — retagging an untagged
photo to Basement wrote through to the server and regrouped the list.

Capture time comes from the FILE's own `lastModified`, not the upload: on a
walk-through those can be three rooms apart, and it is the capture moment a
reviewer is placing.

Two pills from the design are deliberately absent. **Blurry?** is an on-device
focus score nothing computes, and **Won't process** is a staging
reclassification the capture credential cannot make. A pill that never lights
is furniture; one that lies is worse.

### Built: offline capture

Photos are written to IndexedDB the moment they are taken and retried whenever
the page is open and the network returns. They survive a reload, a crash and a
lock screen — 40 photos queued in a basement are otherwise one accidental
navigation from a second trip to the property.

**Not Background Sync.** `SyncManager` would retry with the tab closed, but it
does not exist on iOS Safari and adjusters carry iPhones — building on it would
make a promise that is false for half the people who need it most. So the UI
says exactly what is true: photos are saved on the phone, they send themselves
when signal returns, and nothing uploads while the screen is closed.

Backoff climbs 2s → 30s and stops: a phone on one bar should not re-push a 4 MB
upload every second, and a walk-through lasts an hour, so it must not back off
into never either. A dead credential, a wrong claim and an oversized file never
auto-retry — they fail identically forever, so they stop and ask for a person.

**Two bugs the live run caught, both of which destroyed evidence.**

1. **A recovered photo lost its MIME type.** `new File([blob], name)` defaults
   `type` to `''`, so every photo restored from IndexedDB was refused as
   `unsupported_format`.
2. **Success was assumed from the status code.** A `202` means the REQUEST was
   accepted, not the photos. The code marked everything stored on a 2xx and
   then deleted the local copy — so an entire queue the server had rejected was
   reported as uploaded and erased. It now reads the ack: only files the server
   did not refuse are treated as safe, a `duplicate` counts as landed (rule 21),
   and anything refused stays on the phone.

Together those two produced the exact failure the copy exists to prevent — a
phone saying "2 photos uploaded" over a claim holding none. Verified fixed:
offline → 2 failed and persisted → reload → recovered → uploaded → **server
holds both** and the local queue clears only then. And a deliberately bad file
now shows `failed`, stays on the phone, and names its reason, while the good
photos stay stored.

### Built: the offline shell (`public/sw.js`)

`/capture` now LOADS with no signal. The queue already survived a reload, but
only if the page could be fetched — closing the tab in a basement meant a
browser error page over photos sitting right there in IndexedDB.

A service worker is the one bug you cannot fix by shipping, so every rule in it
exists to bound that:

- **Same-origin GETs only.** The API is another origin and its responses are
  per-credential and short-lived; caching any of it would be a way to serve one
  adjuster another's data, or a signed URL after it expired. **Verified**: with
  the local server stopped, an API call still reached the real network (401),
  and the cache holds nothing but `localhost` — no `railway.app` entry at all.
- **Navigations are network-first.** Fresh HTML whenever there is signal, so a
  deploy lands on the next load rather than whenever a cache expires. The cache
  is the fallback, which is the entire point.
- **Hashed assets are cache-first.** Vite fingerprints them, so a URL's bytes
  never change and a new build simply asks for new names.
- **No `skipWaiting()`.** A new worker waits for every tab to close. Activating
  mid-session would swap the JS bundle under someone holding queued photos, and
  a faster rollout is not worth "the app changed while I was shooting".
- **An escape hatch**: `__kevinUnregisterSW()` in the console unregisters and
  clears caches, so a support call never has to say "clear your site data" —
  which would also destroy the offline photo queue.
- **Production only.** In dev, Vite serves unbundled modules over HMR and a
  caching worker turns every edit into a debate about which code is running.
  Testing it means `npm run build && vite preview`, which is also what ships.

Verified against the production build: registered and activated, shell plus both
hashed assets cached, then the preview server **stopped** — reload still
rendered `/capture` from cache with the worker controlling.

### Still open

Nothing on #10. The remaining phone work is the design's own deferred ideas
(barcode scan, a live viewfinder), which need capabilities the web does not
portably have.

## 11. Settings — FIVE OF SIX BUILT (billing left alone)

`/settings/{profile,business,export,integrations,api}` behind a shared
`SettingsShell`, and the Settings nav tab is live. **`BillingPage.tsx` is
untouched** — zero diff — along with `AvatarMenu`, `billing.ts` and the two
billing components, so there is nothing to collide with the parallel work.

### The finding: there is almost no backend here

Between them these screens design ~30 editable fields. The API offers two
reads and no writes:

| screen | what exists |
|---|---|
| 31 Profile | `GET /v1/me` — id, email, roles, quota. Read-only. |
| 32 Business | nothing |
| 33 Export defaults | `GET /v1/depreciation-rules` — live class taxonomy. Read-only. |
| 34 Xactimate | nothing, and mostly should stay that way |
| 36 API & webhooks | nothing |

No `PATCH /v1/me`, no account record, no preferences store, no key issuance.
So **the save bar is opt-in in the shell and no screen passes it.** A Save
button over a missing endpoint is precisely the dead end the no-dead-ends rule
forbids — it reads as "your changes are stored" and nothing is. Each page names
the endpoint it needs instead. Filed as ask 33.

What the screens do carry, all of it true:

- **Profile** renders the real identity and usage from `/v1/me`, and explains
  that "Prepared by" is per-claim by design (ask 25) — a point-in-time document
  must keep the details that were true when it was filed.
- **Export defaults** renders the **live depreciation schedule** read-only:
  rule 13 says fetch it, never retype it, and an editable local copy would be a
  second set of rules that can drift from the one doing the arithmetic. Also
  states the fixed Xactimate column order and that every exported cell is a
  static value, never a formula.
- **Xactimate** explains the hand-off rather than offering a Connect button:
  .xlsx not XML (rule 2), and Kevin never pushes into a carrier system
  (rule 4). A connector would imply both things the product declines to do.
- **API** explains that the two narrow credentials which DO exist (capture
  token, share link) are not general-purpose keys, and that a key needs the
  same issue-once/hash/revoke shape before it exists.

Carrier profiles (10) and Pricing (14) remain unbuilt and render as disabled
sidebar rows rather than dead links.

### Not verified visually

The browser profile was reset mid-session, so there is no signed-in session and
I do not enter passwords. Typecheck and lint are clean and every `k-` class
used already exists — but nobody has SEEN these five render. Worth one pass
with a session open.

## 12. ~~Exports history · holdback recovery~~ — BUILT

Two screens. One had a full contract; the other had almost no data.

### Holdback recovery (77) — `/claims/:claimId/recovery`

The post-settlement worksheet: every priced line with what was actually spent,
how many units, the receipt, and the server's `recoverable`. Gated to
closed/archived — before the carrier has paid there is no withheld
depreciation, and the screen would invite receipts against money nobody has
been given.

The design says "NO export button here — the backend is building the dedicated
Depreciation Recovery Request export concurrently." It exists now, so the
button does: **`GET …/holdback-export`, in `xlsx` and `pdf` only.** The design's
comment also names `format=receipts` and `format=zip`; both are **422** — the
route accepts two formats and nothing else. Offering them would have been three
dead buttons.

`canRequestRecovery` mirrors `is_recoverable_line` in services/holdback.py
exactly, including its subtle half: a NULL `replaced_qty` means the whole line
and qualifies, an explicit `0` means none were replaced and does not. A gate
that disagreed would either offer a download that 409s or hide one that would
have worked.

Verified live end to end: withheld $173.80 → claimed $400 on a $434.50 line
paid at $304.15 → **recoverable $95.85**, units auto-filled to 2, header footing
to "still on the table $77.95", the Request buttons appearing only once a line
qualified, and both documents returning 200 with the right MIME. `exported_at`
unchanged and status still `closed` afterwards — the recovery request must not
rewrite the history of the Proof of Loss, and does not.

### Exports (13) — `/exports`, and the nav tab is live

**The designed ledger does not exist.** Screen 13 draws an id per export,
a version number, a file size and a downloaded/shared/superseded status. There
is no exports table and no exports endpoint — the only trace is
`claims.exported_at`, one first-write-wins timestamp.

So the page lists what is true: claims that have been exported, when, and the
documents you can pull again. No invented versions or sizes. The real gap it
names in words: **a re-pulled document is rebuilt from the claim as it stands
now**, so a claim edited since going out no longer matches the carrier's copy.
Filed as ask 30.

Also found: `Content-Disposition` is not in the CORS `expose_headers`, so the
server's filename never reaches the browser and every download uses the client
fallback (ask 31).

---

## Carrying unverified — check when the data exists

- **`delivered_at` / `delivery_error`** render in the share sheet but are null
  everywhere until Increment 3 ships. The redeliver button has never seen a
  real delivery.
- **The substantiation warning** has only ever fired in unit tests: Godfrey has
  51 of 51 priced lines substantiated, so it correctly stays silent there.
- **The `vision_fallback` cue** was verified by forcing the flag; every real set
  clustered so far has validated.
