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
import { BookOpen, FileSpreadsheet, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        
        {/* Mobile Feature Blocks */}
        <FeatureBlocks />
        
        {/* Mobile Video Section */}
        <VideoSection />
        
        {/* Key Benefits */}
        <KeyBenefits />
        
        {/* Product Showcase */}
        <ProductShowcase />
        
        {/* Pain + FOMO */}
        <PainFOMO />
        
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
        
        {/* Social Proof */}
        <WaveDivider color="hsl(var(--background))" flip className="text-background -mb-1" />
        <Testimonials />
        
        {/* Pricing */}
        <Pricing />
        
        {/* Trust & Security */}
        <SecurityTrust />
        
        {/* Final CTA */}
        <CTA />
      </main>
      
      <Footer />
    </div>;
};
export default Index;