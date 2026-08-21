// Docs content · part 3 of 3 — In the field, audit log & photos, Troubleshooting, Glossary.
// Same block-tuple shape as docs-articles.jsx. Renderer lives in docs.jsx.

const DOC_ARTICLES_C = {

  'mobile-capture': {
    title: 'Capturing from your phone',
    summary: 'Shooting straight into a claim, without a trip through your desktop.',
    blocks: [
      ['p', 'Open Kevin in your phone browser and photos go straight into the claim you have open. There is nothing to import later and nothing to keep track of on a memory card.'],
      ['h2', 'How it works'],
      ['ol', [
        'Sign in on your phone and pick the claim, or scan the pairing code from your desktop.',
        'Tap the shutter and shoot. Each frame uploads as you go.',
        'The counter shows how many photos are on the claim so far.',
      ]],
      ['h2', 'Your camera roll'],
      ['p', 'Photos go from the camera into the claim without being saved to your personal camera roll. That is deliberate: an adjuster does not want two hundred photographs of somebody else\u2019s fire-damaged kitchen sitting in their phone gallery.'],
      ['note', 'If you would rather use the phone camera app and upload afterwards, that works too — select the photos from your library like any other upload.'],
      ['h2', 'Bad signal'],
      ['p', 'Photos are cached locally when the connection drops and upload themselves once you have service again. You can keep shooting the whole time. Nothing is lost if you walk out of a basement mid-claim.'],
      ['h2', 'What to shoot'],
      ['ul', [
        'One item per photo — Kevin reads a single item per frame.',
        'A second shot of the model plate or barcode whenever there is one.',
        'A step-back shot then a close-up. Kevin groups the pair for you.',
      ]],
    ],
  },

  'mobile-pairing': {
    title: 'Pairing a phone to a claim',
    summary: 'Getting the right claim on the phone in a few seconds.',
    blocks: [
      ['p', 'Pairing points your phone at one specific claim, so you cannot accidentally shoot a kitchen fire into last week\u2019s water loss.'],
      ['h2', 'Two ways in'],
      ['ul', [
        'Scan the code. Open the claim on your desktop, show the pairing code, and scan it with your phone camera. The claim opens already selected.',
        'Sign in on the phone. Sign in and pick the claim from your list. Slower, but it works with no desktop nearby.',
      ]],
      ['h2', 'What the code does'],
      ['p', 'It confirms the phone is yours and selects the claim. It expires shortly after being shown, and showing a new one invalidates the old one.'],
      ['note', 'A paired phone stays on that claim until you switch. Check the claim name in the header before a long shoot — it is the one mistake that costs real time to unpick.'],
      ['h2', 'Signing in on a phone'],
      ['p', 'Email and password, Google, or a passkey — the same three options as the desktop. Kevin does not use biometrics; if your phone asks for a fingerprint it is unlocking a passkey locally and nothing reaches Kevin.'],
    ],
  },

  'mobile-notes': {
    title: 'Notes while you shoot',
    summary: 'Telling Kevin what it is looking at before it looks.',
    blocks: [
      ['p', 'While shooting you can attach a short note to the set you are capturing — up to 300 characters of additional identification Kevin reads when it processes the batch.'],
      ['h2', 'What a good note looks like'],
      ['ul', [
        '"Sony, not the Samsung next to it"',
        '"Solid mahogany, not veneer"',
        '"Custom built-in, no model number"',
        '"Insured says purchased 2019"',
      ]],
      ['h2', 'What a note cannot do'],
      ['p', 'Notes influence identification only. They never set or adjust a price, and they do not carry into the export as a field. If you need a price to be a particular figure, type it into the worksheet.'],
      ['note', 'Notes are pre-processing. Once a batch has been identified, a note will not change anything — correct the worksheet row instead.'],
      ['h2', 'Where notes end up'],
      ['p', 'The note travels with the whole set, so every photo in that set inherits it. You will see it again on the staging screen before you press process, where you can edit or remove it.'],
    ],
  },

  'mobile-review': {
    title: 'Reviewing on mobile',
    summary: 'What you can usefully do on a phone, and what to leave for the desk.',
    blocks: [
      ['p', 'The mobile review screen shows what Kevin found — one item at a time, with its photo, description, and price. It is built for checking work in a truck, not for doing the full review.'],
      ['h2', 'What works well on a phone'],
      ['ul', [
        'Confirming an identification against the photo while you are still on site.',
        'Fixing an obviously wrong description.',
        'Setting the room on items you just shot, while you remember which room it was.',
        'Spotting anything that came back unpriced.',
      ]],
      ['h2', 'What to leave for the desktop'],
      ['p', 'The full worksheet is a wide grid with fifteen columns, comps beside each row, and filters. It is desktop-first on purpose — a phone cannot show enough of it at once to review two hundred items sensibly.'],
      ['note', 'Anything you change on the phone is the same claim. There is no separate mobile copy to merge and nothing to sync manually.'],
    ],
  },

  'audit-log': {
    title: 'The audit log',
    summary: 'Who changed what, when — the part that makes a file defensible.',
    blocks: [
      ['p', 'Every claim keeps a timeline of everything that happened to it: creation, upload, processing, every cell edit, every price override, every export. Entries carry the person, the field, the old value, the new value, and a timestamp.'],
      ['h2', 'What gets recorded'],
      ['ul', [
        'Claim created, and any change to the claim details.',
        'Photos uploaded, and photo sets merged, split, or skipped.',
        'Processing started and finished, with the item count.',
        'Every field edit on every row, including which comp was selected for a price.',
        'Depreciation overrides, flagged as manually set rather than schedule-derived.',
        'Rows added or deleted.',
        'Exports produced, share links minted, and share links opened.',
      ]],
      ['h2', 'Why it matters'],
      ['p', 'A year after a claim closes, nobody remembers why a figure was changed. The log answers that without anyone having to. When a carrier questions a number, the log shows whether it came from a comp or from a person, and who that person was.'],
      ['note', 'The log is a record, not a conversation. There is no commenting, no mentions, and no message thread — those were considered and left out.'],
      ['h2', 'Reading it'],
      ['p', 'Open the Audit tab on any claim. Filter by person, by event type, or by date. It is a single timeline rather than a per-row history, so you read a claim chronologically.'],
      ['h2', 'Exporting it'],
      ['p', 'The full bundle includes the audit log as a file. That is the main reason to take the bundle rather than just the spreadsheet.'],
    ],
  },

  'photos-tab': {
    title: 'The Photos tab',
    summary: 'Every photograph on the claim, and which item each one backs.',
    blocks: [
      ['p', 'The Photos tab shows every photograph uploaded to the claim, whether or not it produced a line item. It is where you go when a number looks wrong and you want to see the source.'],
      ['h2', 'What each photo shows'],
      ['ul', [
        'The item it backs, if any — at most one, because Kevin reads a single item per frame.',
        'Its status: matched, unmatched, a context shot, or a duplicate removed at upload.',
        'The room, once you have assigned one on the worksheet.',
        'Capture metadata: device, time, and whether the file carried location data.',
      ]],
      ['h2', 'Why photos outnumber items'],
      ['p', 'A 162-photo claim typically yields fewer items — some photos are context shots, some are model-plate close-ups of an item already counted, some are unmatched or too blurry to read, and a few are duplicates. Items are always fewer than photos, never more.'],
      ['h2', 'Filters'],
      ['ul', [
        'By status, to find everything unmatched in one pass.',
        'By room, to check a room\u2019s coverage before leaving a site.',
        'By capture device, useful when two people shot the same job.',
      ]],
      ['note', 'Deleting a line item does not delete its photograph. The photo stays on the claim, so you can add the item back or price it differently.'],
    ],
  },

  'trouble-upload': {
    title: 'Photos won\u2019t upload',
    summary: 'The handful of things that actually cause this.',
    blocks: [
      ['p', 'Uploads are resumable, so a stalled batch usually finishes itself once whatever interrupted it clears. If it does not, the cause is almost always one of the following.'],
      ['h2', 'Check these first'],
      ['ul', [
        'File size. Any one photo is capped at 15 MB; there is no total-size cap — Kevin uploads big drops in batches automatically.',
        'File type. JPG, PNG, and HEIC. A .mov or a RAW file will be rejected.',
        'A .zip inside a .zip. Only the outer archive is opened.',
        'Signal. On a phone, photos cache locally and upload when service returns — you can keep shooting.',
      ]],
      ['h2', 'HEIC files'],
      ['p', 'iPhone HEIC photos are converted on arrival. You do not need to change your camera setting to JPEG, and conversion does not reduce what Kevin can read.'],
      ['h2', 'A photo uploaded but produced no item'],
      ['p', 'That is normal and not an error. Context shots, model-plate close-ups of an item already counted, and frames too blurry to read all land in the Photos tab as unmatched. If it should have produced an item, add the row by hand and attach the price.'],
      ['note', 'Still stuck? Email kevin@kevin.co with the claim number. It goes to a person, not a queue.'],
    ],
  },

  'trouble-wrong-item': {
    title: 'An item came back wrong',
    summary: 'Correcting a misidentification, and getting a better price out of it.',
    blocks: [
      ['p', 'Kevin will sometimes read a photograph as "brown leather sofa" when the insured tells you it is an Ethan Allen Conor. The fix is to sharpen the description and re-price against it — not to run identification again, which would see exactly the same photograph.'],
      ['h2', 'The fix'],
      ['ol', [
        'Open the item panel from the row number.',
        'Click Edit and re-price.',
        'Correct the description, make, model, or class.',
        'Click re-price. Kevin searches again against the better description and returns a fresh price with fresh comps.',
      ]],
      ['p', 'The row is then marked as manually refined, so anyone reading the file later can see a person steered that search rather than a machine guessing.'],
      ['h2', 'If re-pricing finds nothing better'],
      ['p', 'Type the figure in yourself. The row is tagged Manual and you can attach your own proof URL with the plus control in the link column — an appraisal, a receipt, or a listing you found.'],
      ['note', 'Kevin never re-runs identification on your behalf. A second pass over the same pixels does not know anything new, and it would quietly discard your corrections.'],
      ['h2', 'A wholly wrong item'],
      ['p', 'If the photograph produced something that is not there at all, delete the row. The photograph stays on the claim.'],
    ],
  },

  'trouble-export': {
    title: 'An export failed',
    summary: 'What a failure means, and what it never means.',
    blocks: [
      ['p', 'An export failure is technical. Something went wrong producing the file: a generation error, a storage read problem, or a share link that could not be minted. Your claim and every line item are untouched.'],
      ['h2', 'What to do'],
      ['ol', [
        'Click retry. Most failures are transient and clear on a second attempt.',
        'If it fails again, try a different format — a spreadsheet when a bundle fails often points at photo storage rather than the inventory.',
        'Quote the reference ID if you email us. It resolves directly to the failed job.',
      ]],
      ['note', 'A failure is never a judgment about whether your inventory is finished. Kevin does not block an export over unpriced rows, missing model numbers, or special-limits classes — it tells you what is there and you decide.'],
      ['h2', 'The export screen flagged things but let me through'],
      ['p', 'That is intentional. Kevin surfaces what needs attention and keeps the download buttons live. You know your claim and your carrier; the software does not get a veto.'],
    ],
  },

  'notifications': {
    title: 'Notifications & alerts',
    summary: 'What Kevin tells you about, and where.',
    blocks: [
      ['p', 'Kevin notifies you about its own work — processing finishing, exports completing, share links being opened — and nothing else. There are no digests and no engagement email.'],
      ['h2', 'What you get'],
      ['table', [
        ['Event', 'Why it matters'],
        ['Processing complete', 'The worksheet is ready to review'],
        ['Export ready', 'The file finished generating'],
        ['Share link opened', 'Someone received what you sent'],
        ['Export failed', 'With a reference ID and a retry'],
        ['Special-limits flagged', 'Items the policy may cap, worth checking before you export'],
        ['Storage nearing the pool', 'An email first, never a lockout'],
        ['Payment problem', 'Before anything is interrupted'],
      ]],
      ['h2', 'Where they appear'],
      ['p', 'In the bell in the top bar, and by email for anything you would want to know while away from the app. You choose which categories email you in profile settings.'],
      ['note', 'Processing on a large claim takes several minutes. Turn on the email for it and go do something else — you do not need to watch the screen.'],
    ],
  },

  'glossary': {
    title: 'Glossary',
    summary: 'The terms on every screen, in plain language.',
    blocks: [
      ['p', 'Kevin is used by insurance adjusters and by estate-sale professionals, and each group arrives fluent in half of this vocabulary. Here is all of it.'],
      ['h2', 'Valuation'],
      ['table', [
        ['Term', 'Means'],
        ['RCV', 'Replacement cost value — what it costs to buy the item new today. Always a new-replacement price in Kevin, never a used listing.'],
        ['ACV', 'Actual cash value — replacement cost less depreciation. What the item is worth in its current condition.'],
        ['Unit cost', 'Replacement cost for one of the item.'],
        ['Extended cost', 'Unit cost times quantity.'],
        ['FMV', 'Fair market value — what an item would fetch resold. Used in estate sale mode instead of RCV.'],
        ['LKQ', 'Like kind and quality — pricing the nearest equivalent still sold new when the exact model is discontinued.'],
      ]],
      ['h2', 'Depreciation'],
      ['table', [
        ['Term', 'Means'],
        ['Depreciation', 'The value lost to age and wear, as a percentage and a dollar figure.'],
        ['Straight-line', 'Age divided by useful life. Kevin\u2019s default method.'],
        ['Bracketed', 'A percentage looked up by class and age band rather than calculated.'],
        ['Useful life', 'How many years an item of that class is expected to last. Internal to the math, never an export column.'],
        ['Salvage floor', 'The cap that stops something old depreciating to nothing.'],
      ]],
      ['h2', 'Coverage'],
      ['table', [
        ['Term', 'Means'],
        ['Personal property limit', 'The cap on contents coverage. Named Coverage C, Coverage B, Contents, or Personal Property depending on the policy.'],
        ['Special limits', 'Categories a policy caps regardless of value — usually jewelry, firearms, fine arts, and furs.'],
        ['Declarations page', 'The policy summary that names the coverage and states the limit.'],
      ]],
      ['h2', 'In Kevin'],
      ['table', [
        ['Term', 'Means'],
        ['Content class', 'The category an item belongs to. Drives the depreciation math and the export category code.'],
        ['Photo set', 'Several photographs of the same object, grouped so they produce one line item.'],
        ['Comp', 'A comparable listing Kevin found, with a price and a dated link.'],
        ['Proof link', 'The link to the comp a price came from. Prints on the export.'],
        ['Unpriced', 'An item Kevin declined to price. The cell is blank and editable.'],
        ['Manual', 'A row whose price you typed rather than took from a comp.'],
        ['XactContents', 'The contents module of Xactimate. Imports the spreadsheet Kevin produces.'],
      ]],
      ['h2', 'Estate sale'],
      ['table', [
        ['Term', 'Means'],
        ['Condition grade', 'Your assessment of the object, from excellent to poor. Set by you, not calculated.'],
        ['Status', 'Where an item ended up: for sale, sold, keep, or donate.'],
        ['Realized', 'What items actually sold for, against the fair market estimate.'],
      ]],
    ],
  },

  'holdback-recovery': {
    title: 'Recovering your holdback',
    summary: 'Turn replaced items into a recovery request the carrier desk can pay.',
    blocks: [
      ['p', 'On an RCV policy the carrier pays ACV up front and holds back the depreciation. When the insured actually replaces an item, that holdback becomes recoverable. Kevin tracks it per line and builds the request document for you.'],
      ['h2', 'How it works'],
      ['ol', [
        'Open Recovery — from the claim overview, open the Recovery tab. Every line from the worksheet is there with its holdback amount already computed.',
        'Enter the actual cost — what the insured actually paid. For multi-unit lines, set how many of the units were replaced; Kevin prorates the recoverable amount per unit.',
        'Attach the receipt — one per line. A line with a cost but no receipt still exports; it prints MISSING in amber so the desk sees the gap instead of a silently dropped line.',
        'Export the request — as an .xlsx or a PDF RCV Report, with or without the receipt files. Send it the way you send everything else — download or share link.',
      ]],
      ['h2', 'What the recoverable amount is'],
      ['p', 'Per line, recovery is capped at the smaller of the withheld depreciation and what was actually spent. Replace a $1,200 item for $900 and the request claims the holdback up to $900 — the carrier never pays out more than the insured spent. These caps come from the backend; the sheet shows them per line as “Back to insured.”'],
      ['h2', 'Batches are normal'],
      ['p', 'Insureds replace items over months. Export a recovery request whenever there is something new to claim — each export is a fresh snapshot of every line with an actual cost entered. Nothing forces you to wait until everything is replaced.'],
      ['h2', 'What the exports contain'],
      ['table', [
        ['Export', 'Contents'],
        ['RCV Report · .xlsx', 'Static-value spreadsheet of claimed lines — row #, item, holdback, actual cost, claimed amount, receipt filename.'],
        ['RCV Report · PDF', 'The same request as a formatted document, with an appendix indexing each receipt by worksheet row number.'],
        ['Receipts · .zip', 'Just the receipt files, named by row (receipt_0001.pdf), for a desk that already has the request.'],
        ['Worksheet + receipts · .zip', 'The request document plus the receipt files as separate originals beside it — the PDF\u2019s appendix is the index.'],
      ]],
      ['note', 'Receipts are never merged into one flattened PDF — originals travel as separate files so their metadata and quality survive.'],
    ],
  },

};

window.DOC_ARTICLES_C = DOC_ARTICLES_C;
