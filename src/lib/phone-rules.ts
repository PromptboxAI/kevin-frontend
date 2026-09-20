/**
 * US phone formatting, as typed.
 *
 * Import-free so it runs under node for the tests. An adjuster types digits
 * and the field shows 555-123-4567 — one shape on screen, one shape on the
 * export, no parsing later to work out what a number meant.
 *
 * Deliberately forgiving about what arrives: a pasted "(555) 123 4567" or
 * "+1 555.123.4567" is the same number, so the digits are what count. Only
 * digits are kept, a leading US country code is dropped, and anything past
 * ten digits is ignored rather than mangled.
 */

export function formatPhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  // A leading 1 is the country code, not an area code.
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  digits = digits.slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

/** True once it is a complete US number. Empty is fine — the field is optional. */
export function isCompletePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 0 || digits.length === 10
}
