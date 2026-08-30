// Docs content · part 1 of 2 — Getting started + Worksheet.
// Articles are DATA, not markup, so they can be lifted into GitBook or a CMS
// without rewriting anything. Block tuples: ['p'|'h2'|'ul'|'ol'|'note'|'code'|'table', payload].
// Renderer lives in docs.jsx. Part 2 is docs-articles-2.jsx.

const DOC_ARTICLES_A = {

  'quick-start': {
    title: 'Quick start',
    summary: 'The whole loop in five minutes: claim in, photos in, inventory out.',
    blocks: [
      ['p', 'Kevin turns a folder of photographs into a defensible personal-property inventory. You start a claim, drop the photos, let Kevin identify and price each item, review the worksheet, and export a file. Nothing is submitted anywhere on your behalf — you send what you export.'],
      ['h2', 'The five steps'],
      ['ol', [
        'Start a claim. Claim and policy numbers, date and cause of loss, the insured, the loss address, and the contents coverage limit.',
        'Drop the photos. A folder, a phone dump, or a whole .zip — no total-size cap, up to 15 MB per photo. Duplicates are removed as they arrive.',
        'Review the photo sets. Kevin groups shots taken seconds apart into one set. Merge, split, or exclude before anything is identified.',
        'Let Kevin work. Identification, make and model, content class, three live price comps per item, depreciation from the claim schedule.',
        'Review and export. Every cell is editable. Export the Xactimate spreadsheet, a client PDF, or the full bundle.',
      ]],
      ['h2', 'How long it takes'],
      ['table', [
        ['Step', 'A 44-item claim'],
        ['Intake', 'About a minute'],
        ['Upload + staging', 'A minute or two for 50 photos'],
        ['Processing', 'Around eight minutes, unattended'],
        ['Your review', 'Twenty to forty minutes'],
        ['Export', 'Under a minute'],
      ]],
      ['note', 'Every account starts with 250 free line items — full product, real claims, no time limit. Card verified at signup, not charged until you start Pro.'],
    ],
  },

  'first-claim': {
    title: 'Creating your first claim',
    summary: 'What every intake field does, and why the ZIP matters more than it looks.',
    blocks: [
      ['p', 'From My claims, click New claim. Intake is a single form and every field stays editable later, so do not stall on anything you can look up afterwards.'],
      ['h2', 'Claim details'],
      ['ul', [
        'Claim number and policy number — both print on the export, so they are worth getting right.',
        'Date of loss and cause of loss — cause drives nothing automatically; it is documentation.',
        'Carrier — pick from the list, or add your own. Kevin has no relationship with any carrier and no special behavior per carrier.',
        'Insured name — the person whose property this is. This is not you; your name travels separately as the preparer.',
      ]],
      ['h2', 'The loss address'],
      ['p', 'Enter the street, city, state, and ZIP of the loss. The ZIP resolves the sales-tax rate applied to every line item, which is why the address and the tax rate must always agree. If the ZIP does not resolve, Kevin falls back to the default rate in your settings and tells you.'],
      ['h2', 'Contents coverage'],
      ['p', 'Policies name contents coverage differently — Coverage C, Personal Property, Contents, Coverage B on a renters policy, Business Personal Property on a commercial one. Pick the label off the declarations page and enter the limit. Kevin then shows a meter as the inventory approaches that number, turning amber at 80% and red over the limit.'],
      ['note', 'Enter any prior contents payment in "already claimed" so the meter reflects what is actually left.'],
      ['h2', 'Processing settings'],
      ['ul', [
        'Depreciation schedule — straight-line by default. You can add your own schedule here.',
        'Default condition — the starting condition grade for every item, which you override per row.',
      ]],
    ],
  },

  'uploading-photos': {
    title: 'Uploading photos',
    summary: 'Formats, size limits, dedupe, and how to shoot so Kevin reads well.',
    blocks: [
      ['p', 'Drag any combination of JPG, PNG, or HEIC files, a folder, or a whole .zip — no total-size cap, up to 15 MB per photo. iPhone HEIC files are converted on arrival — you do not need to change your camera settings.'],
      ['h2', 'Duplicates'],
      ['p', 'Every file is hashed as it uploads. Byte-identical files — the same shot uploaded twice, a burst frame copied into the folder — are discarded, keeping one. This matters because an uncaught duplicate becomes a duplicate line item, which is exactly what a carrier flags.'],
      ['note', 'Hashing only catches identical files. Two separate photos of the same television are different files, so they are handled by photo-set grouping in the next step.'],
      ['h2', 'How to shoot'],
      ['ul', [
        'One item per photo. Kevin reads a single item per photograph, so a wide shot of a full room produces one item, not twelve.',
        'Take the model plate. A second photo of the sticker or barcode gets you an exact model number, which produces a much tighter price.',
        'Shoot from a step back, then close. Kevin groups the pair automatically.',
        'Context shots are fine. Mark them skipped in staging and they cost you nothing.',
      ]],
      ['h2', 'From the field'],
      ['p', 'The mobile capture screen sends photos straight from your phone to the claim, with an optional note attached to the set you are shooting. Nothing needs to sync through your desktop.'],
    ],
  },

  'photo-sets': {
    title: 'Reviewing photo sets',
    summary: 'Kevin proposes the grouping; you approve it before anything is identified.',
    blocks: [
      ['p', 'Between upload and processing, Kevin proposes photo sets: shots taken within seconds of each other, in the same place, are almost always the same object. Three angles of a sofa become one line item rather than three. A lone photo is simply a set of one.'],
      ['note', 'This screen runs before identification. It shows filenames, timestamps, and how far apart the shots were — not item names, because nothing has been identified yet.'],
      ['h2', 'What you can change'],
      ['ul', [
        'Merge — select two or more sets that belong to the same object and combine them.',
        'Split — break a set apart when Kevin grouped two different objects shot back to back.',
        'Skip — mark context shots, blurry frames, or anything you do not want counted.',
      ]],
      ['h2', 'The tally'],
      ['p', 'The counter shows photo sets, not line items — 50 photos might propose 47 sets. The item count is not known until identification runs, and it will be lower still once unmatched and context photos fall out.'],
      ['h2', 'Notes that steer identification'],
      ['p', 'You can attach a note of up to 120 characters to any set. It rides on the whole set and steers what Kevin looks for: "the TV is the Sony, not the Samsung," or "this is the mahogany one, not the veneer." Notes influence identification only — they never affect price.'],
      ['note', 'Notes are pre-processing only. If an item comes back misidentified, correct it by editing the worksheet row, not by re-running identification.'],
    ],
  },

  'reviewing-worksheet': {
    title: 'Reviewing the worksheet',
    summary: 'What arrives filled in, what needs you, and the order to work in.',
    blocks: [
      ['p', 'Processing drops you into a single editable grid — one row per item, every cell yours to change. There is no wizard and no locked step. What Kevin found is all in front of you at once.'],
      ['h2', 'What arrives filled in'],
      ['ul', [
        'Description, make, and model number where they were legible.',
        'Content class, which drives the depreciation math.',
        'Unit cost, from the median of three live retail comps, with a dated link to the comp behind it.',
        'Age and depreciation percent, from the schedule on the claim.',
      ]],
      ['h2', 'What needs you'],
      ['ul', [
        'Room or area — Kevin does not know which room a photo was taken in. This is free text and filterable.',
        'Quantity, where one photo represents several identical items.',
        'Anything left blank. When Kevin cannot find a confident comp it leaves the price empty rather than guessing.',
        'Anything it got wrong. Fix the description and re-price against fresh comps.',
      ]],
      ['h2', 'A working order that saves time'],
      ['ol', [
        'Filter by room and fill the room column in blocks — it is faster than jumping around.',
        'Sort or filter to the unpriced rows and clear those first; they are the ones that hold up an export.',
        'Pin the item panel and tab down the grid, checking each photo against its description.',
        'Check the special-limits flags last, against the policy.',
      ]],
    ],
  },

  'exporting-xactimate': {
    title: 'Exporting to Xactimate',
    summary: 'The spreadsheet route into XactContents, start to finish.',
    blocks: [
      ['p', 'Xactimate does not accept an XML upload for contents. XactContents imports a pre-formatted Excel spreadsheet, and that is exactly what Kevin produces — matching column order, so it imports without cleanup.'],
      ['h2', 'Steps'],
      ['ol', [
        'In the worksheet, click Export claim.',
        'Choose Xactimate (Excel) and download the .xlsx.',
        'In Xactimate desktop, open your estimate and go to the XactContents tab.',
        'Click Import from Excel, choose the file, and import. Make sure the file is closed first.',
      ]],
      ['note', 'Kevin never pushes into Xactimate or a carrier system. You download the file and import it yourself, which means nothing moves without your say.'],
      ['h2', 'Columns in the file'],
      ['p', 'Number, room or area, quantity, description, make and model, unit cost, extended cost, sales tax, RCV plus tax, age, percent depreciation, dollar depreciation, and ACV. Age prints as a bare number so it lands numeric in Excel, and tax is per line item rather than only as a claim total.'],
      ['h2', 'If something looks off after import'],
      ['ul', [
        'Blank prices mean the item was unpriced in Kevin. Fill those in before exporting.',
        'Numbers stored as text usually means the file was open in Excel when you imported it.',
      ]],
    ],
  },

  'editing-cells': {
    title: 'Editing cells',
    summary: 'Which cells you type in, which are calculated, and how the money chain foots.',
    blocks: [
      ['p', 'Click any editable cell and type. There is no edit mode to enter and no save button — changes commit when you leave the cell, and every one is recorded in the audit log.'],
      ['h2', 'Editable versus calculated'],
      ['table', [
        ['Editable', 'Calculated'],
        ['Room / area', 'Extended cost'],
        ['Quantity', 'RCV + tax'],
        ['Description, make, model', 'Dollar depreciation'],
        ['Content class', 'ACV'],
        ['Unit cost', ''],
        ['Age, percent depreciation', ''],
      ]],
      ['h2', 'How the money foots'],
      ['code', 'Extended cost  = Unit cost x Quantity\nRCV + Tax      = Extended cost + (Extended cost x tax rate)\n$ Depreciation = Extended cost x % Depreciation\nACV            = Extended cost + Tax - $ Depreciation'],
      ['p', 'Tax sits inside ACV, and the columns foot left to right. Change a unit cost and everything to its right follows.'],
      ['h2', 'Keyboard'],
      ['ul', [
        'Tab and arrows move between cells.',
        'Enter on the last row appends a new blank row, so you can add items without touching the mouse.',
        'Money cells clear when you focus them — type the new figure straight in. Leave without typing and the old value returns.',
      ]],
      ['h2', 'Column widths'],
      ['p', 'Drag a header boundary to resize a column, like a spreadsheet. Double-click a boundary to reset it.'],
    ],
  },

  'bulk-actions': {
    title: 'Bulk actions',
    summary: 'Change or remove many rows at once with the checkbox column.',
    blocks: [
      ['p', 'Tick the checkbox on any row and an action bar appears showing how many rows are selected. Ticking is selection only — it does not open anything or change the item panel.'],
      ['h2', 'Re-categorize'],
      ['p', 'Sets the content class on every selected row. Because class drives depreciation, each affected row then waits briefly for the server to return a new percentage, and the cell flashes when it lands. Unpriced rows are skipped — they carry no depreciation to recalculate.'],
      ['h2', 'Delete'],
      ['p', 'Removes the selected rows from the inventory after a confirmation. The source photos stay on the claim, so nothing is lost and you can add the item back by hand.'],
      ['h2', 'Add item'],
      ['p', 'Appends a blank row at the end and puts the cursor in it. Pressing Enter on the last row does the same thing. A row you add by hand was never seen by identification and never priced, so it is tagged Manual and you enter the value yourself.'],
      ['note', 'There is no bulk re-run of identification. If items came back wrong, edit the descriptions and re-price — a second identification pass would not know anything new.'],
    ],
  },

  'search-filter': {
    title: 'Search & filter',
    summary: 'Narrowing 142 rows to the handful you are working on.',
    blocks: [
      ['p', 'Search matches description, make, model, content class, and room at once. Type "sony" to see every Sony item; type "kitchen" to see everything you have assigned to the kitchen.'],
      ['h2', 'The filter popover'],
      ['ul', [
        'Room — free text, so it matches whatever names you typed.',
        'Barcode matched — items where a barcode or model sticker was read, which are your most reliable rows.',
        'Special limits — classes the policy may cap.',
        'Low confidence — where identification was least certain.',
        'High value — items over a threshold, useful for a final pass.',
      ]],
      ['h2', 'Group by class'],
      ['p', 'Toggling group by class sections the grid by content class with a subtotal on each group. This is the fastest way to sanity-check a claim: if Electronics totals more than the whole rest of the house, something is wrong.'],
      ['h2', 'What filters do not do'],
      ['p', 'Filtering changes what you see, never what exports. The export always contains the full inventory unless you deleted rows.'],
    ],
  },

  'content-classes': {
    title: 'Content classes',
    summary: 'What the class column is for and why it changes the numbers.',
    blocks: [
      ['p', 'Every item carries a content class — Electronics, Furniture, Clothing, Jewelry, and so on. The class is not decoration: it selects the useful life used to depreciate the item, and it maps to the category code in the exported spreadsheet.'],
      ['h2', 'Changing a class'],
      ['p', 'Click the class cell and a searchable list opens showing all classes with the current one ticked. Type to narrow it, or scroll the full list if you are not sure what exists. Picking a new class sends the row for recalculation, and the depreciation cell shows a spinner until the answer comes back.'],
      ['note', 'The depreciation percentage is calculated on the server, never in your browser. That is deliberate: it guarantees the figure in your worksheet is the figure in the exported file, to the penny.'],
      ['h2', 'Useful life'],
      ['p', 'Each class carries a standard useful life — five years for electronics, fifteen for furniture, three for children\u2019s clothing. Straight-line depreciation divides the item\u2019s age by that life. Useful life is internal to the math and never printed as a column on an export.'],
      ['h2', 'Classes Kevin will not auto-price'],
      ['p', 'Jewelry, fine arts, firearms, and furs come back unpriced regardless of what a search might turn up. These need an appraisal or your own judgment, and a machine-picked comparable would not hold up.'],
    ],
  },

  'depreciation-overrides': {
    title: 'Depreciation overrides',
    summary: 'Three methods, one cap, and what happens when you type over the number.',
    blocks: [
      ['p', 'Depreciation arrives already calculated from the schedule attached to the claim. You can override any percentage by typing over it.'],
      ['h2', 'The three methods'],
      ['table', [
        ['Method', 'How it works'],
        ['Straight-line (default)', 'Age divided by the useful life for the class, capped so a salvage floor remains.'],
        ['Bracketed', 'A percentage looked up by class and age band — under 1 year, 1 to 2, 3 to 5, 6 to 10, 11 to 15, over 15.'],
        ['Custom', 'Percentages you enter yourself.'],
      ]],
      ['h2', 'The cap'],
      ['p', 'Straight-line is capped at 90%, so a twenty-year-old five-year-life item does not depreciate to nothing. Something old and still present has salvage value, and a carrier will expect to see it.'],
      ['h2', 'Overriding'],
      ['p', 'Type a percentage into the cell and it stops following the schedule — the row is marked as manually set, and the change is recorded with your name and the time. Click the information icon in the cell to see how the figure was reached: the method, the useful life, the age, and whether the cap applied.'],
      ['note', 'Unpriced items stay at zero percent. There is no price to depreciate, so a percentage would be meaningless.'],
      ['h2', 'Adding your own schedule'],
      ['p', 'On intake, choose Add new schedule to define one: a name, the method, useful life by class, and a maximum. It is then selectable on any future claim.'],
    ],
  },

  'rcv-comps': {
    title: 'RCV comps & proof links',
    summary: 'Where the price came from, how to switch it, and what prints on the export.',
    blocks: [
      ['p', 'Every comp Kevin finds comes from one place: Google Shopping and the Google Immersive Product API, which already spans major retailers, specialty stores, brand-direct storefronts, and marketplaces. There is no list of individual stores to maintain or switch on.'],
      ['h2', 'How the price is chosen'],
      ['p', 'Kevin keeps the top three merchant offers for an item and takes the median as the replacement cost. The median is deliberately dull: it resists a single mispriced listing in either direction. When offers disagree by more than 15%, the manufacturer\u2019s own price is weighted to settle it.'],
      ['h2', 'Switching comps'],
      ['p', 'Click a unit cost cell and all three comps open — merchant, title, price, and a link to the listing. Pick a different one and the price changes, and so does the proof link on that row. The link always points at the comp actually behind the price.'],
      ['h2', 'The proof link'],
      ['p', 'The last column carries a link labelled Link, which opens the listing the price came from. It prints into both the spreadsheet and the PDF, which is what makes a figure defensible months later. If you type a price by hand, the link is blank — an invented price has no source to cite, and you can attach your own with the plus control.'],
      ['note', 'Kevin stores the URL and the date it was fetched, not a snapshot of the page. A dead link a year on still shows what was checked and when.'],
      ['h2', 'Like kind and quality'],
      ['p', 'When the exact model is discontinued, Kevin prices the nearest equivalent still sold new and records the substitution on the row, visible in the item panel. Replacement cost always holds a new-replacement price — never a used listing, which has already lost value once and would be depreciated a second time.'],
    ],
  },

  'unpriced-items': {
    title: 'Unpriced items',
    summary: 'Why some cells arrive blank, and what to do with them.',
    blocks: [
      ['p', 'When Kevin cannot find a confident replacement price, the cell arrives empty rather than filled with a guess. A wrong number that looks authoritative is worse than an obvious gap, because nobody checks it.'],
      ['h2', 'Why an item comes back blank'],
      ['ul', [
        'The class requires judgment — jewelry, fine arts, firearms, furs.',
        'Too few comparable listings to trust a median.',
        'Nothing matched at all: a handmade piece, something very old, or a photo that was not readable.',
      ]],
      ['h2', 'What a blank row looks like'],
      ['p', 'The unit cost cell is simply empty and editable. Everything derived from it shows a dash and contributes nothing to the claim totals. There is no badge, no warning, and no approval step — you type the price in like any other cell.'],
      ['note', 'Dollar amount has nothing to do with it. A ten-thousand-dollar sofa prices normally if the comps are there. Kevin only declines when it genuinely does not know.'],
      ['h2', 'Filling it in'],
      ['ul', [
        'Type a figure. The row is tagged Manual and you can attach a proof URL with the plus control.',
        'Or open the item panel, sharpen the description, and re-price — a better description often finds comps where a vague one did not.',
      ]],
      ['h2', 'Exporting with blanks'],
      ['p', 'Kevin will not block an export over unpriced rows. The export screen tells you how many there are and you decide whether to proceed. Blank prices export as zero so spreadsheet formulas do not break.'],
    ],
  },

  'special-limits': {
    title: 'Special-limits flags',
    summary: 'An amber row means check the policy, not that something is wrong.',
    blocks: [
      ['p', 'Most policies cap certain categories regardless of what the items are worth — jewelry, firearms, fine arts, and furs are the usual four, often at a couple of thousand dollars per item or in total. Kevin flags rows in those classes in amber so you check the cap before the inventory goes out.'],
      ['h2', 'What the flag does'],
      ['ul', [
        'Tints the row and badges the class cell.',
        'Appears in the filter, so you can see all flagged rows together.',
        'Shows in the export summary as a count.',
      ]],
      ['h2', 'What it does not do'],
      ['p', 'It does not block anything, change any number, or stop an export. It is a reminder to look at the declarations page — the actual cap varies by policy and Kevin does not presume to know it.'],
      ['note', 'A special-limits flag is not the same as an unpriced item, though they often coincide. The flag is about coverage; unpriced is about whether Kevin could find a price.'],
    ],
  },

  'item-panel': {
    title: 'The item panel',
    summary: 'The photo, the comps, and the math for one row — docked beside the grid.',
    blocks: [
      ['p', 'Click a row number to open the item panel. It shows the source photograph, the editable fields, the comps behind the price with their links, any like-kind substitution note, and the computed totals for that row.'],
      ['h2', 'Docking it'],
      ['p', 'The pin in the panel header docks it to a rail on the right of the grid, where it stays open. Once docked it follows you: click or tab into any row and the panel swaps to that item. For a long claim this is the fastest way to check every photograph against its description. Unpin to return it to a centered dialog.'],
      ['note', 'The Item panel button in the toolbar opens the docked panel directly, without going through a row first.'],
      ['h2', 'Edit and re-price'],
      ['p', 'The most useful control in the panel. Kevin might have read a photograph as "brown leather sofa" when you know from the insured that it is an Ethan Allen Conor. Sharpen the description, click re-price, and Kevin searches again against the better description and returns a fresh price with fresh comps. The row is then marked as manually refined, so anyone reading the file later can see a person steered that search.'],
      ['h2', 'Moving between items'],
      ['p', 'The arrows in the header step to the previous or next row without closing the panel.'],
    ],
  },

};

window.DOC_ARTICLES_A = DOC_ARTICLES_A;
