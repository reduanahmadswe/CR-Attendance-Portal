import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface PrivateRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'cr' | 'instructor' | 'viewer'
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (user?.role === 'cr') {
      return <Navigate to="/cr" replace />
    } else {
      return <Navigate to="/attendance" replace />
    }
  }

  return <>{children}</>
}
