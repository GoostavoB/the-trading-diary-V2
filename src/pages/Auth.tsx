import { useState, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { SkipToContent } from '@/components/SkipToContent';
import { toast } from 'sonner';
import { z } from 'zod';
import { LineChart, Mail, Lock, User, Globe, Gift, AlertCircle, ArrowLeft } from 'lucide-react';

const passwordValidation = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email is too long')
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email is too long'),
  password: passwordValidation,
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name is required').max(100, 'Name is too long'),
  country: z.string().min(2, 'Please select your country').max(100, 'Country name is too long'),
  inviteCode: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the Terms and Privacy Policy'),
  privacyAccepted: z.boolean().refine((val) => val === true, 'You must accept the Privacy Policy'),
  marketingConsent: z.boolean()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { i18n } = useTranslation();

  // Detect language + mode from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const modeParam = urlParams.get('mode');

    if (langParam && ['pt', 'en', 'es', 'ar', 'vi'].includes(langParam)) {
      i18n.changeLanguage(langParam);
      localStorage.setItem('app-language', langParam);
    }

    if (modeParam === 'signup') {
      setIsLogin(false);
    } else if (modeParam === 'login') {
      setIsLogin(true);
    }
  }, [i18n]);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
    toast.error(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        const result = forgotPasswordSchema.safeParse({ email });

        if (!result.success) {
          const firstError = result.error.errors[0];
          triggerError(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          triggerError(error.message || 'Failed to send reset email');
        } else {
          toast.success('Password reset email sent! Check your inbox.');
          setIsForgotPassword(false);
          setEmail('');
        }
      } else if (isLogin) {
        const result = loginSchema.safeParse({ email, password });

        if (!result.success) {
          const firstError = result.error.errors[0];
          triggerError(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password, rememberMe);
        if (error) {
          triggerError(error.message || 'Failed to sign in');
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
          fullName,
          country,
          inviteCode,
          termsAccepted,
          privacyAccepted,
          marketingConsent
        });

        if (!result.success) {
          const firstError = result.error.errors[0];
          triggerError(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, country, marketingConsent, inviteCode);
        if (error) {
          triggerError(error.message || 'Failed to sign up');
        } else {
          toast.success('Account created successfully!');
        }
      }
    } catch (error) {
      triggerError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLogin && inviteCode?.trim()) {
      localStorage.setItem('pendingInviteCode', inviteCode.trim().toUpperCase());
    }
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      triggerError(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const inputCls =
    'w-full h-11 px-3.5 rounded-ios bg-space-600/60 border border-space-500 text-space-100 placeholder:text-space-400 focus:border-electric focus:shadow-electric focus:outline-none transition-all';

  const primaryLabel = loading
    ? (isForgotPassword ? 'Sending…' : isLogin ? 'Signing in…' : 'Creating account…')
    : (isForgotPassword ? 'Send reset link' : isLogin ? 'Sign in' : 'Create account');

  const title = isForgotPassword
    ? 'Reset your password.'
    : isLogin
      ? 'Welcome back.'
      : 'Create your account.';

  const subtitle = isForgotPassword
    ? 'Enter your email and we will send you a recovery link.'
    : isLogin
      ? 'Sign in to continue tracking your trades.'
      : 'Start journaling your trades in minutes.';

  return (
    <>
      <SEO
        title="Sign In - The Trading Diary"
        description="Sign in to your Trading Diary account to access your trades, analytics, and journal."
        noindex={true}
      />

      <div className="min-h-screen w-full bg-space-900 relative overflow-hidden flex items-center justify-center px-4 py-12">
        <SkipToContent />

        {/* Ambient electric-blue glow */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 top-[-120px] w-[600px] h-[600px] rounded-full bg-electric/15 blur-[120px] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-space-900 pointer-events-none"
        />

        {/* Auth card */}
        <div
          className={`card-premium rounded-ios-sheet relative z-10 w-full max-w-[440px] p-8 md:p-10 animate-fade-in ${shake ? 'animate-shake' : ''}`}
        >
          {/* Logo + product name */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-ios bg-electric/15 border border-electric/30 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-electric" />
            </div>
            <span className="text-sm font-medium text-space-100">The Trading Diary</span>
          </div>

          {/* Tab toggle — not shown during forgot-password */}
          {!isForgotPassword && (
            <div className="glass-thin rounded-ios p-1 flex items-center mb-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(null); }}
                className={`flex-1 h-9 text-sm font-medium rounded-[8px] transition-all ${
                  isLogin ? 'bg-space-600 text-space-100 shadow-premium-sm' : 'text-space-300 hover:text-space-100'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(null); }}
                className={`flex-1 h-9 text-sm font-medium rounded-[8px] transition-all ${
                  !isLogin ? 'bg-space-600 text-space-100 shadow-premium-sm' : 'text-space-300 hover:text-space-100'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {/* Title + subtitle */}
          <div className="mb-6">
            <h1 id="auth-heading" className="font-display text-2xl font-semibold text-space-100 tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-space-300 mt-1.5">{subtitle}</p>
          </div>

          {/* Back button for forgot-password */}
          {isForgotPassword && (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setEmail('');
                setErrorMsg(null);
              }}
              className="flex items-center gap-1.5 text-xs text-electric hover:text-electric-bright mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </button>
          )}

          {/* Error chip */}
          {errorMsg && (
            <div className="chip-red mb-4 w-full py-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs leading-tight">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="auth-heading">
            {!isLogin && !isForgotPassword && (
              <>
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-space-200 mb-1.5">
                    Invite code <span className="text-space-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400 pointer-events-none" />
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className={inputCls + ' pl-10'}
                      placeholder="HORISTIC"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-space-200 mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400 pointer-events-none" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className={inputCls + ' pl-10'}
                      placeholder="John Doe"
                      aria-required="true"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-space-200 mb-1.5">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400 pointer-events-none" />
                    <input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className={inputCls + ' pl-10'}
                      placeholder="United States"
                      aria-required="true"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-space-200 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputCls + ' pl-10'}
                  placeholder="you@example.com"
                  aria-required="true"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-space-200">
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setErrorMsg(null); }}
                        className="text-xs text-electric hover:text-electric-bright transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400 pointer-events-none" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputCls + ' pl-10'}
                      placeholder="••••••••••••"
                      minLength={isLogin ? 6 : 12}
                      aria-required="true"
                      aria-describedby={!isLogin ? 'password-requirements' : undefined}
                    />
                  </div>
                  {!isLogin && (
                    <p id="password-requirements" className="text-xs text-space-400 mt-1.5">
                      Min 12 characters, with upper, lower, number, and symbol.
                    </p>
                  )}
                </div>

                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-space-200 mb-1.5">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400 pointer-events-none" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={inputCls + ' pl-10'}
                        placeholder="••••••••••••"
                        minLength={12}
                        aria-required="true"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Signup consents */}
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="mt-0.5 accent-electric"
                  />
                  <span className="text-xs text-space-300 group-hover:text-space-200 transition-colors leading-relaxed">
                    I accept the Terms of Service and consent to non-personal trading data collection for analytics.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    required
                    className="mt-0.5 accent-electric"
                  />
                  <span className="text-xs text-space-300 group-hover:text-space-200 transition-colors leading-relaxed">
                    I accept the Privacy Policy and personal data processing.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 accent-electric"
                  />
                  <span className="text-xs text-space-300 group-hover:text-space-200 transition-colors leading-relaxed">
                    Send me product updates and marketing emails.
                  </span>
                </label>
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <label className="flex items-center gap-2 text-sm text-space-300 hover:text-space-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-electric"
                />
                Keep me signed in
              </label>
            )}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 text-sm font-medium"
              aria-busy={loading}
            >
              {primaryLabel}
            </button>
          </form>

          {/* Divider + Google */}
          {!isForgotPassword && (
            <>
              <div className="flex items-center gap-3 my-5">
                <hr className="flex-1 border-space-500" />
                <span className="text-xs text-space-400">or</span>
                <hr className="flex-1 border-space-500" />
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn-secondary w-full h-11 text-sm font-medium flex items-center justify-center gap-2.5"
                aria-label={`Sign ${isLogin ? 'in' : 'up'} with Google`}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Footer switch link */}
          {!isForgotPassword && (
            <p className="text-sm text-space-300 text-center mt-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
                className="text-electric hover:text-electric-bright font-medium transition-colors"
              >
                {isLogin ? 'Sign up free →' : 'Sign in →'}
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Auth;
