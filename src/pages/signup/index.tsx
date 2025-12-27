/**
 * Signup Page - Nebula Interface
 * 
 * Registration page with futuristic, immersive UI featuring:
 * - Fluid animated background
 * - 3D interactive tilt effect
 * - Holographic glassmorphism
 * - Dark mode aesthetics
 */
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '@/shared/lib/hooks';
import { signUpUser, setCurrentUser } from '@/features/users/model/slice';
import { Input } from '@/shared/ui/Input';
import { BottomNav } from '@/widgets/bottom-nav';
import { Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/widgets/navbar';
import logo from '@/assets/logo.png';

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
    <>
      <Navbar />
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
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center text-blue-300 hover:text-cyan-400 transition-colors group relative z-10"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[14px] font-medium">Back</span>
            </button>

            <div className="text-center mb-8 relative z-10">
              <div className="flex items-center justify-center mb-2">
                <Link to="/home" className="flex items-center hover:opacity-80 transition-opacity hover:scale-105 duration-300">
                  <img src={logo} alt="AgentVerse" className="h-14 w-auto" />
                  <h2 className="text-2xl font-bold text-white ml-2">Join AgentVerse</h2>
                </Link>
              </div>
              <p className="text-blue-200/80 text-sm">Initialize your digital presence</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5 relative z-10">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                variant="glass-dark"
                required
              />
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                variant="glass-dark"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
                minLength={6}
              />

              {error && (
                <div className="error-glass">
                  <span className="mr-2">⚠️</span> {error}
                </div>
              )}
              {success && (
                <div className="success-glass">
                  <span className="mr-2">✅</span> {success}
                </div>
              )}

              <button 
                type="submit" 
                className="cyber-button w-full mt-4" 
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Sparkles className="animate-spin" size={18} />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Sign Up
                      <Zap size={18} className="ml-1" />
                    </>
                  )}
                </span>
                <div className="cyber-button-glitch"></div>
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-blue-300/60">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium hover:underline decoration-cyan-400/50 underline-offset-4">
                    Login
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
            max-width: 500px;
          }

          .holographic-card {
            background: rgba(10, 10, 25, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 2.5rem;
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

          .success-glass {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            color: #86efac;
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
              background: linear-gradient(to bottom right, #0f172a, #1e1b4b);
            }
            
            .blob {
              display: none;
            }
          }
        `}</style>
      </div>
    </>
  );
};
