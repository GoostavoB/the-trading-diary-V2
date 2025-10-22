import { Upload, Repeat, TrendingUp, Filter, Smartphone, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      titleKey: "landing.features.smartLogging.title",
      descriptionKey: "landing.features.smartLogging.description",
      blogLink: "/blog/trading-journal-for-crypto",
      blogLinkText: "Learn about Trading Journals"
    },
    {
      icon: <Repeat className="w-6 h-6" />,
      titleKey: "landing.features.autoImports.title",
      descriptionKey: "landing.features.autoImports.description",
      blogLink: "/blog/ai-tools-for-crypto-trading",
      blogLinkText: "Discover AI Trading Tools"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      titleKey: "landing.features.advancedAnalytics.title",
      descriptionKey: "landing.features.advancedAnalytics.description",
      blogLink: "/blog/data-driven-trading",
      blogLinkText: "Read about Data-Driven Trading"
    },
    {
      icon: <Filter className="w-6 h-6" />,
      titleKey: "landing.features.tagFilter.title",
      descriptionKey: "landing.features.tagFilter.description",
      blogLink: "/blog/ai-powered-trading-journal",
      blogLinkText: "See AI-Powered Features"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      titleKey: "landing.features.mobileFriendly.title",
      descriptionKey: "landing.features.mobileFriendly.description",
      blogLink: "/blog/trading-psychology-control-emotions",
      blogLinkText: "Master Trading Psychology"
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
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {t(feature.descriptionKey)}
                </p>
                <Link 
                  to={feature.blogLink}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {feature.blogLinkText}
                  <ArrowRight className="w-3 h-3" />
                </Link>
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
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {t(feature.descriptionKey)}
                </p>
                <Link 
                  to={feature.blogLink}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {feature.blogLinkText}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </GlassCard>
            </motion.article>
          ))}
          </div>
          
          {/* Related Blog Articles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link 
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
            >
              Read More Trading Insights
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
    </section>
  );
};

export default Features;
