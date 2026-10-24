# LinkedIn company page — kevin.co

Everything LinkedIn asks for, filled in from what the site already says. Copy
the fields straight across.

**Every fact here is sourced from the shipping site or the legal pages** — no
invented headcount, no invented funding, no claims the site does not make. Where
LinkedIn wants something we have not decided, it says so rather than guessing.

Three domain rules apply to anything you type into LinkedIn later, because the
page is a surface like any other:

- **No SOC 2** (rule 7). Say "AES-256 at rest, TLS 1.3 in transit" if security comes up.
- **"Xactimate (Excel) · .xlsx"**, never "Xactimate XML" (rule 2).
- **Never name the pricing vendor** or how a listing is chosen (rule 10). "Kevin Content Pricing Engine" is the public name.

---

## Page setup fields

| LinkedIn field | Value |
| --- | --- |
| **Name** | `Kevin` |
| **LinkedIn public URL** | `linkedin.com/company/kevin-co` — `/kevin` will be taken; `kevin-co` matches the domain |
| **Website** | `https://www.kevin.co` |
| **Industry** | **Software Development** (see note below) |
| **Company size** | **2–10 employees** |
| **Company type** | **Privately Held** |
| **Logo** | `public/brand/kevin-logo-300.png` (300×300) |
| **Tagline** (120 char max) | `Photos in. Inventory out. Contents inventories for insurance adjusters.` (71) |

**On industry:** LinkedIn allows one. **Software Development** is the honest
primary — we sell software, not adjusting services. "Insurance" would put the
page among carriers and agencies, which is where the *buyers* are but not what
the company is; the specialties below carry the insurance signal instead, and
they are what LinkedIn search actually matches on.

**On company size:** the site names one person (Kevin Godfrey, founder) and
Careers lists an "Adjuster in residence" as part-time/contract. 2–10 is the
smallest band that is not "1" — pick **1** instead if you would rather the page
not imply staff. LinkedIn shows this band publicly; it is not retroactive, so
starting accurate costs nothing.

---

## Location

From the Privacy Policy and Terms footer — this is the address already published:

```
Kevin.co, LLC
34 E. Main St. Ste 347
Smithtown, NY 11787
United States
```

Set it as the **headquarters**. LinkedIn will ask whether to show the street
line; it is already public on kevin.co/legal, so either way is consistent.

---

## About (LinkedIn's 2,000-character limit — this is 1,575)

> Kevin turns a folder of claim photographs into a defensible personal-property
> inventory.
>
> An adjuster drops the photos from a pack-out. Kevin identifies each item,
> reads the make and model off the evidence, assigns the content class, applies
> the depreciation schedule for that class and age, and prices the replacement
> against retail comps — each one traceable to the listing it came from. What
> comes back is a worksheet the adjuster reviews and an export the carrier can
> import: Xactimate (Excel) .xlsx in the XactContents template, plus a
> room-by-room PDF for the insured.
>
> The work it removes is the work that never needed a person: reading a model
> number off a photograph, finding what the item costs today, applying a
> schedule to an age, typing 540 lines into an estimate on a Friday night. The
> work it leaves alone is the adjuster's — whether the identification is right,
> whether the class is right, whether the carrier will wear the number. Nothing
> is promoted to a claim item without a person confirming it.
>
> Built by Kevin Godfrey, who spent twenty-two years adjusting and settled more
> than ten thousand claims before building the thing he wanted on a Friday
> night. Based in Smithtown, New York.
>
> Pricing is flat: $249 a month, unlimited claims, 2,000 line items included,
> and the first 250 items free with no deadline. No per-seat maths, no
> per-claim fee. Estate inventories and done-for-you builds are quoted
> separately.
>
> Who it's for: independent and staff adjusters, public adjusters, contents
> specialists, restoration and pack-out firms, and estate liquidators.

Two things in there are deliberate and worth keeping if you rewrite it: **"each
one traceable to the listing it came from"** is the provenance claim we can
actually stand behind, and **"nothing is promoted without a person confirming
it"** is the line that separates us from room-photo extraction tools.

---

## Specialties (LinkedIn allows 20 — these are 16, all real)

```
Contents inventory
Insurance claims
Personal property valuation
Claims adjusting
Xactimate
XactContents
Replacement cost value
Actual cash value
Depreciation schedules
Property claims
Public adjusting
Contents pricing
Estate inventory
Estate liquidation
Pack-out documentation
Insurtech
```

These are the terms adjusters actually search. `Xactimate` and `XactContents`
are the two highest-intent ones — they are the software the buyer already pays
for, which is the comparison that gets made anyway.

---

## Assets

| Asset | Spec | Status |
| --- | --- | --- |
| **Logo** | 300×300 PNG (min 268, max 8 MB) | ✅ `public/brand/kevin-logo-300.png` |
| **Cover image** | 1128×191 PNG/JPG | ❌ **does not exist** — see below |
| Larger logo | for anything else that asks | ✅ `kevin-logo-400.png`, `kevin-logo-1024.png` |

All three logo PNGs are generated by `node scripts/build-logo-png.mjs` from
`public/favicon.svg`, through the same rasteriser the favicon uses. Re-run it
after any change to the mark; never hand-export one, or the repo ends up
holding a picture of the old logo that nothing updates.

**The cover image has to be made.** 1128×191 is a wide, short strip — about 6:1
— so it holds a wordmark and one line of text and nothing else. The obvious
version is the navy field (`#1c446e`) with "Kevin." in white Merriweather and
"Photos in. Inventory out." beside it in Lato. It needs real type, which the
PNG generator cannot rasterise; it is a design export, not a build step.

---

## Founded

**2024** — from the About page timeline ("Kevin founded · Started in Long
Island, NY"). The 2025 entry is the beta (310+ claims across 12 carriers) and
2026 is general availability.

---

## Fields to leave empty

- **Phone** — there is no published number. Contact is `kevin@kevin.co`, and the site says so deliberately: "No chatbot, no ticket queue, no sales team to get past."
- **Funding** — nothing to state.
- **Stock symbol** — n/a.

---

## First posts, if you want them ready

The page needs content on day one or it reads abandoned. Four that write
themselves from pages that already exist:

1. **The useful-life schedule** — `/reference/useful-life` publishes all 87 sub-lines across 31 categories, as a page and a CSV. Genuinely useful to an adjuster and it is a reference, not a pitch.
2. **Why items never outnumber photographs** — the arithmetic check from `/guides/best-contents-software-public-adjusters`. It is the one test that separates item-level work from room extraction, and it costs a reader nothing to run.
3. **The founder line** — twenty-two years, ten thousand claims, contents always ate the weekend. Straight off `/about`.
4. **Done-for-you** — send the photos, we build it, from $750. `/done-for-you`.

Link each to the page rather than reproducing it; the pages are already
indexed and carry their own schema.
