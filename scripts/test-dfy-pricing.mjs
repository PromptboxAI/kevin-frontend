// Done-for-you pricing: the quote-integrity rules, asserted.
//
//   node --experimental-strip-types --test scripts/test-dfy-pricing.mjs
//   (or: npm run test:dfy)
//
// Lives in scripts/ rather than beside the module because the app tsconfig
// pins `types` to vite/client, so a node:test file under src/ would fail
// `tsc -b`. The module itself has no imports, so Node can load it directly.
//
// These mirror the owner's spec (2026-10-22). The SERVER must carry the same
// table -- BACKEND-PROMPTS 12 -- because the server's quote is the authority.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DFY_MINIMUM_FEE,
  linesWithin,
  priceForLines,
  quoteFor,
  totalForLines,
} from '../src/lib/dfy-pricing-rules.ts'

const BOUNDARIES = [1, 50, 99, 100, 101, 149, 150, 249, 250, 251, 499, 500, 501, 999, 1000, 1001, 2000]

test('worked examples from the spec (marginal line total)', () => {
  const expected = {
    50: 250, 100: 500, 150: 725, 151: 729.5, 200: 950, 250: 1175,
    400: 1775, 401: 1779, 500: 2175, 800: 3225, 1000: 3925, 1001: 3928, 2000: 6925,
  }
  for (const [n, total] of Object.entries(expected)) {
    assert.equal(totalForLines(Number(n)), total, `lines=${n}`)
  }
})

test('the $750 minimum is enforced, by max() and never added', () => {
  for (const n of [1, 50, 100, 150, 151]) assert.equal(priceForLines(n), 750, `lines=${n}`)
  assert.equal(priceForLines(155), 750) // 747.50 -> minimum
  assert.equal(priceForLines(156), 752) // first count past the minimum
  assert.equal(priceForLines(200), 950)
  assert.equal(priceForLines(400), 1775)
  assert.equal(quoteFor(150).minimumApplied, true)
  assert.equal(quoteFor(400).minimumApplied, false)
  assert.equal(DFY_MINIMUM_FEE, 750)
})

test('every boundary: price(n+1) >= price(n), and the line total strictly rises', () => {
  for (const n of BOUNDARIES) {
    assert.ok(priceForLines(n + 1) >= priceForLines(n), `price fell at ${n}`)
    assert.ok(totalForLines(n + 1) > totalForLines(n), `line total did not rise at ${n}`)
  }
})

test('adding a line never lowers the quote; removing one never raises it (1..5000)', () => {
  let prev = priceForLines(1)
  for (let n = 2; n <= 5000; n++) {
    const p = priceForLines(n)
    assert.ok(p >= prev, `price(${n})=${p} < price(${n - 1})=${prev}`)
    prev = p
  }
})

test('the breakdown foots to the line total and names the bands actually used', () => {
  for (const n of BOUNDARIES) {
    const q = quoteFor(n)
    const sum = q.breakdown.reduce((s, b) => s + Math.round(b.amount * 100), 0) / 100
    assert.equal(sum, q.lineTotal, `breakdown does not foot at ${n}`)
    assert.equal(q.breakdown.reduce((s, b) => s + b.count, 0), n)
  }
  assert.deepEqual(
    quoteFor(400).breakdown.map((b) => [b.label, b.amount]),
    [['First 100 lines', 500], ['Lines 101–250', 675], ['Lines 251–400', 600]],
  )
  assert.equal(quoteFor(1001).customEligible, true)
  assert.equal(quoteFor(1000).customEligible, false)
})

test('a count that is not a positive number is not a quote', () => {
  for (const n of [0, -1, NaN, Infinity]) {
    assert.equal(totalForLines(n), null)
    assert.equal(priceForLines(n), null)
    assert.equal(quoteFor(n), null)
  }
})

test('linesWithin inverts the bands', () => {
  assert.equal(linesWithin(750), 155)
  assert.equal(linesWithin(1775), 400)
  assert.equal(linesWithin(3925), 1000)
  for (const b of [750, 1000, 1750, 3000]) {
    const n = linesWithin(b)
    assert.ok(totalForLines(n) <= b && totalForLines(n + 1) > b, `budget ${b}`)
  }
})
