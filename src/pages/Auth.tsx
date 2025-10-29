import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SkipToContent } from '@/components/SkipToContent';
import { toast } from 'sonner';
import { z } from 'zod';

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
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the Terms and Privacy Policy'),
  privacyAccepted: z.boolean().refine((val) => val === true, 'You must accept the Privacy Policy'),
  marketingConsent: z.boolean()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const { i18n } = useTranslation();

  // Detect language from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && ['pt', 'en', 'es', 'ar', 'vi'].includes(langParam)) {
      i18n.changeLanguage(langParam);
      localStorage.setItem('app-language', langParam);
    }
  }, [i18n]);

  // Auto-navigate authenticated users
  useEffect(() => {
    if (user) {
      console.log('User authenticated, navigating to dashboard...');
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Validate forgot password form
        const result = forgotPasswordSchema.safeParse({ email });
        
        if (!result.success) {
          const firstError = result.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          toast.error(error.message || 'Failed to send reset email');
        } else {
          toast.success('Password reset email sent! Check your inbox.');
          setIsForgotPassword(false);
          setEmail('');
        }
      } else if (isLogin) {
        // Validate login form
        const result = loginSchema.safeParse({ email, password });
        
        if (!result.success) {
          const firstError = result.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password, rememberMe);
        if (error) {
          toast.error(error.message || 'Failed to sign in');
        } else {
          console.log('Sign in successful, waiting for navigation...');
          toast.success('Welcome back!');
        }
      } else {
        // Validate signup form
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
          fullName,
          country,
          termsAccepted,
          privacyAccepted,
          marketingConsent
        });

        if (!result.success) {
          const firstError = result.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, country, marketingConsent);
        if (error) {
          toast.error(error.message || 'Failed to sign up');
        } else {
          toast.success('Account created successfully!');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <SkipToContent />
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-accent/10 via-transparent to-transparent opacity-50" aria-hidden="true" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-accent/5 rounded-full blur-3xl animate-float" aria-hidden="true" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} aria-hidden="true" />
      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl relative z-10">
        <header className="flex items-center justify-center gap-2 mb-8">
          <Logo size="lg" variant="icon" />
          <h1 className="text-3xl font-bold gradient-text">The Trading Diary</h1>
        </header>

        {isForgotPassword && (
          <Button
            variant="ghost"
            onClick={() => {
              setIsForgotPassword(false);
              setEmail('');
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        )}

        <h2 className="text-2xl font-semibold mb-6 text-center" id="auth-heading">
          {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="auth-heading">
          {!isLogin && !isForgotPassword && (
            <>
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="mt-1"
                  placeholder="John Doe"
                  aria-required={!isLogin}
                />
              </div>

              <div>
                <Label htmlFor="country" className="text-sm font-medium text-foreground">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required={!isLogin}
                  className="mt-1"
                  placeholder="United States"
                  aria-required={!isLogin}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="trader@example.com"
              aria-required="true"
            />
          </div>

          {!isForgotPassword && (
            <>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  minLength={12}
                  aria-required="true"
                  aria-describedby={!isLogin ? "password-requirements" : undefined}
                />
                {!isLogin && (
                  <p id="password-requirements" className="text-xs text-muted-foreground mt-1">
                    12+ characters with uppercase, lowercase, number, and special character
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                    className="mt-1"
                    placeholder="••••••••"
                    minLength={12}
                    aria-required={!isLogin}
                  />
                </div>
              )}
            </>
          )}

          {isForgotPassword && (
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  required
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  I agree to the Terms and Conditions and Privacy Policy. I authorize the collection and use of my trading data (non-personal) for developing reports and analytics.
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                />
                <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  I agree to receive communications and marketing updates about promotions and news from The Trading Diary.
                </Label>
              </div>
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                Keep me logged in
              </Label>
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                required
              />
              <Label htmlFor="privacy" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                I have read and accept the Privacy Policy regarding the collection and use of my personal data.
              </Label>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            aria-busy={loading}
          >
            {loading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        {!isForgotPassword && (
          <>
            <div className="relative my-6" role="separator" aria-label="or">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full border-border hover:bg-accent/50"
              aria-label={`Sign ${isLogin ? 'in' : 'up'} with Google`}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign {isLogin ? 'in' : 'up'} with Google
            </Button>
          </>
        )}

        {!isForgotPassword && (
          <div className="mt-6 text-center space-y-2">
            {isLogin && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;
