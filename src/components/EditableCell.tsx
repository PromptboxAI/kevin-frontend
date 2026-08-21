import { useEffect, useRef, useState } from 'react'
import { fmtUSD } from '../lib/format'

/**
 * A worksheet cell you can type in.
 *
 * Two behaviours the design calls for and a plain <input> does not give you:
 *  - numeric cells CLEAR on focus and restore the old value if you leave
 *    without typing. Select-on-focus was tried and dropped: it was unreliable
 *    and left the caret sitting in front of the digits.
 *  - Enter commits and moves down, Tab commits and moves right, Escape reverts
 *    (Excel muscle memory -- an adjuster tabs across a row without reaching
 *    for the mouse)
 */
export default function EditableCell({
  value,
  onCommit,
  numeric = false,
  money = false,
  decimals = false,
  mono = false,
  variant = 'grid',
  onEnterPastEnd,
  align = 'left',
  placeholder,
  disabled = false,
  pending = false,
  title,
}: {
  value: string
  onCommit: (next: string) => void
  numeric?: boolean
  /** Display-format as currency while unfocused; editing stays raw. */
  money?: boolean
  /**
   * Two decimals with NO symbol at rest. The worksheet's Unit Cost puts the $
   * in its own left-aligned span, spreadsheet accounting style, so the number
   * must not carry one.
   */
  decimals?: boolean
  /** Mono face for codes (Model #) without implying the value is numeric. */
  mono?: boolean
  /**
   * 'grid' is the flat worksheet cell (transparent until hover). 'panel' is
   * kevin.css's .k-insp-input -- a visible bordered box at rest, which is what
   * the item panel uses so an adjuster can see what is editable.
   */
  variant?: 'grid' | 'panel'
  /** Enter with nowhere further to go -- the design appends a new line. */
  onEnterPastEnd?: () => void
  align?: 'left' | 'right'
  placeholder?: string
  disabled?: boolean
  /**
   * Server is authoritative and still answering: the cell locks but KEEPS its
   * last value. Blanking it made the row flash to dashes mid-edit; the design
   * holds prior values and swaps once, when the response lands.
   */
  pending?: boolean
  title?: string
}) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  /** True until the adjuster types something into a cleared numeric cell. */
  const untouched = useRef(false)
  const ref = useRef<HTMLInputElement>(null)

  // Adopt server values whenever we are not mid-edit, so a recalc lands cleanly.
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    // Cleared on focus and never typed into: put the old value back, do not
    // report an edit the adjuster did not make.
    if (untouched.current) {
      untouched.current = false
      setDraft(value)
      return
    }
    const next = draft.trim()
    if (next === value.trim()) return
    onCommit(next)
  }

  /** Move focus to the next/previous editable cell; returns false at the end. */
  const step = (direction: 1 | -1, sameColumn: boolean): boolean => {
    const all = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[data-ws-cell]'),
    ).filter((el) => !el.disabled)
    const index = all.indexOf(ref.current as HTMLInputElement)
    if (index === -1) return false
    // Enter walks a column: the row stride is the number of editable cells per row.
    const stride = sameColumn ? Number(ref.current?.dataset.wsStride ?? 1) : 1
    const target = all[index + direction * stride]
    if (!target) return false
    target.focus()
    return true
  }

  // Unfocused money cells display-format; the draft stays raw for typing.
  const numeric_ok = draft !== '' && Number.isFinite(Number(draft))
  const shown = editing
    ? draft
    : money && numeric_ok
      ? fmtUSD(Number(draft))
      : decimals && numeric_ok
        ? Number(draft).toFixed(2)
        : draft

  return (
    <input
      ref={ref}
      data-ws-cell=""
      className={
        (variant === 'panel' ? 'k-insp-input' : 'k-cell k-cell--input') +
        (numeric || mono ? ' k-mono' : '') +
        (pending ? ' k-cell--pending' : '')
      }
      style={{ textAlign: align }}
      value={shown}
      placeholder={placeholder}
      disabled={disabled || pending}
      title={title}
      inputMode={numeric ? 'decimal' : undefined}
      onChange={(e) => {
        untouched.current = false
        setDraft(e.target.value)
      }}
      onFocus={() => {
        setEditing(true)
        if (numeric) {
          untouched.current = true
          setDraft('')
        }
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
          const moved = step(e.shiftKey ? -1 : 1, true)
          // Enter on the last row appends a new line, as in the design.
          if (!moved && !e.shiftKey) onEnterPastEnd?.()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setDraft(value)
          setEditing(false)
          ref.current?.blur()
        } else if (e.key === 'Tab') {
          // Let the browser move focus; just make sure the edit lands first.
          commit()
        }
      }}
    />
  )
}
