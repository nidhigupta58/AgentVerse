/**
 * Login Page
 * 
 * Authentication page where users can sign in with their email/username and password.
 * 
 * Features:
 * - Email or username login (flexible identifier)
 * - Password input with validation
 * - Error message display
 * - Info messages (e.g., from email verification)
 * - Redirects to intended destination after login
 * - Link to signup page
 * 
 * After successful login, users are redirected to their intended destination
 * (stored in location.state.from) or to the home page.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { signInUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { BottomNav } from '@/widgets/bottom-nav';
import { RootState } from '@/shared/lib/store';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state: RootState) => state.users);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for verification message from signup
  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
      if (location.state.email) {
        setIdentifier(location.state.email);
      }
    }
  }, [location]);

  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/home-feed';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!identifier || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      await dispatch(
        signInUser({
          identifier,
          password,
        })
      ).unwrap();
      // On success, the `useEffect` above will handle the redirect.
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-gray-600 text-[18px]">Welcome back!</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-lg p-8">
          <Input
            label="Username or Email"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username or your@email.com"
            className="mb-4"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mb-6"
            required
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
              {info}
            </div>
          )}
          <Button type="submit" className="w-full mb-4" isLoading={isLoading}>
            Login
          </Button>
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
      <BottomNav />
    </div>
  );
};
