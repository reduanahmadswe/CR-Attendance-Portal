/* eslint-disable react-refresh/only-export-components */
import {
  useGetProfileQuery,
  useLoginMutation,
  useLogoutMutation,
} from '@/lib/apiSlice'
import { clearCredentials, setCredentials } from '@/lib/authSlice'
import type { RootState } from '@/lib/simpleStore'
import type { User } from '@/types'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  logout: (redirectToLogin?: boolean) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()
  const { user, accessToken, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  )

  const [loginMutation] = useLoginMutation()
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
    const result = await loginMutation({ email, password }).unwrap()
    if (result.success && result.data) {
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
        })
      )
      return result.data.user // Return user data for immediate use
    }
    throw new Error('Login failed')
  }

  const logout = async (redirectToLogin = true) => {
    console.log('[AUTH CONTEXT] Logout function called')
    try {
      console.log('[AUTH CONTEXT] Making logout API call')
      await logoutMutation().unwrap()
      console.log('[AUTH CONTEXT] Logout API call successful')
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('[AUTH CONTEXT] Logout API error:', error)
    } finally {
      console.log('[AUTH CONTEXT] Clearing credentials')
      dispatch(clearCredentials())
      console.log('[AUTH CONTEXT] Credentials cleared')

      if (redirectToLogin) {
        // Force redirect to login page
        window.location.href = '/auth/login'
      }
    }
  }

  const value: AuthContextType = {
    user,
    isLoading: profileLoading || (isLoading && Boolean(accessToken)),
    isAuthenticated,
    login,
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
