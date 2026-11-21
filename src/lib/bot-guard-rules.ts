/**
 * What a bot may not say. One implementation, no React, no fetch.
 *
 * `check-domain-rules.py` greps the shipping FILES. It cannot see model
 * output, and a generative answer is exactly where the scrapped copy comes
 * back: a visitor asks "what happens past 2,000 items" and the thing that
 * resurfaced on nine surfaces gets one more chance to be said out loud. This
 * module is that guard, moved to the one place a file grep cannot reach --
 * the answer, before it is shown.
 *
 * ⛔ A SYSTEM PROMPT IS NOT A GUARD. It is a request; this is a check. Both
 * ship, and the check is what decides whether an answer reaches a visitor.
 *
 * ⛔ NEVER NAME THE THING YOU ARE HIDING. The comp vendor and the listing
 * selection method are internal (rule 10), so the system prompt may not say
 * "do not mention SerpApi" -- that sentence IS the leak, one jailbreak away
 * from being quoted back. The prompt describes only what is publishable (the
 * Kevin Content Pricing Engine, the Source Link); the forbidden strings live
 * here, in a checker the model never sees.
 *
 * Shape is lifted from `check-domain-rules.py` on purpose, including the
 * negation window: an answer that says "there is no post-pay overage" or
 * "Kevin does not claim SOC 2" is CORRECT, and a guard that blocks the
 * correct answer teaches the operator to switch it off. Same reason the
 * python guard carries NEGATION_HINTS.
 *
 * Rule numbers refer to CLAUDE.md "Domain rules -- DO NOT VIOLATE".
 * Tested by `scripts/test-bot-guard.mjs` (npm run test:bot), whose cases are
 * the red-team eval set: one scrapped claim per rule, plus the correct answer
 * that must still pass.
 */

/** Which bot produced the answer. The public bot is held to more. */
export type BotAudience = 'public' | 'adjuster'

export type BotFinding = {
  /** CLAUDE.md rule number, e.g. "9b". */
  rule: string
  /** What the rule bans, for the operator reading the log. */
  what: string
  /** The matched span with a little context either side. */
  excerpt: string
  /** Character offset of the match in the answer. */
  index: number
}

type GuardRule = {
  rule: string
  what: string
  pattern: RegExp
  /** Omitted = both bots. */
  audience?: BotAudience
  /**
   * True for a rule about how the BOT speaks rather than what is true.
   *
   * `checkCorpus` skips these. The corpus is approved human copy — a marketing
   * page is allowed to be persuasive, and a docs article is allowed to quote an
   * example price — while the bot is held to the owner's narrower voice rules
   * (no outcome promises, and the website bot never prices an item). Checking
   * the voice rules against the pages would flag the copywriter for doing their
   * job, and a guard that cries wolf on shipped copy gets switched off.
   */
  answerOnly?: boolean
}

/**
 * The strings that may never appear in an answer, affirmed.
 *
 * Each one is a claim the owner scrapped or an internal fact that has no
 * customer-facing form. Where a pattern looks over-broad, read the rule: the
 * negation window below is what keeps "Kevin is not SOC 2 certified" legal.
 */
const RULES: GuardRule[] = [
  // Rule 10, amended 2026-10-04. Two separate secrets: WHO supplies the
  // offers, and HOW the cited listing is picked. Both are internal only, on
  // every surface, and the method has already been scrubbed from three.
  {
    rule: '10',
    what: 'the comp vendor (internal only -- it is the Kevin Content Pricing Engine)',
    pattern: /serp\s?api|google\s+shopping|google\s+immersive|immersive\s+product\s+api/i,
  },
  {
    rule: '10',
    what: 'how the cited listing is chosen (internal only -- the Source Link is the answer)',
    pattern:
      // `median (sets|becomes)` is here because of a real near-miss: the
      // design prototype prints "Live comps · median sets RCV" on the
      // worksheet chip, and neither this pattern nor check-domain-rules.py's
      // caught it — both only looked for "median OF the comps". A bot that
      // learned the phrasing from a ported string would have leaked the
      // method in the one wording nobody was checking.
      /middle\s+(one|listing|price|comp|offer)|middle\s+by\s+price|midpoint\s+of|median\s+(of\s+)?(the\s+)?(comps?|listings?|prices?|offers?)|median\s+(sets|becomes?|is\s+the|drives?|picks?)|(sets|becomes?)\s+the\s+(median|midpoint)|average\s+of\s+(the\s+)?(comps?|listings?|prices?|offers?)|(cheapest|lowest|highest|dearest)\s+(of\s+the\s+)?(comps?|listings?|offers?)|we\s+(pick|choose|select|take)\s+the\s+(middle|median|cheapest|lowest|highest)/i,
  },
  // Rule 10's one approved property is "a listing", never "a live listing":
  // links go stale over months and the claim is about what the price IS.
  {
    rule: '10',
    what: '"live listing" (links go stale -- say "a listing")',
    pattern: /live\s+listings?|listings?\s+that\s+(is|are)\s+live|live\s+retail\s+listings?/i,
  },

  // Rule 9, amended 2026-10-03. Post-pay overage is withdrawn from every
  // surface; past the allowance there are only credits at $0.75. The dead
  // $0.20 came back on nine surfaces, so it gets its own pattern.
  {
    rule: '9',
    what: 'the withdrawn $0.20 post-pay overage',
    pattern: /\$0\.20|0\.20\s+(an|per)\s+item|per[- ]item\s+overage|overage\s+(rate|price|charge)|billed\s+(for\s+)?(the\s+)?overage|charged?\s+at\s+the\s+end\s+of\s+the\s+(month|cycle)\s+for\s+extra\s+items/i,
  },
  {
    rule: '9',
    what: 'per-seat or per-claim pricing (it is flat monthly)',
    pattern:
      // `\$449\b(?!\.\d)` on purpose: $449 was the scrapped Agency per-seat
      // price, but $449.99 is an ordinary replacement cost, and a bare
      // substring match flagged every mixer in the docs.
      /per[- ]seat|\/\s*seat\b|(a|an|per|each)\s+seats?\b|billed\s+per\s+user|per[- ]claim\s+(fee|price|subscription)|\$49\s*(\/|\s+(a|per)\s+)claim|\$449\b(?!\.\d)/i,
  },
  {
    rule: '9',
    what: 'a three-tier table (there are two tiers)',
    pattern: /three[- ]tier|3[- ]tier|three\s+plans|\bSolo\s+(plan|tier)\b|\bAgency\s+(plan|tier)\b/i,
  },
  // Rule 9b. The trial is metered, never timed. Any calendar framing is the
  // whole thing that was scrapped.
  {
    rule: '9b',
    what: 'the scrapped time-based trial (250 items, LIFETIME, no deadline)',
    pattern:
      /\b(7|seven|14|fourteen|30|thirty)[- ]day\s+(free\s+)?trial|free\s+(for\s+)?(7|seven|14|fourteen|30|thirty)\s+days|trial\s+(ends|expires|runs\s+out)\s+(in|on|after)|trial\s+(lasts?|runs?)\s+(for\s+)?(\d+|seven|fourteen|thirty)\s+days?|days\s+(left|remaining)\s+(in|on)\s+(your\s+)?trial|trial_period_days|your\s+trial\s+(will\s+)?expires?/i,
  },
  {
    rule: '9b',
    what: 'the trial renewing (the 250 is one lifetime pool)',
    pattern:
      /250\s+(free\s+)?items\s+(a|per|each)\s+month|trial\s+(allowance\s+)?(resets|renews|refreshes)|monthly\s+trial\s+(pool|allowance)/i,
  },
  {
    rule: '9b',
    what: 'the scrapped free-first-estate promo (estates are $249 from the first)',
    pattern: /free\s+first\s+estate|first\s+estate\s+(is\s+)?free/i,
  },
  // Rule 9c. Deleting an item does not restore quota, and the counter is
  // append-only. A bot promising a refund writes a support ticket.
  {
    rule: '9c',
    what: 'quota returning when an item is deleted (the counter is append-only)',
    pattern:
      /delet\w+\s+(an?\s+)?items?\s+(to\s+)?(free|frees|restores?|refunds?|gives?\s+back|reclaims?)|(restores?|refunds?|credits?\s+back)\s+(your\s+|the\s+)?(quota|allowance|items)/i,
  },

  // Rule 7. Not certified. Concrete security language instead.
  { rule: '7', what: 'SOC 2 (not claimed -- the company is not certified)', pattern: /SOC\s*2/i },

  // Rule 2. The export is a pre-formatted .xlsx. "XML" has never been true.
  {
    rule: '2',
    what: 'Xactimate XML (it is a pre-formatted .xlsx)',
    pattern: /Xactimate\s+XML|XactContents\s+XML|\.esx\s+export|export\s+(an?\s+)?XML/i,
  },

  // Rule 4. Kevin exports a file the adjuster sends. There is no carrier
  // review surface and nothing is pushed into carrier systems.
  //
  // The subject is load-bearing: "you send it to the carrier" is the correct
  // sentence and must pass, while "Kevin sends it to the carrier" is the
  // thing a deleted page once implied. So the pattern requires Kevin (or the
  // product's "we") as the actor, within three words of the verb.
  //
  // Those filler words may not themselves be a negation, or the match
  // SWALLOWS the denial and no window can see it: "Kevin does not submit into
  // carrier systems" — the correct sentence, live on the carriers guide —
  // matched with the "not" inside the match.
  {
    rule: '4',
    what: 'pushing into carrier systems / a carrier review surface',
    pattern:
      /(kevin|we|the\s+(app|platform|system))\s+((?!not\b|never\b|no\b|cannot\b)\w+\s+){0,3}(submits?|pushe?s?|uploads?|sends?|files?|transmits?)\s+[^.]{0,40}?(in)?to\s+(the\s+)?carrier|carrier\s+portal|carrier[- ]facing\s+(review|portal|surface)|the\s+carrier\s+(can\s+)?(review|approve)s?\s+it\s+in\s+Kevin/i,
  },

  // Rule 11. Estate FMV is a haircut off ACTIVE listings. Calling any of it
  // sold is false provenance -- an asking price is not a sale.
  {
    rule: '11',
    what: 'sold provenance (prices come from active listings, never sold comps)',
    pattern: /sold\s+comps?\b|sold\s+listings?\b|auction\s+results?|hammer\s+price|what\s+it\s+actually\s+sold\s+for/i,
  },
  // Rule 11. No back-solve, and the frontend computes no valuation at all.
  {
    rule: '11',
    what: 'the removed back-solve (RCV = comp / (1 - depr))',
    pattern: /back[- ]solve|gross(ed)?[- ]up\s+to\s+a\s+replacement|RCV\s*=\s*comp\s*[/÷]/i,
  },

  // Rule 13. Depreciation runs to 100% and a fully-aged line is worth $0.00.
  // The 90% salvage floor was the owner's decision to remove.
  //
  // NOT a bare "salvage floor": a PER-CLASS ceiling is still sanctioned
  // wherever the schedule sets `max_pct`, and the docs article on custom
  // schedules says so in as many words ("that maximum is where a salvage
  // floor belongs if you want one"). What is banned is asserting a GLOBAL
  // floor, so the pattern wants the claim, not the term.
  {
    rule: '13',
    what: 'a global depreciation cap / salvage floor (it runs to 100%)',
    pattern:
      /cap(ped|s)?\s+(depreciation\s+)?at\s+90|90%\s+(cap|ceiling|maximum)|(keeps?|retains?|leaves?|holds?)\s+(a\s+)?salvage\s+(floor|value)|never\s+(depreciates?\s+)?(to\s+)?(100%|zero|\$0)|cannot\s+reach\s+100%/i,
  },

  // Rule 16 / 15. Kevin never blocks an export on editorial readiness, and
  // it is not a compliance system.
  {
    rule: '16',
    what: 'an export readiness gate',
    pattern:
      /export\s+anyway|not\s+ready\s+to\s+export|(must|have\s+to|need\s+to)\s+(price|fix|resolve|clear|complete)\s+(\w+\s+){0,3}before\s+(you\s+can\s+)?export|blocks?\s+the\s+export|cannot\s+export\s+until/i,
  },

  // Rule 19. Pro includes 500 GB; over the pool is an email, then $19/mo per
  // extra 500 GB. Nothing is ever deleted to reclaim space.
  {
    rule: '19',
    what: 'unlimited storage (Pro includes 500 GB)',
    pattern: /unlimited\s+storage|storage\s+is\s+unlimited/i,
  },
  {
    rule: '19',
    what: 'deleting data to reclaim space (nothing is ever deleted)',
    pattern: /delete[sd]?\s+(your\s+)?(old\s+)?(photos|claims|data)\s+to\s+(free|reclaim|make)/i,
  },

  // Rule 5. No internal chat, @mentions or shared-notes thread. An assistant
  // promising a colleague can be tagged invents a product.
  {
    rule: '5',
    what: 'internal chat / @mentions / a shared-notes thread',
    pattern: /@mention|internal\s+chat|shared\s+notes\s+thread|tag\s+(a\s+)?(colleague|teammate|coworker)|comment\s+thread\s+on\s+the\s+(claim|item|line)/i,
  },

  // Rule 8. Depreciation shortens to "Depr.", never "Dep."
  { rule: '8', what: "'Dep.' should be 'Depr.'", pattern: /\bDep\.(?!r)/ },

  // Rule 1. Items are always <= photos: one item per photo, at most.
  {
    rule: '1',
    what: 'more items than photos (the vision tech reads one item per photo)',
    pattern: /(several|multiple|many|\b[2-9]\b|\b\d{2,}\b)\s+items?\s+(from|per|out\s+of)\s+(a|one|each|every|a\s+single)\s+photo/i,
  },

  // The owner's own rule for both bots, 2026-11-20: neutral wording. Kevin is
  // a neutral party that documents what things cost; it does not promise an
  // outcome against a carrier, and it is not an appraisal (rule 17).
  {
    rule: 'tone',
    what: 'a promise about the outcome of a claim (Kevin is a neutral party)',
    pattern:
      /(get|win|secure|recover)\s+(you|your\s+(client|insured)|them)\s+(a\s+)?(more|bigger|higher|larger)\b|maximi[sz]e\s+(your|the|their)\s+(payout|settlement|recovery|claim)|beat\s+the\s+(carrier|adjuster|insurer)|guarantee[sd]?\s+(a\s+)?(payout|settlement|approval|more\s+money)|fight\s+the\s+(carrier|insurer)/i,
    answerOnly: true,
  },
  {
    rule: '17',
    what: 'calling the inventory an appraisal',
    pattern: /(is|as)\s+an\s+appraisal|certified\s+appraisal|we\s+appraise/i,
  },

  // The public bot never quotes a price for an item (owner, 2026-11-20). It
  // has no claim in front of it, so any item price it states is invented.
  {
    rule: 'public',
    what: 'quoting a price for an item (the website bot has no claim to read)',
    pattern:
      /(that|this|a|an|your)\s+\w+(\s+\w+){0,3}\s+(is|would\s+be|costs?|prices?\s+(at|around)|comes?\s+(out\s+)?(at|to))\s+(about\s+|around\s+|roughly\s+)?\$[\d,]/i,
    audience: 'public',
    answerOnly: true,
  },
]

/**
 * Copy that mentions a banned term in order to DENY it is correct and must
 * pass. Ported from check-domain-rules.py, including the asymmetric windows:
 * a trailing negation ("...7-day trial, which was scrapped") runs a few words
 * longer than a leading one.
 */
const NEGATION_HINTS =
  /\b(no|not|never|without|don'?t|doesn'?t|isn'?t|aren'?t|wasn'?t|nor|instead\s+of|rather\s+than|scrapped|removed|dead|withdrawn|deprecated|superseded|no\s+longer|unlike|cannot|can'?t|there\s+is\s+no|we\s+do\s+not)\b/i

const NEGATION_WINDOW_BEFORE = 60
const NEGATION_WINDOW_AFTER = 48

/**
 * A clause boundary. The window stops here, which the python guard's does
 * not -- and that difference is deliberate, because a model writes one
 * sentence where a page writes two.
 *
 * "There is a per-claim fee if you would rather not subscribe" put a "not"
 * 25 characters after the matched term and read as a denial. A negation only
 * negates its own clause.
 *
 * "rather" is deliberately NOT a boundary: "rather than" is itself one of
 * the negation hints, and treating it as a boundary cut the denial out of the
 * window it was denying. The docs sentence "a real price somebody is asking
 * rather than an average of prices nobody charges" is correct copy, and it
 * read as a rule-10 breach for exactly that reason.
 *
 * ⛔ PUNCTUATION IS A BOUNDARY LOOKING BACK, NOT LOOKING FORWARD. The two
 * directions carry different sentences, and each rule here comes from one that
 * was judged wrong:
 *
 * - Backwards, punctuation ends the clause. The python guard's own documented
 *   miss is "You don't need this -- start on Pro ... 7-day free trial": a
 *   `don't` on the far side of a dash is not a denial of the trial.
 * - Forwards, punctuation often introduces the CONTRAST that does the denying.
 *   The Contents Team comparison reads "...charges per seat; Kevin has no
 *   seats at all" — correct copy about a competitor, and cutting at the
 *   semicolon threw away the half that made it correct.
 */
const CLAUSE_WORDS = /\s(if|unless|because|so|and|but|while|though|although|otherwise)\s/gi
const CLAUSE_BOUNDARY_BEFORE = /[,;:—–()]|\s(if|unless|because|so|and|but|while|though|although|otherwise)\s/gi

/** The clause the match sits in, looking backwards: punctuation ends it. */
function clauseBefore(text: string, start: number): string {
  const window = text.slice(Math.max(0, start - NEGATION_WINDOW_BEFORE), start)
  let cut = 0
  for (const m of window.matchAll(new RegExp(CLAUSE_BOUNDARY_BEFORE.source, 'gi'))) {
    cut = (m.index ?? 0) + m[0].length
  }
  return window.slice(cut)
}

/** The clause the match sits in, looking forwards: only a conjunction ends it. */
function clauseAfter(text: string, end: number): string {
  const window = text.slice(end, end + NEGATION_WINDOW_AFTER)
  const m = window.match(new RegExp(CLAUSE_WORDS.source, 'i'))
  return m ? window.slice(0, m.index ?? window.length) : window
}

function negated(text: string, start: number, end: number): boolean {
  return NEGATION_HINTS.test(clauseBefore(text, start)) || NEGATION_HINTS.test(clauseAfter(text, end))
}

function excerptAt(text: string, start: number, end: number): string {
  const from = Math.max(0, start - 40)
  const to = Math.min(text.length, end + 40)
  return (from > 0 ? '…' : '') + text.slice(from, to).replace(/\s+/g, ' ').trim() + (to < text.length ? '…' : '')
}

/* -- money ---------------------------------------------------------------- */

/**
 * Dollar figures a bot may state on its own authority, because they are the
 * published prices and nothing else. Everything else has to be in the context
 * it was given -- which is what stops an invented price (owner, 2026-11-20).
 *
 * ⛔ NO 0.20, and no $0.125. The first is withdrawn (rule 9); the second is
 * Pro's effective per-item cost, an internal division that appears on no
 * surface.
 */
export const APPROVED_MONEY: readonly number[] = [
  249, // Pro, per month -- and an estate, per estate (rule 9)
  0.75, // a credit, per item past the allowance (rule 9)
  750, // the done-for-you minimum (rule 9d)
  275, // a done-for-you site visit (rule 9d)
  5, 4.5, 4, 3.5, 3, // the done-for-you bands (rule 9d)
  19, // per additional 500 GB, per month (rule 19)
  0, // "$0.00" -- a fully depreciated line (rule 13)
]

const MONEY = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/g

function moneyValues(text: string): number[] {
  const out: number[] = []
  for (const m of text.matchAll(MONEY)) {
    const whole = m[1].replace(/,/g, '')
    out.push(Number(m[2] ? `${whole}.${m[2]}` : whole))
  }
  return out
}

/* -- the check ------------------------------------------------------------ */

export type GuardInput = {
  /** The answer the model produced. */
  answer: string
  /** Which bot. The public bot may not quote an item price at all. */
  audience: BotAudience
  /**
   * Everything the model was given to answer from -- retrieved passages, and
   * for the adjuster bot the claim lines. A dollar figure that is not in
   * APPROVED_MONEY has to appear here, or the model made it up.
   */
  context?: string
  /**
   * False skips the rules about how the bot SPEAKS (see `answerOnly`), leaving
   * only the rules about what is TRUE. Use it on corpus copy, never on an
   * answer. `checkCorpus` is the entry point that sets it.
   */
  voiceRules?: boolean
}

/**
 * Every rule the answer breaks. Empty means it may be shown.
 *
 * Deliberately NOT checked: percentages. Depreciation percentages are quoted
 * from the claim and the schedule, and "100% of" is ordinary English, so the
 * false-positive rate would be the kind that gets a guard switched off. The
 * money check carries the weight, because money is what an adjuster acts on.
 */
export function checkAnswer({ answer, audience, context = '', voiceRules = true }: GuardInput): BotFinding[] {
  const findings: BotFinding[] = []

  for (const r of RULES) {
    if (r.audience && r.audience !== audience) continue
    if (r.answerOnly && !voiceRules) continue
    // The patterns are authored without /g; matchAll needs it, and a fresh
    // RegExp per call keeps lastIndex out of the picture entirely.
    const rx = new RegExp(r.pattern.source, r.pattern.flags.includes('g') ? r.pattern.flags : r.pattern.flags + 'g')
    for (const m of answer.matchAll(rx)) {
      const start = m.index ?? 0
      const end = start + m[0].length
      if (negated(answer, start, end)) continue
      findings.push({ rule: r.rule, what: r.what, excerpt: excerptAt(answer, start, end), index: start })
    }
  }

  // An unsupported dollar figure. The adjuster bot quotes claim money all day
  // and must be able to; it just may not produce a number that was never in
  // front of it.
  const supported = new Set(moneyValues(context))
  for (const m of answer.matchAll(MONEY)) {
    const whole = m[1].replace(/,/g, '')
    const value = Number(m[2] ? `${whole}.${m[2]}` : whole)
    if (APPROVED_MONEY.includes(value) || supported.has(value)) continue
    const start = m.index ?? 0
    findings.push({
      rule: 'money',
      what: 'a dollar figure that is neither a published price nor in the context given',
      excerpt: excerptAt(answer, start, start + m[0].length),
      index: start,
    })
  }

  return findings.sort((a, b) => a.index - b.index)
}

/** True when the answer may be shown as written. */
export function answerIsClean(input: GuardInput): boolean {
  return checkAnswer(input).length === 0
}

/**
 * Check a piece of CORPUS copy — a docs passage or a marketing page section —
 * for the rules about what is true.
 *
 * Two differences from checking an answer, both deliberate:
 *
 * - **The voice rules are skipped** (`answerOnly`). Shipped copy is allowed to
 *   sell and to quote an example price; the bot is not.
 * - **The text is its own context**, so its own figures count as supported. The
 *   money invariant exists to catch an INVENTED number, and nothing in a page
 *   the owner approved is invented. What this still catches is the whole point:
 *   a page that contradicts a locked rule would otherwise become the thing the
 *   bot cites it from.
 */
export function checkCorpus(text: string): BotFinding[] {
  return checkAnswer({ answer: text, audience: 'adjuster', context: text, voiceRules: false })
}

/**
 * What the visitor sees when an answer is blocked.
 *
 * ⛔ NEVER THE FINDING. It names the rule, and the rules name the things that
 * are internal -- a block message quoting itself would publish exactly what
 * the guard exists to withhold. The finding goes to the operator log; the
 * visitor gets a dead end that still helps, in the house voice (no "Soon", no
 * apology spiral).
 */
export const BLOCKED_ANSWER: Record<BotAudience, string> = {
  public:
    'That one is better answered by a person than by me. The docs cover most of it, and a quick call with the team covers the rest.',
  adjuster:
    'I am not confident enough in that answer to give it to you. The claim itself is the authority here — the worksheet row and its Source Link carry what the price came from.',
}
