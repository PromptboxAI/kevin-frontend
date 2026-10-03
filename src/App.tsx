import { Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import ScrollToTop from './components/ScrollToTop'
import { AuthProvider } from './lib/auth'
import RootRoute from './components/RootRoute'
import PricingPage from './pages/PricingPage'
import ForAdjustersPage from './pages/ForAdjustersPage'
import PaContentsSoftwarePage from './pages/PaContentsSoftwarePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import DoneForYouPage from './pages/DoneForYouPage'
import LegalPage from './pages/LegalPage'
import BookCallPage from './pages/BookCallPage'
import RequestAccessPage from './pages/RequestAccessPage'
import CareersPage from './pages/CareersPage'
import WatchDemoPage from './pages/WatchDemoPage'
import ForEstateLiquidatorsPage from './pages/ForEstateLiquidatorsPage'
import ProductPage from './pages/ProductPage'
import RequireAdmin from './components/RequireAdmin'
import NotFoundPage from './pages/NotFoundPage'
import CapturePage from './pages/CapturePage'
import PairPage from './pages/PairPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetSentPage from './pages/ResetSentPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SampleBanner from './components/SampleBanner'
import { SAMPLE_CLAIM_ID } from './lib/worksheet-preview'
import Seo from './components/Seo'
import { lazyRoute } from './lib/lazy-route'

/**
 * The signed-in product, the docs and the insured's portal load on demand.
 *
 * They were all in the one bundle, so a visitor reading the pricing page
 * downloaded and parsed the worksheet, staging, settings, the admin console
 * and 45 docs articles first. Everything a marketing visitor can reach in one
 * click stays in the main chunk and is imported above as before: the marketing
 * pages, sign-in and sign-up.
 *
 * /pair and /capture stay eager on purpose. public/sw.js caches the capture
 * shell's assets as they are requested so the phone can reload with no signal;
 * a chunk of its own would be one more file that has to have been fetched
 * before the basement.
 *
 * lazyRoute, not React.lazy — see lib/lazy-route.ts for the stale-tab case.
 */
const BillingPage = lazyRoute(() => import('./pages/BillingPage'))
const DocsPage = lazyRoute(() => import('./pages/DocsPage'))
const LandingFullPage = lazyRoute(() => import('./pages/LandingFullPage'))
const ClaimsPage = lazyRoute(() => import('./pages/ClaimsPage'))
const AdminSystemPage = lazyRoute(() => import('./pages/AdminSystemPage'))
const AdminPlatformPage = lazyRoute(() => import('./pages/AdminPlatformPage'))
const ExportsPage = lazyRoute(() => import('./pages/ExportsPage'))
const ExportPage = lazyRoute(() => import('./pages/ExportPage'))
const IntakePage = lazyRoute(() => import('./pages/IntakePage'))
const AddPhotosPage = lazyRoute(() => import('./pages/AddPhotosPage'))
const StagingPage = lazyRoute(() => import('./pages/StagingPage'))
const ProcessingPage = lazyRoute(() => import('./pages/ProcessingPage'))
const ImportPage = lazyRoute(() => import('./pages/ImportPage'))
const OverviewPage = lazyRoute(() => import('./pages/OverviewPage'))
const AuditPage = lazyRoute(() => import('./pages/AuditPage'))
const PhotosPage = lazyRoute(() => import('./pages/PhotosPage'))
const PortalPage = lazyRoute(() => import('./pages/PortalPage'))
const PortalReturnPage = lazyRoute(() => import('./pages/PortalReturnPage'))
const RecoveryPage = lazyRoute(() => import('./pages/RecoveryPage'))
const SettingsBusinessPage = lazyRoute(() => import('./pages/SettingsBusinessPage'))
const SettingsXactimatePage = lazyRoute(() => import('./pages/SettingsXactimatePage'))
const SettingsPricingPage = lazyRoute(() => import('./pages/SettingsPricingPage'))
const SettingsProfilePage = lazyRoute(() => import('./pages/SettingsProfilePage'))
const SettingsSecurityPage = lazyRoute(() => import('./pages/SettingsSecurityPage'))
const WorksheetPage = lazyRoute(() => import('./pages/WorksheetPage'))

/**
 * The one claim id that is public. Backed by a real, owner-scoped row on the
 * API — `GET /v1/claims/sample` answers without a bearer token, and every
 * other id still 401s. It lived in lib/sample.ts alongside the bundled
 * fixture; that fixture is gone and this is a route concern, not data.
 *
 * IMPORTED, not redeclared. This route gate and the worksheet's preview path
 * must agree on the same string: if they drift, the route still matches and
 * pricing quietly stops working (or the reverse), with nothing failing to say
 * so. lib/ owns it because lib/mutations.ts imports it too and importing from
 * App.tsx would be circular.
 */

function ClaimRoute() {
  const { claimId = '' } = useParams()
  if (claimId === SAMPLE_CLAIM_ID) {
    return (
      <>
        {/* The sample is a public marketing surface reached from every "Open
            sample claim" CTA, but nothing here declared a head, so it served
            the landing page's title and a canonical pointing at the homepage.
            Declared on the route rather than inside WorksheetPage, which is
            shared with real claims and must stay signed-in-only. */}
        <Seo path="/claims/sample" />
        <SampleBanner />
        <div className="k-sample-frame">
          <WorksheetPage />
        </div>
      </>
    )
  }
  return (
    <RequireAuth>
      <WorksheetPage />
    </RequireAuth>
  )
}

export default function App() {
  return (
    // The boundary the split routes suspend to. No fallback UI: React Router
    // navigates inside a transition, so the page being left stays up until the
    // next one's chunk has arrived, and on a cold load straight onto a split
    // route the screen is blank before the bundle runs anyway.
    //
    // OUTSIDE AuthProvider, and it has to stay there. React hydrates a
    // prerendered page in two steps: everything above a Suspense boundary
    // first, the boundary's contents a tick later. With AuthProvider above the
    // boundary its effect ran in between and resolved `loading`, so the nav
    // hydrated as "signed out" against markup rendered as "still checking" —
    // a mismatch on every marketing page, which makes React discard the
    // prerendered HTML and build the page again. Nothing above this line may
    // change state on mount, for the same reason.
    //
    // (Not re-indented: this file is shared, and 300 lines of whitespace would
    // bury every other session's diff.)
    <Suspense fallback={null}>
    <AuthProvider>
      {/* A SPA keeps the scroll offset across a route change, so a footer link
          opened the next page halfway down. */}
      <ScrollToTop />
      <Routes>
        {/* PUBLIC. `/` is the marketing site for visitors and a redirect to
            the app for anyone signed in -- ad traffic must not land on a
            sign-in bounce. RootRoute waits for the auth check before choosing,
            so a signed-in user never sees the landing page flash first. */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/for-adjusters" element={<ForAdjustersPage />} />
        <Route
          path="/public-adjusters/ai-contents-inventory-software"
          element={<PaContentsSoftwarePage />}
        />
        <Route path="/for-estate-liquidators" element={<ForEstateLiquidatorsPage />} />
        <Route path="/done-for-you" element={<DoneForYouPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/book-call" element={<BookCallPage />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        {/* One URL per article: 45 articles at a single /docs would index as
            one page and break every deep link. /docs sends you to the first. */}
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:slug" element={<DocsPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/demo" element={<WatchDemoPage />} />
        <Route path="/legal" element={<LegalPage />} />
        {/* The footer's "Security" link. Same document, Security tab preselected. */}
        <Route path="/security" element={<LegalPage initialTab="security" />} />
        {/* The long-form homepage, preserved whole and deliberately unlinked.
            Not in the nav, noindex, reachable only by typing the path. See the
            header of LandingFullPage.tsx. */}
        <Route path="/landing-full" element={<LandingFullPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* The password-reset flow, screens 45 / 46 / 47. Public by necessity:
            somebody who cannot sign in is the entire audience. `/reset-password`
            is where Supabase's emailed recovery link lands -- it mints a session
            on arrival, which is what lets updateUser set the password there. */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-sent" element={<ResetSentPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* SCREEN 48 -- the public sample claim. `/sample` redirects onto the
            claim route below, which decides its own gate from the param. */}
        <Route path="/sample" element={<Navigate to="/claims/sample" replace />} />

        {/* Public, token-scoped. The backend mints these links as
            <SHARE_BASE_URL>/p/<token> -- this route is why they resolve.
            Deliberately outside RequireAuth: the insured has no account. */}
        {/* Stripe's return, WITHOUT the share token (backend 7965a71). The
            browser restores its own link from sessionStorage. Declared before
            the token route so "return" is never read as a token. */}
        <Route path="/p/return" element={<PortalReturnPage />} />
        <Route path="/p/:token" element={<PortalPage />} />

        {/* The phone. PUBLIC on purpose: it has no account, and requiring one
            is the friction the pairing flow exists to remove. The capture
            credential is upload-only and scoped to a single claim. */}
        <Route path="/pair" element={<PairPage />} />
        <Route path="/capture" element={<CapturePage />} />

        <Route
          path="/claims"
          element={
            <RequireAuth>
              <ClaimsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/new"
          element={
            <RequireAuth>
              <IntakePage />
            </RequireAuth>
          }
        />

        {/* More photos for an existing claim -- a second drop appends. */}
        <Route
          path="/claims/:claimId/add-photos"
          element={
            <RequireAuth>
              <AddPhotosPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/staging"
          element={
            <RequireAuth>
              <StagingPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/processing"
          element={
            <RequireAuth>
              <ProcessingPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/import"
          element={
            <RequireAuth>
              <ImportPage />
            </RequireAuth>
          }
        />

        <Route
          path="/exports"
          element={
            <RequireAuth>
              <ExportsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/recovery"
          element={
            <RequireAuth>
              <RecoveryPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/overview"
          element={
            <RequireAuth>
              <OverviewPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/photos"
          element={
            <RequireAuth>
              <PhotosPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/audit"
          element={
            <RequireAuth>
              <AuditPage />
            </RequireAuth>
          }
        />

        <Route
          path="/claims/:claimId/export"
          element={
            <RequireAuth>
              <ExportPage />
            </RequireAuth>
          }
        />

        {/* ONE route, which decides its own gate from the param.
            `/claims/sample` is the public marketing demo (screen 48) and must
            NOT sit behind RequireAuth; every other claim must. Splitting them
            into two <Route>s does not work -- a static "/claims/sample" path
            supplies no params, and WorksheetPage reads claimId from useParams,
            so it would mount with an empty id and render an empty claim.

            WorksheetPage itself is untouched, and there is no longer anything
            intercepting its requests: the sample reads the live API like any
            other claim. */}
        <Route path="/claims/:claimId" element={<ClaimRoute />} />

        {/* Settings. `/settings/billing` is owned elsewhere and untouched
            here; the five screens below are the ones with no existing file.
            Carrier profiles (10) and Pricing (14) are still unbuilt and render
            as disabled rows in the sidebar rather than dead links. */}
        <Route
          path="/settings"
          element={<Navigate to="/settings/profile" replace />}
        />
        <Route
          path="/settings/profile"
          element={
            <RequireAuth>
              <SettingsProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/security"
          element={
            <RequireAuth>
              <SettingsSecurityPage />
            </RequireAuth>
          }
        />

        <Route
          path="/settings/business"
          element={
            <RequireAuth>
              <SettingsBusinessPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/pricing"
          element={
            <RequireAuth>
              <SettingsPricingPage />
            </RequireAuth>
          }
        />

        {/* Export defaults is GONE (owner, 2026-09-20): the adjuster picks
            format, contents and photo layout at export time, so a screen of
            defaults was a second place to set the same thing -- and nothing
            stored them anyway. The route redirects so an old link or bookmark
            still lands somewhere. */}
        <Route path="/settings/export" element={<Navigate to="/settings/profile" replace />} />
        <Route
          path="/settings/xactimate"
          element={
            <RequireAuth>
              <SettingsXactimatePage />
            </RequireAuth>
          }
        />
        {/* API & webhooks is not offered yet (owner, 2026-09-20). The page is
            kept (SettingsApiPage); this redirects so a bookmark cannot reach a
            surface we are not selling. Restore the element and clear `off` on
            the nav item to bring it back. */}
        <Route path="/settings/api" element={<Navigate to="/settings/profile" replace />} />
        {/* Carrier profiles is not offered in beta. The screen is built and
            kept (SettingsCarriersPage) -- this route redirects so a bookmark or
            an old link cannot reach a feature we are not selling yet. Restore
            the element and clear `off` on the nav item to bring it back. */}
        <Route path="/settings/carriers" element={<Navigate to="/settings/profile" replace />} />
        <Route
          path="/settings/billing"
          element={
            <RequireAuth>
              <BillingPage />
            </RequireAuth>
          }
        />

        {/* The back office. Staff-only, separate chrome, and 404 for anyone
            without the admin role -- the backend gates the data regardless. */}
        <Route
          path="/admin/system"
          element={
            <RequireAdmin>
              <AdminSystemPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/platform"
          element={
            <RequireAdmin>
              <AdminPlatformPage />
            </RequireAdmin>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/system" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
    </Suspense>
  )
}
