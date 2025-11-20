import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export const CoreFeatures = () => {
  const { t } = useTranslation();

  const features = [
    'AI Extracts for fast trade logging',
    'Unlimited manual uploads',
    'Anti duplicate trade detection',
    'Screenshot uploads',
    'Advanced charts and analytics',
    'Journal with emotional tracking',
    'Market sentiment with combined LSR',
    'Exchange fee comparison',
    'Wealth forecast',
    'Risk calculator',
    'Smart performance insights',
    'Trade history',
    'Tax report export'
  ];

  return (
    <section className="py-20 md:py-28 px-6" aria-labelledby="core-features-heading">
      <div className="container mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 id="core-features-heading" className="text-3xl md:text-4xl font-bold leading-tight">
            {t('landing.coreFeatures.header', 'Tools That Give You Better Insight')}
          </h2>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4" role="list">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              role="listitem"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex gap-3 items-start group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-base text-foreground/90 leading-relaxed">
                {feature}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreFeatures;
