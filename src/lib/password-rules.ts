/**
 * Password strength, lifted from `ResetPassword` in
 * `design/components/auth-flow.jsx` so the meter, the label and the submit gate
 * all read one implementation.
 *
 * Import-free on purpose: it runs under `node --input-type=module` for the unit
 * tests, the same way photo-rules / depr-rules / holdback-rules do.
 *
 * The design's expression is a nested ternary that is easy to get subtly wrong
 * when transcribed, so it is written out here as ordered bands with the
 * original thresholds intact:
 *
 *   0  empty
 *   1  Weak       < 7 characters
 *   2  OK         7-9 characters
 *   3  Strong     10+ characters
 *   4  Excellent  12+ AND uppercase AND digit AND symbol
 *
 * Note that 4 requires 12 characters, not 10 — a 10-character password with all
 * three character classes scores 3. That is the design's behavior and it is
 * deliberate: length dominates.
 */

export type Strength = 0 | 1 | 2 | 3 | 4

export const STRENGTH_LABEL = ['', 'Weak', 'OK', 'Strong', 'Excellent'] as const
export const STRENGTH_TONE = ['line', 'danger', 'warn', 'ok', 'ok'] as const

/** Minimum score the design lets you submit at ("OK"). */
export const MIN_SUBMIT_STRENGTH = 2

export function hasUpper(pw: string): boolean {
  return /[A-Z]/.test(pw)
}

export function hasDigit(pw: string): boolean {
  return /\d/.test(pw)
}

export function hasSymbol(pw: string): boolean {
  return /[^A-Za-z0-9]/.test(pw)
}

export function strengthOf(pw: string): Strength {
  if (!pw) return 0
  if (pw.length < 7) return 1
  if (pw.length < 10) return 2
  if (pw.length >= 12 && hasUpper(pw) && hasDigit(pw) && hasSymbol(pw)) return 4
  return 3
}

export function labelFor(strength: Strength): string {
  return STRENGTH_LABEL[strength]
}

export function toneFor(strength: Strength): string {
  return STRENGTH_TONE[strength]
}

/** The five checklist rows under the field, in the design's order. */
export function checklist(pw: string): [string, boolean][] {
  return [
    ['7+ characters', pw.length >= 7],
    ['One uppercase letter', hasUpper(pw)],
    ['One number', hasDigit(pw)],
    ['One symbol (recommended)', hasSymbol(pw)],
    // The design ticks this as soon as anything is typed. It is a claim the
    // frontend cannot actually verify — password history lives server-side —
    // so it stays presentational and is NOT part of the submit gate.
    ["Doesn't match any of your last 5 passwords", pw.length > 0],
  ]
}

export function canSubmit(pw: string, confirm: string): boolean {
  return strengthOf(pw) >= MIN_SUBMIT_STRENGTH && pw === confirm && confirm.length > 0
}
