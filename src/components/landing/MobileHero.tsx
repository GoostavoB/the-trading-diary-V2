import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Star } from "lucide-react";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";

const MobileHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col px-4 pt-20 pb-4 overflow-hidden lg:hidden">
      {/* Hero Content */}
      <div className="flex flex-col items-center text-center space-y-5 pb-6">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[44px] leading-[1.1] font-bold tracking-tight max-w-[320px]"
          style={{ textWrap: 'balance' as any }}
        >
          Automate your trading journal with AI
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-[300px]"
          style={{ textWrap: 'balance' as any }}
        >
          Upload your trades — TD tracks, analyzes, and reveals your performance.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-3 w-full max-w-[320px] pt-6"
        >
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Start Free Trial – 10 Trades On Us
          </Button>
          
          <Button
            onClick={() => navigate('/demo')}
            size="lg"
            variant="outline"
            className="h-14 text-base font-semibold rounded-xl border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
          >
            See It in Action (2-min Demo)
          </Button>
        </motion.div>

        {/* Trust Line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center gap-2 text-sm text-muted-foreground pt-2"
        >
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span>Trusted by professional crypto traders worldwide</span>
        </motion.div>

        {/* Bounce Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-6"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex flex-col items-center gap-2"
          >
            <ChevronDown className="h-8 w-8 text-primary" />
            <span className="text-xs text-muted-foreground">Scroll to explore TD</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Dashboard Preview - Half Visible */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative -mb-20 max-w-[420px] mx-auto mt-8"
      >
        {/* Gradient fade at top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background via-background/70 to-transparent z-10" />
        
        {/* Dashboard Screenshot */}
        <div className="relative rounded-t-2xl overflow-hidden shadow-2xl border-t border-x border-primary/20">
          <img
            src={dashboardScreenshot}
            alt="Trading Dashboard Preview showing analytics and performance metrics"
            loading="eager"
            className="w-full h-auto"
            style={{
              objectFit: 'cover',
              objectPosition: 'center top',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 100%)'
            }}
          />
        </div>

        {/* Floating glow effect */}
        <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl -z-10 opacity-60" />
      </motion.div>
    </section>
  );
};

export default MobileHero;
