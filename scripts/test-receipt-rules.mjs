// Purchase receipts (FRONTEND.md §5e): the display rules, asserted.
//
//   npm run test:receipts
//
// Lives in scripts/ for the same reason as test-dfy-pricing.mjs: the app
// tsconfig would reject a node:test file under src/.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isPdfUrl,
  keepReceiptFiles,
  planReceiptChunks,
  progressLine,
  receiptRejectText,
  receiptStatusText,
  splitRejections,
  sumBatches,
  fmtReceiptDate,
} from '../src/lib/receipt-rules.ts'

test('a PDF is decided by the URL PATH, not the signature query', () => {
  assert.equal(isPdfUrl('https://x.supabase.co/obj/r/abc.pdf?token=1.jpg'), true)
  assert.equal(isPdfUrl('https://x.supabase.co/obj/r/abc.jpg?download=a.pdf'), false)
  assert.equal(isPdfUrl('https://x/abc.PDF'), true)
  assert.equal(isPdfUrl(null), false)
})

test('picker filter keeps receipts and zips, drops OS junk', () => {
  const { kept, skipped } = keepReceiptFiles(
    ['a.jpg', 'b.PDF', 'c.heic', 'box.zip', 'notes.docx', '.DS_Store', 'Thumbs.db'].map((name) => ({ name })),
  )
  assert.deepEqual(kept.map((f) => f.name), ['a.jpg', 'b.PDF', 'c.heic', 'box.zip'])
  assert.equal(skipped.length, 3)
})

test('chunks are bounded by count and bytes; an oversize file still gets sent', () => {
  const small = Array.from({ length: 45 }, () => ({ size: 1 }))
  assert.deepEqual(planReceiptChunks(small).map((c) => c.length), [20, 20, 5])
  const big = [{ size: 70 * 1024 * 1024 }, { size: 1 }]
  assert.deepEqual(planReceiptChunks(big).map((c) => c.length), [1, 1])
})

test('duplicate is quiet, everything else is a failure; unknown code shows detail', () => {
  const { duplicates, failed } = splitRejections([
    { filename: 'a.jpg', reason: 'duplicate' },
    { filename: 'box.zip/n.docx', reason: 'unsupported_format' },
  ])
  assert.equal(duplicates.length, 1)
  assert.equal(failed.length, 1)
  assert.equal(receiptRejectText({ filename: 'a', reason: 'duplicate' }), 'already on this claim')
  assert.equal(receiptRejectText({ filename: 'a', reason: 'brand_new', detail: 'Server says' }), 'Server says')
})

test('progress sums every batch and is unfinished until all have landed', () => {
  const b = (o) => ({ batch_id: 'x', total: 4, done: 4, finished: true, lines: 10, flagged: 1, failed: 0, receipts: [], ...o })
  const t = sumBatches([b({}), b({ done: 1, finished: false, lines: 3, flagged: 1 })], 2)
  assert.equal(progressLine(t), 'Reading receipts: 5 of 8 · 13 lines added · 2 need review')
  assert.equal(sumBatches([b({})], 2).finished, false)
  assert.equal(progressLine(sumBatches([b({ flagged: 0 })], 1)), 'Read 4 receipts · 10 lines added')
})

test('per-receipt status copy', () => {
  const base = { index: 0, filename: 'r.jpg', lines: 0, flagged: 0 }
  assert.equal(receiptStatusText({ ...base, status: 'not_a_receipt' }), 'Not a receipt, nothing added')
  assert.equal(receiptStatusText({ ...base, status: 'failed', detail: 'Too blurry' }), 'Too blurry')
  assert.equal(receiptStatusText({ ...base, status: null }), 'Reading…')
  assert.equal(
    receiptStatusText({ ...base, status: 'read', lines: 9, flagged: 1, date_readable: false }),
    '9 lines added · 1 needs review · purchase date unreadable — Age left blank',
  )
})

test('receipt dates print MM/DD/YYYY', () => {
  assert.equal(fmtReceiptDate('2024-11-03'), '11/03/2024')
  assert.equal(fmtReceiptDate(null), undefined)
})
