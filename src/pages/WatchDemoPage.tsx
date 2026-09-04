import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { I, Icon } from '../components/Icon'
import { MktFooter, MktNav } from '../components/MarketingChrome'

/**
 * Watch demo (/demo) — ported from `WatchDemo` in
 * design/components/utility-pages.jsx.
 *
 * It is a WRITTEN walkthrough, not a video player: the badge says so and the
 * note at the bottom says the recording is still being made. That is the
 * honest state of it, so it ports as-is rather than growing a fake player.
 *
 * TWO deviations:
 *
 * 1. The lede read "50 photos in, a 44-line inventory out". The
 *    canonical demo claim is 60 photos → 57 items (CLAUDE.md), and this page
 *    describes that same kitchen-fire claim, so the two numbers are now the
 *    claim's own.
 *
 * 2. The footer note's "book a call" pointed at the Book-call page (51), which
 *    is not ported. It goes to /contact and reads "get in touch" — /contact's
 *    own book-a-call is still pending, so promising a booking would be a link
 *    that does not deliver what it says.
 */

const DEMO_STEPS: [string, string, string, string[]][] = [
  [
    '01',
    'Start the claim',
    '~1 min',
    [
      'Enter the claim number, policy number, date and cause of loss.',
      'Pick the carrier and the insured; type the loss address — the ZIP auto-resolves the sales-tax rate that lands in every line.',
      'Choose the contents coverage label off the declarations page (Coverage C, Personal Property, Contents…) and enter the limit, so Kevin warns you as the inventory approaches it.',
    ],
  ],
  [
    '02',
    'Drop the photos',
    '~2 min for hundreds of photos',
    [
      'Drag in a folder, a phone dump, or a whole .zip — no total-size cap, up to 15 MB per photo. Duplicates are hashed out on arrival.',
      'Kevin pre-groups shots taken seconds apart into photo sets, so three angles of one sofa become one line item, not three.',
      'Review the proposed sets: merge two that belong together, split one that does not, exclude context shots, and optionally add a note — additional identification for Kevin ("the TV is the Sony, not the Samsung").',
    ],
  ],
  [
    '03',
    'Let Kevin work',
    '~8 min, unattended',
    [
      'Each set is identified — item, make, model number off the plate or barcode where it is readable.',
      'Kevin assigns a content class, then pulls three live retail comps per item and takes the median as RCV.',
      'Depreciation comes from the schedule on the claim — straight-line by default — and ACV is derived from it. Anything Kevin cannot price confidently arrives blank instead of guessed.',
    ],
  ],
  [
    '04',
    'Review the worksheet',
    '20–40 min for a few hundred lines',
    [
      'One grid, every cell editable: room, quantity, description, make, model, class, unit cost, age and depreciation.',
      'Click a row number to open the item panel — source photo, the three comps with dated proof links, and the depreciation math. Pin it to keep it beside the grid as you work down the list.',
      'Fix a bad identification by editing the description and re-pricing against fresh comps; type a price for anything left blank. Filter by room, group by class, and check the special-limits flags.',
    ],
  ],
  [
    '05',
    'Export and send',
    '~1 min',
    [
      'Xactimate-ready .xlsx on the XactContents template — column parity, so it imports without cleanup.',
      'Or a client-facing PDF inventory, or the full bundle: spreadsheet, PDF, every photo, and the audit log.',
      'Download it or mint an expiring share link. Kevin never pushes into a carrier system — you send the file.',
    ],
  ],
]

export default function WatchDemoPage() {
  return (
    <div className="k-landing">
      <MktNav />
      <main className="k-mkt-main">
        <section
          className="k-demo-sec"
          style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', padding: '52px 40px 30px' }}
        >
          <Badge tone="accent" dot>
            Written walkthrough
          </Badge>
          <h1
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 48,
              letterSpacing: '-0.028em',
              margin: '18px 0 14px',
              lineHeight: 1.05,
            }}
          >
            Every step, start to export.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--k-fg-2)',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Exactly what you do on a real kitchen-fire claim — 60 photos in, a 57-line inventory
            out, about 20 minutes of your time.
          </p>
        </section>

        <section className="k-demo-sec" style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px' }}>
          <div className="k-demo-steps">
            {DEMO_STEPS.map(([n, t, time, items]) => (
              <div key={n} className="k-demo-step">
                <div className="k-demo-step-hd">
                  <span className="k-demo-step-n">{n}</span>
                  <span className="k-demo-step-t">{t}</span>
                  <span className="k-demo-step-time">{time}</span>
                </div>
                <ul className="k-demo-step-list">
                  {items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="k-demo-note">
            <Icon d={I.info} size={14} />
            <span>
              Prefer to watch? We're recording a walkthrough as we finish the build —{' '}
              <Link
                to="/contact"
                style={{
                  fontSize: 'inherit',
                  color: 'var(--k-accent)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                get in touch
              </Link>{' '}
              and we'll walk you through it live in the meantime.
            </span>
          </div>
        </section>

        <section className="k-mkt-cta" style={{ marginTop: 44 }}>
          <h2
            style={{
              fontFamily: 'var(--k-font-display)',
              fontWeight: 400,
              fontSize: 40,
              letterSpacing: '-0.028em',
              margin: '0 0 14px',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            Your first 250 items are free.
          </h2>
          <div className="k-hero-actions" style={{ marginTop: 0 }}>
            <Link className="k-btn k-btn--lg" to="/sign-up">
              Start a new claim →
            </Link>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/sample">
              Open the sample claim
            </Link>
          </div>
        </section>
        <MktFooter />
      </main>
    </div>
  )
}
