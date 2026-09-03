import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './lib/auth'
import BillingPage from './pages/BillingPage'
import RootRoute from './components/RootRoute'
import PricingPage from './pages/PricingPage'
import ForAdjustersPage from './pages/ForAdjustersPage'
import ProductPage from './pages/ProductPage'
import ClaimsPage from './pages/ClaimsPage'
import ExportsPage from './pages/ExportsPage'
import IntakePage from './pages/IntakePage'
import StagingPage from './pages/StagingPage'
import ProcessingPage from './pages/ProcessingPage'
import ImportPage from './pages/ImportPage'
import NotFoundPage from './pages/NotFoundPage'
import OverviewPage from './pages/OverviewPage'
import PhotosPage from './pages/PhotosPage'
import CapturePage from './pages/CapturePage'
import PairPage from './pages/PairPage'
import PortalPage from './pages/PortalPage'
import RecoveryPage from './pages/RecoveryPage'
import SettingsApiPage from './pages/SettingsApiPage'
import SettingsBusinessPage from './pages/SettingsBusinessPage'
import SettingsExportPage from './pages/SettingsExportPage'
import SettingsXactimatePage from './pages/SettingsXactimatePage'
import SettingsPricingPage from './pages/SettingsPricingPage'
import SettingsProfilePage from './pages/SettingsProfilePage'
import SettingsSecurityPage from './pages/SettingsSecurityPage'
import SignInPage from './pages/SignInPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetSentPage from './pages/ResetSentPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import WorksheetPage from './pages/WorksheetPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC. `/` is the marketing site for visitors and a redirect to
            the app for anyone signed in -- ad traffic must not land on a
            sign-in bounce. RootRoute waits for the auth check before choosing,
            so a signed-in user never sees the landing page flash first. */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/for-adjusters" element={<ForAdjustersPage />} />
        <Route path="/sign-in" element={<SignInPage />} />

        {/* The password-reset flow, screens 45 / 46 / 47. Public by necessity:
            somebody who cannot sign in is the entire audience. `/reset-password`
            is where Supabase's emailed recovery link lands -- it mints a session
            on arrival, which is what lets updateUser set the password there. */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-sent" element={<ResetSentPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public, token-scoped. The backend mints these links as
            <SHARE_BASE_URL>/p/<token> -- this route is why they resolve.
            Deliberately outside RequireAuth: the insured has no account. */}
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
          path="/claims/:claimId"
          element={
            <RequireAuth>
              <WorksheetPage />
            </RequireAuth>
          }
        />

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

        <Route
          path="/settings/export"
          element={
            <RequireAuth>
              <SettingsExportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/xactimate"
          element={
            <RequireAuth>
              <SettingsXactimatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/api"
          element={
            <RequireAuth>
              <SettingsApiPage />
            </RequireAuth>
          }
        />
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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
