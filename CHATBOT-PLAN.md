# Chatbot — design + build (2026-11-20)

**The ask:** kevin.co gets a chatbot. Settled with the owner the same day: it is
**two bots**, not one, both running through the FastAPI backend with separate
settings, so a visitor can never reach claim data.

**Status:** the frontend half of the guardrails is **BUILT** (three files, one
eval set, 58 cases green). The bots themselves are **blocked on two backend
routes** — see §7 and BACKEND-ASKS 41. No chat UI is built yet, deliberately
(§8).

---

## 1. The two bots (owner's decisions, 2026-11-20)

|                        | **Website bot** (kevin.co visitors)                                     | **Adjuster bot** (signed in, inside a claim)                                                        |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Who can use it**     | Anyone, no sign-in                                                      | Only signed-in users, and only on their own claims                                                  |
| **What it knows**      | Public site content: product, pricing plans, guides, how pricing works  | Everything above, plus the open claim's lines, comps, source links, depreciation and totals         |
| **What it can do**     | Answer questions; point people to sign-up or booking a call             | Answer "why is 0070 $388.75?" or "which lines still need a price?". **Read-only at first**          |
| **Abuse protection**   | The same human check the home-page demo uses, plus a burst guard — **no question cap** (§5) | The same: no cap, no per-account quota                                               |
| **Cost**               | A small, cheap Claude model                                             | A stronger Claude model, more cost per question                                                     |

Rules both bots follow, also the owner's:

- **No invented prices or explanations.** The adjuster bot only quotes what is
  on the claim. The website bot never quotes a price for an item.
- **Neutral wording.** No "we'll get you more money" — Kevin is a neutral party
  (and the inventory is not an appraisal, rule 17).
- **Changes only with your OK.** If the adjuster bot ever gets the ability to
  edit lines, nothing changes without the adjuster confirming, the same as the
  rule for active lists.

**This is not rule 5.** Rule 5 scrapped internal chat, @mentions and a
shared-notes thread — adjuster-to-adjuster collaboration, deemed
over-engineering. An assistant that answers questions about the claim in front
of you is a different thing, and the guard in §3 actively blocks a bot that
*offers* the scrapped features ("@mention them in the thread" is a RED eval
case). The audit log remains the only record of who changed what.

---

## 2. What it answers from — the docs AND the marketing pages

**563 passages: 174 from the 45 docs articles, 389 from 56 public pages.**
Owner's question, 2026-11-20 — does the website bot see all the marketing
pages? It does now; it did not in the first cut, which was docs-only.

The two halves arrive differently, and neither is retyped:

```
design/components/docs-articles{,-2,-3}.jsx   45 articles, authored AS DATA
  └ node build-docs-exports.cjs  (from design/)
      ├ Kevin-docs.md, gitbook/              ← generated, never hand-edited
      └ src/content/docs-content.generated.ts
                                                  ┐
src/pages/*.tsx                 the marketing copy, as JSX — there is no CMS    │
  └ npm run build                                                               ├→ npm run build:bot-corpus
      └ scripts/prerender-html.mjs → dist/<route>/index.html                    │     └ public/bot-corpus.json
         (already written for crawlers that do not run JavaScript)          ┘        └ the backend's /v1/bot routes
```

The docs were authored as block tuples precisely so they lift into another
system untouched (CLAUDE.md, "Backend / CMS"), and a retrieval corpus is that
lift. The marketing copy has no such luxury: it lives inside JSX, which is why
a CMS is still listed as unbuilt work. **Retyping 60 pages of copy into a
second file is the drift this repo has already been bitten by** — `gitbook/`
said 120-character notes for a year after rule 23 said 300. So the corpus
harvests what the site actually *ships*: the static HTML `prerender-html.mjs`
writes for crawlers. The bot reads the same bytes a crawler reads, and it
cannot drift from the page, because it **is** the page.

Mechanics worth knowing:

- **One passage per `h2`.** Docs passages carry a real `#anchor`; page passages
  link to the route, because those h2s have no ids and a link that scrolls
  nowhere is worse than a link to the page.
- **Chrome is stripped** — `nav`, `header`, `footer`, `script`, `style`, `svg`.
  Left in, one 4.5 KB footer would sit in all 56 pages and "Careers" would
  retrieve the whole site.
- **Near-duplicates are dropped** (5 of them). Marketing sections are
  components: the testimonial block renders on `/`, `/pricing` and
  `/for-adjusters`. Two copies of a claim split the keyword score between them,
  so a question that should surface it can surface neither. Docs win over
  pages, then the longest text wins — keeping the *first* would have dropped
  the 500-items guide's extra sentence, "the size of the shoot is not the size
  of the bill".
- **Excluded on purpose:** the auth pages (forms, not knowledge), `/status`
  (live state, minutes stale in a corpus, and the service banner owns that
  answer), `/sample` and `/claims/sample` (the demo claim — the website bot
  must never quote a price for an item, so it does not get a priced inventory
  to quote), `/landing-full` (a near-duplicate of `/`), and `/docs` plus
  `/docs/*` (they come from the article data, with better anchors).
- **A missing prerender fails the build.** `prerender-html.mjs` skips a route
  that throws rather than failing the deploy — the right call for a deploy, but
  it would silently shrink the corpus, so the corpus build names the route and
  stops.

Retrieval is deterministic keyword scoring in `src/lib/bot-corpus-rules.ts` —
no embeddings, no vector store, no index to rebuild. 563 passages is small
enough that scoring reads better than it vectorises, and the result is
reproducible, so the eval set can assert *which* passage a question retrieves.
If recall turns out to be the weak link, that module is the one to replace, and
the eval set is what proves the replacement is better.

**An off-topic question retrieves nothing**, by design (`minScore`). A confident
answer assembled from the three least-irrelevant paragraphs in the docs is the
failure mode that matters; an honest dead end is not.

---

## 3. ⛔ Keeping the bots inside the domain rules

`check-domain-rules.py` greps shipping **files**. It cannot see model output —
and a chatbot gets asked precisely the questions where the scrapped copy lives.
"What happens past 2,000 items" is the question that put the withdrawn $0.20 on
nine surfaces; a bot is one more surface, and the only one that writes itself.

Four layers, in the order they take effect. The first two are the real ones.

**1. The corpus cannot contain the scrapped claims.** A model cannot state what
it was never given. `npm run build:bot-corpus` runs every passage — docs and
marketing page alike — through the guard and **fails the build** on a hit, so
copy that drifts cannot reach the bot.

What it found on the first full run over 56 pages, all four judged by hand:

| | verdict |
|---|---|
| carriers guide: "Kevin **does not** submit into carrier systems" | **my bug.** The rule-4 pattern allowed filler words between "Kevin" and the verb, so the match swallowed the "not" and no window could see it. Fixed: the filler may not be a negation. |
| Contents Team comparison: "…charges **per seat**; Kevin has no seats at all" | **my bug.** Correct copy about a competitor. My clause-boundary refinement cut at the semicolon and threw away the half that made it correct. Fixed: punctuation ends a clause looking *back*, not looking *forward*, where it usually introduces the contrast that does the denying. |
| PA software guide: "Per-claim and per-seat pricing **punishes** a busy month" | **correct copy, and no window can see it** — the negation is the verb. Entered in the reviewed list with that reason. |
| **Enservio comparison: "A live listing answers…"** | **a real rule-10 breach, on a live page. FIXED 2026-11-21** — see below. |

Two false positives out of 56 pages, both fixed in the guard rather than waved
through; one judged; **one real find, since fixed, and a second one found while
fixing it** (the method wording in the design prototype — also below, and still
open). The reviewed list (`CORPUS_REVIEWED` in the build script) is keyed by
page and rule, carries the reason in prose, prints on every run, and reports
its own stale entries — a suppression nobody can see is how the dead $0.20
lived on nine surfaces. It currently holds exactly one entry.

> ### ✅ FIXED 2026-11-21 — "a live listing" on /compare/kevin-vs-enservio
>
> Rule 10 says **"a listing", never "a live listing"** — links go stale over
> months and the claim is about what the price *is*, not the URL's future.
> `src/pages/CompareEnservioPage.tsx` said it twice: line 170 in visible prose,
> and **line 57 in the FAQ data, which also renders into FAQ JSON-LD that
> nobody reads on screen** — the same invisible channel that hid the
> free-first-claim offer and the $0.20.
>
> Both now read "A retail listing", which is the page's own wording three
> entries above ("Kevin prices against current retail listings"). Verified at
> the rendered layer rather than by grep: the prerendered page has **0**
> occurrences of "live listing" and 10 of "retail listing", in the prose, the
> table, the `<meta>` description and the JSON-LD.
>
> **The hole it came through is closed too.** `check-domain-rules.py` had no
> pattern for the phrasing, which is why it shipped; it has one now (rule 10,
> `prose`-scoped so a code comment explaining the rule does not flag itself).
> "live comps" is deliberately NOT banned — that is approved copy on a dozen
> surfaces. It is the *listing* that may not be called live, because that is
> the thing a Source Link points at.
>
> Adding the pattern immediately caught one more line, and it was a false
> positive worth the trip: `ComparableGuidePage.tsx:129` says *Kevin prices
> from a listing, not from "a live listing"* — the rule, explained to the
> reader — and JSX had wrapped the sentence so the "not from" sat on the
> previous line, out of the window's reach. The python guard already handled
> that for wrapped *comments*; the fix generalises it to any wrapped line (if
> the match sits so near the line start that the before-window is truncated,
> borrow the previous line's tail). Unit-checked three ways, including that the
> guard's own documented catch — a distant `don't` on one long line — still
> flags.

> ### ✅ FIXED 2026-11-21 — the selection method was printed across the design prototype
>
> Rule 10, amended 2026-10-04: the method is **internal only**, on no
> customer-facing surface — "not the marketing pages, not the docs, and not the
> signed-in product". The deployed app was clean (the only mentions in `src/`
> are code comments, which the rule expressly permits). The design prototype
> was not: **13 strings across 6 files**, found when the first fix's new guard
> pattern sent me looking.
>
> | file | was | now |
> |---|---|---|
> | `worksheet.jsx` ×2 | `Live comps · median sets RCV` | `Live comps · cited listing marked` |
> | `worksheet.jsx` | `Kevin's pick · median` | `Kevin's pick` |
> | `landing.jsx` | "the median sets RCV" | "the unit cost is the price of a single listing, and the Source Link points at it" |
> | `landing.jsx` | `Live comps · median sets RCV` | `Live comps · cited listing marked` |
> | `landing.jsx` | "the median sets the price" | "the price of a single listing rather than a blend of several" |
> | `marketing-pages.jsx` | "the median becoming the replacement cost" | "the replacement cost taken from a single listing rather than a blend of several" |
> | `marketing-pages.jsx` | `Top 3 · RCV is the median` | `Top 3 · cited listing marked` |
> | `pdf-inventory.jsx` | "three live retailer comps (median shown)" | "…and is the price of a single listing" |
> | `settings-pricing.jsx` | "RCV = median of the live merchant comps" | "RCV is the price of a single merchant listing rather than a blend of several" |
> | `settings-pricing.jsx` | "the priority chain sets which comp leads" | *removed* — rule 10 scrapped per-retailer priority too |
> | `settings-pricing.jsx` | "to settle the median" | "to settle it" |
> | `utility-pages.jsx` | "takes the median as RCV" | "prices it from a single listing, with a dated link to it" |
>
> The replacements are not invented: they are the wording the shipping
> `ItemDrawer` already uses — *"Unit cost is the price of a single listing — the
> one marked above — and the Source Link points at it"* — which is rule 10's
> sanctioned property statement. Marking **which** listing is sanctioned ("the
> drawer names the marked listing instead"), so the comp badge keeps its mark
> and loses only the recipe.
>
> **Two things were deliberately left alone.** The estate chip still reads
> `Live comps · haircut sets FMV`: the category reduction is public, stated in
> the `fair-market-value` docs article ("a category-specific reduction brings
> that to what the item fetches resold"), and rule 8b describes it as the
> confirmed contract — it is a valuation basis, not the listing-selection
> method. And the mock engine in `data.jsx` / `worksheet.jsx` still computes a
> median in code, with comments saying so, which is exactly what rule 10
> permits.
>
> Why this mattered more than the Enservio line: the **porting rule** says to
> lift markup and copy from those files *verbatim*, so each of those 13 strings
> was a standing instruction to put the method back into the shipping UI.
>
> `check-domain-rules.py` missed all 13 because every rule-10 pattern looked
> for the median **of** the comps, so the verb forms walked through. It now
> catches `median sets / becomes / becoming / became / shown`, `takes the
> median`, `settle the median`, `RCV is the median` and `pick · median`.
> Positive-controlled against all 13 removed strings (all caught) and against
> the mock engine's own code and the admin console's ops metrics — `const
> median = …`, `median.price`, "Median resolution", "Median first reply",
> "Above Pro median" — none of which flag. A guard that reports clean because
> its pattern is dead is worse than no guard.

(One more false positive, caught before the pages were ever added: a *per-class*
depreciation ceiling is sanctioned wherever the schedule sets `max_pct`, and the
custom-schedules docs article says so. The rule-13 pattern had to be narrowed to
a *global* floor claim.)

**2. The system prompt — which never names what it is hiding.** The comp vendor
and the listing-selection method are internal only (rule 10, amended
2026-10-04). So the prompt may **not** say "do not mention <vendor>": that
sentence *is* the leak, one jailbreak away from being read back. The prompt
states only what is publishable — the Kevin Content Pricing Engine, that the
unit cost is the price of a single listing rather than a blend of several, and
that the **Source Link** is the whole answer to "where did this number come
from". The forbidden strings live in a checker the model never sees.

**3. `src/lib/bot-guard-rules.ts` — the check on the way out.** A system prompt
is a request; this is a check. It runs on every answer before it is shown, and
returns findings naming the CLAUDE.md rule broken: the vendor, the selection
method, "live listing", $0.20 and post-pay overage, per-seat and per-claim,
three tiers, a timed or renewing trial, quota coming back on delete, SOC 2,
Xactimate XML, carrier push, sold comps, a 90% depreciation cap, an export gate,
unlimited storage, @mentions, "Dep.", more items than one per photo, outcome
promises, "appraisal". It carries the python guard's negation window, because an
answer that says "there is no post-pay overage" is **correct** and a guard that
blocks the correct answer gets switched off. (One improvement over the python
one: the window stops at a clause boundary. "There is a per-claim fee if you
would rather not subscribe" put a *not* 25 characters downstream and read as a
denial.)

Plus one invariant that is not a string match:

> **A dollar figure in an answer must either be a published price
> (`APPROVED_MONEY` — $249, $0.75, $750, the DFY bands, $19, $0.00) or appear
> verbatim in the context the model was given.** Anything else was invented.

That is the owner's "no invented prices" rule, mechanised. It lets the adjuster
bot quote `$388.75` off the claim all day and stops the website bot pricing a
mixer it has never seen. Percentages are deliberately **not** checked: "100% of"
is ordinary English and the false-positive rate would be the kind that gets a
guard turned off.

**4. The block message, which never quotes the finding.** The findings name the
internal facts; a block message quoting itself would publish what the guard
exists to withhold. The finding goes to the operator log, the visitor gets a
dead end that still helps (`BLOCKED_ANSWER`).

**The voice rules apply to the bot, not to the copy.** `checkCorpus` skips two
of the rules `checkAnswer` enforces — no outcome promises, and the website bot
never prices an item. A marketing page is allowed to be persuasive and a docs
article is allowed to quote an example price; the bot is held to the owner's
narrower line. Checking the voice rules against the pages would flag the
copywriter for doing their job, and a guard that cries wolf on shipped copy
gets switched off.

### The eval set

`npm run test:bot` — 62 cases, all green:

- **30 RED cases**, at least one per rule a generative answer can break, each written the
  way a model would volunteer it ("Kevin pulls comparable offers from \<vendor\>",
  "the free trial lasts 14 days", "you must price every row before you can
  export"). Each must be caught, and caught *as that rule*.
- **18 CLEAN cases** — the same questions answered correctly, which must all
  pass. This is the half that keeps the other half alive.
- **The docs corpus**, every passage, against every rule. (The harvested pages
  are gated by `build:bot-corpus`, which needs a site build; this suite runs
  without one.)
- **The artifact** — that it holds every docs passage, that the pricing,
  done-for-you, comparison, security and product pages are all in it, that the
  excluded routes are not, that no passage carries page chrome, markup, an
  undecoded entity or a duplicate.
- **Retrieval**, asserting the article a real question reaches, that a prospect
  question ("how does Kevin compare to XactContents?") reaches a comparison
  page rather than only the docs, and that an off-topic question **and a
  prompt-injection attempt** reach nothing at all.

When a rule changes in CLAUDE.md: add the case here first, watch it fail, then
change the pattern.

`bot-guard-rules.ts` is in `check-domain-rules.py`'s `SKIP_BASENAMES` — every
line of it is a banned string by construction, exactly why that script already
skips itself. Its eval set is what keeps it honest.

---

## 4. Models and what they cost

Prices are per million tokens, Anthropic first-party, cache reads ~0.1× input.

| | **Website bot** | **Adjuster bot** |
|---|---|---|
| Model | **Claude Haiku 5.5** (`claude-haiku-5-5`) | **Claude Sonnet 5.5** (`claude-sonnet-5-5`) |
| Price in / out | $0.10 / $0.50 | $2.00 / $10.00 |
| Effort | `low` (chat; thinking is on by default at `medium`) | `low`–`medium`, tuned on the eval set |
| Typical question | ~7k in (prompt + 4 passages) + ~400 out | ~12k in (prompt + passages + claim rows) + ~600 out |
| **Cost a question** | **≈ $0.001** | **≈ $0.03** |

So 1,000 visitor questions a day is about **$1/day** — against the photo demo's
$0.03 a drop, the website bot is nearly free per question, and the exposure is
volume, not unit cost. Three things keep the bill shaped:

- **Prompt caching on the system prompt + corpus prefix.** Stable content
  first, the visitor's question last, so every request after the first reads the
  prefix from cache. Verify with `usage.cache_read_input_tokens`; if it is zero
  across repeated questions something volatile (a timestamp, a session id) has
  been written into the prefix.
- **Canned answers cost nothing.** The home-page demo answers its presets from
  cache at zero cost; the bot should do the same for the handful of questions
  that are 80% of traffic (what does it cost, what does it export, is there a
  trial) — a stored answer, guard-checked once, no model call.
- **Streaming**, so a visitor sees the first sentence rather than a spinner.

**Not Opus 5.5** ($4/$20) on either: the work is answering from four retrieved
paragraphs, which is the task Haiku is for. If the adjuster bot's eval score
says Sonnet is not enough on "why is this line unpriced", Opus 5.5 is the
upgrade and it is a one-line change — but the owner's call, not a default.

Model notes worth knowing before writing the backend: thinking cannot be
disabled on either model (`budget_tokens` is a 400 — use `effort`), assistant
prefill is a 400, and **Haiku 5.5 has no server-side refusal fallback**, so the
route handles `stop_reason: "refusal"` itself and falls back to
`BLOCKED_ANSWER`. Mid-conversation `role: "system"` messages are supported on
both and are the injection-safe channel for a per-turn reminder.

---

## 5. Abuse protection — and why there is NO question cap

**Owner's decision, 2026-11-20: no cap, on either bot.** *"Why penalize a
user/potential user because other users are asking questions."*

A global daily ceiling spends one visitor's goodwill on another visitor's
traffic — the person who finally reads the pricing page properly at 4pm pays for
someone else's morning. And a per-visitor quota tells the most engaged prospect
on the site to come back tomorrow, which is the opposite of what the bot is for.

It is also the house pattern, not an exception to it. Rule 19: going over the
storage pool "triggers an **email first, never a mid-claim lockout**." Rule 9c:
overflow is never silent. **A limit is the owner's to see, not the user's to
hit.**

So what stands between the route and a runaway bill is not a quota:

- **Cloudflare Turnstile, fail-closed** — the owner's own choice from the first
  message, and the only one of these an abuser actually has to beat. No secret,
  no bot (DROP-DEMO-PLAN D3). `TURNSTILE_SITE_KEY` and the widget already exist
  in `src/components/PhotoDropDemo.tsx`; tokens are single-use and Cloudflare
  caches a solve per widget, so a retry needs a genuinely NEW widget (that file
  carries the scar tissue in comments — read it before writing the panel).
- **A burst guard, not a quota.** One question in flight per session, and a
  second or two between turns. It costs a human nothing — nobody types faster
  than that — and it takes a scripted loop from thousands an hour to dozens.
  Nobody is ever told they are out of questions.
- **A spend alert the OWNER sees**, on the admin console's System screen (page
  72) and by email, with a kill switch beside it. The ceiling still exists; it
  stops the owner's day instead of a visitor's.
- **Canned answers for the top questions**, served from cache at zero model
  cost — the demo's presets, applied to the handful of questions that are most
  of the traffic.

The arithmetic says this is affordable. At ≈$0.001 a question (§4), 10,000
questions in a day is $10. The photo demo needed hard caps because dollars were
never its constraint — **500 shared vendor searches a day** were, and a viral
hour could take them from a paying claim. A bot question consumes **no vendor
search and produces no item**, so there is nothing scarce behind it to ration.
Dollars are the only exposure, and they are small, visible, and switchable off.

**Questions are never metered against the 2,000-item allowance** (owner
confirmed, 2026-11-20). The allowance meters items *produced* (rule 9) and a
question produces none; billing a question against it would also mean a trial
user could spend their 250 items on conversation.

---

## 6. The adjuster bot's data boundary

- **Read-only, this claim only.** The route resolves the claim from the
  session's own account; a claim id in the request body is checked against it,
  never trusted. There is no cross-claim and no cross-account question.
- **The bot computes no money** (rule 20). It quotes `rcv`, `tax`,
  `rcv_total_incl`, `depreciation_pct`, `acv_total_incl` as the payload carries
  them. It does not add, re-derive or round — the frontend does not, the export
  does not, and a bot that did would contradict the PDF.
- **It explains provenance by pointing, not by reasoning.** "Where did $388.75
  come from" is answered by the row's Source Link and the valuation basis on it,
  never by a story about how the listing was chosen.
- **Capacity waits are not errors** (rule 12b). A `quota_exhausted` or
  `budget_exhausted` row is "still pricing, it will retry", not "you need to
  act".
- **Unpriced means unpriced** (rule 12): blank, editable, and the bot says the
  `manual_reason` in plain words without inventing a badge that no longer exists.

---

## 7. Where it runs — the backend ask

There is no frontend server; a bot needs a route. Filed as **BACKEND-ASKS 41**.
In short, two routes mirroring the demo's shape:

```
POST /v1/bot/ask            anonymous + Turnstile token → {answer, sources[], blocked?}
POST /v1/claims/{id}/bot/ask  signed in, claim-scoped, read-only
```

The backend owns the model call, the API key, the retrieval over
`bot-corpus.json`, the caps, and — this matters — **its own copy of the output
guard**. The checker in this repo is TypeScript and the route is Python, so
either the route calls a port of it or the rules move to one shared place. A
guard that runs only in the browser is not a guard: the answer has already been
generated and billed, and a direct POST skips it entirely.

---

## 8. What the frontend still owes (not built)

Deliberately not built yet, because a chat panel with no route behind it is a
dead end, and CLAUDE.md's no-dead-ends rule says an undocumented static control
is a bug rather than a design choice:

- The visitor panel (launcher, transcript, composer, Turnstile step, streamed
  answer, sources list, blocked state) in `k-` classes from `kevin.css` — new
  tokens only if the owner approves them, amber stays reserved for special
  limits and the service tone for the status banner.
- The adjuster panel, docked beside the worksheet the way the item drawer is
  (the 440px column of `.k-grid-dock`, not a width on the panel).
- `INTERACTIONS.md` entries for every control in both.
- `src/lib/bot.ts` — the API client, mirroring `src/lib/api.ts`.

When the route exists this is a day's work against a real endpoint, and the
guard, corpus and eval set are already standing.

---

## 9. Settled, and still open

**Settled by the owner, 2026-11-20:** the models in §4 (Haiku 5.5 public, Sonnet
5.5 adjuster); no question cap (§5); bot questions never count against the item
allowance; the backend ask goes over as BACKEND-ASKS 41.

Still open:

1. **Does the website bot capture a lead?** It can point at `/sign-up` and
   `/book-a-call` and nothing else, or it can offer to take an email. The second
   is a form, which is a different consent conversation.
2. **`npm run build:bot-corpus` at the end of the deploy build?** This is the
   one that now matters, because the corpus reads `dist/`: the committed
   artifact is only as current as the last person to run both commands. One
   line appended to `package.json`'s `build` fixes that permanently and means a
   page whose copy breaks a domain rule **fails the deploy** — desirable, and
   the same stance `check-domain-rules.py` already takes, but it lands on the
   marketing session's deploys too, so it is the owner's call rather than mine.
   Until then: `npm run build && npm run build:bot-corpus`, and
   `npm run check:bot-corpus` says whether the committed file is behind.

---

## Files

| path | what |
|---|---|
| `src/lib/bot-guard-rules.ts` | the output guard: 23 patterns across 15 rule keys, the negation windows, the money invariant, `checkCorpus`, `BLOCKED_ANSWER` |
| `src/lib/bot-corpus-rules.ts` | docs → passages, prerendered HTML → passages, scoring, retrieval, the context block |
| `scripts/build-bot-corpus.mjs` | generates `public/bot-corpus.json` from the docs data + `dist/`; dedupes; **fails on a rule breach**; `--check` gates CI; `CORPUS_REVIEWED` holds the judged hits |
| `scripts/test-bot-guard.mjs` | the eval set — 63 cases (`npm run test:bot`) |
| `public/bot-corpus.json` | generated · schema 2 · 563 passages (174 docs + 389 page) |
| `design/check-domain-rules.py` | `bot-guard-rules.ts` in `SKIP_BASENAMES`; a rule-10 pattern for "a live listing"; the rule-10 method pattern widened to the verb forms; `negated()` widened to any wrapped line |
| `src/pages/CompareEnservioPage.tsx` | the rule-10 fix: "a live listing" → "a retail listing", prose and FAQ data |
| `design/components/*.jsx` ×6 | the rule-10 method sweep: 13 strings (worksheet, landing, marketing-pages, pdf-inventory, settings-pricing, utility-pages) |
| `package.json` | three scripts: `test:bot`, `build:bot-corpus`, `check:bot-corpus` |

Verified on 2026-11-21: `tsc -b` clean, `oxlint` unchanged (the warnings in
those prototype files are pre-existing structural ones — `window` and `React`
as Babel-standalone globals, components declared in render — and none sit on an
edited line; copy-only edits cannot add findings), `python
check-domain-rules.py` **clean across 433 files against 26 rules**,
`npm run test:bot` 63/63, `npm run test:dfy` 10/10 (untouched),
`npm run check:bot-corpus` current. The Enservio fix was confirmed in the
prerendered HTML rather than by grepping the source, and the method sweep by
positive-controlling the new guard pattern against all 13 removed strings.
