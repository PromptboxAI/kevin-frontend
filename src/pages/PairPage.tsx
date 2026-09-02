import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { I, Icon } from '../components/Icon'
import { ApiError } from '../lib/api'
import { saveCredential } from '../lib/capture'
import { redeemPair } from '../lib/pairing'
import { PAIR_FAILURE_COPY, normaliseCode, tokenFromLocation } from '../lib/pair-rules'
import type { PairFailure } from '../lib/pair-rules'

/**
 * The phone lands here from the QR.
 *
 * PUBLIC — outside RequireAuth, deliberately. The phone has no account, and
 * requiring one is the friction this whole flow exists to remove. The code IS
 * the credential.
 *
 * Ported in spirit from `design/components/mobile-auth.jsx` (screens 26/27),
 * but not its markup: that artboard draws a phone — a fake status bar, a fake
 * clock, a battery — because it sits on a design canvas. A real page runs
 * inside the phone's own browser chrome, and drawing a second one on top would
 * be a mockup of a phone rendered on a phone.
 */
export default function PairPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [failure, setFailure] = useState<PairFailure | null>(null)
  const [busy, setBusy] = useState(false)

  const redeem = async (raw: string) => {
    const token = normaliseCode(raw)
    if (!token) return
    setBusy(true)
    setFailure(null)
    try {
      const cred = await redeemPair(token)
      saveCredential(cred)
      /**
       * Drop the token out of the URL before going anywhere.
       *
       * It is burned server-side the moment it is redeemed, but leaving it in
       * the address bar means it survives in history and in whatever the phone
       * syncs, for a value that is a credential in shape if not in life.
       */
      window.history.replaceState(null, '', '/pair')
      navigate('/capture', { replace: true })
    } catch (error) {
      setFailure(
        error instanceof ApiError
          ? error.status === 401
            ? 'invalid'
            : error.status === 429
              ? 'rate_limited'
              : 'unknown'
          : 'offline',
      )
    } finally {
      setBusy(false)
    }
  }

  /**
   * Auto-redeem what the QR carried.
   *
   * The token is in the FRAGMENT, so it never reached a server log on the way
   * here. Runs once: a re-run would spend a burned token and show a failure for
   * a scan that actually worked.
   */
  const tried = useRef(false)
  useEffect(() => {
    if (tried.current) return
    tried.current = true
    const token = tokenFromLocation(window.location.hash, window.location.search)
    if (token) void redeem(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="k-cap-shell">
      <div className="k-cap-pair">
        <div className="k-cap-brand">
          Kevin<span>.</span>
        </div>

        <h1 className="k-cap-h1">Add photos to a claim</h1>
        <p className="k-cap-sub">
          Scan the code on the computer, or type it below. Your phone gets photo
          upload for that one claim — nothing else.
        </p>

        {busy ? (
          <p className="k-cap-status">Pairing…</p>
        ) : (
          <>
            <label className="k-cap-label" htmlFor="pair-code">
              Pairing code
            </label>
            <input
              id="pair-code"
              className="k-cap-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 5CW1 TaH2 P36…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void redeem(code)
              }}
            />
            <button
              type="button"
              className="k-cap-primary"
              disabled={!normaliseCode(code)}
              onClick={() => void redeem(code)}
            >
              Pair this phone
            </button>
          </>
        )}

        {failure ? (
          <div className="k-cap-alert">
            <Icon d={I.info} size={14} />
            <span>{PAIR_FAILURE_COPY[failure]}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
