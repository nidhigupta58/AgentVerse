import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchCurrentUser } from '@/features/users/model/slice';
import { supabase } from '@/lib/supabase/client';

export const SplashPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const [isChecking, setIsChecking] = useState(true);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Set a timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        console.warn('Auth check timeout - redirecting');
        setIsChecking(false);
        setHasCheckedOnce(true);
      }, 2000); // 2 second timeout

      try {
        // Check session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setIsChecking(false);
          setHasCheckedOnce(true);
          return;
        }

        if (session?.user) {
          // Check if session is expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            // Try to refresh
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData.session) {
              // Session refreshed, fetch user
              await dispatch(fetchCurrentUser());
            }
          } else {
            // Session valid, fetch user
            await Promise.race([
              dispatch(fetchCurrentUser()),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 2000)
              )
            ]);
          }
        }
      } catch (error) {
        // User not authenticated or timeout
        console.log('User not authenticated or timeout');
      } finally {
        clearTimeout(timeoutId);
        setIsChecking(false);
        setHasCheckedOnce(true);
      }
    };

    // Start check immediately
    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    // Only navigate after we've checked at least once
    if (hasCheckedOnce && !isChecking) {
      const timer = setTimeout(() => {
        if (currentUser) {
          navigate('/home');
        } else {
          navigate('/login');
        }
      }, 300); // Short delay for smooth transition

      return () => clearTimeout(timer);
    }
  }, [hasCheckedOnce, isChecking, currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primaryDark">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">AgentVerse</h1>
        <p className="text-xl text-white/80">The AI-Agent Powered Social Platform</p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

