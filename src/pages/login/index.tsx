/**
 * Login Page
 * 
 * Modern authentication page with stunning UI featuring:
 * - Animated gradient background
 * - Glassmorphism card effect
 * - Smooth animations and transitions
 * - Enhanced typography and spacing
 * - Responsive design
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { signInUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { BottomNav } from '@/widgets/bottom-nav';
import { RootState } from '@/shared/lib/store';
import { Sparkles } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Animated Gradient Background */}
      <div className="login-gradient-bg" />
      
      {/* Floating Decorative Elements */}
      <div className="login-floating-circle login-circle-1" />
      <div className="login-floating-circle login-circle-2" />
      <div className="login-floating-circle login-circle-3" />
      
      {/* Main Content */}
      <div className="login-content-wrapper">
        <div className="w-full max-w-md login-card-animate">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="text-white mr-2" size={32} />
              <h1 className="text-5xl font-bold text-white login-text-shadow">
                AgentVerse
              </h1>
            </div>
            <h2 className="text-3xl font-semibold text-white mb-2 login-text-shadow">
              Welcome Back!
            </h2>
            <p className="text-white/90 text-lg login-text-shadow">
              Sign in to continue your journey
            </p>
          </div>

          {/* Glassmorphism Form Card */}
          <form onSubmit={handleLogin} className="login-glass-card">
            <div className="space-y-5">
              <Input
                label="Username or Email"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or your@email.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="login-error-message">
                {error}
              </div>
            )}
            {info && (
              <div className="login-info-message">
                {info}
              </div>
            )}

            <Button 
              type="submit" 
              className="login-submit-button" 
              isLoading={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-gray-700 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="login-signup-link">
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </div>
      
      <BottomNav />
      
      <style>{`
        .login-page-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 1rem 4rem 1rem;
        }

        .login-gradient-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          z-index: 0;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-floating-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          animation: float 20s ease-in-out infinite;
          z-index: 1;
        }

        .login-circle-1 {
          width: 300px;
          height: 300px;
          top: -150px;
          right: -150px;
          animation-delay: 0s;
        }

        .login-circle-2 {
          width: 200px;
          height: 200px;
          bottom: -100px;
          left: -100px;
          animation-delay: 5s;
        }

        .login-circle-3 {
          width: 150px;
          height: 150px;
          top: 50%;
          left: -75px;
          animation-delay: 10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        .login-content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 28rem;
          animation: fadeInUp 0.8s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-card-animate {
          animation: scaleIn 0.5s ease-out 0.2s both;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .login-text-shadow {
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .login-glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .login-glass-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35),
                      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
        }

        .login-submit-button {
          width: 100%;
          margin-top: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.875rem 1.5rem;
          font-weight: 600;
          font-size: 1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .login-submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        .login-submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-error-message {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          color: white;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        .login-info-message {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: white;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .login-signup-link {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }

        .login-signup-link:hover {
          color: #764ba2;
        }

        .login-signup-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -2px;
          left: 0;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .login-signup-link:hover::after {
          width: 100%;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .login-glass-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
          }
          
          h1 {
            font-size: 2.5rem;
          }
          
          h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
