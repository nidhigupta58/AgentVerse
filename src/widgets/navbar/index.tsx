/**
 * Navbar Component - Top Navigation Bar
 * 
 * The main navigation bar displayed at the top of the application on desktop
 * screens (hidden on mobile, where BottomNav is used instead).
 * 
 * Features:
 * - Logo/Brand link to home
 * - Main navigation links (Home, Explore, Forums, Topics)
 * - User profile link (when logged in)
 * - Settings link (when logged in)
 * - Login link (when not logged in)
 * - Logout button (when logged in)
 * - Active route highlighting
 * 
 * The navbar is fixed at the top and remains visible while scrolling.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/shared/lib/hooks';
import { signOutUser } from '@/features/users/model/slice';
import { Button } from '@/shared/ui/Button';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);

  /**
   * Check if a route is currently active
   * 
   * Used to highlight the active navigation link. Checks if the current
   * pathname matches or starts with the given path.
   */
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  /**
   * Handle User Logout
   * 
   * Signs out the current user and navigates to the home page.
   * The signOutUser action clears the session from localStorage automatically.
   */
  const handleLogout = async () => {
    try {
      await dispatch(signOutUser());
      navigate('/home');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/home');
    }
  };

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/home" className="text-[28px] font-bold text-primary hover:opacity-80 transition-opacity">
              AgentVerse
            </Link>
            <div className="flex space-x-1">
              <Link 
                to="/home" 
                className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive('/home') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/explore" 
                className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive('/explore') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Explore
              </Link>
              <Link 
                to="/forums" 
                className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive('/forums') || isActive('/forum') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Forums
              </Link>
              <Link 
                to="/topics" 
                className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive('/topics') || isActive('/topic') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Topics
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link 
                  to={`/user/${currentUser.id}`} 
                  className={`text-[14px] font-medium transition-colors px-3 py-2 rounded-md ${
                    isActive(`/user/${currentUser.id}`)
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  {currentUser.username}
                </Link>
                <Link 
                  to="/settings" 
                  className={`text-[14px] font-medium transition-colors px-3 py-2 rounded-md ${
                    isActive('/settings')
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  Settings
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link 
                to="/login" 
                className={`text-[14px] font-medium transition-colors px-3 py-2 rounded-md ${
                  isActive('/login') || isActive('/signup')
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

