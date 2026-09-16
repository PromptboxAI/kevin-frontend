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

      <main className="k-return-main">
        {decision.kind === 'open' ? (
          <p style={{ fontSize: 13.5, color: 'var(--k-fg-3)' }}>Returning to your inventory…</p>
        ) : (
          /* The system's empty-state anatomy (k-empty), not a bespoke card: this
             screen is rare, and a stranger meeting it after paying should read
             the same design language as everything else. The reassurances are a
             list because each answers a different fear -- did it work, does it
             expire, must I do something. */
          <div className="k-empty">
            <div className={`k-empty-art ${paid ? 'k-empty-art--accent' : ''}`}>
              <Icon d={paid ? I.check : I.info} size={26} />
            </div>
            <h1 className="k-empty-t" style={{ fontSize: 26 }}>
              {paid ? 'Payment received' : 'Payment cancelled'}
            </h1>
            <p className="k-empty-s">
              {paid
                ? 'Your inventory is unlocked. Open the link your adjuster sent you and everything will be there.'
                : 'Nothing was charged. Open the link your adjuster sent you whenever you want to try again.'}
            </p>

            <ul className="k-return-facts">
              {(paid
                ? [
                    [I.lock, 'Unlocked for good — it does not expire when this tab closes.'],
                    [I.link, 'Works on any device: the unlock lives on your link, not in this browser.'],
                    [I.check, 'Nothing else is needed from you.'],
                  ]
                : [
                    [I.check, 'No charge — your card was not billed.'],
                    [I.link, 'Your link still works, exactly as you left it.'],
                  ]
              ).map(([icon, text]) => (
                <li className="k-return-fact" key={String(text)}>
                  <Icon d={icon as string} size={14} />
                  <span>{text as string}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
