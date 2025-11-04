/* eslint-disable react-refresh/only-export-components */
import {
  useGetProfileQuery,
  useLoginMutation,
  useLogoutMutation,
  useStudentLoginMutation,
} from '@/lib/apiSlice'
import { clearCredentials, setCredentials } from '@/lib/authSlice'
import type { RootState } from '@/lib/simpleStore'
import type { User } from '@/types'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  studentLogin: (studentId: string, password: string) => Promise<User>
  logout: (redirectToLogin?: boolean) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()
  const { user, accessToken, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  )

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [loginMutation] = useLoginMutation()
  const [studentLoginMutation] = useStudentLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  // Skip the profile query if no token
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery(undefined, {
    skip: !accessToken,
  })

  console.log('[AUTH CONTEXT] Profile loading:', profileLoading)
  console.log('[AUTH CONTEXT] Profile data:', profileData)
  console.log('[AUTH CONTEXT] Profile error:', profileError)
  console.log('[AUTH CONTEXT] Access token:', !!accessToken)

  // Update user from profile query
  useEffect(() => {
    console.log('[AUTH CONTEXT] Profile effect triggered', {
      profileData,
      profileError,
      accessToken,
    })

    if (profileData?.success && profileData.data) {
      console.log('[AUTH CONTEXT] Setting credentials from profile')
      dispatch(
        setCredentials({
          user: profileData.data,
          accessToken: accessToken || '',
        })
      )
    } else if (profileError && accessToken) {
      console.warn('[AUTH CONTEXT] Profile fetch failed:', profileError)

      // Only clear credentials if it's an authentication error (401/403)
      const error = profileError as {
        status?: number
        data?: { message?: string }
      }
      const isAuthError =
        error?.status === 401 ||
        error?.status === 403 ||
        error?.data?.message?.includes('token')

      if (isAuthError) {
        console.log('[AUTH CONTEXT] Auth error, clearing invalid token')
        dispatch(clearCredentials())
      } else {
        console.log('[AUTH CONTEXT] Network error, keeping token for retry')
      }
    } else if (!profileLoading && accessToken && !profileData) {
      console.warn(
        '[AUTH CONTEXT] No profile data but have token - possible API issue'
      )
    }
  }, [profileData, profileError, accessToken, dispatch, profileLoading])

  const login = async (email: string, password: string) => {
    console.log('[AUTH CONTEXT] Login function called for:', email)

    try {
      const result = await loginMutation({ email, password }).unwrap()

      if (result.success && result.data) {
        console.log(
          '[AUTH CONTEXT] Login successful, setting credentials immediately'
        )
        dispatch(
          setCredentials({
            user: result.data.user,
            accessToken: result.data.accessToken,
          })
        )
        return result.data.user // Return user data for immediate use
      }

      throw new Error(result.message || 'Login failed')
    } catch (error) {
      console.error('[AUTH CONTEXT] Login failed:', error)
      // Clear any stale credentials on login failure
      dispatch(clearCredentials())
      throw error
    }
  }

  const studentLogin = async (studentId: string, password: string) => {
    console.log('[AUTH CONTEXT] Student login function called for:', studentId)

    try {
      const result = await studentLoginMutation({ studentId, password }).unwrap()

      if (result.success && result.data) {
        console.log(
          '[AUTH CONTEXT] Student login successful, setting credentials immediately'
        )
        dispatch(
          setCredentials({
            user: result.data.user,
            accessToken: result.data.accessToken,
          })
        )
        return result.data.user // Return user data for immediate use
      }

      throw new Error(result.message || 'Student login failed')
    } catch (error) {
      console.error('[AUTH CONTEXT] Student login failed:', error)
      // Clear any stale credentials on login failure
      dispatch(clearCredentials())
      throw error
    }
  }

  const logout = async (redirectToLogin = true) => {
    console.log('[AUTH CONTEXT] Logout function called')

    // Set logging out state for UI feedback
    setIsLoggingOut(true)

    // Clear credentials immediately for instant UI response
    console.log('[AUTH CONTEXT] Clearing credentials immediately')
    dispatch(clearCredentials())

    try {
      console.log('[AUTH CONTEXT] Making logout API call')
      await logoutMutation().unwrap()
      console.log('[AUTH CONTEXT] Logout API call successful')
    } catch (error) {
      // Credentials already cleared, so just log the error
      console.error('[AUTH CONTEXT] Logout API error:', error)
    } finally {
      setIsLoggingOut(false)
    }

    if (redirectToLogin) {
      // Force redirect to login page
      window.location.href = '/auth/login'
    }
  }

  const value: AuthContextType = {
    user,
    isLoading: profileLoading || (isLoading && Boolean(accessToken)),
    isLoggingOut,
    isAuthenticated,
    login,
    studentLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
