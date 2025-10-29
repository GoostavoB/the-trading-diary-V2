import { Button } from "@/components/ui/button";
import { Check, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { addStructuredData } from "@/utils/seoHelpers";
import PricingComparison from "./PricingComparison";
import { usePromoStatus } from "@/hooks/usePromoStatus";
import { Badge } from "@/components/ui/badge";
import UrgencyBanner from "./pricing/UrgencyBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      description: "Get started with basic tracking",
      monthlyPrice: 0,
      annualPrice: 0,
      annualTotal: 0,
      uploads: "5 uploads/month",
      xp: "Unlimited XP",
      widgets: "Tiers 1–2",
      customization: "Default Colors (light/dark)",
      featuresKeys: [
        "pricing.plans.basic.features.uploads",
        "pricing.plans.basic.features.accounts",
        "pricing.plans.basic.features.aiInsights",
        "pricing.plans.basic.features.tradingHistory",
        "pricing.plans.basic.features.manualEntry",
        "pricing.plans.basic.features.spotWallet",
        "pricing.plans.basic.features.journal",
        "pricing.plans.basic.features.drawdown",
        "pricing.plans.basic.features.leverageCalculator",
        "pricing.plans.basic.features.marketData",
        "pricing.plans.basic.features.equityForecast",
        "pricing.plans.basic.features.emailSupport",
        "pricing.plans.basic.features.noFeeAnalysis",
      ],
      cta: "Start Free",
      popular: false,
      priceCurrency: "USD",
    },
    {
      id: 'pro',
      name: "Pro",
      description: "For serious traders",
      monthlyPrice: promoStatus.isActive ? 12 : 15,
      annualPrice: promoStatus.isActive ? 10 : 12,
      annualTotal: promoStatus.isActive ? 120 : 144,
      regularMonthlyPrice: 15,
      regularAnnualPrice: 12,
      uploads: "30 uploads/month",
      xp: "Unlimited XP",
      widgets: "Tiers 1–4",
      customization: "3 Color Controls (Primary, Secondary, Accent)",
      featuresKeys: [
        "pricing.plans.pro.features.uploads",
        "pricing.plans.pro.features.unlimitedAccounts",
        "pricing.plans.pro.features.feeAnalysis",
        "pricing.plans.pro.features.tradingPlan",
        "pricing.plans.pro.features.goals",
        "pricing.plans.pro.features.psychology",
        "pricing.plans.pro.features.reports",
        "pricing.plans.pro.features.taxReports",
        "pricing.plans.pro.features.customMetrics",
        "pricing.plans.pro.features.everythingBasic",
      ],
      cta: "Go Pro",
      popular: true,
      priceCurrency: "USD",
    },
    {
      id: 'elite',
      name: "Elite",
      description: "Maximum power and flexibility",
      monthlyPrice: promoStatus.isActive ? 25 : 30,
      annualPrice: promoStatus.isActive ? 20 : 25,
      annualTotal: promoStatus.isActive ? 240 : 300,
      regularMonthlyPrice: 30,
      regularAnnualPrice: 25,
      uploads: "150 uploads/month",
      xp: "Unlimited XP",
      widgets: "All Widgets",
      customization: "Full Color + Background Customization",
      featuresKeys: [
        "pricing.plans.elite.features.uploads",
        "pricing.plans.elite.features.unlimitedAccounts",
        "pricing.plans.elite.features.customMetrics",
        "pricing.plans.elite.features.earlyAccess",
        "pricing.plans.elite.features.prioritySupport",
        "pricing.plans.elite.features.extraCreditsDiscount",
        "pricing.plans.elite.features.everythingPro",
      ],
      cta: "Join Elite",
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
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold mb-3">
              Choose your plan. Train like a pro.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              7-day free trial. No credit card required. Lock in your discount.
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

              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/15 text-green-500 text-xs font-semibold">
                {t('pricing.saveBadge', 'Save 2 months')}
              </span>
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
                
                {promoStatus.isActive && plan.id === 'pro' && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-3 right-4 animate-pulse flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    {promoStatus.daysRemaining > 0 
                      ? `Offer ends in ${promoStatus.daysRemaining}d`
                      : `Ends in ${promoStatus.hoursRemaining}h`
                    }
                  </Badge>
                )}

                <div className="mb-5">
                  <h3 className="text-xl md:text-2xl font-bold mb-1.5">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-3">
                    {plan.description}
                  </p>
                  {plan.monthlyPrice > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        {promoStatus.isActive && plan.id === 'pro' && (
                          <span className="text-2xl font-bold text-muted-foreground line-through mr-1">
                            ${billingCycle === 'monthly' ? plan.regularMonthlyPrice : plan.regularAnnualPrice}
                          </span>
                        )}
                        <span className="text-3xl md:text-4xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                          ${getDisplayPrice(plan)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perMonthBilledAnnually')}
                        </span>
                      </div>
                      {promoStatus.isActive && plan.id === 'pro' && (
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                          🎉 Save 40% during launch offer
                        </div>
                      )}
                      {billingCycle === 'annual' && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {t('pricing.savingsAmount', { amount: getSavings(plan) })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>
                      Free
                    </div>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-muted-foreground mt-2 cursor-help border-b border-dotted border-muted-foreground/30 inline-block">
                          {plan.uploads} • {plan.widgets}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">1 upload = up to 10 trades</p>
                        <p className="text-xs">{plan.uploads.includes('5') ? '50' : plan.uploads.includes('30') ? '300' : '1,500'} trades/month max</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Button
                  onClick={handleAuthNavigate}
                  className={`w-full h-12 mb-3 rounded-xl font-medium transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "glass border border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>

                {plan.monthlyPrice > 0 ? (
                  <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                    {t('pricing.trialTerms', '7-day trial • Cancel anytime • Prorated refund in first 14 days on annual')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                    {t('pricing.noCardRequired', 'No credit card required')}
                  </p>
                )}

                <ul className="space-y-2.5">
                  {plan.featuresKeys.map((featureKey, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        size={18}
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-primary" : "text-foreground"
                        }`}
                      />
                      <span className="text-xs md:text-sm text-muted-foreground leading-relaxed">{t(featureKey)}</span>
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
    </>
  );
};

export default Pricing;
