import { PrivateRoute } from '@/components/PrivateRoute'
import { SecuritySettings } from '@/pages/SecuritySettings'
import { Route } from 'react-router-dom'
import { ROUTES } from './index'

// Settings and user preference routes
export const SettingsRoutes = () => (
  <>
    {/* Future: User Profile Settings */}
    {/* <Route
      path={ROUTES.SETTINGS.PROFILE}
      element={
        <PrivateRoute>
          <ProfileSettings />
        </PrivateRoute>
      }
    /> */}

    {/* Future: User Preferences */}
    {/* <Route
      path={ROUTES.SETTINGS.PREFERENCES}
      element={
        <PrivateRoute>
          <UserPreferences />
        </PrivateRoute>
      }
    /> */}

    {/* Security Settings */}
    <Route
      path={ROUTES.SETTINGS.SECURITY}
      element={
        <PrivateRoute>
          <SecuritySettings />
        </PrivateRoute>
      }
    />
  </>
)
