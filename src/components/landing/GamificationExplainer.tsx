import { motion } from "framer-motion";
import { Zap, Flame, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const GamificationExplainer = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Zap,
      label: "Every trade",
      value: "XP"
    },
    {
      icon: Flame,
      label: "Every streak",
      value: "Reward"
    },
    {
      icon: Award,
      label: "Every tier",
      value: "New tools"
    }
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-primary/5 to-background" aria-label="Gamification explanation">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            The only trading tool that trains your discipline.
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            <p>Trading requires discipline. Discipline requires habits.</p>
            <p>Habits require dopamine. Our XP system delivers it.</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="text-center space-y-4 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{step.label}</p>
                  <p className="text-2xl font-bold">{step.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-6"
        >
          <p className="text-lg font-medium">
            Gamification makes consistency addictive — not stressful.
          </p>
          
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="h-14 px-10 text-base font-semibold"
          >
            Earn Your First XP – Start Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default GamificationExplainer;
