/**
 * POST-PURCHASE UPSELL COMPONENT
 * One-time offer for annual subscribers to buy discounted upload credits
 * 50% discount on credit packs immediately after subscription purchase
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { initiateStripeCheckout } from '@/utils/stripeCheckout';
import { trackCheckoutFunnel } from '@/utils/checkoutAnalytics';

interface PostPurchaseUpsellProps {
  onDismiss: () => void;
  subscriptionTier: 'pro' | 'elite';
}

export const PostPurchaseUpsell = ({ onDismiss, subscriptionTier }: PostPurchaseUpsellProps) => {
  const { toast } = useToast();
  const [selectedPacks, setSelectedPacks] = useState(3); // Default 30 credits
  const [loading, setLoading] = useState(false);

  // Calculate pricing with 50% discount
  const basePrice = 2.00; // Normal price per 10 credits
  const discountedPrice = basePrice * 0.5; // 50% off = $1 per 10 credits
  const totalCredits = selectedPacks * 10;
  const totalPrice = selectedPacks * discountedPrice;
  const savings = selectedPacks * (basePrice - discountedPrice);

  const packOptions = [
    { packs: 1, credits: 10, popular: false },
    { packs: 3, credits: 30, popular: true },
    { packs: 5, credits: 50, popular: false },
    { packs: 10, credits: 100, popular: false },
  ];

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // Track upsell acceptance
      trackCheckoutFunnel.upsellAccepted(totalCredits, totalPrice);

      // Navigate to checkout with custom success/cancel URLs for upsell
      const priceId = 'price_1SOxyYFqnRj6eB66CnowBEBN';
      const productType = 'credits_pro';
      const successUrl = encodeURIComponent(`${window.location.origin}/dashboard?upsell=success`);
      const cancelUrl = encodeURIComponent(`${window.location.origin}/#pricing-section`);
      
      window.location.href = `/checkout?priceId=${priceId}&productType=${productType}&successUrl=${successUrl}&cancelUrl=${cancelUrl}`;
    } catch (error) {
      console.error('Upsell purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to process upsell',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="relative overflow-hidden border-2 border-primary/20">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <CardHeader className="relative pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  ONE-TIME OFFER
                </Badge>
              </div>
              <CardTitle className="text-2xl">
                Get 50% Off Upload Credits!
              </CardTitle>
              <CardDescription className="text-base">
                Exclusive offer for new {subscriptionTier.toUpperCase()} annual members. 
                Stock up now and save big on AI-powered trade extraction.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative">
              {/* Pack Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Choose Your Pack
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {packOptions.map((option) => (
                    <Button
                      key={option.packs}
                      variant={selectedPacks === option.packs ? 'default' : 'outline'}
                      className="relative flex flex-col h-auto py-4"
                      onClick={() => setSelectedPacks(option.packs)}
                      type="button"
                    >
                      {option.popular && (
                        <Badge className="absolute -top-2 -right-2 text-xs px-2 py-0.5">
                          Popular
                        </Badge>
                      )}
                      <span className="text-2xl font-bold">{option.credits}</span>
                      <span className="text-xs opacity-70">credits</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-semibold text-lg">{totalCredits} credits</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Regular Price</span>
                    <span className="line-through text-muted-foreground">
                      ${(selectedPacks * basePrice).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                    <span className="font-medium flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      50% Discount
                    </span>
                    <span className="font-semibold">-${savings.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Today</span>
                      <span className="text-2xl font-bold text-primary">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      Just ${(totalPrice / totalCredits).toFixed(2)} per credit
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Credits never expire</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Instant activation on your account</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>One-time offer - won't be available again</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handlePurchase}
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Claim {totalCredits} Credits for ${totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>
                <Button
                  onClick={onDismiss}
                  variant="outline"
                  className="h-12"
                  disabled={loading}
                >
                  Maybe Later
                </Button>
              </div>

              {/* Fine Print */}
              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe. This offer is only available once.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
