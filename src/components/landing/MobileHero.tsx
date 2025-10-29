import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Star } from "lucide-react";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";

const MobileHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex flex-col px-4 pt-8 pb-4 overflow-hidden lg:hidden">
      {/* Hero Content */}
      <div className="flex flex-col items-center text-center space-y-8 pb-4">
        {/* Headline - Staggered Animation */}
        <motion.h1
          className="space-y-2 max-w-[280px]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1
              }
            }
          }}
        >
          <motion.span 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }}
            className="block text-[32px] leading-[1.15] font-medium tracking-tight"
          >
            Train Your Mind.
          </motion.span>
          <motion.span 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }}
            className="block text-[36px] leading-[1.15] font-bold tracking-tight text-primary"
          >
            Track Your Trades.
          </motion.span>
          <motion.span 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }}
            className="block text-[32px] leading-[1.15] font-light tracking-wide text-muted-foreground/80"
          >
            Transform Results.
          </motion.span>
        </motion.h1>

        {/* Subheadline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-3 max-w-[300px]"
        >
          <p className="text-base text-muted-foreground/80 font-light tracking-wide">
            Multi-exchange sync • AI insights • Psychology tracking
          </p>
          <p className="text-xs text-primary/80 font-medium">
            Free 14-day trial • No credit card • Cancel anytime
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-col gap-3 w-full max-w-[320px] pt-4"
        >
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="h-12 text-[15px] font-medium rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Start Free Trial
          </Button>
        </motion.div>

        {/* Trust Line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="flex items-center gap-2 text-xs text-muted-foreground/60 font-medium pt-2"
        >
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span>10,000+ professional traders</span>
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
        className="relative -mb-16 max-w-[420px] mx-auto mt-4 h-[320px] sm:h-[360px]"
      >
        {/* Gradient fade at top */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background via-background/70 to-transparent z-10" />
        
        {/* Dashboard Screenshot */}
        <div className="relative h-full rounded-t-2xl overflow-hidden shadow-2xl border-t border-x border-primary/20">
          <img
            src={dashboardScreenshot}
            alt="Trading Dashboard Preview showing analytics and performance metrics"
            loading="eager"
            className="w-full h-full object-cover object-top"
            style={{
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
