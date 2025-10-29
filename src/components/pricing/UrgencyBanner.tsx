import { Clock, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { posthog } from "@/lib/posthog";

const UrgencyBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Fixed end date: November 1, 2025 at 23:59:59
  const PROMO_END_DATE = new Date('2025-11-01T23:59:59').getTime();

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('urgency-banner-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = PROMO_END_DATE - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('urgency-banner-dismissed', 'true');
    posthog.capture('urgency_banner_dismissed', {
      days_remaining: timeLeft.days,
      hours_remaining: timeLeft.hours,
    });
  };

  if (dismissed || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) return null;

  const formatCountdown = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    }
    return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-4 rounded-xl bg-gradient-to-r from-orange-600/20 via-red-600/20 to-orange-600/20 border-2 border-orange-500/40 relative overflow-hidden shadow-lg"
      >
        {/* Animated background pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-orange-500/30 transition-colors z-10"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4 text-orange-400" />
        </button>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-3 text-center pr-8">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Zap className="w-6 h-6 text-orange-400 fill-orange-400" />
            </motion.div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm md:text-base font-bold">
              <span className="text-orange-400">Early Access Ends November 1</span>
              <span className="text-foreground mx-2">•</span>
              <span className="text-green-400">Save up to $60/year with annual billing</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm mt-1">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="font-mono font-bold text-orange-400 text-base md:text-lg tabular-nums">
                {formatCountdown()}
              </span>
              <span className="text-muted-foreground">left at launch pricing</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UrgencyBanner;
