import { Shield, Lock, Database, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export const PrivacySection = () => {
  const { t } = useTranslation();

  const privacyPoints = [
    'No APIs',
    'No exchange connections',
    'Works with every platform',
    'Your data stays in your control'
  ];

  const icons = [Shield, Lock, Database, Globe];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-primary/5 via-accent/5 to-primary/5" aria-labelledby="privacy-heading">
      <div className="container mx-auto max-w-4xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 id="privacy-heading" className="text-3xl md:text-4xl font-bold leading-tight">
            {t('landing.privacy.header', 'Private and Flexible')}
          </h2>
        </motion.header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
          {privacyPoints.map((point, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={index}
                role="listitem"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-black/20 backdrop-blur-sm border border-primary/10 hover:border-primary/30 hover:bg-black/30 transition-all duration-300 group"
              >
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-base font-medium text-foreground/90">
                  {point}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;
