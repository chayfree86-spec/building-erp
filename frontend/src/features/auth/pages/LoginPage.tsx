import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { Eye, EyeOff, Loader2, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  login: z.string().min(1, 'Email or mobile is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: 'admin@buildingerp.com', password: 'password' },
  });

  // Load saved login on mount
  useEffect(() => {
    const saved = localStorage.getItem('remembered_login');
    if (saved) {
      setValue('login', saved);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      if (rememberMe) {
        localStorage.setItem('remembered_login', data.login);
      } else {
        localStorage.removeItem('remembered_login');
      }
      await login(data.login, data.password);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { toast.error('Please enter your email or mobile number'); return; }
    setForgotLoading(true);
    try {
      // Simulate API call — replace with actual endpoint when available
      await new Promise(resolve => setTimeout(resolve, 1500));
      setForgotSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch {
      toast.error('Failed to send reset link. Try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute bottom-40 right-10 w-60 h-60 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Build ERP" className="w-12 h-12 rounded-2xl object-contain bg-white/20" />
            <h1 className="text-2xl font-bold text-white">Build ERP</h1>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Building Materials<br />Management System
          </h2>
          <p className="mt-4 text-blue-100 text-lg max-w-md">
            Complete multi-store ERP for cement, steel, tiles, bricks, hardware and more.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { label: 'Multi Store', desc: 'Manage all locations' },
            { label: 'Real-time Stock', desc: 'FIFO batch tracking' },
            { label: 'Smart Billing', desc: 'Fast counter sales' },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-white font-semibold text-sm">{f.label}</p>
              <p className="text-blue-200 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        {forgotOpen ? (
          /* ─── Forgot Password View ─── */
          <div className="w-full max-w-md">
            {forgotSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Check Your Email</h2>
                <p className="text-neutral-500 mb-6">We've sent a password reset link to <strong>{forgotEmail}</strong></p>
                <button onClick={() => { setForgotOpen(false); setForgotSent(false); }} className="btn-primary w-full !py-3">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setForgotOpen(false)} className="btn-ghost mb-6 !px-0">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-neutral-900">Forgot Password?</h2>
                  <p className="text-neutral-500 mt-1">Enter your email or mobile to receive a reset link</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">Email or Mobile Number</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        type="text"
                        placeholder="admin@buildingerp.com"
                        className="input-field pl-10"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button onClick={handleForgotPassword} disabled={forgotLoading} className="btn-primary w-full !py-3">
                    {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ─── Login View ─── */
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <img src="/logo.png" alt="Build ERP" className="w-10 h-10 rounded-xl object-contain" />
              <h1 className="text-xl font-bold text-neutral-900">Build ERP</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900">Welcome back</h2>
              <p className="text-neutral-500 mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email or Mobile Number</label>
                <input {...register('login')} type="text" placeholder="Enter email or mobile" className="input-field" autoComplete="username" autoFocus />
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="input-field pr-10" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-600">Remember me</span>
                </label>
                <button type="button" onClick={() => { setForgotEmail(''); setForgotOpen(true); }} className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
