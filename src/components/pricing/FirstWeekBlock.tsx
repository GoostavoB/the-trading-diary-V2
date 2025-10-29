import { motion } from "framer-motion";
import { Upload, TrendingUp, Award, Target, CheckCircle, Zap } from "lucide-react";

const FirstWeekBlock = () => {
  const weekPlans = [
    {
      plan: "Free",
      icon: Upload,
      activities: [
        { text: "Upload your first 30 days of trading history", icon: Upload },
        { text: "Get personalized AI insights on your patterns", icon: TrendingUp },
        { text: "Calculate your optimal per-trade risk size", icon: Target },
        { text: "Join the community leaderboard", icon: Award }
      ]
    },
    {
      plan: "Pro",
      icon: Zap,
      activities: [
        { text: "Analyze fee costs and optimize for maker/taker ratios", icon: CheckCircle },
        { text: "Set your maximum weekly drawdown limit with alerts", icon: TrendingUp },
        { text: "Configure position sizing based on stop-loss distance", icon: Target },
        { text: "Unlock advanced XP rewards and badges", icon: Award }
      ]
    },
    {
      plan: "Elite",
      icon: Award,
      activities: [
        { text: "Use MFE/MAE analysis to refine entry and exit targets", icon: TrendingUp },
        { text: "Schedule automated weekly performance reports to email", icon: CheckCircle },
        { text: "Access priority support for custom metric creation", icon: Zap },
        { text: "Unlock elite trader tier and exclusive features", icon: Award }
      ]
    }
  ];

  return (
    <section className="px-6 mb-16">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 
            className="font-bold text-center mb-3 leading-tight tracking-tight"
            style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)',
              letterSpacing: '-0.01em'
            }}
          >
            What you'll accomplish in your first week
          </h2>
          <p className="text-[16px] text-muted-foreground/70 text-center mb-12 max-w-2xl mx-auto">
            Hit the ground running with actionable steps designed to build your discipline from day one
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {weekPlans.map((item, index) => {
              const PlanIcon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass backdrop-blur-md rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <PlanIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold">{item.plan}</h3>
                      <p className="text-[12px] text-muted-foreground">Week 1 roadmap</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {item.activities.map((activity, i) => {
                      const ActivityIcon = activity.icon;
                      return (
                        <motion.li 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 + i * 0.05 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-3 text-[14px]"
                        >
                          <ActivityIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground/80 leading-relaxed">{activity.text}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FirstWeekBlock;
