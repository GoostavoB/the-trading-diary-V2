import { Users, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export const ProofBar = () => {
  const { t } = useTranslation();

  const metrics = [
    {
      icon: Users,
      value: "10,000+",
      label: t('landing.proofBar.activeTraders', 'Active Traders'),
    },
    {
      icon: TrendingUp,
      value: "1M+",
      label: t('landing.proofBar.tradesLogged', 'Trades Logged'),
    },
    {
      icon: Star,
      value: "98%",
      label: t('landing.proofBar.satisfaction', 'Satisfaction'),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      viewport={{ once: true }}
      className="py-12 px-6"
      aria-label="Social proof metrics"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-card/50 border border-border/20 rounded-2xl p-8 flex flex-col items-center text-center gap-3 hover:border-primary/40 transition-all duration-300"
              >
                <Icon className="w-8 h-8 text-primary mb-2" />
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  {metric.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
