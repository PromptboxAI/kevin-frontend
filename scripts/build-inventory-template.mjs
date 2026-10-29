/**
 * Writes public/templates/contents-inventory-template.{csv,xlsx}.
 *
 *   node scripts/build-inventory-template.mjs
 *
 * WHY IT IS GENERATED AND NOT CHECKED IN BY HAND. The columns ARE the
 * importer's mappable fields, read from src/lib/import-rules.ts at build time.
 * A template whose headers have drifted from what the parser recognises is
 * worse than no template: the file still imports, the mapping step just stops
 * pre-filling, and nobody notices because nothing fails. Generating it from
 * MAPPABLE means adding a field to the importer and forgetting the template is
 * not possible.
 *
 * HEADERS ONLY, NO EXAMPLE ROWS. An example row left in the file by someone who
 * did not read the instructions gets imported and priced as property -- that is
 * the exact failure rule 24 flags headings for. The worked example lives on the
 * page, where it cannot be uploaded by accident.
 *
 * WHY THE .XLSX IS HAND-BUILT. There is no spreadsheet library in this project
 * and one 4 KB file does not justify adding one. An .xlsx is a ZIP of five
 * small XML parts; the entries are STORED (method 0) rather than deflated, so
 * there is no compressor to get wrong -- just CRC-32 and offsets, and Excel
 * reads stored entries happily.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'templates')

/* ── the columns, read from the importer so they cannot drift ───────────── */

const rules = readFileSync(join(ROOT, 'src/lib/import-rules.ts'), 'utf8')
const page = readFileSync(join(ROOT, 'src/pages/ImportPage.tsx'), 'utf8')

const mappable = /export const MAPPABLE = \[([\s\S]*?)\] as const/.exec(rules)
if (!mappable) throw new Error('import-rules.ts: MAPPABLE not found')
const FIELDS = [...mappable[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1])

const labels = /const FIELD_LABEL: Record<MappableField, string> = \{([\s\S]*?)\n\}/.exec(page)
if (!labels) throw new Error('ImportPage.tsx: FIELD_LABEL not found')
const LABEL = Object.fromEntries(
  [...labels[1].matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
)

for (const f of FIELDS) {
  if (!LABEL[f]) throw new Error(`no label for mappable field "${f}"`)
}

/**
 * Human order, not the importer's. The parser matches on the header text, so
 * column order is free -- and a person filling this in wants to name the room
 * before describing what was in it.
 */
const ORDER = ['room', 'description', 'quantity', 'make_mfr', 'model_number', 'age_years', 'category']
const missing = FIELDS.filter((f) => !ORDER.includes(f))
if (missing.length) throw new Error(`mappable field(s) not in ORDER: ${missing.join(', ')}`)

const HEADERS = ORDER.filter((f) => FIELDS.includes(f)).map((f) => LABEL[f])

mkdirSync(OUT, { recursive: true })

/* ── CSV ─────────────────────────────────────────────────────────────────── */

const csvCell = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
// A BOM so Excel opens it as UTF-8 rather than mangling an accented description.
const csv = '﻿' + HEADERS.map(csvCell).join(',') + '\r\n'
writeFileSync(join(OUT, 'contents-inventory-template.csv'), csv, 'utf8')

/* ── XLSX ────────────────────────────────────────────────────────────────── */

const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

const xmlEsc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const col = (i) => {
  let s = ''
  let n = i + 1
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// One row of inline strings. `t="inlineStr"` avoids a sharedStrings part.
const cells = HEADERS.map(
  (h, i) => `<c r="${col(i)}1" t="inlineStr" s="1"><is><t>${xmlEsc(h)}</t></is></c>`,
).join('')

const PARTS = [
  [
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `</Types>`,
  ],
  [
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`,
  ],
  [
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="Inventory" sheetId="1" r:id="rId1"/></sheets>` +
      `</workbook>`,
  ],
  [
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`,
  ],
  [
    // Two fonts: index 0 plain (required), index 1 bold for the header row.
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
      `<fills count="1"><fill><patternFill patternType="none"/></fill></fills>` +
      `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="2">` +
      `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
      `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `</cellXfs>` +
      `</styleSheet>`,
  ],
  [
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<sheetData><row r="1">${cells}</row></sheetData>` +
      `</worksheet>`,
  ],
]

/** A ZIP with STORED entries: no compressor, just CRC-32 and offsets. */
function zip(parts) {
  const locals = []
  const central = []
  let offset = 0

  for (const [name, text] of parts) {
    const nameBuf = Buffer.from(name, 'utf8')
    const data = Buffer.from(text, 'utf8')
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(0, 8) // method 0 = stored
    local.writeUInt16LE(0, 10) // time
    local.writeUInt16LE(0x21, 12) // date (1980-01-01 is 0x0021)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, nameBuf, data)

    const dir = Buffer.alloc(46)
    dir.writeUInt32LE(0x02014b50, 0)
    dir.writeUInt16LE(20, 4) // version made by
    dir.writeUInt16LE(20, 6) // version needed
    dir.writeUInt16LE(0, 8)
    dir.writeUInt16LE(0, 10)
    dir.writeUInt16LE(0, 12)
    dir.writeUInt16LE(0x21, 14)
    dir.writeUInt32LE(crc, 16)
    dir.writeUInt32LE(data.length, 20)
    dir.writeUInt32LE(data.length, 24)
    dir.writeUInt16LE(nameBuf.length, 28)
    dir.writeUInt16LE(0, 30) // extra
    dir.writeUInt16LE(0, 32) // comment
    dir.writeUInt16LE(0, 34) // disk
    dir.writeUInt16LE(0, 36) // internal attrs
    dir.writeUInt32LE(0, 38) // external attrs
    dir.writeUInt32LE(offset, 42)
    central.push(dir, nameBuf)

    offset += local.length + nameBuf.length + data.length
  }

  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(parts.length, 8)
  end.writeUInt16LE(parts.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...locals, centralBuf, end])
}

const xlsx = zip(PARTS)
writeFileSync(join(OUT, 'contents-inventory-template.xlsx'), xlsx)

console.log(`columns: ${HEADERS.join(' | ')}`)
console.log(`wrote:   public/templates/contents-inventory-template.csv (${csv.length} bytes)`)
console.log(`wrote:   public/templates/contents-inventory-template.xlsx (${xlsx.length} bytes)`)
