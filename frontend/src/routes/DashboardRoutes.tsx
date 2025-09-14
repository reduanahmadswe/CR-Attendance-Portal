import { PrivateRoute } from '@/components/PrivateRoute'
import AdminDashboard from '@/pages/AdminDashboard'
import { CRDashboard } from '@/pages/CRDashboard'
import { Navigate, Route } from 'react-router-dom'
import { ROUTES } from './index'

// Dashboard routes for different user roles
export const DashboardRoutes = () => (
  <>
    {/* Admin Dashboard */}
    <Route
      path={ROUTES.DASHBOARD.ADMIN}
      element={
        <PrivateRoute requiredRole="admin">
          <AdminDashboard />
        </PrivateRoute>
      }
    />

    {/* Class Representative Dashboard */}
    <Route
      path={ROUTES.DASHBOARD.CR}
      element={
        <PrivateRoute requiredRole="cr">
          <CRDashboard />
        </PrivateRoute>
      }
    />

    {/* Legacy Dashboard Redirects */}
    <Route
      path={ROUTES.LEGACY.ADMIN}
      element={<Navigate to={ROUTES.DASHBOARD.ADMIN} replace />}
    />
    <Route
      path={ROUTES.LEGACY.ADMIN_DASHBOARD}
      element={<Navigate to={ROUTES.DASHBOARD.ADMIN} replace />}
    />
    <Route
      path={ROUTES.LEGACY.CR}
      element={<Navigate to={ROUTES.DASHBOARD.CR} replace />}
    />
    <Route
      path={ROUTES.LEGACY.CR_DASHBOARD}
      element={<Navigate to={ROUTES.DASHBOARD.CR} replace />}
    />
  </>
)
