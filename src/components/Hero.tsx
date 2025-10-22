import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bullBearRealistic from "@/assets/bull-bear-realistic.png";
import { useTranslation } from "@/hooks/useTranslation";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bullBearRealistic} 
          alt="Trading background"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[50px]"></div>
      </div>
      
      {/* Dynamic Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <motion.h1 
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
            >
              {t('landing.hero.cta')}
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto mt-16"
          >
            <div className="glass-strong backdrop-blur-[20px] p-5 rounded-xl shadow-lg border border-primary/10">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">10,000+</div>
              <div className="text-xs text-muted-foreground">Active Traders</div>
            </div>
            <div className="glass-strong backdrop-blur-[20px] p-5 rounded-xl shadow-lg border border-primary/10">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">1M+</div>
              <div className="text-xs text-muted-foreground">Trades Logged</div>
            </div>
            <div className="glass-strong backdrop-blur-[20px] p-5 rounded-xl shadow-lg border border-primary/10">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">98%</div>
              <div className="text-xs text-muted-foreground">Satisfaction</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
