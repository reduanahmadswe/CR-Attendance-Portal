import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLoginMutation } from '@/lib/apiSlice'
import { setCredentials, type RootState } from '@/lib/simpleStore'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [login, { isLoading }] = useLoginMutation()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await login({ email, password }).unwrap()
      if (result.success && result.data) {
        dispatch(
          setCredentials({
            user: result.data.user,
            accessToken: result.data.accessToken,
          })
        )

        toast.success('Login successful!')

        // Redirect based on role
        if (result.data.user.role === 'admin') {
          navigate('/admin')
        } else if (result.data.user.role === 'cr') {
          navigate('/cr-dashboard')
        } else {
          navigate('/attendance-history')
        }
      }
    } catch {
      toast.error('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            CR Attendance Portal
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Admin:</strong> admin@university.edu / admin123
              </p>
              <p>
                <strong>CR (CSE-3A):</strong> john.cr@university.edu / cr123
              </p>
              <p>
                <strong>CR (CSE-3B):</strong> jane.cr@university.edu / cr123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
