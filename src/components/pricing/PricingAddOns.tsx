import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const PricingAddOns = () => {
  const addOns = [
    {
      title: "Extra AI uploads",
      price: "$10",
      period: "/1,000 uploads",
      description: "Process more trades with AI when you exceed monthly limits"
    },
    {
      title: "Team seats",
      price: "$15",
      period: "/seat/month",
      description: "Add team members with separate accounts and shared workspace"
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
            Optional Add-ons
          </h2>
          <p className="text-[16px] text-muted-foreground/70 text-center mb-12 max-w-2xl mx-auto">
            Scale your plan with extra capacity or team features when you need them
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {addOns.map((addon, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass backdrop-blur-md rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">{addon.title}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold">{addon.price}</span>
                  <span className="text-sm text-muted-foreground">{addon.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{addon.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingAddOns;
