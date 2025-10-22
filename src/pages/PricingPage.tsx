import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion } from "framer-motion";
import { Sparkles, Target, Shield, TrendingUp, FileText, LayoutDashboard, Users } from "lucide-react";
import PricingComparison from "@/components/PricingComparison";
import PricingRoadmap from "@/components/PricingRoadmap";
import CTA from "@/components/CTA";
import { ShaderBackground } from "@/components/ShaderBackground";
import { SolutionCard } from "@/components/SolutionCard";
import { PremiumPricingCard } from "@/components/PremiumPricingCard";
import { MagneticButton } from "@/components/MagneticButton";

const PricingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [backgroundIntensity, setBackgroundIntensity] = useState(1.0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  usePageMeta({
    title: 'Pricing Plans - AI-Powered Crypto Trading Journal',
    description: 'Choose the perfect plan for your crypto trading journey. AI insights, pattern recognition, risk management, and performance analytics.',
    canonical: 'https://www.thetradingdiary.com/pricing',
  });

  // Scroll-linked background intensity
  useEffect(() => {
    const handleScroll = () => {
      if (pricingRef.current) {
        const rect = pricingRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Increase intensity as pricing section approaches
        if (rect.top < windowHeight && rect.top > 0) {
          const progress = 1 - (rect.top / windowHeight);
          setBackgroundIntensity(1 + progress * 0.08);
        } else if (rect.top <= 0) {
          // Return to baseline when section is in view
          setBackgroundIntensity(1.0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const solutions = [
    {
      icon: Sparkles,
      title: t('pricing.solutions.aiInsights.title'),
      description: t('pricing.solutions.aiInsights.description'),
      outcome: t('pricing.solutions.aiInsights.outcome')
    },
    {
      icon: Target,
      title: t('pricing.solutions.patternRecognition.title'),
      description: t('pricing.solutions.patternRecognition.description'),
      outcome: t('pricing.solutions.patternRecognition.outcome')
    },
    {
      icon: Shield,
      title: t('pricing.solutions.riskManagement.title'),
      description: t('pricing.solutions.riskManagement.description'),
      outcome: t('pricing.solutions.riskManagement.outcome')
    },
    {
      icon: TrendingUp,
      title: t('pricing.solutions.performanceAnalytics.title'),
      description: t('pricing.solutions.performanceAnalytics.description'),
      outcome: t('pricing.solutions.performanceAnalytics.outcome')
    },
    {
      icon: FileText,
      title: t('pricing.solutions.notesAttachments.title'),
      description: t('pricing.solutions.notesAttachments.description'),
      outcome: t('pricing.solutions.notesAttachments.outcome')
    },
    {
      icon: LayoutDashboard,
      title: t('pricing.solutions.customDashboard.title'),
      description: t('pricing.solutions.customDashboard.description'),
      outcome: t('pricing.solutions.customDashboard.outcome')
    },
    {
      icon: Users,
      title: t('pricing.solutions.builtByTraders.title'),
      description: t('pricing.solutions.builtByTraders.description'),
      outcome: t('pricing.solutions.builtByTraders.outcome')
    }
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
    <div className="min-h-screen relative">
      {/* WebGL Shader Background */}
      <ShaderBackground intensity={backgroundIntensity} />

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-32 md:py-40 px-6 overflow-hidden">
        <div className="container relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight" 
              style={{ letterSpacing: '-0.02em', maxWidth: '64ch', margin: '0 auto' }}
            >
              {t('pricing.hero.title')}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('pricing.hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton
                onClick={() => navigate('/auth')}
                size="lg"
                className="px-10 py-7 text-base"
              >
                {t('pricing.hero.primaryCta')}
              </MagneticButton>
              <MagneticButton
                onClick={() => {/* TODO: Add demo video */}}
                variant="outline"
                size="lg"
                className="px-10 py-7 text-base"
              >
                {t('pricing.hero.secondaryCta')}
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions Section with Scroll Animations */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
              style={{ letterSpacing: '-0.01em' }}
            >
              {t('pricing.solutions.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.09, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              {t('pricing.solutions.subtitle')}
            </motion.p>
          </div>
          
          <div className="space-y-8">
            {solutions.map((solution, index) => (
              <SolutionCard key={index} solution={solution} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section ref={pricingRef} className="py-32 px-6">
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

            {/* Billing Toggle with Physical Switch Feel */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.18 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-4 mb-4"
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-280 ease-premium ${
                  billingCycle === 'monthly'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.billing.monthly')}
              </button>
              
              <motion.button
                onClick={() => setBillingCycle('annual')}
                whileTap={{ scale: 0.98 }}
                className={`relative px-6 py-3 rounded-lg font-medium transition-all duration-280 ease-premium ${
                  billingCycle === 'annual'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('pricing.billing.annual')}
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {t('pricing.billing.save20')}
                </span>
              </motion.button>
            </motion.div>

            {/* Guarantee Banner */}
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.27 }}
              viewport={{ once: true }}
              className="text-sm text-muted-foreground"
            >
              {t('pricing.guaranteeNote')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
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
        </div>
      </section>

      {/* Comparison Table */}
      <PricingComparison />

      {/* Roadmap */}
      <PricingRoadmap />

      {/* Final CTA */}
      <CTA />
    </div>
  );
};

// Remove the old SolutionCard component as it's now in its own file

export default PricingPage;
