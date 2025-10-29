import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PainFOMO = () => {
  const navigate = useNavigate();

  const painPoints = [
    "You trade impulsively when emotional.",
    "You repeat the same mistakes.",
    "You don't know what's really costing you money."
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-destructive/5 to-background" aria-label="Pain points and urgency">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stop trading blind. Stop leaking profits.
          </h2>
          <p className="text-lg text-muted-foreground">
            Most traders don't fail because of strategy — they fail because of emotion and lack of structure.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="space-y-4 mb-12"
        >
          {painPoints.map((point, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-base font-medium">{point}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center space-y-6"
        >
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">
              Thousands of traders are already mastering consistency with The Trading Diary.
            </p>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            Don't fall behind.
          </p>
          
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="h-14 px-10 text-base font-semibold"
          >
            Start Free Trial – Offer Ending Soon
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PainFOMO;
