// Grouping progress bar: server numbers only, never backwards except on a retry.
//
//   node --experimental-strip-types --no-warnings --test scripts/test-grouping-progress.mjs
//
// Spec: backend session note, 2026-11-23 (FRONTEND.md, staging session response).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupingDetail, nextGroupingPercent } from '../src/lib/staging-rules.ts'

const empty = { clustering_percent: null, clustering_done: null, clustering_total: null }

test('null → 0 → 35 → 66 → 99 fills the bar, null first stays indeterminate', () => {
  let p = null
  const seen = []
  for (const pct of [null, 0, 35, 66, 99]) {
    p = nextGroupingPercent(p, { ...empty, clustering_percent: pct })
    seen.push(p)
  }
  assert.deepEqual(seen, [null, 0, 35, 66, 99])
})

test('a null poll keeps the last value', () => {
  assert.equal(nextGroupingPercent(42, empty), 42)
})

test('never goes backwards within a job', () => {
  assert.equal(nextGroupingPercent(66, { ...empty, clustering_percent: 60 }), 66)
})

test('a retry (drop to ~0) resets quietly', () => {
  assert.equal(nextGroupingPercent(66, { ...empty, clustering_percent: 0 }), 0)
  assert.equal(nextGroupingPercent(66, { ...empty, clustering_percent: 3 }), 3)
})

test('pre-deploy job: batches only, 13 of 26 shows 50%', () => {
  const s = { clustering_percent: 50, clustering_done: 13, clustering_total: 26 }
  assert.equal(nextGroupingPercent(null, s), 50)
  // and if the percent itself were missing, the batch fraction stands in
  assert.equal(nextGroupingPercent(null, { ...s, clustering_percent: null }), 50)
  assert.equal(
    groupingDetail(50, { ...s, clustering_photos_done: null, clustering_photos_total: null }),
    '50% · sorted 13 of 26 batches',
  )
})

test('never reaches 100 while grouping', () => {
  assert.equal(nextGroupingPercent(null, { ...empty, clustering_percent: 100 }), 99)
})

test('detail line', () => {
  assert.equal(
    groupingDetail(42, {
      clustering_photos_done: 120,
      clustering_photos_total: 231,
      clustering_done: 4,
      clustering_total: 18,
    }),
    '42% · looked at 120 of 231 photos · sorted 4 of 18 batches',
  )
})
