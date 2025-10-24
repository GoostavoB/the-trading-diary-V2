import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bullBearRealistic from "@/assets/bull-bear-realistic.png";
import { useTranslation } from "@/hooks/useTranslation";


const Hero = () => {
  const navigate = useNavigate();
  const { t, i18n, ready, language, isLoading } = useTranslation();

  // Avoid rendering while language is switching
  if (isLoading) {
    return null;
  }

  return (
    <section className="relative min-h-[100vh] md:min-h-[90vh] flex items-center justify-center px-6 pt-24 pb-10 overflow-hidden" aria-labelledby="hero-title">
      {/* Background Image */}
      <div className="absolute inset-0 z-0" role="presentation" aria-hidden="true">
        <img 
          src={bullBearRealistic} 
          alt="Bull and bear trading market illustration depicting financial market dynamics"
          className="w-full h-full object-cover opacity-15"
          loading="eager"
          fetchPriority="high"
          width="1920"
          height="1080"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background"></div>
      </div>
      
      {/* Dynamic Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center space-y-6">
          {/* Title - Short & Punchy */}
          <motion.h1 
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(28px,4.5vw,40px)] font-bold leading-[1.2] max-w-2xl mx-auto"
          >
            {t('landing.hero.titleShort')}
          </motion.h1>

          {/* Benefit Bullets */}
          <motion.ul 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-2 text-base md:text-lg text-muted-foreground"
            role="list"
          >
            {(() => {
              const benefits = t('landing.hero.benefits', { returnObjects: true });
              const benefitArray = Array.isArray(benefits) ? benefits : [];
              return benefitArray.map((benefit: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
                  {benefit}
                </li>
              ));
            })()}
          </motion.ul>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-2"
          >
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="h-12 px-8 min-w-[200px] text-base font-medium rounded-xl"
              aria-label="Start using The Trading Diary for free"
            >
              {t('landing.hero.ctaPrimary')}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
