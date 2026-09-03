import LandingPage from '../pages/LandingPage'

/**
 * What `/` serves: the marketing site, to everyone.
 *
 * It used to redirect signed-in users to /claims, which made the marketing
 * page unreachable for anyone with an account -- including the people who need
 * to review it while ads are running. Now the page is always the page, and the
 * nav swaps "Sign in" for "Go to app" when there is a session, so a signed-in
 * visitor is one click from their claims instead of being bounced.
 *
 * Kept as its own component rather than pointing the route straight at
 * LandingPage: `/` is the surface most likely to grow conditional behaviour
 * (campaign params, a logged-in banner), and this is where that belongs.
 */
export default function RootRoute() {
  return <LandingPage />
}
