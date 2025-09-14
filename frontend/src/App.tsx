import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom'
import { Toaster } from 'sonner'

// Import organized route components
import { ROUTES } from '@/routes'
import { AuthRoutes } from '@/routes/AuthRoutes'
import { DashboardRoutes } from '@/routes/DashboardRoutes'
import { ManagementRoutes } from '@/routes/ManagementRoutes'
import { ReportsRoutes } from '@/routes/ReportsRoutes'
import { SettingsRoutes } from '@/routes/SettingsRoutes'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="attendance-portal-theme">
      <AuthProvider>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            {/* Authentication Routes */}
            {AuthRoutes()}

            {/* Dashboard Routes */}
            {DashboardRoutes()}

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
