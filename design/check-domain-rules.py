# -*- coding: utf-8 -*-
"""Grep the shipping surfaces for language the domain rules scrapped.

    python check-domain-rules.py

Why this exists: in one session three separate instances of the scrapped
"free first claim" offer turned up, and each was invisible in a different way --
one inside FAQ JSON-LD that never renders, one in a CTA nobody re-read, one in a
bullet list. Language survives a scrapped decision far longer than code does,
because nothing fails when it is wrong.

Exit code is 1 when anything is flagged, so this can gate a commit hook or CI.

Reading the output: a hit is a PROMPT, not a verdict. Plenty of legitimate copy
mentions these terms in order to deny them ("no per-seat math") or as one option
among several ("Coverage C, Personal Property, Contents"). NEGATION_HINTS filters
the obvious cases; judge the rest against the rule named on the line.
"""
import io, os, re, sys, glob

# Flagged lines are real UI copy, so they carry arrows, em-dashes and curly
# quotes. On a cp1252 console printing one raised UnicodeEncodeError and killed
# the run mid-report -- the checker has to survive the characters it inspects.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

BASE = os.path.dirname(os.path.abspath(__file__))

# (rule, what it bans, pattern). Rule numbers refer to CLAUDE.md "Domain rules".
RULES = [
    ("2",  "Xactimate XML (it is .xlsx)",        r"Xactimate\s+XML"),
    ("4",  "direct carrier-portal submit",       r"carrier\s+portal|submits?\s+(directly\s+)?into\s+(the\s+)?carrier"),
    ("5",  "internal chat / @mentions",          r"@mention|internal\s+chat|shared\s+notes\s+thread"),
    ("7",  "SOC 2 (not certified)",              r"SOC\s*2"),
    ("8",  "'Dep.' should be 'Depr.'",           r"\bDep\.(?!r)"),
    ("9",  "per-seat pricing",                   r"per[- ]seat|/\s*seat\b|billed\s+per\s+user"),
    ("9",  "per-claim SUBSCRIPTION pricing",     r"\$49\s*/\s*claim|\$449|per[- ]claim\s+(fee|subscription)"),
    ("9",  "the scrapped free-first-claim offer", r"free\s+first\s+claim|first\s+claim\s+free|one\s+claim\s+free|\bon\s+us[.!]"),
    ("9",  "a three-tier table",                 r"three[- ]tier|3[- ]tier"),
    # Rule 9b. The trial is metered (250 items), never timed. A day count is the
    # whole thing we scrapped, so any calendar framing of the trial is a hit.
    ("9b", "the scrapped time-based trial",     r"\b(7|seven)[- ]day\s+(free\s+)?trial|free\s+(for\s+)?(7|seven)\s+days|trial\s+(ends|expires)\s+(in|on)\b|trial_period_days|days\s+(left|remaining)\s+in\s+(your\s+)?trial"),
    ("9b", "the scrapped free-first-estate promo", r"free\s+first\s+estate|first\s+estate\s+(is\s+)?free"),
    # The trial cap is 250 items. Any OTHER number of free items is drift.
    ("9b", "a trial cap other than 250 items",  r"\b(?!250\b)[\d,]{2,7}\s+free\s+items\b(?!\s+(left|remaining|used))"),
    ("10", "per-retailer sources / store list",  r"per[- ](retailer|store)\s+(integration|scraper|adapter)|18\s+stores|toggleable\s+stores"),
    ("10", "domain allowlist / blocklist",       r"(domain|strict)\s+(allow|block)list|allowlists?\s+govern"),
    ("11", "the removed comparable-sale path",   r"comparable[- ]sale|marketComp|back[- ]solve|resale\s+market\s+decides|RCV\s+equals\s+the\s+market\s+comp"),
    # Estate FMV is a haircut off ACTIVE listings, so naming a merchant that
    # returns active listings is fine -- what is false is calling any of it
    # SOLD. LiveAuctioneers stays listed: an auction house only reports
    # hammer prices, so naming it is itself sold provenance.
    ("11", "sold provenance (FMV is a haircut off active listings)",
     r"\(sold\)|sold\s+comps?|sold\s+listings?|hammer\s+price|LiveAuctioneers|resale\s+market\s+decides"),
    ("12", "dead needs_manual badges",           r"Appraisal\s+req'?d|Low\s+sample\s+badge|\$5k\s+(gate|approval)"),
    ("16", "an export readiness gate",           r"Export\s+anyway|not\s+ready\s+to\s+export"),
    ("19", "unlimited storage (it is 500 GB)",   r"unlimited\s+storage"),
    ("23", "'steers identification' as a LABEL", r">\s*steers\s+identification"),
]

# Copy that mentions a banned term in order to deny it, or lists it as one
# option among several, is correct and must not be flagged.
NEGATION_HINTS = re.compile(
    r"\b(no|not|never|without|don'?t|doesn'?t|isn'?t|aren'?t|nor|instead\s+of|"
    r"rather\s+than|scrapped|removed|dead|deprecated|superseded|was\s+the|"
    r"do\s+not\s+reintroduce|no\s+longer)\b", re.I)

# How near a negation has to be to count. A whole line can hold two unrelated
# clauses: page 15 read "You don't need this -- start on Pro ... 7-day free
# trial", and skipping the LINE because of that "don't" hid a scrapped-trial
# violation for as long as the guard has existed. The negation has to be in the
# same breath as the term, not merely in the same sentence.
NEGATION_WINDOW = 60
# A trailing negation runs a few words longer than a leading one -- "7-day free
# trial, which rule 9b scrapped" needs 26 characters before it lands.
NEGATION_WINDOW_AFTER = 48


def negated(line, match):
    """True when a negation sits just before the matched span, or right after it
    ('... 7-day trial: scrapped')."""
    before = line[max(0, match.start() - NEGATION_WINDOW):match.start()]
    after = line[match.end():match.end() + NEGATION_WINDOW_AFTER]
    return bool(NEGATION_HINTS.search(before) or NEGATION_HINTS.search(after))


# Docs that quote the prohibitions in order to state them.
SKIP_BASENAMES = {
    "CLAUDE.md", "INTERACTIONS.md", "SEO.md", "ROUTES.md", "SCHEMAS.md",
    "Kevin-docs.md", "github.md", os.path.basename(__file__),
}

# The design prototype AND the React app that actually serves kevin.co. The
# marketing copy now ships from `src/pages/*.tsx`; leaving those out would put
# the blind spot exactly where the live words are, which is the failure this
# script exists to catch.
PATTERNS = ("components/*.jsx", "pages/*.html", "emails/*.html",
            "*.jsx", "gitbook/**/*.md", "deploy/*",
            "../src/**/*.tsx", "../src/**/*.ts")


def files():
    out = []
    for pat in PATTERNS:
        for p in glob.glob(os.path.join(BASE, pat), recursive=True):
            if os.path.isfile(p) and os.path.basename(p) not in SKIP_BASENAMES:
                out.append(p)
    return sorted(set(out))


def main():
    paths = files()
    cache = {}
    for p in paths:
        try:
            cache[p] = io.open(p, encoding="utf-8", errors="replace").read().split("\n")
        except Exception:
            pass

    print("checking %d shipping files against %d rules\n" % (len(cache), len(RULES)))
    flagged = 0

    for rule, what, pat in RULES:
        rx = re.compile(pat, re.I)
        hits = []
        for p, lines in cache.items():
            for n, line in enumerate(lines, 1):
                m = rx.search(line)
                if m and not negated(line, m):
                    hits.append((os.path.relpath(p, BASE), n, line.strip()[:104]))
        if hits:
            flagged += len(hits)
            print("=" * 74)
            print("RULE %-3s %s  -- %d" % (rule, what, len(hits)))
            for f, n, l in hits[:10]:
                print("  %s:%d\n    %s" % (f, n, l))
            if len(hits) > 10:
                print("  ... and %d more" % (len(hits) - 10))

    print("\n" + "=" * 74)
    if flagged:
        print("%d line(s) to review. Each is a prompt, not a verdict -- check it" % flagged)
        print("against the rule named above it in CLAUDE.md before changing anything.")
    else:
        print("clean")
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
