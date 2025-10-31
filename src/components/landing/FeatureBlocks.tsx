import { motion } from "framer-motion";
import { Camera, DollarSign, CheckSquare, TrendingUp, Calculator, FileText, Receipt, Globe, Target, Brain, BarChart3, Shield, BookOpen, Wallet, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

const FeatureBlocks = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: BarChart3,
      title: 'Risk Management',
      description: 'Monitor and control your trading risk exposure with advanced analytics and alerts.',
      gradient: "from-red-500/20 to-red-500/5"
    },
    {
      icon: Calculator,
      title: 'Leverage Calculator',
      description: 'Calculate position size based on risk and stop loss to optimize your trades.',
      gradient: "from-orange-500/20 to-orange-500/5"
    },
    {
      icon: Receipt,
      title: 'Tax Report',
      description: 'Generate comprehensive tax reports for all trades across multiple exchanges.',
      gradient: "from-blue-500/20 to-blue-500/5"
    },
    {
      icon: Camera,
      title: 'Upload Trades with AI',
      description: 'Upload trade screenshots and let AI extract all data automatically.',
      gradient: "from-primary/20 to-primary/5"
    },
    {
      icon: Brain,
      title: 'Psychology Tools',
      description: 'Track emotions and improve decision-making with behavioral analytics.',
      gradient: "from-indigo-500/20 to-indigo-500/5"
    },
    {
      icon: DollarSign,
      title: 'Exchange Fees Dashboard',
      description: 'Compare and track broker and exchange costs to optimize your trading.',
      gradient: "from-accent/20 to-accent/5"
    },
    {
      icon: Target,
      title: 'Personal Goal Planner',
      description: 'Set and track your trading objectives with progress monitoring.',
      gradient: "from-pink-500/20 to-pink-500/5"
    },
    {
      icon: Activity,
      title: 'Market Data',
      description: 'Long/Short Ratio and Open Interest always available on your dashboard for better market insights.',
      gradient: "from-purple-500/20 to-purple-500/5"
    },
    {
      icon: TrendingUp,
      title: '+45 More Features',
      description: 'Advanced metrics, custom widgets, reports, heatmaps, and professional trading tools.',
      gradient: "from-green-500/20 to-green-500/5"
    }
  ];

  return (
    <section id="features" className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('landing.features.sectionTitle', 'Features That Drive Results')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('landing.features.sectionSubtitle', 'Everything you need to improve your trading performance')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`p-6 glass-strong border-primary/20 bg-gradient-to-br ${feature.gradient}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12 space-y-3"
        >
          <span className="block text-xl font-semibold">
            All in one platform for professional crypto traders.
          </span>
          <span className="block text-sm text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            *Feature availability depends on your account progress and subscription plan. Unlock more tools as you level up through consistent trading.
          </span>
        </motion.p>
      </div>
    </section>
  );
};

export default FeatureBlocks;
