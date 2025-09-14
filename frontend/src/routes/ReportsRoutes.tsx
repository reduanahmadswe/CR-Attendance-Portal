import { PrivateRoute } from '@/components/PrivateRoute'
import { AttendanceHistory } from '@/pages/AttendanceHistory'
import { Navigate, Route } from 'react-router-dom'
import { ROUTES } from './index'

// Reports and analytics routes
export const ReportsRoutes = () => (
  <>
    {/* Attendance History Reports */}
    <Route
      path={ROUTES.REPORTS.ATTENDANCE_HISTORY}
      element={
        <PrivateRoute requiredRole="admin">
          <AttendanceHistory />
        </PrivateRoute>
      }
    />

    {/* Future: Attendance Summary Reports */}
    {/* <Route
      path={ROUTES.REPORTS.ATTENDANCE_SUMMARY}
      element={
        <PrivateRoute requiredRole="admin">
          <AttendanceSummary />
        </PrivateRoute>
      }
    /> */}

    {/* Future: Student Reports */}
    {/* <Route
      path={ROUTES.REPORTS.STUDENT_REPORTS}
      element={
        <PrivateRoute requiredRole="admin">
          <StudentReports />
        </PrivateRoute>
      }
    /> */}

    {/* Legacy Reports Redirects */}
    <Route
      path={ROUTES.LEGACY.ATTENDANCE_HISTORY}
      element={<Navigate to={ROUTES.REPORTS.ATTENDANCE_HISTORY} replace />}
    />
    <Route
      path={ROUTES.LEGACY.ATTENDANCE}
      element={<Navigate to={ROUTES.REPORTS.ATTENDANCE_HISTORY} replace />}
    />
  </>
)
