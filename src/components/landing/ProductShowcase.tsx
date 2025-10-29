import { motion } from "framer-motion";
import { TrendingUp, Heart, Clock, DollarSign, Target } from "lucide-react";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";

const ProductShowcase = () => {
  const features = [
    { icon: TrendingUp, text: "ROI per asset and per exchange" },
    { icon: Heart, text: "Emotional impact on PnL" },
    { icon: Clock, text: "Win rate by setup and time of day" },
    { icon: DollarSign, text: "Fee tracking and hidden costs" },
    { icon: Target, text: "Decision quality scoring" }
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-background to-secondary/20" aria-label="Product showcase">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your trades. Your psychology. Your evolution.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See every metric that matters — from fees to emotions, from performance to growth.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-4 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10"
              >
                <Icon className="w-6 h-6 text-primary" />
                <p className="text-sm font-medium leading-snug">{feature.text}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl"
        >
          <img 
            src={dashboardScreenshot}
            alt="Trading dashboard showing ROI, emotions, win rates, fees, and decision quality"
            className="w-full h-auto"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};

export default ProductShowcase;
