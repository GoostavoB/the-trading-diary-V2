import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useHreflang } from "@/hooks/useHreflang";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/utils/languageRouting";
import { motion } from "framer-motion";
import PricingComparison from "@/components/PricingComparison";
import { WideOutcomeCard } from "@/components/premium/WideOutcomeCard";
import { ParallaxTradingElements } from "@/components/premium/ParallaxTradingElements";
import { PremiumPricingCard } from "@/components/PremiumPricingCard";
import { MagneticButton } from "@/components/MagneticButton";
import { PremiumBillingToggle } from "@/components/premium/PremiumBillingToggle";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import appStoreSoon from "@/assets/coming_soon_appstore.png";
import googlePlaySoon from "@/assets/google-play-coming-soon.png";

const PricingPage = () => {
  const navigate = useNavigate();
  const { t, changeLanguage } = useTranslation();
  
  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });
  
  const heroRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Sync language with URL
  useEffect(() => {
    const pathLang = window.location.pathname.split('/')[1];
    if (['pt', 'es', 'ar', 'vi'].includes(pathLang)) {
      changeLanguage(pathLang as SupportedLanguage);
    }
  }, [changeLanguage]);

  usePageMeta({
    title: 'Pricing Plans - AI-Powered Crypto Trading Journal',
    description: 'Choose the perfect plan for your crypto trading journey. AI insights, pattern recognition, risk management, and performance analytics.',
    canonical: 'https://www.thetradingdiary.com/pricing',
  });


  const plans = [
    {
      id: 'basic',
      nameKey: "pricing.plans.basic.name",
      descriptionKey: "pricing.plans.basic.description",
      monthlyPrice: 15,
      annualPrice: 12,
      annualTotal: 144,
      featuresKeys: [
        "pricing.plans.basic.features.uploads",
        "pricing.plans.basic.features.manualUploads",
        "pricing.plans.basic.features.dashboard",
        "pricing.plans.basic.features.charts",
        "pricing.plans.basic.features.basicJournal",
        "pricing.plans.basic.features.feeAnalytics",
        "pricing.plans.basic.features.csv",
        "pricing.plans.basic.features.social",
      ],
      ctaKey: "pricing.plans.cta",
      popular: false,
    },
    {
      id: 'pro',
      nameKey: "pricing.plans.pro.name",
      descriptionKey: "pricing.plans.pro.description",
      monthlyPrice: 35,
      annualPrice: 28,
      annualTotal: 336,
      featuresKeys: [
        "pricing.plans.pro.features.uploads",
        "pricing.plans.pro.features.aiAnalysis",
        "pricing.plans.pro.features.tradingPlan",
        "pricing.plans.pro.features.goals",
        "pricing.plans.pro.features.richJournal",
        "pricing.plans.pro.features.customWidgets",
        "pricing.plans.pro.features.fullSocial",
        "pricing.plans.pro.features.everythingBasic",
      ],
      ctaKey: "pricing.plans.cta",
      popular: true,
    },
    {
      id: 'elite',
      nameKey: "pricing.plans.elite.name",
      descriptionKey: "pricing.plans.elite.description",
      monthlyPrice: 79,
      annualPrice: 63,
      annualTotal: 756,
      featuresKeys: [
        "pricing.plans.elite.features.uploads",
        "pricing.plans.elite.features.aiAnalysis",
        "pricing.plans.elite.features.tradeReplay",
        "pricing.plans.elite.features.positionCalculator",
        "pricing.plans.elite.features.riskDashboard",
        "pricing.plans.elite.features.advancedAlerts",
        "pricing.plans.elite.features.everythingPro",
      ],
      ctaKey: "pricing.plans.cta",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Logo */}
      <div 
        className="absolute top-6 left-6 z-50 cursor-pointer" 
        onClick={() => navigate('/')}
      >
        <Logo 
          size="lg" 
          variant="horizontal" 
          showText={true} 
          className="hover:opacity-80 transition-opacity"
        />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-16 md:py-20 px-6">
        <div className="container relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              {t('pricing.hero.title')}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('pricing.hero.subtitle')}
            </p>
            
            <div className="flex justify-center">
              <MagneticButton
                onClick={() => navigate('/auth')}
                size="lg"
                className="px-10 py-7"
              >
                {t('pricing.hero.primaryCta')}
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="relative py-16 px-6 overflow-hidden">
        <ParallaxTradingElements />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('pricing.solutions.headline1', 'Your rules.')}{' '}
              <span className="font-serif italic text-primary">{t('pricing.solutions.headline2', 'Your results.')}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              {t('pricing.solutions.tagline', 'If you cannot measure it, you cannot improve it.')}
            </motion.p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
            <WideOutcomeCard
              headline={t('pricing.solutions.outcome1.headline', 'Upload 40x Faster')}
              subhead={t('pricing.solutions.outcome1.subhead', 'Batch upload trades from screenshots instead of manual entry')}
              metric="40x"
              metricValue={40}
              proofPoint={t('pricing.solutions.outcome1.proof', 'Batch uploads from screenshots beat manual entry every time')}
            />
            <WideOutcomeCard
              headline={t('pricing.solutions.outcome2.headline', 'Save 75-97% of Your Time')}
              subhead={t('pricing.solutions.outcome2.subhead', 'Spend less time logging, more time analyzing and trading')}
              metric="97%"
              metricValue={97}
              proofPoint={t('pricing.solutions.outcome2.proof', 'Spend less time logging, more time winning')}
            />
          </div>
        </div>
      </section>


      {/* Pricing Cards */}
      <section ref={pricingRef} className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
              style={{ letterSpacing: '-0.01em' }}
            >
              {t('pricing.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.09, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              {t('pricing.subtitle')}
            </motion.p>

            {/* Premium Billing Toggle */}
            <div className="flex justify-center mb-6">
              <PremiumBillingToggle
                billingCycle={billingCycle}
                onToggle={setBillingCycle}
              />
            </div>

            {/* Guarantee Banner */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.27 }}
              viewport={{ once: true }}
              className="text-sm text-muted-foreground dark:text-muted-foreground/70"
            >
              {t('pricing.guaranteeNote')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <PremiumPricingCard 
                key={plan.id} 
                plan={plan} 
                billingCycle={billingCycle}
                index={index}
                t={t}
              />
            ))}
          </div>

          {/* Coming Soon Section - Enterprise & Mobile Apps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative mt-12"
          >
            <GlassCard className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-accent via-primary to-accent bg-size-200 animate-gradient mb-8 shadow-lg shadow-accent/20">
                <span className="text-sm font-bold text-white uppercase tracking-wider">{t('pricing.comingSoon.badge', 'Coming Soon')}</span>
              </div>
              
              {/* Enterprise */}
              <div className="mb-12">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">{t('pricing.comingSoon.enterprise.title', 'Enterprise')}</h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  {t('pricing.comingSoon.enterprise.description', 'Team collaboration, powerful reports & white label solutions for professional trading teams')}
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <span>• {t('pricing.comingSoon.enterprise.features.collaboration', 'Team Collaboration Tools')}</span>
                  <span>• {t('pricing.comingSoon.enterprise.features.reporting', 'Advanced Reporting')}</span>
                  <span>• {t('pricing.comingSoon.enterprise.features.whiteLabel', 'White Label Solution')}</span>
                  <span>• {t('pricing.comingSoon.enterprise.features.support', 'Priority Support')}</span>
                  <span>• {t('pricing.comingSoon.enterprise.features.integrations', 'Custom Integrations')}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-12" />

              {/* Mobile Apps */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {t('pricing.comingSoon.mobile.title', 'iOS & Android Apps')}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  {t('pricing.comingSoon.mobile.description', 'Native mobile apps are in development. Soon you\'ll be able to take your trading diary with you, track trades, analyze performance, and stay on top of your game from anywhere.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <img 
                    src={appStoreSoon} 
                    alt={t('pricing.comingSoon.mobile.appStoreAlt', 'Coming soon to the App Store')}
                    className="h-14 hover:opacity-80 transition-opacity"
                  />
                  <img 
                    src={googlePlaySoon} 
                    alt={t('pricing.comingSoon.mobile.playStoreAlt', 'Coming soon to Google Play')}
                    className="h-14 hover:opacity-80 transition-opacity"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <PricingComparison />

      {/* Final CTA Button */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <MagneticButton
            onClick={() => navigate('/auth')}
            className="text-xl px-16 py-8"
          >
            {t('pricing.hero.primaryCta')}
          </MagneticButton>
        </div>
      </section>
    </div>
  );
};

// Remove the old SolutionCard component as it's now in its own file

export default PricingPage;
