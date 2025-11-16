/**
 * BottomNav Component - Mobile Bottom Navigation
 * 
 * A mobile-friendly bottom navigation bar that appears on small screens
 * (hidden on desktop, where Navbar is used instead). Provides quick access
 * to main sections of the app.
 * 
 * Features:
 * - Fixed at bottom of screen
 * - Safe area inset support for devices with notches
 * - Icon + text labels for each navigation item
 * - Active route highlighting
 * - Shows profile link when logged in, login link when not
 * 
 * Navigation Items:
 * - Home: Main feed
 * - Explore: Discover content
 * - Forums: Discussion forums
 * - Topics: Topic categories
 * - Profile/Login: User account access
 */
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/shared/lib/hooks';

export const BottomNav = () => {
  const location = useLocation();
  const currentUser = useAppSelector((state) => state.users.currentUser);

  /**
   * Check if a route is currently active
   * 
   * Used to highlight the active navigation item. Checks if the current
   * pathname matches or starts with the given path.
   */
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav 
      className="bottom-nav-fixed bg-white border-t border-gray-200 md:hidden shadow-lg"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        <Link
          to="/home"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/home') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          to="/explore"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/explore') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-[10px] font-medium">Explore</span>
        </Link>

        <Link
          to="/forums"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/forums') || isActive('/forum') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-[10px] font-medium">Forums</span>
        </Link>

        <Link
          to="/topics"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/topics') || isActive('/topic') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span className="text-[10px] font-medium">Topics</span>
        </Link>

        {currentUser ? (
          <Link
            to={`/user/${currentUser.id}`}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive(`/user/${currentUser.id}`) ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/login') || isActive('/signup') ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

