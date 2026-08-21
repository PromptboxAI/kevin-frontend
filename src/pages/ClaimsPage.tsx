import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

/** GET /v1/me -- derived from the JWT, no DB hit. */
type MeResponse = {
  id: string
  email: string | null
  roles: string[]
  is_admin: boolean
}

export default function ClaimsPage() {
  const { signOut } = useAuth()

  const { data, error, isPending } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
  })

  return (
    <main className="k-portal">
      <div className="k-portal-card">
        <p className="k-portal-brand">
          Kevin<span>.</span>
        </p>
        <h1>Signed in</h1>

        {isPending ? <p>Checking your identity with the backend…</p> : null}

        {error ? (
          <p className="k-error">
            The backend rejected the session: {error instanceof Error ? error.message : 'unknown'}
          </p>
        ) : null}

        {data ? (
          <>
            <p>
              The Supabase JWT was accepted by <code>GET /v1/me</code>. Auth works end to end.
            </p>
            <dl className="k-meta">
              <dt>Email</dt>
              <dd>{data.email ?? '—'}</dd>
              <dt>User id</dt>
              <dd className="k-portal-ref">{data.id}</dd>
              <dt>Roles</dt>
              <dd>{data.roles.length ? data.roles.join(', ') : '—'}</dd>
              <dt>Admin</dt>
              <dd>{data.is_admin ? 'yes' : 'no'}</dd>
            </dl>
          </>
        ) : null}

        <button type="button" className="k-btn k-btn--ghost" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </main>
  )
}
