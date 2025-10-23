import { useEffect } from "react";
import Hero from "@/components/Hero";
import DashboardShowcase from "@/components/DashboardShowcase";
import Features from "@/components/Features";
import ExchangeLogos from "@/components/ExchangeLogos";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeStudio } from "@/components/theme-studio/ThemeStudio";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import { updateLandingMeta, addStructuredData, trackLandingView, trackCTAClick } from "@/utils/i18nLandingMeta";

const IndexAr = () => {
  const navigate = useNavigate();
  const { t, changeLanguage } = useTranslation();

  useEffect(() => {
    // Set language to Arabic
    changeLanguage('ar');
    
    // Update meta tags and SEO
    updateLandingMeta('ar');
    addStructuredData('ar');
    
    // Track landing view
    trackLandingView('ar');
    
    // Add RTL direction for Arabic
    document.documentElement.dir = 'rtl';
    
    return () => {
      document.documentElement.dir = 'ltr';
    };
  }, []);

  const handleCTAClick = (location: string) => {
    trackCTAClick('ar', location);
    navigate('/auth?lang=ar');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="absolute top-6 left-6 z-50">
        <Logo size="lg" variant="horizontal" showText={true} className="hover:opacity-80 transition-opacity cursor-pointer" />
      </div>
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <LanguageToggle />
        <ThemeStudio />
        <Button
          onClick={() => navigate('/ar/pricing')}
          variant="ghost"
          className="glass backdrop-blur-[10px] border border-primary/20 text-foreground hover:bg-primary/10 transition-all rounded-xl px-5 py-2 font-medium shadow-sm hover:shadow-md"
        >
          {t('navigation.pricing')}
        </Button>
        <Button
          onClick={() => handleCTAClick('header')}
          className="glass backdrop-blur-[10px] border border-primary/30 text-foreground hover:bg-primary hover:text-primary-foreground transition-all rounded-xl px-5 py-2 font-medium shadow-sm hover:shadow-md"
          variant="ghost"
        >
          {t('auth.signIn')}
        </Button>
      </div>
      <Hero />
      <DashboardShowcase />
      <Features />
      <ExchangeLogos />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default IndexAr;
