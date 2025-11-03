import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { initiateStripeCheckout } from '@/utils/stripeCheckout';

const CheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [showManualLink, setShowManualLink] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing secure checkout...');
  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let safetyLinkTimer: number | undefined;
    let safetyStopLoadingTimer: number | undefined;
    let message10sTimer: number | undefined;
    let message20sTimer: number | undefined;

    const initiateCheckout = async () => {
      console.info('🛒 Starting Stripe checkout via Edge Function...');
      console.info('🖼️ Running in iframe:', isInIframe);

      const priceId = searchParams.get('priceId');
      const productType = searchParams.get('productType') as 'subscription_monthly' | 'subscription_annual' | 'credits_starter' | 'credits_pro';

      if (!priceId || !productType) {
        setError('No product selected. Please select a plan.');
        setIsLoading(false);
        return;
      }

      // Progressive message updates for cold start awareness
      message10sTimer = window.setTimeout(() => {
        console.info('⏰ 10s: Updating message');
        setLoadingMessage('Almost ready...');
      }, 10000);
      
      message20sTimer = window.setTimeout(() => {
        console.info('⏰ 20s: Showing manual option');
        setLoadingMessage('This is taking longer than expected...');
        setShowManualLink(true);
        setLongWait(true);
      }, 20000);
      
      // Safety: stop spinner after 35s
      safetyStopLoadingTimer = window.setTimeout(() => {
        console.warn('⏰ Safety timer: stopping loading state');
        setIsLoading(false);
      }, 35000);

      try {
        console.info('📞 Calling initiateStripeCheckout with:', { priceId, productType });

        const url = await initiateStripeCheckout({
          priceId,
          productType,
          successUrl: `${window.location.origin}/checkout-success`,
          cancelUrl: `${window.location.origin}/#pricing-section`,
        });

        console.info('✅ Got checkout URL:', url);
        setRedirectUrl(url);
        setLongWait(false);

        // In iframe: show manual link immediately and try popup
        if (isInIframe) {
          console.info('🪟 In iframe - showing manual link and attempting popup');
          setShowManualLink(true);

          const popup = window.open(url, '_blank', 'noopener,noreferrer');
          if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            console.warn('⚠️ Popup blocked - user must click manual link');
          } else {
            console.info('✅ Popup opened successfully');
          }
        } else {
          // Top-level window: redirect after short delay
          console.info('🔄 Top-level window - redirecting...');
          setTimeout(() => {
            window.location.replace(url);
          }, 50);
        }
      } catch (err) {
        console.error('❌ Checkout error:', err);
        setIsLoading(false);
        setShowManualLink(true);
        setLongWait(true);
        setError(err instanceof Error ? err.message : 'Failed to initiate checkout. Please try again.');
      } finally {
        if (message10sTimer) clearTimeout(message10sTimer);
        if (message20sTimer) clearTimeout(message20sTimer);
        if (safetyStopLoadingTimer) clearTimeout(safetyStopLoadingTimer);
      }
    };

    initiateCheckout();

    return () => {
      if (message10sTimer) clearTimeout(message10sTimer);
      if (message20sTimer) clearTimeout(message20sTimer);
      if (safetyStopLoadingTimer) clearTimeout(safetyStopLoadingTimer);
    };
  }, [searchParams, isInIframe, retryCount]);

  // Show error UI
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
                onClick={() => (window.location.href = '/#pricing-section')}
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

  // Show loading UI with progressive messages
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full p-8 text-center glass-strong">
            <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {loadingMessage}
            </h2>
            <p className="text-muted-foreground mb-6">
              {longWait 
                ? "Don't worry, this sometimes happens during cold starts. You can continue manually below." 
                : "Setting up your secure payment with Stripe. This may take a moment..."
              }
            </p>
            
            {showManualLink && (
              <div className="space-y-3">
                {redirectUrl ? (
                  <Button 
                    onClick={() => window.open(redirectUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full"
                    size="lg"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Continue to Stripe Manually
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setRetryCount(prev => prev + 1)}
                    variant="outline"
                    className="w-full"
                  >
                    Retry Connection
                  </Button>
                )}
                <Button 
                  onClick={() => (window.location.href = '/#pricing-section')}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Pricing
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show manual link if redirect didn't work
  if (showManualLink && redirectUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full p-8 text-center glass-strong">
            <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Ready to checkout</h2>
            <p className="text-muted-foreground mb-6">
              Click the button below to continue to Stripe's secure checkout.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.open(redirectUrl, '_blank', 'noopener,noreferrer')}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Continue to Stripe
              </Button>
              <Button 
                onClick={() => (window.location.href = '/#pricing-section')}
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

  return null;
};

export default CheckoutRedirect;
