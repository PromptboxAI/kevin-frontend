# Re-run baseline — `robyn-beck-contents`

Captured **2026-10-07** from the live API, before the owner re-runs the same
photographs as a fresh claim to see what the backend's in-flight engine work
changed.

The point of this file is that last time the numbers were gathered *after* the
argument had started, and had to be labelled stale before anyone could use
them. This is the before. Measure the re-run the same way and the comparison is
arithmetic rather than impression.

**The claim was processed 2026-10-05.** Anything the backend shipped after that
is what the re-run is testing.

---

## Headline

| | baseline |
|---|---|
| Photos uploaded | **208** |
| Photos backing a line | 204 |
| Photos backing nothing | 4 |
| Line items | **160** |
| Items ≤ photos (rule 1) | ✅ 160 ≤ 208 |

## Merge quality — the one the owner flagged as "almost 50/50"

Photos per line item:

| photos on a line | lines |
|---|---|
| 1 | **119** |
| 2 | 38 |
| 3 | 3 |

41 lines are multi-photo, 119 are single. The complaint is that a wide shot and
its model plate come back as two separate lines, so **the number to watch is
`1`: it should fall, and the item count should fall with it.** If the engine
merges better, expect fewer items from the same 208 photos.

## Identification

| | baseline | what it means |
|---|---|---|
| Blank description | **21** | Kevin could not describe it; the adjuster must type one before it can price |
| No make/manufacturer | 94 | |
| No model number | 137 | |

`blankDescription` is the single clearest quality signal. All 21 carry
`manual_reason: "no_description"`.

## Outcomes

| status | count |
|---|---|
| completed | 129 |
| needs_manual | 26 |
| overridden | 5 |

| manual_reason | count |
|---|---|
| no_description | 21 |
| manual_class | 3 |
| low_confidence_high_value | 2 |
| low_sample | 1 |

**Unpriced lines: 26.** Note `manual_class` (3) is the appraisal-only classes —
Jewelry, Firearms, Fine Arts, Furs — and is *correct*, not a failure. It should
not change.

## Valuation basis

| basis | count |
|---|---|
| retail | 81 |
| comparable_sale | 32 |
| like_kind_new | 18 |
| manual | 29 |

`manual` (29) includes the owner's own overrides during review, so it is not a
clean engine signal. **`comparable_sale` at 32 is worth watching**: rule 11 says
a thin retail bucket falls through to the resale market, so a big move there
means the retail sample floor is behaving differently.

---

## How to compare

Run the same read against the new claim id:

```
GET /v1/claim_items?claim_id=<new>&limit=100&offset=…   (page it — limit caps at 100)
GET /v1/claims/<new>/photos?limit=200&offset=…
```

Then group exactly as above: photos-per-item distribution, `status`,
`manual_reason`, `valuation_basis`, and the count of blank descriptions.

**Caveats that will otherwise muddy the read:**

- **Upload the same photographs.** A different set is a different measurement.
- **Do not merge or split anything by hand before processing** — the baseline is
  the clusterer's own proposal, so the comparison has to be too.
- **Do not edit lines before measuring.** `overridden: 5` and much of
  `manual: 29` above are the owner's own edits after the fact; take the reading
  first, then review.
- The 4 photos backing nothing include sets excluded as context or duplicate,
  which is a legitimate outcome, not a loss.

## Known-good things that should NOT change

If these move, something regressed rather than improved:

- items ≤ photos (rule 1)
- `manual_class` = 3 (the appraisal-only classes are not a pricing failure)
- every line keeps a stable `line_no`, with gaps after a delete and no reuse
