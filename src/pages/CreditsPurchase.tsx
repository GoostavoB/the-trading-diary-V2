import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coins, Plus, Minus, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COPY } from "@/config/copy";
import { trackUserJourney } from "@/utils/analyticsEvents";
import { CREDIT_PRODUCTS } from "@/config/stripe-products";
import AppLayout from "@/components/layout/AppLayout";

export default function CreditsPurchase() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1); // Number of 10-credit packs

  const isPro = subscription?.plan_type === 'pro' || subscription?.plan_type === 'elite';
  const pricePerPack = isPro ? 2 : 5; // $2 or $5 per 10 credits
  const pricePerCredit = isPro ? 0.20 : 0.50;
  const totalPrice = quantity * pricePerPack;
  const totalCredits = quantity * 10;
  const currentBalance = subscription?.upload_credits_balance || 0;

  useEffect(() => {
    trackUserJourney.creditsPurchaseViewed();
  }, []);

  const handlePurchase = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const priceId = isPro ? CREDIT_PRODUCTS.pro.priceId : CREDIT_PRODUCTS.starter.priceId;
      
      trackUserJourney.checkoutStarted('credits', totalPrice, priceId);
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId,
          productType: isPro ? 'credits_pro' : 'credits_starter',
          creditQuantity: quantity,
          successUrl: `${window.location.origin}/dashboard?credits_purchased=true`,
          cancelUrl: `${window.location.origin}/credits/purchase`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Coins className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Purchase Upload Credits
          </h1>
          <p className="text-xl text-muted-foreground">
            {COPY.credits.description}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Main Purchase Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Credit Amount</CardTitle>
                <CardDescription>
                  You currently have <span className="font-semibold text-foreground">{currentBalance} credits</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Quantity Selector */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Number of credit packs (10 credits each)</label>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="text-center min-w-[120px]">
                      <div className="text-4xl font-bold">{quantity}</div>
                      <div className="text-sm text-muted-foreground">
                        {totalCredits} credits
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= 10}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-secondary/30 rounded-lg p-6 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Price per credit</span>
                    <span className="font-semibold">${pricePerCredit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Credit packs × {quantity}</span>
                    <span className="font-semibold">${pricePerPack} each</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-3xl font-bold">${totalPrice}</span>
                    </div>
                  </div>
                  {!isPro && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      Save 60% with Pro — pay only ${(totalCredits * 0.20).toFixed(2)} for {totalCredits} credits
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-3">
                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  Purchase {totalCredits} Credits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  size="lg"
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Need more than 100 credits? <a href="mailto:support@tradingjournalai.com" className="text-primary hover:underline">Contact support</a> for custom plans.
            </p>
          </motion.div>

          {/* Pro Upsell Card */}
          {!isPro && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Save 60% with Pro</CardTitle>
                  </div>
                  <CardDescription>
                    Pro users pay only <span className="font-semibold text-foreground">${(totalCredits * 0.20).toFixed(2)}</span> for {totalCredits} credits
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {COPY.upsells.proBanner.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Regular price:</span>
                      <span className="line-through">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-primary">
                      <span>Pro price:</span>
                      <span>${(totalCredits * 0.20).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>You save:</span>
                      <span className="font-semibold">${(totalPrice - (totalCredits * 0.20)).toFixed(2)} (60%)</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => {
                      trackUserJourney.upgradeClicked('credits_purchase_upsell');
                      navigate('/upgrade');
                    }}
                    className="w-full"
                    size="lg"
                  >
                    Become Pro and Save Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
