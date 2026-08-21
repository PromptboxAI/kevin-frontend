# ROUTES.md — kevin.co

Maps each prototype file in `pages/` to its intended production URL path.
The prototype uses flat `NN-Name.html` filenames; production should use the
URL column. `:id` denotes a claim ID (canonical demo: `CLM-2026-04412`).

Auth state column: **Public** (no login) · **Auth** (signed-in app) · **Carrier** (carrier-side reviewer login).

---

## Marketing & public

| File | URL | Auth | Notes |
|---|---|---|---|
| `02-Landing.html` | `/` | Public | Homepage |
| `21-Pricing.html` | `/pricing` | Public | 3 tiers |
| `22-For-Adjusters.html` | `/for-adjusters` | Public | Segment page |
| `23-For-Estate-Liquidators.html` | `/for-estate-liquidators` | Public | Segment page |
| `24-Docs.html` | `/docs` | Public | Help center |
| `25-Legal-hub.html` | `/legal` | Public | Privacy / Terms / DPA / Security tabs |
| `37-Product-overview.html` | `/product` | Public | "Product" nav link |
| `38-Contact.html` | `/contact` | Public | Sales + support |
| `39-About.html` | `/about` | Public | Company + team |
| `52-Watch-demo.html` | `/demo` | Public | Video walkthrough |
| `53-Careers.html` | `/careers` | Public | Open roles |
| `57-Logos.html` | — | (internal) | Brand exploration; not a shipped route |

## Authentication

| File | URL | Auth | Notes |
|---|---|---|---|
| `00-Sign-in.html` | `/signin` | Public | Email + password / passkey |
| `50-SSO-sign-in.html` | `/signin/continue` | Public | Expanded sign-in — Google, passkey, email/password. **No SAML/Okta/OneLogin/Microsoft**: Kevin runs its own accounts plus Google. Do not build IdP routing. Largely duplicates `00-Sign-in.html`; keep one |
| `15-Request-access.html` | `/request-access` | Public | Agency sign-up |
| `45-Forgot-password.html` | `/forgot` | Public | Enter email |
| `46-Reset-sent.html` | `/forgot/sent` | Public | Confirmation |
| `47-Reset-password.html` | `/reset?token=…` | Public | Set new password (from email link) |
| `49-Sign-out.html` | `/signout` | Public | Post-logout confirmation |

## Core claim loop

| File | URL | Auth | Notes |
|---|---|---|---|
| `01-My-claims.html` | `/claims` | Auth | Dashboard — landing for returning users |
| `03-Intake.html` | `/claim/new` | Auth | New-claim metadata + upload |
| `77-Holdback-recovery.html` | `/claim/:id/recovery` | Auth | Post-settlement holdback recovery — claimed_rcv + receipts |
| `76-Done-for-you.html` | `/done-for-you` | Public | Done-for-you service — send photos, we build the inventory |
| `75-Written-import.html` | `/claim/:id/import` | Auth | Written inventory import — parse → map → preview → import. NOT staging: a written row already is a line item |
| `73-Photo-staging.html` | `/claim/:id/stage` | Auth | Group multi-photo items · skip context shots (produces 162→142 collapse) |
| `04-Processing.html` | `/claim/:id/processing` | Auth | Live processing animation |
| `05-Worksheet-flat.html` | `/claim/:id/review` | Auth | **Centerpiece** — baseline worksheet |
| `06-Export-modal.html` | `/claim/:id/export` | Auth | Final-review modal |
| `12-Claim-overview.html` | `/claim/:id` | Auth | Claim summary (tabs: Overview/Photos/Worksheet/Audit/Export) |
| `13-Exports-history.html` | `/exports` | Auth | All exports, master/detail |
| `16-Claim-photos.html` | `/claim/:id/photos` | Auth | Photo gallery tab |
| `17-Audit-log.html` | `/claim/:id/audit` | Auth | Single-pane audit timeline |
| `18-Notifications.html` | `/notifications` | Auth | Inbox + bell popover |
| `29-Share-claim.html` | `/claim/:id/share` | Auth | Handoff modal (co-edit / handoff / link) |
| `48-Sample-claim.html` | `/sample` | Public | Interactive demo worksheet (from landing) |
| `54-Add-item.html` | `/claim/:id/add` | Auth | Add-item modal |

## Worksheet directions (design explorations)

| File | URL | Auth | Notes |
|---|---|---|---|
_Removed._ The split/grouped/dense explorations were consolidated into the single worksheet: **Group by class** is a toolbar toggle, and the item drawer **pins to the right** for side-by-side review.

## Settings

| File | URL | Auth | Notes |
|---|---|---|---|
| `31-Settings-profile.html` | `/settings/profile` | Auth | My profile + Security entry points |
| `32-Settings-agency.html` | `/settings/agency` | Auth | Org settings |
| `19-Team-management.html` | `/settings/team` | Auth | Members, roles, invites |
| `10-Carrier-settings.html` | `/settings/carriers` | Auth | Carrier profiles (depreciation tables, limits, exclusions) |
| `14-Settings-pricing.html` | `/settings/pricing` | Auth | Valuation behavior (unified comp source) |
| `40-Pricing-source.html` | `/settings/pricing/source` | Auth | Comp-source detail (Google Shopping) |
| `33-Settings-export-defaults.html` | `/settings/export` | Auth | Export defaults |
| `34-Settings-integrations.html` | `/settings/integrations` | Auth | Connected services |
| `35-Settings-billing.html` | `/settings/billing` | Auth | Plan, seats, invoices |
| `36-Settings-api.html` | `/settings/api` | Auth | API keys + webhooks |

## Security (under Settings → My profile)

| File | URL | Auth | Notes |
|---|---|---|---|
| `41-Security.html` | `/settings/security` | Auth | Consolidated security: password · 2FA · passkeys · sessions (anchored sections) |

## Mobile (PWA)

| File | URL | Auth | Notes |
|---|---|---|---|
| `26-Mobile-sign-in.html` | `/m/signin` | Public | Phone sign-in |
| `27-Mobile-pair.html` | `/m/pair` | Auth | Pair-with-desktop QR scan |
| `11-Mobile-capture.html` | `/m/claim/:id/capture` | Auth | Camera capture |
| `28-Mobile-review.html` | `/m/claim/:id/review` | Auth | Review session before sync |

## Carrier side

| File | URL | Auth | Notes |
|---|---|---|---|

## System & utility

| File | URL | Auth | Notes |
|---|---|---|---|
| `20-Edge-states.html` | — | (internal) | Gallery of 6 empty/error states; not a route — these states render inline on their parent screens |
| `51-Book-call.html` | `/book` | Public | Onboarding scheduler |
| `55-Cookie-banner.html` | (overlay) | Public | Cookie consent — renders on first visit, not a standalone route |
| `56-404-not-found.html` | `*` (catch-all) | Public | 404 |

---

## Notes for implementation

- **Edge states** (`20`) and the **cookie banner** (`55`) are not standalone routes — they're states/overlays that belong on their parent screens. The standalone files exist only so designers can review them in isolation.
- **Worksheet variants** (`07`–`09`) should likely become a `?view=` param on `/claim/:id/review` rather than three routes.
- **Add-item** (`54`) and **Export** (`06`) are modals over the worksheet, not full pages.
- **Sample claim** (`48`) is public and read-only-feeling but reuses the full worksheet component.
