import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { AnimatedCandlestickBackground } from "./landing/AnimatedCandlestickBackground";
import { GlowingLogo } from "./landing/GlowingLogo";
import MobileHero from "./landing/MobileHero";
const Hero = () => {
  const navigate = useNavigate();
  const {
    t,
    isLoading
  } = useTranslation();
  const {
    isMobile
  } = useMobileOptimization();

  // Avoid rendering while language is switching
  if (isLoading) {
    return null;
  }

  // Show mobile hero for mobile devices
  if (isMobile) {
    return <MobileHero />;
  }
  return <section className="relative h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden" aria-labelledby="hero-title">
      {/* Animated Candlestick Background */}
      <div className="absolute inset-0">
        <AnimatedCandlestickBackground />
      </div>

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
      background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.8) 100%)'
    }} />

      {/* Content */}
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col items-center justify-center text-center space-y-16">
          
          {/* Text Above Logo */}
          <motion.div className="space-y-4" initial={{
          opacity: 0,
          y: -30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.3
        }}>
            <motion.h1 id="hero-title" className="text-5xl md:text-7xl font-bold leading-tight" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
              Transform your Trading
            </motion.h1>
            
            <motion.h2 className="text-4xl md:text-6xl font-bold" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
              Journey with
            </motion.h2>
          </motion.div>

          {/* Glowing Logo */}
          <GlowingLogo />

          {/* Subtitle */}
          <motion.div className="space-y-6 max-w-2xl" initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.5
        }}>
            <p className="text-lg leading-relaxed md:text-2xl text-blue-50 font-normal text-center">Visualize performance, track progress, and level up 
your trading game with gamified analytics</p>

            {/* CTA Button */}
            <div className="pt-4">
              <Button onClick={() => navigate('/auth')} size="lg" className="h-14 px-10 text-lg font-semibold rounded-full relative overflow-hidden group" style={{
              background: 'linear-gradient(135deg, hsl(210, 90%, 58%) 0%, hsl(200, 80%, 65%) 100%)',
              boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
            }}>
                <span className="relative z-10">Start Your Journey</span>
                <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600" initial={{
                x: '-100%'
              }} whileHover={{
                x: '100%'
              }} transition={{
                duration: 0.6
              }} style={{
                opacity: 0.5
              }} />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 pt-6">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                10,000+ traders
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                500,000+ trades tracked
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                4.8★ rating
              </span>
            </div>
          </motion.div>

        </div>
      </div>

    </section>;
};
export default Hero;