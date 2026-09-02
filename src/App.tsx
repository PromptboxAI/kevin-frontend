import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './lib/auth'
import BillingPage from './pages/BillingPage'
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
import SignInPage from './pages/SignInPage'
import WorksheetPage from './pages/WorksheetPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/claims" replace />} />
        <Route path="/sign-in" element={<SignInPage />} />

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

        {/* Settings. Only Billing is built so far; the rest of the sidebar
            renders inert rather than routing nowhere. */}
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
