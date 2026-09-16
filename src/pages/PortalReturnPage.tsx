import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, I } from '../components/Icon'
import { decideReturn } from '../lib/portal-return-rules'
import { recallShareToken } from '../lib/portal'

/**
 * Where Stripe sends the client back — `/p/return?status=complete|cancelled`.
 *
 * The URL deliberately carries NO share token (backend 7965a71): it is a
 * bearer credential for the whole claim, and it used to end up in Stripe's
 * session record. The token the page stashed before the redirect is read back
 * here and the browser returns to its own link.
 *
 * `status` is a hint, nothing more. The share page does the deciding: it polls
 * `GET /p/{token}` until `paid` flips, because the webhook races this redirect.
 *
 * With no stored token — a new tab, cleared storage, a different device — this
 * is NOT an error: the payment is on the share, so it says so and sends them
 * back to the link they were emailed.
 */
export default function PortalReturnPage() {
  const navigate = useNavigate()
  const decision = decideReturn(
    recallShareToken(),
    new URLSearchParams(window.location.search).get('status'),
  )

  useEffect(() => {
    if (decision.kind !== 'open') return
    // replace: the Stripe return must not sit in history behind the share.
    navigate(decision.path, { replace: true })
  }, [decision, navigate])

  const paid = decision.kind !== 'cancelled-elsewhere'

  return (
    <div className="k-landing" style={{ minHeight: '100vh', background: 'var(--k-bg-2)' }}>
      <header className="k-topbar" style={{ background: 'var(--k-bg)' }}>
        <span className="k-wordmark">
          Kevin<span>.</span>
        </span>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
        {decision.kind === 'open' ? (
          <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)' }}>Returning to your inventory…</p>
        ) : (
          <div
            style={{
              background: 'var(--k-bg)',
              border: '1px solid var(--k-line)',
              borderRadius: 12,
              padding: '26px 28px',
            }}
          >
            <Icon d={paid ? I.check : I.info} size={20} />
            <h1 style={{ fontFamily: 'var(--k-font-display)', fontWeight: 400, fontSize: 24, margin: '10px 0 6px' }}>
              {paid ? 'Payment received' : 'Payment cancelled'}
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)', lineHeight: 1.55, margin: 0 }}>
              {paid ? (
                <>
                  Reopen the link your adjuster sent you and your full inventory will be there. The
                  unlock lives on that link, not in this browser, so it works on any device.
                </>
              ) : (
                <>
                  Nothing was charged. Reopen the link your adjuster sent you whenever you want to
                  try again.
                </>
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
