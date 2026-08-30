// Docs content · part 2 of 2 — Exporting, Claims & policies, Estate sale, Account.
// Same block-tuple shape as docs-articles.jsx. Renderer lives in docs.jsx.

const DOC_ARTICLES_B = {

  'format-xlsx': {
    title: 'Xactimate (Excel) format',
    summary: 'Column parity with the XactContents template, and what each column holds.',
    blocks: [
      ['p', 'The .xlsx export matches the XactContents import template column for column, in order, so it imports without cleanup. This is the format most claims leave Kevin in.'],
      ['h2', 'The columns'],
      ['table', [
        ['Column', 'Contents'],
        ['#', 'Line number'],
        ['Room / area', 'What you typed in the room column'],
        ['Qty', 'Quantity'],
        ['Description', 'The item description'],
        ['Make · Model', 'Manufacturer and model number where known'],
        ['Unit cost', 'Replacement cost for one'],
        ['Ext. cost', 'Unit cost times quantity'],
        ['Sales tax', 'Per line, from the claim tax rate'],
        ['RCV + tax', 'Extended cost plus tax'],
        ['Age', 'Years, as a bare number so Excel treats it as numeric'],
        ['% Depr.', 'Depreciation percentage'],
        ['$ Depr.', 'Dollar depreciation'],
        ['ACV', 'Actual cash value'],
      ]],
      ['note', 'Content class and useful life are internal to the depreciation math and are not printed as columns. They would only invite argument.'],
      ['h2', 'Values you should expect'],
      ['ul', [
        'Unpriced items export as 0.00 rather than blank, so formulas in the sheet do not break.',
        'A zero price produces zero depreciation, never negative zero.',
        'Tax appears on every line, not only as a claim total.',
      ]],
    ],
  },

  'format-pdf': {
    title: 'PDF inventory',
    summary: 'The client-facing document, and the one place the disclaimer lives.',
    blocks: [
      ['p', 'The PDF is the readable version of the same inventory — the file you hand an insured, an attorney, or an estate-sale client. It carries a header with the claim details, the full line-item table, and totals.'],
      ['h2', 'What the header shows'],
      ['ul', [
        'Claim and policy numbers, insured, loss address, date of loss.',
        'Who prepared it and when.',
        'The depreciation method used, named explicitly.',
        'The tax rate applied.',
      ]],
      ['h2', 'Depreciation disclosure'],
      ['p', 'The PDF states which method produced its figures and recomputes the table for that method, so the document is internally consistent. Under straight-line it also prints the useful life applied to each line, which is usually the first thing anyone questions.'],
      ['note', 'The "not an appraisal" language lives in the Terms of Service, not stamped on every inventory. Most exports go straight into Xactimate, where a disclaimer would only be noise.'],
      ['h2', 'Photos in the PDF'],
      ['p', 'Photographs, comps, and adjuster notes can only travel in the PDF or the bundle — a spreadsheet has no place to put them. If you need the pictures alongside the numbers, this is the format.'],
    ],
  },

  'format-bundle': {
    title: 'The full bundle',
    summary: 'Everything at once, as a .zip, for the file.',
    blocks: [
      ['p', 'The bundle is a single .zip containing the spreadsheet, the PDF inventory, every source photograph, and the audit log. It is the archival copy — what you keep, or send when someone asks for the complete record.'],
      ['h2', 'What is inside'],
      ['ul', [
        'The .xlsx inventory, ready for XactContents.',
        'The PDF inventory.',
        'A photos folder, with filenames tied to their line numbers.',
        'The audit log: every edit, who made it, and when.',
      ]],
      ['h2', 'Size'],
      ['p', 'Photographs dominate the size. A large photo claim can land in the hundreds of MB, and a single export is capped at 2 GB. If you only need the numbers, take the spreadsheet instead.'],
      ['note', 'The audit log is the part that makes a bundle worth keeping. Two years on it shows exactly what changed and who changed it.'],
    ],
  },

  'share-links': {
    title: 'Share links',
    summary: 'Sending an inventory without an email attachment.',
    blocks: [
      ['p', 'Instead of downloading and attaching, you can mint a link. Anyone with the link sees the inventory in a read-only view; no account is needed.'],
      ['h2', 'Controls'],
      ['ul', [
        'Expiry — the link stops working on a date you set.',
        'What is included — the spreadsheet, the PDF, the photographs, or a subset.',
        'Revoke — kill the link immediately at any time.',
      ]],
      ['h2', 'Who opened it'],
      ['p', 'The share sheet lists each view: the email address if the viewer identified themselves, the approximate location, the device, and the time. It is useful evidence that a file was actually received.'],
      ['note', 'A share link is still you sending a file. Kevin has no connection into a carrier system and no carrier-facing surface, so nothing arrives anywhere on its own.'],
    ],
  },

  'export-history': {
    title: 'Export history & re-exporting',
    summary: 'Every export is kept, versioned, and re-downloadable.',
    blocks: [
      ['p', 'Exports are listed per claim with their format, size, line count, and when they were produced. Nothing is thrown away, so you can always retrieve exactly what you sent rather than reconstructing it.'],
      ['h2', 'Versions'],
      ['p', 'Export the same claim again after edits and you get a new version alongside the old one. The earlier file stays exactly as it was — the version you sent is the version you can still open, which is the whole point of keeping it.'],
      ['h2', 'When an export fails'],
      ['p', 'A failure is technical: a generation error, a storage read problem, a share link that could not be minted. You get a reference ID and a retry. It is never a judgment about whether your inventory is ready — Kevin does not gate an export on editorial readiness.'],
      ['note', 'Quote the reference ID if you contact us. It resolves directly to the failed job.'],
    ],
  },

  'claim-statuses': {
    title: 'Claim statuses',
    summary: 'Four states, and only you close a claim.',
    blocks: [
      ['p', 'Every claim shows a status you can change by clicking the badge on the claims list.'],
      ['table', [
        ['Status', 'Meaning'],
        ['Processing', 'Identification and pricing are running. Set by Kevin, not by you.'],
        ['In review', 'You are working the worksheet. Still an open claim.'],
        ['Open', 'Active, waiting on something — usually the carrier or the insured.'],
        ['Closed', 'Done. The only status that takes it out of your open count.'],
      ]],
      ['note', 'In review is an open claim. Nothing leaves your open count until you mark it Closed, because only you know when a claim is actually finished.'],
      ['h2', 'What status changes'],
      ['p', 'Status drives the counts at the top of the claims list and nothing else. It does not lock the worksheet, restrict editing, or affect exports — a closed claim is still fully editable and exportable.'],
    ],
  },

  'pp-limit': {
    title: 'Personal property limit',
    summary: 'Tracking the inventory against the coverage cap.',
    blocks: [
      ['p', 'Policies name contents coverage differently, so Kevin stores both a label you pick at intake and the dollar limit. Coverage C on a homeowners policy, Coverage B on a renters policy, Personal Property or Contents elsewhere, Business Personal Property on a commercial risk.'],
      ['h2', 'The meter'],
      ['p', 'The worksheet totals bar and the claim overview both show the inventory against the limit. It runs in the accent color, turns amber at 80%, and turns red once the inventory exceeds the limit.'],
      ['h2', 'Already claimed'],
      ['p', 'If a prior contents payment has been made on the same loss, enter it at intake. The meter then measures against what remains rather than the full limit, which is the number that actually matters.'],
      ['note', 'Kevin never prints a coverage letter as though it were universal. Whatever you chose at intake is what appears on the export.'],
    ],
  },

  'depreciation-schedules': {
    title: 'Depreciation schedules',
    summary: 'Choosing one per claim, and building your own.',
    blocks: [
      ['p', 'A schedule is chosen per claim, not globally — an independent adjuster works for several carriers under different guidelines, and depreciation is a policy matter rather than a company-wide setting.'],
      ['h2', 'What ships'],
      ['ul', [
        'An industry-standard straight-line schedule, used by default on every new claim.',
        'A bracketed alternative, where a percentage is looked up by class and age band.',
      ]],
      ['h2', 'Building your own'],
      ['p', 'On intake, choose Add new schedule. Give it a name, pick the method, set useful life per content class, and set the maximum depreciation. It becomes selectable on any future claim, and the name prints on the PDF so the reader knows which one produced the numbers.'],
      ['note', 'Whatever you pick, the calculation happens on the server. That is what guarantees the worksheet and the exported file agree exactly.'],
    ],
  },

  'carrier-profiles': {
    title: 'Carrier profiles',
    summary: 'What a profile is for — and what it deliberately does not control.',
    blocks: [
      ['p', 'A carrier profile stores the details that repeat across claims for the same carrier: contact routing, export preferences, and the policy language you tend to see. It saves retyping.'],
      ['h2', 'What a profile does not set'],
      ['p', 'It does not set depreciation, and it does not set special-limits caps. Both are properties of the individual policy, not the carrier — two policies from the same insurer routinely differ. Kevin asks for those per claim on purpose.'],
      ['note', 'Kevin has no relationship with any carrier and no carrier-specific behavior. A profile is your record-keeping convenience, nothing more.'],
      ['h2', 'Managing profiles'],
      ['p', 'Add, edit, or delete profiles in Settings. Deleting one leaves existing claims untouched — they keep the values they were created with.'],
    ],
  },

  'archive-delete': {
    title: 'Archiving & deleting claims',
    summary: 'Both are always available. It is your account.',
    blocks: [
      ['p', 'Every claim can be archived or permanently deleted from the row menu on the claims list. Neither is gated.'],
      ['h2', 'Archive'],
      ['p', 'Reversible, and keeps everything — items, photographs, exports, and the audit log. Archived claims are still reachable under the Archived filter and can be restored at any time. This is the right choice for a finished claim you want out of the way.'],
      ['h2', 'Delete'],
      ['p', 'Permanent, and requires typing DELETE to confirm. Everything goes, including the photographs.'],
      ['note', 'Kevin does not gate either action for compliance reasons. Kevin is a platform for building content lists, not a compliance system — retention obligations belong to you and the carrier.'],
      ['h2', 'Nothing is deleted to save space'],
      ['p', 'Kevin never removes your data to reclaim storage. Closed claims move to archived storage after ninety days, which is slower on first load and nothing else. It is your data.'],
    ],
  },

  'estate-mode': {
    title: 'Estate sale mode',
    summary: 'The same engine, a different worksheet.',
    blocks: [
      ['p', 'Estate sale mode is for estate-sale companies and liquidators rather than insurance claims. The photo-to-inventory pipeline is identical; what changes is the worksheet and what gets exported.'],
      ['h2', 'What is different'],
      ['table', [
        ['Insurance worksheet', 'Estate worksheet'],
        ['RCV, depreciation, ACV', 'Fair market value and sale price'],
        ['Content class', 'Condition grade'],
        ['Special-limits flags', 'Status: for sale, sold, keep, donate'],
        ['Xactimate spreadsheet', 'PDF inventory, .xlsx, or CSV'],
      ]],
      ['h2', 'What it is for'],
      ['p', 'Two documents, really: the inventory you show a prospective client when pitching for the sale, and the final record of what actually sold and for how much.'],
      ['note', 'This is not about estates of the deceased or dividing property among heirs. It is a working tool for people who run sales.'],
    ],
  },

  'fair-market-value': {
    title: 'Fair market value',
    summary: 'Secondary-market pricing, not replacement cost.',
    blocks: [
      ['p', 'Estate mode prices to fair market value — what the item would actually fetch resold — rather than what it would cost to replace new. Those are very different numbers, and using the wrong one misleads a client badly.'],
      ['h2', 'Where the figure comes from'],
      ['p', 'Comps are drawn from completed secondary-market sales rather than retail listings: sold prices, auction results, and resale platforms. The median of the comps becomes the fair market value, and each figure keeps a dated link to the sale behind it.'],
      ['h2', 'Adjusting it'],
      ['p', 'The value cell is fully editable — you will often know a local market better than any comp set does. You can also re-price from the item panel after sharpening the description, and the comps will come back from the same secondary market.'],
      ['note', 'Condition is yours to set and does not change the value arithmetically. It is a judgment recorded for the client, and you price accordingly.'],
      ['h2', 'Sale price'],
      ['p', 'A separate column records what an item actually sold for. The totals bar shows realized proceeds against the fair market estimate with the variance, which is the number a client asks about first.'],
    ],
  },

  'condition-status': {
    title: 'Condition & status',
    summary: 'Grading an item and tracking where it ended up.',
    blocks: [
      ['p', 'Two dropdowns per row, both yours to set.'],
      ['h2', 'Condition'],
      ['p', 'A grade from excellent down to poor, set by you. It does not change the fair market value automatically — a condition grade is a judgment about the object, and you reflect it in the price you set.'],
      ['h2', 'Status'],
      ['ul', [
        'Unassigned — not yet decided.',
        'For sale — going into the sale.',
        'Sold — with the sale price recorded alongside.',
        'Keep — the client is retaining it.',
        'Donate — going to donation, often with a value needed for a receipt.',
      ]],
      ['h2', 'Totals by status'],
      ['p', 'The totals bar breaks the inventory down by status, all on fair-market basis so the four buckets sum to the total, with realized proceeds shown separately.'],
      ['note', 'Both fields can be set on many rows at once with the checkbox column, which is much faster after a sale than editing row by row.'],
    ],
  },

  'storage-fair-use': {
    title: 'Storage & fair use',
    summary: 'Unlimited claims, a generous item allowance, nothing ever deleted.',
    blocks: [
      ['p', 'Claims are unlimited on every plan — run as many as you like, with no per-claim fee. Two things are metered, because they are the two real variable costs: the line items Kevin prices for you, and the photographs it stores. Neither ever gets in the way of work.'],
      ['h2', 'Line items'],
      ['ul', [
        'Pro includes 2,000 line items per billing month.',
        'Additional items are $0.20 each, added to the following invoice.',
        'A 60-photo kitchen fire is roughly 57 items, so 2,000 covers about thirty-five claims that size in a month.',
        'Going over never locks a claim or blocks an export — the work finishes, the overage bills after.',
      ]],
      ['note', 'Estate sales are priced separately at $249 per estate rather than against the monthly allowance, because a single estate can run to thousands of items.'],
      ['h2', 'Storage'],
      ['ul', [
        'Pro includes 500 GB of active storage.',
        'Closed claims move to archived storage after ninety days. Still fully accessible, marginally slower on first load.',
        'Going over the pool triggers an email, never a mid-claim lockout.',
        'Beyond that, additional storage is $19 per month per 500 GB.',
      ]],
      ['note', 'Nothing is ever deleted to reclaim space. Tiering closed claims to archived storage is how the cost is managed — not deletion, and not a cap on claims.'],
      ['h2', 'Where to see it'],
      ['p', 'Billing settings shows both meters — items used against the monthly allowance, and storage used against the pool — the latter derived from the actual photograph count on your account rather than an estimate.'],
    ],
  },

  'billing-plans': {
    title: 'Billing & plans',
    summary: 'Two plans, flat monthly, and 250 free items to start.',
    blocks: [
      ['p', 'Kevin is a flat monthly subscription, the way you already pay for Xactimate. There is no per-claim charge, no per-seat charge, no per-photo charge, and comps are always included.'],
      ['h2', 'The plans'],
      ['table', [
        ['Plan', 'For', 'Price'],
        ['Pro', 'Content inventory specialists, IAs and public adjusters', '$249 / month · unlimited claims · 2,000 line items, then $0.20 an item'],
        ['Enterprise', 'Carriers, TPAs, and multi-adjuster teams', 'Custom, volume licensing on one invoice'],
      ]],
      ['h2', 'The free tier'],
            ['p', 'Every account starts with 250 free line items — the full product, on real claims, with no time limit. Your card is verified at signup but not charged. Kevin bills you only when you start Pro, either by choosing it in Billing or by continuing past those 250 items; we email you first, and again at 200 items so it is never a surprise.'],
      ['note', 'The item count is append-only. Deleting a line does not give the quota back, because the pricing lookups behind it are already paid for by the time the row appears.'],
      ['h2', 'Managing it'],
      ['ul', [
        'Update the card or billing email in Billing settings.',
        'Download any past invoice as a PDF.',
        'Cancel whenever you like — you keep access through the period you have paid for.',
      ]],
      ['note', 'Enterprise adds API access, webhooks, team roles, and claim assignment. Everything else is the same product.'],
    ],
  },

  'security-passkeys': {
    title: 'Security & passkeys',
    summary: 'How accounts are protected and what you control.',
    blocks: [
      ['p', 'Data is encrypted with AES-256 at rest and TLS 1.3 in transit. Sign in with an email and password, with Google, or with a passkey.'],
      ['h2', 'Passkeys'],
      ['p', 'A passkey replaces the password with a key held by your device or password manager, so there is nothing phishable. Register one in Settings under Security after your first sign-in.'],
      ['note', 'Kevin does not use biometrics. Your device may use a fingerprint or face to unlock the key locally, but no biometric data reaches Kevin.'],
      ['h2', 'Active sessions'],
      ['p', 'Security settings lists every signed-in session with device, browser, approximate location, and last activity. You can end any one of them, or end all sessions other than the one you are using — useful if you signed in somewhere you should not have.'],
      ['h2', 'Recovery codes'],
      ['p', 'Download a set of one-time codes and keep them somewhere other than the machine you sign in from. Regenerating invalidates the old set immediately.'],
    ],
  },

  'team-roles': {
    title: 'Team & roles',
    summary: 'Enterprise: who can see and do what.',
    blocks: [
      ['p', 'Team management is an Enterprise feature. On Pro you are a single account holder, which is how most independent adjusters and estate-sale professionals work.'],
      ['h2', 'Roles'],
      ['table', [
        ['Role', 'Can'],
        ['Owner', 'Everything, including billing and deleting the account'],
        ['Admin', 'Manage people and settings, no billing'],
        ['Adjuster', 'Work claims assigned to them'],
        ['Viewer', 'Read-only, for a supervisor or a desk reviewer'],
      ]],
      ['h2', 'Inviting people'],
      ['p', 'Invite by email address and set the role. Invitations expire if unused, and you can revoke one before it is accepted.'],
      ['h2', 'Claim assignment'],
      ['p', 'Claims can be reassigned between people on the account — necessary when someone leaves, goes on leave, or a desk rebalances workload. Reassignment is recorded in the audit log.'],
      ['note', 'There is no per-seat charge. Enterprise is volume licensing on one invoice.'],
    ],
  },

  'api-webhooks': {
    title: 'API & webhooks',
    summary: 'Enterprise: opening claims and collecting inventories programmatically.',
    blocks: [
      ['p', 'Programmatic access is for carriers, TPAs, and multi-adjuster desks that open claims from their own system and want the finished inventory back automatically. If you work claim by claim in the app, you do not need any of it.'],
      ['h2', 'Keys'],
      ['p', 'Create scoped keys in Settings — read-only for reporting, write access for creating claims. Keys can be rotated or revoked at any time, and rotation is required at least annually.'],
      ['h2', 'Webhooks'],
      ['p', 'Subscribe an endpoint to Kevin lifecycle events rather than polling.'],
      ['ul', [
        'claim.created — a claim was opened.',
        'claim.processing.complete — identification and pricing finished.',
        'claim.item.needs_manual — an item could not be priced confidently.',
        'claim.status.changed — the status moved.',
        'export.generated — a spreadsheet, PDF, or bundle was produced.',
        'export.link.viewed — someone opened a share link.',
      ]],
      ['note', 'Every event describes Kevin\u2019s own work. There is no submit endpoint, because Kevin never writes into a carrier system.'],
      ['h2', 'A typical integration'],
      ['ol', [
        'Create the claim with a write-scoped key.',
        'Upload photographs to it.',
        'Wait for claim.processing.complete.',
        'Download the .xlsx and hand it to whatever comes next on your side.',
      ]],
    ],
  },

};

window.DOC_ARTICLES_B = DOC_ARTICLES_B;
