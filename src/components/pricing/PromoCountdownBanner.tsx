import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePromoStatus } from "@/hooks/usePromoStatus";

export const PromoCountdownBanner = () => {
  const promoStatus = usePromoStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('promo-banner-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('promo-banner-dismissed', 'true');
  };

  if (!promoStatus.isActive || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
      >
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3 relative">
            <Zap className="w-5 h-5 animate-pulse" />
            <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
              <Clock className="w-4 h-4" />
              <span>
                Launch pricing ending soon. Save up to 40% on annual plans
                {promoStatus.daysRemaining > 0 
                  ? ` — ${promoStatus.daysRemaining} days remaining`
                  : ` — ${promoStatus.hoursRemaining} hours remaining`
                }
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
