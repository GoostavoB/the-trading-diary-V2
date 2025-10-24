import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bullBearRealistic from "@/assets/bull-bear-realistic.png";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Ensure i18n is initialized before rendering
  if (!i18n.isInitialized) {
    return null;
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-16" aria-labelledby="hero-title">
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
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[50px]"></div>
      </div>
      
      {/* Dynamic Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <header className="text-center space-y-8">
          {/* Main Headline */}
          <motion.h1 
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
          >
            {t('landing.hero.title').split(' ').slice(0, -2).join(' ')}{" "}
            <span className="text-gradient-primary inline-block animate-fade-in">{t('landing.hero.title').split(' ').slice(-2).join(' ')}</span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button 
              onClick={() => navigate('/auth')}
              className="px-8 py-7 text-lg font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              aria-label="Start using The Trading Diary for free"
            >
              {t('landing.hero.cta')}
            </Button>
          </motion.div>
        </header>

          {/* Benefit Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mt-16"
            role="group"
            aria-label="Platform benefits"
          >
            <article className="glass-strong backdrop-blur-[20px] p-6 rounded-xl shadow-lg border border-primary/10 text-center flex flex-col items-center justify-center">
              <h3 className="text-lg md:text-xl font-bold text-primary mb-2">{t('landing.benefits.fasterUploads.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('landing.benefits.fasterUploads.description')}</p>
            </article>
            <article className="glass-strong backdrop-blur-[20px] p-6 rounded-xl shadow-lg border border-primary/10 text-center flex flex-col items-center justify-center">
              <h3 className="text-lg md:text-xl font-bold text-primary mb-2">{t('landing.benefits.knowEveryFee.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('landing.benefits.knowEveryFee.description')}</p>
            </article>
            <article className="glass-strong backdrop-blur-[20px] p-6 rounded-xl shadow-lg border border-primary/10 text-center flex flex-col items-center justify-center">
              <h3 className="text-lg md:text-xl font-bold text-primary mb-2">{t('landing.benefits.yourRules.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('landing.benefits.yourRules.description')}</p>
            </article>
          </motion.div>
      </div>
    </section>
  );
};

export default Hero;
