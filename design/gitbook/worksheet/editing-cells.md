# Editing cells

_Which cells you type in, which are calculated, and how the money chain foots._

Click any editable cell and type. There is no edit mode to enter and no save button — changes commit when you leave the cell, and every one is recorded in the audit log.

## Editable versus calculated

| Editable | Calculated |
| --- | --- |
| Room / area | Extended cost |
| Quantity | RCV + tax |
| Description, make, model | Dollar depreciation |
| Content class | ACV |
| Unit cost |  |
| Age, percent depreciation |  |

## How the money foots

```
Extended cost  = Unit cost x Quantity
RCV + Tax      = Extended cost + (Extended cost x tax rate)
$ Depreciation = Extended cost x % Depreciation
ACV            = Extended cost + Tax - $ Depreciation
```

Tax sits inside ACV, and the columns foot left to right. Change a unit cost and everything to its right follows.

## Keyboard

- Tab and arrows move between cells.
- Enter on the last row appends a new blank row, so you can add items without touching the mouse.
- Money cells clear when you focus them — type the new figure straight in. Leave without typing and the old value returns.

## Column widths

Drag a header boundary to resize a column, like a spreadsheet. Double-click a boundary to reset it.
