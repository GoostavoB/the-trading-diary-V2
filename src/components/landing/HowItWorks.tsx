import { Upload, Sparkles, BarChart3, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";
import { useTranslation } from "@/hooks/useTranslation";

const HowItWorks = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: Upload,
      titleKey: "landing.howItWorks.step1.title",
      descriptionKey: "landing.howItWorks.step1.description"
    },
    {
      icon: Sparkles,
      titleKey: "landing.howItWorks.step2.title",
      descriptionKey: "landing.howItWorks.step2.description"
    },
    {
      icon: BarChart3,
      titleKey: "landing.howItWorks.step3.title",
      descriptionKey: "landing.howItWorks.step3.description"
    },
    {
      icon: CheckCircle,
      titleKey: "landing.howItWorks.step4.title",
      descriptionKey: "landing.howItWorks.step4.description"
    }
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-background to-secondary/20" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 items-start"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t(step.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(step.descriptionKey)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden border border-primary/20 shadow-2xl"
        >
          <img 
            src={dashboardScreenshot}
            alt={t('landing.howItWorks.dashboardAlt')}
            className="w-full h-auto"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
