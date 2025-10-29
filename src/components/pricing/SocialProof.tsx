import { Shield, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const SocialProof = () => {
  return (
    <div className="mt-16 pt-12 border-t border-border/50">
      {/* Trust Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
          <div className="text-3xl font-bold text-foreground mb-1">10,000+</div>
          <div className="text-sm text-muted-foreground">Active Traders</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
          <div className="text-3xl font-bold text-foreground mb-1">98%</div>
          <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Shield className="w-8 h-8 mx-auto mb-3 text-primary" />
          <div className="text-3xl font-bold text-foreground mb-1">100%</div>
          <div className="text-sm text-muted-foreground">Secure & Private</div>
        </motion.div>
      </div>

      {/* Testimonial */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center mb-8"
      >
        <p className="text-lg italic text-muted-foreground mb-4">
          "This tool saved me 6+ hours per week on trade tracking. The automation is a game-changer for serious traders."
        </p>
        <div className="font-semibold text-foreground">
          Sarah Chen
          <span className="text-muted-foreground font-normal"> • Pro Trader</span>
        </div>
      </motion.div>

      {/* Money-Back Guarantee */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg max-w-md mx-auto"
      >
        <Shield className="w-6 h-6 text-green-500" />
        <div className="text-left">
          <div className="font-semibold text-green-400">14-Day Money-Back Guarantee</div>
          <div className="text-xs text-muted-foreground">Try risk-free. Cancel anytime.</div>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialProof;
