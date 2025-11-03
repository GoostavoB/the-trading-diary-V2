import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  
  const [countdown, setCountdown] = useState(10);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingEmail, setFetchingEmail] = useState(true);

  // Fetch customer email from Stripe session
  useEffect(() => {
    const fetchSessionEmail = async () => {
      if (!sessionId || user) {
        setFetchingEmail(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-session', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.email) {
          setEmail(data.email);
          if (data.customerName) {
            setFullName(data.customerName);
          }
          setShowSignup(true);
        }
      } catch (error) {
        console.error('Error fetching session email:', error);
        toast.error('Could not retrieve payment details');
      } finally {
        setFetchingEmail(false);
      }
    };

    fetchSessionEmail();
  }, [sessionId, user]);

  // Confetti and auto-redirect (only for logged-in users)
  useEffect(() => {
    if (user || !showSignup) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#2D68FF', '#5A8CFF', '#8AB4FF']
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#2D68FF', '#5A8CFF', '#8AB4FF']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate, user, showSignup]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || password.length < 6) {
      toast.error('Please enter a valid email and password (min 6 characters)');
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created! Welcome to The Trading Diary 🎉');
        
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please log in instead.', {
          action: {
            label: 'Log In',
            onClick: () => navigate('/auth')
          }
        });
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while fetching email
  if (fetchingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment details...</p>
        </Card>
      </div>
    );
  }

  // Guest user needs to sign up
  if (!user && showSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 glass-strong">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-primary" />
            </motion.div>

            <h1 className="text-3xl font-bold mb-2 text-center flex items-center justify-center gap-2">
              Payment Successful! <Sparkles className="w-6 h-6 text-primary" />
            </h1>
            <p className="text-muted-foreground mb-6 text-center">
              Create your account to access your subscription
            </p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name (Optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Using the email from your payment
                </p>
              </div>

              <div>
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>Creating Account...</>
                ) : (
                  <>
                    Create Account & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-primary hover:underline"
                >
                  Log in instead
                </button>
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Logged-in user success screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center glass-strong">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
              Welcome to Pro! <Sparkles className="w-6 h-6 text-primary" />
            </h1>
            <p className="text-muted-foreground mb-6">
              Your subscription is now active. Get ready to supercharge your trading journey!
            </p>

            {sessionId && (
              <p className="text-xs text-muted-foreground mb-4">
                Session ID: {sessionId.slice(0, 20)}...
              </p>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="w-full"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-sm text-muted-foreground">
                Redirecting in {countdown} seconds...
              </p>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
