import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import LandingPage from '../pages/LandingPage'

/**
 * What `/` serves.
 *
 * Visitors get the marketing site; anyone already signed in goes straight to
 * their claims. `/` used to redirect to /claims unconditionally, which meant
 * every unauthenticated visitor -- including paid ad traffic -- landed on a
 * sign-in bounce instead of the site.
 *
 * The `loading` guard matters: without it the first paint shows the landing
 * page to a signed-in user for a frame before the session resolves, which
 * reads as being logged out. RequireAuth takes the same precaution in the
 * other direction.
 */
export default function RootRoute() {
  const { session, loading } = useAuth()

  // Same neutral placeholder RequireAuth uses, so the two never disagree.
  if (loading) return <main className="k-portal" />

  return session ? <Navigate to="/claims" replace /> : <LandingPage />
}
