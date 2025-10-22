import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { addStructuredData } from "@/utils/seoHelpers";

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const plans = [
    {
      nameKey: "landing.pricing.starter.name",
      priceKey: "landing.pricing.starter.price",
      periodKey: "landing.pricing.starter.period",
      descriptionKey: "landing.pricing.starter.description",
      featuresKeys: [
        "landing.pricing.starter.features.trades",
        "landing.pricing.starter.features.analytics",
        "landing.pricing.starter.features.manualEntry",
        "landing.pricing.starter.features.retention",
        "landing.pricing.starter.features.support",
      ],
      ctaKey: "landing.pricing.starter.cta",
      popular: false,
      price: "Free",
      priceCurrency: "USD",
      priceValue: 0,
    },
    {
      nameKey: "landing.pricing.pro.name",
      priceKey: "landing.pricing.pro.price",
      periodKey: "landing.pricing.pro.period",
      descriptionKey: "landing.pricing.pro.description",
      featuresKeys: [
        "landing.pricing.pro.features.unlimited",
        "landing.pricing.pro.features.advancedAnalytics",
        "landing.pricing.pro.features.aiExtraction",
        "landing.pricing.pro.features.unlimitedRetention",
        "landing.pricing.pro.features.prioritySupport",
        "landing.pricing.pro.features.customSetups",
        "landing.pricing.pro.features.exportReports",
      ],
      ctaKey: "landing.pricing.pro.cta",
      popular: true,
      price: "$29",
      priceCurrency: "USD",
      priceValue: 29,
    },
    {
      nameKey: "landing.pricing.elite.name",
      priceKey: "landing.pricing.elite.price",
      periodKey: "landing.pricing.elite.period",
      descriptionKey: "landing.pricing.elite.description",
      featuresKeys: [
        "landing.pricing.elite.features.everythingPro",
        "landing.pricing.elite.features.multiAccount",
        "landing.pricing.elite.features.apiAccess",
        "landing.pricing.elite.features.whiteLabel",
        "landing.pricing.elite.features.accountManager",
        "landing.pricing.elite.features.earlyAccess",
        "landing.pricing.elite.features.teamCollaboration",
      ],
      ctaKey: "landing.pricing.elite.cta",
      popular: false,
      price: "$99",
      priceCurrency: "USD",
      priceValue: 99,
    },
  ];
  
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
          "price": plan.priceValue,
          "priceCurrency": plan.priceCurrency,
          "availability": "https://schema.org/InStock",
          "url": "https://www.thetradingdiary.com/auth",
          "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          "seller": {
            "@type": "Organization",
            "name": "The Trading Diary"
          }
        }
      }))
    };
    
    addStructuredData(offersSchema, 'pricing-offers-schema');
  }, [t]);

  return (
    <section className="py-16 md:py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {t('landing.pricing.title').split('Transparent')[0]}
            <span className="text-gradient-primary">Transparent</span>
            {t('landing.pricing.title').split('Transparent')[1]}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`glass backdrop-blur-[12px] rounded-2xl p-6 md:p-7 relative hover-lift transition-all shadow-sm animate-fade-in ${
                plan.popular ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles size={12} />
                  {t('landing.pricing.mostPopular')}
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-xl md:text-2xl font-bold mb-1.5">{t(plan.nameKey)}</h3>
                <p className="text-muted-foreground text-xs md:text-sm mb-3">
                  {t(plan.descriptionKey)}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{t(plan.priceKey)}</span>
                  <span className="text-sm text-muted-foreground">/{t(plan.periodKey)}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                className={`w-full mb-5 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : "glass border border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {t(plan.ctaKey)}
              </Button>

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
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-xs md:text-sm mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {t('landing.pricing.trialNote')}
        </p>
      </div>
    </section>
  );
};

export default Pricing;
