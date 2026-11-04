# getassetledger — competitive read

**Read 4 November 2026.** `getassetledger.com`. Sitemap: 14 URLs, last modified
2 November — two days before this read. Pages read: home, `/insurance`,
`/audit-trail`, `/compare/inventory-harbor`.

Solo-run and says so on the homepage: **Carl Beckett**, founder, answers the
support email himself. Unlike the last two audits it has **terms, a privacy
policy, an about page and a blog** — a complete small site rather than a
landing page with a phone number.

---

## 1. What it is — a different business with a pro tier bolted on

Primarily a **consumer** home-inventory product: snap a photo of each thing you
own, get a record with an estimated replacement range, pay **$19.99 once** for
the printable report. Free to build, no subscription, no app (PWA).

`/insurance` is the professional tier on top: a firm workspace, team logins,
branded client reports, Xactimate-ready Excel. **$49 per client report, or
$149/month unlimited.**

So they are not chasing our buyer first. They are chasing the homeowner and
selling the adjuster a workspace second. That matters for reading everything
below: the pro tier is a second act, not the product.

---

## 2. Things genuinely worth learning

### 2.1 The branded client report is table stakes

> "a sample branded client report (PDF) — your firm name, logo and license at
> the top; RCV, ACV and photo record on every line."

This is the exact thing that came up earlier in this session when a company was
added under personnel and never reached the exported PDF. A one-person
competitor ships firm name, **logo and license number** on the client-facing
document. It is not a differentiator for anyone; it is the floor.

### 2.2 "Exact item" vs "Comparable", as a per-line badge

> "Each item links to the same brand and model online, marked **'Exact item'**,
> or to a like-kind replacement marked **'Comparable'**. Enter a model number
> from the label and search again to get the exact match."

We hold this distinction already — `valuationBasis` is retail comp vs like-kind
substitute (rule 10) — and we surface the LKQ note in the item drawer. They put
it on the line as a two-word badge, and they pair it with the remedy in the
same breath: *type a model number and search again.* That is the same loop our
worksheet has (sharpen the description, re-price), expressed more legibly than
we express it.

**Worth considering:** not new capability, just a clearer surface for something
we can already answer.

### 2.3 Their own honesty caveat vindicates the screenshot decision

The company that ships **SHA-256 file hashes** on every upload says this, twice,
unprompted:

> "Timestamps and hashes describe the file as uploaded and processed by
> getassetledger; **they do not independently prove when or where an image was
> originally captured.**"

That is the strongest available evidence for the call made on 2026-10-29 to
**not** build screenshot or archival "proof" (see
`COMPETITOR-CLAIMPRICINGPARTNERS.md` §4). The vendor with the most elaborate
file-provenance machinery on the market explicitly disclaims that it proves
anything. Nothing to build here.

### 2.4 Their comparison page is the best-written thing across all three audits

`/compare/inventory-harbor` is a model, and we are about to build four of these.
What it does right:

- **"CHOOSE GETASSETLEDGER IF" / "CHOOSE INVENTORY HARBOR IF"** — it names, up
  front, when the competitor is the better buy. Same instinct as our
  Contents.team page, executed more plainly.
- **Every claim dated**: "as listed on their own websites and app-store pages on
  October 27, 2026; check their sites for current details."
- **Explicit non-affiliation**, and "product names belong to their owners".
- **Three-year cost of ownership** worked out in dollars — $19.99 once against
  $117 on a yearly plan — instead of a feature grid.
- **"Can I use both?"** as an FAQ. Disarming, and probably true.

Adopt the three-year-cost move for our outsourcing page: it is the same shape
as the 498-line break-even already calculated in
`COMPETITOR-CLAIMPRICINGPARTNERS.md` §3.

### 2.5 A second named industry template

Their Xactimate export writes the **"Non-Salvage Inventory template layout"** —
room, brand, model, description, quantity, age, condition, replacement cost,
with the vendor cell as a link and a second sheet carrying the photo record.

That is a *second* named template after State Farm's XactContents Import
Template v4.0. It supports the decision in `CARRIER-TEMPLATES.md` to build a
pluggable layer rather than a State Farm special case — named layouts are
clearly how this industry moves files.

---

## 2.6 ⚠️ The sample report undercuts most of §2 — read this before acting on it

Owner's read of `/sample-report`, confirmed: **it gives a range, and it does
not produce an Excel.** The gap is wider than that, and it is the most
important thing on their site.

The consumer report carries a photo, a description, a condition note, a
SHA-256 and **an estimated replacement-value RANGE** — "$260 – $380". No unit
cost. No quantity, tax, RCV, ACV or depreciation columns. No spreadsheet. The
Xactimate-ready Excel exists only in the $49 professional tier.

Then their own explanation of where the number comes from:

> "Each range is an estimate of what a similar item costs new today at US
> retail... **After you buy the report**, getassetledger can look up a current
> US retail listing for each item and link it... Replacement cost (RCV) uses
> the linked listing's price when one is found, **otherwise the middle of the
> range**."

Three things follow, and they are the competitive point:

1. **Before purchase there is no listing at all.** The range is estimated from
   the photograph. The comp lookup is deferred until after payment.
2. **Even after purchase, RCV can be the midpoint of an estimated range** when
   no listing is found — a number sourced to nothing, printed as a replacement
   cost.
3. **ACV only exists if the customer types a purchase year**, and antiques and
   collectibles "get only a broad range".

Against rule 10, that is the whole argument. Our unit cost **is the price of a
single listing**, and the Source Link on the row points at it; a line we cannot
source arrives `needs_manual`, blank and editable, rather than carrying a
plausible midpoint. Theirs degrades to an estimate and keeps printing a number.

**So temper §2.2.** The "Exact item / Comparable" badge is still a clean
surface, but it sits on top of a materially weaker basis — and a badge that
can silently mean "midpoint of a guess" is not a model to copy wholesale. Take
the two-word legibility; do not take what sits under it.

---

## 3. Where they differ from us, and we are right

| | getassetledger | Kevin |
| --- | --- | --- |
| Photo → items | **A shelf photo, or a 3-minute room video, becomes a line per item** | One item per photo (rule 1) |
| Depreciation ceiling | **Capped at 80%** | Runs to 100%; a fully-aged line is $0.00 (rule 13) |
| Condition | An input to depreciation (New / Above Avg / Average / Below Avg) | Not a claims-side field |
| Pricing | $49 per client report | Flat $249/mo, never per claim (rule 9) |
| Retention | **Preview data deleted after 7 days** unless purchased | Nothing is ever deleted (rules 15, 19) |
| Source links | "a **live** link to the store page" | "a listing", never "live" (rule 10) |
| High-value flag | Over **$1,500**, plus jewelry/art/antiques/collectibles | Six classes never auto-priced; no dollar gate (rule 12) |

Three of these are worth a sentence each:

- **The video-to-many-items claim is the third time this has appeared** (after
  iContentsPro's "One Photo. Every Item." and their shelf photo). It is
  becoming the category's default promise, which makes our arithmetic test —
  *does the tool ever report more items than you took photographs?* — more
  valuable, not less. Do not soften it.
- **Their 80% cap makes us the outlier, deliberately.** Rule 13 removed the
  salvage floor on the owner's 2026-09-11 decision after measuring the live
  engine. If a prospect cites an 80% floor, the answer is that ours renders
  what the schedule actually returns rather than clamping it.
- **Condition-adjusted depreciation is a real capability gap**, but adopting it
  would be a backend change, not a UI one (rule 20), and it collides with the
  published per-class schedule that makes our numbers reconcilable by hand.
  Noting it, not recommending it.

---

## 4. Not a competitor for our buyer — with one caveat

$19.99 one-time consumer tooling and a $49-per-client pro workspace are not
competing for an independent adjuster running 2,000 line items a month. The
caveat is the funnel: they reach the **homeowner** first and then sell the
professional. The contents inventory template page built on 2026-10-29 is our
only asset pointed at that audience, and it exists precisely because the
insured is who the adjuster asks to make the list.

Nothing here changes that plan. It does suggest the template page should link
onward to the adjuster-facing pages more deliberately than a related-cards
block, since that is the only path from consumer intent to our actual buyer.

---

## 5. Also surfaced: Inventory Harbor (formerly Stowly)

Named in their comparison page: a consumer household organiser — warranty and
maintenance reminders, recall alerts, receipt scanning, barcode entry, shared
family inventory; insurance PDF behind a $4.99/month plan. **Typed entry, not
photo identification.** Not a competitor to us on any axis; recorded so the
name is not a surprise later.
