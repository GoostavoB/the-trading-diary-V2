import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Expand } from "lucide-react";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";
import { useState } from "react";
const Hero = () => {
  const navigate = useNavigate();
  const {
    t,
    isLoading
  } = useTranslation();
  const [isImageOpen, setIsImageOpen] = useState(false);

  // Avoid rendering while language is switching
  if (isLoading) {
    return null;
  }
  return <section className="relative min-h-screen flex items-center px-4 sm:px-6 pt-24 pb-32 overflow-hidden hidden lg:flex" aria-labelledby="hero-title">
      {/* Enhanced ambient glow effects - hidden on mobile to reduce visual bias */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 w-[min(500px,80vw)] h-[min(500px,80vw)] bg-primary/10 rounded-full blur-[150px] animate-pulse-slow"></div>
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-[min(500px,80vw)] h-[min(500px,80vw)] bg-accent/10 rounded-full blur-[150px] animate-pulse-slow" style={{
      animationDelay: '1s'
    }}></div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center justify-items-center lg:justify-items-stretch">
          {/* LEFT SIDE - Text Content */}
          <motion.div initial={{
          opacity: 0,
          x: -30
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6
        }} className="space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start w-full max-w-[560px] lg:max-w-none">
            {/* Hero Title - Centered on mobile, left-aligned on desktop */}
            <h1 id="hero-title" className="text-[clamp(40px,6vw,68px)] font-bold leading-[1.1] tracking-tight max-w-md lg:max-w-3xl" style={{
            textWrap: 'balance' as any
          }}>
              Your Trading Edge,
              <span className="block text-primary">Automated</span>
            </h1>

            {/* Subtitle - Centered on mobile, left-aligned on desktop */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md lg:max-w-xl" style={{
            textWrap: 'balance' as any
          }}>
              Multi-exchange tracking. AI-powered insights. One platform.
              <span className="block mt-3 text-sm font-semibold text-primary">
                Free 14-day trial • No credit card • Cancel anytime
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-stretch sm:items-center w-full sm:w-auto">
              <Button onClick={() => navigate('/auth')} size="lg" className="h-14 px-10 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300" aria-label="Start free trial">
                Start Free Trial
              </Button>
              
            </div>

            {/* Trust Bar */}
            <div className="pt-6 w-full">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                <span className="font-semibold">10,000+ traders</span>
                <span className="text-primary/30">•</span>
                <span className="font-semibold">500,000+ trades tracked</span>
                <span className="text-primary/30">•</span>
                <span className="font-semibold flex items-center gap-1">
                  4.8★ average rating
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE - Dashboard Preview */}
          <motion.div initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="relative mx-auto">
            {/* Browser-like mockup frame */}
            <div className="relative glass-strong rounded-2xl overflow-hidden shadow-2xl border border-primary/20 mx-auto max-w-[900px] md:max-w-none">
              {/* Browser chrome */}
              <div className="bg-gray-800/50 px-4 py-3 flex items-center gap-2 border-b border-primary/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                </div>
                <div className="flex-1 mx-4 bg-background/30 rounded px-3 py-1 text-xs text-muted-foreground">
                  thetradingdiary.com/dashboard
                </div>
              </div>
              
              {/* Dashboard content - Real Screenshot */}
              <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogTrigger asChild>
                  <button className="aspect-[16/10] bg-background relative overflow-hidden cursor-pointer group w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="View full dashboard screenshot">
                    <img src={dashboardScreenshot} alt="Trading Dashboard showing real-time analytics, win rate, ROI, and capital growth charts" className="w-full h-full object-contain object-center" width={1920} height={1200} loading="eager" />
                    
                    {/* Centered expand icon - hidden by default, shows on hover/focus */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="p-4 rounded-full bg-primary backdrop-blur-sm">
                        <Expand className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                      </div>
                    </div>
                    
                    {/* Subtle glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-xl p-4">
                    <img src={dashboardScreenshot} alt="Full Trading Dashboard with detailed analytics and performance metrics" className="max-w-full max-h-[90vh] object-contain rounded-lg" width={1920} height={1200} loading="lazy" decoding="async" />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-2xl -z-10 opacity-50"></div>
          </motion.div>
        </div>
      </div>
    </section>;
};
export default Hero;