import { Shield, Lock, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const SecurityTrust = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: Shield,
      title: "Bank-level encryption",
      description: "SSL protection and encrypted data storage."
    },
    {
      icon: Database,
      title: "No API connections",
      description: "Full control over your data. Works with any exchange."
    },
    {
      icon: Lock,
      title: "100% privacy-first",
      description: "Your trades, your data, your security."
    }
  ];

  return (
    <section className="py-16 px-6 bg-primary/5" aria-label="Security features">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Safe. Private. Secure.</h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecurityTrust;
