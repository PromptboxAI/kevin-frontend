import { useEffect, useRef, useState } from 'react'

/**
 * A worksheet cell you can type in.
 *
 * Two behaviours the design calls for and a plain <input> does not give you:
 *  - numeric cells SELECT their contents on focus, so typing 15 replaces 150
 *    instead of appending to it
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
  const ref = useRef<HTMLInputElement>(null)

  // Adopt server values whenever we are not mid-edit, so a recalc lands cleanly.
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const commit = () => {
    setEditing(false)
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
    if (target) {
      target.focus()
      target.select()
    }
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
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        setEditing(true)
        // Numeric cells replace rather than append.
        if (numeric) e.target.select()
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
