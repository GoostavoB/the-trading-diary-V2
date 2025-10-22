import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useState } from 'react';

interface SolutionCardProps {
  solution: {
    icon: LucideIcon;
    title: string;
    description: string;
    outcome: string;
  };
  index: number;
}

export const SolutionCard = ({ solution, index }: SolutionCardProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.4, triggerOnce: true });
  const Icon = solution.icon;
  const isEven = index % 2 === 0;
  const [isHovered, setIsHovered] = useState(false);
  
  // Parallax depth based on index
  const parallaxDepth = (index % 3) + 1;

  return (
    <div ref={ref} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.div
        initial={{ 
          opacity: 0, 
          x: isEven ? -20 : 20,
          y: 10
        }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          x: isVisible ? 0 : (isEven ? -20 : 20),
          y: isVisible ? 0 : 10
        }}
        transition={{ 
          duration: 0.28,
          delay: 0.09 * (index % 3),
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          transformStyle: 'preserve-3d',
          transform: isVisible ? `translateZ(${parallaxDepth * 2}px)` : undefined
        }}
      >
        <GlassCard className="p-8 h-full">
          <div className="flex items-start gap-6">
            <motion.div 
              className="flex-shrink-0"
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.18 }}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center metallic-edge">
                <Icon className="w-8 h-8 text-accent" />
              </div>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                {solution.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-[64ch]">
                {solution.description}
              </p>
              
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0.7,
                  height: 'auto'
                }}
                transition={{ duration: 0.12 }}
                className="pt-4 border-t border-white/[0.08]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xs text-accent">→</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                    {solution.outcome}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
