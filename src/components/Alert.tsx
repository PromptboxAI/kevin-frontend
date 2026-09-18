import type { ReactNode } from 'react'
import { I, Icon } from './Icon'

/**
 * The one alert banner. Every in-page notice -- the service banner, deferred
 * lines, roster cues, capture failures -- renders through this, so they share
 * one shape: tinted panel, icon, bold title, body, optional action, optional
 * dismiss. Owner's reference, 2026-09-18.
 *
 * Tones map to meaning, not mood:
 *  - `service`  the site-wide pricing banner and nothing else (rule 6b). Its
 *               own orange, never amber -- amber stays special limits (rule 6).
 *  - `error`    something failed and did not happen.
 *  - `success`  something the adjuster did landed.
 *  - `info`     something the adjuster can act on.
 *  - `neutral`  a state to know about, not a problem -- capacity waits live
 *               here (rule 12b: never an error, never amber).
 *
 * Toasts are not this: they overlay and auto-dismiss. Inline field errors are
 * not this either.
 */
export type AlertTone = 'service' | 'error' | 'success' | 'info' | 'neutral'

const TONE_ICON: Record<AlertTone, ReactNode> = {
  service: I.warn,
  error: I.warn,
  success: I.check,
  info: I.info,
  neutral: I.info,
}

export default function Alert({
  tone,
  title,
  children,
  action,
  onDismiss,
  className = '',
  live = false,
}: {
  tone: AlertTone
  title?: ReactNode
  children?: ReactNode
  /** A button or link, right-aligned. */
  action?: ReactNode
  /** Shows the close control. Omit where dismissing would lose track of work. */
  onDismiss?: () => void
  className?: string
  /** Announce changes to screen readers (status banners). */
  live?: boolean
}) {
  return (
    <div
      className={`k-alert k-alert--${tone}${className ? ` ${className}` : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={live ? 'polite' : undefined}
    >
      <span className="k-alert-ic" aria-hidden="true">
        <Icon d={TONE_ICON[tone]} size={15} stroke={1.8} />
      </span>
      <div className="k-alert-text">
        {title ? <strong className="k-alert-h">{title}</strong> : null}
        {children ? <div className="k-alert-d">{children}</div> : null}
      </div>
      {action ? <div className="k-alert-act">{action}</div> : null}
      {onDismiss ? (
        <button type="button" className="k-alert-x" aria-label="Dismiss" onClick={onDismiss}>
          <Icon d={I.close} size={13} stroke={2} />
        </button>
      ) : null}
    </div>
  )
}
