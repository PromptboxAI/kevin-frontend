import type { ClaimItem, ClaimItemListResponse, ClaimSummary } from './types'

/**
 * The public sample claim's payload — screen 48.
 *
 * DYNAMICALLY IMPORTED (see `sample.ts`), so this ships only to visitors who
 * open /sample and never weighs on the authenticated app.
 *
 * SYNTHETIC INSURED. The canonical demo claim carries the founder's own name
 * and home address. Authenticated that is demo data; on a public, crawlable
 * marketing page it is real PII. The public copy uses John Doe at 456 Market
 * St — Hauppauge is still Suffolk County, so the 8.625% rate the rest of the
 * product quotes stays correct against the address (CLAUDE.md: "the loss ZIP
 * resolves the rate, so address and tax must always agree").
 *
 * Everything else is canonical on purpose — CLM-2026-04412, Allstate, 60
 * photos → 57 items — because those figures are quoted on every marketing
 * surface and a demo that disagreed with them would undermine both.
 *
 * MONEY IS COMPUTED, NEVER TYPED. Rows are generated through the same chain
 * the server owns (tax → rcv_total_incl → depreciation_amount → acv_total_incl),
 * so the sample cannot foot differently from the product. The worksheet reads
 * these fields verbatim and computes nothing (rule 20).
 */

export const SAMPLE_CLAIM_ID = 'sample'

const TAX_RATE = 0.08625

/** [description, make, model, room, qty, unit rcv, age, depreciation fraction] */
type Seed = [string, string, string, string, number, number, number, number]

const SEEDS: Seed[] = [
  ['French door refrigerator, 27 cu ft', 'LG', 'LRFVS3006S', 'Kitchen', 1, 2698.0, 3, 0.24],
  ['Slide-in gas range, 5 burner', 'Bosch', 'HGI8056UC', 'Kitchen', 1, 1799.0, 3, 0.24],
  ['Over-the-range microwave', 'Whirlpool', 'WMH31017HS', 'Kitchen', 1, 329.0, 5, 0.4],
  ['Dishwasher, 44 dBA', 'Bosch', 'SHXM63WS5N', 'Kitchen', 1, 949.0, 5, 0.4],
  ['Stand mixer, 5 qt', 'KitchenAid', 'KSM150PSER', 'Kitchen', 1, 449.99, 6, 0.45],
  ['Espresso machine', 'Breville', 'BES870XL', 'Kitchen', 1, 699.95, 4, 0.32],
  ['Cookware set, 10 piece', 'All-Clad', 'D3', 'Kitchen', 1, 799.95, 4, 0.32],
  ['Dinner plate, stoneware', 'Fiesta', '0463', 'Kitchen', 12, 14.99, 4, 0.5],
  ['Drinking glass, 16 oz', 'Libbey', '15238', 'Kitchen', 8, 4.99, 4, 0.5],
  ['Chef knife, 8 in', 'Wüsthof', 'Classic 4582', 'Kitchen', 1, 179.95, 6, 0.4],
  ['Toaster, 4 slice', 'Cuisinart', 'CPT-180', 'Kitchen', 1, 99.95, 5, 0.45],
  ['Kitchen island stool', 'Article', 'Sede', 'Kitchen', 3, 179.0, 2, 0.16],
  ['Dining table, walnut, seats 6', 'Article', 'Seno', 'Dining room', 1, 1299.0, 2, 0.16],
  ['Dining chair, upholstered', 'Article', 'Sede', 'Dining room', 6, 249.0, 2, 0.16],
  ['Sideboard, 62 in', 'West Elm', 'Modern', 'Dining room', 1, 1099.0, 3, 0.22],
  ['Area rug, 8x10 wool', 'Rugs USA', 'Fern', 'Dining room', 1, 649.0, 3, 0.3],
  ['65" OLED television', 'LG', 'OLED65C3PUA', 'Living room', 1, 1796.99, 1, 0.15],
  ['Soundbar with subwoofer', 'Sonos', 'Arc', 'Living room', 1, 899.0, 2, 0.2],
  ['Sectional sofa, 3 piece', 'Article', 'Sven', 'Living room', 1, 2499.0, 3, 0.22],
  ['Coffee table, oak', 'CB2', 'Peekaboo', 'Living room', 1, 449.0, 3, 0.22],
  ['Floor lamp, arc', 'West Elm', 'Overarching', 'Living room', 2, 299.0, 3, 0.24],
  ['Bookcase, 5 shelf', 'Pottery Barn', 'Printer', 'Living room', 2, 599.0, 4, 0.26],
  ['Queen mattress, hybrid', 'Casper', 'Nova', 'Primary bedroom', 1, 1695.0, 2, 0.28],
  ['Bed frame, upholstered queen', 'West Elm', 'Andes', 'Primary bedroom', 1, 1299.0, 2, 0.2],
  ['Nightstand, 2 drawer', 'West Elm', 'Mid-Century', 'Primary bedroom', 2, 399.0, 2, 0.2],
  ['Dresser, 6 drawer', 'West Elm', 'Mid-Century', 'Primary bedroom', 1, 1199.0, 2, 0.2],
  ['Table lamp, ceramic', 'Target', 'Threshold', 'Primary bedroom', 2, 59.99, 3, 0.3],
  ['Bed linen set, queen', 'Brooklinen', 'Luxe Core', 'Primary bedroom', 2, 189.0, 2, 0.38],
  ['Twin mattress', 'Casper', 'Element', 'Bedroom 2', 1, 595.0, 3, 0.32],
  ['Bed frame, twin', 'IKEA', 'Malm', 'Bedroom 2', 1, 229.0, 4, 0.3],
  ['Desk, 48 in', 'IKEA', 'Micke', 'Bedroom 2', 1, 149.0, 4, 0.3],
  ['Desk chair, mesh', 'Herman Miller', 'Sayl', 'Bedroom 2', 1, 695.0, 3, 0.24],
  ['Laptop, 14 in', 'Apple', 'MacBook Pro M3', 'Bedroom 2', 1, 1999.0, 2, 0.33],
  ['Washing machine, front load', 'LG', 'WM4000HWA', 'Laundry', 1, 1049.0, 4, 0.3],
  ['Clothes dryer, electric', 'LG', 'DLEX4000W', 'Laundry', 1, 1049.0, 4, 0.3],
  ['Ironing board', 'Household Essentials', '971840', 'Laundry', 1, 49.99, 6, 0.5],
  ['Vacuum, cordless stick', 'Dyson', 'V15 Detect', 'Laundry', 1, 749.99, 2, 0.28],
  ['Bath towel set', 'Brooklinen', 'Super-Plush', 'Bathroom', 3, 89.0, 3, 0.42],
  ['Shower curtain and liner', 'Target', 'Threshold', 'Bathroom', 1, 34.99, 3, 0.45],
  ['Electric toothbrush', 'Philips', 'Sonicare 9900', 'Bathroom', 2, 249.99, 2, 0.35],
  ['Hair dryer', 'Dyson', 'Supersonic', 'Bathroom', 1, 429.99, 3, 0.32],
  ['Winter coat, wool', 'J.Crew', 'Chateau', 'Primary bedroom', 2, 298.0, 3, 0.45],
  ['Running shoes', 'Nike', 'Pegasus 40', 'Primary bedroom', 3, 129.99, 1, 0.5],
  ['Dress shirt', 'Charles Tyrwhitt', 'Non-Iron', 'Primary bedroom', 8, 59.5, 2, 0.5],
  ['Suit, two piece', 'SuitSupply', 'Lazio', 'Primary bedroom', 2, 599.0, 3, 0.42],
  ['Handbag, leather', 'Coach', 'Tabby 26', 'Primary bedroom', 1, 395.0, 2, 0.4],
  ['Patio dining set, 6 seat', 'Article', 'Kasienne', 'Patio', 1, 1899.0, 3, 0.28],
  ['Gas grill, 4 burner', 'Weber', 'Spirit E-425', 'Patio', 1, 949.0, 4, 0.3],
  ['Outdoor umbrella, 11 ft', 'Treasure Garden', 'Cantilever', 'Patio', 1, 699.0, 4, 0.34],
  ['Snow blower, two stage', 'Toro', 'Power Max 826', 'Garage', 1, 1299.0, 5, 0.35],
  ['Cordless drill kit', 'DeWalt', 'DCK299D1T1', 'Garage', 1, 399.0, 4, 0.32],
  ['Tool chest, 5 drawer', 'Husky', 'H52CH6TR9', 'Garage', 1, 549.0, 5, 0.3],
  ['Bicycle, hybrid', 'Trek', 'FX 3 Disc', 'Garage', 2, 799.99, 3, 0.3],
  ['Air compressor, 6 gal', 'Bostitch', 'BTFP02012', 'Garage', 1, 149.0, 6, 0.4],
]

/** Manual-only classes arrive unpriced (rule 12): blank cells, never zeros. */
type ManualSeed = [string, string, string, number, string]
const MANUAL_SEEDS: ManualSeed[] = [
  ["Ladies' diamond ring, 1.2 ct", 'Primary bedroom', 'Jewelry', 8, 'manual_class'],
  ['Gold tennis bracelet', 'Primary bedroom', 'Jewelry', 6, 'manual_class'],
  ['Oil painting, framed 30x40', 'Living room', 'Fine Arts', 12, 'manual_class'],
]

const round2 = (n: number) => Math.round(n * 100) / 100
const ISO = '2026-08-04T14:22:00Z'

function priced(seed: Seed, id: number): ClaimItem {
  const [description, make, model, room, quantity, rcv, age, deprPct] = seed
  const ext = round2(rcv * quantity)
  const tax = round2(rcv * quantity * TAX_RATE)
  const rcvIncl = round2(ext + tax)
  const deprAmt = round2(rcvIncl * deprPct)
  const acvIncl = round2(rcvIncl - deprAmt)
  return {
    id,
    claim_id: SAMPLE_CLAIM_ID,
    room_id: null,
    status: 'completed',
    manual_reason: null,
    valuation_basis: 'retail',
    is_manually_queried: false,
    category: null,
    query: `${make} ${model}`.trim(),
    room_area: room,
    make_mfr: make,
    model_number: model,
    description,
    quantity,
    rcv,
    acv: round2(rcv * (1 - deprPct)),
    tax,
    ext_cost: ext,
    rcv_total_incl: rcvIncl,
    depreciation_amount: deprAmt,
    acv_total_incl: acvIncl,
    depreciation_pct: deprPct,
    depreciation_method: 'straight_line',
    pcs_code: null,
    confidence: 0.93,
    age_years: age,
    alternative_sources: [],
    manual_source_url: null,
    error: null,
    created_at: ISO,
    updated_at: ISO,
  }
}

function unpriced(seed: ManualSeed, id: number): ClaimItem {
  const [description, room, , age, reason] = seed
  return {
    id,
    claim_id: SAMPLE_CLAIM_ID,
    room_id: null,
    status: 'needs_manual',
    manual_reason: reason as ClaimItem['manual_reason'],
    valuation_basis: null,
    is_manually_queried: false,
    category: null,
    query: null,
    room_area: room,
    make_mfr: null,
    model_number: null,
    description,
    quantity: 1,
    // Rule 12: unpriced means NULL, not zero. Derived cells render "—" and
    // contribute nothing to the totals.
    rcv: null,
    acv: null,
    tax: null,
    ext_cost: null,
    rcv_total_incl: null,
    depreciation_amount: null,
    acv_total_incl: null,
    depreciation_pct: null,
    depreciation_method: null,
    pcs_code: null,
    confidence: null,
    age_years: age,
    alternative_sources: [],
    manual_source_url: null,
    error: null,
    created_at: ISO,
    updated_at: ISO,
  }
}

/** 54 priced + 3 unpriced = the 57 items every marketing surface quotes. */
export const SAMPLE_ITEMS: ClaimItem[] = [
  ...SEEDS.map((s, i) => priced(s, i + 1)),
  ...MANUAL_SEEDS.map((s, i) => unpriced(s, SEEDS.length + i + 1)),
]

const total = (key: 'rcv_total_incl' | 'acv_total_incl' | 'tax' | 'depreciation_amount') =>
  round2(SAMPLE_ITEMS.reduce((a, r) => a + (r[key] ?? 0), 0))

export const SAMPLE_CLAIM: ClaimSummary = {
  claim_id: SAMPLE_CLAIM_ID,
  name: 'Doe — Kitchen fire',
  status: 'in_review',
  insured_name: 'John Doe',
  carrier: 'Allstate',
  policy_number: 'ASF-0042117-01',
  claim_number: 'CLM-2026-04412',
  loss_type: 'Fire',
  date_of_loss: '2026-07-18',
  loss_address: '456 Market St, Suite 200, Hauppauge, NY 11788',
  tax_rate: TAX_RATE,
  exported_at: null,
  item_count: SAMPLE_ITEMS.length,
  photo_count: 60,
  archived_at: null,
  closed_at: null,
  staging_status: null,
  total_rcv: total('rcv_total_incl'),
  total_acv: total('acv_total_incl'),
  total_tax: total('tax'),
  total_depreciation: total('depreciation_amount'),
  status_counts: {
    processing: 0,
    completed: SEEDS.length,
    needs_manual: MANUAL_SEEDS.length,
    failed: 0,
    overridden: 0,
  },
  created_at: '2026-07-19T09:04:00Z',
  updated_at: ISO,
}

export function itemsPage(limit: number, offset: number): ClaimItemListResponse {
  return {
    items: SAMPLE_ITEMS.slice(offset, offset + limit),
    count: SAMPLE_ITEMS.length,
    limit,
    offset,
  }
}

/** Distinct rooms, in the order they first appear, for the Room/Area filter. */
export const SAMPLE_ROOMS = [...new Set(SAMPLE_ITEMS.map((i) => i.room_area).filter(Boolean))].map(
  (name, i) => ({ id: i + 1, claim_id: SAMPLE_CLAIM_ID, name: name as string }),
)
