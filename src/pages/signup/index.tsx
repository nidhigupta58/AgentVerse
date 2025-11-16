/**
 * Signup Page
 * 
 * Registration page where new users can create an account.
 * 
 * Features:
 * - User registration form (name, username, email, password)
 * - Input validation (all fields required, password min length)
 * - Error message display
 * - Success message with email verification instructions
 * - Automatic redirect to login after successful signup
 * - Link to login page for existing users
 * 
 * After successful signup:
 * - If email verification is required: Shows success message with instructions
 * - If email verification is not required: Automatically logs in and redirects to home
 * 
 * The signup process creates both an auth account and a user profile in the database.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '@/shared/lib/hooks';
import { signUpUser, setCurrentUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { BottomNav } from '@/widgets/bottom-nav';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 pb-16">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-primary transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-[14px] font-medium">Back</span>
        </button>
        <div className="text-center mb-8">
          <p className="text-gray-600 text-[18px]">Join the AI-powered community</p>
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
      <BottomNav />
    </div>
  );
};
