import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/shared/lib/hooks';
import { supabase } from '@/lib/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component - The Security Guard for Pages
 * 
 * This component wraps pages that require authentication. It acts like a bouncer
 * at a club - checking if you're on the guest list (logged in) before letting you in.
 * 
 * How it works:
 * 1. Checks Redux store for current user
 * 2. Verifies session with Supabase
 * 3. If not authenticated: Redirects to login page
 * 4. If authenticated: Renders the protected content
 * 
 * It also periodically checks the session to catch cases where:
 * - User logged out in another tab
 * - Session expired
 * - Token was revoked
 * 
 * The component preserves the intended destination so after login, users
 * can be redirected back to where they were trying to go.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const location = useLocation();

  useEffect(() => {
    /**
     * Session Validation Check
     * 
     * This function verifies that the user has a valid session. Even though
     * Supabase handles token refresh automatically, we still need to check
     * if a session exists at all (user might have logged out elsewhere).
     */
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // No session or error means user is not authenticated
        if (error || !session?.user) {
          const publicRoutes = ['/login', '/signup', '/home', '/auth/callback', '/auth/verify'];
          if (!publicRoutes.includes(location.pathname)) {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        const publicRoutes = ['/login', '/signup', '/home', '/auth/callback', '/auth/verify'];
        if (!publicRoutes.includes(location.pathname)) {
          window.location.href = '/login';
        }
      }
    };

    // Check immediately when component mounts
    checkSession();

    // Periodic check every minute to catch session changes
    // (e.g., user logged out in another tab)
    const interval = setInterval(checkSession, 1 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  // If no user in Redux store, check if we're on a public route
  if (!currentUser) {
    const publicRoutes = ['/login', '/signup', '/home', '/auth/callback', '/auth/verify'];
    if (publicRoutes.includes(location.pathname)) {
      // Allow access to public routes even without user
      return <>{children}</>;
    }
    
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated - render the protected content
  return <>{children}</>;
};

