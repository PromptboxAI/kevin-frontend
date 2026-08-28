// Realistic claim data — household fire/water damage inventory
// Plain-English property content classes per the user's spec, with Xact codes
// kept as secondary muted labels.

const PCS_CATEGORIES = [
  'Electronics',
  'Major Appliances',
  'Small Appliances',
  'Audio / Video',
  'Furniture',
  'Bedding & Linens',
  'Kitchen & Housewares',
  'Clothing — Adult',
  'Clothing — Child',
  'Hobbies & Collectibles',
  'Sporting Goods',
  'Tools & Garage',
  'Outdoor & Patio',
  'Decor & Accessories',
  'Office',
  'Health & Beauty',
  'Books & Media',
  'Musical Instruments',
  'Toys & Games',
  'Pet Supplies',
  // Special-limits classes flagged in the grid:
  'Jewelry',
  'Firearms',
  'Fine Arts',
  'Furs',
];

// Explainer for rows Kevin refuses to price (rule 12) — no schedule, no rate.
const MANUAL_DEP_META = { method: 'manual', life: null, pct: null, rationale: '' };

// Items that trigger a special-limits warning under most carrier policies.
const SPECIAL_LIMITS = new Set(['Jewelry', 'Firearms', 'Fine Arts', 'Furs', 'Collectibles']);

// Base templates — extended/randomized to 500+ rows for virtual scroll demo.
const SAMPLE_BASE = [
  { desc: 'Sony 55" OLED 4K Smart TV',                       mfr: 'Sony',        model: 'XR-55A80L',             cat: 'Electronics',           age: 2,   dep: 22, rcv: 1499.99, conf: 'high', barcode: true },
  { desc: 'LG 65" OLED evo C3 Smart TV',                     mfr: 'LG',          model: 'OLED65C3PUA',           cat: 'Electronics',           age: 2,   dep: 22, rcv: 1599.99, conf: 'high', barcode: true },
  { desc: 'Samsung 75" QLED 4K Smart TV',                    mfr: 'Samsung',     model: 'QN75Q80CAFXZA',         cat: 'Electronics',           age: 1,   dep: 15, rcv: 1797.99, conf: 'high', barcode: true },
  { desc: 'Sonos Arc soundbar + Sub Mini',                   mfr: 'Sonos',       model: 'ARC + Sub Mini',        cat: 'Audio / Video',         age: 1.5, dep: 18, rcv: 1198.00, conf: 'high', barcode: true },
  { desc: 'Bose surround speakers, pair',                    mfr: 'Bose',        model: 'Surround 700',          cat: 'Audio / Video',         age: 3,   dep: 24, rcv:  549.00, conf: 'med', valuation_basis: 'like_kind_new', substitution_note: 'Bose Surround 700 is discontinued. Priced against the Bose Surround Speakers 800 (current model, same channel configuration and power rating).' },
  { desc: 'GE Profile French-door refrigerator, 27.7 cu ft', mfr: 'GE',          model: 'PFE28KYNFS',            cat: 'Major Appliances',      age: 5,   dep: 32, rcv: 2899.00, conf: 'high', barcode: true },
  { desc: 'Whirlpool dishwasher, stainless tub',             mfr: 'Whirlpool',   model: 'WDT750SAKZ',            cat: 'Major Appliances',      age: 4,   dep: 28, rcv:  849.00, conf: 'high', valuation_basis: 'like_kind_new', substitution_note: 'No current listings for the WDT750SAKZ. Priced against the WDT970SAKZ — same tub material, capacity, and decibel rating.' },
  { desc: 'LG WashTower stacked w/d unit',                   mfr: 'LG',          model: 'WKEX200HBA',            cat: 'Major Appliances',      age: 2,   dep: 18, rcv: 2199.00, conf: 'high', barcode: true },
  { desc: 'Wolf 36" gas range, 6-burner',                    mfr: 'Wolf',        model: 'GR366',                 cat: 'Major Appliances',      age: 6,   dep: 30, rcv: 6995.00, conf: 'med', valuation_basis: 'like_kind_new', substitution_note: 'GR366 superseded by the GR366-LP series. Priced against the current 36" 6-burner gas range at equivalent BTU output.' },
  { desc: 'KitchenAid stand mixer, 5-qt tilt-head',          mfr: 'KitchenAid',  model: 'KSM150PSER',            cat: 'Small Appliances',      age: 6,   dep: 45, rcv:  449.99, conf: 'high', barcode: true },
  { desc: 'Breville Barista Express espresso machine',       mfr: 'Breville',    model: 'BES870XL',              cat: 'Small Appliances',      age: 3,   dep: 28, rcv:  699.95, conf: 'high', barcode: true },
  { desc: 'Vitamix A3500 Ascent blender',                    mfr: 'Vitamix',     model: 'A3500',                 cat: 'Small Appliances',      age: 4,   dep: 26, rcv:  649.95, conf: 'high' },
  { desc: 'Ninja AF101 air fryer, 6-qt',                     mfr: 'Ninja',       model: 'AF101',                 cat: 'Small Appliances',      age: 2,   dep: 32, rcv:   99.99, conf: 'high', barcode: true },
  { desc: 'iRobot Roomba j7+ robot vacuum',                  mfr: 'iRobot',      model: 'j7+',                   cat: 'Small Appliances',      age: 2,   dep: 24, rcv:  599.00, conf: 'med' },
  { desc: 'Sectional sofa, 3-piece, performance fabric',     mfr: 'West Elm',    model: 'Harmony 3-Piece',       cat: 'Furniture',             age: 4,   dep: 32, rcv: 2899.00, conf: 'med' },
  { desc: 'Queen platform bed frame, upholstered',           mfr: 'Article',     model: 'Sven Bed',              cat: 'Furniture',             age: 3,   dep: 22, rcv: 1099.00, conf: 'high' },
  { desc: 'Walnut bookshelf, 6-tier',                        mfr: 'Crate & Barrel', model: 'Tate Walnut',        cat: 'Furniture',             age: 6,   dep: 30, rcv: 1099.00, conf: 'med' },
  { desc: 'Counter-height bar stool, walnut',                mfr: 'CB2',         model: 'Stuart',                cat: 'Furniture',             age: 5,   dep: 38, rcv:  199.00, conf: 'med' },
  { desc: 'Dining table, oak, seats 6',                      mfr: 'Pottery Barn',model: 'Toscana 74"',           cat: 'Furniture',             age: 7,   dep: 35, rcv: 1799.00, conf: 'med' },
  { desc: 'Herman Miller Aeron task chair, Size B',          mfr: 'Herman Miller', model: 'Aeron, Size B',       cat: 'Office',                age: 4,   dep: 24, rcv: 1745.00, conf: 'high', barcode: true },
  { desc: 'Uplift V2 standing desk, 60×30 bamboo',           mfr: 'Uplift',      model: 'V2 Commercial',         cat: 'Office',                age: 2,   dep: 18, rcv:  949.00, conf: 'med' },
  { desc: 'Brother color laser printer, AIO',                mfr: 'Brother',     model: 'MFC-L8905CDW',          cat: 'Office',                age: 3,   dep: 38, rcv:  549.99, conf: 'med' },
  { desc: 'MacBook Pro 14" M3 Pro, 18GB / 512GB',            mfr: 'Apple',       model: 'A2992',                 cat: 'Electronics',           age: 1,   dep: 15, rcv: 1999.00, conf: 'high', barcode: true },
  { desc: 'iPad Air 11" (M2) w/ keyboard',                   mfr: 'Apple',       model: 'iPad Air M2',           cat: 'Electronics',           age: 0.5, dep:  8, rcv:  749.00, conf: 'high', barcode: true },
  { desc: 'Sony α7 IV mirrorless camera body',               mfr: 'Sony',        model: 'ILCE-7M4',              cat: 'Electronics',           age: 2,   dep: 22, rcv: 2499.99, conf: 'high', barcode: true },
  { desc: 'Sony FE 24-70mm f/2.8 GM II lens',                mfr: 'Sony',        model: 'SEL2470GM2',            cat: 'Electronics',           age: 2,   dep: 18, rcv: 2298.00, conf: 'med' },
  { desc: 'Bose QuietComfort Ultra headphones',              mfr: 'Bose',        model: 'QC Ultra',              cat: 'Electronics',           age: 1,   dep: 18, rcv:  429.00, conf: 'high', barcode: true },
  { desc: 'PlayStation 5 Slim console + controller',         mfr: 'Sony',        model: 'PS5 Slim',              cat: 'Electronics',           age: 1,   dep: 14, rcv:  499.99, conf: 'high', barcode: true },
  { desc: 'Nintendo Switch OLED + dock',                     mfr: 'Nintendo',    model: 'HEG-001',               cat: 'Electronics',           age: 2,   dep: 20, rcv:  349.99, conf: 'high' },
  { desc: 'Queen mattress, hybrid foam/coil',                mfr: 'Casper',      model: 'Wave Hybrid',           cat: 'Bedding & Linens',      age: 3,   dep: 25, rcv: 2295.00, conf: 'high' },
  { desc: 'King down comforter, all-season',                 mfr: 'Brooklinen',  model: 'Down Duvet',            cat: 'Bedding & Linens',      age: 2,   dep: 38, rcv:  309.00, conf: 'med' },
  { desc: 'Sateen sheet set, queen',                         mfr: 'Brooklinen',  model: 'Luxe Core',             cat: 'Bedding & Linens',      age: 2,   dep: 40, rcv:  189.00, conf: 'med' },
  { desc: 'Down-alternative pillow, standard',               mfr: 'Brooklinen',  model: 'Down Alt Plush',        cat: 'Bedding & Linens',      age: 1,   dep: 35, rcv:   65.00, conf: 'low' },
  { desc: 'All-Clad D3 cookware set, 10-piece',              mfr: 'All-Clad',    model: 'D3 Stainless 10-pc',    cat: 'Kitchen & Housewares',  age: 7,   dep: 35, rcv:  899.95, conf: 'high' },
  { desc: 'Wüsthof Classic 8" chef knife',                   mfr: 'Wüsthof',     model: '4582-7/20',             cat: 'Kitchen & Housewares',  age: 5,   dep: 28, rcv:  169.95, conf: 'med' },
  { desc: 'Le Creuset 5.5-qt round Dutch oven',              mfr: 'Le Creuset',  model: 'Signature 5.5qt',       cat: 'Kitchen & Housewares',  age: 6,   dep: 18, rcv:  450.00, conf: 'med' },
  { desc: 'Hand-knotted wool area rug, 8×10',                mfr: 'Loloi',       model: 'Hagen HAG-04',          cat: 'Decor & Accessories',   age: 4,   dep: 30, rcv:  899.00, conf: 'med' },
  // Vision would not corroborate any OCR text, so the backend sends EMPTY
  // desc/mfr/model rather than a hallucinated guess (reason `no_query`). The
  // class still has to be a real one — the grid's dropdown and the depreciation
  // schedule both key off it — so it carries the clusterer's best guess and the
  // adjuster corrects it along with the description.
  { desc: '', mfr: '', model: '', cat: 'Decor & Accessories', age: 3, dep: 0, rcv: 0, conf: 'low', needs_manual: true, manual_reason: 'no_query' },
  { desc: 'Arc floor lamp, marble base',                     mfr: 'CB2',         model: 'Big Dipper',            cat: 'Decor & Accessories',   age: 3,   dep: 24, rcv:  449.00, conf: 'med' },
  { desc: 'Wall mirror, 36" round brass frame',              mfr: 'Anthropologie', model: 'Gleaming Primrose',   cat: 'Decor & Accessories',   age: 2,   dep: 20, rcv:  498.00, conf: 'med' },
  { desc: 'Men\'s wool topcoat, charcoal, size 42R',          mfr: 'Brooks Brothers', model: 'Saxxon Wool',       cat: 'Clothing — Adult',      age: 4,   dep: 35, rcv:  998.00, conf: 'med', valuation_basis: 'comparable_sale' },
  { desc: 'Women\'s leather jacket, lambskin, size M',        mfr: 'AllSaints',   model: 'Balfern',               cat: 'Clothing — Adult',      age: 3,   dep: 30, rcv:  549.00, conf: 'low', needs_manual: true, manual_reason: 'no_comps' },
  { desc: 'Running shoes, size 10.5',                        mfr: 'Nike',        model: 'Pegasus 41',            cat: 'Clothing — Adult',      age: 1,   dep: 45, rcv:  140.00, conf: 'med', needs_manual: true, manual_reason: 'quota_exhausted' },
  { desc: 'Boys\' winter parka, size 10',                    mfr: 'The North Face', model: 'Freedom Insulated',  cat: 'Clothing — Child',      age: 2,   dep: 40, rcv:  170.00, conf: 'med' },
  { desc: 'Taylor 214ce acoustic guitar',                    mfr: 'Taylor',      model: '214ce',                 cat: 'Musical Instruments',   age: 8,   dep: 22, rcv: 1099.00, conf: 'high', barcode: true },
  { desc: 'Yamaha P-125 digital piano',                      mfr: 'Yamaha',      model: 'P-125a',                cat: 'Musical Instruments',   age: 5,   dep: 30, rcv:  749.99, conf: 'high', barcode: true },
  { desc: 'Peloton Bike+ indoor cycle',                      mfr: 'Peloton',     model: 'Bike+',                 cat: 'Sporting Goods',        age: 3,   dep: 32, rcv: 2495.00, conf: 'high' },
  { desc: 'Carbon-frame road bike, 56cm',                    mfr: 'Trek',        model: 'Domane SL 6',           cat: 'Sporting Goods',        age: 4,   dep: 28, rcv: 3899.00, conf: 'med' },
  { desc: 'Compound bow w/ accessories',                     mfr: 'Mathews',     model: 'Phase4 33',             cat: 'Sporting Goods',        age: 3,   dep: 22, rcv: 1399.00, conf: 'med' },
  { desc: 'DeWalt 20V cordless drill kit',                   mfr: 'DeWalt',      model: 'DCD771C2',              cat: 'Tools & Garage',        age: 6,   dep: 42, rcv:  129.00, conf: 'high', barcode: true },
  { desc: 'Milwaukee M18 impact driver kit',                 mfr: 'Milwaukee',   model: '2853-22',               cat: 'Tools & Garage',        age: 4,   dep: 30, rcv:  259.00, conf: 'high', barcode: true },
  { desc: 'Sun Joe electric pressure washer, 2000 PSI',      mfr: 'Sun Joe',     model: 'SPX3000',               cat: 'Tools & Garage',        age: 4,   dep: 38, rcv:  169.00, conf: 'med' },
  { desc: 'Weber Spirit II 4-burner gas grill',              mfr: 'Weber',      model: 'Spirit II E-410',       cat: 'Outdoor & Patio',       age: 5,   dep: 38, rcv:  749.00, conf: 'med' },
  { desc: 'Patio dining chair, powder-coated steel',         mfr: 'Article',     model: 'Madra',                 cat: 'Outdoor & Patio',       age: 3,   dep: 28, rcv:  149.00, conf: 'med', needs_manual: true, manual_reason: 'budget_exhausted' },
  // Special-limits items — should flag amber in the grid
  { desc: 'Diamond solitaire engagement ring, 1.5ct',        mfr: 'Tiffany & Co.', model: 'Setting (Platinum)',  cat: 'Jewelry',               age: 6,   dep: 12, rcv:18500.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Men\'s automatic dive watch, ceramic bezel',      mfr: 'Rolex',       model: 'Submariner 124060',     cat: 'Jewelry',               age: 4,   dep: 10, rcv:10995.00, conf: 'med', barcode: true, needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Tennis bracelet, 5ct diamond, 14kt white gold',   mfr: 'Blue Nile',   model: 'Classic 5ct',           cat: 'Jewelry',               age: 8,   dep: 15, rcv: 7200.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Pearl strand necklace, 18", Akoya',               mfr: 'Mikimoto',    model: '6-6.5mm Akoya',         cat: 'Jewelry',               age: 12,  dep: 18, rcv: 2950.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Semi-auto pistol, 9mm, w/ case',                  mfr: 'Sig Sauer',   model: 'P320 X-Carry',          cat: 'Firearms',              age: 3,   dep: 18, rcv:  799.00, conf: 'med',  barcode: true, needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Bolt-action rifle, .308, scoped',                 mfr: 'Tikka',       model: 'T3x Lite',              cat: 'Firearms',              age: 5,   dep: 20, rcv: 1199.00, conf: 'med', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Over/under shotgun, 12 gauge',                    mfr: 'Beretta',     model: '686 Silver Pigeon I',   cat: 'Firearms',              age: 9,   dep: 22, rcv: 2499.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Original oil painting, signed, framed 30×40"',    mfr: ''            , model: ''             ,         cat: 'Fine Arts',             age: 15,  dep:  8, rcv: 8500.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Limited-edition lithograph, numbered 47/250',     mfr: ''            , model: ''              ,        cat: 'Fine Arts',             age: 10,  dep: 10, rcv: 2400.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Sterling silver flatware set, 8-place setting',   mfr: 'Reed & Barton', model: 'Francis I',           cat: 'Fine Arts',             age: 20,  dep:  6, rcv: 4800.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
  { desc: 'Full-length mink coat, size 8',                   mfr: ''            , model: ''                  ,    cat: 'Furs',                  age: 18,  dep: 25, rcv: 6500.00, conf: 'low', needs_manual: true, manual_reason: 'manual_class' },
];

// THE REAL CLAIM — 57 line items extracted verbatim from the backend's own
// export (uploads/chaos3-new-20260814-inventory.xlsx), matching the 60 photos
// in assets/claim/. Descriptions, brands, rooms, and unit costs are the actual
// production run; sheet's test placeholders (insured/carrier/8.25%) are NOT
// adopted — claim identity and tax stay canonical (Godfrey · Allstate · 8.625%,
// tax lines re-derive at the claim rate per the money contract). Blank
// make/model cells are the backend's uncorroborated-OCR blanks (rule 2b).
// Content classes come from the sheet's PCS codes (column G), mapped through
// the locked 24-class taxonomy (TOY→Toys & Games, CLH→Clothing — Adult, …).
const REAL_INVENTORY = [
  { desc: 'Hot Wheels \'70 Plymouth Road Runner Diecast Toy Car, Blue Packaging', mfr: 'Hot Wheels', model: '', cat: 'Toys & Games', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 12.00, conf: 'high', link: 'https://www.walmart.com/ip/Hot-Wheels-2009-New-Models-Orange-70-Plymouth-Aar-Cuda-Toy-Car-29-190/5042095148?wmlspartner=wlpa&selectedSellerId=101365048&veh=seo_fpl&cn=google' },
  { desc: 'Black Rubber-Soled Boot, Madden Brand', mfr: 'Madden', model: '', cat: 'Clothing — Adult', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 129.95, conf: 'high', link: 'https://www.stevemadden.com/products/labelle-black?variant=41247150342277?utm_source=google&utm_medium=organic&utm_campaign=freeshopping&srsltid=AfmBOopfrmHD9hjo7jAtVjwdYpKP7opBfiGnlqj9-XMW80KmeCoBHVjl8w4' },
  { desc: 'Marvin Gaye In Concert DVD, 2-Disc Set', mfr: '', model: '', cat: 'Books & Media', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 12.00, conf: 'med', link: 'https://www.amazon.com/Love-Marvin-Greatest-Songs/dp/B0033WLG8W/ref=sr_1_3?keywords=Marvin+Gaye+In+Concert+DVD+2+disc+set&nsdOptOutParam=true&qid=1786659309&sr=8-3' },
  { desc: 'Gold Metallic Strappy Sandal, Bakers Brand', mfr: 'Bakers', model: '', cat: 'Clothing — Adult', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 84.50, conf: 'high', link: 'https://www.boscovs.com/product/womens-naturalizer-baylor-glitter-dress-sandals/672343?utm_source=Google&utm_term=672343&utm_content=shoes%20%3E%20womens%20shoes%20%3E%20all%20ladies%20shoes&utm_campaign=CSE&cid=CSE:Google&mrColor=GOLD&mrSize=9.5-M&utm_medium=freePLA&srsltid=AfmBOoqXrB2NRBdgUgh7MO2N7RmfHl3Y_yLbU0cMCBjnuaCVbNGJkTkZpeA' },
  { desc: 'Honeywell FilterPower Replacement Vacuum Filter for Bissell 7.9 Model', mfr: 'Honeywell', model: '', cat: 'Major Appliances', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 16.49, conf: 'high', link: 'https://www.bissell.com/en-us/product/filter-for-select-stick-vacs-1620624.html?languageok=1' },
  { desc: 'Metal Chain Accessory, Unbranded', mfr: '', model: '', cat: 'Decor & Accessories', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 19.89, conf: 'med', link: 'https://www.walmart.com/ip/Iron-Chain-Leash-Big-Chain-Leash-Chain-Link-Leash-Fake-Large-Chain-Leash-for-Fun/20429058805?wmlspartner=wlpa&selectedSellerId=103130412&veh=seo_fpl&cn=google' },
  { desc: 'UGG Fur Pom Slide Sandal, Blue/Tan', mfr: 'UGG', model: '', cat: 'Clothing — Adult', room: 'Playroom', qty: 1, age: 0, dep: 0, rcv: 120.00, conf: 'high', link: 'https://www.ugg.com/women-slippers/fluff-yeah-slide/1095119.html?dwvar_1095119_color=RDZ' },
  { desc: 'Decorative Shell Ornament, Brown/White', mfr: '', model: '', cat: 'Decor & Accessories', room: 'Kitchen', qty: 1, age: 0, dep: 0, rcv: 14.99, conf: 'med', link: 'https://www.target.com/p/gallerie-ii-coastal-shell-ornament/-/A-91723481?TCID=OGS&AFID=google&CPNG=Seasonal+-+Target+Plus&adgroup=51-6&srsltid=AfmBOoomoP6ZcTnMff6kPzLc27Jy9qdfSLS7X9_nv32rMhU1Xhf3XiqbhTs' },
  { desc: 'Olay Moisturizing Bar Soap', mfr: 'Olay', model: '', cat: 'Health & Beauty', room: 'Kitchen', qty: 1, age: 0, dep: 0, rcv: 8.99, conf: 'high', link: 'https://www.walmart.com/ip/Olay-Ultra-Moisture-Age-Defy-8-Bar-Soap-3-75-oz/17721168971?wmlspartner=wlpa&selectedSellerId=0&veh=seo_fpl&cn=google' },
  { desc: 'Dove Moisturizing Beauty Bar Soap', mfr: 'Dove', model: '', cat: 'Health & Beauty', room: 'Kitchen', qty: 1, age: 0, dep: 0, rcv: 9.24, conf: 'high', link: 'https://www.walmart.com/ip/Dove-Care-and-Protect-Antibacterial-Beauty-Bar-Soap-All-Skin-Type-Unscented-3-75-oz-4-Bars/535715038?wmlspartner=wlpa&selectedSellerId=0&veh=seo_fpl&cn=google' },
  { desc: 'Super Value Terry Dobby Dish Cloths, Blue/White, Set of 6', mfr: 'Super Value', model: '', cat: 'Kitchen & Housewares', room: 'Kitchen', qty: 1, age: 0, dep: 0, rcv: 18.98, conf: 'high', link: 'https://www.walmart.com/ip/100-Cotton-Terry-Dish-Towels-6-Pack-Window-Panel-Kitchen-Easy-Clean-Everyday-Use-Ultra-Absorbent-Maximum-Softness-Machine-Washable-15-x-25-inch/12806270831?wmlspartner=wlpa&selectedSellerId=101316037&selectedOfferId=27ACED235B8934AF99EF1F8B4C729FCE&conditionGroupCode=1&veh=seo_fpl&cn=google' },
  { desc: 'Multicolor Paisley Print Silk Scarf/Shawl', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Kitchen', qty: 1, age: 0, dep: 0, rcv: 49.00, conf: 'med', link: 'https://www.ellesilk.com/double-sided-square-silk-scarf.html?srsltid=AfmBOopf_r87WdtZxHp6-wP-e7ATH4qMz2kUDYcNZTIgDPHtGwFOvKhzD7s' },
  { desc: 'Tan Wicker Clutch Handbag with Leather Flap and Metal Clasp', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Kitchen', qty: 1, age: 0, dep: 0, rcv: 149.75, conf: 'med', link: 'https://www.macys.com/shop/product/patricia-nash-santorini-medium-woven-straw-satchel?ID=21099157&pla_country=US&CAGPSPN=pla&swatchColor=Natural/Black&swatchSize=ONE%20SIZE' },
  { desc: 'Rite Aid Home Brand No. 10 Plain Business Envelopes, Box of 50', mfr: 'Rite Aid', model: '', cat: 'Office', room: 'Bedroom', qty: 1, age: 0, dep: 0, rcv: 18.28, conf: 'high', link: 'https://www.amazon.com/AmazonBasics-10-Security-Tinted-Envelopes/dp/B00V5DGIL6/ref=sr_1_13?keywords=Rite+Aid+Home+business+envelopes+no.+10&qid=1786669698&sr=8-13' },
  { desc: 'Tan Velvet Clutch Bag with Pearl Chain Strap', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bedroom', qty: 1, age: 0, dep: 0, rcv: 35.99, conf: 'med', link: 'https://presentsofmind.org/products/light-beige-clutch' },
  { desc: 'Hot Pink Studded Leather Shoulder Bag with Chain Strap', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bedroom', qty: 1, age: 0, dep: 0, rcv: 210.00, conf: 'med', link: 'https://www.farfetch.com/shopping/women/kurt-geiger-london-the-kensington-quilted-suede-shoulder-bag-item-33583566.aspx?lang=en-US&fsb=1&size=1' },
  { desc: 'Pink Studded Heart-Shaped Purse Accessory', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bedroom', qty: 1, age: 0, dep: 0, rcv: 17.57, conf: 'med', link: 'https://www.victoriassecret.com/us/pink/accessories-catalog/5000011016?genericId=11280921&choice=79S5' },
  { desc: 'Magenta Sheer Lace Lingerie Garment', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Guest Bedroom', qty: 1, age: 0, dep: 0, rcv: 36.25, conf: 'med', link: 'https://www.hsialife.com/products/serenata-flora-lace-mesh-full-coverage-bra?variant=47234571960569&country=US&currency=USD&utm_medium=product_sync&utm_source=google&utm_content=sag_organic&utm_campaign=sag_organic&srsltid=AfmBOorTUH2CV63QrPH4Mnwv1yhQFx3HpmjzhihACR6B66bKFYskg-WZBu8' },
  { desc: 'Black Woven Fabric Belt/Strap', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Guest Bedroom', qty: 1, age: 0, dep: 0, rcv: 14.00, conf: 'med', link: 'https://www.target.com/p/men-39-s-stretch-fabric-braided-fully-adjustable-web-belt-goodfellow-38-co-8482-black-m/-/A-92927952?TCID=OGS&AFID=google&CPNG=Men&adgroup=44-4&srsltid=AfmBOorZpJos-LNez85DLdr8_nYTHxQTnTu0JjhDQA1rMr_cNmqBIHyjWgs' },
  { desc: 'Blue Metallic Floral-Print Travel Cosmetics/Jewelry Case', mfr: '', model: '', cat: 'Health & Beauty', room: 'Guest Bedroom', qty: 1, age: 0, dep: 0, rcv: 43.50, conf: 'med', link: 'https://www.target.com/p/large-cute-floral-makeup-bag-for-women-coquette-aesthetic-travel-cosmetic-organizer-toiletry-bag-yellow-flower/-/A-1009347777?TCID=OGS&AFID=google&CPNG=Beauty+-+Target+Plus&adgroup=52-15&srsltid=AfmBOooS2kwOaOZBrr6knJ2FclYfmYfZUjsBmCzoRtGL7ask7aPXBH7djNk' },
  { desc: 'Personal Manicure/Pedicure Grooming Kit with Nail Polish Set', mfr: '', model: '', cat: 'Health & Beauty', room: 'Guest Bedroom', qty: 1, age: 0, dep: 0, rcv: 37.00, conf: 'med', link: 'https://www.walmart.com/ip/OLIVE-JUNE-GEL-POLISH-STARTER-KIT/14400453717?wl13=5393&wmlspartner=wlpa&selectedSellerId=0&veh=seo_sll&cn=google' },
  { desc: 'Hue Sheers Silky Sheer Control-Top Pantyhose, Black, Size 4', mfr: 'Hue', model: '17114', cat: 'Clothing — Adult', room: 'Guest Bedroom', qty: 1, age: 0, dep: 0, rcv: 12.47, conf: 'high', link: 'https://hue.com/products/essentials-solutions-clear-control-top-pantyhose-black?variant=41465083527229&srsltid=AfmBOopbErF77Xjl5WIUtvsvJe2TNtdUfEu1Y5JUWC-YsBe1FdR3VsRmWLI' },
  { desc: 'Black Leather Belt with Metal Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Guest Bedroom', qty: 1, age: 0, dep: 0, rcv: 43.46, conf: 'med', link: 'https://www.loft.com/accessories-shoes/belts/cat920004/molded-buckle-leather-belt/767337.html?dwvar_767337_color=2222&dwvar_767337_size=902&currency=USD&country=US' },
  { desc: 'Tan Nylon Webbing Belt with Metal Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 17.49, conf: 'med', link: 'https://www.target.com/p/anna-kaci-women-s-nylon-tactical-belt-with-metal-buckle-heavy-duty-outdoor-casual-belt-brown/-/A-1007283252?TCID=OGS&AFID=google&CPNG=Accessories+-+Target+Plus&adgroup=61-6&srsltid=AfmBOoqUEYzzz9u2EKTpAEEnNPbG3GARrv5LvngeHr_vkmGxvOpnkSbyVjE' },
  { desc: 'Dark Brown Leather Belt with Metal Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 53.50, conf: 'med', link: 'https://www.buckle.com/ariat-leather-belt/prd-54915A1019444/sku-9459554600?color=brown&size=46&srsltid=AfmBOoq6xMdldmcZunPIo727VFEkuV4-4ZWlOWnvk8-vNQY5Gp4YwZKlTNI' },
  { desc: 'Cream Leather Belt with Studded Brown Leather Ends', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 68.00, conf: 'med', link: 'https://shop.tiktok.com/us/pdp/cologne-b-fragranced-essence-of-me-3-4oz-unisex-bergamot-jasmine-musk/1730044694982070523' },
  { desc: 'Brown Leather Belt with Metal Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 43.48, conf: 'med', link: 'https://www.nordstrom.com/s/classic-leather-belt/8607023?color=cognac&size=x-large&utm_source=google&utm_medium=organic&utm_campaign=seo_shopping&srsltid=AfmBOopWFHXITUP-eUrWz6WgqFKh_6Eow_dJn62cm3epwZWIiKIoI0q8kkI' },
  { desc: 'Snake-Print Patterned Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 37.00, conf: 'med', link: 'https://leatherbeltsonline.com/product/olive-green-suede-snake-print-belt-strap-without-buckle/?attribute_pa_size=30-75-cm?utm_source=google&utm_medium=organic&utm_campaign=organicshopping' },
  { desc: 'Ornate Gold-Tone Decorative Buckle or Brooch', mfr: '', model: '', cat: 'Jewelry', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 0.00, conf: 'med' },
  { desc: 'Dark Brown Patent Leather Belt with Rhinestone Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 34.97, conf: 'med', link: 'https://www.zumiez.com/vitriol-chrome-veil-rhinestone-black-belt.html?utm_source=google_shopping&utm_medium=cpc&utm_term=40458306670001&utm_campaign=google_shopping&srsltid=AfmBOop-OCuTvUzj2burTxtgoEjExBWf0DCl_vra1ZZMLAcYouuuZ-ZWVuU' },
  { desc: 'Woven Rope-Style Belt with Brass Ring Closure', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 68.00, conf: 'med', link: 'https://www.vineyardvines.com/product/mens-belts/washed-braided-rope-d-ring-belt/199254394048.html' },
  { desc: 'Pink Studded Leather Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 26.68, conf: 'med', link: 'https://us.subdued.com/products/ci02yr5?variant=42803954221152' },
  { desc: 'Black Snake-Embossed Leather Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Bathroom', qty: 1, age: 0, dep: 0, rcv: 129.99, conf: 'med', link: 'https://www.guadalajarawesternwear.com/products/los-altos-grasso-black-genuine-ostrich-leg-leather-cowboy-belt-silver-buckle-copy?srsltid=AfmBOor4-ZpUAEN-MhrH4VAxmVsH3QKiLh3739matzKlm5dtOcBuvy7Rs_w' },
  { desc: 'Tan Braided Leather Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 58.45, conf: 'med', link: 'https://www.kohls.com/product/prd-6849874/mens-lands-end-leather-braid-belt.jsp?skuid=50502057&CID=seo_offers&utm_campaign=SAG&utm_medium=organic&utm_source=google&utm_product=50502057' },
  { desc: 'Red Woven Webbing Strap Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 15.97, conf: 'med', link: 'http://www.beltoutlet.com/products/ctm-cotton-web-belt-with-d-ring-buckle?variant=21248062488660&srsltid=AfmBOoohPaOlOimPNDNSkGCCyEE3khia951TyGnP9LqEjKN2bb6vKB9TpdI' },
  { desc: 'Black Woven Leather Belt with Eyelet Detailing', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 69.50, conf: 'med' },
  { desc: 'Michael Kors Woven Leather Mini Pouch Bag', mfr: 'Michael Kors', model: '', cat: 'Decor & Accessories', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 99.25, conf: 'high', link: 'https://www.michaelkors.com/mina-small-signature-logo-chain-crossbody-bag/35H3G4MC1B.html?skuId=623727803&colorExplode=true&source=googleshopping' },
  { desc: 'Orange-Handled Craft Scissors', mfr: '', model: '', cat: 'Tools & Garage', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 13.13, conf: 'med', link: 'https://www.walmart.com/ip/Fiskars-Inc-34527797-8-Left-Right-Handed-Scissors-Each/12356350?wmlspartner=wlpa&selectedSellerId=0&veh=seo_fpl&cn=google' },
  { desc: 'Genuine Leather Belt with Metal Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 29.99, conf: 'med', link: 'https://www.johnstonmurphy.com/p/mens-belts/scored-roller-buckle-belt/07508433-42.html?country=US&currency=USD' },
  { desc: 'Black Woven Rope Strap with Metal Ring', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 20.99, conf: 'med', link: 'https://www.mah-official.com/products/rope-strap?currency=USD&country=US&variant=44480312967350&utm_source=google&utm_medium=cpc&utm_campaign=Google%20Shopping&stkn=64283ee4badb&srsltid=AfmBOorrOwUPx2emEI-QNKEM20pQbevRGl2YYFBDGntvECJAGo0kXa6sqXY' },
  { desc: 'Leather Strap with Punched Holes, Black/Orange', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Master Closet', qty: 1, age: 0, dep: 0, rcv: 29.49, conf: 'med', link: 'https://wristenvy.co.uk/products/hole-punched-premium-leather-watch-strap-band-18mm-20mm-22mm-24mm-black-orange?variant=45526431138073&country=US&currency=USD&utm_medium=product_sync&utm_source=google&utm_content=sag_organic&utm_campaign=sag_organic&srsltid=AfmBOorDjgXiU53LnE8bUlBcedUZe7lFAiOwpgLQ5OCcV0rGhvdMACpw0HQ' },
  { desc: 'Brown Leather Belt, Unbranded', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 39.98, conf: 'med', link: 'https://www.nordstromrack.com/s/made-in-italy-pebbled-leather-belt/8656306?color=brown&size=38&utm_source=google&utm_medium=organic&utm_campaign=seo_shopping&srsltid=AfmBOopZsolPDjphdPImWW8OBQ--wXQTk90qg2qf0Go0iVEruu8-l_qG5GU' },
  { desc: 'Tan Woven Canvas Belt, Unbranded', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 24.99, conf: 'med', link: 'https://hemptique.com/products/hemp-belt?variant=5678151553&country=US&currency=USD&utm_medium=product_sync&utm_source=google&utm_content=sag_organic&utm_campaign=sag_organic&srsltid=AfmBOop1aK78PbPzBsoQBVhr53k-D3uGAoC35UfuRcy2pb5pgrBAnIvWGow' },
  { desc: 'Guess Branded Leather Belt with Silver Buckle, Black', mfr: 'Guess', model: '', cat: 'Clothing — Adult', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 71.12, conf: 'high', link: 'https://sneakin.shop/bw9166-p4235-llr-women-s-belt-guess-noelle-h35-latte-logo-rosewood?variant=14190800&srsltid=AfmBOoqVB-kHIfaeF4Gu37xpL3iHJnjdypsRU-y7CeDSIps14_K5ueCvJIA' },
  { desc: 'Brown Leather Belt with Metal Buckle, Unbranded', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 52.00, conf: 'med', link: 'https://www.buckle.com/ariat-leather-belt/prd-54915A1019444/sku-9459554200?color=brown&size=42&srsltid=AfmBOooEFWy9n0j3Uuro55aP5vBGYGxHBa0DPeCU_IEwRwX6jBGkR_or3xw' },
  { desc: 'Yellow-Handled Household Scissors', mfr: '', model: '', cat: 'Tools & Garage', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 13.79, conf: 'med', link: 'https://www.walmart.com/ip/LIVINGO-Office-Scissors-Titanium-Non-Stick-Sharp-Steel-for-Adult-8-2-Pack-Yellow/2554926370?wmlspartner=wlpa&selectedSellerId=103088132&veh=seo_fpl&cn=google' },
  { desc: 'Brown-Tinted Plastic Sunglasses, Unbranded', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 49.00, conf: 'med', link: 'https://www.wmpeyewear.com/products/francis-polarized?variant=43042310389849&country=US&currency=USD&utm_medium=product_sync&utm_source=google&utm_content=sag_organic&utm_campaign=sag_organic&srsltid=AfmBOopecwizUKeHid25L9oh65D7JK_8N4NFpsVZJJE48DvPdjCOlVuWlaE' },
  { desc: 'Brass Padlock with Attached Keys', mfr: '', model: '', cat: 'Tools & Garage', room: 'Living Room', qty: 1, age: 0, dep: 0, rcv: 20.32, conf: 'med', link: 'https://www.walmart.com/ip/Solid-Brass-Padlock-with-Key-Pad-Lock-1-1-2-in-Wide-Lock-Body-Fence-Locker/3183181927?wmlspartner=wlpa&selectedSellerId=101125195&veh=seo_fpl&cn=google' },
  { desc: 'Mainstays Black 5x7 Desk Picture Frame', mfr: 'Mainstays', model: '', cat: 'Decor & Accessories', room: 'Dining Room', qty: 1, age: 0, dep: 0, rcv: 8.88, conf: 'high', link: 'https://www.walmart.com/ip/Mainstays-5x7-Linear-Gallery-Wall-Picture-Frame-Brown/14895472018?wl13=1120&wmlspartner=wlpa&selectedSellerId=0&veh=seo_sll&cn=google' },
  { desc: 'Kwikset Security Double Cylinder Deadbolt Lock Set', mfr: 'Kwikset', model: '', cat: 'Tools & Garage', room: 'Dining Room', qty: 1, age: 0, dep: 0, rcv: 47.22, conf: 'high', link: 'https://www.walmart.com/ip/Kwikset-985-Double-Cylinder-Deadbolt-featuring-SmartKey-in-Polished-Brass/921831654?wmlspartner=wlpa&selectedSellerId=101278734&veh=seo_fpl&cn=google' },
  { desc: 'Black Leather Studded Belt with Gold-Tone Buckle', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Dining Room', qty: 1, age: 0, dep: 0, rcv: 44.00, conf: 'med', link: 'https://laticci.com/punk-rock-inspired-mix-studded-arrow-belt-laticci-lb-10114?srsltid=AfmBOopaUZozA6-YtdEa4hBWtrOjNWp8lSug4oAnNYExDctF3stpvaFvXMo' },
  { desc: 'Samsung 35mm Film Point-and-Shoot Camera with Red-Eye Reduction', mfr: 'Samsung', model: '35MM', cat: 'Electronics', room: 'Dining Room', qty: 1, age: 0, dep: 0, rcv: 97.00, conf: 'high', link: 'https://www.atlantaworldwide.com/product/samsung-maxima-zoom-70-xl/OZ3CJ2HIQPLZEK2PU6YLCAWA?cfa=gpl&channel=CH_96AYvDXvd3WGgHZzrCraHc4QgguaLrmNqurfYRlQuYC&srsltid=AfmBOoqAFklZ2mc6oeBuD7ktE7AM9DVyTWjSkBWPO398pM-laN_HAnzb16o' },
  { desc: 'Black Leather Strap Accessory', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Dining Room', qty: 1, age: 0, dep: 0, rcv: 34.50, conf: 'med', link: 'https://www.archerwatchstraps.com/products/quick-release-leather-black-natural?currency=USD&country=US&variant=40510559944787&utm_source=google&utm_medium=cpc&utm_campaign=Google%20Shopping&stkn=967cbb9e06f9&srsltid=AfmBOoppHCYc4E8sLc5NO9q0oPBw8r0BgTJzjBIlwBLCHmtKiYztCIwh4h8' },
  { desc: 'Braided Brown Leather Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Exterior', qty: 1, age: 0, dep: 0, rcv: 59.50, conf: 'med', link: 'https://www.nordstrom.com/s/miley-braided-leather-belt/8329921?color=brown-+gold&size=small&utm_source=google&utm_medium=organic&utm_campaign=seo_shopping&srsltid=AfmBOopsj3aVm-aK4Kv136eu0BEbeLLrDcFy7cM3E-BOsNROzM7MLj69VTw' },
  { desc: 'Rusted Metal Bracket Hardware Piece', mfr: '', model: '', cat: 'Tools & Garage', room: 'Exterior', qty: 1, age: 0, dep: 0, rcv: 19.99, conf: 'med', link: 'https://www.walmart.com/ip/Wall-Mount-Shelf-Bracket-Ornate-Pattern-Distressed-Brown-Cast-Iron-Large-Size-11-25-Deep-Brace-by-Flag-Emotes/499673253?wmlspartner=wlpa&selectedSellerId=9524&selectedOfferId=3FC1E7E0A69244A09CCC3B3D4B178A95&conditionGroupCode=1&veh=seo_fpl&cn=google' },
  { desc: 'Gold-Tone Decorative Chain Necklace', mfr: '', model: '', cat: 'Jewelry', room: 'Exterior', qty: 1, age: 0, dep: 0, rcv: 32.00, conf: 'med' },
  { desc: 'Silver Studded Leather Belt', mfr: '', model: '', cat: 'Clothing — Adult', room: 'Exterior', qty: 1, age: 0, dep: 0, rcv: 20.49, conf: 'med', link: 'https://www.yoursclothing.com/studded-jean-belt-black-silver-p?ltiCountry=US&ltiCurrency=USD' },
];
REAL_INVENTORY.forEach((t) => { t.special_limits = SPECIAL_LIMITS.has(t.cat); });
window.REAL_INVENTORY = REAL_INVENTORY;

// Maps a content class to a likely room — drives the `room` value on synthetic rows.
const CLASS_TO_ROOM = {
  'Electronics':            ['Living room','Home office','Master bedroom'],
  'Audio / Video':          ['Living room','Master bedroom'],
  'Major Appliances':       ['Kitchen','Laundry'],
  'Small Appliances':       ['Kitchen','Pantry'],
  'Furniture':              ['Living room','Master bedroom','Dining room','Home office','Bedroom 2'],
  'Bedding & Linens':       ['Master bedroom','Bedroom 2','Bedroom 3','Master closet'],
  'Kitchen & Housewares':   ['Kitchen','Pantry','Dining room'],
  'Clothing — Adult':       ['Master closet','Master bedroom'],
  'Clothing — Child':       ['Bedroom 2','Bedroom 3'],
  'Hobbies & Collectibles': ['Home office','Living room','Garage'],
  'Sporting Goods':         ['Garage','Outdoor / patio','Basement'],
  'Tools & Garage':         ['Garage','Basement'],
  'Outdoor & Patio':        ['Outdoor / patio','Garage'],
  'Decor & Accessories':    ['Living room','Dining room','Hallway','Master bedroom'],
  'Office':                 ['Home office'],
  'Health & Beauty':        ['Master bath','Master bedroom'],
  'Books & Media':          ['Home office','Living room'],
  'Musical Instruments':    ['Living room','Home office'],
  'Toys & Games':           ['Bedroom 2','Bedroom 3','Living room'],
  'Pet Supplies':           ['Laundry','Garage','Kitchen'],
  'Jewelry':                ['Master closet','Master bedroom'],
  'Firearms':               ['Master closet','Garage'],
  'Fine Arts':              ['Living room','Dining room','Master bedroom'],
  'Furs':                   ['Master closet'],
};
function pickRoom(cat, seed) {
  const opts = CLASS_TO_ROOM[cat] || ['Other'];
  return opts[seed % opts.length];
}

// Rooms used in the Reyes claim — adjuster tags each item by where it was found.
// Distribution roughly matches the photo-counts on the Claim Overview page.
const ROOM_OPTIONS = [
  'Kitchen', 'Pantry', 'Living room', 'Dining room',
  'Master bedroom', 'Master closet', 'Master bath',
  'Bedroom 2', 'Bedroom 3', 'Hallway',
  'Home office', 'Garage', 'Laundry',
  'Outdoor / patio', 'Attic', 'Basement', 'Other',
];

// Build a working dataset for the Reyes claim (~1 item per photo, slight uplift for
// items shot once vs. items shot from multiple angles).
function buildWorksheetRows(n = 57) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // Real rows first (the canonical 57-item claim); SAMPLE_BASE only pads the
    // 500-row virtual-scroll stress demos beyond the real inventory.
    const t = i < REAL_INVENTORY.length ? REAL_INVENTORY[i]
            : SAMPLE_BASE[(i - REAL_INVENTORY.length) % SAMPLE_BASE.length];
    const qty = t.qty || ((t.cat === 'Bedding & Linens' && t.desc.includes('pillow')) ? 4
              : (t.cat === 'Outdoor & Patio' && t.desc.includes('chair'))   ? 4
              : (t.cat === 'Furniture' && t.desc.includes('bar stool'))     ? 2
              : 1);
    out.push({
      id: i + 1,
      qty,
      desc: t.desc, mfr: t.mfr, model: t.model, cat: t.cat,
      // Items land from processing at age 0 → ACV = RCV (contract §5a). The
      // adjuster sets age per row, which re-runs depreciation server-side.
      age_years: 0,
      depreciation_pct: 0,
      depreciation_method: 'straight_line',
      rcv: t.needs_manual ? null : t.rcv,          // per-unit, PRE-TAX
      acv: t.needs_manual ? null : t.rcv,          // age 0 → equals rcv
      conf: t.conf, barcode: !!t.barcode,
      _photoIdx: i,
      photo: itemPhotoFor(i),
      photos: itemPhotoSetFor(i),
      special_limits: !!t.special_limits, // from the payload, not derived here
      valuation_basis: t.valuation_basis || 'retail',
      substitution_note: t.substitution_note || null,
      // comparable_sale: rcv == market_comp exactly (contract §0.1, §5a).
      market_comp: t.valuation_basis === 'comparable_sale' ? t.rcv : null,
      ceiling_used: null,
      // Up to 3 comparable listings from the aggregator, normalized by the
      // backend as [{ title, source, price, link }]. The median is Kevin's pick
      // and sets RCV; `link` is the dated proof URL the export prints.
      // Unpriced rows (rule 12) carry an empty array — nothing was sourced.
      alternative_sources: t.needs_manual ? [] : buildAltSources(t),
      needs_manual: !!t.needs_manual,
      manual_reason: t.manual_reason || null,
      is_manually_queried: false,
      // One branch drives both dep and its explainer: unpriced rows get the manual
      // variant so the popover never asserts a schedule the cell contradicts.
      depMeta: t.needs_manual ? MANUAL_DEP_META : buildDepMeta(t.cat, t.age, 'straight_line'),
      depManual: false,
      room: t.room || pickRoom(t.cat, i),
    });
  }
  return out.map(r => ({ ...r, ...deriveLineTotals(r, CLAIM_TAX.rate) }));
}

// Thumbnail tint pairs — muted naturals so the grid reads as photo thumbs.
const THUMB_TONES = [
  ['#cbd5d6', '#9ca6a9'], ['#d8d3c8', '#a89e8a'], ['#c4ccd4', '#8e98a3'],
  ['#d4c8c2', '#9c887e'], ['#cdd2c8', '#8a9080'], ['#d6cccd', '#a39193'],
  ['#c8d0d6', '#909aa3'], ['#d2cdc4', '#9b9388'],
];

// ── Standard depreciation schedule — class × age bracket ──
// Industry-standard useful-life table applied as the base for any carrier profile.
// Bracket index: 0 = < 1yr, 1 = 1-2yr, 2 = 3-5yr, 3 = 6-10yr, 4 = 11-15yr, 5 = > 15yr
const DEP_TABLE = {
  'Electronics':            [15, 20, 28, 40, 60, 75],
  'Audio / Video':          [15, 20, 28, 40, 60, 75],
  'Major Appliances':       [ 8, 15, 24, 32, 50, 70],
  'Small Appliances':       [14, 22, 32, 45, 65, 85],
  'Furniture':              [ 8, 16, 25, 35, 50, 70],
  'Bedding & Linens':       [22, 38, 50, 65, 80, 95],
  'Kitchen & Housewares':   [10, 18, 28, 40, 58, 75],
  'Clothing — Adult':       [25, 40, 55, 70, 85, 95],
  'Clothing — Child':       [30, 50, 70, 88, 95, 95],
  'Hobbies & Collectibles': [ 5, 10, 18, 28, 40, 55],
  'Sporting Goods':         [15, 25, 35, 48, 65, 80],
  'Tools & Garage':         [12, 22, 32, 45, 60, 78],
  'Outdoor & Patio':        [18, 28, 40, 55, 75, 90],
  'Decor & Accessories':    [10, 18, 28, 38, 55, 72],
  'Office':                 [15, 24, 36, 50, 68, 82],
  'Health & Beauty':        [25, 45, 65, 80, 90, 95],
  'Books & Media':          [10, 18, 28, 38, 52, 70],
  'Musical Instruments':    [ 8, 14, 22, 32, 45, 60],
  'Toys & Games':           [22, 38, 55, 72, 85, 95],
  'Pet Supplies':           [25, 40, 60, 78, 90, 95],
  // Special-limits classes — minimal depreciation
  'Jewelry':                [ 5,  8, 12, 18, 25, 35],
  'Firearms':               [10, 14, 20, 28, 38, 50],
  'Fine Arts':              [ 4,  6, 10, 14, 20, 30],
  'Furs':                   [12, 18, 28, 42, 58, 72],
};
function depBracket(age) {
  if (age == null) return 0;
  if (age < 1)   return 0;
  if (age <= 2)  return 1;
  if (age <= 5)  return 2;
  if (age <= 10) return 3;
  if (age <= 15) return 4;
  return 5;
}
function getDepFor(cat, age) {
  const row = DEP_TABLE[cat];
  if (!row) return null;
  return row[depBracket(age)];
}

// The API returns special_limits per item; this mock stamps it once so no
// component ever derives it from the content class at render time.
SAMPLE_BASE.forEach((t) => { t.special_limits = SPECIAL_LIMITS.has(t.cat); });

// Stand-in for the aggregator response. The real backend returns
// alternative_sources = [{ title, source, price, link }] (max 3) straight from
// the Google Shopping / Immersive Product API via SerpApi. The middle offer is
// the median and sets RCV. Raw URLs only — no page snapshot (v1).
const ALT_MERCHANTS = [
  ['Amazon',      'amazon.com',  0.96],
  ['Best Buy',    'bestbuy.com', 1.00],
  ['Walmart',     'walmart.com', 1.03],
];
function buildAltSources(t) {
  const brandHost = (t.mfr || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const slug = (t.model || t.desc).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ALT_MERCHANTS.map(([source, host, mult], i) => {
    // Real production rows carry the resolved merchant URL from the backend's
    // export (t.link). Per §5 only comp[0] is a direct listing; [1]/[2] stay
    // Google Shopping search URLs, exactly like the live payload.
    if (i === 1 && t.link) {
      let realHost = source;
      try { realHost = new URL(t.link).hostname.replace(/^www\./, ''); } catch (e) {}
      return { title: t.desc, source: realHost.split('.')[0].replace(/^\w/, (c) => c.toUpperCase()), price: t.rcv, link: t.link };
    }
    const searchUrl = 'https://www.google.com/search?tbm=shop&q=' + encodeURIComponent(`${t.mfr} ${t.desc}`.trim());
    return {
      title: `${t.mfr || ''} ${t.model || t.desc}`.trim(),
      source: i === 2 && t.mfr ? t.mfr : source,
      price: Math.round(t.rcv * mult * 100) / 100,
      link: t.link ? searchUrl : `https://www.${i === 2 && t.mfr ? brandHost : host}/p/${slug}`,
    };
  });
}

// Estate FMV is a DEPRECIATION HAIRCUT off the RCV taken from ACTIVE retail
// listings. There is no sold-comp or hammer-price feed and none is planned, so
// the comps behind an estate line are the same active listings that set RCV on
// a claim — the only difference is the haircut applied to them.
//
// This no longer lists eBay (sold), Facebook Marketplace or LiveAuctioneers.
// Printing those as provenance claims a data source that was never integrated,
// which is false on a document a client or a court may read. Naming them is now
// blocked by check-domain-rules.py.
const FMV_HAIRCUT = 0.33;
function buildFmvSources(t, fmv, retail) {
  // Price the comps at RETAIL: they are active listings, not observed sales.
  // `retail` wins when the caller knows it; otherwise fall back to the item's
  // own RCV, and only then to the FMV figure.
  const base = retail != null ? retail : (t.rcv != null ? t.rcv : fmv);
  return buildAltSources({ ...t, rcv: base });
}

// Field notes are written per PHOTO on mobile (sets do not exist until the
// clusterer runs). When a proposed set contains photos with different notes they
// are concatenated, never dropped — losing a note the adjuster deliberately
// typed on site is worse than a clumsy merged string, and staging is exactly
// where they clean it up. Same helper backs set merging in staging.
const NOTE_MAX = 120;
const mergeUserNotes = (notes) => {
  const uniq = [...new Set((notes || []).map(n => (n || '').trim()).filter(Boolean))];
  if (!uniq.length) return null;
  const joined = uniq.join(' | ');
  return joined.length <= NOTE_MAX ? joined : joined.slice(0, NOTE_MAX - 1).trimEnd() + '\u2026';
};

// Standard carrier useful-life (years) per content class — for the defensibility note.
const USEFUL_LIFE = {
  'Electronics': 5, 'Audio / Video': 5, 'Major Appliances': 12, 'Small Appliances': 7,
  'Furniture': 15, 'Bedding & Linens': 5, 'Kitchen & Housewares': 10, 'Clothing — Adult': 5,
  'Clothing — Child': 3, 'Hobbies & Collectibles': 20, 'Sporting Goods': 8, 'Tools & Garage': 10,
  'Outdoor & Patio': 6, 'Decor & Accessories': 10, 'Office': 7, 'Health & Beauty': 3,
  'Books & Media': 10, 'Musical Instruments': 20, 'Toys & Games': 5, 'Pet Supplies': 3,
  // null = NO automatic depreciation (holds or appreciates) — adjuster sets it.
  // Never render "0 years" or divide by null. GET /v1/depreciation-rules is the
  // live source for this whole table ({rules, categories}, no auth) — fetch it,
  // don't retype: real class names carry U+2014 em-dashes and "Décor"'s é, and
  // PCS codes repeat across classes (APP, CLH) so ALWAYS key on the class name.
  'Jewelry': null, 'Firearms': null, 'Fine Arts': null, 'Furs': null,
};
// XactContents PCS code per internal class — drives the Content-class export column.
// Special-limits classes are manual-priced but still carry a PCS code for export.
const PCS_CODE = {
  'Electronics': 'CMP', 'Audio / Video': 'CCE', 'Major Appliances': 'APP', 'Small Appliances': 'APP',
  'Furniture': 'FRN', 'Bedding & Linens': 'LIN', 'Kitchen & Housewares': 'KCW', 'Clothing — Adult': 'CLH',
  'Clothing — Child': 'CLH', 'Hobbies & Collectibles': 'HOB', 'Sporting Goods': 'SPG', 'Tools & Garage': 'TOL',
  'Outdoor & Patio': 'LGP', 'Decor & Accessories': 'HSW', 'Office': 'OFS', 'Health & Beauty': 'PCB',
  'Books & Media': 'BMP', 'Musical Instruments': 'MUS', 'Toys & Games': 'TOY', 'Pet Supplies': 'PET',
  'Jewelry': 'JWL', 'Firearms': 'GUN', 'Fine Arts': 'ART', 'Furs': 'CLH',
};
const DEP_BRACKET_LABELS = ['< 1 yr', '1–2 yr', '3–5 yr', '6–10 yr', '11–15 yr', '> 15 yr'];
// Plain-English defensibility breakdown for an item's depreciation.
function depExplain(cat, age, manual) {
  const pct = getDepFor(cat, age);
  return {
    cat,
    life: USEFUL_LIFE[cat] || null,
    ageLabel: DEP_BRACKET_LABELS[depBracket(age)],
    age: age,
    pct: manual ? null : pct,
    schedulePct: pct,
    manual: !!manual,
    hasSchedule: pct != null,
  };
}

// ── Canonical claim totals ───────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every place that displays the Reyes claim's money
// (landing card, claim overview, export modal, share sheet, claims dashboard,
// segment pages). Derived from the same seed rows the worksheet renders, so a
// price change in SAMPLE_BASE propagates everywhere instead of drifting.
// needs_manual rows are unpriced (rule 12) and contribute 0.
// Sales tax belongs to the claim (set at intake from the loss ZIP) — never a
// constant in a component. window.CLAIM_TAX is the single source.
// Ingest sessions for the demo claim. Session 1 is processed; session 2 is the
// batch currently in staging. Claim-level counts are SUMS over sessions — never
// literals — so a third drop needs no other change.
//   • itemFrom  — first line number this session produced (numbering continues)
//   • status    — 'processed' | 'staging' | 'uploading'
const CLAIM_SESSIONS = [
  { id: 'ses_1', opened: 'Aug 5, 2026 · 2:51p',  photos: 60,  sets: 57,  items: 57,  itemFrom: 1,   status: 'processed', label: 'Contents pack-out' },
  { id: 'ses_2', opened: 'Aug 5, 2026 · 10:04a', photos: 300, sets: 274, items: null, itemFrom: 58, status: 'staging',   label: 'Garage, attic, basement' },
];
// Every claim-level figure derives from the session list.
const CLAIM_INGEST = {
  sessions: CLAIM_SESSIONS,
  // Inventory size = PROCESSED sessions only. Staging photos have not produced
  // line items yet, so they must not inflate the claim's counts.
  photos: CLAIM_SESSIONS.filter(s => s.status === 'processed').reduce((a, s) => a + s.photos, 0),
  items:  CLAIM_SESSIONS.reduce((a, s) => a + (s.items || 0), 0),
  // Uploaded but not yet processed — for storage rollups, never for item counts.
  pendingPhotos: CLAIM_SESSIONS.filter(s => s.status !== 'processed').reduce((a, s) => a + s.photos, 0),
  processed: CLAIM_SESSIONS.filter(s => s.status === 'processed'),
  current: CLAIM_SESSIONS.find(s => s.status !== 'processed') || null,
  // Next line number, so a new session never reuses or renumbers an existing row.
  nextItemNo: CLAIM_SESSIONS.reduce((a, s) => a + (s.items || 0), 0) + 1,
  // Which session a given line number belongs to.
  sessionOf(no) {
    for (let i = CLAIM_SESSIONS.length - 1; i >= 0; i--) {
      if (CLAIM_SESSIONS[i].items && no >= CLAIM_SESSIONS[i].itemFrom) return CLAIM_SESSIONS[i];
    }
    return CLAIM_SESSIONS[0];
  },
};

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

// Parsed rows as the endpoint returns them: raw cells plus a heading hint.
// Real exports interleave section headings as rows — the test file carries 155,
// and one (WALL ART/DÉCOR) priced as property at $236.39 before this existed.
// We FLAG them; we never drop them on our own authority.
const WRITTEN_SAMPLE_ROWS = [
  { index: 1,  cells: ['LIVING ROOM', '', '', '', ''],                                    likely_heading: true,  source_ref: 'p.1 · line 4' },
  { index: 2,  cells: ['Living room', 'Sectional sofa, grey fabric, 3-seat', '1', 'Furniture', '2,400.00', 'Ethan Allen', 'Conor'], likely_heading: false, source_ref: 'p.1 · line 5' },
  { index: 3,  cells: ['Living room', 'Floor lamp, brushed nickel', '2', 'Décor & Accessories', '180.00', '', ''],  likely_heading: false, source_ref: 'p.1 · line 6' },
  { index: 4,  cells: ['Living room', '65" flat screen television', '1', '', '1,100.00', 'Sony', 'XR-65A80L'], likely_heading: false, source_ref: 'p.1 · line 7' },
  { index: 5,  cells: ['WALL ART/DÉCOR', '', '', '', ''],                                 likely_heading: true,  source_ref: 'p.1 · line 8' },
  { index: 6,  cells: ['Living room', 'Framed print, 24x36', '3', 'Décor & Accessories', '95.00', '', ''],          likely_heading: false, source_ref: 'p.1 · line 9' },
  { index: 7,  cells: ['Kitchen', 'Misc - Enter Price', '1', '', '', '', ''],                     likely_heading: false, source_ref: 'p.2 · line 2' },
  { index: 8,  cells: ['Kitchen', 'Stand mixer', '1', 'Small Appliances', '380.00', 'KitchenAid', 'KSM150'],      likely_heading: false, source_ref: 'p.2 · line 3' },
  { index: 9,  cells: ['MASTER BEDROOM', '', '', '', ''],                                 likely_heading: true,  source_ref: 'p.2 · line 4' },
  { index: 10, cells: ['Master bedroom', 'Queen mattress and box spring', '1', 'Furniture', '900.00', 'Casper', ''],      likely_heading: false, source_ref: 'p.2 · line 5' },
  { index: 11, cells: ['Master bedroom', 'Dresser, 6-drawer oak', '1', '', '640.00', '', ''],     likely_heading: false, source_ref: 'p.2 · line 6' },
  { index: 12, cells: ['Master bedroom', 'Bedside table', '2', 'Furniture', '150.00', '', ''],    likely_heading: false, source_ref: 'p.2 · line 7' },
];

const STAGE_UNGROUPED = [
  { id: 9001, filename: 'IMG_4488.HEIC', captured_at: '10:41:02', status: 'extracted' },
  { id: 9002, filename: 'IMG_4489.HEIC', captured_at: '10:41:19', status: 'extracted' },
  { id: 9003, filename: 'IMG_4490.HEIC', captured_at: '10:43:55', status: 'extracted' },
  { id: 9004, filename: 'IMG_4491.HEIC', captured_at: '10:44:03', status: 'extracted' },
  { id: 9005, filename: 'IMG_4492.HEIC', captured_at: '10:47:31', status: 'extracted' },
  { id: 9006, filename: 'IMG_4493.HEIC', captured_at: '10:52:08', status: 'uploaded' },
  { id: 9007, filename: 'IMG_4494.HEIC', captured_at: '10:52:14', status: 'uploaded' },
];

// Real field photographs from the sample claim — a contents pack-out shot on
// 2026-08-05. Filenames carry the capture time (HHMMSS), which is what the
// clusterer groups on, so shots seconds apart become one photo set.
// Descriptions/prices come from the backend .xls, not from here.
// Items are in capture order and photo k backs item k directly (verified
// against the batch: photo 0 = the Hot Wheels, photo 1 = the Madden boot).
// The 3 photos beyond the 57 items are the trailing context frames.
const CLAIM_CONTEXT_IDX = [57, 58, 59];
// Photo indices that are a SECOND frame of the previous capture — the backend
// merged them into one set at staging (144542 + 144545 are the same item), so
// they are skipped in the positional walk and ride the owning item's photos[].
const CLAIM_MERGED_SECOND = { 43: [44] }; // primary idx -> extra frame idxs
const CLAIM_MERGED_FLAT = Object.values(CLAIM_MERGED_SECOND).flat();
const CLAIM_PHOTO_FILES = [
  '20260805_142226.jpg',
  '20260805_143711.jpg',
  '20260805_143727.jpg',
  '20260805_143744.jpg',
  '20260805_143757.jpg',
  '20260805_143802.jpg',
  '20260805_143825.jpg',
  '20260805_143831.jpg',
  '20260805_144014.jpg',
  '20260805_144017.jpg',
  '20260805_144025.jpg',
  '20260805_144051.jpg',
  '20260805_144058.jpg',
  '20260805_144111.jpg',
  '20260805_144117.jpg',
  '20260805_144123.jpg',
  '20260805_144140.jpg',
  '20260805_144200.jpg',
  '20260805_144225.jpg',
  '20260805_144244.jpg',
  '20260805_144251.jpg',
  '20260805_144310.jpg',
  '20260805_144323.jpg',
  '20260805_144331.jpg',
  '20260805_144341.jpg',
  '20260805_144348.jpg',
  '20260805_144357.jpg',
  '20260805_144404.jpg',
  '20260805_144413.jpg',
  '20260805_144421.jpg',
  '20260805_144429.jpg',
  '20260805_144436.jpg',
  '20260805_144442.jpg',
  '20260805_144450.jpg',
  '20260805_144456.jpg',
  '20260805_144503.jpg',
  '20260805_144507.jpg',
  '20260805_144511.jpg',
  '20260805_144518.jpg',
  '20260805_144523.jpg',
  '20260805_144526.jpg',
  '20260805_144530.jpg',
  '20260805_144536.jpg',
  '20260805_144542.jpg',
  '20260805_144545.jpg',
  '20260805_144551.jpg',
  '20260805_144556.jpg',
  '20260805_144600.jpg',
  '20260805_144604.jpg',
  '20260805_144611.jpg',
  '20260805_144620.jpg',
  '20260805_144710.jpg',
  '20260805_144718.jpg',
  '20260805_144723.jpg',
  '20260805_144730.jpg',
  '20260805_144741.jpg',
  '20260805_144749.jpg',
  '20260805_144804.jpg',
  '20260805_144808.jpg',
  '20260805_144815.jpg',
];
const CLAIM_PHOTOS = CLAIM_PHOTO_FILES.map((f, i) => {
  const t = f.slice(9, 15);
  return {
    id: i + 1,
    filename: f,
    // 900px web copies — full-res originals stay in assets/claim/ for export.
    src: '../assets/claim/web/' + f,
    captured_at: t.slice(0, 2) + ':' + t.slice(2, 4) + ':' + t.slice(4, 6),
  };
});

// Item index -> the capture that backs it (positional: photo k backs item k in
// capture order, skipping context frames). In production this is the item
// payload's photo link — components never re-derive it.
function itemPhotoFor(itemIdx) {
  let k = 0;
  for (let p = 0; p < CLAIM_PHOTOS.length; p++) {
    if (CLAIM_CONTEXT_IDX.includes(p) || CLAIM_MERGED_FLAT.includes(p)) continue;
    if (k === itemIdx) return { src: CLAIM_PHOTOS[p].src, filename: CLAIM_PHOTOS[p].filename, captured_at: CLAIM_PHOTOS[p].captured_at };
    k++;
  }
  return null;
}
// Mirror of the item detail payload's photos[] (commit 2d9cd67): primary first,
// id-joined — never positional. Seeded on a few rows so the drawer's frame pager
// is demoable; most rows have [] which is a NORMAL state (single-photo /process
// or written import) and falls back to row.photo.
function itemPhotoSetFor(itemIdx) {
  const one = itemPhotoFor(itemIdx);
  if (!one) return [];
  // Real merged sets only — the indices the backend actually merged at staging.
  // (The earlier synthetic ~20% seeding borrowed neighbouring photos that back
  // OTHER rows — exactly the drift it was meant to demo. Removed.)
  const i = CLAIM_PHOTOS.findIndex(p => p.filename === one.filename);
  const extras = CLAIM_MERGED_SECOND[i];
  if (extras) {
    const mk = (idx, primary, note) => {
      const p = CLAIM_PHOTOS[idx];
      return p ? [{ photo_id: idx + 1, is_primary: primary, src: p.src, note, room: null }] : [];
    };
    return [...mk(i, true, null), ...extras.flatMap(e => mk(e, false, null))];
  }
  return [];
}
window.CLAIM_CONTEXT_IDX = CLAIM_CONTEXT_IDX;
window.CLAIM_MERGED_SECOND = CLAIM_MERGED_SECOND;

const CLAIM_TAX = { rate: 0.08625, label: 'Smithtown, NY 11787' };
const REYES_TAX_RATE = CLAIM_TAX.rate;

// ⚠️ SEED-ONLY DERIVATION — DO NOT PORT.
// Against the live API, tax / rcv_total_incl / depreciation_amount /
// acv_total_incl come from the list and detail endpoints and must be read
// VERBATIM. Recomputing over live data reintroduces B1 with numbers that look
// plausible, which is harder to catch than the wrong ones we deleted. This
// function exists only because data.jsx stands in for the backend.
//
// Server-derived, tax-inclusive line totals (contract §5). Lives here ONLY
// because data.jsx stands in for the API — no component may recompute these.
//   tax                 = rcv × quantity × tax_rate
//   rcv_total_incl      = rcv × quantity + tax
//   depreciation_amount = round(rcv_total_incl × depreciation_pct, 2)
//   acv_total_incl      = rcv_total_incl − depreciation_amount
const deriveLineTotals = (r, rate) => {
  if (r.rcv == null) return { tax: null, rcv_total_incl: null, depreciation_amount: null, acv_total_incl: null };
  const tax = Math.round(r.rcv * r.qty * rate * 100) / 100;
  const rcv_total_incl = Math.round((r.rcv * r.qty + tax) * 100) / 100;
  const pct = r.depreciation_pct;
  const depreciation_amount = pct == null ? null : Math.round(rcv_total_incl * pct * 100) / 100;
  const acv_total_incl = depreciation_amount == null ? null : Math.round((rcv_total_incl - depreciation_amount) * 100) / 100;
  return { tax, rcv_total_incl, depreciation_amount, acv_total_incl };
};
const REYES_TOTALS = (() => {
  const rows = buildWorksheetRows(57);
  const t = rows.reduce((a, r) => {
    a.qty += r.qty;
    a.rcv += r.rcv_total_incl || 0;
    a.dep += r.depreciation_amount || 0;
    a.tax += r.tax || 0;
    a.acv += r.acv_total_incl || 0;
    return a;
  }, { rcv: 0, dep: 0, tax: 0, acv: 0, qty: 0 });
  t.items = rows.length;
  t.unpriced = rows.filter((r) => r.needs_manual).length;
  return t;
})();

// Personal-property (contents) coverage on the demo claim. The LABEL is per-claim
// because policies name this coverage differently — never hardcode a letter.
const CLAIM_PP_LIMIT = { label: 'Coverage C — Personal Property', limit: 175000, alreadyClaimed: 0 };

// Canonical claim roster for the demo account. Lives here (not in the dashboard)
// so storage/usage rollups derive from the same seed the claims list renders.
const KEVIN_CLAIMS = [
  { id: 'CLM-2026-04412', name: 'Godfrey, Kevin',   cause: 'Kitchen fire',          loc: 'Smithtown NY',         carrier: 'Allstate',           items: CLAIM_INGEST.items, photos: CLAIM_INGEST.photos, rcv: REYES_TOTALS.rcv, status: 'review',     dol: 'Apr 18',  age: '2h ago',  flags: 5,  exported: false },
  { id: 'CLM-2026-04408', name: 'O\'Connor, Liam', cause: 'Burst pipe',            loc: 'Round Rock TX',     carrier: 'State Farm',         items:  65, photos:  74, rcv: 96823,  status: 'processing', dol: 'May 02',  age: '5m ago',  flags: 0,  exported: false, pct: 64 },
  { id: 'CLM-2026-04403', name: 'Park, Sun-mi',    cause: 'Hail damage',           loc: 'Dallas TX',         carrier: 'Nationwide',         items:  36, photos:  41, rcv: 32118,  status: 'open',   dol: 'Apr 28',  age: 'yesterday', flags: 0, exported: true  },
  { id: 'CLM-2026-04391', name: 'Estate of W. Holt', cause: 'Estate liquidation',  loc: 'San Antonio TX',    carrier: 'Holt LLP (Estate)', items: 360,  photos: 412, rcv: 412900, status: 'review',     dol: 'Apr 14',  age: '3d ago',  flags: 12, exported: false },
  { id: 'CLM-2026-04374', name: 'Reyes, Mariana',  cause: 'Smoke damage',          loc: 'Pflugerville TX',   carrier: 'Travelers',          items: 103, photos: 118, rcv: 142889, status: 'open',   dol: 'Apr 06',  age: '2w ago',  flags: 0,  exported: true  },
  { id: 'CLM-2026-04358', name: 'Vasquez, Anabel', cause: 'Theft (burglary)',      loc: 'Houston TX',        carrier: 'USAA',               items: 20, photos: 23, rcv: 18420,   status: 'open',      dol: 'Apr 02',  age: '3w ago',  flags: 0,  exported: false },
  { id: 'CLM-2026-04342', name: 'Bauer Trust',     cause: 'Estate liquidation',    loc: 'Fredericksburg TX', carrier: 'Bauer Trust',       items: 280, photos: 318, rcv: 198330, status: 'closed',   dol: 'Mar 28',  age: '4w ago',  flags: 0,  exported: true  },
];

// Storage & fair use. Photo storage is Kevin's real variable cost, so the number
// is DERIVED from the account's actual photo counts — never typed in.
//   • Pro includes a generous active pool; nothing is ever deleted to reclaim space.
//   • Closed claims tier to cold storage after 90 days (still accessible, slower
//     first retrieval) — that's the COGS lever, not deletion or claim caps.
//   • Over the pool we email first, then bill overage. No hard cutoff.
const STORAGE_AVG_PHOTO_MB = 4.2;   // iPhone HEIC → JPEG, typical field capture
const STORAGE_COLD_AFTER_DAYS = 90;
const KEVIN_STORAGE = (() => {
  const includedGB = 500, overageGB = 500, overagePrice = 19;
  const gb = (photos) => (photos * STORAGE_AVG_PHOTO_MB) / 1024;
  const cold = KEVIN_CLAIMS.filter((c) => c.status === 'closed');
  const warm = KEVIN_CLAIMS.filter((c) => c.status !== 'closed');
  const coldGB = cold.reduce((a, c) => a + gb(c.photos), 0);
  const warmGB = warm.reduce((a, c) => a + gb(c.photos), 0);
  const usedGB = warmGB + coldGB;
  return {
    includedGB, overageGB, overagePrice,
    coldAfterDays: STORAGE_COLD_AFTER_DAYS,
    avgPhotoMB: STORAGE_AVG_PHOTO_MB,
    photos: KEVIN_CLAIMS.reduce((a, c) => a + c.photos, 0),
    claims: KEVIN_CLAIMS.length,
    warmClaims: warm.length, coldClaims: cold.length,
    warmGB, coldGB, usedGB,
    pct: Math.min(Math.round((usedGB / includedGB) * 1000) / 10, 100),
  };
})();


// Server-authored depreciation explainer. Lives on the BACKEND side of the mock
// boundary — components render `row.depMeta`, they never compute this.
function buildDepMeta(cat, age, method) {
  const life = USEFUL_LIFE[cat] || null;
  if (!life) return { method: 'manual', cat, age, life: null, pct: null, rationale: 'No standard useful life for this class — depreciation is entered manually with the preparer\u2019s own basis.' };
  if (method === 'bracketed') {
    const pct = getDepFor(cat, age);
    return { method: 'bracketed', cat, age, life, pct, rationale: pct + '% per the standard bracketed ' + cat + ' schedule at ' + age + ' yr of a ~' + life + '-yr useful life.' };
  }
  const pct = Math.min(Math.round((age / life) * 100), 90);
  return { method: 'straight_line', cat, age, life, pct, rationale: pct + '% straight-line \u2014 ' + age + ' yr of a ~' + life + '-yr useful life for ' + cat + ', capped at 90% to retain a salvage floor.' };
}

// ── Mock API boundary ────────────────────────────────────────────────────────
// The frontend NEVER computes depreciation (CLAUDE.md rule 20). It asks the
// server and renders the answer. In production this is a real request; here the
// call is faked with latency so the pending state is exercised. DEP_TABLE /
// USEFUL_LIFE live on this side of the boundary only because this file stands in
// for the backend — no component may read them to derive a value.
// manual_reason codes, split by WHO has to act.
//   'adjuster'  — needs a person: appraisal, no comps, weak sample.
//   'capacity'  — needs nothing: we hit a SerpApi limit and it retries later.
// Never merge these treatments; a paused item is not an error.
// Contract §5 · manual_reason. `kind` drives the treatment:
//   adjuster  — needs judgement; blank editable cell
//   capacity  — deferred, not attempted; retries when limits roll over
//   expected  — deliberately unpriced, NOT a failure; no warning styling
//   transient — infrastructure; a reprice usually fixes it
const MANUAL_KIND = {
  no_query:          'adjuster',
  no_description:    'adjuster',
  manual_class:      'adjuster',
  luxury_brand:      'adjuster',
  low_sample:        'adjuster',
  no_comps:          'adjuster',
  valuation_error:   'adjuster',
  quota_exhausted:   'capacity',
  budget_exhausted:  'capacity',
  placeholder_row:   'expected',
  not_priced:        'expected',
  enqueue_failed:    'transient',
  // rcv/acv null but confidence is NOT — the engine found a figure and withheld
  // it for review (it rides the audit trail as withheld_rcv). "Needs your eyes",
  // a quiet review cue — same blank editable cell, never warning styling.
  low_confidence_high_value: 'adjuster',
};
// contract §5 — a deliberate non-failure gets neutral copy, never a warning.
const MANUAL_EXPECTED_COPY = {
  placeholder_row: { label: 'Your price',  detail: 'A template line from the imported list — it was created unpriced on purpose, for you to fill in.' },
  not_priced:      { label: 'Not priced',  detail: 'Imported without pricing. Use Reprice to search comps, or type a value.' },
  enqueue_failed:  { label: 'Retry',       detail: 'The pricing job could not be queued. Reprice to try again — nothing is wrong with the item.' },
};
const MANUAL_CAPACITY_COPY = {
  quota_exhausted:  { label: 'Waiting on capacity', detail: 'Hourly pricing limit reached — this item re-prices automatically when the window rolls over.' },
  budget_exhausted: { label: 'Waiting on capacity', detail: 'Daily pricing budget reached — this item re-prices automatically tomorrow, or retry once capacity frees up.' },
};
const isCapacityWait = (row) => MANUAL_KIND[row && row.manual_reason] === 'capacity';

const KevinAPI = {
  // PATCH /v1/claims/{id}/settled-items/{row_id} { claimed_rcv, replaced_qty } —
  // returns the recomputed recoverable. replaced_qty: null = all units,
  // 0 = none (line drops from the export), k = pro-rate. UI applies verbatim.
  // Client-portal share credentials — RETRIEVABLE tokens: GET …/shares returns
  // token/url on ACTIVE links (null once revoked/expired), so every row offers
  // plain Copy. Liveness is the payload's derived \`active\` boolean — never
  // derived from expires_at client-side. DELETE …/shares/{share_id} revokes.
  // No label field (owner decision) — display strings are client-composed.
  mintShare({ audience, expires_days, unlock_price }) {
    const n = ++KevinAPI._shareSeq;
    return new Promise((resolve) => setTimeout(() => resolve({
      share_id: 'shr_' + (1000 + n),
      token: 'kvn_' + Math.random().toString(36).slice(2, 8) + '-' + Math.random().toString(36).slice(2, 8) + '-' + Math.random().toString(36).slice(2, 8),
      url_base: 'https://kevin.co/share/clm-2026-04412/',
      created: 'Just now', expires: expires_days ? expires_days + ' days' : 'Never',
      audience: audience || 'client', active: true, view_count: 0, unlock_price: unlock_price ?? null,
    }), 420));
  },
  _shareSeq: 0,
  // GET /v1/claims/{id}/shares — seed list; active is SERVER-derived.
  listShares() {
    return [
      { share_id: 'shr_0917', label: 'Client link', audience: 'client', created: 'May 12, 2026', expires: 'Never', active: true, view_count: 4, url: 'https://kevin.co/share/clm-2026-04412/kvn_h3x8mq-w2rk1p-9dfj4z' },
      { share_id: 'shr_0844', label: 'Client link', audience: 'client', created: 'Apr 30, 2026', expires: '30 days', active: false, status: 'Expired', view_count: 11, url: null },
      { share_id: 'shr_0791', label: 'Client link', audience: 'client', created: 'Apr 28, 2026', expires: 'Never', active: false, status: 'Revoked', view_count: 1, url: null },
    ];
  },
  patchReplacement(row, { claimed, replaced_qty }) {
    return new Promise((resolve) => setTimeout(() => {
      resolve({ recoverable: claimed == null ? null : settledRecoverable(row, claimed, replaced_qty) });
    }, 260));
  },
  // GET /v1/claim_items/{row_id}/events → { events, count, limit } newest first.
  // actor_kind: worker = Kevin's pipeline; user = an adjuster. Branch on
  // event_type (backend c70e9cc): first valuation = 'priced'/worker, adjuster
  // refinement = 'repriced'/user. The old previous_rcv/previous_status payload
  // tell is LEGACY-only (pre-c70e9cc rows) — it misfires on an adjuster
  // refining an unpriced row, so never apply it to new rows.
  // payload.lkq / payload.bucket_used are in-app signals — NEVER in an export.
  itemEvents(id) {
    const t = (m) => new Date(Date.now() - m * 60000).toISOString();
    return new Promise((res) => setTimeout(() => res({ count: 3, limit: 50, events: [
      { event_type: 'completed', actor_kind: 'worker', actor_id: null, created_at: t(42),
        payload: { rcv: 1299.0, acv: 974.25, confidence: 0.646, category: 'Major Appliances', valuation_basis: 'retail', bucket_used: 'retail', market_comp: null, lkq: false } },
      { event_type: 'repriced', actor_kind: 'user', actor_id: '5d50c0c5', created_at: t(43),
        payload: { previous_query: 'stainless refrigerator', refined_query: 'Whirlpool WRS325SDHZ Refrigerator', previous_rcv: null, previous_status: 'processing', category: 'Major Appliances' } },
      { event_type: 'priced', actor_kind: 'worker', actor_id: null, created_at: t(44),
        payload: { refined_query: 'stainless refrigerator', category: 'Major Appliances' } },
      { event_type: 'created', actor_kind: 'user', actor_id: '5d50c0c5', created_at: t(45), payload: {} },
    ] }), 380));
  },
  // POST /v1/claim_items/:id/reprice  → { rcv, alternative_sources }
  // Re-runs the aggregator against a refined query and returns whatever it
  // finds. The frontend applies the response; it never guesses a new price.
  // Contract (673e5e1): { query (3–200, required), category, make_mfr (≤200),
  // model_number (≤200), description (≤500) } — identity fields are written to
  // the row in the same write as the status flip, so no PATCH-first sequencing.
  // Omitted = untouched; ""/null = cleared. Over-ceiling → 422.
  reprice(id, { query, category, make_mfr, model_number, description }) {
    const desc = query, cat = category;
    return new Promise((resolve) => setTimeout(() => {
      const t = { mfr: '', model: desc, desc, rcv: null };
      const base = SAMPLE_BASE.find((s) => s.desc === desc);
      const rcv = base ? base.rcv : Math.round((900 + (desc.length % 7) * 145) * 100) / 100;
      const sources = buildAltSources({ ...t, rcv });
      const median = [...sources].sort((a, b) => a.price - b.price)[Math.floor(sources.length / 2)];
      // Like recalcDepreciation, a reprice returns the four recomputed
      // tax-inclusive line totals — the UI applies them verbatim (money contract).
      // The row's current qty/depreciation_pct ride the recompute server-side;
      // the mock reads them off the live row set the page registered.
      const live = (window.__liveRows || []).find((r) => r.id === id) || { qty: 1, depreciation_pct: null };
      const money = deriveLineTotals({ rcv: median.price, qty: live.qty || 1, depreciation_pct: live.depreciation_pct ?? (live.dep != null ? live.dep / 100 : null) }, CLAIM_TAX.rate);
      resolve({ rcv: median.price, alternative_sources: sources, fetchedAt: new Date().toISOString(), ...money });
    }, 1600));
  },
  // POST /v1/estate_items/:id/reprice  → { fmv, alternative_sources }
  // Same contract as reprice(). The comps are the same ACTIVE retail listings;
  // FMV is the haircut off their median, not a separate sold-comp lookup.
  repriceFmv(id, { query }) {
    const desc = query;
    return new Promise((resolve) => setTimeout(() => {
      const t = { mfr: '', model: desc, desc };
      const base = SAMPLE_BASE.find((s) => s.desc === desc);
      const retail = base ? base.rcv : Math.round((900 + (desc.length % 7) * 145) * 100) / 100;
      const sources = buildFmvSources(t, null, retail);
      const median = [...sources].sort((a, b) => a.price - b.price)[Math.floor(sources.length / 2)];
      // FMV = haircut off the median ACTIVE listing, which is what the backend
      // now does. The comps returned stay at their real retail prices.
      const fmv = Math.round(median.price * FMV_HAIRCUT * 100) / 100;
      resolve({ rcv: fmv, alternative_sources: sources, fetchedAt: new Date().toISOString() });
    }, 1600));
  },
  // POST /v1/claim_items/:id  → { dep }   (server recalculates from the claim's
  // depreciation method + schedule and returns the authoritative percent)
  // Returns the row exactly as the real endpoint does: depreciation_pct as a
  // FRACTION plus the four recomputed tax-inclusive line totals (the money
  // contract). The UI applies these verbatim — it never derives them.
  // PATCH /v1/claim_items/{row_id} with {rcv} alone → backend recomputes ACV
  // from the row's age + depreciation rules and returns the four line totals.
  // With BOTH {rcv, acv} → stored exactly as typed, no overwrite of manual math.
  // The UI never does ACV arithmetic in either case.
  // PATCH /v1/claim_items/{row_id}/override — THE one path for a manual rate.
  // dep_manual is a FRACTION 0–1 (0.55, never 55 → 422). Supplying it sets
  // depreciation_method "custom" automatically; the lock PERSISTS across later
  // age/category/RCV edits (80f8831). Release is explicit: send
  // depreciation_method "straight_line"/"bracketed" — never a null rate.
  overrideDep(id, { dep_manual, rcv, qty }) {
    return new Promise((resolve) => setTimeout(() => {
      resolve({ depreciation_pct: dep_manual, ...(rcv != null ? (() => {
        const subtotal = rcv * (qty || 1);
        const tax = Math.round(subtotal * CLAIM_TAX.rate * 100) / 100;
        const rcv_total_incl = Math.round((subtotal + tax) * 100) / 100;
        const depreciation_amount = Math.round(rcv_total_incl * dep_manual * 100) / 100;
        return { tax, rcv_total_incl, depreciation_amount, acv_total_incl: Math.round((rcv_total_incl - depreciation_amount) * 100) / 100 };
      })() : {}) });
    }, 320));
  },
  updateMoney(id, { rcv, acv, qty, depreciation_pct }) {
    return new Promise((resolve) => setTimeout(() => {
      if (acv != null) {
        // Manual override of both: verbatim; totals derive from the typed pair.
        const tax = Math.round(rcv * (qty || 1) * CLAIM_TAX.rate * 100) / 100;
        const rcv_total_incl = Math.round((rcv * (qty || 1) + tax) * 100) / 100;
        const acv_total_incl = Math.round(acv * (qty || 1) * 100) / 100;
        return resolve({ tax, rcv_total_incl, acv_total_incl, depreciation_amount: Math.round((rcv_total_incl - acv_total_incl) * 100) / 100 });
      }
      resolve(deriveLineTotals({ rcv, qty: qty || 1, depreciation_pct: depreciation_pct ?? null }, CLAIM_TAX.rate));
    }, 320));
  },
  recalcDepreciation(id, patch) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cat = patch.cat, age = patch.age;
        if (cat == null || age == null) return resolve(null);
        const money = (pctFrac) => {
          if (patch.rcv == null) return {};
          const subtotal = patch.rcv * (patch.qty || 1);
          const tax = Math.round(subtotal * CLAIM_TAX.rate * 100) / 100;
          const rcv_total_incl = Math.round((subtotal + tax) * 100) / 100;
          const depreciation_amount = Math.round(rcv_total_incl * pctFrac * 100) / 100;
          return { tax, rcv_total_incl, depreciation_amount, acv_total_incl: Math.round((rcv_total_incl - depreciation_amount) * 100) / 100 };
        };
        if (patch.needs_manual) return resolve({ depreciation_pct: 0, depMeta: MANUAL_DEP_META, ...money(0) });
        const meta = buildDepMeta(cat, age, patch.method || 'straight_line');
        const frac = meta.pct == null ? 0 : meta.pct / 100;
        resolve({ depreciation_pct: frac, depMeta: meta, ...money(frac) });
      }, 420);
    });
  },
  // POST /claims/:id/depreciation { method } → the whole line-item set recalculated
  // by the server under that method. The printed document renders ONLY these values.
  recalcClaimDepreciation(claimId, method, rows) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          method,
          items: rows.map((r) => {
            const meta = buildDepMeta(r.cat, r.age_years, method);
            if (r.needs_manual) return { id: r.id, dep: 0, life: null };
            if (method === 'custom') return { id: r.id, dep: r.depreciation_pct, life: meta.life };
            return { id: r.id, dep: meta.pct != null ? Math.round(meta.pct) / 100 : r.depreciation_pct, life: meta.life };
          }),
        });
      }, 380);
    });
  },
  // ── Upload pipeline ───────────────────────────────────────────────────────
  // The adjuster selects all 300 photos and clicks once; the CLIENT chunks the
  // payload so no single POST carries a gigabyte into a gateway timeout. Chunk
  // size is capped by BOTH count and bytes — 40 small JPEGs is a fine request,
  // 40 large HEICs is not. A 413 means the chunk was still too big: halve it and
  // retry that chunk only, never the whole batch.
  // The backend accepts 50 files, but the GATEWAY is the real constraint: a
  // ~160 MB chunk took over 2 minutes and tripped a 502. 20 files / 65 MB keeps
  // every request under 60s, so the client never has to guess whether a timeout
  // meant failure. Server cap stays 50; we deliberately sit well under it.
  UPLOAD_CHUNK_FILES: 20,
  UPLOAD_CHUNK_BYTES: 65 * 1024 * 1024,
  MAX_PHOTO_BYTES: 15 * 1024 * 1024,      // backend rejects a single photo over this
  THUMB_BATCH_MAX: 100,                   // ids per thumbnails request

  // Junk the OS puts in a .zip that is not a photo. Filtered locally, silently.
  ZIP_JUNK: /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|\._)/i,

  // Browser-side .zip expansion. We advertise .zip in the drop zone, so a 1 GB
  // archive must NOT be posted whole — it would blow the chunk ceiling and the
  // gateway. Stream it with zip.js, drop OS junk, then feed the extracted photos
  // into the SAME chunking pipeline a folder drop uses.
  //
  // ⚠️ THREAD SAFETY — DO NOT PARALLELISE EXTRACTION ON ONE READER.
  // A ZipReader holds a file position. Two concurrent `entry.getData()` calls on
  // the SAME reader move that position under each other, corrupting the stream;
  // zip.js reports it as "Overlapped entries / possible zip bomb", which reads
  // like a malicious archive when it is really our own concurrency bug. The
  // backend hit exactly this sharing one ZipFile handle across upload threads.
  //
  // The rule here: extraction is SEQUENTIAL, upload is PARALLEL. One reader walks
  // the entries in order (cheap — it is local disk, not network), and only the
  // resulting blobs go into the concurrent chunked-upload pipeline, where each
  // POST owns its own payload and shares nothing. If extraction ever does need to
  // parallelise, every worker must construct its OWN ZipReader over its own
  // BlobReader slice — never a shared instance, and never a shared Blob position.
  //
  // Engineering: `const reader = new ZipReader(new BlobReader(file));`
  //   const entries = await reader.getEntries();
  //   for (const e of entries) { ... await e.getData(new BlobWriter()) ... }   // await, in order
  //   await reader.close();
  // A `for..of` with `await` is correct. `Promise.all(entries.map(getData))` is
  // the bug — it looks faster and produces corrupt output.
  async expandZip(file, onProgress) {
    const Z = window.zip;
    if (Z && file instanceof Blob) {
      const reader = new Z.ZipReader(new Z.BlobReader(file));
      try {
        const entries = await reader.getEntries();
        const wanted = entries.filter(e => !e.directory && !this.ZIP_JUNK.test(e.filename) && /\.(jpe?g|png|heic|heif)$/i.test(e.filename));
        const junkSkipped = entries.filter(e => !e.directory).length - wanted.length;
        const photos = [];
        // ONE reader, ONE entry at a time. A ZipReader holds a file position, so
        // Promise.all over getData() corrupts the stream and zip.js reports
        // "Overlapped entries / possible zip bomb". Extraction is sequential;
        // the parallelism that matters is the upload, further down the pipeline.
        for (const e of wanted) {
          photos.push({ name: e.filename.split('/').pop(), bytes: e.uncompressedSize || 0, session_id: (window.CLAIM_INGEST.current || {}).id });
          onProgress && onProgress({ read: photos.length, total: wanted.length });
          if (photos.length % 25 === 0) await new Promise(r => setTimeout(r, 0));   // keep the UI responsive
        }
        await reader.close();
        return { photos, junkSkipped };
      } catch (err) {
        await reader.close().catch(() => {});
        return { photos: [], junkSkipped: 0, error: err.message };
      }
    }
    // Fallback only when zip.js has not loaded — keeps the page usable offline.
    return new Promise((resolve) => {
      // ⚠️ SEED — this mock ignores `file` and returns a fixed 6-entry sample so
      // the flow can be exercised. Replace wholesale with the sequential zip.js
      // read described above; the shape it resolves ({ photos:[{name,bytes}],
      // junkSkipped }) is the contract the UI depends on.
      const sample = [
        '__MACOSX/._kitchen_01.jpg', 'kitchen_01.jpg', '.DS_Store',
        'kitchen_02.heic', 'garage/Thumbs.db', 'garage/bench_01.jpg',
      ];
      const photos = sample.filter(n => !this.ZIP_JUNK.test(n));
      // ONE entry at a time, awaited — mirrors the sequential for..of the real
      // implementation must use. Never Promise.all over a shared reader.
      const out = [];
      let i = 0;
      const readNext = () => {
        out.push({ name: photos[i], bytes: 4_200_000 + i * 1000, session_id: (window.CLAIM_INGEST.current || {}).id });
        i += 1;
        onProgress && onProgress({ read: i, total: photos.length });
        if (i < photos.length) return setTimeout(readNext, 40);
        resolve({ photos: out, junkSkipped: sample.length - photos.length });
      };
      setTimeout(readNext, 40);
    });
  },

  // Split a file list into chunks that satisfy both caps.
  planUploadChunks(files) {
    const chunks = [];
    let cur = [], bytes = 0;
    for (const f of files) {
      const over = cur.length >= this.UPLOAD_CHUNK_FILES || (bytes + f.bytes) > this.UPLOAD_CHUNK_BYTES;
      if (cur.length && over) { chunks.push(cur); cur = []; bytes = 0; }
      cur.push(f); bytes += f.bytes;
    }
    if (cur.length) chunks.push(cur);
    return chunks;
  },

  // Hashes are compared against EVERY photo already on the claim, not just this
  // batch. Re-dropping yesterday's folder on day two is the likeliest real
  // mistake, and it must resolve to 300 duplicates and zero new items.
  // GET /v1/claims/:id/photo-hashes → [sha256]
  claimHashes(claimId) {
    return new Promise((resolve) => setTimeout(() => resolve({ scope: 'claim', count: CLAIM_INGEST.photos }), 120));
  },

  // POST /v1/claims/{id}/staging/photos  (one call per chunk)
  //   → { accepted: [filename], rejected: [{ filename, reason }] }
  // A photo already stored comes back in `rejected` with reason 'duplicate' —
  // that is a SUCCESS. There is no `duplicates: []` field; see uploadChunk.
  // Rejections are NEVER silent — the response names every file that did not
  // make it and why, so the adjuster can fix and retry those files alone.
  uploadChunk(claimId, chunk) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const tooBig = chunk.reduce((a, f) => a + f.bytes, 0) > this.UPLOAD_CHUNK_BYTES;
      if (tooBig) { const e = new Error('Payload too large'); e.status = 413; return reject(e); }
      // `reason` is a CLOSED enum (unsupported_format · empty_file ·
      // oversized_photo · oversized_dimensions · undecodable_image · duplicate ·
      // storage_error). rejected[].detail is display prose — show it, never
      // branch on it. max_upload_bytes rides every ack for the client pre-check.
      //
      // ⚠️ `duplicate` IS A SUCCESS. It means the photo is already stored in the
      // session. It shows up in volume after a gateway 502: the server saved the
      // chunk, the gateway timed out before replying, the client retried, and the
      // server correctly refused the second copy. Counting those as failures told
      // the adjuster "196 failed" about photos that were all safely stored — so
      // duplicates are reconciled into the STORED total, never the red panel.
      // Duplicates arrive on ONE channel only — as a `duplicate` reason code in
      // `rejected`. There is deliberately no parallel `duplicates: []` array;
      // two shapes for one condition means the UI has to add them together.
      resolve({ accepted: chunk.map(f => f.name), rejected: [] });
    }, 300));
  },

  // INCREMENTAL STAGING SAVES — the backend holds staging state; the UI writes
  // every edit the moment it happens, then Process promotes with NO body.
  //   merge:    POST /v1/claims/{id}/staging/groups/merge  {group_keys, photo_ids, kind}
  //             → response mints a NEW group_key; never cache the old one.
  //   set note: PATCH …/staging/groups/{key}/note ({note}, ≤300 chars; null
  //             drops an adjuster override and the derived summary returns).
  //             The backend fuses member notes server-side (merge_notes: " | ",
  //             deduped, 120-char cap) — NEVER concatenate client-side too.
  //             Branch on group.note_source: derived = fused summary, read-only
  //             context; adjuster = human-written, the one editable slot.
  //   exclude:  there is NO skip at process time — reclassify the set instead:
  //             PATCH …/staging/groups/{key} {kind:'context'|'duplicate'} (0 items).
  //   loose:    POST /v1/claims/{id}/staging/cluster/remainder (appends only).
  stagingSaveNote(setKey, note) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, group_key: setKey, user_note: note }), 120));
  },
  stagingSetSkip(setKey, skip) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, group_key: setKey, skip }), 120));
  },
  // POST /v1/claims/{id}/staging/process — NO BODY. Promotes the saved state.
  stagingProcess(claimId) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, claim_id: claimId, status: 'processing' }), 200));
  },

  // POST /v1/claim_items/retry-deferred  { ids: [] }
  // Re-queues items parked on a rate limit or spend cap. Returns each item's new
  // state — most price normally; any that hit the limit again come back deferred.
  retryDeferred(ids) {
    return new Promise((resolve) => setTimeout(() => {
      resolve({ requeued: ids.length, results: ids.map((id, i) => ({ id, priced: i % 7 !== 6 })) });
    }, 900));
  },

  // GET /v1/staging/photos/thumbnails?ids=a,b,c
  // Signed thumbnail URLs are NOT included in the /staging polling response —
  // minting 300 of them every 4s was crashing the server. The grid asks for
  // thumbnails only for the sets currently in the viewport, in one batched call.
  // POST /v1/claims/:id/items/parse  (multipart, field `file`)
  // Server-side on purpose: real total-loss inventories arrive as PDFs and a
  // browser parser cannot read them. Do NOT add PapaParse/SheetJS.
  // Accepts .pdf .csv .xlsx .xls · max 20 MB.
  // Errors: 415 unsupported · 400 empty · 413 too large · 422 unreadable.
  parseInventoryFile(claimId, file) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const name = (file && file.name) || 'inventory.pdf';
      if (file && file.size > 20 * 1024 * 1024) return reject({ status: 413, message: 'File is over 20 MB' });
      const ext = (name.split('.').pop() || '').toLowerCase();
      if (!['pdf', 'csv', 'xlsx', 'xls'].includes(ext)) return reject({ status: 415, message: `.${ext} is not a supported format` });
      resolve({
        format: ext,
        filename: name,
        row_count: WRITTEN_SAMPLE_ROWS.length,
        heading_count: WRITTEN_SAMPLE_ROWS.filter(r => r.likely_heading).length,
        headers: ['Room', 'Item Description', 'Qty', 'Category', 'Est. Value', 'Brand', 'Model'],
        // Partial BY DESIGN — an unrecognised header is left blank rather than
        // guessed, because a wrong mapping is worse than an unmapped column.
        suggested_mapping: { room: 0, description: 1, quantity: 2, category: 3, make_mfr: 5, model_number: 6 },
        rows: WRITTEN_SAMPLE_ROWS,
      });
    }, 1400));
  },

  // POST /v1/claims/:id/items/bulk/preview — creates NOTHING and spends no
  // vendor budget. Accepts up to 5,000 rows, so a whole file previews in one
  // call. ⚠️ `price:false` on …/items/bulk is NOT a dry run — it still inserts
  // every row; using it as a pre-flight would create the inventory twice.
  previewInventory(claimId, rows) {
    return new Promise((resolve) => setTimeout(() => {
      const out = rows.map((r) => {
        const placeholder = /enter price|misc\b.*price|tbd/i.test(r.description || '');
        const tooShort = (r.description || '').trim().length < 2;
        return {
          index: r.index,
          description: r.description,
          // Composed identity, server-authored — the exact query the pricing
          // engine will run. Order is make → model → description.
          composed_description: [r.make_mfr, r.model_number, r.description]
            .map(x => (x || '').trim()).filter(Boolean).join(' '),
          room: r.room,
          quantity: r.quantity || 1,
          category: r.category || null,
          make_mfr: r.make_mfr || null,
          model_number: r.model_number || null,
          will_price: !placeholder && !tooShort,
          reason: placeholder ? 'placeholder_row' : tooShort ? 'no_query' : null,
        };
      });
      const priceable = out.filter(r => r.will_price).length;
      resolve({
        total_rows: out.length,
        priceable,
        needs_manual: out.length - priceable,
        uncategorised: out.filter(r => !r.category).length,
        // Two vendor searches per priced item: comparable search, then
        // merchant-link resolution.
        estimated_searches: priceable * 2,
        rows: out,
      });
    }, 1100));
  },

  // POST /v1/claims/:id/items/bulk — HARD CAP 500 rows per request, in every
  // mode. A 2,442-row file previews in one call but imports as five sequential
  // requests; a mid-run failure must not re-send completed chunks.
  IMPORT_CHUNK_ROWS: 500,
  planImportChunks(rows) {
    const out = [];
    for (let i = 0; i < rows.length; i += this.IMPORT_CHUNK_ROWS) out.push(rows.slice(i, i + this.IMPORT_CHUNK_ROWS));
    return out;
  },
  importItems(claimId, chunk, { price = true } = {}) {
    return new Promise((resolve) => setTimeout(() => resolve({ created: chunk.length, price }), 700));
  },

  // POST /v1/claims/:id/staging/groups/merge
  //   add to a set  -> { group_keys: ['<target>'], photo_ids: [id], kind }
  //   its own item  -> { photo_ids: [id], kind }
  // Three things the caller must respect:
  //   * merge MINTS A NEW group_key and prunes the sources, so a cached key is
  //     stale the moment this resolves - re-read the session it returns.
  //   * kind defaults to 'item'; dropping onto a context or duplicate set would
  //     silently convert it, so pass it explicitly.
  //   * 409 if the photo is still `uploaded` (not yet extracted) - clustering on
  //     absent signals is what the status filter exists to prevent.
  mergeStagingGroups(claimId, opts) {
    var o = opts || {};
    var groupKeys = o.group_keys || [];
    var photoIds = o.photo_ids || [];
    var kind = o.kind || 'item';
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        var all = window.STAGE_UNGROUPED || [];
        var pending = all.find(function (p) { return photoIds.indexOf(p.id) > -1 && p.status !== 'extracted'; });
        if (pending) return reject({ status: 409, message: pending.filename + ' is still being read - try again in a moment.' });
        resolve({ group_key: 'grp_' + Math.random().toString(36).slice(2, 8), kind: kind, photo_ids: photoIds, merged_from: groupKeys });
      }, 600);
    });
  },
  // GET /v1/depreciation-rules — the canonical 24-class taxonomy. `categories`
  // populates the class picker; `pcs_code` is the export's Content Class column
  // and must come from here, never a local map.
  fetchDepreciationRules() {
    return new Promise((resolve) => setTimeout(() => resolve({
      rules: {},                                  // seed: shape only
      categories: window.PCS_CATEGORIES || [],
    }, 200)));
  },

  clusterRemaining(claimId, photoIds) {
    return new Promise((resolve) => setTimeout(() => {
      const sets = [];
      let i = 0;
      while (i < photoIds.length) {
        const take = (i + 1 < photoIds.length && i % 3 !== 2) ? 2 : 1;
        sets.push({ set_id: 'rem_' + photoIds[i], photos: photoIds.slice(i, i + take) });
        i += take;
      }
      resolve({ sets, ungrouped: [] });
    }, 900));
  },

  // Capped at THUMB_BATCH_MAX ids per request — a fast scroll through 300 sets
  // can otherwise ask for more than the endpoint accepts in one call.
  fetchThumbnails(ids) {
    const batches = [];
    for (let i = 0; i < ids.length; i += this.THUMB_BATCH_MAX) batches.push(ids.slice(i, i + this.THUMB_BATCH_MAX));
    return Promise.all(batches.map(batch => new Promise((resolve) => setTimeout(() => {
      const out = {};
      batch.forEach((id) => { out[id] = 'signed://thumb/' + id + '?exp=900'; });
      resolve(out);
    }, 260)))).then(parts => Object.assign({}, ...parts));
  },
  // GET /schedules/defaults — seed values for the "Add schedule" editor.
  getScheduleDefaults() {
    return {
      rates: Object.fromEntries(PCS_CATEGORIES.map((c) => [c, [...(DEP_TABLE[c] || [0,0,0,0,0,0])]])),
      lives: Object.fromEntries(PCS_CATEGORIES.map((c) => [c, USEFUL_LIFE[c] || 10])),
    };
  },
};

// Display label for the claim's tax rate — never type the percent inline.
// Variable precision: 8.625% must not round to 8.63% — the PDF prints the true
// rate, so a rounded figure in the app makes two surfaces disagree about the
// same claim. toFixed(3) then trim keeps 8.625% / 8.875% / 4% all correct.
// Settled-schedule stand-in for the holdback recovery view. A settled claim has
// adjuster-entered ages and class-schedule depreciation; the live seed lands at
// age 0, so this derives a representative age per row from its class's useful
// life (varied deterministically) and computes the four line totals ONCE here.
// Stands in for the stored settled schedule the API returns — components render
// it verbatim and never recompute.
function buildSettledRows(n) {
  return buildWorksheetRows(n).map((r, i) => {
    // On a SETTLED claim every line was priced — needs_manual rows were
    // hand-priced by the adjuster before export, so the stand-in does the same.
    if (!r.rcv) r = { ...r, rcv: 40 + ((i * 13) % 160), valuation_basis: 'manual', needs_manual: false };
    // A real inventory carries multi-unit lines (pairs, sets, duplicates); the
    // seed keeps a few so the Replaced-count proration is demonstrable.
    if (i % 9 === 0 && (r.qty || 1) === 1) r = { ...r, qty: 2 + (i % 2) };
    const life = USEFUL_LIFE[r.cat] || 10;
    const age = Math.max(1, 1 + ((i * 7) % Math.min(life, 8)));
    const pct = Math.min(Math.round(age / life * 100) / 100, 0.9);
    const qty = r.qty || 1;
    const tax = Math.round(r.rcv * qty * CLAIM_TAX.rate * 100) / 100;
    const rcv_total_incl = Math.round((r.rcv * qty + tax) * 100) / 100;
    const depreciation_amount = Math.round(rcv_total_incl * pct * 100) / 100;
    return { ...r, age_years: age, depreciation_pct: pct, tax, rcv_total_incl, depreciation_amount, acv_total_incl: Math.round((rcv_total_incl - depreciation_amount) * 100) / 100 };
  });
}

// Stand-in for the payload's `recoverable` field — mirrors the backend function
// the holdback export uses (per-unit prorated; 0.0 never null; a null
// depreciation_amount contributes 0 rather than raising).
// PRIVATE to the mock backend — components never call this; they read the
// recoverable the API returns (list payload seeds it, PATCH responses update it).
function settledRecoverable(r, claimed, k) {
  const qty = r.qty || 1, kk = Math.min(k != null ? k : qty, qty);
  const acvK = (r.acv_total_incl || 0) / qty * kk;
  const withheldK = ((r.depreciation_amount == null ? 0 : r.depreciation_amount)) / qty * kk;
  return Math.round(Math.max(0, Math.min(claimed - acvK, withheldK)) * 100) / 100;
}

const claimTaxPct = () => (CLAIM_TAX.rate * 100).toFixed(3).replace(/\.?0+$/, '') + '%';

Object.assign(window, { buildSettledRows, WRITTEN_SAMPLE_ROWS, STAGE_UNGROUPED, MANUAL_KIND, MANUAL_CAPACITY_COPY, isCapacityWait, US_STATES, CLAIM_SESSIONS, CLAIM_INGEST, NOTE_MAX, mergeUserNotes, claimTaxPct, CLAIM_TAX, buildFmvSources, KevinAPI, buildDepMeta, MANUAL_DEP_META, KEVIN_CLAIMS, KEVIN_STORAGE, CLAIM_PP_LIMIT, PCS_CATEGORIES, SPECIAL_LIMITS, SAMPLE_BASE, buildWorksheetRows, THUMB_TONES, DEP_TABLE, getDepFor, depBracket, ROOM_OPTIONS, CLASS_TO_ROOM, USEFUL_LIFE, PCS_CODE, DEP_BRACKET_LABELS, depExplain, REYES_TOTALS });
