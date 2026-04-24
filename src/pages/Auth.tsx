import { useState, useEffect, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
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
  inviteCode: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the Terms and Privacy Policy'),
  privacyAccepted: z.boolean().refine((val) => val === true, 'You must accept the Privacy Policy'),
  marketingConsent: z.boolean()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const pad = (n: number) => n.toString().padStart(2, '0');
const stamp = (d: Date = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// ── ASCII wireframe cube as decorative background ──
const ASCII_BG = `
           ┌──────────────────────────┐
          ╱│                         ╱│
         ╱ │                        ╱ │
        ╱  │     T R A D I N G     ╱  │
       ╱   │                      ╱   │
      ┌──────────────────────────┐    │
      │    │     D I A R Y       │    │
      │    │                     │    │
      │    └─────────────────────│────┘
      │   ╱                      │   ╱
      │  ╱    SECURE CONSOLE     │  ╱
      │ ╱                        │ ╱
      │╱                         │╱
      └──────────────────────────┘

   01001000 01000001 01000011 01001011
   11010010 01011011 10010110 10110101
   0xFF 0xAE 0x3C 0x91 0x7B 0x2D 0xC0

       >  AUTHENTICATED_SESSION_INIT
       >  KEY_EXCHANGE__OK
       >  CHANNEL_ENCRYPTED__OK
`;

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

  // Boot timestamps for the session log
  const bootStamp = useMemo(() => stamp(), []);
  const [latestLog, setLatestLog] = useState<string | null>(null);

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
    setLatestLog(`[${stamp()}] auth_failed :: ${msg.toLowerCase().slice(0, 60)}`);
    window.setTimeout(() => setShake(false), 500);
    toast.error(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    setLatestLog(`[${stamp()}] transmitting credentials...`);

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
          setLatestLog(`[${stamp()}] reset_link_dispatched :: ok`);
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
          setLatestLog(`[${stamp()}] access_granted :: session established`);
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
          setLatestLog(`[${stamp()}] operator_provisioned :: ok`);
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
    setLatestLog(`[${stamp()}] sso_bypass :: google`);
    const { error } = await signInWithGoogle();
    if (error) {
      triggerError(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-carbon border border-phosphor-dim text-phosphor font-mono px-3 py-2 focus:border-phosphor focus:shadow-phosphor focus:outline-none transition-all";

  const primaryLabel = loading
    ? (isForgotPassword ? '[ DISPATCHING... ]' : isLogin ? '[ AUTHENTICATING... ]' : '[ PROVISIONING... ]')
    : (isForgotPassword ? '[ SEND_RESET_LINK ]' : isLogin ? '[ AUTHENTICATE ]' : '[ CREATE_ACCOUNT ]');

  return (
    <>
    <SEO
      title="Sign In - The Trading Diary"
      description="Sign in to your Trading Diary account to access your trades, analytics, and journal."
      noindex={true}
    />
    <div className="min-h-screen w-full bg-void relative overflow-hidden flex items-center justify-center px-4 py-10 scanlines">
      <SkipToContent />

      {/* ── Decorative ASCII wireframe backdrop ── */}
      <pre
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-phosphor font-mono text-[10px] leading-[1.1] whitespace-pre opacity-[0.06] pointer-events-none select-none animate-flicker"
      >
        {ASCII_BG}
      </pre>

      {/* ── Terminal card ── */}
      <div
        className={`term-card hud-corners relative z-10 w-full max-w-[580px] p-0 animate-fade-in ${shake ? 'animate-shake' : ''}`}
      >
        <span className="hud-c tl" />
        <span className="hud-c tr" />
        <span className="hud-c bl" />
        <span className="hud-c br" />

        {/* Title bar */}
        <div className="term-header justify-between">
          <span className="text-amber-term">AUTH://TRADING-DIARY</span>
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="pulse-dot amber" />
            <span className="pulse-dot danger" />
          </div>
        </div>

        {/* Scan bar */}
        <div className="relative h-[2px] overflow-hidden">
          <div className="scan-bar absolute inset-0" />
        </div>

        <div className="p-6 md:p-8 space-y-5">

          {/* Boot sequence */}
          <div className="space-y-1 text-xs">
            <div className="term-stream animate-slide-up" style={{ animationDelay: '100ms' }}>
              <span className="prompt" />
              <span className="text-phosphor-dim">initialize --auth-session</span>
            </div>
            <div className="term-stream animate-slide-up" style={{ animationDelay: '200ms' }}>
              <span className="ok">[OK]</span>{' '}
              <span className="text-phosphor-dim">connection secured</span>
            </div>
            <div className="term-stream animate-slide-up" style={{ animationDelay: '300ms' }}>
              <span className="ok">[OK]</span>{' '}
              <span className="text-phosphor-dim">key exchange complete</span>
            </div>
          </div>

          {/* Tab selector */}
          {!isForgotPassword && (
            <div className="flex items-center gap-4 border-b border-phosphor-dim pb-2 text-xs tracking-widest font-display">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`transition-colors ${isLogin ? 'text-phosphor underline' : 'text-phosphor-dim hover:text-phosphor'}`}
              >
                [LOGIN]
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`transition-colors ${!isLogin ? 'text-phosphor underline' : 'text-phosphor-dim hover:text-phosphor'}`}
              >
                [REGISTER]
              </button>
              <span className="ml-auto text-[10px] text-phosphor-dim">
                MODE: <span className="text-amber-term">{isLogin ? 'AUTH' : 'PROVISION'}</span>
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <h1
              id="auth-heading"
              className="font-display text-2xl text-phosphor chromatic cursor-blink"
            >
              {isForgotPassword ? 'RESET VECTOR REQUIRED' : 'AUTHENTICATION REQUIRED'}
            </h1>
            <div className="mt-1 border-t border-phosphor-dim" />
            <p className="text-[11px] tracking-widest text-phosphor-dim mt-2 uppercase">
              {isForgotPassword
                ? '// recovery link will be transmitted'
                : isLogin
                  ? '// authorized operators only'
                  : '// provisioning new operator'}
            </p>
          </div>

          {/* Error panel */}
          {errorMsg && (
            <div className="hud-panel-danger p-3 text-xs flex items-start gap-2">
              <span className="status-pill danger shrink-0">
                <span className="pulse-dot danger" />
                ERR
              </span>
              <div className="flex-1">
                <span className="text-danger font-display text-[11px] tracking-widest block mb-0.5">[!] AUTH_FAILURE</span>
                <span className="text-phosphor-dim">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Forgot password back button */}
          {isForgotPassword && (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setEmail('');
                setErrorMsg(null);
              }}
              className="text-xs text-phosphor-dim hover:text-phosphor tracking-widest uppercase font-display"
            >
              {'<< RETURN_TO_AUTH'}
            </button>
          )}

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="auth-heading">

            {!isLogin && !isForgotPassword && (
              <>
                <div className="space-y-1">
                  <label htmlFor="inviteCode" className="text-xs tracking-widest font-display text-amber-term block">
                    INVITE_CODE <span className="text-phosphor-dim">// optional</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-phosphor-dim">&gt; [</span>
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className={inputCls}
                      placeholder="HORISTIC"
                    />
                    <span className="text-phosphor-dim">]</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="fullName" className="text-xs tracking-widest font-display text-amber-term block">
                    OPERATOR_NAME
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-phosphor-dim">&gt; [</span>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className={inputCls}
                      placeholder="John Doe"
                      aria-required={!isLogin}
                    />
                    <span className="text-phosphor-dim">]</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="country" className="text-xs tracking-widest font-display text-amber-term block">
                    JURISDICTION
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-phosphor-dim">&gt; [</span>
                    <input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required={!isLogin}
                      className={inputCls}
                      placeholder="United States"
                      aria-required={!isLogin}
                    />
                    <span className="text-phosphor-dim">]</span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs tracking-widest font-display text-amber-term block">
                OPERATOR_ID
              </label>
              <div className="flex items-center gap-2">
                <span className="text-phosphor-dim">&gt; [</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="trader@example.com"
                  aria-required="true"
                />
                <span className="text-phosphor-dim">]</span>
              </div>
            </div>

            {!isForgotPassword && (
              <>
                <div className="space-y-1">
                  <label htmlFor="password" className="text-xs tracking-widest font-display text-amber-term block">
                    PASSPHRASE
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-phosphor-dim">&gt; [</span>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputCls}
                      placeholder="************"
                      minLength={isLogin ? 6 : 12}
                      aria-required="true"
                      aria-describedby={!isLogin ? "password-requirements" : undefined}
                    />
                    <span className="text-phosphor-dim">]</span>
                  </div>
                  {!isLogin && (
                    <p id="password-requirements" className="text-[10px] tracking-wide text-phosphor-dim mt-1">
                      // min 12 chars / UPPER / lower / 0-9 / special
                    </p>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="text-xs tracking-widest font-display text-amber-term block">
                      CONFIRM_PASSPHRASE
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-phosphor-dim">&gt; [</span>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!isLogin}
                        className={inputCls}
                        placeholder="************"
                        minLength={12}
                        aria-required={!isLogin}
                      />
                      <span className="text-phosphor-dim">]</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {isForgotPassword && (
              <p className="text-xs text-phosphor-dim">
                // transmit operator_id; a recovery vector will be dispatched to your registered address.
              </p>
            )}

            {/* Signup consents */}
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2 text-xs text-phosphor-dim border-l border-phosphor-dim pl-3">
                <label className="flex items-start gap-2 cursor-pointer hover:text-phosphor transition-colors">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="mt-0.5 accent-phosphor"
                  />
                  <span>
                    <span className="text-amber-term">[T]</span> Accept Terms &amp; Privacy Policy. Consent to non-personal trading data collection for analytics.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer hover:text-phosphor transition-colors">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    required
                    className="mt-0.5 accent-phosphor"
                  />
                  <span>
                    <span className="text-amber-term">[P]</span> Accept Privacy Policy for personal data collection &amp; processing.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer hover:text-phosphor transition-colors">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 accent-phosphor"
                  />
                  <span>
                    <span className="text-amber-term">[M]</span> Receive broadcast transmissions &amp; marketing updates.
                  </span>
                </label>
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <label className="flex items-center gap-2 text-xs text-phosphor-dim hover:text-phosphor transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-phosphor"
                />
                <span>// persist session token</span>
              </label>
            )}

            {/* Primary action + aux buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`btn-term ${loading ? 'animate-pulse-glow' : ''}`}
                aria-busy={loading}
              >
                {primaryLabel}
              </button>

              {!isForgotPassword && isLogin && (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(null); }}
                  className="btn-term-amber"
                >
                  [ FORGOT_PASS ]
                </button>
              )}

              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
                  className="btn-term"
                >
                  {isLogin ? '[ CREATE_ACCT ]' : '[ BACK_TO_LOGIN ]'}
                </button>
              )}
            </div>
          </form>

          {/* Social auth */}
          {!isForgotPassword && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-[10px] tracking-widest text-phosphor-dim uppercase">
                <span className="flex-1 border-t border-phosphor-dim" />
                <span>// or bypass with</span>
                <span className="flex-1 border-t border-phosphor-dim" />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="btn-term"
                  aria-label={`Sign ${isLogin ? 'in' : 'up'} with Google`}
                >
                  [ GOOGLE_SSO ]
                </button>
              </div>
            </div>
          )}

          {/* Session log */}
          <div className="border-t border-phosphor-dim pt-3">
            <div className="text-xs tracking-widest text-amber-term font-display mb-2">
              ─── SESSION LOG ──────────────────────────
            </div>
            <div className="space-y-1 text-[11px] font-mono text-phosphor-dim">
              <div className="term-stream">
                [{bootStamp}] attempt from {typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}
              </div>
              <div className="term-stream">
                [{bootStamp}] awaiting credentials<span className="cursor-blink" />
              </div>
              {latestLog && (
                <div className="term-stream animate-slide-up text-phosphor">
                  {latestLog}
                </div>
              )}
            </div>
          </div>

          {/* Footer status strip */}
          <div className="flex items-center justify-between text-[10px] tracking-widest text-phosphor-dim border-t border-phosphor-dim pt-2">
            <div className="flex items-center gap-2">
              <span className="status-pill">
                <span className="pulse-dot" />
                SECURE
              </span>
              <span className="status-pill amber">
                <span className="pulse-dot amber" />
                TLS 1.3
              </span>
            </div>
            <span>v2.0 // {bootStamp}</span>
          </div>

        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;
