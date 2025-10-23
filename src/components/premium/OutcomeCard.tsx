import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCursorProximity } from '@/hooks/useCursorProximity';
import { useRef, useState, ReactNode } from 'react';
import { AnimatedMetric } from './AnimatedMetric';

interface OutcomeCardProps {
  headline: string;
  subhead: string;
  metric: string;
  metricValue?: number;
  proofPoint: string;
  visual: ReactNode;
  index: number;
}

export const OutcomeCard = ({
  headline,
  subhead,
  metric,
  metricValue,
  proofPoint,
  visual,
  index,
}: OutcomeCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const cursorPos = useCursorProximity(cardRef, 120);

  const isEven = index % 2 === 0;
  const angle = isEven ? 4 : -4;
  const parallaxDepth = (index % 3) * 20;

  const setRefs = (element: HTMLDivElement) => {
    cardRef.current = element;
    inViewRef(element);
  };

  return (
    <motion.div
      ref={setRefs}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.12 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <motion.div
        style={{
          rotateY: isHovered ? (cursorPos.x > 0.5 ? 1 : -1) : 0,
          rotateX: isHovered ? (cursorPos.y > 0.5 ? -1 : 1) : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative"
      >
        {cursorPos.isNear && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `radial-gradient(circle at ${cursorPos.x * 100}% ${cursorPos.y * 100}%, rgba(59,130,246,0.06) 0%, transparent 60%)`,
            }}
          />
        )}

        <div className="outcome-card-refined relative overflow-hidden rounded-2xl p-8 h-[380px] flex flex-col justify-between">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: index * 0.12 + 0.15 }}
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/60 font-medium"
            >
              Solution {index + 1}
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.12 + 0.2 }}
              className="text-3xl md:text-4xl font-bold text-foreground leading-[1.15] tracking-tight"
            >
              {headline}
            </motion.h3>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: index * 0.12 + 0.3 }}
              className="text-sm text-foreground/60 leading-relaxed"
            >
              {subhead}
            </motion.p>
          </div>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.12 + 0.4 }}
              className="space-y-1"
            >
              <AnimatedMetric
                value={metricValue || 0}
                suffix={metric.includes('%') ? '%' : metric.includes('x') ? 'x' : ''}
                decimals={metricValue && metricValue % 1 !== 0 ? 1 : 0}
                inView={inView}
              />
              <p className="text-[10px] text-muted-foreground/40 dark:text-muted-foreground/50 uppercase tracking-wider">
                {metric}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: index * 0.12 + 0.5 }}
              className="text-[10px] text-muted-foreground/30 dark:text-muted-foreground/40 leading-relaxed tracking-wide"
            >
              {proofPoint}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
