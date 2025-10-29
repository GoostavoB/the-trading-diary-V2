import { Upload, Sparkles, BarChart3, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";
import { useTranslation } from "@/hooks/useTranslation";

const HowItWorks = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: Upload,
      title: "Upload your trades — no API needed.",
      description: "Supports screenshots, CSVs, or manual entry. Full privacy, no exchange access required."
    },
    {
      icon: Sparkles,
      title: "Analyze automatically.",
      description: "Performance, emotions, and decision data all in one dashboard."
    },
    {
      icon: BarChart3,
      title: "Improve through XP and rewards.",
      description: "Earn XP, unlock advanced tools, and build consistency through dopamine-driven progress."
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
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-4"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
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
