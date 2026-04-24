import { useEffect } from "react";
import Hero from "@/components/Hero";
import WhyImprove from "@/components/WhyImprove";
import CoreFeatures from "@/components/CoreFeatures";
import PrivacySection from "@/components/PrivacySection";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { MobileHeader } from "@/components/MobileHeader";
import { ProofBar } from "@/components/ProofBar";
import { SkipToContent } from "@/components/SkipToContent";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Helmet } from 'react-helmet-async';
import { HreflangLinks } from '@/components/HreflangLinks';
import { landingMeta, getLandingStructuredData, trackLandingView, trackCTAClick } from '@/utils/i18nLandingMeta';
import { SUPPORTED_LANGUAGES } from "@/utils/languageRouting";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const meta = landingMeta['en'];
  const { organizationData, softwareData } = getLandingStructuredData('en') || {};

  useEffect(() => {
    // Track landing view
    trackLandingView('en');
  }, []);

  const handleCTAClick = (location: string) => {
    trackCTAClick('en', location);
    navigate('/auth?lang=en');
  };

  return (
    <div className="min-h-screen bg-void text-phosphor font-mono">
      <HreflangLinks languages={[...SUPPORTED_LANGUAGES]} defaultLanguage="en" />
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <link rel="canonical" href={meta.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={meta.ogImage} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.ogTitle} />
        <meta name="twitter:description" content={meta.ogDescription} />
        <meta name="twitter:image" content={meta.ogImage} />

        {/* Geo */}
        {meta.geo && <meta name="geo.region" content={meta.geo.region} />}
        {meta.geo && <meta name="geo.placename" content={meta.geo.placename} />}

        {/* Structured Data */}
        {organizationData && (
          <script type="application/ld+json">
            {JSON.stringify(organizationData)}
          </script>
        )}
        {softwareData && (
          <script type="application/ld+json">
            {JSON.stringify(softwareData)}
          </script>
        )}

        {/* HTML Lang */}
        <html lang={meta.lang} />
      </Helmet>
      <SkipToContent />
      <MobileHeader />

      <main id="main-content" className="pt-14">
        <Hero />
        <ProofBar />
        <WhyImprove />
        <CoreFeatures />
        <PrivacySection />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
