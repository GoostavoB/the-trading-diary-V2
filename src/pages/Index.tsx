import { useEffect } from "react";
import Hero from "@/components/Hero";
import MobileHero from "@/components/landing/MobileHero";
import FeatureBlocks from "@/components/landing/FeatureBlocks";
import VideoSection from "@/components/landing/VideoSection";
import { HeroFeatureBanner } from "@/components/landing/HeroFeatureBanner";
import { ValueBar } from "@/components/landing/ValueBar";
import { WaveDivider } from "@/components/landing/WaveDivider";
import KeyBenefits from "@/components/landing/KeyBenefits";
import ProductShowcase from "@/components/landing/ProductShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import GamificationExplainer from "@/components/landing/GamificationExplainer";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import SecurityTrust from "@/components/landing/SecurityTrust";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { SkipToContent } from "@/components/SkipToContent";
import StickyMobileCTA from "@/components/landing/StickyMobileCTA";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { updateLandingMeta, addStructuredData, trackLandingView, trackCTAClick } from "@/utils/i18nLandingMeta";
import { useHreflang } from "@/hooks/useHreflang";
import { SUPPORTED_LANGUAGES } from "@/utils/languageRouting";
import { swCleanup } from "@/utils/swCleanup";
import { BookOpen, FileSpreadsheet, Zap, ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedStats } from "@/components/pricing/AnimatedStats";
import { ProblemVisual } from "@/components/pricing/ProblemVisual";
import { XPProgressAnimation } from "@/components/pricing/XPProgressAnimation";
import InteractiveSpeedChart from "@/components/pricing/InteractiveSpeedChart";
import { SecurityVisual } from "@/components/pricing/SecurityVisual";
import { SocialProofSection } from "@/components/pricing/SocialProofSection";
import PricingComparison from "@/components/pricing/PricingComparison";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { UploadSpeedCalculator } from "@/components/landing/UploadSpeedCalculator";
import { CustomizationOptions } from "@/components/landing/CustomizationOptions";
import { FeatureComparison } from "@/components/landing/FeatureComparison";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
const Index = () => {
  const navigate = useNavigate();
  const {
    t,
    language,
    changeLanguage,
    isLoading
  } = useTranslation();

  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });

  // Language is set by i18n initialization - no need to force it here

  useEffect(() => {
    // Temporary: clear old service worker and caches to avoid stale UI
    swCleanup();

    // Update meta tags and SEO for English (USA)
    updateLandingMeta('en');
    addStructuredData('en');

    // Track landing view
    trackLandingView('en');
  }, []);
  const handleCTAClick = (location: string) => {
    trackCTAClick('en', location);
    navigate('/auth?lang=en');
  };

  // Loading is handled at App level - no need for page-level guard

  return <div key={`landing-${language}`} className="min-h-screen bg-gray-950 overflow-x-hidden relative">
      <AnimatedBackground />
      <SkipToContent />
      <ValueBar />
      <PublicHeader />
      <StickyMobileCTA />
      
      <main id="main-content" className="pt-28 overflow-x-hidden">
        {/* Mobile Hero with Dashboard Preview */}
        <MobileHero />
        
        {/* Desktop Hero */}
        <Hero />
        
        {/* SEO Feature Banner - Keywords below hero */}
        <section id="features-section">
          <HeroFeatureBanner />
        </section>
        
        {/* Problem Statement */}
        <section className="px-6 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Most traders fail because they lack consistency.
                </h2>
                <div className="space-y-4 text-[17px] text-muted-foreground/70">
                  <p>90% of traders lose money because they don't journal, track performance, or follow a daily structure. Emotions take over. Discipline disappears. Losses pile up.</p>
                  <p>Our system fixes that. Automatically. By making discipline rewarding through gamification, we help you build the habits that separate winning traders from the rest.</p>
                </div>
              </motion.div>
              <ProblemVisual />
            </div>
          </div>
        </section>

        {/* XP System Explainer */}
        <section id="gamification" className="px-6 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <XPProgressAnimation />
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Discipline, gamified.
                </h2>
                <div className="space-y-4 text-[17px] text-muted-foreground/70">
                  <p>Our XP system rewards consistency and discipline. Every time you follow your plan, journal your trades, and stick to your rules, you earn XP and level up your profile.</p>
                  <p>The system trains your mind through repetition and small wins. It's not just tracking—it's behavioral transformation backed by real performance data.</p>
                </div>
                <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                  <p className="font-semibold">Traders who journal and review trades consistently show an average 23% performance improvement in 4 weeks (based on data from over 1,000 active users).</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="px-6 py-20 relative">
          <div className="container mx-auto max-w-5xl relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center">
              <motion.h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent" initial={{
              opacity: 0,
              y: -20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.8
            }}>
                Stop trading blind. Stop leaking profits.
              </motion.h2>
              <p className="text-[18px] text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
                Most traders don't fail because of strategy — they fail because of emotion and lack of structure.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                {[{
                text: "You trade impulsively when emotional."
              }, {
                text: "You repeat the same mistakes."
              }, {
                text: "You don't know what's really costing you money."
              }].map((pain, index) => <motion.div key={index} initial={{
                opacity: 0,
                y: 30
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.5,
                delay: index * 0.15
              }} whileHover={{
                scale: 1.05,
                y: -5
              }} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100" />
                    
                    <div className="relative glass-card p-6 border border-destructive/30 bg-destructive/10 backdrop-blur-xl rounded-xl hover:border-destructive/50 transition-all duration-300 h-full">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-destructive/30 rounded-full blur-md" />
                            <svg className="w-6 h-6 text-destructive relative z-10" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-[16px] font-medium text-foreground text-left leading-relaxed pt-0.5">
                          {pain.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>)}
              </div>

              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6,
              delay: 0.5
            }} className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-warning/20 rounded-2xl blur-2xl" />
                <div className="relative flex items-center justify-center gap-3 px-8 py-4 border border-warning/40 bg-warning/10 backdrop-blur-xl rounded-2xl">
                  <svg className="w-6 h-6 text-warning flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[16px] font-bold text-warning">
                    Thousands of traders are already mastering consistency with The Trading Diary.
                  </span>
                </div>
              </motion.div>

              <p className="text-[17px] text-muted-foreground/90 mb-10 font-medium">
                Don't fall behind.
              </p>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6,
              delay: 0.6
            }}>
                <Button onClick={() => handleCTAClick('pain-section')} size="lg" className="text-[16px] font-bold px-10 py-6 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300">
                  Start Free Trial – Offer Ending Soon
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Gamification Discipline Section */}
        <section className="px-6 py-20">
          <div className="container mx-auto max-w-5xl">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                The only trading tool that trains your discipline.
              </h2>
              <p className="text-[17px] text-muted-foreground/70 mb-2">
                Trading requires discipline. Discipline requires habits.
              </p>
              <p className="text-[17px] text-muted-foreground/70 mb-12">
                Habits require dopamine. Our XP system delivers it.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[{
                icon: "⚡",
                label: "Every trade",
                title: "XP"
              }, {
                icon: "🔥",
                label: "Every streak",
                title: "Reward"
              }, {
                icon: "🏆",
                label: "Every tier",
                title: "New tools"
              }].map((item, index) => <motion.div key={index} initial={{
                opacity: 0,
                y: 20
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.5,
                delay: index * 0.1
              }} className="glass-card p-8 border border-primary/20 hover:border-primary/40 transition-colors">
                    <div className="mb-4 text-5xl flex items-center justify-center">
                      {item.icon}
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-2">{item.label}</p>
                    <h3 className="text-[24px] font-bold text-foreground">{item.title}</h3>
                  </motion.div>)}
              </div>

              <motion.p initial={{
              opacity: 0
            }} whileInView={{
              opacity: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: 0.4
            }} className="text-[16px] font-semibold mb-8">
                Gamification makes consistency addictive — not stressful.
              </motion.p>

              <Button onClick={() => handleCTAClick('gamification-section')} size="lg" className="text-[15px] font-semibold px-8">
                Earn Your First XP – Start Free
              </Button>
            </motion.div>
          </div>
        </section>
        
        {/* Mobile Feature Blocks */}
        <section id="features">
          <FeatureBlocks />
        </section>
        
        {/* Mobile Video Section */}
        <VideoSection />
        
        {/* Key Benefits */}
        <KeyBenefits />
        
        {/* Product Showcase */}
        <section id="dashboard">
          <ProductShowcase />
        </section>

        {/* Upload Speed Calculator - NEW */}
        <UploadSpeedCalculator />

        {/* Customization Options - NEW */}
        <CustomizationOptions />
        
        {/* Speed Chart Section */}
        <section className="px-6 py-20">
          <InteractiveSpeedChart />
        </section>
        
        {/* Featured Trading Resources */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trading Resources & Guides
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Learn how to track trades effectively, compare tools, and set up multi-exchange tracking
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <a href="/blog/how-to-track-crypto-trades" className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    How to Track Crypto Trades
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete guide to logging trades across Binance, Bybit, Coinbase and more. CSV exports vs API automation.
                </p>
              </a>

              {/* Card 2 */}
              <a href="/blog/trading-journal-vs-spreadsheet" className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    Trading Journal vs Spreadsheet
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Excel vs dedicated journal comparison. Feature breakdown, migration guide, and cost-benefit analysis.
                </p>
              </a>

              {/* Card 3 */}
              <a href="/blog/exchange-sync-guide" className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    Multi-Exchange Setup Guide
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Step-by-step API connection for Binance, Bybit, Coinbase, OKX, Kraken. Security best practices included.
                </p>
              </a>
            </div>

            {/* CTA Row */}
            <div className="mt-10 text-center">
              <Button onClick={() => navigate('/blog')} variant="outline" size="lg" className="group">
                View All Trading Guides
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <WaveDivider color="hsl(var(--background))" className="text-background -mt-1" />
        <HowItWorks />
        
        {/* Gamification Layer */}
        <GamificationExplainer />

        {/* Security Section */}
        <section className="px-6 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Safe by design. Your data, your trades.
                </h2>
                <div className="space-y-4 text-[17px] text-muted-foreground/70">
                  <p>We never connect to APIs or exchanges. Your trading data is encrypted and saved securely on our cloud infrastructure. Only you can access it.</p>
                  <p>No risk of external tracking or data leaks. No third-party integrations that compromise your privacy. 100% trader-owned data.</p>
                </div>
              </motion.div>
              <SecurityVisual />
            </div>
          </div>
        </section>
        
        {/* Social Proof */}
        <WaveDivider color="hsl(var(--background))" flip className="text-background -mb-1" />
        <Testimonials />
        
        {/* Pricing */}
        <Pricing />

        {/* Feature Comparison - NEW */}
        <FeatureComparison />

        {/* Built from Real Data */}
        <SocialProofSection />
        
        {/* Trust & Security */}
        <SecurityTrust />
        
        {/* Final CTA */}
        <CTA />
      </main>
      
      <Footer />
    </div>;
};
export default Index;