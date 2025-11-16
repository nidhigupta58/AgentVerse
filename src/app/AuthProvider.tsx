import { useEffect } from 'react';
import { useAppDispatch } from '@/shared/lib/hooks';
import { setCurrentUser, fetchCurrentUser } from '@/features/users/model/slice';
import { onAuthStateChange } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * Manages authentication state and session persistence
 * Follows Supabase best practices for React
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  // Removed isInitialized state - not needed, splash shows immediately

  useEffect(() => {
    // Initialize auth in background - don't block UI
    const initializeAuth = async () => {
      try {
        // First, check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error on init:', sessionError);
          // Clear invalid session
          await supabase.auth.signOut();
          return;
        }

        // If we have a session, try to fetch user
        if (session?.user) {
          // Check if session is expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.log('Session expired on init, refreshing...');
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError || !refreshData.session) {
                console.warn('Failed to refresh session on init');
                await supabase.auth.signOut();
              } else {
                // Session refreshed, fetch user
                const result = await dispatch(fetchCurrentUser());
                if (fetchCurrentUser.fulfilled.match(result)) {
                  // User fetched successfully
                } else {
                  console.warn('Failed to fetch user after refresh');
                }
              }
            } catch (refreshErr) {
              console.error('Error refreshing session on init:', refreshErr);
              await supabase.auth.signOut();
            }
          } else {
            // Session is valid, fetch user in background
            dispatch(fetchCurrentUser()).catch((error) => {
              console.log('User fetch error (non-blocking):', error);
            });
          }
        }
      } catch (error) {
        // No session exists or error - that's okay
        console.log('No existing session or error:', error);
      }
    };

    // Start auth check immediately but don't block
    initializeAuth();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = onAuthStateChange(async (event, session, user) => {
      console.log('Auth state changed:', event, 'Session exists:', !!session);

      switch (event) {
        case 'SIGNED_IN':
          if (user) {
            dispatch(setCurrentUser(user));
          } else if (session?.user) {
            // Fetch user if not provided
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
          dispatch(setCurrentUser(null));
          // Redirect to login if not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
          break;
        case 'TOKEN_REFRESHED':
          // Session refreshed, update user
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
          if (user) {
            dispatch(setCurrentUser(user));
          }
          break;
        default:
          break;
      }
    });

    // Supabase automatically handles token refresh in the background
    // We just need to listen to the TOKEN_REFRESHED event (already handled above)
    // No need for manual periodic checks - Supabase client handles this automatically

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Always render children immediately - splash screen will handle loading
  return <>{children}</>;
};

