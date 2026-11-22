import { useEffect, useRef, useState } from 'react'
import { fmtUSD } from '../lib/format'

/**
 * A worksheet cell you can type in.
 *
 * Two behaviours the design calls for and a plain <input> does not give you:
 *  - numeric cells CLEAR on focus and restore the old value if you leave
 *    without typing. Select-on-focus was tried and dropped: it was unreliable
 *    and left the caret sitting in front of the digits.
 *  - Excel keyboard mechanics (muscle memory -- an adjuster works down a
 *    column without reaching for the mouse):
 *      Enter / Shift+Enter  commit, same column, next / previous row
 *      Up / Down            the same, grid cells only
 *      Left / Right         move the caret; jump a cell only from the start /
 *                           end of the text, or before anything is typed
 *      Tab / Shift+Tab      commit, browser moves focus
 *      Escape               revert
 *
 * POSITION, NOT COUNTING. Grid cells carry `pos` -> data-ws-row (index in the
 * loaded grid) and data-ws-col (a stable column key). The old code walked a
 * flat list of inputs with a "stride" nobody ever set, so Enter moved right;
 * and counting inputs breaks the moment a row has a disabled or pending cell.
 * Lookups are scoped to the `.k-grid` the cell sits in -- the item panel also
 * renders this component, and a document-wide query jumped into it.
 *
 * Moving through a cell without changing it sends nothing: commit() returns
 * early on an unchanged value, and `armed` keeps a changed one to one save.
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
  pos,
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
  /** Grid cells only: where this cell sits, for keyboard moves. */
  pos?: { row: number; col: string }
}) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  /** True until the adjuster types something into a cleared numeric cell. */
  const untouched = useRef(false)
  const ref = useRef<HTMLInputElement>(null)
  /**
   * What we last sent, and what the prop read when we sent it. Between commit
   * and confirmation the prop is still STALE, so adopting it would blank the
   * cell back to its placeholder and then pulse the new value in. Hold the
   * committed text until the server's value actually arrives.
   */
  const held = useRef<{ sent: string; was: string } | null>(null)
  /**
   * One commit per edit. Enter and Tab commit AND move focus, and moving
   * focus blurs this input, which committed again: every edit reached the
   * server twice, and the audit log recorded each one twice. Escape blurred
   * too, so a cancelled edit was saved anyway. Armed on focus, spent by the
   * first commit or by Escape.
   */
  const armed = useRef(false)
  /** Typed into since focus. Until then Left/Right jump cells, as in Excel. */
  const typed = useRef(false)

  useEffect(() => {
    if (editing) return
    if (held.current) {
      const settled = value !== held.current.was || value.trim() === held.current.sent.trim()
      if (!settled) return
      held.current = null
    }
    setDraft(value)
  }, [value, editing])

  const commit = () => {
    if (!armed.current) return
    armed.current = false
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
    held.current = { sent: next, was: value }
    setDraft(next)
    onCommit(next)
  }

  /** Still focused, but the commit already happened: take edits again. */
  const rearm = () => {
    armed.current = true
    typed.current = false
    untouched.current = false
    setEditing(true)
  }

  const land = (target: HTMLInputElement) => {
    target.focus()
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  /** Panel cells: Enter walks the panel's own inputs, never into the grid. */
  const stepPanel = (direction: 1 | -1): boolean => {
    const all = Array.from(
      document.querySelectorAll<HTMLInputElement>('input.k-insp-input[data-ws-cell]'),
    ).filter((el) => !el.disabled)
    const index = all.indexOf(ref.current as HTMLInputElement)
    if (index === -1) return false
    const target = all[index + direction]
    if (!target) return false
    target.focus()
    return true
  }

  /** Previous / next enabled cell in this row, in column order. */
  const stepAcross = (direction: 1 | -1): boolean => {
    const me = ref.current
    const grid = me?.closest<HTMLElement>('.k-grid')
    if (!me || !grid || !pos) return false
    const all = Array.from(
      grid.querySelectorAll<HTMLInputElement>(`input[data-ws-cell][data-ws-row="${pos.row}"]`),
    ).filter((el) => el === me || !el.disabled)
    const target = all[all.indexOf(me) + direction]
    if (!target) return false
    land(target)
    return true
  }

  /**
   * Same column, nearest row in `direction` whose cell is enabled -- disabled
   * and pending cells are skipped, not stopped on.
   *
   *   'moved'  focus moved now
   *   'later'  that row is not drawn yet (virtualised window, or a page still
   *            arriving): scroll toward it and finish on a later frame
   *   'end'    nowhere further to go
   */
  const stepDown = (direction: 1 | -1): 'moved' | 'later' | 'end' => {
    const me = ref.current
    const grid = me?.closest<HTMLElement>('.k-grid')
    if (!me || !grid || !pos) return 'end'
    const { row, col } = pos
    const find = () => {
      let best: HTMLInputElement | null = null
      let bestRow = 0
      for (const el of grid.querySelectorAll<HTMLInputElement>(
        `input[data-ws-cell][data-ws-col="${col}"]`,
      )) {
        if (el.disabled) continue
        const r = Number(el.dataset.wsRow)
        if ((r - row) * direction <= 0) continue
        if (best === null || (r - bestRow) * direction < 0) {
          best = el
          bestRow = r
        }
      }
      return best
    }
    const hit = find()
    if (hit) {
      land(hit)
      return 'moved'
    }
    const scroller = grid.querySelector<HTMLElement>('.k-scroll')
    if (!scroller) return 'end'
    const canScroll = () =>
      direction === 1
        ? scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1
        : scroller.scrollTop > 0
    // Only downward waits on pages: Down on the last loaded row fetches more.
    const morePages = () => direction === 1 && grid.dataset.wsMore === '1'
    if (!canScroll() && !morePages()) return 'end'
    // Walk the window toward the row half a screen at a time. Scrolling also
    // trips the grid's own near-the-bottom page fetch.
    const startTop = scroller.scrollTop
    const deadline = performance.now() + 8000
    const tick = () => {
      const found = find()
      if (found) {
        land(found)
        return
      }
      if (canScroll()) {
        scroller.scrollTop += (direction * scroller.clientHeight) / 2
      } else if (!morePages() || performance.now() > deadline) {
        // Nothing there after all: put the view back where it was.
        scroller.scrollTop = startTop
        if (me.isConnected) me.focus()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return 'later'
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
      data-ws-row={pos?.row}
      data-ws-col={pos?.col}
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
        typed.current = true
        setDraft(e.target.value)
      }}
      onFocus={() => {
        armed.current = true
        typed.current = false
        setEditing(true)
        if (numeric) {
          untouched.current = true
          setDraft('')
        }
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return
        const inGrid = variant === 'grid' && pos !== undefined
        const plain = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
        if (e.key === 'Enter') {
          e.preventDefault()
          const direction = e.shiftKey ? -1 : 1
          commit()
          if (!inGrid) {
            if (!stepPanel(direction)) rearm()
            return
          }
          if (stepDown(direction) !== 'end') return
          // Enter on the last row appends a new line, as in the design.
          if (direction === 1 && onEnterPastEnd) onEnterPastEnd()
          else rearm()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          armed.current = false
          untouched.current = false
          setDraft(value)
          setEditing(false)
          ref.current?.blur()
        } else if (e.key === 'Tab') {
          // Let the browser move focus; just make sure the edit lands first.
          commit()
        } else if (
          inGrid &&
          plain &&
          (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
          // Never steal arrows from an open list.
          e.currentTarget.getAttribute('aria-expanded') !== 'true'
        ) {
          e.preventDefault()
          commit()
          // Down on the last row stays put; appending is Enter's job.
          if (stepDown(e.key === 'ArrowDown' ? 1 : -1) === 'end') rearm()
        } else if (inGrid && plain && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          const el = e.currentTarget
          const left = e.key === 'ArrowLeft'
          const atEdge =
            el.selectionStart === el.selectionEnd &&
            (left ? el.selectionStart === 0 : el.selectionEnd === el.value.length)
          // Mid-text after typing: the caret moves, as in any text box.
          if (typed.current && !atEdge) return
          e.preventDefault()
          commit()
          if (!stepAcross(left ? -1 : 1)) rearm()
        }
      }}
    />
  )
}
