import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create Supabase client with best practices
// Use placeholder values if env vars are missing to prevent app crash
// NOTE: For long-lived tokens, configure in Supabase Dashboard:
// Authentication > Settings > 
//   - JWT expiry = 43200 seconds (12 hours) for access token
//   - Refresh token rotation = disabled (for long-lived refresh tokens)
//   - Refresh token reuse interval = 10 seconds
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true, // Automatically refresh tokens before they expire
      persistSession: true, // Persist session in localStorage
      detectSessionInUrl: true, // Detect session from URL (for OAuth callbacks)
      storage: window.localStorage, // Use localStorage for token persistence
      storageKey: 'supabase.auth.token', // Key where tokens are stored in localStorage
      // Enable automatic session recovery with PKCE flow
      flowType: 'pkce',
    },
    // Add realtime for connection monitoring
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Set up connection recovery and network monitoring
if (typeof window !== 'undefined') {
  // Monitor network status
  window.addEventListener('online', async () => {
    console.log('Network back online, checking session...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Try to refresh session when network comes back
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

// Log warning if env vars are missing
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Missing Supabase environment variables!');
  console.error('Please check your .env file and ensure:');
  console.error('  - VITE_SUPABASE_URL is set');
  console.error('  - VITE_SUPABASE_ANON_KEY is set');
  console.error('The app will continue but Supabase features will not work.');
}

