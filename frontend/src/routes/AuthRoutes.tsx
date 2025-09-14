import { Login } from '@/pages/Login'
import { Navigate, Route } from 'react-router-dom'
import { ROUTES } from './index'

// Authentication routes
export const AuthRoutes = () => (
  <>
    {/* Main Authentication Routes */}
    <Route path={ROUTES.AUTH.LOGIN} element={<Login />} />

    {/* Legacy Authentication Redirects */}
    <Route
      path={ROUTES.LEGACY.LOGIN}
      element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
    />
  </>
)
