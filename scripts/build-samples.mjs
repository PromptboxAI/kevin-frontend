/**
 * Generates the three "Download sample" files served from public/samples/.
 *
 *   node scripts/build-samples.mjs
 *
 * WHY A GENERATOR and not three checked-in files someone hand-edited: the money
 * columns have to foot. CLAUDE.md's chain is
 *
 *   tax        = rcv × qty × rate
 *   rcv_incl   = rcv × qty + tax
 *   depr_amt   = round(rcv_incl × depr_pct, 2)
 *   acv_incl   = rcv_incl − depr_amt
 *
 * so every derived cell here is computed from the same seed the way the server
 * computes it. A sample whose columns disagree with the product teaches the
 * wrong thing to whoever opens it, and a hand-typed one drifts the first time
 * a price changes.
 *
 * RULE 2b — the .xlsx carries STATIC VALUES ONLY, never a formula. Xactimate's
 * importer breaks on them. Every number below is written as the computed value.
 *
 * RULE 18 — the adjuster-facing columns are exactly:
 *   # · Room/Area · Qty · Description · Make·Model · Unit Cost · Ext. Cost ·
 *   Sales Tax · RCV + Tax · Age · % Depr. · $ Depr. · ACV
 * Age prints as a bare number so it lands numeric in Excel, and there is no
 * content-class or useful-life column — both are internal to the depreciation
 * math and never appear on an export.
 *
 * RULE 12 — one row is deliberately `needs_manual`: unpriced, cells genuinely
 * EMPTY rather than zero, contributing 0 to the totals. That state is normal
 * and a sample that hides it misrepresents the file an adjuster will actually
 * receive.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'samples')

/** The canonical demo claim. Suffolk County — the loss ZIP resolves the rate. */
const CLAIM = {
  number: 'CLM-2026-04412',
  name: 'Godfrey — Kitchen fire',
  insured: 'Kevin Godfrey',
  carrier: 'Allstate',
  address: '123 Main St., Smithtown, NY 11787',
  taxRate: 0.08625,
  preparedBy: 'Mariana Reyes · Reyes Adjusting, LLC',
}

/** [room, qty, description, make·model, unit cost, age, depr fraction] */
const SEED = [
  ['Kitchen', 1, 'French door refrigerator, 27 cu ft', 'LG · LRFVS3006S', 2698.0, 3, 0.24],
  ['Kitchen', 1, 'Slide-in gas range, 5 burner', 'Bosch · HGI8056UC', 1799.0, 3, 0.24],
  ['Kitchen', 1, 'Over-the-range microwave', 'Whirlpool · WMH31017HS', 329.0, 5, 0.4],
  ['Kitchen', 1, 'Stand mixer, 5 qt', 'KitchenAid · KSM150PSER', 449.99, 6, 0.45],
  ['Kitchen', 12, 'Dinner plate, stoneware', 'Fiesta · 0463', 14.99, 4, 0.5],
  ['Kitchen', 1, 'Cookware set, 10 piece', 'All-Clad · D3', 799.95, 4, 0.32],
  ['Dining room', 1, 'Dining table, walnut, seats 6', 'Article · Seno', 1299.0, 2, 0.16],
  ['Dining room', 6, 'Dining chair, upholstered', 'Article · Sede', 249.0, 2, 0.16],
  ['Living room', 1, '65" OLED television', 'LG · OLED65C3PUA', 1796.99, 1, 0.15],
  // Rule 12: unpriced. Jewelry is manual-only, so it arrives with no value and
  // the adjuster types one in. Empty cells, not zeros.
  ['Primary bedroom', 1, "Ladies' diamond ring, 1.2 ct", '', null, 8, null],
]

const round2 = (n) => Math.round(n * 100) / 100

/** The locked money chain, applied once. */
function buildRows() {
  return SEED.map(([room, qty, desc, makeModel, unit, age, deprPct], i) => {
    const line = { no: i + 1, room, qty, desc, makeModel, age }
    if (unit == null) {
      // needs_manual — every derived cell stays null and contributes nothing.
      return { ...line, unit: null, ext: null, tax: null, rcvIncl: null, deprPct: null, deprAmt: null, acv: null }
    }
    const ext = round2(unit * qty)
    const tax = round2(unit * qty * CLAIM.taxRate)
    const rcvIncl = round2(ext + tax)
    const deprAmt = round2(rcvIncl * deprPct)
    const acv = round2(rcvIncl - deprAmt)
    return { ...line, unit, ext, tax, rcvIncl, deprPct, deprAmt, acv }
  })
}

const ROWS = buildRows()

const sum = (key) => round2(ROWS.reduce((a, r) => a + (r[key] ?? 0), 0))
const TOTALS = {
  ext: sum('ext'),
  tax: sum('tax'),
  rcvIncl: sum('rcvIncl'),
  deprAmt: sum('deprAmt'),
  acv: sum('acv'),
}

const HEADERS = [
  '#',
  'Room/Area',
  'Qty',
  'Description',
  'Make · Model',
  'Unit Cost',
  'Ext. Cost',
  'Sales Tax',
  'RCV + Tax',
  'Age',
  '% Depr.',
  '$ Depr.',
  'ACV',
]

/** Row → cell values, in the rule-18 order. `null` means a genuinely empty cell. */
const cellsFor = (r) => [
  r.no,
  r.room,
  r.qty,
  r.desc,
  r.makeModel,
  r.unit,
  r.ext,
  r.tax,
  r.rcvIncl,
  r.age,
  r.deprPct == null ? null : round2(r.deprPct * 100),
  r.deprAmt,
  r.acv,
]

// ── CSV ──────────────────────────────────────────────────────────────────────

const csvCell = (v) => {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function buildCsv() {
  const lines = [
    // A couple of context lines first: the file is often read on its own, away
    // from the claim it came from.
    `Kevin inventory export,,${CLAIM.number}`,
    `Insured,${csvCell(CLAIM.insured)},Carrier,${csvCell(CLAIM.carrier)}`,
    `Loss address,${csvCell(CLAIM.address)},Sales tax rate,${(CLAIM.taxRate * 100).toFixed(3)}%`,
    '',
    HEADERS.map(csvCell).join(','),
    ...ROWS.map((r) => cellsFor(r).map(csvCell).join(',')),
    '',
    ['', '', '', 'TOTALS', '', '', TOTALS.ext, TOTALS.tax, TOTALS.rcvIncl, '', '', TOTALS.deprAmt, TOTALS.acv]
      .map(csvCell)
      .join(','),
  ]
  return lines.join('\r\n') + '\r\n'
}

// ── XLSX ─────────────────────────────────────────────────────────────────────
// A .xlsx is a zip of XML parts. Inline strings are used so there is no shared
// string table to keep in sync, and no styles part -- a sample should open
// everywhere rather than look pretty in one reader.

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const colName = (i) => {
  let n = i + 1
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function sheetRow(values, rowIndex) {
  const cells = values
    .map((v, i) => {
      if (v == null || v === '') return '' // an omitted cell IS an empty cell
      const ref = `${colName(i)}${rowIndex}`
      return typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(v)}</t></is></c>`
    })
    .join('')
  return `<row r="${rowIndex}">${cells}</row>`
}

function buildSheetXml() {
  const rows = []
  let r = 1
  rows.push(sheetRow([`Kevin inventory export — ${CLAIM.number}`], r++))
  rows.push(sheetRow([`Insured`, CLAIM.insured, '', 'Carrier', CLAIM.carrier], r++))
  rows.push(
    sheetRow(['Loss address', CLAIM.address, '', 'Sales tax rate', `${(CLAIM.taxRate * 100).toFixed(3)}%`], r++),
  )
  rows.push(sheetRow([], r++))
  rows.push(sheetRow(HEADERS, r++))
  for (const row of ROWS) rows.push(sheetRow(cellsFor(row), r++))
  rows.push(sheetRow([], r++))
  rows.push(
    sheetRow(
      ['', '', '', 'TOTALS', '', '', TOTALS.ext, TOTALS.tax, TOTALS.rcvIncl, '', '', TOTALS.deprAmt, TOTALS.acv],
      r++,
    ),
  )
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.join('')}</sheetData></worksheet>`
}

const XLSX_PARTS = () => ({
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Contents" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
  'xl/worksheets/sheet1.xml': buildSheetXml(),
})

async function buildXlsx() {
  const zip = new ZipWriter(new BlobWriter('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
  for (const [name, content] of Object.entries(XLSX_PARTS())) {
    await zip.add(name, new TextReader(content))
  }
  const blob = await zip.close()
  return Buffer.from(await blob.arrayBuffer())
}

// ── PDF ──────────────────────────────────────────────────────────────────────
// Hand-built rather than pulled in as a dependency: one page of text needs a
// catalog, a pages node, a page, a font and a content stream, and the xref
// offsets have to be byte-accurate or readers reject the file.

const pdfEscape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
const money = (n) => (n == null ? '—' : n.toFixed(2))

function pdfLines() {
  const out = []
  out.push(['H', 'PERSONAL PROPERTY INVENTORY'])
  out.push(['T', `${CLAIM.name}  ·  ${CLAIM.number}`])
  out.push(['S', `Insured: ${CLAIM.insured}    Carrier: ${CLAIM.carrier}`])
  out.push(['S', `Loss address: ${CLAIM.address}`])
  out.push(['S', `Sales tax: ${(CLAIM.taxRate * 100).toFixed(3)}%   Prepared by: ${CLAIM.preparedBy}`])
  out.push(['S', ''])
  out.push(['C', ' #  Description                          Qty   RCV+Tax    Depr.       ACV'])
  out.push(['C', '--------------------------------------------------------------------------'])
  for (const r of ROWS) {
    const desc = r.desc.length > 34 ? r.desc.slice(0, 33) + '…' : r.desc.padEnd(34)
    out.push([
      'C',
      `${String(r.no).padStart(2)}  ${desc}  ${String(r.qty).padStart(3)}  ` +
        `${money(r.rcvIncl).padStart(9)}  ${money(r.deprAmt).padStart(9)}  ${money(r.acv).padStart(9)}`,
    ])
  }
  out.push(['C', '--------------------------------------------------------------------------'])
  out.push([
    'C',
    `    TOTALS                                    ${TOTALS.rcvIncl.toFixed(2).padStart(9)}  ` +
      `${TOTALS.deprAmt.toFixed(2).padStart(9)}  ${TOTALS.acv.toFixed(2).padStart(9)}`,
  ])
  out.push(['S', ''])
  out.push(['S', 'Unpriced rows arrive blank and contribute 0 — the adjuster enters the value.'])
  out.push(['S', 'Sample file. Figures are illustrative and derived from the demo claim.'])
  return out
}

function buildPdf() {
  const SIZE = { H: 16, T: 12, S: 9, C: 8 }
  const FONT = { H: '/F2', T: '/F2', S: '/F1', C: '/F3' }
  let y = 780
  let stream = 'BT\n'
  for (const [kind, text] of pdfLines()) {
    y -= kind === 'H' ? 26 : kind === 'T' ? 20 : 13
    if (text) {
      stream += `${FONT[kind]} ${SIZE[kind]} Tf\n1 0 0 1 48 ${y} Tm\n(${pdfEscape(text)}) Tj\n`
    }
  }
  stream += 'ET\n'

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefAt = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

// ── write ────────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'kevin-sample-items.csv'), buildCsv(), 'utf8')
writeFileSync(join(OUT, 'kevin-sample-inventory.pdf'), buildPdf())
writeFileSync(join(OUT, 'kevin-sample-xactcontents.xlsx'), await buildXlsx())

const check = round2(TOTALS.rcvIncl - TOTALS.deprAmt)
if (check !== TOTALS.acv) {
  throw new Error(`Totals do not foot: RCV+Tax ${TOTALS.rcvIncl} − Depr ${TOTALS.deprAmt} ≠ ACV ${TOTALS.acv}`)
}

console.log(`rows: ${ROWS.length} (1 unpriced)`)
console.log(`ext ${TOTALS.ext}  tax ${TOTALS.tax}  rcv+tax ${TOTALS.rcvIncl}  depr ${TOTALS.deprAmt}  acv ${TOTALS.acv}`)
console.log(`wrote 3 files to public/samples/`)
