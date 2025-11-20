/**
 * Authentication Functions
 * 
 * This module contains all the authentication-related functions for signing up,
 * signing in, signing out, and managing user sessions. All functions interact
 * with Supabase Auth, which handles the heavy lifting of authentication.
 * 
 * Important Notes:
 * - Supabase automatically refreshes tokens in the background
 * - Sessions are persisted in localStorage under 'supabase.auth.token'
 * - The client is configured with autoRefreshToken: true
 */
import { supabase } from './client';
import type { User } from '@/entities/user/model';
import type { Session } from '@supabase/supabase-js';

/**
 * Get Stored Access Token
 * 
 * Retrieves the access token from localStorage. This token is used to authenticate
 * API requests. The token is stored by Supabase automatically when a user signs in.
 * 
 * Returns the access token string, or null if not found.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  
  try {
    const tokenData = localStorage.getItem('supabase.auth.token');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed?.access_token || tokenData;
    }
    return null;
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
}

/**
 * Get Full Session Data
 * 
 * Retrieves the complete session object from localStorage, which includes
 * the access token, refresh token, user info, and expiration times.
 * 
 * Returns the full session object, or null if not found.
 */
export function getStoredSession(): any {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  
  try {
    const tokenData = localStorage.getItem('supabase.auth.token');
    if (tokenData) {
      return JSON.parse(tokenData);
    }
    return null;
  } catch (error) {
    console.error('Error reading session from localStorage:', error);
    return null;
  }
}

export interface SignupData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  requiresEmailVerification?: boolean;
}

/**
 * Sign Up New User
 * 
 * Creates a new user account in Supabase Auth and attempts to create their profile
 * in the database. This function handles the complete signup flow:
 * 
 * 1. Validates input (email, password, username, name)
 * 2. Creates auth account with Supabase
 * 3. Creates user profile in database (using RPC function)
 * 4. Handles email verification requirements
 * 
 * If email verification is required, the user profile will be created by a database
 * trigger when they verify their email. The function tries multiple approaches to
 * ensure the profile is created.
 * 
 * Returns: User object, session, and whether email verification is needed
 */
export async function signUp({ name, username, email, password }: SignupData): Promise<AuthResponse> {
  // Input validation
  if (!email || !password || !username || !name) {
    throw new Error('All fields are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Create auth account with Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        username,
      },
      emailRedirectTo: `${window.location.origin}/auth/verify`,
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create user account');
  }

  // Determine if email verification is required
  // If no session is returned, user needs to verify email first
  const requiresEmailVerification = !authData.session;

  // Attempt to create user profile in database
  // Uses RPC function which has SECURITY DEFINER, so it can create even without session
  try {
    const { data: userData, error: functionError } = await supabase.rpc('create_user_profile', {
      p_user_id: authData.user.id,
      p_email: email,
      p_username: username,
      p_name: name,
    });

    if (!functionError && userData && userData.length > 0) {
      return {
        user: userData[0] as User,
        session: authData.session,
        requiresEmailVerification,
      };
    }

    // If RPC function failed, wait a moment - database trigger might create it
    if (functionError) {
      console.warn('Profile creation function failed, waiting for trigger:', functionError.message);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Try fetching the profile (might have been created by trigger)
    const { data: fetchedUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (fetchedUser && !fetchError) {
      return {
        user: fetchedUser as User,
        session: authData.session,
        requiresEmailVerification,
      };
    }

    // Profile not created yet - will be created by trigger when email is verified
    console.warn('Profile not created yet. It will be created by trigger when email is verified.');
  } catch (error: unknown) {
    console.error('Error creating user profile:', error);
  }

  // Return without user - profile will be created after email verification
  return {
    user: null,
    session: authData.session,
    requiresEmailVerification,
  };
}

/**
 * Sign In User
 * 
 * Authenticates a user with either their email or username and password.
 * This function supports flexible login - users can use either identifier.
 * 
 * Flow:
 * 1. Determines if identifier is email or username (checks for @ symbol)
 * 2. If username, looks up the email from database
 * 3. Authenticates with Supabase using email and password
 * 4. Fetches user profile from database
 * 5. Returns user and session
 * 
 * If the profile doesn't exist (edge case), it attempts to create it using
 * metadata from the auth account.
 */
export async function signIn({ identifier, password }: LoginData): Promise<AuthResponse> {
  if (!identifier || !password) {
    throw new Error('Email/username and password are required');
  }

  // Support both email and username login
  let email = identifier;
  const isEmail = identifier.includes('@');

  if (!isEmail) {
    // It's a username - look up the email from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', identifier.toLowerCase())
      .single();

      if (userError || !userData) {
        throw new Error('Invalid username or password');
      }

      email = userData.email;
  }
    // Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // Convert technical errors to user-friendly messages
    if (authError.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email/username or password');
    }
    if (authError.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email address before signing in');
    }
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to sign in');
  }

  if (!authData.session) {
    throw new Error('Session not created. Please verify your email address.');
  }

  // Fetch user profile from database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle(); // ✨ FIX: Use maybeSingle() to prevent error if profile doesn't exist

  if (userError || !userData) {
    // Edge case: Profile doesn't exist, try to create it from auth metadata
    console.warn('User profile not found on login, attempting to create it.');
    try { // ✨ FIX: More robust fallback to create profile
      const { data: createdUser } = await supabase.rpc('create_user_profile', {
        p_user_id: authData.user.id,
        p_email: authData.user.email || email,
        p_username: authData.user.user_metadata?.username || identifier.split('@')[0],
        p_name: authData.user.user_metadata?.name || null,
      });

      if (createdUser?.[0]) {
        return {
          user: createdUser[0] as User,
          session: authData.session,
        };
      }
    } catch (error: unknown) {
      console.error('Error creating profile on login:', error);
    }

    // If profile creation also fails, then throw the error.
    throw new Error(userError?.message || 'User profile not found. Please contact support.');
  }

  return {
    user: userData as User,
    session: authData.session,
  };
}

/**
 * Sign Out Current User
 * 
 * Logs out the current user by:
 * 1. Calling Supabase signOut to invalidate the session on the server
 * 2. Clearing all authentication tokens from localStorage
 * 3. Removing any other Supabase-related storage keys
 * 
 * This ensures a complete cleanup so the user is fully logged out and
 * can't access protected resources until they sign in again.
 */
export async function signOut(): Promise<void> {
  try {
    // Invalidate session on Supabase server
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    
    // Clear all authentication data from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const tokenKey = 'supabase.auth.token';
      localStorage.removeItem(tokenKey);
      
      // Find and remove any other Supabase-related keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.startsWith('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('Token and session data cleared from localStorage');
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    // Even if there's an error, try to clear localStorage as fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('supabase.auth.token');
    }
    throw error;
  }
}

/**
 * Get Current Authenticated User
 * 
 * Retrieves the currently logged-in user's profile from the database. This function:
 * 
 * 1. Gets the current session (with 3-second timeout to prevent hanging)
 * 2. Checks if session is expired and refreshes if needed (fallback)
 * 3. Fetches user profile from database (with timeout)
 * 4. Creates profile if it doesn't exist (edge case handling)
 * 
 * Note: Supabase automatically refreshes tokens, but this function includes
 * a fallback refresh in case the auto-refresh hasn't happened yet.
 * 
 * Returns: User object if authenticated, null if not
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get session with timeout to prevent hanging on slow networks
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 10000)
    );
    
    const sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
    
    if (!sessionResult) {
      console.warn('Session check timeout');
      return null;
    }

    const { data: { session }, error: sessionError } = sessionResult;

    if (sessionError) {
      console.error('Session error:', sessionError);
      await supabase.auth.signOut();
      return null;
    }

    if (!session?.user) {
      return null;
    }

    // Check if session is expired (fallback - Supabase usually handles this automatically)
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('Session expired, attempting manual refresh as fallback...');
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.warn('Failed to refresh expired session, signing out');
          await supabase.auth.signOut();
          return null;
        }
        
        // Fetch user profile with refreshed session
        const refreshedSession = refreshData.session;
        if (!refreshedSession.user) {
          return null;
        }
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', refreshedSession.user.id)
          .single();

        if (error) {
          console.warn('Failed to fetch user profile after refresh:', error.message);
          return null;
        }

        return userData as User;
      } catch (refreshErr) {
        console.error('Error refreshing session:', refreshErr);
        await supabase.auth.signOut();
        return null;
      }
    }

    // Fetch user profile with timeout
    const profilePromise = supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    const profileTimeout = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 3000)
    );
    
    const profileResult = await Promise.race([profilePromise, profileTimeout]);

    if (!profileResult) {
      console.warn('Profile fetch timeout');
      return null;
    }

    const { data: userData, error } = profileResult;

    if (error) {
      // Edge case: Profile doesn't exist, try to create it from auth metadata
      if (error.code === 'PGRST116') {
        const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user';
        const name = session.user.user_metadata?.name || username;
        
        try {
          const { data: profileData } = await supabase.rpc('create_user_profile', {
            p_user_id: session.user.id,
            p_email: session.user.email || '',
            p_username: username,
            p_name: name,
          });

          if (profileData && profileData.length > 0) {
            return profileData[0] as User;
          }
        } catch (createError) {
          console.warn('Failed to create profile:', createError);
        }
      }
      console.warn('Failed to fetch user profile:', error.message);
      return null;
    }

    if (!userData) {
      return null;
    }

    return userData as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get Current Session
 * 
 * Retrieves the current authentication session from Supabase.
 * This is a simple wrapper around Supabase's getSession method.
 * 
 * Returns: Session object if authenticated, null if not
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return session;
}

/**
 * Listen to Authentication State Changes
 * 
 * Sets up a listener that fires whenever the authentication state changes.
 * This is used by AuthProvider to keep the Redux store in sync with auth state.
 * 
 * Events that trigger this:
 * - SIGNED_IN: User just logged in
 * - SIGNED_OUT: User logged out
 * - TOKEN_REFRESHED: Access token was refreshed
 * - USER_UPDATED: User profile was updated
 * 
 * The callback receives the event type, session, and user profile.
 * Returns a subscription object that can be unsubscribed.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    callback(event, session);
  });
}

/**
 * Refresh Current Session
 * 
 * Manually refreshes the access token using the refresh token.
 * Note: This is usually not needed as Supabase handles this automatically,
 * but can be useful in edge cases or for testing.
 * 
 * Returns: Refreshed session object
 */
export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(error.message);
  }
  return session;
}

/**
 * Ensure Session is Valid
 * 
 * Validates that the current session exists and is not expired.
 * If expired, attempts to refresh it. This is useful before making
 * authenticated API calls to ensure the request will succeed.
 * 
 * Returns: true if session is valid, false if not
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      await supabase.auth.signOut();
      return false;
    }

    if (!session?.user) {
      return false;
    }

    // Check if session is expired (fallback - Supabase usually handles this)
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('Session expired, attempting refresh as fallback...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.warn('Failed to refresh expired session');
        await supabase.auth.signOut();
        return false;
      }
      
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring valid session:', error);
    return false;
  }
}
