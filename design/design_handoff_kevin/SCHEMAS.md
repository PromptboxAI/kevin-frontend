# SCHEMAS.md — kevin.co

Data shapes the prototype components assume. These are **design-time mocks**, not
a backend contract — but they reflect the fields every screen reads, so the real
API should cover them. Canonical source for the item shape is
`buildWorksheetRows()` in `components/data.jsx`.

All money is a JS number in USD (no currency object). Dates are display strings in
the mock; production should use ISO 8601.

---

## Item photos — `photos[]` on item detail (commit 2d9cd67)

`GET /v1/claim_items/{row_id}` returns `photos: [{photo_id, is_primary, note, room}]` —
id-joined on `staging_photos.item_id`, primary first then capture order; `photos[0]`
is the same frame as `image_url`. The array carries NO `image_url` (deliberate —
signed URLs go stale): fetch frames via `GET /v1/staging/photos/thumbnails?ids=`
(≤100 ids, same endpoint as the staging grid). `photos: []` is NORMAL (single-photo
`/process` or written import) → fall back to `image_url`; never an error. The join is
never positional — `context`/`duplicate` sets promote to zero items, so order-based
mapping always drifts. Per-frame `note` and `room` ride each entry (migration 0027) — BOTH null on claims
that predate 0027, so the caption treats them as strictly optional. ~20% of promoted
items are merged sets in production; seed accordingly. Verified live on 2d9cd67
(claim chaos3new-1786734681, item 5369).

## Item events — `GET /v1/claim_items/{row_id}/events`

Newest first, `?limit=` 1..200. `{event_type, actor_kind (worker|user), actor_id,
created_at, payload}`. Rendered ONLY in the item drawer's History panel — the payload
carries in-app signals (`lkq`, `bucket_used`) that must never reach an export, same
rule as `substitution_note`. Labeling (backend c70e9cc): branch on `event_type`. TIMING: `priced`/`repriced`
fire at the START of valuation — payloads carry only queries, no money; the money
is on `completed`. Render `priced`/worker = "Searched — 'query'", `repriced`/user =
"Refined the query — 'old' → 'new'" (the diff is the only record of the adjuster's
reasoning), `completed`/worker = "Priced at $X — basis, N% confidence". The payload tell (`previous_rcv: null` + `previous_status:
'processing'`) is LEGACY-only for pre-c70e9cc rows — it misfires on an adjuster
refining an unpriced row (POST …/reprice sets processing before enqueueing, and
every unpriced row has null previous_rcv), so old bulk imports may read as
"Repriced" — accepted. There is no claim-level feed; the old screen-17 concept is dead.

## Depreciation rules — `GET /v1/depreciation-rules` (no auth)

`{rules, categories}`; `rules[class] = {useful_life_years, manual, pcs_code,
source_group, brackets_pct}`. Fetch, never retype: class names carry U+2014 em-dashes
("Clothing — Adult") and "Décor & Accessories"'s é. `useful_life_years: null` (Jewelry,
Firearms, Fine Arts, Furs) = NO automatic depreciation — never render "0 years" or
divide by it. PCS codes repeat across classes (APP, CLH) — key on the class name.

## Rooms — both models exist in V1

`room_area` (free text) is what the field app's tag lands in at promote and what the
export's Room column writes — the worksheet path. `room_id` (nullable FK, null =
Unassigned) is an additive bucketing/rollup model: POST/GET `/v1/claims/{id}/rooms`,
PATCH/DELETE `/v1/rooms/{room_id}`, `PATCH /v1/claim_items/assign-room`
`{item_ids, room_id}`. RoomSummary = `{id, claim_id, name, item_count, total_rcv,
total_acv, …}`. Never calling the rooms endpoints breaks nothing.

## Backend deploy state — verified live 2026-08-16

All five money/identity commits are deployed and verified on web + all 4 workers:
c70e9cc (priced vs repriced event split) · 673e5e1 (atomic /reprice with identity
fields) · 4b50292 (strict request bodies — stray keys 422) · 3674060 (override
reason optional) · a00d03f (RCV edit recomputes ACV: `{rcv}` alone re-depreciates
ACV to the cent in both directions; `{rcv, acv}` stored verbatim — proven with a
value a recompute would have overwritten; `acv > rcv` → 422 and a rejected edit
writes NOTHING). The UI is no longer ahead of prod anywhere.

Photo attach is LIVE (822f79f + migration 0028): `POST /v1/claim_items/{row_id}/photo`
multipart `image` → 201 with the full `photos[]`; dumb storage (no Vision, no money,
no event); first photo = primary; idempotent by content hash; 429 shares /process
30/min. Open items: capture flow actually sending `room` in production (UI exists;
wiring is Claude Code's), and ITEM DELETE — no endpoint exists (claim delete
cascades, individual items don't); the bulk Delete UI is flagged as a feature gap
pending backend build.

## Processing poll — live transcript (backend-verified)

`POST …/items/bulk` → 202 `{claim_id, items_created, item_ids, priced, needs_manual}`.
Poll `GET /v1/claim_items/{id}` at ~2s: run 1 terminal in 3.4s / 2 polls, run 2 in
5.7s / 3 polls; no 429 at 2s for a single item. TERMINAL SET: `completed` ·
`needs_manual` · `failed` · `overridden`. Mid-flight rows read `status:'processing'`
with null money. Completion payload carries the full row (query, identity, pcs_code,
money, depreciation_pct/method/age, confidence, basis, room_area, photos[]).
`tax: null` = the claim has no tax_rate (tax is claim-level; inclusive totals
collapse to raw values) — not an error.

## Upload limits — server vs. client

Server (live): **50 photos/request max** (`MAX_PHOTOS_PER_UPLOAD`, env-tunable;
over → 413) · **15 MB/file** (`MAX_UPLOAD_BYTES`, echoed as `max_upload_bytes`) ·
**NO total-bytes cap per request**. The UI's 20-file/65 MB chunking is a CLIENT
choice (kept for gateway-timeout headroom) — never document it as a server limit.

## Per-photo notes & rooms after upload

The upload accepts `images` + `room` ONLY — since 4b50292 a note in the upload
body 422s. Notes/rooms land after: `PATCH /v1/claims/{claim_id}/staging/photos/{photo_id}`
`{note, room?}`. TIMING: a note only takes effect when clustering runs — set it
BEFORE `POST …/staging/cluster` or it waits for a re-cluster. MAPPING TRAP: the
ack's `photo_ids` is positional over ACCEPTED files only — remove `rejected[]`
filenames from the local list before zipping, or upload a noted photo as a batch
of one. Never zip raw positions.

## Offline flush hazard (mobile PWA) — action before auto-send

Dedupe is scoped to the STAGING SESSION, not the claim. Flushing an offline queue
into a claim whose session was processed meanwhile opens a NEW session with no
dedupe against promoted photos → duplicate line items. Before flushing, call
`GET /v1/claims/{id}/staging`: session processed or absent → PROMPT the adjuster,
never auto-send. Session active → flush freely (re-sends are no-op dupes).

## Claims list & lifecycle

`GET /v1/claims` — one paginated call (`?status=&limit=&offset=` →
`{claims[], count, limit, offset}`). Per claim: `claim_id, name, status(derived),
exported_at, item_count, total_rcv, total_acv,
status_counts{processing, completed, needs_manual, failed, overridden},
created_at, updated_at` + all intake metadata. NO per-claim photo count (gap);
"last activity" = `updated_at`.

**Status is DERIVED, four values, top-down precedence — there is no "Closed":**
`exported` (exported_at set — the export stamps it) → `draft` (item_count 0) →
`processing` (any item processing) → `in_review` (all items terminal). Never
stored, recomputed on every read. A "Closed"/"Archived" state needs a stored
column — see gaps.

**Duplicate — LIVE:** `POST /v1/claims/{claim_id}/duplicate` `{new_claim_id?, name?}`
(auto-names; 409 on id collision). Deep copy of metadata/rooms/items incl.
valuations and edits; evidence images shared by reference; copy never marked
exported.

**Delete:** `DELETE /v1/claims/{claim_id}` permanent, cascades items+rooms;
storage objects deliberately left (duplicates keep their images).

## Auth — confirmed

Ordinary Supabase JWT bearer tokens, identical web and mobile. NO device-pairing
endpoint, no QR handoff route. The pairing screen documents as sign-in-on-phone.

## Shipped 7440c90 (+ migration 0029, additive — apply BEFORE deploy)

1. **Archive — LIVE.** `POST …/archive` / `…/unarchive`, reversible, retains
   everything, idempotent. Status `archived` OUTRANKS all derived values. Off the
   dashboard by default; reach via `?status=archived` or `?include_archived=true`.
2. **Item delete — LIVE.** `DELETE /v1/claim_items` `{item_ids}` batch. Unowned
   ids are SKIPPED, never fail the batch. Directly-attached photos go with the
   item; staged photos stay with their session (evidence stays on the claim).
3. **photo_count — LIVE** on every claim (staged + attached).
4. **Status filter bug fixed** (0029): `?status=` had filtered a dead column where
   every row read 'open' — documented statuses returned zero rows with a 200.
   Status now derives in SQL via a `claim_dashboard` view (filter, count, and
   page window consistent; one query).

**CORRECTED (6959f37 + 63f0bd2, migration 0029 re-copy — includes `closed_at`):
`closed` is REAL and VISIBLE.** Six derived statuses, top-down: `archived`
(hidden, outranks all) → `closed` (settled, still visible) → `exported` →
`draft` → `processing` → `in_review`. Xactimate three-way grouping: open = anything
not closed/archived. Four idempotent no-body routes, same response shape:
`POST …/close` · `…/reopen` · `…/archive` · `…/unarchive` →
`{status, claim_id, closed_at, archived_at}` — `status` is the derived status
AFTER the change; apply it verbatim, never re-derive. Reopen-while-archived →
still archived, `closed_at` null. Deploy order: migration 0029 first, then
7440c90 · 6959f37 · 63f0bd2.

**Bulk delete response:** `{status, deleted, item_ids, photos_detached}` — hard
delete, no soft-delete/audit trail (product rule). Compare `deleted` to what you
sent to detect stale selections. NO photo is ever deleted — surface
`photos_detached` as "N photos kept".

**Photo reuse loop (NEW):**
`GET /v1/claims/{claim_id}/photos?state=unattached` — every photo with derived
state `attached` · `staged` · `unattached` (the reusable pool); limit ≤500,
oldest first, no image_url (batch thumbnail endpoint as usual).
`POST /v1/claim_items/{row_id}/photos` `{photo_ids}` re-attaches EXISTING ids
(plural path; `…/photo` singular still uploads a new file). Photos never cross
claims; ineligible ids skipped; `changed` reports what moved. First image on a
bare row becomes primary (lowest photo_id).
`DELETE /v1/claim_items/{row_id}/photos` `{photo_ids}` detaches WITHOUT deleting
and deliberately leaves the row's thumbnail alone.
This makes a wrong bulk-delete recoverable: delete → photos land unattached →
re-attach to another row.

**Share link — deliberately NOT built.** future-client-share-paywall.md is a
payments product (Stripe checkout, webhook-gated unlock, hashed tokens, anonymous
public routes, server-side redaction) — first anonymous surface, first money.
Decision: wait for the paywall phase; the spec ties the price freeze to the mint.
Screen 29's link mode stays ⚠️ FEATURE GAP.

## Final sync facts (full backend sync, 2026-08-17 — all nine commits verified live)

- **Strict bodies contract-wide (4b50292):** any unknown request field → 422
  naming the key (`extra_forbidden`). Responses are NOT strict (new columns must
  never break a read).
- **`GET /v1/depreciation-rules` is UNAUTHENTICATED.** 24 classes + PCS codes —
  FETCH, never retype: names carry an em-dash (Clothing — Adult) and é (Décor).
  **PCS codes are NOT unique (APP, CLH repeat) — key on class name, never code.**
  Jewelry/Firearms/Fine Arts/Furs: `useful_life_years: null` — never "0 years".
- **`low_confidence_high_value`:** `rcv`/`acv` null but `confidence` is NOT null;
  the withheld figure rides the audit trail as `withheld_rcv`. Render as "needs
  your eyes" — a quiet review cue, never an error state.
- **Written import:** `rows[].description` arrives ALREADY composed identity-first
  ("Whirlpool WRS325SDHZ Refrigerator") — never re-compose or the make doubles.
  `estimated_searches` = 2 per priced row.
- **Rooms are dual-model:** `room_area` (free text) is what the export writes and
  where the capture room lands; `room_id` + `/rooms` endpoints are an optional
  bucketing layer on top.
- **Archive/close are independent axes:** archiving a closed claim keeps
  `closed_at`; reopening a shelved claim leaves it shelved.
- No contradictions found between this sync and the built UI — the atomic
  reprice, word-boundary trim, optional override reason, verbatim money, id-join
  photos, note_source branching, neutral duplicate rendering, and the six-status
  dashboard all match as built.

## Override — `PATCH /v1/claim_items/{row_id}/override`

PATCH, not POST. `override_reason` OPTIONAL (3674060) — typing a price saves as
`{"rcv": 249.99}` alone; status flips to overridden, audit event fires with the
full diff + actor_id, reason null. NEVER auto-fill a default reason (uniform
noise); offer free text, leave empty otherwise. If sent: 3–500 chars or 422.
Adjuster-facing only — never reaches the export. Money: `rcv`/
`acv` ≥ 0; `acv > rcv` → 422 against effective values. Basis-aware fields
(`valuation_basis`, `market_comp`, `dep_manual` 0–1, `depreciation_method`,
`age_years`) plus worksheet fields (`room_area`, `make_mfr`, `model_number`,
`description`, `quantity`). Identity fields are SET, never implicitly cleared.
`extra="forbid"` (4b50292): stray keys 422. Pre-export unpriced count: the export file carries NO "X items not priced"
notification — unpriced lines write 0.00 like any null. The number comes from
`GET /v1/claims/{id}` → `status_counts.needs_manual`. Bulk pricing: NO bulk endpoint —
per-row `/reprice`, sequential, shared 30/min /process limit, honor Retry-After.
Manual-row photo attach: NO route exists (photos enter only via staging) — open
feature gap.

## Item (worksheet row)

The atomic unit. One per identified item. Generated by `buildWorksheetRows(n)`.

```ts
interface Item {
  id: number;              // stable row id within a claim (1-based in mock)
  room: string;            // FREE TEXT — "Kitchen", "Master closet (north wall)", etc. Not an enum.
  qty: number;             // default 1, editable
  desc: string;            // description — AI-prefilled, editable
  mfr: string;             // make / manufacturer — AI-prefilled, editable
  model: string;           // model number — AI-prefilled, editable
  cat: string;             // content class — one of PCS_CATEGORIES (searchable dropdown)
  age: number;             // years; supports decimals (e.g. 0.5). drives depreciation bracket
  dep: number;             // depreciation PERCENT (e.g. 22 = 22%). SERVER-COMPUTED — the frontend never derives it
  depManual?: boolean;     // true once the user hand-edits dep — suppresses the server recalc for this row
  depPending?: boolean;    // UI-only: awaiting POST /claim_items/:id response; cell is read-only
  rcv: number;             // replacement cost value (per unit) USD — ALWAYS a NEW-replacement-equivalent, never a used/resale price (see CLAUDE.md rule 11)
  valuationBasis: 'retail' | 'like_kind_new' | 'manual';
                           // how RCV was derived. RCV is ALWAYS a new-replacement price (rule 11)
  compMerchants?: string[];// merchant domains the aggregator returned offers from
  alternative_sources: Array<{ title: string; source: string; price: number; link: string }>;
                           // up to 3 comparable listings, normalized by the backend from the
                           // Google Shopping / Immersive Product API (SerpApi). The MEDIAN offer
                           // is Kevin's pick and sets `rcv`. `link` is the raw proof URL — v1 does
                           // NOT snapshot the page; the raw URL + estimate date is the accepted
                           // standard. UI: the worksheet Link column href = the comp BACKING the
                           // row's rcv (`sourceLink` when the adjuster picked one, else the comp
                           // whose price matches rcv). A hand-typed rcv matches no comp, so the
                           // Link cell renders empty — an invented price has no source to cite.
                           // The RCV popover lists all three, each linking to its own `link`.
                           // needs_manual rows carry [] (nothing was sourced).
  substitutionNote?: string; // for 'like_kind_new': what comparable NEW item was priced
  conf: 'high' | 'med' | 'low';   // AI confidence. Surfaced in the item drawer only —
                           // the grid's confidence pips were REMOVED (visual noise on 142 rows).
  barcode: boolean;        // true if matched via barcode/model sticker — shows mint "Barcode" badge
  specialLimits: boolean;  // amber coverage-cap flag. Comes FROM THE PAYLOAD — never derived
                           // from `cat` at render time (CLAUDE.md rule 20).
  _photoIdx: number;       // index into the claim's photo set (mock-only; real = photoId[])
}
```

**Derived values** (computed in `computeACV()`, never stored):
```
subtotal = rcv * qty
depAmount = subtotal * (dep / 100)
tax       = subtotal * claim.taxRate          // 8.625% for the demo claim
acv       = subtotal - depAmount              // Actual Cash Value
```
ACV is what the carrier settles on. Tax is shown but not added into ACV in the mock
(carrier-specific; confirm with stakeholder before changing).

**Valuation-basis invariant (critical — see CLAUDE.md rule 11):** `rcv` must always be a
NEW-replacement-equivalent so the carrier depreciates it exactly once. There is no
comparable-sale/back-solve path — a used or resale price is never written to `rcv`, and
there is no `marketComp` field. When the exact model is gone, `valuationBasis` is
`'like_kind_new'`: the backend prices the nearest NEW equivalent and returns a
`substitutionNote` explaining the swap. When no confident new-replacement comp exists, the
item comes back `needs_manual` instead (see rule 12) — it is never priced off a used listing.

**Holdback recovery (post-settlement — LIVE, 51072f0).** After settlement at ACV the
carrier withholds depreciation; recovery = proving replacement. `claimed_rcv` (what a
replacement ACTUALLY cost) is a separate field PATCHed per row — it NEVER moves rcv/acv/
depreciation (the settled schedule stays put). null clears; 0 is a real value (warranty/
gifted); negative → 422. Present on list + detail (no N+1). `receipt_url` is a per-read
signed URL, never persisted. NOT on the main export — the Depreciation Recovery Request is
a separate, not-yet-built document; do not wire an export button. Receipt upload:
`POST /v1/claim_items/{row_id}/receipt` (multipart `receipt`) — PDFs accepted HERE ONLY,
detected by content not declared type, HEIC → JPEG w/ EXIF strip, one per line (re-upload
replaces). `recoverable` ships on ClaimItemSummary + ClaimItemDetail (same function as the export; 0.0 never null — sum without guards; may be < depreciation_amount on partial spend: correct, not a fault). Entry gate: exported OR closed OR any claimed_rcv. `replaced_qty` shipped: null = whole line, 0 = real value (line drops from export), >qty 422; list payload carries both `replaced_qty` and pro-rated `recoverable`. For qty>1 lines (2 Hot Wheels, 1 replaced) carriers need the replaced count, and recovery pro-rates to it: `recoverable = min(max(claimed − acv_paid·k/qty, 0), withheld·k/qty)`. UI ships the column; needs a `replaced_qty` field on the PATCH + list payload (and a column on the holdback export).

**QR pairing (LIVE).** `POST /v1/claims/{id}/pair-token` → single-use ~2-min QR token;
`POST /v1/pair {token}` (no account) → 120-min capture token sent as `X-Capture-Token`
(not Authorization), scoped to one claim, upload-only; `…/pair-token/revoke` kills it
("lost my phone"). Note-at-capture is LIVE (70cd41a): the capture token authorises
`PATCH …/staging/photos/{photo_id}` (same claim check, `X-Capture-Token`); a note only
takes effect if set BEFORE `POST …/staging/cluster`. The PATCH returns the full
StagingSessionResponse — ignore what you don't need.

**Comp-drop on manual edit (backend-merged).** Editing `rcv` (or `market_comp`) on an
engine-priced row makes the backend drop `alternative_sources` to `null` and flip
`valuation_basis` to `'manual'` — the comps justified the OLD number, so they no longer
apply. The UI mirrors this optimistically and renders the empty comp list as a quiet
"No source — needs justification" note (never an error state): the missing source IS the
signal that the row needs a proof URL or a re-price.

**`substitutionNote` is drawer-only.** The UI surfaces it quietly in the item detail drawer
under a "Like kind & quality" label for the adjuster's review. It must NOT badge, flag, or
otherwise annotate the worksheet row — an LKQ substitution is normal valuation, not an
exception state.

---

## Claim

```ts
interface Claim {
  id: string;              // "CLM-2026-04412"
  insured: { first: string; last: string };   // "Kevin Godfrey" — the INSURED,
                           // not the adjuster (Mariana Reyes is the preparer)
  displayName: string;     // "Godfrey — Kitchen fire"
  cause: string;           // "Kitchen fire" — free text
  dateOfLoss: string;      // "Apr 18, 2026" (mock) → ISO in prod
  address: string;         // "123 Main St., Smithtown, NY 11787"
  zip: string;             // "11787" — resolves sales tax
  taxRate: number;         // 0.08625
  carrier: string;         // "Allstate" — real carriers only, see CLAUDE.md rule 3
  policyForm: string;      // "HO-3 · Open perils"
  status: 'processing' | 'review' | 'open' | 'closed' | 'archived';
                           // processing/review are pipeline-set; open/closed are the
                           // adjuster's call. Exporting does NOT close a claim.
  photoCount: number;      // 162
  itemCount: number;       // 142  — INVARIANT: itemCount <= photoCount (see CLAUDE.md rule 1)
  ppLimitLabel: string;    // "Coverage C — Personal Property" | "Contents" | … from declarations page
  ppLimit: number | null;  // contents limit in dollars; null = not entered
  alreadyClaimed: number;  // prior contents payments on this loss
  archivedAt: string | null; // ISO — non-null = archived (reversible, still readable)
  rcvTotal: number;        // DERIVED — never stored/typed. Sum of (rcv × qty) over priced rows.
  acvTotal: number;        // DERIVED — rcvTotal − depreciation. Prototype: window.REYES_TOTALS (data.jsx)
  flags: number;           // count of items needing attention (special-limits + low-conf)
  createdBy: string;       // adjuster name
  items: Item[];
}
```

---

## Export

```ts
interface Export {
  id: string;              // "EXP-2026-1138"
  claimId: string;         // FK → Claim.id
  format: 'Xactimate (Excel)' | 'PDF inventory' | 'CSV' | 'Bundle';
                           // NEVER "Xactimate XML" — see CLAUDE.md rule 2. Symbility/Encircle
                           // were dropped: Kevin exports a file, it does not integrate (rule 4).
  itemCount: number;
  sizeBytes: number;       // bundle size
  createdAt: string;
  createdBy: string;
  status: 'sent' | 'downloaded' | 'superseded' | 'failed';
  // NO carrierAck field — Kevin has no carrier-side surface and receives no
                           // acknowledgement (rule 4). Delivery state stops at 'downloaded'.
  version: number;         // exports are versioned per claim
  bundle: string[];        // ['claim_export.xlsx', 'photos/', 'comps.json', 'audit.log']
}
```

The Xactimate export is a **.xlsx** populated from the XactContents template, NOT
an XML. Whole-estimate transfer uses .ESX archives. Programmatic = XactAnalysis API.

---

## ShareLink

Minted by **Copy link** on 29-Share-claim. Every click mints a NEW one.

```ts
interface ShareLink {
  id: string;              // "shr_8Hk4zP91MQ7n" — the token in the URL
  claimId: string;
  url: string;             // https://kevin.co/share/<claim>/r/<token>
  createdAt: string;       // ISO
  createdBy: string;       // user id — the preparer who sent it
  expiresAt: string | null;// from the expiry select; null = no expiry
  revokedAt: string | null;// revoking stops it working immediately

  // ── SNAPSHOT, not a live view ─────────────────────────────────────
  // The inventory is frozen at mint time. Later edits to the claim do NOT
  // change what the recipient sees. This is deliberate and load-bearing:
  // the audit log can prove what was sent, and a carrier never sees figures
  // move under them. Re-sending after edits means minting a NEW link.
  snapshotId: string;      // immutable copy of the item rows + totals
  snapshotAt: string;      // ISO — equals createdAt, printed on the shared view
  lineItems: number;       // counts frozen with the snapshot
  rcvTotal: number;
  acvTotal: number;

  // ── Options, stored ON THE LINK not the claim ─────────────────────
  // So a redacted link to one party and a full link to another can coexist
  // from the same claim, each independently revocable. Read at mint time and
  // baked into the snapshot.
  hidePersonalInfo: boolean;   // redacts insured name + loss address
  requireEmail: boolean;       // one-time code; records who viewed and when
  allowDownload: boolean;      // false = view only, no file
  watermark: boolean;          // business name across the shared view

  views: Array<{
    email: string | null;      // captured only when requireEmail is true
    at: string;                // ISO
    device: string;            // "Desktop · Chrome"
    location: string;          // approximate, from IP
  }>;
}
```

**A view fires `emails/08-share-link-viewed.html`** to the preparer.

**No carrier acknowledgement.** A view is evidence the file was opened, nothing more —
Kevin has no carrier-side surface and receives no confirmation of receipt (rule 4).

---

## CarrierProfile

Drives depreciation pre-fill, special-limits flagging, and export validation.

```ts
interface CarrierProfile {
  id: string;              // "allstate"
  name: string;            // "Allstate"
  active: boolean;         // the default profile applied to new claims
  depTable: Record<string, number[]>;   // class → [<1yr,1-2,3-5,6-10,11-15,>15] percents
                                          // see DEP_TABLE in data.jsx
  specialLimits: {         // per-class caps — flagged (not blocked) in worksheet
    [cls: string]: { totalCap: number; perItem: number | null; scrutiny: 'low'|'medium'|'high'; note: string };
  };
  exclusions: { cls: string; coverage: string }[];
  taxHandling: string;     // "Compute per-line, sum at export"
  defaultTaxFallback: number;  // 0.0825
  depreciationFloor: number;   // 10 (min residual %)
}
```

**Depreciation lookup (BACKEND ONLY):** `getDepFor(cat, age)` → `depTable[cat][depBracket(age)]`.
The frontend calls `POST /claim_items/:id` and renders the returned `dep`; it must not
run this lookup itself (CLAUDE.md rule 20).
Brackets: `<1yr=0, 1-2=1, 3-5=2, 6-10=3, 11-15=4, >15=5`.

**Depreciation method (per schedule — `depreciation_method` enum):** the frontend
"Add a schedule" modal (intake) and the engine support three methods; the backend must
implement all three:
- **`straight_line`** (DEFAULT) — annual rate = `100 / usefulLife`; `dep% = min((age / usefulLife) * 100, cap)`. `usefulLife` per class = `USEFUL_LIFE` in `data.jsx`. `cap` is the schedule's max-depreciation cap (RCV floor = `100 − cap`).
- **`bracketed`** — the `DEP_TABLE` class×age curves above; each bracket value clamped to `cap`.
- **`custom`** — pass-through of the user-entered `dep` percent (no cap beyond 100).
Special-limits classes (Jewelry, Firearms, Fine Arts, Furs) are manual-priced regardless of method.

**PCS export mapping (`PCS_CODE` in `data.jsx`):** each internal class maps to one
XactContents PCS code for the export's Content-class column. Note collisions are intentional
(Major & Small Appliances → `APP`; Adult & Child Clothing and Furs → `CLH`).

**Export money contract (Phase 4 .xlsx / PDF boundary):** coerce any `null` money
(`rcv`/`acv`/`tax`/`depr$` on `needs_manual` rows) to `0.00`; strip negative-zero; and emit
BOTH `Depr. %` and `Depr. $` columns (column parity with XactContents).

---

## Reference enums (in `data.jsx`)

- **`PCS_CATEGORIES`** — 24 content classes (Electronics … Furs). Last 4 are special-limits.
- **`PCS_CODE`** — internal class → XactContents PCS code (export column). See mapping above.
- **`USEFUL_LIFE`** — internal class → useful life in years (drives straight-line defaults).
- **`SPECIAL_LIMITS`** — Set of {Jewelry, Firearms, Fine Arts, Furs, Collectibles}.
- **`ROOM_OPTIONS`** — 17 suggested rooms, but `room` is FREE TEXT; this is only for mock seeding / autocomplete hints, not a hard enum.

---

## Audit event (compliance trail — NOT chat)

```ts
interface AuditEvent {
  t: string;               // "Today · 11:14:22"
  who: string;             // "M. Reyes" | "Kevin"
  role: 'system' | 'adjuster' | 'reviewer' | 'owner' | 'admin';
  ev: string;              // "Cell edit" | "Processing complete" | "Note added" | …
  field?: string;          // "RCV · row #054"
  from?: string; to?: string;   // before/after for edits (shown as strikethrough → green)
  detail?: string;
  tone: 'ok' | 'warn' | 'accent' | 'quiet';
}
```

Every cell edit, bulk action, flag, and claim note appends here. This is the
defensibility backbone — it is NOT a collaboration thread (no @mentions/replies).

---

## Admin account (`ADM_ACCOUNTS` in `admin-console.jsx`)

```ts
interface AdminAccount {
  id: string;                  // "acct_4412"
  biz: string; owner: string; email: string; loc: string;
  plan: 'Pro' | 'Enterprise' | 'Internal';
  status: 'Active' | 'Trial' | 'Past due' | 'Canceled' | 'Comped' | 'Internal';
  mrr: number;                 // 0 for Trial/Canceled/Comped/Internal
  comp?: { reason: string; until: string; by: string };  // present iff comped
  internal?: boolean;          // staff/test account — never bills, never in metrics
  claims30: number; claimsTotal: number; joined: string; last: string;
}
```

**Billing-state / metrics contract:** MRR and revenue rollups sum `a.mrr` and
filter by `status`/`plan`, so **Comped** and **Internal** accounts (both `mrr: 0`,
non-billing statuses) are excluded from every metric by construction — do not
special-case them, just keep them at `mrr: 0`. Comping is a billing-state change
($0, full plan features, optional `until` expiry + `reason`), reversible via
"End comp", and must write an audit-log entry. Internal accounts are staff test
accounts (e.g. `kevin@kevin.co`) — same exclusion, permanent.


## PhotoSet (ingestion payload)

Submitted from staging when the adjuster hits Process. The backend pre-clusters and
proposes these; the adjuster's merges/splits/notes are what ship.

```ts
// RETIRED — there is no submit payload. Staging uses an INCREMENTAL state
// model: each merge/split/note/skip is saved via its own endpoint as the
// adjuster works, and POST /v1/claims/{claim_id}/staging/process (NO body)
// promotes the saved state. Kept here so nobody rebuilds the old shape.
interface PhotoSetSubmission { /* retired — see note above */
}
```

`user_note` is **pre-processing only**. It is passed to the Vision API as context for
that set and is never used to re-trigger a second run — post-processing corrections
happen by editing the worksheet row.

---

## ShareCredential (client portal link)

Retrievable tokens: GET …/shares returns `token`/`url` on ACTIVE links (null on revoked/expired). The earlier shown-once rule is retired. Links are independent — minting never invalidates an existing link; only revoke does. No `label` field exists on ShareSummary and none is wanted (owner decision: one live link per claim is the expected use; display strings are client-composed): real fields are id · claim_id · audience · active · expires_at · revoked_at · allow_download · released_at · view_count · last_viewed_at · created_at.

```
POST /v1/claims/{id}/share            → { share_id, token, expires_at }
GET  /v1/claims/{id}/shares           → [{ share_id, created, expires_at, redacted, active, view_count }]
DELETE /v1/claims/{id}/shares/{share_id}
```

- `active` is SERVER-derived — the UI never computes liveness from `expires_at`.
- Inactive rows (revoked/expired) render as history, retaining `view_count`.

### Share-link visibility (final spec)

Server-shaped: `GET /p/{token}` returns ONLY what the audience may see — the client never filters a full payload (devtools defeats client-side hiding).

**Visible to the client:** insured_name, loss_address, policy_number, claim number (identity is the point — never redacted; policy/claim numbers are the industry lookup path); the FULL money chain rcv → depreciation_pct → acv → claimed_rcv → recoverable (hiding ACV while showing RCV causes the "why is my check smaller?" call); description, room, photos, age_years, receipt, replaced_qty.

**Hidden:** confidence (internal triage), alternative_sources (adjuster working material / future paywall substantiation), substitution_note · lkq · bucket_used (permanently adjuster-facing), other claims / exception queue / internal notes.

**Labelling:** every dollar figure on the portal is labeled as the adjuster's estimate — the carrier makes the final settlement decision.

**audience (client | carrier) is who the link is FOR — NOT the paywall.** The paywall's "total visible, substantiation locked until paid" is a separate unbuilt mechanism; don't merge them.
