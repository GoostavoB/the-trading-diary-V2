import { useEffect } from "react";
import Hero from "@/components/Hero";
import DashboardShowcase from "@/components/DashboardShowcase";
import Features from "@/components/Features";
import BenefitsGrid from "@/components/landing/BenefitsGrid";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { MobileHeader } from "@/components/MobileHeader";
import { ProofBar } from "@/components/ProofBar";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { updateLandingMeta, addStructuredData, trackLandingView, trackCTAClick } from "@/utils/i18nLandingMeta";
import { useHreflang } from "@/hooks/useHreflang";
import { SUPPORTED_LANGUAGES } from "@/utils/languageRouting";

const IndexAr = () => {
  const navigate = useNavigate();
  const { t, language, changeLanguage, isLoading } = useTranslation();

  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });

  // Force Arabic language on mount
  useEffect(() => {
    if (language !== 'ar') {
      changeLanguage('ar', false);
    }
  }, []);

  useEffect(() => {
    // Update meta tags and SEO
    updateLandingMeta('ar');
    addStructuredData('ar');
    
    // Track landing view
    trackLandingView('ar');
    
    // RTL is now handled globally in LanguageSync component
  }, []);

  const handleCTAClick = (location: string) => {
    trackCTAClick('ar', location);
    navigate('/auth?lang=ar');
  };

  // Loading guard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div key={`landing-${language}`} className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <MobileHeader />
      
      <main className="pt-14">
        <Hero />
        <ProofBar />
        <DashboardShowcase />
        <Features />
        <BenefitsGrid />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default IndexAr;
