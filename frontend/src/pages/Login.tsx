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
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [loginType, setLoginType] = useState<'admin' | 'student'>('admin')
  const navigate = useNavigate()

  // Authentication hooks
  const auth = useAuth()
  const { isAuthenticated, user, login: authLogin, studentLogin: authStudentLogin } = auth
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
      let userData
      
      if (loginType === 'student') {
        userData = await authStudentLogin(studentId, password)
        toast.success('Student login successful!')
      } else {
        userData = await authLogin(email, password)
        toast.success('Login successful!')
      }

      const dashboardRoute = getDashboardRoute(userData.role)
      navigate(dashboardRoute)
    } catch {
      toast.error('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-2 sm:p-4 md:p-6 lg:p-8 pb-32 sm:pb-36 md:pb-40">
      {/* Theme Toggle */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Animated Background */}
      <BackgroundDecorations />

      {/* Main Login Card */}
      <LoginCard
        loginType={loginType}
        setLoginType={setLoginType}
        email={email}
        studentId={studentId}
        password={password}
        setEmail={setEmail}
        setStudentId={setStudentId}
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
    <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
    <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000" />
  </div>
)

// Main login card component
interface LoginCardProps {
  loginType: 'admin' | 'student'
  setLoginType: (type: 'admin' | 'student') => void
  email: string
  studentId: string
  password: string
  setEmail: (value: string) => void
  setStudentId: (value: string) => void
  setPassword: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

const LoginCard = ({
  loginType,
  setLoginType,
  email,
  studentId,
  password,
  setEmail,
  setStudentId,
  setPassword,
  handleSubmit,
  isLoading,
}: LoginCardProps) => (
  <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-2 sm:mx-4 shadow-2xl border-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
    <CardHeader className="space-y-2 pb-4 sm:pb-6 px-4 sm:px-6">
      {/* Logo */}
      <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4 relative">
        <img
          src="/logo.svg"
          alt="CR Attendance Portal Logo"
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>

      {/* Title */}
      <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        CR Portal
      </CardTitle>

      {/* Description */}
      <CardDescription className="text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base px-2">
        Sign in to manage your class attendance records
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
      {/* Login Type Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          type="button"
          onClick={() => setLoginType('admin')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            loginType === 'admin'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Admin/CR
        </button>
        <button
          type="button"
          onClick={() => setLoginType('student')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            loginType === 'student'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Student
        </button>
      </div>

      <LoginForm
        loginType={loginType}
        email={email}
        studentId={studentId}
        password={password}
        setEmail={setEmail}
        setStudentId={setStudentId}
        setPassword={setPassword}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </CardContent>
  </Card>
)

// Login form component
interface LoginFormProps {
  loginType: 'admin' | 'student'
  email: string
  studentId: string
  password: string
  setEmail: (value: string) => void
  setStudentId: (value: string) => void
  setPassword: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

const LoginForm = ({
  loginType,
  email,
  studentId,
  password,
  setEmail,
  setStudentId,
  setPassword,
  handleSubmit,
  isLoading,
}: LoginFormProps) => (
  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
    {/* Conditional Field - Email for Admin/CR, Student ID for Student */}
    {loginType === 'admin' ? (
      <div className="space-y-1 sm:space-y-2">
        <label
          htmlFor="email"
          className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
            <EmailIcon />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
            placeholder="Enter your email address"
            required
          />
        </div>
      </div>
    ) : (
      <div className="space-y-1 sm:space-y-2">
        <label
          htmlFor="studentId"
          className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Student ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
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
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
          </div>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
            placeholder="Enter your Student ID : 232-35-000"
            required
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Default password is your Student ID
        </p>
      </div>
    )}

    {/* Password Field */}
    <div className="space-y-1 sm:space-y-2">
      <label
        htmlFor="password"
        className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
          <LockIcon />
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
          placeholder="Enter your password"
          required
        />
      </div>
    </div>

    {/* Submit Button */}
    <Button
      type="submit"
      className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm md:text-base"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Signing in...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          <span>Sign In</span>
          <ArrowRightIcon />
        </div>
      )}
    </Button>
  </form>
)

// Footer credit component
const FooterCredit = () => (
  <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 px-3 sm:px-4 md:px-6">
    <div className="max-w-xs sm:max-w-md md:max-w-2xl mx-auto">
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <CardContent className="p-2 sm:p-3 md:p-4 text-center">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 font-medium leading-tight">
              📚 Built for Class Representatives attendance management
            </p>
            <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed hidden sm:block">
              This portal helps Class Representatives easily manage and track
              student attendance, replacing traditional paper-based systems.
            </p>
            <div className="pt-1 sm:pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-500 leading-tight">
                Created with ❤️ by{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Reduan Ahmad
                </span>
                <span className="hidden sm:inline">
                  {' '}
                  • Software Engineering student
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
