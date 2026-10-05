import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  LogIn,
  X,
} from 'lucide-react';
import api from '@/api';
import { useAuthStore } from '@/stores/authStore';
import ReCaptchaWidget from '@/components/common/ReCaptchaWidget';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function LoginModalCard({ onClose, onSuccess }: Omit<LoginModalProps, 'isOpen'>) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post('/auth/login', data, {
        headers: { Recaptcha: captchaToken },
      }),
    onSuccess: (response) => {
      setAuth(response.data.user);
      onSuccess?.();
      onClose();
    },
    onError: () => {
      setError('Invalid email or password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email, password });
  };

  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_API_URL + '/api/auth/google';
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-gray-900/20 p-6 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close login"
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/25 mb-3">
          <LogIn className="h-6 w-6 text-white" />
        </div>
        <h2
          id="login-modal-title"
          className="text-xl font-bold text-gray-900 tracking-tight"
        >
          Welcome back
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to check out faster and track your orders.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
            </div>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-11 pr-11 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            onClick={onClose}
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="flex justify-center">
          <ReCaptchaWidget onChange={setCaptchaToken} />
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 active:scale-[0.98] text-sm"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-gray-500">
              or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        New to Dentzoo?{' '}
        <Link
          to="/register"
          onClick={onClose}
          className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors"
        >
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <LoginModalCard onClose={onClose} onSuccess={onSuccess} />
        </div>
      )}
    </AnimatePresence>
  );
}
