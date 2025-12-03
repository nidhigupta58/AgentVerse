/**
 * Login Page - Nebula Interface
 * 
 * A futuristic, immersive login experience featuring:
 * - Fluid animated background
 * - 3D interactive tilt effect
 * - Holographic glassmorphism
 * - Dark mode aesthetics
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { signInUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { BottomNav } from '@/widgets/bottom-nav';
import { RootState } from '@/shared/lib/store';
import { Sparkles, Zap } from 'lucide-react';

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
  
  // 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Handle 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
    const rotateY = ((x - centerX) / centerX) * 5;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

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
    <div className="nebula-container" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Fluid Background */}
      <div className="nebula-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="grid-overlay"></div>
      </div>
      
      {/* 3D Tilt Card Container */}
      <div className="content-wrapper">
        <div 
          ref={cardRef}
          className="holographic-card"
          style={{
            transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {/* Header Section */}
          <div className="text-center mb-8 relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="icon-glow-container">
                <Zap className="text-cyan-400" size={32} />
              </div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 ml-3 tracking-tight">
                AgentVerse
              </h1>
            </div>
            <p className="text-blue-200/80 text-lg font-light tracking-wide">
              Welcome Back!
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-5">
              <Input
                label="Username or Email"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or your@email.com"
                variant="glass-dark"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                variant="glass-dark"
                required
              />
            </div>

            {error && (
              <div className="error-glass">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            {info && (
              <div className="info-glass">
                <span className="mr-2">ℹ️</span> {info}
              </div>
            )}

            <button 
              type="submit" 
              className="cyber-button w-full" 
              disabled={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Sparkles className="animate-spin" size={18} />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <Zap size={18} className="ml-1" />
                  </>
                )}
              </span>
              <div className="cyber-button-glitch"></div>
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-blue-300/60">
                New user?{' '}
                <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium hover:underline decoration-cyan-400/50 underline-offset-4">
                  Create account
                </Link>
              </p>
            </div>
          </form>
          
          {/* Card Shine Effect */}
          <div 
            className="card-shine"
            style={{
              background: `radial-gradient(circle at ${50 - rotation.y * 3}% ${50 - rotation.x * 3}%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            }}
          />
        </div>
      </div>
      
      <div className="fixed bottom-0 w-full z-50">
        <BottomNav />
      </div>
      
      <style>{`
        .nebula-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050510;
          padding-bottom: 4rem;
          padding-top: 5rem;
        }

        /* Fluid Background Animation */
        .nebula-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          animation: floatBlob 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }

        .blob-1 {
          top: -10%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          background: #4f46e5;
          animation-delay: 0s;
        }

        .blob-2 {
          bottom: -10%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: #7c3aed;
          animation-delay: -5s;
        }

        .blob-3 {
          top: 40%;
          left: 40%;
          width: 40vw;
          height: 40vw;
          background: #2563eb;
          animation-delay: -10s;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
        }

        @keyframes floatBlob {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, 20px) scale(1.1); }
        }

        /* Holographic Card */
        .content-wrapper {
          z-index: 10;
          padding: 20px;
          width: 100%;
          max-width: 480px;
        }

        .holographic-card {
          background: rgba(10, 10, 25, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          transition: transform 0.1s ease-out;
          transform-style: preserve-3d;
        }

        .card-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
          mix-blend-mode: overlay;
        }

        .icon-glow-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.2);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
        }

        /* Cyber Button */
        .cyber-button {
          position: relative;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          color: white;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          letter-spacing: 0.5px;
          border: none;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.4);
        }

        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.5s;
        }

        .cyber-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(79, 70, 229, 0.6);
        }

        .cyber-button:hover::before {
          left: 100%;
        }

        .cyber-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Messages */
        .error-glass {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          animation: slideIn 0.3s ease-out;
        }

        .info-glass {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Optimization */
        @media (max-width: 640px) {
          .holographic-card {
            padding: 2rem 1.5rem;
            transform: none !important; /* Disable 3D tilt on mobile */
          }
          
          .nebula-bg {
            /* Simplify background on mobile */
            background: linear-gradient(to bottom right, #0f172a, #1e1b4b);
          }
          
          .blob {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
