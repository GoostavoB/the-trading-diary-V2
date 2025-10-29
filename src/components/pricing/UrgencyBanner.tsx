import { AlertCircle, Flame, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePromoStatus } from "@/hooks/usePromoStatus";
import { useState, useEffect } from "react";
import { posthog } from "@/lib/posthog";

const UrgencyBanner = () => {
  const promoStatus = usePromoStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('urgency-banner-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('urgency-banner-dismissed', 'true');
    posthog.capture('urgency_banner_dismissed', {
      days_remaining: promoStatus.daysRemaining,
      hours_remaining: promoStatus.hoursRemaining,
    });
  };

  if (dismissed || promoStatus.isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 relative"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-amber-500/20 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4 text-amber-500" />
        </button>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center pr-8">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          </div>
          
          <div>
            <p className="text-sm md:text-base font-semibold">
              <span className="text-amber-500">🔥 Launch offer ending soon</span> — up to 40% off early access pricing
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Prices will increase by 20% after this offer.
              {promoStatus.daysRemaining > 0 && (
                <span className="font-semibold text-amber-600 dark:text-amber-400 ml-2">
                  {promoStatus.daysRemaining} {promoStatus.daysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
              )}
              {promoStatus.daysRemaining === 0 && promoStatus.hoursRemaining > 0 && (
                <span className="font-semibold text-amber-600 dark:text-amber-400 ml-2">
                  {promoStatus.hoursRemaining} {promoStatus.hoursRemaining === 1 ? 'hour' : 'hours'} remaining
                </span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UrgencyBanner;
