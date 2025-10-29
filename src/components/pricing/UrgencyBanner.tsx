import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const UrgencyBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
    >
      <div className="flex items-center justify-center gap-3 text-center">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm md:text-base font-semibold">
          <span className="text-amber-500">Offer ending soon</span> — Prices increase by 20% after launch period
        </p>
      </div>
    </motion.div>
  );
};

export default UrgencyBanner;
