import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect } from 'react'

// Import organized route components
import { ROUTES } from '@/routes'
import { AuthRoutes } from '@/routes/AuthRoutes'
import { DashboardRoutes } from '@/routes/DashboardRoutes'
import { ManagementRoutes } from '@/routes/ManagementRoutes'
import { ReportsRoutes } from '@/routes/ReportsRoutes'
import { SettingsRoutes } from '@/routes/SettingsRoutes'
import { AnnouncementsRoutes } from '@/routes/AnnouncementsRoutes'

// Component to handle 404.html redirects from Render
function RedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have a redirect parameter from 404.html
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    
    if (redirect) {
      // Remove the redirect parameter and navigate to the intended path
      const cleanPath = redirect.split('?')[0]
      navigate(cleanPath, { replace: true })
    }
  }, [navigate])

  return null
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="attendance-portal-theme">
      <AuthProvider>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <RedirectHandler />
          <Routes>
            {/* Authentication Routes */}
            {AuthRoutes()}

            {/* Dashboard Routes */}
            {DashboardRoutes()}

            {/* Announcements Routes */}
            {AnnouncementsRoutes()}

            {/* Reports Routes */}
            {ReportsRoutes()}

            {/* Management Routes (Future) */}
            {ManagementRoutes()}

            {/* Settings Routes (Future) */}
            {SettingsRoutes()}

            {/* Default Route - Redirect to login */}
            <Route
              path="/"
              element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
            />

            {/* 404 Route - Redirect to login for now */}
            <Route
              path="*"
              element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
            />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
