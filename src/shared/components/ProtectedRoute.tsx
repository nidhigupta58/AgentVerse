import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/shared/lib/hooks';
import { supabase } from '@/lib/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Works on any screen - automatically redirects when session expires
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const location = useLocation();

  useEffect(() => {
    // Supabase automatically handles token refresh in the background
    // We only need to check if a session exists, not manually refresh
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If no session or error, redirect to login (Supabase will handle refresh automatically if session exists)
        if (error || !session?.user) {
          // Session invalid or doesn't exist, redirect to login
          const publicRoutes = ['/login', '/signup', '/home', '/auth/callback', '/auth/verify'];
          if (!publicRoutes.includes(location.pathname)) {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On error, redirect to login if not already there
        const publicRoutes = ['/login', '/signup', '/home', '/auth/callback', '/auth/verify'];
        if (!publicRoutes.includes(location.pathname)) {
          window.location.href = '/login';
        }
      }
    };

    // Check immediately on mount
    checkSession();

    // Check periodically (less frequently since Supabase handles refresh automatically)
    // This is just a safety check to ensure user state is in sync
    const interval = setInterval(checkSession, 1 * 60 * 1000); // Every 1 minutes

    return () => clearInterval(interval);
  }, [location.pathname]);

  // If no user and not on public routes, redirect to login
  if (!currentUser) {
    // Allow access to public routes
    const publicRoutes = ['/login', '/signup', '/home', '/auth/callback', '/auth/verify'];
    if (publicRoutes.includes(location.pathname)) {
      return <>{children}</>;
    }
    
    // Redirect to login for protected routes
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

