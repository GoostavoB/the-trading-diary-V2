import { Target, Brain, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const KeyBenefits = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Target,
      title: "Identify your winning patterns.",
      description: "See which setups, assets, and times make you profitable."
    },
    {
      icon: Brain,
      title: "Eliminate emotional mistakes.",
      description: "Track your psychology and see how emotions affect performance."
    },
    {
      icon: Trophy,
      title: "Build lasting consistency.",
      description: "Earn XP, complete missions, and maintain streaks that train discipline."
    }
  ];

  return (
    <section className="py-20 md:py-28 px-6" aria-label="Key benefits">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="h-14 px-10 text-base font-semibold"
          >
            Start Free Trial
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default KeyBenefits;
