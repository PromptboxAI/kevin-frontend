import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import qrcode from 'qrcode-generator'
import { I, Icon } from './Icon'
import { mintPairToken, revokeCapture } from '../lib/pairing'
import {
  fmtCountdown,
  groupCode,
  pairUrl,
  revokeSummary,
  secondsLeft,
} from '../lib/pair-rules'
import type { PairToken } from '../lib/pair-rules'

/**
 * "Add photos from phone" -- the handoff.
 *
 * Ported from `PairPhoneButton` in `design/components/claim-overview.jsx`,
 * where the token was `kvn-pair-XXXXX` from Math.random and the QR was
 * `FauxQR`, a decorative grid. Both are real here.
 *
 * The two things this screen must not get wrong:
 *
 *   The code is a BEARER CREDENTIAL for someone's claim photos. It goes in the
 *   URL fragment so it never reaches a server log, and it is never persisted.
 *
 *   Revoking kills PAIRED PHONES, not unredeemed codes. A code on screen dies
 *   on its own in about two minutes, and the copy says so rather than implying
 *   the button recalled it.
 */
export default function PairPhoneModal({ claimId, onClose }: { claimId: string; onClose: () => void }) {
  const [token, setToken] = useState<PairToken | null>(null)
  const [left, setLeft] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const mint = useMutation({
    mutationFn: () => mintPairToken(claimId),
    onSuccess: (t) => {
      setToken(t)
      setNotice(null)
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : 'Could not generate a code.'),
  })

  const revoke = useMutation({
    mutationFn: () => revokeCapture(claimId),
    onSuccess: (r) => {
      setConfirmRevoke(false)
      setNotice(revokeSummary(r.revoked))
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : 'Could not sign phones out.'),
  })

  // Mint once on open. The token is ephemeral by design, so there is nothing
  // to restore and nothing to cache -- reopening always means a new code.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    mint.mutate()
  }, [mint])

  /**
   * Countdown off the wall clock.
   *
   * `expires_at` is the source, not a decrementing counter: a backgrounded tab
   * stops firing timers, and resuming from where it paused would show time the
   * token does not have.
   */
  useEffect(() => {
    if (!token) return
    const tick = () => setLeft(secondsLeft(token.expires_at, Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [token])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const live = token !== null && left > 0
  const url = token ? pairUrl(window.location.origin, token.token) : ''

  return (
    <div
      className="k-export-stage"
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', background: 'oklch(0.2 0.01 250 / 0.45)' }}
      onClick={onClose}
    >
      <div className="k-export-modal" style={{ width: 420, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 0' }}>
          <div>
            <div
              className="k-mono"
              style={{ fontSize: 10.5, color: 'var(--k-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}
            >
              Add photos from phone
            </div>
            <h2 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 21, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
              Scan with your phone camera.
            </h2>
          </div>
          <button type="button" className="k-icon-btn" onClick={onClose} title="Close">
            <Icon d={I.close} size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 20px 20px' }}>
          {live ? (
            <div style={{ padding: 14, background: '#fff', border: '1px solid var(--k-line)', borderRadius: 12 }}>
              <QrCode value={url} size={192} />
            </div>
          ) : (
            <div
              style={{ width: 220, height: 220, display: 'grid', placeItems: 'center', background: 'var(--k-bg-2)', border: '1px dashed var(--k-line)', borderRadius: 12 }}
            >
              <button type="button" className="k-btn" disabled={mint.isPending} onClick={() => mint.mutate()}>
                {mint.isPending ? 'Generating…' : token ? 'Generate a new code' : 'Generate a code'}
              </button>
            </div>
          )}

          {/* Typed as a fallback: the phone may be across the room, or the
              camera may refuse to focus on a screen. Grouped in fours because
              that is what someone can hold between glances. */}
          {live ? (
            <div className="k-mono" style={{ marginTop: 12, fontSize: 11.5, color: 'var(--k-fg-3)', wordBreak: 'break-all', textAlign: 'center' }}>
              {groupCode(token.token)}
            </div>
          ) : null}

          <div style={{ marginTop: 4, fontSize: 11.5, color: live ? 'var(--k-fg-4)' : 'var(--k-danger)' }}>
            {live
              ? `Single-use · expires in ${fmtCountdown(left)}`
              : token
                ? 'Code expired — generate a new one.'
                : mint.isPending
                  ? 'Generating…'
                  : ' '}
          </div>

          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--k-bg-2)', borderRadius: 8, fontSize: 12, color: 'var(--k-fg-3)', lineHeight: 1.5, textAlign: 'left' }}>
            Your phone gets photo-upload access to{' '}
            <strong style={{ color: 'var(--k-fg-2)' }}>this claim only</strong> — no
            edits, no exports, no other claim. Shots land in staging like any
            other batch.
          </div>

          {notice ? (
            <p style={{ marginTop: 12, fontSize: 11.5, color: 'var(--k-fg-3)', lineHeight: 1.5, textAlign: 'left' }}>
              {notice}
            </p>
          ) : null}

          {/* Bounded is not revocable: a paired phone holds its credential for
              hours, so there has to be a way to end that. Deliberately quiet --
              it is a safety valve, not a step in the flow. */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--k-line)', width: '100%' }}>
            {confirmRevoke ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, color: 'var(--k-fg-3)' }}>
                  Sign out every paired phone?
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="k-btn k-btn--sm k-btn--ghost" onClick={() => setConfirmRevoke(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="k-btn k-btn--sm k-btn--danger"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate()}
                  >
                    Sign out
                  </button>
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="k-link"
                style={{ fontSize: 11.5 }}
                onClick={() => setConfirmRevoke(true)}
                title="Ends upload access for phones already paired to this claim"
              >
                Lost your phone? Sign out paired phones
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A real QR, drawn as one SVG path.
 *
 * `qrcode-generator` does the encoding (Reed-Solomon and masking are not worth
 * hand-rolling); this only turns its module grid into vector rects, so it stays
 * crisp at any size and needs no canvas. Error correction M -- the middle
 * setting, which tolerates a phone camera at an angle without inflating the
 * module count.
 */
function QrCode({ value, size }: { value: string; size: number }) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  const count = qr.getModuleCount()

  let path = ''
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Pairing QR code"
    >
      <path d={path} fill="#000" />
    </svg>
  )
}
