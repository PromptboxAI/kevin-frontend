# iContentsPro — competitive read

**Read 27 October 2026.** Their whole site is seven pages (their sitemap.xml
lists all of them): home, `/total-loss-contents`, `/icp-desk`, `/solutions`,
`/pricing`, `/video-tutorials`, `/support`. All read in full.

Everything attributed to them below is **quoted or closely paraphrased from
their own public pages on that date**, same rule the Contents.team comparison
page runs on. If their site changes, this is stale.

---

## 1. The finding that matters more than any missing page

**Their done-for-you service is 10¢ a line item. Ours is $5.00.**

Their `/icp-desk` page: *"10¢ per line item, built & reviewed"* — you upload
photos or a list, their AI builds the report, then *"a person on the iCP-Desk
reviews and validates every line by hand."* Not a sample — the page hammers
"every line" six times.

On a 400-line job, assuming their $49.99 single-claim plan on top:

| | iContentsPro | Kevin DFY |
| --- | --- | --- |
| 400 lines | $49.99 + $40.00 = **$89.99** | **$1,775** |
| 400 lines, we shoot it | — (no capture service offered) | **$2,325** |

That is roughly **20×**. Caveats that narrow it but do not close it: their price
assumes you are already on their platform and have already captured the
evidence, "SLAs available" reads like a priority upsell, and nobody can review
a line properly — image against item, replacement sourced, ACV and RCV
re-checked — for ten cents. Their own page half-concedes the economics:
*"The AI Optimizer already did the expensive part. A reviewer is verifying a
line that exists, not building one from nothing."*

**Why it still matters:** a public adjuster comparing two tabs sees 10¢ and
$5.00 for things that read like the same service. Our $5.00 includes work
theirs does not — we will go and photograph the loss, and rule 9d's bands are
built on a real field-labour cost — but **no page of ours says that in a form
that survives the comparison.** `/done-for-you` explains the bands and the
minimum; it never says what the line rate buys that a 10¢ review does not.

This is an owner decision, not a copy fix. The options as I see them: hold the
price and make the difference explicit on the page, add a cheaper
review-only tier for reports that already exist, or decide the two products
aren't competing and ignore it. I would not change 9d on the strength of a
competitor's page.

---

## 2. Where we are already well ahead — do not over-correct

| | iContentsPro | Kevin |
| --- | --- | --- |
| Marketing pages | 7 | 53 |
| Docs / guides | 0 guides, 10 tutorial videos | 43 guides + 45 docs articles |
| About / founder | none | `/about` |
| Legal (terms, privacy) | **not in sitemap** | `/legal` |
| Security page | a support *category* only | `/security` |
| Careers | none | `/careers` |
| Published depreciation schedule | none | `/reference/useful-life`, 87 sub-lines + CSV |
| Comparison pages | none | 3 |
| Structured data | — | sitewide |

They are a product site with no content programme. We out-rank them on every
informational query by default. Nothing below is a reason to build thirty more
pages.

**Two things on their own site contradict each other**, worth knowing before
anyone treats their Xactimate parity as settled. The homepage says *"Every line
exports with its Xactimate category already assigned."* The `/solutions` page,
listing what every line carries, ends with *"Xactimate category COMING SOON."*
We ship `pcs_code` on the .xlsx today (rule 18).

---

## 3. Page gaps worth closing

Ranked by (search intent × how much of the capability we already have).

### 3.1 `/total-loss-contents` — build this

Their strongest page, and the one term we have no landing page for. "Total loss
contents inventory" is high-intent: it is what an adjuster types when the house
is gone and there is nothing to photograph.

**We can already do this.** Rule 24's written-import path takes PDF, CSV and
XLSX with no photographs at all, and prices a described item the same way. The
capability ships; the page does not exist. `/contents-claims/without-photos` is
the nearest thing and it is framed as an edge case rather than the headline.

Their angle is worth taking seriously — *"Photos from before the loss. Camera
rolls, holiday and event photos, social media, a business's website and
marketing photos, video stills. The backgrounds hold the furniture."* That is a
genuinely good idea and nothing in our product prevents it.

### 3.2 A catastrophe / surge page

*"After a wildfire, tornado or hurricane — when twenty total losses land in the
same week."* We have **zero** occurrences of catastrophe, wildfire or hurricane
across the whole site. CAT season is when independent adjusters buy tooling, and
this is the one seasonal intent we are entirely absent from.

### 3.3 Commercial / business personal property

They cover *"homes, apartments, offices, restaurants, retail and warehouses"*
and take a business asset or equipment list. We mention commercial on three
pages and "business personal property" exactly once, inside a domain rule about
not hardcoding "Coverage C". Our whole public surface reads residential +
estate. Either we serve commercial and should say so, or we do not and should
stop half-implying it.

### 3.4 A public status page

They link one from `/support`: *"Live availability for the mobile app, the web
app and the reporting pipeline."* We already have the hard part — `GET
/v1/status`, the service banner, rule 6b's tone — and no public page rendering
it. This is close to free and it is what a carrier's vendor-review asks for.

### 3.5 A support / help centre entry point

Their `/support` is search + six categories + the three errors people actually
hit + a support email. Our `/docs` is a library; there is no page that answers
"something is broken, what now". Low effort, mostly reorganising what exists.

### 3.6 Integrations / API

They list *"AWS, S3 uploads, webhooks, and API basics"* as a support category.
We have no integrations or API page at all. Lower priority — it matters for
Enterprise conversations, not for an independent adjuster.

### 3.7 Video tutorials

Ten short videos, explicitly *"short enough to send to an insured who has never
used the app and never will again."* Content production rather than
engineering, and genuinely useful for onboarding. Worth queuing, not rushing.

---

## 4. Product gaps — not pages

These are capability differences. They need an owner decision before any page
could honestly claim them.

1. **Insured self-capture.** *"Invite the insured and they can capture their own inventory from a phone, without training and without an account."* Unlimited homeowner invites, free, on every plan — it is on their pricing table as a headline. Our mobile capture is adjuster-side. This is their biggest genuine product advantage and it changes who does the work.
2. **Replace vs. clean.** Their export assigns *"replacement categories for items being replaced, cleaning categories for items being cleaned."* We have no cleaning concept anywhere — every line is a replacement. For restoration-adjacent work that is a real hole.
3. **Offline capture.** *"Works with no internet and no cell service, then syncs."* Basements and garages have no signal. We claim nothing here.
4. **Confidence on the line.** They put an AI confidence value on every row and sort the review queue by it. We carry confidence in the Photos tab but the worksheet has no confidence column — our equivalent is the binary `needs_manual`. Theirs is better at directing attention on a 400-line report.
5. **Pack-out PDF, by name.** We ingest PDFs (rule 24) but the phrase "pack-out" appears only in internal files. They say it on four pages. Pure copy fix on a term adjusters actually use.
6. **Voice-to-text notes.** *"Dictate a note instead of typing it one-handed in someone's garage."* We have per-photo notes; dictation is the OS keyboard's job, but saying so costs nothing.

---

## 5. What they do that we should NOT copy

- **"One Photo. Every Item."** Their headline industry-first: *"the first to break a single photo into every item inside it — each one its own line."* This is the direct opposite of rule 1, and our own `/guides/best-contents-software-public-adjusters` already argues against it by name: *does the tool ever report more items than you took photographs?* Do not soften that guide because a competitor leads with it — it is our sharpest differentiator and it is an argument we can win on evidence.
- **Per-claim and per-user pricing.** $49.99/claim, Flex 3-packs, $29/claim on Pro Plus, Enterprise at *"$5/user"*. That is precisely the model rule 9 scrapped. Their pricing page is also five tiers plus a feature matrix — exactly the three-tier-and-up complexity we deliberately do not have.
- **A free trial claim run by their desk.** *"Send us one claim… at no charge."* We scrapped the free-first-claim offer and `check-domain-rules.py` guards against its return. Our metered 250-item trial is the better answer and it is not a gap.

---

## 6. If I had to pick three

1. **`/total-loss-contents`** — highest intent, capability already ships, nearest thing we have is mis-framed.
2. **Decide the DFY price story** — §1. Not a page until the owner picks a direction.
3. **A public status page** — the backend signal exists; this is the cheapest credibility we are leaving on the table.

---

## 7. How the economics work — researched 27 October 2026

The owner's question: how does anyone sell 6 claims for $79.99, or 100 claims
for $199.99, if a claim can be 2,000 line items? Short answer: **nobody is
buying it at that volume yet, and the limits that make it survivable are not
published.**

### The size of the thing

| Signal | Value |
| --- | --- |
| Google Play installs | **50+** |
| App Store ratings | **2** (5.0 average) |
| iOS first release | 1.0, 27 June 2024 |
| Developer | Hogan LLC / "Hogan3, LLC" |
| Published Terms of Service | **none** — `/terms.html`, `/legal.html`, `/eula.html` all 404 |
| Published Privacy Policy | **none** — `/privacy.html` 404s |
| About / contact / careers page | **none** — all 404 |

A tier priced at 100 claims a month has not met 100 claims a month. The price
list is a hypothesis about a business that does not have the volume to test it
yet, which is why it does not have to survive contact with the unit economics.
Ours had to: rule 9 sizes the 2,000-item allowance against a real $0.08 an item.

**They also have no Terms and no Privacy Policy at all.** For a product holding
claim photographs and insured PII, that is the kind of thing a carrier or TPA
procurement review stops at. We publish both at `/legal`.

### The limits exist, they are just not on the pricing page

App Store version history, **1.2.4 (24 August 2025): "Added an Enterprise Plan
with higher usage limits."** So usage limits are real and tiered — they are
simply absent from `/pricing`, which advertises claim counts and says nothing
about items. "6 claims" with no item ceiling is not a commitment anyone can
cost; "6 claims, fair use" is. The second is what they are almost certainly
running.

### Where their marginal cost is genuinely lower than ours

Two architectural differences, both real:

1. **One photo, many lines.** Their "automatic item splitting" shipped in
   **2.0.20 on 19 October 2026** — eight days before this audit. One wide shot
   is detected into N objects and each crop is identified. One field photograph
   amortises across N lines; our rule-1 model is one set of photographs per
   line. Their cost per line of *capture and vision* is structurally below ours.
2. **Pricing lookups are the real bill, for both of us.** Ours is ~$0.08 an
   item, dominated by live retail comp research (two vendor searches per priced
   item, rule 24). That cost does not fall just because the items came out of
   one photograph — unless the prices come from a cached catalogue rather than a
   live search per item. Nothing on their site says either way, and a cached
   catalogue would explain the gap better than anything else visible.

So: part architecture, mostly no volume. If they ever run a 100-claim month at
$199.99 with live per-item pricing, it costs them multiples of the revenue.

### The 10¢ desk, as arithmetic

You are right that you would not review 400 lines for $90, and the numbers say
so plainly. 400 lines is **$40 of labour revenue**.

| Pace | Hours | Effective hourly |
| --- | --- | --- |
| 15 sec/line | 1.7 | $24 |
| 30 sec/line | 3.3 | $12 |
| 1 min/line | 6.7 | **$6** |

Their page claims each line gets: image checked against the description,
replacement make/model/size confirmed **with a working link**, and ACV/RCV,
age, condition, quantities and rounding re-verified. That is not a 15-second
task. At the one-minute pace it is honest work at $6 an hour — which only
closes offshore, and only barely.

Three readings, and they are not exclusive: the desk is offshore; the "review"
is in practice an exceptions pass dressed as a full pass; or it is a
loss-leading acquisition offer — note the free trial claim is pushed on **every
page**, and the desk is the hook on all of them.

**What this means for rule 9d:** nothing. Their 10¢ is not a cost structure we
failed to find; it is a price set by a company with 50 installs, for reviewing
a draft their own software already built, with no field capture in it at all.
Our $5.00 buys a line built from scratch and, when we shoot it, someone driving
to the loss. The comparison is still going to be made by a buyer looking at two
tabs — §1 stands — but it is a **messaging** problem, not a pricing one.

### Still unverified

LinkedIn lists a **Dan Hogan** as President of iContentsPro.com, and NAPIA
lists a **Daniel Hogan** as a Houston public adjuster of ~18 years. Plausibly
the same person — an adjuster who built his own tool, same shape as Kevin — but
**nothing published connects them**, so it is not a fact to repeat.

---

## 8. Corrections to §4, after review (27 October 2026)

Three of my "product gaps" were wrong or overstated. Recorded so the list is
not acted on as written.

- **Confidence scores — WE HAVE THIS.** `ItemDrawer.tsx:708` renders a per-item
  confidence on the item panel. The real, narrower gap: it is **not a worksheet
  column**, so you cannot sort or triage a 400-line grid by it. Their advantage
  is the queue ordering, not the score.
- **Offline — half right.** We deliberately do not queue offline;
  `CapturePage.tsx` says so and explains why no banner claims it ("a phone that
  says 'queued locally' over a photo held only in a tab that is about to be
  evicted costs someone a second trip"). But the **workflow survives offline
  anyway**, because capture uses the phone's own camera app, so photos land in
  the camera roll with EXIF intact and upload when signal returns. What we
  genuinely lack is a **native app** — theirs has been on iOS and Android since
  June 2024.
- **Replace vs. clean — dropped, owner, 2026-10-27.** Not a gap. Adjusters do
  not photograph contents for cleaning on a platform that exists to price
  replacement, and supporting it would mean building a cleaning price list
  across hundreds of item types. That is restoration software's job.
