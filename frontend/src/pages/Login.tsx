/**
 * Login Page Component
 *
 * A clean, modern login interface for the CR Attendance Portal.
 * Features:
 * - Role-based authentication with automatic dashboard redirection
 * - Responsive design with dark mode support
 * - Animated background elements
 * - Clean component architecture with separated concerns
 * - Proper loading states and error handling
 */

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useLoginMutation } from '@/lib/apiSlice'
import { getDashboardRoute } from '@/routes'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// Icons as components for better organization
const CheckIcon = () => (
  <svg
    className="w-8 h-8 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const EmailIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
    />
  </svg>
)

const LockIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
)

const ArrowRightIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7l5 5m0 0l-5 5m5-5H6"
    />
  </svg>
)

export function Login() {
  // State management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  // Authentication hooks
  const auth = useAuth()
  const { isAuthenticated, user, login: authLogin } = auth
  const [, { isLoading }] = useLoginMutation()

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    const dashboardRoute = getDashboardRoute(user.role)
    return <Navigate to={dashboardRoute} replace />
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userData = await authLogin(email, password)
      toast.success('Login successful!')

      const dashboardRoute = getDashboardRoute(userData.role)
      navigate(dashboardRoute)
    } catch {
      toast.error('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Animated Background */}
      <BackgroundDecorations />

      {/* Main Login Card */}
      <LoginCard
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Footer Credit */}
      <FooterCredit />
    </div>
  )
}

// Background decorations component
const BackgroundDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000" />
  </div>
)

// Main login card component
interface LoginCardProps {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

const LoginCard = ({
  email,
  password,
  setEmail,
  setPassword,
  handleSubmit,
  isLoading,
}: LoginCardProps) => (
  <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-2xl border-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
    <CardHeader className="space-y-2 pb-6">
      {/* Logo */}
      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
        <CheckIcon />
      </div>

      {/* Title */}
      <CardTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        CR Attendance Portal
      </CardTitle>

      {/* Description */}
      <CardDescription className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        Sign in to manage your class attendance records
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      <LoginForm
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </CardContent>
  </Card>
)

// Login form component
const LoginForm = ({
  email,
  password,
  setEmail,
  setPassword,
  handleSubmit,
  isLoading,
}: LoginCardProps) => (
  <form onSubmit={handleSubmit} className="space-y-5">
    {/* Email Field */}
    <div className="space-y-2">
      <label
        htmlFor="email"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Email Address
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <EmailIcon />
        </div>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
          placeholder="Enter your email address"
          required
        />
      </div>
    </div>

    {/* Password Field */}
    <div className="space-y-2">
      <label
        htmlFor="password"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <LockIcon />
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
          placeholder="Enter your password"
          required
        />
      </div>
    </div>

    {/* Submit Button */}
    <Button
      type="submit"
      className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Signing in...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2">
          <span>Sign In</span>
          <ArrowRightIcon />
        </div>
      )}
    </Button>
  </form>
)

// Footer credit component
const FooterCredit = () => (
  <div className="absolute bottom-4 left-0 right-0 px-4 sm:px-6">
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <CardContent className="p-4 text-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              📚 Built to digitize attendance management for Class
              Representatives
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              This portal was created to help Class Representatives easily
              manage and track student attendance, replacing traditional
              paper-based systems with a modern, efficient digital solution.
            </p>
            <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Created with ❤️ by{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Reduan Ahmad
                </span>{' '}
                • Software Engineering student
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
