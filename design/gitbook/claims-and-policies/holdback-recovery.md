# Recovering your holdback

_Turn replaced items into a recovery request the carrier desk can pay._

On an RCV policy the carrier pays ACV up front and holds back the depreciation. When the insured actually replaces an item, that holdback becomes recoverable. Kevin tracks it per line and builds the request document for you.

## How it works

1. Open Recovery — from the claim overview, open the Recovery tab. Every line from the worksheet is there with its holdback amount already computed.
2. Enter the actual cost — what the insured actually paid. For multi-unit lines, set how many of the units were replaced; Kevin prorates the recoverable amount per unit.
3. Attach the receipt — one per line. A line with a cost but no receipt still exports; it prints MISSING in amber so the desk sees the gap instead of a silently dropped line.
4. Export the request — as an .xlsx or a PDF RCV Report, with or without the receipt files. Send it the way you send everything else — download or share link.

## What the recoverable amount is

Per line, recovery is capped at the smaller of the withheld depreciation and what was actually spent. Replace a $1,200 item for $900 and the request claims the holdback up to $900 — the carrier never pays out more than the insured spent. These caps come from the backend; the sheet shows them per line as “Back to insured.”

## Batches are normal

Insureds replace items over months. Export a recovery request whenever there is something new to claim — each export is a fresh snapshot of every line with an actual cost entered. Nothing forces you to wait until everything is replaced.

## What the exports contain

| Export | Contents |
| --- | --- |
| RCV Report · .xlsx | Static-value spreadsheet of claimed lines — row #, item, holdback, actual cost, claimed amount, receipt filename. |
| RCV Report · PDF | The same request as a formatted document, with an appendix indexing each receipt by worksheet row number. |
| Receipts · .zip | Just the receipt files, named by row (receipt_0001.pdf), for a desk that already has the request. |
| Worksheet + receipts · .zip | The request document plus the receipt files as separate originals beside it — the PDF’s appendix is the index. |

> Receipts are never merged into one flattened PDF — originals travel as separate files so their metadata and quality survive.
