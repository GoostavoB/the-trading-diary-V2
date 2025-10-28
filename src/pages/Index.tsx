import { useEffect } from "react";
import Hero from "@/components/Hero";
import MobileHero from "@/components/landing/MobileHero";
import FeatureBlocks from "@/components/landing/FeatureBlocks";
import VideoSection from "@/components/landing/VideoSection";
import { ValueBar } from "@/components/landing/ValueBar";
import { WaveDivider } from "@/components/landing/WaveDivider";
import HowItWorks from "@/components/landing/HowItWorks";
import DashboardShowcase from "@/components/DashboardShowcase";
import Features from "@/components/Features";
import PainToValue from "@/components/landing/PainToValue";
import BuildSection from "@/components/landing/BuildSection";
import BenefitsGrid from "@/components/landing/BenefitsGrid";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import SecurityTrust from "@/components/landing/SecurityTrust";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { MobileHeader } from "@/components/MobileHeader";
import { SkipToContent } from "@/components/SkipToContent";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { updateLandingMeta, addStructuredData, trackLandingView, trackCTAClick } from "@/utils/i18nLandingMeta";
import { useHreflang } from "@/hooks/useHreflang";
import { SUPPORTED_LANGUAGES } from "@/utils/languageRouting";
import { swCleanup } from "@/utils/swCleanup";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });

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

  return (
    <div key="en" className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-x-hidden">
      <SkipToContent />
      <ValueBar />
      <MobileHeader />
      
      <main id="main-content" className="pt-14 overflow-x-hidden">
        {/* Mobile Hero with Dashboard Preview */}
        <MobileHero />
        
        {/* Desktop Hero */}
        <Hero />
        
        {/* Mobile Feature Blocks */}
        <FeatureBlocks />
        
        {/* Mobile Video Section */}
        <VideoSection />
        
        <WaveDivider color="hsl(var(--background))" className="text-background -mt-1" />
        <HowItWorks />
        <DashboardShowcase />
        <WaveDivider color="hsl(var(--background))" className="text-background -mt-1" />
        <PainToValue />
        <Features />
        <BuildSection />
        <BenefitsGrid />
        <WaveDivider color="hsl(var(--background))" flip className="text-background -mb-1" />
        <Testimonials />
        <Pricing />
        <SecurityTrust />
        <CTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
