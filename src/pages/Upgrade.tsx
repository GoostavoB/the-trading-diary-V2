import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COPY } from "@/config/copy";
import { trackUserJourney } from "@/utils/analyticsEvents";
import { SUBSCRIPTION_PRODUCTS } from "@/config/stripe-products";
import AppLayout from "@/components/layout/AppLayout";

export default function Upgrade() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    trackUserJourney.upgradePageViewed();
  }, []);

  const handleUpgrade = async (planType: 'pro' | 'elite', priceId: string, amount: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      trackUserJourney.checkoutStarted('subscription', amount, priceId);
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId,
          productType: `subscription_${billingCycle}_${planType}`,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/upgrade`,
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

  const plans = [
    {
      ...COPY.plans.pro,
      icon: Star,
      monthlyPrice: 12,
      annualPrice: 10,
      annualSavings: 24,
      monthlyPriceId: SUBSCRIPTION_PRODUCTS.pro.monthly.priceId,
      annualPriceId: SUBSCRIPTION_PRODUCTS.pro.annual.priceId,
      color: "text-blue-500",
      isCurrentPlan: subscription?.plan_type === 'pro',
    },
    {
      ...COPY.plans.elite,
      icon: Crown,
      monthlyPrice: 25,
      annualPrice: 20,
      annualSavings: 60,
      monthlyPriceId: SUBSCRIPTION_PRODUCTS.elite.monthly.priceId,
      annualPriceId: SUBSCRIPTION_PRODUCTS.elite.annual.priceId,
      color: "text-amber-500",
      isCurrentPlan: subscription?.plan_type === 'elite',
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upgrade Your Experience
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Get more credits, analytics, and customization tools.
          </p>

          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'annual')} className="w-fit mx-auto mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">
                Annual 
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Save up to $60</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId;
            const savings = billingCycle === 'annual' ? plan.annualSavings : 0;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full flex flex-col ${plan.isCurrentPlan ? 'border-primary' : ''}`}>
                  {plan.isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-8 pt-8">
                    <Icon className={`w-12 h-12 mx-auto mb-4 ${plan.color}`} />
                    <CardTitle className="text-3xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-bold">${price}</span>
                      <span className="text-muted-foreground ml-2">per month</span>
                      {savings > 0 && (
                        <div className="text-sm text-primary mt-2 font-semibold">
                          Save ${savings}/year
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleUpgrade(
                        plan.name.toLowerCase() as 'pro' | 'elite',
                        priceId,
                        price
                      )}
                      disabled={loading || plan.isCurrentPlan}
                      className="w-full"
                      size="lg"
                    >
                      {plan.isCurrentPlan ? 'Current Plan' : plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4 text-sm text-muted-foreground max-w-2xl mx-auto"
        >
          <p className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Cancel anytime — plans renew {billingCycle}
          </p>
          <p>Switch between plans anytime from your account settings.</p>
          <Button variant="link" onClick={() => navigate('/pricing')}>
            View detailed comparison →
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
