import { Target, TrendingUp, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { useTranslation } from "@/hooks/useTranslation";

const PainToValue = () => {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: Target,
      titleKey: "landing.completeTradingJournal.dreamOutcome.title",
      descriptionKey: "landing.completeTradingJournal.dreamOutcome.description",
      color: "text-green-500"
    },
    {
      icon: TrendingUp,
      titleKey: "landing.completeTradingJournal.likelihood.title",
      descriptionKey: "landing.completeTradingJournal.likelihood.description",
      color: "text-blue-500"
    },
    {
      icon: Clock,
      titleKey: "landing.completeTradingJournal.timeDelay.title",
      descriptionKey: "landing.completeTradingJournal.timeDelay.description",
      color: "text-purple-500"
    },
    {
      icon: Zap,
      titleKey: "landing.completeTradingJournal.effort.title",
      descriptionKey: "landing.completeTradingJournal.effort.description",
      color: "text-yellow-500"
    }
  ];

  return (
    <section className="py-20 md:py-28 px-6" aria-label="Value proposition">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.completeTradingJournal.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.completeTradingJournal.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-6 h-full hover:border-primary/40 transition-all" hover>
                  <div className={`mb-4 ${value.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(value.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(value.descriptionKey)}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PainToValue;
