import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Shield, CreditCard, Zap, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { initiateStripeCheckout } from '@/utils/stripeCheckout';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const CheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const hasInitiated = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasInitiated.current) return;
    hasInitiated.current = true;

    // Check authentication before proceeding
    if (!user) {
      setError('Please log in to continue with checkout');
      navigate('/auth');
      return;
    }

    const initiateCheckout = async () => {
      const priceId = searchParams.get('priceId');
      const productType = searchParams.get('productType');
      const successUrl = searchParams.get('successUrl');
      const cancelUrl = searchParams.get('cancelUrl');
      const upsellCredits = searchParams.get('upsellCredits');

      if (!priceId || !productType) {
        setError('Missing checkout information');
        toast({
          title: 'Checkout Error',
          description: 'Missing required checkout parameters',
          variant: 'destructive',
        });
        navigate('/pricing');
        return;
      }

      console.info('🛒 CheckoutRedirect: Starting checkout flow', { 
        priceId, 
        productType, 
        upsellCredits: upsellCredits ? parseInt(upsellCredits) : undefined 
      });

      // Detect iframe environment
      const isInIframe = window.self !== window.top;
      
      // Start timeout BEFORE async call - this ensures fallback UI shows even if Edge Function hangs
      timeoutRef.current = setTimeout(() => {
        console.warn('⏰ Timeout fired - showing fallback UI', { 
          isInIframe,
          hasUrl: !!checkoutUrl 
        });
        setRedirectFailed(true);
      }, isInIframe ? 1000 : 2000);

      try {
        const url = await initiateStripeCheckout({
          priceId,
          productType: productType as any,
          successUrl,
          cancelUrl,
          upsellCredits: upsellCredits ? parseInt(upsellCredits) : undefined,
        });
        
        // Store URL for manual redirect
        setCheckoutUrl(url);
        console.info('✅ Checkout URL received:', url);
        
      } catch (error) {
        console.error('❌ CheckoutRedirect: Checkout failed', error);
        setError(error instanceof Error ? error.message : 'Checkout failed');
        toast({
          title: 'Checkout Error',
          description: error instanceof Error ? error.message : 'Failed to start checkout',
          variant: 'destructive',
        });
        // Don't auto-redirect on error - let user choose
      }
    };

    initiateCheckout();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchParams, navigate, toast, user]);

  const handleManualRedirect = () => {
    if (checkoutUrl) {
      console.info('👆 Manual redirect clicked, opening:', checkoutUrl);
      // Open in new tab for better iframe compatibility
      window.open(checkoutUrl, '_blank');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-destructive/5 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center glass-strong">
            <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-destructive">Checkout Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/pricing')}
                variant="outline"
                className="w-full"
              >
                Back to Pricing
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Handle Edge Function failure - timeout fired but no URL received
  if (redirectFailed && !checkoutUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-warning/5 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center glass-strong">
            <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-warning" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Connection Issue</h2>
            <p className="text-muted-foreground mb-6">
              We're having trouble connecting to the payment system. This might be a temporary issue.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry Checkout
              </Button>
              <Button 
                onClick={() => navigate('/pricing')}
                variant="outline"
                className="w-full"
              >
                Back to Pricing
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              If this persists, please contact support
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (redirectFailed && checkoutUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center glass-strong">
            <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-12 h-12 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">Ready to Checkout!</h2>
            <p className="text-muted-foreground mb-6">
              Click below to open Stripe checkout in a new tab
            </p>
            
            <Button 
              onClick={handleManualRedirect}
              size="lg"
              className="w-full mb-4"
            >
              Continue to Checkout
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold mb-3">
              Preparing Your Checkout
            </h1>
            <p className="text-muted-foreground mb-6">
              {redirectFailed 
                ? 'Having trouble? Click the button above to continue.'
                : 'Please wait while we redirect you to our secure payment page...'}
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">Secure Payment</span>
                  <br />
                  <span className="text-muted-foreground">Protected by Stripe</span>
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">Instant Access</span>
                  <br />
                  <span className="text-muted-foreground">Start using premium features immediately</span>
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">Cancel Anytime</span>
                  <br />
                  <span className="text-muted-foreground">No long-term commitments</span>
                </p>
              </div>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutRedirect;
