# Kevin — Documentation

Help documentation for Kevin: photo-to-inventory for insurance content adjusters and
estate-sale professionals. 45 articles across 8 sections.

---

## Contents

**Getting started**

- [Quick start](#quick-start)
- [Creating your first claim](#creating-your-first-claim)
- [Uploading photos](#uploading-photos)
- [Reviewing photo sets](#reviewing-photo-sets)
- [Reviewing the worksheet](#reviewing-the-worksheet)
- [Exporting to Xactimate](#exporting-to-xactimate)

**Worksheet**

- [Editing cells](#editing-cells)
- [Bulk actions](#bulk-actions)
- [Search & filter](#search-filter)
- [Content classes](#content-classes)
- [Depreciation overrides](#depreciation-overrides)
- [RCV comps & proof links](#rcv-comps-proof-links)
- [Unpriced items](#unpriced-items)
- [Special-limits flags](#speciallimits-flags)
- [The item panel](#the-item-panel)

**Exporting**

- [Xactimate (Excel) format](#xactimate-excel-format)
- [PDF inventory](#pdf-inventory)
- [The full bundle](#the-full-bundle)
- [Share links](#share-links)
- [Export history & re-exporting](#export-history-reexporting)

**Claims & policies**

- [Claim statuses](#claim-statuses)
- [Personal property limit](#personal-property-limit)
- [Depreciation schedules](#depreciation-schedules)
- [Carrier profiles](#carrier-profiles)
- [The audit log](#the-audit-log)
- [The Photos tab](#the-photos-tab)
- [Archiving & deleting claims](#archiving-deleting-claims)
- [Recovering your holdback](#recovering-your-holdback)

**In the field**

- [Capturing from your phone](#capturing-from-your-phone)
- [Pairing a phone to a claim](#pairing-a-phone-to-a-claim)
- [Notes while you shoot](#notes-while-you-shoot)
- [Reviewing on mobile](#reviewing-on-mobile)

**Estate sale mode**

- [Estate sale mode](#estate-sale-mode)
- [Fair market value](#fair-market-value)
- [Condition & status](#condition-status)

**Account**

- [Storage & fair use](#storage-fair-use)
- [Billing & plans](#billing-plans)
- [Security & passkeys](#security-passkeys)
- [Team & roles](#team-roles)
- [API & webhooks](#api-webhooks)

**Troubleshooting**

- [Photos won’t upload](#photos-wont-upload)
- [An item came back wrong](#an-item-came-back-wrong)
- [An export failed](#an-export-failed)
- [Notifications & alerts](#notifications-alerts)
- [Glossary](#glossary)

---

# Getting started

## Quick start

_The whole loop in five minutes: claim in, photos in, inventory out._

Kevin turns a folder of photographs into a defensible personal-property inventory. You start a claim, drop the photos, let Kevin identify and price each item, review the worksheet, and export a file. Nothing is submitted anywhere on your behalf — you send what you export.

### The five steps

1. Start a claim. Claim and policy numbers, date and cause of loss, the insured, the loss address, and the contents coverage limit.
2. Drop the photos. A folder, a phone dump, or a whole .zip — no total-size cap, up to 15 MB per photo. Duplicates are removed as they arrive.
3. Review the photo sets. Kevin groups shots taken seconds apart into one set. Merge, split, or exclude before anything is identified.
4. Let Kevin work. Identification, make and model, content class, three live price comps per item, depreciation from the claim schedule.
5. Review and export. Every cell is editable. Export the Xactimate spreadsheet, a client PDF, or the full bundle.

### How long it takes

| Step | A 44-item claim |
| --- | --- |
| Intake | About a minute |
| Upload + staging | A minute or two for 50 photos |
| Processing | Around eight minutes, unattended |
| Your review | Twenty to forty minutes |
| Export | Under a minute |

> Every account starts with 250 free line items — full product, real claims, no time limit. Card verified at signup, not charged until you start Pro.

## Creating your first claim

_What every intake field does, and why the ZIP matters more than it looks._

From My claims, click New claim. Intake is a single form and every field stays editable later, so do not stall on anything you can look up afterwards.

### Claim details

- Claim number and policy number — both print on the export, so they are worth getting right.
- Date of loss and cause of loss — cause drives nothing automatically; it is documentation.
- Carrier — pick from the list, or add your own. Kevin has no relationship with any carrier and no special behavior per carrier.
- Insured name — the person whose property this is. This is not you; your name travels separately as the preparer.

### The loss address

Enter the street, city, state, and ZIP of the loss. The ZIP resolves the sales-tax rate applied to every line item, which is why the address and the tax rate must always agree. If the ZIP does not resolve, Kevin falls back to the default rate in your settings and tells you.

### Contents coverage

Policies name contents coverage differently — Coverage C, Personal Property, Contents, Coverage B on a renters policy, Business Personal Property on a commercial one. Pick the label off the declarations page and enter the limit. Kevin then shows a meter as the inventory approaches that number, turning amber at 80% and red over the limit.

> Enter any prior contents payment in "already claimed" so the meter reflects what is actually left.

### Processing settings

- Depreciation schedule — straight-line by default. You can add your own schedule here.
- Default condition — the starting condition grade for every item, which you override per row.

## Uploading photos

_Formats, size limits, dedupe, and how to shoot so Kevin reads well._

Drag any combination of JPG, PNG, or HEIC files, a folder, or a whole .zip — no total-size cap, up to 15 MB per photo. iPhone HEIC files are converted on arrival — you do not need to change your camera settings.

### Duplicates

Every file is hashed as it uploads. Byte-identical files — the same shot uploaded twice, a burst frame copied into the folder — are discarded, keeping one. This matters because an uncaught duplicate becomes a duplicate line item, which is exactly what a carrier flags.

> Hashing only catches identical files. Two separate photos of the same television are different files, so they are handled by photo-set grouping in the next step.

### How to shoot

- One item per photo. Kevin reads a single item per photograph, so a wide shot of a full room produces one item, not twelve.
- Take the model plate. A second photo of the sticker or barcode gets you an exact model number, which produces a much tighter price.
- Shoot from a step back, then close. Kevin groups the pair automatically.
- Context shots are fine. Mark them skipped in staging and they cost you nothing.

### From the field

The mobile capture screen sends photos straight from your phone to the claim, with an optional note attached to the set you are shooting. Nothing needs to sync through your desktop.

## Reviewing photo sets

_Kevin proposes the grouping; you approve it before anything is identified._

Between upload and processing, Kevin proposes photo sets: shots taken within seconds of each other, in the same place, are almost always the same object. Three angles of a sofa become one line item rather than three. A lone photo is simply a set of one.

> This screen runs before identification. It shows filenames, timestamps, and how far apart the shots were — not item names, because nothing has been identified yet.

### What you can change

- Merge — select two or more sets that belong to the same object and combine them.
- Split — break a set apart when Kevin grouped two different objects shot back to back.
- Skip — mark context shots, blurry frames, or anything you do not want counted.

### The tally

The counter shows photo sets, not line items — 50 photos might propose 47 sets. The item count is not known until identification runs, and it will be lower still once unmatched and context photos fall out.

### Notes that steer identification

You can attach a note of up to 120 characters to any set. It rides on the whole set and steers what Kevin looks for: "the TV is the Sony, not the Samsung," or "this is the mahogany one, not the veneer." Notes influence identification only — they never affect price.

> Notes are pre-processing only. If an item comes back misidentified, correct it by editing the worksheet row, not by re-running identification.

## Reviewing the worksheet

_What arrives filled in, what needs you, and the order to work in._

Processing drops you into a single editable grid — one row per item, every cell yours to change. There is no wizard and no locked step. What Kevin found is all in front of you at once.

### What arrives filled in

- Description, make, and model number where they were legible.
- Content class, which drives the depreciation math.
- Unit cost, from the median of three live retail comps, with a dated link to the comp behind it.
- Age and depreciation percent, from the schedule on the claim.

### What needs you

- Room or area — Kevin does not know which room a photo was taken in. This is free text and filterable.
- Quantity, where one photo represents several identical items.
- Anything left blank. When Kevin cannot find a confident comp it leaves the price empty rather than guessing.
- Anything it got wrong. Fix the description and re-price against fresh comps.

### A working order that saves time

1. Filter by room and fill the room column in blocks — it is faster than jumping around.
2. Sort or filter to the unpriced rows and clear those first; they are the ones that hold up an export.
3. Pin the item panel and tab down the grid, checking each photo against its description.
4. Check the special-limits flags last, against the policy.

## Exporting to Xactimate

_The spreadsheet route into XactContents, start to finish._

Xactimate does not accept an XML upload for contents. XactContents imports a pre-formatted Excel spreadsheet, and that is exactly what Kevin produces — matching column order, so it imports without cleanup.

### Steps

1. In the worksheet, click Export claim.
2. Choose Xactimate (Excel) and download the .xlsx.
3. In Xactimate desktop, open your estimate and go to the XactContents tab.
4. Click Import from Excel, choose the file, and import. Make sure the file is closed first.

> Kevin never pushes into Xactimate or a carrier system. You download the file and import it yourself, which means nothing moves without your say.

### Columns in the file

Number, room or area, quantity, description, make and model, unit cost, extended cost, sales tax, RCV plus tax, age, percent depreciation, dollar depreciation, and ACV. Age prints as a bare number so it lands numeric in Excel, and tax is per line item rather than only as a claim total.

### If something looks off after import

- Blank prices mean the item was unpriced in Kevin. Fill those in before exporting.
- Numbers stored as text usually means the file was open in Excel when you imported it.

---

# Worksheet

## Editing cells

_Which cells you type in, which are calculated, and how the money chain foots._

Click any editable cell and type. There is no edit mode to enter and no save button — changes commit when you leave the cell, and every one is recorded in the audit log.

### Editable versus calculated

| Editable | Calculated |
| --- | --- |
| Room / area | Extended cost |
| Quantity | RCV + tax |
| Description, make, model | Dollar depreciation |
| Content class | ACV |
| Unit cost |  |
| Age, percent depreciation |  |

### How the money foots

```
Extended cost  = Unit cost x Quantity
RCV + Tax      = Extended cost + (Extended cost x tax rate)
$ Depreciation = Extended cost x % Depreciation
ACV            = Extended cost + Tax - $ Depreciation
```

Tax sits inside ACV, and the columns foot left to right. Change a unit cost and everything to its right follows.

### Keyboard

- Tab and arrows move between cells.
- Enter on the last row appends a new blank row, so you can add items without touching the mouse.
- Money cells clear when you focus them — type the new figure straight in. Leave without typing and the old value returns.

### Column widths

Drag a header boundary to resize a column, like a spreadsheet. Double-click a boundary to reset it.

## Bulk actions

_Change or remove many rows at once with the checkbox column._

Tick the checkbox on any row and an action bar appears showing how many rows are selected. Ticking is selection only — it does not open anything or change the item panel.

### Re-categorize

Sets the content class on every selected row. Because class drives depreciation, each affected row then waits briefly for the server to return a new percentage, and the cell flashes when it lands. Unpriced rows are skipped — they carry no depreciation to recalculate.

### Delete

Removes the selected rows from the inventory after a confirmation. The source photos stay on the claim, so nothing is lost and you can add the item back by hand.

### Add item

Appends a blank row at the end and puts the cursor in it. Pressing Enter on the last row does the same thing. A row you add by hand was never seen by identification and never priced, so it is tagged Manual and you enter the value yourself.

> There is no bulk re-run of identification. If items came back wrong, edit the descriptions and re-price — a second identification pass would not know anything new.

## Search & filter

_Narrowing 142 rows to the handful you are working on._

Search matches description, make, model, content class, and room at once. Type "sony" to see every Sony item; type "kitchen" to see everything you have assigned to the kitchen.

### The filter popover

- Room — free text, so it matches whatever names you typed.
- Barcode matched — items where a barcode or model sticker was read, which are your most reliable rows.
- Special limits — classes the policy may cap.
- Low confidence — where identification was least certain.
- High value — items over a threshold, useful for a final pass.

### Group by class

Toggling group by class sections the grid by content class with a subtotal on each group. This is the fastest way to sanity-check a claim: if Electronics totals more than the whole rest of the house, something is wrong.

### What filters do not do

Filtering changes what you see, never what exports. The export always contains the full inventory unless you deleted rows.

## Content classes

_What the class column is for and why it changes the numbers._

Every item carries a content class — Electronics, Furniture, Clothing, Jewelry, and so on. The class is not decoration: it selects the useful life used to depreciate the item, and it maps to the category code in the exported spreadsheet.

### Changing a class

Click the class cell and a searchable list opens showing all classes with the current one ticked. Type to narrow it, or scroll the full list if you are not sure what exists. Picking a new class sends the row for recalculation, and the depreciation cell shows a spinner until the answer comes back.

> The depreciation percentage is calculated on the server, never in your browser. That is deliberate: it guarantees the figure in your worksheet is the figure in the exported file, to the penny.

### Useful life

Each class carries a standard useful life — five years for electronics, fifteen for furniture, three for children’s clothing. Straight-line depreciation divides the item’s age by that life. Useful life is internal to the math and never printed as a column on an export.

### Classes Kevin will not auto-price

Jewelry, fine arts, firearms, and furs come back unpriced regardless of what a search might turn up. These need an appraisal or your own judgment, and a machine-picked comparable would not hold up.

## Depreciation overrides

_Three methods, one cap, and what happens when you type over the number._

Depreciation arrives already calculated from the schedule attached to the claim. You can override any percentage by typing over it.

### The three methods

| Method | How it works |
| --- | --- |
| Straight-line (default) | Age divided by the useful life for the class, capped so a salvage floor remains. |
| Bracketed | A percentage looked up by class and age band — under 1 year, 1 to 2, 3 to 5, 6 to 10, 11 to 15, over 15. |
| Custom | Percentages you enter yourself. |

### The cap

Straight-line is capped at 90%, so a twenty-year-old five-year-life item does not depreciate to nothing. Something old and still present has salvage value, and a carrier will expect to see it.

### Overriding

Type a percentage into the cell and it stops following the schedule — the row is marked as manually set, and the change is recorded with your name and the time. Click the information icon in the cell to see how the figure was reached: the method, the useful life, the age, and whether the cap applied.

> Unpriced items stay at zero percent. There is no price to depreciate, so a percentage would be meaningless.

### Adding your own schedule

On intake, choose Add new schedule to define one: a name, the method, useful life by class, and a maximum. It is then selectable on any future claim.

## RCV comps & proof links

_Where the price came from, how to switch it, and what prints on the export._

Every comp Kevin finds comes from one place: Google Shopping and the Google Immersive Product API, which already spans major retailers, specialty stores, brand-direct storefronts, and marketplaces. There is no list of individual stores to maintain or switch on.

### How the price is chosen

Kevin keeps the top three merchant offers for an item and takes the median as the replacement cost. The median is deliberately dull: it resists a single mispriced listing in either direction. When offers disagree by more than 15%, the manufacturer’s own price is weighted to settle it.

### Switching comps

Click a unit cost cell and all three comps open — merchant, title, price, and a link to the listing. Pick a different one and the price changes, and so does the proof link on that row. The link always points at the comp actually behind the price.

### The proof link

The last column carries a link labelled Link, which opens the listing the price came from. It prints into both the spreadsheet and the PDF, which is what makes a figure defensible months later. If you type a price by hand, the link is blank — an invented price has no source to cite, and you can attach your own with the plus control.

> Kevin stores the URL and the date it was fetched, not a snapshot of the page. A dead link a year on still shows what was checked and when.

### Like kind and quality

When the exact model is discontinued, Kevin prices the nearest equivalent still sold new and records the substitution on the row, visible in the item panel. Replacement cost always holds a new-replacement price — never a used listing, which has already lost value once and would be depreciated a second time.

## Unpriced items

_Why some cells arrive blank, and what to do with them._

When Kevin cannot find a confident replacement price, the cell arrives empty rather than filled with a guess. A wrong number that looks authoritative is worse than an obvious gap, because nobody checks it.

### Why an item comes back blank

- The class requires judgment — jewelry, fine arts, firearms, furs.
- Too few comparable listings to trust a median.
- Nothing matched at all: a handmade piece, something very old, or a photo that was not readable.

### What a blank row looks like

The unit cost cell is simply empty and editable. Everything derived from it shows a dash and contributes nothing to the claim totals. There is no badge, no warning, and no approval step — you type the price in like any other cell.

> Dollar amount has nothing to do with it. A ten-thousand-dollar sofa prices normally if the comps are there. Kevin only declines when it genuinely does not know.

### Filling it in

- Type a figure. The row is tagged Manual and you can attach a proof URL with the plus control.
- Or open the item panel, sharpen the description, and re-price — a better description often finds comps where a vague one did not.

### Exporting with blanks

Kevin will not block an export over unpriced rows. The export screen tells you how many there are and you decide whether to proceed. Blank prices export as zero so spreadsheet formulas do not break.

## Special-limits flags

_An amber row means check the policy, not that something is wrong._

Most policies cap certain categories regardless of what the items are worth — jewelry, firearms, fine arts, and furs are the usual four, often at a couple of thousand dollars per item or in total. Kevin flags rows in those classes in amber so you check the cap before the inventory goes out.

### What the flag does

- Tints the row and badges the class cell.
- Appears in the filter, so you can see all flagged rows together.
- Shows in the export summary as a count.

### What it does not do

It does not block anything, change any number, or stop an export. It is a reminder to look at the declarations page — the actual cap varies by policy and Kevin does not presume to know it.

> A special-limits flag is not the same as an unpriced item, though they often coincide. The flag is about coverage; unpriced is about whether Kevin could find a price.

## The item panel

_The photo, the comps, and the math for one row — docked beside the grid._

Click a row number to open the item panel. It shows the source photograph, the editable fields, the comps behind the price with their links, any like-kind substitution note, and the computed totals for that row.

### Docking it

The pin in the panel header docks it to a rail on the right of the grid, where it stays open. Once docked it follows you: click or tab into any row and the panel swaps to that item. For a long claim this is the fastest way to check every photograph against its description. Unpin to return it to a centered dialog.

> The Item panel button in the toolbar opens the docked panel directly, without going through a row first.

### Edit and re-price

The most useful control in the panel. Kevin might have read a photograph as "brown leather sofa" when you know from the insured that it is an Ethan Allen Conor. Sharpen the description, click re-price, and Kevin searches again against the better description and returns a fresh price with fresh comps. The row is then marked as manually refined, so anyone reading the file later can see a person steered that search.

### Moving between items

The arrows in the header step to the previous or next row without closing the panel.

---

# Exporting

## Xactimate (Excel) format

_Column parity with the XactContents template, and what each column holds._

The .xlsx export matches the XactContents import template column for column, in order, so it imports without cleanup. This is the format most claims leave Kevin in.

### The columns

| Column | Contents |
| --- | --- |
| # | Line number |
| Room / area | What you typed in the room column |
| Qty | Quantity |
| Description | The item description |
| Make · Model | Manufacturer and model number where known |
| Unit cost | Replacement cost for one |
| Ext. cost | Unit cost times quantity |
| Sales tax | Per line, from the claim tax rate |
| RCV + tax | Extended cost plus tax |
| Age | Years, as a bare number so Excel treats it as numeric |
| % Depr. | Depreciation percentage |
| $ Depr. | Dollar depreciation |
| ACV | Actual cash value |

> Content class and useful life are internal to the depreciation math and are not printed as columns. They would only invite argument.

### Values you should expect

- Unpriced items export as 0.00 rather than blank, so formulas in the sheet do not break.
- A zero price produces zero depreciation, never negative zero.
- Tax appears on every line, not only as a claim total.

## PDF inventory

_The client-facing document, and the one place the disclaimer lives._

The PDF is the readable version of the same inventory — the file you hand an insured, an attorney, or an estate-sale client. It carries a header with the claim details, the full line-item table, and totals.

### What the header shows

- Claim and policy numbers, insured, loss address, date of loss.
- Who prepared it and when.
- The depreciation method used, named explicitly.
- The tax rate applied.

### Depreciation disclosure

The PDF states which method produced its figures and recomputes the table for that method, so the document is internally consistent. Under straight-line it also prints the useful life applied to each line, which is usually the first thing anyone questions.

> The "not an appraisal" language lives in the Terms of Service, not stamped on every inventory. Most exports go straight into Xactimate, where a disclaimer would only be noise.

### Photos in the PDF

Photographs, comps, and adjuster notes can only travel in the PDF or the bundle — a spreadsheet has no place to put them. If you need the pictures alongside the numbers, this is the format.

## The full bundle

_Everything at once, as a .zip, for the file._

The bundle is a single .zip containing the spreadsheet, the PDF inventory, every source photograph, and the audit log. It is the archival copy — what you keep, or send when someone asks for the complete record.

### What is inside

- The .xlsx inventory, ready for XactContents.
- The PDF inventory.
- A photos folder, with filenames tied to their line numbers.
- The audit log: every edit, who made it, and when.

### Size

Photographs dominate the size. A large photo claim can land in the hundreds of MB, and a single export is capped at 2 GB. If you only need the numbers, take the spreadsheet instead.

> The audit log is the part that makes a bundle worth keeping. Two years on it shows exactly what changed and who changed it.

## Share links

_Sending an inventory without an email attachment._

Instead of downloading and attaching, you can mint a link. Anyone with the link sees the inventory in a read-only view; no account is needed.

### Controls

- Expiry — the link stops working on a date you set.
- What is included — the spreadsheet, the PDF, the photographs, or a subset.
- Revoke — kill the link immediately at any time.

### Who opened it

The share sheet lists each view: the email address if the viewer identified themselves, the approximate location, the device, and the time. It is useful evidence that a file was actually received.

> A share link is still you sending a file. Kevin has no connection into a carrier system and no carrier-facing surface, so nothing arrives anywhere on its own.

## Export history & re-exporting

_Every export is kept, versioned, and re-downloadable._

Exports are listed per claim with their format, size, line count, and when they were produced. Nothing is thrown away, so you can always retrieve exactly what you sent rather than reconstructing it.

### Versions

Export the same claim again after edits and you get a new version alongside the old one. The earlier file stays exactly as it was — the version you sent is the version you can still open, which is the whole point of keeping it.

### When an export fails

A failure is technical: a generation error, a storage read problem, a share link that could not be minted. You get a reference ID and a retry. It is never a judgment about whether your inventory is ready — Kevin does not gate an export on editorial readiness.

> Quote the reference ID if you contact us. It resolves directly to the failed job.

---

# Claims & policies

## Claim statuses

_Four states, and only you close a claim._

Every claim shows a status you can change by clicking the badge on the claims list.

| Status | Meaning |
| --- | --- |
| Processing | Identification and pricing are running. Set by Kevin, not by you. |
| In review | You are working the worksheet. Still an open claim. |
| Open | Active, waiting on something — usually the carrier or the insured. |
| Closed | Done. The only status that takes it out of your open count. |

> In review is an open claim. Nothing leaves your open count until you mark it Closed, because only you know when a claim is actually finished.

### What status changes

Status drives the counts at the top of the claims list and nothing else. It does not lock the worksheet, restrict editing, or affect exports — a closed claim is still fully editable and exportable.

## Personal property limit

_Tracking the inventory against the coverage cap._

Policies name contents coverage differently, so Kevin stores both a label you pick at intake and the dollar limit. Coverage C on a homeowners policy, Coverage B on a renters policy, Personal Property or Contents elsewhere, Business Personal Property on a commercial risk.

### The meter

The worksheet totals bar and the claim overview both show the inventory against the limit. It runs in the accent color, turns amber at 80%, and turns red once the inventory exceeds the limit.

### Already claimed

If a prior contents payment has been made on the same loss, enter it at intake. The meter then measures against what remains rather than the full limit, which is the number that actually matters.

> Kevin never prints a coverage letter as though it were universal. Whatever you chose at intake is what appears on the export.

## Depreciation schedules

_Choosing one per claim, and building your own._

A schedule is chosen per claim, not globally — an independent adjuster works for several carriers under different guidelines, and depreciation is a policy matter rather than a company-wide setting.

### What ships

- An industry-standard straight-line schedule, used by default on every new claim.
- A bracketed alternative, where a percentage is looked up by class and age band.

### Building your own

On intake, choose Add new schedule. Give it a name, pick the method, set useful life per content class, and set the maximum depreciation. It becomes selectable on any future claim, and the name prints on the PDF so the reader knows which one produced the numbers.

> Whatever you pick, the calculation happens on the server. That is what guarantees the worksheet and the exported file agree exactly.

## Carrier profiles

_What a profile is for — and what it deliberately does not control._

A carrier profile stores the details that repeat across claims for the same carrier: contact routing, export preferences, and the policy language you tend to see. It saves retyping.

### What a profile does not set

It does not set depreciation, and it does not set special-limits caps. Both are properties of the individual policy, not the carrier — two policies from the same insurer routinely differ. Kevin asks for those per claim on purpose.

> Kevin has no relationship with any carrier and no carrier-specific behavior. A profile is your record-keeping convenience, nothing more.

### Managing profiles

Add, edit, or delete profiles in Settings. Deleting one leaves existing claims untouched — they keep the values they were created with.

## The audit log

_Who changed what, when — the part that makes a file defensible._

Every claim keeps a timeline of everything that happened to it: creation, upload, processing, every cell edit, every price override, every export. Entries carry the person, the field, the old value, the new value, and a timestamp.

### What gets recorded

- Claim created, and any change to the claim details.
- Photos uploaded, and photo sets merged, split, or skipped.
- Processing started and finished, with the item count.
- Every field edit on every row, including which comp was selected for a price.
- Depreciation overrides, flagged as manually set rather than schedule-derived.
- Rows added or deleted.
- Exports produced, share links minted, and share links opened.

### Why it matters

A year after a claim closes, nobody remembers why a figure was changed. The log answers that without anyone having to. When a carrier questions a number, the log shows whether it came from a comp or from a person, and who that person was.

> The log is a record, not a conversation. There is no commenting, no mentions, and no message thread — those were considered and left out.

### Reading it

Open the Audit tab on any claim. Filter by person, by event type, or by date. It is a single timeline rather than a per-row history, so you read a claim chronologically.

### Exporting it

The full bundle includes the audit log as a file. That is the main reason to take the bundle rather than just the spreadsheet.

## The Photos tab

_Every photograph on the claim, and which item each one backs._

The Photos tab shows every photograph uploaded to the claim, whether or not it produced a line item. It is where you go when a number looks wrong and you want to see the source.

### What each photo shows

- The item it backs, if any — at most one, because Kevin reads a single item per frame.
- Its status: matched, unmatched, a context shot, or a duplicate removed at upload.
- The room, once you have assigned one on the worksheet.
- Capture metadata: device, time, and whether the file carried location data.

### Why photos outnumber items

A 162-photo claim typically yields fewer items — some photos are context shots, some are model-plate close-ups of an item already counted, some are unmatched or too blurry to read, and a few are duplicates. Items are always fewer than photos, never more.

### Filters

- By status, to find everything unmatched in one pass.
- By room, to check a room’s coverage before leaving a site.
- By capture device, useful when two people shot the same job.

> Deleting a line item does not delete its photograph. The photo stays on the claim, so you can add the item back or price it differently.

## Archiving & deleting claims

_Both are always available. It is your account._

Every claim can be archived or permanently deleted from the row menu on the claims list. Neither is gated.

### Archive

Reversible, and keeps everything — items, photographs, exports, and the audit log. Archived claims are still reachable under the Archived filter and can be restored at any time. This is the right choice for a finished claim you want out of the way.

### Delete

Permanent, and requires typing DELETE to confirm. Everything goes, including the photographs.

> Kevin does not gate either action for compliance reasons. Kevin is a platform for building content lists, not a compliance system — retention obligations belong to you and the carrier.

### Nothing is deleted to save space

Kevin never removes your data to reclaim storage. Closed claims move to archived storage after ninety days, which is slower on first load and nothing else. It is your data.

## Recovering your holdback

_Turn replaced items into a recovery request the carrier desk can pay._

On an RCV policy the carrier pays ACV up front and holds back the depreciation. When the insured actually replaces an item, that holdback becomes recoverable. Kevin tracks it per line and builds the request document for you.

### How it works

1. Open Recovery — from the claim overview, open the Recovery tab. Every line from the worksheet is there with its holdback amount already computed.
2. Enter the actual cost — what the insured actually paid. For multi-unit lines, set how many of the units were replaced; Kevin prorates the recoverable amount per unit.
3. Attach the receipt — one per line. A line with a cost but no receipt still exports; it prints MISSING in amber so the desk sees the gap instead of a silently dropped line.
4. Export the request — as an .xlsx or a PDF RCV Report, with or without the receipt files. Send it the way you send everything else — download or share link.

### What the recoverable amount is

Per line, recovery is capped at the smaller of the withheld depreciation and what was actually spent. Replace a $1,200 item for $900 and the request claims the holdback up to $900 — the carrier never pays out more than the insured spent. These caps come from the backend; the sheet shows them per line as “Back to insured.”

### Batches are normal

Insureds replace items over months. Export a recovery request whenever there is something new to claim — each export is a fresh snapshot of every line with an actual cost entered. Nothing forces you to wait until everything is replaced.

### What the exports contain

| Export | Contents |
| --- | --- |
| RCV Report · .xlsx | Static-value spreadsheet of claimed lines — row #, item, holdback, actual cost, claimed amount, receipt filename. |
| RCV Report · PDF | The same request as a formatted document, with an appendix indexing each receipt by worksheet row number. |
| Receipts · .zip | Just the receipt files, named by row (receipt_0001.pdf), for a desk that already has the request. |
| Worksheet + receipts · .zip | The request document plus the receipt files as separate originals beside it — the PDF’s appendix is the index. |

> Receipts are never merged into one flattened PDF — originals travel as separate files so their metadata and quality survive.

---

# In the field

## Capturing from your phone

_Shooting straight into a claim, without a trip through your desktop._

Open Kevin in your phone browser and photos go straight into the claim you have open. There is nothing to import later and nothing to keep track of on a memory card.

### How it works

1. Sign in on your phone and pick the claim, or scan the pairing code from your desktop.
2. Tap the shutter and shoot. Each frame uploads as you go.
3. The counter shows how many photos are on the claim so far.

### Your camera roll

Photos go from the camera into the claim without being saved to your personal camera roll. That is deliberate: an adjuster does not want two hundred photographs of somebody else’s fire-damaged kitchen sitting in their phone gallery.

> If you would rather use the phone camera app and upload afterwards, that works too — select the photos from your library like any other upload.

### Bad signal

Photos are cached locally when the connection drops and upload themselves once you have service again. You can keep shooting the whole time. Nothing is lost if you walk out of a basement mid-claim.

### What to shoot

- One item per photo — Kevin reads a single item per frame.
- A second shot of the model plate or barcode whenever there is one.
- A step-back shot then a close-up. Kevin groups the pair for you.

## Pairing a phone to a claim

_Getting the right claim on the phone in a few seconds._

Pairing points your phone at one specific claim, so you cannot accidentally shoot a kitchen fire into last week’s water loss.

### Two ways in

- Scan the code. Open the claim on your desktop, show the pairing code, and scan it with your phone camera. The claim opens already selected.
- Sign in on the phone. Sign in and pick the claim from your list. Slower, but it works with no desktop nearby.

### What the code does

It confirms the phone is yours and selects the claim. It expires shortly after being shown, and showing a new one invalidates the old one.

> A paired phone stays on that claim until you switch. Check the claim name in the header before a long shoot — it is the one mistake that costs real time to unpick.

### Signing in on a phone

Email and password, Google, or a passkey — the same three options as the desktop. Kevin does not use biometrics; if your phone asks for a fingerprint it is unlocking a passkey locally and nothing reaches Kevin.

## Notes while you shoot

_Telling Kevin what it is looking at before it looks._

While shooting you can attach a short note to the set you are capturing — up to 300 characters of additional identification Kevin reads when it processes the batch.

### What a good note looks like

- "Sony, not the Samsung next to it"
- "Solid mahogany, not veneer"
- "Custom built-in, no model number"
- "Insured says purchased 2019"

### What a note cannot do

Notes influence identification only. They never set or adjust a price, and they do not carry into the export as a field. If you need a price to be a particular figure, type it into the worksheet.

> Notes are pre-processing. Once a batch has been identified, a note will not change anything — correct the worksheet row instead.

### Where notes end up

The note travels with the whole set, so every photo in that set inherits it. You will see it again on the staging screen before you press process, where you can edit or remove it.

## Reviewing on mobile

_What you can usefully do on a phone, and what to leave for the desk._

The mobile review screen shows what Kevin found — one item at a time, with its photo, description, and price. It is built for checking work in a truck, not for doing the full review.

### What works well on a phone

- Confirming an identification against the photo while you are still on site.
- Fixing an obviously wrong description.
- Setting the room on items you just shot, while you remember which room it was.
- Spotting anything that came back unpriced.

### What to leave for the desktop

The full worksheet is a wide grid with fifteen columns, comps beside each row, and filters. It is desktop-first on purpose — a phone cannot show enough of it at once to review two hundred items sensibly.

> Anything you change on the phone is the same claim. There is no separate mobile copy to merge and nothing to sync manually.

---

# Estate sale mode

## Estate sale mode

_The same engine, a different worksheet._

Estate sale mode is for estate-sale companies and liquidators rather than insurance claims. The photo-to-inventory pipeline is identical; what changes is the worksheet and what gets exported.

### What is different

| Insurance worksheet | Estate worksheet |
| --- | --- |
| RCV, depreciation, ACV | Fair market value and sale price |
| Content class | Condition grade |
| Special-limits flags | Status: for sale, sold, keep, donate |
| Xactimate spreadsheet | PDF inventory, .xlsx, or CSV |

### What it is for

Two documents, really: the inventory you show a prospective client when pitching for the sale, and the final record of what actually sold and for how much.

> This is not about estates of the deceased or dividing property among heirs. It is a working tool for people who run sales.

## Fair market value

_Secondary-market pricing, not replacement cost._

Estate mode prices to fair market value — what the item would actually fetch resold — rather than what it would cost to replace new. Those are very different numbers, and using the wrong one misleads a client badly.

### Where the figure comes from

Comps are drawn from completed secondary-market sales rather than retail listings: sold prices, auction results, and resale platforms. The median of the comps becomes the fair market value, and each figure keeps a dated link to the sale behind it.

### Adjusting it

The value cell is fully editable — you will often know a local market better than any comp set does. You can also re-price from the item panel after sharpening the description, and the comps will come back from the same secondary market.

> Condition is yours to set and does not change the value arithmetically. It is a judgment recorded for the client, and you price accordingly.

### Sale price

A separate column records what an item actually sold for. The totals bar shows realized proceeds against the fair market estimate with the variance, which is the number a client asks about first.

## Condition & status

_Grading an item and tracking where it ended up._

Two dropdowns per row, both yours to set.

### Condition

A grade from excellent down to poor, set by you. It does not change the fair market value automatically — a condition grade is a judgment about the object, and you reflect it in the price you set.

### Status

- Unassigned — not yet decided.
- For sale — going into the sale.
- Sold — with the sale price recorded alongside.
- Keep — the client is retaining it.
- Donate — going to donation, often with a value needed for a receipt.

### Totals by status

The totals bar breaks the inventory down by status, all on fair-market basis so the four buckets sum to the total, with realized proceeds shown separately.

> Both fields can be set on many rows at once with the checkbox column, which is much faster after a sale than editing row by row.

---

# Account

## Storage & fair use

_Unlimited claims, a generous item allowance, nothing ever deleted._

Claims are unlimited on every plan — run as many as you like, with no per-claim fee. Two things are metered, because they are the two real variable costs: the line items Kevin prices for you, and the photographs it stores. Neither ever gets in the way of work.

### Line items

- Pro includes 2,000 line items per billing month.
- Additional items are $0.20 each, added to the following invoice.
- A 60-photo kitchen fire is roughly 57 items, so 2,000 covers about thirty-five claims that size in a month.
- Going over never locks a claim or blocks an export — the work finishes, the overage bills after.

> Estate sales are priced separately at $249 per estate rather than against the monthly allowance, because a single estate can run to thousands of items.

### Storage

- Pro includes 500 GB of active storage.
- Closed claims move to archived storage after ninety days. Still fully accessible, marginally slower on first load.
- Going over the pool triggers an email, never a mid-claim lockout.
- Beyond that, additional storage is $19 per month per 500 GB.

> Nothing is ever deleted to reclaim space. Tiering closed claims to archived storage is how the cost is managed — not deletion, and not a cap on claims.

### Where to see it

Billing settings shows both meters — items used against the monthly allowance, and storage used against the pool — the latter derived from the actual photograph count on your account rather than an estimate.

## Billing & plans

_Two plans, flat monthly, and 250 free items to start._

Kevin is a flat monthly subscription, the way you already pay for Xactimate. There is no per-claim charge, no per-seat charge, no per-photo charge, and comps are always included.

### The plans

| Plan | For | Price |
| --- | --- | --- |
| Pro | Content inventory specialists, IAs and public adjusters | $249 / month · unlimited claims · 2,000 line items, then $0.20 an item |
| Enterprise | Carriers, TPAs, and multi-adjuster teams | Custom, volume licensing on one invoice |

### The free tier

Every account starts with 250 free line items — the full product, on real claims, with no time limit. Your card is verified at signup but not charged. Kevin bills you only when you start Pro, either by choosing it in Billing or by continuing past those 250 items; we email you first, and again at 200 items so it is never a surprise.

> The item count is append-only. Deleting a line does not give the quota back, because the pricing lookups behind it are already paid for by the time the row appears.

### Managing it

- Update the card or billing email in Billing settings.
- Download any past invoice as a PDF.
- Cancel whenever you like — you keep access through the period you have paid for.

> Enterprise adds API access, webhooks, team roles, and claim assignment. Everything else is the same product.

## Security & passkeys

_How accounts are protected and what you control._

Data is encrypted with AES-256 at rest and TLS 1.3 in transit. Sign in with an email and password, with Google, or with a passkey.

### Passkeys

A passkey replaces the password with a key held by your device or password manager, so there is nothing phishable. Register one in Settings under Security after your first sign-in.

> Kevin does not use biometrics. Your device may use a fingerprint or face to unlock the key locally, but no biometric data reaches Kevin.

### Active sessions

Security settings lists every signed-in session with device, browser, approximate location, and last activity. You can end any one of them, or end all sessions other than the one you are using — useful if you signed in somewhere you should not have.

### Recovery codes

Download a set of one-time codes and keep them somewhere other than the machine you sign in from. Regenerating invalidates the old set immediately.

## Team & roles

_Enterprise: who can see and do what._

Team management is an Enterprise feature. On Pro you are a single account holder, which is how most independent adjusters and estate-sale professionals work.

### Roles

| Role | Can |
| --- | --- |
| Owner | Everything, including billing and deleting the account |
| Admin | Manage people and settings, no billing |
| Adjuster | Work claims assigned to them |
| Viewer | Read-only, for a supervisor or a desk reviewer |

### Inviting people

Invite by email address and set the role. Invitations expire if unused, and you can revoke one before it is accepted.

### Claim assignment

Claims can be reassigned between people on the account — necessary when someone leaves, goes on leave, or a desk rebalances workload. Reassignment is recorded in the audit log.

> There is no per-seat charge. Enterprise is volume licensing on one invoice.

## API & webhooks

_Enterprise: opening claims and collecting inventories programmatically._

Programmatic access is for carriers, TPAs, and multi-adjuster desks that open claims from their own system and want the finished inventory back automatically. If you work claim by claim in the app, you do not need any of it.

### Keys

Create scoped keys in Settings — read-only for reporting, write access for creating claims. Keys can be rotated or revoked at any time, and rotation is required at least annually.

### Webhooks

Subscribe an endpoint to Kevin lifecycle events rather than polling.

- claim.created — a claim was opened.
- claim.processing.complete — identification and pricing finished.
- claim.item.needs_manual — an item could not be priced confidently.
- claim.status.changed — the status moved.
- export.generated — a spreadsheet, PDF, or bundle was produced.
- export.link.viewed — someone opened a share link.

> Every event describes Kevin’s own work. There is no submit endpoint, because Kevin never writes into a carrier system.

### A typical integration

1. Create the claim with a write-scoped key.
2. Upload photographs to it.
3. Wait for claim.processing.complete.
4. Download the .xlsx and hand it to whatever comes next on your side.

---

# Troubleshooting

## Photos won’t upload

_The handful of things that actually cause this._

Uploads are resumable, so a stalled batch usually finishes itself once whatever interrupted it clears. If it does not, the cause is almost always one of the following.

### Check these first

- File size. Any one photo is capped at 15 MB; there is no total-size cap — Kevin uploads big drops in batches automatically.
- File type. JPG, PNG, and HEIC. A .mov or a RAW file will be rejected.
- A .zip inside a .zip. Only the outer archive is opened.
- Signal. On a phone, photos cache locally and upload when service returns — you can keep shooting.

### HEIC files

iPhone HEIC photos are converted on arrival. You do not need to change your camera setting to JPEG, and conversion does not reduce what Kevin can read.

### A photo uploaded but produced no item

That is normal and not an error. Context shots, model-plate close-ups of an item already counted, and frames too blurry to read all land in the Photos tab as unmatched. If it should have produced an item, add the row by hand and attach the price.

> Still stuck? Email kevin@kevin.co with the claim number. It goes to a person, not a queue.

## An item came back wrong

_Correcting a misidentification, and getting a better price out of it._

Kevin will sometimes read a photograph as "brown leather sofa" when the insured tells you it is an Ethan Allen Conor. The fix is to sharpen the description and re-price against it — not to run identification again, which would see exactly the same photograph.

### The fix

1. Open the item panel from the row number.
2. Click Edit and re-price.
3. Correct the description, make, model, or class.
4. Click re-price. Kevin searches again against the better description and returns a fresh price with fresh comps.

The row is then marked as manually refined, so anyone reading the file later can see a person steered that search rather than a machine guessing.

### If re-pricing finds nothing better

Type the figure in yourself. The row is tagged Manual and you can attach your own proof URL with the plus control in the link column — an appraisal, a receipt, or a listing you found.

> Kevin never re-runs identification on your behalf. A second pass over the same pixels does not know anything new, and it would quietly discard your corrections.

### A wholly wrong item

If the photograph produced something that is not there at all, delete the row. The photograph stays on the claim.

## An export failed

_What a failure means, and what it never means._

An export failure is technical. Something went wrong producing the file: a generation error, a storage read problem, or a share link that could not be minted. Your claim and every line item are untouched.

### What to do

1. Click retry. Most failures are transient and clear on a second attempt.
2. If it fails again, try a different format — a spreadsheet when a bundle fails often points at photo storage rather than the inventory.
3. Quote the reference ID if you email us. It resolves directly to the failed job.

> A failure is never a judgment about whether your inventory is finished. Kevin does not block an export over unpriced rows, missing model numbers, or special-limits classes — it tells you what is there and you decide.

### The export screen flagged things but let me through

That is intentional. Kevin surfaces what needs attention and keeps the download buttons live. You know your claim and your carrier; the software does not get a veto.

## Notifications & alerts

_What Kevin tells you about, and where._

Kevin notifies you about its own work — processing finishing, exports completing, share links being opened — and nothing else. There are no digests and no engagement email.

### What you get

| Event | Why it matters |
| --- | --- |
| Processing complete | The worksheet is ready to review |
| Export ready | The file finished generating |
| Share link opened | Someone received what you sent |
| Export failed | With a reference ID and a retry |
| Special-limits flagged | Items the policy may cap, worth checking before you export |
| Storage nearing the pool | An email first, never a lockout |
| Payment problem | Before anything is interrupted |

### Where they appear

In the bell in the top bar, and by email for anything you would want to know while away from the app. You choose which categories email you in profile settings.

> Processing on a large claim takes several minutes. Turn on the email for it and go do something else — you do not need to watch the screen.

## Glossary

_The terms on every screen, in plain language._

Kevin is used by insurance adjusters and by estate-sale professionals, and each group arrives fluent in half of this vocabulary. Here is all of it.

### Valuation

| Term | Means |
| --- | --- |
| RCV | Replacement cost value — what it costs to buy the item new today. Always a new-replacement price in Kevin, never a used listing. |
| ACV | Actual cash value — replacement cost less depreciation. What the item is worth in its current condition. |
| Unit cost | Replacement cost for one of the item. |
| Extended cost | Unit cost times quantity. |
| FMV | Fair market value — what an item would fetch resold. Used in estate sale mode instead of RCV. |
| LKQ | Like kind and quality — pricing the nearest equivalent still sold new when the exact model is discontinued. |

### Depreciation

| Term | Means |
| --- | --- |
| Depreciation | The value lost to age and wear, as a percentage and a dollar figure. |
| Straight-line | Age divided by useful life. Kevin’s default method. |
| Bracketed | A percentage looked up by class and age band rather than calculated. |
| Useful life | How many years an item of that class is expected to last. Internal to the math, never an export column. |
| Salvage floor | The cap that stops something old depreciating to nothing. |

### Coverage

| Term | Means |
| --- | --- |
| Personal property limit | The cap on contents coverage. Named Coverage C, Coverage B, Contents, or Personal Property depending on the policy. |
| Special limits | Categories a policy caps regardless of value — usually jewelry, firearms, fine arts, and furs. |
| Declarations page | The policy summary that names the coverage and states the limit. |

### In Kevin

| Term | Means |
| --- | --- |
| Content class | The category an item belongs to. Drives the depreciation math and the export category code. |
| Photo set | Several photographs of the same object, grouped so they produce one line item. |
| Comp | A comparable listing Kevin found, with a price and a dated link. |
| Proof link | The link to the comp a price came from. Prints on the export. |
| Unpriced | An item Kevin declined to price. The cell is blank and editable. |
| Manual | A row whose price you typed rather than took from a comp. |
| XactContents | The contents module of Xactimate. Imports the spreadsheet Kevin produces. |

### Estate sale

| Term | Means |
| --- | --- |
| Condition grade | Your assessment of the object, from excellent to poor. Set by you, not calculated. |
| Status | Where an item ended up: for sale, sold, keep, or donate. |
| Realized | What items actually sold for, against the fair market estimate. |
