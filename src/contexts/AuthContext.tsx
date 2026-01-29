import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Helper to generate secure state for CSRF protection
const generateState = () => {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

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
          // Clear any cached data
          localStorage.removeItem('rememberMe');
        } else if (event === 'USER_UPDATED') {
          console.log('User data updated');
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

  const signUp = async (email: string, password: string, fullName: string, country: string, marketingConsent: boolean) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
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
    if (!error) {
      navigate('/dashboard');
    }
    return { error };
  };

  const signInWithGoogle = async (): Promise<{ error: any }> => {
    // Generate state for CSRF protection
    const state = generateState();
    
    // Build OAuth URL using Lovable's OAuth broker
    const params = new URLSearchParams({
      provider: 'google',
      redirect_uri: `${window.location.origin}/auth`,
      state,
      response_mode: 'web_message'
    });
    
    const oauthUrl = `https://oauth.lovable.app/~oauth/initiate?${params.toString()}`;
    
    // Open popup centered on screen
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      oauthUrl,
      'oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup) {
      toast.error('Popup was blocked. Please allow popups for this site.');
      return { error: new Error('Popup blocked') };
    }
    
    // Listen for postMessage from OAuth broker
    return new Promise((resolve) => {
      const handleMessage = async (event: MessageEvent) => {
        // Only accept messages from Lovable OAuth broker
        if (event.origin !== 'https://oauth.lovable.app') return;
        if (event.data?.type !== 'authorization_response') return;
        
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
        popup.close();
        
        const data = event.data.response;
        
        if (data.error) {
          toast.error(data.error_description || 'Sign in failed');
          resolve({ error: new Error(data.error_description || 'Sign in failed') });
          return;
        }
        
        // Validate state to prevent CSRF attacks
        if (data.state !== state) {
          toast.error('Invalid authentication state');
          resolve({ error: new Error('Invalid state') });
          return;
        }
        
        // Set session with Supabase
        try {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          });
          navigate('/dashboard');
          resolve({ error: null });
        } catch (e) {
          toast.error('Failed to complete sign in');
          resolve({ error: e });
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Check if popup was closed without completing
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          resolve({ error: new Error('Sign in was cancelled') });
        }
      }, 500);
    });
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
