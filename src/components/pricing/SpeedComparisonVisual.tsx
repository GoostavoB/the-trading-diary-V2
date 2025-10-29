import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Clock, Zap, Upload, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export const SpeedComparisonVisual = () => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [manualTimer, setManualTimer] = useState(0);
  const [aiTimer, setAiTimer] = useState(0);

  // Manual entry timer (counts to 20 minutes = 1200 seconds, but we'll show in accelerated time)
  useEffect(() => {
    if (!inView) return;
    
    const interval = setInterval(() => {
      setManualTimer((prev) => {
        if (prev >= 1200) return 1200;
        return prev + 60; // Jump by 60 seconds for demo
      });
    }, 150);

    return () => clearInterval(interval);
  }, [inView]);

  // AI timer (counts to 30 seconds)
  useEffect(() => {
    if (!inView) return;
    
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setAiTimer((prev) => {
          if (prev >= 30) return 30;
          return prev + 1;
        });
      }, 50);

      return () => clearInterval(interval);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [inView]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tradeFields = [
    { label: "Pair", value: "BTC/USDT" },
    { label: "Entry", value: "$43,250" },
    { label: "Exit", value: "$44,100" },
    { label: "Size", value: "0.5 BTC" },
    { label: "Stop Loss", value: "$42,800" },
  ];

  return (
    <div ref={ref} className="space-y-6">
      {/* Side-by-side comparison on larger screens */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Manual Entry - Tedious */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-[14px] font-semibold text-muted-foreground">Manual Entry</span>
          </div>
          
          <p className="text-[13px] text-muted-foreground/70 mb-4">
            Typing every field by hand. Most traders skip it entirely.
          </p>
          
          {/* Animated form fields */}
          <div className="space-y-3 mb-4">
            {tradeFields.map((field, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={inView ? { opacity: 1, x: 0, height: "auto" } : {}}
                transition={{ duration: 0.4, delay: i * 0.3 }}
                className="space-y-1"
              >
                <label className="text-[11px] text-muted-foreground/60">{field.label}</label>
                <div className="h-9 bg-muted/20 rounded-md flex items-center px-3 border border-muted/30">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.3, delay: i * 0.3 + 0.2 }}
                    className="text-[12px] text-muted-foreground/80"
                  >
                    {field.value}
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.3 }}
                    className="ml-auto text-muted-foreground/40"
                  >
                    |
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="mb-4"
          >
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mb-1">
              <span>Trade 1 of 10</span>
              <span>{Math.min(Math.round((manualTimer / 1200) * 100), 100)}%</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${Math.min((manualTimer / 1200) * 100, 100)}%` } : {}}
                transition={{ duration: 0.3 }}
                className="h-full bg-destructive/60 rounded-full"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 2 }}
            className="pt-4 border-t border-muted/20"
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-destructive" />
              <p className="text-[16px] font-mono font-bold text-destructive">
                {formatTime(manualTimer)}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground/70 text-center mt-1">
              Tedious. Time-consuming. Often skipped.
            </p>
          </motion.div>
        </div>

        {/* AI Upload - Instant Magic */}
        <div className="glass-card p-6 border-2 border-primary relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-[14px] font-semibold text-primary">AI Upload System</span>
          </div>
          
          <p className="text-[13px] text-primary/90 mb-4">
            Upload a screenshot or CSV from any exchange. Our AI recognizes trades instantly.
          </p>
          
          {/* Upload Area */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="relative mb-4"
          >
            <div className="h-32 bg-primary/10 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
              {/* File icon animation */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 2.4 }}
              >
                <FileText className="w-10 h-10 text-primary/60 mb-2" />
              </motion.div>
              
              {/* Scanning effect */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={inView ? { scaleX: 1, opacity: [0, 1, 0] } : {}}
                transition={{ duration: 0.8, delay: 2.6, times: [0, 0.5, 1] }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              />
              
              {/* AI processing indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 2.5 }}
                className="text-[11px] text-primary/70 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                AI Processing...
              </motion.div>
            </div>
          </motion.div>

          {/* Instant Results */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 2.8 }}
            className="space-y-2 mb-4"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 2.8 + i * 0.1 }}
                className="flex items-center gap-2 h-8 bg-primary/10 rounded-md px-3"
              >
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-primary/80">Trade #{i} detected</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 3.2 }}
            className="pt-4 border-t border-primary/20"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-[16px] font-mono font-bold text-primary">
                00:{aiTimer.toString().padStart(2, '0')}
              </p>
            </div>
            <p className="text-[11px] text-primary/70 text-center mt-1">
              10 trades processed instantly
            </p>
          </motion.div>
        </div>
      </div>

      {/* Comparison Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 3.4 }}
        className="glass-card p-6 text-center"
      >
        <p className="text-[24px] md:text-[32px] font-bold text-primary mb-2">40x faster</p>
        <p className="text-[14px] text-muted-foreground mb-1">Save 19.5 minutes per session</p>
        <p className="text-[12px] text-muted-foreground/70">That's over 10 hours per month</p>
      </motion.div>
    </div>
  );
};
