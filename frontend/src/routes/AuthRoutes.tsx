import { ForgotPassword } from '@/pages/ForgotPassword'
import { Login } from '@/pages/Login'
import { ResetPassword } from '@/pages/ResetPassword'
import { Navigate, Route } from 'react-router-dom'
import { ROUTES } from './index'

// Authentication routes
export const AuthRoutes = () => (
  <>
    {/* Main Authentication Routes */}
    <Route path={ROUTES.AUTH.LOGIN} element={<Login />} />
    <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPassword />} />
    <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPassword />} />

    {/* Legacy Authentication Redirects */}
    <Route
      path={ROUTES.LEGACY.LOGIN}
      element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
    />
  </>
)
