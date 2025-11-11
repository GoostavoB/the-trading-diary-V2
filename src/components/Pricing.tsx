import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { addStructuredData } from "@/utils/seoHelpers";
import PricingComparison from "./PricingComparison";
import PricingRoadmap from "./PricingRoadmap";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession } from "@/utils/stripe";
import { toast } from "sonner";

const Pricing = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const currentLang = i18n.language;

  const handleAuthNavigate = () => {
    const authPath = currentLang === 'en' ? '/auth' : `/${currentLang}/auth`;
    navigate(authPath);
  };

  const handlePlanSelect = async (planId: string) => {
    // If user is not logged in, redirect to auth
    if (!user) {
      handleAuthNavigate();
      return;
    }

    // If user is logged in, start checkout
    setLoadingPlan(planId);
    try {
      await createCheckoutSession({
        planId: planId as 'basic' | 'pro' | 'elite',
        billingCycle,
      });
      // User will be redirected to Stripe checkout
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'basic',
      nameKey: "Starter",
      descriptionKey: "Perfect for getting started",
      monthlyPrice: 0,
      annualPrice: 0,
      annualTotal: 0,
      featuresKeys: [
        "Onboarding gift: 5 free uploads",
        "Extra uploads: $5 per 10 uploads",
        "Add trades manually",
        "Widgets and metrics",
        "Emotional, plans, and personal goals",
        "Market data: long short ratio and open interest",
        "Forecast tool",
        "FII analysis to compare exchanges",
        "Risk analysis",
        "Trading journal",
        "Spot wallet",
        "Tax report",
        "Achievements board",
        "Themes: Default blue and Gold Rush only",
        "No color customization",
      ],
      ctaKey: "Start free",
      popular: false,
      priceCurrency: "USD",
    },
    {
      id: 'pro',
      nameKey: "Pro",
      descriptionKey: "Most popular for serious traders",
      monthlyPrice: 15,
      annualPrice: 12,
      annualTotal: 144,
      featuresKeys: [
        "Everything in Starter, plus:",
        "30 uploads per month",
        "Unused uploads roll over to next month",
        "Extra uploads: $2 per 10 uploads (60% discount)",
        "Full color customization: primary, secondary, and accent",
        "Email support",
      ],
      ctaKey: "Go Pro",
      popular: true,
      priceCurrency: "USD",
    },
    {
      id: 'elite',
      nameKey: "Elite",
      descriptionKey: "For professional traders",
      monthlyPrice: 32,
      annualPrice: 28,
      annualTotal: 336,
      featuresKeys: [
        "Everything in Pro, plus:",
        "Unlimited uploads and trades",
        "Priority customer support",
        "First access to new widgets and new metrics",
        "Full color customization",
      ],
      ctaKey: "Get Elite",
      popular: false,
      priceCurrency: "USD",
    },
  ];

  const getDisplayPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    return (plan.monthlyPrice * 12) - plan.annualTotal;
  };
  
  // Add Offer Schema for SEO
  useEffect(() => {
    const offersSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": plans.map((plan, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Offer",
          "name": t(plan.nameKey),
          "description": t(plan.descriptionKey),
          "price": billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice,
          "priceCurrency": plan.priceCurrency,
          "availability": "https://schema.org/InStock",
          "url": "https://www.thetradingdiary.com/auth",
          "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          "billingDuration": billingCycle === 'monthly' ? "P1M" : "P1Y",
          "seller": {
            "@type": "Organization",
            "name": "The Trading Diary"
          }
        }
      }))
    };
    
    addStructuredData(offersSchema, 'pricing-offers-schema');
  }, [t, billingCycle]);

  return (
    <>
      <section className="py-16 md:py-20 px-6" aria-labelledby="pricing-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold mb-3">
              {t('pricing.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {t('pricing.subtitle')}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.billing.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
                  billingCycle === 'annual'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.billing.annual')}
                <span className="absolute -top-2 -right-2 bg-green-500 text-primary-foreground text-xs px-2 py-0.5 rounded-full font-semibold">
                  {t('pricing.billing.save20')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6" role="list">
            {plans.map((plan, index) => (
              <article
                role="listitem"
                key={plan.id}
                className={`glass backdrop-blur-[12px] rounded-2xl p-6 md:p-7 relative hover-lift transition-all shadow-sm animate-fade-in ${
                  plan.popular ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles size={12} />
                    {t('pricing.mostPopular')}
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl md:text-2xl font-bold mb-1.5">{plan.nameKey}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-3">
                    {plan.descriptionKey}
                  </p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl md:text-4xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                      {getDisplayPrice(plan) === 0 ? 'Free' : `$${getDisplayPrice(plan)}`}
                    </span>
                    {getDisplayPrice(plan) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        /month{billingCycle === 'annual' && ' billed annually'}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'annual' && getSavings(plan) > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Save ${getSavings(plan)}/year
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full h-12 mb-3 rounded-xl font-medium transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "glass border border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? 'Loading...' : plan.ctaKey}
                </Button>

                <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                  1 upload = up to 10 trades
                </p>

                <ul className="space-y-2.5">
                  {plan.featuresKeys.map((featureKey, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        size={18}
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-primary" : "text-foreground"
                        }`}
                      />
                      <span className="text-xs md:text-sm text-muted-foreground leading-relaxed">{featureKey}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className="text-center text-muted-foreground text-xs md:text-sm mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {t('pricing.guaranteeNote')}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <PricingComparison />

      {/* Roadmap */}
      <PricingRoadmap />
    </>
  );
};

export default Pricing;
