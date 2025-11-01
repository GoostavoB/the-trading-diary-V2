import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { analytics } from '@/utils/analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, country: string, marketingConsent: boolean) => Promise<{ error: any }>;
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
          // Clear any cached data
          localStorage.removeItem('rememberMe');
        } else if (event === 'USER_UPDATED') {
          console.log('User data updated');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Update last login tracking for engagement reminders
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const todayLocal = new Date().toLocaleDateString('en-CA');

          await supabase
            .from('user_xp_tiers')
            .update({ 
              last_login_date: todayLocal,
              last_login_timezone: userTimezone
            })
            .eq('user_id', session.user.id);

          // Identify user in analytics with full profile data
          setTimeout(async () => {
            // Fetch user tier data
            const { data: xpData } = await supabase
              .from('user_xp_levels')
              .select('total_xp_earned, current_level')
              .eq('user_id', session.user.id)
              .single();

            const { data: tierData } = await supabase
              .from('user_xp_tiers')
              .select('current_tier, daily_xp_earned, daily_xp_cap')
              .eq('user_id', session.user.id)
              .single();

            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('plan_type, status')
              .eq('user_id', session.user.id)
              .eq('status', 'active')
              .single();

            analytics.identify(session.user.id, {
              email: session.user.email,
              created_at: session.user.created_at,
              tier: tierData?.current_tier || 0,
              total_xp: xpData?.total_xp_earned || 0,
              current_level: xpData?.current_level || 1,
              subscription_plan: subscription?.plan_type || 'free',
              subscription_status: subscription?.status || 'none',
              daily_xp_earned: tierData?.daily_xp_earned || 0,
              daily_xp_cap: tierData?.daily_xp_cap || 750,
            });
          }, 0);
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

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    // Store rememberMe preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.setItem('rememberMe', 'false');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Track successful login
      analytics.track('user_signed_in', {
        method: 'email',
        user_id: data.user.id,
      });
      navigate('/dashboard');
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, country: string, marketingConsent: boolean) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          country: country,
          marketing_consent: marketingConsent,
          terms_accepted_at: new Date().toISOString()
        }
      }
    });
    if (!error && data.user) {
      // Track successful signup
      analytics.track('user_signed_up', {
        method: 'email',
        user_id: data.user.id,
        country,
        marketing_consent: marketingConsent,
      });
      navigate('/dashboard');
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      await supabase.auth.signOut();
      
      // Clear all sb-* keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('rememberMe');
      
      console.log('[Auth] Cleared localStorage, redirecting...');
      
      // Hard redirect to guarantee clean state
      window.location.href = '/auth?loggedOut=1';
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
