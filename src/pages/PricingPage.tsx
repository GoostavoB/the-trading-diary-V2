import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion } from "framer-motion";
import PricingComparison from "@/components/PricingComparison";
import { OutcomeCard } from "@/components/premium/OutcomeCard";
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
  const heroRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Detect language from URL and set it
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/pt/')) {
      changeLanguage('pt');
    } else if (path.startsWith('/es/')) {
      changeLanguage('es');
    } else if (path.startsWith('/ar/')) {
      changeLanguage('ar');
    } else if (path.startsWith('/vi/')) {
      changeLanguage('vi');
    }
  }, [changeLanguage]);

  usePageMeta({
    title: 'Pricing Plans - AI-Powered Crypto Trading Journal',
    description: 'Choose the perfect plan for your crypto trading journey. AI insights, pattern recognition, risk management, and performance analytics.',
    canonical: 'https://www.thetradingdiary.com/pricing',
  });

  const solutions = [
    {
      headline: t('pricing.solutions.seePatterns.headline'),
      subhead: t('pricing.solutions.seePatterns.subhead'),
      metric: t('pricing.solutions.seePatterns.metric'),
      metricValue: 3,
      proofPoint: t('pricing.solutions.seePatterns.proofPoint'),
      visual: (
        <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 to-accent/5 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 gap-2 p-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded bg-primary/20"
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      headline: t('pricing.solutions.knowEdge.headline'),
      subhead: t('pricing.solutions.knowEdge.subhead'),
      metric: t('pricing.solutions.knowEdge.metric'),
      metricValue: 67,
      proofPoint: t('pricing.solutions.knowEdge.proofPoint'),
      visual: (
        <div className="relative w-full h-48">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {[30, 45, 60, 75, 90].map((height, i) => (
              <motion.rect
                key={i}
                x={i * 35 + 10}
                y={100 - height}
                width="25"
                height={height}
                fill="currentColor"
                className="text-primary/60"
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            ))}
          </svg>
        </div>
      ),
    },
    {
      headline: t('pricing.solutions.tradeConfidence.headline'),
      subhead: t('pricing.solutions.tradeConfidence.subhead'),
      metric: t('pricing.solutions.tradeConfidence.metric'),
      metricValue: 89,
      proofPoint: t('pricing.solutions.tradeConfidence.proofPoint'),
      visual: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-primary"
                initial={{ strokeDasharray: '0 251.2' }}
                animate={{ strokeDasharray: '224 251.2' }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              89%
            </div>
          </div>
        </div>
      ),
    },
    {
      headline: "Upload 40x Faster",
      subhead: "Batch upload trades from screenshots instead of manual entry",
      metric: "40x",
      metricValue: 40,
      proofPoint: "Batch uploads from screenshots beat manual entry every time",
      visual: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="relative">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-40 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-white/10"
                style={{
                  left: `${i * 12}px`,
                  top: `${i * 8}px`,
                  zIndex: 3 - i,
                }}
                initial={{ rotateZ: 0, y: 0 }}
                animate={{
                  rotateZ: i * 4,
                  y: i * -2,
                }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      headline: "Save 75-97% of Your Time",
      subhead: "Spend less time logging, more time analyzing and trading",
      metric: "97%",
      metricValue: 97,
      proofPoint: "Spend less time logging, more time winning",
      visual: (
        <div className="relative w-full h-48">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <motion.path
              d="M 10 90 Q 50 70, 100 40 T 190 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-primary"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      ),
    },
    {
      headline: t('pricing.solutions.yourRules.headline'),
      subhead: t('pricing.solutions.yourRules.subhead'),
      metric: t('pricing.solutions.yourRules.metric'),
      metricValue: 8,
      proofPoint: t('pricing.solutions.yourRules.proofPoint'),
      visual: (
        <div className="relative w-full h-48 grid grid-cols-3 grid-rows-3 gap-2 p-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg border border-white/10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
      ),
    },
  ];

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
              Your rules.{' '}
              <span className="font-serif italic text-primary">Your results.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              If you cannot measure it, you cannot improve it.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {solutions.map((solution, index) => (
              <OutcomeCard key={index} {...solution} index={index} />
            ))}
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
                <span className="text-sm font-bold text-white uppercase tracking-wider">Coming Soon</span>
              </div>
              
              {/* Enterprise */}
              <div className="mb-12">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Enterprise</h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Team collaboration, powerful reports & white label solutions for professional trading teams
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <span>• Team Collaboration Tools</span>
                  <span>• Advanced Reporting</span>
                  <span>• White Label Solution</span>
                  <span>• Priority Support</span>
                  <span>• Custom Integrations</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-12" />

              {/* Mobile Apps */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  iOS & Android Apps
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Native mobile apps are in development. Soon you'll be able to take your trading diary with you, track trades, analyze performance, and stay on top of your game from anywhere.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <img 
                    src={appStoreSoon} 
                    alt="Coming soon to the App Store" 
                    className="h-14 hover:opacity-80 transition-opacity"
                  />
                  <img 
                    src={googlePlaySoon} 
                    alt="Coming soon to Google Play" 
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
