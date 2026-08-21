import { useEffect, useRef, useState } from 'react'

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
  align = 'left',
  placeholder,
  disabled = false,
  pending = false,
  title,
}: {
  value: string
  onCommit: (next: string) => void
  numeric?: boolean
  align?: 'left' | 'right'
  placeholder?: string
  disabled?: boolean
  /** Server is authoritative and still answering -- lock the cell. */
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

  /** Move focus to the next/previous editable cell in DOM order. */
  const step = (direction: 1 | -1, sameColumn: boolean) => {
    const all = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[data-ws-cell]'),
    ).filter((el) => !el.disabled)
    const index = all.indexOf(ref.current as HTMLInputElement)
    if (index === -1) return
    // Enter walks a column: the row stride is the number of editable cells per row.
    const stride = sameColumn ? Number(ref.current?.dataset.wsStride ?? 1) : 1
    const target = all[index + direction * stride]
    if (target) target.focus()
  }

  return (
    <input
      ref={ref}
      data-ws-cell=""
      className={`k-cell k-cell--input${numeric ? ' k-mono' : ''}${pending ? ' k-cell--pending' : ''}`}
      style={{ textAlign: align }}
      value={pending ? '' : draft}
      placeholder={pending ? '' : placeholder}
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
          step(e.shiftKey ? -1 : 1, true)
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
