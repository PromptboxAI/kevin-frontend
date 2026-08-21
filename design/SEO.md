# SEO.md — kevin.co search & social metadata

**This file is the single editing space for SEO.** Change a row here and the
matching `<meta>` tags in that page’s `<head>` must be updated to match (Claude
Code: treat this table as the source of truth and sync it into the pages at
build time; the tags currently in each page were generated from this table).

Rules:
- Titles ≤ 60 chars; descriptions 140–160 chars where possible.
- PUBLIC pages carry: title, meta description, canonical, og:site_name/type/url/title/description, twitter:card.
- AUTH/APP/INTERNAL pages carry `<meta name="robots" content="noindex">` and nothing else — they must never index.
- og:image is NOT set — add a 1200×630 social card when brand assets exist.
- Site origin assumed https://kevin.co; canonical paths come from ROUTES.md.

## Public pages (indexed)

| Page | Path | Title | Description |
|---|---|---|---|
| 00-Sign-in.html | /signin | Sign in — Kevin | Sign in to your Kevin account. |
| 02-Landing.html | / | Kevin — Photos in. Inventory out. | Drop your claim photos and Kevin builds a defensible, Xactimate-ready contents inventory: identified items, live retail comps, depreciation, and ACV — reviewed by you. |
| 15-Request-access.html | /request-access | Kevin for Teams — Enterprise | Volume licensing for carriers, TPAs, and multi-adjuster agencies. One invoice, custom terms. |
| 21-Pricing.html | /pricing | Pricing — Kevin | One flat monthly plan for content inventory specialists, IAs and public adjusters. Unlimited claims, no per-seat or per-claim fees. 7-day free trial. |
| 22-For-Adjusters.html | /for-adjusters | Kevin for Insurance Adjusters | Turn pack-out photo dumps into priced, defensible contents inventories that import straight into Xactimate and XactContents. |
| 23-For-Estate-Liquidators.html | /for-estate-liquidators | Kevin for Estate Sale Professionals | Photograph an estate, get a fair-market-value inventory with sold comps, conditions, and statuses — ready to hand a client. |
| 24-Docs.html | /docs | Documentation — Kevin | Guides for every step: uploading photos, staging and grouping, the review worksheet, pricing, depreciation, and exporting to Xactimate. |
| 25-Legal-hub.html | /legal | Privacy & Terms — Kevin | Kevin’s privacy policy and terms of service. |
| 37-Product-overview.html | /product | Product — Kevin | How Kevin works end to end: photo ingestion, item identification, live retail comps, depreciation, and carrier-ready exports. |
| 38-Contact.html | /contact | Contact — Kevin | Questions, support, or Enterprise inquiries — reach the Kevin team. |
| 39-About.html | /about | About — Kevin | Built by an adjuster who settled over 10,000 claims. A small team in Long Island, NY. |
| 48-Sample-claim.html | /sample | Sample Claim — Kevin | Explore a real 60-photo kitchen-fire claim: the photos Kevin read and the 57-line priced worksheet it produced. |
| 52-Watch-demo.html | /demo | Watch the Demo — Kevin | From photo drop to Xactimate. Real footage, real photos. |
| 53-Careers.html | /careers | Careers — Kevin | Help build the content inventory tool adjusters actually want to use. |

## Auth / app / internal pages

Every other page in `pages/` carries noindex (58 pages). The app lives behind auth; nothing there should appear in search.

## Still to do at deploy

- og:image social cards (1200×630) — none exist yet
- favicon / apple-touch-icon set
- ~~sitemap.xml + robots.txt~~ DONE — `deploy/sitemap.xml` + `deploy/robots.txt` (serve from the site root; update lastmod on content changes)
- ~~JSON-LD~~ DONE — Organization + SoftwareApplication on landing, FAQPage on pricing (generated from the live FAQ copy in pricing.jsx — re-sync if the FAQ changes)


## Footer identity (Aug 2026)
Landing + MktFooter carry legal name (Kevin.co, LLC), city, and kevin@kevin.co — needed for Google Ads advertiser verification trust signals. Full postal address (34 E. Main St. Ste 347, Smithtown, NY 11787) lives in every email footer per CAN-SPAM; the site shows city-level only by choice. No phone number: none is required by Google, and publishing one creates a support channel we don't staff.
