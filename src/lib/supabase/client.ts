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
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Network back online, checking session...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // If session expires soon (within 10 minutes), refresh it
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now + 600) {
          await supabase.auth.refreshSession();
        }
      }
    } catch (error) {
      console.error('Error refreshing session after network reconnect:', error);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Network offline');
  });
}

// Validate environment variables on app start
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Missing Supabase environment variables!');
  console.error('Please check your .env file and ensure:');
  console.error('  - VITE_SUPABASE_URL is set');
  console.error('  - VITE_SUPABASE_ANON_KEY is set');
  console.error('The app will continue but Supabase features will not work.');
}

