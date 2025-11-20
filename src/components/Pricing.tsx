import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { addStructuredData } from "@/utils/seoHelpers";
import PricingComparison from "./PricingComparison";
import PricingRoadmap from "./PricingRoadmap";

const Pricing = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const currentLang = i18n.language;
  
  const handleAuthNavigate = () => {
    const authPath = currentLang === 'en' ? '/auth' : `/${currentLang}/auth`;
    navigate(authPath);
  };

  const plans = [
    {
      id: 'starter',
      nameKey: "pricing.plans.starter.name",
      descriptionKey: "pricing.plans.starter.description",
      monthlyPrice: 0,
      annualPrice: 0,
      annualTotal: 0,
      features: [
        "AI Extracts for fast trade logging",
        "Unlimited manual uploads",
        "Anti duplicate trade detection",
        "Capital tracking",
        "Simple dashboard",
        "Basic charts",
        "Basic journal",
        "Fee analytics",
        "CSV export",
        "Social features",
      ],
      ctaKey: "pricing.plans.cta",
      popular: false,
      priceCurrency: "USD",
    },
    {
      id: 'pro',
      nameKey: "pricing.plans.pro.name",
      descriptionKey: "pricing.plans.pro.description",
      monthlyPrice: 18,
      annualPrice: 14.4,
      annualTotal: 172.8,
      features: [
        "200 AI uploads/month",
        "AI-powered trade analysis",
        "Trading plan builder",
        "Goals & targets tracking",
        "Rich journal with attachments",
        "Custom dashboard widgets",
        "Full social features",
        "Everything in Starter",
      ],
      ctaKey: "pricing.plans.cta",
      popular: true,
      priceCurrency: "USD",
    },
    {
      id: 'elite',
      nameKey: "pricing.plans.elite.name",
      descriptionKey: "pricing.plans.elite.description",
      monthlyPrice: 30,
      annualPrice: 24,
      annualTotal: 288,
      features: [
        "Unlimited AI uploads",
        "Advanced AI analysis",
        "Trade replay & visualization",
        "Position size calculator",
        "Risk management dashboard",
        "Advanced performance alerts",
        "Everything in Pro",
      ],
      ctaKey: "pricing.plans.cta",
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
                  <h3 className="text-xl md:text-2xl font-bold mb-1.5">{t(plan.nameKey)}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-3">
                    {t(plan.descriptionKey)}
                  </p>
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
                      {t('pricing.savingsAmount', { amount: getSavings(plan) })}
                    </div>
                  )}
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
                  {t(plan.ctaKey)}
                </Button>

                <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                  {t('pricing.plans.terms')}
                </p>

                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        size={18}
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-primary" : "text-foreground"
                        }`}
                      />
                      <span className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature}</span>
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
