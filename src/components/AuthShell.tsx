import KevinWordmark from './KevinWordmark'

/**
 * The two-pane auth frame — form left, navy panel right. Ported from
 * `AuthShell` in `design/components/auth-flow.jsx`.
 *
 * The sign-in screen (00) inlines its own copy of this in the design, with its
 * own quote and its own two figures; it stays inlined here for the same reason,
 * since its right panel differs in content from the reset screens'.
 *
 * Rule 7: no SOC 2 claim, and no security boilerplate on this panel at all.
 * The cipher names, the plain-language rewrite and the protocol were each
 * tried here and each said nothing to an adjuster signing in. That detail
 * lives on /security, where a reader has gone looking for it.
 */

export type AuthQuote = { text: string; who: string }

export default function AuthShell({
  children,
  quote = null,
  stats = true,
}: {
  children: React.ReactNode
  quote?: AuthQuote | null
  stats?: boolean
}) {
  return (
    <div className="k-auth">
      <div className="k-auth-l">
        <div style={{ padding: '24px 32px' }}>
          <KevinWordmark size={18} suffix={true} to="/" />
        </div>
        <div className="k-auth-l-body">{children}</div>
        {/* No security boilerplate. The cipher names went first, then the
            plain-language version, then the protocol -- all of it said nothing
            to an adjuster signing in. The real detail is on /security. */}
        <div className="k-auth-l-foot">
          <span>© 2026</span>
        </div>
      </div>

      <div className="k-auth-r">
        <div className="k-auth-r-inner">
          {quote ? (
            <>
              <div
                style={{
                  fontFamily: 'var(--k-font-display)',
                  fontStyle: 'italic',
                  fontSize: 26,
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.25,
                  maxWidth: 380,
                  textWrap: 'balance',
                }}
              >
                &ldquo;{quote.text}&rdquo;
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 12.5,
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'var(--k-font-mono)',
                }}
              >
                {quote.who}
              </div>
            </>
          ) : null}

          {stats ? (
            <div
              style={{
                marginTop: quote ? 60 : 80,
                display: 'flex',
                gap: 32,
                fontFamily: 'var(--k-font-mono)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {[
                ['Encrypted', 'In transit and at rest'],
                ['Yours', 'Deleted when you say so'],
              ].map(([figure, label]) => (
                <div key={figure}>
                  <div
                    style={{
                      fontSize: 36,
                      color: 'rgba(255,255,255,0.95)',
                      fontFamily: 'var(--k-font-display)',
                      fontStyle: 'italic',
                      textTransform: 'none',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {figure}
                  </div>
                  <div style={{ marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
