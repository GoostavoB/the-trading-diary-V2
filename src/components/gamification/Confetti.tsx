import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
}

export const Confetti = ({ active, duration = 3000, particleCount = 50 }: ConfettiProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; rotation: number }>>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#8B5CF6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration, particleCount]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: '-10px'
          }}
          initial={{ 
            y: -20, 
            opacity: 1,
            rotate: 0,
            scale: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            opacity: [1, 1, 0],
            rotate: particle.rotation * 3,
            x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100],
            scale: [1, 1.2, 0.8]
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
