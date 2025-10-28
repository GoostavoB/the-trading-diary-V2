import { motion } from "framer-motion";
import { Pencil, Unlock, Plug, Rocket, Award } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const BuildSection = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: Pencil,
      titleKey: "landing.tradingFramework.blueprint.title",
      descriptionKey: "landing.tradingFramework.blueprint.description"
    },
    {
      icon: Unlock,
      titleKey: "landing.tradingFramework.unblock.title",
      descriptionKey: "landing.tradingFramework.unblock.description"
    },
    {
      icon: Plug,
      titleKey: "landing.tradingFramework.install.title",
      descriptionKey: "landing.tradingFramework.install.description"
    },
    {
      icon: Rocket,
      titleKey: "landing.tradingFramework.launch.title",
      descriptionKey: "landing.tradingFramework.launch.description"
    },
    {
      icon: Award,
      titleKey: "landing.tradingFramework.deliver.title",
      descriptionKey: "landing.tradingFramework.deliver.description"
    }
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-secondary/20 to-background" aria-label="BUILD framework">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.tradingFramework.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(step.descriptionKey)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BuildSection;
