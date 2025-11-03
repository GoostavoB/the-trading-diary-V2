import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Direct Stripe Payment Links - no Edge Function needed!
const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  'price_1SOxY4FqnRj6eB66dXzsrUqY': 'https://buy.stripe.com/test_3cI4gz3EBb3DfC6bTg6g800', // Pro Monthly ($12/mo)
  'price_1SOxbDFqnRj6eB66rE1d5YLP': 'https://buy.stripe.com/test_cNi00j5MJgnXdtY4qO6g801', // Pro Annual ($115.20/yr)
  'price_1SOxusFqnRj6eB66rjh4qAjN': 'https://buy.stripe.com/test_aFafZh8YVgnX3Toe1o6g802', // Elite Monthly ($49/mo)
  'price_1SOxwHFqnRj6eB66kqtJVPZy': 'https://buy.stripe.com/test_cNi6oHa2Z4Ff61wf5s6g803', // Elite Annual ($470/yr)
};

const CheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [showManualLink, setShowManualLink] = useState(false);

  useEffect(() => {
    console.info('🛒 Direct Stripe checkout - no Edge Function needed!');
    
    // Extract price ID from URL
    const priceId = searchParams.get('priceId');
    
    if (!priceId) {
      setError('No product selected. Please select a plan.');
      return;
    }

    // Get direct Stripe payment link
    const stripeUrl = STRIPE_PAYMENT_LINKS[priceId];
    
    if (!stripeUrl) {
      console.error('❌ Invalid priceId:', priceId);
      setError('Invalid product selected. Please try again.');
      return;
    }

    // Add customer email as prefill if user is logged in (but don't wait for auth to load)
    const finalUrl = user?.email 
      ? `${stripeUrl}?prefilled_email=${encodeURIComponent(user.email)}`
      : stripeUrl;
    
    console.info('🔗 Redirecting to Stripe Payment Link:', finalUrl);
    setRedirectUrl(finalUrl);
    
    // Detect if running in iframe (like Lovable preview)
    const inIframe = window.top !== window.self;
    
    if (inIframe) {
      console.info('🖼️ Running in iframe - opening Stripe in new tab...');
      setShowManualLink(true);
      const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        console.warn('⚠️ Popup blocked - showing manual button');
      }
      return;
    }
    
    // Top-level window: immediate redirect using replace (doesn't add to history)
    console.info('⚡ Top-level window - executing redirect...');
    const redirectTimer = setTimeout(() => {
      console.info('🚀 Redirecting now...');
      window.location.replace(finalUrl);
    }, 50);
    
    // Fallback: Show manual link if redirect doesn't happen within 1 second
    const fallbackTimer = setTimeout(() => {
      console.warn('⏱️ Redirect taking too long - showing manual link');
      setShowManualLink(true);
    }, 1000);
    
    return () => {
      clearTimeout(redirectTimer);
      clearTimeout(fallbackTimer);
    };
  }, [searchParams]);

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

  // Show redirecting UI
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
          <h2 className="text-2xl font-bold mb-4">Redirecting to Stripe...</h2>
          <p className="text-muted-foreground mb-6">
            You'll be redirected to complete your purchase in just a moment.
          </p>
          {showManualLink && redirectUrl && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Taking too long?</p>
              <Button 
                onClick={() => window.location.href = redirectUrl}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Click here to continue
              </Button>
              <Button 
                onClick={() => navigate('/pricing')}
                variant="outline"
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
};

export default CheckoutRedirect;
