# Xactimate (Excel) format

_Column parity with the XactContents template, and what each column holds._

The .xlsx export matches the XactContents import template column for column, in order, so it imports without cleanup. This is the format most claims leave Kevin in.

## The columns

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

## Values you should expect

- Unpriced items export as 0.00 rather than blank, so formulas in the sheet do not break.
- A zero price produces zero depreciation, never negative zero.
- Tax appears on every line, not only as a claim total.
