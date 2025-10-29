import { useEffect } from "react";
import Hero from "@/components/Hero";
import MobileHero from "@/components/landing/MobileHero";
import FeatureBlocks from "@/components/landing/FeatureBlocks";
import VideoSection from "@/components/landing/VideoSection";
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

const Index = () => {
  const navigate = useNavigate();
  const { t, language, changeLanguage, isLoading } = useTranslation();

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

  return (
    <div key={`landing-${language}`} className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-x-hidden">
      <SkipToContent />
      <ValueBar />
      <PublicHeader />
      <StickyMobileCTA />
      
      <main id="main-content" className="pt-28 overflow-x-hidden">
        {/* Mobile Hero with Dashboard Preview */}
        <MobileHero />
        
        {/* Desktop Hero */}
        <Hero />
        
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
    </div>
  );
};

export default Index;
