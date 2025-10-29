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
import PainFOMO from "@/components/landing/PainFOMO";
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

  return <div key={`landing-${language}`} className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-x-hidden">
      <SkipToContent />
      <ValueBar />
      <PublicHeader />
      <StickyMobileCTA />
      
      <main id="main-content" className="pt-28 overflow-x-hidden my-0 py-px">
        {/* Mobile Hero with Dashboard Preview */}
        <MobileHero />
        
        {/* Desktop Hero */}
        <Hero />
        
        {/* SEO Feature Banner - Keywords below hero */}
        <HeroFeatureBanner />
        
        {/* Benefits Section - NEW */}
        <BenefitsSection />

        {/* Included in All Plans */}
        <section className="px-6 mb-20">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 md:p-10 border border-primary/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-[24px] md:text-[28px] font-bold mb-3 text-center bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Included in all plans
                </h3>
                <p className="text-[14px] text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                  Every plan includes our core features to help you track, analyze, and improve your trading
                </p>
                
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    "AI uploads from image screenshots",
                    "Weekly heatmap and best assets",
                    "Fees dashboard. Compare how much fee you are paying in each exchange",
                    "Leverage and position size calculator",
                    "Pre-trade checklist",
                    "Encrypted data and CSV export"
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="flex items-start gap-3 group"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-colors" />
                          <CircleCheck className="w-5 h-5 text-primary relative z-10" strokeWidth={2} />
                        </div>
                      </div>
                      <span className="text-[15px] leading-relaxed text-foreground/90 font-medium">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
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

        {/* Problem Statement */}
        <section className="px-6 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
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
        
        {/* Product Showcase */}
        <section id="dashboard">
          <ProductShowcase />
        </section>

        {/* Upload Speed Calculator - NEW */}
        <UploadSpeedCalculator />

        {/* Customization Options - NEW */}
        <CustomizationOptions />

        {/* XP System Explainer */}
        <section id="gamification" className="px-6 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <XPProgressAnimation />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
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
        
        {/* Pain + FOMO */}
        <PainFOMO />

        {/* Speed Chart Section */}
        <section className="px-6 py-20">
          <InteractiveSpeedChart />
        </section>
        
        {/* Featured Trading Resources */}
        <section className="py-20 px-4 bg-secondary/20">
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
              <a 
                href="/blog/how-to-track-crypto-trades" 
                className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
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
              <a 
                href="/blog/trading-journal-vs-spreadsheet" 
                className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
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
              <a 
                href="/blog/exchange-sync-guide" 
                className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
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
              <Button 
                onClick={() => navigate('/blog')} 
                variant="outline" 
                size="lg"
                className="group"
              >
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
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
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