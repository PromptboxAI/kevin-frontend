# -*- coding: utf-8 -*-
"""Audit the BUILT site against the SEO rules we have been applying by hand.

    npm run build && python design/check-seo.py

Why this exists: /for-adjusters was reported as having schema and did not --
it had none at all, on the highest-intent commercial page we publish. Nobody
noticed because every check so far has been a one-off grep against whatever
page was in front of us. This reads dist/ and checks every indexable page the
same way, so "it's there" becomes a thing that can be verified rather than
asserted.

Exit code is 1 when anything fails, so it can gate a commit or CI.

Checks, per indexable page:
  - a <title>, unique, <= 60 chars (SERP truncation)
  - a meta description, unique, <= 160 chars
  - a self-referencing canonical (or a deliberate cross-canonical, listed)
  - og:title, og:description, og:image, twitter:card
  - at least one JSON-LD block, and valid JSON
  - exactly one <h1>
  - present in sitemap.xml and llms.txt
And site-wide:
  - no indexable page missing from the sitemap
  - no sitemap entry that is not a real page
  - noindex pages excluded from both
"""
import io, json, os, re, sys

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
ORIGIN = 'https://www.kevin.co'

# Pages that deliberately canonicalise somewhere else, so they are absent from
# the sitemap on purpose. /sample redirects to the claim route; /docs points at
# its first article.
CROSS_CANONICAL = {
    '/sample',
    '/docs',
    # Merged into the reviewer guide 2026-10-05 and redirected; the URL
    # shipped, so it still resolves and canonicalises at the survivor.
    '/guides/desk-adjuster-contents-review',
}

# The app shell, not a page.
SKIP = {'/app'}

# Rendered from live data, so deliberately NOT prerendered: entry-server
# excludes it because a build-time snapshot of a claim would go stale. It still
# needs a title, description and canonical -- just not markup or schema.
NOT_PRERENDERED = {'/claims/sample'}


def pages():
    out = {}
    for root, _dirs, files in os.walk(DIST):
        if 'index.html' not in files:
            continue
        rel = os.path.relpath(root, DIST).replace(os.sep, '/')
        path = '/' if rel == '.' else '/' + rel
        if path in SKIP:
            continue
        out[path] = io.open(os.path.join(root, 'index.html'),
                            encoding='utf-8', errors='replace').read()
    return out


def meta(html, name=None, prop=None):
    if name:
        m = re.search(r'<meta[^>]*name="%s"[^>]*content="([^"]*)"' % name, html)
    else:
        m = re.search(r'<meta[^>]*property="%s"[^>]*content="([^"]*)"' % prop, html)
    return m.group(1) if m else None


def audit():
    docs = pages()
    sitemap = io.open(os.path.join(DIST, 'sitemap.xml'), encoding='utf-8').read()
    sm = {(u.split(ORIGIN)[-1] or '/') for u in re.findall(r'<loc>([^<]+)</loc>', sitemap)}
    llms = io.open(os.path.join(DIST, 'llms.txt'), encoding='utf-8').read()

    fails, titles, descs = [], {}, {}
    indexable = 0

    for path, html in sorted(docs.items()):
        if 'noindex' in html:
            if path in sm:
                fails.append((path, 'noindex page is in sitemap.xml'))
            continue
        indexable += 1

        def bad(msg):
            fails.append((path, msg))

        t = re.search(r'<title[^>]*>([^<]*)</title>', html)
        t = t.group(1).strip() if t else None
        if not t:
            bad('no <title>')
        else:
            if len(t) > 60:
                bad('title %d chars (> 60)' % len(t))
            if path not in CROSS_CANONICAL:
                titles.setdefault(t, []).append(path)

        d = meta(html, name='description')
        if not d:
            bad('no meta description')
        else:
            if len(d) > 160:
                bad('description %d chars (> 160)' % len(d))
            if path not in CROSS_CANONICAL:
                descs.setdefault(d, []).append(path)

        can = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', html)
        if not can:
            bad('no canonical')
        elif can.group(1) != ORIGIN + path and path not in CROSS_CANONICAL:
            if not (path == '/' and can.group(1).rstrip('/') == ORIGIN):
                bad('canonical points at %s' % can.group(1))

        for prop in ('og:title', 'og:description', 'og:image'):
            if not meta(html, prop=prop):
                bad('no %s' % prop)
        if not meta(html, name='twitter:card'):
            bad('no twitter:card')

        if path in CROSS_CANONICAL or path in NOT_PRERENDERED:
            continue

        blocks = re.findall(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
        if not blocks:
            bad('NO JSON-LD')
        for b in blocks:
            try:
                json.loads(b)
            except Exception as e:
                bad('JSON-LD does not parse (%s)' % str(e)[:40])

        h1 = len(re.findall(r'<h1[\s>]', html))
        if h1 != 1:
            bad('%d <h1> tags' % h1)

        if path not in sm and path not in CROSS_CANONICAL:
            bad('missing from sitemap.xml')
        if path not in llms and path not in CROSS_CANONICAL:
            bad('missing from llms.txt')

    for t, ps in titles.items():
        if len(ps) > 1:
            fails.append((', '.join(ps), 'duplicate title: %r' % t[:48]))
    for d, ps in descs.items():
        if len(ps) > 1:
            fails.append((', '.join(ps), 'duplicate description'))
    for u in sorted(sm - set(docs)):
        fails.append((u, 'in sitemap.xml but no page was built'))

    print('audited %d indexable pages (%d built, %d sitemap urls)\n'
          % (indexable, len(docs), len(sm)))
    if fails:
        print('=' * 74)
        for p, m in fails:
            print('  %-52s %s' % (p, m))
        print('=' * 74)
        print('%d problem(s).' % len(fails))
        return 1
    print('clean')
    return 0


if __name__ == '__main__':
    sys.exit(audit())
