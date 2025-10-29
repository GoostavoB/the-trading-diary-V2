import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

export const ProblemVisual = () => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div ref={ref} className="relative">
      {/* Before state - Chaotic */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={inView ? { opacity: 0 } : {}}
        transition={{ duration: 0.8, delay: 1 }}
        className="glass-card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-destructive" />
          <span className="text-[14px] font-semibold text-muted-foreground">Without System</span>
        </div>
        
        <div className="space-y-3">
          {[
            { height: 40, label: "Inconsistent journaling" },
            { height: 60, label: "Missed trades" },
            { height: 30, label: "No structure" },
            { height: 70, label: "Emotional decisions" },
            { height: 20, label: "Poor risk management" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div
                className="h-8 bg-destructive/20 rounded origin-left relative overflow-hidden"
                style={{ width: `${item.height}%` }}
              >
                <motion.div
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-destructive/30 to-transparent"
                />
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* After state - Organized */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="glass-card p-6 space-y-4 absolute inset-0"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="text-[14px] font-semibold text-foreground">With Discipline System</span>
        </div>
        
        <div className="space-y-3">
          {[
            { height: 70, label: "Daily routine", percent: "70%" },
            { height: 75, label: "100% tracked", percent: "75%" },
            { height: 85, label: "Disciplined approach", percent: "85%" },
            { height: 90, label: "Emotional control", percent: "90%" },
            { height: 95, label: "Consistent risk rules", percent: "95%" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 1.2 + i * 0.25 }}
              className="relative"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-8 rounded origin-left flex items-center justify-between px-2 bg-gradient-to-r from-blue-500 via-blue-600 to-primary"
                  style={{ 
                    width: `${item.height}%`,
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <span className="text-[11px] text-white font-medium">{item.label}</span>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] text-primary font-semibold">{item.percent}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 2 }}
          className="flex items-center gap-2 text-[13px] text-primary font-semibold pt-2 border-t border-primary/20 mt-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>+23% performance improvement</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
