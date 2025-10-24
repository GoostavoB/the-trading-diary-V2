import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";


const Hero = () => {
  const navigate = useNavigate();
  const { t, isLoading } = useTranslation();
  const [email, setEmail] = useState("");

  // Avoid rendering while language is switching
  if (isLoading) {
    return null;
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to auth page with email pre-filled
    navigate('/auth', { state: { email } });
  };

  return (
    <section className="relative min-h-[100vh] md:min-h-[90vh] flex items-center justify-center px-6 pt-24 pb-10 overflow-hidden" aria-labelledby="hero-title">
      {/* Premium Gradient Beam Background */}
      <div className="absolute inset-0 z-0" role="presentation" aria-hidden="true">
        {/* Main diagonal gradient beam */}
        <div 
          className="gradient-beam top-[-10%] right-[-10%]" 
          style={{ opacity: 0.6 }}
        />
        
        {/* Complementary glow orbs */}
        <div 
          className="glow-orb w-[600px] h-[600px] top-[20%] left-[10%]"
          style={{ 
            background: 'radial-gradient(circle, hsl(var(--hero-blue-start) / 0.12) 0%, transparent 70%)',
            animation: 'pulse-subtle 4s ease-in-out infinite'
          }}
        />
        <div 
          className="glow-orb w-[500px] h-[500px] bottom-[15%] right-[15%]"
          style={{ 
            background: 'radial-gradient(circle, hsl(var(--hero-blue-end) / 0.08) 0%, transparent 70%)',
            animation: 'pulse-subtle 5s ease-in-out infinite',
            animationDelay: '1.5s'
          }}
        />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="text-center space-y-8">
          {/* Enhanced Title with Gradient Accent */}
          <motion.h1 
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(36px,6vw,72px)] font-bold leading-[1.1] max-w-4xl mx-auto"
          >
            Track every crypto trade.{" "}
            <span className="gradient-text-hero">
              Learn faster.
            </span>
          </motion.h1>

          {/* Enhanced Benefit Bullets */}
          <motion.ul 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-3 text-lg md:text-xl text-muted-foreground/90 max-w-2xl mx-auto"
            role="list"
          >
            {(() => {
              const benefits = t('landing.hero.benefits', { returnObjects: true });
              const benefitArray = Array.isArray(benefits) ? benefits : [];
              return benefitArray.map((benefit: string, index: number) => (
                <li key={index} className="flex items-center gap-3">
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ background: 'linear-gradient(135deg, hsl(var(--hero-blue-start)), hsl(var(--hero-blue-end)))' }}
                    aria-hidden="true" 
                  />
                  {benefit}
                </li>
              ));
            })()}
          </motion.ul>

          {/* Email Capture CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-4"
          >
            <form 
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder={t('landing.hero.emailPlaceholder', 'Enter your email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 px-6 text-base bg-background/50 border-border/50 backdrop-blur-sm focus:border-primary focus:ring-primary rounded-xl w-full sm:flex-1"
                aria-label="Email address"
              />
              <Button 
                type="submit"
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-xl w-full sm:w-auto group transition-all duration-300 bg-primary hover:bg-primary/90"
                aria-label="Start using The Trading Diary for free"
              >
                {t('landing.hero.ctaPrimary', 'Get started free')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
