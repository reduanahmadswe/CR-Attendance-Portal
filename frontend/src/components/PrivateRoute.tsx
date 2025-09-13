import { useAuth } from '@/context/AuthContext'
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
    return <Navigate to="/login" replace />
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
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log(
      '[PRIVATE ROUTE] Role mismatch. User role:',
      user?.role,
      'Required:',
      requiredRole
    )
    // Redirect based on user role
    if (user?.role === 'admin') {
      console.log('[PRIVATE ROUTE] Redirecting admin to /admin')
      return <Navigate to="/admin" replace />
    } else if (user?.role === 'cr') {
      console.log('[PRIVATE ROUTE] Redirecting CR to /cr-dashboard')
      return <Navigate to="/cr-dashboard" replace />
    } else {
      console.log(
        '[PRIVATE ROUTE] Redirecting other user to /attendance-history'
      )
      return <Navigate to="/attendance-history" replace />
    }
  }

  console.log('[PRIVATE ROUTE] All checks passed, rendering children')
  return <>{children}</>
}
