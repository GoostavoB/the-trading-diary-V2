import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Shield, CreditCard, Zap, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { initiateStripeCheckout } from '@/utils/stripeCheckout';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const CheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [redirectFailed, setRedirectFailed] = useState(false);

  useEffect(() => {
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

      try {
        const url = await initiateStripeCheckout({
          priceId,
          productType: productType as any,
          successUrl,
          cancelUrl,
          upsellCredits: upsellCredits ? parseInt(upsellCredits) : undefined,
        });
        
        // Store URL for manual redirect if automatic redirect fails
        setCheckoutUrl(url);
        
        // Set a timeout to show manual redirect option if automatic redirect didn't work
        setTimeout(() => {
          console.warn('⏰ Redirect timeout reached - showing manual redirect option');
          setRedirectFailed(true);
        }, 5000);
        
      } catch (error) {
        console.error('❌ CheckoutRedirect: Checkout failed', error);
        setError(error instanceof Error ? error.message : 'Checkout failed');
        toast({
          title: 'Checkout Error',
          description: error instanceof Error ? error.message : 'Failed to start checkout',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/pricing'), 2000);
      }
    };

    initiateCheckout();
  }, [searchParams, navigate, toast]);

  const handleManualRedirect = () => {
    if (checkoutUrl) {
      console.info('👆 Manual redirect clicked, opening:', checkoutUrl);
      window.open(checkoutUrl, '_self');
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
            <h2 className="text-2xl font-bold mb-4 text-destructive">Checkout Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting back to pricing...</p>
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
            
            <h2 className="text-2xl font-bold mb-3">Almost There!</h2>
            <p className="text-muted-foreground mb-6">
              Click the button below to continue to checkout
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
