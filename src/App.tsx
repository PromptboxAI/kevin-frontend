import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './lib/auth'
import BillingPage from './pages/BillingPage'
import ClaimsPage from './pages/ClaimsPage'
import IntakePage from './pages/IntakePage'
import StagingPage from './pages/StagingPage'
import ProcessingPage from './pages/ProcessingPage'
import ImportPage from './pages/ImportPage'
import NotFoundPage from './pages/NotFoundPage'
import PortalPage from './pages/PortalPage'
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
