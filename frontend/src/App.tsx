import { PrivateRoute } from '@/components/PrivateRoute'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import AdminDashboard from '@/pages/AdminDashboard'
import { AttendanceHistory } from '@/pages/AttendanceHistory'
import { CRDashboard } from '@/pages/CRDashboard'
import { Login } from '@/pages/Login'
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom'
import { Toaster } from 'sonner'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="attendance-portal-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/cr-dashboard"
              element={
                <PrivateRoute requiredRole="cr">
                  <CRDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/attendance-history"
              element={
                <PrivateRoute>
                  <AttendanceHistory />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
