import { Button } from "@/components/ui/button";
import { ArrowRight, Expand } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import dashboardScreenshot from "@/assets/dashboard-screenshot.png";
import { useTranslation } from "react-i18next";

const DashboardShowcase = () => {
  const navigate = useNavigate();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 px-6 relative overflow-hidden bg-gradient-to-b from-background via-gray-900/30 to-background" aria-labelledby="dashboard-showcase-heading">
      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" aria-hidden="true"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" aria-hidden="true"></div>
      
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6 lg:pr-8 text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            <h2 id="dashboard-showcase-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {t('landing.dashboardShowcase.title')}
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
              {t('landing.dashboardShowcase.subtitle')}
            </p>
            
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="group border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
            >
              {t('landing.dashboardShowcase.cta')}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Right Side - Dashboard Preview with 3D Effect */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
            style={{ perspective: '1500px' }}
          >
            {/* Ambient glow layers */}
            <div className="absolute -inset-20 bg-gradient-to-bl from-accent/20 via-purple-500/10 to-primary/20 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
            <div className="absolute -inset-16 bg-gradient-to-tr from-primary/15 via-transparent to-accent/15 rounded-full blur-[80px] -z-10 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            
            {/* 3D Floating Card Container */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotateX: [0, -2, 0],
                rotateY: [0, 1, 0]
              }}
              transition={{ 
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Glass-morphism frame with enhanced depth */}
              <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-bl from-white/[0.07] to-white/[0.02] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                {/* Enhanced browser chrome with glass effect */}
                <div className="bg-gradient-to-l from-gray-900/60 via-gray-800/50 to-gray-900/60 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50"></div>
                  </div>
                  <div className="flex-1 mx-4 bg-background/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-white/5">
                    thetradingdiary.com/dashboard
                  </div>
                </div>
                
                {/* Dashboard content - Real Screenshot with enhanced effects */}
                <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                  <DialogTrigger asChild>
                    <button 
                      className="aspect-[16/10] bg-gradient-to-bl from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden cursor-pointer group w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label="View full dashboard screenshot"
                    >
                      <img 
                        src={dashboardScreenshot}
                        alt="Trading Dashboard showing real-time analytics, win rate, ROI, and capital growth charts"
                        className="w-full h-full object-contain object-center transform group-hover:scale-[1.02] transition-transform duration-500"
                        width={1920}
                        height={1200}
                        loading="eager"
                      />
                      
                      {/* Enhanced hover overlay with glass effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="p-4 rounded-full bg-primary/90 backdrop-blur-md shadow-2xl shadow-primary/50 transform group-hover:scale-110 transition-transform duration-300">
                          <Expand className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                        </div>
                      </div>
                      
                      {/* Ambient gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-bl from-accent/[0.03] via-transparent to-primary/[0.03] pointer-events-none"></div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-xl p-4">
                      <img 
                        src={dashboardScreenshot}
                        alt="Full Trading Dashboard with detailed analytics and performance metrics"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        width={1920}
                        height={1200}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Enhanced 3D shadow layers for depth */}
              <div className="absolute inset-0 bg-gradient-to-bl from-accent/10 via-purple-500/10 to-primary/10 rounded-3xl blur-2xl -z-10 transform translate-y-8" style={{ transform: 'translateZ(-50px) translateY(32px)' }}></div>
              <div className="absolute inset-0 bg-black/20 rounded-3xl blur-xl -z-20 transform translate-y-6" style={{ transform: 'translateZ(-100px) translateY(24px)' }}></div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DashboardShowcase;
