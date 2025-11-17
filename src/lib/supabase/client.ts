/**
 * Supabase Client Configuration
 * 
 * This file creates and configures the Supabase client, which is our connection
 * to the backend database and authentication service. Think of it as the bridge
 * between our React app and our Supabase backend.
 * 
 * Key Features Configured:
 * - Auto token refresh: Tokens are automatically refreshed before they expire
 * - Session persistence: User stays logged in even after closing the browser
 * - PKCE flow: Secure authentication flow for better security
 * - Network recovery: Automatically handles network reconnection
 * 
 * The client reads configuration from environment variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your public API key (safe to expose in frontend)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Create Supabase Client Instance
 * 
 * This is the main client that all other parts of the app use to interact
 * with Supabase. It's configured with:
 * 
 * Auth Settings:
 * - autoRefreshToken: Tokens refresh automatically in the background
 * - persistSession: Saves session to localStorage so users stay logged in
 * - detectSessionInUrl: Handles OAuth callbacks from email verification
 * - flowType: 'pkce' - Uses secure PKCE flow for authentication
 * 
 * Realtime Settings:
 * - Configured for real-time features (if needed in future)
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    db: {
      // By default, Supabase exposes the 'public' schema. If your tables are in
      // other schemas, you need to specify them here.
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Network Status Monitoring
 * 
 * When the user's internet connection drops and comes back, we need to
 * verify their session is still valid. This listener automatically checks
 * and refreshes the session when the network reconnects.
 */

/**
 * A custom event to signal that the user's session has become invalid.
 * The UI layer can listen for this event to redirect to the login page.
 * 
 * @example
 * window.addEventListener('sessionInvalidated', () => {
 *   // Redirect to login page
 *   window.location.href = '/login';
 * });
 */
export const sessionInvalidatedEvent = new Event('sessionInvalidated');

/**
 * Proactively refreshes the session if it's nearing expiration.
 * This function is designed to be called when the app regains focus or network.
 */
const refreshSessionIfNeeded = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session found. User is likely logged out.');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes

    // If the token expires within the threshold or has already expired, refresh it.
    if (expiresAt && expiresAt < now + REFRESH_THRESHOLD_SECONDS) {
      console.log('Session is nearing expiration or has expired. Refreshing...');
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error.message);
        // If the refresh fails, the session is truly invalid.
        // Sign the user out and dispatch an event for the UI to handle.
        await supabase.auth.signOut();
        window.dispatchEvent(sessionInvalidatedEvent);
      } else {
        console.log('Session refreshed successfully.');
      }
    } else {
      const expiresIn = expiresAt ? Math.round((expiresAt - now) / 60) : 0;
      console.log(`Session is still valid. Expires in ~${expiresIn} minutes.`);
    }
  } catch (error) {
    console.error('Error checking or refreshing session:', error);
  }
};


/**
 * Event Listeners for Session Management
 * 
 * These listeners handle scenarios where the app might lose and regain
 * connectivity or focus, ensuring the user's session remains active.
 */
if (typeof window !== 'undefined') {
  // 1. Listen for when the app tab becomes visible again
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('Tab is visible again, checking session...');
      refreshSessionIfNeeded();
    }
  });

  // 2. Listen for when the user comes back online
  window.addEventListener('online', () => {
    console.log('Network back online, checking session...');
    refreshSessionIfNeeded();
  });

  window.addEventListener('offline', () => {
    console.log('Network offline');
  });
}

// Validate environment variables on app start
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'FATAL: Missing Supabase environment variables. Please check your .env file.'
  );
}
