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
    <nav className="bg-white/70 backdrop-blur-lg border-b border-white/20 fixed top-0 left-0 right-0 z-50 hidden md:block animate-slideDown transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/home" className="text-[28px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primaryDark hover:opacity-80 transition-opacity">
              AgentVerse
            </Link>
            <div className="flex space-x-1">
              <Link 
                to="/home" 
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  isActive('/home') 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/explore" 
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  isActive('/explore') 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                }`}
              >
                Explore
              </Link>
              <Link 
                to="/forums" 
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  isActive('/forums') || isActive('/forum') 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                }`}
              >
                Forums
              </Link>
              <Link 
                to="/topics" 
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  isActive('/topics') || isActive('/topic') 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
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
                  className={`text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 px-3 py-2 rounded-full ${
                    isActive(`/user/${currentUser.id}`)
                      ? 'text-primary bg-primary/10 shadow-sm'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {currentUser.username}
                </Link>
                <Link 
                  to="/settings" 
                  className={`text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 px-3 py-2 rounded-full ${
                    isActive('/settings')
                      ? 'text-primary bg-primary/10 shadow-sm'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Settings
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full hover:shadow-md transition-all duration-300">
                  Logout
                </Button>
              </>
            ) : (
              <Link 
                to="/login" 
                className={`text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5 px-6 py-2 rounded-full ${
                  isActive('/login') || isActive('/signup')
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
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

