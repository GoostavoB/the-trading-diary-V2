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

const IndexEs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Add hreflang tags for SEO
  useHreflang({
    languages: [...SUPPORTED_LANGUAGES],
    defaultLanguage: 'en'
  });

  useEffect(() => {
    // Update meta tags and SEO
    updateLandingMeta('es');
    addStructuredData('es');
    
    // Track landing view
    trackLandingView('es');
  }, []);

  const handleCTAClick = (location: string) => {
    trackCTAClick('es', location);
    navigate('/auth?lang=es');
  };

  return (
    <div key="es" className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
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

export default IndexEs;
