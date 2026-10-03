import { Link } from 'react-router-dom'
import { I, Icon } from './Icon'

/**
 * The three-step process strip — DRAFT, not yet reviewed by the owner.
 *
 * Why it exists: both competitors benchmarked on 2026-10-03 (adjustsquare.com,
 * sightsync.ai) put the product itself on the home page -- SightSync's hero is
 * a priced inventory table with totals, and you understand the whole product
 * before reading a word. Ours shows a card beside the headline on desktop and
 * NOTHING on a phone: `.k-hero-r` is `display: none` under 820px, deliberately
 * (the card was tried there and made the first screen a list of things to look
 * at rather than one message and one action). So on the surface where most
 * first visits land, the only product view is the live demo, which proves ONE
 * item and says nothing about the folder, the worksheet or the export.
 *
 * This strip is that missing middle, and it is built mobile-first so it works
 * where the hero card cannot.
 *
 * TWO RULES IT KEEPS DELIBERATELY:
 *
 *  - NO INVENTED MONEY. Step 2 reuses two rows the home page already ships
 *    (HERO_ROWS in LandingPage, themselves read off the rendered prototype and
 *    labelled illustrative) rather than pricing the new photographs, which
 *    would be making up dollar figures for real property. Nothing here states
 *    a total: the hero card's own count and RCV total were removed earlier
 *    precisely because an aggregate here gets compared against the live
 *    `/sample` claim and the two drift with nothing failing.
 *
 *  - THE EXPORT IS NAMED THE WAY RULE 2 NAMES IT: "Xactimate (Excel) · .xlsx ·
 *    XactContents template". Never "Xactimate XML".
 *
 * The step-1 photographs are REAL LOSS PHOTOS from the owner's own claims,
 * which is the thing neither competitor has -- both illustrate with stock
 * imagery or rendered mock-ups. Every file was stripped of metadata before it
 * reached `public/`: 21 of the 24 sampled carried GPS coordinates of the loss
 * address, plus device model and capture timestamps.
 */

type Shot = { src: string; alt: string }

/** Chosen for variety -- an appliance, a model plate, soft goods, and a room
 *  mid-mitigation with the air movers still running. No faces, no documents,
 *  no house numbers; two further candidates were dropped for a possible family
 *  photograph in frame and for motion blur. */
const CAPTURE_SHOTS: Shot[] = [
  { src: 'coffee-maker', alt: 'Single-serve coffee maker photographed in a water-damaged kitchen' },
  { src: 'tv-plate', alt: 'Adjuster holding a flat-screen television to photograph its model plate' },
  { src: 'clothing', alt: 'Pile of clothing packed out of a bedroom' },
  { src: 'wrapped-stool', alt: 'Shrink-wrapped stool beside air movers on a mitigation site' },
]

/**
 * Worksheet lines, same vocabulary as the hero card.
 *
 * These used to be two rows carrying "Vision match" and "2 photos merged"
 * badges -- internal words for an internal audience, which the owner cut from
 * the hero for the same reason. Figures are the live sample claim's
 * (`GET /v1/claim_items?claim_id=sample`, lines 41 and 43, read 2026-10-03),
 * so the money is the server's own rather than illustration.
 */
const LINE_ROWS = [
  { desc: 'Guess Black Leather Belt with Silver Buckle', meta: 'Guess · Primary Bedroom', rcv: '$73.32', acv: '$29.33', photo: '20260805_144542.jpg' },
  { desc: 'Fiskars Yellow-Handled Household Scissors', meta: 'Fiskars · Garage', rcv: '$14.12', acv: '$7.06', photo: '20260805_144556.jpg' },
]

export default function MktProcessStrip() {
  return (
    <section className="k-flow">
      <div className="k-flow-hd">
        <div className="k-proof-eyebrow">The whole process</div>
        <h2 className="k-flow-h">Photos in. Inventory out.</h2>
        <p className="k-flow-sub">
          The folder off your phone becomes a priced inventory you review, then a file the carrier
          can import.
        </p>
      </div>

      <ol className="k-flow-steps">
        <li className="k-flow-step">
          <div className="k-flow-body">
            <span className="k-flow-step-h">
              <span className="k-flow-n" aria-hidden="true">1</span>
              <span className="k-flow-step-l">Capture</span>
            </span>
            <h3 className="k-flow-t">Drop the whole folder</h3>
            <p className="k-flow-p">
              Hundreds of photos in one go. Kevin uploads them in batches and folds the duplicates
              back in as they arrive.
            </p>
          </div>
          <div className="k-flow-viz k-flow-viz--shots">
            {CAPTURE_SHOTS.map((s) => (
              <div key={s.src} className="k-flow-shot">
                <img
                  src={`/marketing/loss/w192/${s.src}.webp`}
                  srcSet={`/marketing/loss/w192/${s.src}.webp 192w, /marketing/loss/w480/${s.src}.webp 480w`}
                  sizes="(max-width: 820px) 44vw, 150px"
                  alt={s.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </li>

        <li className="k-flow-step">
          <div className="k-flow-body">
            <span className="k-flow-step-h">
              <span className="k-flow-n" aria-hidden="true">2</span>
              <span className="k-flow-step-l">Review</span>
            </span>
            <h3 className="k-flow-t">Every line, yours to change</h3>
            <p className="k-flow-p">
              Kevin identifies the item, matches make and model, and prices it. Description,
              quantity, age and price all stay editable.
            </p>
          </div>
          <div className="k-flow-viz k-flow-viz--rows">
            {/* RCV + Tax BEFORE ACV, the order of every worksheet an adjuster
                has ever read. % Depr. sits between them in the real grid and is
                dropped here for width -- dropping a column is fine, reordering
                the ones that stay is not. The photographs are back: this step
                is about a picture becoming a line, so the thumbnail is the
                point, and these two lines are the two whose sample-claim rows
                we actually hold photographs for. */}
            <div className="k-flow-wshead">
              {/* Empty first cell: the grid's first track is the thumbnail's,
                  and without this every label sat one column to the left --
                  "Description" landed in the 26px photo track and ran over
                  "RCV + Tax". */}
              <span aria-hidden="true" />
              <span>Description</span>
              <span>RCV</span>
              <span>ACV</span>
            </div>
            {LINE_ROWS.map((r) => (
              <div key={r.desc} className="k-flow-row">
                <img
                  className="k-flow-row-thumb"
                  src={`/marketing/items/w192/${r.photo}`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <div className="k-flow-row-txt">
                  <div className="k-flow-row-t">{r.desc}</div>
                  <div className="k-flow-row-s">{r.meta}</div>
                </div>
                <span className="k-flow-row-n">{r.rcv}</span>
                <span className="k-flow-row-n k-flow-row-n--acv">{r.acv}</span>
              </div>
            ))}
            {/* Says the grid continues without stating a count -- see the
                header note on why no aggregate appears on this page. */}
            <div className="k-flow-row k-flow-row--more">+ more lines</div>
          </div>
        </li>

        <li className="k-flow-step">
          <div className="k-flow-body">
            <span className="k-flow-step-h">
              <span className="k-flow-n" aria-hidden="true">3</span>
              <span className="k-flow-step-l">Export</span>
            </span>
            <h3 className="k-flow-t">Hand it to the carrier</h3>
            <p className="k-flow-p">
              Export the file the desk can import as-is, with the proof link behind each price kept
              on the row.
            </p>
          </div>
          <div className="k-flow-viz k-flow-viz--out">
            <div className="k-flow-file">
              <Icon d={I.file} size={15} />
              <div>
                <strong>Xactimate (Excel)</strong>
                <span>.xlsx · XactContents template</span>
              </div>
            </div>
            <div className="k-flow-file">
              <Icon d={I.download} size={15} />
              <div>
                <strong>Inventory PDF</strong>
                <span>Room by room, with photos</span>
              </div>
            </div>
            <div className="k-flow-proof">
              <Icon d={I.link} size={12} />
              Source link on every priced line
            </div>
          </div>
        </li>
      </ol>

      <div className="k-flow-foot">
        <Link className="k-btn k-btn--lg" to="/product">
          See the whole process
        </Link>
      </div>
    </section>
  )
}
