import { Button } from "@/components/ui/button";
import { Check, Sparkles, Clock, Upload, Palette, Trophy, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { addStructuredData } from "@/utils/seoHelpers";
import PricingComparison from "./PricingComparison";
import { usePromoStatus } from "@/hooks/usePromoStatus";
import { Badge } from "@/components/ui/badge";
import UrgencyBanner from "./pricing/UrgencyBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SocialProof from "./pricing/SocialProof";
import { motion } from "framer-motion";

const Pricing = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const currentLang = i18n.language;
  const promoStatus = usePromoStatus();
  
  const handleAuthNavigate = () => {
    const authPath = currentLang === 'en' ? '/auth' : `/${currentLang}/auth`;
    navigate(authPath);
  };

  const plans = [
    {
      id: 'free',
      name: "Free",
      description: "Perfect for getting started",
      monthlyPrice: 0,
      annualPrice: 0,
      annualTotal: 0,
      uploads: "5 uploads total",
      uploadSubtext: "(starter gift)",
      features: [
        { icon: Upload, text: "5 uploads total" },
        { icon: Palette, text: "Essential widgets (Tiers 1-2)" },
        { icon: Trophy, text: "Basic XP system" },
        { icon: BarChart3, text: "Starter analytics" },
        { text: "One account only" },
      ],
      cta: "Start Free",
      popular: false,
      priceCurrency: "USD",
    },
    {
      id: 'pro',
      name: "Pro",
      description: "For serious traders",
      monthlyPrice: 12,
      annualPrice: 10,
      annualTotal: 120,
      uploads: "30 uploads/month",
      uploadSubtext: "",
      features: [
        { icon: Upload, text: "30 uploads per month" },
        { icon: Palette, text: "Advanced widgets & customization" },
        { icon: Trophy, text: "Full XP system with leaderboards" },
        { icon: BarChart3, text: "Advanced analytics & tracking" },
        { text: "Unlimited trading accounts" },
        { text: "Fee tracking & reporting" },
        { text: "Add 10 uploads for $2" },
      ],
      cta: "Go Pro Now • Offer Ends Soon",
      popular: true,
      priceCurrency: "USD",
    },
    {
      id: 'elite',
      name: "Elite",
      description: "Maximum power and flexibility",
      monthlyPrice: 25,
      annualPrice: 20,
      annualTotal: 240,
      uploads: "150 uploads/month",
      uploadSubtext: "",
      features: [
        { icon: Upload, text: "150 uploads per month" },
        { text: "All widgets unlocked" },
        { text: "Full color & background customization" },
        { text: "Premium priority support" },
        { text: "Custom branding options" },
        { text: "Add 10 uploads for $1 (50% off)" },
        { text: "Everything in Pro" },
      ],
      cta: "Join Elite • Save $60/Year",
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
          "name": plan.name,
          "description": plan.description,
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
      <section id="pricing-section" className="py-16 md:py-20 px-6" aria-labelledby="pricing-heading">
        <div className="container mx-auto max-w-6xl">
          {/* Urgency Banner */}
          <UrgencyBanner />

          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h2 id="pricing-heading" className="text-3xl md:text-5xl font-bold mb-3">
              Get pro trading tools today. Early access ends soon.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Start free. Upgrade anytime. Save up to $60/year.
            </p>
            <p className="text-sm text-orange-400 font-semibold">
              Launch pricing available until November 1, 2025
            </p>

            {/* Billing Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <div className="inline-flex items-center rounded-xl bg-card/40 backdrop-blur-sm border border-border/50 p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  aria-pressed={billingCycle === 'monthly'}
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
                  aria-pressed={billingCycle === 'annual'}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('pricing.billing.annual')}
                </button>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/15 text-green-500 text-xs font-semibold">
                <span className="animate-pulse">⚡</span>
                {t('pricing.saveBadge', 'Save up to $60/year')}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground mt-2"
              >
                Save up to 16.7% when billed annually
              </motion.p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6" role="list">
            {plans.map((plan, index) => {
              const isFree = plan.id === 'free';
              const isElite = plan.id === 'elite';
              
              return (
              <article
                role="listitem"
                key={plan.id}
                className={`glass backdrop-blur-[12px] rounded-2xl p-6 md:p-7 relative transition-all shadow-sm animate-fade-in ${
                  plan.popular 
                    ? "ring-2 ring-primary shadow-2xl shadow-primary/30 md:scale-110 hover:shadow-2xl hover:shadow-primary/50" 
                    : isFree 
                    ? "opacity-75 md:scale-95 hover:opacity-90" 
                    : isElite
                    ? "ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20 hover:ring-amber-500/60"
                    : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Animated glow for Pro plan */}
                {plan.popular && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 -z-10"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles size={12} />
                    {t('pricing.mostPopular')}
                  </div>
                )}
                

                <div className="mb-5">
                  <h3 className={`text-xl md:text-2xl font-bold mb-1.5 ${
                    isElite ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent' : ''
                  }`}>
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-3">
                    {plan.description}
                  </p>
                  {plan.monthlyPrice > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl md:text-4xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                          ${getDisplayPrice(plan)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perMonthBilledAnnually')}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Save ${getSavings(plan)} annually
                        </div>
                      )}
                      {plan.monthlyPrice > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {billingCycle === 'annual' ? `$${plan.annualTotal}/year billed annually` : 'Billed monthly'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>
                      Free
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAuthNavigate}
                  className={`w-full h-12 mb-3 rounded-xl font-medium transition-all group ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105"
                      : isElite
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/50"
                      : "glass border border-border/50 hover:bg-accent/50"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                  {plan.popular && <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>}
                </Button>

                <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                  No credit card required • Upgrade anytime
                </p>

                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        {Icon ? (
                          <Icon
                            size={18}
                            className="mt-0.5 flex-shrink-0 text-primary"
                          />
                        ) : (
                          <Check
                            size={18}
                            className={`mt-0.5 flex-shrink-0 ${
                              plan.popular ? "text-primary" : "text-foreground"
                            }`}
                          />
                        )}
                        <span className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                          {feature.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
            })}
          </div>

          <p className="text-center text-muted-foreground text-xs md:text-sm mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            No credit card required • Upgrade anytime
          </p>

          {/* Social Proof */}
          <SocialProof />
        </div>
      </section>

      {/* Comparison Table */}
      <PricingComparison />
    </>
  );
};

export default Pricing;
