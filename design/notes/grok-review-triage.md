# Grok review of kevin.co — triage

2026-10-26. Checked against the live site (www.kevin.co, rendered in a browser and read as `innerText`) and against the repo (`src/`, `design/CLAUDE.md`). This is an outside opinion, so nothing in it is an instruction.

**Verdict:** About half the review is stale or wrong, because Grok read an older or partial crawl. The named testimonials on `/pricing` were flagged as possible placeholders, but the owner confirmed on 2026-10-26 that they are real customers who consented. The homeowner→PA funnel is the most dangerous idea in the review, and disclosure doesn't fix it. The best idea in it is cheap: a few keyword pages the site doesn't have yet, and a sharper message against SightSync on price.

---

## Fact-check

| Claim | Status | What's actually there |
|---|---|---|
| Hook "Photos in. XactContents-ready inventory out." | **Confirmed** | Homepage H1. |
| "310+ claims since 2025 across 12 carriers" | **Stale (moved)** | No longer on the homepage. It now appears only on `/about` (timeline, 2025: "310+ claims processed across 12 carriers"). The full figure is still in the source at `src/pages/LandingPage.tsx:476`, but only the archived `/landing-full` renders it, and that page is `noindex`. |
| "256 photos in ~29 min vs 13.3 hrs" | **Partly confirmed, partly wrong** | `/pricing` renders "~29 min · machine time, unattended — vs. 13.3 hours typing at 4 min a row". It's not on the homepage, and the "256 photos" figure doesn't appear on any page I rendered. The homepage ROI calculator uses **4.5 hours saved per claim**, which is a different basis from 13.3 hours. The two numbers coexist and nothing on the site says which one to trust. |
| Merchant proof link on every price | **Confirmed** | "Source link on every priced line" (homepage, Export step). |
| 250 free items, no deadline; no-account single-photo demo | **Confirmed** | Homepage "Try it on one photo… no account" plus "Your first 250 line items are free with no clock running". |
| $249/mo with 2,000 items, no per-claim or per-seat fees | **Confirmed, but incomplete** | Grok left out the credits: $0.75 an item past 2,000. Estates are $249 each (rule 9), and done-for-you starts at $750 (rule 9d). |
| ROI calculator on the homepage; .xlsx and room-by-room PDF exports | **Confirmed** | Both are on the homepage. |
| "No case study, testimonial, or logo from a named customer" | **Wrong, with a sharper real problem** | `/pricing` renders three named quotes (James Cunningham, "Principal · Loss Consulting"; A. Mendez; Tricia O'Connell) under a "Settled with" carrier roster. There is also a case study at `/case-studies/4000-contents-line-items-30-days`. **The case study is the founder's own month of work, and the page says so honestly.** The quotes came over from the design prototype (`git log -S` traces them to the initial handoff commit), and `INTERACTIONS.md` calls the estate-page quotes "PLACEHOLDER personas". **Resolved 2026-10-26: the owner confirmed all three are real customers who consented. Leave them up.** |
| "No content or SEO pages" | **Wrong (stale)** | The sitemap lists 94 URLs, and 34 of them are SEO pages: `/guides/*` (fire total loss, RCV vs ACV, depreciation, LKQ, QA checklist…), `/compare/kevin-vs-xactcontents`, `/compare/kevin-vs-contents-team`, `/xactcontents-alternative`, `/contents-software-roi`, and `/public-adjusters/ai-contents-inventory-software`. The footer links to about 25 of them. Example: the fire guide runs about 1,000 words, with its own title and JSON-LD. |
| Title tags (Grok couldn't check them) | **Checked: mostly good, but the homepage is weak** | Guide pages use keyword titles ("Building a Contents Inventory After a House Fire \| Kevin"). The **homepage title is "Kevin — Photos in. Inventory out."**, which has no "contents inventory" or "Xactimate" in it. That's the single page carrying the brand query, and Grok's point that "kevin.co isn't descriptive" lands right here. Other gaps: `/pricing`, `/product` and `/about` use bare "X — Kevin" titles. |
| Schema (Grok couldn't check it) | **Checked: present and sound** | `/` has Organization (legalName, Smithtown address) + WebSite + SoftwareApplication with `Offer` Pro $249.00. `/pricing` has FAQPage. Guides carry an `@graph`. There's no Review or AggregateRating markup, which is right: three quotes aren't a rating, and Google ignores review markup a business publishes about itself. |
| No blog | **Technically true, but beside the point** | `/guides` does the job of a blog. A dated blog isn't needed. |
| "Same Smithtown address as the PA firm" | **Unverified** | Kevin's published address is "Kevin.co, LLC · 34 E. Main St. Ste 347, Smithtown, NY 11787" (footer, Terms, Privacy, Organization schema). Web search didn't surface the PA firm's address, and nothing in the repo names the firm. **Only the owner can confirm this.** If it's true, a carrier-side IA doing light diligence will find it in five minutes, because the address is in the schema. |
| "8+ funded competitors" | **Unverified** | Several of the named rivals look small or pre-launch (see Competitors). "Funded" is asserted without evidence. |

## Rule conflicts

The locked rules in `CLAUDE.md` are final. Each item below breaks one, so it is **rejected** and kept out of Ranked actions. Where a compliant version exists, it is listed separately and labelled as ours, not Grok's.

### Rejected: breaks a locked rule

| Grok's recommendation | Rule broken | Status |
|---|---|---|
| "Add a per-claim done-for-you tier" | **9d** (DFY is priced progressively per completed line, with a $750 minimum) and **9** (no per-claim pricing) | Rejected |
| "Offer a free contents list on their next fire claim" (done for them, free) | **9d** (the $750 minimum applies to every DFY engagement) | Rejected |
| "PA firms → paid seats"; "team accounts" sold per seat | **9** (never per-seat; no seat grids) | Rejected |
| "Affiliate or reseller program for licensed PAs", with commissions per seat or per claim | **9** (no per-seat or per-claim pricing language) | Rejected |

### Rejected: positioning (no locked rule applies)

These don't break a rule in `CLAUDE.md`. I reject them on my own judgment, and the owner can overrule.

| Grok's recommendation | Why |
|---|---|
| "Free homeowner page → hands off to Long Island Public Adjusters, both disclosed" | It turns Kevin into a policyholder-side lead source, which undercuts the neutral-tool pitch to carrier-side IAs. See below. |
| Attorneys / restoration firms "referring building claims to the PA firm" | It has the same problem: Kevin's partners become feeders for one PA firm. |
| "Court-defensible schedules of loss" | It's a legal promise Kevin can't keep, and the About page already says Kevin isn't an appraisal. |

### Compliant versions (ours, not Grok's)

| Grok's idea | Compliant version | Rule it stays inside |
|---|---|---|
| Free contents list for PA firms | The prospect runs their next claim on the **250 free items** (a 60-photo claim is about 57 items) and gets the 30-minute walkthrough already offered on the homepage. A firm that wants it done for them buys DFY at the 9d price. | 9b, 9d |
| Paid seats / team accounts | A single adjuster stays on **Pro**. A firm with several adjusters buys **Enterprise** (volume licensing, one invoice). Track the funnel as "PA firms → Pro or Enterprise accounts". | 9 |
| Done-for-you for PA firms | Make the existing `/done-for-you` page easier to find from `/pricing` and the PA landing page. | 9d |
| Attorney and restoration segments | Sell them as customers, with no referral leg and no "court-defensible" wording. | — |
| Storm campaigns | Aim them at CAT and independent adjusters, never at homeowners in a disaster zone (several states restrict PA solicitation after a disaster, e.g. FL's 72-hour rule). | — |

**Is disclosure enough for the homeowner→PA funnel? No.** Disclosure answers the homeowner's question ("is this neutral?") and leaves the carrier's untouched. Kevin's credibility with IAs and desk adjusters rests on the RCV being a neutral, sourced number. Once Kevin is visibly an intake channel for a PA firm, every price it produces is open to a "PA-built inventory" challenge. That holds even though the engine has no idea who the claimant is. The founder can't un-disclose it later, either. If the owner wants homeowner volume, do it as a **separate brand on a separate domain**, with Kevin as the software vendor at most, and keep it off kevin.co entirely. My recommendation is not to do it in the first year.

## Competitors

Checked where cheap (vendor pages and search, 2026-10-26).

| Name | Grok said | What I found | Missed by Grok |
|---|---|---|---|
| **SightSync** | AI SaaS, 5 free photos, PAs, Xactimate + Symbility, closest rival | **Confirmed**, plus pricing: **$200 per claim** pay-as-you-go, **Professional $1,360/mo for 10 claims**, Business $3,315/mo for 30 claims, Enterprise custom. It also offers white-label and reseller deals for TPAs. Exports CSV, XLSX and PDF. | **The price gap is huge**: one 60-photo claim on SightSync costs $200, while Kevin Pro is $249/mo for about 35 claims' worth of items. Grok never said this, and it's Kevin's strongest single comparison. SightSync's **Symbility** export is a real gap for Kevin. |
| **Adjust Square** | AI + optional per-line human review | **Confirmed.** ContentsCapture / Vision / Estimation, plus a "Full-Service" human review at an extra per-line-item cost. No public pricing ("early access"). | Their per-line human review is a direct analogue of Kevin DFY. |
| **ContentsCounter** | AI SaaS, works offline, live vendor pricing | **Can't verify.** The site is just a name and a tagline. | Likely pre-launch. Don't let it drive decisions. |
| **ScanNest / Value Recovery** | AI + human, 48-hr turnaround, attorneys/homeowners, "court-defensible" | **No trace found.** It may be a hallucinated or garbled name. | Treat it as unverified. |
| **Brightside TLI** | Done-for-you, nationwide | **No pricing found.** It's a services shop. | No change. |
| **Encircle** | Restoration field software with pack-out | **Confirmed.** It added Encircle AI single-photo identification and QR pack/track in an August 2026 refresh. No public pricing. | Encircle is now doing AI identification too. It sells to restorers, though, not adjusters. |
| **Enservio / Hancock** | On-site specialists for carriers | Confirmed as services, sold carrier-side. | These are what DFY competes with on price, not what Kevin Pro competes with. |
| **XactContents / ContentsTrack (Verisk)** | Software + XactAI | ContentsTrack costs **$45 a job + $300 setup** (50-pack $1,800). | Verisk's per-job pricing is a useful public anchor. |
| *(missed)* **Adjusto** | — | AI-native contents claims services launched August 2026, with video inventory and "FairMatch" valuation, sold through Snapsheet. | A new entrant on the services side, and another rival for DFY. |
| *(missed)* **iCat Fast CATALOG** | — | **Free** subscription for public and independent adjusters (normally $500 signup + $250/mo), including free AI audio inventory. | A free incumbent aimed at Kevin's exact buyer. Worth a `/compare` page. |
| *(missed)* **ProofList** | — | Aimed at PAs **and estate attorneys, executors, and trust administrators**. | Overlaps Kevin's estate segment. Grok's "nobody serves attorneys" gap is less open than it claims. |
| *(missed)* **Contents.team** | — | Kevin already has `/compare/kevin-vs-contents-team`. | — |

## Ranked actions

Impact ÷ effort, highest first. **Type**: S = site change, M = sales motion, P = product change.

| # | Action | Type | Impact | Effort | Notes |
|---|---|---|---|---|---|
| ~~0~~ | ~~Verify or pull the three named testimonials on `/pricing`~~ | — | — | — | **Closed 2026-10-26: the owner confirmed all three are real customers who consented. They stay up.** |
| 1 | **Fix the homepage `<title>`**, e.g. "Contents Inventory Software for Adjusters \| Kevin", plus keyword titles on `/pricing`, `/product` and `/about` | S | High | Tiny | It's the one place "kevin.co isn't descriptive" really bites. Edit `src/content/seo-pages.ts`. |
| 2 | **Add `/compare/kevin-vs-sightsync`** and a price-per-claim line on `/pricing` ("one claim elsewhere costs $200; Pro covers ~35") | S | High | Small | It's the clearest win Grok missed. Keep it factual and dated, with a source link to their pricing page. Add an iCat compare page after that. |
| 3 | **Fill the two named keyword gaps**: "XactContents import template" (explain the .xlsx, what it carries, no formulas) and "personal property inventory spreadsheet" (a free template download as the email capture) | S | Medium-high | Small | These are the only Grok SEO ideas not already built. **The import-template page is built (2026-10-26) at `/guides/xactcontents-import-template`, not yet deployed.** The spreadsheet download is still open. The template doubles as a lead magnet. Make sure it holds static values (rule 2b). |
| 4 | **Turn 3–5 real customer claims into case studies** (the compliant version of Grok's "free contents list" idea) | M → S | High | Medium | The adjuster runs a real claim on the 250 free items, with the 30-minute walkthrough, and agrees to a named, quotable result. No free DFY run (9d) and no free month (9b). Target any adjuster, not only Long Island PAs. |
| 5 | **NAPIA / state PA associations, Facebook groups, conferences** | M | Medium-high | Medium | It's where Kevin's actual buyer gathers. Sponsor or demo; don't advertise to homeowners. NAPIA is policyholder-side, so weigh how it reads to carrier-side IAs. Run IA associations (e.g. NAIIA) in parallel. |
| 6 | **Storm-triggered campaigns** (FL, CA, TX, LA), **aimed at CAT and independent adjusters** | M | Medium (spiky) | Medium | It's a natural fit, since CAT deployments produce contents volume. Aim at adjusters, never homeowners in a disaster zone. |
| 7 | **Restoration-firm angle** (pack-out → priced Xactimate list) | M (+S later) | Medium | Medium | Encircle and ContentsTrack already own pack-out, so pitch Kevin as the pricing layer *after* pack-out. Drop the "refer building claims to the PA firm" leg. |
| 8 | **Attorney angle** | M | Low-medium | Medium | It's real but niche, and ProofList is there already. Never say "court-defensible". Revisit after case studies exist. |
| 9 | **Symbility export** | P | Medium | High (backend) | SightSync has it. It opens carriers that run on Symbility/Cotality. Add it to the backend backlog; don't promise it on the site. |
| 10 | **Xactimate partner listing** | M | Uncertain | Medium | Worth asking Verisk what this involves. Watch rule 3: a listing must never read as an endorsement. |