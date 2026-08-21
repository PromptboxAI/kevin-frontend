import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

/** Gate for authenticated surfaces. The portal route deliberately sits outside it. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  // Without this the first paint bounces a signed-in user to /sign-in.
  if (loading) return <main className="k-portal" />

  if (!session) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />

  return <>{children}</>
}
