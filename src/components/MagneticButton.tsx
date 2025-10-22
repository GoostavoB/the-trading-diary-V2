import { useRef, useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export const MagneticButton = ({ 
  children, 
  onClick, 
  variant = 'default',
  className = '',
  size = 'default'
}: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { stiffness: 240, damping: 22 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      
      const pullRadius = 6;
      
      if (distance < rect.width / 2 + pullRadius) {
        const strength = 1 - distance / (rect.width / 2 + pullRadius);
        x.set(distanceX * strength * 0.3);
        y.set(distanceY * strength * 0.3);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [x, y]);

  return (
    <motion.div style={{ x, y }}>
      <Button
        ref={buttonRef}
        onClick={onClick}
        variant={variant}
        size={size}
        className={`magnetic-button relative overflow-hidden ${className}`}
      >
        {/* Cursor halo effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 0%, transparent 60%)',
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  );
};
