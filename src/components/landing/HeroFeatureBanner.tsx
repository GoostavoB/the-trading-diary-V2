import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

/**
 * SEO-optimized feature banner that sits just below the hero
 * Contains keyword-rich content while maintaining clean design
 */
export const HeroFeatureBanner = () => {
  const features = [
    "Binance",
    "Bybit", 
    "Coinbase",
    "API Integration",
    "Real-time Analytics",
    "Risk Management"
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-12 px-4 bg-secondary/10 border-y border-border/50"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Main Heading - H2 for SEO hierarchy */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
          Automated Multi-Exchange Crypto Trading Journal
        </h2>
        
        {/* SEO-rich description */}
        <p className="text-center text-muted-foreground max-w-4xl mx-auto mb-6 text-sm md:text-base">
          Sync trades from Binance, Bybit, Coinbase & more automatically via API. 
          Professional crypto trading journal with multi-exchange analytics, risk management tools, 
          and AI-powered insights in one place.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs md:text-sm font-medium"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
