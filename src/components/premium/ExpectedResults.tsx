import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const keyMetrics = [
  { icon: TrendingUp, key: "winRate", metric: "+3-8pts" },
  { icon: AlertTriangle, key: "drawdown", metric: "-15-30%" },
  { icon: TrendingDown, key: "ruleBreaks", metric: "-50-80%" },
  { icon: DollarSign, key: "avgLoss", metric: "-10-30%" },
  { icon: Target, key: "avgWin", metric: "+5-15%" },
];

export const ExpectedResults = () => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section ref={ref} className="py-16 md:py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {t("pricing.expectedResults.title")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.expectedResults.subtitle")}
          </p>
        </motion.div>

        {/* Key Metrics - Large Cards */}
        <div className="space-y-6">
          {keyMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="outcome-card-refined p-6 md:p-8 rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Left side - Icon, Title, Description */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold mb-2">
                        {t(`pricing.expectedResults.metrics.${metric.key}.label`)}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {t(`pricing.expectedResults.metrics.${metric.key}.description`)}
                      </p>
                      <p className="text-xs md:text-sm text-primary/70 mt-2 italic">
                        {t(`pricing.expectedResults.metrics.${metric.key}.proof`)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Large Metric */}
                  <div className="shrink-0 text-right md:text-left">
                    <div className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
                      {metric.metric}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
