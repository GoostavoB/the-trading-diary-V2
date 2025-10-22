import { Upload, Repeat, TrendingUp, Filter, Smartphone } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      titleKey: "landing.features.smartLogging.title",
      descriptionKey: "landing.features.smartLogging.description",
    },
    {
      icon: <Repeat className="w-6 h-6" />,
      titleKey: "landing.features.autoImports.title",
      descriptionKey: "landing.features.autoImports.description",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      titleKey: "landing.features.advancedAnalytics.title",
      descriptionKey: "landing.features.advancedAnalytics.description",
    },
    {
      icon: <Filter className="w-6 h-6" />,
      titleKey: "landing.features.tagFilter.title",
      descriptionKey: "landing.features.tagFilter.description",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      titleKey: "landing.features.mobileFriendly.title",
      descriptionKey: "landing.features.mobileFriendly.description",
    },
  ];
  return (
    <section className="py-20 md:py-28 px-6" aria-labelledby="features-heading">
      <div className="container mx-auto max-w-6xl">
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold leading-tight">
            {t('landing.features.title').split('Trade Better')[0]}
            <span className="text-gradient-primary">Trade Better</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.header>

        {/* 3-2 grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5" role="list">
          {features.slice(0, 3).map((feature, index) => (
            <motion.article
              key={index}
              role="listitem"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard
                className="p-5 group hover:shadow-lg transition-all duration-300 h-full"
                hover
              >
                 <div className="mb-3 inline-block p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </GlassCard>
            </motion.article>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto" role="list">
          {features.slice(3, 5).map((feature, index) => (
            <motion.article
              key={index + 3}
              role="listitem"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (index + 3) * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard
                className="p-5 group hover:shadow-lg transition-all duration-300 h-full"
                hover
              >
                 <div className="mb-3 inline-block p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </GlassCard>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
