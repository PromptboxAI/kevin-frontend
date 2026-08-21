# Frontend Integration Guide

This is the single source of truth for building a frontend (or a typed client)
against the **kevin-backend** valuation API. Everything here reflects the live
code: FastAPI app in `main.py`, typed contract in `schemas.py`, auth in
`services/auth.py`.

> **Product context:** dual-use. (1) Enterprise insurtech (adjusters review
> claims). (2) Consumer SaaS (estate liquidators / personal inventory, where the
> uploader is the appraiser). Today every endpoint is **owner-scoped**
> (`created_by == caller`); role/org scoping for the multi-party enterprise case
> will extend the same backend endpoints later — the frontend contract below
> won't break when that happens.

---

## 0. Contract changes — 2026-08-08 → 2026-08-11

Everything below is **live in production** and verified against real claims. If
you synced before 2026-08-08, these are the deltas that affect client code.
Details are in the numbered sections; this list exists so nothing is missed.

**Breaking display assumptions**

1. **`comparable_sale` no longer grosses up.** `rcv == market_comp` exactly. This
   doc previously promised `rcv > market_comp` **always** — that is now wrong.
   `ceiling_used` is non-null *only* when an adjuster named an explicit
   replacement price. (§ basis table)
2. **`low_sample` now means BOTH comp buckets were thin.** A thin retail bucket
   falls through to the resale market instead of short-circuiting, so expect
   **materially fewer** `needs_manual` rows on vintage/collectible inventories —
   and expect the rescued ones to carry a **resale** price as the RCV.
   `comparable_sale` goes from never-seen to common. (§ manual_reason)

**New fields**

3. **`status` on every photo proposal** — in `ungrouped_photos` *and*
   `groups[].photos`. Values `uploaded` → `extracted` → `clustered` →
   `promoted`. **The pending value is `uploaded`, not `"extracting"`.** Gate the
   UI on it: every grouping path returns **409** for an `uploaded` photo.
4. **`make_mfr` / `model_number` on `BulkItemRow`** (written-inventory import) —
   map them whenever the list has Make/Manufacturer/Brand or Model/Model #/SKU
   columns. They lead the search query, fill the worksheet identity columns, and
   supply the brand that substitution disclosure depends on. `BulkPreviewRow`
   returns them too, and its `description` is the **composed** line
   (`"Whirlpool WRS325SDHZ Refrigerator"`), which is what will really be
   searched and exported.

**New endpoint**

*  `GET /v1/claim_items/{row_id}/events` — the item's audit trail. See §0b.

**Clarified, not changed**

5. **Single-photo assignment is `POST …/staging/groups/merge`**, which accepts
   `group_keys` and `photo_ids` *mixed*. `PATCH …/staging/groups/{key}` is
   reclassify-**kind** only and never took a photo id. The merged set gets a
   **new `group_key`** (re-read the response, don't cache), `kind` defaults to
   `item` so pass it explicitly, and the set's vision identity is **inherited**
   when every photo came from at most one existing set.
6. **The field is `skipped_photos`**, not `excluded_photos`. It already includes
   photos still extracting at submit time.
7. **Only `alternative_sources[0]` has a direct merchant link.** Comps `[1]`/`[2]`
   carry a Google Shopping *search* url — render the runners-up as plain text,
   not hyperlinks.
8. **Unpriced money cells export as numeric `0`** (displayed `0.00`), never blank
   or a string, so `Quantity * Price` formulas hold.

---

## 0b. Answers to the 2026-08-11 design audit

**Photos on a PROCESSED claim — yes, this works.** `GET /v1/claims/{claim_id}/staging`
reads the claim's *latest* session regardless of status (it is not active-only),
and `staging_photos` rows survive promotion carrying their `item_id`. So the
Photos tab enumerates ids from that response and passes them to
`GET /v1/staging/photos/thumbnails?ids=` (owner-scoped, ≤100 ids, ~5-min URLs).
Per-item, `GET /v1/claim_items/{row_id}` also returns a signed `image_url` for
the item's primary photo. There is no single "all photos on a claim" endpoint,
and none is needed for this.

**`GET /v1/sources` is LIVE, not legacy — but it is not what a "per-retailer
scraper" screen implies.** Both halves matter:
- There are **no per-retailer integrations**. Every comp comes from one
  aggregator (SerpApi `google_shopping`, plus an `amazon` fallback tier). A UI
  saying "one unified aggregator, no per-retailer scrapers" is **accurate**.
- The source roster is still load-bearing on the *results*: it decides
  retail-vs-resale **bucketing** (which chooses the valuation basis), enforces
  **strict allowlists** for Jewelry and Art, and sets the **display order** of
  `alternative_sources`. `class_priority` is real and applied.
So the screen should present sources as **how results are classified and
ranked**, never as **where we fetch from**. Per-source live telemetry and
eBay-sold integrations are a later phase and do not exist.

**Audit trail — NOW AVAILABLE:** `GET /v1/claim_items/{row_id}/events`
(newest first, `?limit=` 1–200, default 50). Every override, edit, reprice,
completion, capacity deferral and failure has been appended to
`claim_item_events` since migration 0002; this is the read side. Each entry is
`{ id, claim_item_id, event_type, actor_kind, actor_id, payload, created_at }`.
`actor_kind` is `user` | `system` | `worker` (a worker event has a null
`actor_id`). `payload` is free-form per event type — an override's before/after
diff, a reprice's previous query and price, a completion's rcv/acv/basis.
**It is ADJUSTER-FACING: it can carry internal signals (`lkq`, `bucket_used`)
that must never reach a carrier-facing document — render it in the app, never in
an export.** A row you don't own is `404`, not `403`. Item-scoped by design;
there is **no claim-wide feed** (see the note in `main.py`), so the audit surface
for V1 is a history panel in the item drawer, not a separate claim-level screen.

**Not built — do not design against these.** No endpoints exist and none are
planned in this phase: **carrier profiles**, **API keys / webhooks**, and
**estate / FMV mode**. The four bases are `retail`, `like_kind_new`,
`comparable_sale`, `manual` — there is no fair-market-value basis, no condition
and no disposition anywhere in the backend. FMV is **cut from V1 by decision**,
not overlooked: the intended approach (a category-based deduction off the
baseline RCV) is specified in `future-fmv-logic.md` for when it is picked up.
Each of these is a product decision; ask before building UI that assumes them.

---

## 1. Base URLs

| Environment | Base URL |
|-------------|----------|
| Local dev   | `http://localhost:8000` |
| Production  | `https://<your-railway-app>.up.railway.app` *(set after the Railway deploy)* |

- **Business endpoints are under `/v1`** (e.g. `POST /v1/process`).
- **Infra endpoints are unversioned** (`/`, `/healthz`, `/readyz`).
- Interactive docs: `GET /docs` (Swagger UI), raw spec: `GET /openapi.json`.

---

## 2. Authentication

The backend does **not** issue tokens. Users authenticate with **Supabase Auth**
(via `supabase-js` in the frontend); the backend verifies the resulting JWT.

### Flow
1. Frontend signs the user in with `supabase-js` (`signInWithPassword`, OAuth, magic link, …).
2. Get the access token: `const { data } = await supabase.auth.getSession(); const jwt = data.session.access_token;`
3. Send it on **every** backend request:

```
Authorization: Bearer <supabase_access_token>
```

### Details
- Tokens are asymmetric (ES256/RS256), verified against Supabase's JWKS — **no shared secret** lives in the frontend.
- A missing/empty/expired/invalid token → **`401`**.
- Refresh tokens with `supabase-js` (`supabase.auth.onAuthStateChange` / auto-refresh) and resend the new access token.
- **Roles** live in the JWT's `app_metadata` (`role: "adjuster"` or `roles: ["adjuster","admin"]`). Use `GET /v1/me` (below) to read them; don't parse the JWT yourself.

---

## 3. CORS

Configured in `main.py`:
- **Standard local dev origins are always allowed:** `http://localhost:3000` (Next/CRA), `http://localhost:5173` (Vite), `http://localhost:8080` (Vue/misc) — plus **any** `localhost` / `127.0.0.1` port via regex.
- Production origins come from the backend env var `CORS_ALLOWED_ORIGINS` (comma-separated). **Give the backend owner your deployed frontend origin** so it can be added (none yet — frontend in design).
- `allow_credentials: true`. Allowed methods: `GET, POST, PATCH, DELETE, OPTIONS`. Allowed headers: `Authorization, Content-Type, X-Request-ID`.

---

## 4. Conventions

- **Content type:** JSON everywhere **except** `POST /v1/process`, which is `multipart/form-data` (file upload).
- **Omitted fields:** responses omit `null` fields (`response_model_exclude_none`). E.g. an `accepted` process response has no `existing_status`; treat missing as `null`.
- **Correlation IDs:** every response carries `X-Request-ID`. You may send your own `X-Request-ID` request header; it's echoed back. Log it — it makes backend support/debugging trivial.
- **Money/numbers:** all money fields are numbers or `null`, never pre-formatted strings. `rcv`/`acv` are **per-unit, pre-tax** (the valuation-basis engine's values, for audit). The **worksheet & export money columns** are the derived **tax-inclusive line totals**: `rcv_total_incl` · `tax` · `depreciation_amount` · `acv_total_incl` (see §5 detail). `depreciation_pct` is a fraction (`0.30` = 30%); `confidence` is `0.0`–`1.0`. **Never render `-$0.00`** — depreciation is always ≥ 0, so a signed zero is only a formatting artifact (`value > 0 ? '−'+fmt(value) : fmt(0)`). On-screen, show `null` money as a dash `—`; in any **exported** file coerce `null → 0.00` (never `—`/blank) so downstream `SUM` / `RCV − Depr` formulas don't error.
- **Timestamps:** ISO-8601 strings (e.g. `2026-06-29T01:00:00+00:00`).
- **Rate limits (per user):** `POST /v1/process` → **30/min**; read endpoints (`/v1/claim_items`, `/v1/claim_items/{id}`) → **120/min**. Exceeding → **`429`** with a `Retry-After` header (seconds). Back off and retry.

### Error shape
FastAPI's default: `{ "detail": "<message>" }` (or, for validation errors, `detail` is an array of field errors). Always branch on the **HTTP status code**, not the message text.

| Code | Meaning |
|------|---------|
| 400 | Bad input (e.g. empty image) |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but lacks the required role (admin endpoints) |
| 404 | Not found **or not owned** (deliberately indistinguishable — see below) |
| 409 | Conflict (image already registered under this claim by another account) |
| 413 | Upload too large |
| 415 | Unsupported media type (non-image) |
| 422 | Validation error (bad `claim_id`, `acv > rcv`, short `reason`, …) |
| 429 | Rate limited (`Retry-After` header) |
| 502 | Upstream failure (DB/storage/queue) |
| 503 | A dependency (Supabase) is unconfigured/down |

> **404 = not found OR not yours.** Detail/override return `404` for rows the
> caller doesn't own, so a user can't probe which row ids exist for others.

---

## 5. Endpoints

### Infra (unversioned, no auth required)

#### `GET /`
Banner. `{ "status": "ok", "service": "kevin-backend" }`. (Admins additionally see `supabase_connected`, `redis_connected`.)

#### `GET /healthz`
Liveness. Always `200 { "status": "ok" }` if the process is up. Use for uptime checks, not readiness.

#### `GET /readyz`
Readiness. `200` when all deps are reachable, `503` when not.
- Anonymous body: `{ "status": "ok" }` or `{ "status": "unavailable" }`.
- Admin body adds: `supabase` (bool), `redis` (bool), `serpapi_budget` (`{ used_today, limit }`).

---

### `GET /v1/me` — current user identity
**Auth required.** No DB hit; derived from the JWT. Use it on app load to know who's signed in and to gate admin UI.

**Response `200` (`MeResponse`):**
```json
{
  "id": "a1b2c3d4-...",         // Supabase user uuid (JWT sub)
  "email": "user@example.com",  // may be null
  "roles": ["adjuster", "admin"], // sorted, lowercased; [] if none
  "is_admin": true
}
```

---

### `GET /v1/depreciation-rules` — the 24-class taxonomy reference
**Auth required.** The canonical **24 content classes** (the ONLY categories the UI/AI use) with each class's straight-line useful life, bracketed curve, PCS export code, and comp-source group.

**Response `200` (`DepreciationRulesResponse`):**
```json
{
  "rules": {
    "Electronics":  { "useful_life_years": 5, "manual": false, "pcs_code": "CMP",
                      "source_group": "Electronics", "brackets_pct": [15,20,28,40,60,75] },
    "Major Appliances": { "useful_life_years": 12, "manual": false, "pcs_code": "APP",
                      "source_group": "Appliances", "brackets_pct": [8,15,24,32,50,70] },
    "Jewelry":      { "useful_life_years": null, "manual": true, "pcs_code": "JWL",
                      "source_group": "Jewelry", "brackets_pct": [5,8,12,18,25,35] }
  },
  "categories": ["Electronics", "Audio / Video", "Major Appliances", "..."]
}
```
- `categories` is the exact 24-class list — use it to populate the class picker.
- `useful_life_years` drives the **straight-line** default (annual rate = `1 / useful_life`); `null`/`manual: true` = an appraisal class (Jewelry, Firearms, Fine Arts, Furs) that is never auto-depreciated.
- `brackets_pct` is the **bracketed** curve (depreciation % for age brackets `<1 · 1-2 · 3-5 · 6-10 · 11-15 · >15` yrs).
- `pcs_code` is the Xactimate PCS code emitted in the export's Content Class column.

---

### `GET /v1/sources` — valuation source routing (dashboard config)
**Auth required.** Static config powering the source-priority dashboard: the roster of comp sources the valuation engine recognizes, and the per-category priority chains.

**Response `200` (`SourcesResponse`):**
```json
{
  "sources": [
    { "key": "west_elm", "name": "West Elm", "kind": "retail", "tier": "specialty", "categories": ["Furniture"] },
    { "key": "the_realreal", "name": "The RealReal", "kind": "resale", "tier": "comparable", "categories": ["Clothing", "Jewelry"] }
  ],
  "class_priority": {
    "Major Appliances": ["home_depot", "best_buy", "google_shopping"],
    "Jewelry": ["blue_nile"],
    "Fine Arts": []
  },
  "category_priority": {
    "Furniture": ["wayfair", "west_elm", "cb2", "pottery_barn", "google_shopping"],
    "Jewelry": ["blue_nile"]
  },
  "default_priority": ["google_shopping", "amazon", "walmart", "target"],
  "telemetry": "coming_soon"
}
```
- **`kind`** — `retail` (sold new → drives a depreciated retail RCV) or `resale` (used/secondary market → grossed up to a replacement cost).
- **`tier`** — `primary` | `fallback` | `specialty` | `comparable` (for grouping tiles).
- **`categories`** — which item categories the source serves (`"*"` = all).
- **`class_priority`** — ordered source `key`s **keyed by the 24 content classes** (the ones the UI uses; see `GET /v1/depreciation-rules`). Manual/appraisal classes (Jewelry, Firearms, Fine Arts, Furs) return `[]` (never auto-sourced). **Prefer this over `category_priority`** for the dashboard.
- **`category_priority`** — the same chains keyed by the legacy source-group names the engine routes on internally (kept for back-compat). Every key resolves to an entry in `sources`.
- **`telemetry`** — `"coming_soon"`. Per-source live stats (comps today / last fetch / paused) arrive in Phase 3b; render the tiles from this static config until then.

---

### `POST /v1/process` — submit an item for valuation
**Auth required. `multipart/form-data`.** Async: returns immediately; valuation happens in the background (poll for the result — see §6).

**Form fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `claim_id` | string | ✅ | Must match `^[A-Za-z0-9_-]{1,64}$` (letters, digits, `_`, `-`). Groups items; in consumer mode use it as an "inventory/project" id. |
| `image` | file | ✅ | An image (`image/*`). Max size set by backend (default 15 MB). EXIF is stripped server-side. |
| `age_years` | number | ❌ | Item age in years (default `0.0`). Drives depreciation. |
| `category` | string | ❌ | Force a category (see depreciation-rules). If omitted, the worker infers it. |

**Response `202` — accepted (new job) (`ProcessResponse`):**
```json
{ "status": "accepted", "row_id": 123, "job_id": "3f1c2e9a-7b54-4a0e-9d21-8c6f0b2a1e77", "storage_path": "abc123/deadbeef.png" }
```

**Response `200` — duplicate (idempotent hit; same image+claim already submitted):**
```json
{ "status": "duplicate", "row_id": 5, "existing_status": "completed", "storage_path": "...", "rcv": 200, "acv": 150 }
```

**Errors:** `400` empty image · `415` non-image · `413` too large · `422` bad `claim_id` · `429` rate limited · `409` image already registered under this claim by another account · `502` storage/db/queue · `503` backend not configured.

> **Idempotency:** re-submitting the same image under the same `claim_id`
> returns the existing row (`200 duplicate`) instead of re-billing valuation.
> Use `row_id` as the key.

---

### `GET /v1/claim_items` — list my items
**Auth required.** Owner-scoped, newest-first.

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | string | – | Filter: `processing` \| `completed` \| `failed` \| `overridden` \| `needs_manual` |
| `claim_id` | string | – | Filter to one claim/inventory |
| `limit` | int | 20 | Capped at **100** |
| `offset` | int | 0 | For pagination |

**Response `200` (`ClaimItemListResponse`):**
```json
{
  "items": [
    {
      "id": 1, "claim_id": "c-1", "status": "completed", "valuation_basis": "retail",
      "category": "Electronics", "query": "laptop", "quantity": 1,
      "rcv": 800, "acv": 600, "tax": 66.00,
      "rcv_total_incl": 866.00, "depreciation_amount": 216.50, "acv_total_incl": 649.50,
      "depreciation_pct": 0.25, "confidence": 0.9, "error": null,
      "created_at": "2026-06-29T00:00:00+00:00", "updated_at": "2026-06-29T01:00:00+00:00"
    }
  ],
  "count": 7,     // TOTAL owned rows matching the filter (not just this page)
  "limit": 20,
  "offset": 0
}
```
Use `count` with `limit`/`offset` to render pagination. List rows are lightweight — **no image URL** (call detail for that).

---

### `GET /v1/claim_items/{row_id}` — item detail
**Auth required.** Owner-scoped (`404` if not yours/not found). Includes a freshly minted **signed image URL**.

**Response `200` (`ClaimItemDetail`):**
```json
{
  "id": 1, "claim_id": "c-1", "room_id": null, "is_manually_queried": false,
  "status": "completed", "manual_reason": null, "valuation_basis": "comparable_sale",
  "category": "Furniture", "query": "vintage chair",
  "room_area": "Living Room", "make_mfr": "Ethan Allen", "model_number": "Conor",
  "description": "Leather sofa", "quantity": 1,
  "rcv": 300.00, "acv": 210.00, "tax": 24.75,
  "rcv_total_incl": 324.75, "depreciation_amount": 97.43, "acv_total_incl": 227.32,
  "depreciation_pct": 0.30, "depreciation_method": "straight_line", "pcs_code": "FRN",
  "confidence": 0.72, "error": null,
  "created_at": "2026-06-29T00:00:00+00:00", "updated_at": "2026-06-29T01:00:00+00:00",
  "age_years": 3.0,
  "alternative_sources": [
    { "title": "Conor Leather Sofa", "source": "Wayfair", "price": 305.0, "link": "https://..." }
  ],
  "depreciation_rule_version": "v1.3.2026-07-01",
  "market_comp": 300.00, "ceiling_used": 1200.00, "dep_manual": null,
  "substitution_note": null, "valuation_engine_version": "pricing-v1.2026-07-02",
  "overridden_by": null, "overridden_at": null, "override_reason": null,
  "image_url": "https://<project>.supabase.co/storage/v1/object/sign/..."
}
```
- **`image_url`** is a short-lived (~5 min) signed URL — fetch/display it promptly; **don't persist it**. Re-call detail to get a fresh one. May be `null` if the item has no stored image.
- **Valuation-basis fields** (`valuation_basis`, `market_comp`, `ceiling_used`, `dep_manual`, `substitution_note`) — see §5a below. `depreciation_pct` is a **fraction** (`0.30` = 30%).
- **`substitution_note` — ADJUSTER-FACING ONLY. Never render it on the export, and never present it as a warning.** It records that the price is **like-kind** rather than the exact item, for the adjuster's own review in the item drawer ("why was this price chosen?"). Two causes: (a) the exact model search was too thin, so a broadened search priced it; (b) **no comparable names the item's make** — Google Shopping fuzzy-matches, so a brand it doesn't index (marketplace-only makes) still returns a full page of *other manufacturers'* products, which prices fine but is a substitution. In both cases `valuation_basis` is `like_kind_new`.
  - **Do NOT surface this to the carrier or on the Master Statement of Loss.** LKQ is standard, accepted methodology in public adjusting — adjusters use it constantly, and explicitly footnoting it on a worksheet only invites the carrier to scrutinize and reject the line. **The Source Link is the disclosure; it speaks for itself.** Treat this field as internal pricing provenance, shown quietly in the drawer, not as a badge or an alert on the line.
- **`depreciation_method`** — how `depreciation_pct` was derived: `straight_line` (default: `age / useful_life`, capped), `bracketed` (the class's age-bracket curve — see `GET /v1/depreciation-rules` → `brackets_pct`), or `custom` (the adjuster's `dep_manual` pass-through). Set it (with `depreciation_basis` inputs) via `override`.
- **`pcs_code`** — the item's Xactimate PCS code (derived from its content class); shown in the worksheet's Content Class column and emitted in the export.
- **`alternative_sources`** = up to 3 comparable listings backing the valuation, **always** normalized to `{ title, source, price, link }` (nulls where a field is unknown — `[]` for `needs_manual` items and manual overrides). The backend normalizes on read, so you do **not** need to branch on shape.
  - **`source`** (merchant, e.g. `"Wayfair"`) **+ `price` + `title`** are the durable evidence — render *these*. **Always show `title`**: a like-kind comp is frequently a *different brand* than the item (a Friedrich dehumidifier priced off a Frigidaire listing), which is correct valuation methodology but misleading if the UI shows only merchant + price, as it implies the price is for *this* item.
  - **`link`** is the **direct merchant listing** (`ebay.com/itm/…`, `homedepot.com/p/…`) for **`alternative_sources[0]` only**, resolved server-side. It falls back to a Google Shopping redirect when resolution is unavailable (budget exhausted, vendor error, or the comp is a pre-2026-07-30 row), so treat it as a click-through, not as the citation itself — merchant URLs also rot over time.
  - ⚠️ **Comps `[1]` and `[2]` are NOT resolved** and their `link` is usually a Google Shopping **search** url (`google.com/search?ibp=oshop&q=…`) that lands on a results page, not the listing. Deliberate: only comp[0] is rendered on the export, and resolving the rest would spend a vendor call per comp on every priced item. **Render the runners-up as plain text (merchant + price + title), not as hyperlinks** — a carrier clicking through to a search box reads as sloppy substantiation. Only comp[0] should be a link.
  - **Order is meaningful**: element `0` is the **primary** comp — the most-preferred source for that item's content class (see `GET /v1/sources`), with closeness to the median only breaking ties *within* a source. It is the one comp the export renders, so surface it first in the UI too.
  - `price` is normally a number, but a legacy row can carry a display string (`"$369.00"`) — format defensively.
- **Worksheet fields** — `room_area` (free-text Room/Area), `make_mfr`, `model_number`, `description` (all nullable), and `quantity` (int, default `1`) are adjuster-editable via `override` (below).
- **Worksheet money columns (tax-inclusive contract).** `rcv`/`acv` are **per-unit, pre-tax** (basis engine). The worksheet/export **RCV, Tax, Depr.$, ACV** columns are the derived, **all computed on read** so they always reflect the current quantity/price and the claim's `tax_rate`:
  - `tax` = `rcv × quantity × tax_rate` — the embedded tax **breakout** (shown as its own column, but *already inside* `rcv_total_incl`; don't add it on top).
  - `rcv_total_incl` = `rcv × quantity + tax` — **RCV column** (tax-inclusive replacement cost total).
  - `depreciation_amount` = `round(rcv_total_incl × depreciation_pct, 2)` — **Depr.$ column** (depreciation applied to the tax-inclusive RCV, standard carrier practice).
  - `acv_total_incl` = `rcv_total_incl − depreciation_amount` — **ACV column** (tax-inclusive; this is the payable value, and `SUM(acv_total_incl)` is the claim total).
  - Each is `null` when its inputs are unset (unpriced item, no claim `tax_rate`, or no `depreciation_pct`) — dash on-screen, `→ 0.00` on export (see §4).
  - **`room_area` vs `room_id`:** `room_area` is the free-text value shown/edited on the worksheet; `room_id` is the optional relational room link (for future roll-ups). An item can have both, and they're independent.
- **`is_manually_queried`** — `true` once an adjuster re-priced the item via `POST …/reprice` (a refined query). Present on both list and detail rows so you can render a "Manually refined" badge without touching the audit log.
- **`manual_reason`** — set (on both list + detail) when `status = "needs_manual"`, explaining *why* so the worksheet can render the right flag:
  - `manual_class` — an appraisal / policy-sub-limit class (**Fine Arts, Firearms, Jewelry**) — never auto-priced.
  - `luxury_brand` — the item's query named a luxury/designer brand (e.g. Rolex, Louis Vuitton, Cartier) — routed to an adjuster/appraiser.
  - `low_sample` / `no_comps` — couldn't auto-price (too few / no comps). **`low_sample` means BOTH buckets were thin.** Since 2026-08-10 a thin *retail* bucket falls through to the resale market rather than short-circuiting: retail prices the line when it clears the sample floor, otherwise `comparable_sale` does, and only when neither clears does the item reach an adjuster. Expect materially fewer `low_sample` rows on vintage/collectible inventories — and expect the rescued ones to carry a **resale** price as the RCV.
  - `valuation_error` — the comp lookup itself failed (SerpApi timeout/error after retries), so we got zero comps. The `error` field carries the detail. This is a **transient** failure — a `reprice` (retry) will usually price it — but the item is surfaced for manual attention rather than silently passing as an unpriced `completed`.
  - **`low_sample` / `no_comps` on Electronics, Audio / Video, Major Appliances or Furniture** — these classes are deliberately excluded from the Amazon fallback tier, because Amazon's median has no notion of product tier and its cheap long tail dominates them (a ~$600 mattress priced $129 off sofa-bed pads). Expect a higher manual rate there **by design**; it is an adjuster task, not a failure.
  - **`quota_exhausted`** / **`budget_exhausted`** — a **capacity** stop: the plan's hourly throughput ceiling, or the daily spend cap. The item was **deferred, not attempted**. Nothing is broken and nothing needs an adjuster's judgement: **a `reprice` once the hour rolls over prices it normally.** Worth a distinct UI treatment from `valuation_error` — "waiting on capacity, retry shortly" rather than "this needs you". A bulk "retry all deferred" action on the claim would fit here.
  - `no_description` — the line had no defensible description (blank, a single word, or a placeholder like "Unknown"), so it was **refused before any comp lookup**. A description is what a price is corroborated against; live, a bare label code `"182A"` with no description priced at **$8,074.77** off Cessna aircraft comps. The adjuster supplies a description (`PATCH /v1/claim_items/{row_id}`) and then `reprice`.
  - `no_query` — an auto-catalogued stack whose photos yielded no usable search signal at all (no barcode, no model, no vision description).
  - `placeholder_row` / `not_priced` — **written-inventory import only.** `placeholder_row` is a template line that means *the adjuster fills this in* (`"… - Enter Price"`); `not_priced` is a row created with `price: false`. Both were created deliberately unpriced — neither is a failure.
  - `enqueue_failed` — the valuation job could not be queued (infrastructure). Rare; a `reprice` retries it.
  - `null` for non-manual items.
  - In **all** these cases `rcv`/`acv` are `null` — the adjuster enters the value via `PATCH …/override` (or `reprice` to try fresh comps). There is **no** blanket high-value cap: a well-priced standard item auto-completes at any price (real policy sub-limits are applied downstream in Xactimate).
- Internal fields (`storage_path`, raw vendor payload, `image_hash`) are intentionally **not** exposed.

---

### `PATCH /v1/claim_items/{row_id}/override` — owner override
**Auth required. JSON.** The owner adjusts the valuation; sets `status = "overridden"`, stamps actor + timestamp, and writes an audit diff. (`404` if not yours.)

**Request body (`OverrideRequest`):**
```json
{ "rcv": 120, "acv": 60, "category": "Electronics", "reason": "Reappraised after inspection" }
```
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `reason` | string | ✅ | 3–500 chars |
| `rcv` | number | ❌ | ≥ 0 |
| `acv` | number | ❌ | ≥ 0 |
| `category` | string | ❌ | – |
| `valuation_basis` | string | ❌ | `retail` \| `like_kind_new` \| `comparable_sale` \| `manual` — opt into the basis-aware path (below) |
| `market_comp` | number | ❌ | comparable_sale: the resale price (published raw as the `rcv`) |
| `dep_manual` | number | ❌ | 0..1 — lock the depreciation fraction (implies `depreciation_method: "custom"`) |
| `depreciation_method` | string | ❌ | `straight_line` \| `bracketed` \| `custom` — how depreciation is derived on recalc |
| `age_years` | number | ❌ | ≥ 0 — the item's age; the adjuster's post-processing entry that drives the depreciation recompute (see below) |
| `substitution_note` | string | ❌ | like_kind_new: what was substituted |
| `room_area` | string | ❌ | worksheet field — free-text Room/Area |
| `make_mfr` | string | ❌ | worksheet field (freely editable) |
| `model_number` | string | ❌ | worksheet field |
| `description` | string | ❌ | worksheet field |
| `quantity` | int | ❌ | ≥ 1 — line quantity; drives `tax` (`< 1` → `422`) |

**Cross-field rule:** `acv` must not exceed `rcv` — checked against **effective** values (new if provided, else the row's current). Violations → **`422`**.

**Adjuster age entry → depreciation recompute (the core worksheet loop).** Age can't be read from a photo, so items land from processing at **age 0 → ACV = RCV** (no depreciation yet). The adjuster then sets each item's age. Send **`age_years`** (optionally with `depreciation_method`) and the backend re-runs the engine on the item's **existing basis and replacement cost** — the replacement cost (`rcv`) stays put, depreciation is applied per the chosen schedule, and **`acv` drops accordingly**:
```json
{ "age_years": 3, "depreciation_method": "bracketed", "reason": "3-year-old TV" }
```
No need to re-send `valuation_basis` or the price — both default to the item's stored values. Method options: `straight_line` (age ÷ the class's useful life, capped), `bracketed` (the class's age-bracket curve), `custom` (send `dep_manual`). The response `applied.rcv` / `applied.acv` / `applied.depreciation_pct` reflect the recompute; the tax-inclusive worksheet columns (`rcv_total_incl` / `depreciation_amount` / `acv_total_incl`) follow on the next read. Supplying `age_years`, `depreciation_method`, or `dep_manual` **always** routes through the engine (you don't need `valuation_basis` to trigger it). An unpriced (`needs_manual`) item has no replacement cost to depreciate — set a price first (basis-aware override) before entering age.

**Worksheet edits.** `make_mfr` / `model_number` / `description` / `quantity` are free-form and independent of the valuation math — send any subset with a `reason`. Changing `quantity` or `rcv` makes the item's `tax` recompute automatically on the next read (tax isn't stored). Editing these still sets `status = "overridden"` and audits the change.

**Basis-aware override (recommended for adjuster editing).** When you send `valuation_basis`, the **pricing engine computes `rcv`/`acv` authoritatively** and enforces the money invariants (`acv ≤ rcv`; every published price is one that was actually observed). What each field means by basis:
- `retail` → `rcv` is the retail median.
- `like_kind_new` → `rcv` is the new comparable; include `substitution_note`.
- `comparable_sale` → `market_comp` is the resale price, used **raw** as the `rcv` (omit it to **recalc** from the stored one after a class/age change); optional `rcv` names an explicit new-replacement price that supersedes it — the only way this basis reports above the resale comp.
- `manual` → `rcv` (+ optional `acv`); the always-manual classes are Fine Arts & Firearms.
- ⚠️ **Units: every money value you SEND here is PER-UNIT and PRE-TAX — the same basis as `rcv`/`acv` on read.** The backend re-derives the tax-inclusive line totals (`rcv_total_incl` = `rcv × quantity + tax`). Sending a line total, or a tax-inclusive figure, misprices the row by `quantity × tax`. If the adjuster types a total, divide by `quantity` and strip tax before sending.
- `dep_manual` (0..1) locks the depreciation so a class/age recalc won't move it.

Any invariant violation (e.g. `acv > rcv`, unknown basis) → **`422`**.

**Response `200` (`OverrideResponse`):**
```json
{
  "status": "ok",
  "row_id": 7,
  "applied": { "status": "overridden", "overridden_by": "user-1", "overridden_at": "...", "override_reason": "...", "rcv": 120, "acv": 60 },
  "diff": { "rcv": { "from": 100, "to": 120 }, "acv": { "from": 50, "to": 60 } }
}
```

---

### `POST /v1/claim_items/{row_id}/reprice` — re-price from a refined query
**Auth required. JSON.** For the common field correction: the auto-valuation used a **generic** query (e.g. Vision saw `"Brown Leather Couch"`), so the adjuster supplies a better one (`"Ethan Allen Conor Leather Sofa"`) and the backend **re-runs the whole SerpApi + source-routing + pricing pipeline** on that text — fresh comps, new RCV, freshly depreciated ACV. Use this (not `override`) whenever the fix is "search for the right thing" rather than "hand-enter a number." (`404` if not yours.)

**Request body (`RepriceRequest`):**
```json
{ "query": "Ethan Allen Conor Leather Sofa", "category": "Furniture" }
```
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `query` | string | ✅ | 3–200 chars. The refined search text (make/model). |
| `category` | string | ❌ | Defaults to the row's current category. Also re-routes sources + depreciation. |

**Response `202` (`RepriceResponse`):**
```json
{ "status": "reprocessing", "row_id": 7, "job_id": "…", "query": "Ethan Allen Conor Leather Sofa" }
```
- **Async** — identical to `POST /v1/process`: the row flips to `status: "processing"`; **poll the detail endpoint** (§6) until it leaves `processing` → the new `rcv`/`acv`/`alternative_sources`/`query` land.
- On success the item's **`is_manually_queried`** becomes `true` (see below) — render a "Manually refined" badge.
- Shares the `/process` rate limit (**30/min**) since it costs a SerpApi call. Errors: `404` (not yours) · `422` (query < 3 chars) · `429` · `502` · `503`.

> **`override` vs `reprice`:** `override` hand-edits the numbers (basis-aware, for edge cases). `reprice` re-searches with better text and lets the engine do the work (the 90% case). `reprice` overwrites a prior `overridden` state — the adjuster is explicitly choosing a fresh valuation.

### `PATCH /v1/claim_items/{row_id}` — edit the worksheet display line
**Auth required. JSON.** Edit an item's **descriptive/identity fields only** — `description` (the long-form inventory line), `make_mfr`, `model_number`, `room_area` — **without touching the valuation**. Unlike `/override` this does **not** change `rcv`/`acv`/`status` and does **not** mark the item `overridden`; it's the adjuster fixing the inventory line (e.g. tightening the auto-generated `description`). This is the counterpart to `reprice`: `reprice` changes the *search query & price*, this changes the *worksheet text*.

**Request body (`ClaimItemEditRequest`)** — send only the fields you're changing; send `""` to clear one; at least one required:
```json
{ "description": "My Pet Monster Vintage Collectible Stuffed Plush Toy, Blue/Purple" }
```
| Field | Type | Notes |
|-------|------|-------|
| `description` | string | ≤500 chars. The worksheet line (export Description column). |
| `make_mfr` | string | ≤200 chars. |
| `model_number` | string | ≤200 chars. |
| `room_area` | string | ≤200 chars. |

**Response `200` (`ClaimItemEditResponse`):** `{ "status": "ok", "row_id": 7, "applied": { "description": "…" } }`. Synchronous (no re-valuation). Only the sent fields are written (trimmed; `""` → `null`). Errors: `404` (not yours) · `422` (no fields sent). Emits an `edited` audit event.

---

## 5b. Claims & rooms (inventory organization)

A **claim** is the mandatory named parent of every item (e.g. "The Smith Fire").
A **room** is an optional bucket inside a claim (e.g. "Kitchen"); items with no
room live in the **Unassigned** bucket. Matches the batch-dump workflow: upload
everything into a claim first, organize into rooms later (or never). All
endpoints are **owner-scoped** (`404` for a claim/room you don't own). V1 is one
adjuster per claim; multi-party sharing comes in the Enterprise phase.

> **Auto-materialize:** `POST /v1/process` creates the claim automatically from
> its `claim_id` (name defaults to the slug) — you do **not** have to create a
> claim before uploading. Use `POST /v1/claims` to capture the intake metadata up
> front, and `PATCH /v1/claims/{claim_id}` to edit it later.

**Claim `status` is DERIVED, not set by you** — computed from the item states + an export marker:
`draft` (no items yet) → `processing` (any item still processing) → `in_review` (all items terminal — ready to review) → `exported` (once exported). Always accurate on read.

**Intake metadata** (all optional, on create/patch, echoed on every claim): `insured_name`, `carrier`, `policy_number`, `claim_number`, `loss_type`, `date_of_loss` (ISO `YYYY-MM-DD`), `loss_address`, `tax_rate` (a **fraction**, e.g. `0.0825` = 8.25%; `422` if `>1`).

### `GET /v1/claims` — list my claims (with rollups)
**Auth required.** Owner-scoped, newest-first. Optional `?limit=` (≤100), `?offset=`.
```json
{ "claims": [
  { "claim_id": "smith-fire", "name": "The Smith Fire", "status": "in_review",
    "insured_name": "Jane Smith", "carrier": "Acme Mutual", "policy_number": "PN-123",
    "claim_number": "CN-456", "loss_type": "Fire", "date_of_loss": "2026-06-01",
    "loss_address": "1 Main St", "tax_rate": 0.0825, "exported_at": null,
    "item_count": 42, "total_rcv": 18240.50, "total_acv": 12110.00,
    "status_counts": { "processing": 0, "completed": 40, "needs_manual": 2, "failed": 0, "overridden": 0 },
    "created_at": "…", "updated_at": "…" } ],
  "count": 1, "limit": 20, "offset": 0 }
```
`total_rcv` / `total_acv` are **tax-inclusive** sums of the per-line worksheet totals (they honor each item's `quantity` and the claim's `tax_rate`), so they match `SUM(rcv_total_incl)` / `SUM(acv_total_incl)` over the claim's items. Per-room `total_rcv`/`total_acv` (rooms endpoints) follow the same tax-inclusive basis.

### `POST /v1/claims` — create a claim + intake metadata
Body: `{ "claim_id": "smith-fire", "name": "The Smith Fire", "insured_name": "…", "carrier": "…", "tax_rate": 0.0825, … }` (only `claim_id` is required; it must match `^[A-Za-z0-9_-]{1,64}$`). Returns **`201`** with the claim summary. If the claim already exists (e.g. auto-created by an upload) it is returned **unchanged with `200`** — use `PATCH` to edit.

### `GET /v1/claims/{claim_id}` · `PATCH /v1/claims/{claim_id}`
`GET` returns one claim + rollup (`404` if not yours). `PATCH` body is `{ "name"?, + any intake metadata field }` — only supplied fields change. **Status is derived, not settable.**

### Claim actions
- **`POST /v1/claims/{claim_id}/duplicate`** — deep-copy a claim (a "Version B"): its metadata, rooms, **and every item** (valuations + worksheet edits + room assignments; images shared by reference, copy is not exported). Optional body `{ "new_claim_id"?, "name"? }` — both auto-generate otherwise (`<slug>-copy-xxxxxx`, `<name> (Copy)`); a supplied `new_claim_id` that already exists → `409`. Returns **`201`** with the new claim summary.
- **`DELETE /v1/claims/{claim_id}`** — deletes the claim and **all** its items + rooms (DB cascade — no orphaned rows). Returns `{ "status": "ok", "claim_id": "…", "deleted_items": 42 }`. (Evidence images in storage are left for a future janitor.)
- **`GET /v1/claims/{claim_id}/preview`** — same payload as `GET /v1/claims/{claim_id}` (convenience alias).
- **`GET /v1/claims/{claim_id}/export?format=xlsx|pdf`** — download the claim's inventory as the file the adjuster sends: **`xlsx`** (default; Xactimate XactContents-style) or **`pdf`**. Returns the binary with `Content-Disposition: attachment; filename="<claim>-inventory.<ext>"` (not JSON). **Column order matches the on-screen worksheet** so the file and the UI present one shape:

`#` · Room/Area · Qty · Description · Make/MFR · Model # · **Content Class (PCS code)** · Unit Cost · Extended Cost · Sales Tax · RCV + Tax · Age (yrs) · % Depreciation · $ Depreciation · ACV · **Source Link**, plus a TOTALS row.

- **Money breakout** — `Unit Cost` = `rcv` (per-unit, **pre-tax**); `Extended Cost` = `Qty × Unit Cost`, still pre-tax; `Sales Tax` = the embedded breakout; `RCV + Tax` = `rcv_total_incl`. The invariant `Extended Cost + Sales Tax == RCV + Tax` always holds. Depreciation applies to `RCV + Tax` per the money contract, which is why Age / % / $ / ACV follow it. All tax-inclusive with `null → 0.00` (no dashes/blanks, no `-$0.00`).
- **`Unit Cost` is deliberately NOT summed in TOTALS** — adding per-unit prices across different items is a meaningless figure. Extended Cost, Sales Tax, RCV + Tax, $ Depreciation and ACV all total.
- **Every cell is a STATIC VALUE — there are no spreadsheet formulas, deliberately.** Typing an age into the exported `.xlsx` will NOT recalculate depreciation. `% Depreciation` comes from the content class's schedule (per-class useful life, the bracketed curve, the manual/appraisal classes), not from arithmetic a cell could express — so putting it in Excel would mean shipping a second copy of the depreciation rules that can drift from the engine. **The UI owns age entry** (`PATCH …/override` with `age_years`, §5a) and re-exports; the file stays a faithful snapshot of the claim record, which matters because it is the document that goes to a carrier.
- **Source Link** is deliberately minimal: the word **`Link`**, hyperlinked to the primary comp's **direct merchant listing** (element `0` of `alternative_sources`). Live in both formats — a real anchor in the `.xlsx` and in the PDF. Blank (no dead link) for `needs_manual` rows, manual overrides, and any comp without a usable URL. Merchant/title/price stay in the API for the item drawer rather than the cell, so the document never implies a comparable's price was quoted for *this* item. **Side effect:** stamps `exported_at`, so the claim's derived status becomes `exported`. `422` on a bad `format`; `404` if not yours.

### Rooms (optional organization)
- `POST /v1/claims/{claim_id}/rooms` — body `{ "name": "Kitchen" }` → `201` room summary. Duplicate name in the same claim → `409`.
- `GET /v1/claims/{claim_id}/rooms` — list rooms, each with its own `item_count` / `total_rcv` / `total_acv`.
- `PATCH /v1/rooms/{room_id}` — body `{ "name": "…" }` (rename; `409` on name clash).
- `DELETE /v1/rooms/{room_id}` — `{ "status": "ok", "room_id": 5 }`. Items are **not** deleted — they fall back to **Unassigned**.

### `PATCH /v1/claim_items/assign-room` — bulk (un)assign
**JSON.** `{ "item_ids": [1,2,3], "room_id": 7 }` — or `"room_id": null` to unassign. **All-or-nothing:** every item must be yours, and (when assigning) the room must be yours and belong to the **same claim** as every item. Otherwise `404` (foreign/missing items or room) or `422` (item not in the room's claim) and nothing changes.
```json
{ "assigned": 3, "item_ids": [1, 2, 3] }
```

### `GET /v1/claim_items` — worksheet-grid fields on the list
The list response carries **`age_years`** and **`alternative_sources`** (normalized identically to the detail endpoint), so the worksheet grid renders **in one call** — no N+1 detail fetch per row just to fill the Age and Source Link columns.

**`image_url` is deliberately NOT on the list.** Each one costs a signed-URL mint, so including it would tax every list call with bulk signing. Fetch it from the detail endpoint for a single item, or wait for the dedicated thumbnail path.

### `GET /v1/claim_items` — new room filters
Two filters added: `?room_id=<id>` (items in one room) and `?unassigned=true` (items with no room — the Unassigned bucket; takes precedence over `room_id`). Every item row now includes **`room_id`** (or `null`).

**Workflow:** create/pick a claim → batch `POST /v1/process` (items land Unassigned) → optionally create rooms + bulk-assign → read dashboard totals from `GET /v1/claims`.

---

## 5c. Photo staging & auto-cataloging

The flagship ingest flow, end to end: the adjuster drops the whole folder into a claim → the system extracts per-photo signals and **clusters** the photos into item-stacks (an **AND-gate**: EXIF/timing/barcode proximity *proposes* a group, Claude-vision *validates* it) → the adjuster **reviews & corrects** the proposals → each confirmed stack is **promoted to one line item and priced once**. Session lifecycle: `uploading → clustering → review → processed`.

**Typical sequence:** `POST …/staging` → `POST …/staging/photos` (repeat in small batches) → poll `GET …/staging` until every photo is extracted → `POST …/staging/cluster` → poll `GET …/staging` for the proposals → correct with the group endpoints → `POST …/staging/process`.

### `POST /v1/claims/{claim_id}/staging` — start (or resume) a staging session
**Auth required.** Creates a session for the claim (`status: "uploading"`). If an active (non-`processed`) session already exists it's returned with **`200`** (idempotent — a re-click or flaky-wifi retry won't spawn duplicates); otherwise **`201`**. `404` if the claim isn't yours.
```json
{ "id": 12, "claim_id": "smith-fire", "status": "uploading", "photo_count": 0, "created_at": "…", "updated_at": "…" }
```
Status lifecycle: `uploading → clustering → review → processed`.

### `POST /v1/claims/{claim_id}/staging/photos` — upload a batch of photos
**Auth required. `multipart/form-data`** — one or more files under the field name **`images`**. Send the folder as small parallel batches (don't push 500MB in one request). Each photo is EXIF-stripped + stored, its EXIF proximity signals captured, and a per-photo Vision-extraction job enqueued (async). Creates the active session if none exists.
- **Retry-safe:** a photo already staged in the session (same content hash) is silently skipped — a flaky-wifi re-send never duplicates. Non-images / oversized / empty files are skipped too.
- **Accepted formats:** JPEG, PNG, WebP, GIF, **and HEIC/HEIF** (iPhone/Samsung default). HEIC is decoded + normalized to JPEG server-side. **Action for the uploader UI:** include `.heic,.heif` (and `image/heic,image/heif`) in the file-picker `accept` list and in any client-side extension allow-list, or iPhone users can't select their photos. Same for `POST /v1/process`.
- **Response `202` (`StagingUploadResponse`):**
```json
{ "session_id": 12, "uploaded": 48, "photo_ids": [101, 102, "…"],
  "rejected": [ { "filename": "IMG_2291.AAE", "reason": "unsupported_type" },
                { "filename": "IMG_2304.HEIC", "reason": "too_large (limit 15MB)" } ] }
```
- **`uploaded + rejected.length` always equals what you sent** — nothing is ever dropped silently. Surface `rejected` to the adjuster; at 300 photos a silent skip means a claim is short items with nothing to say which.
  - Reasons: `unsupported_type` · `empty_file` · `too_large (limit NMB)` · `image_dimensions_too_large` · `undecodable_image` · `duplicate` · `storage_error`. Only `storage_error` is worth an automatic retry; the rest are the file's fault.
  - `duplicate` is normal and benign — it's how a re-sent chunk stays idempotent.

### Uploading a whole folder (hundreds of photos)
**One adjuster action, many requests.** The adjuster selects the entire folder and clicks once; the uploader chunks it into **parallel requests of ≤ `50`** against the *same* session. Photos accumulate across calls and are deduped by content hash, so the adjuster never sees the seam.

- Over the cap → **`413`** with the limit in the message. The cap exists because a single 300-photo body is ~1 GB processed serially in-request — it would time out at the gateway rather than finish.
- **Retry a failed chunk blindly.** Re-sending is a no-op: already-stored photos come back as `duplicate`, never as new rows. This matters — a big upload will lose a connection eventually.
- Don't call `…/staging/cluster` until every chunk has returned; clustering `409`s while any photo is still extracting.

### `GET /v1/claims/{claim_id}/staging` — the claim's latest session (+ proposals)
**Auth required.** Returns the latest session with live `photo_count` (`404` if none). Once clustering has run, it also carries the review **`groups`** (proposals) and **`tally`**; before that both are `null`.
```json
{
  "id": 12, "claim_id": "smith-fire", "status": "review", "photo_count": 6,
  "groups": [
    { "group_key": "12-0", "kind": "item", "reason": "sofa wide shot + tag close-up",
      "confidence": 0.9, "suggested_category": "Furniture", "suggested_query": "Ethan Allen leather sofa",
      "suggested_description": "Ethan Allen Brown Top-Grain Leather Rolled-Arm Sofa",
      "suggested_make": "Ethan Allen", "suggested_model": null,
      "photos": [ { "id": 101, "image_url": "https://…signed…" }, { "id": 102, "image_url": "https://…" } ] },
    { "group_key": "12-1", "kind": "context", "reason": "room overview", "confidence": 0.7,
      "suggested_category": null, "suggested_query": null,
      "photos": [ { "id": 103, "image_url": "https://…" } ] }
  ],
  "tally": { "photos": 6, "line_items": 4, "grouped": 4, "skipped": 1, "duplicates": 1 },
  "ungrouped_photos": [ { "id": 107, "note": null, "status": "extracted" } ],
  "created_at": "…", "updated_at": "…"
}
```
- **`kind`** ∈ `item` (→ one worksheet line item) · `context` (room/overview establisher → 0 items) · `duplicate` (near-identical, collapsed).
- **`ungrouped_photos`** — photos belonging to **no set**, i.e. uploaded *after* clustering ran. They appear in no `groups[]` entry, so **render them as an "Unassigned" tray**: without it they are invisible on screen and `…/staging/process` drops them from the claim silently. Clear it with `…/staging/cluster/remainder` (below) or by merging them into a set. Empty list when every photo is assigned.
- **`status`** (on every photo entry, in `ungrouped_photos` and inside `groups[].photos`) — the photo's extraction state. **Gate the UI on it:** `uploaded` means Vision has not finished, and *every* grouping path (`…/cluster`, `…/cluster/remainder`, `…/groups/merge`) returns **`409`** for such a photo, so offering an action on one is offering a guaranteed failure. Values: `uploaded` (pending — note it is NOT called "extracting") → `extracted` (signals present, no set yet — actionable) → `clustered` (in a set) → `promoted` (became part of a `claim_item`).
  - **Not the same as `tally.skipped`**, which counts photos deliberately placed in a `context` set. Unassigned photos are **unreviewed**, not excluded — don't merge the two counts in the UI.
  - Sets never contain a still-extracting photo (clustering `409`s until every photo is extracted), so there is **no need to gate individual sets on extraction state**.
- Each entry in **`photos`** carries `id` and its `note` (the adjuster's per-photo note, or `null`) — render the note on the staging thumbnail so an existing one is visible during review.
- **`photos[]` no longer carries `image_url`.** Minting a signed URL per photo made a single poll of a 300-photo session issue 300 sequential storage round-trips — and this endpoint is polled every few seconds. Fetch thumbnails lazily instead:

### `GET /v1/staging/photos/thumbnails?ids=1,2,3` — batch thumbnails
**Auth required.** `{ "thumbnails": [ { "id": 1, "image_url": "https://…signed…" } ] }`. Call it for the photos actually **in the viewport**, not the whole session.
- Max **100** ids per call (`422` beyond); non-integer ids → `422`.
- Ids you don't own, or that don't exist, are simply **absent** from the response rather than erroring — one stale id can't blank a grid.
- `image_url` may be `null` if minting failed (render a placeholder; the photo still exists).
- URLs are short-lived (~5 min) — **re-fetch on scroll-back, don't persist them.**
- **`note` on the group** — the set's member notes joined with **`" | "`**, capped at **120 chars** (a trailing `…` means it was truncated). `null` when no member was noted. Set automatically whenever a set is created: by clustering, by **merge** (the new set inherits every member's note), and by **ungroup** (each photo's new set gets its own note back, not the fused one). Repeats are dropped case-insensitively, so three burst shots all noted "red ball" read `"red ball"`, not the same phrase three times.
  - It is a **display summary, not the record.** `photos[].note` keeps exactly what was typed against each photo and is never modified by grouping — so the 120-char cap can shorten the summary but can never lose a note. If the group note ends in `…`, the full text is still on the individual photos.

### `PATCH /v1/claims/{claim_id}/staging/photos/{photo_id}` — adjuster note on a photo
**Auth required. JSON.** `{ "note": "just the red ball" }` → the session (with proposals). `null` or `""` clears it. Max **300 chars** (`422` beyond). `404` if the photo isn't in this claim's active session.

**What it's for.** Vision labels *everything* in frame, so a red ball photographed on a cluttered shelf produces a polluted query (`"ball toy shelf books"`) and prices the wrong thing. The adjuster was standing in the room — this is where they say which object the line item is for. The note is read by the clustering vision pass as **context, not as a search query**, so one field handles both a vague disambiguation (`"just the red ball"`) and a precise identification (`"Sony WH-1000XM5"`): the vision pass looks at the image *and* the note, then writes the category, query, description and make/model for the object the adjuster pointed at.

**Timing — this is the important part.** The note only takes effect **when clustering runs**, so the natural flow is:

```
upload photos → wait for extraction → adjuster reviews the grid and adds notes
              → POST …/staging/cluster → review proposals → POST …/staging/process
```

- A note added **after** proposals exist does nothing until you re-run `POST …/staging/cluster`. `POST …/staging/reset` returns the session to `uploading` for that, and **keeps the notes** — a reset re-runs the machine's work, not the human's.
- **`409`** while clustering is in flight: that run has already read the notes, so accepting silently would imply it applied.

**One limitation worth designing around:** a photo can only ever become **one** line item — clustering partitions *photos*, not objects within a photo. So a single frame containing three items the adjuster wants as three separate lines can't be split by a note. The note pins *which* object the line is for; separate items still need separate shots.
- **`suggested_make` / `suggested_model`** — the item's manufacturer and model/part number read off the item or its tag, filling the worksheet's **Make/MFR** and **Model #** columns on promote. **Either can be `null`, and that is a correct answer, not a gap:** an unbranded item has no make, and a model number is only recorded when a photo's OCR corroborates it (a model the vision pass inferred from appearance rather than read is dropped, because a wrong identifier on a worksheet is worse than a blank one). Render a blank cell, not "Unknown". The adjuster can always fill either in via `override`.
- **`suggested_query`** vs **`suggested_description`** — two DISTINCT strings the vision pass emits per item. `suggested_query` is a concise search string that drives comp lookup (SerpApi). `suggested_description` is the long-form, identity-preserving **worksheet line** ("My Pet Monster Vintage Collectible Stuffed Plush Toy, Blue/Purple", not "plush") — on promote it becomes the claim_item's **`description`** (the export's Description column). Show `suggested_description` as the editable item name in the review UI; `suggested_query` is the search term behind the price.
- **`group_key`** is the stable per-session id you pass to the correction endpoints below.
- **`photos[].image_url`** — short-lived signed thumbnail URL (like item detail; may be `null`, fetch promptly).
- **`tally`** drives the review header "Photos → Line items · Grouped · Skipped · Duplicates": `line_items` = number of `item` groups; `grouped`/`skipped`/`duplicates` = photo counts by kind.

### `POST /v1/claims/{claim_id}/staging/cluster` — run clustering (AND-gate)
**Auth required.** Kicks off clustering in the worker on the active session. **`409`** if extraction is still in flight (any photo not yet Vision-extracted) **or** the session has no photos — poll `GET …/staging` until all photos are extracted first. Otherwise sets `status: "clustering"` and returns **`202`** `{ "session_id": 12, "status": "clustering" }`. Poll `GET …/staging` for the proposals (session → `review`). `404` if no active session.
- **`409` once any set has been arranged by hand** (merge / ungroup / reclassify). Re-clustering **rebuilds the whole session** — it deletes every group and reassigns every photo — so it would silently discard the adjuster's work. There is no "re-analyze" in this design: to regroup late photos use `…/cluster/remainder`; to genuinely start over use `…/staging/reset` (which clears the block along with the groups).

### `POST /v1/claims/{claim_id}/staging/cluster/remainder` — group only the unassigned photos
**Auth required.** Clusters **only** photos with no set (`ungrouped_photos`), leaving every existing set exactly as it is. Use this when photos were uploaded after the clustering pass — it is the non-destructive counterpart to `…/cluster`, and it stays available even when that one is blocked by manual edits.
- **`202`** `{ "session_id": 12, "status": "clustering" }`, session → `clustering` then back to `review`. Poll `GET …/staging` for the new sets.
- **`409`** if every photo is already in a set, or if any unassigned photo is still extracting. `404` if no active session.
- A late photo is **not** offered the chance to join an existing set — that would re-open a set the adjuster may have already arranged. To put a late photo into an existing set, use `…/groups/merge` with its `photo_ids`.

### Correcting proposals (adjuster review)
All four operate on the claim's active (non-`processed`) session and return the **refreshed `GET …/staging` payload** (`groups` + `tally`) so the grid re-renders. `404` if the claim / session / group isn't yours.
- **`POST /v1/claims/{claim_id}/staging/groups/merge`** — combine groups and/or loose photos into one group. Body `{ "group_keys"?: ["12-0","12-3"], "photo_ids"?: [104], "kind"?: "item" }` — at least one of `group_keys`/`photo_ids` (else `422`); `kind` defaults `item`. Emptied source groups are pruned. `400` if nothing matched. **`409` if any named photo is still extracting** (it would otherwise be marked clustered without ever having been analysed) — the detail names the photo ids.
  - **This is also the single-photo assignment path.** Drop a loose photo onto an existing set with `{ "group_keys": ["12-0"], "photo_ids": [104] }`; keep it as its own line with `{ "photo_ids": [104] }`.
  - **The merged set gets a NEW `group_key`** and the sources are pruned — re-read the returned session rather than caching the old key.
  - **Pass `kind` explicitly** when the target set is not an item: it defaults to `item`, which would silently convert a `context` or `duplicate` set.
  - **Identity is inherited when every photo comes from at most ONE existing set** (the drag-a-photo-onto-a-set case): that set's `suggested_category` / `suggested_query` / `suggested_description` / `suggested_make` / `suggested_model` carry over, so adding a photo refines the set instead of erasing what the vision pass learned. Merging **two or more** sets leaves them `null` — there is no non-arbitrary way to choose whose identity survives. A set with no `suggested_description` promotes to `needs_manual` (`no_description`), so after a multi-set merge either re-run `…/cluster/remainder` or have the adjuster fill the line in via `PATCH /v1/claim_items/{row_id}`.
- **`POST /v1/claims/{claim_id}/staging/groups/{group_key}/ungroup`** — split a group into one `item` group per photo. `404` if the group is empty/unknown.
- **`PATCH /v1/claims/{claim_id}/staging/groups/{group_key}`** — reclassify. Body `{ "kind": "context" }` (`item` | `context` | `duplicate`; else `422`). `404` if unknown.
- **`POST /v1/claims/{claim_id}/staging/reset`** — discard all proposals and start the review over: clears groups, un-clusters the photos (kept, back to `extracted`), session → `uploading`. Re-run `…/cluster` when ready.

### `POST /v1/claims/{claim_id}/staging/process` — promote confirmed stacks → valuation
**Auth required.** Promotes every **`item`** group to one `claim_item` (with `primary_photo_id`), fuses each stack's photo signals into one search query, and pushes it down the valuation pipeline (async, text-path — no re-Vision). Context/duplicate groups promote nothing. **`409`** if there are no confirmed item stacks; `404` if no active session.
- **Fused-query precedence (strict indemnity):** exact identifiers outweigh generic descriptors — **barcode > model number(s) > generic** (item type + labels). Generic descriptors are used *only* when the stack has no exact identifier anywhere, so the carrier finds the *exact* pre-loss replacement rather than a lookalike.
- **Response `202` (`StagingProcessResponse`):** `{ "session_id": 12, "items_created": 4, "item_ids": [501, 502, 503, 504], "skipped_photos": [107] }`. Session → `processed` (terminal — a re-`process` returns `404`).
- **`skipped_photos`** — photos that were in no set and so reached **no** `claim_item`. Because processing is terminal they are now off the claim. This is **reported, not blocked**: a hard refusal would strand an adjuster whose manual edits bar a re-cluster and whose only other route is `…/reset` (which discards that work). **Warn before confirming** — show the count from `ungrouped_photos` on the review screen and offer `…/cluster/remainder`, so `skipped_photos` comes back empty. Poll the item endpoints (§5 / §6) for pricing; a stack with no usable query lands as `needs_manual` (`manual_reason: "no_query"`).

---

## 5d. Written-inventory import (no photographs)

Sometimes a written list is all that survives a total loss. The valuation core was always text-driven — photographs exist only to **build a query**, and RCV is the median of live retail comps either way — so a described item prices exactly like a photographed one, just without brand/model precision.

**This is not a staging session.** Staging exists to turn photos into items (cluster → review → promote). A written list has no photos to group and no proposal to review: **each row already is a line item**, so it goes straight to the worksheet. Don't route a PDF/XLS through `…/staging`.

**The flow is: parse → map columns → preview → import.** Steps 1–3 create nothing.

### `POST /v1/claims/{claim_id}/items/parse` — upload the raw file (multipart)
**Auth required.** Field `file`. Accepts **`.pdf`, `.csv`, `.xlsx`, `.xls`**, max 20 MB. **Creates nothing.** Parsing is server-side: a browser parser cannot read PDF at all, and real total-loss inventories arrive as PDFs.
```json
{ "format": "pdf", "filename": "inventory.pdf", "row_count": 2571, "heading_count": 155,
  "headers": ["description", "room", "quantity"],
  "suggested_mapping": { "description": 0, "room": 1, "quantity": 2 },
  "rows": [ { "index": 1, "cells": ["Air purifier / Air cleaner", "Attic", ""],
              "likely_heading": false, "source_ref": "2" } ] }
```
- **Every format returns this same shape**, so the mapping UI has one code path. A PDF is positional rather than headed, so it arrives with `headers` and `suggested_mapping` already filled in — show the mapping step pre-filled rather than skipping it.
- **`likely_heading`** — a section heading (`"WALL ART/DÉCOR"`), not property. Real exports interleave these; one priced as an item at **$236.39** when a parser silently treated it as property. **Flagged, never dropped** — pre-select them for removal and let the adjuster confirm. It is their list.
- **`suggested_mapping` is partial by design.** Unrecognised headers are left unmapped: a guess the adjuster can see beats a silent wrong one.
- **Room is split out of the description automatically on PDFs.** This matters because the description doubles as the search query — one row that swept the room *and* quantity into the search returned **$720** for a ~$300 window air conditioner. Keep them in separate fields when you send them on.
- `415` unsupported type · `400` empty · `413` over 20 MB · `422` unreadable or no rows · `404` unknown claim.

### `POST /v1/claims/{claim_id}/items/bulk` — create line items from a list
**Auth required.** Body:
```json
{ "items": [ { "description": "Refrigerator", "room": "Kitchen", "quantity": 1, "category": null,
               "make_mfr": "Whirlpool", "model_number": "WRS325SDHZ", "age_years": 4 } ],
  "price": true }
```
- **`description`** (2–300 chars, required) is both the worksheet line **and** the search query.
- **`make_mfr` / `model_number`** (optional) — map these whenever the list has Make/Manufacturer/Brand or Model/Model #/SKU columns. They are **not** cosmetic:
  1. They **lead the search query** — the row above searches `"Whirlpool WRS325SDHZ Refrigerator"`, not `"Refrigerator"`. Query specificity is the single biggest lever on pricing accuracy: brand+model prices the *item*, a bare noun prices the *category*.
  2. They fill the worksheet's **Make / MFR** and **Model #** export columns.
  3. `make_mfr` supplies the **brand** that corroboration checks. Without it the backend cannot tell that a line was priced entirely off *other manufacturers'* listings, so no `like_kind_new` relabel and no `substitution_note` is ever produced for that line.
  Placeholder cells (`"Unknown"`, `"N/A"`, `"-"`, `"TBD"`, …) are treated as empty and never printed. A part already named in the description is not repeated, so duplicating the brand across columns is harmless. Values are trusted **as typed** — unlike the photo path, which requires OCR to corroborate a model, a human reading the list is stronger evidence than OCR.
- **`room`** free-text area label (no room record needed). **`quantity`** defaults `1`. **`category`** optional — inferred from the description when omitted, and it drives depreciation.
- **`price: false`** creates the rows *without* spending vendor budget — use it to stage a long list, then price deliberately.
- **Max 500 rows per request** (`422` beyond). A total-loss inventory runs to thousands of rows and every priced row is real SerpApi spend, so page through deliberately.
- **`202`** `{ "claim_id", "items_created", "item_ids": [...], "priced": 12, "needs_manual": [513] }`. Poll the item endpoints for prices as usual.
- **`needs_manual`** — created but deliberately unpriced. Template placeholder rows (`"… - Enter Price"`, meaning *the adjuster fills this in*) are detected and never priced: fed to the pricer verbatim, one such row returned $30.99 off unrelated comps.
- `404` unknown claim; `502` if nothing could be created.

**This is also the way to add a single line item without a photo** — send a one-row list. Every other item-creating path requires an uploaded image.

### `POST /v1/claims/{claim_id}/items/bulk/preview` — dry run (creates nothing)
**Auth required.** Same `items` array (up to **5,000** rows — preview the whole file at once even though the import pages at 500). **Creates nothing, spends no vendor budget**, safe to call as often as the UI needs.

> ⚠️ **`price: false` on the import endpoint is NOT a dry run.** It means *create the rows without pricing them* — it still inserts every row. Using it as a pre-flight and then importing for real would create the whole inventory **twice**. Use this endpoint for the pre-flight.

```json
{ "claim_id": "smith-fire", "total_rows": 500, "priceable": 482, "needs_manual": 18,
  "uncategorised": 34, "estimated_searches": 964,
  "rows": [ { "index": 0, "description": "Whirlpool WRS325SDHZ Refrigerator", "room": "Kitchen",
              "quantity": 1, "category": "Major Appliances", "age_years": 4,
              "make_mfr": "Whirlpool", "model_number": "WRS325SDHZ",
              "will_price": true, "reason": null } ] }
```
- **`estimated_searches` is what to show the adjuster — not the row count.** Each priced item costs a comp search **plus** a merchant-link resolution, so 482 items ≈ **964** searches. Quoting rows understates the spend by half.
- **`uncategorised`** — category drives depreciation; these rows will price but depreciate poorly. Worth surfacing so the adjuster can map a category column.
- **`reason`** explains any `will_price: false` row (currently `placeholder_row`).
- **`description` in the preview is the COMPOSED line** — identity-first, exactly what will be searched and exported. Show the adjuster this, not the raw description cell they mapped.

---

### Admin / ops endpoints (role `admin`, mostly run by cron — not typical frontend use)
- `GET /v1/jobs/failed?limit=50` — dead-letter jobs. Non-admins see only their own (`scope: "self"`); admins see all (`scope: "all"`). Returns `{ count, jobs: [{ job_id, actor_id, args, enqueued_at, ended_at, exc_info }], scope }`.
- `POST /v1/jobs/reap` — **admin** — mark stale `processing` rows failed.
- `POST /v1/jobs/purge-exif` — **admin** — redact expired EXIF PII.

These also run headless on a schedule, so the frontend usually doesn't need them. Non-admins get `403`.

---

## 5a. Valuation basis (the money model)

Every item records **how** it was valued, so a payout is defensible and never
double-depreciated. The invariant: **`rcv` always holds a NEW-replacement-
equivalent, never a used/resale price.** `valuation_basis` is one of:

| basis | meaning | `rcv` | `acv` | `market_comp` |
|-------|---------|-------|-------|----------------|
| `retail` | still sold new | median of live retail comps | `rcv × (1 − dep)` | `null` |
| `like_kind_new` | model discontinued, comparable sold new (incl. **auto LKQ** — see below) | the new comparable (see `substitution_note`) | `rcv × (1 − dep)` | `null` |
| `comparable_sale` | no *trustworthy* retail evidence — either no retail channel at all (antique/vintage/designer resale) **or** a retail bucket too thin to clear the sample floor, so the resale market decides | the resale price, **raw** (no gross-up) | `rcv × (1 − dep)` | the same resale price |
| `manual` | adjuster-entered (always for Fine Arts & Firearms) | adjuster value | adjuster value / derived | `null` |

Key points for the UI:
- For `comparable_sale`, **`rcv == market_comp`** — the observed resale price is published exactly as found. **Changed 2026-08-08:** it used to be grossed up (`market_comp / (1 − dep)`) so the carrier's depreciation would land the ACV back on the resale price; that RCV was a number no listing ever showed, and it is gone. The trade is a deliberate double-depreciation (an already-used price depreciates again), accepted because an accurate number beats a synthetic one in a carrier audit.
- Show `market_comp` as "market/used value" and `rcv` as "replacement cost". `ceiling_used` is non-null only when an adjuster named an explicit new-replacement price, which is then the `rcv`.
- `depreciation_pct` is a **fraction** (`0.30` = 30%).
- `dep_manual` (0..1, or `null`) — a locked depreciation the adjuster set; it survives class/age recalcs.
- `needs_manual` items have `null` `rcv`/`acv` until an adjuster values them (basis-aware override).
- **Auto LKQ (Like Kind & Quality):** most claimed electronics/appliances are a few years old and **discontinued**, so an exact-model (or barcode) search is often too thin to auto-price. Rather than defer to manual, the pipeline drops the model number and retries on brand + description (`HP …M479fdw printer` → `HP …printer`) to price the current-market equivalent. When that rescues an item it comes back **`completed` with `valuation_basis: "like_kind_new"`** and a populated **`substitution_note`** naming the exact search that was too thin. So `like_kind_new` + `substitution_note` now appear on **auto-priced** items, not just adjuster overrides. **Display rule (canonical, see §5): adjuster-facing only.** Show it in the item drawer as neutral provenance — a quiet "like-kind" marker is fine, an alert or warning is not — and **never** put it on the export or anywhere a carrier reads. The Source Link is the carrier's disclosure; the LKQ label is our internal record that we did not price the exact item. If even the broadened search is thin, the item still lands `needs_manual` (`manual_reason: "low_sample"`).

**camelCase ↔ snake_case:** the backend contract is snake_case. If your design used camelCase, map: `valuationBasis`↔`valuation_basis`, `marketComp`↔`market_comp`, `substitutionNote`↔`substitution_note`, `depManual`↔`dep_manual`, `ceilingUsed`↔`ceiling_used`. (A generated client from `/openapi.json` uses the snake_case names as-is.)

---

## 6. Polling pattern for valuation status

`POST /v1/process` is **async**. The row starts as `status: "processing"`; the worker flips it to a terminal state. Poll the **detail** endpoint until it leaves `processing`. Note the terminal state **`needs_manual`** — the item can't be auto-priced (Fine Arts/Firearms, too few comps, or above policy special-limits) and needs an adjuster to value it via a basis-aware override.

**Recommended loop** (poll detail, fixed interval, hard timeout):

```ts
const TERMINAL = new Set(["completed", "failed", "overridden", "needs_manual"]);

async function waitForValuation(rowId, jwt, {
  intervalMs = 2500,   // valuations typically take a few seconds
  timeoutMs  = 120000, // give up after 2 min (worker timeout is 300s; tune as needed)
} = {}) {
  const started = Date.now();
  while (true) {
    const res = await fetch(`${API_BASE}/v1/claim_items/${rowId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (res.status === 429) {                      // rate limited — honor Retry-After
      const wait = (Number(res.headers.get("Retry-After")) || 5) * 1000;
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);

    const item = await res.json();
    if (TERMINAL.has(item.status)) return item;    // done — render rcv/acv/image_url/etc.

    if (Date.now() - started > timeoutMs) return item; // still processing; show "taking longer…"
    await sleep(intervalMs);
  }
}
```

Notes:
- Poll **detail** (`/v1/claim_items/{id}`), not list — it's the cheapest correct signal and gives you `image_url` + valuation fields in the same call once complete.
- On `failed`, show `error` (a human-readable message) and offer retry (re-submit).
- On `needs_manual`, route the user to the adjuster/manual-entry flow (basis-aware override); `rcv`/`acv` are `null` until valued.
- Keep `intervalMs` ≥ ~2s to stay well under the 120/min read budget.
- **Optional future upgrade:** Supabase **Realtime** on `claim_items` (scoped by the existing RLS) can push status changes instead of polling. Not required for v1; polling is the supported path today.

### Status lifecycle
```
processing ──► completed      (auto-valued successfully)
           ──► needs_manual   (can't auto-price — adjuster must value it)
           ──► failed         (gave up after retries; see `error`)
           ──► (overridden)    (owner/adjuster edited via PATCH; from any terminal state)
```

---

## 7. Environment variables (frontend)

The frontend needs three values. Names below use the Vite convention
(`VITE_*`); for Next.js use `NEXT_PUBLIC_*`, etc. Only the **publishable/anon**
Supabase key — **never** the service-role key.

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | `supabase-js` client (login/session) |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` | Publishable key — safe to embed in the browser |
| `VITE_API_BASE_URL` | `http://localhost:8000` (dev) / `https://<app>.up.railway.app` (prod) | Base URL for all backend `/v1` calls |

```env
# .env (frontend) — example
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
VITE_API_BASE_URL=http://localhost:8000
```

> The publishable key is designed to be public. The **service-role** key is
> backend-only and must never reach the browser.

---

## 8. Generating a typed client (recommended)

The API is fully typed via Pydantic, so `GET /openapi.json` is an accurate spec.
Generate a typed TS client instead of hand-writing fetch calls:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/types.ts
# or: npx @hey-api/openapi-ts -i http://localhost:8000/openapi.json -o src/api
```

Re-generate whenever the backend contract changes. Schema names match this doc
(`MeResponse`, `ProcessResponse`, `ClaimItemSummary`, `ClaimItemListResponse`,
`ClaimItemDetail`, `OverrideRequest`, `OverrideResponse`, …).

---

## 9. Typical end-to-end flow

1. **Login** with `supabase-js` → get `access_token`.
2. `GET /v1/me` → show user; if `is_admin`, reveal admin UI.
3. **Pick/create a claim:** `GET /v1/claims` for the dashboard; `POST /v1/claims` to start a named one (optional — the next step auto-creates it).
4. **Upload (batch):** `POST /v1/process` (multipart) with `claim_id` + `image` (+ `age_years`/`category`) → get `row_id`. Items land in the claim's **Unassigned** bucket.
   - If `200 duplicate`, jump straight to the existing `row_id`.
5. **Poll** `GET /v1/claim_items/{row_id}` until `status` is terminal (§6) → render `rcv`, `acv`, `confidence`, `image_url`, `alternative_sources`.
6. **Organize (optional):** create rooms (`POST /v1/claims/{claim_id}/rooms`), then `PATCH /v1/claim_items/assign-room` to bulk-assign; view a room via `GET /v1/claim_items?room_id=` or the Unassigned bucket via `?unassigned=true`.
7. **List/inventory view:** `GET /v1/claim_items?status=&claim_id=&room_id=&limit=&offset=` with `count` for pagination.
8. **Adjust:** two paths — `POST /v1/claim_items/{row_id}/reprice` with a refined `query` to re-search (the common case; poll for the new price, badge via `is_manually_queried`), or `PATCH /v1/claim_items/{row_id}/override` with a `reason` to hand-edit the numbers (→ `overridden`).
9. **Close out:** the claim's `status` derives automatically (`in_review` once all items are done → `exported` after the export step). No manual status update.
```
