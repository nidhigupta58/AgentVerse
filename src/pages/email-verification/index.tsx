/**
 * Email Verification Page
 * 
 * Handles email verification after user signup. This page processes the
 * verification token sent via email and completes the signup process.
 * 
 * Features:
 * - Extracts verification token from URL (query params or hash)
 * - Verifies email using Supabase OTP verification
 * - Shows verification status (verifying, success, error)
 * - Automatic redirect after successful verification
 * - User-friendly error messages
 * - Link to login page if verification fails
 * 
 * Flow:
 * 1. Extract token and type from URL (Supabase redirects here after email click)
 * 2. Call Supabase verifyOtp with the token
 * 3. If successful: Fetch user profile and redirect to home
 * 4. If failed: Show error message with retry option
 * 
 * The page handles both query parameter and hash-based token formats,
 * as Supabase may use either depending on the configuration.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch } from '@/shared/lib/hooks';
import { fetchCurrentUser } from '@/features/users/model/slice';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';

export const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      // Supabase redirects with token and type in URL hash or query params
      const token = searchParams.get('token_hash') || searchParams.get('token');
      const type = searchParams.get('type');

      // Also check URL hash (Supabase sometimes uses hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get('token_hash') || hashParams.get('access_token');
      const hashType = hashParams.get('type');

      const finalToken = token || hashToken;
      const finalType = type || hashType;

      if (finalType === 'signup' && finalToken) {
        try {
          setStatus('verifying');
          setMessage('Verifying your email...');

          // Verify the email using OTP
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: finalToken,
            type: 'signup',
          });

          if (error) {
            setStatus('error');
            setMessage(error.message || 'Verification failed. The link may have expired.');
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email verified successfully! Your account is now active.');

            // Create user profile if it doesn't exist
            try {
              const { data: profileData } = await supabase.rpc('create_user_profile', {
                p_user_id: data.user.id,
                p_email: data.user.email || '',
                p_username: data.user.user_metadata?.username || '',
                p_name: data.user.user_metadata?.name || '',
              });

              if (profileData && profileData.length > 0) {
                console.log('Profile created:', profileData[0]);
              }
            } catch (profileError) {
              console.warn('Profile creation warning:', profileError);
              // Continue anyway - trigger might create it
            }

            // Fetch user profile
            await dispatch(fetchCurrentUser());
            
            // Redirect to home after 2 seconds
            setTimeout(() => {
              navigate('/home');
            }, 2000);
          }
        } catch (err: unknown) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'Verification failed. Please try again.');
        }
      } else {
        // Check if user is already verified (session exists)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setMessage('Your email is already verified!');
          await dispatch(fetchCurrentUser());
          setTimeout(() => {
            navigate('/home');
          }, 2000);
        } else {
          // No token, show info message
          setStatus('success');
          setMessage('Please check your email and click the verification link to activate your account.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="text-center p-8">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-text mb-2">Verifying Email</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-text mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to home page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-text mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <Link to="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" className="w-full">
                    Sign Up Again
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

