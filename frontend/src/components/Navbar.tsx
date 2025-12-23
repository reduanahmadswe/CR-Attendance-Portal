import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = auth?.user;
  const isAuthenticated = auth?.isAuthenticated;

  // Don't show navbar on login page or if not authenticated
  if (!isAuthenticated || location.pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
        toast.success('Successfully logged out!');
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cr':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'instructor':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'cr':
        return 'Class Representative';
      case 'student':
        return 'Student';
      case 'instructor':
        return 'Instructor';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-sm">
      {/* Green gradient bar at top */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-xl group-hover:shadow-emerald-500/30 transition-all duration-300 group-hover:scale-105">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  CR Attendance
                </h1>
                <p className="text-xs text-gray-500">Portal</p>
              </div>
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* User Info (Desktop) */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                  {user?.name}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                    user?.role || ''
                  )}`}
                >
                  {getRoleDisplayName(user?.role || '')}
                </span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Security Settings Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/settings/security')}
              className="hidden sm:flex items-center gap-2 h-9 px-3 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Logout Button */}
            <Button
              size="sm"
              onClick={handleLogout}
              disabled={auth?.isLoggingOut}
              className="hidden sm:flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>{auth?.isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-gray-200/60 animate-in slide-in-from-top-2 duration-200">
            {/* User Info Mobile */}
            <div className="flex items-center gap-3 px-2 py-3 mb-3 bg-emerald-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                    user?.role || ''
                  )}`}
                >
                  {getRoleDisplayName(user?.role || '')}
                </span>
              </div>
            </div>

            {/* Mobile Security Settings */}
            <Button
              variant="outline"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/settings/security');
              }}
              className="w-full flex items-center justify-center gap-2 h-11 mb-2 border-gray-200"
            >
              <Settings className="h-4 w-4" />
              <span>Security Settings</span>
            </Button>

            {/* Mobile Logout */}
            <Button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={auth?.isLoggingOut}
              className="w-full flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            >
              <LogOut className="h-4 w-4" />
              <span>{auth?.isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
