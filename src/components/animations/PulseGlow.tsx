import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PulseGlowProps {
  children: ReactNode;
  type: 'win' | 'loss' | 'neutral';
  enabled?: boolean;
  className?: string;
}

export const PulseGlow = ({ children, type, enabled = true, className = '' }: PulseGlowProps) => {
  if (!enabled) {
    return <>{children}</>;
  }

  const glowColors = {
    win: 'rgba(34, 197, 94, 0.3)', // green-500
    loss: 'rgba(156, 163, 175, 0.2)', // gray-400
    neutral: 'rgba(139, 92, 246, 0.2)', // primary
  };

  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 0 ${glowColors[type]}`,
          `0 0 20px ${glowColors[type]}`,
          `0 0 0 ${glowColors[type]}`,
        ],
      }}
      transition={{
        duration: type === 'win' ? 0.6 : 1.0,
        repeat: type === 'win' ? 2 : 1,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};
