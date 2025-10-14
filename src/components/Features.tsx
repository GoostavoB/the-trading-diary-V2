import { Card } from "@/components/ui/card";
import { TrendingUp, PieChart, Target, Zap, Shield, BarChart } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Track ROI, win rates, and profit evolution with powerful real-time analytics and visualizations.",
  },
  {
    icon: PieChart,
    title: "Trade Journaling",
    description: "Document every trade with emotional tags, setups, and screenshots for comprehensive analysis.",
  },
  {
    icon: Target,
    title: "Equity Forecasting",
    description: "Project future equity based on historical performance with advanced forecasting models.",
  },
  {
    icon: Zap,
    title: "Instant Insights",
    description: "Get actionable insights from your trading patterns and emotional states during trades.",
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Bank-level encryption keeps your trading data secure and private at all times.",
  },
  {
    icon: BarChart,
    title: "Advanced Charts",
    description: "Visualize performance with hourly heatmaps, asset analysis, and setup distribution charts.",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Elite Traders</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to analyze, improve, and dominate your trading game.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="mb-4 inline-block p-3 bg-gradient-neon rounded-lg">
                  <Icon className="text-primary-foreground" size={32} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
