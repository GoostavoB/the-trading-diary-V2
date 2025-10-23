import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { AnimatedMetric } from "./AnimatedMetric";

interface WideOutcomeCardProps {
  headline: string;
  subhead: string;
  proofPoint: string;
  metric: string;
  metricValue: number;
}

export const WideOutcomeCard = ({
  headline,
  subhead,
  proofPoint,
  metric,
  metricValue,
}: WideOutcomeCardProps) => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  const suffix = metric.includes("%") ? "%" : metric.includes("x") ? "x" : "";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45 }}
      className="outcome-card-refined relative overflow-hidden rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10"
    >
      <div className="max-w-2xl">
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {headline}
        </h3>
        <p className="text-sm md:text-base text-foreground/70 leading-relaxed mb-4">
          {subhead}
        </p>
        <p className="text-sm text-primary tracking-wide">
          {proofPoint}
        </p>
      </div>

      <div className="shrink-0">
        <AnimatedMetric
          value={metricValue}
          suffix={suffix}
          decimals={metricValue % 1 !== 0 ? 1 : 0}
          inView={inView}
        />
      </div>
    </motion.div>
  );
};
