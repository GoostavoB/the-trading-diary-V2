import { Upload, Repeat, TrendingUp, Filter, Smartphone, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getLocalizedPath, getLanguageFromPath } from "@/utils/languageRouting";
import { useLocation } from "react-router-dom";

const Features = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: t('landing.features.leverage.title', 'Leverage and position size by risk and stop'),
      description: t('landing.features.leverage.description', 'Calculate the right position size for every trade based on your risk tolerance'),
      action: t('landing.features.leverage.action', 'Set your risk parameters now'),
      blogLink: "/blog/trading-journal-for-crypto"
    },
    {
      icon: <Filter className="w-6 h-6" />,
      title: t('landing.features.fees.title', 'Fees dashboard and maker vs taker simulation with funding'),
      description: t('landing.features.fees.description', 'Understand your true trading costs and optimize fee structures'),
      action: t('landing.features.fees.action', 'Cut costs by switching high fee pairs in one click'),
      blogLink: "/blog/ai-tools-for-crypto-trading"
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: t('landing.features.heatmap.title', 'Weekly heatmap, best assets and hours'),
      description: t('landing.features.heatmap.description', 'Identify your most profitable trading patterns and timeframes'),
      action: t('landing.features.heatmap.action', 'Find your edge with visual analytics'),
      blogLink: "/blog/data-driven-trading"
    },
    {
      icon: <Repeat className="w-6 h-6" />,
      title: t('landing.features.mfeMae.title', 'MFE and MAE to tune target and stop'),
      description: t('landing.features.mfeMae.description', 'Optimize your exit strategies with maximum favorable and adverse excursion analysis'),
      action: t('landing.features.mfeMae.action', 'Improve your exits today'),
      blogLink: "/blog/ai-powered-trading-journal"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: t('landing.features.riskAlerts.title', 'Risk alerts and pre-trade checklist'),
      description: t('landing.features.riskAlerts.description', 'Stay disciplined with automated warnings and systematic trade validation'),
      action: t('landing.features.riskAlerts.action', 'Enable smart protection'),
      blogLink: "/blog/trading-psychology-control-emotions"
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
            {t('landing.features.mainTitle', 'Features That Drive Results')}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.features.mainSubtitle', 'Tools designed to improve your trading performance')}
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
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {feature.description}
                </p>
                <div className="mt-auto">
                  <p className="text-sm font-medium text-primary mb-2">{feature.action}</p>
                  <Link 
                    to={getLocalizedPath(feature.blogLink, currentLang)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {t('landing.features.learnMore', 'Learn More')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
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
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {feature.description}
                </p>
                <div className="mt-auto">
                  <p className="text-sm font-medium text-primary mb-2">{feature.action}</p>
                  <Link 
                    to={getLocalizedPath(feature.blogLink, currentLang)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {t('landing.features.learnMore', 'Learn More')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
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
              to={getLocalizedPath("/blog", currentLang)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
            >
              {t('landing.features.readMoreInsights')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
    </section>
  );
};

export default Features;
