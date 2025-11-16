import { useEffect } from 'react';
import { useAppDispatch } from '@/shared/lib/hooks';
import { setCurrentUser, fetchCurrentUser } from '@/features/users/model/slice';
import { onAuthStateChange } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider Component - The Authentication Guardian
 * 
 * This component wraps the entire app and manages authentication state throughout
 * the user's session. Think of it as a security guard that:
 * 
 * 1. Checks if the user is logged in when the app starts
 * 2. Listens for authentication events (login, logout, token refresh)
 * 3. Keeps the Redux store in sync with the current user
 * 4. Handles session expiration and refresh automatically
 * 
 * How it works:
 * - On mount: Checks for existing session from localStorage
 * - If session exists: Validates it and fetches user profile
 * - If session expired: Attempts to refresh using refresh token
 * - Listens to Supabase auth events: Updates Redux store when auth state changes
 * 
 * The component renders children immediately (non-blocking) so the UI shows
 * right away, while auth initialization happens in the background.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    /**
     * Initialize Authentication on App Start
     * 
     * This function runs when the app first loads. It checks if there's an
     * existing session stored in localStorage from a previous visit.
     * 
     * Flow:
     * 1. Get session from Supabase (reads from localStorage)
     * 2. If session exists, check if it's expired
     * 3. If expired, try to refresh using the refresh token
     * 4. If valid, fetch the user profile and store in Redux
     */
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error on init:', sessionError);
          await supabase.auth.signOut();
          return;
        }

        if (session?.user) {
          // Check if the session token has expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.log('Session expired on init, refreshing...');
            try {
              // Use refresh token to get a new access token
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError || !refreshData.session) {
                console.warn('Failed to refresh session on init');
                await supabase.auth.signOut();
              } else {
                // Successfully refreshed, now fetch user profile
                const result = await dispatch(fetchCurrentUser());
                if (fetchCurrentUser.fulfilled.match(result)) {
                  // User profile loaded into Redux store
                } else {
                  console.warn('Failed to fetch user after refresh');
                }
              }
            } catch (refreshErr) {
              console.error('Error refreshing session on init:', refreshErr);
              await supabase.auth.signOut();
            }
          } else {
            // Session is still valid, fetch user profile in background
            dispatch(fetchCurrentUser()).catch((error) => {
              console.log('User fetch error (non-blocking):', error);
            });
          }
        }
      } catch (error) {
        // No existing session - user needs to log in
        console.log('No existing session or error:', error);
      }
    };

    // Start authentication check immediately (non-blocking)
    initializeAuth();

    /**
     * Listen to Authentication State Changes
     * 
     * Supabase emits events whenever authentication state changes:
     * - SIGNED_IN: User just logged in
     * - SIGNED_OUT: User logged out
     * - TOKEN_REFRESHED: Access token was automatically refreshed
     * - USER_UPDATED: User profile was updated
     * 
     * We listen to these events and update our Redux store accordingly,
     * so the entire app always knows who the current user is.
     */
    const {
      data: { subscription },
    } = onAuthStateChange(async (event, session, user) => {
      console.log('Auth state changed:', event, 'Session exists:', !!session);

      switch (event) {
        case 'SIGNED_IN':
          // User just logged in - update Redux store with user data
          if (user) {
            dispatch(setCurrentUser(user));
          } else if (session?.user) {
            // User object not provided, fetch it from database
            try {
              const result = await dispatch(fetchCurrentUser());
              if (fetchCurrentUser.fulfilled.match(result) && result.payload) {
                dispatch(setCurrentUser(result.payload));
              }
            } catch (error) {
              console.error('Failed to fetch user on sign in:', error);
            }
          }
          break;
        case 'SIGNED_OUT':
          // User logged out - clear user from Redux store
          dispatch(setCurrentUser(null));
          // Redirect to login page if not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
          break;
        case 'TOKEN_REFRESHED':
          // Access token was refreshed - update user data to ensure it's current
          if (session?.user) {
            try {
              const result = await dispatch(fetchCurrentUser());
              if (fetchCurrentUser.fulfilled.match(result) && result.payload) {
                dispatch(setCurrentUser(result.payload));
              }
            } catch (error) {
              console.error('Failed to fetch user after token refresh:', error);
            }
          }
          break;
        case 'USER_UPDATED':
          // User profile was updated - update Redux store
          if (user) {
            dispatch(setCurrentUser(user));
          }
          break;
        default:
          break;
      }
    });

    // Cleanup: Unsubscribe from auth events when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Render children immediately - don't block UI while auth initializes
  return <>{children}</>;
};

