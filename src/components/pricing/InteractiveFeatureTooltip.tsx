import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface InteractiveFeatureTooltipProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const InteractiveFeatureTooltip = ({ 
  title, 
  description,
  children 
}: InteractiveFeatureTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-2 group">
      {children}
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex-shrink-0 transition-colors"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full mt-2 z-50 w-72 pointer-events-none"
          >
            <div className="glass-card p-4 border border-primary/20 shadow-2xl">
              <h4 className="text-[14px] font-semibold mb-2 text-foreground">{title}</h4>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
