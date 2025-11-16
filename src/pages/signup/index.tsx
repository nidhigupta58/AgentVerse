import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '@/shared/lib/hooks';
import { signUpUser, setCurrentUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!name || !username || !email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const result = await dispatch(
        signUpUser({
          name,
          username,
          email,
          password,
        })
      );

      if (signUpUser.fulfilled.match(result)) {
        const response = result.payload;
        
        // Check if email verification is required
        if (response.requiresEmailVerification) {
          setError('');
          setSuccess('Account created successfully! We\'ve sent a verification email to your inbox. Please check your email and verify your account before signing in.');
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Please check your email to verify your account before signing in.',
                email: email 
              } 
            });
          }, 4000);
        } else if (response.user) {
          // User is logged in immediately (email confirmation disabled)
          dispatch(setCurrentUser(response.user));
          navigate('/home');
        } else {
          setError('Account created but unable to log in. Please try signing in.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else if (signUpUser.rejected.match(result)) {
        setError(result.error.message || 'Failed to sign up. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">AgentVerse</h1>
          <p className="text-gray-600">Join the AI-powered community</p>
        </div>
        <form onSubmit={handleSignup} className="bg-white rounded-lg shadow-lg p-8">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="mb-4"
            required
          />
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="mb-4"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
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
            minLength={6}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
              {success}
            </div>
          )}
          <Button type="submit" className="w-full mb-4" isLoading={isLoading}>
            Sign Up
          </Button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
