# Handoff: Kevin — full product build

## Overview
Kevin (kevin.co) is a B2B SaaS for insurance content-inventory adjusters and estate liquidators: photos in → identified, priced, defensible personal-property inventory out, exported to Xactimate/XactContents. This package is the complete design for the production frontend: marketing site, auth + trial signup, the core claim loop (intake → staging → processing → worksheet → export), estate mode, holdback recovery, client portal + paywall, settings, mobile capture, owner admin console, transactional emails, and help docs.

## About the design files
Everything in this project is a **design reference built in HTML/JSX prototypes** — it shows intended look and behavior; it is not production code to copy. Your task is to **recreate these designs in a production React environment** (the prototypes are already React 18, so component structure translates directly — but rebuild with a real bundler, router, and state layer; do not ship the Babel-standalone script chain). No production codebase exists yet: choose a modern React stack (e.g. Vite/Next + TypeScript) and implement there. The live backend API already exists and is the source of truth for all data and money math.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final. Recreate pixel-perfectly. All visual tokens live in `kevin.css` (`--k-*` custom properties, OKLCH); fonts are Lato (UI), Geist Mono (data), Merriweather (display).

## The four documents that ARE the spec — read in this order
1. **`CLAUDE.md`** (project root) — locked domain/business rules (24 numbered rules). Violating one misrepresents the product. Non-negotiable.
2. **`INTERACTIONS.md`** — the wiring manifest: per page, every control → {prototype behavior, production endpoint}. A control that is visual-only AND undocumented is a bug — flag it back, never invent behavior.
3. **`SCHEMAS.md`** — payload shapes, money contract, share-visibility spec, staging/session model. Mirrors the backend's FRONTEND.md.
4. **`ROUTES.md`** — page file → production URL path map.

## Where things live
- `pages/NN-*.html` — one standalone page per screen (80+). `pages/index.html` is the sectioned, clickable list of all screens.
- `components/*.jsx` — the shared component library. `components/data.jsx` is the **mock backend boundary**: everything in it stands in for the real API and must be replaced by real fetches, never ported as logic.
- `kevin.css` — the single stylesheet, all tokens and components.
- `emails/` — 14 send-ready transactional email templates (+ `emails/index.html` preview).
- `gitbook/` + `Kevin-docs.md` — help-docs content as markdown (45 articles), ready for GitBook or an in-app renderer (`docs.jsx` renders the same content from block data).
- `assets/claim/web/` — real sample-claim photography used by the demo claim.

## Iron rules (the ones that break money or trust if missed)
- **The frontend never computes valuation math.** rcv/acv are per-unit pre-tax; the worksheet/export columns are the server's tax-inclusive line totals (`tax`, `rcv_total_incl`, `depreciation_amount`, `acv_total_incl`) read verbatim. No client arithmetic anywhere, including previews. (CLAUDE.md worksheet section; verified against the live API.)
- **Depreciation recalc is server-owned**: age/class edits set a pending state and apply the server's response. `depreciation_pct` is a fraction (0.30 = 30%).
- **Exports are server-generated** (`GET /v1/claims/{id}/export`); the .xlsx contains static values only — never formulas. Money nulls render as "—" on screen, 0.00 in exports, never −$0.00.
- **`needs_manual` rows are unpriced** (null rcv/acv, blank editable cell, no badges); capacity waits (`quota_exhausted`/`budget_exhausted`) are a quiet pulsing state, never errors.
- **Staging is incremental** — every merge/split/note/exclusion saves immediately; Process posts no body. Merge mints a new group_key. `uploaded` photos 409 on grouping.
- **Client portal is server-shaped** — GET /p/{token} returns only what the audience may see; never fetch-everything-and-hide client-side.
- **One item per photo**, items ≤ photos, always.

## Build order (suggested)
1. Scaffold + tokens + shared components (`shared.jsx`, `kevin.css`)
2. Auth + trial signup (00, 58, 59, 45–47) — Stripe SetupIntent flow per INTERACTIONS.md
3. Claims dashboard + claim overview + tab nav (01, 12, 16, 17)
4. Intake → staging → processing (03, 73, 04) against the live staging endpoints
5. The worksheet (05) — the centerpiece; then export modal (06), export success/failed (60, 63)
6. Item drawer/reprice, holdback recovery (77, 78), share manager (29), client portal (79)
7. Marketing + docs + emails; estate mode (62); mobile (11, 26–28); admin console (64–72)

## Environment notes
- The backend is live; get the API base URL + CORS registration from the backend team (they are waiting on your deploy's origin).
- `window.KevinAPI` in `data.jsx` documents every endpoint the UI expects, with realistic latencies and response shapes — treat it as executable API documentation.
- Anything marked "Seed-only" in CLAUDE.md (upload queue literals, the 90s processing animation) must be **replaced with live state**, not wired around.

## Assets
Sample photography: `assets/claim/` (originals) and `assets/claim/web/` (900px). Unsplash URLs in `window.PRODUCT_IMG` (landing gallery). Logo is the `<KevinWordmark>` component — text-based, no image asset.
