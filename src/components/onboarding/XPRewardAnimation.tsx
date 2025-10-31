import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface XPRewardAnimationProps {
  xpAmount: number;
  message: string;
  isVisible: boolean;
  onComplete: () => void;
  type?: 'normal' | 'milestone' | 'unlock';
}

export function XPRewardAnimation({ 
  xpAmount, 
  message, 
  isVisible, 
  onComplete,
  type = 'normal'
}: XPRewardAnimationProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger confetti based on type
      const confettiConfig = {
        particleCount: type === 'unlock' ? 150 : type === 'milestone' ? 100 : 50,
        spread: type === 'unlock' ? 100 : 70,
        origin: { y: 0.6 },
        colors: type === 'unlock' 
          ? ['#FFD700', '#FFA500', '#FF6B35'] 
          : ['#10b981', '#3b82f6', '#8b5cf6']
      };
      
      confetti(confettiConfig);

      // Show details after initial animation
      setTimeout(() => setShowDetails(true), 500);

      // Auto-close after delay
      const timer = setTimeout(() => {
        onComplete();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, type, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'unlock':
        return <Trophy className="w-12 h-12 text-yellow-500" />;
      case 'milestone':
        return <Zap className="w-12 h-12 text-orange-500" />;
      default:
        return <Sparkles className="w-12 h-12 text-primary" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative max-w-md mx-4"
          >
            {/* Main card */}
            <div className="bg-card border-2 border-primary/50 rounded-2xl p-8 shadow-2xl text-center space-y-4">
              {/* Icon with glow */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative"
              >
                {getIcon()}
                
                {/* Glow effect */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
                />
              </motion.div>

              {/* XP Amount */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  +{xpAmount} XP
                </div>
                
                {/* Earned badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold"
                >
                  XP Earned!
                </motion.div>
              </motion.div>

              {/* Message */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-lg font-semibold">
                      {message}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Keep going to unlock more insights and tools.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tap to continue hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-xs text-muted-foreground pt-4"
              >
                Tap anywhere to continue
              </motion.p>
            </div>

            {/* Particles floating around */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: Math.cos(i * 60 * Math.PI / 180) * 100,
                  y: Math.sin(i * 60 * Math.PI / 180) * 100,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary/60 rounded-full blur-sm"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
