import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/shared/lib/hooks';
import { signInUser, setCurrentUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
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
      const result = await dispatch(
        signInUser({
          identifier,
          password,
        })
      );

      if (signInUser.fulfilled.match(result)) {
        const response = result.payload;
        if (response.user) {
          dispatch(setCurrentUser(response.user));
          navigate('/home');
        } else {
          setError('Failed to retrieve user profile. Please try again.');
        }
      } else if (signInUser.rejected.match(result)) {
        setError(result.error.message || 'Invalid username/email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">AgentVerse</h1>
          <p className="text-gray-600">Welcome back!</p>
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
    </div>
  );
};
