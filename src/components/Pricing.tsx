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
      name: "Starter",
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
      <section id="pricing-section" className="py-16 md:py-20 px-6 relative overflow-hidden" aria-labelledby="pricing-heading">
        {/* Ambient Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/2 left-[30%] w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: 'radial-gradient(circle, rgba(45,104,255,0.08), transparent 60%)',
              filter: 'blur(120px)',
            }}
          />
          <div 
            className="absolute top-1/2 right-[30%] w-[600px] h-[600px] translate-x-1/2 -translate-y-1/2"
            style={{
              background: 'radial-gradient(circle, rgba(255,200,45,0.08), transparent 60%)',
              filter: 'blur(120px)',
            }}
          />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
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
              Launch pricing available until November 30, 2025
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

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto" role="list">
            {plans.map((plan, index) => {
              const isFree = plan.id === 'free';
              const isElite = plan.id === 'elite';
              
              return (
              <motion.article
                role="listitem"
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  y: -6, 
                  scale: plan.popular ? 1.07 : isElite ? 1.04 : 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className={`relative rounded-3xl p-7 md:p-8 transition-all duration-300 group
                  ${plan.popular ? 'md:scale-105' : isElite ? 'md:scale-102' : 'md:scale-100'}
                `}
                style={{
                  background: isFree 
                    ? 'rgba(255,255,255,0.02)'
                    : plan.popular
                    ? 'linear-gradient(180deg, rgba(45,104,255,0.12), rgba(45,104,255,0.05))'
                    : 'linear-gradient(180deg, rgba(255,200,45,0.12), rgba(255,200,45,0.05))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.popular
                    ? '0 4px 25px rgba(0,0,0,0.45), 0 0 0 rgba(45,104,255,0)'
                    : '0 4px 25px rgba(0,0,0,0.45)',
                }}
              >
                {/* Hover glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: plan.popular
                      ? '0 0 30px rgba(45,104,255,0.4)'
                      : isElite
                      ? '0 0 30px rgba(255,200,45,0.35)'
                      : 'none'
                  }}
                />

                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-white z-20 shadow-lg"
                    style={{
                      background: 'linear-gradient(90deg, #2D68FF, #5A8CFF)',
                      boxShadow: '0 4px 12px rgba(45,104,255,0.4)',
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <Sparkles size={12} />
                      Most Popular
                    </span>
                  </motion.div>
                )}
                

                <div className="mb-6 relative z-10">
                  <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${
                    isElite ? 'bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent' : 'text-foreground'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground/65 text-sm mb-6 font-light">
                    {plan.description}
                  </p>
                  {plan.monthlyPrice > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`font-bold ${plan.popular ? 'text-5xl' : 'text-4xl'}`} style={{ color: 'hsl(var(--primary))' }}>
                          ${getDisplayPrice(plan)}
                        </span>
                        <span className="text-sm text-muted-foreground/65 font-light">
                          /{billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perMonthBilledAnnually')}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="text-sm text-green-400 font-semibold mb-1">
                          Save ${getSavings(plan)} annually
                        </div>
                      )}
                      {plan.monthlyPrice > 0 && (
                        <p className="text-xs text-muted-foreground/50 font-light">
                          {billingCycle === 'annual' ? `$${plan.annualTotal}/year billed annually` : 'Billed monthly'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>
                      Free
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={handleAuthNavigate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full h-12 mb-4 rounded-xl font-semibold transition-all relative z-10 overflow-hidden shadow-lg group/btn
                    ${plan.popular
                      ? ""
                      : isElite
                      ? "bg-amber-500/15 border-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500/50"
                      : "bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                  style={plan.popular ? {
                    background: 'linear-gradient(90deg, #2D68FF, #5A8CFF)',
                    boxShadow: '0 4px 15px rgba(45,104,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  } : undefined}
                >
                  {plan.popular && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {plan.cta}
                    {plan.popular && (
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        →
                      </motion.span>
                    )}
                  </span>
                </motion.button>

                <p className="text-xs text-muted-foreground/50 text-center mb-6 leading-relaxed relative z-10 font-light">
                  {isFree 
                    ? "Get started with the essentials" 
                    : plan.popular 
                    ? "Unlock your full trading potential" 
                    : "Experience total control and customization"}
                </p>

                <ul className="space-y-3 relative z-10">
                  {plan.features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <motion.li 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (i * 0.05) }}
                        className="flex items-start gap-3"
                      >
                        {Icon ? (
                          <Icon
                            size={20}
                            className="mt-0.5 flex-shrink-0 text-primary"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <Check
                            size={20}
                            className={`mt-0.5 flex-shrink-0 ${
                              plan.popular ? "text-primary" : isElite ? "text-amber-400" : "text-foreground/60"
                            }`}
                            strokeWidth={2.5}
                          />
                        )}
                        <span className="text-sm text-muted-foreground/80 leading-relaxed font-light">
                          {feature.text}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.article>
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
