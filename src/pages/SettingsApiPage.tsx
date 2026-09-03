import SettingsShell, { NotWired } from '../components/SettingsShell'

/**
 * Screen 36 — API & webhooks.
 *
 * Nothing here exists: no key issuance, no key list, no webhook registry, no
 * secret rotation. That is a bigger gap than a missing form, because an API key
 * is a credential — issuing one needs a hashing and revocation story of the
 * kind pairing and share links already have, not a text field.
 */
export default function SettingsApiPage() {
  return (
    <SettingsShell activeId="api" title="API & webhooks" eyebrow="Developer">
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontFamily: 'var(--k-font-display)',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '-0.022em',
            margin: '4px 0 4px',
          }}
        >
          API access
        </h1>
        <p style={{ fontSize: 13, color: 'var(--k-fg-3)', margin: 0, maxWidth: 620, lineHeight: 1.55 }}>
          The API is live and every screen in this app runs on it. What does not
          exist yet is a way for you to get your own credential for it.
        </p>
      </div>

      <section className="k-set-card">
        <div className="k-set-card-hd">How the app authenticates today</div>
        <div className="k-set-card-body">
          <p style={{ fontSize: 12.5, color: 'var(--k-fg-3)', lineHeight: 1.6, margin: 0 }}>
            Every call carries your sign-in token. Two narrower credentials also
            exist, and both are already issued and revocable — a{' '}
            <strong>capture token</strong> that lets a paired phone upload
            photos to one claim and nothing else, and a{' '}
            <strong>share link</strong> that lets an insured see their own
            inventory. Neither is a general-purpose API key.
          </p>
        </div>
      </section>

      <div style={{ marginTop: 18 }}>
        <NotWired
          what="API keys and webhooks"
          detail="There is no route to issue, list, rotate or revoke a key, and none to register a webhook. This is not just a missing form: a key is a bearer credential, so it needs the same shape the capture token and share link already have — returned once, stored only as a hash, revocable, and scoped to something. Worth designing that scope (whole account? one claim? read-only?) before a key exists."
        />
      </div>
    </SettingsShell>
  )
}
