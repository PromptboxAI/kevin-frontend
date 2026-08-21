import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import PortalPage from './pages/PortalPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Public, token-scoped. The backend mints these links as
          <SHARE_BASE_URL>/p/<token> -- this route is why they resolve. */}
      <Route path="/p/:token" element={<PortalPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
