import { useAuth } from '@/context/AuthContext'
import {
  ROUTES,
  canAccessRoute,
  getDashboardRoute,
  getRouteDisplayName,
} from '@/routes'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface PrivateRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'cr' | 'instructor' | 'viewer'
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const auth = useAuth()

  console.log('[PRIVATE ROUTE] Auth object:', auth)
  console.log('[PRIVATE ROUTE] Required role:', requiredRole)

  if (!auth) {
    console.log('[PRIVATE ROUTE] No auth context, redirecting to login')
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  const { user, isLoading, isAuthenticated } = auth

  console.log('[PRIVATE ROUTE] User:', user)
  console.log('[PRIVATE ROUTE] Is loading:', isLoading)
  console.log('[PRIVATE ROUTE] Is authenticated:', isAuthenticated)

  if (isLoading) {
    console.log('[PRIVATE ROUTE] Still loading, showing spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('[PRIVATE ROUTE] Not authenticated, redirecting to login')
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    const currentPath = window.location.pathname
    const routeName = getRouteDisplayName(currentPath)

    console.log(
      '[PRIVATE ROUTE] Role mismatch for route:',
      routeName,
      '- User role:',
      user?.role,
      'Required:',
      requiredRole
    )

    // Check if user can access current route with their role
    if (!canAccessRoute(user?.role || '', currentPath)) {
      const userDashboardRoute = getDashboardRoute(user?.role || '')
      console.log(
        `[PRIVATE ROUTE] Redirecting ${user?.role} from ${routeName} to ${userDashboardRoute}`
      )
      return <Navigate to={userDashboardRoute} replace />
    }
  }

  console.log('[PRIVATE ROUTE] All checks passed, rendering children')
  return <>{children}</>
}
