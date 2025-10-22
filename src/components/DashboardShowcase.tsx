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
    <section className="py-20 md:py-28 px-6 relative overflow-hidden bg-gradient-to-b from-background via-gray-900/30 to-background">
      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]"></div>
      
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {t('landing.dashboardShowcase.title').split('This one shows progress.')[0]}
              <span className="text-gradient-primary">
                {t('landing.dashboardShowcase.title').includes('This one shows progress.') 
                  ? 'This one shows progress.' 
                  : t('landing.dashboardShowcase.title').split('.').pop()}
              </span>
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

          {/* Right Side - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Browser-like mockup frame */}
            <div className="relative glass-strong rounded-2xl overflow-hidden shadow-2xl border border-primary/20">
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
                  <div className="aspect-[16/10] bg-background relative overflow-hidden cursor-pointer group">
                    <img 
                      src={dashboardScreenshot}
                      alt="Trading Dashboard showing real-time analytics, win rate, ROI, and capital growth charts"
                      className="w-full h-full object-contain object-center"
                      width={1920}
                      height={1200}
                      loading="eager"
                    />
                    
                    {/* Hover overlay with expand icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 glass-strong p-3 rounded-full border border-white/20">
                        <Expand className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Subtle glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                  </div>
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

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-2xl -z-10 opacity-50"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DashboardShowcase;
