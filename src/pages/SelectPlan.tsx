import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COPY } from "@/config/copy";
import { trackUserJourney } from "@/utils/analyticsEvents";
import { SUBSCRIPTION_PRODUCTS } from "@/config/stripe-products";
import { PromoCountdownBanner } from "@/components/pricing/PromoCountdownBanner";
import { PlanComparisonModal } from "@/components/pricing/PlanComparisonModal";

export default function SelectPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    trackUserJourney.planSelectionViewed();
  }, []);

  const handleFreePlan = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update profile to free tier
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      trackUserJourney.planSelected('free');
      toast.success("Welcome! You received 5 free credits to get started.");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting free plan:', error);
      toast.error("Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaidPlan = async (planType: 'pro' | 'elite', priceId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      trackUserJourney.checkoutStarted('subscription', planType === 'pro' ? 12 : 25, priceId);
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId,
          productType: `subscription_monthly_${planType}`,
          successUrl: `${window.location.origin}/dashboard?welcome=true`,
          cancelUrl: `${window.location.origin}/select-plan`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
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
      ...COPY.plans.free,
      price: "$0",
      period: "forever",
      badge: null,
      action: handleFreePlan,
      disabled: false,
    },
    {
      ...COPY.plans.pro,
      price: "$12",
      period: "per month",
      badge: "Most Popular",
      action: () => handlePaidPlan('pro', SUBSCRIPTION_PRODUCTS.pro.monthly.priceId),
      highlight: true,
      disabled: false,
    },
    {
      ...COPY.plans.elite,
      price: "$25",
      period: "per month",
      badge: "Best Value",
      action: () => handlePaidPlan('elite', SUBSCRIPTION_PRODUCTS.elite.monthly.priceId),
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <PromoCountdownBanner />
      
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose your plan to continue
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Select a plan that fits your trading style. You can upgrade anytime.
          </p>
          <Button 
            variant="link" 
            onClick={() => setShowComparison(true)}
            className="text-primary"
          >
            Compare plans in detail →
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full flex flex-col ${'highlight' in plan && plan.highlight ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {plan.badge}
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
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
                    onClick={plan.action}
                    disabled={loading || plan.disabled}
                    className="w-full"
                    variant={'highlight' in plan && plan.highlight ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <PlanComparisonModal open={showComparison} onClose={() => setShowComparison(false)} />
    </div>
  );
}
