# Email templates — reference

Fourteen send-ready HTML emails. Preview them all at `index.html`.

These are **static HTML with placeholder merge values**. Engineering wires them to a
sending service and swaps the placeholders for real merge fields. Nothing here is
generated at build time — each file is hand-maintainable on its own.

## Palette

Values match the app (`kevin.css`) and the PDF inventory, translated to hex because
email clients do not support `oklch()`.

| Token | Hex | Used for |
| --- | --- | --- |
| Ink | `#1a1d21` | Body text, headings |
| Muted | `#6b7280` | Secondary text, footer, panel labels |
| Line | `#e3e6ea` | Borders |
| Page background | `#f4f5f7` | Outside the card |
| Card | `#fcfcfd` | The card fill — **near-white on purpose** |
| Accent (navy) | `#2E4B6F` | Buttons, links, the wordmark period |
| Accent soft | `#eef2f7` | Informational callouts |
| OK | `#1f7a68` / `#e8f4f1` | Reassuring callouts |
| Warn | `#8a5a13` / `#fdf3e3` | Storage, payment, special-limits panels |
| Danger | `#9b2c2c` / `#fbeaea` | "This was not you" paths |

**Never use pure `#ffffff` or `#000000` for a surface.** Dark-mode clients invert them
to the opposite extreme, which blows out the card against the page. That is why the card
is `#fcfcfd` rather than white.

## Type

No web fonts — several clients strip them, and there is nowhere to host font files.
These are the email-safe equivalents of the app's Merriweather + Lato pairing:

- **Display / headings:** `Georgia, 'Times New Roman', serif`
- **Body / UI:** `Arial, 'Helvetica Neue', Helvetica, sans-serif`
- **Numbers / references:** `'Courier New', Courier, monospace`

## Structure

Every template follows the same shape. Copy an existing file rather than starting fresh.

1. Hidden preheader span (~85 chars) as the **first** child of `<body>`
2. Page-background table → centered 600px wrapper table
3. Text wordmark — `Kevin` + accent-colored period. Never an image
4. Card: `#fcfcfd` fill, 1px `#e3e6ea` border, 12px radius, 34/36px padding
5. Mono eyebrow → Georgia heading → body → one bulletproof button
6. Footer: why-you-got-this line, then company, postal address, and links

## Rules that must hold

- Nested `<table role="presentation" cellpadding="0" cellspacing="0" border="0">`.
  No flex, no grid, no float, no `position`
- **Every style inlined.** The `<style>` block carries only the mobile media query
  and may be dropped entirely by a client — the email must read without it
- No images, no JavaScript, no external stylesheets. If a logo is added later it needs
  a hosted `https` URL; a project file will not exist for recipients
- Buttons are a padded `<td bgcolor>` with the `<a>` set to `display:block`
- `mso-line-height-rule:exactly` on anything with a line-height, and explicit widths
  on every table for Outlook's Word engine
- Stay well under Gmail's ~100KB clip. Current largest file is ~4KB
- Transactional emails carry **no unsubscribe** — they are service messages.
  Notification emails point at Settings → My profile instead

## The seven-notification set

`31-Settings-profile`, the `notifications` docs article, and these templates are one set.
Change one and change all three.

| Event | Template |
| --- | --- |
| Processing complete | `05-processing-complete.html` |
| Export ready | `06-export-ready.html` |
| Export failed | `07-export-failed.html` |
| Share link opened | `08-share-link-viewed.html` |
| Special-limits flagged | `14-special-limits-flagged.html` |
| Storage nearing the pool | `11-storage-nearing.html` |
| Payment problem | `09-payment-failed.html` |

The remaining seven are auth, billing and team messages that are not user-toggleable:
`01-verify-email`, `02-password-reset`, `03-password-changed`, `04-new-sign-in`,
`10-payment-receipt`, `12-team-invite`, `13-claim-assigned`.
