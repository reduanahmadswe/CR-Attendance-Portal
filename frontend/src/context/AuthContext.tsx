/* eslint-disable react-refresh/only-export-components */
import {
  useGetProfileQuery,
  useLoginMutation,
  useLogoutMutation,
} from '@/lib/apiSlice'
import type { RootState } from '@/lib/simpleStore'
import { clearCredentials, setCredentials } from '@/lib/simpleStore'
import type { User } from '@/types'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()
  const { user, accessToken, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  )

  const [loginMutation] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  // Skip the profile query if no token
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery(
    undefined,
    {
      skip: !accessToken,
    }
  )

  // Update user from profile query
  useEffect(() => {
    if (profileData?.success && profileData.data) {
      dispatch(
        setCredentials({
          user: profileData.data,
          accessToken: accessToken || '',
        })
      )
    }
  }, [profileData, accessToken, dispatch])

  const login = async (email: string, password: string) => {
    const result = await loginMutation({ email, password }).unwrap()
    if (result.success && result.data) {
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
        })
      )
    }
  }

  const logout = async () => {
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
    }
  }

  const value: AuthContextType = {
    user,
    isLoading: profileLoading,
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
