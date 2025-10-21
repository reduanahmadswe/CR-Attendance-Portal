import { Route } from 'react-router-dom';
import { PrivateRoute } from '@/components/PrivateRoute';
import { ROUTES } from './index';
import AnnouncementsPage from '@/pages/Announcements';

export const AnnouncementsRoutes = () => (
  <>
    {/* Announcements - Backend handles role-based access */}
    <Route
      path={ROUTES.ANNOUNCEMENTS.LIST}
      element={
        <PrivateRoute>
          <AnnouncementsPage />
        </PrivateRoute>
      }
    />
  </>
);
