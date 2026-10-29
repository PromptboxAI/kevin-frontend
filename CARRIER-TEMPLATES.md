# Carrier export templates — spec

**Written 2026-10-29 by the marketing session, for the core-product session.**
The export writer is core-product code; this document is the analysis, not the
implementation. Task chip: `task_c64d2f59`.

Owner's instruction: **assume this is not a one-off and build a pluggable
mapping layer.** The analysis below supports that — nothing about State Farm's
template is special enough to hard-code, and three of its five hard problems
will recur for any carrier.

---

## 1. The artifact

The owner supplied **`XactContents Import Template.xls`**, the template State
Farm hands adjusters. Facts, read off the file:

| | |
| --- | --- |
| Format | **Legacy `.xls`** — OLE2/BIFF8 (`D0 CF 11 E0`), *not* `.xlsx` |
| Size | 750 KB |
| Version marker | `A1` = **"Template Version: 4.0"** |
| Sheets | `Inventory` (A1:Z5008), `PrefilledInformation` (A1:B114) |
| Capacity | 5,000 item rows (9–5008) |
| Formulas | **5,002 of them** |

Despite the filename it is **not** our XactContents export shape: there are no
tax, depreciation, ACV or content-class columns. It is an **RCV-only intake
sheet** — "Quantity Lost", "Insured:" — for collecting the loss list, not for
settling it.

### Cell map, `Inventory`

```
A1                 Template Version: 4.0
A2  Insured:       value cell to the right (empty in the blank; confirm with the file open)
F2  Claim Number:  value in the merged H2:I2
J2  State/Prov:    value in J3  ← pinned by the D4 formula, see below
A3  Adjuster:      value to the right
F3  Policy Number: value in the merged H3:I3
A4  Important Information:
D4  = IF(J3="","",VLOOKUP(J3,FRAUD,2,FALSE))      state fraud language, merged D4:J6
A7  Total Estimated Replacement Cost =            merged A7:G7
I7  = SUM(J9:J5008)                               merged I7:J7
row 8   HEADER ROW (also the print title)
rows 9–5008  data; A9=1, A10=2 … Item # is PRE-FILLED
```

### The ten columns

| Col | Header | Our field | Notes |
| --- | --- | --- | --- |
| A | Item # | — | **Already filled 1..5000. Do not write it.** |
| B | Room | `room` | ⚠️ Controlled vocabulary — see 2.1 |
| C | Brand or Manufacturer | `make_mfr` | Direct |
| D | Model# | `model_number` | Direct |
| E | Item Description | `description` | Direct. Spell-check range `Contents_SpellCheck` covers E9:E5008 |
| F | Quantity Lost | `quantity` | Direct |
| G | Item Age (Years) | `age_years` | Direct |
| H | Item Age (Months) | **none** | ⚠️ See 2.3 |
| I | Cost to Replace Pre-Tax (each) | `rcv` | ✅ Exact match — our `rcv` *is* per-unit and pre-tax |
| J | Total Cost | **DO NOT WRITE** | `=IF(F9*I9>0,ROUND(F9*I9,2),"")` — see 2.2 |

### Defined names worth knowing

`ROOMS` → `PrefilledInformation!$A$81:$A$114` (34 room values) ·
`STATESPROVS` → `$A$2:$A$73` (72 US states + Canadian provinces) ·
`FRAUD` → `$A$2:$B$73` (state → fraud language; **column B is empty in this
copy**) · `lastRow`/`lastCol` drive the print area dynamically.

---

## 2. The five hard problems

### 2.1 Room is a controlled vocabulary. Ours is free text.

**This is the hardest one and it will recur for every carrier.**

CLAUDE.md is explicit that Room/Area is free text *on purpose* — "houses have
arbitrary room names". State Farm accepts exactly 34:

```
Apartment · Attic · Auto · Basement · Bathroom · Bedroom · Closet · Dining
Entry · Exterior · Family · Foyer · Game · Garage · Hall · Kitchen · Laundry
Living · Master Bath · Master Bedroom · Mud · Nursery · Office · Pantry
Patio · Play · Pool · Porch · Shop · Storage · Theater · Utility · Workout
```

(`Patio` appears twice in their list. Harmless, but do not de-duplicate their
file — mirror it.)

So the layer needs a **room normaliser** per carrier: `"Primary bedroom"` →
`Master Bedroom`, `"Living room"` → `Living`, `"Kid's room"` → `Bedroom`.

Three rules for it:

- **Never silently drop a room that will not map.** The adjuster typed it. Fall
  back to the nearest value, or leave B blank and keep the original — but
  surface the count of unmapped rooms before the download, the way the export
  modal already surfaces unpriced rows (rule 16: inform, never block).
- **The mapping belongs in data, not in code branches.** A lookup table per
  carrier, reviewable by a non-engineer, because the next carrier's list will
  be different and somebody will have to read ours against theirs.
- **It is lossy and that is acceptable** — but it is the adjuster's call, so
  make it visible rather than quiet.

### 2.2 ⚠️ Rule 2b INVERTS here. Preserve the formulas.

CLAUDE.md rule 2b: *the .xlsx contains static values only, never a formula,
because Xactimate's importer breaks on them.*

**That rule is about our own XactContents export, which is machine-ingested.
This file is opened by a human in Excel and is built around its formulas:**
column J computes `qty × unit cost` per row, and `I7` sums J. Overwrite J with
static numbers and you break the template — the total stops reconciling the
moment anyone edits a quantity, which is the first thing an adjuster does.

**Write F and I. Leave J and I7 alone.** Excel recalculates them on open.

Generalise this as a per-template flag — `formulas: "preserve" | "static"` —
not as a global rule change. Rule 2b stands for the XactContents export.

### 2.3 Age is split; we only carry years

They want Years (G) *and* Months (H). `age_years` is a whole number. Options,
owner's call: leave H blank (safest, and a blank is honest), or write 0. Do
**not** fabricate a months figure by splitting a year estimate — rule 12's
logic applies: a confident wrong number is worse than a blank.

### 2.4 Nowhere for depreciation, ACV, tax or content class

The template has no columns for them. That is fine — it is an RCV intake sheet
— but it means **this export is lossy by design** and the adjuster should be
told that before they download it, not after they have sent it. Our own
XactContents .xlsx remains the complete artifact.

### 2.5 It is `.xls`, not `.xlsx`

Writing BIFF8 is a materially different job from writing OOXML, and we have no
spreadsheet library at all (the inventory template generator hand-rolls a
minimal OOXML zip — see `scripts/build-inventory-template.mjs`; that technique
does not extend to BIFF).

**Open question for the owner or the rep: does State Farm accept `.xlsx`?**
If yes, convert their blank once to `.xlsx` and the problem disappears. If no,
this needs a real library or a server-side converter, and that is the single
biggest cost item in the whole feature.

---

## 3. Architecture — fill their file, do not clone it

**Recommended: ship each carrier's own blank template as an asset and write
values into its cells.** Do not generate a lookalike from scratch.

Cloning loses, silently: the 5,002 formulas, the room and state data
validation, the fraud-language VLOOKUP, print titles, column widths, the
spell-check range, and the `Template Version` marker. A file that looks right
and behaves wrong is worse than no feature, because nobody finds out until a
carrier rejects it.

A sketch of the shape, not a prescription:

```
carrier-templates/
  state-farm-xactcontents-v4/
    blank.xlsx            the carrier's own file, converted once
    mapping.json          cells, columns, room vocabulary, flags
```

`mapping.json` carries: the header-block cell addresses, the column letters,
the first data row, `formulas: "preserve"`, the room lookup, and the template
version it was built against.

**Version the mapping against the template version.** `A1` says 4.0 — when
State Farm ships 5.0 and moves a column, a file written to the 4.0 map is
wrong in a way that looks fine. Read `A1` from the blank at build time and
fail loudly if it is not what the mapping expects.

---

## 4. Open questions for the owner / the rep

1. **Does State Farm accept `.xlsx`?** Decides §2.5, the biggest cost item.
2. **Which cells take Insured / Adjuster / Claim Number / Policy Number?** They
   are empty in the blank so the parse cannot pin them; only `J3` (State/Prov)
   is proven, by the D4 formula. Two minutes with the file open settles it.
3. **Is the blank really blank?** `FRAUD` column B is empty in this copy, so
   the fraud language never populates. If State Farm's own copy has it filled,
   we have an incomplete blank and should get a fresh one.
4. **Do other carriers hand out templates?** Allstate, Travelers, USAA. If two
   more do, the layer is justified on day one; if not, it is still the right
   shape but a smaller bet.
5. **What does "Item Age (Months)" mean to them** — months *on top of* years,
   or total months? Changes whether blank is safe.

---

## 5. What is NOT in scope

Rule 4 is untouched. This changes the **shape of the file we hand the
adjuster** and nothing else. No carrier-portal submission, no carrier-facing
surface, no integration with State Farm systems. The adjuster downloads it and
sends it exactly as they do today.
