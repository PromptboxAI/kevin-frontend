import { useQuery } from '@tanstack/react-query'
import RequireAuth from './RequireAuth'
import NotFoundPage from '../pages/NotFoundPage'
import { api } from '../lib/api'
import type { MeResponse } from '../lib/types'

/**
 * The back office's gate. Staff-only, and the REAL gate is the backend's:
 * every admin route 403s without `role: "admin"` in the JWT. This only decides
 * whether to draw the screen.
 *
 * A non-admin gets the 404, not a "you are not allowed" page: an admin surface
 * should not announce itself to an account that has no business there.
 */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminOnly>{children}</AdminOnly>
    </RequireAuth>
  )
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/v1/me'),
    staleTime: 60_000,
  })

  // Nothing while the answer is unknown: flashing a 404 at an admin mid-load
  // reads as the console having been taken away.
  if (me.isPending) return null
  if (!me.data?.is_admin) return <NotFoundPage />
  return <>{children}</>
}
