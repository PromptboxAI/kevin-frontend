/**
 * Copy text, and say whether it worked.
 *
 * `navigator.clipboard` is missing on insecure origins and can reject when the
 * document is not focused (a click inside a dialog can land there), so this
 * falls back to a hidden textarea + execCommand. Callers show "Copied" ONLY on
 * true: a copy button that reports success and copied nothing is the worst
 * outcome it can have, because the adjuster pastes an empty link to a client.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}
