# API & webhooks

_Enterprise: opening claims and collecting inventories programmatically._

Programmatic access is for carriers, TPAs, and multi-adjuster desks that open claims from their own system and want the finished inventory back automatically. If you work claim by claim in the app, you do not need any of it.

## Keys

Create scoped keys in Settings — read-only for reporting, write access for creating claims. Keys can be rotated or revoked at any time, and rotation is required at least annually.

## Webhooks

Subscribe an endpoint to Kevin lifecycle events rather than polling.

- claim.created — a claim was opened.
- claim.processing.complete — identification and pricing finished.
- claim.item.needs_manual — an item could not be priced confidently.
- claim.status.changed — the status moved.
- export.generated — a spreadsheet, PDF, or bundle was produced.
- export.link.viewed — someone opened a share link.

> Every event describes Kevin’s own work. There is no submit endpoint, because Kevin never writes into a carrier system.

## A typical integration

1. Create the claim with a write-scoped key.
2. Upload photographs to it.
3. Wait for claim.processing.complete.
4. Download the .xlsx and hand it to whatever comes next on your side.
