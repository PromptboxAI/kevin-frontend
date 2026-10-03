import { I, Icon } from './Icon'

/**
 * What a usable claim photo looks like — and what wastes a line.
 *
 * Owner's ask, 2026-10-03. Every frame here is a REAL capture from the owner's
 * own claims, stripped of metadata before it reached `public/` (the originals
 * carried GPS of the loss address, device model and capture times).
 *
 * THE "DON'T" FRAMES ARE NOT STAGED. They were picked by measuring focus
 * across the sample -- variance of the Laplacian, the standard sharpness
 * measure -- and taking from the bottom of the range: the blurred box scores
 * ~107 against ~740 for the desktop tower beside it. A faked blur would be
 * both dishonest and, in a photograph of someone's damaged property, obvious.
 *
 * The advice is the product's own constraints, not photography opinion:
 *   - one item per frame is domain rule 1 (the vision tech reads ONE item per
 *     photo, so a frame holding four gets one line, not four);
 *   - a legible label is what make/model matching needs;
 *   - a blurred frame is what comes back `needs_manual` with a blank, editable
 *     price (rule 12) -- it is not refused, it just costs the adjuster the
 *     line they were trying to save.
 */

type Shot = {
  src: string
  alt: string
  good: boolean
  title: string
  note: string
}

const SHOTS: Shot[] = [
  {
    // NOT the desktop tower that was here first. It was the sharpest frame in
    // the sample by a wide margin -- and it is shot from BEHIND, so there is no
    // brand and no model anywhere in it. Kevin would get a chassis and no
    // identification, which makes it a poor example of a photo we can price
    // however sharp it is. Sharpness is not the whole job: the frame has to
    // contain the thing that identifies the item.
    src: 'coffee-maker',
    good: true,
    title: 'Straight on, brand in frame',
    note: 'The badge on the front is readable, so the make lands on the first pass and the model follows from it.',
    alt: 'A single-serve coffee maker photographed straight on in a water-damaged kitchen, its brand badge legible',
  },
  {
    src: 'tv-plate',
    good: true,
    title: 'Close enough to read the plate',
    note: 'One extra frame of the model plate settles the exact model. Kevin folds it into the same line as the wide shot.',
    alt: 'An adjuster holding a flat-screen television steady to photograph the model plate on its back',
  },
  {
    src: 'shot-blurred',
    good: false,
    title: 'Blurred by movement',
    note: 'Nothing on the carton can be read, so the line comes back unpriced with an empty cell for you to fill in.',
    alt: 'A cardboard carton photographed while moving, too blurred to read its printed label',
  },
  {
    src: 'shot-crowded',
    good: false,
    title: 'Several items in one frame',
    note: 'Kevin reads one item per photo. A planter, a framed picture and a cabinet in one frame produce one line, not three.',
    alt: 'A jumble of water-damaged belongings in one frame: a ceramic planter, a framed picture and a wooden cabinet',
  },
]

export default function MktShotGuide() {
  return (
    <section className="k-guide">
      <div className="k-guide-hd">
        <div className="k-proof-eyebrow">Shooting the loss</div>
        <h2 className="k-guide-h">What makes a photo Kevin can price</h2>
        <p className="k-guide-sub">
          Nothing is ever rejected — a frame Kevin cannot read comes back as a blank, editable price
          instead of a guess. These four are real captures from real claims.
        </p>
      </div>

      <ul className="k-guide-grid">
        {SHOTS.map((s) => (
          <li key={s.src} className={`k-guide-card${s.good ? '' : ' k-guide-card--no'}`}>
            <div className="k-guide-img">
              <img
                src={`/marketing/loss/w480/${s.src}.webp`}
                srcSet={`/marketing/loss/w192/${s.src}.webp 192w, /marketing/loss/w480/${s.src}.webp 480w`}
                sizes="(max-width: 820px) 46vw, 260px"
                alt={s.alt}
                loading="lazy"
                decoding="async"
              />
              <span className="k-guide-tag">
                <Icon d={s.good ? I.check : I.close} size={11} stroke={2.4} />
                {s.good ? 'Do this' : 'Not this'}
              </span>
            </div>
            <div className="k-guide-body">
              <h3 className="k-guide-t">{s.title}</h3>
              <p className="k-guide-p">{s.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
