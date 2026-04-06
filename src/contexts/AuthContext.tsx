import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, country: string, marketingConsent: boolean, inviteCode?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener with automatic token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific auth events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('rememberMe');
        } else if (event === 'USER_UPDATED') {
          console.log('User data updated');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Check for pending invite code from Google OAuth signup
          const pendingCode = localStorage.getItem('pendingInviteCode');
          if (pendingCode && (pendingCode === 'HORISTIC' || pendingCode === 'TEO')) {
            localStorage.removeItem('pendingInviteCode');
            applyInviteCodeRewards(session.user.id, pendingCode);
          }
        }
      }
    );

    // Check for existing session with automatic refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        // Refresh token if it expires in less than 10 minutes
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt && expiresAt - now < 600) {
          console.log('Token expiring soon, refreshing...');
          await supabase.auth.refreshSession();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  // Apply invite code rewards (used by both email signup and Google OAuth)
  const applyInviteCodeRewards = async (userId: string, code: string) => {
    const isUnlimited = code === 'TEO';
    const targetPlan = isUnlimited ? 'elite' : 'pro';
    const targetCredits = isUnlimited ? 999999 : 50;

    console.log(`Applying invite code ${code} rewards for user ${userId}...`);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: targetPlan })
      .eq('id', userId);
    if (profileError) console.error('Error updating profile tier:', profileError);

    // Retry loop: wait for subscription row to exist, then update
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise(r => setTimeout(r, 1500));
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            upload_credits_balance: targetCredits,
            monthly_upload_limit: targetCredits,
            plan_type: targetPlan
          })
          .eq('user_id', userId);
        if (subError) console.error('Error updating subscription:', subError);
        else console.log(`Invite code ${code} rewards applied successfully`);
        return;
      }
      console.log(`Waiting for subscription row (attempt ${attempt}/5)...`);
    }
    console.warn('Subscription row not found after 5 attempts — invite rewards not applied');
  };


  // If the OAuth flow returns the user to /auth, finish the UX by routing to the app once session exists.
  useEffect(() => {
    if (session?.user && location.pathname.startsWith('/auth')) {
      navigate('/dashboard');
    }
  }, [session?.user, location.pathname, navigate]);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    // Store rememberMe preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.setItem('rememberMe', 'false');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      navigate('/dashboard');
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, country: string, marketingConsent: boolean, inviteCode?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          country: country,
          marketing_consent: marketingConsent,
          accepted_terms_at: new Date().toISOString(),
          accepted_privacy_at: new Date().toISOString(),
          provider: 'email',
        }
      }
    });

    if (signUpError) return { error: signUpError };

    // Apply invite code rewards
    const code = inviteCode?.toUpperCase();
    if ((code === 'HORISTIC' || code === 'TEO') && signUpData.user) {
      console.log(`Invite code ${code} detected, applying rewards...`);
      const isUnlimited = code === 'TEO';
      const userId = signUpData.user.id;
      const targetPlan = isUnlimited ? 'elite' : 'pro';
      const targetCredits = isUnlimited ? 999999 : 50;

      // Update profile tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier: targetPlan })
        .eq('id', userId);
      if (profileError) console.error('Error updating profile tier:', profileError);

      // Retry loop: wait for subscription row to exist, then update
      (async () => {
        for (let attempt = 1; attempt <= 5; attempt++) {
          await new Promise(r => setTimeout(r, 1500));
          const { data } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (data) {
            const { error: subError } = await supabase
              .from('subscriptions')
              .update({
                upload_credits_balance: targetCredits,
                monthly_upload_limit: targetCredits,
                plan_type: targetPlan
              })
              .eq('user_id', userId);
            if (subError) console.error('Error updating subscription:', subError);
            else console.log(`Invite code ${code} rewards applied successfully`);
            return;
          }
          console.log(`Waiting for subscription row (attempt ${attempt}/5)...`);
        }
        console.warn('Subscription row not found after 5 attempts — invite rewards not applied');
      })();
    }

    if (!signUpError) {
      navigate('/dashboard');
    }
    return { error: signUpError };
  };

  const signInWithGoogle = async (): Promise<{ error: any }> => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error(result.error.message || 'Sign in failed');
        return { error: result.error };
      }

      // If redirected, the page will reload and auth state will update automatically
      if (!result.redirected) {
        navigate('/dashboard');
      }

      return { error: null };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      toast.error('Failed to sign in with Google');
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
