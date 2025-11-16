import { supabase } from './client';
import type { User } from '@/entities/user/model';

// Supabase automatically handles token refresh in the background
// The client is configured with autoRefreshToken: true, so manual refresh is not needed
// Session is persisted in localStorage under the key 'supabase.auth.token' and automatically restored on page load
// Long-lived refresh tokens are used to maintain session continuity

/**
 * Get the stored token from localStorage
 * This is the key where Supabase stores the session token: 'supabase.auth.token'
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  
  try {
    const tokenData = localStorage.getItem('supabase.auth.token');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      // Return the access token if available
      return parsed?.access_token || tokenData;
    }
    return null;
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
}

/**
 * Get the full session data from localStorage
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
  identifier: string; // username or email
  password: string;
}

import type { Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  requiresEmailVerification?: boolean;
}

/**
 * Sign up a new user with Supabase Auth
 * Follows Supabase best practices for React apps
 */
export async function signUp({ name, username, email, password }: SignupData): Promise<AuthResponse> {
  // Validate input
  if (!email || !password || !username || !name) {
    throw new Error('All fields are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Sign up with Supabase Auth
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

  // Check if email verification is required
  const requiresEmailVerification = !authData.session;

  // Always try to create profile, regardless of session status
  // The function uses SECURITY DEFINER so it can create even without session
  // It's also granted to 'anon' role, so it should work
  try {
    // Use the database function to create the profile (bypasses RLS)
    // This works even without a session because the function has SECURITY DEFINER
    const { data: userData, error: functionError } = await supabase.rpc('create_user_profile', {
      p_user_id: authData.user.id,
      p_email: email,
      p_username: username,
      p_name: name,
    });

    if (!functionError && userData && userData.length > 0) {
      // Profile created successfully
      return {
        user: userData[0] as User,
        session: authData.session,
        requiresEmailVerification,
      };
    }

    // If function failed, wait a bit and try to fetch (trigger might have created it)
    if (functionError) {
      console.warn('Profile creation function failed, waiting for trigger:', functionError.message);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Try to fetch the profile (might have been created by trigger)
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

    // If still no profile, log warning but don't fail
    // The trigger should create it when email is verified
    console.warn('Profile not created yet. It will be created by trigger when email is verified.');
  } catch (error: unknown) {
    console.error('Error creating user profile:', error);
    // Don't throw - user is created, profile will be created by trigger
  }

  // Return response
  // If email verification required, profile will be created by trigger after verification
  // If no verification required but profile not created, trigger will handle it
  return {
    user: null,
    session: authData.session,
    requiresEmailVerification,
  };
}

/**
 * Sign in with email or username and password
 * Follows Supabase best practices
 */
export async function signIn({ identifier, password }: LoginData): Promise<AuthResponse> {
  if (!identifier || !password) {
    throw new Error('Email/username and password are required');
  }

  // Determine if identifier is email or username
  let email = identifier;
  const isEmail = identifier.includes('@');

  if (!isEmail) {
    // It's a username, find the user by username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', identifier)
      .single();

    if (userError || !userData) {
      throw new Error('Invalid username or password');
    }

    email = userData.email;
  }

  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // Provide user-friendly error messages
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

  // Fetch user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError || !userData) {
    // If profile doesn't exist, try to create it
    try {
      const { data: createdUser } = await supabase.rpc('create_user_profile', {
        p_user_id: authData.user.id,
        p_email: authData.user.email || email,
        p_username: authData.user.user_metadata?.username || identifier.split('@')[0],
        p_name: authData.user.user_metadata?.name || null,
      });

      if (createdUser && createdUser.length > 0) {
        return {
          user: createdUser[0] as User,
          session: authData.session,
        };
      }
    } catch (error: unknown) {
      console.error('Error creating profile on login:', error);
    }

    throw new Error('User profile not found. Please contact support.');
  }

  return {
    user: userData as User,
    session: authData.session,
  };
}

/**
 * Sign out current user
 * Properly clears the token from localStorage
 */
export async function signOut(): Promise<void> {
  try {
    // Sign out from Supabase (this should clear the session)
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    
    // Explicitly clear the token from localStorage to ensure complete cleanup
    if (typeof window !== 'undefined' && window.localStorage) {
      const tokenKey = 'supabase.auth.token';
      localStorage.removeItem(tokenKey);
      
      // Also clear any other Supabase-related keys that might exist
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
    // Even if there's an error, try to clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('supabase.auth.token');
    }
    throw error;
  }
}

/**
 * Get current authenticated user and session
 * Follows Supabase best practices
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get current session first with timeout
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 3000)
    );
    
    const sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
    
    if (!sessionResult) {
      console.warn('Session check timeout');
      return null;
    }

    const { data: { session }, error: sessionError } = sessionResult;

    if (sessionError) {
      console.error('Session error:', sessionError);
      // Clear invalid session
      await supabase.auth.signOut();
      return null;
    }

    if (!session?.user) {
      return null;
    }

    // Supabase automatically handles token refresh in the background
    // If session exists, it should be valid (or will be refreshed automatically)
    // Only manually refresh if session is clearly expired and Supabase hasn't refreshed it yet
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      // Session expired - Supabase should have refreshed automatically, but try once as fallback
      console.log('Session expired, Supabase should refresh automatically. Attempting manual refresh as fallback...');
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.warn('Failed to refresh expired session, signing out');
          await supabase.auth.signOut();
          return null;
        }
        
        // Use refreshed session
        const refreshedSession = refreshData.session;
        if (!refreshedSession.user) {
          return null;
        }
        
        // Continue with refreshed session
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
      // If profile doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, try to create it using the function
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
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return session;
}

/**
 * Listen to auth state changes
 * Follows Supabase best practices for React
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null, user: User | null) => void
) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    let user: User | null = null;

    if (session?.user) {
      // Fetch user profile when session is available
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        user = userData as User;
      }
    }

    callback(event, session, user);
  });
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(error.message);
  }
  return session;
}

/**
 * Ensure session is valid, refresh if needed
 * Call this before making authenticated API calls
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

    // Supabase automatically refreshes tokens in the background
    // If session exists, it should be valid (or will be refreshed automatically)
    // Only check if session is clearly expired as a fallback
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      // Session expired - Supabase should refresh automatically, but try once as fallback
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
